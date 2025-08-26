import tmi, {ChatUserstate} from 'tmi.js';
import dotenv from 'dotenv';
import * as WebSocket from 'ws';
import express from "express";
import path from 'path';
import * as http from "http";
import {ConnectToObs, DisconnectFromObs, SetSceneItemEnabled, ToggleObject} from "./utils/obsutils";
import {OnMessage, PostNewRegularMessage} from "./utils/messageUtils";
import {
    CheckNewFollowers,
    GetAuthToken,
    GetNgrokURL,
    HandleEventSubResponse,
    RefreshBotAccessTokenAndReconnect,
    SubscribeToEventSub,
    UpdateViewerCountInfo
} from "./utils/twitchUtils";
import {ReceiveMessageFromHTML} from "./utils/htmlUtils";
import {GetAllPlayerSessions, HandleLoadingSession, UpdateSessionTimestamp} from "./utils/playerSessionUtils";
import {TryToStartRandomChatChallenge} from "./utils/chatGamesUtils";
import {LoadAllPlayers, SavePlayer, TickAllCozyPoints} from "./utils/playerGameUtils";
import {InitialMonsterSetup, LoadMonsterData, SetupMonsterDamageTypes, TickAfflictions} from "./utils/monsterUtils";
import {CurrentStreamSettings} from "./streamSettings";
import {FadeOutLights, SetLightVisible} from "./utils/lightsUtils";
import {LoadProgressBar} from "./utils/progressBarUtils";
import {SetupNextAdsTime} from "./utils/adUtils";
import {SelectCustomer} from "./utils/cookingSimUtils";
import {InitializeGroceryStore, InitializeSalesman} from "./utils/shopUtils";
import {WipePlayerGatherState} from "./utils/gatherUtils";
import {SelectRole} from "./utils/angelDevilUtils";
import {ClearMeeting} from "./utils/meetingUtils";
import {SetupPlayerTravel, SetupWorldGrid} from "./utils/locationUtils";
import {DisplayAsList, GetSecondsBetweenDates} from "./utils/utils";
import {Player} from "./valueDefinitions";
import {MinigameType, StartMinigame} from "./utils/minigameUtils";
import {GetUserMinigameCount} from "./actionqueue";

const ngrok = require('ngrok');

dotenv.config();

export const options = {
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: GetAuthToken(true),
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
app.get('/minigame', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'minigame.html'));
});
app.get('/progressBar', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'progressBar.html'));
});
app.get('/poll', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'files', 'html', 'pollDisplay.html'));
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

let initialized = false;
let turningOff = false;

