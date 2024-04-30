const brbWS: WebSocket = new WebSocket('ws://localhost:3000');

brbWS.onopen = () => console.log("BRB Connected to WS server");
brbWS.onerror = (error) => console.log("WebSocket error:", error);

const dragon = `
                                                 /===-_---~~~~~~~~~------____
                                                |===-~___                _,-'
                 -==\\\\                         \`//~\\\\   ~~~~\`---.___.-~~
             ______-==|                         | |  \\\\           _-~\`
       __--~~~  ,-/-==\\\\                        | |   \`\\\\        ,'
    _-~       /'    |  \\\\                      / /      \\\\      /
  .'        /       |   \\\\                   /' /        \\\\   /'
 /  ____  /         |    \\\`\\.__/-~~ ~ \\ _ _/'  /          \\\\/'
/-'~    ~~~~~---__  |     ~-/~         ( )   /'        _--~\`
                  \\\\_|      /        _)   ;  ),   __--~~
                    '~~--_/      _-~/-  / \\   '-~ \\\\
                   {\\\\__--_/}    / \\\\_>- )<__\\\\      \\\\
                   /'   (_/  _-~  | |__>--<__|      |
                  |0  0 _/) )-~     | |__>--<__|      |
                  / /~ ,_/       / /__>---<__/      |
                 o o _//        /-~_>---<__-~      /
                 (^(~          /~_>---<__-      _-~
                ,/|           /__>--<__/     _-~
             ,//('(          |__>--<__|     /                  .----_
            ( ( '))          |__>--<__|    |                 /' _---_~\\\\
         \`-)) )) (           |__>--<__|    |               /'  /     ~\\\`\\
        ,/,'//( (             \\\\__>--<__\\\\    \\            /'  //        ||
      ,( ( ((, ))              ~-__>--<_~-_  ~--____---~' _/'/        /'
    \`~/  )\` ) ,/|                 ~-_~>--<_/-__       __-~ _/
  ._-~//( )/ )) \`                    ~~-'_/_/ /~~~~~~~__--~
   ;'( ')/ ,)(                              ~~~~~~~~~~
  ' ') '( (/
    '   '  \`
`;

interface DragonInfo {
    Health: number;
    MaxHealth: number;
}

let dragonInfo: DragonInfo;

function createDragon(data: { type: string; info: DragonInfo; }) {
    const dragonContainer: HTMLElement | null = document.getElementById('dragon');
    const dragonHtml: HTMLPreElement = document.createElement('pre');

    dragonHtml.id = 'dragon';
    dragonHtml.textContent = dragon;
    dragonHtml.style.color = '#f59342';
    dragonContainer?.appendChild(dragonHtml);

    dragonInfo = {
        Health: data.info.Health,
        MaxHealth: data.info.MaxHealth
    };
}

function constructHealthBar() {
    const healthBarContainer = document.getElementById('healthbarcontainer')!;
    const healthBarPositive = document.getElementById('healthbarPositive')!;
    const healthBarNegative = document.getElementById('healthbarNegative')!;
    healthBarContainer.style.color = '#57a64a';

    let healthBarSize = 50;
    let ratio = dragonInfo.Health / dragonInfo.MaxHealth;
    let posVal = Math.max(1, Math.floor(healthBarSize * ratio));
    healthBarPositive.textContent = '█'.repeat(posVal);
    healthBarNegative.textContent = '█'.repeat(healthBarSize - posVal);

    healthBarPositive.style.color = '#31a92d';
    healthBarNegative.style.color = '#d53751';
}

brbWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === 'init') {
        brbWS.send(JSON.stringify({ type: 'startup', pageType: 'berightback'}));
    }
    if(dataType === 'dragonSetup') {
        createDragon(JSON.parse(event.data));
        constructHealthBar();
    }
    else if (dataType === 'attack') {
        handleAttackDragon(JSON.parse(event.data));
    }
};

function handleAttackDragon(data: { type: string; info: DragonInfo }) {
    dragonInfo = data.info;

    if(dragonInfo.Health === 0) {
        const dragonContainer: HTMLElement | null = document.getElementById('dragon');
        dragonContainer?.removeChild(document.getElementById('dragon')!);
        return;
    }

    constructHealthBar();
}
window.addEventListener('beforeunload', (event) => {
    brbWS.send(JSON.stringify({ type: 'shutdown', pageType: 'berightback'}));
});
