import {ChatUserstate, Client} from "tmi.js";
import {
    calculateExpNeeded, calculateMaxHealth,
    ClassType,
    GivePlayerObject,
    LoadPlayer,
    Player,
    SavePlayer,
    TakeObjectFromPlayer
} from "./playerData";
import {broadcast, isDragonActive, sayAllChat} from "./bot";
import {
    getRandomIntI,
    getRandomItem, GetStringifiedSessionData,
    GiveExp,
    LoadDragonData, LoadPlayerSession, okayVoices, PlayerSessionData,
    playSound,
    playTextToSpeech,
    SaveDragonData, SavePlayerSession,
    setMonitorBrightnessContrastTemporarily,
    setMonitorRotationTemporarily, TriggerDragonAttack, tryToSetVoice
} from "./utils";
import fs from "fs";
import {attackDefinitions, ClassMove, getMove, MoveType} from "./movesDefinitions";
import {allInventoryObjects, DoesPlayerHaveObject, InventoryObject} from "./inventory";
import {setAudioMute} from "./obsutils";

// import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface CooldownInfo {
    gracePeriod: number,
    cooldown: number,
    isOnTimeout: boolean,
    isInGracePeriod: boolean,
    showCooldownMessage: boolean,
}

let cooldowns: Map<string, CooldownInfo> = new Map<string, CooldownInfo>([
    ["battlecry", {
        gracePeriod: 30000, //30 seconds
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["cast confusion", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["shroud", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["inspire", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["silence", {
        gracePeriod: 0,
        cooldown: 600000, //10 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["cast teleport", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["info", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: false,
    }],
]);

let battlecryStarted: boolean = false;

function handleTimeout(command: string) {
    cooldowns.forEach((val, key) => {
        if(isCommand(command, key) && !val.isInGracePeriod) {
            val.isInGracePeriod = true;
            cooldowns.set(key, val);

            setTimeout(() => {
                val.isOnTimeout = true;
                val.isInGracePeriod = false;
                cooldowns.set(key, val);
                setTimeout(() => {
                    val.isOnTimeout = false;
                    cooldowns.set(key, val);

                    if(key == 'battlecry') {
                        battlecryStarted = false;
                    }

                }, val.cooldown);
            }, val.gracePeriod);
        }
    })
}

function cleanMessage(input: string): string {
    // Check if the string is empty
    if (input.length === 0) return input;

    // Regex to match valid characters (letters, numbers, punctuation, symbols)
    const validCharRegex = /[\p{L}\p{N}\p{P}\p{S}]$/u;

    // Get the last character of the string
    const lastChar = input[input.length - 1];

    // Check if the last character is valid
    if (!validCharRegex.test(lastChar)) {
        // If invalid, remove the last character
        return input.slice(0, input.length - 2);
    }

    // Return the original string if the last character is valid
    return input;
}

export async function processCommands(client: Client, userState: ChatUserstate, command: string) {
    command = cleanMessage(command.toLowerCase());
    // console.log(command + " vs " + cleanMessage(command));

    let onTimeout: string = '';
    let showCooldownMsg = false;
    cooldowns.forEach((val, key) => {
        if(val.isOnTimeout && isCommand(command, key)) {
            onTimeout = key;
            showCooldownMsg = val.showCooldownMessage;
        }
    })

    if(onTimeout !== '') {
        if(showCooldownMsg) {
            await client.say(process.env.CHANNEL!, `${onTimeout} is on cooldown!`);
        }
        return;
    }


    if(isCommand(command, 'lurk')) {
        await client.say(process.env.CHANNEL!, `@${userState['display-name']}, have a nice lurk!`);
    }
    else if(isCommand(command, 'cc')) {
        await client.say(process.env.CHANNEL!, `Crowd Control is a way for you (the viewer) to interact with my modded game and cause fun effects to happen, good or bad. 
        You can get 250 free coins (on desktop) every 30 minutes from the overlay on screen, or buy them from my interact link: https://interact.crowdcontrol.live/#/twitch/26580802/coins`);
    }
    else if(isCommand(command, 'discord')) {
        await client.say(process.env.CHANNEL!, `Come hang out on our Discord, to chat, give stream suggestions, and get go live notification. Join here: https://discord.gg/A7R5wFFUWG`);
    }
    else if(isCommand(command, 'mage') || isCommand(command, 'warrior') || isCommand(command, 'rogue')) {
        let player = LoadPlayer(userState['display-name']!);
        // console.log(`Loaded ${player.Username} ${player.Level} ${player.LevelUpsAvailable}`);
        if(player.LevelUpAvailable) {
            let classType: ClassType = ClassType.Mage;
            if(command.includes('warrior')) {
                classType = ClassType.Warrior;

                for (let i = 0; i < player.Classes.length; i++) {
                    if(player.Classes[i].Type == classType) {
                        if(player.Classes[i].Level === 0) {
                            //Free weapons for warriors
                            GivePlayerObject(player.Username, "sword");
                            GivePlayerObject(player.Username, "hammer");
                        }
                        break;
                    }
                }
            }
            else if(command.includes('rogue')) {
                classType = ClassType.Rogue;

                for (let i = 0; i < player.Classes.length; i++) {
                    if(player.Classes[i].Type == classType) {
                        if(player.Classes[i].Level === 0) {
                            //Free dagger for rogues
                            GivePlayerObject(player.Username, "dagger");
                        }
                        break;
                    }
                }
            }
            else {
                for (let i = 0; i < player.Classes.length; i++) {
                    if(player.Classes[i].Type == classType) {
                        if(player.Classes[i].Level === 0) {
                            //Free wand for mages
                            GivePlayerObject(player.Username, "wand");
                        }
                        break;
                    }
                }
            }

            player.CurrentExp -= player.CurrentExpNeeded;
            player.Level++;
            player.CurrentExpNeeded = calculateExpNeeded(player.Level);
            if(player.CurrentExp < player.CurrentExpNeeded) {
                player.LevelUpAvailable = false;
            }

            for (let i = 0; i < player.Classes.length; i++) {
                if(player.Classes[i].Type == classType) {
                    player.Classes[i].Level++;
                }
            }

            let final = getPlayerStatsDisplay(userState['display-name']!, player);

            SavePlayer(player);

            await client.say(process.env.CHANNEL!, final);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you have no level ups available.`);
        }
    }
    else if(isCommand(command, 'stats') || isCommand(command, 'level')) {
        let player = LoadPlayer(userState['display-name']!);

        await client.say(process.env.CHANNEL!, getPlayerStatsDisplay(userState['display-name']!, player));
    }
    else if(isCommand(command, 'moves')) {
        let player = LoadPlayer(userState['display-name']!);
        let text = `@${userState['display-name']!}, you know: `;

        for (let i = 0; i < player.KnownMoves.length; i++) {
            let move = getMove(player.KnownMoves[i]);
            if(isDragonActive || (move !== undefined && move.Type !== MoveType.Attack)) {
                text += `!${player.KnownMoves[i]}`;

                if(i < player.KnownMoves.length - 2) {
                    text += ", ";
                }
                else if(i === player.KnownMoves.length - 2 && player.KnownMoves.length > 1) {
                    text += " and ";
                }
            }
        }

        await client.say(process.env.CHANNEL!, text);
    }
    else if(battlecryStarted && isCommand(command, 'battlecry')) {
        playSound('battlecry');

        doBattleCry(userState['display-name']!);
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && isCommand(command, 'giveallexp')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        let expAmount = parseInt(command.replace('!giveallexp ', ''));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            GiveExp(client, currPlayer.Username, expAmount);
        }
        await client.say(process.env.CHANNEL!, `I've given ${expAmount}EXP to ALL adventurers!`);
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && isCommand(command, 'giveexp')) {
        console.log("giving exp to user");
        let afterText = command.replace('!giveexp ', '').split(' ');
        let user = afterText[0];
        let expAmount = parseInt(afterText[1]);

        console.log(`giving ${expAmount} to ${user}`);

        let playerToGiveExp = LoadPlayer(user);
        if(playerToGiveExp.CurrentExp === 0 && playerToGiveExp.Level === 0) {
            await client.say(process.env.CHANNEL!, `No found user by that name`);
            return;
        }
        else {
            await client.say(process.env.CHANNEL!, `Giving ${expAmount} to @${user}`);
            GiveExp(client, user, expAmount);
        }
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && isCommand(command, 'adventure')) {
        broadcast(JSON.stringify({ type: 'startadventure' }));
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && isCommand(command, 'credits')) {
        playSound("credits");
        broadcast(JSON.stringify({ type: 'showcredits', data: GetStringifiedSessionData() }));
    }
    else if(isCommand(command, 'setvoice')) {
        await tryToSetVoice(client, userState['display-name']!,  command.replace("!setvoice", "").trim());
    }
    else if(isCommand(command, 'yell')) {
        let player = LoadPlayer(userState['display-name']!);

        let textToSay = command.replace("!yell", "");
        if(textToSay.length > 250) {
            textToSay = textToSay.slice(0, 250) + "...";
        }

        playTextToSpeech(textToSay, player.Voice === undefined || player.Voice === "" ? getRandomItem(okayVoices)!.voice : player.Voice);

        setTimeout(() => {
            broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: textToSay, }));
        }, 700);
    }
    else if(isCommand(command, 'inventory')) {
        let player = LoadPlayer(userState['display-name']!);
        if(player.Inventory.length === 0) {
            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you have no items in your inventory`);
        }
        else {
            let final = `@${userState['display-name']!}, you have `;
            for (let i = 0; i < player.Inventory.length; i++) {
                let inventoryObj: InventoryObject = allInventoryObjects.find(x => x.ObjectName === player.Inventory[i]);

                final += inventoryObj.ContextualName;
                if(i < player.Inventory.length - 2 && player.Inventory.length > 2) {
                    final += ", "
                }

                if(i === player.Inventory.length - 2) {
                    final += " and ";
                }
            }

            await client.say(process.env.CHANNEL!, final);
        }
    }
    else if (isCommand(command, 'use')) {
        let player = LoadPlayer(userState['display-name']!);

        let objectUsed = command.replace("!use", "").trim();
        let inventoryObject: InventoryObject = allInventoryObjects.find(x => x.ObjectName === objectUsed)!;
        
        if(inventoryObject === undefined || inventoryObject === null) {
            await client.say(process.env.CHANNEL!, `${player.Username}, you don't have that!`);
        }
        else {
            await inventoryObject.UseAction(client, player);
        }
    }
    else {
        await handleMoves(client, userState, command);
    }
}

async function handleMoves(client: Client, userState: ChatUserstate, command: string) {
    let player = LoadPlayer(userState['display-name']!);

    if(isCommand(command, 'punch') && isDragonActive) {
        doDamage(client, userState['display-name']!, 1);
        client.say(process.env.CHANNEL!, `@${userState['display-name']!} punches Bytefire for 1 damage!`);
        return;
    }

    let any: boolean = false;
    for (let i = 0; i < player.KnownMoves.length; i++) {
        if(command.includes(`!${player.KnownMoves[i]}`)) {
            any = true;
            break;
        }
    }

    let moveAttempted: ClassMove | undefined = attackDefinitions.find(x => isCommand(command, x.Command));

    let isDuck = (userState['display-name']!).toLowerCase() === 'one_1egged_duck';
    let isDucksCommand = (isCommand(command, 'duckhunt') || isCommand(command, ' one1eghaha'));
    if(isDuck && isDucksCommand) {
        moveAttempted = {
            Command: isCommand(command, 'duckhunt') ? 'duckhunt' : ' one1egHaha',
            Description: '',
            ClassRequired: ClassType.Rogue,
            Type: MoveType.Attack,

            ChanceToMiss: 30,
            Damage: { min: 3, max: 10 },
            SuccessText: [`@${userState['display-name']!} whips out duck hunt, and shoots Bytefire for {0} damage!`],
        };
    }

    if(!any) {
        if(moveAttempted !== undefined) {
            let playerRelevantClass = player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!;
            if(playerRelevantClass.Level > 0) {
                if(moveAttempted?.LevelRequirement > 0 && playerRelevantClass.Level < moveAttempted?.LevelRequirement) {
                    client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you don't know that move. You need to be a level ${moveAttempted?.LevelRequirement} ${ClassType[playerRelevantClass.Type]} to learn this move.`);
                }
                else {
                    client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you don't know that move. Redeem 'Learn a Move' to learn new moves.`);
                }
            }
            else {
                client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
            }
        }
        return;
    }

    if(moveAttempted !== undefined) {
        if(player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level > 0) {
            switch (moveAttempted.Type) {
                case MoveType.Attack:
                    handleMoveAttack(client, moveAttempted, player, userState['display-name']!, command);
                    break;
                case MoveType.PlaySound:
                    handleMovePlaySound(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.ChangeMonitorRotation:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        playSound(moveAttempted.SoundFile!);
                    }
                    await handleMoveMonitorRotation(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.DarkenMonitor:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        playSound(moveAttempted.SoundFile!);
                    }
                    await handleMoveMonitorDarken(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.SayAllChat:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        playSound(moveAttempted.SoundFile!);
                    }
                    sayAllChat = true;
                    setTimeout(() => {
                        sayAllChat = false;
                    }, 20 * 1000);
                    break;
                case MoveType.TeleportCameraRandomly:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        playSound(moveAttempted.SoundFile!);
                    }
                    break;
                case MoveType.Silence:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        playSound(moveAttempted.SoundFile!);
                    }
                    await setAudioMute("Mic/Aux", true);
                    setTimeout(async () => {
                        await setAudioMute("Mic/Aux", false);
                    }, 10 * 1000);

                    break;
            }

        }
        else {
            client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
        }
    }

    // let index = attackDefinitions.findIndex(x => x.Command == 'duckhunt');
    // if(index !== -1) {
    //     attackDefinitions.splice(index, 1)
    // }
    // index = attackDefinitions.findIndex(x => x.Command == ' one1egHaha');
    // if(index !== -1) {
    //     attackDefinitions.splice(index, 1)
    // }
}

function handleMoveAttack(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    if(!isDragonActive) {
        return;
    }
    let chanceToMiss: number = moveAttempted.ChanceToMiss!;

    //Try to hit
    chanceToMiss -= player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level;
    if(chanceToMiss < 0) {
        chanceToMiss = 0;
    }
    
    let rollToHit = getRandomIntI(0, 100);

    if(rollToHit <= chanceToMiss) {
        client.say(process.env.CHANNEL!, `@${username} missed!`);
    }
    else {
        let baseDamage: number = 0;

        let finalSuccessText = getRandomItem(moveAttempted.SuccessText)!;

        if(moveAttempted.Command === "throw") {
            let objectThrown = command.replace("!throw", "").trim();

            if(objectThrown === "" || objectThrown.length <= 2) {
                objectThrown = getRandomItem([
                    "a rock they found nearby",
                    "a rock they found nearby",
                    "a rock they found nearby",
                    "a rock they found nearby",
                    "a bottle they found nearby",
                    "a bottle they found nearby",
                    "a bottle they found nearby",
                    "a napkin they found nearby",
                    "their feelings",
                ])!;

                baseDamage = getRandomIntI(1, 2);
                finalSuccessText = finalSuccessText.replace("{object}", objectThrown);
            }
            else {
                let inventoryObject: InventoryObject = allInventoryObjects.find(x => x.ObjectName === objectThrown)!;

                if(inventoryObject === undefined || inventoryObject.ObjectName === "" || !DoesPlayerHaveObject(username, inventoryObject.ObjectName)) {
                    client.say(process.env.CHANNEL!, `@${username}, you don't have that object!`);
                    return;
                }

                baseDamage = getRandomIntI(inventoryObject.ThrownDamage!.min, inventoryObject.ThrownDamage!.max);
                finalSuccessText = finalSuccessText.replace("{object}", inventoryObject.ContextualName);

                if(inventoryObject.Consumable) {
                    TakeObjectFromPlayer(username, inventoryObject.ObjectName);
                }
            }
        }
        else {
            baseDamage = getRandomIntI(moveAttempted.Damage!.min, moveAttempted.Damage!.max);
        }


        let maxMultiplier = 3; // Targeting a 3x increase at level 100

        // Player's level for scaling (example value, replace with actual player level)
        let playerLevel = player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level; // Assuming this is how you access the player's level

        // Scaling factor
        let scale = 1 + ((playerLevel / 100) * (maxMultiplier - 1));

        // Calculate scaled damage
        let scaledDamage = Math.floor(baseDamage * scale);
        
        let wasCrit = rollToHit >= 95;
        //CRIT!
        if(wasCrit) {
            scaledDamage *= 2;
        }

        // const MAX_DAMAGE = 50;
        // scaledDamage = Math.min(scaledDamage, MAX_DAMAGE);

        // Apply the damage
        doDamage(client, username, Math.round(scaledDamage));

        if(scaledDamage < 0) {
            finalSuccessText = finalSuccessText.replace("{0} damage", "{0} healing");
        }
        
        finalSuccessText = finalSuccessText.replace('{0}', Math.abs(scaledDamage).toString()).replace('{name}', username);
        
        if(wasCrit) {
            finalSuccessText = `It's a critical hit! ${finalSuccessText}`;
        }

        client.say(process.env.CHANNEL!, finalSuccessText);
        handleTimeout(command);
        
        if(moveAttempted.StunChance !== undefined) {
            if(getRandomIntI(1, 100) <= moveAttempted.StunChance) {
                stunBytefire(client);
            }
        }
    }
}

function handleMovePlaySound(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    client.say(process.env.CHANNEL!, getRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));
    playSound(moveAttempted.SoundFile!);

    if(isCommand(command, 'battlecry')) {
        battlecryStarted = true;

        doBattleCry(username);
    }

    handleTimeout(command);
}

