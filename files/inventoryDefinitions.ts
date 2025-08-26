import {
    AddStatusEffectToPlayer,
    CalculateMaxHealth,
    ChangePlayerHealth,
    GiveExp,
    GivePlayerObject,
    GivePlayerRandomObject,
    GivePlayerRandomObjectInTier,
    LoadPlayer,
    SavePlayer
} from "./utils/playerGameUtils";
import {Client} from "tmi.js";
import {Broadcast} from "./bot";
import {Dictionary, GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils/utils";
import {AddToActionQueue} from "./actionqueue";
import {
    GetAllPlayerSessions,
    LoadPlayerSession,
    LoadRandomPlayerSession,
    SavePlayerSession
} from "./utils/playerSessionUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./utils/audioUtils";
import {BanUser} from "./utils/twitchUtils";
import {IsMonsterActive} from "./globals";
import {DamageType, DoDamageToMonster, LoadMonsterData} from "./utils/monsterUtils";
import {SetSceneItemEnabled} from "./utils/obsutils";
import {AudioType} from "./streamSettings";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./utils/lightsUtils";
import {ClassType, IconType, LocationResourceType, Player, StatusEffect, TerrainType} from "./valueDefinitions";
import {CreatePoll} from "./utils/pollUtils";
import {GetInventoryObjectsBySource} from "./utils/inventoryUtils";

export enum ObjectTier { Low, Mid, High }

export enum ObjectRetrievalType {
    RandomReward,
    TravelingSalesman,
    GroceryStore,
    Craftable,
    Cookable,
    FoundInNature,
    Huntable,
    FindableInMinigames
}

export interface InventoryObject {
    ObjectName: string;
    Alias?: Array<string>;
    ContextualName: string;
    PluralName: string;
    CostRange?: { min: number, max: number },
    Info: string;
    Tier?: ObjectTier;
    IconRep?: IconType;
    ThrownDamage?: { min: number, max: number },
    UseAlias?: Array<string>;
    UseAction: Dictionary<(client: Client, player: Player, afterText: string) => Promise<boolean>>;
    // AlternativeUseAction?: Map<string, (client: Client, player: Player, afterText: string) => Promise<boolean>>;
    Consumable: boolean;
    ClassRestrictions?: Array<ClassType>;
    Equippable?: boolean;
    Retrieval: Array<ObjectRetrievalType>;
    ResourceCategories?: Array<LocationResourceType>;
    TerrainsLocatedIn?: Array<TerrainType>;
    GatherText?: (terrainType: TerrainType) => Array<string>;
    GatherTimeMultiplier?: number,
    CookTimeInSeconds?: number,
    CookedVersion?: string,
    Durability?: { min: number, max: number };
    ObjectAttackAction?: (client: Client, player: Player) => Promise<{
        damage: number,
        damageType: DamageType
    }>;
    ObjectOnAttackedAction?: (client: Client, player: Player) => Promise<{
        resistances?: Array<DamageType>,
        immunities?: Array<DamageType>,
        vulnerabilities?: Array<DamageType>,
        armorAdjustment?: number
    }>;
    CraftingRecipe?: {
        ResultAmount?: { min: number, max: number },
        Recipe: Array<{
            Resource: string,
            Amount: number
        }>
    };
    Rarity: number;
}

// let test: Array<InventoryObject> = [
//     {
//         ObjectName: "dagger",
//         ContextualName: "a dagger",
//         PluralName: "daggers",
//         Info: "A basic rogue weapon. This is just flavor and doesn't do anything.",
//         Retrieval: [],
//         ThrownDamage: { min: 3, max: 12 },
//         UseAction: { "use": { "test": async (client, player, afterText) => {
//                 await client.say(process.env.CHANNEL!, `@${player.Username} you twirl your dagger in your hand.`);
//
//                 return true;
//             }},
//         Consumable: false,
//         Rarity: 10
//     }
// ];


export const AllInventoryObjects: Array<InventoryObject> = [
    {
        ObjectName: "dagger",
        ContextualName: "a dagger",
        PluralName: "daggers",
        Info: "A basic rogue weapon. This is just flavor and doesn't do anything.",
        Retrieval: [],
        ThrownDamage: {min: 3, max: 12},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you twirl your dagger in your hand.`);

                return true;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "sword",
        ContextualName: "a sword",
        PluralName: "swords",
        Info: "A basic warrior weapon. This is just flavor and doesn't do anything.",
        Retrieval: [],
        ThrownDamage: {min: 3, max: 8},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you swing through the air a few times, practicing your skills.`);

                return true;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "hammer",
        ContextualName: "a hammer",
        PluralName: "hammers",
        Info: "A basic warrior weapon. This is just flavor and doesn't do anything.",
        Retrieval: [],
        ThrownDamage: {min: 5, max: 8},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you smash a nearby rock. Nice.`);

                return true;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "healing amulet",
        ContextualName: "a healing amulet",
        PluralName: "healing amulets",
        Info: "A healing amulet used by clerics to heal people. This is just flavor and doesn't do anything.",
        Retrieval: [],
        ThrownDamage: {min: 2, max: 3},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you bask in the glow of the magical energy of the amulet`);

                return true;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "wand",
        ContextualName: "a wand",
        PluralName: "wands",
        Info: "A basic mage weapon",
        Retrieval: [],
        ThrownDamage: {min: 1, max: 2},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you make some sparkles appear.`);

                return true;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "healing potion",
        Alias: ["healing", "healing potions", "health potion"],
        ContextualName: "a healing potion",
        PluralName: "healing potions",
        Info: "Heals you a random amount between 10 - 30HP!",
        CostRange: {min: 50, max: 100},
        Tier: ObjectTier.Low,
        IconRep: IconType.Bottle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        ThrownDamage: {min: -40, max: -20},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let heal = GetRandomIntI(10, 30);

                await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "great healing potion",
        Alias: ["great healing", "great healing potions", "great health potion", "greater healing potion", "greater healing potions"],
        ContextualName: "a great healing potion",
        PluralName: "great healing potions",
        Info: "Heals you a random amount between 40 - 70HP!",
        CostRange: {min: 100, max: 200},
        Tier: ObjectTier.Mid,
        IconRep: IconType.Bottle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        ThrownDamage: {min: -80, max: -300},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let heal = GetRandomIntI(40, 70);

                await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 8
    },
    {
        ObjectName: "legendary healing potion",
        Alias: ["legendary healing", "legendary healing potions", "legendary health potion"],
        ContextualName: "a legendary healing potion",
        PluralName: "legendary healing potions",
        Info: "Heals you a random amount between 100 - 150HP!",
        CostRange: {min: 200, max: 400},
        Tier: ObjectTier.High,
        IconRep: IconType.Bottle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        ThrownDamage: {min: -150, max: -500},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let heal = GetRandomIntI(100, 150);

                await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 4
    },
    {
        ObjectName: "cheese wheel",
        ContextualName: "a wheel of cheese",
        PluralName: "cheese wheels",
        Info: "A cheese wheel! Eat it, smell it, yum yum yum. (Ex. !use cheese wheel)",
        CostRange: {min: 50, max: 100},
        Tier: ObjectTier.Low,
        IconRep: IconType.CheeseWheel,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman,
            ObjectRetrievalType.GroceryStore
        ],
        ThrownDamage: {min: -5, max: -2},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let spoiled = GetRandomIntI(1, 10) === 1;
                await client.say(process.env.CHANNEL!, `@${player.Username} yum! Delicious cheese, you take a bite... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
                await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-2, -8) : GetRandomIntI(2, 5), DamageType.Poison)

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "banana bunch",
        Alias: ["banana", "bananas"],
        ContextualName: "a bunch of bananas",
        PluralName: "bananas",
        Info: "Bananas! Made famous by monkeys. (Ex. !use banana bunch.)",
        CostRange: {min: 50, max: 100},
        Tier: ObjectTier.Low,
        IconRep: IconType.Bananas,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman,
            ObjectRetrievalType.GroceryStore
        ],
        ThrownDamage: {min: -9, max: -5},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let spoiled = GetRandomIntI(1, 10) === 1;
                await client.say(process.env.CHANNEL!, `@${player.Username}, bananas! You eat a banana from the bunch... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
                await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-5, -15) : GetRandomIntI(2, 5), DamageType.Poison)

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "cake",
        Alias: ["cake", "portal cake"],
        ContextualName: "a cake",
        PluralName: "cakes",
        Info: "A delicious cake! Right? Or is it a lie... (Ex. !use cake)",
        CostRange: {min: 50, max: 100},
        Tier: ObjectTier.Mid,
        IconRep: IconType.PortalCake,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        ThrownDamage: {min: 20, max: 80},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let good = GetRandomIntI(1, 2) == 1; //50/50 chance

                let maxHealth = CalculateMaxHealth(player);
                if (good) {
                    let heal = Math.ceil(GetRandomIntI(Math.max(maxHealth * 0.5, 10), Math.max(maxHealth * 0.75, 30)))

                    await client.say(process.env.CHANNEL!, `@${player.Username}, the cake is as good as you imagined!`);
                    await ChangePlayerHealth(client, player.Username, heal, DamageType.None);
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}... THE CAKE WAS A LIE!`);
                    await ChangePlayerHealth(client, player.Username, -maxHealth, DamageType.Poison);
                }

                return true;
            }
        },
        Consumable: true,
        Rarity: 7
    },
    {
        ObjectName: "beer",
        ContextualName: "beer",
        PluralName: "beer",
        Info: "It's beer, it'll make you feel good, but at what cost?",
        CostRange: {min: 40, max: 75},
        Tier: ObjectTier.Low,
        IconRep: IconType.Beer,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman,
            ObjectRetrievalType.GroceryStore
        ],
        ThrownDamage: {min: -9, max: -5},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                //todo - make beer more interesting
                let tooDrunk = GetRandomIntI(1, 10) === 1;
                await client.say(process.env.CHANNEL!, `@${player.Username}, you chug down a pint of beer and become drunk for 5 minutes. Ah, how wonderful. ${tooDrunk ? `You're a real messy drunk though, huh? You end up passing out, and hitting your head.` : `Refreshing and delicious.`}`);
                await ChangePlayerHealth(client, player.Username, tooDrunk ? GetRandomIntI(-5, -15) : GetRandomIntI(5, 10), DamageType.Poison);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Drunk, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 13
    },
    {
        ObjectName: "tinderbox",
        Alias: ["tinderboxes"],
        ContextualName: "a tinderbox",
        PluralName: "tinderboxes",
        Info: "Let's you catch things on fire when used! Especially other users in chat. (Ex. !use tinderbox)",
        CostRange: {min: 30, max: 60},
        Tier: ObjectTier.Mid,
        IconRep: IconType.Box,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        ThrownDamage: {min: 2, max: 8},
        UseAction: {
            "use": async (client, player, afterText) => {
                if (player.PassiveModeEnabled) {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you can't attack others while in passive mode. Use !togglepassive to disable it.`);
                    return false;
                }

                let onPurpose = false;
                let otherUser: PlayerSessionData = LoadPlayerSession(afterText.replace("@", ""));
                if (otherUser !== undefined) {
                    onPurpose = true;
                } else {
                    otherUser = LoadRandomPlayerSession([player.Username], true)!;
                }

                // let doCampfire = !onPurpose && GetRandomIntI(1, 4) != 1;
                //
                // if(doCampfire) {
                //     let text = `@${player.Username} you've started a lovely little campfire. You, `;
                //
                //     let extraPeople: Array<string> = [];
                //     for (let i = 0; i < 3; i++) {
                //         let extraPlayer = LoadRandomPlayerSession([player.Username, ...extraPeople]);
                //
                //         extraPeople.push(extraPlayer.NameAsDisplayed);
                //
                //         text += `@${extraPlayer.NameAsDisplayed}`;
                //         if(i < 2) {
                //             text += `, `;
                //         }
                //         else {
                //             text += ' and ';
                //         }
                //     }
                //
                //     let cozyPointsToGive = GetRandomIntI(1, 3);
                //
                //     text += ` all get ${cozyPointsToGive} cozy point${cozyPointsToGive == 1 ? '' : 's'}!`
                //
                //     GiveCozyPoints(player.Username, cozyPointsToGive);
                //     for (let i = 0; i < extraPeople.length; i++) {
                //         GiveCozyPoints(extraPeople[i], cozyPointsToGive);
                //     }
                //
                //     await client.say(process.env.CHANNEL!, text);
                //
                //     return true;
                // }

                let playerGameData = LoadPlayer(otherUser.NameAsDisplayed);
                if (playerGameData.PassiveModeEnabled || playerGameData.Level == 0) {
                    await client.say(process.env.CHANNEL!, `@${player.Username} you can't attack @${otherUser.NameAsDisplayed}, they have passive mode enabled.`);
                    return false;
                }

                if (player.Username.toLowerCase() == otherUser.NameAsDisplayed.toLowerCase()) {
                    await client.say(process.env.CHANNEL!, `@${player.Username} you strike a flame and catch YOURSELF ON FIRE OH GOD SOMEONE HELP THEM!`);
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username} you strike a flame and${onPurpose ? `` : ` accidentally`} catch @${otherUser.NameAsDisplayed} on fire!`);
                }

                //Damage calc
                let otherUserPlayer = LoadPlayer(otherUser.NameAsDisplayed);
                let maxHealth = CalculateMaxHealth(otherUserPlayer);
                let damage = Math.max(1, GetRandomIntI(maxHealth * 0.05, maxHealth * 0.2));

                await ChangePlayerHealth(client, otherUser.NameAsDisplayed, -damage, DamageType.Fire);

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "scroll of truth",
        ContextualName: "a scroll of truth",
        PluralName: "several scrolls of truth",
        Tier: ObjectTier.Mid,
        IconRep: IconType.Pencil,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        Info: "Allows you to proclaim a truth to the chat, then chat will vote on if they agree. (Ex. !use scroll of truth Cory is the best)",
        CostRange: {min: 40, max: 80},
        UseAction: {
            "use": async (client, player, afterText) => {
                if (afterText.trim().length > 3) {
                    AddToActionQueue(() => {
                        let s = "";
                        if (player.Username[player.Username.length - 1] === 's') {
                            s = "'";
                        } else {
                            s = "'s";
                        }
                        Broadcast(JSON.stringify({
                            type: 'showDisplay',
                            title: `${player.Username}${s} Proclamation`,
                            message: afterText[0].toUpperCase() + afterText.slice(1),
                            icon: (IconType.Scroll)
                        }));

                        PlayTextToSpeech(`${player.Username} has proclaimed`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                            PlayTextToSpeech(afterText, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                                PlayTextToSpeech(`Chat, do you agree? Starting a poll.`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                                    CreatePoll(client, {
                                        title: `Do you agree with ${player.Username}?`,
                                        choices: [
                                            "Yes",
                                            "No"
                                        ]
                                    }, 30, false, (winner) => {
                                        let chatAgreed = winner === "Yes";
                                        PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} with ${player.Username} that "${afterText}.`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                                            if (chatAgreed) {
                                                PlaySound("cheering", AudioType.GameAlerts);
                                                await GivePlayerRandomObject(client, player.Username, ObjectRetrievalType.RandomReward);
                                                await GiveExp(client, player.Username, 50);
                                            } else {
                                                PlaySound("booing", AudioType.GameAlerts, "wav", () => {
                                                    PlayTextToSpeech("They have been temporarily banned for 5 minutes.", AudioType.GameAlerts);
                                                });
                                                await BanUser(client, player.Username, 5 * 60, "Chat disagreed with them");
                                            }
                                        })
                                    });
                                })
                            })
                        })
                    }, 60)
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you must make a better proclamation of truth. Ex. !use scroll of truth Cory is the best`);
                    return false;
                }

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "scroll of challenge",
        ContextualName: "a scroll of challenge",
        PluralName: "several scrolls of challenge",
        IconRep: IconType.Scroll,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        Info: "Allows you to issue a challenge to Cory that he will do within the next 1 minute. He can veto a challenge, so keep it reasonable. (Ex. !use scroll of challenge take off your glasses)",
        CostRange: {min: 50, max: 100},
        Tier: ObjectTier.Mid,
        UseAction: {
            "use": async (client, player, afterText) => {
                if (afterText.trim().length > 3) {
                    AddToActionQueue(() => {
                        let s = "";
                        if (player.Username[player.Username.length - 1] === 's') {
                            s = "'";
                        } else {
                            s = "'s";
                        }
                        Broadcast(JSON.stringify({
                            type: 'showDisplay',
                            title: `${player.Username}${s} Challenge`,
                            message: afterText[0].toUpperCase() + afterText.slice(1),
                            icon: (IconType.Scroll)
                        }));

                        PlayTextToSpeech(`${player.Username} has issued a challenge to Cory to `, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                            PlayTextToSpeech(afterText, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                                PlayTextToSpeech(`For the next minute`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                                    setTimeout(() => {
                                        PlayTextToSpeech(`Cory's challenge is complete. Chat you may now judge how well Cory accomplished the challenge.`, AudioType.GameAlerts, "en-US-BrianNeural")
                                        CreatePoll(client, {
                                            title: `Did Cory complete the challenge?`,
                                            choices: [
                                                "Yes",
                                                "No"
                                            ]
                                        }, 30, false, (winner) => {
                                            let chatAgreed = winner === "Yes";
                                            PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} that Cory completed the challenge to "${afterText}.`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                                                if (chatAgreed) {
                                                    PlaySound("cheering", AudioType.GameAlerts);
                                                    // GivePlayerRandomObject(client, player.Username);
                                                    // await GiveExp(client, player.Username, 10);
                                                } else {
                                                    PlaySound("booing", AudioType.GameAlerts, "wav");
                                                    // await banUser(client, player.Username, 5 * 60, "Chat disagreed with them");
                                                }
                                            })
                                        });
                                    }, 1000 * 60)

                                })
                            })
                        })
                    }, 140)
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you must make a better challenge. Ex. !use scroll of challenge take off your glasses`);
                    return false;
                }

                return true;
            }
        },
        Consumable: true,
        Rarity: 3
    },
    {
        ObjectName: "magic nuke",
        Alias: ["nuke"],
        ContextualName: "a magic nuke",
        PluralName: "magic nukes",
        Info: "Let's you nuke the current monster, though also hurts yourself and other people. (Ex. !use nuke)",
        CostRange: {min: 500, max: 1000},
        Tier: ObjectTier.High,
        IconRep: IconType.Bomb,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                if (player.PassiveModeEnabled) {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you can't attack others while in passive mode. Use !togglepassive to disable it.`);
                    return false;
                }

                if (IsMonsterActive) {
                    PlaySound("nuke", AudioType.UserGameActions);
                    await client.say(process.env.CHANNEL!, `@${player.Username} has deployed a magic nuke!`);

                    let wasBad = false;

                    await SetLightBrightness(0);

                    setTimeout(async () => {

                        await SetSceneItemEnabled("Explosion VFX", true);

                        setTimeout(() => {
                            SetSceneItemEnabled("Explosion VFX", false);
                        }, 1000 * 17);

                        await SetLightColor(1, 0, 0);
                        await SetLightBrightness(1);

                        setTimeout(async () => {
                            await FadeOutLights();
                        }, 1000 * 10);

                    }, 1000 * 2);

                    setTimeout(async () => {
                        if (!afterText.includes("chat")) {
                            let monster = LoadMonsterData();
                            let monsterMaxHealth = monster.Stats.MaxHealth;
                            let damageToMonster = GetRandomIntI(monsterMaxHealth * 0.5, monsterMaxHealth * 0.7);

                            await client.say(process.env.CHANNEL!, `${monster.Stats.Name} has been nuked for ${damageToMonster} fire damage!`);
                            await DoDamageToMonster(client, player.Username, damageToMonster, DamageType.Fire);
                        }

                        let damageRatioToPlayer = GetRandomNumber(0.6, 0.9);
                        let damageToPlayer = Math.floor(CalculateMaxHealth(player) * damageRatioToPlayer);
                        await ChangePlayerHealth(client, player.Username, -damageToPlayer, DamageType.Fire, `A nuke they fired`);

                        let playerSessionData = GetAllPlayerSessions();

                        let playersAttacked = 0;
                        for (const otherPlayer of playerSessionData) {
                            let otherPlayerGameData = LoadPlayer(otherPlayer.NameAsDisplayed.toLowerCase());

                            if (!otherPlayerGameData.PassiveModeEnabled && otherPlayerGameData.Level > 0 && otherPlayer.NameAsDisplayed.toLowerCase() !== player.Username.toLowerCase()) {
                                let otherPlayerData = LoadPlayer(otherPlayer.NameAsDisplayed);

                                let damageToOther = Math.floor(CalculateMaxHealth(otherPlayerData) * 0.2);

                                await ChangePlayerHealth(client, otherPlayerData.Username, -damageToOther, DamageType.Fire, `A nuke fired by @${player.Username}`);
                                playersAttacked++;
                            }
                        }

                        if (afterText.includes("chat") && playersAttacked == 0) {
                            wasBad = true;
                        }

                    }, 1000 * 5);

                    if (wasBad) {
                        return false;
                    }

                    return true;
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you cannot fire a magic nuke until a monster is out.`);

                    return false;
                }
            }
        },
        Consumable: true,
        Rarity: 2
    },
    // {
    //     ObjectName: "letter",
    //     ContextualName: "a letter",
    //     PluralName: "letters",
    //     Info: "Allows you to send an item you have to someone else! Ex. !use letter the7ark crystal",
    //     Retrieval: [],
    //     CostRange: {min: 100, max: 300 },
    //     Tier: ObjectTier.Mid,
    //     IconRep: IconType.Letter,
    //     UseAction: { "use": async (client, player, afterText) => {
    //
    //         let pieces = afterText.trim().split(' ');
    //
    //         let otherPlayer = TryLoadPlayer(pieces[0].replace("@", ""));
    //
    //         if(otherPlayer?.Username == player.Username) {
    //             await client.say(process.env.CHANNEL!, `@${player.Username}, you throw it up in the air and catch it again`);
    //             return false;
    //         }
    //
    //         if(otherPlayer != null) {
    //             let item = GetObjectFromInputText(afterText.trim().replace(pieces[0] + " ", ""))!;
    //
    //             if(item !== undefined) {
    //                 if(item.ObjectName == "letter") {
    //                     if(player.Inventory.filter(x => x == item.ObjectName).length <= 1) {
    //                         await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have an extra letter to send`);
    //                         return false;
    //                     }
    //                 }
    //
    //                 if(player.Inventory.includes(item.ObjectName)) {
    //                     await client.say(process.env.CHANNEL!, `@${player.Username} is giving @${otherPlayer.Username} ${item.ContextualName}!`);
    //                     GivePlayerObject(client, otherPlayer.Username, item.ObjectName);
    //                     let index = player.Inventory.indexOf(item.ObjectName);
    //                     player.Inventory.splice(index, 1);
    //                     SavePlayer(player);
    //                 }
    //                 else {
    //                     await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have that item`);
    //                     return false;
    //                 }
    //             }
    //             else {
    //                 await client.say(process.env.CHANNEL!, `@${player.Username}, I couldn't find that item`);
    //                 return false;
    //             }
    //         }
    //         else {
    //             await client.say(process.env.CHANNEL!, `@${player.Username}, I could not find that player`);
    //             return false;
    //         }
    //
    //
    //         return true;
    //     },
    //     Consumable: true,
    //     Rarity: 0 //Deprecating the letter
    // },
    {
        ObjectName: "crystal",
        ContextualName: "a crystal",
        PluralName: "crystals",
        Info: "Gives you enough EXP for an instant level up! (Ex. !use crystal)",
        CostRange: {min: 700, max: 1000},
        Tier: ObjectTier.High,
        IconRep: IconType.Crystal,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                if (player.LevelUpAvailable) {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you already have a level up available! You must level up before using the crystal`);
                    return false;
                }

                let expNeeded = player.CurrentExpNeeded - player.CurrentExp;
                await client.say(process.env.CHANNEL!, `@${player.Username} has crushed a magic crystal!`);
                await GiveExp(client, player.Username, expNeeded, false);

                return true;
            }
        },
        Consumable: true,
        Rarity: 2
    },
    {
        ObjectName: "accuracy potion",
        ContextualName: "an accuracy potion",
        PluralName: "accuracy potions",
        Alias: ["accuracy"],
        Info: "Doubles your accuracy! (Ex. !use accuracy potion)",
        CostRange: {min: 100, max: 150},
        Tier: ObjectTier.Mid,
        IconRep: IconType.BottleBlue,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} has increased accuracy for 5 minutes`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.DoubleAccuracy, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "fire resistance potion",
        ContextualName: "a fire resistance potion",
        PluralName: "fire resistance potions",
        Alias: ["fire resistance", "fire resist", "fire resist potion"],
        Info: "Gives you fire resistance for 5 minutes! (Ex. !use fire resistance potion)",
        CostRange: {min: 100, max: 150},
        Tier: ObjectTier.Low,
        IconRep: IconType.Bottle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} has fire resistance for 5 minutes`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.FireResistance, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cold resistance potion",
        ContextualName: "a cold resistance potion",
        PluralName: "cold resistance potions",
        Alias: ["cold resistance", "cold resist", "cold resist potion"],
        Info: "Gives you cold resistance for 5 minutes! (Ex. !use cold resistance potion)",
        CostRange: {min: 100, max: 150},
        Tier: ObjectTier.Low,
        IconRep: IconType.BottleBlue,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} has cold resistance for 5 minutes`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.ColdResistance, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "physical resistance potion",
        ContextualName: "a physical resistance potion",
        PluralName: "physical resistance potions",
        Alias: ["physical resistance", "physical resist", "physical resist potion"],
        Info: "Gives you resistance against physical damage for 5 minutes! (Ex. !use physical resistance potion)",
        CostRange: {min: 100, max: 150},
        Tier: ObjectTier.Mid,
        IconRep: IconType.Bottle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} has resistance against physical damage types for 5 minutes`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.PhysicalResistance, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "elemental resistance potion",
        ContextualName: "an elemental resistance potion",
        PluralName: "elemental resistance potions",
        Alias: ["elemental resistance", "elemental resist", "elemental resist potion"],
        Info: "Gives you elemental resistance for 5 minutes! (Ex. !use elemental resistance potion)",
        CostRange: {min: 100, max: 150},
        Tier: ObjectTier.Mid,
        IconRep: IconType.BottleBlue,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} has elemental resistance for 5 minutes`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.ElementalResistance, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 10
    },
    {
        ObjectName: "magic key",
        ContextualName: "a magic key",
        PluralName: "magic keys",
        Info: "A key for a magic chest. !use to start a poll, if the vote is YES to share the rewards, up to three random people from the poll get low or mid tier rewards. If the vote is NO, one random person from the poll gets a high tier reward. The poll MUST have 3 votes to be valid.",
        Tier: ObjectTier.Mid,
        Retrieval: [
            ObjectRetrievalType.TravelingSalesman,
            ObjectRetrievalType.FoundInNature,
        ],
        ResourceCategories: [
            LocationResourceType.OreRock,
            LocationResourceType.MineralRock,
            LocationResourceType.Crystals,
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Dryland,
            LocationResourceType.Grassland,
            LocationResourceType.SmallGame,
            LocationResourceType.LargeGame,
            LocationResourceType.FreshWater,
            LocationResourceType.SaltWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherTimeMultiplier: 0.3,
        CostRange: {min: 500, max: 750},
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you find a hidden treasure chest, only to open it and find a magical key.`
            ];
            switch (terrainType) {
                case TerrainType.Ocean:
                    options.push(...[
                        `as you swim through a bit of the ocean, you suddenly see something shiny. A key somehow floats atop the water? Strange.`,
                    ]);
                    break;
                case TerrainType.Tundra:
                    options.push(...[
                        `something shiny sticks out among the snow, as you uncover it you discover a key.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `as you wander through the woods, you spot something shiny... it's a key?`,
                    ]);
                case TerrainType.Swamp:
                    options.push(...[
                        `buried deep in the mud, you find a shiny key.`,
                    ]);
                    break;
            }

            return options;
        },
        UseAction: {
            "use": async (client, player, afterText) => {
                AddToActionQueue(async () => {
                    PlayTextToSpeech(`${player.Username} is opening a magic chest!`, AudioType.UserGameActions);
                    await client.say(process.env.CHANNEL!, `@${player.Username} you insert your magic key into the air, and a magical chest appears.`);
                    await CreatePoll(client, {
                        title: "Share the magical chest rewards? Voting YES gives 3 people low/mid tier rewards. Voting NO gives 1 person a high tier reward.",
                        choices: ["Yes", "No"]
                    }, 60, false, async (result, voters) => {
                        if (voters.length >= 3) {
                            if (result == "Yes") {
                                PlayTextToSpeech(`Chat voted to give items to the people!`, AudioType.UserGameActions);
                                await client.say(process.env.CHANNEL!, `Chat voted to give items to the people!`);
                                for (let i = 0; i < 3; i++) {
                                    let randomVoter = GetRandomItem(voters);
                                    if (randomVoter != undefined) {
                                        await GivePlayerRandomObjectInTier(client, randomVoter, [ObjectTier.Low, ObjectTier.Mid], ObjectRetrievalType.RandomReward);
                                        voters = voters.filter(x => x != randomVoter);
                                    }
                                }
                            } else {
                                for (let i = 0; i < voters.length; i++) {
                                    console.log(voters[i]);
                                }
                                let randomVoter = GetRandomItem(voters);
                                if (randomVoter != undefined) {
                                    PlayTextToSpeech(`Chat voted to be greedy. ${randomVoter} receives a high-tier item!`, AudioType.UserGameActions);
                                    await client.say(process.env.CHANNEL!, `${randomVoter} receives a high-tier item from the magic chest!`);
                                    await GivePlayerRandomObjectInTier(client, randomVoter, [ObjectTier.High], ObjectRetrievalType.RandomReward);
                                }
                                else {
                                    await client.say(process.env.CHANNEL!, `Code broke`);
                                }
                            }
                        } else {
                            await client.say(process.env.CHANNEL!, `@${player.Username}, not enough people voted on the poll. At least 3 people must vote, and you only had ${voters} voters. The key disappears.`);
                        }
                    })
                }, 80);

                return true;
            }
        },
        Consumable: true,
        Rarity: 3
    },
    {
        ObjectName: "bee",
        ContextualName: "a bee",
        PluralName: "bees",
        Info: "It's a cute little bee! Helps make honey if you have a beehive.",
        Tier: ObjectTier.Mid,
        Retrieval: [
            ObjectRetrievalType.TravelingSalesman,
            ObjectRetrievalType.FoundInNature,
        ],
        ResourceCategories: [
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Grassland,
            LocationResourceType.SmallGame,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherTimeMultiplier: 0.3,
        CostRange: {min: 40, max: 70},
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you hear a buzzing, as you spot a bee flying by you. You're quick, and are able to capture it in a jar!`,
                `as you search, you hear buzz buzz... it's a BEE! Your new friend.`
            ];
            switch (terrainType) {
                case TerrainType.Lake:
                    options.push(...[
                        `along the shore of the lake you spot a tiny little bee drinking from the waters. You're able to carefully pop it in a jar.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `you find a beehive! What luck. You're able to grab a bee for yourself.`,
                    ]);
            }

            return options;
        },
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you admire your cute little bee.`);

                return false;
            }
        },
        Consumable: false,
        Rarity: 10
    },
    {
        ObjectName: "coin pouch",
        ContextualName: "a coin pouch",
        PluralName: "coin pouches",
        Info: "A pouch of coins! Open it up to see whats inside",
        Retrieval: [
            ObjectRetrievalType.FindableInMinigames,
            ObjectRetrievalType.FoundInNature,
        ],
        ResourceCategories: [
            LocationResourceType.OreRock,
            LocationResourceType.MineralRock,
            LocationResourceType.Crystals,
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Dryland,
            LocationResourceType.Grassland,
            LocationResourceType.SmallGame,
            LocationResourceType.LargeGame,
            LocationResourceType.FreshWater,
            LocationResourceType.SaltWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherTimeMultiplier: 0.3,
        UseAlias: [`open`],
        UseAction: { "use": async (client, player) => {
                let coins = GetRandomIntI(3, 10);
                if(GetRandomIntI(1, 10) == 1) {
                    coins = GetRandomIntI(20, 50);
                }
                player.ByteCoins += coins;
                SavePlayer(player);
                await client.say(process.env.CHANNEL!, `@${player.Username} opens their coin pouch, and finds ${coins} ByteCoins inside!`);
                return true;
            }},
        Consumable: true,
        Rarity: 15
    },
    // {
    //     ObjectName: "beehive",
    //     ContextualName: "a beehive",
    //     PluralName: "beehives",
    //     Info: "A house for a bee! Make honey, if you have the bees",
    //     Tier: ObjectTier.Mid,
    //     Retrieval: [
    //         ObjectRetrievalType.TravelingSalesman,
    //     ],
    //     UseAction: { "use": async (client, player, afterText) => {
    //             await client.say(process.env.CHANNEL!, `@${player.Username} you admire your cute little bee.`);
    //
    //             return false;
    //         }},
    //     Consumable: false,
    //     Rarity: 10
    // },

    {
        ObjectName: "stone",
        ContextualName: "a stone",
        PluralName: "stones",
        Info: "A simple stone. Can be used to craft other items, or perhaps there's something interesting inside?",
        Retrieval: [
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.OreRock,
            LocationResourceType.MineralRock,
            LocationResourceType.Crystals,
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Dryland,
            LocationResourceType.Grassland,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you spot a simple stone on the ground, and pop it in your pocket.`,
                `there's a really nice looking stone, and you figure it would be good to keep.`
            ];
            switch (terrainType) {
                case TerrainType.Mountain:
                    options.push(...[
                        `as you climb up through jagged cliffs, a rough stone catches your eye, it could have something good inside, so you take it.`,
                        `climbing up a bit to get a better view, some rocks break off and you fall a short distance. You're okay, but come away with a large stone.`
                    ]);
                    break;
                case TerrainType.Wasteland:
                    options.push(...[
                        `not much of use is out here, but you do spot a stone. You could do something with that.`,
                    ]);
                    break;
                case TerrainType.Volcano:
                    options.push(...[
                        `you spot a large stone amongst the volcanic ash. It could be interesting.`,
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 0.3,
        CostRange: {min: 5, max: 10},
        UseAlias: ["smash", "open"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let text = "you smash open the stone ";

                //20% chance
                let chance = GetRandomIntI(1, 100);
                if (chance >= 80) {
                    let randomReward = GetRandomItem(GetInventoryObjectsBySource(ObjectRetrievalType.RandomReward));
                    if (randomReward != undefined) {
                        text += `and somehow find ${randomReward?.ContextualName} inside!`;
                        await GivePlayerObject(client, player.Username, randomReward.ObjectName, false);
                    } else {
                        let amount = GetRandomIntI(5, 15);
                        text += `and find ${amount} coins inside!`;
                        player.ByteCoins += amount;
                        SavePlayer(player)
                    }
                }
                else if(chance >= 70) { //10% chance for coins
                    let amount = GetRandomIntI(5, 15);
                    text += `and find ${amount} coins inside!`;
                    player.ByteCoins += amount;
                    SavePlayer(player)
                }
                else
                {
                    text += "and find nothing inside. It was just a stone!"
                }

                await client.say(process.env.CHANNEL!, `@${player.Username}, ${text}`);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "whetstone",
        ContextualName: "a whetstone",
        PluralName: "whetstones",
        Info: "Sharpen your weapon. Grants double damage for 60 seconds.",
        Retrieval: [ObjectRetrievalType.Craftable],
        CraftingRecipe: { Recipe: [{ Resource: "stone", Amount: 2 }, { Resource: "water", Amount: 1 }] },
        UseAction: { "use": async (client, player) => {
                AddStatusEffectToPlayer(player.Username, StatusEffect.DoubleDamage, 60);
                await client.say(process.env.CHANNEL!, `@${player.Username} sharpens their edge. Double damage for 60s!`);
                return true;
            }},
        Consumable: true,
        Rarity: 0
    },

    //General Food
    {
        ObjectName: "apple",
        ContextualName: "an apple",
        PluralName: "apples",
        Info: "A fresh apple. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Dryland,
            LocationResourceType.Grassland,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Forest,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you spot a simple apple on the ground, it looks undamaged, and delicious.`,
                `a lone tree stands nearby, with a lovely apple hanging from it. You jump up and grab it.`
            ];
            switch (terrainType) {
                case TerrainType.Forest:
                    options.push(...[
                        `several apples hang from the trees nearby, you find the juiciest one and throw it in your bag.`,
                        `you find a nature apple orchard and grab a lovely apple.`
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 0.3,
        CostRange: {min: 5, max: 10},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a delicious apple.`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "bread",
        ContextualName: "a loaf of bread",
        PluralName: "loaves of bread",
        Info: "A loaf of bread. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore
        ],
        CostRange: {min: 30, max: 60},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat through an entire loaf of bread.`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cheese",
        ContextualName: "a chunk of cheese",
        PluralName: "cheese chunks",
        Info: "A chunk of cheese. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore
        ],
        CostRange: {min: 30, max: 50},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you munch on a chunk of cheese`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "butter",
        ContextualName: "a stick of butter",
        PluralName: "butter sticks",
        Info: "A stick of butter. When used, it will make you slippery.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore
        ],
        CostRange: {min: 30, max: 60},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, rub the butter all over yourself. So slippery!`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.IncreaseACBy3, 60);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "egg",
        ContextualName: "an egg",
        PluralName: "eggs",
        Info: "An egg. Good for cooking. Can be thrown. When used, you throw it at someone else.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `partially stuck out of the ground, you notice something strange. You uncover it, only to find an egg buried! How strange.`,
                `just walking in plain view, you spot a chicken. It clucks up to you, and lays an egg right before your eyes. Free egg!`
            ];
            switch (terrainType) {
                case TerrainType.Lake:
                    options.push(...[
                        `nearby the shore of the lake, you find a small birds nest. Inside there's several eggs, you take one.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `you find a bird's nest within the underbrush, and take an egg.`,
                    ]);
                case TerrainType.Jungle:
                    options.push(...[
                        `you climb a tall tree within the thick jungle, you find an egg in a high nest.`,
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 1,
        CostRange: {min: 5, max: 10},
        ThrownDamage: {min: 2, max: 5},
        UseAction: {
            "use": async (client, player, afterText) => {
                let onPurpose = false;
                let otherUser: PlayerSessionData = LoadPlayerSession(afterText.replace("@", ""));
                if (otherUser !== undefined) {
                    onPurpose = true;
                } else {
                    otherUser = LoadRandomPlayerSession([player.Username], true)!;
                }

                let wasPoisoned = GetRandomIntI(1, 100) == 1;

                let text = `@${player.Username}, you throw an egg at @${otherUser.NameAsDisplayed}!`;

                if (wasPoisoned) {
                    AddStatusEffectToPlayer(otherUser.NameAsDisplayed.toLowerCase(), StatusEffect.Poisoned, 60 * 5);
                }

                text += ` Oops! @${otherUser.NameAsDisplayed} got Salmonella and is poisoned now.`;

                await client.say(process.env.CHANNEL!, text);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "honey",
        ContextualName: "a jar of honey",
        PluralName: "honey jars",
        Info: "A jar of honey. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Grassland,
            LocationResourceType.SmallGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you find a beehive, and are able to quickly gather a bit of honey into a jar for yourself.`,
                `you spot something odd nearby, and find a full jar of honey. You don't see anyone nearby... so you take it.`
            ];
            switch (terrainType) {
                case TerrainType.Forest:
                    options.push(...[
                        `you spot a beehive up in a tree, you carefully extract some honey into a jar.`,
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 1.3,
        CostRange: {min: 20, max: 50},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a WHOLE jar of honey`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "milk",
        ContextualName: "a bottle of milk",
        PluralName: "bottle of milk",
        Info: "A bottle of milk. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore
        ],
        CostRange: {min: 30, max: 50},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you chug a bottle of milk`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "sugar",
        ContextualName: "a bag of sugar",
        PluralName: "bags of sugar",
        Info: "A bag of sugar. When used, it will energize you.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore
        ],
        CostRange: {min: 30, max: 50},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you drain a bag of sugar into your mouth`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.RandomAccuracy, 60);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "flour",
        ContextualName: "a bag of flour",
        PluralName: "bags of flour",
        Info: "A bag of flour.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
        ],
        CostRange: {min: 5, max: 20},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, wow, that's a nice bag of flour you have. You cough a bit as you taste it.`);

                return false;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "water",
        ContextualName: "a cup of water",
        PluralName: "cups of water",
        Info: "A cup of water.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `a small pond nearby has a bit of water. You scoop up a cup for later.`,
                `a tiny stream flows through the area, you collect a bit of water.`
            ];
            switch (terrainType) {
                case TerrainType.Tundra:
                    options.push(...[
                        `you're able to scoop up a bit of snow into a jar, it later melts into a bit of water.`,
                    ]);
                    break;
                case TerrainType.Mountain:
                    options.push(...[
                        `a small stream flows down from the peaks of the upper mountain, you're able to collect some of the water.`,
                    ]);
                    break;
                case TerrainType.Lake:
                    options.push(...[
                        `you crouch down by the lake and scoop some water into a canteen.`,
                    ]);
                    break;
                case TerrainType.Desert:
                    options.push(...[
                        `you find an oasis in the vast desert, you quickly grab some water.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `a small stream flows through the underbrush, you gather some water from it.`,
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 0.7,
        CostRange: {min: 5, max: 10},
        UseAlias: ["drink"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, so refreshing!`);

                return false;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "salt",
        ContextualName: "a cup of salt",
        PluralName: "cups of salt",
        Info: "A cup of salt.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.MineralRock,
            LocationResourceType.SaltWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you spot a sun-dried rock nearby, and as you scrap a bit of thin white crust from it, you recognize it as salt and store it.`,
                `in a small cave you find rock salt and chip off a few chunks.`
            ];
            switch (terrainType) {
                case TerrainType.Ocean:
                    options.push(...[
                        `a small tidal pool has white crystals, you scrap salt off of them into a pouch.`,
                        `you collect some saltwater, and evaporate it until you're left with salt.`
                    ]);
                    break;
                case TerrainType.Mountain:
                    options.push(...[
                        `a small mineral spring leaves a bit of salt on the stones, and you're able to collect it.`,
                        `you find a salt deposit, and are able to collect some.`
                    ]);
                    break;
                case TerrainType.Lake:
                    options.push(...[
                        `a shallow corner of the lake has salty water, you boil a cup and keep the salt.`,
                        `you find a small jar of salt in a nearby fishing hut.`
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 1.3,
        CostRange: {min: 5, max: 10},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, so salty!`);

                return false;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cocoa",
        ContextualName: "a chunk of cocoa",
        PluralName: "chunks of cocoa",
        Info: "A chunk of cocoa.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SoftWood,
            LocationResourceType.HardWood,
            LocationResourceType.Wetland,
            LocationResourceType.Grassland,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `an old backpack is found nearby, there's not much inside, but you do find a small bag of cocoa beans.`
            ];
            switch (terrainType) {
                case TerrainType.Ocean:
                    options.push(...[
                        `an abandoned crate is floating among the waves. You pull it over and find cocoa beans inside.`,
                        `an old shipwreck has washed up on shore. After scavenging inside, you find some cocoa beans.`
                    ]);
                case TerrainType.Jungle:
                    options.push(...[
                        `you find several cocoa pods hung on a tree, you crack them open and take the cocoa.`,
                        `you find a few fallen cocoa pods on the jungle floor, you cut them open and take the beans.`
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 1.5,
        CostRange: {min: 5, max: 10},
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, mmmmm chocolate!`);

                return false;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "tomato",
        ContextualName: "a tomato",
        PluralName: "tomatoes",
        Info: "A lovely red tomato. When used, it will heal you for 1HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.FoundInNature,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SoftWood,
            LocationResourceType.Wetland,
            LocationResourceType.Grassland,
            LocationResourceType.SmallGame,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you find a small tomato plant, and are able to pluck a tomato from it.`,
                `you find some old cooking supplies abandoned in a crate. Inside is a fresh tomato.`
            ];
            switch (terrainType) {
                case TerrainType.Mountain:
                    options.push(...[
                        `on a high rock shelf, you spot a wild vine of tomatoes, you pick one.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `in a sunny gap from the trees, you spot a wild vine. You pick the fruit from it, and find a tomato.`,
                    ]);
                case TerrainType.Plains:
                    options.push(...[
                        `along a stream, you find a low plant with a tomato.`,
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 0.8,
        CostRange: {min: 2, max: 5},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you bite into a raw tomato, I guess.`);
                await ChangePlayerHealth(client, player.Username, 1, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },

    //FISH
    {
        ObjectName: "raw salmon",
        ContextualName: "a raw salmon",
        PluralName: "raw salmon",
        Info: "A raw salmon. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
            LocationResourceType.FreshWater,
        ],
        TerrainsLocatedIn: [
            TerrainType.Ocean,
            TerrainType.Tundra,
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Wasteland,
            TerrainType.Volcano,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `a small river flows nearby, and after fishing for a while, you catch a salmon.`
            ];
            switch (terrainType) {
                case TerrainType.Ocean:
                    options.push(...[
                        `you go fishing for a while, and eventually catch a salmon.`,
                    ]);
                    break;
                case TerrainType.Lake:
                    options.push(...[
                        `you fish on the lake, and catch a salmon!`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `a river cuts through the trees, you're able to stab at a salmon swimming through.`,
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 0.7,
        CookTimeInSeconds: 45,
        CookedVersion: `cooked salmon`,
        CostRange: {min: 50, max: 100},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cooked salmon",
        ContextualName: "a cooked salmon",
        PluralName: "cooked salmon",
        Info: "A cooked salmon. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 100, max: 150},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you slice into the salmon and begin eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 15, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },

    //MEATS
    {
        ObjectName: "raw venison",
        ContextualName: "a cut of raw venison",
        PluralName: "cuts of raw venison",
        Info: "A cut of raw venison. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.LargeGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Forest,
            TerrainType.Plains,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you find the remains of a deer, and are able to gather some raw venison`,
                `you find an injured deer that can't be saved, you put it out of its misery, and gather some raw venison`
            ];
            switch (terrainType) {
                case TerrainType.Lake:
                    options.push(...[
                        `a deer is drinking at the nearby lake. You're able to quickly take it down and gather venison.`,
                    ]);
                    break;
                case TerrainType.Forest:
                    options.push(...[
                        `you spot a deer running through the woods, you quickly and respectfully dispose of the deer, and gather some raw venison`,
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 1.5,
        CookTimeInSeconds: 60 * 2,
        CookedVersion: `venison`,
        CostRange: {min: 100, max: 150},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "venison",
        ContextualName: "a cut of venison",
        PluralName: "cuts of venison",
        Info: "A cut of venison. When used, it will heal you for 20HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 200, max: 300},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the venison and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 20, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw pork",
        ContextualName: "a cut of raw pork",
        PluralName: "cuts of raw pork",
        Info: "A cut of raw pork. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
            LocationResourceType.LargeGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Forest,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you quickly let an arrow fly through a boars eye, and gather it's remains.`
            ];
            switch (terrainType) {
                case TerrainType.Forest:
                    options.push(...[
                        `you spot a boar digging through the underbrush, looking for truffles. You sneak up on it and put the animal to rest, and gather the meat.`,
                    ]);
            }

            return options;
        },
        GatherTimeMultiplier: 1.2,
        CookTimeInSeconds: 60,
        CookedVersion: `pork`,
        CostRange: {min: 50, max: 100},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "pork",
        ContextualName: "a cut of pork",
        PluralName: "cuts of pork",
        Info: "A cut of pork. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 100, max: 150},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the pork and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 15, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw sausage",
        ContextualName: "a cut of raw sausage",
        PluralName: "cuts of raw sausage",
        Info: "A cut of raw sausage. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
            LocationResourceType.LargeGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Forest,
            TerrainType.Plains,
            TerrainType.Swamp,
            TerrainType.Jungle,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you quickly let an arrow fly through a boars eye, and gather it's remains.`
            ];
            switch (terrainType) {
                case TerrainType.Forest:
                    options.push(...[
                        `you spot a boar digging through the underbrush, looking for truffles. You sneak up on it and put the animal to rest, and gather the meat.`,
                    ]);
                    break;
            }

            return options;
        },
        GatherTimeMultiplier: 1,
        CookTimeInSeconds: 45,
        CookedVersion: `sausage`,
        CostRange: {min: 50, max: 100},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "sausage",
        ContextualName: "a cut of sausage",
        PluralName: "cuts of sausage",
        Info: "A cut of sausage. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 100, max: 150},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the sausage and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 15, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw hare",
        ContextualName: "a cut of raw hare",
        PluralName: "cuts of raw hare",
        Info: "A cut of raw hare. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Mountain,
            TerrainType.Lake,
            TerrainType.Desert,
            TerrainType.Forest,
            TerrainType.Plains,
            TerrainType.Tundra
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you strike down a hare and gather its remains.`,
                `you sneak up on a wild hare and are able to put it to rest quickly and as painlessly as possible.`
            ];

            return options;
        },
        GatherTimeMultiplier: 0.8,
        CookTimeInSeconds: 30,
        CookedVersion: `cooked hare`,
        CostRange: {min: 30, max: 60},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cooked hare",
        ContextualName: "a cut of cooked hare",
        PluralName: "cuts of cooked hare",
        Info: "A cut of cooked hare. When used, it will heal you for 10HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 60, max: 120},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the cooked hare and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 10, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw pheasant",
        ContextualName: "a cut of raw pheasant",
        PluralName: "cuts of raw pheasant",
        Info: "A cut of raw pheasant. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.SmallGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Plains,
            TerrainType.Swamp,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you sneak up on a wild pheasant, and just as it takes off into the air you strike it down instantly.`,
                `you're able to take down a pheasant quickly.`
            ];

            return options;
        },
        GatherTimeMultiplier: 0.7,
        CookTimeInSeconds: 45,
        CookedVersion: `cooked pheasant`,
        CostRange: {min: 40, max: 70},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cooked pheasant",
        ContextualName: "a cut of cooked pheasant",
        PluralName: "cuts of cooked pheasant",
        Info: "A cut of cooked pheasant. When used, it will heal you for 10HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 80, max: 140},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the cooked pheasant and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 10, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw mutton",
        ContextualName: "a cut of raw mutton",
        PluralName: "cuts of raw mutton",
        Info: "A cut of raw mutton. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.LargeGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Plains,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you spot a wild sheep grazing, and are able to take it down quickly.`,
                `you fight off a wolf trying to eat a sheep, and are able to get away with some of the meat.`
            ];

            return options;
        },
        GatherTimeMultiplier: 1,
        CookTimeInSeconds: 60 * 1.5,
        CookedVersion: `mutton`,
        CostRange: {min: 75, max: 125},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "mutton",
        ContextualName: "a cut of mutton",
        PluralName: "cuts of mutton",
        Info: "A cut of mutton. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 150, max: 250},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the mutton and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 15, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw beef",
        ContextualName: "a cut of raw beef",
        PluralName: "cuts of raw beef",
        Info: "A cut of raw beef. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Huntable,
            ObjectRetrievalType.FindableInMinigames
        ],
        ResourceCategories: [
            LocationResourceType.LargeGame,
        ],
        TerrainsLocatedIn: [
            TerrainType.Lake,
            TerrainType.Plains,
        ],
        GatherText: (terrainType: TerrainType) => {
            let options = [
                `you spot a wild cow grazing, and are able to take it down quickly.`,
                `you shoot a cow through the eye before it even knows whats happening, it drifts away painlessly.`
            ];

            return options;
        },
        GatherTimeMultiplier: 1,
        CookTimeInSeconds: 60 * 2,
        CookedVersion: `beef`,
        CostRange: {min: 150, max: 300},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you tear into the raw meat like a wild animal. That's not safe to eat!`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(10, 15), DamageType.Poison, `Ate raw meat`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "beef",
        ContextualName: "a cut of beef",
        PluralName: "cuts of beef",
        Info: "A cut of beef. When used, it will heal you for 25HP.",
        Retrieval: [
            ObjectRetrievalType.GroceryStore,
            ObjectRetrievalType.Cookable
        ],
        CostRange: {min: 300, max: 600},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cut into the beef and start eating. It's quite good, though would be better prepared into a proper meal.`);

                await ChangePlayerHealth(client, player.Username, 25, DamageType.None);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    //Goose
    //Duck
    //Beef

    //Flour
    //Cocoa
    //Sage
    //Thyme
    //Rosemary
    //Tomatos

    //PIZZZA!!!
    //Craftable Food
    {
        ObjectName: "grilled cheese",
        ContextualName: "a grilled cheese",
        PluralName: "grilled cheese",
        Info: "Yummy! Grilled cheese is good for the soul. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe:
            {
                Recipe: [
                    {
                        Resource: "bread",
                        Amount: 2
                    },
                    {
                        Resource: "cheese",
                        Amount: 2
                    },
                    {
                        Resource: "butter",
                        Amount: 1
                    },
                ]
            },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a delicious grilled cheese!`);
                await ChangePlayerHealth(client, player.Username, 15, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "pepperoni",
        ContextualName: "a pepperoni",
        PluralName: "pepperonis",
        Info: "A nice little pepperoni. When used, it will heal you for 5HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable,
            ObjectRetrievalType.GroceryStore
        ],
        CraftingRecipe: {
            ResultAmount: {min: 5, max: 10},
            Recipe: [
                {
                    Resource: "sausage",
                    Amount: 1
                },
                {
                    Resource: "salt",
                    Amount: 1
                },
            ]
        },
        CostRange: {min: 2, max: 5},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a nice little pepperoni!`);
                await ChangePlayerHealth(client, player.Username, 5, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "dough",
        ContextualName: "a ball of dough",
        PluralName: "balls of dough",
        Info: "A ball of dough.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "flour",
                    Amount: 2
                },
                {
                    Resource: "water",
                    Amount: 2
                },
                {
                    Resource: "salt",
                    Amount: 3
                },
            ]
        },
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, wow, I love dough! So cool!!!`);

                return false;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "apple pie",
        ContextualName: "an apple pie",
        PluralName: "apple pies",
        Info: "Yummy! Apple pie is good for the soul. When used, it will heal you for 25HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "dough",
                    Amount: 2
                },
                {
                    Resource: "apple",
                    Amount: 2
                },
                {
                    Resource: "sugar",
                    Amount: 1
                },
                {
                    Resource: "egg",
                    Amount: 1
                },
                {
                    Resource: "salt",
                    Amount: 1
                },
            ]
        },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a delicious apple pie!`);
                await ChangePlayerHealth(client, player.Username, 25, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cookie",
        ContextualName: "a cookie",
        PluralName: "cookies",
        Info: "Yummy! Who doesn't love cookies?. When used, it will heal you for 15HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "dough",
                    Amount: 1
                },
                {
                    Resource: "egg",
                    Amount: 1
                },
                {
                    Resource: "salt",
                    Amount: 1
                },
                {
                    Resource: "sugar",
                    Amount: 1
                },
            ]
        },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a delicious cookie!`);
                await ChangePlayerHealth(client, player.Username, 15, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "chocolate chip cookie",
        ContextualName: "a chocolate chip cookie",
        PluralName: "chocolate chip cookies",
        Info: "Yummy! Chocolate chip cookies are better anyway. When used, it will heal you for 20HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "dough",
                    Amount: 1
                },
                {
                    Resource: "egg",
                    Amount: 1
                },
                {
                    Resource: "salt",
                    Amount: 1
                },
                {
                    Resource: "sugar",
                    Amount: 1
                },
                {
                    Resource: "cocoa",
                    Amount: 1
                },
            ]
        },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you eat a delicious chocolate chip cookie!`);
                await ChangePlayerHealth(client, player.Username, 20, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "chocolate milk",
        ContextualName: "a glass of chocolate milk",
        PluralName: "glasses of chocolate milk",
        Info: "Yummy! I love chocolate milk. When used, it will heal you for 10HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "milk",
                    Amount: 2
                },
                {
                    Resource: "cocoa",
                    Amount: 1
                },
            ]
        },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you drink down a cool glass of chocolate milk!`);
                await ChangePlayerHealth(client, player.Username, 10, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "chocolate",
        ContextualName: "a chocolate bar",
        PluralName: "chocolate bars",
        Info: "A tasty looking chocolate bar. When used, it will heal you for 5HP.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "milk",
                    Amount: 1
                },
                {
                    Resource: "cocoa",
                    Amount: 2
                },
            ]
        },
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you munch down a chocolate bar!`);
                await ChangePlayerHealth(client, player.Username, 5, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw cheese pizza",
        ContextualName: "a raw cheese pizza",
        PluralName: "raw cheese pizzas",
        Info: "A big uncooked cheese pizza! You need to !bake it to get a full pizza. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "dough",
                    Amount: 4
                },
                {
                    Resource: "tomato",
                    Amount: 2
                },
                {
                    Resource: "cheese",
                    Amount: 2
                },
            ]
        },
        CookedVersion: `cheese pizza`,
        CookTimeInSeconds: 60 * 3,
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you're too excited by the pizza to wait! You start eating it, but it's all raw and you get sick.`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(20, 35), DamageType.Poison, `Ate raw pizza`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);


                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "cheese pizza",
        ContextualName: "a cheese pizza",
        PluralName: "cheese pizzas",
        Info: "A big cheese pizza! Perfectly cooked, and ready to eat. When used, it will heal you for 40HP.",
        Retrieval: [
            ObjectRetrievalType.Cookable
        ],
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you consume an ENTIRE CHEESE PIZZA!`);
                await ChangePlayerHealth(client, player.Username, 40, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "raw pepperoni pizza",
        ContextualName: "a raw pepperoni pizza",
        PluralName: "raw pepperoni pizzas",
        Info: "A big uncooked pepperoni pizza! You need to !bake it to get a full pizza. Must be cooked to be consumed safely.",
        Retrieval: [
            ObjectRetrievalType.Craftable
        ],
        CraftingRecipe: {
            Recipe: [
                {
                    Resource: "dough",
                    Amount: 4
                },
                {
                    Resource: "tomato",
                    Amount: 2
                },
                {
                    Resource: "cheese",
                    Amount: 2
                },
                {
                    Resource: "pepperoni",
                    Amount: 5
                },
            ]
        },
        CookTimeInSeconds: 60 * 3.5,
        CookedVersion: 'pepperoni pizza',
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you're too excited by the pizza to wait! You start eating it, but it's all raw and you get sick.`);

                await ChangePlayerHealth(client, player.Username, -GetRandomIntI(20, 35), DamageType.Poison, `Ate raw pizza`);

                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "pepperoni pizza",
        ContextualName: "a pepperoni pizza",
        PluralName: "pepperoni pizzas",
        Info: "A big pepperoni pizza! Perfectly cooked, and ready to eat. When used, it will heal you for 70HP.",
        Retrieval: [
            ObjectRetrievalType.Cookable
        ],
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you consume an ENTIRE PEPPERONI PIZZA!`);
                await ChangePlayerHealth(client, player.Username, 70, DamageType.None)

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    //Eggnog

    //Events
    {
        ObjectName: "present",
        ContextualName: "a present",
        PluralName: "presents",
        Alias: [],
        Info: "A present! Gave you been naughty or nice? Open it to find out! (Ex. !use present)",
        Tier: ObjectTier.Mid,
        IconRep: IconType.Present,
        Retrieval: [
            ObjectRetrievalType.RandomReward
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                let nice = GetRandomIntI(1, 5) >= 3;
                let txt = `@${player.Username}, Santa has deemed you... `;
                if (nice) {
                    txt += `NICE! As you open your present, you find `;
                    switch (GetRandomIntI(1, 4)) {
                        case 1:
                        case 2:
                            let obj = await GivePlayerRandomObject(client, player.Username, ObjectRetrievalType.RandomReward);
                            txt += obj.ContextualName;
                            break;
                        case 3:
                            let expToGet = Math.max(30, GetRandomIntI(player.CurrentExpNeeded * 0.1, player.CurrentExpNeeded * 0.3));
                            await GiveExp(client, player.Username, expToGet);
                            txt += `${expToGet} EXP!`;
                            break;
                        case 4:
                            let randomStatusEffect = GetRandomItem([
                                StatusEffect.AllResistance,
                                StatusEffect.Drunk,
                                StatusEffect.IncreaseACBy3,
                                StatusEffect.DoubleExp,
                                StatusEffect.DoubleDamage
                            ])!;
                            AddStatusEffectToPlayer(player.Username, randomStatusEffect, 60 * 5);
                            switch (randomStatusEffect) {
                                case StatusEffect.AllResistance:
                                    txt += `a magic spell that gives you resistance to all damage for 5 minutes`;
                                    break;
                                case StatusEffect.Drunk:
                                    txt += `BOOZE! You get drunk for 5 minutes`;
                                    break;
                                case StatusEffect.IncreaseACBy3:
                                    txt += `a magic spell that gives you +3 armor for 5 minutes`;
                                    break;
                                case StatusEffect.DoubleExp:
                                    txt += `a magic spell that gives you double EXP for 5 minutes`;
                                    break;
                                case StatusEffect.DoubleDamage:
                                    txt += `a magic spell that gives you double damage for 5 minutes`;
                                    break;
                            }
                            break;
                    }

                    let playerSession = LoadPlayerSession(player.Username);
                    if (!playerSession.SeenChristmasMessage) {
                        playerSession.SeenChristmasMessage = true;

                        switch (player.Username.toLowerCase()) {
                            case `one_1egged_duck`:
                                txt += `. Additionally you find a letter, it says: "Duck! I appreciate you, even when you constantly make fun of me. I hope you know that I do enjoy your presence in streams. Even if it's just to cook."`
                                break;
                            case `leva_p`:
                                txt += `. Additionally you find a letter, it says: "Leva! You're one of my oldest viewers, I appreciate with you have the time to hang out, chat, or whatever else. I'm always happy to see you in chat."`;
                                break;
                            case `anonym0us3_otaku`:
                                txt += `. Additionally you find a letter, it says: "Otaku! You're always great to have in streams, I hope you're doing well, and appreciate you. Even when it's just to bully me in Crowd Control."`;
                                break;
                            case `findingfocusdev`:
                                txt += `. Additionally you find a letter, it says: "Focus! I don't see you much anymore, but it's always nice to see you when you pop in."`;
                                break;
                            case `perplexingmaurelle`:
                                txt += `. Additionally you find a letter, it says: "You're my real life friend! And I mean that!"`;
                                break;
                            case `sakimcgee`:
                                txt += `. Additionally you find a letter, it says: "Love you, asshole"`;
                                break;
                            case `mic00f_the_protogen`:
                                txt += `. Additionally you find a letter, it says: "Mic! You've been in my streams near-constantly lately, and I appreciate you. You have a lot of ideas and suggestions, and I hope you know I value the thoughts and ideas, even if I don't always have the energy to act on them immediately. Thanks for being around!"`;
                                break;
                            case `i_am_linda_`:
                                txt += `. Additionally you find a letter, it says: "Linda! I only see you occasionally, but it's always a nice surprise to see you in a stream."`;
                                break;
                            case `elliejoypanic`:
                                txt += `. Additionally you find a letter, it says: "Ellie! Wow! Thanks for being here, and being one of the reasons I decided to start streaming again at all!"`;
                                break;
                            case `fatelsunset5`:
                                txt += `. Additionally you find a letter, it says: "Fatel! I see you only occasionally, but it's always nice when you come in."`;
                                break;
                            case `chillgreenbean`:
                                txt += `. Additionally you find a letter, it says: "Greenbean!!! You hung out with me for a long time in some very chill streams, especially the Hollow Knight ones. I appreciate you tons."`;
                                break;
                            case `notbella`:
                                txt += `. Additionally you find a letter, it says: "Bella! Omg hi. I appreciate you as a friend, and have enjoyed playing D&D with you. Plus, I value you listened to me yap about Youtube and growth stuff."`;
                                break;
                            case `livinglifewithserenity`:
                                txt += `. Additionally you find a letter, it says: "Serenity! You're cool! You're rad! Thanks for being here."`;
                                break;
                            case `gamerjoecoffee`:
                                txt += `. Additionally you find a letter, it says: "Joe! Thanks for hanging out, I enjoy being in your streams when I can!"`;
                                break;
                            case `texas_machinist`:
                                txt += `. Additionally you find a letter, it says: "Texas! Thanks for popping into my streams! You're a recent addition, but a valued one. You come by often, and that is remembered."`;
                                break;
                            case `pizza_zah_hutt`:
                                txt += `. Additionally you find a letter, it says: "Pizzzzzzza! So glad I popped into your stream a while ago, you have a consistent uplifting energy. Thanks for being around, not to mention playing and enjoying my game so much!"`;
                                break;
                            case `kilian_original`:
                                txt += `. Additionally you find a letter, it says: "Kilian! Thanks for murdering me (in Crowd Control) every time you join my stream."`;
                                break;
                            case `thelindenbookie`:
                                txt += `. Additionally you find a letter, it says: "Bookie! You're a recent addition to streams, but you've been so nice! You're consistently around and active, and it's been so refreshing. Thanks for being here!"`;
                                break;
                            case `wolfythelurker`:
                                txt += `. Additionally you find a letter, it says: "Wolfy! I appreciate you lurking, and Crowd Controlling my ass. You've been great to have around."`;
                                break;
                            case `tgg_rock`:
                                txt += `. Additionally you find a letter, it says: "Rock! You rock! Thanks for being around, you're a joy to have around."`;
                                break;
                            case `justbearsgames`:
                                txt += `. Additionally you find a letter, it says: "Girllll, you already know you're one of my best friends in the world, thanks for existing and I hope to come visit you in the new year."`;
                                break;
                            case `berzerk404`:
                                txt += `. Additionally you find a letter, it says: "Bezerk! Thanks for being around, contributing ideas, and all the other things. You've been lovely to have around."`;
                                break;
                            case `gofurbroke69`:
                                txt += `. Additionally you find a letter, it says: "Ayyy! Thanks for being here Gofurbroke. I appreciate you! And I'm amazed how much you enjoy my game. Thanks!"`;
                                break;
                            case `kgu111`:
                                txt += `. Additionally you find a letter, it says: "KGU! I've only recently started watching you, but it's been great to hang out. Thanks for hanging out :)"`;
                                break;
                            default:
                                txt += `. Additionally, you find a generic Hallmark christmas card, it says "${GetRandomItem([
                                    `Merry Christmas and a Happy New Year!`,
                                    `Seasons Greetings!`,
                                    `Warmest wishes!`,
                                    `Wow, you're so cool`,
                                    `You are totally rad`
                                ])}"`
                                break;
                        }

                        SavePlayerSession(player.Username, playerSession);
                    }
                } else {
                    txt += `NAUGHTY! As you open your present, you find `;
                    switch (GetRandomIntI(1, 3)) {
                        case 1:
                        case 2:
                            await GivePlayerObject(client, player.Username, "coal");
                            txt += "a big lump of COAL";
                            break;
                        case 3:
                            let randomStatusEffect = GetRandomItem([
                                StatusEffect.AllVulnerability,
                                StatusEffect.Poisoned
                            ])!;
                            AddStatusEffectToPlayer(player.Username, randomStatusEffect, 60 * 5);
                            switch (randomStatusEffect) {
                                case StatusEffect.AllVulnerability:
                                    txt += `a magic spell that makes you vulnerable to all damage for 5 minutes`;
                                    break;
                                case StatusEffect.Poisoned:
                                    txt += `some Santa magic that poisons you for 5 minutes`;
                                    break;
                            }
                            break;
                    }
                }

                await client.say(process.env.CHANNEL!, txt);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "coal",
        ContextualName: "a chunk of coal",
        PluralName: "coal chunks",
        Alias: [],
        Info: "IT'S COAL! Wow, guess you've been naughty.",
        Retrieval: [],
        Tier: ObjectTier.Low,
        IconRep: IconType.BottleBlue,
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} did you just eat coal?? Serves you right for being naughty. Well, you've been poisoned for 5 minutes.`);
                AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

                return true;
            }
        },
        Consumable: true,
        Rarity: 0
    },
    {
        ObjectName: "candy",
        Alias: [],
        ContextualName: "a piece of candy",
        PluralName: "candies",
        Info: "Happy Halloween! Some lovely candy, let's hope its the good stuff. (Ex. !use candy)",
        Tier: ObjectTier.Low,
        IconRep: IconType.Candy,
        Retrieval: [
            ObjectRetrievalType.RandomReward
        ],
        ThrownDamage: {min: -9, max: -5},
        UseAlias: ["eat"],
        UseAction: {
            "use": async (client, player, afterText) => {
                let candyType = [
                    {
                        candy: `a mini chocolate bar`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a gummy eyeball`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `some candy corn`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a full-sized chocolate bar`,
                        healthChange: GetRandomIntI(15, 50)
                    },
                    {
                        candy: `a lollipop`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a caramel`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a jawbreaker`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `an apple... BOO!`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a sour gummy worm`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a piece of licorice`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a peanut butter cup`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a bubble gum ball`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a chocolate coin`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a strawberry hard candy`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a mint`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a new toothbrush... ugh`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a granola bar... who wanted this?`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                    {
                        candy: `a carrot... why??`,
                        healthChange: GetRandomIntI(5, 10)
                    },
                ];

                let randomCandy = GetRandomItem(candyType);

                await client.say(process.env.CHANNEL!, `@${player.Username} you open your candy and find it's... ${randomCandy?.candy}`);
                await ChangePlayerHealth(client, player.Username, randomCandy!.healthChange, DamageType.Psychic, "Bad candy");


                return true;
            }
        },
        Consumable: true,
        Rarity: 0 //0 rarity, no candy when its not halloween
    },


    //Equippable
    {
        ObjectName: "pure nail",
        ContextualName: "a pure nail",
        PluralName: "pure nails",
        Info: "The pure nail from Hollow Knight. An incredible weapon that does 20 - 50 more damage with rogue or warrior attacks. Has a durability, and will break after several uses. Equip it using (!equip pure nail)",
        CostRange: {min: 200, max: 500},
        Tier: ObjectTier.High,
        IconRep: IconType.PureNail,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you admire the beauty of the pure nail. You can also equip it with (!equip pure nail)`);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Rogue, ClassType.Warrior],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(20, 50),
                damageType: GetRandomItem([DamageType.Piercing, DamageType.Slashing])!
            };
        },
        Durability: {min: 5, max: 10},
        Rarity: 4
    },
    {
        ObjectName: "diamond axe",
        ContextualName: "a diamond axe",
        PluralName: "diamond axes",
        Info: "The diamond axe from Minecraft, it does 5 - 15 more damage for warrior attacks. Has a durability, and will break after several uses. Equip it using (!equip diamond axe)",
        CostRange: {min: 200, max: 500},
        Tier: ObjectTier.Mid,
        IconRep: IconType.DiamondAxe,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you chop down a nearby tree in a single swing. A distant creeper says "Aw man". You can also equip it with (!equip diamond axe)`);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Warrior],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(5, 15),
                damageType: GetRandomItem([DamageType.Bludgeoning, DamageType.Slashing])!
            };
        },
        Durability: {min: 10, max: 15},
        Rarity: 7
    },
    {
        ObjectName: "wabbajack",
        ContextualName: "a wabbajack",
        PluralName: "wabbajacks",
        Info: "The Wabbajack from Skyrim, does 10 - 20 more damage for mage attacks. Has a durability, and will break after several uses. Equip it using (!equip wabbajack)",
        CostRange: {min: 200, max: 500},
        Tier: ObjectTier.Mid,
        IconRep: IconType.Wabbajack,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you've started the Mind of Madness questline. Uh oh. You can also equip it with (!equip wabbajack)`);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Mage],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(10, 20),
                damageType: GetRandomItem([DamageType.Fire, DamageType.Cold, DamageType.Poison, DamageType.Psychic])!
            };
        },
        Durability: {min: 10, max: 15},
        Rarity: 7
    },
    {
        ObjectName: "obsidian dagger",
        ContextualName: "an obsidian dagger",
        PluralName: "obsidian daggers",
        Info: "An obsidian dagger from Runescape, it does 10 - 20 more damage for rogue attacks. Has a durability, and will break after several uses. Equip it using (!equip obsidian dagger)",
        CostRange: {min: 200, max: 500},
        Tier: ObjectTier.Mid,
        IconRep: IconType.ObsidianDagger,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you look into the obsidian. Oooo, shiny. You can also equip it with (!equip obsidian dagger)`);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Rogue],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(10, 20),
                damageType: DamageType.Piercing
            };
        },
        Durability: {min: 10, max: 15},
        Rarity: 7
    },
    {
        ObjectName: "repair hammer",
        ContextualName: "a repair hammer",
        PluralName: "repair hammers",
        Info: "Allows you to increase the durability of an object you have equipped! Ex. (!use repair hammer)",
        CostRange: {min: 100, max: 200},
        Tier: ObjectTier.Mid,
        IconRep: IconType.Hammer,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                if (player.EquippedObject !== undefined) {
                    let durabilityIncrease = GetRandomIntI(3, 6);

                    player.EquippedObject!.RemainingDurability += durabilityIncrease;
                    await client.say(process.env.CHANNEL!, `@${player.Username} the durability of your ${player.EquippedObject.ObjectName} has increased by ${durabilityIncrease}.`);
                    return true;
                } else {
                    await client.say(process.env.CHANNEL!, `@${player.Username} you must have an object equipped to repair it! Only some objects have durability, use !info [item] to check.`);
                    return false;
                }
            }
        },
        Consumable: true,
        Rarity: 5
    },
    {
        ObjectName: "pool noodle",
        ContextualName: "a pool noodle",
        PluralName: "pool noodles",
        Info: "A pool noodle, from a pool. Great for some fun in the sun. Does 3 - 8 more damage on all attacks. Has a durability, and will break after several uses. Equip it using (!equip pool noodle)",
        CostRange: {min: 100, max: 350},
        Tier: ObjectTier.Mid,
        IconRep: IconType.PoolNoodle,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username} you swing it around. If only there was a pool nearby. You can also equip it with (!equip pool noodle)`);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Warrior, ClassType.Rogue, ClassType.Mage, ClassType.Cleric],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(3, 8),
                damageType: DamageType.Psychic
            };
        },
        Durability: {min: 15, max: 20},
        Rarity: 10
    },
    {
        ObjectName: "power helmet",
        ContextualName: "a power helmet",
        PluralName: "power helmets",
        Info: "A power armor helmet! It'll help protect your face a bit more, but leaves you prone to overheating. Gives you resistance to cold and bludgeoning, but makes your vulnerable to fire. Equip it using (!equip power helmet)",
        CostRange: {min: 100, max: 350},
        Tier: ObjectTier.Mid,
        IconRep: IconType.PowerHelmet,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                let text = GetRandomItem([
                    `@${player.Username} you take the helmet and wipe the insides a bit. It's all sweaty!`,
                    `@${player.Username} you look through the eyes... it's all tinted green, for some reason.`,
                    `@${player.Username} this makes your head look too big for your body.`,
                ])!;

                text += ` You can also equip it with (!equip power helmet)`;

                await client.say(process.env.CHANNEL!, text);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Warrior, ClassType.Rogue, ClassType.Mage],
        ObjectOnAttackedAction: async (client, player) => {
            return {
                resistances: [DamageType.Cold, DamageType.Bludgeoning],
                vulnerabilities: [DamageType.Fire]
            };
        },
        Durability: {min: 5, max: 15},
        Rarity: 6
    },
    {
        ObjectName: "cardboard box",
        ContextualName: "a cardboard box",
        PluralName: "cardboard boxes",
        Info: "A cardboard box! Wow! It's... a box. Your mind feels safer. Increases your armor by 2 and gives you resistance to psychic damage. Equip it using (!equip cardboard box)",
        CostRange: {min: 50, max: 150},
        Tier: ObjectTier.Low,
        IconRep: IconType.CardboardBox,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                if (GetRandomIntI(1, 3) != 1) {
                    let otherUser = LoadRandomPlayerSession([player.Username], true)!;

                    //Damage calc
                    let otherUserPlayer = LoadPlayer(otherUser.NameAsDisplayed);
                    let maxHealth = CalculateMaxHealth(otherUserPlayer);
                    let damage = Math.max(1, GetRandomIntI(maxHealth * 0.05, maxHealth * 0.2));

                    await client.say(process.env.CHANNEL!, `@${player.Username} you hide in your box until @${otherUserPlayer.Username} comes nearby and you JUMP OUT and SCARE them! What a funny prank.`);
                    await ChangePlayerHealth(client, otherUser.NameAsDisplayed, -damage, DamageType.Psychic);
                } else {
                    await client.say(process.env.CHANNEL!, GetRandomItem([
                        `@${player.Username} you hide in your box, safe, alone, protected. You can also equip it with (!equip cardboard box)`,
                        `@${player.Username} you build a box fort. Wow, look how beautiful it is. You can also equip it with (!equip cardboard box)`,
                    ])!);

                    return false;
                }
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Warrior, ClassType.Rogue, ClassType.Mage],
        ObjectOnAttackedAction: async (client, player) => {
            return {
                resistances: [DamageType.Psychic],
                armorAdjustment: 2
            };
        },
        Durability: {min: 5, max: 15},
        Rarity: 6
    },
    {
        ObjectName: "duck hunt gun",
        ContextualName: "a duck hunt gun",
        PluralName: "duck hunt guns",
        Info: "A gun from the game Duck Hunt. It's exceptional at shooting ducks, but works okay on other things. Does 10 - 25 more damage for rogue attacks. Equip it using (!equip duck hunt gun)",
        CostRange: {min: 300, max: 600},
        Tier: ObjectTier.High,
        IconRep: IconType.DuckHuntGun,
        Retrieval: [
            ObjectRetrievalType.RandomReward,
            ObjectRetrievalType.TravelingSalesman
        ],
        UseAction: {
            "use": async (client, player, afterText) => {
                let text = GetRandomItem([
                    `@${player.Username} you aim for the nearest duck, but none are in sight`,
                    `@${player.Username} BANG! You got one.`,
                    `@${player.Username} BANG BANG BANG... oops. GAME OVER!`
                ])!;

                text += ` You can also equip it with (!equip duck hunt gun)`;
                await client.say(process.env.CHANNEL!, text);

                return false;
            }
        },
        Consumable: false,
        Equippable: true,
        ClassRestrictions: [ClassType.Rogue],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(10, 25),
                damageType: GetRandomItem([DamageType.Piercing, DamageType.Fire])!
            };
        },
        Durability: {min: 10, max: 15},
        Rarity: 7
    },

    //Special shit
    {
        ObjectName: "death rock",
        ContextualName: "a death rock",
        PluralName: "death rocks",
        Info: "A sacrificial death rock, said to be conjured by Gazicmalzen himself.",
        Retrieval: [],
        UseAction: {
            "use": async (client, player, afterText) => {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you smash your head into the death rock.`);
                await ChangePlayerHealth(client, player.Username, -99999999, DamageType.Bludgeoning);

                //Remove a death, so you cant use this to cheat the leaderboard.
                let resetPlayer = LoadPlayer(player.Username);
                resetPlayer.Deaths--;
                SavePlayer(resetPlayer);

                return false;
            }
        },
        Consumable: false,
        Rarity: 0
    },
]

export function DoesPlayerHaveObject(displayName: string, object: string) {
    let player = LoadPlayer(displayName);

    return player.Inventory.includes(object);
}
