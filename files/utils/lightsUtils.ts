import {AnyDevice, Client} from 'tplink-smarthome-api';
import axios from "axios";

const bottomLightsIp = "192.168.1.3";
const topLightsIp = "192.168.1.4";
const client = new Client();

let defaultLightColor: {
    r: number,
    g: number,
    b: number,
    brightness: number
} | undefined = undefined;

async function GetDevices(): Promise<Array<AnyDevice>> {
    return [
        await client.getDevice({ host: bottomLightsIp }),
        await client.getDevice({ host: topLightsIp }),
    ]
}

export async function SetDefaultLightColor(val: {
    r: number,
    g: number,
    b: number,
    brightness: number
} | undefined) {
    defaultLightColor = val;

    await FadeOutLights();
}

export async function FadeOutLights() {
    if(defaultLightColor === undefined) {
        await SetLightBrightness(0);
    }
    else {
        await SetLightColor(defaultLightColor.r, defaultLightColor.g, defaultLightColor.b);
        await SetLightBrightness(defaultLightColor.brightness);
    }
}

export async function SetLightVisible(state: boolean) {
    try {
        const devices = await GetDevices();
        for(let device: AnyDevice of devices) {
            const light = device as any;
            if (state) {
                await light.setPowerState(true);
                console.log('Light turned on');
            } else {
                await light.setPowerState(false);
                console.log('Light turned off');
            }
        }
    } catch (error) {
        console.error('Error controlling the Kasa light:', error);
    }
}

export async function SetLightBrightness(brightness: number, transitionTime = 100) {
    try {
        const devices = await GetDevices();
        for(let device: AnyDevice of devices) {
            // Check if the device is a smart bulb
            const bulb = device as any;

            // Set brightness
            await bulb.lighting.setLightState({
                brightness: Math.round(brightness * 100), // Convert brightness (0-1) to (0-100)
                transition_period: transitionTime
            });
            console.log(`Brightness set to ${brightness} successfully`);
        }

    } catch (error) {
        console.error('Error setting the brightness:', error);
    }
}

export async function SetLightColor(r: number, g: number, b: number, transitionTime = 100) {
    try {
        r = Math.round((r + Number.EPSILON) * 100) / 100;
        g = Math.round((g + Number.EPSILON) * 100) / 100;
        b = Math.round((b + Number.EPSILON) * 100) / 100;
        const devices = await GetDevices();
        // Convert RGB to HSB
        const { hue, saturation } = rgbToHsb(r, g, b);

        for(let device: AnyDevice of devices) {
            // Check if the device is a smart bulb
            const bulb = device as any;


            // Set color using the HSB values
            await bulb.lighting.setLightState({
                hue: hue,                        // Set the hue (0-360)
                saturation: Math.round(saturation * 100), // Set saturation (0-100)
                transition_period: transitionTime
            });
        }
        console.log(`Color set to (${r}, ${g}, ${b}) successfully. Hue ${hue}, Saturation ${saturation * 100}`);

    } catch (error) {
        console.error('Error setting the color:', error);
    }
}

// Function to convert RGB (0-1) to HSB
function rgbToHsb(r: number, g: number, b: number) {
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    let saturation = 0;

    if (delta !== 0) {
        saturation = delta / max;
        switch (max) {
            case r:
                hue = (g - b) / delta + (g < b ? 6 : 0);
                break;
            case g:
                hue = (b - r) / delta + 2;
                break;
            case b:
                hue = (r - g) / delta + 4;
                break;
        }
        hue *= 60; // Convert to degrees
    }

    hue = Math.round(hue);
    return { hue, saturation };
}

export async function MakeRainbowLights(durationInSeconds: number) {
    let rainbowChangeRate = 1500;
    let totalDuration = durationInSeconds * 1000;

    let loops = Math.floor(totalDuration / rainbowChangeRate);

    let colors = [
        {
            r: 1,
            g: 0,
            b: 0
        },
        {
            r: 0,
            g: 0,
            b: 1
        },
        {
            r: 0,
            g: 1,
            b: 0
        },
    ];

    await SetLightBrightness(1);

    for (let i = 0; i < loops; i++) {
        setTimeout(async () => {
            let col = colors[i % colors.length];

            await SetLightColor(col.r, col.g, col.b);
        }, i * rainbowChangeRate)
    }

    setTimeout(async () => {
        await FadeOutLights();
    }, durationInSeconds * 1000 + 1000);
}

async function SetElgatoLightVisible(deviceIP: string, powerState: boolean) {
    try {
        // Send a PUT request to the Elgato light to set the power state
        const response = await axios.put(`http://${deviceIP}:9123/elgato/lights`, {
            lights: [
                {
                    on: powerState ? 1 : 0
                }
            ]
        });
        console.log(`Elgato light turned ${powerState ? 'on' : 'off'} successfully`, response.data);
    } catch (error) {
        console.error('Error controlling the Elgato light:', error);
    }
}
