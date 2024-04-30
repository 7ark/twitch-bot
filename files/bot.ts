import tmi, {ChatUserstate} from 'tmi.js';
import dotenv from 'dotenv';
import * as WebSocket from 'ws';
import express from "express";
import path from 'path';
import * as http from "http";
import {ProcessRedemptions} from "./redemptions";
const ngrok = require('ngrok');
import {ConnectToObs, DisconnectFromObs, ToggleObject} from "./utils/obsutils";
import {OnMessage, PostNewRegularMessage} from "./utils/messageUtils";
import {
    CheckNewFollowers,
    GetAuthToken, GetNgrokURL,
    RefreshAccessTokenAndReconnect,
    SubscribeToEventSub
} from "./utils/twitchUtils";
import {ReceiveMessageFromHTML} from "./utils/htmlUtils";
import {GetAllPlayerSessions, HandleLoadingSession, UpdateSessionTimestamp} from "./utils/playerSessionUtils";

dotenv.config();

export const options = {
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: GetAuthToken(),
    },
    channels: ['The7ark'],
};

const app = express();
const PORT = 3000;

// Serve static files from both 'dist' and 'files' directories
// app.use(express.static(path.join(__dirname, '..', 'dist', 'html')));
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'files')));

app.get('/followerCount', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'followerCount.html'));
});
app.get('/bottomPanel', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'bottomPanel.html'));
});
app.get('/berightback', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'berightback.html'));
});
app.get('/textAdventure', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'textAdventure.html'));
});
app.get('/credits', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'credits.html'));
});
app.get('/specialDisplay', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'specialdisplay.html'));
});
app.get('/extension', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'extension.html'));
});

// Setup WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


wss.on('connection', async (ws) => {
    console.log('WebSocket connection established');
    await CheckNewFollowers();

    ws.on('message', async (message) => {
        await ReceiveMessageFromHTML(message.toString());
    });
    // // Example: Sending a message to all connected WebSocket clients
    ws.send(JSON.stringify({ type: 'init' }));
});

server.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    await ConnectToObs();

    await InitializeBot(); // Call to initialize and connect your Twitch bot

});

export function Broadcast(message: string) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

async function InitializeBot() {

    app.post('/twitch/callback', express.json(), async (req, res) => {
        // console.log(`${req.body.event.user_name} redeemed ${req.body.event.reward.title}`); // Log the request body to see the structure of incoming notifications.

        if (req.headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
            console.log('Verifying Webhook');
            // Respond with the challenge token provided by Twitch
            res.status(200).send(req.body.challenge);

            // console.log(await getSubscriptions());

            console.log("Finishing initialization");

            //Toggle objects automatically

            try {
                await ToggleObject("Dragon Fight")
                await ToggleObject("Bottom Stickmen")
                await ToggleObject("Follower Count")
                await ToggleObject("Credits")
                await ToggleObject("Special Display")
                await ToggleObject("Chat")

                setTimeout(() => {
                    let sessions = GetAllPlayerSessions();
                    for (let i = 0; i < sessions.length; i++) {
                        Broadcast(JSON.stringify({ type: 'addstickman', displayName: sessions[i].NameAsDisplayed, color: sessions[i].NameColor }));
                    }
                }, 200);
            }
            catch (error) {
                console.error(error)
            }

            console.log("Initialized");
        } else {
            // For all other notifications, you can acknowledge the receipt
            res.sendStatus(200);

            await ProcessRedemptions(client, req.body.event.user_name, req.body.event.reward.id, req.body.id, req.body.event.user_input);
        }

    });


    const client = new tmi.Client(options);

    client.connect().catch(async (error) => {
        console.error('Failed to connect:', error);

        console.error('attempting to refresh token');

        await RefreshAccessTokenAndReconnect(client);

    });

    await SubscribeToEventSub();

    client.on('message', MessageHandler);

    async function MessageHandler(channel: string, userstate: ChatUserstate, message: string, self: boolean) {
        if (self) return; // Ignore messages from the bot

        await OnMessage(client, channel, userstate, message, userstate);
    }
    // client.on('redeem', redeemHandler);

    // let redeemMessageMapper : Map<string, string> = new Map<string, string>();
    await CheckNewFollowers(client);

    async function CheckNewFollowersInterval() {
        await CheckNewFollowers(client);
    }

    setInterval(CheckNewFollowersInterval, 60000); //1 minute

    setInterval(() => {
        PostNewRegularMessage(client);
    }, 900000); //15 minutes

}

HandleLoadingSession();

process.on('SIGINT', (code) => {
    console.log(`About to exit with code: ${code}`);

    UpdateSessionTimestamp();

    // exec('taskkill /F /IM ngrok.exe');
    ngrok.disconnect(GetNgrokURL());
    ngrok.kill();


    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });

    DisconnectFromObs();
});
