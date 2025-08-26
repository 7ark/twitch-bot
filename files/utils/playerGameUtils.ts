import fs from "fs";
import {Client} from "tmi.js";
import {Broadcast} from "../bot";
import {AllInventoryObjects, InventoryObject, ObjectRetrievalType, ObjectTier} from "../inventoryDefinitions";
import {GetNumberWithOrdinal, GetRandomIntI, GetRandomItem, GetSecondsBetweenDates} from "./utils";
import {BanUser, WhisperUser} from "./twitchUtils";
import {LoadPlayerSession, SavePlayerSession} from "./playerSessionUtils";
import {HandleQuestProgress} from "./questUtils";
import {DamageType, LoadMonsterData} from "./monsterUtils";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {CurrentStreamSettings} from "../streamSettings";
import {AdsRunning} from "./adUtils";
import {
    ClassType, LocationCoordinate, LocationType, MapLocation,
    MAX_LEVEL,
    MAX_PRESTIGE, NamedLocationInfo,
    Player,
    QuestType,
    StatusEffect,
    Upgrade,
    UpgradeType
} from "../valueDefinitions";
import {UpgradeDefinitions} from "../upgradeDefinitions";
import {MoveDefinitions} from "../movesDefinitions";
import {CleanMessage} from "./messageUtils";
import {GetLocation, GetRandomLocation} from "./locationUtils";

const COZY_POINT_HEALTH_CONVERSION = 5;


export function TryLoadPlayer(displayName: string): Player | null {
    displayName = displayName.toLowerCase();

    if (fs.existsSync('playerData.json')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            if (currPlayer.Username == displayName) {
                return currPlayer;
            }
        }
    }

    return null;
}

export function LoadAllPlayers(): Array<Player> {
    let allPlayers: Array<Player> = [];

    if (fs.existsSync('playerData.json')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            allPlayers.push(currPlayer);
        }
    }

    return allPlayers;
}

export function LoadPlayer(displayName: string): Player {
    displayName = displayName.toLowerCase();

    let player: Player = {
        Username: displayName,
        Level: 0,
        CurrentHealth: 0,
        Classes: [
            {
                Type: ClassType.Mage,
                Level: 0
            },
            {
                Type: ClassType.Warrior,
                Level: 0
            },
            {
                Type: ClassType.Rogue,
                Level: 0
            },
            {
                Type: ClassType.Cleric,
                Level: 0
            },
        ],
        LevelUpAvailable: false,
        CurrentExp: 0,
        CurrentExpNeeded: CalculateExpNeeded(0),
        Upgrades: [],
        PermanentUpgrades: [],
        KnownMoves: ["punch"],
        UpgradeOptions: [],
        Voice: "",
        Deaths: 0,
        Inventory: [],
        StatusEffects: [],
        CommandCooldowns: [],
        EquippedObject: undefined,
        EquippedBacklog: [],
        PassiveModeEnabled: false,
        Gems: 0,
        SpendableGems: 0,
        CurrentQuest: undefined,
        GatheringResources: false,
        CozyPoints: 0,
        HasVip: false,
        HitStreak: 0,
        ByteCoins: 0,
        CookingFood: false,

        Prestige: 0,
        Mastery: 0,

        CurrentLocation: "",
        CurrentLocationCoordinates: { X: 0, Y: 0 },
        Travelling: false
    }

    if (fs.existsSync('playerData.json')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            if (currPlayer.Username == displayName) {
                player = currPlayer;
                break;
            }
        }
    }

    if (player.UpgradeOptions === undefined || player.UpgradeOptions === null) {
        player.UpgradeOptions = [];
    }

    if (player.Upgrades === undefined || player.Upgrades === null) {
        player.Upgrades = [];
    }

    if (player.PermanentUpgrades === undefined || player.PermanentUpgrades === null) {
        player.PermanentUpgrades = [];
    }

    if (player.KnownMoves === undefined || player.KnownMoves === null || player.KnownMoves.length === 0) {
        player.KnownMoves = ["punch"];
    }

    if (!player.KnownMoves.includes("punch")) {
        player.KnownMoves.push("punch");
    }

    if(player.CurrentExp == null) {
        player.CurrentExp = 0;
    }

    if (player.Prestige === undefined) {
        player.Prestige = 0;
    }
    if (player.Mastery == undefined) {
        player.Mastery = 0;
    }

    if (player.Inventory === undefined) {
        player.Inventory = [];
    }
    for (let i = 0; i < player.Classes.length; i++) {
        if (player.Classes[i].Type === ClassType.Rogue) {
            if (player.Classes[i].Level > 0 && !player.Inventory.includes("dagger")) {
                player.Inventory.push("dagger");
            }
        }
        if (player.Classes[i].Type === ClassType.Warrior) {
            if (player.Classes[i].Level > 0 && !player.Inventory.includes("sword")) {
                player.Inventory.push("sword");
            }
            if (player.Classes[i].Level > 0 && !player.Inventory.includes("hammer")) {
                player.Inventory.push("hammer");
            }
        }
        if (player.Classes[i].Type === ClassType.Mage) {
            if (player.Classes[i].Level > 0 && !player.Inventory.includes("wand")) {
                player.Inventory.push("wand");
            }
        }
        if (player.Classes[i].Type === ClassType.Cleric) {
            if (player.Classes[i].Level > 0 && !player.Inventory.includes("healing amulet")) {
                player.Inventory.push("healing amulet");
            }
        }
    }

    if (!player.Classes.find(x => x.Type == ClassType.Cleric)) {
        player.Classes.push(
            {
                Type: ClassType.Cleric,
                Level: 0
            });
    }

    if (player.CurrentHealth === undefined || player.CurrentHealth <= 0) {
        player.CurrentHealth = CalculateMaxHealth(player);
    }

    if (player.Deaths == undefined) {
        player.Deaths = 0;
    }
    if (player.HasVip == undefined) {
        player.HasVip = false;
    }

    if (player.StatusEffects === undefined) {
        player.StatusEffects = [];
    }
    if (player.CommandCooldowns === undefined) {
        player.CommandCooldowns = [];
    }

    if (player.Gems == undefined) {
        player.Gems = 0;
    }
    if (player.SpendableGems == undefined) {
        player.SpendableGems = player.Gems;
    }

    if (player.CozyPoints == undefined) {
        player.CozyPoints = 0;
    }

    if(player.CurrentLocation == undefined || player.CurrentLocation == "") {
        //Give them a random settlement thats civilized
        let loc = GetRandomLocation(LocationType.Settlement, (loc) =>
            (loc as MapLocation<NamedLocationInfo>).Info.Civilized);
        player.CurrentLocation = loc.Name;
        player.CurrentLocationCoordinates = loc.Coordinates[0];
    }

    if(player.CurrentLocationCoordinates == undefined) {
        let loc = GetLocation(player.CurrentLocation)!;
        player.CurrentLocationCoordinates = loc.Coordinates[0];
    }

    for (let i = player.StatusEffects.length - 1; i >= 0; i--) {
        let se = player.StatusEffects[i];

        // console.log(`Checking ${se.Effect}: ${se.WhenEffectStarted}`)

        if (GetSecondsBetweenDates(se.WhenEffectStarted, new Date()) >= se.EffectTimeInSeconds) {
            player.StatusEffects.splice(i, 1);
        }
    }
    for (let i = player.CommandCooldowns.length - 1; i >= 0; i--) {
        let command = player.CommandCooldowns[i];

        if (GetSecondsBetweenDates(command.WhenDidCommand, new Date()) >= command.CommandCooldownInSeconds) {
            player.CommandCooldowns.splice(i, 1);
        }
    }

    return player;
}

