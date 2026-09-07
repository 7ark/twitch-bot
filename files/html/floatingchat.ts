// @ts-ignore - CONFIG is defined in HTML
const config = CONFIG;

interface ChatBubbleData {
    displayName: string;
    message: string;
    color: string;
    badges?: { [key: string]: string };
    emotes?: { [key: string]: string[] };
}

interface ActiveBubble {
    element: HTMLElement;
    timeout: NodeJS.Timeout;
}

const ws = new WebSocket('ws://localhost:3000');
const chatContainer = document.getElementById('chatContainer') as HTMLDivElement;
const activeBubbles: ActiveBubble[] = [];
const messageQueue: ChatBubbleData[] = [];

ws.onopen = () => console.log("Floating Chat Connected to WS server");
ws.onerror = (error) => console.log("WebSocket error:", error);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('WebSocket message received:', data.type);

    if (data.type === 'floatingchat') {
        console.log('Floating chat message:', data);
        handleChatMessage(data);
    }
};

function handleChatMessage(data: ChatBubbleData) {
    if (activeBubbles.length >= config.maxBubbles) {
        // Queue the message if we're at max
        messageQueue.push(data);
    } else {
        createChatBubble(data);
    }
}

function createChatBubble(data: ChatBubbleData) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    // Create header with username and badges
    const header = document.createElement('div');
    header.className = 'chat-bubble-header';

    // Left side container (badges + username)
    const headerLeft = document.createElement('div');
    headerLeft.className = 'chat-bubble-header-left';

    // Add badges if present
    if (data.badges && Object.keys(data.badges).length > 0) {
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'chat-bubble-badges';

        for (const [badgeType, badgeVersion] of Object.entries(data.badges)) {
            const badgeImg = document.createElement('img');
            badgeImg.className = 'chat-bubble-badge';
            // Twitch badge CDN URL format
            badgeImg.src = `https://static-cdn.jtvnw.net/badges/v1/${getBadgeId(badgeType, badgeVersion)}/1`;
            badgeImg.alt = badgeType;
            badgesContainer.appendChild(badgeImg);
        }

        headerLeft.appendChild(badgesContainer);
    }

    // Add username
    const username = document.createElement('span');
    username.className = 'chat-bubble-username';
    username.textContent = data.displayName;
    username.style.color = data.color || '#FFFFFF';
    headerLeft.appendChild(username);

    // Add Twitch icon on the right (using data URI for inline SVG)
    const twitchIcon = document.createElement('img');
    twitchIcon.className = 'twitch-icon';
    // Twitch Glitch logo as inline SVG data URI
    twitchIcon.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 268"%3E%3Cpath fill="%239146FF" d="M17.458 0L0 46.556v186.201h63.983v34.934h34.931l34.898-34.934h52.36L256 162.954V0zm23.259 23.263H232.73v128.029l-40.739 40.741H128L93.113 226.92v-34.886H40.717zm64.008 116.405H128V69.844h-23.275zm63.997 0h23.27V69.844h-23.27z"/%3E%3C/svg%3E';
    twitchIcon.alt = 'Twitch';

    header.appendChild(headerLeft);
    header.appendChild(twitchIcon);

    // Create message content with emotes
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-bubble-message';
    messageDiv.innerHTML = parseMessageWithEmotes(data.message, data.emotes);

    // Wrap text to fit character limit
    wrapText(messageDiv);

    bubble.appendChild(header);
    bubble.appendChild(messageDiv);

    // Calculate duration based on message length
    const duration = calculateDuration(data.message);

    // Add to DOM first (required for positioning calculations)
    chatContainer.appendChild(bubble);

    // Force bubble to render to get accurate dimensions
    bubble.offsetHeight; // Force reflow

    // Random position (after adding to DOM so we have accurate size)
    const position = getRandomPosition(bubble);
    bubble.style.left = `${position.x}px`;
    bubble.style.top = `${position.y}px`;

    console.log('Creating bubble at position:', position, 'with duration:', duration);

    // Trigger animation
    requestAnimationFrame(() => {
        bubble.classList.add('animate');
        bubble.style.animationDuration = `${duration / 1000}s`;
        console.log('Animation started');
    });

    // Set timeout to remove bubble
    const timeout = setTimeout(() => {
        removeBubble(bubble);
    }, duration);

    // Track active bubble
    activeBubbles.push({ element: bubble, timeout });
}

