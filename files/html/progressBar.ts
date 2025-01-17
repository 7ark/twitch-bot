const progressBarWS: WebSocket = new WebSocket('ws://localhost:3000');

progressBarWS.onopen = () => console.log("Progress Bar Connected to WS server");
progressBarWS.onerror = (error) => console.log("WebSocket error:", error);

progressBarWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    console.log(JSON.parse(event.data));

    if(dataType === `init`) {
        progressBarWS.send(JSON.stringify({ type: 'updateProgressBar'}));
    }
    else if(dataType === 'progressBar') {
        let data: { type: string; fill: number; max: number } = JSON.parse(event.data);

        SetBarValues(data.fill, data.max);
    }
};

function SetBarValues(fill: number, max: number) {
    const progressBar = document.getElementById("progressBar");

    //Add a buffer value so it has a bit of space before it hits the top of the progress bar
    const buffer = 1;

    if (!progressBar || max <= 0) return;

    const heightPercentage = (Math.max(0, fill - buffer) / max) * 100;
    progressBar.style.height = `${Math.min(heightPercentage, 100)}%`;
}
