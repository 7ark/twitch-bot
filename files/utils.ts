import fs from "fs";
import {broadcast, DragonInfo} from "./bot";
import {calculateMaxHealth, ChangePlayerHealth, ClassType, LoadPlayer, SavePlayer} from "./playerData";
import {exec} from "child_process";
import {rotateOBSSource, setFilterEnabled} from "./obsutils";
import play, { AudioPlayHandle } from "audio-play";
import {Client} from "tmi.js";
import exp from "constants";
// import {Howl} from 'howler';
const load = require('audio-loader');
const SpeechSDK = require("microsoft-cognitiveservices-speech-sdk");
// const Audio = require('audic');
// const Speaker = require('speaker');
// const lame = require('lame');

export interface PlayerSessionData {
    NameAsDisplayed: string;
    Messages: Array<string>;
    TimesAttackedEnemy: number;
}

let allPlayerSessionData: Map<string, PlayerSessionData> = new Map<string, PlayerSessionData>();
let timestamp: Date;
let audioPaused = false;

export function MuteAudio() {
    audioPaused = true;
    exec('SoundVolumeView.exe /Mute node.exe', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('Muting audio');
    });
}

export function ResumeAudio() {
    audioPaused = false;
    exec('SoundVolumeView.exe /Unmute node.exe', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('Unmuting audio');
    });
}

export function IsAudioPaused(): boolean {
    return audioPaused;
}

export function UpdatePlayerSessionData() {

    if(fs.existsSync('playersessions.json')) {
        let loadedInfo = JSON.parse(fs.readFileSync('playersessions.json', 'utf-8'));
        allPlayerSessionData = Array.isArray(loadedInfo.data) ? new Map<string, PlayerSessionData>(loadedInfo.data) : new Map<string, PlayerSessionData>();

        if(allPlayerSessionData === undefined || allPlayerSessionData === null) {
            allPlayerSessionData = new Map<string, PlayerSessionData>();
        }
    }
    else {
        allPlayerSessionData = new Map<string, PlayerSessionData>();
    }
}

export function LoadPlayerSession(displayName: string) {
    let fullDisplayName = displayName;
    let session: PlayerSessionData = {
        NameAsDisplayed: fullDisplayName,
        Messages: [],
        TimesAttackedEnemy: 0
    }
    displayName = displayName.toLowerCase();

    UpdatePlayerSessionData();

    if(allPlayerSessionData.has(displayName)) {
        session = allPlayerSessionData.get(displayName)!;
    }

    return session;
}

export function SavePlayerSession(displayName: string, session: PlayerSessionData) {
    displayName = displayName.toLowerCase();
    allPlayerSessionData.set(displayName, session);

    timestamp = new Date();

    fs.writeFileSync('playersessions.json', JSON.stringify({
        data: Array.from(allPlayerSessionData),
        timestamp: timestamp.toISOString()
    }));
}

export function UpdateSessionTimestamp() {
    timestamp = new Date();

    fs.writeFileSync('playersessions.json', JSON.stringify({
        data: Array.from(allPlayerSessionData),
        timestamp: timestamp
    }));
}

export function GetStringifiedSessionData(): string {
    return JSON.stringify(Array.from(allPlayerSessionData));
}

export function HandleLoadingSession() {
    if(fs.existsSync('playersessions.json')) {
        let loadedInfo = JSON.parse(fs.readFileSync('playersessions.json', 'utf-8'));
        timestamp = new Date(loadedInfo.timestamp);

        const hourDifference = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        if (hourDifference > 1) {
            console.log("Wiping Player Session Info")
            fs.unlinkSync('playersessions.json')
        }
    }

}

export function getRandomIntI(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}
export function getRandomInt(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min) + min);
}

export function LoadDragonData(): DragonInfo {
    let dragonInfo: DragonInfo = {
        Health: 500,
        MaxHealth: 500,
        HitsBeforeAttack: 10
    }

    if(fs.existsSync('boss.json')) {
        dragonInfo = JSON.parse(fs.readFileSync('boss.json', 'utf-8'));
    }

    if(dragonInfo.HitsBeforeAttack === undefined || dragonInfo.HitsBeforeAttack <= 0) {
        dragonInfo.HitsBeforeAttack = getRandomIntI(10, 15);
    }

    return dragonInfo;
}

