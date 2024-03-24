import {Client} from "tmi.js";
import {LoadPlayer, SavePlayer} from "./playerData";
import axios from "axios";
import {broadcast, randomlyGiveExp} from "./bot";
import {getRandomIntI, getRandomItem, GiveExp, playSound} from "./utils";
import {attackDefinitions} from "./movesDefinitions";

const REDEEM_GAIN_5_EXP_ID = '2c1c1337-583b-4a51-a169-b79c3cdd3d08';
const REDEEM_LEARN_A_MOVE = `f6cb8127-4ee6-4018-ac6b-5c27591093f2`;
const REDEEM_PLAY_CRICKETS = `feca362e-5609-4b0c-95b8-7e1e4d8ad5fc`;
const REDEEM_PLAY_CHEERING = `777bf16a-998f-4e9e-b44e-4e1196c47c9f`;
const REDEEM_PLAY_BOOING = `553becbd-579e-4819-9a0e-df1204b4e4fe`;

export async function processRedemptions(client: Client, username: string, rewardId: string, redemptionId: string, userInput: string) {
    console.log(`Redemption! from ${username}, a reward id of ${rewardId}`)
    switch (rewardId) {
        case REDEEM_GAIN_5_EXP_ID:
            GiveExp(client, username, 5);

            // await completeRedemption(rewardId, redemptionId, accessToken);
            break;
        case REDEEM_LEARN_A_MOVE:
            let player = LoadPlayer(username);

            let validDefs = attackDefinitions.filter(def => !player.KnownMoves.includes(def.Command) && player.Classes.some(x => x.Level > 0 && x.Type === def.ClassRequired && x.Level >= (def.LevelRequirement ?? 0)));

            if(validDefs.length > 0) {
                let chosenMove = getRandomItem(validDefs);

                player.KnownMoves.push(chosenMove!.Command);
                client.say(process.env.CHANNEL!, `@${username}, you have learned !${chosenMove!.Command}: ${chosenMove!.Description}`);

                SavePlayer(player);
            }
            else {
                client.say(process.env.CHANNEL!, `@${username}, you have no moves left to be found. Level up, or try a new class!`);
            }

            randomlyGiveExp(client, username, 5, getRandomIntI(2, 3))
            break;
        case REDEEM_PLAY_CHEERING:
            // playSound("credits");
            playSound("cheering");
            break;
        case REDEEM_PLAY_BOOING:
            playSound("booing");
            break;
        case REDEEM_PLAY_CRICKETS:
            playSound("crickets");
            break;
        default:
            randomlyGiveExp(client, username, 5, getRandomIntI(2, 3))
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
