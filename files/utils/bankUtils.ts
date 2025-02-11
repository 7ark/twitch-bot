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
    if(bankData.lastUpdateDate === new Date().toDateString()) {
        return bankData.exchangeRate;
    }

    // Base volatility
    let volatility = GetRandomNumber(-0.2, 0.2);
    
    // Add market pressure based on bank balance
    // Lower balance = higher rates (more expensive)
    let marketPressure = (startingBankBalance - bankData.totalCoins) / startingBankBalance;
    marketPressure = Math.max(-0.3, Math.min(0.3, marketPressure));

    let newRate = bankData.exchangeRate * (1 + volatility + marketPressure);
    // Keep rate between 5 and 50
    newRate = Math.max(5, Math.min(50, Math.round(newRate)));

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
