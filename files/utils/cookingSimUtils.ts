import {Client} from "tmi.js";
import {GetRandomItem} from "./utils";
import {
    AddChapterMarker,
    DoesSceneContainItem,
    GetOpenScene, SetFilterEnabled,
    SetSceneItemEnabled,
    SetTextColor,
    SetTextValue
} from "./obsutils";
import {PlaySound, PlayTextToSpeech, TryGetPlayerVoice} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {LoadPlayer} from "./playerGameUtils";

export let COOK_CustomerQueue: Array<string> = [];
export let COOK_PendingCustomer: string = "";
export let COOK_CurrentCustomers: Array<string> = [];
export let COOK_PositionsToCustomer: Map<number, string> = new Map<number, string>();
export let COOK_CustomerToPosition: Map<string, number> = new Map<string, number>();
export let COOK_CurrentOrders: Map<string, string> = new Map<string, string>();
export let COOK_Money = 1099.99;
let orderUps: Array<string> = [];

const MAX_CUSTOMERS = 3;

async function InRightScene() {
    let sceneName = await GetOpenScene();

    if(!await DoesSceneContainItem(sceneName, "Customer1")) {
        return false;
    }

    return true;
}

export async function SelectCustomer(client: Client) {
    if(!await InRightScene()) {
        return;
    }

    if(COOK_PendingCustomer != "") {
        await client.say(process.env.CHANNEL!, `@${COOK_PendingCustomer}, your reservation has been cancelled because you didn't reserve it in time! Use !ineedfood to get another reservation.`);
        COOK_PendingCustomer = "";
        return;
    }

    if(COOK_CurrentCustomers.length >= MAX_CUSTOMERS) {
        return;
    }

    if(COOK_CustomerQueue.length == 0) {
        await client.say(process.env.CHANNEL!, `If you'd like to be our next customer, request to place an order with !ineedfood`);
        return;
    }

    let randomCustomer = GetRandomItem(COOK_CustomerQueue)!;

    COOK_PendingCustomer = randomCustomer;
    COOK_CustomerQueue = COOK_CustomerQueue.filter(x => x != randomCustomer);
    await client.say(process.env.CHANNEL!, `@${randomCustomer}, you have been selected to dine with us today! Please type !confirm to confirm your reservation`);
}

export async function AddPendingCustomer(client: Client) {
    if(!await InRightScene()) {
        return;
    }

    await AddChapterMarker(`New Customer: ${COOK_PendingCustomer}`)
    await client.say(process.env.CHANNEL!, `@${COOK_PendingCustomer}, welcome to my restaurant. Use !order 'your order text' to request food.`);

    PlayTextToSpeech(`${COOK_PendingCustomer} has taken a seat and is ready to dine!`, AudioType.UserTTS);
    COOK_CurrentCustomers.push(COOK_PendingCustomer);

    let availableIndex = 0;
    for (let i = 1; i <= MAX_CUSTOMERS; i++) {
        if(!COOK_PositionsToCustomer.has(i) || COOK_PositionsToCustomer.get(i) == "") {
            availableIndex = i;
            break;
        }
    }

    COOK_PositionsToCustomer.set(availableIndex, COOK_PendingCustomer);
    COOK_CustomerToPosition.set(COOK_PendingCustomer, availableIndex);

    await SetTextValue(`StickmanOrder${availableIndex}`, `${COOK_PendingCustomer}`);
    await SetSceneItemEnabled(`Customer${availableIndex}`, true);

    COOK_PendingCustomer = "";
}

export async function AddOrder(client: Client, customer: string, order: string) {
    if(!await InRightScene()) {
        return;
    }

    if(order.trim() == "") {
        return;
    }

    let hadOrder = COOK_CurrentOrders.has(customer);

    COOK_CurrentOrders.set(customer, order);

    PlayTextToSpeech(hadOrder ?
        `Order Change: ${customer} has changed their order to ${order}` :
        `Order Up: ${customer} has placed an order for ${order}`, AudioType.UserTTS);

    let words = order.split(' ');
    let obsText = ``;

    let letters = 0;
    for (let i = 0; i < words.length; i++) {
        obsText += words[i];
        letters += words[i].length;
        if(i < words.length - 1) {
            if(letters >= 15) {
                obsText += "\n";
                letters = 0;
            }
            else {
                obsText += " ";
            }
        }
    }

    await SetTextValue(`StickmanOrder${COOK_CustomerToPosition.get(customer)}`, `${customer}:\n${obsText}`);

    await client.say(process.env.CHANNEL!, `@${customer}, when you've received your order, please use !checkout [number] to leave the restaurant. The number you leave is the tip!`);
}

