import {AllInventoryObjects, InventoryObject, ObjectRetrievalType, ObjectTier} from "../inventoryDefinitions";
import {GetRandomInt, GetRandomIntI, GetRandomItem, Shuffle} from "./utils";
import {Broadcast} from "../bot";
import {PlaySound, PlayTextToSpeech} from "./audioUtils";
import {Client} from "tmi.js";
import {AddToActionQueue} from "../actionqueue";
import {
    GiveExp,
    GivePlayerObject,
    GivePlayerRandomObject,
    GivePlayerRandomObjectInTier,
    LoadPlayer
} from "./playerGameUtils";
import {MessageDelegate} from "../globals";
import {LoadRandomPlayerSession} from "./playerSessionUtils";
import {AudioType} from "../streamSettings";
import {GetMinutesSinceLastMessage} from "./messageUtils";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {IconType} from "../valueDefinitions";
import {
    DoesSceneContainItem,
    GetObsSourcePosition,
    GetOpenScene,
    SetObsSourcePosition,
    SetSceneItemEnabled
} from "./obsutils";

export function CreateAndBuildGambleAlert(client: Client, username: string, tier: ObjectTier) {
    const SLOT_LENGTH = 8;
    AddToActionQueue(() => {
        enum WinType { None, Normal, Jackpot}
        let relevantInventoryObjects = AllInventoryObjects.filter(x => x.Tier <= tier);

        let finalWinState: WinType = GetRandomItem([WinType.None, WinType.None, WinType.Normal, WinType.Normal, WinType.Normal, WinType.Jackpot])!;

        // console.log(`Gamble win state: ${finalWinState}`);

        function GetRandomItemWithRarity() {
            let options = [];
            for (let i = 0; i < relevantInventoryObjects.length; i++) {
                for (let j = 0; j < relevantInventoryObjects[i].Rarity; j++) {
                    if(tier == relevantInventoryObjects[i].Tier) {
                        for (let k = 0; k < 10; k++) {
                            options.push(relevantInventoryObjects[i]);
                        }
                    }

                    options.push(relevantInventoryObjects[i]);
                }
            }

            return GetRandomItem(options);
        }

        let slot1 = BuildSlot(finalWinState == WinType.None);
        let slot2 = BuildSlot(finalWinState == WinType.None);
        let slot3 = BuildSlot(finalWinState == WinType.None);
        let slots = [slot1, slot2, slot3];
        switch (finalWinState) {
            case WinType.Normal:
                let randomObj = GetRandomItemWithRarity()!;
                let randomSlot = GetRandomItem(slots)!;

                randomSlot.push(randomObj);
                slots.splice(slots.indexOf(randomSlot), 1);
                randomSlot = GetRandomItem(slots)!;

                randomSlot.push(randomObj);
                slots.splice(slots.indexOf(randomSlot), 1);

                relevantInventoryObjects.splice(relevantInventoryObjects.indexOf(randomObj), 1);
                slots[0].push(GetRandomItem(relevantInventoryObjects)!);
                break;
            case WinType.Jackpot:
                let randObj = GetRandomItemWithRarity()!;
                slot1.push(randObj);
                slot2.push(randObj);
                slot3.push(randObj);
                break;
        }
        let slotResults = [slot1[slot1.length - 1], slot2[slot2.length - 1], slot3[slot3.length - 1]];
        // console.log(`Slots: ${slotResults[0].ObjectName} - ${slotResults[1].ObjectName} - ${slotResults[2].ObjectName}`);
        // console.log("slot 1 " + slot1.length);
        // for (let i = 0; i < slot1.length; i++) {
        //     console.log(slot1[i].ObjectName);
        // }
        // console.log("slot 2 " + slot2.length);
        // for (let i = 0; i < slot2.length; i++) {
        //     console.log(slot2[i].ObjectName);
        // }
        // console.log("slot 3 " + slot3.length);
        // for (let i = 0; i < slot3.length; i++) {
        //     console.log(slot3[i].ObjectName);
        // }

        PlayTextToSpeech(`${username} is gambling! Let's see what they get!`, AudioType.GameAlerts);
        let s = "";
        if(username[username.length - 1] === 's') {
            s = "'";
        }
        else {
            s = "'s";
        }
        Broadcast(JSON.stringify({ type: 'gamble', title: username + s +" Gamble", slot1: slot1.map(x => x.IconRep), slot2: slot2.map(x => x.IconRep), slot3: slot3.map(x => x.IconRep) }));

        setTimeout(async () => {
            PlaySound("drumroll", AudioType.GameAlerts);

            await SetLightColor(1, 1, 1);
            await SetLightBrightness(1);

            setTimeout(async () => {
                await SetLightBrightness(0);
            }, 1000);
            setTimeout(async () => {
                await SetLightBrightness(1);
            }, 3000);
            setTimeout(async () => {
                await FadeOutLights();
            }, 6000);
        }, 3000);

        setTimeout(() => {

            let win = WinType.None;
            let objWon: InventoryObject;

            for (let i = 0; i < AllInventoryObjects.length; i++) {
                let invObj = AllInventoryObjects[i];

                let filtered = slotResults.filter(x => x.ObjectName == invObj.ObjectName);
                if(filtered.length == 3) {
                    //JACKPOT
                    win = WinType.Jackpot;
                    objWon = invObj;
                    break;
                }
                else if(filtered.length == 2) {
                    //Normal win
                    win = WinType.Normal;
                    objWon = invObj;
                    break;
                }
            }

            let text = `${username} `;
            switch (win) {
                case WinType.Jackpot:
                    let player = LoadPlayer(username);
                    let expToGet = Math.max(30, GetRandomIntI(player.CurrentExpNeeded * 0.1, player.CurrentExpNeeded * 0.3));

                    text += `won the jackpot! They get ${expToGet} EXP!`;

                    setTimeout(() => {
                        PlaySound("cheering", AudioType.GameAlerts);
                    }, 2000);

                    setTimeout(async () => {
                        await GivePlayerObject(client, username, objWon.ObjectName);

                        await GiveExp(client, username, expToGet);
                        await client.say(process.env.CHANNEL!, `@${username} has gotten ${expToGet} EXP from the jackpot!`);
                    }, 4000);
                    break;
                case WinType.Normal:
                    text += `won ${objWon.ContextualName}`;

                    setTimeout(() => {
                        PlaySound("cheering", AudioType.GameAlerts);
                    }, 2000);

                    setTimeout(async () => {
                        await GivePlayerObject(client, username, objWon.ObjectName)
                    }, 4000);
                    break;
                case WinType.None:
                    text += "won nothing";

                    setTimeout(() => {
                        PlaySound("booing", AudioType.GameAlerts);
                    }, 2000);
                    break;

            }

            PlayTextToSpeech(text, AudioType.GameAlerts);


        }, 4000 + SLOT_LENGTH * 500);

        function BuildSlot(doFull: boolean): Array<InventoryObject> {
            let listOfOptions = [];
            for (let i = 0; i < relevantInventoryObjects.length; i++) {
                for (let j = 0; j < relevantInventoryObjects[i].Rarity; j++) {
                    listOfOptions.push(relevantInventoryObjects[i]);
                }
            }
            listOfOptions = Shuffle(listOfOptions);
            // listOfOptions = listOfOptions.concat(Shuffle(relevantInventoryObjects))

            let slotList: Array<InventoryObject> = [];
            let length = SLOT_LENGTH;
            if(!doFull) {
                length--;
            }
            for (let i = 0; i < length; i++) {
                slotList.push(listOfOptions[i]);
            }

            return slotList;
        }
    }, 10 + SLOT_LENGTH)
}

