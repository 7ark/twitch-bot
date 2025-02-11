import {Client} from "tmi.js";
import {Affliction, ClassType, MoveType, Player, StatusEffect} from "./valueDefinitions";
import {
    AddSpacesBeforeCapitals,
    GetNumberWithOrdinal,
    GetRandomIntI,
    GetSecondsBetweenDates,
    GetUpgradeDescription,
    IsCommand
} from "./utils/utils";
import {isNaN} from "@tensorflow/tfjs-node";
import {
    DoesPlayerHaveStatusEffect,
    GetCommandCooldownTimeLeftInSeconds, GetObjectFromInputText,
    GetPlayerStatsDisplay, GetUpgradeOptions, GiveExp, GivePlayerObject,
    IsCommandOnCooldown,
    LevelUpPlayer, LoadAllPlayers, LoadPlayer, SavePlayer,
    SelectPlayerUpgrade, TakeObjectFromPlayer,
    TryLoadPlayer
} from "./utils/playerGameUtils";
import {WhisperUser} from "./utils/twitchUtils";
import {LoadMonsterData} from "./utils/monsterUtils";
import {GetMove, MoveDefinitions} from "./movesDefinitions";
import {CurrentGTARider, IsMonsterActive} from "./globals";
import {BattlecryStarted, CreditsGoing, DoBattleCry} from "./utils/commandUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice, TryToSetVoice} from "./utils/audioUtils";
import {AudioType, CurrentStreamSettings} from "./streamSettings";
import fs from "fs";
import {Broadcast} from "./bot";
import {GetStringifiedSessionData} from "./utils/playerSessionUtils";
import {DrunkifyText, GetParameterFromCommand} from "./utils/messageUtils";
import {AllInventoryObjects, InventoryObject} from "./inventoryDefinitions";
import {UpgradeDefinitions} from "./upgradeDefinitions";
import {
    GetCurrentShopItems, HandleMinigames,
    IsCommandMinigame,
    MinigameType,
    ResetLeaderboard,
    ShowLeaderboard,
    ShowShop
} from "./utils/minigameUtils";
import {DoesPlayerHaveQuest, GetQuestText} from "./utils/questUtils";
import {
    GTA_CurrentRating,
    GTA_CurrentRiders,
    GTA_CurrentRidersVehicle, GTA_Ratings, GTA_Reviews,
    LetsRide, SaveGTA,
    UpdateStarVisuals,
    VEHICLE_OPTIONS
} from "./utils/challengeUtils";
import {DoesSceneContainItem, GetOpenScene, SetSceneItemEnabled} from "./utils/obsutils";
import {
    ExchangeCoinsForGems,
    ExchangeGemsForCoins,
    GetBankStatusText,
    GetExchangeRateText,
    LoadBankData, SaveBankData,
    UpdateExchangeRate
} from "./utils/bankUtils";
import {GetUserMinigameCount} from "./actionqueue";

export interface CommandDefinition {
    Commands: Array<string>;
    CommandVerification?: (command: string) => Promise<boolean>;
    Description?: string;
    AdminCommand: boolean;

    Action: (client: Client, player: Player, command: string) => void;
}

