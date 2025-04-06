import {SetTextValue} from "./obsutils";
import {FormatTextIntoLines} from "./utils";

let currentIndex = 1;
let active: Map<number, boolean> = new Map<number, boolean>();

export async function ClearMeeting() {
    await SetTextValue(`MeetingText1`, '');
    await SetTextValue(`MeetingText2`, '');
    await SetTextValue(`MeetingText3`, '');
    await SetTextValue(`MeetingText4`, '');
    active.set(1, false);
    active.set(2, false);
    active.set(3, false);
    active.set(4, false);
}


export async function ShowMeetingText(person: string, text: string) {
    let index = currentIndex;

    if(active.get(index)) {
        return;
    }

    text = `${person}\n${text}`;

    let sourceName = `MeetingText${currentIndex}`;
    currentIndex++;
    if(currentIndex > 4) {
        currentIndex = 1;
    }

    active.set(index, true);

    // First, clear any existing text
    await SetTextValue(sourceName, '');

    let textToShow = FormatTextIntoLines(text, 20);

    // Type out the text character by character
    for (let i = 0; i < text.length; i++) {
        await SetTextValue(sourceName, textToShow.substring(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between characters
    }

    // Wait 3 seconds before hiding
    await new Promise(resolve => setTimeout(resolve, 3000));

    await SetTextValue(sourceName, '');

    active.set(index, false);
}
