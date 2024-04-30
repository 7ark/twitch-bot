import {AllInventoryObjects, InventoryObject, ObjectTier} from "../inventory";
import {GetRandomItem, Shuffle} from "./utils";
import {Broadcast} from "../bot";
import {PlaySound, PlayTextToSpeech} from "./audioUtils";
import {Client} from "tmi.js";
import {AddToActionQueue} from "../actionqueue";
import {GivePlayerObject} from "./playerGameUtils";

export function CreateAndBuildGambleAlert(client: Client, username: string, tier: ObjectTier) {
    const SLOT_LENGTH = 8;
    AddToActionQueue(() => {
        enum WinType { None, Normal, Jackpot}
        let relevantInventoryObjects = AllInventoryObjects.filter(x => x.Tier <= tier);

        let finalWinState: WinType = GetRandomItem([WinType.None, WinType.None, WinType.Normal, WinType.Normal, WinType.Normal, WinType.Jackpot])!;

        // console.log(`Gamble win state: ${finalWinState}`);

        function GetRandomItemWithRarity() {
            let options = [];
            for (let i = 0; i < relevantInventoryObjects.length; i++) {
                for (let j = 0; j < relevantInventoryObjects[i].Rarity; j++) {
                    options.push(relevantInventoryObjects[i]);
                }
            }

            return GetRandomItem(options);
        }

        let slot1 = BuildSlot(finalWinState == WinType.None);
        let slot2 = BuildSlot(finalWinState == WinType.None);
        let slot3 = BuildSlot(finalWinState == WinType.None);
        let slots = [slot1, slot2, slot3];
        switch (finalWinState) {
            case WinType.Normal:
                let randomObj = GetRandomItemWithRarity()!;
                let randomSlot = GetRandomItem(slots)!;

                randomSlot.push(randomObj);
                slots.splice(slots.indexOf(randomSlot), 1);
                randomSlot = GetRandomItem(slots)!;

                randomSlot.push(randomObj);
                slots.splice(slots.indexOf(randomSlot), 1);

                relevantInventoryObjects.splice(relevantInventoryObjects.indexOf(randomObj), 1);
                slots[0].push(GetRandomItem(relevantInventoryObjects)!);
                break;
            case WinType.Jackpot:
                let randObj = GetRandomItemWithRarity()!;
                slot1.push(randObj);
                slot2.push(randObj);
                slot3.push(randObj);
                break;
        }
        let slotResults = [slot1[slot1.length - 1], slot2[slot2.length - 1], slot3[slot3.length - 1]];
        // console.log(`Slots: ${slotResults[0].ObjectName} - ${slotResults[1].ObjectName} - ${slotResults[2].ObjectName}`);
        // console.log("slot 1 " + slot1.length);
        // for (let i = 0; i < slot1.length; i++) {
        //     console.log(slot1[i].ObjectName);
        // }
        // console.log("slot 2 " + slot2.length);
        // for (let i = 0; i < slot2.length; i++) {
        //     console.log(slot2[i].ObjectName);
        // }
        // console.log("slot 3 " + slot3.length);
        // for (let i = 0; i < slot3.length; i++) {
        //     console.log(slot3[i].ObjectName);
        // }

        PlayTextToSpeech(`${username} is gambling! Let's see what they get!`);
        let s = "";
        if(username[username.length - 1] === 's') {
            s = "'";
        }
        else {
            s = "'s";
        }
        Broadcast(JSON.stringify({ type: 'gamble', title: username + s +" Gamble", slot1: slot1.map(x => x.IconRep), slot2: slot2.map(x => x.IconRep), slot3: slot3.map(x => x.IconRep) }));

        setTimeout(() => {
            PlaySound("drumroll");
        }, 3000);

        setTimeout(() => {

            let win = WinType.None;
            let objWon: InventoryObject;

            for (let i = 0; i < AllInventoryObjects.length; i++) {
                let invObj = AllInventoryObjects[i];

                let filtered = slotResults.filter(x => x.ObjectName == invObj.ObjectName);
                if(filtered.length == 3) {
                    //JACKPOT
                    win = WinType.Jackpot;
                    objWon = invObj;
                    break;
                }
                else if(filtered.length == 2) {
                    //Normal win
                    win = WinType.Normal;
                    objWon = invObj;
                    break;
                }
            }

            let text = `${username} `;
            switch (win) {
                case WinType.Jackpot:
                    text += "won the jackpot!";

                    setTimeout(() => {
                        PlaySound("cheering");
                    }, 2000);

                    setTimeout(() => {
                        GivePlayerObject(client, username, objWon.ObjectName);
                        GivePlayerObject(client, username, objWon.ObjectName);
                    }, 4000);
                    break;
                case WinType.Normal:
                    text += `won ${objWon.ContextualName}`;

                    setTimeout(() => {
                        PlaySound("cheering");
                    }, 2000);

                    setTimeout(() => {
                        GivePlayerObject(client, username, objWon.ObjectName)
                    }, 4000);
                    break;
                case WinType.None:
                    text += "won nothing";

                    setTimeout(() => {
                        PlaySound("booing");
                    }, 2000);
                    break;

            }

            PlayTextToSpeech(text);


        }, 4000 + SLOT_LENGTH * 500);

        function BuildSlot(doFull: boolean): Array<InventoryObject> {
            let listOfOptions = [];
            for (let i = 0; i < relevantInventoryObjects.length; i++) {
                for (let j = 0; j < relevantInventoryObjects[i].Rarity; j++) {
                    listOfOptions.push(relevantInventoryObjects[i]);
                }
            }
            listOfOptions = Shuffle(listOfOptions);
            // listOfOptions = listOfOptions.concat(Shuffle(relevantInventoryObjects))

            let slotList: Array<InventoryObject> = [];
            let length = SLOT_LENGTH;
            if(!doFull) {
                length--;
            }
            for (let i = 0; i < length; i++) {
                slotList.push(listOfOptions[i]);
            }

            return slotList;
        }
    }, 10 + SLOT_LENGTH)
}
