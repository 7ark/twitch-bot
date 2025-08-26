import axios from "axios";
import fs from "fs";
import {Client} from "tmi.js";
import Process from "process";
import * as ngrok from "ngrok";
import {ConvertUnixToDateTime, GetRandomItem, GetSecondsBetweenDates} from "./utils";
import {Broadcast, options} from "../bot";
import {ProcessBits, ProcessRedemptions} from "../redemptions";
import {MakeRainbowLights} from "./lightsUtils";
import {ProcessAds} from "./adUtils";
import {OnWhisper} from "./messageUtils";
import {GetAllPlayerSessions} from "./playerSessionUtils";
import {PlayHypeTrainAlert} from "./chatGamesUtils";
// const ngrok = require('ngrok');

let ngrokUrl: string = '';
let mostRecentPollId: string = '';
let pollStarted = false;
let hasAuthBeenSet = false;
let hasAuthBeenSetBot = false;
let lastCheckedFollowerCount = -1;

let authToken = process.env.TWITCH_OAUTH_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;
let authTokenBot = process.env.TWITCH_OAUTH_TOKEN;
let refreshTokenBot = process.env.REFRESH_TOKEN;


if(fs.existsSync('tokens.json')){
    const tokensData = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));

    authToken = tokensData.OAUTH_TOKEN;
    refreshToken = tokensData.REFRESH_TOKEN;

    hasAuthBeenSet = true;
}

if(fs.existsSync('tokensbot.json')){
    const tokensData = JSON.parse(fs.readFileSync('tokensbot.json', 'utf-8'));

    authTokenBot = tokensData.OAUTH_TOKEN;
    refreshTokenBot = tokensData.REFRESH_TOKEN;

    hasAuthBeenSetBot = true;
}

export function GetAuthToken(bot: boolean = false) {
    if(bot){
        if(!hasAuthBeenSetBot && fs.existsSync('tokensbot.json')){
            const tokensData = JSON.parse(fs.readFileSync('tokensbot.json', 'utf-8'));

            authTokenBot = tokensData.OAUTH_TOKEN;
            refreshTokenBot = tokensData.REFRESH_TOKEN;
        }

        return authTokenBot;
    }
    else {
        if(!hasAuthBeenSet && fs.existsSync('tokens.json')){
            const tokensData = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));

            authToken = tokensData.OAUTH_TOKEN;
            refreshToken = tokensData.REFRESH_TOKEN;
        }

        return authToken;
    }
}

export function GetAuthBearerToken(bot: boolean = false) {
    let token = GetAuthToken(bot);

    return token!.replace('oauth:', '');
}

export function GetNgrokURL() {
    return ngrokUrl;
}

async function RefreshAccessToken(bot: boolean = false) {
    try {
        // Construct the request body as form data
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', bot ? refreshTokenBot! : refreshToken!);
        params.append('client_id', bot ? process.env.BOT_CLIENT_ID : process.env.CLIENT_ID!);
        params.append('client_secret', bot ? process.env.BOT_CLIENT_SECRET : process.env.CLIENT_SECRET!);

        // Make the POST request with axios
        const response = await axios.post('https://id.twitch.tv/oauth2/token', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;
        console.log('Got new access token, replacing env variable');

        // file_put_contents()
        // Here, update your environment variables, which is not actually possible in real-time
        // You would instead update these in your secure storage solution/database
        if(bot) {
            authTokenBot = `oauth:${access_token}`;
            refreshTokenBot = refresh_token;

            fs.writeFileSync('tokensbot.json', JSON.stringify({
                OAUTH_TOKEN: authTokenBot,
                REFRESH_TOKEN: refreshTokenBot,
            }), 'utf-8')
        }
        else {
            authToken = `oauth:${access_token}`;
            refreshToken = refresh_token;

            fs.writeFileSync('tokens.json', JSON.stringify({
                OAUTH_TOKEN: authToken,
                REFRESH_TOKEN: refreshToken,
            }), 'utf-8')
        }

        // Update the client's token
        options.identity.password = `oauth:${access_token}`;
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}

export async function RefreshBotAccessTokenAndReconnect(client: Client) {
    try {
        await RefreshAccessToken(true)

        await client.connect();
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}


async function FetchEventSubSubscriptions(bot: boolean = false) {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                "Authorization": `Bearer ${await GetAppAccessToken(bot)}`,
                "Client-Id": bot ? process.env.BOT_CLIENT_ID : process.env.CLIENT_ID
            }
        });

        console.log("Existing subscriptions:", response.data.data.length);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching EventSub subscriptions:", error.response ? error.response.data : error.message);
        return null;
    }
}

