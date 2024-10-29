
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

//Playing alone, casually
const SOLO_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.8],
        [AudioType.UserGameActions, 0.8],
        [AudioType.GameAlerts, 0.8],
        [AudioType.StreamInfrastructure, 1],
    ]),
    doesRandomChatChallenges: true
}

//Playing alone, but i wanna pay attention to story
const SOLO_STORY_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.8],
        [AudioType.UserGameActions, 0.5],
        [AudioType.GameAlerts, 0.3],
        [AudioType.StreamInfrastructure, 1],
    ]),
    doesRandomChatChallenges: false
}

//Playing with others
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
