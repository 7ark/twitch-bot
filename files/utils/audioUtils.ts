import {exec} from "child_process";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import {Client} from "tmi.js";
import {LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetRandomItem} from "./utils";
import {AudioType, CurrentStreamSettings} from "../streamSettings";
import {Player} from "../valueDefinitions";
import fs from "fs";
import prism from 'prism-media';
import Speaker from "speaker";
import play, {AudioPlayHandle} from "audio-play";
const naudiodon = require('naudiodon');
const getDevices = naudiodon.getDevices;

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

console.log(getDevices());


export function PlaySound(soundName: string, type: AudioType, extension: string = "wav", callback?: () => void) {
    let filepath = `files/extras/${soundName}.${extension}`;
    if (!fs.existsSync(filepath)) {
        console.error(`File not found: ${filepath}`);
        return;
    }

    const channelCount = 2;
    const sampleFormat = naudiodon.SampleFormat16Bit; // use constant, not raw number

    let volume = CurrentStreamSettings.volume.get(type);
    const volumeTransform = new prism.VolumeTransformer({ type: 's16le', volume });

    let device = getDevices().find(x => x.name == "Speakers (VB-Audio Point)");
    if(device == undefined) {
        console.error(`Could not find speakers`);
        return;
    }
    let deviceId = device.id; //The VB-audio cable (Speakers VB Point)
    let sampleRate = 48000;//device.sampleRate;

    const decoder = new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', 'quiet',
            '-re', // realtime encoding, ensures FFmpeg pushes audio at realtime speed
            '-i', filepath,
            '-f', 's16le',
            '-ar', `${sampleRate}`,
            '-ac', `${channelCount}`,
            '-af', 'apad=pad_dur=0.5',
        ],
    });

    // Let speaker handle it
    const speaker = new Speaker({
        channels: 2,
        bitDepth: 16,
        sampleRate: 48000,
        signed: true,
        float: false
    });

    speaker.on("close", () => {
        callback?.();
    });
    speaker.on("error", err => {
        console.error("Speaker error:", err);
        callback?.();
    });

    decoder.pipe(volumeTransform).pipe(speaker);

    // try {
    //     let fileLoc = `files/extras/${soundName}.${extension}`;
    //     console.log(`Playing audio at: ${fileLoc}`);
    //     if(!fs.existsSync(fileLoc)) {
    //         console.log(`COULD NOT FIND FILE, WE'RE ABORTING OH GOD`);
    //         return;
    //     }
    //
    //     let audioBuffer = load(fileLoc);//.then(play);
    //
    //     audioBuffer.then((buffer) => {
    //         let playHandle: AudioPlayHandle = play(buffer, {
    //             start: 0,
    //             end: buffer.duration,
    //             volume: CurrentStreamSettings.volume.get(type)
    //         }, () => {});
    //
    //         setTimeout(() => {
    //             if(callback != undefined) {
    //                 callback();
    //             }
    //         }, buffer.duration * 1000)
    //     })
    //
    // }
    // catch (e) {
    //     console.log(e);
    // }
}

export interface Voice {
    male: boolean;
    voice: string;
}

