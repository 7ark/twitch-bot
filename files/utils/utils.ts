import {Client} from "tmi.js";
import { UpgradeDefinitions } from "../upgradeDefinitions";
import {GetParameterFromCommand} from "./messageUtils";
import {AllInventoryObjects, ObjectRetrievalType} from "../inventoryDefinitions";

export interface Dictionary<T> {
    [key: string]: T;
}

export function GetRandomNumber(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.random() * (max - min) + min;
}
export function GetRandomIntI(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}
export function GetRandomInt(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min) + min);
}

export function GetRandomItem<T>(array: T[]): T | undefined {
    if (array === undefined || array.length === 0) return undefined;
    const randomIndex = GetRandomInt(0, array.length);// Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

export function GetRandomEnum<T>(enumObj: T, excludeValues: Array<T[keyof T]> = []): T[keyof T] | undefined {
    const enumValues = [];

    for (const key in enumObj) {
        if (typeof enumObj[key] === 'number') {
            const value = enumObj[key] as T[keyof T];
            if (!excludeValues.includes(value)) {
                enumValues.push(value);
            }
        }
    }

    if (enumValues.length === 0) return undefined; // Return undefined if no valid values are left

    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex];
}

export function GetNumberWithOrdinal(n: number) {
    let s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function Shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export function RemoveFromArray<T>(array: T[], val: T) {
    const index = array.indexOf(val, 0);
    if(index > -1) {
        array.splice(index, 1);
    }
};

export function GetSecondsBetweenDates(date1: Date, date2: Date): number {
    const milliseconds = new Date(date2).getTime() - new Date(date1).getTime(); // Difference in milliseconds
    return Math.floor(milliseconds / 1000); // Convert milliseconds to seconds
}

export function AddSpacesBeforeCapitals(string: string) {
    string = string.replace(/([a-z])([A-Z])/g, '$1 $2');
    string = string.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    return string;
}

export function Delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function ConvertUnixToDateTime(unixTimestamp: number): Date {
    // Convert the Unix timestamp from seconds to milliseconds
    const date = new Date(unixTimestamp * 1000);

    return date;
}

//Check text for instances of another text
export function GetTextInstances(fullText: string, textInstance: string): number {
    if (!textInstance) return 0; // Avoid edge case for empty textInstance
    return fullText.toLowerCase().split(textInstance.toLowerCase()).length - 1;
}

export function LevenshteinDistance(a: string, b: string): number {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const matrix: number[][] = [];

    // Initialize the first row and column of the matrix
    for (let i = 0; i <= bn; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= an; j++) {
        matrix[0][j] = j;
    }

    // Populate the matrix
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Substitution
                    matrix[i][j - 1] + 1,     // Insertion
                    matrix[i - 1][j] + 1      // Deletion
                );
            }
        }
    }

    return matrix[bn][an];
}

export function GetPageNumberFromCommand(command: string): number {
    let parameterText = GetParameterFromCommand(command, 1);
    let page = 1;
    if (parameterText != "") {
        page = parseInt(parameterText);
        if(Number.isNaN(page)) {
            page = 1;
        }
    }

    return page;
}

export function GetItemsAsPages(commandName: string, texts: Array<string>, page: number, entriesPerPage: number = 5) {
    let totalPages = Math.ceil(texts.length / entriesPerPage);
    if(page > totalPages) {
        return `${page} is higher than the total pages of ${totalPages}`;
    }
    let final = `[Page ${page}/${totalPages}] (Use !${commandName} # to see other pages):`;
    let start = (page - 1) * entriesPerPage;
    for (let i = start; i < Math.min(texts.length, start + entriesPerPage); i++) {
        final += ` | ${texts[i]}`
    }

    return final;
}

export function CheckMessageSimilarity(text: string, previousMessages: Array<string>): boolean {
    for (let i = 0; i < previousMessages.length; i++) {
        let previousText = previousMessages[i];

        // Calculate the Levenshtein distance
        let distance = LevenshteinDistance(text, previousText);

        // Calculate similarity percentage
        let maxLength = Math.max(text.length, previousText.length);
        let similarity = (maxLength - distance) / maxLength;

        // If similarity is above 80%, consider it too similar
        if (similarity >= 0.8) {
            return true;
        }
    }

    return false;
}

export function GetEnumValues(enumObj: object): number[] {
    return Object.keys(enumObj)
        .filter(key => !isNaN(Number(key)))
        .map(key => Number(key));
}

// For getting enum keys (names)
export function GetEnumKeys(enumObj: object): string[] {
    return Object.keys(enumObj)
        .filter(key => isNaN(Number(key)));
}

export function IsCommand(message: string, command: string): boolean {
    return message.toLowerCase() === `!${command}` || message.toLowerCase().includes(`!${command} `);
}

export function FormatListNicely(list: Array<string>): string {
    let text = ``;
    for (let i = 0; i < list.length; i++) {
        text += list[i];
        if(i < list.length - 2) {
            text += ", ";
        }
        else if(i < list.length - 1) {
            text += " and ";
        }
    }

    return text;
}

export function CountOccurrences(arr: string[], searchText: string): number {
    return arr.filter(item => item === searchText).length;
}

export function FormatTextIntoLines(text: string, letterCount: number = 15): string {
    let words = text.split(' ');
    let obsText = ``;

    let letters = 0;
    for (let i = 0; i < words.length; i++) {
        obsText += words[i];
        letters += words[i].length;
        if(i < words.length - 1) {
            if(letters >= letterCount) {
                obsText += "\n";
                letters = 0;
            }
            else {
                obsText += " ";
            }
        }
    }

    return obsText;
}

export function FormatSeconds(totalSeconds: number): string {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours   = Math.floor(totalSeconds / 3600);

    const parts: string[] = [];

    if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
    }

    // "1 hour, 2 minutes and 3 seconds"
    if (parts.length > 1) {
        const last = parts.pop();
        return parts.join(", ") + " and " + last;
    }
    return parts[0];
}

export function DisplayAsList<T>(arr: T[], selector: (x: T) => string = x => String(x)): string {
    const formatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
    return formatter.format(arr.map(selector));
}

export function GetMostCommonEnum<T extends string | number>(values: T[]): T | undefined {
    const counts: Record<string, number> = {};

    for (const v of values) {
        counts[v as any] = (counts[v as any] ?? 0) + 1;
    }

    let bestValue: T | undefined = undefined;
    let bestCount = -1;

    for (const key in counts) {
        if (counts[key] > bestCount) {
            bestCount = counts[key];
            bestValue = key as unknown as T;
        }
    }

    return bestValue;
}
