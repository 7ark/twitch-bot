import OBSWebSocket from "obs-websocket-js";

const obs = new OBSWebSocket();
export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 1080;

export async function ConnectToObs() {
    console.log(`Connecting to OBS`);
    await obs.connect('ws://127.0.0.1:4455', 'loafloaf').catch(e => console.error(e));

    // console.log("id: ", await GetSceneItemIdByName("Content", "Streaming Primary"))
    // await rotateSource("Content", "Streaming Primary Backup", 180);
    // const response = await obs.call('GetSceneItemTransform', {
    //     sceneName: "Streaming Primary Backup",
    //     sceneItemId: await GetSceneItemIdByName("Content", "Streaming Primary Backup")
    // });
    // console.log(response)
}

export function DisconnectFromObs() {
    obs.disconnect();
}

export async function GetOpenScene() {
    const response = await obs.call('GetSceneList');

    return response.currentProgramSceneName;
}

async function GetSceneItems(sceneName: string) {
    const response = await obs.call('GetSceneItemList', {
        sceneName: sceneName
    });

    return response.sceneItems;
}

export async function DoesSceneContainItem(sceneName: string, itemName: string) : Promise<boolean> {
    const response = await obs.call('GetSceneItemList', {
        sceneName: sceneName
    });

    for (let i = 0; i < response.sceneItems.length; i++) {
        if(response.sceneItems[i].sourceName === itemName) {
            return true;
        }
    }

    return false;
}

async function GetSceneItemIdByName(name: string, sceneName: string) {
    const response = await obs.call('GetSceneItemId', {
        sceneName: sceneName,
        sourceName: name
    });

    return response.sceneItemId;
}

export async function GetObsSourceScale(name: string): Promise<{ x: number, y: number }> {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('GetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName)
    });

    return {
        x: <number>response.sceneItemTransform.scaleX,
        y: <number>response.sceneItemTransform.scaleY
    };
}

export async function SetObsSourceScale(name: string, x: number, y: number) {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('SetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName),
        sceneItemTransform: {
            scaleX: x,
            scaleY: y
        }
    });
}

export async function GetObsSourcePosition(name: string): Promise<{ x: number, y: number, width: number, height: number }> {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('GetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName)
    });

    return {
        x: <number>response.sceneItemTransform.positionX,
        y: <number>response.sceneItemTransform.positionY,
        width: <number>response.sceneItemTransform.width,
        height: <number>response.sceneItemTransform.height,
    };
}

export async function SetObsSourcePosition(name: string, x: number, y: number) {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('SetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName),
        sceneItemTransform: {
            positionX: x,
            positionY: y
        }
    });
}

export async function RotateOBSSource(name: string, rotationDegrees: number) {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('SetSceneItemTransform', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName),
        sceneItemTransform: {
            rotation: rotationDegrees,
        }
    });
}

export async function ToggleObject(name: string) {
    if(!await GetSceneItemEnabled(name)) {
        return;
    }

    await SetSceneItemEnabled(name, false);
    setTimeout(async () => {
        await SetSceneItemEnabled(name, true);
    }, 100);
}

export async function GetSceneItemEnabled(name: string): Promise<boolean> {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return false;
    }

    const response = await obs.call('GetSceneItemEnabled', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName)
    });

    return response.sceneItemEnabled;
}

export async function SetSceneItemEnabled(name: string, enabled: boolean) {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, name)) {
        return;
    }

    const response = await obs.call('SetSceneItemEnabled', {
        sceneName: sceneName,
        sceneItemId: await GetSceneItemIdByName(name, sceneName),
        sceneItemEnabled: enabled
    });
}

export async function SetFilterEnabled(name: string, filterName: string, enabled: boolean) {
    const response = await obs.call('SetSourceFilterEnabled', {
        sourceName: name,
        filterName: filterName,
        filterEnabled: enabled,
    });
}


export async function SetAudioMute(name: string, muted: boolean) {
    const response = await obs.call('SetInputMute', {
        inputName: name,
        inputMuted: muted
    });
}
