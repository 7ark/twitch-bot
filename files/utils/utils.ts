import {Client} from "tmi.js";
import { UpgradeDefinitions } from "../upgradeDefinitions";

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

export function GetUpgradeDescription(upgradeName: string): string {
    let upgrade = UpgradeDefinitions.find(x => x.Name.toLowerCase() === upgradeName.toLowerCase());
    if(upgrade !== undefined) {
        return upgrade.Description.replace("{0}", upgrade.Strength.toString());
    }
    return "";
}

export function IsCommand(message: string, command: string): boolean {
    return message.toLowerCase() === `!${command}` || message.toLowerCase().includes(`!${command} `);
}
