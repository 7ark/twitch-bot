import fs from "fs";
import {Client} from "tmi.js";
import {WhisperUser} from "./twitchUtils";
import {GetRandomInt} from "./utils";
import {CurrentGTARider} from "../globals";
import {Broadcast} from "../bot";
import {PlayTextToSpeech} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {DoesSceneContainItem, GetOpenScene, GetSceneItemEnabled, SetSceneItemEnabled, SetTextValue} from "./obsutils";

export const VEHICLE_OPTIONS = [
    "taxi",
    "limo",
    "beefcake", //This is the armed limo??
    "limogun",
    "taco",
    "blimp",
    "helicopter",
    "tank",
    "golf",
    "bus",
    "tractor",
    "bicycle",
    "tron",
    "jet",
];
export let GTA_CurrentRiders: Array<string> = [];
export let GTA_CurrentRidersVehicle: Map<string, string> = new Map<string, string>();
export let GTA_Reviews: Array<string> = [];
export let GTA_Ratings: Array<number> = [];
let previousRiders: Array<string> = [];
export let GTA_CurrentRating: number = 5;

function GetGTAData(): string {
    return JSON.stringify({
        gtaReviews: GTA_Reviews,
        gtaRatings: GTA_Ratings,
        previousRiders,
        currentRating: GTA_CurrentRating
    });
}

// Load from JSON
function ConvertGTAData(jsonStr: string): void {
    const data = JSON.parse(jsonStr);
    ({gtaReviews: GTA_Reviews, gtaRatings: GTA_Ratings, previousRiders, currentRating: GTA_CurrentRating} = data);
}

export function SaveGTA(): void {
    const jsonData = GetGTAData();
    fs.writeFileSync('gta.json', jsonData);
}

function LoadGTA(): void {
    if(!fs.existsSync('gta.json')) {
        return;
    }
    const jsonData = fs.readFileSync('gta.json', 'utf8');
    ConvertGTAData(jsonData);
}

export async function LetsRide(client: Client, displayName: string) {
    if(GTA_CurrentRiders.length == 0) {
        await WhisperUser(client, displayName, `There's no riders! Use !ineedaride to join the Limo`);
        return;
    }

    let rider = ``;
    let filteredOptions = GTA_CurrentRiders.filter(x => !previousRiders.includes(x));

    if(filteredOptions.length > 0) {
        rider = filteredOptions[GetRandomInt(0, filteredOptions.length)];
    }
    else {
        rider = GTA_CurrentRiders[GetRandomInt(0, GTA_CurrentRiders.length)];
    }

    let vehicle = GTA_CurrentRidersVehicle.get(rider);

    if(vehicle == undefined) {
        vehicle = "random";
    }

    CurrentGTARider = rider.toLowerCase();
    Broadcast(JSON.stringify({ type: 'rider', rider: rider, vehicle: vehicle }));
    GTA_CurrentRiders = [];
    GTA_CurrentRidersVehicle.clear();
    await PlayTextToSpeech(`A new rider has entered the vehicle: Welcome ${rider}`, AudioType.ImportantStreamEffects);
    await WhisperUser(client, displayName, `The current rider has been chosen! @${rider} is in the limo. Use !locations to see where you can go.`);

    const taxiGroup = "TaxiGroup";

    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, taxiGroup)) {
        return;
    }

    await SetSceneItemEnabled(taxiGroup, true);
    await SetTextValue("StickmanName", rider);

    await UpdateStarVisuals();
}

export async function UpdateStarVisuals() {
    const taxiGroup = "TaxiGroup";

    let sceneName = await GetOpenScene();
    let isTaxiVisible = await DoesSceneContainItem(sceneName, taxiGroup) && await GetSceneItemEnabled(taxiGroup);

    GTA_CurrentRating = Math.floor(GTA_CurrentRating);
    Broadcast(JSON.stringify({ type: 'stars', stars: GTA_CurrentRating }));

    for (let i = 1; i <= 5; i++) {
        let star = `Star${i}`;

        let sceneName = await GetOpenScene();

        if(!await DoesSceneContainItem(sceneName, star)) {
            return;
        }

        await SetSceneItemEnabled(star, i <= GTA_CurrentRating && isTaxiVisible);
    }
}

LoadGTA();
