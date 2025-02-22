import {ChatUserstate, client, Client} from "tmi.js";
import {CurrentCaller, CurrentGTARider, MessageDelegate, SayAllChat} from "../globals";
import {DoesPlayerHaveStatusEffect, GivePlayerObject, LoadPlayer, RandomlyGiveExp} from "./playerGameUtils";
import {CheckMessageSimilarity, GetRandomInt, GetRandomIntI, GetRandomItem,} from "./utils";
import {ProcessCommands, ProcessUniqueCommands} from "./commandUtils";
import {Broadcast} from "../bot";
import {LoadPlayerSession, SavePlayerSession} from "./playerSessionUtils";
import {PlayTextToSpeech, TryGetPlayerVoice} from "./audioUtils";
import {MinigameType} from "./minigameUtils";
import {DoesPlayerHaveQuest, GivePlayerRandomQuest} from "./questUtils";
import {AudioType} from "../streamSettings";
import {CheckForScare} from "./scareUtils";
import {StatusEffect} from "../valueDefinitions";
import {WhisperUser} from "./twitchUtils";
import {CheckIfShouldHaveNPCResponse, GetNPCResponse} from "./npcUtils";
import {COOK_CurrentCustomers, ShowCustomerText} from "./cookingSimUtils";
import {AddChapterMarker} from "./obsutils";

let lastMessageTimestamp = new Date();

export function GetMinutesSinceLastMessage(): number {
    const currentTimestamp = new Date();
    const millisecondsDifference = currentTimestamp.getTime() - lastMessageTimestamp.getTime();
    const minutesDifference = millisecondsDifference / (1000 * 60);
    return minutesDifference;
}

export function CleanMessage(input: string): string {
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

export async function OnWhisper(client: Client, message: string, username: string) {
    console.log(`Whisper: ${username}: ${message}`);
    if(message[0] === '!' && !message.includes("!yell")){
        await ProcessCommands(client, username, message);
    }
    else {
        await WhisperUser(client, username, "You can only send commands here!");
    }
}

export async function OnMessage(client: Client, userState: ChatUserstate, message: string){
    let displayName = userState['display-name']!;
    message = CleanMessage(message);
    console.log(`${displayName}: ${message}`);

    for (let i = 0; i < MessageDelegate.length; i++) {
        MessageDelegate[i](displayName, message);
    }

    if(!displayName.includes("the7ark")) {
        hasBeenMessageSinceLastRegularMessage = true;
        lastMessageTimestamp = new Date();
    }
    let col = userState.color;
    Broadcast(JSON.stringify({ type: 'message', displayName, message, color: col }));

    let player = LoadPlayer(userState['display-name']!);
    if(message[0] != '!' && !message.includes("!yell")) {
        if(SayAllChat && !displayName.includes("the7ark")) {
            PlayTextToSpeech(message, AudioType.UserTTS, TryGetPlayerVoice(player));
            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: message, }));
            }, 700);
        }
        else if(DoesPlayerHaveStatusEffect(userState['display-name']!, StatusEffect.Drunk)) {
            if(GetRandomIntI(1, 5) != 1) {
                message = DrunkifyText(message);
                PlayTextToSpeech(message, AudioType.UserTTS, TryGetPlayerVoice(player));
                setTimeout(() => {
                    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: message, }));
                }, 700);
            }
        }
        else if(CurrentCaller != `` && CurrentCaller.toLowerCase() == displayName.toLowerCase()) {
            PlayTextToSpeech(message, AudioType.ImportantStreamEffects, TryGetPlayerVoice(player));
            setTimeout(() => {
                Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: message, }));
            }, 700);
        }
        else {
            if((CurrentGTARider != "" && CurrentGTARider == displayName.toLowerCase()) ||
                (COOK_CurrentCustomers.includes(displayName.toLowerCase()))) {
                PlayTextToSpeech(message, AudioType.UserTTS, TryGetPlayerVoice(player));
                setTimeout(() => {
                    Broadcast(JSON.stringify({ type: 'showfloatingtext', displayName: userState['display-name']!, display: message, }));
                }, 700);
                await ShowCustomerText(player.Username, message);
            }
        }
    }

    // if(message.includes(`!yell`) || message[0] != `!`) {
    //     await CheckForScare(client, player.Username, message.replace(`!yell`, ``));
    // }

    //Must be level 5 to get quests, not have a quest already, and a 1 in 5 chance with each message
    if(player.Level >= 5 &&
        !DoesPlayerHaveQuest(player.Username) &&
        GetRandomIntI(1, 3) == 1
    ) {
        await GivePlayerRandomQuest(client, player.Username);
    }

    // Broadcast(JSON.stringify({ type: 'message', displayName, message, color: col }));

    let session = LoadPlayerSession(displayName);
    session.NameColor = col;
    session.IsSubscribed = userState.subscriber ?? false;
    let addedFirstMessage = false;
    if(message[0] === '!'){
        if(message.includes("!yell")) {
            if(session.Messages.length == 0) {
                addedFirstMessage = true;
            }
            session.Messages.push(message.replace("!yell", "").trim());
        }

        await ProcessCommands(client, userState['display-name']!, message);
    }
    else if(!await ProcessUniqueCommands(client, userState['display-name']!, message)) {
        //EXP
        await RandomlyGiveExp(client, displayName, 5, GetRandomIntI(1, 2))

        if(session.Messages.length == 0) {
            addedFirstMessage = true;
        }
        session.Messages.push(message.trim());

        await CheckIfShouldHaveNPCResponse(client, message, userState['display-name']!);
    }

    // if(addedFirstMessage) {
    //     await GivePlayerObject(client, displayName, "present");
    // }

    //Do not activate until birthday
    // await CheckForBirthday(client, displayName, message)


    session.LastMessageTime = new Date();
    SavePlayerSession(displayName, session);
}

