import tmi, {ChatUserstate, client, Client} from 'tmi.js';
import dotenv from 'dotenv';
import axios from 'axios';
import WebSocket from 'ws';
import * as Process from "process";
import * as fs from "fs";
import express from "express";
import path from 'path';
import * as http from "http";
import {processCommands} from "./commands";
import {processRedemptions} from "./redemptions";
import {
    getRandomInt,
    getRandomIntI,
    getRandomItem,
    GiveExp, HandleLoadingSession,
    LoadDragonData, LoadPlayerSession, okayVoices,
    playTextToSpeech, SavePlayerSession,
    UpdateSessionTimestamp
} from "./utils";
const ngrok = require('ngrok');
import OBSWebSocket from "obs-websocket-js";
import {connectToObs, disconnectFromObs} from "./obsutils";
import {ClassType, LoadPlayer} from "./playerData";

dotenv.config();


let authToken = process.env.TWITCH_OAUTH_TOKEN;
let refreshToken = process.env.REFRESH_TOKEN;
if(fs.existsSync('tokens.json')){
    const tokensData = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));

    authToken = tokensData.OAUTH_TOKEN;
    refreshToken = tokensData.REFRESH_TOKEN;
}


const options = {
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: authToken,
    },
    channels: ['The7ark'],
};

const app = express();
const PORT = 3000;

// Serve static files from both 'dist' and 'files' directories
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'files')));


app.get('/bottomPanel', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'bottomPanel.html'));
});
app.get('/berightback', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'berightback.html'));
});
app.get('/followerCount', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'followerCount.html'));
});
app.get('/textAdventure', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'textAdventure.html'));
});
app.get('/credits', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'credits.html'));
});

// Setup WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

export interface DragonInfo {
    Health: number;
    MaxHealth: number;
    HitsBeforeAttack: number;
}

export let isDragonActive: boolean = false;
export let sayAllChat: boolean = false;

wss.on('connection', async (ws) => {
    console.log('WebSocket connection established');
    await checkNewFollowers();

    ws.on('message', async (message) => {
        console.log('Received:', JSON.parse(message.toString()));
        let dataType: string = JSON.parse(message.toString()).type;
        switch (dataType) {
            case 'startup':
                let startupData: { type: string, pageType: string } = JSON.parse(message.toString());
                if(startupData.pageType === 'berightback') {
                    isDragonActive = true;

                    let dragonInfo: DragonInfo = LoadDragonData();

                    broadcast(JSON.stringify({ type: 'dragonSetup', info: dragonInfo }));
                }
                break;
            case 'shutdown':
                let shutdownData: { type: string, pageType: string } = JSON.parse(message.toString());
                if(shutdownData.pageType === 'berightback') {
                    isDragonActive = false;
                }
                break;
            case 'poll':
                let pollData: { type: string, poll: { title: string, choices: Array<{title: string}>}, pollDuration?: number } = JSON.parse(message.toString());
                await createPoll(pollData.poll, pollData.pollDuration ?? 60);
                break;
            case 'tts':
                let ttsData: { type: string, text: string } =  JSON.parse(message.toString());
                playTextToSpeech(ttsData.text);
                break;
        }
        // Handle incoming WebSocket messages here
    });
    // // Example: Sending a message to all connected WebSocket clients
    ws.send(JSON.stringify({ type: 'init' }));
});

server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    await connectToObs();

    await initializeBot(); // Call to initialize and connect your Twitch bot

});

export function broadcast(message: string) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

let mostRecentPollId: string = '';

let pollStarted = false;

