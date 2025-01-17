import fs from "fs";
import {Broadcast} from "../bot";
import {TriggerScare} from "./scareUtils";
import {Client} from "tmi.js";
import {GetSceneItemEnabled} from "./obsutils";

export const ProgressBarMax = 100;
let doingEffect = false;

export interface ProgressBarInfo {
    Progress: number;
}

async function IsProgressBarActive() {
    return await GetSceneItemEnabled("Progress Bar") && await GetSceneItemEnabled("ProgressBar");;
}

export function GetCurrentProgress() {
    if(currentProgressBar === undefined) {
        LoadProgressBar(false);
    }

    return currentProgressBar.Progress;
}

let currentProgressBar: ProgressBarInfo;

export function LoadProgressBar(update: boolean = true) {
    if(fs.existsSync('progressBar.json')) {
        currentProgressBar = JSON.parse(fs.readFileSync('progressBar.json', 'utf-8'));
    }
    else {
        currentProgressBar = {
            Progress: 0
        };
    }

    if(update) {
        UpdateProgressBar();
    }
}

export function UpdateProgressBar() {
    if(currentProgressBar === undefined) {
        LoadProgressBar(false);
    }

    Broadcast(JSON.stringify({ type: 'progressBar', fill: currentProgressBar.Progress, max: ProgressBarMax }));
}

function SaveProgress() {
    if(currentProgressBar === undefined) {
        LoadProgressBar(false);
    }

    fs.writeFileSync('progressBar.json', JSON.stringify(currentProgressBar));
}

export async function ChangeProgressBar(client: Client, changeAmount: number) {
    if(await IsProgressBarActive()) {
        return;
    }
    if(currentProgressBar === undefined) {
        LoadProgressBar(false);
    }

    currentProgressBar.Progress += changeAmount;

    if(currentProgressBar.Progress > ProgressBarMax) {
        currentProgressBar.Progress = ProgressBarMax;
    }
    else if(currentProgressBar.Progress < 0) {
        currentProgressBar.Progress = 0;
    }

    SaveProgress();
    UpdateProgressBar();

    if(currentProgressBar.Progress >= ProgressBarMax) {
        //Trigger effect
        await TriggerProgressBarCompletion(client);
    }
}

async function TriggerProgressBarCompletion(client: Client) {
    doingEffect = true;
    //Do something, depends on progress bar
    await TriggerScare(client);

    setTimeout(() => {
        currentProgressBar.Progress = 0;
        SaveProgress();
        UpdateProgressBar();

        doingEffect = false;
    }, 500);
}
