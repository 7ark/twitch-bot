import {ChatUserstate, Client} from "tmi.js";
import {
    AddStatusEffectToPlayer,
    CalculateExpNeeded,
    CalculateMaxHealth,
    ChangePlayerHealth,
    DoesPlayerHaveStatusEffect,
    GetObjectFromInputText,
    GiveExp,
    GivePlayerObject,
    LoadAllPlayers,
    LoadPlayer,
    Player,
    SavePlayer,
    StatusEffect,
    TakeObjectFromPlayer
} from "./utils/playerGameUtils";
import {Broadcast} from "./bot";
import {ClassType, GetNumberWithOrdinal, GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils/utils";
import fs from "fs";
import {AttackDefinitions, ClassMove, GetMove, MoveType} from "./movesDefinitions";
import {AllInventoryObjects, DoesPlayerHaveObject, InventoryObject} from "./inventory";
import {
    GetObsSourcePosition,
    GetObsSourceScale,
    SCENE_HEIGHT,
    SCENE_WIDTH,
    SetAudioMute,
    SetObsSourcePosition,
    SetObsSourceScale
} from "./utils/obsutils";
import {IsDragonActive, SayAllChat} from "./globals";
import {GetStringifiedSessionData} from "./utils/playerSessionUtils";
import {DoDamage, StunBytefire} from "./utils/dragonUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice, TryToSetVoice} from "./utils/audioUtils";
import {SetMonitorBrightnessContrastTemporarily, SetMonitorRotationTemporarily} from "./utils/displayUtils";
import {DrunkifyText} from "./utils/messageUtils";

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
        cooldown: 600000, //5 minutes
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
let gainHPOnCrit: boolean = false;
let isBytefirePoisoned: boolean = false;

function HandleTimeout(command: string) {
    cooldowns.forEach((val, key) => {
        if(IsCommand(command, key) && !val.isInGracePeriod) {
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

export async function ProcessCommands(client: Client, userState: ChatUserstate, command: string) {
    // console.log(command + " vs " + cleanMessage(command));

    let onTimeout: string = '';
    let showCooldownMsg = false;
    cooldowns.forEach((val, key) => {
        if(val.isOnTimeout && IsCommand(command, key)) {
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


    if(IsCommand(command, 'lurk')) {
        await client.say(process.env.CHANNEL!, `@${userState['display-name']}, have a nice lurk!`);
    }
    else if(IsCommand(command, 'cc')) {
        await client.say(process.env.CHANNEL!, `Crowd Control is a way for you (the viewer) to interact with my modded game and cause fun effects to happen, good or bad. 
        You can get 250 free coins (on desktop) every 30 minutes from the overlay on screen, or buy them from my interact link: https://interact.crowdcontrol.live/#/twitch/26580802/coins`);
    }
    else if(IsCommand(command, 'discord')) {
        await client.say(process.env.CHANNEL!, `Come hang out on our Discord, to chat, give stream suggestions, and get go live notification. Join here: https://discord.gg/A7R5wFFUWG`);
    }
    else if(IsCommand(command, 'mage') || IsCommand(command, 'warrior') || IsCommand(command, 'rogue')) {
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
                            GivePlayerObject(client, player.Username, "sword");
                            GivePlayerObject(client, player.Username, "hammer");
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
                            GivePlayerObject(client, player.Username, "dagger");
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
                            GivePlayerObject(client, player.Username, "wand");
                        }
                        break;
                    }
                }
            }

            player.CurrentExp -= player.CurrentExpNeeded;
            player.Level++;
            player.CurrentExpNeeded = CalculateExpNeeded(player.Level);
            if(player.CurrentExp < player.CurrentExpNeeded) {
                player.LevelUpAvailable = false;
            }

            for (let i = 0; i < player.Classes.length; i++) {
                if(player.Classes[i].Type == classType) {
                    player.Classes[i].Level++;
                }
            }

            let final = GetPlayerStatsDisplay(userState['display-name']!, player);

            SavePlayer(player);

            await client.say(process.env.CHANNEL!, final);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you have no level ups available.`);
        }
    }
    else if(IsCommand(command, 'stats') || IsCommand(command, 'level')) {
        let player = LoadPlayer(userState['display-name']!);

        await client.say(process.env.CHANNEL!, GetPlayerStatsDisplay(userState['display-name']!, player));
    }
    else if(IsCommand(command, 'moves')) {
        let player = LoadPlayer(userState['display-name']!);
        let text = `@${userState['display-name']!}, the moves you can use right now are: `;

        for (let i = 0; i < player.KnownMoves.length; i++) {
            let move = GetMove(player.KnownMoves[i]);
            if(IsDragonActive || (move !== undefined && move.Type !== MoveType.Attack)) {
                text += `!${player.KnownMoves[i]}`;

                if(i < player.KnownMoves.length - 2) {
                    text += ", ";
                }
                else if(i === player.KnownMoves.length - 2 && player.KnownMoves.length > 1) {
                    text += " and ";
                }
            }
        }

        let validDefs = AttackDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

        text += `. You can learn ${validDefs.length} new moves at this level.`;

        await client.say(process.env.CHANNEL!, text);
    }
    else if(battlecryStarted && IsCommand(command, 'battlecry')) {
        PlaySound('battlecry');

        DoBattleCry(userState['display-name']!);
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'giveallexp')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        let expAmount = parseInt(command.replace('!giveallexp ', ''));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            await GiveExp(client, currPlayer.Username, expAmount);
        }
        await client.say(process.env.CHANNEL!, `I've given ${expAmount}EXP to ALL adventurers!`);
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'giveexp')) {
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
            await GiveExp(client, user, expAmount);
        }
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'adventure')) {
        Broadcast(JSON.stringify({ type: 'startadventure' }));
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'credits')) {
        PlaySound("credits");
        Broadcast(JSON.stringify({ type: 'showcredits', data: GetStringifiedSessionData() }));
    }
    else if(IsCommand(command, 'setvoice')) {
        await TryToSetVoice(client, userState['display-name']!,  command.replace("!setvoice", "").trim());
    }
    else if(IsCommand(command, 'yell')) {
        let player = LoadPlayer(userState['display-name']!);

        let textToSay = command.replace("!yell", "");

        if(DoesPlayerHaveStatusEffect(userState['display-name']!, StatusEffect.Drunk)) {
            textToSay = DrunkifyText(textToSay);
        }

        if(textToSay.length > 250) {
            textToSay = textToSay.slice(0, 250) + "...";
        }

        PlayTextToSpeech(textToSay, TryGetPlayerVoice(player));

        setTimeout(() => {
            Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: textToSay, }));
        }, 700);
    }
    else if(IsCommand(command, 'inventory') || IsCommand(command, 'equipment')) {
        let player = LoadPlayer(userState['display-name']!);
        if(player.Inventory.length === 0) {
            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you have no items in your inventory`);
        }
        else {
            let final = `@${userState['display-name']!}, you have `;
            let uniqueItems: Array<{item: InventoryObject, count: number}> = [];

            for (let i = 0; i < player.Inventory.length; i++) {
                let inventoryObj: InventoryObject = AllInventoryObjects.find(x => x.ObjectName === player.Inventory[i])!;

                let foundObj = uniqueItems.find(x => x.item === inventoryObj);
                if(foundObj !== undefined) {
                    foundObj.count++;
                }
                else {
                    uniqueItems.push({item: inventoryObj, count: 1})
                }
            }

            for (let i = 0; i < uniqueItems.length; i++) {

                final += uniqueItems[i].count > 1 ? uniqueItems[i].item.PluralName : uniqueItems[i].item.ContextualName;
                if(uniqueItems[i].count > 1) {
                    final += ` (x${uniqueItems[i].count})`;
                }

                if(i < uniqueItems.length - 2 && uniqueItems.length > 2) {
                    final += ", "
                }

                if(i === uniqueItems.length - 2) {
                    final += " and ";
                }
            }

            await client.say(process.env.CHANNEL!, final);
        }
    }
    else if (IsCommand(command, 'use')) {
        let player = LoadPlayer(userState['display-name']!);

        let objectUsed = command.replace("!use", "").trim();
        let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed)!;
        
        if(inventoryObject === undefined || inventoryObject === null || !player.Inventory.includes(inventoryObject.ObjectName)) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have that!`);
        }
        else {
            let wasUsed = await inventoryObject.UseAction(client, player, objectUsed.replace(inventoryObject.ObjectName, "").trim());
            if(inventoryObject.Consumable && wasUsed) {
                TakeObjectFromPlayer(player.Username, inventoryObject.ObjectName);
            }
        }
    }
    else if (IsCommand(command, 'equip')) {
        let player = LoadPlayer(userState['display-name']!);

        let objectUsed = command.replace("!equip", "").trim();
        let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed);

        if(inventoryObject === undefined || inventoryObject === null || !player.Inventory.includes(inventoryObject.ObjectName)) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have that!`);
        }
        else {
            if(inventoryObject.Equippable) {
                if(player.EquippedBacklog === undefined) {
                    player.EquippedBacklog = [];
                }

                if(player.EquippedObject !== undefined) {

                    player.EquippedBacklog.push(player.EquippedObject);
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you have unequipped your ${player.EquippedObject.ObjectName}`);
                }

                let existingObjectIndex = player.EquippedBacklog.findIndex(x => x.ObjectName === inventoryObject.ObjectName);
                if(existingObjectIndex !== -1) {
                    player.EquippedObject = player.EquippedBacklog[existingObjectIndex];
                    player.EquippedBacklog.splice(existingObjectIndex, 1);
                }
                else {
                    player.EquippedObject = {
                        ObjectName: inventoryObject.ObjectName,
                        RemainingDurability: GetRandomIntI(inventoryObject.Durability!.min, inventoryObject.Durability!.max)
                    };
                }

                let attackClassInfo = "It will work with ";
                if(inventoryObject.ClassRestrictions!.length === 3) {
                    attackClassInfo += "all classes.";
                }
                else if(inventoryObject.ClassRestrictions!.length === 1) {
                    attackClassInfo += `the ${ClassType[inventoryObject.ClassRestrictions![0]]} class.`;
                }
                else {
                    attackClassInfo += `the ${ClassType[inventoryObject.ClassRestrictions![0]]} and ${ClassType[inventoryObject.ClassRestrictions![1]]} classes.`;
                }

                await client.say(process.env.CHANNEL!, `@${player.Username}, you have equipped your ${player.EquippedObject.ObjectName}. ${attackClassInfo}`);
                SavePlayer(player);
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you can't equip that object.`);
            }
        }
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'give')) {
        let afterText = command.replace('!give ', '').split(' ');
        let user = afterText[0];
        let objectUsed = "";
        for (let i = 1; i < afterText.length; i++) {
            objectUsed += afterText[i];
            if(i != afterText.length - 1) {
                objectUsed += " ";
            }
        }

        let inventoryObject: InventoryObject = AllInventoryObjects.find(x => objectUsed.includes(x.ObjectName))!;

        GivePlayerObject(client, user, objectUsed);

    }
    else if (IsCommand(command, 'info')) {
        let player = LoadPlayer(userState['display-name']!);

        let objectUsed = command.replace("!info", "").trim();
        let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed);

        if(inventoryObject === undefined || inventoryObject === null) {
            await client.say(process.env.CHANNEL!, `${player.Username}, I'm not sure what that is`);
        }
        else {
            await client.say(process.env.CHANNEL!, inventoryObject.Info);
        }
    }
    else if (IsCommand(command, 'voices')) {
        await client.say(process.env.CHANNEL!, `Use !setvoice [voice] to set your TTS voice for the stream. The available voices are: Andrew, Emma, Brian, Guy, Aria, Davis, Eric, Jacob, Roger, Steffan, AvaMultilingual, Amber, Ashley`);
    }
    else if(IsCommand(command, 'togglepassive') || IsCommand(command, 'passive')) {
        let player = LoadPlayer(userState['display-name']!);
        player.PassiveModeEnabled = !player.PassiveModeEnabled;
        SavePlayer(player);
        await client.say(process.env.CHANNEL!, `${player.Username}, passive mode is now ${player.PassiveModeEnabled ? `enabled` : `disabled`}`);
    }
    else if(IsCommand(command, 'deathleaderboard') || IsCommand(command, 'deathlb')) {
        let players = LoadAllPlayers().sort((x, y) => {
            return x.Deaths - y.Deaths;
        });

        let text = "Deaths Leaderboard: \n";
        let max = Math.min(5, players.length);
        for (let i = 0; i < max; i++) {
            if(players[i].Deaths == undefined || players[i].Deaths == 0) {
                break;
            }

            text += `${GetNumberWithOrdinal(i + 1)}: @${players[i].Username} - ${players[i].Deaths} Deaths`;

            if(i != 5) {
                text += " | ";
            }
        }

        await client.say(process.env.CHANNEL!, text);
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'test')) {
        AddStatusEffectToPlayer(userState['display-name']!, StatusEffect.Drunk, 60);
    }
    else {
        await HandleMoves(client, userState, command);
    }
}

