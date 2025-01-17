import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from "fs";

dotenv.config();

const isBotMode = process.argv.includes('--bot');

const app = express();
const port = 3000; // Port where your local server will run

const clientID = isBotMode ? process.env.BOT_CLIENT_ID : process.env.CLIENT_ID as string;
const clientSecret = isBotMode ? process.env.BOT_CLIENT_SECRET : process.env.CLIENT_SECRET as string;
const redirectURI = 'http://localhost:3000/auth/twitch/callback'; // Must match one of the redirect URIs registered in Twitch Developer Console
const scopes = 'chat:read chat:edit channel:read:redemptions channel:manage:redemptions channel:manage:polls channel:read:subscriptions moderator:manage:banned_users channel:manage:vips bits:read channel:read:ads user:manage:whispers channel:read:hype_train'; // Add other scopes as needed

// Redirect users to Twitch for authorization
app.get('/auth/twitch', (req: any, res: any) => {
    const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectURI)}&scope=${encodeURIComponent(scopes)}`;
    res.redirect(twitchAuthURL);
});

// Twitch OAuth callback
app.get('/auth/twitch/callback', async (req: any, res: any) => {
    const code = req.query.code as string;
    try {
        const response = await axios.post(`https://id.twitch.tv/oauth2/token`, null, {
            params: {
                client_id: clientID,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectURI,
            },
        });
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        // console.log('Access Token:', accessToken);
        // console.log('Refresh Token:', refreshToken);
        // console.log(response.data);
        let tokensPath = isBotMode ? `tokensbot.json` : `tokens.json`;

        fs.writeFileSync(tokensPath, JSON.stringify({
            OAUTH_TOKEN: `oauth:${accessToken}`,
            REFRESH_TOKEN: refreshToken
        }), 'utf-8')
        res.send('Authentication successful! You can close this window.'); // Notify the user
    } catch (error) {
        console.error('Error exchanging code for token', error);
        res.status(500).send('Authentication failed');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/auth/twitch`);
});