export function TryToStartRandomChatChallenge(client: Client) {
    if(GetMinutesSinceLastMessage() > 15) {
        return;
    }

    StartChatChallenge(client, "Cory");
}

export function StartChatChallenge(client: Client, username: string) {

    let text = `Chat, you've been issued a challenge by ${username}. `;
    let challenges: Array<{
        challenge: () => void;
        valid: () => boolean;
    }> = [
        {
            challenge:  () => {
                //Guess a number challenge.
                let min = GetRandomIntI(1, 5);
                let max = GetRandomIntI(8, 15);
                let numberToGuess = GetRandomIntI(min, max);
                text += `Guess a number between ${min} and ${max} and type it into chat. First person to guess correctly gets a prize. You have 30 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == numberToGuess.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct number of ${numberToGuess}!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the number in time! It was ${numberToGuess}.`);
                        }

                    }, 1000 * 35);

                }, 40)
            },
            valid: () => true
        },
        {
            challenge:  () => {
                //Do a math problem
                let numberOne = GetRandomIntI(2, 10);
                let numberTwo = GetRandomIntI(2, 10);
                let numberThree = GetRandomIntI(2, 10);

                let operators = ["+", "-", "*"];
                let operatorOne = GetRandomItem(operators)!;
                if(operatorOne == "+" || operatorOne == "-") {
                    operators = ["*"];
                }
                let operatorTwo = GetRandomItem(operators)!;

                let constructedMath = `${numberOne} ${operatorOne} ${numberTwo} ${operatorTwo} ${numberThree}`;

                let result = eval(constructedMath);

                text += `Chat, do this math: ${constructedMath}. First person to get the answer wins. You have 30 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }

                    let textButForSpeech = text.replace("+", "plus").replace("-", "minus").replace("*", "multiplied by");

                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == result.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has gotten the correct number of ${result}!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the number in time! It was ${result}.`);
                        }

                    }, 1000 * 40);

                }, 40)
            },
            valid: () => true
        },
        {
            challenge: () => {
                //Word scramble
                const words = ['water', 'duck', 'hunt', `secret`, `example`, `dragon`, `bytefire`, `lethal`, `company`, `scrap`, `skyrim`, `dungeon`, `programming`, `coding`, `gamer`, `function`, `loaf`,
                `scramble`, `twitch`, `fallout`, `nuclear`, `subscription`, `control`, `maddening`, `minigame`, `stickman`, `delay`, `gems`,
                `portcullis`, `taxi`, `bank`, `chatopia`, `blood`, `timmy`, `gazicmalzen`];

                let randomWord = GetRandomItem(words)!;
                let scrambledWord = randomWord.split('').sort(function(){return 0.5-Math.random()}).join('')

                text += `Chat, unscramble this word. The word is "${scrambledWord}" You have 30 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == randomWord) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct word of ${randomWord}!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the word in time! It was ${randomWord}.`);
                        }

                    }, 1000 * 40);

                }, 45)
            },
            valid: () => true
        },
        {
            challenge: () => {
                //Memory test

                let randomPlayerSession = LoadRandomPlayerSession(["the7ark"], false, true);

                let user = randomPlayerSession.NameAsDisplayed;
                let randomMessage = GetRandomItem(randomPlayerSession.Messages);

                text += `Chat, guess who said this earlier in the stream. This user said "${randomMessage}". Say their username in chat. You have 60 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        let userMessage = message.replace("@", "").toLowerCase().trim();
                        if(userMessage.length >= 4 && user.toLowerCase().includes(userMessage)) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            await client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct user of @${user}!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the user in time! It was @${user}.`);
                        }

                    }, 1000 * 70);

                }, 80)
            },
            valid: () => LoadRandomPlayerSession(["the7ark"], false, true).NameAsDisplayed.toLowerCase() != "the7ark"
        },
        {
            challenge:  () => {
                //Alphabet challenge
                let alphabet = 'abcdefghijklmnopqrstuvwxyz';

                //-1 so we never pick Z as that gets confusing to what follows;
                let randomLetterIndex = GetRandomInt(0, alphabet.length - 1);
                let randomLetter = alphabet[randomLetterIndex];
                let randomLetterAnswer = alphabet[randomLetterIndex + 1];

                text += `Chat, what letter in the alphabet comes after: "${randomLetter}". First person to get the answer wins. You have 30 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }

                    let textButForSpeech = text.replace("+", "plus").replace("-", "minus").replace("*", "multiplied by");

                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == randomLetterAnswer.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            await client.say(process.env.CHANNEL!, `@${responseName} has gotten the correct letter of "${randomLetterAnswer}"!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the letter in time! It was ${randomLetterAnswer}.`);
                        }

                    }, 1000 * 40);

                }, 40)
            },
            valid: () => true
        },
        {
            challenge:  () => {
                //Advanced guess number
                let randomNumber = GetRandomIntI(1, 100);

                text += `Chat, guess a random number between 1 and 100 and I will tell you if you're too low or too high. First person to guess correctly wins. You have 30 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }

                    let textButForSpeech = text.replace("+", "plus").replace("-", "minus").replace("*", "multiplied by");

                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == randomNumber.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            await client.say(process.env.CHANNEL!, `@${responseName} has gotten the correct number of ${randomNumber}!`);
                            await GivePlayerRandomObject(client, responseName, ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 35);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                        else {
                            let toNumber = parseInt(message.toLowerCase());
                            if(toNumber !== NaN) {
                                if(toNumber < randomNumber) {
                                    await client.say(process.env.CHANNEL!, `@${responseName}, that guess is too LOW!`);
                                }
                                else {
                                    await client.say(process.env.CHANNEL!, `@${responseName}, that guess is too HIGH!`);
                                }
                            }
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the number in time! It was ${randomNumber}.`);
                        }

                    }, 1000 * 40);

                }, 40)
            },
            valid: () => true
        },
        {
            challenge:  () => {
                let answer: number = 0;
                let sequenceDisplay = ``;
                let safety = 0;
                let sequenceSpecialState = 0;
                let additionSubtraction = 0;
                let multiplication = 0;
                let power = 0;
                let startingNumber = 0;
                let increaseAmount = 0;
                let sequenceLength = 5;

                function GetSequence(num: number) {
                    return (Math.pow(num, power) * multiplication) + additionSubtraction;
                }

                while (true) {
                    //Sequence guessing
                    sequenceSpecialState = GetRandomIntI(1, 4);
                    additionSubtraction = GetRandomIntI(1, 3) == 1 ? GetRandomIntI(-5, 5) : GetRandomIntI(1, 2) == 1 ? GetRandomIntI(1, 8) : GetRandomIntI(-8, -1);
                    multiplication = GetRandomIntI(1, 3) == 1 ? GetRandomIntI(1, 5) : GetRandomIntI(2, 5);
                    power = sequenceSpecialState == 3 ? 1 : GetRandomIntI(1, 3) == 1 ? GetRandomIntI(1, 3) : 1; //Likely changes we don't add a power, cause its harder


                    console.log("Power: " + power);
                    console.log("Mult: " + multiplication);
                    console.log("Add/sub: " + additionSubtraction);
                    console.log("Special state: " + sequenceSpecialState);

                    startingNumber = GetRandomIntI(1, 5);
                    increaseAmount = GetRandomIntI(1, 3);


                    let sequence: Array<number> = [];
                    let currentValue = startingNumber;
                    for (let i = 0; i < sequenceLength; i++) {
                        if(sequenceSpecialState == 1 || i == 0) {
                            sequence.push(GetSequence(currentValue));
                        }
                        else if(sequenceSpecialState == 2) {
                            sequence.push(GetSequence(sequence[i - 1]));
                        }
                        else if(sequenceSpecialState == 3) {
                            let allAdded = 0;
                            for (let j = 0; j < sequence.length; j++) {
                                allAdded += sequence[j];
                            }

                            sequence.push(GetSequence(allAdded));
                        }
                        else if(sequenceSpecialState == 4) {
                            let lastSequence = sequence[i - 1];
                            let lastLastSequence = sequence.length == 1 ? 0 : sequence[i - 2];

                            sequence.push(GetSequence(lastSequence + lastLastSequence));
                        }

                        currentValue += increaseAmount;
                    }

                    answer = sequence[sequence.length - 1];

                    sequenceDisplay = ``;

                    //don't do the last one
                    for (let i = 0; i < sequence.length - 1; i++) {
                        sequenceDisplay += `${sequence[i]}, `;
                    }

                    if(answer <= 1000) {
                        break;
                    }

                    safety++;
                    if(safety >= 100) {
                        break;
                    }
                }

                sequenceDisplay += `_`;

                text += `Chat, guess the next number in this sequence: ${sequenceDisplay}. First person to guess correctly wins an extra good prize. You have 45 seconds.`;

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }

                    let textButForSpeech = text.replace("+", "plus").replace("-", "minus").replace("*", "multiplied by");

                    PlayTextToSpeech("A new chat challenge has begun", AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    let explanation = ``;
                    if(power > 1) {
                        explanation += `Each input number was raised to the power of ${power}`;
                    }
                    if(multiplication > 1) {
                        if(explanation == ''){
                            explanation += `Each input number was multiplied by ${multiplication}`
                        }
                        else {
                            explanation += `, then multiplied by ${multiplication}`
                        }
                    }
                    if(additionSubtraction != 0) {
                        if(explanation == ''){
                            explanation += `Each input number ${additionSubtraction > 0 ? `added ${additionSubtraction}` : `subtracted ${additionSubtraction}`}`
                        }
                        else {
                            explanation += `, and then ${additionSubtraction > 0 ? `added ${additionSubtraction}` : `subtracted ${additionSubtraction}`}`
                        }
                    }
                    if(explanation == '') {
                        explanation += `The numbers weren't modified by any powers, multiplication, addition or subtraction. `;
                    }
                    else {
                        explanation += `. `;
                    }

                    switch (sequenceSpecialState) {
                        case 1:
                            explanation += `The number set was `;
                            let curr = startingNumber;
                            for (let i = 0; i < sequenceLength; i++) {
                                explanation += `${curr}`;
                                if(i != sequenceLength - 1) {
                                    explanation += `, `;
                                }

                                curr += increaseAmount;
                            }
                            break;
                        case 2:
                            explanation += `The first number input was ${startingNumber}, and then every other value in the set was the result from the number right before that number.`
                            break;
                        case 3:
                            explanation += `The first number input was ${startingNumber}, and then every other value in the set was the addition of all previous results.`
                            break;
                        case 4:
                            explanation += `The first number input was ${startingNumber}, and then every other value in the set was the addition of the previous two results.`
                            break;
                    }

                    async function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == answer.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} wins the challenge!`, AudioType.GameAlerts);
                            await client.say(process.env.CHANNEL!, `@${responseName} has gotten the correct number of ${answer}! Explanation: ${explanation}`);
                            await GivePlayerRandomObjectInTier(client, responseName, [ObjectTier.Mid, ObjectTier.High], ObjectRetrievalType.RandomReward);
                            await GiveExp(client, responseName, 50);
                            someoneGotIt = true;

                            setTimeout(() => {
                                PlaySound("cheering", AudioType.GameAlerts);
                            }, 2000);
                        }
                    }

                    setTimeout(() => {
                        let index = MessageDelegate.indexOf(PlayerResponse);
                        if(index != -1) {
                            MessageDelegate.splice(index, 1);
                        }

                        if(!someoneGotIt) {
                            PlayTextToSpeech(`Challenge over.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the number in time! It was ${answer}. Explanation: ${explanation}`);
                        }

                    }, 1000 * 55);

                }, 55)
            },
            valid: () => true
        },
    ];

    setTimeout(async () => {
        await SetLightColor(1, 1, 1);
        await SetLightBrightness(1);

        setTimeout(async () => {
            await FadeOutLights();
        }, 6000);
    }, 2000);

    let randomChallenge = GetRandomItem(challenges.filter(x => x.valid()))!;

    randomChallenge.challenge();

}

export async function PlayHypeTrainAlert() {
    const train = "Train";
    const camera = "Small Camera";

    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, train) || !await DoesSceneContainItem(sceneName, camera)) {
        return;
    }

    PlaySound("train", AudioType.ImportantStreamEffects);

    setTimeout(async () => {
        await SetSceneItemEnabled(train, true);

        let originalPosition = await GetObsSourcePosition(camera);

        setTimeout(async () => {
            await SetObsSourcePosition(camera, originalPosition.x - 200, originalPosition.y);
            setTimeout(async () => {
                await SetObsSourcePosition(camera, originalPosition.x - 400, originalPosition.y);
            }, 100);
            setTimeout(async () => {
                await SetObsSourcePosition(camera, originalPosition.x - 600, originalPosition.y);
            }, 200);

            setTimeout(async () => {
                await SetObsSourcePosition(camera, originalPosition.x, originalPosition.y);
                await SetSceneItemEnabled(train, false);
            }, 13500);
        }, 450);
    }, 1000);

}
