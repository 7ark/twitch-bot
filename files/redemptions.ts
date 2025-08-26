import {Client} from "tmi.js";
import {
    ChangePlayerHealth,
    GiveExp,
    GivePlayerRandomObject,
    LoadPlayer,
    RandomlyGiveExp
} from "./utils/playerGameUtils";
import {Broadcast} from "./bot";
import {GetRandomIntI} from "./utils/utils";
import {AddToActionQueue} from "./actionqueue";
import {CurrentCaller, CurrentPollJoker} from "./globals";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./utils/audioUtils";
import {BanUser} from "./utils/twitchUtils";
import {CreateAndBuildGambleAlert, StartChatChallenge} from "./utils/chatGamesUtils";
import {ObjectRetrievalType, ObjectTier} from "./inventoryDefinitions";
import {GivePlayerRandomQuest, HandleQuestProgress} from "./utils/questUtils";
import {DamageType} from "./utils/monsterUtils";
import {AudioType} from "./streamSettings";
import {MakeRainbowLights, SetDefaultLightColor} from "./utils/lightsUtils";
import {TrickOrTreat} from "./utils/scareUtils";
import {IconType, QuestType} from "./valueDefinitions";
import {AddChapterMarker, SetSceneItemEnabled} from "./utils/obsutils";
import {CreatePoll} from "./utils/pollUtils";
import {AD_PendingAngel, AD_PendingDevil} from "./utils/angelDevilUtils";

const REDEEM_GAIN_5_EXP = '2c1c1337-583b-4a51-a169-b79c3cdd3d08';
const REDEEM_GAIN_20_EXP = '8ed9b9a2-89d3-48e5-9783-f12ae4fe2c61';
const REDEEM_GAIN_100_EXP = '3d3b5857-b676-4302-b29e-ae74e82b53e8';
const REDEEM_LEARN_A_MOVE = `f6cb8127-4ee6-4018-ac6b-5c27591093f2`;
const REDEEM_PLAY_CRICKETS = `feca362e-5609-4b0c-95b8-7e1e4d8ad5fc`;
const REDEEM_PLAY_CHEERING = `777bf16a-998f-4e9e-b44e-4e1196c47c9f`;
const REDEEM_PLAY_BOOING = `553becbd-579e-4819-9a0e-df1204b4e4fe`;
const REDEEM_PLAY_LAUGHTER = '5b9628ff-6828-4278-9a5c-355fecc547a3';
const REDEEM_TELL_A_JOKE = `f24fe80c-c6f4-4412-9832-ae4a96d5a767`;
const REDEEM_GAMBLE_LOW = `0e234a4a-6932-4a54-9482-3e5ed01479c0`;
const REDEEM_GAMBLE_LOWMID = `72efd413-6fc0-4762-a8aa-7ebc155eabd4`;
const REDEEM_GAMBLE_LOWMIDHIGH = `2974cacd-564b-44d3-923c-650962e2177f`;
const REDEEM_GAMBLE_MID = `958016db-052e-4abd-9488-d17c418aaf53`;
const REDEEM_GAMBLE_MIDHIGH = `260ea0f7-fa4c-447e-acbb-a58c1b3f2d47`;
const REDEEM_CHAT_CHALLENGE = `37318946-604c-4b3a-8b84-21f2f8c7dd2b`;
const REDEEM_FULL_HEAL = `2f11982a-179a-47cb-86d5-26478c186693`;
const REDEEM_OFFER_SIDEQUEST = `4dba9b6d-dbe2-413e-b94c-04670c678561`;
const REDEEM_REROLL_QUEST = `b6cf6ef8-88f5-44a0-91c1-cb5b051da55f`;
const REDEEM_SETLIGHTCOLOR_BLUE = `2603a84a-f29b-416c-9f5c-603c7cceefc7`;
const REDEEM_SETLIGHTCOLOR_RED = `60722ce3-5726-45ea-ae99-f450cd91a891`;
const REDEEM_SETLIGHTCOLOR_PURPLE = `82b5bd8b-956d-43cb-a803-e4d221be6d88`;
const REDEEM_SETLIGHTCOLOR_GREEN = `97d7a1e9-674d-46ed-9441-b010deadc7d2`;
const REDEEM_SETLIGHTCOLOR_CUSTOM = `16cae48b-6bce-4fc8-a37f-f94473a1ce06`;
const REDEEM_TRICKORTREAT = `e5fd3064-ef28-4048-afb4-7c91928c0574`;
const REDEEM_CALLIN = `1861f169-44f4-43bf-8627-1456996090d2`;
const REDEEM_BEECAM = `6d2081b0-a13b-48ef-aca8-a924dd6db9e2`;
const REDEEM_RUNPOLL = `037a4c59-d8a4-4a2b-a76a-a806f2979352`;

