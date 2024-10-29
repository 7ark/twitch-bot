import {Broadcast} from "../bot";
import fs from "fs";
import {Client} from "tmi.js";
import {
    GetAllPlayerSessions,
    GetAllPlayerSessionsRaw, LoadPlayerSession,
    SavePlayerSession,
    UpdatePlayerSessionData
} from "./playerSessionUtils";
import {
    CalculateMaxHealth,
    ChangePlayerHealth, DoesPlayerHaveStatusEffect, GetObjectFromInputText,
    GiveExp,
    GivePlayerRandomObject,
    LoadPlayer, StatusEffect
} from "./playerGameUtils";
import {SetSceneItemEnabled} from "./obsutils";
import {ClassType, GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils";
import {HandleQuestProgress, QuestType} from "./questUtils";
import {PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {InventoryObject} from "../inventory";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";

enum MonsterType { Dragon }

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

export interface MonsterInfo {
    // Type: MonsterType;
    Health: number;
    MaxHealth: number;
    HitsBeforeAttack: number;
}

const RESISTANCE_COUNT = 2;
const IMMUNITY_COUNT = 1;
const VULNERABILITY_COUNT = 1;

let currentMonsterResistances: Array<string> = [];
let currentMonsterImmunities: Array<string> = [];
let currentMonsterVulnerabilities: Array<string> = [];

export function SetupMonsterDamageTypes() {
    currentMonsterImmunities = [];
    currentMonsterVulnerabilities = [];
    currentMonsterResistances = [];

    let damageTypeOptions = Object.keys(DamageType)
        .filter(k => !isNaN(Number(k))) // Filter out non-numeric keys
        .map(k => k as DamageType);

    for (let i = 0; i < RESISTANCE_COUNT; i++) {
        let randomType = GetRandomItem(damageTypeOptions)!;

        const index = damageTypeOptions.indexOf(randomType, 0);
        if (index > -1) {
            damageTypeOptions.splice(index, 1);
        }

        console.log(`Monster is resistant to ${DamageType[randomType]}`)
        currentMonsterResistances.push(DamageType[randomType]);
    }
    for (let i = 0; i < IMMUNITY_COUNT; i++) {
        let randomType = GetRandomItem(damageTypeOptions)!;

        const index = damageTypeOptions.indexOf(randomType, 0);
        if (index > -1) {
            damageTypeOptions.splice(index, 1);
        }

        console.log(`Monster is immune to ${DamageType[randomType]}`)
        currentMonsterImmunities.push(DamageType[randomType]);
    }
    for (let i = 0; i < VULNERABILITY_COUNT; i++) {
        let randomType = GetRandomItem(damageTypeOptions)!;

        const index = damageTypeOptions.indexOf(randomType, 0);
        if (index > -1) {
            damageTypeOptions.splice(index, 1);
        }

        console.log(`Monster is vulnerable to ${DamageType[randomType]}`)
        currentMonsterVulnerabilities.push(DamageType[randomType]);
    }
}

SetupMonsterDamageTypes();

export function LoadDragonData(): MonsterInfo {
    let dragonInfo: MonsterInfo = {
        // Type: MonsterType.Dragon,
        Health: 500,
        MaxHealth: 500,
        HitsBeforeAttack: 10
    }

    if(fs.existsSync('boss.json')) {
        dragonInfo = JSON.parse(fs.readFileSync('boss.json', 'utf-8'));
    }

    if(dragonInfo.HitsBeforeAttack === undefined || dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = GetRandomIntI(5, 10);
    }

    return dragonInfo;
}

export async function TriggerDragonAttack(client: Client) {
    UpdatePlayerSessionData();

    let highestNumberOfAttacks = 0;
    let allPlayerSessionData = GetAllPlayerSessionsRaw();

    allPlayerSessionData.forEach(player => {
        if(player.TimesAttackedEnemy > highestNumberOfAttacks) {
            highestNumberOfAttacks = player.TimesAttackedEnemy;
        }
    })

    await client.say(process.env.CHANNEL!, `Bytefire is attacking!`);

    for (const [key, player] of allPlayerSessionData.entries()) {
        if(player.TimesAttackedEnemy !== 0 && (player.TimesAttackedEnemy !== 1 || GetRandomIntI(0, 1) === 0)) {
            let playerClassInfo = LoadPlayer(player.NameAsDisplayed.toLowerCase());

            //Try to hit
            let roll = GetRandomIntI(1, 20) + 5;
            let ac = 10 + Math.floor(playerClassInfo.Classes[ClassType.Rogue].Level / 3) + Math.floor(playerClassInfo.Classes[ClassType.Warrior].Level / 5);

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

            let gotArmorAdjustmentOf = 0;
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
                        gotArmorAdjustmentOf = defenseObjectInfo.armorAdjustment;
                        ac += defenseObjectInfo.armorAdjustment;
                    }
                }
            }

            if(roll < ac) {
                let text = `Bytefire missed @${playerClassInfo.Username} after rolling a ${roll} (He needed ${ac})!`;
                if(isUsingObject && gotArmorAdjustmentOf > 0) {
                    text += ` Their armor was increased by ${gotArmorAdjustmentOf} because of their ${playerClassInfo.EquippedObject!.ObjectName}.`
                }
                client.say(process.env.CHANNEL!, text);
            }
            else {
                let damagePercentage = player.TimesAttackedEnemy / highestNumberOfAttacks;

                if(roll === 25) {
                    client.say(process.env.CHANNEL!, `Bytefire critical hit ${playerClassInfo.Username}!`);
                }

                let maxDamage = Math.floor(CalculateMaxHealth(playerClassInfo) * (roll === 25 ? 0.6 : GetRandomNumber(0.2, 0.3)));

                let damage = Math.floor(maxDamage * damagePercentage);

                let bytefireDamageType = GetRandomItem([DamageType.Fire, DamageType.Cold])!;

                if(isUsingObject && gotArmorAdjustmentOf < 0) {
                    client.say(process.env.CHANNEL!, `@${playerClassInfo.Username}'s armor was lowered by ${gotArmorAdjustmentOf} because of their ${playerClassInfo.EquippedObject!.ObjectName}!`);
                }

                if(damage > 0) {
                    await ChangePlayerHealth(client, playerClassInfo.Username, -damage, bytefireDamageType, "Dying to Bytefire");
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
    if(IsMonsterResistant(damageType)) {
        return `Bytefire is resistant to ${DamageType[damageType].toLowerCase()} damage and takes half damage!`;
    }
    if(IsMonsterImmune(damageType)) {
        return `Bytefire is immune to ${DamageType[damageType].toLowerCase()} damage and takes NO DAMAGE!`;
    }
    if(IsMonsterVulnerable(damageType)) {
        return `Bytefire is vulnerable to ${DamageType[damageType].toLowerCase()} damage and takes double damage!`;
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

export async function DoDamage(client: Client, username: string, damage: number, damageType: DamageType, showDamageTypeResponse: boolean = true): Promise<boolean> {
    let dragonInfo = LoadDragonData();
    if(dragonInfo.Health <= 0)
    {
        return;
    }

    damage = await GetAdjustedDamage(client, damage, damageType, showDamageTypeResponse);

    dragonInfo.Health -= damage;

    setTimeout(async () => {
        await HandleQuestProgress(client, username, QuestType.DealDamage, damage);
    }, 50);

    if(dragonInfo.Health <= 0) {
        dragonInfo.Health = 0;
        SaveDragonData(dragonInfo);

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

            await client.say(process.env.CHANNEL!, `Bytefire has been defeated! Giving everyone who participated 15 EXP.`);

            let sessions = GetAllPlayerSessions();
            for (let i = 0; i < sessions.length; i++) {
                let player = LoadPlayer(sessions[i].NameAsDisplayed);
                let expToGive = (player.CurrentExpNeeded - player.CurrentExp) * 0.2;
                await GiveExp(client, sessions[i].NameAsDisplayed, Math.max(15, expToGive));
                await GivePlayerRandomObject(client, sessions[i].NameAsDisplayed);
            }

            PlayTextToSpeech("Bytefire has been defeated and will return in five minutes", AudioType.GameAlerts);
            setTimeout(async () => {
                let dragonData = LoadDragonData();

                dragonData.Health = dragonData.MaxHealth;
                SaveDragonData(dragonData);

                PlayTextToSpeech("Bytefire has returned! Get ready to fight.", AudioType.GameAlerts);
                await SetSceneItemEnabled("Dragon Fight", true);
                await SetSceneItemEnabled("Dragon Fight Instructions", true);
            }, 1000 * 60 * 5)
            // setTimeout(() => {
            //     Broadcast(JSON.stringify({ type: 'startadventure' }));
            // }, 100);
        }, 100);

        return false;
    }

    setTimeout(() => {
        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        SavePlayerSession(username, playerSession);
    }, 100);

    await GiveExp(client, username, 1);

    Broadcast(JSON.stringify({ type: 'attack', info: dragonInfo }));

    SaveDragonData(dragonInfo);

    return true;
}

export function ReduceDragonHits(client: Client) {
    let dragonInfo = LoadDragonData();

    dragonInfo.HitsBeforeAttack--;
    if(dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = GetRandomIntI(5, 10);

        setTimeout(async () => {
            await TriggerDragonAttack(client);
        }, 200);
    }

    SaveDragonData(dragonInfo);
}

export function SaveDragonData(dragon: MonsterInfo) {
    fs.writeFileSync('boss.json', JSON.stringify(dragon));
}

export function StunBytefire(client: Client) {
    let dragonInfo = LoadDragonData();
    let stunTime = GetRandomIntI(3, 10);

    dragonInfo.HitsBeforeAttack += stunTime;
    client.say(process.env.CHANNEL!, `Bytefire was temporarily stunned and it will take longer for them to attack again!`);

    SaveDragonData(dragonInfo);
}