async function DeleteEventSubSubscription(subscriptionId: string, bot: boolean = false) {
    try {
        await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
            headers: {
                "Authorization": `Bearer ${await GetAppAccessToken(bot)}`,
                "Client-Id": bot ? process.env.BOT_CLIENT_ID : process.env.CLIENT_ID
            }
        });

        console.log("Subscription deleted successfully");
    } catch (error: any) {
        console.error("Error deleting subscription:", error.response ? error.response.data : error.message);
    }
}

async function GetAppAccessToken(bot: boolean = false) {
    try {
        const params = new URLSearchParams({
            client_id: bot ? process.env.BOT_CLIENT_ID : process.env.CLIENT_ID || '',
            client_secret: bot ? process.env.BOT_CLIENT_SECRET : process.env.CLIENT_SECRET || '',
            grant_type: 'client_credentials',
            scope: 'channel:read:redemptions channel:manage:redemptions moderator:manage:banned_users channel:manage:vips bits:read channel:read:ads user:manage:whispers channel:read:hype_train' // Include any other scopes needed
        }).toString();

        const response = await axios.post('https://id.twitch.tv/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = response.data;
        return access_token;
    } catch (error: any) {
        console.error('Error obtaining app access token:', error.response ? error.response.data : error.message);
        return null;
    }
}

export async function SubscribeToEventSub() {
    console.log("Attempting to subscribe to EventSub");

    ngrokUrl = await ngrok.connect({
        addr: 3000,
        subdomain: "7arkstream"
    });
    console.log("Started Ngrok")
    console.log("Ngrok URL:", ngrokUrl);

    let existingSub = await FetchEventSubSubscriptions();
    console.log(existingSub)
    if(existingSub !== null){
        for (let i = 0; i < existingSub.data.length; i++) {
            console.log('Found existing subscription. Deleting it to use new ngrok url.');
            await DeleteEventSubSubscription(existingSub.data[i].id);
        }
    }

    let existingSubBot = await FetchEventSubSubscriptions(true);
    if(existingSubBot !== null){
        for (let i = 0; i < existingSubBot.data.length; i++) {
            console.log('Found existing bot subscription. Deleting it to use new ngrok url.');
            await DeleteEventSubSubscription(existingSubBot.data[i].id, true);
        }
    }

    const appAccessToken = await GetAppAccessToken(); // Make sure this function is called to get a fresh app access token
    const botAppAccessToken = await GetAppAccessToken(true); // Make sure this function is called to get a fresh app access token
    if (!appAccessToken) {
        console.log('Failed to obtain app access token. Cannot subscribe to EventSub.');
        return;
    }

    const eventSubscriptions = [
        {
            "type": "channel.channel_points_custom_reward_redemption.add",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": false
        },
        {
            "type": "channel.subscribe",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": true,
            "requiredScopes": ["channel:read:subscriptions"]
        },
        {
            "type": "channel.subscription.message",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": true,
            "requiredScopes": ["channel:read:subscriptions"]
        },
        {
            "type": "channel.raid",
            "condition": {
                "to_broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": false
        },
        {
            "type": "channel.cheer",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": true,
            "requiredScopes": ["bits:read"]
        },
        {
            "type": "channel.ad_break.begin",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": true,
            "requiredScopes": ["channel:read:ads"]
        },
        {
            "type": "channel.hype_train.begin",
            "condition": {
                "broadcaster_user_id": process.env.CHANNEL_ID
            },
            "requiresUserToken": false,
            "requiredScopes": ["channel:read:hype_train"]
        },
        // {
        //     "type": "channel.hype_train.begin",
        //     "condition": {
        //         "broadcaster_user_id": process.env.CHANNEL_ID
        //     },
        //     "requiresUserToken": true,
        //     "requiredScopes": ["channel:read:hype_train"]
        // }
    ];

    for(const eventSub of eventSubscriptions) {
        const subscriptionBody = {
            "type": eventSub.type,
            "version": "1",
            "condition": eventSub.condition,
            "transport": {
                "method": "webhook",
                "callback": `${ngrokUrl}/twitch/callback`,
                "secret": "aSecretString" // Used to generate a signature to verify Twitch notifications
            }
        };

        try {
            const response = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', subscriptionBody, {
                headers: {
                    "Authorization": `Bearer ${appAccessToken}`,
                    "Client-Id": process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                }
            });

            console.log(`Subscription to ${eventSub.type} successful`);
        } catch (error: any) {
            console.error("Error subscribing to EventSub:", error.response.data);
        }
    }

    const botEventSubscriptions = [
        {
            "type": "user.whisper.message",
            "condition": {
                "user_id": process.env.BOT_CHANNEL_ID
            },
            "requiresUserToken": true,
            "requiredScopes": ["user:read:whispers"]
        },
    ];

    // Subscribe for the bot account
    for (const botEventSub of botEventSubscriptions) {
        const subscriptionBody = {
            "type": botEventSub.type,
            "version": "1",
            "condition": botEventSub.condition,
            "transport": {
                "method": "webhook",
                "callback": `${ngrokUrl}/twitch/callback`,
                "secret": "botSecretString" // Used to generate a signature to verify Twitch notifications for the bot
            }
        };

        try {
            const response = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', subscriptionBody, {
                headers: {
                    "Authorization": `Bearer ${botAppAccessToken}`,
                    "Client-Id": process.env.BOT_CLIENT_ID,
                    "Content-Type": "application/json"
                }
            });

            console.log(`Subscription to ${botEventSub.type} successful for bot`);
        } catch (error: any) {
            console.error("Error subscribing to bot EventSub:", error.response?.data || error.message);
        }
    }
}

