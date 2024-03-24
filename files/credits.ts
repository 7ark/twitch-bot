const cWS: WebSocket = new WebSocket('ws://localhost:3000');
cWS.onopen = () => console.log("Credits Connected to WS server");
cWS.onerror = (error) => console.log("WebSocket error:", error);

interface PlayerSessionData {
    NameAsDisplayed: string;
    Messages: Array<string>;
    TimesAttackedEnemy: number;
}

// let activeUsers: Map<string, string[]> = new Map<string, string[]>();

cWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === 'showcredits') {
        showCredits(JSON.parse(event.data));
    }
};

// function handlePlayerMessage(data: { type: string; displayName: string; message: string; color: string; }) {
//     if(data.displayName.toLowerCase() === 'the7ark') {
//         return;
//     }
//
//     if(!activeUsers.has(data.displayName)) {
//         activeUsers.set(data.displayName, []);
//     }
//
//     if(data.message[0] === '!' || data.message.length <= 2) {
//         return;
//     }
//
//     let messages = activeUsers.get(data.displayName)!;
//     messages.push(data.message);
//     activeUsers.set(data.displayName, messages);
// }

function showCredits(data: { type: string; data: string }) {
    let arrayData = JSON.parse(data.data);
    let activeUsers: Map<string, PlayerSessionData> = Array.isArray(arrayData) ? new Map<string, PlayerSessionData>(arrayData) : new Map<string, PlayerSessionData>()

    const creditsContainer = document.getElementById('creditsContainer');
    if (!creditsContainer) return;

    if(activeUsers.size === 0) {
        activeUsers.set("Nobody", {
            NameAsDisplayed: "Nobody",
            Messages: ["Wow, nobody showed up. INCREDIBLE!"],
            TimesAttackedEnemy: 0
        });
    }

    // Ensure the container is empty, visible, and styled for the credits
    creditsContainer.innerHTML = '';
    creditsContainer.style.display = 'flex';
    creditsContainer.style.flexDirection = 'column';
    creditsContainer.style.justifyContent = 'flex-start';
    creditsContainer.style.alignItems = 'center';
    creditsContainer.style.height = 'max-content'//`${1700 + (activeUsers.size * 400)}px`;

    let first = true;
    // Dynamically add names to the container
    activeUsers.forEach((messages, name) => {
        if(name.toLowerCase() === "the7ark") {
            return;
        }
        const nameElement = document.createElement('div');
        nameElement.textContent = messages.NameAsDisplayed;
        nameElement.style.marginBottom = '5px';
        nameElement.style.fontSize = "150px";
        if(first){
            first = false;
            nameElement.style.marginTop = '150px';
        }
        // Create and style the subtitle part
        const subtitlePart = document.createElement('div');

        let chosenMessage = getRandomItem(messages.Messages);
        if(chosenMessage === undefined) {
            chosenMessage = getRandomItem([
                `They were a strong and silent type`,
                `So much said with so few words`,
                `A hero in their own way`,
                `They needed to say nothing to get their point across`,
                `Does anyone know them? We found them wandering in the parking lot`,
                `Their lack of words speaks volumes`
            ])!;
        }
        else {
            chosenMessage = `"${chosenMessage}"`;
        }

        subtitlePart.textContent = chosenMessage; // Set the subtitle text
        subtitlePart.style.fontSize = "50px"; // Smaller font size for subtitle
        subtitlePart.style.color = "grey"; // Example styling
        subtitlePart.style.marginBottom = '200px';


        creditsContainer.appendChild(nameElement);
        creditsContainer.appendChild(subtitlePart)
    });

    const nameElement = document.createElement('div');
    nameElement.textContent = "Thanks for watching!";
    nameElement.style.margin = '450px';
    nameElement.style.marginBottom = '700px';
    nameElement.style.fontSize = "150px";
    creditsContainer.appendChild(nameElement)

    // Calculate the translateY value for the start and end of the animation
    const totalScrollHeight = creditsContainer.scrollHeight - window.innerHeight - 50;

    // Correctly typed keyframes for the animate function
    const keyframes: Keyframe[] = [
        { transform: `translateY(${window.innerHeight}px)` },
        { transform: `translateY(-${totalScrollHeight}px)` }
    ];

    // Animation options
    const options: KeyframeAnimationOptions = {
        duration: 10000 + 2000 * activeUsers.size, // Control the speed of the scrolling here
        easing: 'linear',
        fill: 'forwards'
    };

    // creditsContainer.animate([
    //     { transform: 'translateY(100%)' }, // Start just below the screen
    //     { transform: `translateY(-${totalScrollHeight}px)` } // End with the last item in the middle
    // ], {
    //     duration: 10000, // Adjust duration for scrolling speed
    //     easing: 'linear',
    //     fill: 'forwards'
    // });
    // Start the animation with correctly typed parameters
    creditsContainer.animate(keyframes, options);

    // Optionally hide the container after the animation ends
    creditsContainer.addEventListener('animationend', () => {
        creditsContainer.style.display = 'none';
    });
}

function getRandomItem<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
