import {Client} from "tmi.js";
import {Player} from "../valueDefinitions";
import {ChangePlayerHealth, GivePlayerObject, LoadAllPlayers, LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetRandomIntI, GetRandomItem} from "./utils";
import {InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {DamageType} from "./monsterUtils";
import {GetInventoryObjectsBySource} from "./inventoryUtils";

export enum GatherType { Forage, Hunt }

export enum GatherResult {
    GainObject,
    GainObjectAlternate,
    TakeDamage,
    Nothing,
    FindChest,
    EncounterMonster
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
        `you start digging through the underbrush, looking for something useful.`,
        `you wander off in search of any useful ingredients you might find.`,
        `you start following a nearby animal, hoping it will lead you to helpful resources.`,
        `you follow a trail made by many foragers before you, surely they knew what they were doing.`
    ])}`);

    let resultArray: Array<GatherResult> = [
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.GainObject,
        GatherResult.Nothing,
        GatherResult.TakeDamage,
        GatherResult.TakeDamage,
        GatherResult.GainObjectAlternate,
        GatherResult.GainObjectAlternate,
        GatherResult.GainObjectAlternate,
    ];

    let firstResult = GetRandomItem(resultArray)!;

    let resultText = await HandleGather(client, firstResult, foragableItems, player, forageTimeSeconds);

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != firstResult);

        let secondResult = GetRandomItem(resultArray)!;

        resultText += ` While returning home `;

        resultText += await HandleGather(client, secondResult, foragableItems, player, 0);
    }

    await client.say(process.env.CHANNEL!, `@${player.Username}, as you went out foraging, ${resultText}`);
}

async function StartHunting(client: Client, player: Player) {
    let huntTimeSeconds = GetRandomIntI(60, 60 * 3);
    let huntableItems = GetInventoryObjectsBySource(ObjectRetrievalType.Huntable);

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${GetRandomItem([
        `you head out keeping an eye peeled for any animals.`,
        `you start following some tracks in the underbrush, hoping they'll lead to prey.`,
        `you prepare yourself to find any animals in the nearby area, and set off.`,
        `you wield a small knife, searching for any animals in the wilderness.`,
        `you arm yourself with a bow, and begin walking towards a nearby forest, looking for movement.`,
        `you quickly take off, looking to find some prey before the days end.`,
        `you quietly sneak through the underbrush, waiting for any prey to show up.`
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
        GatherResult.GainObjectAlternate,
        GatherResult.GainObjectAlternate,
        GatherResult.FindChest,
        GatherResult.FindChest,
        GatherResult.EncounterMonster,
        GatherResult.EncounterMonster,
        GatherResult.EncounterMonster,
    ];

    let firstResult = GetRandomItem(resultArray)!;

    let resultText = await HandleGather(client, firstResult, huntableItems, player, huntTimeSeconds);

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != firstResult);

        let secondResult = GetRandomItem(resultArray)!;

        resultText += ` While returning home `;

        resultText += await HandleGather(client, secondResult, huntableItems, player, 0);
    }

    await client.say(process.env.CHANNEL!, `@${player.Username}, as you went out hunting, ${resultText}`);
}

async function HandleGather(client: Client, gatherType: GatherResult, items: Array<InventoryObject>, player: Player, time: number): Promise<string> {
    switch (gatherType) {
        case GatherResult.GainObject:
        case GatherResult.GainObjectAlternate:
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
            let damageAmount = GetRandomIntI(2, 5);

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
        case GatherResult.FindChest:
            if(time > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * time));
            }

            let chestContents = GetRandomItem([
                GetRandomIntI(2, 7),
                GetRandomIntI(2, 7),
                GetRandomIntI(2, 7),
                GetRandomIntI(2, 7),
                GetRandomIntI(10, 30),
                GetRandomIntI(10, 30),
                GetRandomIntI(10, 30),
                GetRandomIntI(50, 100),
            ])!

            setTimeout(() => {
                player = LoadPlayer(player.Username);
                player.ByteCoins += chestContents;
                SavePlayer(player);
            }, 1000);

            return GetRandomItem([
                `as you're wandering, you stumble upon a partially exposed chest in the woods. You dig up around it, and pop it open. Inside you find ${chestContents} Bytecoins!`,
                `you spot something shiny in the nearby river. You can see it's a golden coin. Then another, and another, you find a trail that leads to a sunken chest. Inside you gather ${chestContents} Bytecoins.`,
                `you see a treasure chest sitting in a clearing of the forest. You inch towards it, suspicious... you slowly prop it open with a stick... to find ${chestContents} Bytecoins inside!`,
                `you spot a bird following you, it seems to want to lead you somewhere. You follow it for a bit, as it lands on a chest sticking out of the ground. Inside is ${chestContents} Bytecoins! Thanks bird.`
            ])!;
        case GatherResult.EncounterMonster:
            let monsterDamageAmount = GetRandomIntI(5, 15);
            let monsterResult = GetRandomItem([
                {
                    text: `you see a treasure chest sitting in a clearing of the forest. You inch towards it, suspicious... you slowly prop it open with a stick... only for it TO BITE YOU WITH BIG TEETH AS A MIMIC! It bites down on your for ${monsterDamageAmount} piercing damage!`,
                    damageType: DamageType.Piercing
                },
                {
                    text: `a giant snake surrounds you in the forest and takes a bite out of you, dealing ${monsterDamageAmount} poison damage!`,
                    damageType: DamageType.Poison
                },
                {
                    text: `the air fills with static electricity, as you see a swirling tornado of lightning rush your way. The lightning elemental slams into you before you can escape and does ${monsterDamageAmount} lightning damage.`,
                    damageType: DamageType.Lightning
                },
                {
                    text: `as you're moving through a nearby river you feel a powerful shock strike you, as you see an electric eel curl around your leg and deal ${monsterDamageAmount} lightning damage.`,
                    damageType: DamageType.Lightning
                },
                {
                    text: `your vision starts to become blurry as you start feeling a pain in your head. You hear laughter as the form of an old woman looms over you, a long finger extended your way. You take ${monsterDamageAmount} psychic damage before escaping.`,
                    damageType: DamageType.Psychic
                },
                {
                    text: `suddenly the forest feels dark, as you can feel a dangerous presence. A huge demonic creature runs toward you, and throws a fireball at you, dealing ${monsterDamageAmount} fire damage! You quickly escape before more harm can be done.`,
                    damageType: DamageType.Fire
                },
            ])!;

            if(time > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (time * 1.5)));
            }

            setTimeout(() => {
                ChangePlayerHealth(client, player.Username, -monsterDamageAmount, monsterResult.damageType, "A resource mission gone wrong", false);
            }, 1000);

            return monsterResult.text;
    }
}

export function WipePlayerGatherState() {
    let allPlayers = LoadAllPlayers();
    for (let i = 0; i < allPlayers.length; i++) {
        allPlayers[i].GatheringResources = false;
        SavePlayer(allPlayers[i]);
    }
}
