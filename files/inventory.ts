import {
    CalculateExpNeeded,
    CalculateMaxHealth,
    ChangePlayerHealth, GetRandomRewardableObjectFromPlayer,
    GiveExp, GivePlayerObject,
    GivePlayerRandomObject,
    LoadPlayer,
    Player, SavePlayer, TryLoadPlayer
} from "./utils/playerGameUtils";
import {Client} from "tmi.js";
import {Broadcast} from "./bot";
import {GetRandomIntI, GetRandomNumber, IconType} from "./utils/utils";
import {AddToActionQueue} from "./actionqueue";
import {GetAllPlayerSessions, LoadPlayerSession, LoadRandomPlayerSession} from "./utils/playerSessionUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./utils/audioUtils";
import {BanUser, CreatePoll} from "./utils/twitchUtils";
import {IsDragonActive} from "./globals";
import {DoDamage, LoadDragonData} from "./utils/dragonUtils";

export enum ObjectTier { Low, Mid, High }

export interface InventoryObject {
    ObjectName: string;
    ContextualName: string;
    PluralName: string;
    Info: string;
    Tier?: ObjectTier;
    IconRep?: IconType;
    ThrownDamage?: { min: number, max: number },
    UseAction: (client: Client, player: Player, afterText: string) => Promise<boolean>;
    Consumable: boolean;
    Rewardable: boolean;
    Rarity: number;
}

