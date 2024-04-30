interface ActionSet {
    Action: () => void;
    Seconds: number;
}

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
