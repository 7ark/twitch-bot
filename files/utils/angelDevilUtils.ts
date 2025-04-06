import {AddChapterMarker, DoesSceneContainItem, GetOpenScene, SetSceneItemEnabled, SetTextValue} from "./obsutils";
import {Client} from "tmi.js";
import {FormatTextIntoLines, GetRandomItem} from "./utils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {LoadPlayer} from "./playerGameUtils";
import {CreateTwitchPoll} from "./twitchUtils";
import {GTA_CurrentRating, GTA_Ratings, GTA_Reviews} from "./gtaUtils";
import fs from "fs";

export let AD_AngelQueue: Array<string> = [];
export let AD_PendingAngel: string = "";
export let AD_DevilQueue: Array<string> = [];
export let AD_PendingDevil: string = "";
export let AD_CurrentAngel: string = "";
export let AD_CurrentDevil: string = "";
export let AD_DevilQuest: string = "";
export let AD_AngelQuest: string = "";

function GetADData(): string {
    return JSON.stringify({
        angel: AD_CurrentAngel,
        devil: AD_CurrentDevil,
        angelQuest: AD_AngelQuest,
        devilQuest: AD_DevilQuest
    });
}

export async function LoadAD() {
    if(!fs.existsSync('angeldevil.json')) {
        return;
    }
    const jsonData = fs.readFileSync('angeldevil.json', 'utf8');

    try {
        const data = JSON.parse(jsonData);

        // Restore the current angel and devil
        AD_CurrentAngel = data.angel || "";
        AD_CurrentDevil = data.devil || "";

        // Restore the quests
        AD_AngelQuest = data.angelQuest || "";
        AD_DevilQuest = data.devilQuest || "";

        // Setup the UI if angel or devil exists
        if(AD_CurrentAngel !== "") {
            // Enable the angel in the scene and update text
            await SetSceneItemEnabled("Angel", true);
            await SetTextValue("AngelQuest", `${AD_CurrentAngel}:\n${FormatTextIntoLines(AD_AngelQuest)}`);
        }

        if(AD_CurrentDevil !== "") {
            // Enable the devil in the scene and update text
            await SetSceneItemEnabled("Devil", true);
            await SetTextValue("DevilQuest", `${AD_CurrentDevil}:\n${FormatTextIntoLines(AD_DevilQuest)}`);
        }

        console.log("Angel/Devil data loaded successfully");
    } catch (error) {
        console.error("Error parsing angeldevil.json:", error);
        // Reset all the values in case of error
        AD_CurrentAngel = "";
        AD_CurrentDevil = "";
        AD_AngelQuest = "";
        AD_DevilQuest = "";
    }
}

function SaveAD() {
    const jsonData = GetADData();
    fs.writeFileSync('angeldevil.json', jsonData);
}

async function InRightScene() {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, "Devil")) {
        return false;
    }

    return true;
}

export async function SelectRole(angel: boolean, client: Client) {
    if(!await InRightScene()) {
        return;
    }

    if((angel && AD_PendingAngel != "") || (!angel && AD_PendingDevil != "")) {
        await client.say(process.env.CHANNEL!, `@${(angel ? AD_PendingAngel : AD_PendingDevil)}, your slot has been cancelled because you didn't confirm in time.`);
        if(angel) {
            AD_PendingAngel = "";
        }
        else {
            AD_PendingDevil = "";
        }
        return;
    }

    if((angel && AD_CurrentAngel != "") || (!angel && AD_CurrentDevil != "")) {
        return;
    }

    if(angel && AD_AngelQueue.length == 0) {
        await client.say(process.env.CHANNEL!, `If you'd like to be an angel use !iamgood to request a spot!`);
        return;
    }
    if(!angel && AD_DevilQueue.length == 0) {
        await client.say(process.env.CHANNEL!, `If you'd like to be a devil use !iamevil to request a spot!`);
        return;
    }

    let randomPerson = GetRandomItem(angel ? AD_AngelQueue : AD_DevilQueue)!;

    if(angel) {
        AD_PendingAngel = randomPerson;
        AD_AngelQueue = AD_AngelQueue.filter(x => x != randomPerson);
        AD_DevilQueue = AD_DevilQueue.filter(x => x != randomPerson);
        await client.say(process.env.CHANNEL!, `@${randomPerson}, you have been selected to be our ANGEL! Please type !confirm to begin your mentorship.`);
    }
    else {
        AD_PendingDevil = randomPerson;
        AD_AngelQueue = AD_AngelQueue.filter(x => x != randomPerson);
        AD_DevilQueue = AD_DevilQueue.filter(x => x != randomPerson);
        await client.say(process.env.CHANNEL!, `@${randomPerson}, you have been selected to be our DEVIL! Please type !confirm to begin your corruption.`);
    }
}

