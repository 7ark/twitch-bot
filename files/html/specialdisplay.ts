const sdWS: WebSocket = new WebSocket('ws://localhost:3000');
sdWS.onopen = () => console.log("Special Display Connected to WS server");
sdWS.onerror = (error) => console.log("WebSocket error:", error);

sdWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === 'showDisplay') {
        showDisplay(JSON.parse(event.data))
    }
    else if(dataType === 'gamble') {
        gambleDisplay(JSON.parse(event.data))
    }
};

enum IconType { Info, Scroll, Pencil, Coins, Bottle, Box, Fruit, Bomb, Bananas, CheeseWheel, Beer, Letter, Rabbit, Crystal, BottleBlue, PureNail, Hammer }

function getIcon(icon: IconType) {
    switch (icon) {
        case IconType.Info:
            return 'extras/dialog_t.png';
        case IconType.Scroll:
            return 'extras/scroll_t.png';
        case IconType.Pencil:
            return 'extras/pencil_t.png';
        case IconType.Coins:
            return 'extras/gold_t.png';
        case IconType.Bottle:
            return 'extras/bottle_t.png';
        case IconType.Box:
            return 'extras/box_t.png';
        case IconType.Fruit:
            return 'extras/fruit_t.png';
        case IconType.Bomb:
            return 'extras/bomb_t.png';
        case IconType.Bananas:
            return 'extras/bananas.png';
        case IconType.CheeseWheel:
            return 'extras/cheesewheel.png';
        case IconType.Beer:
            return 'extras/beer_t.png';
        case IconType.Letter:
            return 'extras/mail_t.png';
        case IconType.Rabbit:
            return 'extras/rabbit_t.png';
        case IconType.Crystal:
            return 'extras/crystal_t.png';
        case IconType.BottleBlue:
            return 'extras/bottle_blue_t.png';
        case IconType.PureNail:
            return 'extras/purenail.png';
        case IconType.Hammer:
            return 'extras/hammer_t.png';
    }

    return "";
}

function showDisplay(data: { type: string, title: string, message: string, icon: IconType }) {
    let display = document.getElementById('Display');

    display.style.opacity = '1';

    let icon = document.getElementById('icon') as HTMLImageElement;
    let title = document.getElementById('title');
    let text = document.getElementById('text');

    title.textContent = data.title;
    text.textContent = data.message;
    icon.src = getIcon(data.icon);

    setTimeout(hideDisplay, 1000 * 15);
}

function hideDisplay() {
    let display = document.getElementById('Display');

    display.style.opacity = '0';
}

function gambleDisplay(data: { type: string, title: string, slot1: Array<IconType>, slot2: Array<IconType>, slot3: Array<IconType> }) {
    let display = document.getElementById('Display');

    display.style.opacity = '1';

    let icon = document.getElementById('icon') as HTMLImageElement;
    let title = document.getElementById('title');
    let text = document.getElementById('text');

    title.textContent = data.title;
    text.textContent = "";
    icon.src = getIcon(IconType.Coins);

    const slots = [document.getElementById('slot1'), document.getElementById('slot2'), document.getElementById('slot3')];
    const iconsSlot1 = data.slot1.map(x => getIcon(x)); //shuffle(['extras/dialog_t.png', 'extras/scroll_t.png','extras/pencil_t.png','extras/gold_t.png','extras/pencil_t.png', 'extras/gold_t.png','extras/dialog_t.png', 'extras/scroll_t.png', 'extras/pencil_t.png', 'extras/gold_t.png']);
    const iconsSlot2 = data.slot2.map(x => getIcon(x)); //shuffle(['extras/dialog_t.png', 'extras/scroll_t.png','extras/pencil_t.png','extras/gold_t.png','extras/pencil_t.png', 'extras/gold_t.png','extras/dialog_t.png', 'extras/scroll_t.png', 'extras/pencil_t.png', 'extras/gold_t.png']);
    const iconsSlot3 = data.slot3.map(x => getIcon(x)); //shuffle(['extras/dialog_t.png', 'extras/scroll_t.png','extras/pencil_t.png','extras/gold_t.png','extras/pencil_t.png', 'extras/gold_t.png','extras/dialog_t.png', 'extras/scroll_t.png', 'extras/pencil_t.png', 'extras/gold_t.png']);
    const icons = [iconsSlot1, iconsSlot2, iconsSlot3];

    slots.forEach((slot, index) => rollSlot(slot as HTMLElement, icons[index], 3000));

    setTimeout(hideDisplay, 1000 * 10);
}

function rollSlot(slot: HTMLElement, icons: string[], delay: number) {
    slot.style.opacity = '1';
    let firstImage = slot.querySelector('.imgTop') as HTMLImageElement;
    let secondImage = slot.querySelector('.imgBot') as HTMLImageElement;
    let currentIndex = 0;
    secondImage.style.transition = "none";
    secondImage.style.top = icons[currentIndex];
    secondImage.style.top = '0%'; // Reset position above the slot
    firstImage.style.top = '-100%'; // Reset position above the slot

    let timeInterval = 500;
    let timeDelay = 30;

    setTimeout(() => {
        doIt();
        const timer = setInterval(() => doIt(), timeInterval * 2 + timeDelay * 3);

        function doIt() {
            if (currentIndex >= icons.length) {
                clearInterval(timer);
                // secondImage.style.top = '0%'; // Set final position
                return;
            }
            firstImage.style.transition = "top 0.5s ease-in-out";
            firstImage.src = icons[currentIndex++];
            firstImage.style.top = '0%'; // Animate drop to visible area
            secondImage.style.transition = "top 0.5s ease-in-out";
            secondImage.style.top = '100%'; // Reset position above the slot

            setTimeout(() => {
                firstImage.style.top = '100%'; // Animate drop to visible area
                secondImage.src = icons[currentIndex++];
                secondImage.style.transition = "none";
                secondImage.style.top = `-100%`;

                setTimeout(() => {
                    secondImage.style.transition = "top 0.5s ease-in-out";
                    secondImage.style.top = `0%`;
                }, timeDelay);

            }, timeInterval + timeDelay);

            setTimeout(() => {
                firstImage.style.transition = "none";
                firstImage.style.top = '-100%'; // Animate drop to visible area

            }, timeInterval * 2 + timeDelay * 2); // Short delay to allow browser to update src
        }
    }, delay);

}
