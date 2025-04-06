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
    DoPlayerUpgrade,
    GetObjectFromInputText,
    GiveExp,
    GivePlayerRandomObject,
    LoadPlayer, SavePlayer,
} from "./playerGameUtils";
import {SetSceneItemEnabled} from "./obsutils";
import {FormatListNicely, GetEnumValues, GetRandomEnum, GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils";
import {HandleQuestProgress} from "./questUtils";
import {PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {Affliction, ClassType, QuestType, StatusEffect, UpgradeType} from "../valueDefinitions";

enum MonsterType { Dragon, Loaf, Tank, FrankTheTrafficCone }

function GenerateMonsterStatsFromType(type: MonsterType): MonsterStats {
    switch (type) {
        case MonsterType.Dragon:
            return {
                Name: `Bytefire`,
                Type: MonsterType.Dragon,
                AttackMessage: `Bytefire is attacking with breath of fire and ice!`,
                AttackAddition: 8,
                ArmorRange: {min: 13, max: 17},
                DamageRange: {
                    min: 20,
                    max: 40
                },
                DamageTypes: [DamageType.Fire, DamageType.Cold, DamageType.Lightning],
                MaxHealth: 1500,
                MonsterAttackRateRange: { min: 5, max: 10 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Fire, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Fire, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                ExpRange: { min: 7, max: 12 }
            };
        case MonsterType.Loaf:
            return {
                Name: `Loaf the Cat`,
                Type: MonsterType.Loaf,
                AttackMessage: `Loaf is defending himself and scratching at everyone!`,
                AttackAddition: 5,
                ArmorRange: {min: 15, max: 18},
                DamageRange: {
                    min: 10,
                    max: 20
                },
                DamageTypes: [DamageType.Slashing],
                MaxHealth: 1000,
                MonsterAttackRateRange: { min: 2, max: 7 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Slashing, DamageType.Fire, DamageType.Piercing, DamageType.Psychic],
                ExpRange: { min: 5, max: 10 }
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
                ArmorRange: {min: 17, max: 20},
                DamageRange: {
                    min: 30,
                    max: 50
                },
                DamageTypes: [DamageType.Bludgeoning, DamageType.Fire],
                MaxHealth: 500,
                MonsterAttackRateRange: { min: 2, max: 6 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Cold, DamageType.Piercing, DamageType.Psychic, DamageType.Poison],
                VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Fire, DamageType.Piercing],
                ExpRange: { min: 3, max: 7 }
            };
        case MonsterType.FrankTheTrafficCone:
            return {
                Name: "Frank the Traffic Cone",
                Type: MonsterType.FrankTheTrafficCone,
                AttackMessage: `Frank shoves everyone into a pot hole!`,
                AttackAddition: 20,
                ArmorRange: {min: 10, max: 12},
                DamageRange: {
                    min: 3,
                    max: 8
                },
                DamageTypes: [DamageType.Bludgeoning, DamageType.Fire],
                MaxHealth: 3000,
                MonsterAttackRateRange: { min: 15, max: 20 },
                ResistImmuneDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Psychic],
                VulnerabilityDamageTypeOptions: [DamageType.Bludgeoning, DamageType.Slashing, DamageType.Fire, DamageType.Cold, DamageType.Poison, DamageType.Piercing],
                ExpRange: { min: 15, max: 20 }
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
    Lightning,
    Poison,
    Psychic,
}

export interface MonsterStats {
    Name: string;
    Type: MonsterType;
    AttackMessage: string;
    AttackAddition: number;
    DamageRange: { min: number; max: number; }
    DamageTypes: Array<DamageType>;
    MaxHealth: number;
    MonsterAttackRateRange: { min: number; max: number; }
    ResistImmuneDamageTypeOptions: Array<DamageType>;
    VulnerabilityDamageTypeOptions: Array<DamageType>;
    ExpRange: { min: number; max: number; }
    ArmorRange: { min: number; max: number; }
}

interface AfflictionStack {
    AfflictionType: Affliction,
    Amount: number
}

export interface MonsterInfo {
    Health: number;
    HitsBeforeAttack: number;
    CurrentArmor: number;
    Stats: MonsterStats;
    Afflictions: Array<AfflictionStack>;
}

const RESISTANCE_COUNT = 2;
const IMMUNITY_COUNT = 1;
const VULNERABILITY_COUNT = 1;

let currentMonsterResistances: Array<string> = [];
let currentMonsterImmunities: Array<string> = [];
let currentMonsterVulnerabilities: Array<string> = [];
export let MonsterCurrentlyDead = false;

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
        CurrentArmor: 0,
        Stats: GenerateMonsterStatsFromType(MonsterType.Dragon),
        Afflictions: []
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

    if(monsterInfo.CurrentArmor == 0) {
        monsterInfo.CurrentArmor = Math.floor(GetRandomIntI(monsterInfo.Stats.ArmorRange.min, monsterInfo.Stats.ArmorRange.max));
    }

    if(monsterInfo.Afflictions === undefined) {
        ResetMonsterAfflictions(monsterInfo);
    }

    return monsterInfo;
}

function ResetMonsterAfflictions(monsterInfo: MonsterInfo) {
    monsterInfo.Afflictions = [];

    const enumValues = GetEnumValues(Affliction);
    for (let i = 0; i < enumValues.length; i++) {
        let afflictionType: Affliction = enumValues[i];

        monsterInfo.Afflictions.push({
            AfflictionType: afflictionType,
            Amount: 0
        });
    }
}

export function AddAffliction(affliction: Affliction, amount: number) {
    let monsterInfo = LoadMonsterData();

    for (let i = 0; i < monsterInfo.Afflictions.length; i++) {
        if(monsterInfo.Afflictions[i].AfflictionType == affliction) {
            monsterInfo.Afflictions[i].Amount += amount;
            break;
        }
    }

    SaveMonsterData(monsterInfo);
}

export function TickAfflictions(client: Client) {
    let monsterInfo = LoadMonsterData();
    for (let i = 0; i < monsterInfo.Afflictions.length; i++) {
        if(monsterInfo.Afflictions[i].Amount > 0){
            TriggerAffliction(client, monsterInfo, monsterInfo.Afflictions[i].AfflictionType);
            monsterInfo.Afflictions[i].Amount--;
        }
    }
    SaveMonsterData(monsterInfo);
}

export function GetAfflictionCount(affliction: Affliction) {
    let monsterInfo = LoadMonsterData();

    for (let i = 0; i < monsterInfo.Afflictions.length; i++) {
        if(monsterInfo.Afflictions[i].AfflictionType == affliction) {
            return monsterInfo.Afflictions[i].Amount;
        }
    }

    return 0;
}

function TriggerAffliction(client: Client, monsterInfo: MonsterInfo, affliction: Affliction) {
    if(MonsterCurrentlyDead) {
        return;
    }
    switch (affliction) {
        case Affliction.Burning:
            HandleDamage(client, 1, DamageType.Fire);
            break;
        case Affliction.Poison:
            HandleDamage(client, 1, DamageType.Poison);
            break;
    }

    let allPlayersInSession = GetAllPlayerSessions();
    for (let i = 0; i < allPlayersInSession.length; i++) {
        DoPlayerUpgrade(allPlayersInSession[i].NameAsDisplayed.toLowerCase(), UpgradeType.HealWhenMonsterTakesAfflictionDamage, async (upgrade, strength, strengthPercentage) => {
            await ChangePlayerHealth(client, allPlayersInSession[i].NameAsDisplayed.toLowerCase(), strength, DamageType.None, "", false);
        });
    }
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

    let finalText = `${currentMonsterStats.AttackMessage.replace("{monster}", currentMonsterStats.Name)} ${currentMonsterStats.Name} `;

    let playersWithShield: Array<{
        player: string,
        reduce: number
    }> = [];

    let unshieldedPlayers = 0;
    for (const [key, player] of allPlayerSessionData.entries()) {
        if(player.TimesAttackedEnemy !== 0) {
            unshieldedPlayers++;
            DoPlayerUpgrade(player.NameAsDisplayed.toLowerCase(), UpgradeType.ShieldDamageFromOtherPlayers, (upgrade, strength, strengthPercentage) => {
                playersWithShield.push({
                    player: player.NameAsDisplayed.toLowerCase(),
                    reduce: strength
                })
            });
        }
    }

    unshieldedPlayers -= playersWithShield.length;

    let misses: Array<string> = [];
    let hits: Array<string> = [];

    for (const [key, player] of allPlayerSessionData.entries()) {
        if(player.TimesAttackedEnemy !== 0) { // && (player.TimesAttackedEnemy !== 1 || GetRandomIntI(0, 1) === 0)) {
            let playerClassInfo = LoadPlayer(player.NameAsDisplayed.toLowerCase());

            //Try to hit
            let roll = GetRandomIntI(1, 20) + currentMonsterStats.AttackAddition;
            let ac = 10 + Math.floor(playerClassInfo.Classes[ClassType.Rogue].Level / 3) + Math.floor(playerClassInfo.Classes[ClassType.Warrior].Level / 5);

            if(DoesPlayerHaveStatusEffect(player.NameAsDisplayed, StatusEffect.IncreaseACBy3)) {
                ac += 3;
            }
            
            DoPlayerUpgrade(playerClassInfo.Username, UpgradeType.IncreaseAC, async (upgrade, strength, strengthPercentage) => {
                ac += strength;
            });

            if(playerClassInfo.CurrentHealth > CalculateMaxHealth(playerClassInfo) * 0.7) {
                DoPlayerUpgrade(playerClassInfo.Username, UpgradeType.IncreaseArmorWhenAbove70Percent, async (upgrade, strength, strengthPercentage) => {
                    ac += strength;
                });
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
                let txt = `@${playerClassInfo.Username}`;
                if(isUsingObject && gotArmorAdjustment > 0) {
                    finalText += ` (+${gotArmorAdjustment}AC - ${playerClassInfo.EquippedObject!.ObjectName})`;
                }
                misses.push(txt);

                DoPlayerUpgrade(playerClassInfo.Username, UpgradeType.DodgeHeal, async (upgrade, strength, strengthPercentage) => {
                    setTimeout(async () => {
                        await ChangePlayerHealth(client, playerClassInfo.Username, Math.floor(strength), DamageType.None);
                    }, 10)
                });

            }
            else {
                let damagePercentage = player.TimesAttackedEnemy / highestNumberOfAttacks;

                let txt = ``;
                if(roll === maxRoll) {
                    txt += `CRITICAL HIT @${playerClassInfo.Username} `;
                    // await client.say(process.env.CHANNEL!, `${currentMonsterStats.Name} critical hit ${playerClassInfo.Username}!`);
                }
                else {
                    txt += `hit @${playerClassInfo.Username} `;
                }

                let damage = Math.floor(GetRandomNumber(currentMonsterStats.DamageRange.min, currentMonsterStats.DamageRange.max) * damagePercentage);

                if(roll === maxRoll) {
                    damage *= 2;
                }

                let damageType = GetRandomItem(currentMonsterStats.DamageTypes)!;

                if(isUsingObject && gotArmorAdjustment < 0) {
                    txt += `(-${gotArmorAdjustment}AC - ${playerClassInfo.EquippedObject!.ObjectName}) `
                }

                if(damage > 0) {
                    DoPlayerUpgrade(playerClassInfo.Username, UpgradeType.LessDamageWhenBelow30Percent, async (upgrade, strength, strengthPercentage) => {
                        let maxHealth = CalculateMaxHealth(playerClassInfo);
                        let currentHealth = playerClassInfo.CurrentHealth;
                        let healthPercentage = currentHealth / maxHealth;
    
                        if(healthPercentage < 0.3) {
                            let reduction = Math.ceil(damage * strengthPercentage);
                            damage -= reduction;

                            txt += `(-${reduction}DMG - ${upgrade.Name}) `;
                        }
                    });

                    DoPlayerUpgrade(playerClassInfo.Username, UpgradeType.FatalDamageSave, async (upgrade, strength, strengthPercentage) => {
                        if(damage >= CalculateMaxHealth(playerClassInfo)) {
                            if(GetRandomIntI(0, 100) <= strength) {
                                damage = CalculateMaxHealth(playerClassInfo) - 1;
                                setTimeout(async () => {
                                    await client.say(process.env.CHANNEL!, `@${playerClassInfo.Username}'s ${upgrade.Name} saved them from death!`);
                                }, 10)
                            }
                        }
                    });

                    let shieldedPlayer = playersWithShield.find(x => x.player == playerClassInfo.Username);
                    if(shieldedPlayer != undefined) {
                        damage += shieldedPlayer.reduce * unshieldedPlayers;
                    }
                    else if(playersWithShield.length > 0) {
                        let damageReduction = 0;
                        for (let i = 0; i < playersWithShield.length; i++) {
                            damageReduction += playersWithShield[i].reduce;
                        }
                        damage -= damageReduction;
                    }

                    damage = Math.floor(damage);

                    if(damage > 0) {
                        txt += `for ${damage} ${DamageType[damageType]} damage`;
                        hits.push(txt);
                        setTimeout(async () => {
                            await ChangePlayerHealth(client, playerClassInfo.Username, -damage, damageType, `Dying to ${currentMonsterStats.Name}`, false);
                        }, 10)
                    }
                }
            }
        }
    }

    if(misses.length > 0) {
        finalText += `missed ${FormatListNicely(misses)}`;

        if(hits.length > 0) {
            finalText += ". They ";
        }
    }
    if(hits.length > 0) {
        finalText += FormatListNicely(hits);
    }

    await client.say(process.env.CHANNEL!, finalText);

    if(playersWithShield.length > 0 && playersWithShield.length != (hits.length + misses.length)) {
        let shieldText = "Thanks to ";
        for (let i = 0; i < playersWithShield.length; i++) {
            shieldText += `@${playersWithShield[i].player}`;
            if(i < playersWithShield.length - 2) {
                shieldText += ", ";
            }
            else if(i < playersWithShield.length - 1) {
                shieldText += " and ";
            }
        }

        let damageReduction = 0;
        for (let i = 0; i < playersWithShield.length; i++) {
            damageReduction += playersWithShield[i].reduce;
        }

        shieldText += `, everyone took ${damageReduction} less damage!`;

        await client.say(process.env.CHANNEL!, shieldText);
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
        result = Math.ceil(damage * 0.5);

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

    DoPlayerUpgrade(username, UpgradeType.ApplyAffliction, (upgrade, strength, strengthPercentage) => {
        for (let j = 0; j < upgrade.Effects.length; j++) {
            for (let i = 0; i < upgrade.Effects[j].AfflictionsImposed.length; i++) {
                let afflictionCount = strength;
                DoPlayerUpgrade(username, UpgradeType.MoreAfflictions, (upgrade, strength, strengthPercentage) => {
                    afflictionCount += strength;
                });
                AddAffliction(upgrade.Effects[j].AfflictionsImposed[i], afflictionCount);
            }
        }
    });

    DoPlayerUpgrade(username, UpgradeType.RandomAfflictionChance, (upgrade, strength, strengthPercentage) => {
        if(GetRandomIntI(0, 100) <= strength) {
            AddAffliction(GetRandomEnum(Affliction)!, 1);
        }
    });

    DoPlayerUpgrade(username, UpgradeType.DamageChangePercentage, (upgrade, strength, strengthPercentage) => {
        damage += damage * strengthPercentage;
    });

    let player = LoadPlayer(username);
    if(player.CurrentHealth <= CalculateMaxHealth(player) * 0.3) {
        DoPlayerUpgrade(username, UpgradeType.MoreDamageWhenBelow30Percent, (upgrade, strength, strengthPercentage) => {
            damage += damage * strengthPercentage;
        });
    }

    if(GetAfflictionCount(Affliction.Curse) > 0) {
        damage += Math.floor((damage * 0.02) * GetAfflictionCount(Affliction.Curse));
    }

    //Min 1 damage
    if(damage <= 0) {
        damage = 1;
    }

    damage = await GetAdjustedDamage(client, damage, damageType, showDamageTypeResponse);

    DoPlayerUpgrade(username, UpgradeType.LifestealChance, async (upgrade, strength, strengthPercentage) => {
        if(GetRandomIntI(0, 100) <= strength) {
            await ChangePlayerHealth(client, username, Math.floor(damage), DamageType.None);
            await client.say(process.env.CHANNEL!, `@${username} gained ${Math.floor(damage)} health from their ${upgrade.Name}!`);
        }
    });

    DoPlayerUpgrade(username, UpgradeType.GemsForDamageChance, async (upgrade, strength, strengthPercentage) => {
        if(GetRandomIntI(0, 100) <= strength) {
            player.SpendableGems += Math.floor(damage);
            SavePlayer(player)
            await client.say(process.env.CHANNEL!, `@${username} gained ${Math.floor(damage)} gems from their ${upgrade.Name}!`);
        }
    });

    DoPlayerUpgrade(username, UpgradeType.DoubleAfflictionsChance, (upgrade, strength, strengthPercentage) => {
        if(GetRandomIntI(0, 100) <= strength) {
            for (let i = 0; i < monsterInfo.Afflictions.length; i++) {
                AddAffliction(monsterInfo.Afflictions[i].AfflictionType, monsterInfo.Afflictions[i].Amount);
            }
        }
    });

    DoPlayerUpgrade(username, UpgradeType.HealForDamageDealt, (upgrade, strength, strengthPercentage) => {
        ChangePlayerHealth(client, username, Math.floor(damage * strengthPercentage), DamageType.None);
    });

    let dragonDied = HandleDamage(client, damage, damageType);

    setTimeout(async () => {
        await HandleQuestProgress(client, username, QuestType.DealDamage, damage);
    }, 50);


    setTimeout(() => {
        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        playerSession.AttackedEnemySinceDeath = true;
        SavePlayerSession(username, playerSession);
    }, 10);

    await GiveExp(client, username, 1);

    return dragonDied;
}

function HandleDamage(client: Client, damage: number, damageType: DamageType): boolean {
    let monsterInfo = LoadMonsterData();

    if(monsterInfo.Health <= 0) {
        return false;
    }

    console.log(`Monster took ${damage} ${DamageType[damageType]} damage`);
    monsterInfo.Health -= Math.floor(damage);

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

                    let expToGive = GetRandomIntI(monsterInfo.Stats.ExpRange.min, monsterInfo.Stats.ExpRange.max) * player.Level;
                    DoPlayerUpgrade(sessions[i].NameAsDisplayed, UpgradeType.DefeatGems, async (upgrade, strength, strengthPercentage) => {
                        player.SpendableGems += strength;
                        SavePlayer(player);
                        await client.say(process.env.CHANNEL!, `${player.Username} received ${strength} extra gems for defeating ${monsterInfo.Stats.Name} because of ${upgrade.Name}!`);
                    });
                    await GiveExp(client, sessions[i].NameAsDisplayed, expToGive);
                    await GivePlayerRandomObject(client, sessions[i].NameAsDisplayed, ObjectRetrievalType.RandomReward);
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

    Broadcast(JSON.stringify({ type: 'attack', health: monsterInfo.Health }));

    SaveMonsterData(monsterInfo);

    return false;
}

export async function InitialMonsterSetup() {
    let monsterInfo = LoadMonsterData();
    if(monsterInfo.Health == 0) {
        GenerateNewMonster();
        SetupMonsterDamageTypes();

        await SetSceneItemEnabled("Dragon Fight", true);
        await SetSceneItemEnabled("Dragon Fight Instructions", true);
    }
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
    monsterData.CurrentArmor = Math.floor(GetRandomIntI(monsterData.Stats.ArmorRange.min, monsterData.Stats.ArmorRange.max));
    ResetMonsterAfflictions(monsterData);
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
