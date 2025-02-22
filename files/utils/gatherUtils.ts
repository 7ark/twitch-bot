import {Client} from "tmi.js";
import {Player} from "../valueDefinitions";
import {ChangePlayerHealth, GivePlayerObject, LoadAllPlayers, LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetInventoryObjectsBySource, GetRandomIntI, GetRandomItem} from "./utils";
import {InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {DamageType} from "./monsterUtils";

export enum GatherType { Forage, Hunt }

export enum GatherResult {
    GainObject,
    TakeDamage,
    Nothing
}

export async function StartGathering(client: Client, player: Player, type: GatherType) {
    if(player.GatheringResources) {
        await client.say(process.env.CHANNEL!, `@${player.Username}, you're already out trying to get resources!`);

        return;
    }

    player.GatheringResources = true;
    SavePlayer(player);

    switch (type) {
        case GatherType.Forage:
            await StartForaging(client, player);
            break;
        case GatherType.Hunt:
            await StartHunting(client, player);
            break;
    }

    let afterPlayer = LoadPlayer(player.Username);
    afterPlayer.GatheringResources = false;
    SavePlayer(afterPlayer);
}

async function StartForaging(client: Client, player: Player) {
    let forageTimeSeconds = GetRandomIntI(60, 60 * 3);
    let foragableItems = GetInventoryObjectsBySource(ObjectRetrievalType.Foragable);

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${GetRandomItem([
        `you head out in search of goodies!`,
        `you wander into the nearby forest looking for anything useful.`,
        `you walk towards the nearby mountain, hoping for something new to find.`,
        `you start digging through the underbrush, looking for something useful.`
    ])}`);

    let resultArray: Array<GatherResult> = [
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.Nothing,
        GatherResult.TakeDamage
    ];

    let firstResult = GetRandomItem(resultArray)!;

    let resultText = await HandleGather(client, firstResult, foragableItems, player, forageTimeSeconds);

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != firstResult);

        let secondResult = GetRandomItem(resultArray)!;

        resultText += ` While returning home `;

        resultText += await HandleGather(client, secondResult, foragableItems, player, 0);
    }

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${resultText}`);
}

async function StartHunting(client: Client, player: Player) {
    let huntTimeSeconds = GetRandomIntI(60, 60 * 3);
    let huntableItems = GetInventoryObjectsBySource(ObjectRetrievalType.Huntable);

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${GetRandomItem([
        `you head out keeping an eye peeled for any animals.`,
        `you start following some tracks in the underbrush, hoping they'll lead to prey.`,
        `you prepare yourself to find any animals in the nearby area, and set off.`,
        `you wield a small knife, searching for any animals in the wilderness.`
    ])}`);

    let resultArray: Array<GatherResult> = [
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.Nothing,
        GatherResult.TakeDamage,
        GatherResult.TakeDamage,
        GatherResult.TakeDamage,
    ];

    let firstResult = GetRandomItem(resultArray)!;

    let resultText = await HandleGather(client, firstResult, huntableItems, player, huntTimeSeconds);

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != firstResult);

        let secondResult = GetRandomItem(resultArray)!;

        resultText += ` While returning home `;

        resultText += await HandleGather(client, secondResult, huntableItems, player, 0);
    }

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${resultText}`);
}

async function HandleGather(client: Client, gatherType: GatherResult, items: Array<InventoryObject>, player: Player, time: number): Promise<string> {
    switch (gatherType) {
        case GatherResult.GainObject:
            let randomItem = GetRandomItem(items)!;
            if(randomItem.GatherText !== undefined) {
                let randomFlavorText = GetRandomItem(randomItem.GatherText)!;

                if(time > 0) {
                    if(randomItem.GatherTimeMultiplier !== undefined) {
                        time = time * randomItem.GatherTimeMultiplier;
                    }

                    await new Promise(resolve => setTimeout(resolve, 1000 * time));
                }

                setTimeout(() => {
                    GivePlayerObject(client, player.Username, randomItem.ObjectName, false);
                }, 1000)

                return randomFlavorText;
            }
            else {
                return `@the7ark OH MY GOD YOU FORGOT TO ADD FLAVOR TEXT TO ${randomItem.ObjectName}`;
            }
        case GatherResult.TakeDamage:
            let damageAmount = GetRandomIntI(2, 7);

            let result = GetRandomItem([
                {
                    text: `you were stung by a bee, and took ${damageAmount} piercing damage!`,
                    damageType: DamageType.Piercing
                },
                {
                    text: `a rock fell from the sky and bonked you on the head for ${damageAmount} bludgeoning damage!`,
                    damageType: DamageType.Bludgeoning
                },
                {
                    text: `a boar rushed at you from the underbrush and hit you for ${damageAmount} bludgeoning damage!`,
                    damageType: DamageType.Bludgeoning
                },
                {
                    text: `you stepped on a nail in a log and took ${damageAmount} piercing damage!`,
                    damageType: DamageType.Piercing
                },
                {
                    text: `you stumble and fall down a hill for ${damageAmount} bludgeoning damage!`,
                    damageType: DamageType.Bludgeoning
                },
            ])!;

            if(time > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * time));
            }

            setTimeout(() => {
                ChangePlayerHealth(client, player.Username, -damageAmount, result.damageType, "A resource mission gone wrong", false);
            }, 1000);

            return result.text;
        case GatherResult.Nothing:

            if(time > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * time));
            }

            return GetRandomItem([
                `you get distracted by the beauty of the wilderness.`,
                `you stumble upon a big scary monster, and have to spend a lot of time slowly backing away.`,
                `you got lost, and the sun began setting and you had to head back.`,
                `you follow a squirrel for a long time, thinking it's hiding something good... turns out, it was just nothing.`
            ])!;
    }
}

export function WipePlayerGatherState() {
    let allPlayers = LoadAllPlayers();
    for (let i = 0; i < allPlayers.length; i++) {
        allPlayers[i].GatheringResources = false;
        SavePlayer(allPlayers[i]);
    }
}
