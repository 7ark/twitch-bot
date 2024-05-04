const bpWS: WebSocket = new WebSocket('ws://localhost:3000');
const stickmenContainer: HTMLElement | null = document.getElementById('stickmen');
let stickmen: Map<string, {
    element: HTMLPreElement,
    xPos: number
}> = new Map<string, {
    element: HTMLPreElement,
    xPos: number
}>();
bpWS.onopen = () => console.log("Bottom Panel Connected to WS server");
bpWS.onerror = (error) => console.log("WebSocket error:", error);

bpWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if (dataType === 'message') {
        handlePlayerMessage(JSON.parse(event.data));
    }
    else if(dataType === 'exp') {
        handleExpMessage(JSON.parse(event.data));
    }
    else if(dataType === 'showfloatingtext') {
        handleShowFloatingText(JSON.parse(event.data));
    }
    else if(dataType === 'addstickman') {
        bpWS.send(JSON.stringify({ type: 'adding' }));
        console.log("ADding stickman");
        let data = JSON.parse(event.data);
        let name = data.displayName.toLowerCase();
        createStickman(name, data.color);
    }
};

const defaultY = 180;
const totalWidth = 2000;
const sideBuffer = 400;

function handlePlayerMessage(data: { type: string; displayName: string; message: string; color: string; }) {
    let name = data.displayName.toLowerCase();

    if(stickmen.has(name!)){
        let stickmanInfo = stickmen.get(name!)!;
        let stickman = stickmanInfo.element!;
        const currentXPos = stickmanInfo.xPos;
        let direction: string = '';
        if(currentXPos <= sideBuffer){
            direction = 'hop-right';
        }
        else if(currentXPos >= totalWidth - sideBuffer){
            direction = 'hop-left';
        }
        else {
            direction = Math.random() < 0.5 ? 'hop-left' : 'hop-right';
        }
        let distanceAmount = Math.random() * 30 + 10;
        let movementDistance = direction === 'hop-right' ? distanceAmount : -distanceAmount; // Distance to move each hop
        const newXPos = direction === 'hop-right' ? currentXPos + movementDistance : currentXPos + movementDistance;

        let jumpHeight = getRandomIntI(10, 50);

        // Generate dynamic animation
        const keyframes = `
            @keyframes hop-${name}-${direction} {
                0% { transform: translateX(${currentXPos}px) translateY(${defaultY}px); }
                50% { transform: translateX(${currentXPos + (movementDistance / 2)}px) translateY(${defaultY - jumpHeight}px); }
                100% { transform: translateX(${newXPos}px) translateY(${defaultY}px); }
            }
            `;

        stickman.style.animationName = `hop-${name}-${direction}`;
        stickman.style.animationDuration = '0.5s';
        stickman.style.animationFillMode = 'forwards';
        stickman.style.animationTimingFunction = 'ease';

        // Update the <style> tag or create it if it doesn't exist
        let styleTag = document.getElementById('dynamic-animations');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-animations';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent += keyframes;

        // Optional: Remove the class after animation ends to reset state
        stickman.addEventListener('animationend', () => {
            stickman.classList.remove(direction);
            stickmanInfo.xPos = newXPos;
            stickman.style.animation = '';
            stickman.style.transform = `translateX(${stickmanInfo.xPos}px) translateY(${defaultY}px) `;
            stickmen.set(name!, stickmanInfo);
        }), {once: true};
    }
    else {
        createStickman(name, data.color);
    }
}

function createStickman(name: string, color: string) {
    const stickman: HTMLPreElement = document.createElement('pre');
    let extraSpaces = '';
    let length = Math.floor(name!.length / 3);
    for (let i = 0; i < length; i++) {
        extraSpaces += ' ';
    }

    stickman.textContent = `${name}\n${extraSpaces} O \n${extraSpaces}/|\\\n${extraSpaces}/ \\`;
    stickmenContainer?.appendChild(stickman);
    let val = {
        element: stickman,
        xPos: Math.random() * (totalWidth - (sideBuffer * 2)) + sideBuffer
    };

    stickmen.set(name!, val);
    stickman.style.transform = `translateX(${val.xPos}px) translateY(${defaultY}px) `;
    stickman.style.color = color || '#57a64a';
    stickman.style.fontWeight = 'bold';
    stickman.style.position = 'absolute';
}

function handleExpMessage(data: { type: string; displayName: string; display: string; }) {
    let name = data.displayName.toLowerCase();

    if(stickmen.has(name!)) {
        let stickmanInfo = stickmen.get(name!)!;
        // console.log("found info", stickmanInfo);

        showFloatingText( data.display, stickmanInfo.xPos + stickmanInfo.element.offsetWidth / 2);
    }
}

function showFloatingText(text: string, xPos: number) {
    const floatingText = document.createElement('div');
    floatingText.classList.add('floatingText');
    floatingText.textContent = text;
    floatingText.style.position = 'absolute';
    floatingText.style.fontFamily = "JetBrains Mono";
    // floatingText.style.visibility = 'hidden'; // Initially hidden to avoid flicker
    floatingText.style.width = "400px";
    floatingText.style.height = "auto";
    floatingText.style.textAlign = "center";
    // floatingText.style.alignContent = "flex-end";
    floatingText.style.whiteSpace = 'normal';

    // floatingText.style.overflow = "visible";

    // Add the floating text to the stickman container to measure it
    stickmenContainer!.appendChild(floatingText);

    floatingText.style.left = `${xPos - 200}px`;
    floatingText.style.visibility = 'visible'; // Make it visible now that it's positioned

    const floatingTextHeight = floatingText.offsetHeight;

    const yOffset = 191;
    let startingY = -floatingTextHeight + yOffset;
    const floatDistance = 20;

    floatingText.style.transform = `translateY(${startingY}px)`;
    let delay = (0.5 + (((floatingTextHeight / 21) - 1) * 0.5));
    console.log(delay)
    floatingText.style.animationDelay = `${delay}s`;

    const keyframes = `
            @keyframes floatAndFade {
                0% { opacity: 1; transform: translateY(${startingY}px); }
                100% { opacity: 0; transform: translateY(${startingY - floatDistance}px); }
            }
            `;

    // Update the <style> tag or create it if it doesn't exist
    let styleTag = document.getElementById('dynamic-animations');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-animations';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent += keyframes;
}

function handleShowFloatingText(data: { type: string; displayName: string; display: string; }) {
    let name = data.displayName.toLowerCase();

    if(stickmen.has(name!)) {
        let stickmanInfo = stickmen.get(name!)!;
        // console.log("found info", stickmanInfo);

        showFloatingText( data.display, stickmanInfo.xPos + stickmanInfo.element.offsetWidth / 2);
    }
}

function getRandomIntI(min: number, max: number): number {
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}