async function HandleMoves(client: Client, userState: ChatUserstate, command: string) {
    let player = LoadPlayer(userState['display-name']!);

    if(IsCommand(command, 'punch') && IsDragonActive) {
        await DoDamage(client, userState['display-name']!, 1);
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

    let moveAttempted: ClassMove | undefined = AttackDefinitions.find(x => IsCommand(command, x.Command));

    let isDuck = (userState['display-name']!).toLowerCase() === 'one_1egged_duck';
    let isDucksCommand = (IsCommand(command, 'duckhunt') || IsCommand(command, ' one1eghaha'));
    if(isDuck && isDucksCommand) {
        moveAttempted = {
            Command: IsCommand(command, 'duckhunt') ? 'duckhunt' : ' one1egHaha',
            Description: '',
            ClassRequired: ClassType.Rogue,
            Type: MoveType.Attack,

            HitModifier: 30,
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
                    await HandleMoveAttack(client, moveAttempted, player, userState['display-name']!, command);
                    break;
                case MoveType.PlaySound:
                    handleMovePlaySound(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.ChangeMonitorRotation:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!);
                    }
                    await HandleMoveMonitorRotation(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.DarkenMonitor:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!);
                    }
                    await HandleMoveMonitorDarken(client, moveAttempted, userState['display-name']!, command);
                    break;
                case MoveType.SayAllChat:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', userState['display-name']!));
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!);
                    }
                    SayAllChat = true;
                    setTimeout(() => {
                        SayAllChat = false;
                    }, 60 * 1000);
                    break;
                case MoveType.TeleportCameraRandomly:
                    await HandleRandomCameraTeleport(client, moveAttempted, userState['display-name']!);
                    break;
                case MoveType.Silence:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', userState['display-name']!));
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!);
                    }
                    await SetAudioMute("Mic/Aux", true);
                    setTimeout(async () => {
                        await SetAudioMute("Mic/Aux", false);
                    }, 10 * 1000);

                    HandleTimeout(command);
                    break;
                case MoveType.GainHPOnCrit:
                    await HandleGainHPOnCritTemporarily(client, moveAttempted, userState['display-name']!, command);
                    break;
            }

        }
        else {
            client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
        }
    }
}