export function SavePlayer(player: Player) {
    let allPlayers: Array<Player> = [];
    if (fs.existsSync('playerData.json')) {
        allPlayers = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
    } else {
        allPlayers = [];
    }

    let found: boolean = false;
    for (let i = 0; i < allPlayers.length; i++) {
        if (allPlayers[i].Username == player.Username) {
            allPlayers[i] = player;
            found = true;
            break;
        }
    }
    if (!found) {
        allPlayers.push(player);
    }

    fs.writeFileSync('playerData.json', JSON.stringify(allPlayers, null, 2));
}

export function CalculateMaxHealth(player: Player): number {
    let max = 50;
    for (let i = 0; i < player.Classes.length; i++) {
        if (player.Classes[i].Type === ClassType.Rogue) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 3;
            }
        }
        if (player.Classes[i].Type === ClassType.Warrior) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 5;
            }
        }
        if (player.Classes[i].Type === ClassType.Cleric) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 7;
            }
        }
        if (player.Classes[i].Type === ClassType.Mage) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 1;
            }
        }
    }

    max += player.CozyPoints * COZY_POINT_HEALTH_CONVERSION;

    DoPlayerUpgradeWithPlayer(player, UpgradeType.IncreaseMaxHPPercent, (upgrades, strength, strengthPercentage) => {
        max += max * strengthPercentage;
    });

    return Math.floor(max);
}

export function CalculateExpNeeded(level: number) {
    if (level <= 5) {
        return Math.floor(4 + Math.pow(level, 1.6) * 4);
    } else {
        return Math.floor(4 + Math.pow(level, 1.85) * 3.8);
    }
}

export function GetScaledValueFromMaxHealth(player: Player, value: number, min: number = 0): number {
    return Math.max(min, CalculateMaxHealth(player) * value);
}

// export function LearnNewMoveForPlayer(client: Client, playerName: string) {
//     let player = LoadPlayer(playerName);
//
//     let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));
//
//     if(validDefs.length > 0) {
//         let validDefsWithPoints = validDefs.filter(def => player.MovePoints >= def.MovePointsToUnlock);player
//
//         if(validDefsWithPoints.length > 0) {
//
//         }
//
//         let chosenMove = GetRandomItem(validDefs);
//
//         player.KnownMoves.push(chosenMove!.Command);
//         client.say(process.env.CHANNEL!, `@${playerName}, you have learned !${chosenMove!.Command}: ${chosenMove!.Description}`);
//
//         SavePlayer(player);
//     }
//     else {
//         client.say(process.env.CHANNEL!, `@${playerName}, you have no moves left to be found. Level up, or try a new class!`);
//     }
// }

export async function GivePlayerRandomObjectInTier(client: Client, playerName: string, tier: Array<ObjectTier>, source: ObjectRetrievalType) {
    let player = LoadPlayer(playerName);
    let options: Array<InventoryObject> = [];
    for (let i = 0; i < AllInventoryObjects.length; i++) {
        if (tier.includes(AllInventoryObjects[i].Tier) && AllInventoryObjects[i].Retrieval.includes(source)) {
            if (AllInventoryObjects[i].Consumable || !player.Inventory.includes(AllInventoryObjects[i].ObjectName)) {
                for (let j = 0; j < AllInventoryObjects[i].Rarity; j++) {
                    options.push(AllInventoryObjects[i]);
                }
            }
        }
    }

    let obj = GetRandomItem(options)!;

    await GivePlayerObject(client, playerName, obj.ObjectName);
}