function parseMessageWithEmotes(message: string, emotes?: { [key: string]: string[] }): string {
    if (!emotes || Object.keys(emotes).length === 0) {
        return escapeHtml(message);
    }

    // Create array of emote positions
    const emotePositions: { start: number; end: number; id: string }[] = [];

    for (const [emoteId, positions] of Object.entries(emotes)) {
        for (const pos of positions) {
            const [start, end] = pos.split('-').map(Number);
            emotePositions.push({ start, end, id: emoteId });
        }
    }

    // Sort by position (descending) to replace from end to start
    emotePositions.sort((a, b) => b.start - a.start);

    let result = message;

    for (const emote of emotePositions) {
        const emoteText = message.substring(emote.start, emote.end + 1);
        const emoteImg = `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0" alt="${escapeHtml(emoteText)}" title="${escapeHtml(emoteText)}">`;
        result = result.substring(0, emote.start) + emoteImg + result.substring(emote.end + 1);
    }

    return result;
}

function wrapText(element: HTMLElement) {
    // This is handled by CSS word-wrap, but we can add manual line breaks
    // based on character limit if needed
    const text = element.textContent || '';
    const limit = config.wrapCharacterLimit;

    // Simple word-wrapping algorithm
    if (text.length <= limit) {
        return;
    }

    // Let CSS handle the wrapping with word-break
    element.style.maxWidth = `${config.bubbleMaxWidth}px`;
}

function getRandomPosition(bubble: HTMLElement): { x: number; y: number } {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Estimate bubble size (we'll refine after render)
    const bubbleWidth = config.bubbleMaxWidth;
    const bubbleHeight = 150; // Estimate

    const x = Math.random() *
        (containerWidth - bubbleWidth - config.marginLeft - config.marginRight) +
        config.marginLeft;

    const y = Math.random() *
        (containerHeight - bubbleHeight - config.marginTop - config.marginBottom) +
        config.marginTop;

    return { x, y };
}

function calculateDuration(message: string): number {
    const length = message.length;
    const duration = config.baseDuration + (length * config.durationPerChar);
    return Math.min(duration, config.maxDuration);
}

function removeBubble(bubble: HTMLElement) {
    // Find and remove from active bubbles
    const index = activeBubbles.findIndex(b => b.element === bubble);
    if (index !== -1) {
        clearTimeout(activeBubbles[index].timeout);
        activeBubbles.splice(index, 1);
    }

    // Remove from DOM
    bubble.remove();

    // Process queue if available
    if (messageQueue.length > 0) {
        const nextMessage = messageQueue.shift();
        if (nextMessage) {
            createChatBubble(nextMessage);
        }
    }
}

function getBadgeId(badgeType: string, version: string): string {
    // Map common badge types to their IDs
    // This is a simplified version - you may need to fetch badge data from Twitch API
    const badgeMap: { [key: string]: { [version: string]: string } } = {
        'moderator': { '1': '3267646d-33f0-4b17-b3df-f923a41db1d0' },
        'subscriber': {
            '0': '5d9f2208-5dd8-11e7-8513-2ff4adfae661',
            '1': '5d9f2208-5dd8-11e7-8513-2ff4adfae661',
            '2': '25a03e36-2bb2-4625-bd37-d6d9d406238d',
            '3': 'b4e23b2d-d7c7-4a50-b86e-5638266b791c'
        },
        'vip': { '1': 'b817aba4-fad8-49e2-b88a-7cc744dfa6ec' },
        'premium': { '1': 'bbbe0db0-a598-423e-86d0-f9fb98ca1933' },
        'broadcaster': { '1': '5527c58c-fb7d-422d-b71b-f309dcb85cc1' }
    };

    if (badgeMap[badgeType] && badgeMap[badgeType][version]) {
        return badgeMap[badgeType][version];
    }

    // Fallback: use subscriber badge as default
    return '5d9f2208-5dd8-11e7-8513-2ff4adfae661';
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
