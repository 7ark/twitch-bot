import {Client} from "tmi.js";
import {
    AddStatusEffectToPlayer,
    ChangePlayerHealth,
    DoesPlayerHaveStatusEffect,
    DoPlayerUpgrade,
    GetCommandCooldownTimeLeftInSeconds,
    GetObjectFromInputText,
    GetPlayerStatsDisplay,
    GetUpgradeOptions,
    GiveExp,
    GivePlayerObject,
    IsCommandOnCooldown,
    LevelUpPlayer,
    LoadAllPlayers,
    LoadPlayer,
    SavePlayer,
    SelectPlayerUpgrade,
    TakeObjectFromPlayer,
    TriggerCommandCooldownOnPlayer,
    TryLoadPlayer
} from "./playerGameUtils";
import {Broadcast} from "../bot";
import {
    AddSpacesBeforeCapitals,
    GetNumberWithOrdinal,
    GetRandomInt,
    GetRandomIntI,
    GetRandomItem,
    GetRandomNumber,
    GetSecondsBetweenDates,
    GetUpgradeDescription, IsCommand
} from "./utils";
import fs from "fs";
import {GetMove, MoveDefinitions} from "../movesDefinitions";
import {AllInventoryObjects, DoesPlayerHaveObject, InventoryObject} from "../inventoryDefinitions";
import {
    DoesSceneContainItem,
    GetObsSourcePosition,
    GetObsSourceScale,
    GetOpenScene,
    GetSceneItemEnabled,
    SCENE_HEIGHT,
    SCENE_WIDTH,
    SetAudioMute,
    SetFilterEnabled,
    SetObsSourcePosition,
    SetObsSourceScale,
    SetSceneItemEnabled,
    SetTextValue
} from "./obsutils";
import {CurrentGTARider, IsMonsterActive, SayAllChat} from "../globals";
import {
    GetStringifiedSessionData,
    LoadPlayerSession,
    PlayerSessionData,
    SavePlayerSession
} from "./playerSessionUtils";
import {
    DamageType,
    DoDamageToMonster,
    GetAdjustedDamage,
    GetDamageTypeText,
    LoadMonsterData,
    ReduceMonsterHits,
    StunMonster
} from "./monsterUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice, TryToSetVoice} from "./audioUtils";
import {SetMonitorBrightnessContrastTemporarily, SetMonitorRotationTemporarily} from "./displayUtils";
import {DrunkifyText, GetLastParameterFromCommand} from "./messageUtils";
import {
    GetCurrentShopItems,
    HandleMinigames,
    IsCommandMinigame,
    MinigameType,
    ResetLeaderboard,
    ShowLeaderboard,
    ShowShop
} from "./minigameUtils";
import {DoesPlayerHaveQuest, GetQuestText} from "./questUtils";
import {AudioType} from "../streamSettings";
import {FadeOutLights, MakeRainbowLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {WhisperUser} from "./twitchUtils";
import {GetUserMinigameCount} from "../actionqueue";
import {Affliction, ClassMove, ClassType, MoveType, Player, StatusEffect, UpgradeType} from "../valueDefinitions";
import {PlayHypeTrainAlert} from "./chatGamesUtils";
import {isNaN} from "@tensorflow/tfjs-node";
import {UpgradeDefinitions} from "../upgradeDefinitions";
import {
    ExchangeCoinsForGems,
    ExchangeGemsForCoins,
    GetBankStatusText,
    GetExchangeRateText,
    LoadBankData,
    SaveBankData,
    UpdateExchangeRate
} from "./bankUtils";
import {COMMAND_DEFINITIONS, CommandDefinition} from "../commandDefinitions";

interface CooldownInfo {
    gracePeriod: number,
    cooldown: number,
    isInGracePeriod: boolean,
    showCooldownMessage: boolean,
    lastTimeCooldownTriggered: Date
}

let cooldowns: Map<string, CooldownInfo> = new Map<string, CooldownInfo>([
    ["battlecry", {
        gracePeriod: 30000, //30 seconds
        cooldown: 15 * 60, //15 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["cast confusion", {
        gracePeriod: 0,
        cooldown: 15 * 60, //15 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["cast teleport", {
        gracePeriod: 0,
        cooldown: 5 * 60, //5 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["shroud", {
        gracePeriod: 0,
        cooldown: 15 * 60, //15 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["inspire", {
        gracePeriod: 0,
        cooldown: 15 * 60, //15 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["silence", {
        gracePeriod: 0,
        cooldown: 15 * 60, //15 minutes
        isInGracePeriod: false,
        showCooldownMessage: true,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["info", {
        gracePeriod: 0,
        cooldown: 5 * 60, //5 minutes
        isInGracePeriod: false,
        showCooldownMessage: false,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
    ["help", {
        gracePeriod: 0,
        cooldown: 5 * 60, //5 minutes
        isInGracePeriod: false,
        showCooldownMessage: false,
        lastTimeCooldownTriggered: new Date('1900-01-01')
    }],
]);

export let BattlecryStarted: boolean = false;
export let CreditsGoing: boolean = false;

let gainHPOnCrit: boolean = false;
let isMonsterPoisoned: boolean = false;
let disabled: boolean = false;

//GTA SHIT


function HandleTimeout(command: string) {
    cooldowns.forEach((val, key) => {
        if(IsCommand(command, key) && !val.isInGracePeriod) {
            val.isInGracePeriod = true;
            cooldowns.set(key, val);

            setTimeout(() => {
                val.lastTimeCooldownTriggered = new Date();
                // val.isOnTimeout = true;
                // val.isInGracePeriod = false;
                // cooldowns.set(key, val);
                // setTimeout(() => {
                //     val.isOnTimeout = false;
                //     cooldowns.set(key, val);
                //
                //     if(key == 'battlecry') {
                //         BattlecryStarted = false;
                //     }
                //
                // }, val.cooldown * CurrentStreamSettings.cooldownMultiplier);
                SaveCurrentCooldownInfo();
            }, val.gracePeriod);
        }
    })
}

function SaveCurrentCooldownInfo() {
    let covertedCooldowns: Array<{ command: string, date: Date}> = [];
    cooldowns.forEach((val, key) => {
        covertedCooldowns.push({
            command: key,
            date: val.lastTimeCooldownTriggered
        });
    })
    fs.writeFileSync('commandcooldowns.json', JSON.stringify(covertedCooldowns));
}

function LoadCurrentCooldownInfo() {
    if(fs.existsSync('commandcooldowns.json')) {
        let convertedCooldowns: Array<{ command: string, date: Date}> = JSON.parse(fs.readFileSync('commandcooldowns.json', 'utf-8'));

        convertedCooldowns.forEach((val) => {
            let data = cooldowns.get(val.command);
            if(data !== undefined) {
                data.lastTimeCooldownTriggered = val.date;
                cooldowns.set(val.command, data);
            }
        })
    }
}

LoadCurrentCooldownInfo();

export async function ProcessUniqueCommands(client: Client, displayName: string, command: string): Promise<boolean> {
    let player = LoadPlayer(displayName);

    if(IsCommandMinigame(command)) {
        const MAX_INSTANCES = 3;
        let activeInstances = GetUserMinigameCount(displayName);

        if(activeInstances >= MAX_INSTANCES) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have reached the max amount of queued minigames you can do! Please wait.`);
        }
        else {
            await HandleMinigames(client, displayName, command);
        }

        return true;
    }

    return false;
}

export async function ProcessCommands(client: Client, displayName: string, command: string) {
    if(IsCommand(command, 'disable')) {
        disabled = true;
    }
    else if(IsCommand(command, 'enable')) {
        disabled = false;
    }

    if(CreditsGoing || disabled){
        return;
    }
    // console.log(command + " vs " + cleanMessage(command));

    let onTimeout: string = '';
    let showCooldownMsg = false;
    let secondsLeft = 0;
    cooldowns.forEach((val, key) => {
        let valSecondsLeft = val.cooldown - GetSecondsBetweenDates(val.lastTimeCooldownTriggered, new Date());
        if(valSecondsLeft <= 0) {
            SaveCurrentCooldownInfo();
        }

        let isTheCommand = IsCommand(command, key);
        if(valSecondsLeft > 0 && isTheCommand) {
            onTimeout = key;
            secondsLeft = valSecondsLeft;
            showCooldownMsg = val.showCooldownMessage;
        }
    })

    if(onTimeout !== '') {
        if(showCooldownMsg) {
            await client.say(process.env.CHANNEL!, `${onTimeout} is on cooldown for another ${secondsLeft} seconds!`);
        }
        return;
    }

    let player = LoadPlayer(displayName);

    let validDef: CommandDefinition | undefined = undefined;
    for (let i = 0; i < COMMAND_DEFINITIONS.length; i++) {
        let commandDef = COMMAND_DEFINITIONS[i];
        if(commandDef.Commands.length == 0) {
            if(commandDef.CommandVerification != undefined && await commandDef.CommandVerification(command)) {
                validDef = commandDef;
                break;
            }
        }

        for (let j = 0; j < commandDef.Commands.length; j++) {
            if(IsCommand(command, commandDef.Commands[j])) {
                if(commandDef.CommandVerification == undefined || await commandDef.CommandVerification(command)) {
                    validDef = commandDef;
                    break;
                }
            }
        }

        if(validDef != undefined) {
            break;
        }
    }

    if(validDef != undefined) {
        if(!validDef.AdminCommand || player.Username.toLowerCase() === "the7ark") {
            await validDef.Action(client, player, command);
        }
    }
    else {
        await HandleMoves(client, displayName, command);
    }
}

async function HandleMoves(client: Client, displayName: string, command: string) {
    let player = LoadPlayer(displayName);

    if(IsCommand(command, 'randomattack') && IsMonsterActive) {
        let bannedMoves = [];
        for (let i = 0; i < MoveDefinitions.length; i++) {
            if(MoveDefinitions[i].Type !== MoveType.Attack || MoveDefinitions[i].DamageTypes === undefined) {
                bannedMoves.push(MoveDefinitions[i].Command);
            }
        }

        let options = [...player.KnownMoves];

        for (let i = 0; i < bannedMoves.length; i++) {
            const index = options.indexOf(bannedMoves[i], 0);
            if (index > -1) {
                options.splice(index, 1);
            }
        }

        if(options.length > 0) {
            command = `!${GetRandomItem(options)}`;
            await client.say(process.env.CHANNEL!, `@${displayName}, you randomly chose ${command}`);
        }
        else {
            command = `!punch`;
        }
    }

    // if(IsCommand(command, 'punch') && IsDragonActive) {
    //     await DoDamageToMonster(client, displayName, 1, DamageType.Bludgeoning);
    //     client.say(process.env.CHANNEL!, `@${displayName} punches Bytefire for 1 bludgeoning damage!`);
    //
    //     let playerSession: PlayerSessionData = LoadPlayerSession(displayName);
    //     playerSession.TimesAttackedEnemy++;
    //     SavePlayerSession(displayName, playerSession);
    //     ReduceMonsterHits(client);
    //     return;
    // }

    let any: boolean = false;
    for (let i = 0; i < player.KnownMoves.length; i++) {
        if(command.includes(`!${player.KnownMoves[i]}`)) {
            any = true;
            break;
        }
    }

    let moveAttempted: ClassMove | undefined = MoveDefinitions.find(x => IsCommand(command.toLowerCase(), x.Command));

    let isDuck = (displayName).toLowerCase() === 'one_1egged_duck';
    let isDucksCommand = (IsCommand(command, 'duckhunt') || IsCommand(command, ' one1eghaha'));
    if(isDuck && isDucksCommand) {
        moveAttempted = {
            Command: IsCommand(command, 'duckhunt') ? 'duckhunt' : ' one1eghaha',
            Description: '',
            ClassRequired: ClassType.Rogue,
            Type: MoveType.Attack,
            MovePointsToUnlock: 0,

            HitModifier: 5,
            Damage: { min: 3, max: 25 },
            DamageTypes: [DamageType.Piercing, DamageType.Fire],
            SuccessText: [`@${displayName} whips out duck hunt, and shoots The Pumpkin Lord for {0} damage!`],
        };
    }

    if(!isDuck && !isDucksCommand) {
        if(!any) {
            if(moveAttempted !== undefined && moveAttempted.ClassRequired !== undefined) {
                let playerRelevantClass = player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!;
                if(playerRelevantClass.Level > 0) {
                    if(moveAttempted?.LevelRequirement > 0 && playerRelevantClass.Level < moveAttempted?.LevelRequirement) {
                        client.say(process.env.CHANNEL!, `@${displayName}, you don't know that move. You need to be a level ${moveAttempted?.LevelRequirement} ${ClassType[playerRelevantClass.Type]} to learn this move.`);
                    }
                    else {
                        client.say(process.env.CHANNEL!, `@${displayName}, you don't know that move. You now learn upgrades and moves when leveling up.`);
                    }
                }
                else {
                    client.say(process.env.CHANNEL!, `@${displayName}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
                }
            }
            return;
        }
    }


    if(moveAttempted !== undefined) {
        if(IsCommandOnCooldown(player.Username, moveAttempted!.Command!)) {
            let cooldownSecondsLeft = GetCommandCooldownTimeLeftInSeconds(player.Username, moveAttempted!.Command!);

            await client.say(process.env.CHANNEL!, `@${displayName}, this move is currently on cooldown! You can do this again in ${cooldownSecondsLeft} seconds.`);
            return;
        }

        if(moveAttempted.ClassRequired === undefined || player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level > 0) {
            switch (moveAttempted.Type) {
                case MoveType.Attack:
                    await HandleMoveAttack(client, moveAttempted, player, displayName, command);
                    break;
                case MoveType.Heal:
                    await HandleMoveHeal(client, moveAttempted, player, displayName, command);
                    break;
                case MoveType.GiveBuff:
                    await HandleMoveGiveBuff(client, moveAttempted, player, displayName, command);
                    break;
                case MoveType.PlaySound:
                    handleMovePlaySound(client, moveAttempted, displayName, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.ChangeMonitorRotation:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    await HandleMoveMonitorRotation(client, moveAttempted, displayName, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.DarkenMonitor:
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    await HandleMoveMonitorDarken(client, moveAttempted, displayName, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
                case MoveType.SayAllChat:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', displayName));
                    if(moveAttempted.SoundFile !== undefined && moveAttempted.SoundFile !== '') {
                        PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);
                    }
                    SayAllChat = true;
                    setTimeout(() => {
                        SayAllChat = false;
                    }, 60 * 1000);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    HandleTimeout(command);
                    break;
                case MoveType.TeleportCameraRandomly:
                    await HandleRandomCameraTeleport(client, moveAttempted, displayName);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }

                    HandleTimeout(command);
                    break;
                case MoveType.Silence:
                    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', displayName));
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
                    await HandleGainHPOnCritTemporarily(client, moveAttempted, displayName, command);

                    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
                        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
                    }
                    break;
            }

        }
        else {
            client.say(process.env.CHANNEL!, `@${displayName}, you need to be a ${ClassType[moveAttempted?.ClassRequired]} to use that ability.`);
        }
    }
}

async function HandleMoveHeal(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    let pieces = command.trim().split(' ');

    if(pieces.length <= 1){
        await client.say(process.env.CHANNEL!, `@${player.Username}, you need to specify a target to heal. Ex. !${moveAttempted.Command} @the7ark`);
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

    let otherPlayerSession = LoadPlayerSession(otherPlayer.Username);
    if(otherPlayerSession.AttackedEnemySinceDeath) {
        setTimeout(() => {
            let playerSession: PlayerSessionData = LoadPlayerSession(username);
            playerSession.TimesAttackedEnemy++;
            playerSession.AttackedEnemySinceDeath = true;
            SavePlayerSession(username, playerSession);
        }, 10);
    }

    await SetLightColor(0, 1, 0, 0);
    await SetLightBrightness(1, 0);
    setTimeout(async () => {
        await FadeOutLights();
    }, 2000);

    let healAmount = GetRandomIntI(moveAttempted.HealAmount!.min, moveAttempted.HealAmount!.max);

    DoPlayerUpgrade(username, UpgradeType.StrongerHealing, (upgrade, strength, strengthPercentage) => {
        healAmount += Math.floor(healAmount * strengthPercentage);
    });

    let successText = GetRandomItem(moveAttempted.SuccessText)!
        .replace('{name}', username)
        .replace(`{target}`, otherPlayer.Username)
        .replace(`{0}`, Math.abs(healAmount).toString());
    await client.say(process.env.CHANNEL!, successText);
    await ChangePlayerHealth(client, otherPlayer!.Username, healAmount, DamageType.None);
}

async function HandleMoveGiveBuff(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    let target = GetLastParameterFromCommand(command);

    if(target == ""){
        await client.say(process.env.CHANNEL!, `@${player.Username}, you need to specify a target to buff. Ex. !${moveAttempted.Command} @the7ark`);
        return;
    }

    let otherPlayer = TryLoadPlayer(target.replace("@", ""));

    if(otherPlayer === null) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, could not find player with the username ${pieces[1].replace("@", "")}`);
        return;
    }

    if(otherPlayer?.Username == player.Username) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you cannot buff yourself, only others. This is the burden of a cleric.`);
        return;
    }

    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
    }

    let otherPlayerSession = LoadPlayerSession(otherPlayer.Username);
    if(otherPlayerSession.AttackedEnemySinceDeath) {
        setTimeout(() => {
            let playerSession: PlayerSessionData = LoadPlayerSession(username);
            playerSession.TimesAttackedEnemy++;
            playerSession.AttackedEnemySinceDeath = true;
            SavePlayerSession(username, playerSession);
        }, 10);
    }

    await SetLightColor(0.5, 0, 0.3, 0);
    await SetLightBrightness(1, 0);
    setTimeout(async () => {
        await FadeOutLights();
    }, 2000);

    AddStatusEffectToPlayer(otherPlayer.Username, moveAttempted.BuffToGive!, moveAttempted.BuffLengthInSeconds!);

    let successText = GetRandomItem(moveAttempted.SuccessText)!
        .replace('{name}', username)
        .replace(`{target}`, otherPlayer.Username)
        .replace(`{0}`, Math.abs(moveAttempted.BuffLengthInSeconds!).toString());
    await client.say(process.env.CHANNEL!, successText);
}

async function HandleMoveAttack(client: Client, moveAttempted: ClassMove, player: Player, username: string, command: string) {
    if(!IsMonsterActive) {
        return;
    }

    let isUsingObject = false
    if(player.EquippedObject !== undefined && moveAttempted.ClassRequired !== undefined) {
        let obj = GetObjectFromInputText(player.EquippedObject.ObjectName);
        if(obj !== undefined) {
            isUsingObject = obj!.ClassRestrictions!.includes(moveAttempted.ClassRequired);
        }
    }

    //Try to hit
    let rollToHit = GetRandomIntI(1, 20);

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleAccuracy)) {
        let advantageRoll = GetRandomIntI(1, 20);
        if(advantageRoll > rollToHit) {
            rollToHit = advantageRoll;
        }
    }

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.RandomAccuracy)) {
        rollToHit += GetRandomIntI(-10, 10);
    }

    let extraRollAddition = moveAttempted.HitModifier ?? 0;
    let wasCrit = rollToHit >= 20;
    if(!wasCrit && DoesPlayerHaveStatusEffect(username, StatusEffect.BetterChanceToCrit)) {
        wasCrit = rollToHit >= 18;
    }
    
    if(!wasCrit) {
        DoPlayerUpgrade(username, UpgradeType.CriticalHitChance, async (upgrade, strength, strengthPercentage) => {
            if(GetRandomIntI(0, 100) <= strength) {
                wasCrit = true;
            }
        });
    }

    if(moveAttempted.ClassRequired !== undefined) {
        extraRollAddition += Math.round(player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level / 5);
    }

    DoPlayerUpgrade(username, UpgradeType.ChangeHitModifier, async (upgrade, strength, strengthPercentage) => {
        extraRollAddition += strength;
    });

    let isDrunk = DoesPlayerHaveStatusEffect(username, StatusEffect.Drunk);
    if(isDrunk) {
        extraRollAddition += GetRandomIntI(-10, 10);
    }

    let monsterInfo = LoadMonsterData();
    let monsterArmor = monsterInfo.CurrentArmor;

    let rollDisplay = `${rollToHit + extraRollAddition} (${rollToHit} + ${extraRollAddition})`;

    if(rollToHit === 1) {
        rollDisplay = "a NATURAL ONE and hit themselves";
    }
    else if(rollToHit === 20) {
        rollDisplay = "a NATURAL TWENTY";
    }

    if(moveAttempted.PersonalMoveCooldownInSeconds !== undefined) {
        TriggerCommandCooldownOnPlayer(player.Username, moveAttempted.Command, moveAttempted.PersonalMoveCooldownInSeconds);
    }

    if(rollToHit + extraRollAddition < monsterArmor || rollToHit === 1) {
        client.say(process.env.CHANNEL!, `@${username} missed rolling ${rollDisplay}, they needed at least ${monsterArmor}`);

        player.HitStreak = 0;
        SavePlayer(player);

        if(rollToHit === 1) {
            if(moveAttempted.Damage === undefined) {
                await ChangePlayerHealth(client, username, -Math.round(GetRandomIntI(25, 50)), GetRandomItem(moveAttempted.DamageTypes!)!);
            }
            else {
                await ChangePlayerHealth(client, username, -Math.round(GetRandomIntI(moveAttempted.Damage?.min!, moveAttempted.Damage?.max!) / 2), GetRandomItem(moveAttempted.DamageTypes!)!);
            }
        }

        setTimeout(() => {
            let playerSession: PlayerSessionData = LoadPlayerSession(username);
            playerSession.TimesAttackedEnemy++;
            playerSession.AttackedEnemySinceDeath = true;
            SavePlayerSession(username, playerSession);
        }, 10);
        ReduceMonsterHits(client);
    }
    else {
        let baseDamage: number = 0;

        let finalSuccessText = GetRandomItem(moveAttempted.SuccessText)!;
        let targetPlayer: Player | undefined = undefined;

        let monsterStats = LoadMonsterData().Stats;
        while(finalSuccessText.includes("{monster}")) {
            finalSuccessText = finalSuccessText.replace("{monster}", monsterStats.Name);
        }

        let damageTypeDealt: DamageType = moveAttempted.DamageTypes === undefined ? DamageType.None : GetRandomItem(moveAttempted.DamageTypes!)!;

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

                damageTypeDealt = DamageType.Bludgeoning;

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
            isMonsterPoisoned = true;
            setTimeout(() => {
                isMonsterPoisoned = false;
            }, 1000 * 60);
        }

        let maxMultiplier = 3; // Targeting a 3x increase at level 100

        let playerLevel = moveAttempted.ClassRequired === undefined ? 1 : player.Classes.find(x => x.Type === moveAttempted?.ClassRequired)!.Level;

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

        if(damageTypeDealt === DamageType.None) {
            console.error("Did none damage type on move " + moveAttempted.Command)
        }

        let allDamageTypesDealt: Array<DamageType> = [damageTypeDealt];

        let drunkDamageModifier = 0.3;
        let adjustedDrunkDamage = Math.floor(scaledDamage * drunkDamageModifier);
        if(isDrunk) {
            if(GetRandomIntI(1, 3) == 1) {
                //If you're drunk, chance to hit self
                await client.say(process.env.CHANNEL!, `@${username} was so drunk they hit themselves for ${adjustedDrunkDamage} ${DamageType[damageTypeDealt]} damage!`);

                await ChangePlayerHealth(client, username, -adjustedDrunkDamage, damageTypeDealt);
                return;
            }
            else {
                scaledDamage += adjustedDrunkDamage;
            }
        }

        player.HitStreak++;
        SavePlayer(player);

        DoPlayerUpgrade(username, UpgradeType.ConsecutiveDamage, async (upgrade, strength, strengthPercentage) => {
            let extraDamage = Math.round(scaledDamage * strengthPercentage);
            scaledDamage += extraDamage * (player.HitStreak - 1);
        });
        
        if(moveAttempted.ClassRequired === ClassType.Mage) {    
            DoPlayerUpgrade(username, UpgradeType.MoreMageDamage, async (upgrade, strength, strengthPercentage) => {
                scaledDamage += scaledDamage * strengthPercentage;
            });
        }

        scaledDamage = Math.floor(scaledDamage);

        // Apply the damage
        let dragonDead = await DoDamageToMonster(client, username, Math.round(scaledDamage), damageTypeDealt, false);

        let struckTwice = false;
        if(!dragonDead) {
            DoPlayerUpgrade(username, UpgradeType.WarriorStrikeTwiceChance, async (upgrade, strength, strengthPercentage) => {
                if(GetRandomIntI(0, 100) <= strength) {
                    dragonDead = await DoDamageToMonster(client, username, Math.round(scaledDamage), damageTypeDealt, false);
                    struckTwice = true;
                }
            });
        }

        let poisonDamage = Math.max(1, Math.round(scaledDamage * 0.2));
        if(isMonsterPoisoned && scaledDamage > 0) {
            if(!dragonDead) {
                dragonDead = await DoDamageToMonster(client, username, Math.round(poisonDamage), DamageType.Poison, false);
            }

            if(!allDamageTypesDealt.includes(DamageType.Poison)) {
                allDamageTypesDealt.push(DamageType.Poison);
            }
        }

        if(isUsingObject && extraObjectDamageInfo !== undefined && extraObjectDamageInfo.damage > 0) {
            if(!dragonDead) {
                dragonDead = await DoDamageToMonster(client, username, Math.round(extraObjectDamageInfo.damage), extraObjectDamageInfo.damageType, false);
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

        if(isMonsterPoisoned) {
            poisonDamage = await GetAdjustedDamage(client, poisonDamage, DamageType.Poison);
            finalSuccessText += ` He took an extra ${poisonDamage} poison damage.`;
        }

        if(isUsingObject && extraObjectDamageInfo !== undefined) {
            let damageDisplay = extraObjectDamageInfo.damage;
            damageDisplay = await GetAdjustedDamage(client, extraObjectDamageInfo.damage, extraObjectDamageInfo.damageType);

            finalSuccessText += ` Your attack with ${extraObjectName} did an extra ${damageDisplay} ${DamageType[extraObjectDamageInfo.damageType].toLowerCase()} damage!`;
        }

        if(isDrunk) {
            finalSuccessText += ` Your drunk energy did an extra ${adjustedDrunkDamage} damage!`;
        }

        if(struckTwice) {
            finalSuccessText += ` You struck twice! You do another ${scaledDamage} ${DamageType[damageTypeDealt].toLowerCase()} damage!`;
        }
        
        if(wasCrit) {
            finalSuccessText = ` It's a critical hit! ${finalSuccessText}`;

            if(gainHPOnCrit) {
                await ChangePlayerHealth(client, player.Username, Math.round(scaledDamage), DamageType.None);
            }
        }

        ReduceMonsterHits(client);

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
                StunMonster(client);
            }
        }
    }
}

function handleMovePlaySound(client: Client, moveAttempted: ClassMove, username: string, command: string) {
    client.say(process.env.CHANNEL!, GetRandomItem(moveAttempted.SuccessText)!.replace('{name}', username));
    PlaySound(moveAttempted.SoundFile!, AudioType.UserGameActions);

    if(IsCommand(command, 'battlecry')) {
        BattlecryStarted = true;

        DoBattleCry(username);
    }

    HandleTimeout(command);
}

export function DoBattleCry(username: string) {
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
