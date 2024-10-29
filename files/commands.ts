import {ChatUserstate, Client} from "tmi.js";
import {
    AddStatusEffectToPlayer,
    CalculateExpNeeded,
    CalculateMaxHealth,
    ChangePlayerHealth,
    DoesPlayerHaveStatusEffect,
    GetCommandCooldownTimeLeftInSeconds,
    GetObjectFromInputText,
    GiveExp,
    GivePlayerObject,
    IsCommandOnCooldown,
    LoadAllPlayers,
    LoadPlayer,
    Player,
    SavePlayer,
    StatusEffect,
    TakeObjectFromPlayer,
    TriggerCommandCooldownOnPlayer,
    TryLoadPlayer
} from "./utils/playerGameUtils";
import {Broadcast} from "./bot";
import {
    AddSpacesBeforeCapitals,
    ClassType,
    GetNumberWithOrdinal,
    GetRandomIntI,
    GetRandomItem,
    GetRandomNumber,
    GetSecondsBetweenDates
} from "./utils/utils";
import fs from "fs";
import {ClassMove, GetMove, MoveDefinitions, MoveType} from "./movesDefinitions";
import {AllInventoryObjects, DoesPlayerHaveObject, InventoryObject} from "./inventory";
import {
    DoesSceneContainItem,
    GetObsSourcePosition,
    GetObsSourceScale,
    GetOpenScene,
    SCENE_HEIGHT,
    SCENE_WIDTH,
    SetAudioMute,
    SetFilterEnabled,
    SetObsSourcePosition,
    SetObsSourceScale
} from "./utils/obsutils";
import {IsDragonActive, SayAllChat} from "./globals";
import {GetStringifiedSessionData, LoadPlayerSession, SavePlayerSession} from "./utils/playerSessionUtils";
import {
    DamageType,
    DoDamage,
    GetAdjustedDamage,
    GetDamageTypeText,
    ReduceDragonHits,
    StunBytefire
} from "./utils/dragonUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice, TryToSetVoice} from "./utils/audioUtils";
import {SetMonitorBrightnessContrastTemporarily, SetMonitorRotationTemporarily} from "./utils/displayUtils";
import {DrunkifyText} from "./utils/messageUtils";
import {
    GetCurrentShopItems,
    HandleMinigames,
    IsCommandMinigame,
    MinigameType,
    ResetLeaderboard,
    ShowLeaderboard,
    ShowShop
} from "./utils/minigameUtils";
import {DoesPlayerHaveQuest, GetQuestText} from "./utils/questUtils";
import {AudioType} from "./streamSettings";
import {FadeOutLights, MakeRainbowLights, SetLightBrightness, SetLightColor} from "./utils/lightsUtils";
import {RemoveUserVIP} from "./utils/twitchUtils";
import {GetUserMinigameCount} from "./actionqueue";

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
        cooldown: 600000, //10 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: true,
    }],
    ["cast confusion", {
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
    ["shroud", {
        gracePeriod: 0,
        cooldown: 600000, //10 minutes
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
    ["info", {
        gracePeriod: 0,
        cooldown: 300000, //5 minutes
        isOnTimeout: false,
        isInGracePeriod: false,
        showCooldownMessage: false,
    }],
    ["help", {
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

    let player = LoadPlayer(userState['display-name']!);

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
    //Selecting class
    else if(Object.keys(ClassType).filter(key => isNaN(Number(key))).some(key => IsCommand(command, key.toLowerCase()))) {
        if(player.LevelUpAvailable) {
            let classTypeKey = Object.keys(ClassType)
                .filter(key => isNaN(Number(key)))
                .find(key => IsCommand(command, key.toLowerCase()));

            if (!classTypeKey) return; // In case something goes wrong

            // Convert classTypeKey (string) to the corresponding enum value
            let classType: ClassType = ClassType[classTypeKey as keyof typeof ClassType];
            let playerClass = player.Classes.find(c => c.Type === classType);

            if(playerClass && playerClass.Level === 0) {
                switch (classType) {
                    case ClassType.Warrior:
                        GivePlayerObject(client, player.Username, "sword");
                        GivePlayerObject(client, player.Username, "hammer");
                        break;
                    case ClassType.Mage:
                        GivePlayerObject(client, player.Username, "wand");
                        break;
                    case ClassType.Rogue:
                        GivePlayerObject(client, player.Username, "dagger");
                        break;
                    case ClassType.Cleric:
                        GivePlayerObject(client, player.Username, "healing amulet");
                        break;
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

            let final = GetPlayerStatsDisplay(player);

            SavePlayer(player);

            await client.say(process.env.CHANNEL!, final);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you have no level ups available.`);
        }
    }
    // else if(IsCommand(command, 'mage') || IsCommand(command, 'warrior') || IsCommand(command, 'rogue')) {
    //     // console.log(`Loaded ${player.Username} ${player.Level} ${player.LevelUpsAvailable}`);
    // }
    else if(IsCommand(command, 'stats') || IsCommand(command, 'level')) {
        let split = command.trim().split(' ');

        let playerToStats = player;

        if(split.length > 1) {
            let otherPlayer = TryLoadPlayer(split[1].replace("@", ""));

            if(otherPlayer != undefined) {
                playerToStats = otherPlayer;
            }
        }

        await client.say(process.env.CHANNEL!, GetPlayerStatsDisplay(playerToStats));
    }
    else if(IsCommand(command, 'moves')) {
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

        let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

        text += `. You can learn ${validDefs.length} new moves at this level. You can also use !randomattack to use any random attack move you know.`;

        await client.say(process.env.CHANNEL!, text);
    }
    else if(battlecryStarted && IsCommand(command, 'battlecry')) {
        PlaySound('battlecry', AudioType.UserGameActions);

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
        PlaySound("credits", AudioType.StreamInfrastructure);
        Broadcast(JSON.stringify({ type: 'showcredits', data: GetStringifiedSessionData() }));
    }
    else if(IsCommand(command, 'setvoice')) {
        await TryToSetVoice(client, userState['display-name']!,  command.replace("!setvoice", "").trim());
    }
    else if(IsCommand(command, 'yell')) {
        let textToSay = command.replace("!yell", "");

        if(DoesPlayerHaveStatusEffect(userState['display-name']!, StatusEffect.Drunk)) {
            textToSay = DrunkifyText(textToSay);
        }

        if(textToSay.length > 250) {
            textToSay = textToSay.slice(0, 250) + "...";
        }

        PlayTextToSpeech(textToSay, AudioType.UserTTS, TryGetPlayerVoice(player));

        setTimeout(() => {
            Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: textToSay, }));
        }, 700);
    }
    else if(IsCommand(command, 'inventory') || IsCommand(command, 'equipment')) {
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
                    if(inventoryObj === undefined)
                        console.log(`FAILED TO FIND INVENTORY ITEM: ${player.Inventory[i]}`)
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

            final += `. You also have ${player.SpendableGems} gems.`;

            await client.say(process.env.CHANNEL!, final);
        }
    }
    else if (IsCommand(command, 'use')) {
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
        let objectUsed = command.replace("!equip", "").trim();
        let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed)!;

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
    else if(IsCommand(command, 'unequip')) {
        if(player.EquippedBacklog === undefined) {
            player.EquippedBacklog = [];
        }

        if(player.EquippedObject != undefined) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have unequipped your ${player.EquippedObject.ObjectName}`);
            player.EquippedBacklog.push(player.EquippedObject);
            player.EquippedObject = undefined;
            SavePlayer(player);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have nothing equipped right now`);
        }
    }
    else if(IsCommand(command, 'durability')) {
        if(player.EquippedObject != undefined) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, your ${player.EquippedObject.ObjectName} has a remaining durability of ${player.EquippedObject.RemainingDurability}`);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have nothing equipped right now`);
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
        let infoFocus = command.replace("!info", "").trim();
        let inventoryObject: InventoryObject = GetObjectFromInputText(infoFocus)!;

        if(inventoryObject === undefined || inventoryObject === null) {
            let move = GetMove(infoFocus);
            if(move !== undefined) {
                await client.say(process.env.CHANNEL!, move.Description);
            }
            else {
                await client.say(process.env.CHANNEL!, `${player.Username}, I'm not sure what that is. You need to use !info [item or move name]`);
            }
        }
        else {
            await client.say(process.env.CHANNEL!, inventoryObject.Info);
        }
    }
    else if (IsCommand(command, 'voices')) {
        await client.say(process.env.CHANNEL!, `Use !setvoice [voice] to set your TTS voice for the stream. The available voices are: Andrew, Emma, Brian, Guy, Aria, Davis, Eric, Jacob, Roger, Steffan, AvaMultilingual, Amber, Ashley`);
    }
    else if (IsCommand(command, 'cozy')) {
        await client.say(process.env.CHANNEL!, `${player.Username}, you have ${player.CozyPoints} cozy point${player.CozyPoints == 1 ? '' : 's'}`);
    }
    else if(IsCommand(command, 'togglepassive') || IsCommand(command, 'passive') || IsCommand(command, 'toggle passive')) {
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
        //Flash red lights
        await RemoveUserVIP(client, "One_1egged_Duck");
    }
    else if(IsCommand(command, "gems")) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you have ${player.SpendableGems} gems.`);
    }
    // else if(IsCommand(command, "dead")) {
    //     setTimeout(() => {
    //         Broadcast(JSON.stringify({ type: 'changestickmanappearance', displayName: player.Username, changeType: 'died' }));
    //     }, 1000)
    // }
    // else if(IsCommand(command, "revive")) {
    //     setTimeout(() => {
    //         Broadcast(JSON.stringify({ type: 'changestickmanappearance', displayName: player.Username, changeType: 'revive' }));
    //     }, 1000)
    // }
    else if(IsCommand(command, "help")) {
        const minigameKeys = Object
            .keys(MinigameType)
            .filter((v) => isNaN(Number(v)))

        await client.say(process.env.CHANNEL!, `Cory's chat is extremely interactive! Here's how you can participate. Use !stats to see your character sheet. 
        You gain exp by chatting, and fighting our dragon, Bytefire. You can use !moves to see what you can do. Use the (Learn a Move) channel point redeem to learn more moves. 
        You can play some minigames with${minigameKeys.map(x => ` !${x.toLowerCase()}`)} to earn some gems. 
        You can also !yell some text to speech at me.
        `);
    }
    else if(IsCommand(command, "leaderboard")) {
        ShowLeaderboard();
    }
    else if(IsCommand(command, "quest")) {
        if(DoesPlayerHaveQuest(player.Username)) {
            let questText = GetQuestText(player.CurrentQuest!.Type, player.CurrentQuest!.Goal);

            await client.say(process.env.CHANNEL!, `@${player.Username}, you currently have a difficulty ${player.CurrentQuest!.FiveStarDifficulty} quest to: ${questText}. Your current progress is at ${player.CurrentQuest!.Progress}/${player.CurrentQuest!.Goal}`);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you do not currently have a quest.`);
        }
    }
    else if(IsCommand(command, "levelup")) {
        if(player.LevelUpAvailable) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have a level up available! You can use !mage, !warrior, or !rogue to choose a class to level up in`);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you need more exp to level up. You get exp by chatting, fighting Bytefire, or other interactions in chat.`);
        }
    }
    else if(IsCommand(command, "shop") || IsCommand(command, "store")) {
        let shopItems = GetCurrentShopItems();
        let text = `Todays Shop:${shopItems.map((x, i) => ` (${(i + 1)}): ${x.obj} for ${x.cost} gems`)}`;

        await client.say(process.env.CHANNEL!, text);
        await client.say(process.env.CHANNEL!, `Use "!buy [objectname]" to choose something to purchase`);

        let scrollingText = `Todays Shop:\n${shopItems.map((x, i) => `${x.obj} | ${x.cost}g\n`).join('')}\nUse !shop`;
        ShowShop(scrollingText);
    }
    else if(IsCommand(command, "buy")) {
        let chosenObject = GetObjectFromInputText(command.replace("!buy", "").trim());

        if(chosenObject === undefined || chosenObject === null) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, could not find object with name ${chosenObject}`);
        }
        else {
            let shopItems = GetCurrentShopItems();
            let foundIndex = shopItems.findIndex(x => x.obj === chosenObject?.ObjectName);
            if(foundIndex !== -1) {
                let cost = shopItems[foundIndex].cost;
                if(player.SpendableGems >= cost) {
                    player.SpendableGems -= cost;
                    SavePlayer(player);

                    GivePlayerObject(client, player.Username, chosenObject.ObjectName);
                }
                else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have enough gems! You need ${(shopItems[foundIndex].cost - player.SpendableGems)} more gems.`);
                }
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, that object is not for sale!`);
            }
        }
    }
    else if(IsCommand(command, "effects")) {
        if(player.StatusEffects.length > 0) {
            let text = `@${player.Username}, you have the follow status effects active: `;
            for (let i = 0; i < player.StatusEffects.length; i++) {
                let secondsLeft = player.StatusEffects[i].EffectTimeInSeconds - GetSecondsBetweenDates(player.StatusEffects[i].WhenEffectStarted, new Date());
                text += `${AddSpacesBeforeCapitals(StatusEffect[player.StatusEffects[i].Effect])} (${secondsLeft}s)`;

                if(i < player.StatusEffects.length - 1) {
                    text += ", ";
                }
            }

            await client.say(process.env.CHANNEL!, text);
        }
        else {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have no status effects`);
        }
    }
    else if(userState['display-name']!.toLowerCase() === 'the7ark' && IsCommand(command, 'resetleaderboard')) {
        await ResetLeaderboard(client);
    }
    else if(IsCommandMinigame(command)) {
        const MAX_INSTANCES = 3;
        let activeInstances = GetUserMinigameCount(userState['display-name']!);

        if(activeInstances >= MAX_INSTANCES) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have reached the max amount of queued minigames you can do! Please wait.`);
        }
        else {
            await HandleMinigames(client, userState['display-name']!, command);
        }
    }
    else {
        await HandleMoves(client, userState, command);
    }
}

async function HandleMoves(client: Client, userState: ChatUserstate, command: string) {
    let player = LoadPlayer(userState['display-name']!);

    if(IsCommand(command, 'randomattack') && IsDragonActive) {
        let bannedMoves = [];
        for (let i = 0; i < MoveDefinitions.length; i++) {
            if(MoveDefinitions[i].Type !== MoveType.Attack || MoveDefinitions[i].DamageTypes === undefined) {
                bannedMoves.push(MoveDefinitions[i].Command);
            }
        }
        console.log(bannedMoves);

        let options = [...player.KnownMoves];

        for (let i = 0; i < bannedMoves.length; i++) {
            const index = options.indexOf(bannedMoves[i], 0);
            if (index > -1) {
                options.splice(index, 1);
            }
        }
        console.log(options);

        if(options.length > 0) {
            command = `!${GetRandomItem(options)}`;
        }
        else {
            command = `!punch`;
        }
    }

    if(IsCommand(command, 'punch') && IsDragonActive) {
        await DoDamage(client, userState['display-name']!, 1, DamageType.Bludgeoning);
        client.say(process.env.CHANNEL!, `@${userState['display-name']!} punches Bytefire for 1 bludgeoning damage!`);

        let playerSession: PlayerSessionData = LoadPlayerSession(userState['display-name']!);
        playerSession.TimesAttackedEnemy++;
        SavePlayerSession(userState['display-name']!, playerSession);
        ReduceDragonHits(client);
        return;
    }

    let any: boolean = false;
    for (let i = 0; i < player.KnownMoves.length; i++) {
        if(command.includes(`!${player.KnownMoves[i]}`)) {
            any = true;
            break;
        }
    }

    let moveAttempted: ClassMove | undefined = MoveDefinitions.find(x => IsCommand(command, x.Command));

    let isDuck = (userState['display-name']!).toLowerCase() === 'one_1egged_duck';
    let isDucksCommand = (IsCommand(command, 'duckhunt') || IsCommand(command, ' one1eghaha'));
    if(isDuck && isDucksCommand) {
        moveAttempted = {
            Command: IsCommand(command, 'duckhunt') ? 'duckhunt' : ' one1eghaha',
            Description: '',
            ClassRequired: ClassType.Rogue,
            Type: MoveType.Attack,

            HitModifier: 5,
            Damage: { min: 3, max: 25 },
            DamageTypes: [DamageType.Piercing, DamageType.Fire],
            SuccessText: [`@${userState['display-name']!} whips out duck hunt, and shoots Bytefire for {0} damage!`],
        };
    }

    if(!isDuck && !isDucksCommand) {
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
    }


    if(moveAttempted !== undefined) {
        if(IsCommandOnCooldown(player.Username, moveAttempted!.Command!)) {
            let cooldownSecondsLeft = GetCommandCooldownTimeLeftInSeconds(player.Username, moveAttempted!.Command!);

            await client.say(process.env.CHANNEL!, `@${userState['display-name']!}, this move is currently on cooldown! You can do this again in ${cooldownSecondsLeft} seconds.`);
            return;
        }

        if(player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level > 0) {
            switch (moveAttempted.Type) {
                case MoveType.Attack:
                    await HandleMoveAttack(client, moveAttempted, player, userState['display-name']!, command);
                    break;
                case MoveType.Heal:
                    await HandleMoveHeal(client, moveAttempted, player, userState['display-name']!, command);
                    break;
                case MoveType.PlaySound:
                    handleMovePlaySound(client, moveAttempted, userState['display-name']!, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.ChangeMonitorRotation:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    await HandleMoveMonitorRotation(client, moveAttempted, userState['display-name']!, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.DarkenMonitor:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    await HandleMoveMonitorDarken(client, moveAttempted, userState['display-name']!, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.SayAllChat:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', userState['display-name']!));
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    SayAllChat = true;
                    setTimeout(() => {
                        SayAllChat = false;
                    }, 60 * 1000 * 5);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    HandleTimeout(command);
                    break;
                case MoveType.TeleportCameraRandomly:
                    await HandleRandomCameraTeleport(client, moveAttempted, userState['display-name']!);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }

                    HandleTimeout(command);
                    break;
                case MoveType.Silence:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', userState['display-name']!));
                    PlaySound(GetRandomItem([
                        "SilentMusic1",
                        "SilentMusic2",
                        "SilentMusic3",
                    ])!, AudioType.UserGameActions);

                    let sceneName = await GetOpenScene();

                    let doFilter = true;
                    let cameraToFilter = "Small Camera";
                    if(!await DoesSceneContainItem(sceneName, cameraToFilter)) {
                        cameraToFilter = "Full Camera";
                    }
                    if(!await DoesSceneContainItem(sceneName, cameraToFilter)) {
                        doFilter = false;
                    }

                    if(doFilter) {
                        await SetFilterEnabled(cameraToFilter, "Silenced", true);
                    }

                    await SetAudioMute("Mic/Aux", true);
                    setTimeout(async () => {
                        await SetAudioMute("Mic/Aux", false);

                        if(doFilter) {
                            await SetFilterEnabled(cameraToFilter, "Silenced", false);
                        }
                    }, 15 * 1000);

                    HandleTimeout(command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.GainHPOnCrit:
                    await HandleGainHPOnCritTemporarily(client, moveAttempted, userState['display-name']!, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
            }

        }
        else {
            client.say(process.env.CHANNEL!, `@${userState['display-name']!}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
        }
    }
}

