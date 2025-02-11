const brbWS: WebSocket = new WebSocket('ws://localhost:3000');

brbWS.onopen = () => console.log("BRB Connected to WS server");
brbWS.onerror = (error) => console.log("WebSocket error:", error);

brbWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    if(dataType === 'init') {
        brbWS.send(JSON.stringify({ type: 'startup', pageType: 'berightback'}));
    }
    if(dataType === 'monsterSetup') {
        CreateMonster(JSON.parse(event.data));
        ConstructMonsterHealthBar();
    }
    else if (dataType === 'attack') {
        HandleMonsterAttack(JSON.parse(event.data));
    }
};

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

enum MonsterType { Dragon, Loaf, Tank, FrankTheTrafficCone }

interface MonsterInfoHtml {
    Type: MonsterType,
    Health: number;
    MaxHealth: number;
}

let MonsterInfoHtml: MonsterInfoHtml;

function CreateMonster(data: { type: string; monsterType: MonsterType; health: number; maxHealth: number }) {
    const monsterImage: HTMLImageElement = document.getElementById('monster') as HTMLImageElement;
    // const monsterHtml: HTMLPreElement = document.createElement('pre');

    switch (data.monsterType) {
        case MonsterType.Dragon:
            monsterImage.src = `extras/bytefire.png`;
            break;
        case MonsterType.Loaf:
            monsterImage.src = `extras/loafswipe.png`;
            break;
        case MonsterType.Tank:
            monsterImage.src = `extras/tank.png`;
            break;
        case MonsterType.FrankTheTrafficCone:
            monsterImage.src = `extras/frank.png`;
            break;
        // case MonsterType.Santa:
        //     monsterImage.src = `extras/santa.png`;
        //     break;
    }

    // monsterHtml.id = 'monster';
    // // monsterHtml.textContent = dragon;
    // monsterHtml.sr
    // monsterHtml.style.color = '#f59342';
    // monsterContainer?.appendChild(monsterHtml);

    MonsterInfoHtml = {
        Type: data.monsterType,
        Health: data.health,
        MaxHealth: data.maxHealth
    };
}

function ConstructMonsterHealthBar() {
    // const healthBarContainer = document.getElementById('healthbarcontainer')!;
    // const healthBarPositive = document.getElementById('healthbarPositive')!;
    // const healthBarNegative = document.getElementById('healthbarNegative')!;
    // healthBarContainer.style.color = '#57a64a';
    //
    // let healthBarSize = 50;
    // let ratio = MonsterInfoHtml.Health / MonsterInfoHtml.MaxHealth;
    // let posVal = Math.max(1, Math.floor(healthBarSize * ratio));
    // healthBarPositive.textContent = '█'.repeat(posVal);
    // healthBarNegative.textContent = '█'.repeat(healthBarSize - posVal);
    //
    // healthBarPositive.style.color = '#31a92d';
    // healthBarNegative.style.color = '#d53751';

    const progressBar = document.getElementById("progressBar");
    const progressBarText = document.getElementById("progressText");

    let ratio = MonsterInfoHtml.Health / MonsterInfoHtml.MaxHealth;

    const widthPercentage = ratio * 100;
    progressBar.style.width = `${Math.min(widthPercentage, 100)}%`;

    progressBarText.textContent = `${MonsterInfoHtml.Health}/${MonsterInfoHtml.MaxHealth}`;
}

function HandleMonsterAttack(data: { type: string; health: number }) {
    MonsterInfoHtml.Health = data.health;

    if(MonsterInfoHtml.Health === 0) {
        const monsterImage: HTMLImageElement = document.getElementById('monster') as HTMLImageElement;
        monsterImage.src = ``;
        return;
    }

    ConstructMonsterHealthBar();
}
window.addEventListener('beforeunload', (event) => {
    brbWS.send(JSON.stringify({ type: 'shutdown', pageType: 'berightback'}));
});