export async function GivePlayerRandomObject(client: Client, playerName: string, source: ObjectRetrievalType): Promise<InventoryObject> {
    let player = LoadPlayer(playerName);
    let options: Array<InventoryObject> = [];
    for (let i = 0; i < AllInventoryObjects.length; i++) {
        if (AllInventoryObjects[i].Retrieval.includes(source)) {
            if (AllInventoryObjects[i].Consumable || !player.Inventory.includes(AllInventoryObjects[i].ObjectName)) {
                for (let j = 0; j < AllInventoryObjects[i].Rarity; j++) {
                    options.push(AllInventoryObjects[i]);
                }
            }
        }
    }

    let obj = GetRandomItem(options)!;

    await GivePlayerObject(client, playerName, obj.ObjectName);

    return obj;
}

export async function GivePlayerObject(client: Client, playerName: string, object: string, showText: boolean = true) {
    let player = LoadPlayer(playerName);
    player.Inventory.push(object);
    SavePlayer(player);

    let obj = AllInventoryObjects.find(x => x.ObjectName === object);
    if (obj === undefined) {
        console.error(`Could not find ${object}`)
        return;
    }

    if(showText) {
        await WhisperUser(client, playerName, `@${playerName}, You've gained ${obj.ContextualName}. ${obj.Info}`);
    }

    setTimeout(async () => {
        await HandleQuestProgress(client, playerName, QuestType.GetItem, 1);
    }, 10);
}

export function TakeObjectFromPlayer(playerName: string, object: string) {
    let player = LoadPlayer(playerName);
    if (player.Inventory.includes(object)) {
        const index = player.Inventory.indexOf(object, 0);
        if (index > -1) {
            player.Inventory.splice(index, 1);
        }
    }

    SavePlayer(player);
}

async function CalculateDamageAmountForPlayer(client: Client, player: Player, amount: number, damageType: DamageType): Promise<number> {
    //Make amount positive just for each math
    amount = Math.abs(amount);

    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.FireResistance) && damageType == DamageType.Fire) {
        amount = Math.floor(amount * 0.5);
        await client.say(process.env.CHANNEL!, `${player.Username} resisted the fire damage and only took half damage!`);
    }
    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.ColdResistance) && damageType == DamageType.Cold) {
        amount = Math.floor(amount * 0.5);
        await client.say(process.env.CHANNEL!, `${player.Username} resisted the cold damage and only took half damage!`);
    }

    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.PhysicalResistance)) {
        switch (damageType) {
            case DamageType.Piercing:
            case DamageType.Slashing:
            case DamageType.Bludgeoning:
                amount = Math.floor(amount * 0.5);
                await client.say(process.env.CHANNEL!, `${player.Username} resisted the ${DamageType[damageType]} damage and only took half damage!`);
                break;
        }
    }

    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.ElementalResistance)) {
        switch (damageType) {
            case DamageType.Fire:
            case DamageType.Cold:
            case DamageType.Lightning:
                amount = Math.floor(amount * 0.5);
                await client.say(process.env.CHANNEL!, `${player.Username} resisted the ${DamageType[damageType]} damage and only took half damage!`);
                break;
        }
    }

    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.AllVulnerability)) {
        amount = Math.ceil(amount * 2);
        await client.say(process.env.CHANNEL!, `${player.Username} is vulnerable to the ${DamageType[damageType]} and took double damage!`);
    }

    if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.AllResistance)) {
        amount = Math.floor(amount * 0.5);
        await client.say(process.env.CHANNEL!, `${player.Username} is resistant to the ${DamageType[damageType]} and only took half damage!`);
    }

    let isUsingObject = false
    if (player.EquippedObject !== undefined) {
        let obj = GetObjectFromInputText(player.EquippedObject.ObjectName);
        if (obj !== undefined) {
            let hasAtLeastOne = false;
            for (let i = 0; i < player.Classes.length; i++) {
                if (obj!.ClassRestrictions?.includes(player.Classes[i].Type)) {
                    hasAtLeastOne = true;
                    break;
                }
            }

            isUsingObject = hasAtLeastOne;
        }
    }

    if (isUsingObject) {
        let obj = await GetObjectFromInputText(player.EquippedObject!.ObjectName);
        if (obj !== undefined && obj.ObjectOnAttackedAction !== undefined) {
            let defenseObjectInfo: {
                resistances?: Array<DamageType>,
                immunities?: Array<DamageType>,
                vulnerabilities?: Array<DamageType>,
                armorAdjustment?: number
            } = obj?.ObjectOnAttackedAction(client, player);
            for (let i = 0; i < defenseObjectInfo.resistances?.length ?? 0; i++) {
                if (damageType == defenseObjectInfo.resistances![i]) {
                    amount = Math.floor(amount * 0.5);
                    await client.say(process.env.CHANNEL!, `${player.Username} resisted the ${DamageType[damageType]} damage from their ${player.EquippedObject!.ObjectName} and only took half damage!`);
                }
                if (damageType == defenseObjectInfo.immunities![i]) {
                    amount = 0;
                    await client.say(process.env.CHANNEL!, `${player.Username} is immune to ${DamageType[damageType]} damage from their ${player.EquippedObject!.ObjectName} and took NO damage!`);
                }
                if (damageType == defenseObjectInfo.vulnerabilities![i]) {
                    amount = Math.floor(amount * 2);
                    await client.say(process.env.CHANNEL!, `${player.Username} is vulnerable to ${DamageType[damageType]} damage from their ${player.EquippedObject!.ObjectName} and took DOUBLE damage!`);
                }
            }
        }
    }

    //Set amount negative again
    amount = -amount;

    return amount;
}

