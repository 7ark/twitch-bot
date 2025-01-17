import {Client} from "tmi.js";
import {IsCommand} from "../commands";
import {Broadcast} from "../bot";
import {GetRandomIntI, GetRandomItem, RemoveFromArray} from "./utils";
import {GiveExp, GivePlayerRandomObjectInTier, LoadAllPlayers, LoadPlayer, SavePlayer} from "./playerGameUtils";
import {AddToMinigameQueue, IsMinigameQueueEmpty} from "../actionqueue";
import {AllInventoryObjects, ObjectTier} from "../inventory";
import {HandleQuestProgress} from "./questUtils";
import {GiveUserVIP, RemoveUserVIP} from "./twitchUtils";
import {PlaySound, PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {Player, QuestType} from "../valueDefinitions";

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
    .filter((v) => isNaN(Number(v)))

    let result = false;
    stringKeys.forEach((key, index) => {
        if(IsCommand(command, key.toLowerCase()) || command.includes(`the7ar${key}`)) {
            result = true;
        }
    });

    return result;
}

let currentShop: Array<{obj: string, cost: number}> = [];

export function InitializeShop() {
    let lowObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.Low && x.CostRange !== undefined && x.Rarity > 0);
    let midObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.Mid && x.CostRange !== undefined && x.Rarity > 0);
    let highObjects = AllInventoryObjects.filter(x => x.Tier == ObjectTier.High && x.CostRange !== undefined && x.Rarity > 0);

    const lowAmount = 3;
    const midAmount = 2;
    const highAmount = 1;

    currentShop = [];
    for (let i = 0; i < lowAmount; i++) {
        let randomObj = GetRandomItem(lowObjects);
        RemoveFromArray(lowObjects, randomObj);

        currentShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
    for (let i = 0; i < midAmount; i++) {
        let randomObj = GetRandomItem(midObjects);
        RemoveFromArray(midObjects, randomObj);

        currentShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
    for (let i = 0; i < highAmount; i++) {
        let randomObj = GetRandomItem(highObjects);
        RemoveFromArray(highObjects, randomObj);

        currentShop.push({
            obj: randomObj?.ObjectName!,
            cost: GetRandomIntI(randomObj?.CostRange!.min!, randomObj?.CostRange!.max!)
        });
    }
}

export function GetCurrentShopItems(): Array<{obj: string, cost: number}> {
    return currentShop;
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

    let thirdPlaceText = `In third place we have @${thirdPlace.Username}! They receive a low tier item!`;
    let secondPlaceText = `Next, in second place we have @${secondPlace.Username}! They receive a mid tier item!`;
    let firstPlaceText = `Finally, in first place we have @${firstPlace.Username}! They receive VIP and a high tier item!`;

    PlayTextToSpeech(`Introducing the winners of the Chat Leaderboards!`, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
        PlaySound("drumroll", AudioType.StreamInfrastructure);
        setTimeout(() => {
            PlayTextToSpeech(thirdPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                await client.say(process.env.CHANNEL!, thirdPlaceText);
                await GiveExp(client, thirdPlace.Username, Math.max(25, thirdPlace.CurrentExpNeeded * 0.1));
                await GivePlayerRandomObjectInTier(client, thirdPlace.Username, [ObjectTier.Low]);

                PlayTextToSpeech(secondPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                    await client.say(process.env.CHANNEL!, secondPlaceText);
                    await GiveExp(client, secondPlace.Username, Math.max(50, secondPlace.CurrentExpNeeded * 0.25));
                    await GivePlayerRandomObjectInTier(client, secondPlace.Username, [ObjectTier.Mid]);

                    PlayTextToSpeech(firstPlaceText, AudioType.StreamInfrastructure, "en-US-BrianNeural", async () => {
                        await client.say(process.env.CHANNEL!, firstPlaceText);
                        await GiveUserVIP(client, firstPlace.Username);
                        await GiveExp(client, firstPlace.Username, Math.max(100, firstPlace.CurrentExpNeeded * 0.5));
                        await GivePlayerRandomObjectInTier(client, firstPlace.Username, [ObjectTier.High]);

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
    AddToMinigameQueue(() => {
        let minigameType: MinigameType;

        const stringKeys = Object
            .keys(MinigameType)
            .filter((v) => isNaN(Number(v)))

        stringKeys.forEach((key, index) => {
            if(IsCommand(command, key.toLowerCase()) || command.includes(`the7ar${key}`)) {
                minigameType = index;
            }
        });

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

            // "a cursed",
            // "a haunted",
            // "a ghoulish",
            // "an eerie",
            // "a ghostly",
            // "a moldy",
            // "a ghastly",
            // "a shrunken",
            // "a slimy",
            // "a wicked",
            // "a murky",
            // "a rotten",
            // "a sinister",
            // "a jagged",
            // "a phantom-like",
            // "a decayed",
            // "a dull",
            // "an ominous",
            // "a shriveled",
            // "a sticky",
            // "a rancid",
            // "a foul",
            // "a shadowy",
            // "a grotesque",
            // "a shimmering",
            // "a corroded",
            // "a spectral",
            // "a grimy",
            // "a blood-soaked",
            // "a hairy",
            // "a bewitched",
            // "a sentient",
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
                    // //Halloween
                    // {
                    //     name: `caught ${randomAdj} zombie head`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} witch hat`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} jack-o-lantern`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} jar of eyeballs`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} skull`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} fish skeleton`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} doll head`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} black candle, still lit`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} skeletal hand gripping the hook`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} petrified bat wing`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} rotten apple core`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `caught ${randomAdj} amulet that screams`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },

                    //Garbage
                    {
                        name: `caught ${randomAdj} boot`,
                        gems: GetRandomIntI(1, 5),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} bottle`,
                        gems: GetRandomIntI(1, 5),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} plastic bag`,
                        gems: GetRandomIntI(1, 5),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} sock`,
                        gems: GetRandomIntI(1, 5),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} tin can`,
                        gems: GetRandomIntI(1, 5),
                        rarity: 10
                    },

                    //Common
                    {
                        name: `caught ${randomAdj} bass`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} cod`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} salmon`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} goldfish`,
                        gems: GetRandomIntI(2, 10),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} pike`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} flounder`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} tuna`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} snapping turtle`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `caught ${randomAdj} carp`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `caught ${randomAdj} crab`,
                        gems: GetRandomIntI(10, 30),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} lobster`,
                        gems: GetRandomIntI(10, 30),
                        rarity: 8
                    },
                    {
                        name: `caught ${randomAdj} catfish`,
                        gems: GetRandomIntI(10, 30),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `caught ${randomAdj} rubber duck`,
                        gems: GetRandomIntI(20, 50),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `caught ${randomAdj} shark`,
                        gems: GetRandomIntI(40, 75),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} jellyfish`,
                        gems: GetRandomIntI(40, 75),
                        rarity: 2
                    },
                    {
                        name: `caught ${randomAdj} electric eel`,
                        gems: GetRandomIntI(40, 75),
                        rarity: 2
                    },
                ];
                break;
            case MinigameType.Cook:
                //DECIDE
                options = [
                    //Halloween
                    // {
                    //     name: `baked ${randomAdjSome} pumpkin seeds`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `broiled ${randomAdj} witchs stew`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `stuff ${randomAdj} spider egg sack`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `skewered ${randomAdj} demon claw on a stick`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `pickled ${randomAdjSome} tentacles`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `tossed ${randomAdj} salad of eyeballs`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `baked ${randomAdjSome} toenail shavings`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `brewed ${randomAdj} pumpkin spice potion`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `blended ${randomAdj} bone broth`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `sauteed ${randomAdj} zombie toe`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `squeezed ${randomAdj} bat blood juice`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },

                    //Garbage
                    {
                        name: `burnt some eggs`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `caught the oven on fire`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `got eggshells in their pancakes`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `ruined their brownies`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },

                    //Common
                    {
                        name: `baked ${randomAdj} pie`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `roasted ${randomAdj} ham`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `tossed ${randomAdj} salad`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `flipped ${randomAdj} pancake`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `cooked ${randomAdj} grilled cheese`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `stirred ${randomAdj} soup`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },
                    {
                        name: `baked ${randomAdj} chicken`,
                        gems: GetRandomIntI(2, 15),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `made ${randomAdj} taco`,
                        gems: GetRandomIntI(10, 25),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdjSome} shrimp scampi`,
                        gems: GetRandomIntI(10, 25),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdj} beef wellington`,
                        gems: GetRandomIntI(10, 25),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdjSome} spaghetti`,
                        gems: GetRandomIntI(10, 25),
                        rarity: 8
                    },
                    {
                        name: `made ${randomAdjSome} chicken alfredo`,
                        gems: GetRandomIntI(10, 25),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `made ${randomAdj} ratatouille`,
                        gems: GetRandomIntI(25, 60),
                        rarity: 5
                    },
                    {
                        name: `roasted ${randomAdjSome} duck`,
                        gems: GetRandomIntI(25, 60),
                        rarity: 5
                    },
                    {
                        name: `made ${randomAdjSome} sushi`,
                        gems: GetRandomIntI(25, 60),
                        rarity: 5
                    },
                    {
                        name: `made ${randomAdjSome} lobster`,
                        gems: GetRandomIntI(25, 60),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `made ${randomAdjSome} wagyu beef`,
                        gems: GetRandomIntI(75, 100),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdjSome} chocolate mousse`,
                        gems: GetRandomIntI(75, 100),
                        rarity: 2
                    },
                    {
                        name: `made ${randomAdjSome} steak`,
                        gems: GetRandomIntI(75, 100),
                        rarity: 2
                    },
                ];
                break;
            case MinigameType.Mine:
                //DECIDE
                options = [
                    // //Halloween
                    // {
                    //     name: `mined ${randomAdj} cursed crystal`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `found ${randomAdj} tomb`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `mined ${randomAdj} tombstone`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `mined ${randomAdj} cursed crystal`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `unearthed ${randomAdj} skull`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `unearthed ${randomAdj} zombie hand`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `found ${randomAdj} nest of spiders`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `found ${randomAdj} cursed ring`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `found ${randomAdj} jar of pickled eyeballs`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `unearthed ${randomAdj} black tomb with a skull on it`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },
                    // {
                    //     name: `mined ${randomAdj} petrified vampire dust`,
                    //     gems: GetRandomIntI(5, 50),
                    //     rarity: 10
                    // },

                    //Garbage
                    {
                        name: `found ${randomAdj} helmet`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `found ${randomAdj} pickaxe`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `found ${randomAdj} torch`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },
                    {
                        name: `found ${randomAdj} scrap of wood`,
                        gems: GetRandomIntI(2, 5),
                        rarity: 10
                    },

                    //Common
                    {
                        name: `mined ${randomAdj} garnet`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdj} amethyst`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdj} citrine`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdj} peridot`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} iron ore`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} coal`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} copper ore`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },
                    {
                        name: `mined ${randomAdjSome} tin ore`,
                        gems: GetRandomIntI(2, 20),
                        rarity: 10
                    },

                    //Uncommon
                    {
                        name: `mined ${randomAdj} topaz`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdj} opal`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdj} jade`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdj} onyx`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdjSome} silver ore`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdjSome} lead ore`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },
                    {
                        name: `mined ${randomAdjSome} nickel ore`,
                        gems: GetRandomIntI(10, 40),
                        rarity: 8
                    },

                    //Rare
                    {
                        name: `mined ${randomAdj} sapphire`,
                        gems: GetRandomIntI(30, 50),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdj} ruby`,
                        gems: GetRandomIntI(30, 50),
                        rarity: 5
                    },
                    {
                        name: `mined ${randomAdjSome} gold ore`,
                        gems: GetRandomIntI(30, 50),
                        rarity: 5
                    },

                    //Legendary
                    {
                        name: `mined ${randomAdj} diamond`,
                        gems: GetRandomIntI(40, 75),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdjSome} platinum ore`,
                        gems: GetRandomIntI(40, 75),
                        rarity: 2
                    },
                    {
                        name: `mined ${randomAdj} emerald`,
                        gems: GetRandomIntI(40, 75),
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

        //Add gold
        reward += `\nThey gain ${rewardValue.gems} gems`;

        Broadcast(JSON.stringify({ type: 'minigame', displayName: username, minigameType: minigameType, reward: reward }));

        setTimeout(async () => {
            await client.say(process.env.CHANNEL!, `@${reward}!`);

            await GiveExp(client, username, 1);

            let player = LoadPlayer(username);
            player.Gems += rewardValue.gems;
            player.SpendableGems += rewardValue.gems;
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
        }, 10000);

        setTimeout(() => {
            if(IsMinigameQueueEmpty){
                ShowLeaderboard();
            }
        }, 14000)
    }, 13, username)
}
