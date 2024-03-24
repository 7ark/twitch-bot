import OBSWebSocket from "obs-websocket-js";

const obs = new OBSWebSocket();

export async function connectToObs() {
    console.log(`Connecting to OBS`);
    await obs.connect('ws://127.0.0.1:4455', 'loafloaf').catch(e => console.error(e));

    // console.log("id: ", await getSceneItemIdByName("Content", "Streaming Primary"))
    // await rotateSource("Content", "Streaming Primary Backup", 180);
    // const response = await obs.call('GetSceneItemTransform', {
    //     sceneName: "Streaming Primary Backup",
    //     sceneItemId: await getSceneItemIdByName("Content", "Streaming Primary Backup")
    // });
    // console.log(response)
}

export function disconnectFromObs() {
    obs.disconnect();
}

async function getSceneItemIdByName(name: string, sceneName: string) {
    const response = await obs.call('GetSceneItemId', {
        sceneName: sceneName,
        sourceName: name
    });

    return response.sceneItemId;
}

export async function rotateOBSSource(name: string, sceneName: string, rotationDegrees: number) {
    const response = await obs.call('SetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await getSceneItemIdByName(name, sceneName),
        sceneItemTransform: {
            rotation: rotationDegrees,
        }
    });
}


export async function setFilterEnabled(name: string, filterName: string, enabled: boolean) {
    const response = await obs.call('SetSourceFilterEnabled', {
        sourceName: name,
        filterName: filterName,
        filterEnabled: enabled,
    });
}


export async function setAudioMute(name: string, muted: boolean) {
    const response = await obs.call('SetInputMute', {
        inputName: name,
        inputMuted: muted
    });
}
