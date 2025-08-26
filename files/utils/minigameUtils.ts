import {Client} from "tmi.js";
import {Broadcast} from "../bot";
import {GetRandomIntI, GetRandomItem, IsCommand} from "./utils";
import {
    GetPlayerCoordinates,
    GiveExp,
    GivePlayerObject,
    GivePlayerRandomObjectInTier,
    LoadAllPlayers,
    LoadPlayer,
    SavePlayer
} from "./playerGameUtils";
import {AddToMinigameQueue, IsMinigameQueueEmpty} from "../actionqueue";
import {ObjectRetrievalType, ObjectTier} from "../inventoryDefinitions";
import {HandleQuestProgress} from "./questUtils";
import {GiveUserVIP, RemoveUserVIP} from "./twitchUtils";
import {PlaySound, PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {LocationResourceType, Player, QuestType} from "../valueDefinitions";
import {GetInventoryObjectsBySource, GetRandomInventoryObjectByRarity} from "./inventoryUtils";
import {
    DeductMinigameNode,
    FilterObjectsByLocation,
    GetLocationFromCoordinate, GetLocationsAroundCoordinate,
    GetSessionFromCoordinates, GetWildernessLocationsAroundCoordinate
} from "./locationUtils";

//Come up with our effects
// - Feel unique from one another; noticeably different outputs from game to game
// - Level up your skills
// - Regardless of what you get, it converts into [something]
// - LEADERBOARDS; winner gets VIP?

//WHEN DO COMMAND
//SHOW VISUAL (animation, image, etc)
//SHOW RESULT - includes the literal thing you produced, and then the amount of coins you get from that

export enum MinigameType {
    Fish,
    Cook,
    Mine,
    //Chop
}

export function IsCommandMinigame(command: string): boolean {
    const stringKeys = Object
    .keys(MinigameType)
    .filter((v) => isNaN(Number(v)));

    let result = false;
    stringKeys.forEach((key, index) => {
        if(IsCommand(command, key.toLowerCase()) || command.includes(`the7ar${key}`)) {
            result = true;
        }
    });

    return result;
}

interface MinigameReward {
    name: string;
    gems: number;
    rarity: number;
}

export async function ResetLeaderboard(client: Client) {
    let players = LoadAllPlayers();

    let vips = players.filter(x => x.HasVip);
    for (let i = 0; i < vips.length; i++) {
        await RemoveUserVIP(client, vips[i].Username);
    }

    players = players.filter(x => x.Gems != undefined).sort((x, y) => y.Gems - x.Gems);
    let playerPlacing = 0;

    const drumRollDelay = 2000;
    let playersInOrder: Array<Player> = [];

    for (let i = 0; i < players.length; i++) {
        if(players[i].Username.toLowerCase() === "the7ark") {
            continue;
        }

        playerPlacing++;

        if(playerPlacing >= 4) {
            break;
        }

        playersInOrder.push(players[i]);
    }

    await SetLightColor(0.5, 0.5, 0);
    await SetLightBrightness(1);

    let thirdPlace = playersInOrder[2];
    let secondPlace = playersInOrder[1];
    let firstPlace = playersInOrder[0];

    let thirdPlaceText = `In third place we have @${thirdPlace.Username} with ${thirdPlace.Gems} gems! They receive a low tier item!`;
    let secondPlaceText = `Next, in second place we have @${secondPlace.Username} with ${secondPlace.Gems} gems! They receive a mid tier item!`;
    let firstPlaceText = `Finally, in first place we have @${firstPlace.Username} with ${firstPlace.Gems} gems! They receive VIP and a high tier item!`;

    PlayTextToSpeech(`Introducing the winners of the Chat Leaderboards!`, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
        PlaySound("drumroll", AudioType.StreamInfrastructure);
        setTimeout(() => {
            PlayTextToSpeech(thirdPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                await client.say(process.env.CHANNEL!, thirdPlaceText);
                await GiveExp(client, thirdPlace.Username, Math.max(25, thirdPlace.CurrentExpNeeded * 0.1));
                await GivePlayerRandomObjectInTier(client, thirdPlace.Username, [ObjectTier.Low], ObjectRetrievalType.RandomReward);

                PlayTextToSpeech(secondPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                    await client.say(process.env.CHANNEL!, secondPlaceText);
                    await GiveExp(client, secondPlace.Username, Math.max(50, secondPlace.CurrentExpNeeded * 0.25));
                    await GivePlayerRandomObjectInTier(client, secondPlace.Username, [ObjectTier.Mid], ObjectRetrievalType.RandomReward);

                    PlayTextToSpeech(firstPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                        await client.say(process.env.CHANNEL!, firstPlaceText);
                        await GiveUserVIP(client, firstPlace.Username);
                        await GiveExp(client, firstPlace.Username, Math.max(100, firstPlace.CurrentExpNeeded * 0.5));
                        await GivePlayerRandomObjectInTier(client, firstPlace.Username, [ObjectTier.High], ObjectRetrievalType.RandomReward);

                        PlaySound("cheering", AudioType.StreamInfrastructure);
                    });
                });
            });
        }, drumRollDelay);
    });

    setTimeout(async () => {
        for (let j = 0; j < players.length; j++) {
            let player = LoadPlayer(players[j].Username);
            player.Gems = 0;
            SavePlayer(player);
        }

        await FadeOutLights();
    }, 5000);
}

