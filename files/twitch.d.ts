// twitch.d.ts
declare namespace Twitch {
    export namespace ext {
        interface Auth {
            channelId: string;
            clientId: string;
            token: string;
            userId: string;
        }

        interface Viewer {
            id: string;
            opaqueId: string;
            role: string;
            sessionToken: string;
        }

        interface Window {
            height: number;
            width: number;
        }

        var onAuthorized: (callback: (auth: Auth) => void) => void;
        var viewer: Viewer;
        var onContext: (callback: (context: Window, changed: string[]) => void) => void;
    }
}