export async function ChangePlayerHealth(client: Client, playerName: string, amount: number, damageType: DamageType, deathReason?: string, showText: boolean = true) {
    let player = LoadPlayer(playerName);
    let maxHealth = CalculateMaxHealth(player);

    if (player.CurrentHealth > CalculateMaxHealth(player)) {
        player.CurrentHealth = CalculateMaxHealth(player);
    }

    if (amount > 0 && player.CurrentHealth >= maxHealth) {
        return;
    }

    let poisonDamage = 0;
    if (amount < 0) {
        amount = await CalculateDamageAmountForPlayer(client, player, amount, damageType);

        if (DoesPlayerHaveStatusEffect(player.Username, StatusEffect.Poisoned)) {
            poisonDamage = await CalculateDamageAmountForPlayer(client, player, GetScaledValueFromMaxHealth(player, 0.05, 5), DamageType.Poison);

            amount -= poisonDamage;
        }

        DoPlayerUpgrade(player.Username, UpgradeType.TakenDamageChangedByPercent, (upgrades, strength, strengthPercentage) => {
            let reduction = Math.floor(amount * strengthPercentage);
            amount -= reduction;
        });

        if (amount == 0) {
            return;
        }
    }

    if (Math.floor(amount) == 0) {
        console.log(`Player ${playerName} tried to change health by 0`)
        return;
    }

    player = LoadPlayer(playerName);
    player.CurrentHealth += Math.floor(amount);
    player.CurrentHealth = Math.floor(player.CurrentHealth);
    SavePlayer(player);
    if (player.CurrentHealth <= 0) {
        player = LoadPlayer(playerName);
        player.CurrentHealth = 0
        SavePlayer(player);

        if (poisonDamage > 0) {
            await client.say(process.env.CHANNEL!, `${player.Username} is poisoned and took an additional ${poisonDamage} poison damage!`);
        }
        await client.say(process.env.CHANNEL!, `@${playerName} took ${Math.abs(amount)} ${DamageType[damageType]} damage and DIED! They've been banned for 5 minutes.`);
        player = LoadPlayer(playerName);
        player.CurrentHealth = maxHealth;
        player.Deaths++;
        SavePlayer(player);

        //Flash red lights
        await SetLightColor(1, 0, 0, 0);
        await SetLightBrightness(1, 0);
        setTimeout(async () => {
            await FadeOutLights();
        }, 4000);

        let playerSession = LoadPlayerSession(player.Username);
        playerSession.TimesDied++;
        SavePlayerSession(player.Username, playerSession);

        //Show dead stickman
        setTimeout(() => {
            Broadcast(JSON.stringify({
                type: 'changestickmanappearance',
                displayName: player.Username,
                changeType: 'died'
            }));
        }, 1000);

        //Show revived stickman
        setTimeout(() => {
            Broadcast(JSON.stringify({
                type: 'changestickmanappearance',
                displayName: player.Username,
                changeType: 'revive'
            }));
        }, 1000 * 60 * 5);

        await BanUser(client, playerName, 5 * 60, deathReason);
    } else if (player.CurrentHealth > maxHealth) {
        player = LoadPlayer(playerName);
        player.CurrentHealth = maxHealth;
        SavePlayer(player);

        if(showText) {
            await client.say(process.env.CHANNEL!, `@${playerName} has healed to full.`);
        }
    } else {
        if(showText) {
            await client.say(process.env.CHANNEL!, `@${playerName} has ${amount > 0 ? `healed by ${amount}` : `taken ${Math.abs(amount)} ${DamageType[damageType]} damage`}! [${player.CurrentHealth}/${CalculateMaxHealth(player)}]HP`);

            if (poisonDamage > 0) {
                await client.say(process.env.CHANNEL!, `${player.Username} is poisoned and took an additional ${poisonDamage} poison damage!`);
            }
        }
    }

    Broadcast(JSON.stringify({
        type: 'showfloatingtext',
        displayName: playerName,
        display: amount > 0 ? `+${amount}` : `-${Math.abs(amount)}`,
    }));
}

async function CheckForPrestige(client: Client, player: Player, levelAddition: number): Promise<boolean> {
    if (player.Level + levelAddition >= MAX_LEVEL) {
        player.Upgrades = [];
        player.KnownMoves = [];
        for (let i = 0; i < player.Classes.length; i++) {
            player.Classes[i].Level = 0;
        }
        player.Level = 0;
        player.CurrentExp = 0;
        player.CurrentExpNeeded = CalculateExpNeeded(0);
        player.LevelUpAvailable = false;
        player.Prestige++;
        player.CurrentHealth = CalculateMaxHealth(player);

        if (player.Prestige >= MAX_PRESTIGE) {
            player.PermanentUpgrades = [];
            player.Prestige = 0;
            player.Mastery++;

            await client.say(process.env.CHANNEL!, `@${player.Username}, you have gained a level of MASTERY! ALL statistics, including prestige have been reset, you now get to work with Cory to create something unique.`);

            return true;
        }

        await client.say(process.env.CHANNEL!, `@${player.Username}, you have gained a level of PRESTIGE! Your statistics have been reset, but you now get a permanent upgrade.`);

        let final = await GetUpgradeSelection(client, player, true);

        SavePlayer(player);

        await client.say(process.env.CHANNEL!, final);
        return true;
    }

    return false;
}