export async function ShowCustomerText(customer: string, text: string) {
    const stickmanIndex = COOK_CustomerToPosition.get(customer);
    const sourceName = `StickmanText${stickmanIndex}`;

    // First, clear any existing text
    await SetTextValue(sourceName, '');

    let words = text.split(' ');
    let textToShow = "";

    let letters = 0;
    for (let i = 0; i < words.length; i++) {
        textToShow += words[i];
        letters += words[i].length;
        if(i < words.length - 1) {
            if(letters >= 20) {
                textToShow += "\n";
                letters = 0;
            }
            else {
                textToShow += " ";
            }
        }
    }

    // Type out the text character by character
    for (let i = 0; i < text.length; i++) {
        await SetTextValue(sourceName, textToShow.substring(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between characters
    }

    // Wait 3 seconds before hiding
    await new Promise(resolve => setTimeout(resolve, 3000));

    await SetTextValue(sourceName, '');
}

export async function Checkout(client: Client, customer: string, money: number | undefined, review: string) {
    let moneyValue = money !== undefined ? Math.round(money * 100) / 100 : 0;
    const wholeNumber = Math.floor(moneyValue);  // gets 12
    const decimal = Number((moneyValue % 1).toFixed(2)) * 100;  // gets 35

    let reviewText =review == "" ? "" : "They left a review: ";
    PlayTextToSpeech(money == undefined ?
        `${customer} has STORMED OUT without leaving a tip.` :
        `${customer} has checked out, leaving us a tip of ${wholeNumber} dollars and ${decimal} cents! ${reviewText}`, AudioType.UserTTS, "en-US-BrianNeural", () => {
        if(review != "") {
            PlayTextToSpeech(review, AudioType.UserTTS, TryGetPlayerVoice(LoadPlayer(customer)));
        }
        if(money <= 2) {
            PlaySound("booing", AudioType.ImportantStreamEffects);
        }
    });
    await AddChapterMarker(`Customer Checkout: ${customer}`)

    if(money !== undefined) {
        COOK_Money += money;
        await SetTextValue(`MoneyDisplay`, `${COOK_Money.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        })}`);
        if(COOK_Money >= 0) {
            await SetTextColor("MoneyDisplay", 0, 255, 0)
        }
        else {
            await SetTextColor("MoneyDisplay", 255, 0, 0)
        }
    }

    await RemoveCustomer(client, customer);
}

export async function OrderUp(client: Client, customer: string) {
    await client.say(process.env.CHANNEL!, `@${customer}, your order has arrived! Please use !checkout [number] to leave the restaurant. The number you leave is the tip!`);
    orderUps.push(customer);

    setTimeout(async () => {
        //They've taken too long
        if(orderUps.includes(customer)) {
            await client.say(process.env.CHANNEL!, `@${customer}, sorry, you've been removed from the restaurant! Have a nice day! Come again!`);

            await RemoveCustomer(client, customer);
        }
    }, 1000 * 60 * 5);

}

async function RemoveCustomer(client: Client, customer: string) {
    let position = COOK_CustomerToPosition.get(customer)!;
    await SetSceneItemEnabled(`Customer${position}`, false);

    COOK_CurrentCustomers = COOK_CurrentCustomers.filter(x => x !== customer);
    COOK_PositionsToCustomer.delete(position);
    COOK_CustomerToPosition.delete(customer);
    COOK_CurrentOrders.delete(customer);
    orderUps = orderUps.filter(x => x != customer);

    setTimeout(() => {
        if(COOK_PendingCustomer == "") {
            SelectCustomer(client)
        }
    }, 5000);
}
