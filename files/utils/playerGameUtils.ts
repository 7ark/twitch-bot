import fs from "fs";
import {ChatUserstate, Client} from "tmi.js";
import {Broadcast} from "../bot";
import {AllInventoryObjects, InventoryObject} from "../inventory";
import {GetRandomIntI, GetRandomItem} from "./utils";
import {BanUser} from "./twitchUtils";

export interface Player {
    Username: string;
    Level: number;
    CurrentHealth: number; //Max calculated based on level
    Classes: Array<Class>;
    LevelUpAvailable: boolean;
    CurrentExp: number;
    CurrentExpNeeded: number;
    KnownMoves: Array<string>;
    ExpBoostMultiplier: number;
    Voice?: string;
    Inventory: Array<string>;
    PassiveModeEnabled: boolean;
}

export enum ClassType { Mage, Warrior, Rogue }

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
        ExpBoostMultiplier: 1,
        Voice: "",
        Inventory: [],
        PassiveModeEnabled: false
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

    if(player.ExpBoostMultiplier == undefined || player.ExpBoostMultiplier <= 0) {
        player.ExpBoostMultiplier = 1;
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

    return max;
}

export function CalculateExpNeeded(level: number) {
    return 5 + (level * (3 + level));
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
    client.say(process.env.CHANNEL!, `@${playerName} has gained ${obj.ContextualName}. ${obj.Info}`)
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

export async function ChangePlayerHealth(client: Client, playerName: string, amount: number, deathReason?: string) {
    let player = LoadPlayer(playerName);
    let maxHealth = CalculateMaxHealth(player);

    if(amount > 0 && player.CurrentHealth >= maxHealth) {
        return;
    }
    
    player.CurrentHealth += amount;
    if(player.CurrentHealth <= 0) {
        player.CurrentHealth = 0;
        
        //Handle death

        client.say(process.env.CHANNEL!, `@${playerName} took ${Math.abs(amount)} damage and DIED! They've been banned for 5 minutes.`);
        player.CurrentHealth = maxHealth;
        await BanUser(client, playerName, 5 * 60, deathReason);
    }
    else if(player.CurrentHealth > maxHealth) {
        player.CurrentHealth = maxHealth;
        client.say(process.env.CHANNEL!, `@${playerName} has healed to full.`);
    }
    else {
        client.say(process.env.CHANNEL!, `@${playerName} has ${amount > 0 ? `healed by ${amount}` : `taken ${Math.abs(amount)} damage`}! [${player.CurrentHealth}/${CalculateMaxHealth(player)}]HP`);
    }
    
    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: playerName, display: amount > 0 ? `+${amount}` : `-${Math.abs(amount)}`, }));
    SavePlayer(player);
}


export async function GiveExp(client: Client, username: string, amount: number) {
    let player = LoadPlayer(username);

    if(player.ExpBoostMultiplier > 1) {
        amount *= player.ExpBoostMultiplier;
    }

    player.CurrentExp += amount;

    if(!player.LevelUpAvailable) {
        if(player.CurrentExp >= player.CurrentExpNeeded) {
            player.LevelUpAvailable = true;
            let text = `@${username} has LEVELED UP! You may choose a class to level into. Use !mage, !warrior, or !rogue to select a class.`;
            if(player.Level == 0) {
                text = ' Passive mode has now been disabled.';
            }
            await client.say(process.env.CHANNEL!, text);

            setTimeout(async () => {
                Broadcast(JSON.stringify({ type: 'exp', displayName: username, display: `LEVEL UP!`, }));
                await ChangePlayerHealth(client, username, Math.floor(CalculateMaxHealth(player) * 0.4));
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
