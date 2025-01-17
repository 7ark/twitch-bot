const mWS: WebSocket = new WebSocket('ws://localhost:3000');
mWS.onopen = () => console.log("Minigame Connected to WS server");
mWS.onerror = (error) => console.log("WebSocket error:", error);

mWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === `init` || dataType === `minigamepassive`){
        HandlePassiveDisplay();
    }
    else if (dataType === 'minigame') {
        HandlePlayerMinigame(JSON.parse(event.data));
    }
    else if(dataType === `minigameleaderboard`) {
        HandleLeaderboardDisplay(JSON.parse(event.data));
    }
    else if(dataType === `minigameshop`) {
        HandleShopDisplay(JSON.parse(event.data));
    }
};

enum MinigameTypeHtml {
    Fish,
    Cook,
    Mine,
    //Chop
}

const animationContainer: HTMLElement | null = document.getElementById('animation');

function GetMinigameName(minigameType: MinigameTypeHtml): string {
    switch (minigameType) {
        case MinigameTypeHtml.Fish:
            return "fishing";
        case MinigameTypeHtml.Cook:
            return "cooking";
        // case MinigameTypeHtml.Chop:
        //     return "chopping";
        case MinigameTypeHtml.Mine:
            return "mining";
    }

    return "";
}

const textAnimation: HTMLPreElement = document.createElement('pre');
animationContainer?.appendChild(textAnimation);

