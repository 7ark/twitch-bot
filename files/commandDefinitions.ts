import {Client} from "tmi.js";
import {Affliction, ClassType, MoveType, Player, StatusEffect, DamageType} from "./valueDefinitions";
import {
    AddSpacesBeforeCapitals,
    CountOccurrences, FormatSeconds,
    GetItemsAsPages,
    GetNumberWithOrdinal,
    GetPageNumberFromCommand,
    GetRandomIntI,
    GetSecondsBetweenDates,
    IsCommand
} from "./utils/utils";
import {
    ChangePlayerHealth,
    DoesPlayerHaveStatusEffect,
    GetCommandCooldownTimeLeftInSeconds,
    GetObjectFromInputText, GetPlayerCoordinates,
    GetPlayerStatsDisplay,
    GetUpgradeDescription,
    GetUpgradeOptions,
    GiveExp,
    GivePlayerObject,
    IsCommandOnCooldown,
    LevelUpPlayer,
    LoadAllPlayers,
    LoadPlayer,
    SavePlayer,
    SelectPlayerUpgrade,
    TakeObjectFromPlayer,
    TryLoadPlayer
} from "./utils/playerGameUtils";
import {WhisperUser} from "./utils/twitchUtils";
import {LoadMonsterData} from "./utils/monsterUtils";
import {GetMove, MoveDefinitions} from "./movesDefinitions";
import {CurrentCaller, CurrentGTARider, IsMonsterActive} from "./globals";
import {BattlecryStarted, CreditsGoing, DoBattleCry} from "./utils/commandUtils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice, TryToSetVoice} from "./utils/audioUtils";
import {AudioType, CurrentStreamSettings} from "./streamSettings";
import fs from "fs";
import {Broadcast} from "./bot";
import {GetStringifiedSessionData} from "./utils/playerSessionUtils";
import {DrunkifyText, GetAllParameterTextAfter, GetParameterFromCommand} from "./utils/messageUtils";
import {AllInventoryObjects, InventoryObject, ObjectRetrievalType} from "./inventoryDefinitions";
import {UpgradeDefinitions} from "./upgradeDefinitions";
import {
    HandleMinigames,
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
    GTA_CurrentRidersVehicle,
    GTA_Ratings,
    GTA_Reviews,
    LetsRide,
    SaveGTA,
    UpdateStarVisuals,
    VEHICLE_OPTIONS
} from "./utils/gtaUtils";
import {DoesSceneContainItem, GetOpenScene, SetSceneItemEnabled} from "./utils/obsutils";
import {
    BankReceiveFromSpend, DoesBankHaveEnoughCoinsForGemTransaction,
    ExchangeCoinsForGems,
    ExchangeGemsForCoins,
    GetBankStatusText, GetCoinsToExchangeForGems, GetExchangeFee, GetExchangeFeeForGems,
    GetExchangeRateText, GetGemsToExchangeForCoins,
    LoadBankData,
    SaveBankData,
    UpdateExchangeRate
} from "./utils/bankUtils";
import {GetUserMinigameCount} from "./actionqueue";
import {
    AddOrder,
    AddPendingCustomer,
    Checkout,
    COOK_CurrentCustomers,
    COOK_CustomerQueue,
    COOK_PendingCustomer,
    OrderUp
} from "./utils/cookingSimUtils";
import {GetCurrentGroceryStoreItems, GetCurrentSalesmanItems} from "./utils/shopUtils";
import {GatherType, StartGathering} from "./utils/gatherUtils";
import {GetRecipesItemUsedIn} from "./utils/inventoryUtils";
import {
    AD_AngelQueue,
    AD_CurrentAngel,
    AD_CurrentDevil,
    AD_DevilQueue,
    AD_PendingAngel,
    AD_PendingDevil,
    AddPendingPerson,
    GiveADQuest,
    LoadAD,
    RemoveAD
} from "./utils/angelDevilUtils";
import {ClearMeeting} from "./utils/meetingUtils";
import {CreatePoll} from "./utils/pollUtils";
import {
    GetLocation, GetLocationFromCoordinate,
    GetTravelSecondsRemaining,
    SelectPlayerTravelPath,
    StartTravelToLocation
} from "./utils/locationUtils";
import {AllLocations} from "./locationDefinitions";