async function CheckForBirthday(client: Client, username: string, message: string) {
    if(message.toLowerCase().includes("birthday")) {
        //Check if this has been sent, by this user before
        let userSession = LoadPlayerSession(username);
        if(userSession.Messages.length == 0 || !CheckMessageSimilarity(message, userSession.Messages)) {
            await client.say(process.env.CHANNEL!, `@${username} has said a unique birthday message... SPAWNING A BIRTHDAY PRESENT FOR CORY!`);
            Broadcast(JSON.stringify({ type: 'birthday' }));
        }
    }
}

const minigameKeys = Object
    .keys(MinigameType)
    .filter((v) => isNaN(Number(v)))

let hasBeenMessageSinceLastRegularMessage: boolean = true;
const regularMessages: Array<string> = [
    "Check out my socials - Discord: https://discord.gg/6dEKeStTEM, Bluesky: https://bsky.app/profile/7ark.dev, Youtube: https://www.youtube.com/@7ark",
    `Chat is interactive! Use '!help options' to see all subjects to learn about. Use !commands to see all command options. Use '!help fight' to learn about fighting monsters. Use '!help minigames' to learn about playing small minigames. Use '!help interact' to learn about more interactive elements of chat.`,
    `You can use${minigameKeys.map(x => ` !${x.toLowerCase()}`)} to earn gems and compete for a leaderboard spot!`,
    `Check out my latest Youtube video: https://youtu.be/WpT1y_0o7iE`
];
let regularMessageIndex: number = GetRandomInt(0, regularMessages.length);

export async function PostNewRegularMessage(client: Client) {
    if(!hasBeenMessageSinceLastRegularMessage) {
        return;
    }

    await client.say(process.env.CHANNEL!, regularMessages[regularMessageIndex]);

    regularMessageIndex++;
    if(regularMessageIndex >= regularMessages.length) {
        regularMessageIndex = 0;
    }

    hasBeenMessageSinceLastRegularMessage = false;
}

export function DrunkifyText(sentence: string): string {
    const drunkBlips = [' *burp* ', ' *hic* ', '... uh...', ' *shh*'];
    const slurSounds = ['sh', 's', 'r', 'l', 'ss', 'z'];

    const words = sentence.split(" ");
    const drunkWords = words.map(word => {
        // Slightly distort the word by adding slurs or stretching vowels
        let result = word;

        // Stretch vowels without excessive repetition
        result = result.replace(/[aeiou]/gi, match => Math.random() > 0.6 ? match + (Math.random() > 0.5 ? 'h' : '') : match);

        // Randomly inject slur-like sounds into words
        if (Math.random() > 0.6) {
            const randomSlur = slurSounds[Math.floor(Math.random() * slurSounds.length)];
            const insertPosition = Math.floor(Math.random() * result.length);
            result = result.slice(0, insertPosition) + randomSlur + result.slice(insertPosition);
        }

        // Occasionally mispronounce by swapping or duplicating sounds
        if (Math.random() > 0.7) {
            result = result.replace(/s/gi, 'sh').replace(/r/gi, 'rr').replace(/l/gi, 'll');
        }

        return result;
    });

    // Add a drunken blip occasionally
    if (Math.random() > 0.5) {
        drunkWords.push(GetRandomItem(drunkBlips)!);
    } else {
        // Trail off with ellipses or stretch the last word slightly
        const lastWord = drunkWords.pop()!;
        drunkWords.push(lastWord + (Math.random() > 0.7 ? '...' : ''));
    }

    // Add irregular spacing but keep it readable for TTS
    return drunkWords.join(" ".repeat(Math.random() > 0.7 ? 2 : 1));
}

export function GetParameterFromCommand(text: string, parameter: number) {
    let pieces = text.split(' ');
    if(pieces.length > parameter) {
        return pieces[parameter];
    }
    else {
        return "";
    }
}

export function GetLastParameterFromCommand(text: string) {
    let pieces = text.split(' ');
    if(pieces.length > 0) {
        let lastIndex = pieces.length - 1;
        while (lastIndex >= 0) {
            if(pieces[lastIndex].trim() != "") {
                return pieces[lastIndex].trim();
            }
            else {
                lastIndex--;
            }
        }

        return "";
    }
    else {
        return "";
    }
}

export function GetAllParameterTextAfter(text: string, parameter: number) {
    let pieces = text.split(' ');
    if(pieces.length > parameter) {
        let textPiece = pieces[parameter];
        let split = text.split(textPiece);

        return `${textPiece}${split[1]}`;
    }

    return "";
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
