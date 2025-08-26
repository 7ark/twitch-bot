import fs from "fs";
import { GetRandomNumber } from "./utils";
import {Player} from "../valueDefinitions";
import {SavePlayer} from "./playerGameUtils";

export interface BankData {
    exchangeRate: number;     // gems per 1 coin
    lastUpdateMs: number;     // timestamp
    totalCoins: number;       // bank's coin reserve
}

const STARTING_COINS = 10_000;
const DATA_PATH = "bankData.json";

const BASE_RATE = 10;             // “fair” middle rate when reserves are normal
const MIN_RATE = 3;               // floor so coins never get too cheap
const MAX_RATE = 120;              // ceiling so coins never get absurdly expensive
const UPDATE_COOLDOWN_MS = 5_000; // don’t recalc more than once every 5s
const MEAN_REVERT_SPEED = 0.25;   // 0..1: how aggressively move toward target each update
const NOISE_RANGE = 0.02;         // ±2% noise per update
const HYSTERESIS = 0.005;         // 0.5% deadzone before applying tiny changes
const EXCHANGE_FEE_PERCENT = 0.05; //Base fee
const EXCHANGE_FEE_INCREASE_AMOUNT = 0.01; //How much the fee increases over a threshold
const EXCHANGE_FEE_INCREASE_THRESHOLD = 1000; //Once the exchanged amount is over this threshold, itll increase the exchange fee
const EXCHANGE_FEE_INCREASE_RATE = 1000; //Every amount of this over, it increases the exchange fee by 1

function now() { return Date.now(); }

export function LoadBankData(): BankData {
    if (fs.existsSync(DATA_PATH)) {
        return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
    return {
        exchangeRate: BASE_RATE,
        lastUpdateMs: 0,
        totalCoins: STARTING_COINS,
    };
}

export function SaveBankData(data: BankData) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data));
}

function computeTargetRate(reserveRatio: number): number {
    // reserveRatio = bankCoins / STARTING_COINS
    // Map ratio → multiplier around 1.0 (BASE_RATE). k controls steepness.
    const k = 3.0;               // steepness (higher = steeper)
    const x = reserveRatio - 1;  // centered at 0 when reserves == STARTING_COINS

    // Logistic-like response: >0 when reserves low, <0 when high
    const tilt = Math.tanh(-k * x); // ~+1 when low reserves, ~-1 when high reserves

    // Convert tilt into a percentage swing; e.g., up to ±60% around BASE_RATE
    const maxSwing = 0.6; // 60% swing at extremes
    const multiplier = 1 + maxSwing * tilt;

    let target = BASE_RATE * multiplier;
    target = Math.max(MIN_RATE, Math.min(MAX_RATE, target));
    return target;
}

export function UpdateExchangeRate(): number {
    const data = LoadBankData();

    // Respect your cooldown
    if (now() - data.lastUpdateMs < UPDATE_COOLDOWN_MS) {
        return data.exchangeRate;
    }

    const currentRate = data.exchangeRate;
    const reserves = data.totalCoins;

    // 1) If bank is empty (or effectively empty), snap to MAX_RATE.
    if (reserves <= 0) {
        const next = Math.max(MIN_RATE, Math.min(MAX_RATE, MAX_RATE));
        data.exchangeRate = next;
        data.lastUpdateMs = now();
        SaveBankData(data);
        return next;
    }

    // 2) Two targets:
    //    a) your existing target (often gentle)
    //    b) a "steep" target tied directly to reserves for strong scarcity/surplus response
    const reserveRatio = reserves / STARTING_COINS;
    const gentleTarget = computeTargetRate(reserveRatio);

    // Steep target: BASE * (1/ratio)^a for scarcity, BASE * (ratio)^(-b) for surplus
    // Tune exponents to taste (higher scarcityExponent = sharper rise when low)
    const scarcityExponent = 1.25;
    const surplusExponent  = 0.85;
    const baseRate = BASE_RATE ?? 10; // in case BASE_RATE isn't exported

    const steepRaw =
        reserveRatio < 1
            ? baseRate * Math.pow(1 / reserveRatio, scarcityExponent)
            : baseRate * Math.pow(reserveRatio, -surplusExponent);

    const steepTarget = Math.max(MIN_RATE, Math.min(MAX_RATE, Math.round(steepRaw * 100) / 100));

    // Blend weight rises as we move away from "normal" reserves (ratio ~ 1)
    // |1 - ratio| of 0.6 or more → full weight on steep target
    const deviation = Math.min(1, Math.abs(1 - reserveRatio) / 0.6);
    const blendedTarget = gentleTarget * (1 - deviation) + steepTarget * deviation;

    // 3) Adaptive mean-reversion speed: farther away → move faster
    const band = (MAX_RATE - MIN_RATE) || 1;
    const distance = Math.min(1, Math.abs(blendedTarget - currentRate) / band);
    const baseSpeed = 0.18;
    const maxSpeed  = 0.65;
    const meanRevertSpeed = baseSpeed + (maxSpeed - baseSpeed) * distance;

    // 4) Controlled step toward target + small noise (less noise on big moves)
    const drift = meanRevertSpeed * (blendedTarget - currentRate);

    const noiseScale = NOISE_RANGE ?? 0.02;
    const noiseFactor = (1 - 0.6 * distance); // damp noise when far from target
    const noise = currentRate * GetRandomNumber(-noiseScale, noiseScale) * noiseFactor;

    let next = currentRate + drift + noise;

    // 5) Edge braking: avoid sticky oscillations right at the clamps
    const nearMax = next > MAX_RATE * 0.9 && next > currentRate;
    const nearMin = next < MIN_RATE * 1.1 && next < currentRate;
    if (nearMax || nearMin) {
        next = currentRate + (next - currentRate) * 0.6; // soften approach to edges
    }

    // 6) Hysteresis: ignore micro-moves
    const hysteresis = HYSTERESIS ?? 0.005;
    if (Math.abs(next - currentRate) < currentRate * hysteresis) {
        next = currentRate;
    }

    // 7) Clamp + tidy
    next = Math.max(MIN_RATE, Math.min(MAX_RATE, next));
    next = Math.round(next * 100) / 100;

    data.exchangeRate = next;
    data.lastUpdateMs = now();
    SaveBankData(data);
    return next;
}