export interface CommandDefinition {
    Commands: Array<string>;
    CommandVerification?: (command: string) => Promise<boolean>;
    Description?: string;
    AdminCommand: boolean;

    Action: (client: Client, player: Player, command: string) => void;
}

export let COMMAND_DEFINITIONS: Array<CommandDefinition> = [
    {
        Commands: ["cc", "crowdcontrol", "crowd"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `We're playing Dungeons and Dragons with Crowd Control! Claim your free coins and work together to cause effects, or buy coins here: https://interact.crowdcontrol.live/#/twitch/26580802/coins`);
        }
    },
    {
        Commands: ["players", "player", "character", "characters"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            let param = GetAllParameterTextAfter(command, 1).replace("@", "").toLowerCase();
            let text = `Our players: Bella (@notbella, She/They) is playing Bella (She/Her), a bard who loves all the gossip. Bella is a Half-Elf Bard. Courtney (@sakimcgee, She/Her) is playing Aloyd "Growing Darkness" Wentz (He/Him), a 16 year old kid who aspires to be an evil villain. Aloyd is a Gnome Artificer. Nick (@redpawcreative, He/Him) is playing Antonius Two-Feet (He/Him), a family member of the Two-Feet Crime Family who is trying to prove himself. Antonius is a Halfling Rogue. Julie (@justbearsy, She/Her) is playing Lula (She/Her), a little fella whose ravenous to learn. Lula is a Fairy Warlock.`;
            if(param.trim() != '') {
                switch (param) {
                    case "notbella":
                    case "bella":
                        text = `Our player Bella (@notbella, She/They) is playing Bella (She/Her), a bard who loves all the gossip. Bella is a Half-Elf Bard.`;
                        break;
                    case "saki":
                    case "sakimcgee":
                    case "courtney":
                    case "growing darkness":
                    case "aloyd":
                        text = `Our player Courtney (@sakimcgee, She/Her) is playing Aloyd "Growing Darkness" Wentz (He/Him), a 16 year old kid who aspires to be an evil villain. Aloyd is a Gnome Artificer.`;
                        break;
                    case "nic":
                    case "nick":
                    case "antonius":
                    case "tony":
                        text = `Our player Nick (@redpawcreative, He/Him) is playing Antonius Two-Feet (He/Him), a family member of the Two-Feet Crime Family who is trying to prove himself. Antonius is a Halfling Rogue.`;
                        break;
                    case "julie":
                    case "lula":
                        text = `Our player Julie (@justbearsy, She/Her) is playing Lula (She/Her), a little fella whose ravenous to learn. Lula is a Fairy Warlock.`;
                        break;
                }
            }
            
            await client.say(process.env.CHANNEL!, text);
        }
    },

    //ADMIN
    {
        Commands: ["credits"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            await client.say(process.env.CHANNEL!, `Copy the following messages to prepare to raid!`);
            await client.say(process.env.CHANNEL!, `Non subs: CurseLit 7ARK IS RAIDING CurseLit`);
            await client.say(process.env.CHANNEL!, `Subs:  the7arChaos 7ARK IS RAIDING the7arChaos`);

            PlaySound("credits", AudioType.StreamInfrastructure);
            console.log(GetStringifiedSessionData())
            Broadcast(JSON.stringify({type: 'showcredits', data: GetStringifiedSessionData()}));
            CreditsGoing = true;
        }
    },
    {
        Commands: ["createpoll"],
        AdminCommand: true,

        Action: async (client: Client, player: Player, command: string) => {
            let text = command.replace("!createpoll ", "");
            let pieces = text.split('|');
            let title = pieces[0];
            let choices = [];
            for (let i = 1; i < pieces.length; i++) {
                choices.push(pieces[i]);
            }

            await CreatePoll(client, {title: title, choices: choices}, 60 * 5);
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
    // {
    //     Commands: [""],
    //     AdminCommand: true,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },
    // {
    //     Commands: [""],
    //     AdminCommand: true,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },
    // {
    //     Commands: [""],
    //     AdminCommand: true,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },
    // {
    //     Commands: [""],
    //     AdminCommand: true,
    //
    //     Action: async (client: Client, player: Player, command: string) => {
    //
    //     }
    // },
];
