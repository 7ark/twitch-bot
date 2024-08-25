import {GiveExp, GivePlayerRandomObjectInTier, LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetRandomEnum, GetRandomIntI, GetRandomItem} from "./utils";
import {Client} from "tmi.js";
import {ObjectTier} from "../inventory";

export enum QuestType {
    DoCook,
    DoMine,
    DoFish,
    DealDamage,
    TellJoke,
    GetItem,
    Gamble
}

export interface Quest {
    Type: QuestType;
    Progress: number;
    Goal: number;
    FiveStarDifficulty: number;
}

export function GetQuestText(type: QuestType, goalValue: number): string {
    let timesText = goalValue == 1 ? `time` : `times`;

    switch (type) {
        case QuestType.DoCook:
            return `Play the !cook minigame ${goalValue} ${timesText}`;
        case QuestType.DoMine:
            return `Play the !mine minigame ${goalValue} ${timesText}`;
        case QuestType.DoFish:
            return `Play the !fish minigame ${goalValue} ${timesText}`;
        case QuestType.DealDamage:
            return `Deal ${goalValue} damage to any enemy`;
        case QuestType.TellJoke:
            return `Use the 'Tell a Joke' channel point redemption ${goalValue} ${timesText}`
        case QuestType.GetItem:
            return `Gain ${goalValue} ${goalValue == 1 ? `item` : `items`}`;
        case QuestType.Gamble:
            return `Gamble ${goalValue} ${goalValue == 1 ? `time` : `times`}`
    }
}

function GetRandomGoalValue(type: QuestType, difficulty: number): number {

    let multiplyArray = [ 1 ];

    switch (type) {
        case QuestType.DoCook:
        case QuestType.DoMine:
        case QuestType.DoFish:
            switch (difficulty) {
                case 1:
                    multiplyArray = [ 5, 10 ];
                    break;
                case 2:
                    multiplyArray = [ 5, 10, 15 ];
                    break;
                case 3:
                    multiplyArray = [ 15, 20 ];
                    break;
                case 4:
                    multiplyArray = [ 20, 25 ];
                    break;
                case 5:
                    multiplyArray = [ 20, 25, 30 ];
                    break;
            }

            return GetRandomIntI(difficulty, difficulty + 3) * GetRandomItem(multiplyArray);
        case QuestType.DealDamage:
            multiplyArray = [ 20, 25, 30, 40, 50 ];
            return GetRandomIntI(difficulty, difficulty * 5) * GetRandomItem(multiplyArray);
        case QuestType.TellJoke:
            return GetRandomIntI(difficulty, difficulty * 2) * GetRandomItem(multiplyArray);
        case QuestType.GetItem:
            return GetRandomIntI(difficulty, difficulty * 2) * GetRandomItem(multiplyArray);
        case QuestType.Gamble:
            return GetRandomIntI(difficulty, difficulty * 3) * GetRandomItem(multiplyArray);
    }
}

export function GetRandomQuest(): Quest {
    let type = GetRandomEnum(QuestType);

    let difficulty = GetRandomIntI(1, 5);
    let goalValue = GetRandomGoalValue(type, difficulty);

    console.log(type + " " + difficulty + " " + goalValue);

    return {
        Type: type,
        Progress: 0,
        Goal: goalValue,
        FiveStarDifficulty: difficulty
    };
}

export function DoesPlayerHaveQuest(username: string): boolean {
    return LoadPlayer(username).CurrentQuest != undefined;
}

export async function GivePlayerRandomQuest(client: Client, username: string) {
    let player = LoadPlayer(username);

    player.CurrentQuest = GetRandomQuest();

    await client.say(process.env.CHANNEL!, `@${username}, you've been given a QUEST: ${GetQuestText(player.CurrentQuest.Type, player.CurrentQuest.Goal)}. This is a difficulty ${player.CurrentQuest.FiveStarDifficulty} quest.`);

    SavePlayer(player);
}

async function GiveQuestRewards(client: Client, username: string, difficulty: number) {
    switch (difficulty) {
        case 1:
            await GiveExp(client, username, GetRandomIntI(10, 25));
            break;
        case 2:
            await GiveExp(client, username, GetRandomIntI(25, 50));
            if(GetRandomIntI(1, 5) == 1) {
                GivePlayerRandomObjectInTier(client, username, [ObjectTier.Low]);
            }
            break;
        case 3:
            await GiveExp(client, username, GetRandomIntI(50, 75));
            if(GetRandomIntI(1, 3) == 1) {
                GivePlayerRandomObjectInTier(client, username, [ObjectTier.Low, ObjectTier.Mid]);
            }
            break;
        case 4:
            await GiveExp(client, username, GetRandomIntI(100, 150));
            GivePlayerRandomObjectInTier(client, username, [ObjectTier.Low, ObjectTier.Mid]);
            break;
        case 5:
            await GiveExp(client, username, GetRandomIntI(150, 200));
            if(GetRandomIntI(1, 3) == 1) {
                GivePlayerRandomObjectInTier(client, username, [ObjectTier.Mid, ObjectTier.High]);
            }
            break;
    }
}

export async function HandleQuestProgress(client: Client, username: string, type: QuestType, addedProgress: number) {
    if(DoesPlayerHaveQuest(username)){
        let player = LoadPlayer(username);

        if(player.CurrentQuest!.Type == type) {
            player.CurrentQuest!.Progress += addedProgress;
            if(player.CurrentQuest?.Progress >= player.CurrentQuest?.Goal) {
                //Quest complete!
                await client.say(process.env.CHANNEL!, `@${username}, you've completed your quest!`);

                await GiveQuestRewards(client, username, player.CurrentQuest!.FiveStarDifficulty);
                player.CurrentQuest = undefined;
            }

            SavePlayer(player);
        }
    }
}
