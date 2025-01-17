import {IsMonsterActive} from "../globals";
import {SetSceneItemEnabled} from "./obsutils";
import {Broadcast} from "../bot";
import {LoadMonsterData, SaveMonsterData, MonsterInfo, GenerateNewMonster} from "./monsterUtils";
import {PlayTextToSpeech} from "./audioUtils";
import {CreateTwitchPoll} from "./twitchUtils";
import {AudioType} from "../streamSettings";
import {UpdateProgressBar} from "./progressBarUtils";


export async function ReceiveMessageFromHTML(message: string) {
    console.log('Received:', JSON.parse(message));
    let dataType: string = JSON.parse(message).type;
    switch (dataType) {
        case 'startup':
            let startupData: { type: string, pageType: string } = JSON.parse(message);
            if(startupData.pageType === 'berightback') {
                IsMonsterActive = true;

                let monsterInfo: MonsterInfo = LoadMonsterData();

                Broadcast(JSON.stringify({ type: 'monsterSetup', monsterType: monsterInfo.Stats.Type, health: monsterInfo.Health, maxHealth: monsterInfo.Stats.MaxHealth }));
            }
            break;
        case 'shutdown':
            let shutdownData: { type: string, pageType: string } = JSON.parse(message);
            if(shutdownData.pageType === 'berightback') {
                IsMonsterActive = false;
            }
            break;
        case 'poll':
            let pollData: { type: string, poll: { title: string, choices: Array<{title: string}>}, pollDuration?: number } = JSON.parse(message);
            await CreateTwitchPoll(pollData.poll, pollData.pollDuration ?? 60);
            break;
        case 'tts':
            let ttsData: { type: string, text: string } =  JSON.parse(message);
            PlayTextToSpeech(ttsData.text, AudioType.GameAlerts);
            break;
        case 'restartMonster':
            GenerateNewMonster();

            await SetSceneItemEnabled("Dragon Fight", true);
            await SetSceneItemEnabled("Dragon Fight Instructions", true);
            await SetSceneItemEnabled("Text Adventure", false);

            break;
        case `updateProgressBar`:
            console.log("Updating Progress Bar")
            UpdateProgressBar();
            break;
    }
}

