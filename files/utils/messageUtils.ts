import {ChatUserstate, Client} from "tmi.js";
import {MessageDelegate, SayAllChat} from "../globals";
import {DoesPlayerHaveStatusEffect, LoadPlayer, RandomlyGiveExp, StatusEffect} from "./playerGameUtils";
import {GetRandomInt, GetRandomIntI, GetRandomItem,} from "./utils";
import {ProcessCommands} from "../commands";
import {Broadcast} from "../bot";
import {LoadPlayerSession, SavePlayerSession} from "./playerSessionUtils";
import {PlayTextToSpeech, TryGetPlayerVoice} from "./audioUtils";


function CleanMessage(input: string): string {
    // Check if the string is empty
    if (input.length === 0) return input;

    // Regex to match valid characters (letters, numbers, punctuation, symbols)
    const validCharRegex = /[\p{L}\p{N}\p{P}\p{S}]$/u;

    // Get the last character of the string
    const lastChar = input[input.length - 1];

    // Check if the last character is valid
    if (!validCharRegex.test(lastChar)) {
        // If invalid, remove the last character
        return input.slice(0, input.length - 2);
    }

    // Return the original string if the last character is valid
    return input;
}

export async function OnMessage(client: Client, channel: string, userstate: ChatUserstate, message: string, userState: ChatUserstate){
    let displayName = userstate['display-name']!;
    message = CleanMessage(message);
    console.log(`${displayName}: ${message}`);

    for (let i = 0; i < MessageDelegate.length; i++) {
        MessageDelegate[i](displayName, message);
    }


    if(!displayName.includes("the7ark")) {
        hasBeenMessageSinceLastRegularMessage = true;
    }

    let player = LoadPlayer(userState['display-name']!);
    if(message[0] != '!' && !message.includes("!yell")) {
        if(SayAllChat && !displayName.includes("the7ark")) {
            PlayTextToSpeech(message, TryGetPlayerVoice(player));
            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: message, }));
            }, 700);
        }
        else if(DoesPlayerHaveStatusEffect(userState['display-name']!, StatusEffect.Drunk)) {
            if(GetRandomIntI(1, 5) != 1) {
                let drunkText = DrunkifyText(message);
                PlayTextToSpeech(drunkText, TryGetPlayerVoice(player));
                setTimeout(() => {
                    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: drunkText, }));
                }, 700);
            }
        }
    }

    let col = userState.color;
    Broadcast(JSON.stringify({ type: 'message', displayName, message, color: col }));

    let session = LoadPlayerSession(displayName);
    session.NameColor = col;
    if(message[0] === '!'){
        if(message.includes("!yell")) {
            session.Messages.push(message.replace("!yell", "").trim());
        }

        await ProcessCommands(client, userState, message);
    }
    else {
        //EXP
        await RandomlyGiveExp(client, displayName, 5, GetRandomIntI(1, 2))

        session.Messages.push(message.trim());
    }
    SavePlayerSession(displayName, session);
}

let hasBeenMessageSinceLastRegularMessage: boolean = true;
const regularMessages: Array<string> = [
    "Come hang out on our Discord, to chat, give stream suggestions, and get go live notification. Join here: https://discord.gg/A7R5wFFUWG",
    "Use any amount of bits to cheer or just use !yell to yell at me in text to speech live on stream!",
    "Have an idea to make the stream more exciting? Use the 'Offer Side Quest' channel point redemption to propose a change.",
    "If you see any funny moments during stream, clipping them is much appreciated!",
    "Follow me on Twitter for information about streams, as well as my personal projects: https://twitter.com/The7ark",
    "I'm a game developer! Feel free to ask questions or talk about code. I've also released a game called Battle Tracks, find more in the stream description.",
    "Check what stuff you have with !inventory, then you can !throw [item] or !use [item]. You can !info [item] to learn more about it."
];
let regularMessageIndex: number = GetRandomInt(0, regularMessages.length);

export async function PostNewRegularMessage(client: Client) {
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
function DrunkifyText(sentence: string): string {
    const drunkBlips = [' *burp* ', ' *hic*', '...'];
    const words = sentence.split(" ");
    const drunkWords = words.map(word => {
        // Randomly repeat letters and syllables
        let result = word.split("").map(char => Math.random() > 0.8 ? char + char : char).join("");

        // Slur modifications by randomly doubling vowels
        result = result.replace(/[aeiou]/gi, match => Math.random() > 0.6 ? match + match : match);

        // Randomly insert slurred sounds
        if (Math.random() > 0.7) {
            const slurSounds = ["h", "m", "r", "l"];
            const randomSlur = slurSounds[Math.floor(Math.random() * slurSounds.length)];
            const insertPosition = Math.floor(Math.random() * result.length);
            result = result.slice(0, insertPosition) + randomSlur + result.slice(insertPosition);
        }

        return result;
    });

    if(GetRandomIntI(1, 2) == 1) {
        drunkWords.push(GetRandomItem(drunkBlips)!);
    }

    // Randomly stretch out spaces between words
    return drunkWords.join(" ");
}

// function DrunkifyText(text: string): string {
//     const slurs = [' *burp* ', ' *hic*', '...'];
//     let drunkText = '';
//
//     for (let i = 0; i < text.length; i++) {
//         const randomChance = Math.random();
//         if (randomChance < 0.4 && text[i] !== ' ') {
//             // Duplicate the current letter occasionally
//             drunkText += text[i] + text[i];
//         } else {
//             drunkText += text[i];
//         }
//
//         // Occasionally add a slur or hiccup after a space
//         if (text[i] === ' ' && randomChance < 0.15) {
//             drunkText += slurs[Math.floor(Math.random() * slurs.length)];
//         }
//     }
//
//     return drunkText;
// }
