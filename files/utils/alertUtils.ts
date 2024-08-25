import {AllInventoryObjects, InventoryObject, ObjectTier} from "../inventory";
import {GetRandomIntI, GetRandomItem, IconType, Shuffle} from "./utils";
import {Broadcast} from "../bot";
import {PlaySound, PlayTextToSpeech} from "./audioUtils";
import {Client} from "tmi.js";
import {AddToActionQueue} from "../actionqueue";
import {GiveExp, GivePlayerObject, GivePlayerRandomObject, LoadPlayer} from "./playerGameUtils";
import {MessageDelegate} from "../globals";
import {LoadRandomPlayerSession} from "./playerSessionUtils";
import {AudioType} from "../streamSettings";
import {GetMinutesSinceLastMessage} from "./messageUtils";
import fs from "fs";

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

        setTimeout(() => {
            PlaySound("drumroll", AudioType.GameAlerts);
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
                    let expToGet = GetRandomIntI(player.CurrentExpNeeded * 0.1, player.CurrentExpNeeded * 0.3);

                    text += `won the jackpot! They get ${expToGet} EXP!`;

                    setTimeout(() => {
                        PlaySound("cheering", AudioType.GameAlerts);
                    }, 2000);

                    setTimeout(async () => {
                        GivePlayerObject(client, username, objWon.ObjectName);

                        await GiveExp(client, username, expToGet);
                    }, 4000);
                    break;
                case WinType.Normal:
                    text += `won ${objWon.ContextualName}`;

                    setTimeout(() => {
                        PlaySound("cheering", AudioType.GameAlerts);
                    }, 2000);

                    setTimeout(() => {
                        GivePlayerObject(client, username, objWon.ObjectName)
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

    //Guess a number between 1 to 10, first person to get the number gets 15 exp and an item, second person gets 15exp, third person gets 5exp
    //Do a math problem

    let text = `Chat, you've been issued a challenge by ${username}. `;
    let challenges: Array<{
        challenge: () => void;
        valid: () => boolean;
    }> = [
        {
            challenge:  () => {
                //Guess a number challenge.
                const vals = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', `ten`];
                let numberToGuess = GetRandomIntI(1, 10);
                let numberToGuessAsString = vals[numberToGuess];
                text += "Guess a number between one and ten and type it into chat. First person to guess gets a prize. You have 30 seconds.";

                AddToActionQueue(() => {
                    let s = "";
                    if(username[username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    PlayTextToSpeech(text, AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == numberToGuess.toString() || message.toLowerCase() == numberToGuessAsString) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} has guessed the correct number of ${numberToGuess}!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct number of ${numberToGuess}!`);
                            GivePlayerRandomObject(client, responseName);
                            GiveExp(client, responseName, 5);
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
                            PlayTextToSpeech(`Challenge over. Nobody got the number in time! It was ${numberToGuess}.`, AudioType.GameAlerts);
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

                    PlayTextToSpeech(textButForSpeech, AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == result.toString()) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} has gotten the correct number of ${result}!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has gotten the correct number of ${result}!`);
                            GivePlayerRandomObject(client, responseName);
                            GiveExp(client, responseName, 5);
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
                            PlayTextToSpeech(`Challenge over. Nobody got the number in time! It was ${result}.`, AudioType.GameAlerts);
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
                `scramble`, `twitch`, `fallout`, `nuclear`, `subscription`, `control`, `maddening`, `minigame`, `stickman`, `delay`, `gems`];

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
                    PlayTextToSpeech(text, AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    function PlayerResponse(responseName: string, message: string) {
                        if(message.toLowerCase() == randomWord) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} has guessed the correct word of ${randomWord}!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct word of ${randomWord}!`);
                            GivePlayerRandomObject(client, responseName);
                            GiveExp(client, responseName, 5);
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
                            PlayTextToSpeech(`Challenge over. Nobody got the word in time! It was ${randomWord}.`, AudioType.GameAlerts);
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
                    PlayTextToSpeech(text, AudioType.GameAlerts);
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${username}${s} Challenge`, message: text, icon: (IconType.Pencil) }));
                    client.say(process.env.CHANNEL!, text);

                    MessageDelegate.push(PlayerResponse);

                    let someoneGotIt = false;

                    function PlayerResponse(responseName: string, message: string) {
                        if(user.toLowerCase().includes(message.replace("@", "").toLowerCase().trim())) {
                            let index = MessageDelegate.indexOf(PlayerResponse);
                            if(index != -1) {
                                MessageDelegate.splice(index, 1);
                            }

                            PlayTextToSpeech(`${responseName} has guessed the correct user of ${user}!`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `@${responseName} has guessed the correct user of @${user}!`);
                            GivePlayerRandomObject(client, responseName);
                            GiveExp(client, responseName, 5);
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
                            PlayTextToSpeech(`Challenge over. Nobody got the user in time! It was ${user}.`, AudioType.GameAlerts);
                            client.say(process.env.CHANNEL!, `Challenge over. Nobody got the user in time! It was @${user}.`);
                        }

                    }, 1000 * 70);

                }, 80)
            },
            valid: () => LoadRandomPlayerSession(["the7ark"], false, true).NameAsDisplayed.toLowerCase() != "the7ark"
        },
    ];

    let randomChallenge = GetRandomItem(challenges.filter(x => x.valid()))!;

    randomChallenge.challenge();

}
