import {Client} from "tmi.js";
import {
    ChangePlayerHealth,
    GiveExp,
    GivePlayerRandomObject,
    LoadPlayer,
    RandomlyGiveExp,
    SavePlayer
} from "./utils/playerGameUtils";
import {Broadcast} from "./bot";
import {GetRandomIntI, GetRandomItem, IconType} from "./utils/utils";
import {AttackDefinitions} from "./movesDefinitions";
import {AddToActionQueue} from "./actionqueue";
import {CurrentPollJoker} from "./globals";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./utils/audioUtils";
import {BanUser, CreatePoll} from "./utils/twitchUtils";
import {CreateAndBuildGambleAlert, StartChatChallenge} from "./utils/alertUtils";
import {ObjectTier} from "./inventory";
import {GivePlayerRandomQuest, HandleQuestProgress, QuestType} from "./utils/questUtils";
import {DamageType} from "./utils/dragonUtils";
import {AudioType} from "./streamSettings";

const REDEEM_GAIN_5_EXP = '2c1c1337-583b-4a51-a169-b79c3cdd3d08';
const REDEEM_GAIN_20_EXP = '8ed9b9a2-89d3-48e5-9783-f12ae4fe2c61';
const REDEEM_LEARN_A_MOVE = `f6cb8127-4ee6-4018-ac6b-5c27591093f2`;
const REDEEM_PLAY_CRICKETS = `feca362e-5609-4b0c-95b8-7e1e4d8ad5fc`;
const REDEEM_PLAY_CHEERING = `777bf16a-998f-4e9e-b44e-4e1196c47c9f`;
const REDEEM_PLAY_BOOING = `553becbd-579e-4819-9a0e-df1204b4e4fe`;
const REDEEM_PLAY_LAUGHTER = '5b9628ff-6828-4278-9a5c-355fecc547a3';
const REDEEM_TELL_A_JOKE = `f24fe80c-c6f4-4412-9832-ae4a96d5a767`;
const REDEEM_GAMBLE_LOW = `0e234a4a-6932-4a54-9482-3e5ed01479c0`;
const REDEEM_GAMBLE_MID = `72efd413-6fc0-4762-a8aa-7ebc155eabd4`;
const REDEEM_GAMBLE_HIGH = `2974cacd-564b-44d3-923c-650962e2177f`;
const REDEEM_CHAT_CHALLENGE = `37318946-604c-4b3a-8b84-21f2f8c7dd2b`;
const REDEEM_FULL_HEAL = `2f11982a-179a-47cb-86d5-26478c186693`;
const REDEEM_OFFER_SIDEQUEST = `4dba9b6d-dbe2-413e-b94c-04670c678561`;
const REDEEM_REROLL_QUEST = `b6cf6ef8-88f5-44a0-91c1-cb5b051da55f`;

export async function ProcessRedemptions(client: Client, username: string, rewardId: string, redemptionId: string, userInput: string) {
    console.log(`Redemption! from ${username}, a reward id of ${rewardId}`)
    let player = LoadPlayer(username);
    switch (rewardId) {
        case REDEEM_GAIN_5_EXP:
            await GiveExp(client, username, 5);

            // await completeRedemption(rewardId, redemptionId, accessToken);
            break;
        case REDEEM_GAIN_20_EXP:
            await GiveExp(client, username, 20);

            // await completeRedemption(rewardId, redemptionId, accessToken);
            break;
        case REDEEM_LEARN_A_MOVE:

            let validDefs = AttackDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

            if(validDefs.length > 0) {
                let chosenMove = GetRandomItem(validDefs);

                player.KnownMoves.push(chosenMove!.Command);
                client.say(process.env.CHANNEL!, `@${username}, you have learned !${chosenMove!.Command}: ${chosenMove!.Description}`);

                SavePlayer(player);
            }
            else {
                client.say(process.env.CHANNEL!, `@${username}, you have no moves left to be found. Level up, or try a new class!`);
            }

            await RandomlyGiveExp(client, username, 5, GetRandomIntI(2, 3))
            break;
        case REDEEM_PLAY_CHEERING:
            // playSound("credits");
            PlaySound("cheering", AudioType.GameAlerts);
            break;
        case REDEEM_PLAY_BOOING:
            PlaySound("booing", AudioType.GameAlerts);
            break;
        case REDEEM_PLAY_CRICKETS:
            PlaySound("crickets", AudioType.GameAlerts);
            break;
        case REDEEM_PLAY_LAUGHTER:
            PlaySound("laughing", AudioType.GameAlerts);
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
                    CreatePoll({
                        title: "Was that joke funny?",
                        choices: [
                            { title: "Yes" },
                            { title: "No" }
                        ]
                    }, 30, false, (winner: string) => {
                        let wasFunny = winner === "Yes";
                        PlayTextToSpeech(`Chat has found the joke of ${player.Username} to be... ${wasFunny ? `FUNNY` : `NOT FUNNY`}`, AudioType.GameAlerts, "en-US-BrianNeural", async () => {
                            if(wasFunny) {
                                PlaySound("cheering", AudioType.GameAlerts);
                                GivePlayerRandomObject(client, player.Username);
                                await GiveExp(client, player.Username, 50);
                            }
                            else {
                                PlaySound("booing", AudioType.GameAlerts, "wav", () => {
                                    PlayTextToSpeech("They have been temporarily banned for 5 minutes.");
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
            CreateAndBuildGambleAlert(client, username, ObjectTier.Low);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_MID:
            CreateAndBuildGambleAlert(client, username, ObjectTier.Mid);

            await HandleQuestProgress(client, username, QuestType.Gamble, 1);
            break;
        case REDEEM_GAMBLE_HIGH:
            CreateAndBuildGambleAlert(client, username, ObjectTier.High);

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
        default:
            await RandomlyGiveExp(client, username, 5, GetRandomIntI(2, 3))
            break;
    }
}

// async function completeRedemption(rewardId: string, redemptionId: string, accessToken: string) {
//     const url = `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.CHANNEL_ID}&reward_id=${rewardId}&id=${redemptionId}`;
//
//     try {
//         const response = await axios.patch(url, {
//             status: 'FULFILLED'
//         }, {
//             headers: {
//                 'Client-Id': process.env.CLIENT_ID,
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//
//         console.log("Redemption completed:", response.data);
//     } catch (error: any) {
//         console.error("Error completing redemption:", error.response ? error.response.data : error);
//     }
// }
//
// async function rejectRedemption(rewardId: string, redemptionId: string, accessToken: string) {
//     const url = `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.CHANNEL_ID}&reward_id=${rewardId}&id=${redemptionId}`;
//
//     try {
//         const response = await axios.patch(url, {
//             status: 'CANCELED'
//         }, {
//             headers: {
//                 'Client-Id': process.env.CLIENT_ID,
//                 'Authorization': `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//
//         console.log("Redemption rejected:", response.data);
//     } catch (error: any) {
//         console.error("Error rejecting redemption:", error.response ? error.response.data : error);
//     }
// }