export const AllInventoryObjects: Array<InventoryObject> = [
    {
        ObjectName: "dagger",
        ContextualName: "a dagger",
        PluralName: "daggers",
        Info: "A basic rogue weapon",
        ThrownDamage: { min: 3, max: 12 },
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you twirl your dagger in your hand.`);

            return true;
        },
        Consumable: false,
        Rewardable: false,
        Rarity: 10
    },
    {
        ObjectName: "sword",
        ContextualName: "a sword",
        PluralName: "swords",
        Info: "A basic warrior weapon",
        ThrownDamage: { min: 3, max: 8 },
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you swing through the air a few times, practicing your skills.`);

            return true;
        },
        Consumable: false,
        Rewardable: false,
        Rarity: 10
    },
    {
        ObjectName: "hammer",
        ContextualName: "a hammer",
        PluralName: "hammers",
        Info: "A basic warrior weapon",
        ThrownDamage: { min: 5, max: 8 },
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you smash a nearby rock. Nice.`);

            return true;
        },
        Consumable: false,
        Rewardable: false,
        Rarity: 10
    },
    {
        ObjectName: "wand",
        ContextualName: "a wand",
        PluralName: "wands",
        Info: "A basic mage weapon",
        ThrownDamage: { min: 1, max: 2 },
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you make some sparkles appear.`);

            return true;
        },
        Consumable: false,
        Rewardable: false,
        Rarity: 10
    },
    {
        ObjectName: "healing potion",
        ContextualName: "a healing potion",
        PluralName: "healing potions",
        Info: "Heals whatever it touches!",
        Tier: ObjectTier.Low,
        IconRep: IconType.Bottle,
        ThrownDamage: { min: -40, max: -20 },
        UseAction: async (client, player, afterText) => {
            await ChangePlayerHealth(client, player.Username, GetRandomIntI(20, 40));

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "cheese",
        ContextualName: "a chunk of cheese",
        PluralName: "cheese chunks",
        Info: "Cheese! Eat it, smell it, yum yum yum. Ex. !use cheese",
        Tier: ObjectTier.Low,
        IconRep: IconType.CheeseWheel,
        ThrownDamage: { min: -5, max: -2 },
        UseAction: async (client, player, afterText) => {
            let spoiled = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username} yum! Delicious cheese, you take a bite... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
            await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-2, -8) : GetRandomIntI(5, 15))

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "banana bunch",
        ContextualName: "a bunch of bananas",
        PluralName: "bananas",
        Info: "Bananas! Made famous by monkeys. Ex. !use banana bunch",
        Tier: ObjectTier.Low,
        IconRep: IconType.Bananas,
        ThrownDamage: { min: -9, max: -5 },
        UseAction: async (client, player, afterText) => {
            let spoiled = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username}, bananas! You eat a banana from the bunch... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
            await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-5, -15) : GetRandomIntI(10, 25))

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "beer",
        ContextualName: "beer",
        PluralName: "beer",
        Info: "It's beer, it'll make you feel good, but at what cost?",
        Tier: ObjectTier.Low,
        IconRep: IconType.Beer,
        ThrownDamage: { min: -9, max: -5 },
        UseAction: async (client, player, afterText) => {
            //todo - make beer more interesting
            let tooDrunk = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username}, you chug down a pint of beer. Ah, how wonderful. ${tooDrunk ? `You're a real messy drunk though, huh? You end up passing out, and hitting your head.` : `Refreshing and delicious.`}`);
            await ChangePlayerHealth(client, player.Username, tooDrunk ? GetRandomIntI(-5, -15) : GetRandomIntI(10, 25))

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "tinderbox",
        ContextualName: "a tinderbox",
        PluralName: "tinderboxes",
        Info: "Let's you catch things on fire when used! Ex. !use tinderbox",
        Tier: ObjectTier.Mid,
        IconRep: IconType.Box,
        ThrownDamage: { min: 2, max: 8 },
        UseAction: async (client, player, afterText) => {
            if(player.PassiveModeEnabled) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you can't attack others while in passive mode. Use !togglepassive to disable it.`);
                return false;
            }

            let onPurpose = false;
            let otherUser: PlayerSessionData;
            if(afterText.includes("@")) {
                otherUser = LoadPlayerSession(afterText.replace("@", ""));
                onPurpose = true;
            }
            else {
                otherUser = LoadRandomPlayerSession([player.Username], true)!;
            }

            let playerGameData = LoadPlayer(otherUser.NameAsDisplayed);
            if(playerGameData.PassiveModeEnabled || playerGameData.Level == 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username} you can't attack @${otherUser.NameAsDisplayed}, they have passive mode enabled.`);
                return false;
            }

            await client.say(process.env.CHANNEL!, `@${player.Username} you strike a flame and${onPurpose ? `` : ` accidentally`} catch @${otherUser.NameAsDisplayed} on fire!`);
            await ChangePlayerHealth(client, otherUser.NameAsDisplayed, GetRandomIntI(-2, -8));

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "scroll of truth",
        ContextualName: "a scroll of truth",
        PluralName: "several scrolls of truth",
        Tier: ObjectTier.High,
        IconRep: IconType.Pencil,
        Info: "Allows you to proclaim a truth to the chat, then chat will vote on if they agree. Ex. !use scroll of truth Cory is the best",
        UseAction: async (client, player, afterText) => {
            if(afterText.trim().length > 3) {
                AddToActionQueue(() => {
                    let s = "";
                    if(player.Username[player.Username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${player.Username}${s} Proclamation`, message: afterText[0].toUpperCase() + afterText.slice(1), icon: (IconType.Scroll) }));

                    PlayTextToSpeech(`${player.Username} has proclaimed`, "en-US-BrianNeural", () => {
                        PlayTextToSpeech(afterText, TryGetPlayerVoice(player), () => {
                            PlayTextToSpeech(`Chat, do you agree? Starting a poll.`, "en-US-BrianNeural", () => {
                                CreatePoll({
                                    title: `Do you agree with ${player.Username}?`,
                                    choices: [
                                        { title: "Yes" },
                                        { title: "No" },
                                    ]
                                }, 30, false, (winner) => {
                                    let chatAgreed = winner === "Yes";
                                    PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} with ${player.Username} that "${afterText}.`, "en-US-BrianNeural", async () => {
                                        if(chatAgreed) {
                                            PlaySound("cheering");
                                            GivePlayerRandomObject(client, player.Username);
                                            await GiveExp(client, player.Username, 10);
                                        }
                                        else {
                                            PlaySound("booing", "wav", () => {
                                                PlayTextToSpeech("They have been temporarily banned for 5 minutes.");
                                            });
                                            await BanUser(client, player.Username, 5 * 60, "Chat disagreed with them");
                                        }
                                    })
                                });
                            })
                        })
                    })
                }, 60)
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you must make a better proclamation of truth. Ex. !use scroll of truth Cory is the best`);
                return false;
            }

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "scroll of challenge",
        ContextualName: "a scroll of challenge",
        PluralName: "several scrolls of challenge",
        IconRep: IconType.Scroll,
        Info: "Allows you to issue a challenge to Cory that he will do within the next 1 minute. He can veto a challenge, so keep it reasonable. Ex. !use scroll of challenge take off your glasses",
        Tier: ObjectTier.Mid,
        UseAction: async (client, player, afterText) => {
            if(afterText.trim().length > 3) {
                AddToActionQueue(() => {
                    let s = "";
                    if(player.Username[player.Username.length - 1] === 's') {
                        s = "'";
                    }
                    else {
                        s = "'s";
                    }
                    Broadcast(JSON.stringify({ type: 'showDisplay', title: `${player.Username}${s} Challenge`, message: afterText[0].toUpperCase() + afterText.slice(1), icon: (IconType.Scroll) }));

                    PlayTextToSpeech(`${player.Username} has issued a challenge to Cory to `, "en-US-BrianNeural", () => {
                        PlayTextToSpeech(afterText, TryGetPlayerVoice(player), () => {
                            PlayTextToSpeech(`For the next minute`, "en-US-BrianNeural", () => {
                                setTimeout(() => {
                                    PlayTextToSpeech(`Cory's challenge is complete. Chat you may now judge how well Cory accomplished the challenge.`, "en-US-BrianNeural")
                                    CreatePoll({
                                        title: `Did Cory complete the challenge?`,
                                        choices: [
                                            { title: "Yes" },
                                            { title: "No" },
                                        ]
                                    }, 30, false, (winner) => {
                                        let chatAgreed = winner === "Yes";
                                        PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} that Cory completed the challenge to "${afterText}.`, "en-US-BrianNeural", async () => {
                                            if(chatAgreed) {
                                                PlaySound("cheering");
                                                // GivePlayerRandomObject(client, player.Username);
                                                // await GiveExp(client, player.Username, 10);
                                            }
                                            else {
                                                PlaySound("booing", "wav");
                                                // await banUser(client, player.Username, 5 * 60, "Chat disagreed with them");
                                            }
                                        })
                                    });
                                }, 1000 * 60)

                            })
                        })
                    })
                }, 140)
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you must make a better challenge. Ex. !use scroll of challenge take off your glasses`);
                return false;
            }

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 3
    },
    {
        ObjectName: "magic nuke",
        ContextualName: "a magic nuke",
        PluralName: "magic nukes",
        Info: "Let's you nuke Bytefire, though also hurts yourself and other people. Ex. !use nuke",
        Tier: ObjectTier.High,
        IconRep: IconType.Bomb,
        UseAction: async (client, player, afterText) => {
            if(player.PassiveModeEnabled) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you can't attack others while in passive mode. Use !togglepassive to disable it.`);
                return false;
            }

            if(IsDragonActive) {
                PlaySound("nuke");
                await client.say(process.env.CHANNEL!, `@${player.Username} has deployed a magic nuke!`);

                let wasBad = false;

                setTimeout(async () => {
                    if(!afterText.includes("chat")) {
                        let dragonMaxHealth = LoadDragonData().MaxHealth;
                        let damageToBytefire = GetRandomIntI(dragonMaxHealth * 0.5, dragonMaxHealth * 0.7);

                        await client.say(process.env.CHANNEL!, `Bytefire has been nuked for ${damageToBytefire} damage!`);
                        await DoDamage(client, player.Username, damageToBytefire);
                    }

                    let damageRatioToPlayer = GetRandomNumber(0.6, 0.9);
                    let damageToPlayer = Math.floor(CalculateMaxHealth(player) * damageRatioToPlayer);
                    await ChangePlayerHealth(client, player.Username, -damageToPlayer, `A nuke they fired`);

                    let playerSessionData = GetAllPlayerSessions();

                    let playersAttacked = 0;
                    for (const otherPlayer of playerSessionData) {
                        let otherPlayerGameData = LoadPlayer(otherPlayer.NameAsDisplayed.toLowerCase());

                        if(!otherPlayerGameData.PassiveModeEnabled && otherPlayerGameData.Level > 0 && otherPlayer.NameAsDisplayed.toLowerCase() !== player.Username.toLowerCase()) {
                            let otherPlayerData = LoadPlayer(otherPlayer.NameAsDisplayed);

                            let damageToOther = Math.floor(CalculateMaxHealth(otherPlayerData) * 0.2);

                            await ChangePlayerHealth(client, otherPlayerData.Username, -damageToOther, `A nuke fired by @${player.Username}`);
                            playersAttacked++;
                        }
                    }

                    if(afterText.includes("chat") && playersAttacked == 0) {
                        wasBad = true;
                    }

                }, 1000 * 5);

                if(wasBad) {
                    return false;
                }

                return true;
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cannot fire a magic nuke until Bytefire is awake.`);

                return false;
            }
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 2
    },
    {
        ObjectName: "letter",
        ContextualName: "a letter",
        PluralName: "letters",
        Info: "Allows you to send a random item you have to someone else! Ex. !use letter the7ark",
        Tier: ObjectTier.Mid,
        IconRep: IconType.Letter,
        UseAction: async (client, player, afterText) => {
            //todo - maybe allow you to specify item?
            let otherPlayer = TryLoadPlayer(afterText.trim());
            if(otherPlayer != null) {
                let randomItem = GetRandomRewardableObjectFromPlayer(player.Username, ["letter"]);

                if(randomItem != null) {
                    await client.say(process.env.CHANNEL!, `@${player.Username} is giving @${otherPlayer.Username} ${randomItem.ContextualName}!`);
                    GivePlayerObject(client, otherPlayer.Username, randomItem.ObjectName);
                    let index = player.Inventory.indexOf(randomItem.ObjectName);
                    player.Inventory.splice(index, 1);

                    SavePlayer(player);
                }
                else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have any giftable items`);
                    return false;
                }
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, I could not find that player`);
                return false;
            }


            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "crystal",
        ContextualName: "a crystal",
        PluralName: "crystals",
        Info: "Gives you enough EXP for an instant level up! Ex. !use crystal",
        Tier: ObjectTier.High,
        IconRep: IconType.Crystal,
        UseAction: async (client, player, afterText) => {
            let expNeeded = player.CurrentExpNeeded - player.CurrentExp;
            console.log(player.CurrentExp + " / " + player.CurrentExpNeeded + " : " + expNeeded);
            await client.say(process.env.CHANNEL!, `@${player.Username} has crushed a magic crystal!`);
            await GiveExp(client, player.Username, expNeeded);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 6
    },
]

export function DoesPlayerHaveObject(displayName: string, object: string) {
    let player = LoadPlayer(displayName);

    return player.Inventory.includes(object);
}