export let COMMAND_DEFINITIONS: Array<CommandDefinition> = [
    {
        Commands: ["help"],
        Description: "Gives a general explanation of chat features",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let contextPieces = command.replace("!help", "").trim().split(' ');
            let context = contextPieces.length > 0 ? contextPieces[0] : "";

            //TODO: Way to see all help commands?
            if(context == "") {
                await client.say(process.env.CHANNEL!, `Chat is interactive! Use !commands to see all command options. Use '!help fight' to learn about fighting monsters. Use '!help minigames' to learn about playing small minigames. Use '!help interact' to learn about more interactive elements of chat.`);
            }
            else {
                switch (context) {
                    case "monster":
                    case "monsters":
                    case "fight":
                    case "fighting":
                        await client.say(process.env.CHANNEL!, `You are an adventurer! Use !stats to see your character sheet. Use !moves to see what combat abilities you have. If you fall to 0HP, you will be timed out for 5 minutes.`);
                        break;
                    case "minigame":
                    case "minigames":
                    case "gems":
                        const minigameKeys = Object
                            .keys(MinigameType)
                            .filter((v) => Number.isNaN(Number(v)))
                        await client.say(process.env.CHANNEL!, `You can play minigames to earn gems. Use${minigameKeys.map(x => ` !${x.toLowerCase()}`)} to play!`);
                        break;
                    case "interact":
                    case "interactive":
                        await client.say(process.env.CHANNEL!, `There are many interactive elements. Use !yell [text] to use TTS. We have many channel point redemptions as well, such as gambling, chat challenges, or even changing my light color in the background.`);
                        break;
                    case "quest":
                    case "quests":
                        await client.say(process.env.CHANNEL!, `You can get a quest randomly while talking, or use the 'Get a Quest' channel point redemption. Completing a quest earns you EXP and items based on the difficulty.`);
                        break;
                    case "coins":
                    case "coin":
                        await client.say(process.env.CHANNEL!, `You can get coins by exchanging them with the bank. Use !excoin [amount] to exchange a number of gems for coins, or !exgem to exchange your coins back for gems. Check the current exchange rate with !exchangerate`);
                        break;
                    case "bank":
                        await client.say(process.env.CHANNEL!, `The bank can be used to exchange gems for Bytecoins, and vise versa. Most things can be purchased with Bytecoins. Use !exgems to exchange a number of gems for Bytecoins, and !excoins to exchange Bytecoins back to gems. The banks exchange rate changes every stream. Check it with !exchangerate`);
                        break;
                }
            }
        }
    },
    {
        Commands: ["challenge"],
        CommandVerification: async (command) => {
            return CurrentStreamSettings.challengeType != undefined;
        },
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            switch (CurrentStreamSettings.challengeType) {
                case "gta_needride":
                    await client.say(process.env.CHANNEL!, `Today Cory is driving around his viewers. Use !ineedaride to be entered into the list to be chosen to ride in Cory's vehicle. You can then use !locations to see options for where you'd like to go. You just say the location (no commands necessary) and he will drive you. All messages said while in Cory's vehicle are said out loud in TTS.`);
                    break;
            }
        }
    },
    {
        Commands: ["lurk"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `@${player.Username}, have a nice lurk!`);
        }
    },
    {
        Commands: ["cc"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Crowd Control is a way for you (the viewer) to interact with my modded game and cause fun effects to happen, good or bad. 
        You can get 250 free coins (on desktop) every 30 minutes from the overlay on screen, or buy them from my interact link: https://interact.crowdcontrol.live/#/twitch/26580802/coins`);
        }
    },
    {
        Commands: ["discord"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Come hang out on our Discord, to chat, give stream suggestions, and get go live notification. Join here: https://discord.gg/6dEKeStTEM`);
        }
    },
    {
        Commands: ["games"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, "I'm a game developer! Feel free to ask questions or talk about code. Check out my games here: https://store.steampowered.com/developer/bytefire");
        }
    },
    {
        Commands: ["youtube", "yt"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `I've been posting lots on Youtube! Mostly shorts, but some long form content. Give it a watch: https://www.youtube.com/@7ark`);
        }
    },
    {
        Commands: ["socials"],
        Description: "Shows the links to my social media accounts",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Check out my socials - Discord: https://discord.gg/6dEKeStTEM, Bluesky: https://bsky.app/profile/7ark.dev, Youtube: https://www.youtube.com/@7ark`);
        }
    },
    {
        Commands: ["addtocart", "cart"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Use the "Add to Cart" channel point redeem to suggest items to purchase for my stream! Items will be featured on an upcoming special stream. Ideally include a link to whatever you want purchased. Items are subject to approval.`);
        }
    },
    {
        Commands: [],
        CommandVerification: async (command: string) => {
            return Object.keys(ClassType).filter(key => Number.isNaN(Number(key))).some(key => IsCommand(command, key.toLowerCase()));
        },
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let classTypeKey: string = Object.keys(ClassType)
                .filter(key => Number.isNaN(Number(key)))
                .find(key => IsCommand(command, key.toLowerCase()));
            if (!classTypeKey) return; // In case something goes wrong

            let classType: ClassType = ClassType[classTypeKey as keyof typeof ClassType];

            await LevelUpPlayer(client, player.Username, classType);
        }
    },
    {
        Commands: ["upgrade"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let split = command.replace('!upgrade', '').trim().split(' ');
            if(split.length > 0) {
                let value: number = parseInt(split[0]);
                console.log("Parsed value:", value);
                if(Number.isNaN(value)) {
                    await WhisperUser(client, player.Username, `@${player.Username}, that is not a valid upgrade option number. Use !levelup to check your options.`);
                    return;
                }

                await SelectPlayerUpgrade(client, player.Username, value - 1);
            }
            else {
                console.log(`No number in message: ${command}}`);
                await WhisperUser(client, player.Username, `@${player.Username}, you must select a number. Use !levelup to check your options. Ex. !upgrade 2`);
            }
        }
    },
    {
        Commands: ["upgrades"],
        Description: "View your current upgrades",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.Upgrades.length === 0 && player.PermanentUpgrades.length === 0) {
                await WhisperUser(client, player.Username, `@${player.Username}, you don't have any upgrades yet! You can get upgrades when leveling up.`);
                return;
            }

            let text = `@${player.Username}, `;

            if(player.PermanentUpgrades.length > 0) {
                text += `your permanent upgrades are: ${player.PermanentUpgrades.join(', ')} and `
            }

            text += `your current upgrades are: ${player.Upgrades.join(', ')}. Type !info [upgrade name] to get more information on what they do.`;
            await WhisperUser(client, player.Username, text);
        }
    },
    {
        Commands: ["boss"],
        Description: "Show current monster statistics",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let monsterInfo = LoadMonsterData();
            let text = `${monsterInfo.Stats.Name} currently has ${monsterInfo.Health}HP`;

            for (let i = 0; i < monsterInfo.Afflictions.length; i++) {
                if(monsterInfo.Afflictions[i].Amount > 0) {
                    text += ` (${monsterInfo.Afflictions[i].Amount} ${Affliction[monsterInfo.Afflictions[i].AfflictionType]})`;
                }
            }

            await WhisperUser(client, displayName, text);
        }
    },
    {
        Commands: ["stats", "stat", "level", "status"],
        Description: "See your current statistics",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let split = command.trim().split(' ');

            let playerToStats = player;

            if(split.length > 1) {
                let otherPlayer = TryLoadPlayer(split[1].replace("@", ""));

                if(otherPlayer != undefined) {
                    playerToStats = otherPlayer;
                }
            }

            await WhisperUser(client, player.Username, GetPlayerStatsDisplay(playerToStats));
        }
    },
    {
        Commands: ["moves", "skills", "spells"],
        Description: "See what moves you're able to use",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let text = `@${player.Username}, the moves you can use right now are: `;

            for (let i = 0; i < player.KnownMoves.length; i++) {
                let move = GetMove(player.KnownMoves[i]);
                if(IsMonsterActive || (move !== undefined && move.Type !== MoveType.Attack)) {
                    text += `!${player.KnownMoves[i]}`;

                    if(i < player.KnownMoves.length - 2) {
                        text += ", ";
                    }
                    else if(i === player.KnownMoves.length - 2 && player.KnownMoves.length > 1) {
                        text += " and ";
                    }
                }
            }

            let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

            text += `. You can learn ${validDefs.length} new moves at this level. You can also use !randomattack to use any random attack move you know.`;

            await WhisperUser(client, player.Username, text);
        }
    },
    {
        Commands: ["battlecry"],
        CommandVerification: async (command: string) => {
            return BattlecryStarted;
        },
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(IsCommandOnCooldown(player.Username, 'battlecry')) {
                let cooldownSecondsLeft = GetCommandCooldownTimeLeftInSeconds(player.Username, 'battlecry');

                await client.say(process.env.CHANNEL!, `@${player.Username}, this move is currently on cooldown! You can do this again in ${cooldownSecondsLeft} seconds.`);
                return;
            }

            PlaySound('battlecry', AudioType.UserGameActions);

            DoBattleCry(player.Username);
        }
    },
    {
        Commands: ["voices"],
        Description: "See available TTS voices to select a voice from",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Use !setvoice [voice] to set your TTS voice for the stream. The available voices are: Andrew, Emma, Brian, Guy, Aria, Davis, Eric, Jacob, Roger, Steffan, AvaMultilingual, Amber, Ashley`);
        }
    },
    {
        Commands: ["setvoice"],
        Description: "Try to set a voice to a given voice option",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await TryToSetVoice(client, player.Username,  command.replace("!setvoice", "").trim());
        }
    },
    {
        Commands: ["yell"],
        Description: "Yell at me in TTS",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(CurrentGTARider != "" && CurrentGTARider.toLowerCase() != player.Username.toLowerCase()) {
                await WhisperUser(client, player.Username, `@${player.Username}, only the current Rider may yell at this time.`);
                return;
            }
            let textToSay = command.replace("!yell", "");

            if(DoesPlayerHaveStatusEffect(player.Username, StatusEffect.Drunk)) {
                textToSay = DrunkifyText(textToSay);
            }

            if(textToSay.length > 250) {
                textToSay = textToSay.slice(0, 250) + "...";
            }

            PlayTextToSpeech(textToSay, AudioType.UserTTS, TryGetPlayerVoice(player));

            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: player.Username, display: textToSay, }));
            }, 700);
        },
    },
    {
        Commands: ["inventory", "equipment", "inventorys", "inv"],
        Description: "See your stuff!",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.Inventory.length === 0) {
                await WhisperUser(client, player.Username, `@${player.Username}, you have no items in your inventory`);
            }
            else {
                let final = `@${player.Username}, you have `;
                let uniqueItems: Array<{item: InventoryObject, count: number}> = [];

                for (let i = 0; i < player.Inventory.length; i++) {
                    let inventoryObj: InventoryObject = AllInventoryObjects.find(x => x.ObjectName === player.Inventory[i])!;

                    let foundObj = uniqueItems.find(x => x.item === inventoryObj);
                    if(foundObj !== undefined) {
                        foundObj.count++;
                    }
                    else {
                        if(inventoryObj === undefined)
                            console.log(`FAILED TO FIND INVENTORY ITEM: ${player.Inventory[i]}`)
                        uniqueItems.push({item: inventoryObj, count: 1})
                    }
                }

                for (let i = 0; i < uniqueItems.length; i++) {
                    final += uniqueItems[i].count > 1 ? uniqueItems[i].item.PluralName : uniqueItems[i].item.ContextualName;
                    if(uniqueItems[i].count > 1) {
                        final += ` (x${uniqueItems[i].count})`;
                    }

                    if(i < uniqueItems.length - 2 && uniqueItems.length > 2) {
                        final += ", "
                    }

                    if(i === uniqueItems.length - 2) {
                        final += " and ";
                    }
                }

                final += `. You also have ${player.SpendableGems} gems.`;

                await WhisperUser(client, player.Username, final);
                // await client.say(process.env.CHANNEL!, final);
            }
        }
    },
    {
        Commands: ["use"],
        Description: "Use an item",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let objectUsed = command.replace("!use", "").trim();
            let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed)!;

            if(inventoryObject === undefined || inventoryObject === null || !player.Inventory.includes(inventoryObject.ObjectName)) {
                await WhisperUser(client, player.Username, `@${player.Username}, you don't have that!`);
            }
            else {
                let wasUsed = await inventoryObject.UseAction(client, player, objectUsed.replace(inventoryObject.ObjectName, "").trim());
                if(inventoryObject.Consumable && wasUsed) {
                    TakeObjectFromPlayer(player.Username, inventoryObject.ObjectName);
                }
            }
        }
    },
    {
        Commands: ["equip"],
        Description: "Equip a valid item",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let objectUsed = command.replace("!equip", "").trim().toLowerCase();
            let inventoryObject: InventoryObject = GetObjectFromInputText(objectUsed)!;

            if(inventoryObject === undefined || inventoryObject === null || !player.Inventory.includes(inventoryObject.ObjectName)) {
                await WhisperUser(client, player.Username, `@${player.Username}, you don't have that!`);
            }
            else {
                if(inventoryObject.Equippable) {
                    if(player.EquippedBacklog === undefined) {
                        player.EquippedBacklog = [];
                    }

                    if(player.EquippedObject !== undefined) {
                        player.EquippedBacklog.push(player.EquippedObject);
                        await WhisperUser(client, player.Username, `@${player.Username}, you have unequipped your ${player.EquippedObject.ObjectName}`);
                    }

                    let existingObjectIndex = player.EquippedBacklog.findIndex(x => x.ObjectName === inventoryObject.ObjectName);
                    if(existingObjectIndex !== -1) {
                        player.EquippedObject = player.EquippedBacklog[existingObjectIndex];
                        player.EquippedBacklog.splice(existingObjectIndex, 1);
                    }
                    else {
                        player.EquippedObject = {
                            ObjectName: inventoryObject.ObjectName,
                            RemainingDurability: GetRandomIntI(inventoryObject.Durability!.min, inventoryObject.Durability!.max)
                        };
                    }

                    let attackClassInfo = "It will work with ";
                    if(inventoryObject.ClassRestrictions!.length === 3) {
                        attackClassInfo += "all classes.";
                    }
                    else if(inventoryObject.ClassRestrictions!.length === 1) {
                        attackClassInfo += `the ${ClassType[inventoryObject.ClassRestrictions![0]]} class.`;
                    }
                    else {
                        attackClassInfo += `the ${ClassType[inventoryObject.ClassRestrictions![0]]} and ${ClassType[inventoryObject.ClassRestrictions![1]]} classes.`;
                    }

                    await WhisperUser(client, player.Username, `@${player.Username}, you have equipped your ${player.EquippedObject.ObjectName}. ${attackClassInfo}`);
                    SavePlayer(player);
                }
                else {
                    await WhisperUser(client, player.Username, `@${player.Username}, you can't equip that object.`);
                }
            }
        }
    },
    {
        Commands: ["unequip"],
        Description: "Unequips your currently equipped item",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.EquippedBacklog === undefined) {
                player.EquippedBacklog = [];
            }

            if(player.EquippedObject != undefined) {
                await WhisperUser(client, player.Username, `@${player.Username}, you have unequipped your ${player.EquippedObject.ObjectName}`);
                player.EquippedBacklog.push(player.EquippedObject);
                player.EquippedObject = undefined;
                SavePlayer(player);
            }
            else {
                await WhisperUser(client, player.Username, `@${player.Username}, you have nothing equipped right now`);
            }
        }
    },
    {
        Commands: ["durability"],
        Description: "Check the durability of an equipped item",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.EquippedObject != undefined) {
                await WhisperUser(client, displayName, `@${player.Username}, your ${player.EquippedObject.ObjectName} has a remaining durability of ${player.EquippedObject.RemainingDurability}`);
            }
            else {
                await WhisperUser(client, displayName, `@${player.Username}, you have nothing equipped right now`);
            }
        }
    },
    {
        Commands: ["info"],
        Description: "Gives you information on a specific item, move, or upgrade",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let infoFocus = command.replace("!info", "").trim();
            let inventoryObject: InventoryObject = GetObjectFromInputText(infoFocus)!;

            if(inventoryObject === undefined || inventoryObject === null) {
                let move = GetMove(infoFocus);
                if(move !== undefined) {
                    await WhisperUser(client, player.Username, move.Description);
                }
                else {
                    let upgrade = UpgradeDefinitions.find(x => x.Name.toLowerCase() === infoFocus.toLowerCase());
                    if(upgrade !== undefined) {
                        await WhisperUser(client, player.Username, `${upgrade.Name}: ${GetUpgradeDescription(upgrade.Name)}`);
                    }
                    else {
                        await WhisperUser(client, player.Username, `${player.Username}, I'm not sure what that is. You need to use !info [item or move name]`);
                    }
                }
            }
            else {
                await WhisperUser(client, player.Username, inventoryObject.Info);
            }
        }
    },
    {
        Commands: ["togglepassive", "passive", "toggle passive"],
        Description: "Toggles passive mode, which prevents PVP actions.",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            player.PassiveModeEnabled = !player.PassiveModeEnabled;
            SavePlayer(player);
            await client.say(process.env.CHANNEL!, `${player.Username}, passive mode is now ${player.PassiveModeEnabled ? `enabled` : `disabled`}`);
        }
    },
    {
        Commands: ["deathlb", "deathleaderboard"],
        Description: "Shows the leaderboard for those with the most deaths!",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let players = LoadAllPlayers().sort((x, y) => {
                return x.Deaths - y.Deaths;
            });

            let text = "Deaths Leaderboard: \n";
            let max = Math.min(5, players.length);
            for (let i = 0; i < max; i++) {
                if(players[i].Deaths == undefined || players[i].Deaths == 0) {
                    break;
                }

                text += `${GetNumberWithOrdinal(i + 1)}: @${players[i].Username} - ${players[i].Deaths} Deaths`;

                if(i != 5) {
                    text += " | ";
                }
            }

            await client.say(process.env.CHANNEL!, text);
        }
    },
    {
        Commands: ["gems"],
        Description: "Displays how many spendable gems you have",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await WhisperUser(client, player.Username, `@${player.Username}, you have ${player.SpendableGems} gems.`);
        }
    },
    {
        Commands: ["leaderboard", "lb"],
        Description: "Show the leaderboard on stream for who has the most gems from minigames",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            ShowLeaderboard();
        }
    },
    {
        Commands: ["quest"],
        Description: "Check what current quest you have",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(DoesPlayerHaveQuest(player.Username)) {
                let questText = GetQuestText(player.CurrentQuest!.Type, player.CurrentQuest!.Goal);

                await client.say(process.env.CHANNEL!, `@${player.Username}, you currently have a difficulty ${player.CurrentQuest!.FiveStarDifficulty} quest to: ${questText}. Your current progress is at ${player.CurrentQuest!.Progress}/${player.CurrentQuest!.Goal}`);
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you do not currently have a quest. You can get a quest with a channel point redeem!`);
            }
        }
    },
    {
        Commands: ["levelup"],
        Description: "Gives you information about leveling up",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.UpgradeOptions.length > 0) {
                let isPermanent = UpgradeDefinitions.find(x => x.Name == player.UpgradeOptions[0]).IsPermanent;
                await client.say(process.env.CHANNEL!, GetUpgradeOptions(player, isPermanent));
            }
            else if(player.LevelUpAvailable) {
                await WhisperUser(client, player.Username, `@${player.Username}, you have a level up available! You can use !mage, !warrior, or !rogue to choose a class to level up in`);
            }
            else {
                await WhisperUser(client, player.Username, `@${player.Username}, you need more exp to level up. You get exp by chatting, fighting monsters, or other interactions in chat.`);
            }
        }
    },
    {
        Commands: ["shop", "store"],
        Description: "See what the current shop has to offer",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let shopItems = GetCurrentShopItems();
            let text = `Todays Shop:${shopItems.map((x, i) => ` (${(i + 1)}): ${x.obj} for ${x.cost} ByteCoins`)}`;

            await client.say(process.env.CHANNEL!, text);
            await WhisperUser(client, player.Username, `Use "!buy [objectname]" to choose something to purchase`);

            let scrollingText = `Todays Shop:\n${shopItems.map((x, i) => `${x.obj} | ${x.cost}c\n`).join('')}\nUse !shop`;
            ShowShop(scrollingText);
        }
    },
    {
        Commands: ["buy"],
        Description: "Purchase a specific item from the shop",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let chosenObject = GetObjectFromInputText(command.replace("!buy", "").trim());

            if(chosenObject === undefined || chosenObject === null) {
                await WhisperUser(client, player.Username, `@${player.Username}, could not find object with name ${chosenObject}`);
            }
            else {
                let shopItems = GetCurrentShopItems();
                let foundIndex = shopItems.findIndex(x => x.obj === chosenObject?.ObjectName);
                if(foundIndex !== -1) {
                    let cost = shopItems[foundIndex].cost;

                    if(player.ByteCoins >= cost) {
                        player.ByteCoins -= cost;
                        SavePlayer(player);
                        await GivePlayerObject(client, player.Username, chosenObject.ObjectName);
                    }
                    else {
                        await WhisperUser(client, player.Username, `@${player.Username}, you don't have enough ByteCoins! You need ${(shopItems[foundIndex].cost - player.ByteCoins)} more ByteCoins.`);
                    }
                }
                else {
                    await WhisperUser(client, player.Username, `@${player.Username}, that object is not for sale!`);
                }
            }
        }
    },
    {
        Commands: ["effects"],
        Description: "Check what current status effects you have",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.StatusEffects.length > 0) {
                let text = `@${player.Username}, you have the follow status effects active: `;
                for (let i = 0; i < player.StatusEffects.length; i++) {
                    let secondsLeft = player.StatusEffects[i].EffectTimeInSeconds - GetSecondsBetweenDates(player.StatusEffects[i].WhenEffectStarted, new Date());
                    text += `${AddSpacesBeforeCapitals(StatusEffect[player.StatusEffects[i].Effect])} (${secondsLeft}s)`;

                    if(i < player.StatusEffects.length - 1) {
                        text += ", ";
                    }
                }

                await WhisperUser(client, player.Username, text);
            }
            else {
                await WhisperUser(client, player.Username, `@${player.Username}, you have no status effects`);
            }
        }
    },
    {
        Commands: ["give"],
        Description: "Give another user an item",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let option = command.replace("!give", "").trim();
            let pieces = option.trim().split(' ');

            let otherPlayer = TryLoadPlayer(pieces[0].replace("@", ""));

            if(otherPlayer?.Username == player.Username) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you throw it up in the air and catch it again`);
            }

            if(otherPlayer != null) {
                let item = GetObjectFromInputText(option.trim().replace(pieces[0] + " ", ""))!;

                if(item !== undefined) {
                    if(player.Inventory.includes(item.ObjectName)) {
                        await client.say(process.env.CHANNEL!, `@${player.Username} is giving @${otherPlayer.Username} ${item.ContextualName}!`);
                        await GivePlayerObject(client, otherPlayer.Username, item.ObjectName);
                        let index = player.Inventory.indexOf(item.ObjectName);
                        player.Inventory.splice(index, 1);
                        SavePlayer(player);
                    }
                    else {
                        await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have that item. Ex !give the7ark bananas`);
                    }
                }
                else {
                    await client.say(process.env.CHANNEL!, `@${player.Username}, I couldn't find that item. Ex !give the7ark bananas`);
                }
            }
            else {
                await client.say(process.env.CHANNEL!, `@${player.Username}, I could not find that player. Ex !give the7ark bananas`);
            }
        }
    },
    {
        Commands: ["balance", "currency"],
        Description: "Check how many Bytecoins and gems you have",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.ByteCoins === undefined) player.ByteCoins = 0;
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have ${player.ByteCoins} ByteCoins and ${player.SpendableGems} gems.`);
        }
    },
    {
        Commands: ["bytecoin", "bytecoins"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(player.ByteCoins === undefined) player.ByteCoins = 0;
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have ${player.ByteCoins} ByteCoins.`);
        }
    },
    {
        Commands: ["gem", "gems"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `@${player.Username}, you have ${player.SpendableGems} gems.`);
        }
    },
    {
        Commands: ["bank"],
        Description: "Check the status of the bank",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, GetBankStatusText());
        }
    },
    {
        Commands: ["exchangerate"],
        Description: "Check the banks current exchange rate",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, GetExchangeRateText());
        }
    },
    {
        Commands: ["exgems", "exgems", "exchange"],
        Description: "Exchange gems to receive Bytecoins",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let input = GetParameterFromCommand(command, 1);

            if(!input) {
                await client.say(process.env.CHANNEL!, GetExchangeRateText());
                return;
            }

            let gemsToExchange = parseInt(input);
            if(Number.isNaN(gemsToExchange) || gemsToExchange <= 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, please specify a valid number of gems to exchange`);
                return;
            }

            if(player.SpendableGems < gemsToExchange) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have enough gems! You need ${gemsToExchange - player.SpendableGems} more gems.`);
                return;
            }

            let coinsToReceive = ExchangeGemsForCoins(gemsToExchange);
            if(coinsToReceive <= 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you need to exchange at least ${UpdateExchangeRate()} gems to get 1 ByteCoin`);
                return;
            }

            let bankData = LoadBankData();
            if(bankData.totalCoins < coinsToReceive) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, the bank doesn't have enough ByteCoins for this exchange!`);
                return;
            }

            if(player.ByteCoins === undefined) player.ByteCoins = 0;

            player.SpendableGems -= gemsToExchange;
            player.ByteCoins += coinsToReceive;
            bankData.totalCoins -= coinsToReceive;

            SavePlayer(player);
            SaveBankData(bankData);

            await client.say(process.env.CHANNEL!, `@${player.Username} exchanged ${gemsToExchange} gems for ${coinsToReceive} ByteCoins!`);
        }
    },
    {
        Commands: ["excoins"],
        Description: "Exchange Bytecoins to receive gems",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let input = GetParameterFromCommand(command, 1);

            if (!input) {
                await client.say(process.env.CHANNEL!, GetExchangeRateText());
                return;
            }

            let coinsToExchange = parseInt(input);
            if (Number.isNaN(coinsToExchange) || coinsToExchange <= 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, please specify a valid number of Bytecoins to exchange`);
                return;
            }

            if (player.ByteCoins < coinsToExchange) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you don't have enough Bytecoins! You need ${coinsToExchange - player.ByteCoins} more Bytecoins.`);
                return;
            }

            let gemsToReceive = ExchangeCoinsForGems(coinsToExchange);
            if (gemsToReceive <= 0) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you need to exchange at least ${UpdateExchangeRate()} Bytecoins to get 1 gem`);
                return;
            }

            let bankData = LoadBankData();
            // if(bankData.totalCoins < gemsToReceive) {
            //     await client.say(process.env.CHANNEL!, `@${player.Username}, the bank doesn't have enough Gems for this exchange!`);
            //     return;
            // }

            if (player.ByteCoins === undefined) player.ByteCoins = 0;

            player.ByteCoins -= coinsToExchange;
            player.Gems += gemsToReceive;
            bankData.totalCoins += coinsToExchange;

            SavePlayer(player);
            SaveBankData(bankData);

            await client.say(process.env.CHANNEL!, `@${player.Username} exchanged ${coinsToExchange} Bytecoins for ${gemsToReceive} gems!`);
        }
    },
    {
        Commands: [],
        CommandVerification: async (command: string) => {
            return IsCommandMinigame(command);
        },
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            const MAX_INSTANCES = 3;
            let activeInstances = GetUserMinigameCount(player.Username);

            if(activeInstances >= MAX_INSTANCES) {
                await client.say(process.env.CHANNEL!, `@${player.Username}, you have reached the max amount of queued minigames you can do! Please wait.`);
            }
            else {
                await HandleMinigames(client, player.Username, command);
            }
        }
    },
    {
        Commands: ["commands"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            let parameterText = GetParameterFromCommand(command, 1);
            const commandsPerPage = 5;
            let displayableCommands = COMMAND_DEFINITIONS.filter(x => x.Description != undefined && x.Description != "");

            let page = 1;
            if(parameterText != "") {
                page = parseInt(parameterText);
            }

            let final = `Commands Page [Page ${page}] (Use !commands # to see other pages):`;
            let start = page * commandsPerPage;
            for (let i = start; i < Math.min(displayableCommands.length, start + commandsPerPage); i++) {
                final += ` | !${displayableCommands[i].Commands[0]} - ${displayableCommands[i].Description}`
            }
            await client.say(process.env.CHANNEL!, final);
        }
    },
    // {
    //     Commands: [""],
    //     Description: "",
    //     AdminCommand: false,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },

    //GTA CHALLENGE STUFF
    {
        Commands: ["rides"],
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await WhisperUser(client, player.Username, `The following ride options are available in GTA for travel: ${VEHICLE_OPTIONS.join(`, `)}`);
        }
    },
    {
        Commands: ["change"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(CurrentGTARider.toLowerCase() == player.Username.toLowerCase()) {
                let option = command.trim();
                let pieces = option.trim().split(' ');
                let saidVehicle = "";
                let allGood = true;
                if(pieces.length > 1) {
                    allGood = false;
                    saidVehicle = pieces[1].toLowerCase();
                    await WhisperUser(client, player.Username, `@${player.Username}, swapping vehicle to: '${saidVehicle}'`);

                    Broadcast(JSON.stringify({ type: 'ridechange',vehicle: saidVehicle }));
                }
                if(!allGood) {
                    await WhisperUser(client, player.Username, `@${player.Username}, vehicle of type '${saidVehicle}' doesn't exist. Use !rides to select a vehicle type.`);
                    return;
                }
            }
        }
    },
    {
        Commands: ["ineedaride"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            if(!GTA_CurrentRiders.includes(player.Username)) {
                let option = command.trim();
                let pieces = option.trim().split(' ');
                let saidVehicle = "";
                let allGood = true;
                if(pieces.length > 1) {
                    allGood = false;
                    saidVehicle = pieces[1].toLowerCase();

                    if(VEHICLE_OPTIONS.includes(saidVehicle)) {
                        GTA_CurrentRidersVehicle.set(player.Username, saidVehicle);
                        allGood = true;
                    }
                }
                if(!allGood) {
                    await WhisperUser(client, player.Username, `@${player.Username}, vehicle of type '${saidVehicle}' doesn't exist. Use !rides to select a vehicle type.`);
                    return;
                }
                GTA_CurrentRiders.push(player.Username);
                await WhisperUser(client, player.Username, `@${player.Username}, you've requested a pickup!`);

                if(GTA_CurrentRiders.length >= 3 && CurrentGTARider === '') {
                    await LetsRide(client, player.Username);
                }
            }
        }
    },
    {
        Commands: ["locations"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {
            await WhisperUser(client, player.Username, `The following locations are available in GTA for travel: bank, vinewood sign, legion square, city hall, airport, rural airport, casino, concert, pier, arena, fort, prison, laboratory, plaza, market, vinewood hills, franklin house, michael house, trevor trailer, mount chiliad, mount gordo, forest, hills, beach, north chumash, port, el burro heights, terminal`)
        }
    },
    {
        Commands: ["review", "reviews", "rate", "rating", "rates"],
        Description: "",
        AdminCommand: false,

        Action: async (client: Client, player: Player, command: string) => {        if(displayName.toLowerCase() != CurrentGTARider.toLowerCase()) {
            return;
        }
            let review = command.toLowerCase().replace("!review", "").replace("!rate", "").trim();
            let rating = parseInt(review.split(' ')[0]);
            if(!Number.isNaN(rating)) {
                if(rating > 5) {
                    rating = 5;
                }
                if(rating < 1){
                    rating = 1;
                }
                GTA_Ratings.push(rating);
                let reviewText = review.replace(rating.toString(), "").trim();
                GTA_Reviews.push(reviewText);
                GTA_CurrentRating = 0;
                for (let i = Math.max(0, GTA_Ratings.length - 3); i < GTA_Ratings.length; i++) {
                    GTA_CurrentRating += GTA_Ratings[i];
                }
                GTA_CurrentRating /= Math.min(3, GTA_Ratings.length);
                GTA_CurrentRating = Math.floor(GTA_CurrentRating);

                CurrentGTARider = ``;
                // currentRiders = [];

                const taxiGroup = "TaxiGroup";
                let sceneName = await GetOpenScene();

                if(!await DoesSceneContainItem(sceneName, taxiGroup)) {
                    return;
                }

                await SetSceneItemEnabled(taxiGroup, false);

                await UpdateStarVisuals();

                SaveGTA();

                let hadReview = reviewText.trim() !== "";
                let extraReviewText = hadReview ? `They had this to say about their ride:` : "";

                if(rating > 3) {
                    PlayTextToSpeech(`${player.Username} just gave us a rating of ${rating}! ${extraReviewText}`, AudioType.ImportantStreamEffects, "en-US-BrianNeural", async () => {
                        if(hadReview){
                            PlayTextToSpeech(reviewText, AudioType.ImportantStreamEffects, TryGetPlayerVoice(player), async () => {
                                PlaySound("cheering", AudioType.ImportantStreamEffects, "wav", async () => {
                                    if(GTA_CurrentRiders.length >= 3 && CurrentGTARider === '') {
                                        await LetsRide(client, player.Username);
                                    }
                                });
                            });
                        }
                        else {
                            PlaySound("cheering", AudioType.ImportantStreamEffects, "wav", async () => {
                                if(GTA_CurrentRiders.length >= 3 && CurrentGTARider === '') {
                                    await LetsRide(client, player.Username);
                                }
                            });
                        }
                    });
                }
                else {
                    PlayTextToSpeech(`${displayName} just rated us ${rating}! ${extraReviewText}`, AudioType.ImportantStreamEffects, "en-US-BrianNeural", async () => {
                        if(hadReview) {
                            PlayTextToSpeech(reviewText, AudioType.ImportantStreamEffects, TryGetPlayerVoice(player), async () => {
                                PlaySound("booing", AudioType.ImportantStreamEffects, "wav", async () => {
                                    if(GTA_CurrentRiders.length >= 3 && CurrentGTARider === '') {
                                        await LetsRide(client, player.Username);
                                    }
                                });
                            });
                        }
                        else {
                            PlaySound("booing", AudioType.ImportantStreamEffects, "wav", async () => {
                                if(GTA_CurrentRiders.length >= 3 && CurrentGTARider === '') {
                                    await LetsRide(client, player.Username);
                                }
                            });
                        }
                    });
                }

                Broadcast(JSON.stringify({ type: 'rider', rider: "" }));
            }
            else {
                await WhisperUser(client, player.Username, `Invalid rating format! Please respond as such: !review # text`);
            }
        }
    },
    {
        Commands: ["letsride"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            await LetsRide(client, player.Username);
        }
    },
    {
        Commands: ["cancelride"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            GTA_CurrentRiders = [];
            GTA_CurrentRidersVehicle.clear();
            CurrentGTARider = ``;

            const taxiGroup = "TaxiGroup";
            let sceneName = await GetOpenScene();

            if(!await DoesSceneContainItem(sceneName, taxiGroup)) {
                return;
            }

            await SetSceneItemEnabled(taxiGroup, false);

            await UpdateStarVisuals();
            await WhisperUser(client, player.Username, `Ride cancelled!`);
        }
    },
    {
        Commands: ["endride"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            if(CurrentGTARider == ''){
                return;
            }
            await WhisperUser(client, player.Username, `@${CurrentGTARider}: Thanks for riding in Cory's Limo! Please leave a review with !review # Review text`)
        }
    },

    //ADMIN
    {
        Commands: ["giveexp"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            console.log("giving exp to user");
            let afterText = command.replace('!giveexp', '').trim().split(' ');
            let user = afterText[0].replace("@", "");
            let expAmount = parseInt(afterText[1]);

            console.log(`giving ${expAmount} to ${user}`);

            let playerToGiveExp = LoadPlayer(user);
            if(playerToGiveExp.CurrentExp === 0 && playerToGiveExp.Level === 0) {
                await client.say(process.env.CHANNEL!, `No found user by that name`);
                return;
            }
            else {
                await client.say(process.env.CHANNEL!, `Giving ${expAmount} to @${user}`);
                await GiveExp(client, user, expAmount);
            }
        }
    },
    {
        Commands: ["giveallexp"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            let allPlayerData = JSON.parse(fs.readFileSync('playerData.json', 'utf-8'));
            let expAmount = parseInt(command.replace('!giveallexp ', ''));
            for (let i = 0; i < allPlayerData.length; i++) {
                let currPlayer: Player = allPlayerData[i];

                await GiveExp(client, currPlayer.Username, expAmount);
            }
            await client.say(process.env.CHANNEL!, `I've given ${expAmount}EXP to ALL adventurers!`);
        }
    },
    {
        Commands: ["adventure"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            Broadcast(JSON.stringify({ type: 'startadventure' }));
        }
    },
    {
        Commands: ["credits"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            PlaySound("credits", AudioType.StreamInfrastructure);
            Broadcast(JSON.stringify({ type: 'showcredits', data: GetStringifiedSessionData() }));
            CreditsGoing = true;
        }
    },
    {
        Commands: ["give"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            let afterText = command.replace('!give', '').trim().split(' ');
            let user = afterText[0].replace("@", "");
            let objectUsed = "";
            for (let i = 1; i < afterText.length; i++) {
                objectUsed += afterText[i];
                if(i != afterText.length - 1) {
                    objectUsed += " ";
                }
            }

            await GivePlayerObject(client, user, objectUsed);
        }
    },
    {
        Commands: ["resetleaderboard"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            await ResetLeaderboard(client);
        }
    },
    // {
    //     Commands: [""],
    //     AdminCommand: true,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },
];
