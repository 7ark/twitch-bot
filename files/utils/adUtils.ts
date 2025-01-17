import {Client} from "tmi.js";
import {GetAdSchedule} from "./twitchUtils";
import fs from "fs";
import {ConvertUnixToDateTime, GetSecondsBetweenDates} from "./utils";
import {PlaySound} from "./audioUtils";
import {AudioType} from "../streamSettings";

export let AdsRunning = false;
let nextAdTime: Date | undefined = undefined;

export async function SetupNextAdsTime() {
    let adSchedule = await GetAdSchedule(process.env.CHANNEL_ID);

    console.log(adSchedule.data);

    nextAdTime = ConvertUnixToDateTime(adSchedule.data[adSchedule.data.length - 1].next_ad_at);

    if(nextAdTime !== undefined) {
        ScheduleAdAlarms();
    }
}

function ScheduleAdAlarms() {
    let secondsUntilAds = GetSecondsBetweenDates(new Date(), nextAdTime!);
    let minutesUntilAds = secondsUntilAds / 60;

    let threeMinuteWarning = (secondsUntilAds - (3 * 60)) * 1000;
    if(minutesUntilAds > 3) {
        console.log(`Setting ad timer for ${threeMinuteWarning}ms`)
        setTimeout(() => {
            PlaySound("adprewarning", AudioType.ImportantStreamEffects);
        }, threeMinuteWarning)
    }
    else {
        console.log(`Failed setting three minute alarm because there's not enough time! There's ${secondsUntilAds} until ads!`)
    }

    let thirtySecondWarning = (secondsUntilAds - 30) * 1000;
    if(secondsUntilAds > 30) {
        console.log(`Setting ad timer for ${thirtySecondWarning}ms`)
        setTimeout(() => {
            PlaySound("adstarting", AudioType.ImportantStreamEffects);
        }, thirtySecondWarning)
    }
    else {
        console.log(`Failed setting thirty second alarm because there's not enough time! There's ${secondsUntilAds} until ads!`)
    }
}

export async function ProcessAds(client: Client, duration: number) {
    await client.say(process.env.CHANNEL!, `ADS HAVE STARTED! Double EXP for the next ${duration} seconds. Don't forget you can still interact with all the normal chat functionality during this time.`);
    AdsRunning = true;

    setTimeout(async () => {
        AdsRunning = false;
        await client.say(process.env.CHANNEL!, `ADS HAVE ENDED! Double EXP disabled.`);
    }, 1000 * duration)

    setTimeout(() => {
        SetupNextAdsTime();
    }, 1000 * duration + 10000);
}
