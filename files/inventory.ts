import {LoadPlayer} from "./playerData";

export interface InventoryObject {
    ObjectName: string;
    ContextualName: string;
    ThrownDamage: { min: number, max: number },
    Consumable: boolean
}

export const allInventoryObjects: Array<InventoryObject> = [
    {
        ObjectName: "dagger",
        ContextualName: "a dagger",
        ThrownDamage: { min: 3, max: 12 },
        Consumable: false,
    },
    {
        ObjectName: "healing potion",
        ContextualName: "a healing potion",
        ThrownDamage: { min: -8, max: -2 },
        Consumable: true,
    },
    {
        ObjectName: "sword",
        ContextualName: "a sword",
        ThrownDamage: { min: 3, max: 8 },
        Consumable: false,
    },
    {
        ObjectName: "hammer",
        ContextualName: "a hammer",
        ThrownDamage: { min: 5, max: 8 },
        Consumable: false,
    },
    {
        ObjectName: "wand",
        ContextualName: "a wand",
        ThrownDamage: { min: 1, max: 2 },
        Consumable: false,
    },
    //Accuracy potion
]

export function DoesPlayerHaveObject(displayName: string, object: string) {
    let player = LoadPlayer(displayName);

    return player.Inventory.includes(object);
}
