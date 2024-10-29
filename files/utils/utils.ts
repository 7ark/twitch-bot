export enum IconType {
    Info, Scroll, Pencil, Coins,
    Bottle, Box, Fruit, Bomb,
    Bananas, CheeseWheel, Beer, Letter,
    Rabbit, Crystal, BottleBlue, PureNail,
    Hammer, DiamondAxe, Wabbajack, ObsidianDagger,
    PoolNoodle, PortalCake, PowerHelmet , DuckHuntGun,
    CardboardBox
}

export enum ClassType { Mage, Warrior, Rogue, Cleric }

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

export function GetRandomEnum<T>(enumObj: T): number {
    const enumValues = Object.keys(enumObj)
        .filter(k => !isNaN(Number(k))) // Filter out non-numeric keys
        .map(k => enumObj[k as keyof T]);

    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return randomIndex;
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
