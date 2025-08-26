import {Client} from "tmi.js";
import {LocationCoordinate, Player, TerrainType} from "../valueDefinitions";
import {
    ChangePlayerHealth,
    GetPlayerCoordinates,
    GiveExp,
    GivePlayerObject,
    LoadAllPlayers,
    LoadPlayer,
    SavePlayer
} from "./playerGameUtils";
import {GetRandomIntI, GetRandomItem} from "./utils";
import {InventoryObject, ObjectRetrievalType} from "../inventoryDefinitions";
import {DamageType} from "./monsterUtils";
import {GetInventoryObjectsBySource, GetRandomInventoryObjectByRarity} from "./inventoryUtils";
import {
    FilterObjectsByLocation,
    GetResourcesFromTerrain,
    GetWildernessLocationsAroundCoordinate
} from "./locationUtils";

export enum GatherType { Forage, Hunt }

export enum GatherResult {
    GainObject,
    GainObjectAlternate,
    TakeDamage,
    Nothing,
    FindCoins,
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

async function HandleGatherResult(
    client: Client,
    resultArray: Array<GatherResult>,
    player: Player,
    timeInSeconds: number,
    allItems: InventoryObject[],
    startingCoordinate: LocationCoordinate,
    previousLocation?: TerrainType
): Promise<{
    Coordinate: LocationCoordinate,
    LocationTerrain: TerrainType,
    Result: GatherResult,
    ResultText: string
}> {
    let potentialLocations = GetWildernessLocationsAroundCoordinate(startingCoordinate);
    //Filter out bad locations if this is the first time
    if(previousLocation == null) {
        //Filter out oceans
        let newLocations = potentialLocations.filter(x => x.Location.Info!.Type != TerrainType.Ocean);
        if(newLocations.length > 0) {
            potentialLocations = newLocations;
        }
        //Filter out deserts
        newLocations = newLocations.filter(x => x.Location.Info!.Type != TerrainType.Desert);
        if(newLocations.length > 0) {
            potentialLocations = newLocations;
        }
        //Filter out wasteland
        newLocations = newLocations.filter(x => x.Location.Info!.Type != TerrainType.Wasteland);
        if(newLocations.length > 0) {
            potentialLocations = newLocations;
        }
        //Filter out tundra
        newLocations = newLocations.filter(x => x.Location.Info!.Type != TerrainType.Tundra);
        if(newLocations.length > 0) {
            potentialLocations = newLocations;
        }
    }

    let location = GetRandomItem(potentialLocations)!;
    let terrainType = location.Location.Info!.Type;

    let itemOptions = FilterObjectsByLocation(allItems, location.Location);

    if(itemOptions.length == 0) {
        resultArray = resultArray
            .filter(x => x != GatherResult.GainObject)
            .filter(x => x != GatherResult.GainObjectAlternate)
    }

    let resultText = ``;

    if(previousLocation == null || previousLocation != terrainType) {
        resultText = GetRandomItem([
            `you travel towards ${location.Location.ContextualName}, `,
            `you make your way toward ${location.Location.ContextualName}, `,
            `you begin the journey to ${location.Location.ContextualName}, `,
            `you head in the direction of ${location.Location.ContextualName}, `,
            `you set out for ${location.Location.ContextualName}, `,
            `you start walking toward ${location.Location.ContextualName}, `,
            `your path leads you toward ${location.Location.ContextualName}, `,
            `you venture forth to ${location.Location.ContextualName}, `
        ])!;
    }

    let result = resultArray.length == 0 ? GatherResult.Nothing : GetRandomInventoryObjectByRarity(resultArray)!;

    resultText += await HandleGather(client, result, terrainType, itemOptions, player, timeInSeconds);

    if((previousLocation == null || previousLocation != terrainType) && itemOptions.length <= 1) {
        resultText += GetRandomItem([
            ` You find there's very little to find out here.`,
            ` As you search around, there's hardly anything worth taking here.`,
            ` You looked high and low and this is all you could find.`,
            ` This place seems to yield almost nothing useful.`,
            ` The surroundings here are sparse.`,
            ` The area here seems pretty barren.`
        ])!
    }

    return {
        Coordinate: location.Coordinate,
        LocationTerrain: terrainType,
        Result: result,
        ResultText: resultText
    };
}

async function StartForaging(client: Client, player: Player) {
    let forageTimeSeconds = GetRandomIntI(60, 60 * 3);

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${GetRandomItem([
        `you head out in search of goodies!`,
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

    let allNatureItems = GetInventoryObjectsBySource(ObjectRetrievalType.FoundInNature);

    let resultText = ``;

    let first: {
        Coordinate: LocationCoordinate,
        LocationTerrain: TerrainType,
        Result: GatherResult,
        ResultText: string
    } = await HandleGatherResult(
        client,
        resultArray,
        player,
        forageTimeSeconds,
        allNatureItems,
        GetPlayerCoordinates(player));

    resultText += first.ResultText;

    let second: {
        Coordinate: LocationCoordinate,
        LocationTerrain: TerrainType,
        Result: GatherResult,
        ResultText: string
    } | undefined = undefined;

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != first.Result);

        resultText += GetRandomItem([
            ` After this, `,
            ` Following this, `,
            ` Soon after, `,
            ` Next, `,
            ` When returning home, `,
            ` You took a detour and `
        ])!

        second = await HandleGatherResult(
            client,
            resultArray,
            player,
            forageTimeSeconds,
            allNatureItems,
            first.Coordinate,
            first.LocationTerrain);

        resultText += second.ResultText;
    }

    let expToGive = 0;
    if(first.Result != GatherResult.Nothing) {
        if(first.Result == GatherResult.TakeDamage) {
            expToGive += GetRandomIntI(10, 15);
        }
        else {
            expToGive += GetRandomIntI(5, 10);
        }
    }
    if(second && second.Result != GatherResult.Nothing) {
        if(second.Result == GatherResult.TakeDamage) {
            expToGive += GetRandomIntI(10, 15);
        }
        else {
            expToGive += GetRandomIntI(5, 10);
        }
    }

    await GiveExp(client, player.Username, expToGive);

    await client.say(process.env.CHANNEL!, `@${player.Username}, as you went out foraging, ${resultText} You have gained ${expToGive} EXP.`);
}

async function StartHunting(client: Client, player: Player) {
    let huntTimeSeconds = GetRandomIntI(60, 60 * 3);

    await client.say(process.env.CHANNEL!, `@${player.Username}, ${GetRandomItem([
        `you head out keeping an eye peeled for any animals.`,
        `you start following some tracks, hoping they'll lead to prey.`,
        `you prepare yourself to find any animals in the nearby area, and set off.`,
        `you wield a small knife, searching for any animals in the wilderness.`,
        `you arm yourself with a bow, and begin walking into the distance, looking for movement.`,
        `you quickly take off, looking to find some prey before the days end.`
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
        GatherResult.FindCoins,
        GatherResult.FindCoins,
        GatherResult.EncounterMonster,
        GatherResult.EncounterMonster,
        GatherResult.EncounterMonster,
    ];

    let allHuntableObjects = GetInventoryObjectsBySource(ObjectRetrievalType.Huntable);

    let resultText = ``;

    let first: {
        Coordinate: LocationCoordinate,
        LocationTerrain: TerrainType,
        Result: GatherResult,
        ResultText: string
    } = await HandleGatherResult(
        client,
        resultArray,
        player,
        huntTimeSeconds,
        allHuntableObjects,
        GetPlayerCoordinates(player));

    resultText += first.ResultText;

    let second: {
        Coordinate: LocationCoordinate,
        LocationTerrain: TerrainType,
        Result: GatherResult,
        ResultText: string
    } | undefined = undefined;

    if(GetRandomIntI(1, 2) != 1) {
        resultArray = resultArray.filter(x => x != first.Result);

        resultText += GetRandomItem([
            ` After this, `,
            ` Following this, `,
            ` Soon after, `,
            ` Next, `,
            ` When returning home, `,
            ` You took a detour and `
        ])!

        second = await HandleGatherResult(
            client,
            resultArray,
            player,
            huntTimeSeconds,
            allHuntableObjects,
            first.Coordinate,
            first.LocationTerrain);

        resultText += second.ResultText;
    }

    let expToGive = 0;
    if(first.Result != GatherResult.Nothing) {
        if(first.Result == GatherResult.TakeDamage) {
            expToGive += GetRandomIntI(10, 15);
        }
        else {
            expToGive += GetRandomIntI(5, 10);
        }
    }
    if(second && second.Result != GatherResult.Nothing) {
        if(second.Result == GatherResult.TakeDamage) {
            expToGive += GetRandomIntI(10, 15);
        }
        else {
            expToGive += GetRandomIntI(5, 10);
        }
    }

    await GiveExp(client, player.Username, expToGive);

    await client.say(process.env.CHANNEL!, `@${player.Username}, as you went out hunting, ${resultText} You have gained ${expToGive} EXP.`);
}

async function HandleGather(client: Client, gatherType: GatherResult, terrain: TerrainType, items: Array<InventoryObject>, player: Player, time: number): Promise<string> {
    switch (gatherType) {
        case GatherResult.GainObject:
        case GatherResult.GainObjectAlternate:
            let randomItem = GetRandomItem(items)!;
            if(randomItem == undefined) {
                console.log(`Item undefined? Number of items ${items.length}`)
            }
            if(randomItem.GatherText !== undefined) {
                let randomFlavorText = GetRandomItem(randomItem.GatherText(terrain))!;

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

            let damageOptions = [
                {
                    text: `you were stung by a bee, and took ${damageAmount} piercing damage!`,
                    damageType: DamageType.Piercing
                },
                {
                    text: `a rock fell from the sky and bonked you on the head for ${damageAmount} bludgeoning damage!`,
                    damageType: DamageType.Bludgeoning
                },
            ];

            switch (terrain) {
                case TerrainType.Ocean:
                case TerrainType.Lake:
                    damageOptions.push(...[
                        {
                            text: `you inhale too much water and take ${damageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                    ]);
                    break;
                case TerrainType.Tundra:
                    damageOptions.push(...[
                        {
                            text: `you get frostbite and take ${damageAmount} cold damage!`,
                            damageType: DamageType.Cold
                        },
                    ]);
                    break;
                case TerrainType.Mountain:
                    damageOptions.push(...[
                        {
                            text: `you stumble and fall down a hill for ${damageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                    ]);
                    break;
                case TerrainType.Desert:
                    damageOptions.push(...[
                        {
                            text: `you get a sunburn and take ${damageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        },
                    ]);
                    break;
                case TerrainType.Forest:
                    damageOptions.push(...[
                        {
                            text: `a boar rushed at you from the underbrush and hit you for ${damageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                        {
                            text: `you stepped on a nail in a log and took ${damageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                    ]);
                    break;
                case TerrainType.Wasteland:
                    damageOptions.push(...[
                        {
                            text: `toxic fumes burn your lungs for ${damageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                    ]);
                    break;
                case TerrainType.Volcano:
                    damageOptions.push(...[
                        {
                            text: `hot ash rains down on you for ${damageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        },
                    ]);
                    break;
                case TerrainType.Plains:
                    damageOptions.push(...[
                        {
                            text: `you stumble and fall down a hill for ${damageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                    ]);
                    break;
                case TerrainType.Swamp:
                    damageOptions.push(...[
                        {
                            text: `leaches cling to your skin for ${damageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                    ]);
                    break;
                case TerrainType.Jungle:
                    damageOptions.push(...[
                        {
                            text: `you trip over a tangle of roots and vines and take ${damageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                    ]);
                    break;

            }

            let result = GetRandomItem(damageOptions)!;

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
        case GatherResult.FindCoins:
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

            let coinOptions = [
                `you spot a bird following you, it seems to want to lead you somewhere. You follow it for a bit, as it lands on a chest sticking out of the ground. Inside is ${chestContents} Bytecoins! Thanks bird.`
            ];

            switch (terrain) {
                case TerrainType.Ocean:
                    coinOptions.push(...[
                        `as you walk along the beach, you spot a chest washed up on the shore. Inside you find ${chestContents} Bytecoins.`,
                    ])
                    break;
                case TerrainType.Tundra:
                    coinOptions.push(...[
                        `you find a giant chunk of ice, and in the middle of it is a chest frozen inside! You break apart the ice, and inside you find ${chestContents} Bytecoins.`,
                    ])
                    break;
                case TerrainType.Mountain:
                    coinOptions.push(...[
                        `you find an abandoned pack on a high mountain peak. A small pouch within contains ${chestContents} Bytecoins.`,
                        `you find an old abandoned mine lies in the mountainside. Inside there are scattered coins, collecting them you end up with a total of ${chestContents} Bytecoins.`
                    ])
                    break;
                case TerrainType.Lake:
                    coinOptions.push(...[
                        `hidden in the shallows of the lake you find a partially sunken chest with ${chestContents} Bytecoins inside.`,
                        `an old dock sits long abandoned, but hidden in the mud underneath you spot a chest. Inside you find ${chestContents} Bytecoins.`
                    ])
                    break;
                case TerrainType.Desert:
                    coinOptions.push(...[
                        `you find a small oasis, with a suspicious chest. You inch forward and open it... to find ${chestContents} Bytecoins!`,
                    ])
                    break;
                case TerrainType.Forest:
                    coinOptions.push(...[
                        `as you're wandering, you stumble upon a partially exposed chest in the woods. You dig up around it, and pop it open. Inside you find ${chestContents} Bytecoins!`,
                        `you see a treasure chest sitting in a clearing of the forest. You inch towards it, suspicious... you slowly prop it open with a stick... to find ${chestContents} Bytecoins inside!`,
                        `you spot something shiny in a nearby stream. You can see it's a golden coin. Then another, and another, you find a trail that leads to a sunken chest. Inside you gather ${chestContents} Bytecoins.`,
                    ])
                    break;
                case TerrainType.Wasteland:
                    coinOptions.push(...[
                        `among some ashes, you see a skeletal hand. It's reaching out for a nearby pouch, inside you find ${chestContents} Bytecoins.`,
                    ])
                    break;
                case TerrainType.Plains:
                    coinOptions.push(...[
                        `you spot something shiny in a nearby stream. You can see it's a golden coin. Then another, and another, you find a trail that leads to a sunken chest. Inside you gather ${chestContents} Bytecoins.`,
                    ])
                    break;
                case TerrainType.Swamp:
                    coinOptions.push(...[
                        `you find fireflies gathering around an old shack. Upon investigating it, you find ${chestContents} Bytecoins tucked away inside.`,
                        `a hollowed log floating in the swamp catches your eye, inside you find a stash of ${chestContents} Bytecoins.`
                    ])
                    break;
                case TerrainType.Jungle:
                    coinOptions.push(...[
                        `vines hide a hidden chest near some old ruins, inside are ${chestContents} Bytecoins.`,
                        `you check behind a waterfall, and to your surprise theres a small pile of ${chestContents} Bytecoins.`
                    ])
                    break;
            }

            return GetRandomItem(coinOptions)!;
        case GatherResult.EncounterMonster:
            let monsterDamageAmount = GetRandomIntI(5, 15);

            let monsterOptions = [
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
            ];

            switch (terrain) {
                case TerrainType.Ocean:
                    monsterOptions.push(...[
                        {
                            text: `as you're swimming, a sharp pain rips across your leg as you spot a shark biting you! You take ${monsterDamageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `tentacles rise from the depths! A mysterious tentacled creature drags you under and smacks you around, dealing ${monsterDamageAmount} bludgeoning damage.`,
                            damageType: DamageType.Bludgeoning
                        },
                        {
                            text: `jellyfish drift by, you're too late to notice them and get stung for ${monsterDamageAmount} poison damage.`,
                            damageType: DamageType.Poison
                        }
                    ]);
                    break;
                case TerrainType.Tundra:
                    monsterOptions.push(...[
                        {
                            text: `a starving wolf pack circles and lunges at you, you escape, but take ${monsterDamageAmount} piercing damage.`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `when travelling over a frozen lake, the ice cracks beneath you, and you fall in. You take ${monsterDamageAmount} cold damage!`,
                            damageType: DamageType.Cold
                        },
                        {
                            text: `a blizzard comes out of nowhere, just as you're slammed with a heavy club. An ice troll batters you in the storm dealing ${monsterDamageAmount} bludgeoning damage beore you can get away.`,
                            damageType: DamageType.Bludgeoning
                        }
                    ]);
                    break;
                case TerrainType.Mountain:
                    monsterOptions.push(...[
                        {
                            text: `stones tumble down from above as you're too late to see bandits attacking you, dealing ${monsterDamageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                        {
                            text: `you stumble into a wyvern’s nesting ground. Its tail lashes out, and you take ${monsterDamageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `an ogre leaps from behind a boulder and clubs you, dealing ${monsterDamageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        }
                    ]);
                    break;
                case TerrainType.Lake:
                    monsterOptions.push(...[
                        {
                            text: `as you wade along the shore, a massive snapping turtle lunges and bites you for ${monsterDamageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `you swim too close to a dark shape in the water as it lights up suddenly. An electric eel shocks you for ${monsterDamageAmount} lightning damage!`,
                            damageType: DamageType.Lightning
                        },
                        {
                            text: `the lake surface ripples, and a water elemental rises. It fires torrents of water at you, dealing ${monsterDamageAmount} cold damage!`,
                            damageType: DamageType.Cold
                        }
                    ]);
                    break;
                case TerrainType.Desert:
                    monsterOptions.push(...[
                        {
                            text: `the sand shifts beneath your feet as a giant scorpion emerges! Its stinger pierces you for ${monsterDamageAmount} poison damage.`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `a blue dragon roars and causes a dangerous lightning storm. You take ${monsterDamageAmount} lightning damage.`,
                            damageType: DamageType.Lightning
                        },
                        {
                            text: `you approach a sphinx, but fail to answer its ridden. It's mouth opens and blasts you for ${monsterDamageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        }
                    ]);
                    break;
                case TerrainType.Forest:
                    monsterOptions.push(...[
                        {
                            text: `you see a treasure chest sitting in a clearing of the forest. You inch towards it, suspicious... you slowly prop it open with a stick... only for it TO BITE YOU WITH BIG TEETH AS A MIMIC! It bites down on your for ${monsterDamageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `a giant snake surrounds you in the forest and takes a bite out of you, dealing ${monsterDamageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `suddenly the forest feels dark, as you can feel a dangerous presence. A huge demonic creature runs toward you, and throws a fireball at you, dealing ${monsterDamageAmount} fire damage! You quickly escape before more harm can be done.`,
                            damageType: DamageType.Fire
                        },
                    ]);
                    break;
                case TerrainType.Wasteland:
                    monsterOptions.push(...[
                        {
                            text: `a hulking mutant creature lumbers from some ruins and claws at you, dealing ${monsterDamageAmount} slashing damage!`,
                            damageType: DamageType.Slashing
                        },
                        {
                            text: `poisonous gas vents from the cracked earth. You choke and cough, taking ${monsterDamageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `the ground splits open, belching fire and brimstone. You’re scorched for ${monsterDamageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        }
                    ]);
                    break;
                case TerrainType.Volcano:
                    monsterOptions.push(...[
                        {
                            text: `molten rock bursts from the ground, burning you for ${monsterDamageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        },
                        {
                            text: `smoke elementals rise from the ground and surrounds you, cutting off your air supply and making you dizzy. You take ${monsterDamageAmount} psychic damage.`,
                            damageType: DamageType.Psychic
                        },
                        {
                            text: `a magma creature lunges at you from a lava pool, it sears you for ${monsterDamageAmount} fire damage!`,
                            damageType: DamageType.Fire
                        }
                    ]);
                    break;
                case TerrainType.Plains:
                    monsterOptions.push(...[
                        {
                            text: `a stampede of wild beasts come your way, you’re knocked aside, taking ${monsterDamageAmount} bludgeoning damage!`,
                            damageType: DamageType.Bludgeoning
                        },
                        {
                            text: `a giant wasp nest stirs as you pass. You're stung for ${monsterDamageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `bandits ambush you on the open road, slashing at you for ${monsterDamageAmount} slashing damage!`,
                            damageType: DamageType.Slashing
                        }
                    ]);
                    break;
                case TerrainType.Swamp:
                    monsterOptions.push(...[
                        {
                            text: `the swamp bubbles beneath you, and a massive crocodile bursts out, biting into your leg for ${monsterDamageAmount} piercing damage!`,
                            damageType: DamageType.Piercing
                        },
                        {
                            text: `mosquitoes swarm you in thick clouds. Their bites seems particularly lethal and you take ${monsterDamageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `what you thought was just mud tries to swallow you whole as a shambling mound tries to devour you. You take ${monsterDamageAmount} bludgeoning damage.`,
                            damageType: DamageType.Bludgeoning
                        }
                    ]);
                    break;
                case TerrainType.Jungle:
                    monsterOptions.push(...[
                        {
                            text: `a panther drops from the canopy, raking you with it's claws for ${monsterDamageAmount} slashing damage!`,
                            damageType: DamageType.Slashing
                        },
                        {
                            text: `mosquito swarms engulf you, their bites leaving you hurt. You suffer ${monsterDamageAmount} poison damage!`,
                            damageType: DamageType.Poison
                        },
                        {
                            text: `a giant constrictor snake coils around you. You barely break free, but not before it crushes you for ${monsterDamageAmount} bludgeoning damage.`,
                            damageType: DamageType.Bludgeoning
                        }
                    ]);
                    break;

            }

            let monsterResult = GetRandomItem(monsterOptions)!;

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