async function HandleMoveAttack(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    if(!IsDragonActive) {
        return;
    }

    let isUsingObject = player.EquippedObject !== undefined && GetObjectFromInputText(player.EquippedObject.ObjectName).ClassRestrictions.includes(moveAttempted.ClassRequired);


    //Try to hit
    let rollToHit = GetRandomIntI(1, 20);
    let extraRollAddition = 0;
    let wasCrit = rollToHit == 20;

    extraRollAddition = Math.round(player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level / 5);

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.Drunk)) {
        extraRollAddition += GetRandomIntI(-10, 10);
    }

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleAccuracy)) {
        extraRollAddition = (rollToHit + extraRollAddition) * 2;
    }

    let dragonAc = GetRandomIntI(10, 14);

    let rollDisplay = `${rollToHit + extraRollAddition} (${rollToHit} + ${extraRollAddition})`;

    if(rollToHit + extraRollAddition < dragonAc) {
        client.say(process.env.CHANNEL!, `@${username} missed rolling ${rollDisplay}, they needed at least ${dragonAc}`);
    }
    else {
        let baseDamage: number = 0;

        let finalSuccessText = GetRandomItem(moveAttempted.SuccessText)!;
        let targetPlayer: Player | undefined = undefined;

        let maxDamage = 0;
        if(moveAttempted.Command === "throw") {
            let pieces = command.replace("!throw", "").trim().split(' ');
            let objectThrown = pieces.length > 0 ? pieces[0] : "";
            let target = pieces.length > 1 ? pieces[1] : "";
            targetPlayer = LoadPlayer(target);

            if(objectThrown === "" || objectThrown.length <= 2) {
                objectThrown = GetRandomItem([
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

                baseDamage = GetRandomIntI(1, 2);
                maxDamage = 2;
                finalSuccessText = finalSuccessText.replace("{object}", objectThrown);
            }
            else {
                let inventoryObject: InventoryObject = GetObjectFromInputText(objectThrown);

                if(inventoryObject === undefined || inventoryObject.ObjectName === "" || !DoesPlayerHaveObject(username, inventoryObject.ObjectName)) {
                    client.say(process.env.CHANNEL!, `@${username}, you don't have that object!`);
                    return;
                }

                if(inventoryObject.ThrownDamage === undefined) {
                    client.say(process.env.CHANNEL!, `@${username}, you can't throw that object! You must use !use ${inventoryObject.ObjectName}`);
                    return;
                }

                baseDamage = GetRandomIntI(inventoryObject.ThrownDamage!.min, inventoryObject.ThrownDamage!.max);
                maxDamage = inventoryObject.ThrownDamage!.max;
                finalSuccessText = finalSuccessText.replace("{object}", inventoryObject.ContextualName);

                if(inventoryObject.Consumable) {
                    TakeObjectFromPlayer(username, inventoryObject.ObjectName);
                }
            }
        }
        else {
            baseDamage = GetRandomIntI(moveAttempted.Damage!.min, moveAttempted.Damage!.max);
            maxDamage = moveAttempted.Damage!.max;
        }

        if(moveAttempted.Poison) {
            isBytefirePoisoned = true;
            setTimeout(() => {
                isBytefirePoisoned = false;
            }, 1000 * 60);
        }

        let maxMultiplier = 3; // Targeting a 3x increase at level 100

        // Player's level for scaling (example value, replace with actual player level)
        let playerLevel = player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level; // Assuming this is how you access the player's level

        // Scaling factor
        let scale = 1 + ((playerLevel / 100) * (maxMultiplier - 1));

        // Calculate scaled damage
        let scaledDamage = Math.floor(baseDamage * scale);

        //CRIT!
        if(wasCrit) {
            scaledDamage = maxDamage;

            scaledDamage *= 2;
        }

        // const MAX_DAMAGE = 50;
        // scaledDamage = Math.min(scaledDamage, MAX_DAMAGE);


        if(targetPlayer != null && targetPlayer.Level > 0) {
            await ChangePlayerHealth(client, targetPlayer.Username, Math.round(scaledDamage), `@${username} tossed an object at them`);
            return;
        }

        let poisonDamage = Math.max(1, Math.round(scaledDamage * 0.2));
        if(isBytefirePoisoned && scaledDamage > 0) {
            scaledDamage += poisonDamage;
        }

        let extraObjectDamage = 0;
        let extraObjectName = "";
        if(isUsingObject) {
            extraObjectDamage = await GetObjectFromInputText(player.EquippedObject!.ObjectName).ObjectAttackAction(client, player);
            extraObjectName = GetObjectFromInputText(player.EquippedObject!.ObjectName).ContextualName;

            player.EquippedObject!.RemainingDurability--;
            if(player.EquippedObject!.RemainingDurability <= 0) {
                TakeObjectFromPlayer(player.Username, player.EquippedObject!.ObjectName);

                client.say(process.env.CHANNEL!, `@${username}, your ${player.EquippedObject!.ObjectName} ran out of durability and broke!`);
                player.EquippedObject = undefined;
            }

            SavePlayer(player);

            scaledDamage += extraObjectDamage;
        }

        // Apply the damage
        await DoDamage(client, username, Math.round(scaledDamage));

        if(scaledDamage < 0) {
            finalSuccessText = finalSuccessText.replace("{0} damage", "{0} healing");
        }
        
        finalSuccessText = finalSuccessText
            .replace('{0}', Math.abs(scaledDamage).toString())
            .replace('{name}', username)
            .replace("{roll}", rollDisplay);

        if(isBytefirePoisoned) {
            finalSuccessText += ` He took an extra ${poisonDamage} poison damage.`;
        }

        if(isUsingObject && extraObjectDamage > 0) {
            finalSuccessText += ` Your attack with ${extraObjectName} did an extra ${extraObjectDamage} damage!`;
        }
        
        if(wasCrit) {
            finalSuccessText = `It's a critical hit! ${finalSuccessText}`;

            if(gainHPOnCrit) {
                await ChangePlayerHealth(client, player.Username, Math.round(scaledDamage));
            }
        }

        client.say(process.env.CHANNEL!, finalSuccessText);
        HandleTimeout(command);
        
        if(moveAttempted.StunChance !== undefined) {
            if(GetRandomIntI(1, 100) <= moveAttempted.StunChance) {
                StunBytefire(client);
            }
        }
    }
}

function handleMovePlaySound(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));
    PlaySound(moveAttempted.SoundFile!);

    if(IsCommand(command, 'battlecry')) {
        battlecryStarted = true;

        DoBattleCry(username);
    }

    HandleTimeout(command);
}

