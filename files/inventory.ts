import {
    AddStatusEffectToPlayer,
    CalculateMaxHealth,
    ChangePlayerHealth,
    GetObjectFromInputText,
    GiveCozyPoints,
    GiveExp,
    GivePlayerObject,
    GivePlayerRandomObject,
    LoadPlayer,
    SavePlayer,
    TryLoadPlayer
} from "./utils/playerGameUtils";
import {Client} from "tmi.js";
import {Broadcast} from "./bot";
import {GetRandomIntI, GetRandomItem, GetRandomNumber} from "./utils/utils";
import {AddToActionQueue} from "./actionqueue";
import {
    GetAllPlayerSessions,
    LoadPlayerSession,
    LoadRandomPlayerSession,
    SavePlayerSession
} from "./utils/playerSessionUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./utils/audioUtils";
import {BanUser, CreateTwitchPoll} from "./utils/twitchUtils";
import {IsMonsterActive} from "./globals";
import {DamageType, DoDamageToMonster, LoadMonsterData} from "./utils/monsterUtils";
import {SetSceneItemEnabled} from "./utils/obsutils";
import {AudioType} from "./streamSettings";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./utils/lightsUtils";
import {ClassType, IconType, Player, StatusEffect} from "./valueDefinitions";

export enum ObjectTier { Low, Mid, High }

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
    UseAction: (client: Client, player: Player, afterText: string) => Promise<boolean>;
    Consumable: boolean;
    Rewardable: boolean;
    ClassRestrictions?: Array<ClassType>;
    Equippable?: boolean;
    Durability?: { min: number, max: number};
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
        ObjectName: "healing amulet",
        ContextualName: "a healing amulet",
        PluralName: "healing amulets",
        Info: "A healing amulet used by clerics to heal people",
        ThrownDamage: { min: 2, max: 3 },
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you bask in the glow of the magical energy of the amulet`);

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
        Alias: ["healing", "healing potions", "health potion"],
        ContextualName: "a healing potion",
        PluralName: "healing potions",
        Info: "Heals whatever it touches!",
        CostRange: {min: 500, max: 1000 },
        Tier: ObjectTier.Low,
        IconRep: IconType.Bottle,
        ThrownDamage: { min: -40, max: -20 },
        UseAction: async (client, player, afterText) => {
            let maxHealth = CalculateMaxHealth(player);
            let heal = Math.ceil(GetRandomIntI(Math.max(maxHealth * 0.1, 10), Math.max(maxHealth * 0.2, 30)))

            await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "great healing potion",
        Alias: ["great healing", "great healing potions", "great health potion"],
        ContextualName: "a great healing potion",
        PluralName: "great healing potions",
        Info: "Heals whatever it touches!",
        CostRange: {min: 1000, max: 2000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Bottle,
        ThrownDamage: { min: -80, max: -300 },
        UseAction: async (client, player, afterText) => {
            let maxHealth = CalculateMaxHealth(player);
            let heal = Math.ceil(GetRandomIntI(Math.max(maxHealth * 0.3, 10), Math.max(maxHealth * 0.5, 30)))

            await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 8
    },
    {
        ObjectName: "legendary healing potion",
        Alias: ["legendary healing", "legendary healing potions", "legendary health potion"],
        ContextualName: "a legendary healing potion",
        PluralName: "legendary healing potions",
        Info: "Heals whatever it touches!",
        CostRange: {min: 2000, max: 4000 },
        Tier: ObjectTier.High,
        IconRep: IconType.Bottle,
        ThrownDamage: { min: -150, max: -500 },
        UseAction: async (client, player, afterText) => {
            let maxHealth = CalculateMaxHealth(player);
            let heal = Math.ceil(GetRandomIntI(Math.max(maxHealth * 0.7, 10), Math.max(maxHealth * 0.8, 30)))

            await ChangePlayerHealth(client, player.Username, heal, DamageType.None);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 4
    },
    {
        ObjectName: "cheese",
        ContextualName: "a chunk of cheese",
        PluralName: "cheese chunks",
        Info: "Cheese! Eat it, smell it, yum yum yum. Ex. !use cheese",
        CostRange: {min: 500, max: 1000 },
        Tier: ObjectTier.Low,
        IconRep: IconType.CheeseWheel,
        ThrownDamage: { min: -5, max: -2 },
        UseAction: async (client, player, afterText) => {
            let spoiled = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username} yum! Delicious cheese, you take a bite... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
            await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-2, -8) : GetRandomIntI(5, 15), DamageType.Poison)

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "banana bunch",
        Alias: ["banana", "bananas"],
        ContextualName: "a bunch of bananas",
        PluralName: "bananas",
        Info: "Bananas! Made famous by monkeys. Ex. !use banana bunch",
        CostRange: {min: 500, max: 1000 },
        Tier: ObjectTier.Low,
        IconRep: IconType.Bananas,
        ThrownDamage: { min: -9, max: -5 },
        UseAction: async (client, player, afterText) => {
            let spoiled = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username}, bananas! You eat a banana from the bunch... ${spoiled ? `UH OH! It's spoiled.` : `It's delicious!`}`);
            await ChangePlayerHealth(client, player.Username, spoiled ? GetRandomIntI(-5, -15) : GetRandomIntI(10, 25), DamageType.Poison)

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "cake",
        Alias: ["cake", "portal cake"],
        ContextualName: "a cake",
        PluralName: "cakes",
        Info: "A delicious cake! Right? Or is it a lie... Ex. !use cake",
        CostRange: {min: 500, max: 1000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.PortalCake,
        ThrownDamage: { min: 20, max: 80 },
        UseAction: async (client, player, afterText) => {
            let good = GetRandomIntI(1, 2) == 1; //50/50 chance

            let maxHealth = CalculateMaxHealth(player);
            if(good) {
                let heal = Math.ceil(GetRandomIntI(Math.max(maxHealth * 0.5, 10), Math.max(maxHealth * 0.75, 30)))

                await client.say(process.env.CHANNEL!, `@${player.Username}, the cake is as good as you imagined!`);
                await ChangePlayerHealth(client, player.Username, heal, DamageType.None);
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}... THE CAKE WAS A LIE!`);
                await ChangePlayerHealth(client, player.Username, -maxHealth, DamageType.Poison);
            }

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 7
    },
    {
        ObjectName: "beer",
        ContextualName: "beer",
        PluralName: "beer",
        Info: "It's beer, it'll make you feel good, but at what cost?",
        CostRange: {min: 400, max: 750 },
        Tier: ObjectTier.Low,
        IconRep: IconType.Beer,
        ThrownDamage: { min: -9, max: -5 },
        UseAction: async (client, player, afterText) => {
            //todo - make beer more interesting
            let tooDrunk = GetRandomIntI(1, 10) === 1;
            await client.say(process.env.CHANNEL!, `@${player.Username}, you chug down a pint of beer and become drunk for 5 minutes. Ah, how wonderful. ${tooDrunk ? `You're a real messy drunk though, huh? You end up passing out, and hitting your head.` : `Refreshing and delicious.`}`);
            await ChangePlayerHealth(client, player.Username, tooDrunk ? GetRandomIntI(-5, -15) : GetRandomIntI(10, 25), DamageType.Poison);

            AddStatusEffectToPlayer(player.Username, StatusEffect.Drunk, 60 * 5);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 13
    },
    {
        ObjectName: "tinderbox",
        Alias: ["tinderboxes"],
        ContextualName: "a tinderbox",
        PluralName: "tinderboxes",
        Info: "Let's you catch things on fire when used! Ex. !use tinderbox",
        CostRange: {min: 300, max: 600 },
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

            let doCampfire = !onPurpose && GetRandomIntI(1, 4) != 1;

            if(doCampfire) {
                let text = `@${player.Username} you've started a lovely little campfire. You, `;

                let extraPeople: Array<string> = [];
                for (let i = 0; i < 3; i++) {
                    let extraPlayer = LoadRandomPlayerSession([player.Username, ...extraPeople]);

                    extraPeople.push(extraPlayer.NameAsDisplayed);

                    text += `@${extraPlayer.NameAsDisplayed}`;
                    if(i < 2) {
                        text += `, `;
                    }
                    else {
                        text += ' and ';
                    }
                }

                let cozyPointsToGive = GetRandomIntI(1, 3);

                text += ` all get ${cozyPointsToGive} cozy point${cozyPointsToGive == 1 ? '' : 's'}!`

                GiveCozyPoints(player.Username, cozyPointsToGive);
                for (let i = 0; i < extraPeople.length; i++) {
                    GiveCozyPoints(extraPeople[i], cozyPointsToGive);
                }

                await client.say(process.env.CHANNEL!, text);

                return true;
            }

            let playerGameData = LoadPlayer(otherUser.NameAsDisplayed);
            if(playerGameData.PassiveModeEnabled || playerGameData.Level == 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username} you can't attack @${otherUser.NameAsDisplayed}, they have passive mode enabled.`);
                return false;
            }

            if(player.Username.toLowerCase() == otherUser.NameAsDisplayed.toLowerCase()) {
                await client.say(process.env.CHANNEL!, `@${player.Username} you strike a flame and catch YOURSELF ON FIRE OH GOD SOMEONE HELP THEM!`);
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username} you strike a flame and${onPurpose ? `` : ` accidentally`} catch @${otherUser.NameAsDisplayed} on fire!`);
            }

            //Damage calc
            let otherUserPlayer = LoadPlayer(otherUser.NameAsDisplayed);
            let maxHealth = CalculateMaxHealth(otherUserPlayer);
            let damage = Math.max(1, GetRandomIntI(maxHealth * 0.05, maxHealth * 0.2));

            await ChangePlayerHealth(client, otherUser.NameAsDisplayed, -damage, DamageType.Fire);

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
        Tier: ObjectTier.Mid,
        IconRep: IconType.Pencil,
        Info: "Allows you to proclaim a truth to the chat, then chat will vote on if they agree. Ex. !use scroll of truth Cory is the best",
        CostRange: {min: 400, max: 800 },
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

                    PlayTextToSpeech(`${player.Username} has proclaimed`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                        PlayTextToSpeech(afterText, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                            PlayTextToSpeech(`Chat, do you agree? Starting a poll.`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                                CreateTwitchPoll({
                                    title: `Do you agree with ${player.Username}?`,
                                    choices: [
                                        { title: "Yes" },
                                        { title: "No" },
                                    ]
                                }, 30, false, (winner) => {
                                    let chatAgreed = winner === "Yes";
                                    PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} with ${player.Username} that "${afterText}.`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                                        if(chatAgreed) {
                                            PlaySound("cheering", AudioType.GameAlerts);
                                            await GivePlayerRandomObject(client, player.Username);
                                            await GiveExp(client, player.Username, 50);
                                        }
                                        else {
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
        CostRange: {min: 500, max: 1000 },
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

                    PlayTextToSpeech(`${player.Username} has issued a challenge to Cory to `, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                        PlayTextToSpeech(afterText, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                            PlayTextToSpeech(`For the next minute`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                                setTimeout(() => {
                                    PlayTextToSpeech(`Cory's challenge is complete. Chat you may now judge how well Cory accomplished the challenge.`, AudioType.GameAlerts, "en-US-BrianNeural")
                                    CreateTwitchPoll({
                                        title: `Did Cory complete the challenge?`,
                                        choices: [
                                            { title: "Yes" },
                                            { title: "No" },
                                        ]
                                    }, 30, false, (winner) => {
                                        let chatAgreed = winner === "Yes";
                                        PlayTextToSpeech(`Chat ${chatAgreed ? `agrees` : `disagrees`} that Cory completed the challenge to "${afterText}.`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                                            if(chatAgreed) {
                                                PlaySound("cheering", AudioType.GameAlerts);
                                                // GivePlayerRandomObject(client, player.Username);
                                                // await GiveExp(client, player.Username, 10);
                                            }
                                            else {
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
        Alias: ["nuke"],
        ContextualName: "a magic nuke",
        PluralName: "magic nukes",
        Info: "Let's you nuke the current monster, though also hurts yourself and other people. Ex. !use nuke",
        CostRange: {min: 5000, max: 10000 },
        Tier: ObjectTier.High,
        IconRep: IconType.Bomb,
        UseAction: async (client, player, afterText) => {
            if(player.PassiveModeEnabled) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you can't attack others while in passive mode. Use !togglepassive to disable it.`);
                return false;
            }

            if(IsMonsterActive) {
                PlaySound("nuke", AudioType.UserGameActions);
                await client.say(process.env.CHANNEL!, `@${player.Username} has deployed a magic nuke!`);

                let wasBad = false;

                await SetLightBrightness(0);

                setTimeout(async() => {

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
                    if(!afterText.includes("chat")) {
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

                        if(!otherPlayerGameData.PassiveModeEnabled && otherPlayerGameData.Level > 0 && otherPlayer.NameAsDisplayed.toLowerCase() !== player.Username.toLowerCase()) {
                            let otherPlayerData = LoadPlayer(otherPlayer.NameAsDisplayed);

                            let damageToOther = Math.floor(CalculateMaxHealth(otherPlayerData) * 0.2);

                            await ChangePlayerHealth(client, otherPlayerData.Username, -damageToOther, DamageType.Fire, `A nuke fired by @${player.Username}`);
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
                await client.say(process.env.CHANNEL!, `@${player.Username}, you cannot fire a magic nuke until a monster is out.`);

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
        Info: "Allows you to send an item you have to someone else! Ex. !use letter the7ark crystal",
        CostRange: {min: 1000, max: 3000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Letter,
        UseAction: async (client, player, afterText) => {

            let pieces = afterText.trim().split(' ');

            let otherPlayer = TryLoadPlayer(pieces[0].replace("@", ""));

            if(otherPlayer?.Username == player.Username) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you throw it up in the air and catch it again`);
                return false;
            }

            if(otherPlayer != null) {
                let item = GetObjectFromInputText(afterText.trim().replace(pieces[0] + " ", ""))!;

                if(item !== undefined) {
                    if(item.ObjectName == "letter") {
                        if(player.Inventory.filter(x => x == item.ObjectName).length <= 1) {
                            await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have an extra letter to send`);
                            return false;
                        }
                    }

                    if(player.Inventory.includes(item.ObjectName)) {
                        await client.say(process.env.CHANNEL!, `@${player.Username} is giving @${otherPlayer.Username} ${item.ContextualName}!`);
                        GivePlayerObject(client, otherPlayer.Username, item.ObjectName);
                        let index = player.Inventory.indexOf(item.ObjectName);
                        player.Inventory.splice(index, 1);
                        SavePlayer(player);
                    }
                    else {
                        await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have that item`);
                        return false;
                    }
                }
                else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, I couldn't find that item`);
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
        CostRange: {min: 3000, max: 10000 },
        Tier: ObjectTier.High,
        IconRep: IconType.Crystal,
        UseAction: async (client, player, afterText) => {
            if(player.LevelUpAvailable){
                await client.say(process.env.CHANNEL!, `@${player.Username}, you already have a level up available! You must level up before using the crystal`);
                return false;
            }

            let expNeeded = player.CurrentExpNeeded - player.CurrentExp;
            await client.say(process.env.CHANNEL!, `@${player.Username} has crushed a magic crystal!`);
            await GiveExp(client, player.Username, expNeeded);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 6
    },
    {
        ObjectName: "accuracy potion",
        ContextualName: "an accuracy potion",
        PluralName: "accuracy potions",
        Alias: ["accuracy"],
        Info: "Doubles your accuracy! Ex. !use accuracy potion",
        CostRange: {min: 1000, max: 1500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.BottleBlue,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} has increased accuracy for 5 minutes`);
            AddStatusEffectToPlayer(player.Username, StatusEffect.DoubleAccuracy, 60 * 5);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "fire resistance potion",
        ContextualName: "a fire resistance potion",
        PluralName: "fire resistance potions",
        Alias: ["fire resistance", "fire resist", "fire resist potion"],
        Info: "Gives you fire resistance for 5 minutes! Ex. !use fire resistance potion",
        CostRange: {min: 1000, max: 1500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Bottle,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} has fire resistance for 5 minutes`);
            AddStatusEffectToPlayer(player.Username, StatusEffect.FireResistance, 60 * 5);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "cold resistance potion",
        ContextualName: "a cold resistance potion",
        PluralName: "cold resistance potions",
        Alias: ["cold resistance", "cold resist", "cold resist potion"],
        Info: "Gives you cold resistance for 5 minutes! Ex. !use cold resistance potion",
        CostRange: {min: 1000, max: 1500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.BottleBlue,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} has cold resistance for 5 minutes`);
            AddStatusEffectToPlayer(player.Username, StatusEffect.ColdResistance, 60 * 5);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 10
    },
    {
        ObjectName: "present",
        ContextualName: "a present",
        PluralName: "presents",
        Alias: [],
        Info: "A present! Gave you been naughty or nice? Open it to find out! Ex. !use present",
        CostRange: {min: 1000, max: 1500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Present,
        UseAction: async (client, player, afterText) => {
            let nice = GetRandomIntI(1, 5) >= 3;
            let txt = `@${player.Username}, Santa has deemed you... `;
            if(nice) {
                txt += `NICE! As you open your present, you find `;
                switch (GetRandomIntI(1, 4)) {
                    case 1:
                    case 2:
                        let obj = await GivePlayerRandomObject(client, player.Username);
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
                if(!playerSession.SeenChristmasMessage) {
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
            }
            else {
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
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 0
    },
    {
        ObjectName: "coal",
        ContextualName: "a chunk of coal",
        PluralName: "coal chunks",
        Alias: [],
        Info: "IT'S COAL! Wow, guess you've been naughty.",
        CostRange: {min: 1000, max: 1500 },
        Tier: ObjectTier.Low,
        IconRep: IconType.BottleBlue,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} did you just eat coal?? Serves you right for being naughty. Well, you've been poisoned for 5 minutes.`);
            AddStatusEffectToPlayer(player.Username, StatusEffect.Poisoned, 60 * 5);

            return true;
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 0
    },
    {
        ObjectName: "candy",
        Alias: [],
        ContextualName: "a piece of candy",
        PluralName: "candies",
        Info: "Happy Halloween! Some lovely candy, let's hope its the good stuff. Ex. !use candy",
        CostRange: {min: 50, max: 100 },
        Tier: ObjectTier.Low,
        IconRep: IconType.Candy,
        ThrownDamage: { min: -9, max: -5 },
        UseAction: async (client, player, afterText) => {
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
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 0 //0 rarity, no candy when its not halloween
    },


    //Equippable
    {
        ObjectName: "pure nail",
        ContextualName: "a pure nail",
        PluralName: "pure nails",
        Info: "The pure nail from Hollow Knight. An incredible weapon that does more damage. Has a durability, and will break after several uses. Equip it using !equip pure nail",
        CostRange: {min: 2000, max: 5000 },
        Tier: ObjectTier.High,
        IconRep: IconType.PureNail,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you admire the beauty of the pure nail.`);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Rogue, ClassType.Warrior ],
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
        Info: "The diamond axe from Minecraft, it does more damage. Has a durability, and will break after several uses. Equip it using !equip diamond axe",
        CostRange: {min: 2000, max: 5000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.DiamondAxe,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you chop down a nearby tree in a single swing. A distant creeper says "Aw man"`);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Warrior ],
        ObjectAttackAction: async (client, player) => {
            return{
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
        Info: "The Wabbajack from Skyrim, does more damage. Has a durability, and will break after several uses. Equip it using !equip wabbajack",
        CostRange: {min: 2000, max: 5000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Wabbajack,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you've started the Mind of Madness questline. Uh oh.`);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Mage ],
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
        Info: "An obsidian dagger from Runescape, it does more damage. Has a durability, and will break after several uses. Equip it using !equip obsidian dagger",
        CostRange: {min: 2000, max: 5000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.ObsidianDagger,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you look into the obsidian. Oooo, shiny.`);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Rogue ],
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
        Info: "Allows you to increase the durability of an object you have equipped! Ex. !use repair hammer",
        CostRange: {min: 1000, max: 2000 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.Hammer,
        UseAction: async (client, player, afterText) => {
            if(player.EquippedObject !== undefined) {
                let durabilityIncrease = GetRandomIntI(3, 6);

                player.EquippedObject!.RemainingDurability += durabilityIncrease;
                await client.say(process.env.CHANNEL!, `@${player.Username} the durability of your ${player.EquippedObject.ObjectName} has increased by ${durabilityIncrease}.`);
                return true;
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username} you must have an object equipped to repair it! Only some objects have durability, use !info [item] to check`);
                return false;
            }
        },
        Consumable: true,
        Rewardable: true,
        Rarity: 5
    },
    {
        ObjectName: "pool noodle",
        ContextualName: "a pool noodle",
        PluralName: "pool noodles",
        Info: "A pool noodle, from a pool. Great for some fun in the sun. Has a durability, and will break after several uses. Equip it using !equip pool noodle",
        CostRange: {min: 1000, max: 3500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.PoolNoodle,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, `@${player.Username} you swing it around. If only there was a pool nearby.`);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Warrior, ClassType.Rogue, ClassType.Mage ],
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
        Info: "A power armor helmet! It'll help protect your face a bit more, but leaves you prone to overheating. Equip it using !equip power helmet",
        CostRange: {min: 1000, max: 3500 },
        Tier: ObjectTier.Mid,
        IconRep: IconType.PowerHelmet,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, GetRandomItem([
                `@${player.Username} you take the helmet and wipe the insides a bit. It's all sweaty!`,
                `@${player.Username} you look through the eyes... it's all tinted green, for some reason.`,
                `@${player.Username} this makes your head look too big for your body.`,
            ])!);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Warrior, ClassType.Rogue, ClassType.Mage ],
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
        Info: "A cardboard box! Wow! It's... a box. Your mind feels safer. Equip it using !equip cardboard box",
        CostRange: {min: 500, max: 1500 },
        Tier: ObjectTier.Low,
        IconRep: IconType.CardboardBox,
        UseAction: async (client, player, afterText) => {
            if(GetRandomIntI(1, 3) == 1) {
                let otherUser = LoadRandomPlayerSession([player.Username], true)!;

                //Damage calc
                let otherUserPlayer = LoadPlayer(otherUser.NameAsDisplayed);
                let maxHealth = CalculateMaxHealth(otherUserPlayer);
                let damage = Math.max(1, GetRandomIntI(maxHealth * 0.05, maxHealth * 0.2));

                await client.say(process.env.CHANNEL!, `@${player.Username} you hide in your box until @${otherUserPlayer.Username} comes nearby and you JUMP OUT and SCARE them! What a funny prank.`);
                await ChangePlayerHealth(client, otherUser.NameAsDisplayed, -damage, DamageType.Psychic);
            }
            else {
                await client.say(process.env.CHANNEL!, GetRandomItem([
                    `@${player.Username} you hide in your box, safe, alone, protected.`,
                    `@${player.Username} you build a box fort. Wow, look how beautiful it is.`,
                ])!);

                return false;
            }
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Warrior, ClassType.Rogue, ClassType.Mage ],
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
        Info: "A gun from the game Duck Hunt. It's exceptional at shooting ducks, but works okay on other things. Equip it using !equip duck hunt gun",
        CostRange: {min: 3000, max: 6000 },
        Tier: ObjectTier.High,
        IconRep: IconType.DuckHuntGun,
        UseAction: async (client, player, afterText) => {
            await client.say(process.env.CHANNEL!, GetRandomItem([
                `@${player.Username} you aim for the nearest duck, but none are in sight`,
                `@${player.Username} BANG! You got one.`,
                `@${player.Username} BANG BANG BANG... oops. GAME OVER!`
            ])!);

            return false;
        },
        Consumable: false,
        Rewardable: true,
        Equippable: true,
        ClassRestrictions: [ ClassType.Rogue ],
        ObjectAttackAction: async (client, player) => {
            return {
                damage: GetRandomIntI(10, 25),
                damageType: GetRandomItem([DamageType.Piercing, DamageType.Fire])!
            };
        },
        Durability: {min: 10, max: 15},
        Rarity: 7
    },
]

export function DoesPlayerHaveObject(displayName: string, object: string) {
    let player = LoadPlayer(displayName);

    return player.Inventory.includes(object);
}
