// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected to the server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'randomNumber') {
        document.getElementById('randomNumberDisplay').textContent = data.value;
    }
};

document.getElementById('sendButton').addEventListener('click', () => {
    const number = document.getElementById('randomNumberDisplay').textContent;
    ws.send(number);
});