function doBattleCry(username: string) {
    let textOptions = [
        'OOOO RAAAA',
        'AAGGHHHHHH',
        'LETS GO!',
        'FUS ROH DAHHHHH'
    ];

    let chosenOption = textOptions[Math.floor(Math.random() * textOptions.length)];

    broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: username, displayText: chosenOption }));

    let player = LoadPlayer(username);

    if(player.ExpBoostMultiplier > 1) {
        return;
    }

    player.ExpBoostMultiplier = 2;
    SavePlayer(player);

    setTimeout(() => {
        player.ExpBoostMultiplier = 1;
        SavePlayer(player);
    }, 300000); //5 Minutes
}

async function handleMoveMonitorRotation(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    let rotationOptions = [180];

    let afterText = command.replace(`!${moveAttempted.Command}`, '');
    if(afterText.includes('90') || afterText.includes('right')) {
        rotationOptions = [90];
    }
    else if(afterText.includes('180') || afterText.includes('upsidedown') || afterText.includes('up')) {
        rotationOptions = [180];
    }
    else if(afterText.includes('270') || afterText.includes('left')) {
        rotationOptions = [270];
    }

    await setMonitorRotationTemporarily(getRandomItem(rotationOptions)!, 15);

    client.say(process.env.CHANNEL!, getRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    handleTimeout(command);
}

async function handleMoveMonitorDarken(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    await setMonitorBrightnessContrastTemporarily(0, 20);

    client.say(process.env.CHANNEL!, getRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    handleTimeout(command);
}

function stunBytefire(client: Client) {
    let dragonInfo = LoadDragonData();
    let stunTime = getRandomIntI(3, 10);
    
    dragonInfo.HitsBeforeAttack += stunTime;
    client.say(process.env.CHANNEL!, `Bytefire was temporarily stunned and it will take longer for them to attack again!`);

    SaveDragonData(dragonInfo);
}

function doDamage(client: Client, username: string, damage: number) {
    let dragonInfo = LoadDragonData();
    dragonInfo.Health -= damage;
    if(dragonInfo.Health <= 0) {
        dragonInfo.Health = 0;

        //Handle dragon death somehow?
    }

    setTimeout(() => {
        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        SavePlayerSession(username, playerSession);
    }, 100);

    GiveExp(client, username, 1);

    SaveDragonData(dragonInfo);

    broadcast(JSON.stringify({ type: 'attack', info: dragonInfo }));

    dragonInfo.HitsBeforeAttack--;
    if(dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = getRandomIntI(10, 15);

        setTimeout(() => {
            TriggerDragonAttack(client);
        }, 200);
    }
    else {
        setTimeout(() => {
            TriggerDragonAttack(client);
        }, 200);
    }
}

function getPlayerStatsDisplay(username: string, player: Player): string {
    let classesAbove0 = 0;
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Level > 0) {
            classesAbove0++;
        }
    }

    let currClassCount = 0;
    let final = `@${username}, you are level ${player.Level}.`;
    if(player.Level > 0) {
        final += " You are ";
    }
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Level > 0) {
            final += `a ${getNumberWithOrdinal(player.Classes[i].Level)} level ${ClassType[player.Classes[i].Type]}`;
            currClassCount++;

            if(currClassCount < classesAbove0 - 1) {
                final += ", ";
            }
            else if(currClassCount == classesAbove0 - 1) {
                final += " and ";
            }
            else {
                final += ".";
            }
        }
    }

    if(player.LevelUpAvailable) {
        final += ` You also have another level up available.`;
    }

    final += ` [${player.CurrentExp}/${player.CurrentExpNeeded}]EXP [${player.CurrentHealth}/${calculateMaxHealth(player)}]HP`;

    return final;
}

function getNumberWithOrdinal(n: number) {
    let s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isCommand(message: string, command: string): boolean {
    return message === `!${command}` || message.includes(`!${command} `);
}