export async function HandleEventSubResponse(client: Client, req: any) {
    let type = req.body.subscription.type;

    console.log(`Processing Eventsub response for type ${type}`);

    switch (type) {
        case "channel.channel_points_custom_reward_redemption.add":
            await ProcessRedemptions(client, req.body.event.user_name, req.body.event.reward.id, req.body.id, req.body.event.user_input);
            break;
        case "channel.subscribe":
        case "channel.subscription.message":
            await MakeRainbowLights(10);
            break;
        case "channel.raid":
            await MakeRainbowLights(15);
            break;
        case "channel.cheer":
            await ProcessBits(client, req.body.event.user_name, req.body.event.message, req.body.event.bits);
            break;
        case "channel.ad_break.begin":
            await ProcessAds(client, req.body.event.duration_seconds);
            break;
        case "user.whisper.message":
            await OnWhisper(client, req.body.event.whisper.text, req.body.event.from_user_name);
            break;
        case "channel.hype_train.begin":
            await PlayHypeTrainAlert();
            break;
    }

}

export async function BanUser(client: Client, username: string, duration: number, reason?: string) {
    try {
        let userid = await GetUserId(username);
        console.log("user id is " + userid);

        const response = await axios.post(
            `https://api.twitch.tv/helix/moderation/bans`,
            {
                broadcaster_id: Process.env.CHANNEL_ID!,
                moderator_id: Process.env.CHANNEL_ID!,
                data: {
                    user_id: userid!,
                    duration: duration,
                    reason: reason,
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${GetAuthBearerToken()}`,
                    'Client-Id': Process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                },
            }
        );
    } catch (error: any) {
        console.error("Error banning user:", error);
    }
}

export async function GiveUserVIP(client: Client, username: string) {
    try {
        let userid = await GetUserId(username);
        console.log("User ID is " + userid);

        const response = await axios.post(
            `https://api.twitch.tv/helix/channels/vips`,
            null, // No body is required for this endpoint
            {
                params: {
                    broadcaster_id: process.env.CHANNEL_ID!,
                    user_id: userid!,
                },
                headers: {
                    'Authorization': `Bearer ${GetAuthBearerToken()}`,
                    'Client-Id': process.env.CLIENT_ID!,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`Successfully granted VIP status to ${username}`);
    } catch (error: any) {
        console.error("Error granting VIP status to user:", error.response?.data || error.message);
    }
}

export async function RemoveUserVIP(client: Client, username: string) {
    try {
        let userid = await GetUserId(username);
        console.log("User ID is " + userid);

        const response = await axios.delete(
            `https://api.twitch.tv/helix/channels/vips`,
            {
                params: {
                    broadcaster_id: process.env.CHANNEL_ID!,
                    user_id: userid!,
                },
                headers: {
                    'Authorization': `Bearer ${GetAuthBearerToken()}`,
                    'Client-Id': process.env.CLIENT_ID!,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`Successfully removed VIP status from ${username}`);
    } catch (error: any) {
        console.error("Error removing VIP status from user:", error.response?.data || error.message);
    }
}

export async function WhisperUser(client: Client, username: string, message: string) {
    console.log(`Trying to whisper user ${username}: ${message}`)
    // try {
    //     // Fetch the target user's ID based on their username
    //     const targetUserId = await GetUserId(username);
    //     if (!targetUserId) {
    //         console.error(`Could not fetch user ID for username: ${username}`);
    //         return;
    //     }
    //
    //     // Send the whisper using the Helix API
    //     const response = await axios.post(
    //         `https://api.twitch.tv/helix/whispers`,
    //         { message },
    //         {
    //             params: {
    //                 from_user_id: process.env.BOT_CHANNEL_ID!,
    //                 to_user_id: targetUserId,
    //             },
    //             headers: {
    //                 'Authorization': `Bearer ${GetAuthBearerToken(true)}`,
    //                 'Client-Id': process.env.BOT_CLIENT_ID!,
    //                 'Content-Type': 'application/json',
    //             },
    //         }
    //     )
    // } catch (error) {
    //     console.error(`Failed to whisper to ${username}:`, error);
    //     await  client.say(process.env.CHANNEL!, `@${username}, ${message[0].toLowerCase()}${message.substring(1)}`);
    // }
    await client.say(process.env.CHANNEL!, message);
}

export async function GetAdSchedule(broadcasterId: string) {
    try {
        const response = await axios.get(
            `https://api.twitch.tv/helix/channels/ads`,
            {
                params: {
                    broadcaster_id: broadcasterId,
                },
                headers: {
                    'Authorization': `Bearer ${GetAuthBearerToken()}`,
                    'Client-Id': process.env.CLIENT_ID!,
                    'Content-Type': 'application/json',
                },
            }
        );

        // console.log("Ad schedule data:", response.data);
        // console.log(ConvertUnixToDateTime(response.data.data[0].next_ad_at))
        return response.data;
    } catch (error: any) {
        console.error("Error retrieving ad schedule data:", error.response?.data || error.message);
    }
}

async function GetUserId(username: string): Promise<string | null> {
    const url = `https://api.twitch.tv/helix/users?login=${username}`;
    const headers = {
        'Authorization': `Bearer ${GetAuthBearerToken()}`,
        'Client-Id': Process.env.CLIENT_ID,
    };

    try {
        const response = await axios.get(url, { headers });
        if (response.data.data.length > 0) {
            return response.data.data[0].id; // Returns the user ID of the first matching user
        } else {
            console.log('No user found with that username.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}

export async function UpdateViewerCountInfo() {
    try {
        let viewerCount = await GetViewerCount();
        if(viewerCount !== null) {
            let viewerNames: Array<string> = [];
            let sessions = GetAllPlayerSessions();
            sessions = sessions.sort((x,y) => {
                let timeBetweenX = GetSecondsBetweenDates(x.LastMessageTime, new Date());
                let timeBetweenY = GetSecondsBetweenDates(y.LastMessageTime, new Date());

                return (timeBetweenX - timeBetweenY);// || (y.Messages.length - x.Messages.length);
            });

            // console.log(sessions);

            for (let i = 0; i < Math.min(sessions.length, viewerCount); i++) {
                viewerNames.push(sessions[i].NameAsDisplayed);
            }

            Broadcast(JSON.stringify({ type: 'viewerCount', count: viewerCount, names: viewerNames }));
        }
    }
    catch (error: any) {
        console.error("Error updating viewer count:", error.data);

        console.log("Will attempt to refresh token");
        await RefreshAccessToken();
    }
}

export async function GetViewerCount() {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
            params: {
                user_id: process.env.CHANNEL_ID, // Twitch user ID of your channel
            },
            headers: {
                'Authorization': `Bearer ${GetAuthBearerToken()}`, // Use the appropriate token
                'Client-Id': process.env.CLIENT_ID, // Use your app's Client ID
            },
        });

        if (response.data.data && response.data.data.length > 0) {
            const streamData = response.data.data[0];
            // console.log(`Current viewer count: ${streamData.viewer_count}`);
            return streamData.viewer_count;
        } else {
            // console.log('Stream is offline or viewer count not available.');
            return 0;
        }
    } catch (error: any) {
        console.error('Error fetching viewer count:', error.response?.data || error.message);
        return null;
    }
}

export async function CreateTwitchPoll(poll: { title: string, choices: Array<{title: string}>}, pollDuration: number = 60, repeatIfEmpty: boolean = true, callback?: (result: string) => void) {
    if(pollStarted){
        return;
    }
    pollStarted = true;

    const url = 'https://api.twitch.tv/helix/polls';
    const headers = {
        'Authorization': `Bearer ${GetAuthBearerToken()}`,
        'Client-Id': process.env.CLIENT_ID!,
        'Content-Type': 'application/json',
    };
    let data = {
        broadcaster_id: process.env.CHANNEL_ID!,
        title: poll.title,
        choices: poll.choices,
        duration: pollDuration,
    };

    try {
        const response = await axios.post(url, data, {headers});
        console.log('Poll created successfully', response.data.data[0].id);
        mostRecentPollId = response.data.data[0].id;

        setTimeout(async () => {
            pollStarted = false;
            let results = await GetTwitchPollResults(mostRecentPollId);

            if(results == null) {
                return;
            }

            let winners: Array<string> = [];
            let winnerVotes = 0;
            for (let i = 0; i < results.data[0].choices.length; i++) {
                if(results.data[0].choices[i].votes > winnerVotes) {
                    winnerVotes = results.data[0].choices[i].votes;
                }
            }
            for (let i = 0; i < results.data[0].choices.length; i++) {
                if(results.data[0].choices[i].votes === winnerVotes) {
                    winners.push(results.data[0].choices[i].title);
                }
            }

            if(repeatIfEmpty && winnerVotes === 0) {
                setTimeout(() => {
                    CreateTwitchPoll(poll);
                }, 500);
            }
            else {
                let winnerOption = GetRandomItem(winners)!;
                Broadcast(JSON.stringify({ type: 'pollresults', winner: winnerOption}));
                if(callback != undefined) {
                    callback(winnerOption);
                }
            }


        }, pollDuration * 1000 + 1000);
    } catch (error: any) {
        pollStarted = false;
        console.error('Failed to create poll:', error.response.data);

        if(error.response.data.message === 'Invalid OAuth token') {
            await RefreshAccessToken();

            await CreateTwitchPoll(poll);
        }

    }
}

async function GetTwitchPollResults(pollId?: string) {
    const url = `https://api.twitch.tv/helix/polls?broadcaster_id=${process.env.CHANNEL_ID!}${pollId ? `&id=${pollId}` : ''}`;
    const headers = {
        'Authorization': `Bearer ${GetAuthBearerToken()}`,
        'Client-Id': process.env.CLIENT_ID!,
    };

    try {
        const response = await axios.get(url, {headers});

        console.log('Received Poll Results');
        console.log('Poll results:', response.data);
        // for (let i = 0; i < response.data.data[0].choices.length; i++) {
        //     console.log(`Choice #${i}: `, response.data.data[0].choices[i]);
        // }
        return response.data; // Contains information about the poll(s), including results

    } catch (error) {
        console.error('Failed to get poll results:', error);
        return null;
    }
}

export async function CheckNewFollowers(client?: Client) {
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${Process.env.CHANNEL_ID}`, {
            headers: {
                "Accept": "application/vnd.twitchtv.v5+json",
                'Authorization': `Bearer ${GetAuthBearerToken()}`,
                'Client-Id': Process.env.CLIENT_ID,
            }
        });

        let currentFollowers = response.data.total;

        if(lastCheckedFollowerCount == -1) {
            Broadcast(JSON.stringify({ type: 'followerCount', followerCount: currentFollowers }));
        }

        if(lastCheckedFollowerCount != -1) {
            if(currentFollowers != lastCheckedFollowerCount) {
                console.log(`Followers changed to ${currentFollowers}!`);
                Broadcast(JSON.stringify({ type: 'followerCount', followerCount: currentFollowers }));

                lastCheckedFollowerCount = currentFollowers;
            }
        }
    } catch (error: any) {
        console.error("Error checking followers:", error.data);

        if(client !== undefined) {
            console.log("Will attempt to refresh token");
            await RefreshAccessToken();
            await CheckNewFollowers(client);
        }
        else {
            console.trace("Couldnt refresh token because client is undefined");
        }
    }
}

export async function CompleteRedemption(rewardId: string, redemptionId: string) {
    try {
        const response = await axios.patch(
            `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.CHANNEL_ID}&reward_id=${rewardId}&id=${redemptionId}`,
            { status: "FULFILLED" },
            {
                headers: {
                    "Authorization": `Bearer ${GetAuthBearerToken()}`,
                    "Client-Id": process.env.CLIENT_ID!,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`Redemption ${redemptionId} completed successfully`, response.data);
    } catch (error: any) {
        console.error("Error completing redemption:", error.response ? error.response.data : error.message);
    }
}

export async function RejectRedemption(rewardId: string, redemptionId: string) {
    try {
        const response = await axios.patch(
            `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.CHANNEL_ID}&reward_id=${rewardId}&id=${redemptionId}`,
            { status: "CANCELED" },
            {
                headers: {
                    "Authorization": `Bearer ${GetAuthBearerToken()}`,
                    "Client-Id": process.env.CLIENT_ID!,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`Redemption ${redemptionId} rejected successfully`, response.data);
    } catch (error) {
        console.error("Error rejecting redemption:", error.response ? error.response.data : error.message);
    }
}
