import {MessageDelegate} from "../globals";
import {Broadcast} from "../bot";
import {IconType} from "../valueDefinitions";
import {GetObsSourceScale, SetSceneItemEnabled} from "./obsutils";
import {GetRandomItem} from "./utils";
import {Client} from "tmi.js";

let pollRunning = false;
let currentPollData: { title: string, choices: Array<string>} = {};
let whoVoted: Map<string, number> = new Map<string, number>();

export async function CreatePoll(client: Client, poll: { title: string, choices: Array<string>}, pollDuration: number = 60, repeatIfEmpty: boolean = true, callback?: (result: string, voters: Array<string>) => void) {
    console.log("Attempting to start poll")
    if(pollRunning) {
        console.log("Could not start poll as another poll is already running")
        return; //TODO: Figure out what we do here
    }

    pollRunning = true;
    currentPollData = poll;
    whoVoted.clear();

    MessageDelegate.push(CheckPollResponse);

    let choices = [];
    let longestText = 0;
    for (let i = 0; i < poll.choices.length; i++) {
        if(poll.choices[i].length > longestText) {
            longestText = poll.choices[i].length;
        }

        choices.push({
            choice: poll.choices[i],
            votes: 0
        })
    }

    let useBig = longestText >= 20;
    await SetSceneItemEnabled("Poll", !useBig);
    await SetSceneItemEnabled("PollBig", useBig);

    await new Promise(resolve => setTimeout(resolve, 500));

    Broadcast(JSON.stringify({ type: 'showPoll', title: poll.title, choices: choices, duration: pollDuration }));

    await new Promise(resolve => setTimeout(resolve, 1000 * pollDuration));

    await new Promise(resolve => setTimeout(resolve, 1000 * 3));

    let highest = 0;
    for (let i = 0; i < currentPollData.choices.length; i++) {
        let votes = 0;
        for(let index of whoVoted.values()) {
            if(index == i) {
                votes++;
            }
        }

        if(votes > highest) {
            highest = votes;
        }
    }

    if(repeatIfEmpty && highest == 0) {
        setTimeout(() => {
            CreatePoll(client, poll, pollDuration, repeatIfEmpty, callback);
        }, 500);
    }
    else {
        let winners = [];
        for (let i = 0; i < currentPollData.choices.length; i++) {
            let votes = 0;
            for(let index of whoVoted.values()) {
                if(index == i) {
                    votes++;
                }
            }

            if(votes == highest) {
                winners.push(currentPollData.choices[i])
            }
        }

        let winner = "";

        if(winners > 0) {
            winner = GetRandomItem(winners);
        }
        else {
            winner = winners[0];
        }

        if(callback != undefined) {
            console.log(`POLL WINNER: ${winner}`);
            callback(winner, Array.from(whoVoted.keys()));
        }
        else {
            await client.say(process.env.CHANNEL!, `The Poll of "${poll.title}" resulted in chat voting: "${winner}"!`);
        }
    }

    await EndPoll();
}

async function UpdatePoll() {
    let choices = [];

    for (let i = 0; i < currentPollData.choices.length; i++) {
        let votes = 0;
        for(let index of whoVoted.values()) {
            if(index == i) {
                votes++;
            }
        }

        choices.push({
            choice: currentPollData.choices[i],
            votes: votes
        });
    }

    Broadcast(JSON.stringify({ type: 'updatePoll', choices: choices }));
}

async function EndPoll() {
    if(!pollRunning) {
        return;
    }

    pollRunning = false;

    await SetSceneItemEnabled("Poll", false);
    await SetSceneItemEnabled("PollBig", false);

    let index = MessageDelegate.indexOf(CheckPollResponse);
    if(index != -1) {
        MessageDelegate.splice(index, 1);
    }
}

async function CheckPollResponse(username: string, message: string) {
    let chosenIndex = -1;
    for (let i = 0; i < currentPollData.choices.length; i++) {
        if(message.toLowerCase() == currentPollData.choices[i].toLowerCase() ||
           message == (i + 1).toString()) {
            chosenIndex = i;
            break;
        }
    }

    if(chosenIndex != -1) {
        whoVoted.set(username, chosenIndex);
    }

    await UpdatePoll();
}