function HandlePassiveDisplay() {
    let text = `Play minigames! You can use:\n`;
    const minigameKeys = Object
        .keys(MinigameTypeHtml)
        .filter((v) => isNaN(Number(v)))
    text += minigameKeys.map(x => ` !${x.toLowerCase()}`)

    textAnimation.textContent = text;

    // Generate dynamic animation
    const keyframes = `
            @keyframes zoomLeaderboard {
                0% { transform: scale(0) }
                100% { transform: scale(1) }
            }
            `;

    textAnimation.style.animationName = `zoomLeaderboard`;
    textAnimation.style.animationDuration = '1s';
    textAnimation.style.animationFillMode = 'forwards';
    textAnimation.style.animationTimingFunction = 'ease';
    textAnimation.style.color = '#57a64a';
    textAnimation.style.fontWeight = 'bold';
    textAnimation.style.position = 'absolute';
    textAnimation.style.textAlign = 'center';
    textAnimation.style.fontFamily = 'JetBrains Mono';
    textAnimation.style.fontSize = '20px';
    textAnimation.style.left = '10px';
    textAnimation.style.bottom = '0px';
    textAnimation.style.width = '100%'; // Ensures the text is centered within its container
    textAnimation.style.whiteSpace = 'pre-wrap'; // Preserves new lines
    textAnimation.style.textOverflow = 'ellipsis'; // Adds ellipsis to overflowing text

    // Update the <style> tag or create it if it doesn't exist
    let styleTag = document.getElementById('dynamic-animations');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-animations';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent += keyframes;
}
function GetNumberWithOrdinal(n: number) {
    let s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function HandleLeaderboardDisplay(data: { type: string; stats: Array<{displayName: string, gems: number}> }) {
    let text = `Minigame Leaderboard:`;
    for (let i = 0; i < data.stats.length; i++) {
        text += `\n${GetNumberWithOrdinal(i + 1)}: ${data.stats[i].displayName} - ${data.stats[i].gems} gems`;
    }

    textAnimation.textContent = text;

    // Generate dynamic animation
    const keyframes = `
            @keyframes zoomStart {
                0% { transform: scale(0) translateY(${80}px); }
                20% { transform: scale(1) translateY(${80}px); }
                30% { transform: scale(1) translateY(${80}px); }
                90% { transform: scale(1) translateY(${10}px); }
                100% { transform: scale(0) translateY(${10}px); }
            }
            `;

    textAnimation.style.animationName = `zoomStart`;
    textAnimation.style.animationDuration = '8s';
    textAnimation.style.animationFillMode = 'forwards';
    textAnimation.style.animationTimingFunction = 'ease';
    textAnimation.style.color = '#57a64a';
    textAnimation.style.fontWeight = 'bold';
    textAnimation.style.position = 'absolute';
    textAnimation.style.textAlign = 'left';
    textAnimation.style.fontFamily = 'JetBrains Mono';
    textAnimation.style.fontSize = '17px';
    textAnimation.style.left = '20px';
    // textAnimation.style.bottom = '0px';
    // textAnimation.style.width = '100%'; // Ensures the text is centered within its container
    textAnimation.style.whiteSpace = 'pre-wrap'; // Preserves new lines
    textAnimation.style.textOverflow = 'ellipsis'; // Adds ellipsis to overflowing text

    // Update the <style> tag or create it if it doesn't exist
    let styleTag = document.getElementById('dynamic-animations');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-animations';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent += keyframes;
}

function HandleShopDisplay(data: { type: string; text: string }) {

    textAnimation.textContent = data.text;

    // Generate dynamic animation
    const keyframes = `
            @keyframes zoomStart {
                0% { transform: scale(0) translateY(${150}px); }
                20% { transform: scale(1) translateY(${150}px); }
                30% { transform: scale(1) translateY(${150}px); }
                90% { transform: scale(1) translateY(${-10}px); }
                100% { transform: scale(0) translateY(${-10}px); }
            }
            `;

    textAnimation.style.animationName = `zoomStart`;
    textAnimation.style.animationDuration = '8s';
    textAnimation.style.animationFillMode = 'forwards';
    textAnimation.style.animationTimingFunction = 'ease';
    textAnimation.style.color = '#57a64a';
    textAnimation.style.fontWeight = 'bold';
    textAnimation.style.position = 'absolute';
    textAnimation.style.textAlign = 'center';
    textAnimation.style.fontFamily = 'JetBrains Mono';
    textAnimation.style.fontSize = '17px';
    textAnimation.style.left = '20px';
    // textAnimation.style.bottom = '0px';
    // textAnimation.style.width = '100%'; // Ensures the text is centered within its container
    textAnimation.style.whiteSpace = 'pre-wrap'; // Preserves new lines
    textAnimation.style.textOverflow = 'ellipsis'; // Adds ellipsis to overflowing text

    // Update the <style> tag or create it if it doesn't exist
    let styleTag = document.getElementById('dynamic-animations');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-animations';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent += keyframes;
}

function HandlePlayerMinigame(data: { type: string; displayName: string; minigameType: MinigameTypeHtml; reward: string }) {
    textAnimation.textContent = `${data.displayName} is ${GetMinigameName(data.minigameType)}`;

    // Generate dynamic animation
    const keyframes = `
            @keyframes zoom1 {
                0% { transform: scale(0) }
                40% { transform: scale(1) }
                90% { transform: scale(1) }
                100% { transform: scale(0) }
            }
            @keyframes zoom2 {
                0% { transform: scale(0) }
                60% { transform: scale(1) }
                90% { transform: scale(1) }
                100% { transform: scale(0) }
            }
            `;

    textAnimation.style.animationName = `zoom1`;
    textAnimation.style.animationDuration = '6.5s';
    textAnimation.style.animationFillMode = 'forwards';
    textAnimation.style.animationTimingFunction = 'ease';
    textAnimation.style.color = '#57a64a';
    textAnimation.style.fontWeight = 'bold';
    textAnimation.style.position = 'absolute';
    textAnimation.style.textAlign = 'center';
    textAnimation.style.fontFamily = 'JetBrains Mono';
    textAnimation.style.fontSize = '20px';
    textAnimation.style.left = '0%';
    textAnimation.style.bottom = '10px';
    textAnimation.style.width = '100%'; // Ensures the text is centered within its container
    textAnimation.style.whiteSpace = 'pre-wrap'; // Preserves new lines
    textAnimation.style.textOverflow = 'ellipsis'; // Adds ellipsis to overflowing text


    // Update the <style> tag or create it if it doesn't exist
    let styleTag = document.getElementById('dynamic-animations');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-animations';
        document.head.appendChild(styleTag);
    }
    styleTag.textContent += keyframes;

    setTimeout(() => {
        textAnimation.style.fontSize = `50px`;
        textAnimation.style.bottom = "-25px";
        textAnimation.textContent = ".";
        setTimeout(() => {
            textAnimation.textContent = "..";
            setTimeout(() => {
                textAnimation.textContent = "...";
            }, 1000)
        }, 1000)
    }, 3000)

    setTimeout(() => {
        textAnimation.textContent = "";
        textAnimation.style.animation = '';
        textAnimation.style.scale = `0`;

        setTimeout(() => {
            textAnimation.textContent = data.reward;

            textAnimation.style.animationName = `zoom2`;
            textAnimation.style.animationDuration = '4s';
            textAnimation.style.animationFillMode = 'forwards';
            textAnimation.style.animationTimingFunction = 'ease';
            textAnimation.style.fontSize = `20px`;
            textAnimation.style.bottom = "10px";

            let containerWidth = textAnimation.parentElement.offsetWidth;
            let fontSize = Math.min(containerWidth / (textAnimation.textContent.length * 0.6), 20); // Adjust '0.6' and '20' as needed
            textAnimation.style.fontSize = `${fontSize}px`;

            setTimeout(() => {
                textAnimation.style.animation = '';
                textAnimation.textContent = "";
            }, 5000)
        }, 1000);
    }, 6000)
}

