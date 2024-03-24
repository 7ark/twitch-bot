const fcWS: WebSocket = new WebSocket('ws://localhost:3000');

fcWS.onopen = () => console.log("Follower Count Connected to WS server");
fcWS.onerror = (error) => console.log("WebSocket error:", error);

fcWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if (dataType === 'followerCount') {
        handleFollowerCount(JSON.parse(event.data));
    }
};

const goalReward = "Crowd Control day with all effects for 1 coin"
const currentFollowerGoal = 350;

function handleFollowerCount(data: { type: string; followerCount: number; }) {
    const followerCountElement = document.getElementById('followergoal');

    if (followerCountElement) {
        followerCountElement.textContent = `// Follower Goal: ${data.followerCount}/${currentFollowerGoal} - ${goalReward}`;
        followerCountElement.style.color = '#57a64a';
        followerCountElement.style.position = 'absolute';
        followerCountElement.style.fontSize = "50";
        followerCountElement.style.fontFamily = "JetBrains Mono";
    }
}
