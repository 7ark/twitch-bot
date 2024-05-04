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
    ChangePlayerHealth,
    GiveExp,
    GivePlayerRandomObject,
    LoadPlayer
} from "./playerGameUtils";
import {SetSceneItemEnabled} from "./obsutils";
import {ClassType, GetRandomIntI, GetRandomNumber} from "./utils";

export interface DragonInfo {
    Health: number;
    MaxHealth: number;
    HitsBeforeAttack: number;
}

export function LoadDragonData(): DragonInfo {
    let dragonInfo: DragonInfo = {
        Health: 500,
        MaxHealth: 500,
        HitsBeforeAttack: 10
    }

    if(fs.existsSync('boss.json')) {
        dragonInfo = JSON.parse(fs.readFileSync('boss.json', 'utf-8'));
    }

    if(dragonInfo.HitsBeforeAttack === undefined || dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = GetRandomIntI(8, 12);
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

            if(roll < ac) {
                client.say(process.env.CHANNEL!, `Bytefire missed ${playerClassInfo.Username} after rolling a ${roll}!`);
            }
            else {
                let damagePercentage = player.TimesAttackedEnemy / highestNumberOfAttacks;

                if(roll === 25) {
                    client.say(process.env.CHANNEL!, `Bytefire critical hit ${playerClassInfo.Username}!`);
                }

                let maxDamage = Math.floor(CalculateMaxHealth(playerClassInfo) * (roll === 25 ? 0.6 : GetRandomNumber(0.1, 0.3)));

                let damage = Math.floor(maxDamage * damagePercentage);

                if(damage > 0) {
                    await ChangePlayerHealth(client, playerClassInfo.Username, -damage, "Dying to Bytefire");
                }
            }
        }
    }

    for (const [key, player] of allPlayerSessionData.entries()) {
        player.TimesAttackedEnemy = 0;
        SavePlayerSession(key, player);
    }
}

export async function DoDamage(client: Client, username: string, damage: number) {
    let dragonInfo = LoadDragonData();
    dragonInfo.Health -= damage;
    if(dragonInfo.Health <= 0) {
        dragonInfo.Health = 0;
        SaveDragonData(dragonInfo);

        setTimeout(async () => {
            await SetSceneItemEnabled("Dragon Fight", false);
            await SetSceneItemEnabled("Dragon Fight Instructions", false);
            await SetSceneItemEnabled("Text Adventure", true);

            await client.say(process.env.CHANNEL!, `Bytefire has been defeated! Giving everyone who participated 15 EXP.`);

            let sessions = GetAllPlayerSessions();
            for (let i = 0; i < sessions.length; i++) {
                await GiveExp(client, sessions[i].NameAsDisplayed, 15);
                await GivePlayerRandomObject(client, sessions[i].NameAsDisplayed);
            }

            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'startadventure' }));
            }, 100);
        }, 100);

        return;
    }

    setTimeout(() => {
        let playerSession: PlayerSessionData = LoadPlayerSession(username);
        playerSession.TimesAttackedEnemy++;
        SavePlayerSession(username, playerSession);
    }, 100);

    await GiveExp(client, username, 1);

    Broadcast(JSON.stringify({ type: 'attack', info: dragonInfo }));

    dragonInfo.HitsBeforeAttack--;
    if(dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = GetRandomIntI(8, 12);

        setTimeout(async () => {
            await TriggerDragonAttack(client);
        }, 200);
    }
    SaveDragonData(dragonInfo);
}

export function SaveDragonData(dragon: DragonInfo) {
    fs.writeFileSync('boss.json', JSON.stringify(dragon));
}

export function StunBytefire(client: Client) {
    let dragonInfo = LoadDragonData();
    let stunTime = GetRandomIntI(3, 10);

    dragonInfo.HitsBeforeAttack += stunTime;
    client.say(process.env.CHANNEL!, `Bytefire was temporarily stunned and it will take longer for them to attack again!`);

    SaveDragonData(dragonInfo);
}