export function ShowLeaderboard() {
    AddToMinigameQueue(() => {
        let players = LoadAllPlayers();

        players = players.filter(x => x.Gems != undefined).sort((x, y) => y.Gems - x.Gems);
        players = players.slice(0, 6); //Slice to 6, because if im in the list itll be cut off

        let stats: Array<{displayName: string, gems: number}> = [];
        for (let i = 0; i < players.length; i++) {
            if(players[i].Username.toLowerCase() === "the7ark") {
                continue;
            }

            stats.push({
                displayName: players[i].Username!,
                gems: players[i].Gems
            })
        }

        //Slice stats down to 5
        stats = stats.slice(0, 5);

        Broadcast(JSON.stringify({ type: 'minigameleaderboard', stats: stats }));

        setTimeout(() => {
            if(IsMinigameQueueEmpty){
                ShowPassiveText();
            }
        }, 10000)
    }, 9);
}

export function ShowShop(text: string) {
    AddToMinigameQueue(() => {

        Broadcast(JSON.stringify({ type: 'minigameshop', text: text }));

        setTimeout(() => {
            if(IsMinigameQueueEmpty){
                ShowPassiveText();
            }
        }, 10000)
    }, 9);
}

function ShowPassiveText() {
    AddToMinigameQueue(() => {
        Broadcast(JSON.stringify({ type: 'minigamepassive' }));
    }, 4);
}

export async function HandleMinigames(client: Client, username: string, command: string) {
    let minigameType: MinigameType;

    const stringKeys = Object
        .keys(MinigameType)
        .filter((v) => isNaN(Number(v)))

    stringKeys.forEach((key, index) => {
        if(IsCommand(command, key.toLowerCase()) || command.includes(`the7ar${key}`)) {
            minigameType = index;
        }
    });

    await StartMinigame(client, username, minigameType);
}

