import {GiveExp, GivePlayerRandomObjectInTier, LoadPlayer, SavePlayer} from "./playerGameUtils";
import {GetRandomEnum, GetRandomIntI, GetRandomItem} from "./utils";
import {Client} from "tmi.js";
import {ObjectRetrievalType, ObjectTier} from "../inventoryDefinitions";
import {Quest, QuestType} from "../valueDefinitions";


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
        case QuestType.LevelUp:
            return `Level up ${goalValue} times`;
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
            switch (difficulty) {
                case 1:
                    multiplyArray = [ 50, 100, 200 ];
                    break;
                case 2:
                    multiplyArray = [ 200, 250, 300 ];
                    break;
                case 3:
                    multiplyArray = [ 300, 400];
                    break;
                case 4:
                    multiplyArray = [ 400, 500 ];
                    break;
                case 5:
                    multiplyArray = [ 500, 750, 1000 ];
                    break;
            }
            return GetRandomIntI(difficulty, difficulty * 2) * GetRandomItem(multiplyArray);
        case QuestType.TellJoke:
            return GetRandomIntI(2, difficulty) * GetRandomItem(multiplyArray);
        case QuestType.GetItem:
            return GetRandomIntI(difficulty, difficulty * 2) * GetRandomItem(multiplyArray);
        case QuestType.Gamble:
            return GetRandomIntI(difficulty, difficulty * 3) * GetRandomItem(multiplyArray);
        case QuestType.LevelUp:
            return difficulty;
    }
}

function GetRandomQuestType(): QuestType {
    return GetRandomItem<QuestType>([
        QuestType.DoCook,
        QuestType.DoMine,
        QuestType.DoFish,
        QuestType.DealDamage,
        QuestType.GetItem,
        QuestType.Gamble,
        QuestType.LevelUp
    ])!;
}

export function GetRandomQuest(difficultyOverride: number = -1): Quest {
    let type = GetRandomQuestType();

    let difficulty = difficultyOverride != -1 ? difficultyOverride : GetRandomIntI(1, 5);
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

    let safety = 0;
    while (true) {
        let previousType = player.CurrentQuest == undefined ? undefined : player.CurrentQuest?.Type
        player.CurrentQuest = GetRandomQuest(player.Level <= 1 ? GetRandomIntI(1, 2) : -1);

        if(previousType == undefined || player.CurrentQuest.Type != previousType || player.Level <= 1) {
            break;
        }

        safety++;
        if(safety >= 100) {
            break;
        }
    }

    await client.say(process.env.CHANNEL!, `@${username}, you've been given a QUEST: ${GetQuestText(player.CurrentQuest.Type, player.CurrentQuest.Goal)}. This is a difficulty ${player.CurrentQuest.FiveStarDifficulty} quest.`);

    SavePlayer(player);
}

async function GiveQuestRewards(client: Client, username: string, difficulty: number) {
    let exp = 1;
    let coins = 0;
    switch (difficulty) {
        case 1:
            exp = GetRandomIntI(10, 25);
            break;
        case 2:
            exp = GetRandomIntI(25, 50);
            if(GetRandomIntI(1, 3) == 1) {
                await GivePlayerRandomObjectInTier(client, username, [ObjectTier.Low], ObjectRetrievalType.RandomReward);
            }
            break;
        case 3:
            exp = GetRandomIntI(50, 75);
            if(GetRandomIntI(1, 2) == 1) {
                await GivePlayerRandomObjectInTier(client, username, [ObjectTier.Low, ObjectTier.Mid], ObjectRetrievalType.RandomReward);
            }
            coins = GetRandomIntI(2, 5);
            break;
        case 4:
            exp = GetRandomIntI(100, 150);
            await GivePlayerRandomObjectInTier(client, username, [ObjectTier.Mid], ObjectRetrievalType.RandomReward);
            coins = GetRandomIntI(5, 10);
            break;
        case 5:
            exp = GetRandomIntI(150, 300)
            coins = GetRandomIntI(10, 15);
            await GivePlayerRandomObjectInTier(client, username, [ObjectTier.Mid, ObjectTier.High], ObjectRetrievalType.RandomReward);
            break;
    }

    if(coins > 0) {
        let player = LoadPlayer(username);
        player.ByteCoins += coins;
        SavePlayer(player);
    }

    await GiveExp(client, username, exp);
    await client.say(process.env.CHANNEL!, `@${username}, you've received ${exp} EXP${(coins > 0 ? `, and ${coins} Bytecoins` : ``)} as a reward!`);
}

export async function HandleQuestProgress(client: Client, username: string, type: QuestType, addedProgress: number) {
    addedProgress = Math.round(addedProgress);
    if(DoesPlayerHaveQuest(username)){
        let player = LoadPlayer(username);

        if(player.CurrentQuest!.Type == type) {
            player.CurrentQuest!.Progress += addedProgress;
            player.CurrentQuest!.Progress = Math.floor(player.CurrentQuest!.Progress);
            if(player.CurrentQuest?.Progress >= player.CurrentQuest?.Goal) {
                //Quest complete!
                await client.say(process.env.CHANNEL!, `@${username}, you've completed your quest!`);

                let difficulty = player.CurrentQuest!.FiveStarDifficulty;
                player.CurrentQuest = undefined;
                SavePlayer(player);

                await GiveQuestRewards(client, username, difficulty);
            }
            else {
                SavePlayer(player);
            }

        }
    }
}