export async function GiveExp(client: Client, username: string, amount: number, affectedByModifiers: boolean = true) {
    if (affectedByModifiers) {
        if (DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleExp) || AdsRunning) {
            amount *= 2;
        }

        DoPlayerUpgrade(username, UpgradeType.MoreEXP, async (upgrades, strength, strengthPercentage) => {
            amount += Math.floor(amount * strengthPercentage);
        });
    }

    let player = LoadPlayer(username);
    player.CurrentExp += Math.round(amount);
    player.CurrentExp = Math.floor(player.CurrentExp);
    SavePlayer(player);

    if (!player.LevelUpAvailable) {
        if (player.CurrentExp >= player.CurrentExpNeeded) {
            player = LoadPlayer(username);

            if (await CheckForPrestige(client, player, 1)) {
                return;
            }

            player.LevelUpAvailable = true;
            SavePlayer(player);

            let classOptions = Object.keys(ClassType)
                .filter(key => isNaN(Number(key)))
                .map(x => `!${x.toLowerCase()}`);

            let formattedOptions = classOptions.length > 1
                ? classOptions.slice(0, -1).join(', ') + ', or ' + classOptions[classOptions.length - 1]
                : classOptions[0];

            let text = `@${username} has LEVELED UP! You may choose a class to level into. Use ${formattedOptions} to select a class.`;
            if (player.Level == 0) {
                text += ' Passive mode has now been disabled.';
            }
            await client.say(process.env.CHANNEL!, text);

            setTimeout(async () => {
                Broadcast(JSON.stringify({type: 'exp', displayName: username, display: `LEVEL UP!`,}));
                await ChangePlayerHealth(client, username, Math.floor(CalculateMaxHealth(player) * 0.05), DamageType.None);
            }, 700);
        } else {
            setTimeout(() => {
                Broadcast(JSON.stringify({type: 'exp', displayName: username, display: `+${amount}EXP`,}));
            }, 700);
        }
    }

}

async function LearnRandomMove(client: Client, player: Player, classType: ClassType) {
    let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) &&
        def.ClassRequired == classType &&
        player.Classes.some(x => x.Level > 0 &&
            x.Type === def.ClassRequired &&
            x.Level >= (def.LevelRequirement ?? 0)));

    if (validDefs.length > 0) {
        let chosenMove = GetRandomItem(validDefs);

        player.KnownMoves.push(chosenMove!.Command);

        let monsterStats = LoadMonsterData().Stats;

        let desc = chosenMove!.Description;

        while (desc.includes("{monster}")) {
            desc = desc.replace("{monster}", monsterStats.Name);
        }

        await client.say(process.env.CHANNEL!, `@${player.Username}, you have learned !${chosenMove!.Command}: ${desc}`);
    }
}

export async function LevelUpPlayer(client: Client, username: string, classType: ClassType) {
    let player = LoadPlayer(username);

    if (player.LevelUpAvailable) {
        if (player.UpgradeOptions.length > 0) {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you must select your upgrade before you can level up again. Check what your choices are with !levelup`);
            return;
        }

        if (await CheckForPrestige(client, player, 0)) {
            return;
        }

        let playerClass = player.Classes.find(c => c.Type === classType);

        let final = "";

        setTimeout(async () => {
            await HandleQuestProgress(client, player.Username, QuestType.LevelUp, 1);
        }, 10);
        player.CurrentExp -= player.CurrentExpNeeded;
        player.Level++;
        player.CurrentExpNeeded = CalculateExpNeeded(player.Level);
        if (player.CurrentExp < player.CurrentExpNeeded) {
            player.LevelUpAvailable = false;
        }

        for (let i = 0; i < player.Classes.length; i++) {
            if (player.Classes[i].Type == classType) {
                player.Classes[i].Level++;
            }
        }

        if (playerClass && playerClass.Level === 1) {
            switch (classType) {
                case ClassType.Warrior:
                    if (!player.Inventory.includes("sword")) {
                        await GivePlayerObject(client, player.Username, "sword", false);
                        await GivePlayerObject(client, player.Username, "hammer", false);
                    }
                    await LearnRandomMove(client, player, classType);
                    break;
                case ClassType.Mage:
                    if (!player.Inventory.includes("wand")) {
                        await GivePlayerObject(client, player.Username, "wand", false);
                    }
                    await LearnRandomMove(client, player, classType);
                    break;
                case ClassType.Rogue:
                    if (!player.Inventory.includes("dagger")) {
                        await GivePlayerObject(client, player.Username, "dagger", false);
                    }
                    await LearnRandomMove(client, player, classType);
                    break;
                case ClassType.Cleric:
                    if (!player.Inventory.includes("healing amulet")) {
                        await GivePlayerObject(client, player.Username, "healing amulet", false);
                    }
                    await LearnRandomMove(client, player, classType);
                    break;
            }
        }
        // final += GetPlayerStatsDisplay(player);

        final += await GetUpgradeSelection(client, player, false);

        SavePlayer(player);

        await client.say(process.env.CHANNEL!, final);
    } else {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you have no level ups available.`);
    }
}