export async function ProcessRedemptions(client: Client, username: string, rewardId: string, redemptionId: string, userInput: string) {
    console.log(`Redemption! from ${username}, a reward id of ${rewardId}`)
    let player = LoadPlayer(username);
    switch (rewardId) {
        case REDEEM_GAIN_5_EXP:
            await GiveExp(client, username, 5);
            break;
        case REDEEM_GAIN_20_EXP:
            await GiveExp(client, username, 20);
            break;
        case REDEEM_GAIN_100_EXP:
            await GiveExp(client, username, 100);
            break;
        // case REDEEM_LEARN_A_MOVE:
        //
        //     let validDefs = MoveDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));
        //
        //     if(validDefs.length > 0) {
        //         let chosenMove = GetRandomItem(validDefs);
        //
        //         player.KnownMoves.push(chosenMove!.Command);
        //         let monsterStats = LoadMonsterData().Stats;
        //         await client.say(process.env.CHANNEL!, `@${username}, you have learned !${chosenMove!.Command}: ${chosenMove!.Description.replace("{monster}", monsterStats.Name)}`);
        //
        //         SavePlayer(player);
        //     }
        //     else {
        //         await client.say(process.env.CHANNEL!, `@${username}, you have no moves left to be found. Level up, or try a new class!`);
        //     }
        //
        //     await RandomlyGiveExp(client, username, 5, GetRandomIntI(2, 3))
        //     break;
        case REDEEM_PLAY_CHEERING:
            PlaySound("cheering", AudioType.ImportantStreamEffects);
            break;
        case REDEEM_PLAY_BOOING:
            PlaySound("booing", AudioType.ImportantStreamEffects);
            break;
        case REDEEM_PLAY_CRICKETS:
            PlaySound("crickets", AudioType.ImportantStreamEffects);
            break;
        case REDEEM_PLAY_LAUGHTER:
            PlaySound("laughing", AudioType.ImportantStreamEffects);
            break;
        case REDEEM_TELL_A_JOKE:
            let textToSay = userInput;

            AddToActionQueue(async () => {
                let s = "";
                if(player.Username[player.Username.length - 1] === 's') {
                    s = "'";
                }
                else {
                    s = "'s";
                }
                Broadcast(JSON.stringify({ type: 'showDisplay', title: `${player.Username}${s} Joke`, message: textToSay[0].toUpperCase() + textToSay.slice(1), icon: (IconType.Info) }));

                PlayTextToSpeech(textToSay, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                    PlaySound("badumtiss", AudioType.GameAlerts);
                    CurrentPollJoker = username;
                    CreatePoll(client,{
                        title: "Was that joke funny?",
                        choices: [
                            "Yes",
                            "No"
                        ]
                    }, 30, false, (winner: string) => {
                        let wasFunny = winner === "Yes";
                        PlayTextToSpeech(`Chat has found the joke of ${player.Username} to be... ${wasFunny ? `FUNNY` : `NOT FUNNY`}`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                            if(wasFunny) {
                                PlaySound("cheering", AudioType.GameAlerts);
                                await GivePlayerRandomObject(client, player.Username, ObjectRetrievalType.RandomReward);
                                await GiveExp(client, player.Username, 30);
                            }
                            else {
                                PlaySound("booing", AudioType.GameAlerts, "wav", () => {
                                    PlayTextToSpeech("They have been temporarily banned for 5 minutes.", AudioType.GameAlerts);
                                });
                                await BanUser(client, player.Username, 5 * 60, "Being unfunny");
                            }
                        })
                    });
                });

                await HandleQuestProgress(client, username, QuestType.TellJoke, 1);

                setTimeout(() => {
                    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: username, display: textToSay, }));
                }, 700);
            }, 60)
            break;
        case REDEEM_GAMBLE_LOW:
            CreateAndBuildGambleAlert(client, username, [ObjectTier.Low]);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_LOWMID:
            CreateAndBuildGambleAlert(client, username, [ObjectTier.Low, ObjectTier.Mid]);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_LOWMIDHIGH:
            CreateAndBuildGambleAlert(client, username, [ObjectTier.Low, ObjectTier.Mid, ObjectTier.High]);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_MID:
            CreateAndBuildGambleAlert(client, username, [ObjectTier.Mid]);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_MIDHIGH:
            CreateAndBuildGambleAlert(client, username, [ObjectTier.Mid, ObjectTier.High]);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_CHAT_CHALLENGE:
            StartChatChallenge(client, username)
            break;
        case REDEEM_FULL_HEAL:
            await ChangePlayerHealth(client, player.Username, 9999999, DamageType.None);
            break;
        case REDEEM_OFFER_SIDEQUEST:
            let text = `${player.Username} is offering a side quest to "${userInput}". Cory, do you accept?`;

            let s = "";
            if(player.Username[player.Username.length - 1] === 's') {
                s = "'";
            }
            else {
                s = "'s";
            }
            Broadcast(JSON.stringify({ type: 'showDisplay', title: `${player.Username}${s} Sidequest`, message: text[0].toUpperCase() + text.slice(1), icon: (IconType.Scroll) }));

            PlayTextToSpeech(`${player.Username} is offering a side quest to`, AudioType.GameAlerts, "en-US-BrianNeural", () => {
                PlayTextToSpeech(userInput, AudioType.GameAlerts, TryGetPlayerVoice(player), () => {
                    PlayTextToSpeech(`Cory, do you accept?`, AudioType.GameAlerts, "en-US-BrianNeural");
                });
            });
            break;
        case REDEEM_REROLL_QUEST:
            await GivePlayerRandomQuest(client, player.Username);
            break;
        case REDEEM_SETLIGHTCOLOR_BLUE:
            await SetDefaultLightColor({
                r: 0,
                g: 0,
                b: 1,
                brightness: 1
            });
            break;
        case REDEEM_SETLIGHTCOLOR_RED:
            await SetDefaultLightColor({
                r: 1,
                g: 0,
                b: 0,
                brightness: 1
            });
            break;
        case REDEEM_SETLIGHTCOLOR_PURPLE:
            await SetDefaultLightColor({
                r: 1,
                g: 0,
                b: 1,
                brightness: 1
            });
            break;
        case REDEEM_SETLIGHTCOLOR_GREEN:
            await SetDefaultLightColor({
                r: 0,
                g: 1,
                b: 0,
                brightness: 1
            });
            break;
        case REDEEM_SETLIGHTCOLOR_CUSTOM:
            let splitInput = userInput.replace(",", "").split(' ');
            if(splitInput.length < 3) {
                await client.say(process.env.CHANNEL!, `@${username}, that is an incorrect input for RGB values`);
            }
            else {
                let r = parseInt(splitInput[0]);
                let g = parseInt(splitInput[1]);
                let b = parseInt(splitInput[2]);
                let bright = parseInt(splitInput[3]);
                
                if(r == NaN || r < 0) {
                    r = 0;
                }
                else if(r > 255)
                {
                    r = 255;
                }
                if(g == NaN || g < 0) {
                    g = 0;
                }
                else if(g > 255)
                {
                    g = 255;
                }
                if(b == NaN || b < 0) {
                    b = 0;
                }
                else if(b > 255)
                {
                    b = 255;
                }
                if(bright == NaN || bright > 255) {
                    bright = 255;
                }
                else if(bright < 0)
                {
                    bright = 0;
                }

                await SetDefaultLightColor({
                    r: r / 255,
                    g: g / 255,
                    b: b / 255,
                    brightness: splitInput.length == 3 ? 1 : bright / 255
                });
            }

            break;
        case REDEEM_TRICKORTREAT:
            await TrickOrTreat(client, username);
            break;
        case REDEEM_CALLIN:
            await AddChapterMarker(`Phone call from ${username}`)
            PlaySound("phonering", AudioType.ImportantStreamEffects);

            await new Promise(resolve => setTimeout(resolve, 1000));

            await client.say(process.env.CHANNEL!, `@${username}, your call has begun. All messages are TTS for the next minute. Use !hangup to end the call at any time.`);

            await PlayTextToSpeech(userInput, AudioType.ImportantStreamEffects, TryGetPlayerVoice(player));

            CurrentCaller = player.Username;

            setTimeout(async () => {
                if(CurrentCaller != ``) {
                    PlaySound("endcall", AudioType.ImportantStreamEffects);
                    await client.say(process.env.CHANNEL!, `@${username}, your call has concluded.`);
                    CurrentCaller = ``;
                }
            }, 1000 * 60 * 3) //3 minute call
            break;
        case REDEEM_BEECAM:
            await PlayTextToSpeech("Activating bee cam", AudioType.ImportantStreamEffects);
            await SetSceneItemEnabled("BeeCam", true);

            setTimeout(async () => {
                await SetSceneItemEnabled("BeeCam", false);
                await PlayTextToSpeech("Bee cam deactivated", AudioType.ImportantStreamEffects);
            }, 1000 * 60 * 10) //10 minute bee cam
            break;
        case REDEEM_RUNPOLL:
            AddToActionQueue(async () => {
                let pieces = userInput.split('|');
                let title = pieces.length > 0 ? pieces[0] : "";
                let choices = [];
                for (let i = 1; i < pieces.length; i++) {
                    if(pieces[i] != undefined && pieces[i].trim().length > 0) {
                        choices.push(pieces[i]);
                    }
                }

                if(choices.length <= 1) {
                    await client.say(process.env.CHANNEL!, `@${username}, FOR SHAME! Your poll was not formatted correctly. It must be in the format "Poll Name|Choice 1|Choice 2|Choice 3|etc" with at least 2 choices.`);
                }
                else {
                    await AddChapterMarker(`Chat Runs a Poll: ${title}`);
                    choices.push("None of the Above");

                    await PlayTextToSpeech(`Chat is running a poll to decide: ${title}`, AudioType.UserGameActions);

                    await CreatePoll(client, {title: title, choices: choices}, 90, false, async (result) => {
                        await PlayTextToSpeech(`Chat's poll of ${title} has concluded with an answer of ${result}`, AudioType.UserGameActions);
                    });
                }

            }, 100);
            break;
        default:
            await RandomlyGiveExp(client, username, 5, GetRandomIntI(2, 3))
            break;
    }
}

