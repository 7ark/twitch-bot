export let IsMonsterActive: boolean = false;
export let SayAllChat: boolean = false;
export let CurrentGTARider: string = "";
export let CurrentPollJoker: string = "";
export let CurrentCaller: string = ``;

export let MessageDelegate: Array<(username: string, message: string) => void> = [];
