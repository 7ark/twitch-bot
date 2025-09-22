import {Client} from "tmi.js";
import {GetAdSchedule} from "./twitchUtils";
import fs from "fs";
import {ConvertUnixToDateTime, GetSecondsBetweenDates} from "./utils";
import {PlaySound} from "./audioUtils";
import {AudioType} from "../streamSettings";

export let AdsRunning = false;
let nextAdTime: Date | undefined = undefined;

export async function SetupNextAdsTime(client: Client) {
    let adSchedule = await GetAdSchedule(process.env.CHANNEL_ID);

    console.log(adSchedule.data);

    nextAdTime = ConvertUnixToDateTime(adSchedule.data[adSchedule.data.length - 1].next_ad_at);

    if(nextAdTime !== undefined) {
        ScheduleAdAlarms(client);
    }
}

function ScheduleAdAlarms(client: Client) {
    let secondsUntilAds = GetSecondsBetweenDates(new Date(), nextAdTime!);
    let minutesUntilAds = secondsUntilAds / 60;

    let threeMinuteWarning = (secondsUntilAds - (3 * 60)) * 1000;
    if(minutesUntilAds > 3) {
        console.log(`Setting ad timer for ${threeMinuteWarning}ms`)
        setTimeout(async () => {
            await client.say(process.env.CHANNEL!, `Ads are starting in 3 minutes! Our players will be taking a break during this time.`);
            // PlaySound("adprewarning", AudioType.Ads);
        }, threeMinuteWarning)
    }
    else {
        console.log(`Failed setting three minute alarm because there's not enough time! There's ${secondsUntilAds} until ads!`)
    }

    // let thirtySecondWarning = (secondsUntilAds - 30) * 1000;
    // if(secondsUntilAds > 30) {
    //     console.log(`Setting ad timer for ${thirtySecondWarning}ms`)
    //     setTimeout(() => {
    //         PlaySound("adstarting", AudioType.Ads);
    //     }, thirtySecondWarning)
    // }
    // else {
    //     console.log(`Failed setting thirty second alarm because there's not enough time! There's ${secondsUntilAds} until ads!`)
    // }
}

export async function ProcessAds(client: Client, duration: number) {
    await client.say(process.env.CHANNEL!, `Ads have started! Our players will be taking a break.`);
    AdsRunning = true;

    setTimeout(async () => {
        AdsRunning = false;
        await client.say(process.env.CHANNEL!, `Ads have ended! Players will be back soon.`);
    }, 1000 * duration)

    setTimeout(() => {
        SetupNextAdsTime(client);
    }, 1000 * duration + 10000);
}
