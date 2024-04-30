import {RotateOBSSource, SetFilterEnabled} from "./obsutils";
import {exec} from "child_process";

const display = 1; //1 is normally default but

export async function SetMonitorRotationTemporarily(rotation: number, timeInSeconds: number) {
    await ChangeDisplayOrientation(rotation);

    await setTimeout(() => {
        ChangeDisplayOrientation(0);
    }, timeInSeconds * 1000);
}

// DO NOT CALL THIS FUNCTION ON ITS OWN (Or monitor gets stuck without changing back)
async function ChangeDisplayOrientation(rotation: number) {
    const command = `display.exe /device ${display} /rotate:${rotation}`;

    await RotateOBSSource("Main Display", rotation);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

export async function SetMonitorBrightnessContrastTemporarily(value: number, timeInSeconds: number) {
    await SetMonitorBrightness(value);
    setTimeout(async () => {
        await SetMonitorContrast(value);
    }, 200);

    await SetFilterEnabled("Main Display", "Shroud Filter", true);

    await setTimeout(async () => {
        await SetMonitorBrightness(87);
        setTimeout(async () => {
            await SetMonitorContrast(56);
        }, 200);

        await SetFilterEnabled("Main Display", "Shroud Filter", false);
    }, timeInSeconds * 1000);
}

async function SetMonitorBrightness(value: number) {
    const command = `display.exe /device ${display} /brightness:${value}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

async function SetMonitorContrast(value: number) {
    const command = `display.exe /device ${display} /contrast:${value}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}
