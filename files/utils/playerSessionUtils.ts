import fs from "fs";
import {GetRandomItem} from "./utils";
import {LoadPlayer} from "./playerGameUtils";

export interface PlayerSessionData {
    NameAsDisplayed: string;
    Messages: Array<string>;
    TimesAttackedEnemy: number;
    NameColor?: string;
    IsSubscribed: boolean;
    TimesDied: number;
    AttackedEnemySinceDeath: boolean;
    LastMessageTime: Date;
    SeenChristmasMessage: boolean;
}
let allPlayerSessionData: Map<string, PlayerSessionData> = new Map<string, PlayerSessionData>();
let timestamp: Date;

export function UpdatePlayerSessionData() {

    if(fs.existsSync('playersessions.json')) {
        let loadedInfo = JSON.parse(fs.readFileSync('playersessions.json', 'utf-8'));
        allPlayerSessionData = Array.isArray(loadedInfo.data) ? new Map<string, PlayerSessionData>(loadedInfo.data) : new Map<string, PlayerSessionData>();

        if(allPlayerSessionData === undefined || allPlayerSessionData === null) {
            allPlayerSessionData = new Map<string, PlayerSessionData>();
        }
    }
    else {
        allPlayerSessionData = new Map<string, PlayerSessionData>();
    }
}

export function GetAllPlayerSessions() {
    UpdatePlayerSessionData();
    let sessionsAsArray = Array.from(allPlayerSessionData.values());

    return sessionsAsArray;
}

export function GetAllPlayerSessionsRaw() {
    UpdatePlayerSessionData();

    return allPlayerSessionData;
}

export function LoadRandomPlayerSession(exclusions?: Array<string>, excludePassiveMode: boolean = false, hasAtLeastOneMessage: boolean = false) {
    let sessionsAsArray = Array.from(allPlayerSessionData.keys());

    if(exclusions !== undefined) {
        for (let i = 0; i < exclusions.length; i++) {
            let index = sessionsAsArray.indexOf(exclusions[i]);
            if(index != -1) {
                sessionsAsArray.splice(index, 1);
            }
        }
    }

    for (let i = sessionsAsArray.length - 1; i >= 0; i--) {
        let player = LoadPlayer(sessionsAsArray[i].toLowerCase());
        let session: PlayerSessionData = allPlayerSessionData.get(sessionsAsArray[i]);
        if(excludePassiveMode && (player.PassiveModeEnabled || player.Level == 0)) {
            sessionsAsArray.splice(i, 1);
        }
        else if(hasAtLeastOneMessage && session.Messages.length == 0) {
            sessionsAsArray.splice(i, 1);
        }
    }

    if(sessionsAsArray.length == 0) {
        return LoadPlayerSession("the7ark");
    }
    else {
        return LoadPlayerSession(GetRandomItem(sessionsAsArray)!);
    }

}

export function LoadPlayerSession(displayName: string) {
    let fullDisplayName = displayName;
    let session: PlayerSessionData = {
        NameAsDisplayed: fullDisplayName,
        Messages: [],
        TimesAttackedEnemy: 0,
        NameColor: undefined,
        TimesDied: 0,
        IsSubscribed: false,
        AttackedEnemySinceDeath: false,
        LastMessageTime: new Date(),
        SeenChristmasMessage: false
    }
    displayName = displayName.toLowerCase();

    UpdatePlayerSessionData();

    if(allPlayerSessionData.has(displayName)) {
        session = allPlayerSessionData.get(displayName)!;
    }

    return session;
}

export function SavePlayerSession(displayName: string, session: PlayerSessionData) {
    displayName = displayName.toLowerCase();
    allPlayerSessionData.set(displayName, session);

    // console.trace("SAVING " + displayName);
    // console.log(session.AttackedEnemySinceDeath);

    timestamp = new Date();

    fs.writeFileSync('playersessions.json', JSON.stringify({
        data: Array.from(allPlayerSessionData),
        timestamp: timestamp.toISOString()
    }));
}

export function UpdateSessionTimestamp() {
    timestamp = new Date();

    fs.writeFileSync('playersessions.json', JSON.stringify({
        data: Array.from(allPlayerSessionData),
        timestamp: timestamp
    }));
}

export function GetStringifiedSessionData(): string {
    return JSON.stringify(Array.from(allPlayerSessionData));
}

export function HandleLoadingSession() {
    if(fs.existsSync('playersessions.json')) {
        let loadedInfo = JSON.parse(fs.readFileSync('playersessions.json', 'utf-8'));
        timestamp = new Date(loadedInfo.timestamp);

        const hourDifference = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);
        if (hourDifference > 1) {
            console.log("Wiping Player Session Info")
            fs.unlinkSync('playersessions.json')
        }
    }

}