export function GetExchangeFeeForGems(gemAmount: number): number {
    let coins = GetCoinsToExchangeForGems(gemAmount);

    if(coins > EXCHANGE_FEE_INCREASE_THRESHOLD) {
        let overAmount = coins - EXCHANGE_FEE_INCREASE_THRESHOLD;
        let amountOver = Math.ceil(overAmount / EXCHANGE_FEE_INCREASE_RATE);

        return EXCHANGE_FEE_PERCENT + (EXCHANGE_FEE_INCREASE_AMOUNT * amountOver);
    }
    else {
        return EXCHANGE_FEE_PERCENT;
    }
}

export function GetExchangeFee(coins: number): number {
    if(coins > EXCHANGE_FEE_INCREASE_THRESHOLD) {
        let overAmount = coins - EXCHANGE_FEE_INCREASE_THRESHOLD;
        let amountOver = Math.ceil(overAmount / EXCHANGE_FEE_INCREASE_RATE);

        return EXCHANGE_FEE_PERCENT + (EXCHANGE_FEE_INCREASE_AMOUNT * amountOver);
    }
    else {
        return EXCHANGE_FEE_PERCENT;
    }
}

export function DoesBankHaveEnoughCoinsForGemTransaction(gemsAmount: number): boolean {
    const data = LoadBankData();
    const rate = data.exchangeRate;
    let coinsOut = Math.floor(gemsAmount / rate);

    return coinsOut <= data.totalCoins;
}

export function GetCoinsToExchangeForGems(gemsAmount: number): number {
    const data = LoadBankData();
    const rate = data.exchangeRate;

    let coinsOut = Math.floor(gemsAmount / rate);
    if (coinsOut <= 0) return 0;

    coinsOut = Math.min(coinsOut, Math.max(0, data.totalCoins));

    return coinsOut;
}

export function ExchangeGemsForCoins(gemsAmount: number, player: Player): number {
    const data = LoadBankData();
    let coinsOut = GetCoinsToExchangeForGems(gemsAmount);
    let exchangeFee = GetExchangeFeeForGems(gemsAmount);

    coinsOut = coinsOut - Math.ceil(coinsOut * exchangeFee);

    data.totalCoins -= coinsOut;
    player.SpendableGems -= gemsAmount;
    player.ByteCoins += coinsOut;

    SavePlayer(player);
    SaveBankData(data);
    UpdateExchangeRate();
    return coinsOut;
}

export function GetGemsToExchangeForCoins(coinsAmount: number): number {
    const data = LoadBankData();
    const rate = data.exchangeRate;
    const coinsIn = Math.max(0, Math.floor(coinsAmount));
    return Math.floor(coinsIn * rate);
}

export function ExchangeCoinsForGems(coinsAmount: number, player: Player): number {
    const data = LoadBankData();

    const coinsIn = Math.max(0, Math.floor(coinsAmount));
    if (coinsIn <= 0) return 0;
    let exchangeFee = GetExchangeFee(coinsIn);

    let adjustedCoinsPerFee = coinsIn - Math.ceil(coinsIn * exchangeFee);

    const gems = GetGemsToExchangeForCoins(adjustedCoinsPerFee);

    data.totalCoins += coinsIn;
    player.ByteCoins -= coinsIn;
    player.SpendableGems += gems;

    SavePlayer(player);
    SaveBankData(data);
    UpdateExchangeRate();

    return gems;
}

export function BankReceiveFromSpend(coinsSpent: number, depositShare = 0.7) {
    if (coinsSpent <= 0) return;
    const data = LoadBankData();
    data.totalCoins += Math.floor(coinsSpent * depositShare);
    SaveBankData(data);
}

export function GetBankStatusText(): string {
    const { totalCoins, exchangeRate } = LoadBankData();
    return `The bank currently has ${totalCoins.toLocaleString()} ByteCoins. Exchange: ${exchangeRate.toFixed(2)} gems = 1 ByteCoin.`;
}

export function GetExchangeRateText(): string {
    const rate = UpdateExchangeRate();
    return `Current exchange: ${rate.toFixed(2)} gems = 1 ByteCoin. All exchanges incur a base fee of ${(EXCHANGE_FEE_PERCENT * 100)}%. For amounts over ${EXCHANGE_FEE_INCREASE_THRESHOLD} Bytecoins, the fee increases by an additional ${(EXCHANGE_FEE_INCREASE_AMOUNT * 100)}% for every extra ${EXCHANGE_FEE_INCREASE_RATE} coins.`;
}

UpdateExchangeRate();
