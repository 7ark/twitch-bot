export enum IconType { Info, Scroll, Pencil, Coins, Bottle, Box, Fruit, Bomb, Bananas, CheeseWheel, Beer, Letter, Rabbit, Crystal }

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
    if (array.length === 0) return undefined;
    const randomIndex = GetRandomInt(0, array.length);// Math.floor(Math.random() * array.length);
    return array[randomIndex];
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
