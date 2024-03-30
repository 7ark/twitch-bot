import {ChangePlayerHealth, LoadPlayer, Player} from "./playerData";
import {ChatUserstate, Client} from "tmi.js";
import {getRandomIntI} from "./utils";

export interface InventoryObject {
    ObjectName: string;
    ContextualName: string;
    ThrownDamage: { min: number, max: number },
    UseAction: (client: Client, player: Player) => void;
    Consumable: boolean;
    Rewardable: boolean;
}

export const allInventoryObjects: Array<InventoryObject> = [
    {
        ObjectName: "dagger",
        ContextualName: "a dagger",
        ThrownDamage: { min: 3, max: 12 },
        UseAction: (client, player) => {
            client.say(process.env.CHANNEL!, `@${player.Username} you twirl your dagger in your hand.`);
        },
        Consumable: false,
        Rewardable: false,
    },
    {
        ObjectName: "healing potion",
        ContextualName: "a healing potion",
        ThrownDamage: { min: -8, max: -2 },
        UseAction: (client, player) => {
            ChangePlayerHealth(client, player.Username, getRandomIntI(5, 15))
        },
        Consumable: true,
        Rewardable: true,
    },
    {
        ObjectName: "sword",
        ContextualName: "a sword",
        ThrownDamage: { min: 3, max: 8 },
        UseAction: (client, player) => {
            client.say(process.env.CHANNEL!, `@${player.Username} you swing through the air a few times, practicing your skills.`);
        },
        Consumable: false,
        Rewardable: false,
    },
    {
        ObjectName: "hammer",
        ContextualName: "a hammer",
        ThrownDamage: { min: 5, max: 8 },
        UseAction: (client, player) => {
            client.say(process.env.CHANNEL!, `@${player.Username} you smash a nearby rock. Nice.`);
        },
        Consumable: false,
        Rewardable: false,
    },
    {
        ObjectName: "wand",
        ContextualName: "a wand",
        ThrownDamage: { min: 1, max: 2 },
        UseAction: (client, player) => {
            client.say(process.env.CHANNEL!, `@${player.Username} you make some sparkles appear.`);
        },
        Consumable: false,
        Rewardable: false,
    },
    //Accuracy potion
]

export function DoesPlayerHaveObject(displayName: string, object: string) {
    let player = LoadPlayer(displayName);

    return player.Inventory.includes(object);
}