async function HandleMoveHeal(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    let pieces = command.trim().split(' ');

    if(pieces.length <= 1){
        await client.say(process.env.CHANNEL!, `@${player.Username}, you need to specify a target to heal. Ex. !heal @the7ark`);
        return;
    }

    let otherPlayer = TryLoadPlayer(pieces[1].replace("@", ""));

    if(otherPlayer === null) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, could not find player with the username ${pieces[1].replace("@", "")}`);
        return;
    }

    if(otherPlayer?.Username == player.Username) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you cannot heal yourself, only others. This is the burden of a cleric.`);
        return;
    }

    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
    }

    await SetLightColor(0, 1, 0, 0);
    await SetLightBrightness(1, 0);
    setTimeout(async () => {
        await FadeOutLights();
    }, 2000);

    let healAmount = GetRandomIntI(moveAttempted.HealAmount!.min, moveAttempted.HealAmount!.max);

    let successText = GetRandomItem(moveAttempted.SuccessText)!
        .replace('{name}', username)
        .replace(`{target}`, otherPlayer.Username)
        .replace(`{0}`, Math.abs(healAmount).toString());
    await client.say(process.env.CHANNEL!, successText);
    await ChangePlayerHealth(client, otherPlayer!.Username, healAmount, DamageType.None);
}

