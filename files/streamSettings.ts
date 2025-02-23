
export enum AudioType {
    UserTTS, //Twitch users are doing TTS at me
    UserGameActions, //Unique moves like silence, or teleport, etc. and the SFX that goes with that
    GameAlerts, //This is for gambling, or the chat challenges
    StreamInfrastructure, //This includes things like credits
    ImportantStreamEffects, //This is stuff that I may want louder than game alerts but quieter than infrastructure, like scare alerts
    Ads,
}

interface StreamSettings {
    volume: Map<AudioType, number>;
    doesRandomChatChallenges: boolean;
    cooldownMultiplier: number;
    challengeType?: string;
}

//Playing alone, casually
const SOLO_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.8],
        [AudioType.UserGameActions, 0.8],
        [AudioType.GameAlerts, 0.4],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 1],
        [AudioType.Ads, 1],
    ]),
    doesRandomChatChallenges: true,
    cooldownMultiplier: 1
}
//Playing alone, but I want chill vibes
const SOLO_CHILL_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.6],
        [AudioType.UserGameActions, 0.6],
        [AudioType.GameAlerts, 0.2],
        [AudioType.StreamInfrastructure, 0.8],
        [AudioType.ImportantStreamEffects, 1],
        [AudioType.Ads, 0.3],
    ]),
    doesRandomChatChallenges: true,
    cooldownMultiplier: 3
}

//Playing alone, but i wanna pay attention to story
const SOLO_STORY_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.8],
        [AudioType.UserGameActions, 0.5],
        [AudioType.GameAlerts, 0.3],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 0.7],
        [AudioType.Ads, 0],
    ]),
    doesRandomChatChallenges: false,
    cooldownMultiplier: 3
}

//Playing with others
const COLLAB_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0],
        [AudioType.UserGameActions, 0.4],
        [AudioType.GameAlerts, 0.05],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 0.5],
        [AudioType.Ads, 0],
    ]),
    doesRandomChatChallenges: false,
    cooldownMultiplier: 2
}

//Playing with others, story game
const COLLAB_STORY_SETTINGS: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 0.1],
        [AudioType.UserGameActions, 0.05],
        [AudioType.GameAlerts, 0],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 0.2],
        [AudioType.Ads, 0],
    ]),
    doesRandomChatChallenges: false,
    cooldownMultiplier: 3
}

//Playing alone, casually
const GTA_CHALLENGE_NEEDRIDE: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 1],
        [AudioType.UserGameActions, 0.3],
        [AudioType.GameAlerts, 0],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 1],
        [AudioType.Ads, 0],
    ]),
    doesRandomChatChallenges: false,
    cooldownMultiplier: 3,
    challengeType: "gta_needride"
}

const COOK_CHALLENGE: StreamSettings = {
    volume: new Map<AudioType, number>([
        [AudioType.UserTTS, 1],
        [AudioType.UserGameActions, 0.3],
        [AudioType.GameAlerts, 0],
        [AudioType.StreamInfrastructure, 1],
        [AudioType.ImportantStreamEffects, 1],
        [AudioType.Ads, 0],
    ]),
    doesRandomChatChallenges: false,
    cooldownMultiplier: 3,
    challengeType: "cook"
}

//I SET MY SETTINGS HERE
export const CurrentStreamSettings: StreamSettings = SOLO_SETTINGS;