export function TriggerDragonAttack(client: Client) {
    UpdatePlayerSessionData();
    
    let highestNumberOfAttacks = 0;
    allPlayerSessionData.forEach(player => {
        if(player.TimesAttackedEnemy > highestNumberOfAttacks) {
            highestNumberOfAttacks = player.TimesAttackedEnemy;
        }
    })
    
    client.say(process.env.CHANNEL!, `Bytefire is attacking!`);

    allPlayerSessionData.forEach(player => {
        if(player.TimesAttackedEnemy !== 0 && (player.TimesAttackedEnemy !== 1 || getRandomIntI(0, 1) === 0)) {
            let playerClassInfo = LoadPlayer(player.NameAsDisplayed.toLowerCase());

            //Try to hit
            let roll = getRandomIntI(1, 20) + 5;
            let ac = 10 + Math.floor(playerClassInfo.Classes[ClassType.Rogue].Level / 3) + Math.floor(playerClassInfo.Classes[ClassType.Warrior].Level / 5);

            if(roll < ac) {
                client.say(process.env.CHANNEL!, `Bytefire missed ${playerClassInfo.Username} after rolling a ${roll}!`);
            }
            else {
                let damagePercentage = player.TimesAttackedEnemy / highestNumberOfAttacks;

                let maxDamage = Math.floor(calculateMaxHealth(playerClassInfo) * (roll === 25 ? 0.6 : 0.3));

                let damage = Math.floor(maxDamage * damagePercentage);

                if(damage > 0) {
                    ChangePlayerHealth(client, playerClassInfo.Username, -damage);
                }
            }
        }
    });
    // for (const playerName in playerData) {
    //     let player = allPlayerSessionData.get(playerName)!;
    //
    //     player.TimesAttackedEnemy = 0;
    //     SavePlayerSession(playerName, player);
    // }
}

export function SaveDragonData(dragon: DragonInfo) {
    fs.writeFileSync('boss.json', JSON.stringify(dragon));
}

export function getRandomItem<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export async function setMonitorRotationTemporarily(rotation: number, timeInSeconds: number) {
    await changeDisplayOrientation(rotation);

    await setTimeout(() => {
        changeDisplayOrientation(0);
    }, timeInSeconds * 1000);
}

// DO NOT CALL THIS FUNCTION ON ITS OWN (Or monitor gets stuck without changing back)
async function changeDisplayOrientation(rotation: number) {
    const command = `display.exe /device 1 /rotate:${rotation}`;

    await rotateOBSSource("Main Display", "Streaming Primary", rotation);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

export async function setMonitorBrightnessContrastTemporarily(value: number, timeInSeconds: number) {
    await setMonitorBrightness(value);
    setTimeout(async () => {
        await setMonitorContrast(value);
    }, 200);

    await setFilterEnabled("Main Display", "Shroud Filter", true);

    await setTimeout(async () => {
        await setMonitorBrightness(87);
        setTimeout(async () => {
            await setMonitorContrast(56);
        }, 200);

        await setFilterEnabled("Main Display", "Shroud Filter", false);
    }, timeInSeconds * 1000);
}

async function setMonitorBrightness(value: number) {
    const command = `display.exe /device 1 /brightness:${value}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

async function setMonitorContrast(value: number) {
    const command = `display.exe /device 1 /contrast:${value}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegPath!);
function convertMp3ToWav(mp3FilePath: string, wavFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(mp3FilePath)
            .toFormat('wav')
            .on('error', (err) => {
                console.error('An error occurred: ' + err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('Conversion finished!');
                resolve();
            })
            .save(wavFilePath);
    });
}

export function playSound(soundName: string, extension: string = "wav") {
    try {
        
        load(`files/extras/${soundName}.${extension}`).then(play);
        
        // audioBuffer.then((buffer) => {
        //     let playHandle: AudioPlayHandle = play(buffer, {
        //         start: 0,
        //         end: buffer.duration
        //     }, onEnd);
        //
        //     console.log("test " + playHandle.currentTime)
        //
        //     audioPlayers.push(playHandle);
        //
        //     if(audioPaused) {
        //         playHandle.pause();
        //     }
        //     else {
        //         setTimeout(() => {
        //             deleteAudio(playHandle);
        //         }, playHandle.currentTime);
        //     }
        // })

        // .then(play);

        // playAudioFile(`files/extras/${soundName}.${extension}`);

        // const speaker = new Speaker({
        //     channels: 2,
        //     bitDepth: 16,
        //     sampleRate: 44100
        // });
        //
        // process.stdin.pipe(speaker);

    }
    catch (e) {
        console.error(e);
    }
}

