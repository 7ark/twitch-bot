const pWS: WebSocket = new WebSocket('ws://localhost:3000');
pWS.onopen = () => console.log("Poll Display Connected to WS server");
pWS.onerror = (error) => console.log("WebSocket error:", error);

pWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === 'showPoll') {
        showPoll(JSON.parse(event.data));
    }
    else if(dataType === 'updatePoll') {
        updatePoll(JSON.parse(event.data));
    }
};

let winningIndices: Array<number> = [];

function showPoll(data: { type: string, title: string, choices: Array<{choice: string, votes: number}>, duration: number }) {
    let display = document.getElementById('all');

    display.style.opacity = '1';

    let title = document.getElementById('title');
    const pollOptionsContainer = document.getElementById('poll-options');
    pollOptionsContainer.innerHTML = '';

    let totalVotes = 0;
    for (let i = 0; i < data.choices.length; i++) {
        totalVotes += data.choices[i].votes;
    }

    data.choices.forEach((choice, index) => {
        // Create poll option elements
        const optionElement = createPollOption(index + 1, choice.choice, choice.votes, totalVotes, data.choices.length);

        pollOptionsContainer.appendChild(optionElement);
    });

    title.textContent = data.title;

    createTimer(pollOptionsContainer);
    startTimer(data.duration);

    setTimeout(hideDisplay, 1000 * data.duration);
}

async function hideDisplay() {
    const winnerColor = "rgba(0,180,42,0.8)";

    winningIndices.forEach(index => {
        const progressBar = document.getElementById(`progress-${index}`);
        if (progressBar) {
            progressBar.dataset.originalColor = progressBar.style.backgroundColor || "rgba(58, 134, 255, 0.6)";

            progressBar.style.backgroundColor = winnerColor;
            progressBar.style.transition = "background-color 0.3s ease-in-out";
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1000 * 5));

    let display = document.getElementById('all');

    display.style.opacity = '0';
}

function updatePoll(data: { type: string, choices: Array<{choice: string, votes: number}> }) {
    let totalVotes = 0;
    let highestVote = 0;
    for (let i = 0; i < data.choices.length; i++) {
        totalVotes += data.choices[i].votes;

        if(data.choices[i].votes > highestVote) {
            highestVote = data.choices[i].votes;
        }
    }

    winningIndices = [];
    for (let i = 0; i < data.choices.length; i++) {
        if(data.choices[i].votes == highestVote) {
            winningIndices.push(i + 1);
        }
    }

    data.choices.forEach((choice, index) => {
        // Create poll option elements
        updatePollOption(index + 1, choice.votes, totalVotes);
    });
}

function createPollOption(index: number, text: string, votes: number, totalVotes: number, totalChoices: number) {
    // Calculate percentage
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

    // Create main container
    const option = document.createElement('div');
    option.className = 'poll-option';
    if(totalChoices <= 3) {
        option.style.height = "120px";
    }
    else if(totalChoices <= 5) {
        option.style.height = "100px";
    }
    else {
        option.style.height = "80px";
    }

    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'poll-progress-bar';
    progressBar.id = `progress-${index}`;
    progressBar.style.width = `${percentage}%`;

    // Create index circle
    const indexElement = document.createElement('div');
    indexElement.className = 'poll-index';
    indexElement.textContent = index.toString();

    // Create text element
    const textElement = document.createElement('div');
    textElement.className = 'poll-option-text';
    textElement.textContent = text;

    let min = 3;
    let max = 5;

    if(text.length < 10) {
        min = 5;
        max = 10;
    }

    let amount = 1 - InverseLerp(20, 50, text.length);
    let size = Lerp(min, max, amount);
    if(size < min) {
        size = min;
    }
    if(size > max) {
        size = max;
    }
    textElement.style.fontSize = `${size}vw`  //text.length < 25 ? "5vw" : "2.5vw";

    // Create votes count
    const votesElement = document.createElement('div');
    votesElement.className = 'poll-votes';
    votesElement.id = `votes-${index}`;
    votesElement.textContent = `${votes}`;

    // Assemble the option
    option.appendChild(progressBar);
    option.appendChild(indexElement);
    option.appendChild(textElement);
    option.appendChild(votesElement);

    return option;
}

function updatePollOption(index: number, votes: number, totalVotes: number) {
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

    let progressBar = document.getElementById(`progress-${index}`);
    let votesText = document.getElementById(`votes-${index}`);
    votesText.textContent = `${votes}`;

    progressBar.style.width = `${percentage}%`;
}

function createTimer(container) {
    const existingTimer = document.querySelector('.timer-container');
    if (existingTimer) {
        existingTimer.remove();
    }

    const timerContainer = document.createElement('div');
    timerContainer.className = 'timer-container';

    // Create timer progress bar
    const timerProgress = document.createElement('div');
    timerProgress.className = 'timer-progress';
    timerProgress.id = 'timer-progress';

    // Assemble timer
    timerContainer.appendChild(timerProgress);

    // Add to container
    container.after(timerContainer);
}

function startTimer(durationInSeconds) {
    // Get the timer element
    const timer = document.getElementById('timer-progress');

    if (!timer) return;

    // Reset to full width
    timer.style.width = '100%';

    // Set transition duration to match the timer duration
    timer.style.transition = `width ${durationInSeconds}s linear`;

    // Force browser to process the previous style
    void timer.offsetWidth;

    // Start the animation
    timer.style.width = '0%';
}

const Lerp = (a: number, b: number, t: number) => a + t * (b - a);
const InverseLerp = (a: number, b: number, v: number) => (v - a) / (b - a);
