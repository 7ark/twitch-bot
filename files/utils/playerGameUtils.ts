import fs from "fs";
import {Client} from "tmi.js";
import {Broadcast} from "../bot";
import {AllInventoryObjects, InventoryObject, ObjectTier} from "../inventory";
import {ClassType, GetRandomIntI, GetRandomItem, GetSecondsBetweenDates} from "./utils";
import {BanUser} from "./twitchUtils";
import {LoadPlayerSession, SavePlayerSession} from "./playerSessionUtils";
import {HandleQuestProgress, Quest, QuestType} from "./questUtils";
import {DamageType} from "./dragonUtils";

const COZY_POINT_HEALTH_CONVERSION = 5;

export enum StatusEffect { DoubleExp, Drunk, DoubleAccuracy, FireResistance, ColdResistance }

export interface StatusEffectModule {
    Effect: StatusEffect;
    WhenEffectStarted: Date;
    EffectTimeInSeconds: number;
}

export interface EquippableObjectReference {
    ObjectName: string;
    RemainingDurability: number;
}

export interface Player {
    Username: string;
    Level: number;
    CurrentHealth: number; //Max calculated based on level
    Classes: Array<Class>;
    LevelUpAvailable: boolean;
    CurrentExp: number;
    CurrentExpNeeded: number;
    KnownMoves: Array<string>;
    Voice?: string;
    Inventory: Array<string>;
    PassiveModeEnabled: boolean;
    Deaths: number;
    StatusEffects: Array<StatusEffectModule>;
    EquippedObject?: EquippableObjectReference | undefined;
    EquippedBacklog?: Array<EquippableObjectReference>;
    Gems: number;
    SpendableGems: number;
    CurrentQuest: Quest | undefined;
    CozyPoints: number;
}

export interface Class {
    Type: ClassType;
    Level: number;
}

export function TryLoadPlayer(displayName: string): Player | null {
    displayName = displayName.toLowerCase();

    if(fs.existsSync('playerData.json')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            if(currPlayer.Username == displayName) {
                return currPlayer;
            }
        }
    }

    return null;
}

export function LoadAllPlayers(): Array<Player> {
    let allPlayers: Array<Player> = [];

    if(fs.existsSync('playerData.json')) {
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
        ],
        LevelUpAvailable: false,
        CurrentExp: 0,
        CurrentExpNeeded: CalculateExpNeeded(0),
        KnownMoves: ["punch"],
        Voice: "",
        Deaths: 0,
        Inventory: [],
        StatusEffects: [],
        PassiveModeEnabled: false,
        Gems: 0,
        SpendableGems: 0,
        CurrentQuest: undefined,
        CozyPoints: 0
    }

    if(fs.existsSync('playerData.json')) {
        let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
        for (let i = 0; i < allPlayerData.length; i++) {
            let currPlayer: Player = allPlayerData[i];

            if(currPlayer.Username == displayName) {
                player = currPlayer;
                break;
            }
        }
    }

    if(player.KnownMoves === undefined || player.KnownMoves === null || player.KnownMoves.length === 0) {
        player.KnownMoves = ["punch"];
    }

    if(player.Inventory === undefined) {
        player.Inventory = [];
    }
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Type === ClassType.Rogue) {
            if(player.Classes[i].Level > 0 && !player.Inventory.includes("dagger")) {
                player.Inventory.push("dagger");
            }
        }
        if(player.Classes[i].Type === ClassType.Warrior) {
            if(player.Classes[i].Level > 0 && !player.Inventory.includes("sword")) {
                player.Inventory.push("sword");
            }
            if(player.Classes[i].Level > 0 && !player.Inventory.includes("hammer")) {
                player.Inventory.push("hammer");
            }
        }
        if(player.Classes[i].Type === ClassType.Mage) {
            if(player.Classes[i].Level > 0 && !player.Inventory.includes("wand")) {
                player.Inventory.push("wand");
            }
        }
    }

    if(player.CurrentHealth === undefined || player.CurrentHealth <= 0) {
        player.CurrentHealth = CalculateMaxHealth(player);
    }

    if(player.Deaths == undefined) {
        player.Deaths = 0;
    }

    if(player.StatusEffects === undefined) {
        player.StatusEffects = [];
    }

    if(player.Gems == undefined) {
        player.Gems = 0;
    }
    if(player.SpendableGems == undefined){
        player.SpendableGems = player.Gems;
    }

    if(player.CozyPoints == undefined) {
        player.CozyPoints = 0;
    }

    for (let i = player.StatusEffects.length - 1; i >= 0; i--) {
        let se = player.StatusEffects[i];

        // console.log(`Checking ${se.Effect}: ${se.WhenEffectStarted}`)

        if(GetSecondsBetweenDates(se.WhenEffectStarted, new Date()) >= se.EffectTimeInSeconds) {
            player.StatusEffects.splice(i, 1);
        }
    }

    return player;
}