async function HandleMoveAttack(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    if(!IsDragonActive) {
        return;
    }

    let isUsingObject = false
    if(player.EquippedObject !== undefined) {
        let obj = GetObjectFromInputText(player.EquippedObject.ObjectName);
        if(obj !== undefined) {
            isUsingObject = obj!.ClassRestrictions!.includes(moveAttempted.ClassRequired);
        }
    }

    //Try to hit
    let rollToHit = GetRandomIntI(1, 20);
    let extraRollAddition = 0;
    let wasCrit = rollToHit == 20;

    extraRollAddition = Math.round(player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level / 5) + moveAttempted.HitModifier;

    let isDrunk = DoesPlayerHaveStatusEffect(username, StatusEffect.Drunk);
    if(isDrunk) {
        extraRollAddition += GetRandomIntI(-10, 10);
    }

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleAccuracy)) {
        extraRollAddition = (rollToHit + extraRollAddition) * 2;
    }

    let dragonAc = GetRandomIntI(10, 17);

    let rollDisplay = `${rollToHit + extraRollAddition} (${rollToHit} + ${extraRollAddition})`;

    if(rollToHit === 1) {
        rollDisplay = "a NATURAL ONE and hit themselves";
    }
    else if(rollToHit === 20) {
        rollDisplay = "a NATURAL TWENTY";
    }

    if(rollToHit + extraRollAddition < dragonAc || rollToHit === 1) {
        client.say(process.env.CHANNEL!, `@${username} missed rolling ${rollDisplay}, they needed at least ${dragonAc}`);

        if(rollToHit === 1) {
            if(moveAttempted.Damage === undefined) {
                await ChangePlayerHealth(client, username, -Math.round(GetRandomIntI(25, 50)), GetRandomItem(moveAttempted.DamageTypes!)!);
            }
            else {
                await ChangePlayerHealth(client, username, -Math.round(GetRandomIntI(moveAttempted.Damage?.min!, moveAttempted.Damage?.max!) / 2), GetRandomItem(moveAttempted.DamageTypes!)!);
            }
        }

        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        SavePlayerSession(username, playerSession);
        ReduceDragonHits(client);
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
                let inventoryObject: InventoryObject = GetObjectFromInputText(objectThrown)!;

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
            await ChangePlayerHealth(client, targetPlayer.Username, Math.round(scaledDamage), DamageType.Bludgeoning, `@${username} tossed an object at them`);
            return;
        }


        let extraObjectDamageInfo: {
            damage: number,
            damageType: DamageType
        } | undefined;
        let extraObjectName = "";
        if(isUsingObject) {
            let obj = await GetObjectFromInputText(player.EquippedObject!.ObjectName)!;
            if(obj !== undefined && obj.ObjectAttackAction !== undefined) {
                extraObjectDamageInfo = await obj.ObjectAttackAction(client, player);
                extraObjectName = GetObjectFromInputText(player.EquippedObject!.ObjectName)!.ContextualName;

                if(extraObjectDamageInfo.damage > 0) {
                    player.EquippedObject!.RemainingDurability--;
                    if(player.EquippedObject!.RemainingDurability <= 0) {
                        TakeObjectFromPlayer(player.Username, player.EquippedObject!.ObjectName);

                        client.say(process.env.CHANNEL!, `@${username}, your ${player.EquippedObject!.ObjectName} ran out of durability and broke!`);
                        player.EquippedObject = undefined;
                    }

                    SavePlayer(player);
                }
            }
        }

        let damageTypeDealt: DamageType = moveAttempted.DamageTypes === undefined ? DamageType.None : GetRandomItem(moveAttempted.DamageTypes!)!;

        if(damageTypeDealt === DamageType.None) {
            console.error("Did none damage type on move " + moveAttempted.Command)
        }

        let allDamageTypesDealt: Array<DamageType> = [damageTypeDealt];

        let drunkDamageModifier = 0.3;
        let adjustedDrunkDamage = Math.floor(scaledDamage * drunkDamageModifier);
        if(isDrunk) {
            if(GetRandomIntI(1, 3) == 1) {
                //If you're drunk, chance to hit self
                await client.say(process.env.CHANNEL!, `@${username} was so drunk they hit themselves for ${DamageType[adjustedDrunkDamage]} ${damageTypeDealt} damage!`);

                await ChangePlayerHealth(client, username, -adjustedDrunkDamage, damageTypeDealt);
                return;
            }
            else {
                scaledDamage += adjustedDrunkDamage;
            }
        }

        // Apply the damage
        let dragonDead = await DoDamage(client, username, Math.round(scaledDamage), damageTypeDealt, false);

        let poisonDamage = Math.max(1, Math.round(scaledDamage * 0.2));
        if(isBytefirePoisoned && scaledDamage > 0) {
            if(!dragonDead) {
                dragonDead = await DoDamage(client, username, Math.round(poisonDamage), DamageType.Poison, false);
            }

            if(!allDamageTypesDealt.includes(DamageType.Poison)) {
                allDamageTypesDealt.push(DamageType.Poison);
            }
        }

        if(isUsingObject && extraObjectDamageInfo !== undefined && extraObjectDamageInfo.damage > 0) {
            if(!dragonDead) {
                dragonDead = await DoDamage(client, username, Math.round(extraObjectDamageInfo.damage), extraObjectDamageInfo.damageType, false);
            }

            if(!allDamageTypesDealt.includes(extraObjectDamageInfo.damageType)) {
                allDamageTypesDealt.push(extraObjectDamageInfo.damageType);
            }
        }

        if(scaledDamage < 0) {
            finalSuccessText = finalSuccessText.replace("{0} damage", "{0} healing");
        }

        scaledDamage = await GetAdjustedDamage(client, scaledDamage, damageTypeDealt);
        
        finalSuccessText = finalSuccessText
            .replace('{0}', `${Math.abs(scaledDamage).toString()} ${DamageType[damageTypeDealt].toLowerCase()}`)
            .replace('{name}', username)
            .replace("{roll}", rollDisplay);

        if(isBytefirePoisoned) {
            poisonDamage = await GetAdjustedDamage(client, poisonDamage, DamageType.Poison);
            finalSuccessText += ` He took an extra ${poisonDamage} poison damage.`;
        }

        if(isUsingObject && extraObjectDamageInfo !== undefined) {
            let damageDisplay = extraObjectDamageInfo.damage;
            damageDisplay = await GetAdjustedDamage(client, extraObjectDamageInfo.damage, extraObjectDamageInfo.damageType);

            finalSuccessText += ` Your attack with ${extraObjectName} did an extra ${damageDisplay} ${DamageType[extraObjectDamageInfo.damageType].toLowerCase()} damage!`;
        }

        if(isDrunk) {
            finalSuccessText += `Your drunk energy did an extra ${adjustedDrunkDamage} damage!`;
        }
        
        if(wasCrit) {
            finalSuccessText = `It's a critical hit! ${finalSuccessText}`;

            if(gainHPOnCrit) {
                await ChangePlayerHealth(client, player.Username, Math.round(scaledDamage), DamageType.None);
            }
        }

        ReduceDragonHits(client);

        if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
            TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
        }

        client.say(process.env.CHANNEL!, finalSuccessText);

        let damageText = ``;
        for (let i = 0; i < allDamageTypesDealt.length; i++) {
            let text = GetDamageTypeText(allDamageTypesDealt[i]);
            if(text != '') {
                damageText += text + ' ';
            }
        }

        client.say(process.env.CHANNEL!, damageText);

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
    PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);

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
    await MakeRainbowLights(15);

    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    HandleTimeout(command);
}

