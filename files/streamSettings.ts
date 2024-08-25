
export enum AudioType {
    UserTTS, //Twitch users are doing TTS at me
    UserGameActions, //Unique moves like silence, or teleport, etc. and the SFX that goes with that
    GameAlerts, //This is for gambling, or the chat challenges
    StreamInfrastructure, //This includes things like credits
}

interface StreamSettings {
    volume: Map<AudioType, number>;
    doesRandomChatChallenges: boolean;
}

const SOLO_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.8],
        [AudioType.UserGameActions, 0.8],
        [AudioType.GameAlerts, 0.8],
        [AudioType.StreamInfrastructure, 1],
    ]),
    doesRandomChatChallenges: true
}

const COLLAB_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.6],
        [AudioType.UserGameActions, 0.4],
        [AudioType.GameAlerts, 0.2],
        [AudioType.StreamInfrastructure, 1],
    ]),
    doesRandomChatChallenges: false
}

//I SET MY SETTINGS HERE
export const CurrentStreamSettings: StreamSettings = SOLO_SETTINGS;