export async function AddPendingPerson(angel: boolean, client: Client) {
    if(!await InRightScene()) {
        return;
    }

    await AddChapterMarker(`New ${(angel ? "Angel" : "Devil")}: ${(angel ? AD_PendingAngel : AD_PendingDevil)}`);

    if(angel) {
        await PlaySound("angelintro", AudioType.ImportantStreamEffects);

        setTimeout(async () => {
            await client.say(process.env.CHANNEL!, `@${AD_PendingAngel}, welcome ANGEL! You've been given a halo and wings. Give Cory a quest with !task [your angelic quest]. Use !finishquest when you're satisfied`);

            PlayTextToSpeech(`An angel has come, welcome ${AD_PendingAngel}!`, AudioType.UserTTS);
            AD_CurrentAngel = AD_PendingAngel;

            await SetTextValue(`AngelText`, ``);
            await SetTextValue(`AngelQuest`, `${AD_PendingAngel}`);
            await SetSceneItemEnabled(`Angel`, true);

            AD_PendingAngel = "";
        }, 2000);
    }
    else {
        await PlaySound("devilintro", AudioType.ImportantStreamEffects);

        setTimeout(async () => {
            await client.say(process.env.CHANNEL!, `@${AD_PendingDevil}, hey there you DEVIL! Get the pitchfork ready. Give Cory a quest with !task [your devilish desire]. Use !finishquest when you're satisfied`);

            PlayTextToSpeech(`A devil snuck in, welcome ${AD_PendingDevil}!`, AudioType.UserTTS);
            AD_CurrentDevil = AD_PendingDevil;

            await SetTextValue(`DevilText`, ``);
            await SetTextValue(`DevilQuest`, `${AD_PendingDevil}`);
            await SetSceneItemEnabled(`Devil`, true);

            AD_PendingDevil = "";
        }, 2000);
    }
    SaveAD();
}

export async function GiveADQuest(angel: boolean, client: Client, quest: string) {
    if(!await InRightScene()) {
        return;
    }

    if(quest.trim() == "") {
        return;
    }

    let person = angel ? AD_CurrentAngel : AD_CurrentDevil;

    if(angel) {
        AD_AngelQuest = quest;
        PlayTextToSpeech(
            `The angel desires for you to: `, AudioType.UserTTS, "en-US-BrianNeural", () => {
                PlayTextToSpeech(quest, AudioType.UserTTS, TryGetPlayerVoice(LoadPlayer(person)))
            });
    }
    else {
        AD_DevilQuest = quest;
        PlayTextToSpeech(
            `The devil wants you to: `, AudioType.UserTTS, "en-US-BrianNeural", () => {
                PlayTextToSpeech(quest, AudioType.UserTTS, TryGetPlayerVoice(LoadPlayer(person)))
            });
    }

    await SetTextValue(angel ? "AngelQuest" : "DevilQuest", `${person}:\n${FormatTextIntoLines(quest)}`);
    SaveAD();
}

export async function ShowADText(person: string, text: string) {
    let sourceName = "";
    if(person == AD_CurrentAngel) {
        sourceName = "AngelText";
    }
    else if(person == AD_CurrentDevil) {
        sourceName = "DevilText";
    }
    else
    {
        return;
    }

    // First, clear any existing text
    await SetTextValue(sourceName, '');

    let textToShow = FormatTextIntoLines(text, 20);

    // Type out the text character by character
    for (let i = 0; i < text.length; i++) {
        await SetTextValue(sourceName, textToShow.substring(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between characters
    }

    // Wait 3 seconds before hiding
    await new Promise(resolve => setTimeout(resolve, 3000));

    await SetTextValue(sourceName, '');
}

export async function RemoveAD(angel: boolean, client: Client) {
    if(angel) {
        await SetSceneItemEnabled(`Angel`, false);

        AD_CurrentAngel = "";
    }
    else {
        await SetSceneItemEnabled(`Devil`, false);

        AD_CurrentDevil = "";
    }

    await AddChapterMarker(`${(angel ? "Angel" : "Devil")} Removed`);

    // await CreateTwitchPoll({
    //     title: `Did Cory complete the ${(angel ? "Angel's" : "Devil's")} task?`,
    //     choices: [
    //         {
    //             title: "Yes"
    //         },
    //         {
    //             title: "No"
    //         }
    //     ],
    // }, 60, true, (result) => {
    //     let success = result.toLowerCase() == "yes";
    //     PlayTextToSpeech(
    //         `Chat thinks Cory ${(success ? "DID" : "DID NOT")} complete his quest with the ${(angel ? "angel" : "devil")}`, AudioType.ImportantStreamEffects);
    // })
    await client.say(process.env.CHANNEL!, `${(angel ? "Angel" : "Devil")}, your quest has ended!`);

    setTimeout(() => {
        if(angel && AD_PendingAngel == "") {
            SelectRole(angel, client);
        }
        else if(!angel && AD_PendingDevil == "") {
            SelectRole(angel, client);
        }
    }, 5000);
    SaveAD();
}
