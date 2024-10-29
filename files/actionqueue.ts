import {ShowLeaderboard} from "./utils/minigameUtils";

interface ActionSet {
    Action: () => void;
    Seconds: number;
    Username?: string;
}

//Primary actions
let actionQueue: Array<ActionSet> = [];
let isActionRunning = false;

export function AddToActionQueue(action: () => void, seconds: number) {
    actionQueue.push({
        Action: action,
        Seconds: seconds
    });
    if(!isActionRunning) {
        HandleNextItemInQueue();
    }
}

function HandleNextItemInQueue() {
    isActionRunning = true;
    let actionSet = actionQueue[0];
    actionQueue.splice(0, 1);

    actionSet.Action();

    setTimeout(() => {
        isActionRunning = false;
        if(actionQueue.length > 0) {
            HandleNextItemInQueue();
        }
    }, actionSet.Seconds * 1000)
}

//Minigame actions
let minigameQueue: Array<ActionSet> = [];
let isMinigameRunning = false;
export let IsMinigameQueueEmpty : boolean;

export function GetUserMinigameCount(username: string): number {
    return minigameQueue.filter(x => x.Username === username).length;
}

export function AddToMinigameQueue(minigame: () => void, seconds: number, username?: string) {
    IsMinigameQueueEmpty = false;
    minigameQueue.push({
        Action: minigame,
        Seconds: seconds,
        Username: username
    });
    if(!isMinigameRunning) {
        HandleNextMinigameItemInQueue();
    }
}

function HandleNextMinigameItemInQueue() {
    isMinigameRunning = true;
    let minigameSet = minigameQueue[0];
    minigameQueue.splice(0, 1);

    minigameSet.Action();

    setTimeout(async () => {
        isMinigameRunning = false;
        if(minigameQueue.length > 0) {
            HandleNextMinigameItemInQueue();
        }
        else {
            IsMinigameQueueEmpty = true;
        }
    }, minigameSet.Seconds * 1000)
}