async function GetUpgradeSelection(client: Client, player: Player, isForPermanent: boolean): Promise<string> {
    let allUpgradeOptions = UpgradeDefinitions.filter(def => {
        if (isForPermanent) {
            if (!def.IsPermanent) {
                return;
            }

            // Check if player already has this upgrade
            if (player.PermanentUpgrades.includes(def.Name)) {
                return false;
            }
        } else {
            if (def.IsPermanent) {
                return;
            }

            // Check if player already has this upgrade
            if (player.Upgrades.includes(def.Name)) {
                return false;
            }
        }

        //Only show learn move you have moves to learn
        if (def.Effects.some(x => x.Type === UpgradeType.LearnMove)) {
            let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

            if (validDefs.length <= 0) {
                return false;
            }
        }

        // Check class requirements
        const hasClassRequirements = def.ClassRequirements.length === 0 ||
            def.ClassRequirements.every(requiredClass =>
                player.Classes.some(playerClass => playerClass.Type === requiredClass && playerClass.Level > 0)
            );

        if (!hasClassRequirements) {
            return false;
        }

        // Check upgrade requirements
        const hasUpgradeRequirements = def.UpgradeRequirements.length === 0 ||
            def.UpgradeRequirements.some(requiredUpgradeType =>
                player.Upgrades.some(upgradeNameOwned => {
                    const upgrade = UpgradeDefinitions.find(def => def.Name === upgradeNameOwned);
                    return upgrade?.Effects.some(x => x.Type === requiredUpgradeType);
                }) ||
                player.PermanentUpgrades.some(upgradeNameOwned => {
                    const upgrade = UpgradeDefinitions.find(def => def.Name === upgradeNameOwned);
                    return upgrade?.Effects.some(x => x.Type === requiredUpgradeType);
                })
            );

        return hasUpgradeRequirements;
    });

    let chosenOptions: Array<Upgrade> = [];
    let availableOptions = [...allUpgradeOptions]; // Create a copy to modify

    for (let i = 0; i < 3 && availableOptions.length > 0; i++) {
        // Calculate total rarity weight
        const totalWeight = availableOptions.reduce((sum, upgrade) => sum + upgrade.Rarity, 0);
        // Get random point in total weight
        let random = Math.random() * totalWeight;

        // Find the upgrade at this weight point
        let randomUpgrade = availableOptions[0];
        for (const upgrade of availableOptions) {
            random -= upgrade.Rarity;
            if (random <= 0) {
                randomUpgrade = upgrade;
                break;
            }
        }

        availableOptions = availableOptions.filter(upgrade => upgrade !== randomUpgrade);
        chosenOptions.push(randomUpgrade);
    }

    for (let i = 0; i < chosenOptions.length; i++) {
        player.UpgradeOptions.push(chosenOptions[i].Name);
    }

    return GetUpgradeOptions(player, isForPermanent);
}

export function GetUpgradeOptions(player: Player, permanent: boolean): string {
    if (player.UpgradeOptions.length === 0) {
        return `@${player.Username}, you have no upgrade choices currently. Level up and choose a class to get some!`;
    } else {
        let upgradesFinal = `@${player.Username}, you have ${player.UpgradeOptions.length} ${permanent ? "prestige" : ""} upgrade choices! Use the following options to select: \n`;

        for (let i = 0; i < player.UpgradeOptions.length; i++) {
            let upgrade = UpgradeDefinitions.find(x => x.Name === player.UpgradeOptions[i])!;
            upgradesFinal += `!upgrade ${(i + 1)}: ${upgrade.Name}: ${GetUpgradeDescription(upgrade.Name)} | \n`;
        }

        return upgradesFinal;
    }
}

export async function SelectPlayerUpgrade(client: Client, username: string, selectedUpgrade: number) {
    let final = ``;
    let player = LoadPlayer(username);

    if (player.UpgradeOptions.length === 0) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have any upgrade options right now! Level up or choose a class to get upgrades.`);
        return;
    }

    if (selectedUpgrade >= player.UpgradeOptions.length) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, that is not an upgrade option!`);
        return;
    }

    let chosenUpgradeName = player.UpgradeOptions[selectedUpgrade];
    let chosenUpgrade = UpgradeDefinitions.find(x => x.Name == chosenUpgradeName);
    if (chosenUpgrade === undefined) {
        console.log(`Could not find upgrade ${chosenUpgradeName}`);
        return;
    }

    let moveText = '';

    function SetupToLearnMove(free: boolean) {
        let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

        if (validDefs.length > 0) {
            let chosenMove = GetRandomItem(validDefs);

            player.KnownMoves.push(chosenMove!.Command);

            let monsterStats = LoadMonsterData().Stats;

            let desc = chosenMove!.Description;

            while (desc.includes("{monster}")) {
                desc = desc.replace("{monster}", monsterStats.Name);
            }

            if(free) {
                moveText += `Additionally, you have learned a FREE new move: `
            }
            else {
                moveText += `You have learned `;
            }

            moveText += `!${chosenMove!.Command}: ${desc}. `;
        }
    }

    if (chosenUpgrade.Savable) {
        if(chosenUpgrade.IsPermanent) {
            player.PermanentUpgrades.push(chosenUpgradeName);

            SetupToLearnMove(true);
        }
        else {
            player.Upgrades.push(chosenUpgradeName);
        }

        if(player.Level == 5 ||
           player.Level == 10 ||
           player.Level == 15 ||
           player.Level == 20) {
            SetupToLearnMove(true);
        }
    } else {
        if (chosenUpgrade.Effects.some(x => x.Type === UpgradeType.LearnMove)) {
            SetupToLearnMove(false);
        }
    }

    player.UpgradeOptions = [];

    if (final === ``) {
        final += `@${player.Username}, you have selected ${chosenUpgrade.Name}! ${moveText}`;
        final += GetPlayerStatsDisplay(player);
    }

    await client.say(process.env.CHANNEL!, final);

    SavePlayer(player);
}

