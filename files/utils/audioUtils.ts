import {exec} from "child_process";
import play, {AudioPlayHandle} from "audio-play";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import {Client} from "tmi.js";
import {LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetRandomItem} from "./utils";
import {AudioType, CurrentStreamSettings} from "../streamSettings";
import {Player} from "../valueDefinitions";
import fs from "fs";

const load = require('audio-loader');
const SpeechSDK = require("microsoft-cognitiveservices-speech-sdk");

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

export function PlaySound(soundName: string, type: AudioType, extension: string = "wav", callback?: () => void) {
    try {
        let fileLoc = `files/extras/${soundName}.${extension}`;
        console.log(`Playing audio at: ${fileLoc}`);
        if(!fs.existsSync(fileLoc)) {
            console.log(`COULD NOT FIND FILE, WE'RE ABORTING OH GOD`);
            return;
        }

        let audioBuffer = load(fileLoc);//.then(play);

        audioBuffer.then((buffer) => {
            let playHandle: AudioPlayHandle = play(buffer, {
                start: 0,
                end: buffer.duration,
                volume: CurrentStreamSettings.volume.get(type)
            }, () => {});

            setTimeout(() => {
                if(callback != undefined) {
                    callback();
                }
            }, buffer.duration * 1000)
        })

    }
    catch (e) {
        console.error(e);
    }
}

export interface Voice {
    male: boolean;
    voice: string;
    rate: number;
}

const okayVoices: Array<Voice> = [
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

export async function TryToSetVoice(client: Client, displayName: string, voice: string) {
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

    if(!voice.includes("Neural")) {
        voice = voice + "Neural";
    }

    let foundVoice = voices.voices.find(x => {
        console.log(x.shortName.toLowerCase() + " vs " + voice.toLowerCase())
        return x.shortName.toLowerCase() === voice.toLowerCase()
    });

    if(foundVoice === undefined) {
        await client.say(process.env.CHANNEL!, `@${displayName}, could not find a voice by that name`);
    }
    else {
        await client.say(process.env.CHANNEL!, `@${displayName}, set voice to ${foundVoice.shortName}`);

        let player = LoadPlayer(displayName);

        player.Voice = foundVoice.shortName;

        SavePlayer(player);
    }
}

export function TryGetPlayerVoice(player: Player) {
    return player.Voice === undefined || player.Voice === "" ? GetRandomItem(okayVoices)!.voice : player.Voice;
}

export function PlayTextToSpeech(text: string, audioType: AudioType, voiceToUse: string = "en-US-BrianNeural", callback?: () => void) {
    const subscriptionKey = process.env.AZURE_KEY;
    const serviceRegion = process.env.AZURE_REGION;

    let outputFile = "files/extras/CurrentTextToSpeech.wav";

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    let voice = voiceToUse; //text.split('_')[0];// "en-US-AndrewNeural";

    let voiceInfo: Voice = okayVoices.find(x => x.voice == voiceToUse)!;

    if(voiceInfo === undefined || voiceInfo.voice === "") {
        voiceInfo = {
            male: true, //idk but no way to check
            voice: voiceToUse,
            rate: 1
        }
    }

    //Trim text
    let terms = ["the7arcook", "the7arfish","the7armine","the7arcode","the7arhug","the7arcode","the7arwave","the7arloaf","the7arthink"];
    for (let i = 0; i < terms.length; i++) {
        text = text.toLowerCase().replace(terms[i], "");
    }

    if(text.trim() == "") {
        return;
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
                    PlaySound("CurrentTextToSpeech", audioType, "wav", callback)
                }, 100);
            }
            else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
        },
        (error: any ) => {
            console.error(error);
            synthesizer.close();
        });
}
