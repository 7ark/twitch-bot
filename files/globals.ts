export let IsMonsterActive: boolean = false;
export let SayAllChat: boolean = false;
let currentGTARider: string = "";
export let CurrentPollJoker: string = "";

export const GetCurrentGTARider = () => currentGTARider;
export const SetCurrentGTARider = (value: string) => { currentGTARider = value; };

export let MessageDelegate: Array<(username: string, message: string) => void> = [];
