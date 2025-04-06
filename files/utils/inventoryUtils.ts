import {AllInventoryObjects, InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {FormatListNicely} from "./utils";

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
