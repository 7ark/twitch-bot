import fs from "fs";
import {GetRandomNumber} from "./utils";

export interface BankData {
    exchangeRate: number,
    lastUpdateDate: string,
    totalCoins: number
}

const startingBankBalance = 10000;
// export let BankActive: boolean = true;

export function LoadBankData(): BankData {
    if(fs.existsSync('bankData.json')) {
        return JSON.parse(fs.readFileSync('bankData.json', 'utf-8'));
    }
    return {
        exchangeRate: 10, // 10 gems = 1 ByteCoin
        lastUpdateDate: new Date().toDateString(),
        totalCoins: startingBankBalance // Starting bank balance
    };
}

export function SaveBankData(data: BankData) {
    fs.writeFileSync('bankData.json', JSON.stringify(data));
}


export function UpdateExchangeRate(): number {
    let bankData = LoadBankData();

    // Only update once per day
    // if(bankData.lastUpdateDate === new Date().toDateString()) {
    //     return bankData.exchangeRate;
    // }

    // Base volatility (reduced range)
    let volatility = GetRandomNumber(-0.15, 0.15);

    // Calculate market pressure using a logarithmic scale
    let balanceRatio = bankData.totalCoins / startingBankBalance;
    // console.log(balanceRatio)
    let marketPressure = -Math.log10(balanceRatio) * 0.1;
    // console.log(marketPressure)

    // Clamp market pressure to reasonable bounds
    marketPressure = Math.max(-0.2, Math.min(0.2, marketPressure));
    // console.log(marketPressure)

    // Apply changes with dampening
    let totalChange = (volatility + marketPressure) * 0.7; // 70% dampening factor
    // console.log(totalChange)
    let newRate = bankData.exchangeRate * (1 + totalChange);
    // console.log(newRate)

    // Keep rate between 5 and 30 (reduced upper limit)
    newRate = Math.max(5, Math.min(30, Math.round(newRate)));
    // console.log(newRate)

    // Smooth large changes
    if (Math.abs(newRate - bankData.exchangeRate) > 5) {
        newRate = bankData.exchangeRate + (Math.sign(newRate - bankData.exchangeRate) * 5);
    }
    // console.log(newRate)

    bankData.exchangeRate = newRate;
    bankData.lastUpdateDate = new Date().toDateString();
    SaveBankData(bankData);

    return newRate;
}

export function ExchangeGemsForCoins(gemsAmount: number): number {
    let rate = UpdateExchangeRate();
    return Math.floor(gemsAmount / rate);
}

export function ExchangeCoinsForGems(coinsAmount: number): number {
    let rate = UpdateExchangeRate();
    return Math.floor(coinsAmount * rate);
}

export function GetBankStatusText(): string {
    let bankData = LoadBankData();
    return `The bank currently has ${bankData.totalCoins.toLocaleString()} ByteCoins. Current exchange rate: ${bankData.exchangeRate} gems = 1 ByteCoin`;
}

export function GetExchangeRateText(): string {
    let rate = UpdateExchangeRate();
    return `Current exchange rate: ${rate} gems = 1 ByteCoin`;
}

UpdateExchangeRate();