const goal = 4000;
let bits = 0;
let active = true;

export async function ProcessBits(client: Client, username: string, message: string, bitAmount: number) {
    console.log(`Processing bits received from ${username} for ${bitAmount}`);

    if(bitAmount > 50) {
        await MakeRainbowLights(Math.ceil(bitAmount / 50));
    }

    bits += bitAmount;

    if(bits >= goal) {
        PlayTextToSpeech("Congrats Chat! You've unlocked Cory playing BEE SIMULATOR!", AudioType.ImportantStreamEffects);
        await client.say(process.env.CHANNEL!, `Congrats Chat! You've unlocked Cory playing BEE SIMULATOR!`);
        active = false;
    }
    else {
        await client.say(process.env.CHANNEL!, `${bitAmount} added to the BEE SIMULATOR pool! Now at ${bits}/${goal}`);
        console.log("BITS: " + bits);
    }

    // let convertRatio = 5;
    // let frightMeterPoints = Math.ceil(bitAmount / convertRatio);
    //
    // if(GetCurrentProgress() + frightMeterPoints >= ProgressBarMax) {
    //     await client.say(process.env.CHANNEL!, `@${username} maxed out the fright meter!`);
    // }
    // else {
    //     await client.say(process.env.CHANNEL!, `${bitAmount} converted into ${frightMeterPoints} fright points!`);
    // }
    //
    // await ChangeProgressBar(client, frightMeterPoints);

}