export function SavePlayer(player: Player) {
    let allPlayers: Array<Player> = [];
    if(fs.existsSync('playerData.json')) {
        allPlayers = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
    }
    else {
        allPlayers = [];
    }

    let found: boolean = false;
    for (let i = 0; i < allPlayers.length; i++) {
        if(allPlayers[i].Username == player.Username) {
            allPlayers[i] = player;
            found = true;
            break;
        }
    }
    if(!found) {
        allPlayers.push(player);
    }

    fs.writeFileSync('playerData.json', JSON.stringify(allPlayers));
}

export function CalculateMaxHealth(player: Player): number {
    let max = 25;
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Type === ClassType.Rogue) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 15;
            }
        }
        if(player.Classes[i].Type === ClassType.Warrior) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 25;
            }
        }
        if(player.Classes[i].Type === ClassType.Mage) {
            for (let j = 0; j < player.Classes[i].Level; j++) {
                max += 5;
            }
        }
    }

    max += player.CozyPoints * COZY_POINT_HEALTH_CONVERSION;

    return max;
}

export function CalculateExpNeeded(level: number) {
    return 5 + (level * (3 + level));
}

export function GivePlayerRandomObjectInTier(client: Client, playerName: string, tier: Array<ObjectTier>) {
    let player = LoadPlayer(playerName);
    let options: Array<InventoryObject> = [];
    for (let i = 0; i < AllInventoryObjects.length; i++) {
        if(AllInventoryObjects[i].Rewardable && tier.includes(AllInventoryObjects[i].Tier)) {
            if(AllInventoryObjects[i].Consumable || !player.Inventory.includes(AllInventoryObjects[i].ObjectName)) {
                for (let j = 0; j < AllInventoryObjects[i].Rarity; j++) {
                    options.push(AllInventoryObjects[i]);
                }
            }
        }
    }

    let obj = GetRandomItem(options)!;

    GivePlayerObject(client, playerName, obj.ObjectName);
}

export function GivePlayerRandomObject(client: Client, playerName: string) {
    let player = LoadPlayer(playerName);
    let options: Array<InventoryObject> = [];
    for (let i = 0; i < AllInventoryObjects.length; i++) {
        if(AllInventoryObjects[i].Rewardable) {
            if(AllInventoryObjects[i].Consumable || !player.Inventory.includes(AllInventoryObjects[i].ObjectName)) {
                for (let j = 0; j < AllInventoryObjects[i].Rarity; j++) {
                    options.push(AllInventoryObjects[i]);
                }
            }
        }
    }

    let obj = GetRandomItem(options)!;

    GivePlayerObject(client, playerName, obj.ObjectName);
}

export function GivePlayerObject(client: Client, playerName: string, object: string) {
    let player = LoadPlayer(playerName);
    player.Inventory.push(object);
    SavePlayer(player);

    let obj = AllInventoryObjects.find(x => x.ObjectName === object);
    client.say(process.env.CHANNEL!, `@${playerName} has gained ${obj.ContextualName}. ${obj.Info}`);

    setTimeout(async () => {
        await HandleQuestProgress(client, playerName, QuestType.GetItem, 1);
    }, 10);
}

export function TakeObjectFromPlayer(playerName: string, object: string) {
    let player = LoadPlayer(playerName);
    if(player.Inventory.includes(object)) {
        const index = player.Inventory.indexOf(object, 0);
        if (index > -1) {
            player.Inventory.splice(index, 1);
        }
    }

    SavePlayer(player);
}

export function GetRandomRewardableObjectFromPlayer(playerName: string, exclusions: Array<string> = []): InventoryObject | null {
    let player = LoadPlayer(playerName);
    let options = [];
    for (let i = 0; i < player.Inventory.length; i++) {
        let obj: InventoryObject = AllInventoryObjects.find(x => x.ObjectName == player.Inventory[i])!;

        if(obj.Rewardable && !exclusions.includes(obj.ObjectName)) {
            options.push(obj);
        }
    }

    if(options.length == 0) {
        return null;
    }

    return GetRandomItem(options);
}

