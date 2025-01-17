import {Broadcast} from "../bot";
import fs from "fs";
import {Client} from "tmi.js";
import {
    GetAllPlayerSessions,
    GetAllPlayerSessionsRaw,
    LoadPlayerSession,
    PlayerSessionData,
    SavePlayerSession,
    UpdatePlayerSessionData
} from "./playerSessionUtils";
import {
    CalculateMaxHealth,
    ChangePlayerHealth,
    DoesPlayerHaveStatusEffect,
    GetObjectFromInputText,
    GiveExp, GivePlayerObject,
    GivePlayerRandomObject,
    LoadPlayer,
} from "./playerGameUtils";
import {SetSceneItemEnabled} from "./obsutils";
import {GetRandomEnum, GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils";
import {HandleQuestProgress} from "./questUtils";
import {PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {InventoryObject} from "../inventory";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {ClassType, QuestType, StatusEffect} from "../valueDefinitions";

enum MonsterType { Dragon, Loaf, Tank }

function GenerateMonsterStatsFromType(type: MonsterType): MonsterStats {
    switch (type) {
        case MonsterType.Dragon:
            return {
                Name: `Bytefire`,
                Type: MonsterType.Dragon,
                AttackMessage: `Bytefire is attacking with breath of fire and ice!`,
                AttackAddition: 8,
                ArmorAddition: 5,
                DamageRatioRange: {
                    min: 0.2,
                    max: 0.3
                },
                DamageTypes: [DamageType.Fire, DamageType.Cold],
                MaxHealth: 1500,
                MonsterAttackRateRange: { min: 5, max: 10 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Fire, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Fire, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
            };
        case MonsterType.Loaf:
            return {
                Name: `Loaf the Cat`,
                Type: MonsterType.Loaf,
                AttackMessage: `Loaf is defending himself and scratching at everyone!`,
                AttackAddition: 5,
                ArmorAddition: 8,
                DamageRatioRange: {
                    min: 0.1,
                    max: 0.3
                },
                DamageTypes: [DamageType.Slashing],
                MaxHealth: 800,
                MonsterAttackRateRange: { min: 3, max: 7 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Slashing, DamageType.Fire, DamageType.Piercing, DamageType.Psychic],
            };
        case MonsterType.Tank:
            return {
                Name: GetRandomItem([
                    "Thomas the Tank",
                    "Missile Mae",
                    "Big Papa",
                ])!,
                Type: MonsterType.Tank,
                AttackMessage: `{monster} fires a barrage of bullets!`,
                AttackAddition: 7,
                ArmorAddition: 10,
                DamageRatioRange: {
                    min: 0.2,
                    max: 0.4
                },
                DamageTypes: [DamageType.Bludgeoning, DamageType.Fire],
                MaxHealth: 500,
                MonsterAttackRateRange: { min: 2, max: 6 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Fire, DamageType.Piercing],
            };
        // case MonsterType.Santa:
        //     return {
        //         Name: `Santa`,
        //         Type: MonsterType.Santa,
        //         AttackMessage: `{monster} fires christmas magic into everyone's eyes!`,
        //         AttackAddition: 5,
        //         ArmorAddition: 0,
        //         DamageRatioRange: {
        //             min: 0.2,
        //             max: 0.4
        //         },
        //         DamageTypes: [DamageType.Psychic, DamageType.Cold],
        //         MaxHealth: 2000,
        //         MonsterAttackRateRange: { min: 5, max: 15 },
        //         ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
        //         VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Fire, DamageType.Piercing, DamageType.Poison],
        //     };
    }
}

export enum DamageType {
    None,
    Piercing,
    Slashing,
    Bludgeoning,
    Fire,
    Cold,
    Poison,
    Psychic,
}

export interface MonsterStats {
    Name: string;
    Type: MonsterType;
    AttackMessage: string;
    AttackAddition: number;
    ArmorAddition: number;
    DamageRatioRange: { min: number; max: number; } //Determines max damage to do based on players max health. Value 0 - 1
    DamageTypes: Array<DamageType>;
    MaxHealth: number;
    MonsterAttackRateRange: { min: number; max: number; }
    ResistImmuneDamageTypeOptions: Array<DamageType>;
    VulnerabilityDamageTypeOptions: Array<DamageType>;
}

export interface MonsterInfo {
    Health: number;
    HitsBeforeAttack: number;
    Stats: MonsterStats;
}

const RESISTANCE_COUNT = 2;
const IMMUNITY_COUNT = 1;
const VULNERABILITY_COUNT = 1;

let currentMonsterResistances: Array<string> = [];
let currentMonsterImmunities: Array<string> = [];
let currentMonsterVulnerabilities: Array<string> = [];

export function SetupMonsterDamageTypes() {
    let monsterStats = LoadMonsterData().Stats;

    currentMonsterImmunities = [];
    currentMonsterVulnerabilities = [];
    currentMonsterResistances = [];

    let resistImmuneOptions = [...monsterStats.ResistImmuneDamageTypeOptions];
    let vulnerabilityOptions = [...monsterStats.VulnerabilityDamageTypeOptions];

    for (let i = 0; i < RESISTANCE_COUNT; i++) {
        if(resistImmuneOptions.length === 0) {
            break;
        }

        let randomType = GetRandomItem(resistImmuneOptions)!;

        const index = resistImmuneOptions.indexOf(randomType, 0);
        if (index > -1) {
            resistImmuneOptions.splice(index, 1);
        }

        const vulnIndex = vulnerabilityOptions.indexOf(randomType, 0);
        if(vulnIndex > -1) {
            vulnerabilityOptions.splice(index, 1);
        }

        console.log(`Monster is resistant to ${DamageType[randomType]}`)
        currentMonsterResistances.push(DamageType[randomType]);
    }
    for (let i = 0; i < IMMUNITY_COUNT; i++) {
        if(resistImmuneOptions.length === 0) {
            break;
        }

        let randomType = GetRandomItem(resistImmuneOptions)!;

        const index = resistImmuneOptions.indexOf(randomType, 0);
        if (index > -1) {
            resistImmuneOptions.splice(index, 1);
        }

        const vulnIndex = vulnerabilityOptions.indexOf(randomType, 0);
        if(vulnIndex > -1) {
            vulnerabilityOptions.splice(index, 1);
        }

        console.log(`Monster is immune to ${DamageType[randomType]}`)
        currentMonsterImmunities.push(DamageType[randomType]);
    }
    for (let i = 0; i < VULNERABILITY_COUNT; i++) {
        if(vulnerabilityOptions.length === 0) {
            break;
        }

        let randomType = GetRandomItem(vulnerabilityOptions)!;

        const index = vulnerabilityOptions.indexOf(randomType, 0);
        if (index > -1) {
            vulnerabilityOptions.splice(index, 1);
        }

        console.log(`Monster is vulnerable to ${DamageType[randomType]}`)
        currentMonsterVulnerabilities.push(DamageType[randomType]);
    }
}

SetupMonsterDamageTypes();

export function LoadMonsterData(): MonsterInfo {
    let monsterInfo: MonsterInfo = {
        Health: 500,
        HitsBeforeAttack: 10,
        Stats: GenerateMonsterStatsFromType(MonsterType.Dragon)
    }

    if(fs.existsSync('boss.json')) {
        monsterInfo = JSON.parse(fs.readFileSync('boss.json', 'utf-8'));
    }

    if(monsterInfo.HitsBeforeAttack === undefined || monsterInfo.HitsBeforeAttack <= 0) {
        monsterInfo.HitsBeforeAttack = GetRandomIntI(5, 10);
    }

    if(monsterInfo.Stats === undefined) {
        monsterInfo.Stats = GenerateMonsterStatsFromType(MonsterType.Dragon);
    }

    return monsterInfo;
}

export async function TriggerMonsterAttack(client: Client) {
    let currentMonsterStats = LoadMonsterData().Stats;
    UpdatePlayerSessionData();

    let highestNumberOfAttacks = 0;
    let allPlayerSessionData = GetAllPlayerSessionsRaw();

    allPlayerSessionData.forEach(player => {
        if(player.TimesAttackedEnemy > highestNumberOfAttacks) {
            highestNumberOfAttacks = player.TimesAttackedEnemy;
        }
    })

    await client.say(process.env.CHANNEL!, currentMonsterStats.AttackMessage.replace("{monster}", currentMonsterStats.Name));

    for (const [key, player] of allPlayerSessionData.entries()) {
        if(player.TimesAttackedEnemy !== 0 && (player.TimesAttackedEnemy !== 1 || GetRandomIntI(0, 1) === 0)) {
            let playerClassInfo = LoadPlayer(player.NameAsDisplayed.toLowerCase());

            //Try to hit
            let roll = GetRandomIntI(1, 20) + currentMonsterStats.AttackAddition;
            let ac = 10 + Math.floor(playerClassInfo.Classes[ClassType.Rogue].Level / 3) + Math.floor(playerClassInfo.Classes[ClassType.Warrior].Level / 5);

            if(DoesPlayerHaveStatusEffect(player.NameAsDisplayed, StatusEffect.IncreaseACBy3)) {
                ac += 3;
            }

            let isUsingObject = false
            if(playerClassInfo.EquippedObject !== undefined) {
                let obj = GetObjectFromInputText(playerClassInfo.EquippedObject.ObjectName);
                if(obj !== undefined) {
                    let hasAtLeastOne = false;
                    for (let i = 0; i < playerClassInfo.Classes.length; i++) {
                        if(obj!.ClassRestrictions?.includes(playerClassInfo.Classes[i].Type)) {
                            hasAtLeastOne = true;
                            break;
                        }
                    }

                    isUsingObject = hasAtLeastOne;
                }
            }

            let gotArmorAdjustment = 0;
            if(isUsingObject) {
                let obj: InventoryObject | undefined = await GetObjectFromInputText(playerClassInfo.EquippedObject!.ObjectName);
                if(obj !== undefined && obj.ObjectOnAttackedAction != undefined) {
                    let defenseObjectInfo: {
                        resistances?: Array<DamageType>,
                        immunities?: Array<DamageType>,
                        vulnerabilities?: Array<DamageType>,
                        armorAdjustment?: number
                    } = obj?.ObjectOnAttackedAction(client, playerClassInfo);

                    if(defenseObjectInfo.armorAdjustment !== undefined) {
                        gotArmorAdjustment = defenseObjectInfo.armorAdjustment;
                        ac += defenseObjectInfo.armorAdjustment;
                    }
                }
            }

            let maxRoll = 20 + currentMonsterStats.AttackAddition;

            if(roll < ac) {
                let text = `${currentMonsterStats.Name} missed @${playerClassInfo.Username} after rolling a ${roll} (Needed ${ac})!`;
                if(isUsingObject && gotArmorAdjustment > 0) {
                    text += ` Their armor was increased by ${gotArmorAdjustment} because of their ${playerClassInfo.EquippedObject!.ObjectName}.`
                }
                await client.say(process.env.CHANNEL!, text);
            }
            else {
                let damagePercentage = player.TimesAttackedEnemy / highestNumberOfAttacks;

                if(roll === maxRoll) {
                    await client.say(process.env.CHANNEL!, `${currentMonsterStats.Name} critical hit ${playerClassInfo.Username}!`);
                }

                let maxDamage = Math.floor(CalculateMaxHealth(playerClassInfo) * GetRandomNumber(currentMonsterStats.DamageRatioRange.min, currentMonsterStats.DamageRatioRange.max));

                let damage = Math.floor(maxDamage * damagePercentage);

                if(roll === maxRoll) {
                    damage *= 2;
                }

                let damageType = GetRandomItem(currentMonsterStats.DamageTypes)!;

                if(isUsingObject && gotArmorAdjustment < 0) {
                    await client.say(process.env.CHANNEL!, `@${playerClassInfo.Username}'s armor was lowered by ${gotArmorAdjustment} because of their ${playerClassInfo.EquippedObject!.ObjectName}!`);
                }

                if(damage > 0) {
                    await ChangePlayerHealth(client, playerClassInfo.Username, -damage, damageType, `Dying to ${currentMonsterStats.Name}`);
                }
            }
        }
    }

    for (const [key, player] of allPlayerSessionData.entries()) {
        player.TimesAttackedEnemy = 0;
        SavePlayerSession(key, player);
    }
}

export function IsMonsterResistant(damageType: DamageType) {
    return currentMonsterResistances.includes(DamageType[damageType]);
}
export function IsMonsterImmune(damageType: DamageType) {
    return currentMonsterImmunities.includes(DamageType[damageType]);
}
export function IsMonsterVulnerable(damageType: DamageType) {
    return currentMonsterVulnerabilities.includes(DamageType[damageType]);
}

export function GetDamageTypeText(damageType: DamageType) {
    let currentMonsterStats = LoadMonsterData().Stats;

    if(IsMonsterResistant(damageType)) {
        return `${currentMonsterStats.Name} is resistant to ${DamageType[damageType].toLowerCase()} damage and takes half damage!`;
    }
    if(IsMonsterImmune(damageType)) {
        return `${currentMonsterStats.Name} is immune to ${DamageType[damageType].toLowerCase()} damage and takes NO DAMAGE!`;
    }
    if(IsMonsterVulnerable(damageType)) {
        return `${currentMonsterStats.Name} is vulnerable to ${DamageType[damageType].toLowerCase()} damage and takes double damage!`;
    }

    return ``;
}

export async function GetAdjustedDamage(client: Client, damage: number, damageType: DamageType, showDamageTypeResponse: boolean = false): Promise<number> {
    let result = damage;

    if(IsMonsterResistant(damageType)) {
        result = Math.floor(damage * 0.5);

        if(showDamageTypeResponse) {
            await client.say(process.env.CHANNEL!, GetDamageTypeText(damageType));
        }
    }
    if(IsMonsterImmune(damageType)) {
        result = 0;

        if(showDamageTypeResponse) {
            await client.say(process.env.CHANNEL!, GetDamageTypeText(damageType));
        }
    }
    if(IsMonsterVulnerable(damageType)) {
        result = Math.floor(damage * 2);

        if(showDamageTypeResponse) {
            await client.say(process.env.CHANNEL!, GetDamageTypeText(damageType));
        }
    }

    return result;
}

export async function DoDamageToMonster(client: Client, username: string, damage: number, damageType: DamageType, showDamageTypeResponse: boolean = true): Promise<boolean> {
    let monsterInfo = LoadMonsterData();
    if(monsterInfo.Health <= 0)
    {
        return true;
    }

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleDamage)) {
        damage *= 2;
    }
    else if(DoesPlayerHaveStatusEffect(username, StatusEffect.IncreasedDamage)) {
        damage *= 1.5;
    }

    damage = await GetAdjustedDamage(client, damage, damageType, showDamageTypeResponse);

    console.log(`Monster took ${damage} ${DamageType[damageType]} damage`);
    monsterInfo.Health -= damage;

    setTimeout(async () => {
        await HandleQuestProgress(client, username, QuestType.DealDamage, damage);
    }, 50);

    if(monsterInfo.Health <= 0) {
        monsterInfo.Health = 0;
        SaveMonsterData(monsterInfo);

        setTimeout(async () => {
            //Light show
            await SetLightColor(1, 1, 1, 0);
            await SetLightBrightness(1, 0);
            setTimeout(async () => {
                await SetLightColor(1, 0, 0, 0);
            }, 1000);
            setTimeout(async () => {
                await SetLightColor(1, 0.5, 0, 0);
            }, 2500);
            setTimeout(async () => {
                await SetLightColor(1, 0, 0, 0);
            }, 4000);
            setTimeout(async () => {
                await FadeOutLights();
            }, 10000);

            await SetSceneItemEnabled("Dragon Fight", false);
            await SetSceneItemEnabled("Dragon Fight Instructions", false);

            await client.say(process.env.CHANNEL!, `${monsterInfo.Stats.Name} has been defeated! Giving everyone who participated 15 EXP.`);

            let sessions = GetAllPlayerSessions();
            for (let i = 0; i < sessions.length; i++) {
                if(sessions[i].AttackedEnemySinceDeath) {// || sessions[i].NameAsDisplayed.toLowerCase() == username.toLowerCase()) {
                    let player = LoadPlayer(sessions[i].NameAsDisplayed);
                    let expToGive = (player.CurrentExpNeeded - player.CurrentExp) * 0.2;
                    await GiveExp(client, sessions[i].NameAsDisplayed, Math.max(15, expToGive));
                    await GivePlayerRandomObject(client, sessions[i].NameAsDisplayed);
                    // await GivePlayerObject(client, sessions[i].NameAsDisplayed, "present")
                }
            }

            PlayTextToSpeech(`${monsterInfo.Stats.Name} has been defeated, something new will return in 5 minutes`, AudioType.GameAlerts);
            setTimeout(async () => {
                GenerateNewMonster();
                SetupMonsterDamageTypes();

                monsterInfo = LoadMonsterData();
                PlayTextToSpeech(`${monsterInfo.Stats.Name} has risen! Get ready to fight.`, AudioType.GameAlerts);
                await SetSceneItemEnabled("Dragon Fight", true);
                await SetSceneItemEnabled("Dragon Fight Instructions", true);
            }, 1000 * 60 * 5)
            // setTimeout(() => {
            //     Broadcast(JSON.stringify({ type: 'startadventure' }));
            // }, 100);

            setTimeout(() => {
                let allPlayerSessionData = GetAllPlayerSessionsRaw();
                for (const [key, player] of allPlayerSessionData.entries()) {
                    player.AttackedEnemySinceDeath = false;
                    SavePlayerSession(key, player);
                }
            }, 10);
        }, 100);



        return true;
    }

    setTimeout(() => {
        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        playerSession.AttackedEnemySinceDeath = true;
        SavePlayerSession(username, playerSession);
    }, 10);

    await GiveExp(client, username, 1);

    Broadcast(JSON.stringify({ type: 'attack', health: monsterInfo.Health }));

    SaveMonsterData(monsterInfo);

    return false;
}

export function GenerateNewMonster(): MonsterInfo {
    let monsterData = LoadMonsterData();
    SetMonsterData(monsterData);
    SaveMonsterData(monsterData);

    Broadcast(JSON.stringify({ type: 'monsterSetup', monsterType: monsterData.Stats.Type, health: monsterData.Health, maxHealth: monsterData.Stats.MaxHealth }));

    return monsterData;
}

function SetMonsterData(monsterData: MonsterInfo) {
    //If it was Bytefire, move to something else, otherwise go back to Bytefire
    if(monsterData.Stats.Type === MonsterType.Dragon) {
        let newMonsterType = GetRandomEnum(MonsterType, [MonsterType.Dragon])!;
        monsterData.Stats = GenerateMonsterStatsFromType(newMonsterType);
    }
    else {
        monsterData.Stats = GenerateMonsterStatsFromType(MonsterType.Dragon);
    }

    monsterData.HitsBeforeAttack = GetRandomIntI(monsterData.Stats.MonsterAttackRateRange.min, monsterData.Stats.MonsterAttackRateRange.max);
    monsterData.Health = monsterData.Stats.MaxHealth;
}

export function ReduceMonsterHits(client: Client) {
    let monsterInfo = LoadMonsterData();

    monsterInfo.HitsBeforeAttack--;
    if(monsterInfo.HitsBeforeAttack <= 0) {
        monsterInfo.HitsBeforeAttack = GetRandomIntI(monsterInfo.Stats.MonsterAttackRateRange.min, monsterInfo.Stats.MonsterAttackRateRange.max);

        setTimeout(async () => {
            await TriggerMonsterAttack(client);
        }, 200);
    }

    SaveMonsterData(monsterInfo);
}

export function SaveMonsterData(monster: MonsterInfo) {
    fs.writeFileSync('boss.json', JSON.stringify(monster));
}

export function StunMonster(client: Client) {
    let dragonInfo = LoadMonsterData();
    let stunTime = GetRandomIntI(3, 10);

    dragonInfo.HitsBeforeAttack += stunTime;
    client.say(process.env.CHANNEL!, `${dragonInfo.Stats.Name} was temporarily stunned and it will take longer for them to attack again!`);

    SaveMonsterData(dragonInfo);
}