function DoBattleCry(username: string) {
    let textOptions = [
        'OOOO RAAAA',
        'AAGGHHHHHH',
        'LETS GO!',
        'FUS ROH DAHHHHH'
    ];

    let chosenOption = textOptions[Math.floor(Math.random() * textOptions.length)];

    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: username, displayText: chosenOption }));

    AddStatusEffectToPlayer(username, StatusEffect.DoubleExp, 60 * 5);
}

async function HandleMoveMonitorRotation(client: Client, moveAttempted: ClassMove, username: string, command: string) {
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

    await SetMonitorRotationTemporarily(GetRandomItem(rotationOptions)!, 15);

    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    HandleTimeout(command);
}

async function HandleGainHPOnCritTemporarily(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
        PlaySound(moveAttempted.SoundFile!);
    }

    let textSaid = command.replace("!heroic speech", "").trim()
    if(textSaid.length > 3) {
        let player = LoadPlayer(username);
        PlayTextToSpeech(textSaid, TryGetPlayerVoice(player));
    }

    gainHPOnCrit = true;
    setTimeout(() => {
        gainHPOnCrit = false;
    }, 1000 * 60 * 5)
}

async function HandleRandomCameraTeleport(client: Client, moveAttempted: ClassMove, username: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
        PlaySound(moveAttempted.SoundFile!);
    }

    let itemToTeleport = "Small Camera";

    let ogScale = await GetObsSourceScale(itemToTeleport);
    let ogPos = await GetObsSourcePosition(itemToTeleport);

    let minScale = 0.7;
    let maxScale = 1.5;

    let xScale = GetRandomNumber(minScale, maxScale);
    let yScale = GetRandomNumber(minScale, maxScale);

    // let extreme = getRandomIntI(1, 3) == 1;
    // if(!extreme) {
    //     yScale = getRandomNumber(xScale * 0.9, xScale * 1.1);
    // }

    let newX = ogScale.x * xScale;
    let newY = ogScale.y * yScale;

    await SetObsSourceScale(itemToTeleport, newX, newY);

    setTimeout(async () => {
        let currentDim = await GetObsSourcePosition(itemToTeleport);

        await SetObsSourcePosition(itemToTeleport, GetRandomIntI(currentDim.width, SCENE_WIDTH - currentDim.width), GetRandomIntI(currentDim.height, SCENE_HEIGHT - currentDim.height));

        setTimeout(async () => {
            await GetObsSourcePosition(itemToTeleport)
            await SetObsSourcePosition(itemToTeleport, ogPos.x, ogPos.y);
            await SetObsSourceScale(itemToTeleport, ogScale.x, ogScale.y);

        }, 1000 * 15)
    }, 50);
}

async function HandleMoveMonitorDarken(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    await SetMonitorBrightnessContrastTemporarily(0, 20);

    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    HandleTimeout(command);
}

function GetPlayerStatsDisplay(username: string, player: Player): string {
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
            final += `a ${GetNumberWithOrdinal(player.Classes[i].Level)} level ${ClassType[player.Classes[i].Type]}`;
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
        final += ` You have a level up available.`;
    }

    if(player.EquippedObject !== undefined) {
        final += ` Your equipped ${player.EquippedObject!.ObjectName} has a durability left of ${player.EquippedObject!.RemainingDurability}.`;
    }

    final += ` You've died ${player.Deaths} times! [${player.CurrentExp}/${player.CurrentExpNeeded}]EXP [${player.CurrentHealth}/${CalculateMaxHealth(player)}]HP`;

    return final;
}

function IsCommand(message: string, command: string): boolean {
    return message.toLowerCase() === `!${command}` || message.toLowerCase().includes(`!${command} `);
}
