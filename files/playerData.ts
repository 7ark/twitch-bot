import fs from "fs";

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
}

export enum ClassType { Mage, Warrior, Rogue }

export interface Class {
    Type: ClassType;
    Level: number;
}

export function LoadPlayer(displayName: string): Player {
    displayName = displayName.toLowerCase();

    let player: Player = {
        Username: displayName,
        Level: 0,
        CurrentHealth: 5,
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
        CurrentExpNeeded: calculateExpNeeded(0),
        KnownMoves: ["punch"],
        ExpBoostMultiplier: 1,
        Voice: "",
        Inventory: []
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
        player.CurrentHealth = calculateMaxHealth(player);
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

export function calculateMaxHealth(player: Player): number {
    let max = 25;
    for (let i = 0; i < player.Classes.length; i++) {
        if(player.Classes[i].Type === ClassType.Rogue) {
            max += 25;
        }
        if(player.Classes[i].Type === ClassType.Warrior) {
            max += 50;
        }
        if(player.Classes[i].Type === ClassType.Mage) {
            max += 10;
        }
    }

    return max;
}

export function calculateExpNeeded(level: number) {
    return 15 + (level * 5);
}

export function GivePlayerObject(playerName: string, object: string) {
    let player = LoadPlayer(playerName);
    player.Inventory.push(object);
    SavePlayer(player);
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

export function ChangePlayerHealth(amount: number) {

}