async function InitializeBot() {

    app.post('/twitch/callback', express.json(), async (req, res) => {
        // console.log(`${req.body.event.user_name} redeemed ${req.body.event.reward.title}`); // Log the request body to see the structure of incoming notifications.

        if (req.headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
            console.log('Verifying Webhook');
            // Respond with the challenge token provided by Twitch
            res.status(200).send(req.body.challenge);

            if(initialized){
                return;
            }

            initialized = true;

            // console.log(await getSubscriptions());

            console.log("Finishing initialization");

            //Toggle objects automatically

            try {
                await ToggleObject("Dragon Fight")
                await ToggleObject("Bottom Stickmen")
                // await ToggleObject("Follower Count")
                await ToggleObject("Credits")
                await ToggleObject("Special Display")
                await ToggleObject("Minigames")
                await ToggleObject("Progress Bar")
                await ToggleObject("ProgressBar")
                await SetSceneItemEnabled("Poll", false);
                await SetSceneItemEnabled("PollBig", false);
                // await ToggleObject("Chat")

                //Broadcast delay
                setTimeout(() => {
                    let sessions = GetAllPlayerSessions();
                    for (let i = 0; i < sessions.length; i++) {
                        Broadcast(JSON.stringify({ type: 'addstickman', displayName: sessions[i].NameAsDisplayed, color: sessions[i].NameColor }));
                    }

                    LoadProgressBar();

                }, 200);

                await SetupWorldGrid();
                await SetupPlayerTravel(client);
                await ClearMeeting();
                await SetLightVisible(true);
                await FadeOutLights();
                await SetupNextAdsTime();
            }
            catch (error) {
                console.error(error)
            }

            console.log("Initialized");
            await client.say(process.env.CHANNEL!, `THE CODE HAS TURNED ON. You may game.`);

        } else {
            // For all other notifications, you can acknowledge the receipt
            res.sendStatus(200);

            // console.log(req.body);
            await HandleEventSubResponse(client, req);
            // await ProcessRedemptions(client, req.body.event.user_name, req.body.event.reward.id, req.body.id, req.body.event.user_input);
        }

    });


    const client = new tmi.Client(options);

    client.connect().catch(async (error) => {
        console.error('Failed to connect:', error);

        console.error('attempting to refresh token');

        await RefreshBotAccessTokenAndReconnect(client);

    });

    await SubscribeToEventSub();

    client.on('message', MessageHandler);

    async function MessageHandler(channel: string, userstate: ChatUserstate, message: string, self: boolean) {
        if (self) return; // Ignore messages from the bot

        await OnMessage(client, userstate, message);
    }
    // client.on('redeem', redeemHandler);

    // let redeemMessageMapper : Map<string, string> = new Map<string, string>();
    // await CheckNewFollowers(client);
    //
    // async function CheckNewFollowersInterval() {
    //     await CheckNewFollowers(client);
    // }

    // setInterval(CheckNewFollowersInterval, 60000); //1 minute
    setInterval(UpdateViewerCountInfo, 10000); //10 seconds

    setInterval(() => {
        PostNewRegularMessage(client);
    }, 840000); //14 minutes

    if(CurrentStreamSettings.doesRandomChatChallenges) {
        setInterval(() => {
            TryToStartRandomChatChallenge(client);
        }, 1800000); //30 minutes
    }

    if(CurrentStreamSettings.challengeType == "cook") {
        setInterval(() => {
            SelectCustomer(client);
        }, 1000 * 60 * 3);
    }
    if(CurrentStreamSettings.challengeType == "angeldevil") {
        setInterval(() => {
            SelectRole(true, client);
            SelectRole(false, client);
        }, 1000 * 60 * 3);
    }

    setInterval(() => {
        TickAllCozyPoints();
    }, 1800000); //30 minutes

    setInterval(() => {
        TickAfflictions(client);
    }, 1000 * 15); //15 seconds

    //Auto minigames
    setInterval(async () => {
        let allPlayersWithAuto = LoadAllPlayers().filter(p => p.AutoMinigameStartTime != undefined);

        if(allPlayersWithAuto.length == 0) {
            return;
        }

        let expiredPlayers: Array<Player> = [];
        for (let i = 0; i < allPlayersWithAuto.length; i++) {
            let player = allPlayersWithAuto[i];

            let secondsBetween = GetSecondsBetweenDates(new Date(player.AutoMinigameStartTime!), new Date());
            if(secondsBetween >= 60 * 30) {
                player.AutoMinigameStartTime = undefined;
                SavePlayer(player);
                expiredPlayers.push(player);
            }
            else {
                let activeInstances = GetUserMinigameCount(player.Username);
                if(activeInstances > 0) {
                    return;
                }

                let games = player.AutoMinigamePattern!.split(' ');
                for (let i = 0; i < games.length; i++) {
                    switch (games[i]) {
                        case `mine`:
                            await StartMinigame(client, player.Username, MinigameType.Mine, false);
                            break;
                        case `cook`:
                            await StartMinigame(client, player.Username, MinigameType.Cook, false);
                            break;
                        case `fish`:
                            await StartMinigame(client, player.Username, MinigameType.Fish, false);
                            break;
                    }
                }
            }
        }
        if(expiredPlayers.length > 0) {
            await client.say(process.env.CHANNEL!, `${DisplayAsList(expiredPlayers, p => `@${p.Username}`)}, your auto-minigame has run out. You can start another with !auto again.`);
        }

    }, 1000 * 30); //30 seconds

    setInterval(() => {
        SetupMonsterDamageTypes();

        let monsterStats = LoadMonsterData().Stats;
        client.say(process.env.CHANNEL!, `${monsterStats.Name} is adapting! Resistances, vulnerabilities, and immunities have all changed. Watch out!`);

        // PlaySound("santa", AudioType.ImportantStreamEffects);
        // client.say(process.env.CHANNEL!, `The sounds of jingle bells can be heard flying overhead... SANTA IS COMING! Gifts are falling from the sky! Type !gift in the next 60 seconds to get a gift!`);
        // CanGrabGifts = true;
        // setTimeout(() => {
        //     CanGrabGifts = false;
        // }, 1000 * 60)
        }, 1800000); //30 minutes

    await InitialMonsterSetup();

    process.on('SIGINT', async (code) => {
        if(turningOff) {
            return;
        }

        turningOff = true;
        await client.say(process.env.CHANNEL!, `THE CODE IS TURNING OFF! This may mean Cory is restarting it, or it may mean it has broken.`);

    });

}

// export let CanGrabGifts: boolean = false;

HandleLoadingSession();
InitializeSalesman();
InitializeGroceryStore();
WipePlayerGatherState();


process.on('SIGINT', async (code) => {
    await SetLightVisible(false);
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