export function GiveExp(client: Client, username: string, amount: number) {
    let player = LoadPlayer(username);

    if(player.ExpBoostMultiplier > 1) {
        amount *= player.ExpBoostMultiplier;
    }

    player.CurrentExp += amount;

    if(!player.LevelUpAvailable) {
        if(player.CurrentExp >= player.CurrentExpNeeded) {
            player.LevelUpAvailable = true;
            client.say(process.env.CHANNEL!, `@${username} has LEVELED UP! You may choose a class to level into. Use !mage, !warrior, or !rogue to select a class.`);

            setTimeout(() => {
                broadcast(JSON.stringify({ type: 'exp', displayName: username, display: `LEVEL UP!`, }));
            }, 700);
        }
        else {
            setTimeout(() => {
                broadcast(JSON.stringify({ type: 'exp', displayName: username, display: `+${amount}EXP`, }));
            }, 700);
        }
    }

    // else {
    //     client.say(process.env.CHANNEL!, `@${username} gained ${amount}EXP. You now have ${player.CurrentExp}EXP. You need ${player.CurrentExpNeeded - player.CurrentExp} more EXP to level up.`);
    // }

    SavePlayer(player);
}

// playTextToSpeech("big test buddy");

export interface Voice {
    male: boolean;
    voice: string;
    rate: number;
}

export const okayVoices: Array<Voice> = [
    {
        male: true,
        voice: "en-US-AndrewNeural",
        rate: 1
    },
    {
        male: false,
        voice: "en-US-EmmaNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-BrianNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-GuyNeural",
        rate: 1
    },
    {
        male: false,
        voice: "en-US-AriaNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-DavisNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-EricNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-JacobNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-RogerNeural",
        rate: 1
    },
    {
        male: true,
        voice: "en-US-SteffanNeural",
        rate: 1
    },
    {
        male: false,
        voice: "en-US-AvaMultilingualNeural",
        rate: 1
    },
    {
        male: false,
        voice: "en-US-AmberNeural",
        rate: 1
    },
    {
        male: false,
        voice: "en-US-AshleyNeural",
        rate: 1
    },
]

export async function tryToSetVoice(client: Client, displayName: string, voice: string) {
    if(voice === "" || voice === "rng" || voice === "random") {
        let player = LoadPlayer(displayName);

        player.Voice = "";

        SavePlayer(player);
        await client.say(process.env.CHANNEL!, `@${displayName}, set voice to be random each time`);
        return;
    }

    const subscriptionKey = process.env.AZURE_KEY;
    const serviceRegion = process.env.AZURE_REGION;

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    let voices = await synthesizer.getVoicesAsync("en-US");

    // console.log(voices.privVoices)

    if(!voice.includes("en-us-")) {
        voice = "en-us-" + voice;
    }

    if(!voice.includes("neural")) {
        voice = voice + "neural";
    }

    let foundVoice = voices.privVoices.find(x => {
        console.log(x.privShortName + " vs " + voice)
        return x.privShortName.toLowerCase() === voice
    });

    if(foundVoice === undefined) {
        await client.say(process.env.CHANNEL!, `@${displayName}, could not find a voice by that name`);
    }
    else {
        await client.say(process.env.CHANNEL!, `@${displayName}, set voice to ${foundVoice.privShortName}`);

        let player = LoadPlayer(displayName);

        player.Voice = foundVoice.privShortName;

        SavePlayer(player);
    }
}

export function playTextToSpeech(text: string, voiceToUse: string = "en-US-BrianNeural") {
    const subscriptionKey = process.env.AZURE_KEY;
    const serviceRegion = process.env.AZURE_REGION;

    let outputFile = "files/extras/CurrentTextToSpeech.wav";

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    let voice = voiceToUse; //text.split('_')[0];// "en-US-AndrewNeural";

    let voiceInfo: Voice = okayVoices.find(x => x.voice == voiceToUse);

    if(voiceInfo === undefined || voiceInfo.voice === "") {
        voiceInfo = {
            male: true, //idk but no way to check
            voice: voiceToUse,
            rate: 1
        }
    }

    const audioConfig = SpeechSDK.AudioConfig.fromAudioFileOutput(outputFile) //fromDefaultSpeakerOutput();

    let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
                <voice name='${voice}'>
                    <prosody rate='${voiceInfo.rate}'>${text}</prosody>
                </voice>
             </speak>`;

    // let voices = await synthesizer.getVoicesAsync("en-US");

    synthesizer.speakSsmlAsync(
        ssml,
        (result: any) => {
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log(`Audio synthesized for text`);

                setTimeout(() => {
                    playSound("CurrentTextToSpeech")
                }, 100);
            }
            else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
            synthesizer = null;
        },
        (error: any ) => {
            console.error(error);
            synthesizer.close();
            synthesizer = null;
        });
}