const okayVoices: Array<Voice> = [
    {
        male: true,
        voice: "en-US-AndrewNeural",
    },
    {
        male: false,
        voice: "en-US-EmmaNeural",
    },
    {
        male: true,
        voice: "en-US-BrianNeural",
    },
    {
        male: true,
        voice: "en-US-GuyNeural",
    },
    {
        male: false,
        voice: "en-US-AriaNeural",
    },
    {
        male: true,
        voice: "en-US-DavisNeural",
    },
    {
        male: true,
        voice: "en-US-EricNeural",
    },
    {
        male: true,
        voice: "en-US-JacobNeural",
    },
    {
        male: true,
        voice: "en-US-RogerNeural",
    },
    {
        male: true,
        voice: "en-US-SteffanNeural",
    },
    {
        male: false,
        voice: "en-US-AvaMultilingualNeural",
    },
    {
        male: false,
        voice: "en-US-AmberNeural",
    },
    {
        male: false,
        voice: "en-US-AshleyNeural",
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

function GetEmotionMapping(): Map<string, string> {
    let emotionMappings: Map<string, string> = new Map<string, string>();
    emotionMappings.set(`*cheerful*`, `cheerful`);
    emotionMappings.set(`*angry*`, `angry`);
    emotionMappings.set(`*sad*`, `sad`);
    emotionMappings.set(`*whisper*`, `whispering`);
    emotionMappings.set(`*scared*`, `terrified`);
    emotionMappings.set(`*terrified*`, `terrified`);
    emotionMappings.set(`*excited*`, `excited`);
    emotionMappings.set(`*hopeful*`, `hopeful`);
    emotionMappings.set(`*shouting*`, `shouting`);
    emotionMappings.set(`*unfriendly*`, `unfriendly`);

    return emotionMappings;
}

function ParseEmotionalText(text: string) {
    const voiceStyles: Array<{
        text: string,
        style?: string
    }> = [];

    let emotionMappings = GetEmotionMapping();

    // Create regex pattern from emotion markers
    const markers = Array.from(emotionMappings.keys()).map(marker =>
        marker.replace(/[*]/g, '\\*')
    ).join('|');
    const pattern = new RegExp(`(${markers})([^*]+)`, 'g');

    // Keep track of where we left off
    let lastIndex = 0;
    let matches = Array.from(text.matchAll(pattern));

    if (matches.length === 0) {
        // If no emotion markers found, treat entire text as unstyled
        voiceStyles.push({
            text: text.trim()
        });
    } else {
        // Process each match and the text between matches
        matches.forEach(match => {
            // If there's text before this style marker, add it as unstyled
            if (match.index > lastIndex) {
                const unsetyled = text.substring(lastIndex, match.index).trim();
                if (unsetyled) {
                    voiceStyles.push({
                        text: unsetyled
                    });
                }
            }

            const [, marker, content] = match;
            const style = emotionMappings.get(marker);

            voiceStyles.push({
                text: content.trim(),
                style: style
            });

            lastIndex = match.index + match[0].length;
        });

        // Check for any remaining text after the last style marker
        if (lastIndex < text.length) {
            const remaining = text.substring(lastIndex).trim();
            if (remaining) {
                voiceStyles.push({
                    text: remaining
                });
            }
        }
    }

    // Generate SSML
    const generateSSML = (voice: string) => {
        const styleElements = voiceStyles.map(style => {
            if (style.style) {
                return `        <mstts:express-as style="${style.style}" styledegree="2">
            ${style.text}
        </mstts:express-as>`;
            } else {
                return `        ${style.text}`;
            }
        }).join('\n');

        return `<speak version="1.0"
    xmlns:mstts="https://www.w3.org/2001/mstts"
    xml:lang="en-US">
    <voice name="${voice}">
${styleElements}
    </voice>
</speak>`;
    };

    return {
        styles: voiceStyles,
        generateSSML
    };
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
        }
    }

    //Trim text
    let terms = ["the7arcook", "the7arfish","the7armine","the7arcode","the7arhug","the7arcode","the7arwave","the7arloaf","the7arthink"];
    for (let i = 0; i < terms.length; i++) {
        text = text.toLowerCase().replace(terms[i], "");
    }

    text = text.replace("&", "and");

    if(text.trim() == "") {
        return;
    }

    const audioConfig = SpeechSDK.AudioConfig.fromAudioFileOutput(outputFile) //fromDefaultSpeakerOutput();

    let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

    // const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
    //             <voice name='${voice}'>
    //                 <prosody rate='${voiceInfo.rate}'>${text}</prosody>
    //             </voice>
    //          </speak>`;


//     const ssml = `<speak version="1.0"
//     xmlns:mstts="https://www.w3.org/2001/mstts"
//     xml:lang="en-US">
//     <voice name="${voice}">
//         <mstts:express-as style="cheerful" styledegree="2">
//             That'd be just amazing!
//         </mstts:express-as>
//         <mstts:express-as style="angry" styledegree="2">
//             That'd be just amazing!
//         </mstts:express-as>
//         <mstts:express-as style="assistant" styledegree="0.01">
//             What's next?
//         </mstts:express-as>
//     </voice>
// </speak>`;

    const ssml = ParseEmotionalText(text).generateSSML(voice);

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
