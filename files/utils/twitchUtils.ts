import axios from "axios";
import fs from "fs";
import {Client} from "tmi.js";
import Process from "process";
import ngrok from "ngrok";
import {GetRandomItem} from "./utils";
import {Broadcast, options} from "../bot";
const ngrok = require('ngrok');

let ngrokUrl: string = '';
let mostRecentPollId: string = '';
let pollStarted = false;
let hasAuthBeenSet = false;
let lastCheckedFollowerCount = -1;

let authToken = process.env.TWITCH_OAUTH_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;
if(fs.existsSync('tokens.json')){
    const tokensData = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));

    authToken = tokensData.OAUTH_TOKEN;
    refreshToken = tokensData.REFRESH_TOKEN;

    hasAuthBeenSet = true;
}

export function GetAuthToken() {
    if(!hasAuthBeenSet && fs.existsSync('tokens.json')){
        const tokensData = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));

        authToken = tokensData.OAUTH_TOKEN;
        refreshToken = tokensData.REFRESH_TOKEN;
    }

    return authToken;
}

export function GetAuthBearerToken() {
    let token = GetAuthToken();

    return token!.replace('oauth:', '');
}

export function GetNgrokURL() {
    return ngrokUrl;
}

async function RefreshAccessToken() {
    try {
        // Construct the request body as form data
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken!);
        params.append('client_id', process.env.CLIENT_ID!);
        params.append('client_secret', process.env.CLIENT_SECRET!);

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
        authToken = `oauth:${access_token}`;
        refreshToken = refresh_token;

        fs.writeFileSync('tokens.json', JSON.stringify({
            OAUTH_TOKEN: authToken,
            REFRESH_TOKEN: refreshToken,
        }), 'utf-8')

        // Update the client's token
        options.identity.password = `oauth:${access_token}`;
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}

export async function RefreshAccessTokenAndReconnect(client: Client) {
    try {
        await RefreshAccessToken()

        await client.connect();
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}


async function FetchEventSubSubscriptions() {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
            headers: {
                "Authorization": `Bearer ${await GetAppAccessToken()}`,
                "Client-Id": process.env.CLIENT_ID
            }
        });

        console.log("Existing subscriptions:", response.data.length);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching EventSub subscriptions:", error.response ? error.response.data : error.message);
        return null;
    }
}

async function DeleteEventSubSubscription(subscriptionId: string) {
    try {
        await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
            headers: {
                "Authorization": `Bearer ${await GetAppAccessToken()}`,
                "Client-Id": process.env.CLIENT_ID
            }
        });

        console.log("Subscription deleted successfully");
    } catch (error: any) {
        console.error("Error deleting subscription:", error.response ? error.response.data : error.message);
    }
}

async function GetAppAccessToken() {
    try {
        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID || '',
            client_secret: process.env.CLIENT_SECRET || '',
            grant_type: 'client_credentials',
            scope: 'channel:read:redemptions channel:manage:redemptions moderator:manage:banned_users' // Include any other scopes needed
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

    ngrokUrl = await ngrok.connect(3000);
    console.log("Started Ngrok")

    let existingSub = await FetchEventSubSubscriptions();
    if(existingSub !== null){
        for (let i = 0; i < existingSub.data.length; i++) {
            console.log('Found existing subscription. Deleting it to use new ngrok url.');
            await DeleteEventSubSubscription(existingSub.data[i].id);
        }
    }

    const appAccessToken = await GetAppAccessToken(); // Make sure this function is called to get a fresh app access token
    if (!appAccessToken) {
        console.log('Failed to obtain app access token. Cannot subscribe to EventSub.');
        return;
    }

    const subscriptionBody = {
        "type": "channel.channel_points_custom_reward_redemption.add",
        "version": "1",
        "condition": {
            "broadcaster_user_id": process.env.CHANNEL_ID
        },
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

        console.log("Subscription successful");
    } catch (error: any) {
        console.error("Error subscribing to EventSub:", error.response.data);
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


export async function CreatePoll(poll: { title: string, choices: Array<{title: string}>}, pollDuration: number = 60, repeatIfEmpty: boolean = true, callback?: (result: string) => void) {
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
        duration: pollDuration, // 120 Duration in seconds (2 minutes in this example)
    };

    try {
        const response = await axios.post(url, data, {headers});
        console.log('Poll created successfully', response.data.data[0].id);
        mostRecentPollId = response.data.data[0].id;

        setTimeout(async () => {
            pollStarted = false;
            let results = await GetPollResults(mostRecentPollId);

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
                    CreatePoll(poll);
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

            await CreatePoll(poll);
        }

    }
}

async function GetPollResults(pollId?: string) {
    const url = `https://api.twitch.tv/helix/polls?broadcaster_id=${process.env.CHANNEL_ID!}${pollId ? `&id=${pollId}` : ''}`;
    const headers = {
        'Authorization': `Bearer ${GetAuthBearerToken()}`,
        'Client-Id': process.env.CLIENT_ID!,
    };

    try {
        const response = await axios.get(url, {headers});

        console.log('Received Poll Results');
        // console.log('Poll results:', response.data);
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
