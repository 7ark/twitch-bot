import {IsDragonActive} from "../globals";
import {SetSceneItemEnabled} from "./obsutils";
import {Broadcast} from "../bot";
import {LoadDragonData, SaveDragonData} from "./dragonUtils";
import {PlayTextToSpeech} from "./audioUtils";
import {CreatePoll} from "./twitchUtils";


export async function ReceiveMessageFromHTML(message: string) {
    console.log('Received:', JSON.parse(message));
    let dataType: string = JSON.parse(message).type;
    switch (dataType) {
        case 'startup':
            let startupData: { type: string, pageType: string } = JSON.parse(message);
            if(startupData.pageType === 'berightback') {
                IsDragonActive = true;

                let dragonInfo: DragonInfo = LoadDragonData();

                Broadcast(JSON.stringify({ type: 'dragonSetup', info: dragonInfo }));
            }
            break;
        case 'shutdown':
            let shutdownData: { type: string, pageType: string } = JSON.parse(message);
            if(shutdownData.pageType === 'berightback') {
                IsDragonActive = false;
            }
            break;
        case 'poll':
            let pollData: { type: string, poll: { title: string, choices: Array<{title: string}>}, pollDuration?: number } = JSON.parse(message);
            await CreatePoll(pollData.poll, pollData.pollDuration ?? 60);
            break;
        case 'tts':
            let ttsData: { type: string, text: string } =  JSON.parse(message);
            PlayTextToSpeech(ttsData.text);
            break;
        case 'restartdragon':
            let dragonData = LoadDragonData();

            dragonData.Health = dragonData.MaxHealth;
            SaveDragonData(dragonData);

            await SetSceneItemEnabled("Dragon Fight", true);
            await SetSceneItemEnabled("Dragon Fight Instructions", true);
            await SetSceneItemEnabled("Text Adventure", false);

            break;
    }
}