async function getSubscriptions(paginationCursor: string): Promise<any> {
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${process.env.CHANNEL_ID}`, {
            headers: {
                'Client-Id': process.env.CLIENT_ID,
                'Authorization': `Bearer ${authToken!.replace('oauth:', '')}`,
            },
            params: {
                broadcaster_id: process.env.CHANNEL_ID,
                after: paginationCursor
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return null;
    }
}

export async function createPoll(poll: { title: string, choices: Array<{title: string}>}, pollDuration: number = 60, repeatIfEmpty: boolean = true) {
    if(pollStarted){
        return;
    }
    pollStarted = true;

    const url = 'https://api.twitch.tv/helix/polls';
    const headers = {
        'Authorization': `Bearer ${authToken!.replace('oauth:', '')}`,
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
            let results = await getPollResults(mostRecentPollId);

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
                    createPoll(poll);
                }, 500);
            }
            else {
                broadcast(JSON.stringify({ type: 'pollresults', winner: getRandomItem(winners)}));
            }


        }, pollDuration * 1000 + 1000);
    } catch (error: any) {
        pollStarted = false;
        console.error('Failed to create poll:', error.response.data);

        if(error.response.data.message === 'Invalid OAuth token') {
            await refreshAccessToken();

            await createPoll(poll);
        }

    }
}

async function getPollResults(pollId?: string) {
    const url = `https://api.twitch.tv/helix/polls?broadcaster_id=${process.env.CHANNEL_ID!}${pollId ? `&id=${pollId}` : ''}`;
    const headers = {
        'Authorization': `Bearer ${authToken!.replace('oauth:', '')}`,
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

let lastCheckedFollowerCount = -1;
let ngrokUrl: string = '';

async function initializeBot() {

    app.post('/twitch/callback', express.json(), async (req, res) => {
        // console.log(`${req.body.event.user_name} redeemed ${req.body.event.reward.title}`); // Log the request body to see the structure of incoming notifications.

        if (req.headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
            console.log('Verifying Webhook');
            // Respond with the challenge token provided by Twitch
            res.status(200).send(req.body.challenge);

            // console.log(await getSubscriptions());


            // await createPoll({title: 'Best days to stream?????', choices: [{title: 'Tuesday'}, {title: 'Friday'}, {title: 'Saturday'}, {title: 'Sunday'}]}, 15)
        } else {
            // For all other notifications, you can acknowledge the receipt
            res.sendStatus(200);

            await processRedemptions(client, req.body.event.user_name, req.body.event.reward.id, req.body.id, req.body.event.user_input);
        }

    });

    // app.get('/auth/twitch/callback', (req, res) => {
    //     const authorizationCode = req.query.code;
    //
    //     if (authorizationCode) {
    //         userAuthCode = authorizationCode;
    //         console.log('Retrieved Authorization Code');
    //         // Here you can call getUserAccessToken() with the authorization code
    //         res.send('Authorization code received. You can now close this window.');
    //     } else {
    //         res.status(400).send('Authorization code not found');
    //     }
    // });

    async function fetchEventSubSubscriptions() {
        try {
            const response = await axios.get('https://api.twitch.tv/helix/eventsub/subscriptions', {
                headers: {
                    "Authorization": `Bearer ${await getAppAccessToken()}`,
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

    async function deleteEventSubSubscription(subscriptionId: string) {
        try {
            await axios.delete(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
                headers: {
                    "Authorization": `Bearer ${await getAppAccessToken()}`,
                    "Client-Id": process.env.CLIENT_ID
                }
            });

            console.log("Subscription deleted successfully");
        } catch (error: any) {
            console.error("Error deleting subscription:", error.response ? error.response.data : error.message);
        }
    }

    async function getAppAccessToken() {
        try {
            const params = new URLSearchParams({
                client_id: process.env.CLIENT_ID || '',
                client_secret: process.env.CLIENT_SECRET || '',
                grant_type: 'client_credentials',
                scope: 'channel:read:redemptions channel:manage:redemptions' // Include any other scopes needed
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

    async function subscribeToEventSub() {
        console.log("Attempting to subscribe to EventSub");

        ngrokUrl = await ngrok.connect(3000);
        console.log("Started Ngrok")

        let existingSub = await fetchEventSubSubscriptions();
        if(existingSub !== null){
            for (let i = 0; i < existingSub.data.length; i++) {
                console.log('Found existing subscription. Deleting it to use new ngrok url.');
                await deleteEventSubSubscription(existingSub.data[i].id);
            }
        }

        const appAccessToken = await getAppAccessToken(); // Make sure this function is called to get a fresh app access token
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

    const client = new tmi.Client(options);

    client.connect().catch(async (error) => {
        console.error('Failed to connect:', error);

        console.error('attempting to refresh token');

        await refreshAccessTokenAndReconnect(client);

    });

    await subscribeToEventSub();
//WS
//     const ws = new WebSocket.Server({ port: 8080 });


    client.on('message', messageHandler);
    // client.on('redeem', redeemHandler);

    // let redeemMessageMapper : Map<string, string> = new Map<string, string>();


    async function messageHandler(channel: string, userstate: ChatUserstate, message: string, self: boolean) {
        if (self) return; // Ignore messages from the bot

        await onMessage(channel, userstate, message, userstate);
    }
    async function onMessage(channel: string, userstate: ChatUserstate, message: string, userState: ChatUserstate){
        let displayName = userstate['display-name']!;
        console.log(`${displayName}: ${message}`);

        if(!displayName.includes("the7ark")) {
            hasBeenMessageSinceLastRegularMessage = true;
        }

        // if(message.toLowerCase().includes("water") && !displayName.includes("the7ark")) {
        //     if(message.length > 7) {
        //         let textToSay = "Spawning water";
        //
        //         if(message.toLowerCase().replace(" ", "").includes("waterwater")) {
        //             textToSay = "Spawning small water";
        //         }
        //         else {
        //             let count = (message.toLowerCase().match(new RegExp("water", "g")) || []).length;
        //             if(count >= 4) {
        //                 textToSay = "Spawning big water";
        //             }
        //             else if(count > 1) {
        //                 textToSay = "Spawning even more water";
        //             }
        //         }
        //
        //         if(!message.toLowerCase().includes("!yell")) {
        //             playTextToSpeech(textToSay, "en-US-SteffanNeural");
        //         }
        //         else {
        //             setTimeout(() => {
        //                 playTextToSpeech(textToSay, "en-US-SteffanNeural");
        //             }, message.length * 70);
        //         }
        //     }
        //     else {
        //         client.say(process.env.CHANNEL!, `@${userState['display-name']!}, be more creative when talking about water`);
        //     }
        // }

        if(sayAllChat && message[0] != '!' && !displayName.includes("the7ark")) {
            let player = LoadPlayer(userState['display-name']!);
            playTextToSpeech(message, player.Voice === undefined || player.Voice === "" ? getRandomItem(okayVoices)!.voice : player.Voice);
        }

        let col = userState.color;
        broadcast(JSON.stringify({ type: 'message', displayName, message, color: col }));

        let session = LoadPlayerSession(displayName)
        if(message[0] === '!'){
            if(message.includes("!yell")) {
                session.Messages.push(message.replace("!yell", "").trim());
            }

            await processCommands(client, userState, message);
        }
        else {
            //EXP
            randomlyGiveExp(client, displayName, 5, getRandomIntI(1, 2))

            session.Messages.push(message.trim());
        }
        SavePlayerSession(displayName, session);
    }

    let hasBeenMessageSinceLastRegularMessage: boolean = true;
    const regularMessages: Array<string> = [
        "Come hang out on our Discord, to chat, give stream suggestions, and get go live notification. Join here: https://discord.gg/A7R5wFFUWG",
        "Use any amount of bits to cheer, or the 'Yell at Me' channel point redemption, or just use !yell to yell at me in text to speech live on stream!",
        "Have an idea to make the stream more exciting? Use the 'Offer Side Quest' channel point redemption to propose a change.",
        "If you see any funny moments during stream, clipping them is much appreciated!",
        "Follow me on Twitter for information about streams, as well as my personal projects: https://twitter.com/The7ark",
        "I'm a game developer! Feel free to ask questions or talk about code. I've also released a game called Battle Tracks, find more in the stream description."
    ];
    let regularMessageIndex: number = getRandomInt(0, regularMessages.length);

    async function postNewRegularMessage() {
        if(!hasBeenMessageSinceLastRegularMessage) {
            return;
        }

        client.say(process.env.CHANNEL!, regularMessages[regularMessageIndex]);

        regularMessageIndex++;
        if(regularMessageIndex >= regularMessages.length) {
            regularMessageIndex = 0;
        }

        hasBeenMessageSinceLastRegularMessage = false;
    }
    // setInterval(triggerWater, 240000); //4 minutes
    //
    // function triggerWater() {
    //     broadcast(JSON.stringify({ type: 'specialrisemessagethatisunique' }));
    //     playTextToSpeech("Raising the sea level", "en-US-SteffanNeural");
    // }

    setInterval(postNewRegularMessage, 1800000); //30 minutes

    setInterval(checkNewFollowersInterval, 60000); //1 minute
    await checkNewFollowers(client);

    async function checkNewFollowersInterval() {
        await checkNewFollowers(client);
    }
}

export function randomlyGiveExp(client: Client, username: string, chanceOutOfTen: number, exp: number) {
    let chance = Math.random() * 10;
    if(chance <= chanceOutOfTen) {
        GiveExp(client, username, getRandomIntI(1, 2));
    }
}


async function checkNewFollowers(client?: Client) {
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${Process.env.CHANNEL_ID}`, {
            headers: {
                "Accept": "application/vnd.twitchtv.v5+json",
                'Authorization': `Bearer ${authToken!.replace('oauth:', '')}`,
                'Client-Id': Process.env.CLIENT_ID,
            }
        });

        let currentFollowers = response.data.total;

        if(lastCheckedFollowerCount == -1) {
            broadcast(JSON.stringify({ type: 'followerCount', followerCount: currentFollowers }));
        }

        if(lastCheckedFollowerCount != -1) {
            if(currentFollowers != lastCheckedFollowerCount) {
                console.log(`Followers changed to ${currentFollowers}!`);
                broadcast(JSON.stringify({ type: 'followerCount', followerCount: currentFollowers }));

                lastCheckedFollowerCount = currentFollowers;
            }
        }
    } catch (error: any) {
        console.error("Error checking followers:", error.data);

        if(client !== undefined) {
            console.log("Will attempt to refresh token");
            await refreshAccessToken();
            await checkNewFollowers(client);
        }
        else {
            console.trace("Couldnt refresh token because client is undefined");
        }
    }
}

async function refreshAccessToken() {
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

async function refreshAccessTokenAndReconnect(client: Client) {
    try {
        await refreshAccessToken()

        await client.connect();
    } catch (error) {
        console.error('Failed to refresh token:', error);
    }
}

HandleLoadingSession();

process.on('SIGINT', (code) => {
    console.log(`About to exit with code: ${code}`);

    UpdateSessionTimestamp();

    // exec('taskkill /F /IM ngrok.exe');
    ngrok.disconnect(ngrokUrl);
    ngrok.kill();


    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });

    disconnectFromObs();
});
