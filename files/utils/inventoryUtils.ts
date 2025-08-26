import {AllInventoryObjects, InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {FormatListNicely, GetRandomItem} from "./utils";

export function GetInventoryObjectsBySource(source: ObjectRetrievalType) {
    let allObjs = [...AllInventoryObjects];

    return allObjs.filter(x => x.Retrieval.includes(source));
}

export function GetRecipesItemUsedIn(object: InventoryObject): string {
    let objs = [];
    for (let i = 0; i < AllInventoryObjects.length; i++) {
        if(AllInventoryObjects[i].CraftingRecipe !== undefined && AllInventoryObjects[i].CraftingRecipe.Recipe.some(x => x.Resource == object.ObjectName)) {
            objs.push(`${AllInventoryObjects[i].ObjectName}`);
        }
    }

    return FormatListNicely(objs);
}

export function GetRandomInventoryObjectByRarity(items: InventoryObject[]) {
    let options = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items[i].Rarity; j++) {
            options.push(items[i]);
        }
    }

    return GetRandomItem(options);
}
