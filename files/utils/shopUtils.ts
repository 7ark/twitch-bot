import {AllInventoryObjects, ObjectRetrievalType, ObjectTier} from "../inventoryDefinitions";
import {GetRandomIntI, GetRandomItem, RemoveFromArray} from "./utils";

let currentSalesmanShop: Array<{obj: string, cost: number}> = [];
let currentGroceryStore: Array<{obj: string, cost: number}> = [];

export function InitializeSalesman() {
    let lowObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.Low && x.CostRange !== undefined && x.Rarity > 0 && x.Retrieval.includes(ObjectRetrievalType.TravelingSalesman));
    let midObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.Mid && x.CostRange !== undefined && x.Rarity > 0 && x.Retrieval.includes(ObjectRetrievalType.TravelingSalesman));
    let highObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.High && x.CostRange !== undefined && x.Rarity > 0 && x.Retrieval.includes(ObjectRetrievalType.TravelingSalesman));

    const lowAmount = 3;
    const midAmount = 2;
    const highAmount = 1;

    currentSalesmanShop = [];
    for (let i = 0; i < lowAmount; i++) {
        let randomObj = GetRandomItem(lowObjects);
        RemoveFromArray(lowObjects, randomObj);

        currentSalesmanShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
    for (let i = 0; i < midAmount; i++) {
        let randomObj = GetRandomItem(midObjects);
        RemoveFromArray(midObjects, randomObj);

        currentSalesmanShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
    for (let i = 0; i < highAmount; i++) {
        let randomObj = GetRandomItem(highObjects);
        RemoveFromArray(highObjects, randomObj);

        currentSalesmanShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
    currentSalesmanShop.sort((x, y) => x.cost - y.cost);
}

export function GetCurrentSalesmanItems(): Array<{obj: string, cost: number}> {
    return currentSalesmanShop;
}

export function InitializeGroceryStore() {
    let objects = AllInventoryObjects.filter(x => x.CostRange !== undefined && x.Retrieval.includes(ObjectRetrievalType.GroceryStore));

    const amount = 15;

    currentGroceryStore = [];
    for (let i = 0; i < amount; i++) {
        if(objects.length == 0){
            break;
        }

        let randomObj = GetRandomItem(objects);
        RemoveFromArray(objects, randomObj);

        currentGroceryStore.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }

    currentGroceryStore.sort((x, y) => x.cost - y.cost);
}

export function GetCurrentGroceryStoreItems(): Array<{obj: string, cost: number}> {
    return currentGroceryStore;
}