export function GetUpgradeDescription(upgradeName: string): string {
    let upgrade = UpgradeDefinitions.find(x => x.Name.toLowerCase() === upgradeName.toLowerCase());
    if (upgrade !== undefined) {
        let desc = upgrade.Description;
        for (let i = 0; i < upgrade.Effects.length; i++) {
            while (desc.includes(`{${i}}`)) {
                desc = desc.replace(`{${i}}`, upgrade.Effects[i].Strength.toString());
            }
        }
        return desc
    }
    return "";
}

export function DoesPlayerHaveUpgrade(username: string, upgradeType: UpgradeType): boolean {
    let player = LoadPlayer(username);
    return player.Upgrades.some(upgrade => UpgradeDefinitions.find(x => x.Name === upgrade)?.Effects.some(x => x.Type === upgradeType));
}

export function DoPlayerUpgrade(username: string, upgradeType: UpgradeType, out: (upgrades: Upgrade[], strength: number, strengthPercentage: number) => void): boolean {
    let player = LoadPlayer(username);

    return DoPlayerUpgradeWithPlayer(player, upgradeType, out);
}

export function DoPlayerUpgradeWithPlayer(player: Player, upgradeType: UpgradeType, out: (upgrades: Upgrade[], strength: number, strengthPercentage: number) => void): boolean {
    let totalStrength = 0;
    let matchingUpgrades = player.Upgrades
        .map(upgradeName => UpgradeDefinitions.find(x => x.Name === upgradeName && x.Effects.some(x => x.Type === upgradeType)))
        .filter(upgrade => upgrade !== undefined);

    let permanents = player.PermanentUpgrades
        .map(upgradeName => UpgradeDefinitions.find(x => x.Name === upgradeName && x.Effects.some(x => x.Type === upgradeType)))
        .filter(upgrade => upgrade !== undefined);

    for (let i = 0; i < permanents.length; i++) {
        matchingUpgrades.push(permanents[i]);
    }

    if (matchingUpgrades.length > 0) {
        totalStrength = matchingUpgrades.reduce((sum, upgrade) => {
            // First ensure upgrade exists
            if (!upgrade || !upgrade.Effects) {
                return sum;
            }

            // Calculate sum of effect strengths for this upgrade
            const upgradeSum = upgrade.Effects.reduce((strengthSum, effect) => {
                return strengthSum + (effect.Type === upgradeType ? effect.Strength : 0);
            }, 0); // Important: Add initial value of 0 here

            return sum + upgradeSum;
        }, 0);
        out(matchingUpgrades!, totalStrength, totalStrength / 100);
        return true;
    }
    return false;
}

export function GetPlayerStatsDisplay(player: Player): string {
    let classesAbove0 = 0;
    for (let i = 0; i < player.Classes.length; i++) {
        if (player.Classes[i].Level > 0) {
            classesAbove0++;
        }
    }

    let currClassCount = 0;
    let final = `@${player.Username} is level ${player.Level}.`;
    if (player.Level > 0) {
        final += " They are ";
    }
    for (let i = 0; i < player.Classes.length; i++) {
        if (player.Classes[i].Level > 0) {
            final += `a ${GetNumberWithOrdinal(player.Classes[i].Level)} level ${ClassType[player.Classes[i].Type]}`;
            currClassCount++;

            if (currClassCount < classesAbove0 - 1) {
                final += ", ";
            } else if (currClassCount == classesAbove0 - 1) {
                final += " and ";
            } else {
                final += ".";
            }
        }
    }

    if (player.LevelUpAvailable) {
        final += ` They have a level up available.`;
    }

    if (player.EquippedObject !== undefined) {
        final += ` Their equipped ${player.EquippedObject!.ObjectName} has a durability left of ${player.EquippedObject!.RemainingDurability}.`;
    }

    let maxHp = CalculateMaxHealth(player);
    final += ` They've died ${player.Deaths} times! [${player.CurrentExp}/${player.CurrentExpNeeded}]EXP [${player.CurrentHealth}/${maxHp}]HP`;

    if (player.Prestige > 0) {
        final += ` [${player.Prestige}]Prestige`
    }
    if (player.Mastery > 0) {
        final += ` [${player.Mastery}]Mastery`
    }

    return final;
}

export async function RandomlyGiveExp(client: Client, username: string, chanceOutOfTen: number, exp: number) {
    let chance = Math.round(Math.random() * 10);
    if (chance <= chanceOutOfTen) {
        await GiveExp(client, username, GetRandomIntI(1, 2));
    }
}

export function GetObjectFromInputText(text: string): InventoryObject | undefined {
    let initialFind = CheckTextInstance(CleanMessage(text.trim()));
    if(initialFind !== undefined) {
        return initialFind;
    }

    let pieces = text.toLowerCase().trim().split(' ');
    for (let i = 0; i < pieces.length; i++) {
        let textPiece = "";
        for (let j = i; j < pieces.length; j++) {
            if (textPiece != "") {
                textPiece += " ";
            }
            textPiece += pieces[j];
            let foundObject = CheckTextInstance(textPiece);
            if (foundObject !== undefined) {
                return foundObject;
            }
        }
    }
}