export async function StartMinigame(client: Client, username: string, minigameType: MinigameType, displayText: boolean = true) {
    let loadedPlayer = LoadPlayer(username);
    let playerCoords = GetPlayerCoordinates(loadedPlayer);
    let minigameNodes = GetSessionFromCoordinates(playerCoords.X, playerCoords.Y)!;

    let outOfNodes = false;
    switch (minigameType) {
        case MinigameType.Fish:
            outOfNodes = minigameNodes.FishNodesLeft <= 0;
            break;
        case MinigameType.Cook:
            outOfNodes = minigameNodes.CookNodesLeft <= 0;
            break;
        case MinigameType.Mine:
            outOfNodes = minigameNodes.MineNodesLeft <= 0;
            break;
    }

    if(outOfNodes) {
        let outText = `@${username}, this location is all out of spots to ${MinigameType[minigameType].toLowerCase()}! You'll have to try another minigame type, or move to a new location. Use !help travel for more information.`;
        if(loadedPlayer.AutoMinigameStartTime != undefined) {
            outText = ` Your !auto has been cancelled.`;
        }
        loadedPlayer.AutoMinigameStartTime = undefined;
        SavePlayer(loadedPlayer);
        await client.say(process.env.CHANNEL!, outText);
        return;
    }

    DeductMinigameNode(playerCoords.X, playerCoords.Y, minigameType);

    AddToMinigameQueue(() => {
        let adjectives = [
            "a stinky",
            "a gross",
            "a glimmering",
            "a shiny",
            "a colorful",
            "an old",
            "a huge",
            "a tiny",
            "a slimy",
            "a sparkling",
            "a dingy",
            "a worn",
            "a sleek",
            "a jagged",
            "a smooth",
            "a vibrant",
            "a dull",
            "a massive",
            "a minuscule",
            "a sticky",
            "a fragrant",
            "a pungent",
            "a shadowy",
            "a grotesque",
            "a dazzling",
            "a tarnished",
            "a gleaming",
            "a grimy",
            "a slick",
            "a fuzzy",
            "a fluffy",
            "a questionable",
            "a sentient",
        ];

        let randomAdj = GetRandomItem(adjectives)!;
        let randomAdjSome = randomAdj.replace(`a `, `some `).replace(`an `, `some `)

        let reward = `${username} `;
        let options: Array<MinigameReward> = [];
        let rewardValue: MinigameReward;

        switch (minigameType) {
            case MinigameType.Fish:
                //DECIDE
                options = [
                    //Garbage
                    {
                        name: `caught ${randomAdj} boot`,
                        gems: GetRandomIntI(2, 8),
                        rarity: 12
                    },
                    {
                        name: `caught ${randomAdj} bottle`,
                        gems: GetRandomIntI(2, 8),
                        rarity: 12
                    },
                    {
                        name: `caught ${randomAdj} plastic bag`,
                        gems: GetRandomIntI(2, 8),
                        rarity: 12
                    },
                    {
                        name: `caught ${randomAdj} sock`,
                        gems: GetRandomIntI(2, 8),
                        rarity: 12
                    },
                    {
                        name: `caught ${randomAdj} tin can`,
                        gems: GetRandomIntI(2, 8),
                        rarity: 12
                    },

                    //Common
                    {
                        name: `caught ${randomAdj} bass`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} cod`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} salmon`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} pike`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} flounder`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} tuna`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} carp`,
                        gems: GetRandomIntI(5, 20),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `caught ${randomAdj} snapping turtle`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} goldfish`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} crab`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} pufferfish`,
                        gems: GetRandomIntI(10, 50),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} catfish`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `caught ${randomAdj} rubber duck`,
                        gems: GetRandomIntI(20, 60),
                        rarity: 5
                    },
                    {
                        name: `caught ${randomAdj} red herring`,
                        gems: GetRandomIntI(20, 60),
                        rarity: 5
                    },
                    {
                        name: `caught ${randomAdj} stingray`,
                        gems: GetRandomIntI(20, 60),
                        rarity: 5
                    },
                    {
                        name: `caught ${randomAdj} anglerfish`,
                        gems: GetRandomIntI(20, 60),
                        rarity: 5
                    },
                    {
                        name: `caught ${randomAdj} swordfish`,
                        gems: GetRandomIntI(40, 80),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `caught ${randomAdj} shark`,
                        gems: GetRandomIntI(50, 110),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} jellyfish`,
                        gems: GetRandomIntI(30, 90),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} electric eel`,
                        gems: GetRandomIntI(30, 90),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} kraken tentacle`,
                        gems: GetRandomIntI(30, 100),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} pearl`,
                        gems: GetRandomIntI(30, 90),
                        rarity: 2
                    },
                ];
                break;
            case MinigameType.Cook:
                //DECIDE
                options = [
                    //Garbage
                    {
                        name: `burnt some eggs`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `caught the oven on fire`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `got eggshells in their pancakes`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `ruined their brownies`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `made soggy toast`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `burnt water... somehow`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `created charcoal cookies`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `made something indescribable`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `curled some milk`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },
                    {
                        name: `dropped a cake on the floor`,
                        gems: GetRandomIntI(2, 4),
                        rarity: 12
                    },

                    //Common
                    {
                        name: `roasted ${randomAdj} ham`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },
                    {
                        name: `tossed ${randomAdj} salad`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },
                    {
                        name: `flipped ${randomAdj} pancake`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },
                    {
                        name: `cooked ${randomAdj} grilled cheese`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },
                    {
                        name: `stirred ${randomAdj} soup`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },
                    {
                        name: `baked ${randomAdj} chicken`,
                        gems: GetRandomIntI(5, 10),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `baked ${randomAdj} pie`,
                        gems: GetRandomIntI(10, 20),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdj} taco`,
                        gems: GetRandomIntI(10, 20),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdjSome} spaghetti`,
                        gems: GetRandomIntI(10, 20),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdjSome} chicken alfredo`,
                        gems: GetRandomIntI(10, 20),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `roasted ${randomAdjSome} duck`,
                        gems: GetRandomIntI(40, 80),
                        rarity: 5
                    },
                    {
                        name: `made ${randomAdjSome} sushi`,
                        gems: GetRandomIntI(40, 70),
                        rarity: 5
                    },
                    {
                        name: `made ${randomAdjSome} shrimp scampi`,
                        gems: GetRandomIntI(40, 80),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `made ${randomAdjSome} wagyu beef`,
                        gems: GetRandomIntI(80, 150),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdjSome} chocolate mousse`,
                        gems: GetRandomIntI(80, 140),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdjSome} steak`,
                        gems: GetRandomIntI(80, 120),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdj} ratatouille`,
                        gems: GetRandomIntI(80, 130),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdj} beef wellington`,
                        gems: GetRandomIntI(80, 120),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdjSome} lobster`,
                        gems: GetRandomIntI(80, 120),
                        rarity: 2
                    },
                ];
                break;
            case MinigameType.Mine:
                //DECIDE
                options = [
                    //Garbage
                    {
                        name: `found ${randomAdj} helmet`,
                        gems: GetRandomIntI(3, 5),
                        rarity: 12
                    },
                    {
                        name: `found ${randomAdj} pickaxe`,
                        gems: GetRandomIntI(3, 5),
                        rarity: 12
                    },
                    {
                        name: `found ${randomAdj} torch`,
                        gems: GetRandomIntI(3, 5),
                        rarity: 12
                    },
                    {
                        name: `found ${randomAdj} scrap of wood`,
                        gems: GetRandomIntI(3, 5),
                        rarity: 12
                    },
                    {
                        name: `uncovered ${randomAdj} skeleton`,
                        gems: GetRandomIntI(3, 5),
                        rarity: 12
                    },

                    //Common
                    {
                        name: `mined ${randomAdj} citrine`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdj} peridot`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} iron ore`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} coal`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} copper ore`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} tin ore`,
                        gems: GetRandomIntI(10, 15),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `mined ${randomAdjSome} silver ore`,
                        gems: GetRandomIntI(15, 20),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdjSome} lead ore`,
                        gems: GetRandomIntI(15, 20),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdjSome} nickel ore`,
                        gems: GetRandomIntI(15, 20),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdj} garnet`,
                        gems: GetRandomIntI(15, 25),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdj} amethyst`,
                        gems: GetRandomIntI(15, 25),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `mined ${randomAdj} sapphire`,
                        gems: GetRandomIntI(25, 45),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdj} jade`,
                        gems: GetRandomIntI(25, 45),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdj} topaz`,
                        gems: GetRandomIntI(25, 45),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdj} opal`,
                        gems: GetRandomIntI(25, 45),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdj} onyx`,
                        gems: GetRandomIntI(25, 45),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `mined ${randomAdj} diamond`,
                        gems: GetRandomIntI(70, 90),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdjSome} platinum ore`,
                        gems: GetRandomIntI(60, 80),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdj} emerald`,
                        gems: GetRandomIntI(60, 80),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdjSome} gold ore`,
                        gems: GetRandomIntI(80, 100),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdj} ruby`,
                        gems: GetRandomIntI(60, 80),
                        rarity: 2
                    },
                ];
                break;
        }

        let trueOptions = [];

        for (let i = 0; i < options.length; i++) {
            for (let j = 0; j < options[i].rarity; j++) {
                trueOptions.push(options[i]);
            }
        }

        rewardValue = GetRandomItem(trueOptions)!;

        reward += `${rewardValue.name}.`;

        let gemValue = rewardValue.gems;

        //Scale since I changed timing
        gemValue = Math.floor(gemValue * 2);

        if(minigameNodes.ValueMultiplier != 1) {
            gemValue = Math.floor(gemValue * minigameNodes.ValueMultiplier);
        }

        //Add gold
        reward += `\nThey gain ${gemValue} gems!`;

        if(minigameNodes.ValueMultiplier < 1) {
            reward += ` LOWER gem payout today.`
        }
        else if(minigameNodes.ValueMultiplier > 1) {
            reward += ` HIGHER gem payout today.`
        }

        Broadcast(JSON.stringify({ type: 'minigame', displayName: username, minigameType: minigameType, reward: reward }));

        //Rare chance to find extra
        if(GetRandomIntI(1, 20) == 1) {
            let minigameResources: Array<LocationResourceType> = [];
            let extraText = ``;
            switch (minigameType) {
                case MinigameType.Fish:
                    minigameResources = [
                        LocationResourceType.FreshWater,
                        LocationResourceType.SaltWater,
                        LocationResourceType.Wetland
                    ];
                    extraText += GetRandomItem([
                        ` As you fish, you also spot {1} nearby, and are able to collect it.`,
                        ` Being such a fishing pro, you also reel in {1} on your fishing pole too!`
                    ]);
                    break;
                case MinigameType.Cook:
                    minigameResources = [
                        LocationResourceType.SoftWood,
                        LocationResourceType.Grassland,
                        LocationResourceType.SmallGame,
                        LocationResourceType.LargeGame,
                        LocationResourceType.FreshWater
                    ];
                    extraText += GetRandomItem([
                        ` While cooking at the guild, you get in the good graces of the guild and are allowed to take home {1}.`,
                        ` Without anyone noticing, you're also able to take {1}.`
                    ]);
                    break;
                case MinigameType.Mine:
                    minigameResources = [
                        LocationResourceType.OreRock,
                        LocationResourceType.MineralRock,
                        LocationResourceType.Crystals
                    ];
                    extraText += GetRandomItem([
                        ` While wandering the mines, you stumbled upon a bit of {0} you were able to collect as well.`,
                        ` As you're mining, you find a bit of hidden {0} you're able to take.`
                    ]);
                    break;
            }

            let allMinigameItemOptions = GetInventoryObjectsBySource(ObjectRetrievalType.FindableInMinigames);
            let nearbyLocation = GetRandomItem(GetWildernessLocationsAroundCoordinate(playerCoords))!;
            let itemOptions = FilterObjectsByLocation(allMinigameItemOptions, nearbyLocation.Location).filter(x =>
                //Get items with relevant minigame resources
                x.ResourceCategories!.some(y => minigameResources.includes(y))
            );;

            if(itemOptions.length > 0) {
                reward += extraText;

                let chosenOption = GetRandomInventoryObjectByRarity(itemOptions)!;
                reward = reward.replace(`{0}`, chosenOption.ObjectName).replace("{1}", chosenOption.ContextualName);

                GivePlayerObject(client, username, chosenOption.ObjectName, false);
            }
        }

        setTimeout(async () => {
            if(displayText) {
                await client.say(process.env.CHANNEL!, username == "Timmy" ? `${reward}` : `@${reward}`);
            }

            await GiveExp(client, username, 1);

            let player = LoadPlayer(username);
            player.Gems += gemValue;
            player.SpendableGems += gemValue;
            SavePlayer(player);

            switch (minigameType) {
                case MinigameType.Fish:
                    await HandleQuestProgress(client, username, QuestType.DoFish, 1);
                    break;
                case MinigameType.Cook:
                    await HandleQuestProgress(client, username, QuestType.DoCook, 1);
                    break;
                case MinigameType.Mine:
                    await HandleQuestProgress(client, username, QuestType.DoMine, 1);
                    break;
            }
        }, 20000);

        setTimeout(() => {
            if(IsMinigameQueueEmpty){
                ShowLeaderboard();
            }
        }, 14000)
    }, 25, username)
}