async function HandleGainHPOnCritTemporarily(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
    }

    let textSaid = command.replace("!heroic speech", "").trim()
    if(textSaid.length > 3) {
        let player = LoadPlayer(username);
        PlayTextToSpeech(textSaid, AudioType.UserTTS, TryGetPlayerVoice(player));
    }

    gainHPOnCrit = true;
    setTimeout(() => {
        gainHPOnCrit = false;
    }, 1000 * 60 * 5)
}

async function HandleRandomCameraTeleport(client: Client, moveAttempted: ClassMove, username: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
    }

    let sceneName = await GetOpenScene();

    let itemToTeleport = "Small Camera";
    if(!await DoesSceneContainItem(sceneName, itemToTeleport)) {
        itemToTeleport = "Full Camera";
    }
    if(!await DoesSceneContainItem(sceneName, itemToTeleport)) {
        return;
    }

    let ogScale = await GetObsSourceScale(itemToTeleport);
    let ogPos = await GetObsSourcePosition(itemToTeleport);

    let minScale = 0.5;
    let maxScale = 1.7;

    let xScale = GetRandomNumber(minScale, maxScale);
    let yScale = GetRandomNumber(minScale, maxScale);

    // let extreme = getRandomIntI(1, 3) == 1;
    // if(!extreme) {
    //     yScale = getRandomNumber(xScale * 0.9, xScale * 1.1);
    // }

    let newX = ogScale.x * xScale;
    let newY = ogScale.y * yScale;

    await SetLightColor(1, 0.3, 1);
    await SetLightBrightness(1);

    await SetObsSourceScale(itemToTeleport, newX, newY);

    setTimeout(async () => {
        let currentDim = await GetObsSourcePosition(itemToTeleport);

        await SetObsSourcePosition(itemToTeleport, GetRandomIntI(currentDim.width, SCENE_WIDTH - currentDim.width), GetRandomIntI(currentDim.height, SCENE_HEIGHT - currentDim.height));

        setTimeout(async () => {
            await GetObsSourcePosition(itemToTeleport)
            await SetObsSourcePosition(itemToTeleport, ogPos.x, ogPos.y);
            await SetObsSourceScale(itemToTeleport, ogScale.x, ogScale.y);

            await FadeOutLights();

        }, 1000 * 15)
    }, 50);
}

async function HandleMoveMonitorDarken(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    await SetLightBrightness(0);
    await SetMonitorBrightnessContrastTemporarily(0, 20);

    setTimeout(async () => {
        await FadeOutLights();
    }, 20 * 1000)

    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));

    HandleTimeout(command);
}

function GetPlayerStatsDisplay(player: Player): string {
    let classesAbove0 = 0;
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Level > 0) {
            classesAbove0++;
        }
    }

    let currClassCount = 0;
    let final = `@${player.Username} is level ${player.Level}.`;
    if(player.Level > 0) {
        final += " They are ";
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
        final += ` They have a level up available.`;
    }

    if(player.EquippedObject !== undefined) {
        final += ` Their equipped ${player.EquippedObject!.ObjectName} has a durability left of ${player.EquippedObject!.RemainingDurability}.`;
    }

    final += ` They've died ${player.Deaths} times! [${player.CurrentExp}/${player.CurrentExpNeeded}]EXP [${player.CurrentHealth}/${CalculateMaxHealth(player)}]HP`;

    return final;
}

export function IsCommand(message: string, command: string): boolean {
    return message.toLowerCase() === `!${command}` || message.toLowerCase().includes(`!${command} `);
}
