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

const { RtAudio, RtAudioFormat, RtAudioApi } = require("audify");
const load = require('audio-loader');
const SpeechSDK = require("microsoft-cognitiveservices-speech-sdk");

// Global RtAudio instance and VB-Audio device ID
let rtAudioInstance: any = null;
let vbAudioDeviceId: number = -1;

// Initialize audify and find VB-Audio device
function initializeAudio() {
    if (rtAudioInstance === null) {
        // Use DirectSound on Windows - less aggressive than WASAPI, won't interfere with other audio
        rtAudioInstance = new RtAudio(RtAudioApi.WINDOWS_DS);
        const devices = rtAudioInstance.getDevices();

        console.log('Available audio devices:');
        devices.forEach((device: any, index: number) => {
            console.log(`${index}: ${device.name} (${device.outputChannels} outputs, ${device.inputChannels} inputs)`);

            // Look for VB-Audio Virtual Cable - try multiple variations
            const deviceNameLower = device.name.toLowerCase();
            if ((deviceNameLower.includes('cable') ||
                 deviceNameLower.includes('vb-audio') ||
                 deviceNameLower.includes('vb audio')) &&
                device.outputChannels > 0) {
                vbAudioDeviceId = index;
                console.log(`Found VB-Audio device at ID ${index}: ${device.name}`);
            }
        });

        if (vbAudioDeviceId === -1) {
            console.warn('VB-Audio Virtual Cable not found in device list above, will use default device');
            console.warn('Make sure VB-Audio Virtual Cable is installed and enabled');
            vbAudioDeviceId = rtAudioInstance.getDefaultOutputDevice();
        }
    }
    return vbAudioDeviceId;
}

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

// console.log(getDevices());


export function PlaySound(soundName: string, type: AudioType, extension: string = "wav", callback?: () => void) {
    let filepath = `files/extras/${soundName}.${extension}`;
    if (!fs.existsSync(filepath)) {
        console.error(`File not found: ${filepath}`);
        return;
    }

    // Initialize audio and get VB-Audio device
    const deviceId = initializeAudio();

    const channelCount = 2;
    const sampleRate = 48000;
    const frameSize = 1920; // 40ms at 48kHz
    const bytesPerFrame = frameSize * channelCount * 2; // 2 bytes per sample (SINT16)

    let volume = CurrentStreamSettings.volume.get(type) ?? 1.0;
    const volumeTransform = new prism.VolumeTransformer({ type: 's16le', volume });

    // Decode audio with ffmpeg
    const decoder = new prism.FFmpeg({
        args: [
            '-analyzeduration', '0',
            '-loglevel', 'quiet',
            '-i', filepath,
            '-f', 's16le',
            '-ar', `${sampleRate}`,
            '-ac', `${channelCount}`,
        ],
    });

    // Collect all audio data first, then play it
    let allAudioData = Buffer.alloc(0);

    decoder.pipe(volumeTransform).on('data', (chunk: Buffer) => {
        allAudioData = Buffer.concat([allAudioData, chunk]);
    }).on('end', () => {
        // Now we have all the audio data, play it
        const rtAudio = new RtAudio(RtAudioApi.WINDOWS_DS);

        try {
            // Open audio stream to VB-Audio Virtual Cable
            rtAudio.openStream(
                {
                    deviceId: deviceId,
                    nChannels: channelCount,
                    firstChannel: 0
                },
                null, // No input
                RtAudioFormat.RTAUDIO_SINT16,
                sampleRate,
                frameSize,
                `PlaySound_${soundName}`
            );

            rtAudio.start();

            // Write frames in chunks to keep buffer full and prevent crackling
            let offset = 0;
            const framesPerWrite = 10; // Write 10 frames at a time (400ms of audio)

            const writeNextChunk = () => {
                if (offset < allAudioData.length) {
                    // Write multiple frames at once to keep the buffer full
                    for (let i = 0; i < framesPerWrite && offset < allAudioData.length; i++) {
                        const remainingBytes = allAudioData.length - offset;
                        let frame: Buffer;

                        if (remainingBytes >= bytesPerFrame) {
                            frame = allAudioData.slice(offset, offset + bytesPerFrame);
                        } else {
                            // Pad the last frame with zeros
                            frame = Buffer.alloc(bytesPerFrame);
                            allAudioData.copy(frame, 0, offset);
                        }

                        if (rtAudio.isStreamOpen() && rtAudio.isStreamRunning()) {
                            rtAudio.write(frame);
                        }

                        offset += bytesPerFrame;
                    }

                    // Schedule next chunk write (write every 300ms to keep buffer ahead)
                    setTimeout(writeNextChunk, 300);
                } else {
                    // All data written, now stop and close
                    setTimeout(() => {
                        if (rtAudio.isStreamRunning()) {
                            rtAudio.stop();
                        }
                        setTimeout(() => {
                            if (rtAudio.isStreamOpen()) {
                                rtAudio.closeStream();
                            }
                            callback?.();
                        }, 500);
                    }, 100);
                }
            };

            writeNextChunk();

        } catch (error) {
            console.error('Failed to open audio stream:', error);
            callback?.();
        }
    }).on('error', (err: Error) => {
        console.error('Audio decode error:', err);
        callback?.();
    });

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
    // if(voice === "" || voice === "rng" || voice === "random") {
    //     let player = LoadPlayer(displayName);
    //
    //     player.Voice = "";
    //
    //     SavePlayer(player);
    //     await client.say(process.env.CHANNEL!, `@${displayName}, set voice to be random each time`);
    //     return;
    // }
    //
    // const subscriptionKey = process.env.AZURE_KEY;
    // const serviceRegion = process.env.AZURE_REGION;
    //
    // const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    // let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    // let voices = await synthesizer.getVoicesAsync("en-US");
    //
    // // console.log(voices.privVoices)
    //
    // if(!voice.includes("en-us-")) {
    //     voice = "en-us-" + voice;
    // }
    //
    // if(!voice.includes("Neural")) {
    //     voice = voice + "Neural";
    // }
    //
    // let foundVoice = voices.voices.find(x => {
    //     console.log(x.shortName.toLowerCase() + " vs " + voice.toLowerCase())
    //     return x.shortName.toLowerCase() === voice.toLowerCase()
    // });
    //
    // if(foundVoice === undefined) {
    //     await client.say(process.env.CHANNEL!, `@${displayName}, could not find a voice by that name`);
    // }
    // else {
    //     await client.say(process.env.CHANNEL!, `@${displayName}, set voice to ${foundVoice.shortName}`);
    //
    //     let player = LoadPlayer(displayName);
    //
    //     player.Voice = foundVoice.shortName;
    //
    //     SavePlayer(player);
    // }
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
            if (match.index! > lastIndex) {
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

            lastIndex = match.index! + match[0].length;
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

    const ssml = ParseEmotionalText(text).generateSSML(voice);

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