export async function ChangePlayerHealth(client: Client, playerName: string, amount: number, damageType: DamageType, deathReason?: string) {
    let player = LoadPlayer(playerName);
    let maxHealth = CalculateMaxHealth(player);

    if(amount > 0 && player.CurrentHealth >= maxHealth) {
        return;
    }
    
    player.CurrentHealth += amount;
    if(player.CurrentHealth <= 0) {
        player.CurrentHealth = 0

        client.say(process.env.CHANNEL!, `@${playerName} took ${Math.abs(amount)} damage and DIED! They've been banned for 5 minutes.`);
        player.CurrentHealth = maxHealth;
        player.Deaths++;

        let playerSession = LoadPlayerSession(player.Username);
        playerSession.TimesDied++;
        SavePlayerSession(player.Username, playerSession);

        //Show dead stickman
        setTimeout(() => {
            Broadcast(JSON.stringify({ type: 'changestickmanappearance', displayName: player.Username, changeType: 'died' }));
        }, 1000);

        //Show revived stickman
        setTimeout(() => {
            Broadcast(JSON.stringify({ type: 'changestickmanappearance', displayName: player.Username, changeType: 'revive' }));
        }, 1000 * 60 * 5);

        await BanUser(client, playerName, 5 * 60, deathReason);
    }
    else if(player.CurrentHealth > maxHealth) {
        player.CurrentHealth = maxHealth;
        client.say(process.env.CHANNEL!, `@${playerName} has healed to full.`);
    }
    else {
        client.say(process.env.CHANNEL!, `@${playerName} has ${amount > 0 ? `healed by ${amount}` : `taken ${Math.abs(amount)} ${DamageType[damageType]} damage`}! [${player.CurrentHealth}/${CalculateMaxHealth(player)}]HP`);
    }
    
    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: playerName, display: amount > 0 ? `+${amount}` : `-${Math.abs(amount)}`, }));
    SavePlayer(player);
}


export async function GiveExp(client: Client, username: string, amount: number) {
    let player = LoadPlayer(username);

    if(DoesPlayerHaveStatusEffect(username, StatusEffect.DoubleExp)) {
        amount *= 2;
    }

    player.CurrentExp += amount;

    if(!player.LevelUpAvailable) {
        if(player.CurrentExp >= player.CurrentExpNeeded) {
            player.LevelUpAvailable = true;
            let text = `@${username} has LEVELED UP! You may choose a class to level into. Use !mage, !warrior, or !rogue to select a class.`;
            if(player.Level == 0) {
                text += ' Passive mode has now been disabled.';
            }
            await client.say(process.env.CHANNEL!, text);

            setTimeout(async () => {
                Broadcast(JSON.stringify({ type: 'exp', displayName: username, display: `LEVEL UP!`, }));
                await ChangePlayerHealth(client, username, Math.floor(CalculateMaxHealth(player) * 0.4), DamageType.None);
            }, 700);
        }
        else {
            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'exp', displayName: username, display: `+${amount}EXP`, }));
            }, 700);
        }
    }

    SavePlayer(player);
}

export async function RandomlyGiveExp(client: Client, username: string, chanceOutOfTen: number, exp: number) {
    let chance = Math.random() * 10;
    if(chance <= chanceOutOfTen) {
        await GiveExp(client, username, GetRandomIntI(1, 2));
    }
}

export function GetObjectFromInputText(text: string): InventoryObject | undefined {
    let pieces = text.trim().split(' ');
    for (let i = 0; i < pieces.length; i++) {
        let textPiece = "";
        for (let j = i; j < pieces.length; j++) {
            if(textPiece != "") {
                textPiece += " ";
            }
            textPiece += pieces[j];
            let foundObject = CheckTextInstance(textPiece);
            if(foundObject !== undefined) {
                return foundObject;
            }
        }
    }

    return undefined;
}

function CheckTextInstance(text: string): InventoryObject | undefined {
    let inventoryObject: InventoryObject | undefined = AllInventoryObjects.find(x => text === (x.ObjectName) || (x.Alias != undefined && x.Alias.some(y => text === (y))))!;

    if(inventoryObject === undefined) {
        inventoryObject = AllInventoryObjects.find(x => text.includes(x.ObjectName) || (x.Alias != undefined && x.Alias.some(y => text.includes(y))))!;
    }

    return inventoryObject;
}

export function AddStatusEffectToPlayer(username: string, effect: StatusEffect, timeInSeconds: number) {
    let player = LoadPlayer(username);

    let existingEffectIndex = player.StatusEffects.findIndex(x => x.Effect == effect);
    if(existingEffectIndex == -1) {
        player.StatusEffects.push({
            Effect: effect,
            WhenEffectStarted: new Date(),
            EffectTimeInSeconds: timeInSeconds
        })
    }
    else {
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

export function GiveCozyPoints(username: string, points: number) {
    let player = LoadPlayer(username);
    player.CozyPoints += points;
    player.CurrentHealth += points * COZY_POINT_HEALTH_CONVERSION;
    SavePlayer(player);
}

export function ProcessCozyPointTick(username: string) {
    let player = LoadPlayer(username);
    if(player.CozyPoints > 0) {
        player.CozyPoints--;

        let max = CalculateMaxHealth(player);
        if(player.CurrentHealth >= max) {
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