function CheckTextInstance(text: string): InventoryObject | undefined {
    let inventoryObject: InventoryObject | undefined = AllInventoryObjects.find(x => text === (x.ObjectName) || (x.Alias != undefined && x.Alias.some(y => text === (y))))!;

    if (inventoryObject === undefined) {
        inventoryObject = AllInventoryObjects.find(x => text.includes(x.ObjectName) || (x.Alias != undefined && x.Alias.some(y => text.includes(y))))!;
    }

    return inventoryObject;
}

export function TriggerCommandCooldownOnPlayer(username: string, command: string, timeInSeconds: number) {
    let player = LoadPlayer(username);

    DoPlayerUpgrade(username, UpgradeType.ReducedCooldowns, async (upgrades, strength, strengthPercentage) => {
        timeInSeconds -= Math.floor(timeInSeconds * strengthPercentage);
    });

    let cancel = false;
    DoPlayerUpgrade(username, UpgradeType.CooldownCancelChance, async (upgrades, strength, strengthPercentage) => {
        if (GetRandomIntI(0, 100) <= strength) {
            cancel = true;
        }
    });

    if (cancel) {
        return;
    }

    timeInSeconds = Math.max(1, timeInSeconds);

    let existingEffectIndex = player.CommandCooldowns.findIndex(x => x.Command == command);
    if (existingEffectIndex == -1) {
        player.CommandCooldowns.push({
            Command: command,
            WhenDidCommand: new Date(),
            CommandCooldownInSeconds: timeInSeconds * CurrentStreamSettings.cooldownMultiplier
        })
    } else {
        player.CommandCooldowns[existingEffectIndex].WhenDidCommand = new Date();
        player.CommandCooldowns[existingEffectIndex].CommandCooldownInSeconds = timeInSeconds;
    }

    SavePlayer(player);
}

export function AddStatusEffectToPlayer(username: string, effect: StatusEffect, timeInSeconds: number) {
    let player = LoadPlayer(username);

    let existingEffectIndex = player.StatusEffects.findIndex(x => x.Effect == effect);
    if (existingEffectIndex == -1) {
        player.StatusEffects.push({
            Effect: effect,
            WhenEffectStarted: new Date(),
            EffectTimeInSeconds: timeInSeconds
        })
    } else {
        player.StatusEffects[existingEffectIndex].WhenEffectStarted = new Date();
        player.StatusEffects[existingEffectIndex].EffectTimeInSeconds = timeInSeconds;
    }

    SavePlayer(player);
}

export function DoesPlayerHaveStatusEffect(username: string, effect: StatusEffect) {
    let player = LoadPlayer(username);
    let existingEffectIndex = player.StatusEffects.findIndex(x => x.Effect == effect);

    return existingEffectIndex != -1;
}

export function IsCommandOnCooldown(username: string, command: string) {
    let player = LoadPlayer(username);
    let existingEffectIndex = player.CommandCooldowns.findIndex(x => x.Command == command);

    return existingEffectIndex != -1;
}

export function GetCommandCooldownTimeLeftInSeconds(username: string, command: string) {
    let player = LoadPlayer(username);
    let existingEffectIndex = player.CommandCooldowns.findIndex(x => x.Command == command);

    if (existingEffectIndex != -1) {
        let commandCooldown = player.CommandCooldowns[existingEffectIndex];
        let secondsLeft = commandCooldown.CommandCooldownInSeconds - GetSecondsBetweenDates(commandCooldown.WhenDidCommand, new Date());

        return secondsLeft;
    }

    return 0;
}

export function GiveCozyPoints(username: string, points: number) {
    let player = LoadPlayer(username);
    player.CozyPoints += points;
    player.CurrentHealth += points * COZY_POINT_HEALTH_CONVERSION;
    SavePlayer(player);
}

export function ProcessCozyPointTick(username: string) {
    let player = LoadPlayer(username);
    if (player.CozyPoints > 0) {
        player.CozyPoints--;

        let max = CalculateMaxHealth(player);
        if (player.CurrentHealth >= max) {
            player.CurrentHealth = max;
        }
        SavePlayer(player);
    }
}

export function TickAllCozyPoints() {
    let players = LoadAllPlayers();
    for (let i = 0; i < players.length; i++) {
        ProcessCozyPointTick(players[i].Username);
    }
}

export function GetPlayerCoordinates(player: Player): LocationCoordinate {
    if (player.Travelling && player.TravelStartTime && player.TravelTimeInSeconds != null && player.TravelDestinationCoordinates) {
        let now = new Date();
        let start = new Date(player.TravelStartTime).getSeconds();
        let end = new Date(start);
        end.setSeconds(end.getSeconds() + player.TravelTimeInSeconds);

        const t = Math.min(1, Math.max(0, (now.getSeconds() - start) / (end - start))); // 0..1 progress

        const from = player.CurrentLocationCoordinates;
        const to = player.TravelDestinationCoordinates;

        return {
            X: Math.floor(from.X + (to.X - from.X) * t),
            Y: Math.floor(from.Y + (to.Y - from.Y) * t)
        };
    }

    return player.CurrentLocationCoordinates;
}


// let players = LoadAllPlayers();
// for (let i = 0; i < players.length; i++) {
//     players[i].CurrentExp = 0;
//     players[i].Level = 0;
//     for (let j = 0; j < players[i].Classes.length; j++) {
//         players[i].Classes[j].Level = 0;
//     }
//     players[i].CurrentExpNeeded = CalculateExpNeeded(players[i].Level);
//     players[i].LevelUpAvailable = false;
//     players[i].KnownMoves = [];
//     SavePlayer(players[i]);
// }
