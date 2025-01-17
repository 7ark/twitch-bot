// const tts = require('text-to-speech-js');

const taWS: WebSocket = new WebSocket('ws://localhost:3000');

taWS.onopen = () => console.log("Text Adventure Connected to WS server");
taWS.onerror = (error) => console.log("WebSocket error:", error);

const TEXT_SPEED = 40;//ms
let isPollRunning: boolean = false;
let pollWinner: string = '';

taWS.onmessage = (event: MessageEvent) => {
    const dataType: any = JSON.parse(event.data).type;

    // if(dataType === 'init') {
    //     brbWS.send(JSON.stringify({ type: 'startup', pageType: 'berightback'}));
    // }
    if(dataType === 'startadventure') {

        // let voices = window.speechSynthesis.voi .getVoices();
        // console.log("Doing voices " + voices.length)
        // for(let i = 0; i < voices.length; i++) {
        //     setTimeout(() => {
        //         console.log(`Testing ${voices[i]}`)
        //         let utterance = new SpeechSynthesisUtterance(`This voice is ${voices[i]}`);
        //         utterance.onend = () => {
        //
        //         }
        //         utterance.voice = voices[i];
        //         utterance.pitch = 1; // Range between 0 and 2
        //         utterance.rate = 1; // Range between 0.1 and 10
        //         window.speechSynthesis.speak(utterance);
        //     }, i * 3000);
        // }
        //
        // // let utterance = new SpeechSynthesisUtterance("hello world and all who live here or whatever");
        // //
        // // // Optional: Set properties for pitch, rate, volume, and voice
        // // utterance.pitch = 1; // Range between 0 and 2
        // // utterance.rate = 1; // Range between 0.1 and 10
        // // utterance.volume = 1; // Range between 0 and 1
        // // window.speechSynthesis.speak(utterance)
        // return;

        let text = `Hey pals! You defeated the dragon! What good adventurers you are.`;
        displayText(text, () => {
            setTimeout(playAdventureModule, 1000);
        });

    }
    else if(dataType === 'pollresults') {
        if(isPollRunning) {
            pollWinner = JSON.parse(event.data).winner;
            console.log("Got poll results! Setting winner to ", pollWinner);
        }
    }

};


interface AdventureModule {
    Dialogue: string;
    Choices: Array<AdventureChoice>;
    EndingCallback?: () => void;
}

interface AdventureChoice {
    ChoiceName: string;
    Result: Array<AdventureModule>;
}


// {
//     ChoiceName: ``,
//         Result: [],
// },

// {
//     Dialogue: ``,
//     Choices: []
// },

const modules: Array<AdventureModule> = [
    {
        // Dialogue: `You're travelling through the forest. It's a bright, sunny day! The forest is full of life, the birds are flying through the air, you just really feel alive you know?\n\n
        //     In the forest beyond, you can hear rustling noises. How would you like to proceed?`,
        // Choices: [
        //     {
        //         ChoiceName: `Keep Walkin'`,
        //         Result: [
        //             {
                        Dialogue: `You're travelling through the forest, a wonderful day ahead of you, lot's of travel when suddenly a deep unsettling feeling of dread settles over you. You instinctively check over your shoulder, but see the path has disappeared, and suddenly you're alone and lost.`,//`You keep walking and feel a sense of dread fall over you. You look back, but see nothing there. As you turn back to the path, you realize that suddenly the path is gone.`,
                        Choices: [
                            {
                                ChoiceName: `Run?? Anywhere?`,
                                Result: [
                                    {
                                        Dialogue: `You sprint off in fear, into the woods. With no path to guide you, you become lost in a darken section of the forest. Strange sounds yell out at you from every point. Fear begins to grip you. Shadows are everywhere, elongated and twisted, like the very energy of the forest is against you. What horrid place had you stumbled into? Furthermore, what will you do about it?`,
                                        Choices: [
                                            {
                                                ChoiceName: `Yell for help`,
                                                Result: [
                                                    {
                                                        Dialogue: `You yell out for help, hoping for any assistance. Then you hear it, the sound of a young womans voice hesitantly shouts back.\n\n"Hello? Who's there?"`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `"Me"`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You respond to the womans voice, but you hear no response. She appears to have left you alone. However, your shouts did attract something else.\n\n
                                                                        A mass of darkness and horror approaches you.`,
                                                                        Choices: [],
                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `"I'm lost"`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `She seems hesitant at first, but eventually shouts back to you, helping guide you to her. You find a young woman on a lone path, in fact it appears to be the path you had stumbled off of. Thankfully now you can continue your journey`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Thank her and continue on your way`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You both continue on the same path for a while, until eventually parting on good terms. You learn she lives nearby, just outside the forest.`,
                                                                                        Choices: []
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `You both part ways, heading in opposite directions, but remember the woman who saved you from the depths of the forest`,
                                                                                        Choices: []
                                                                                    },
                                                                                ]
                                                                            },
                                                                            {
                                                                                ChoiceName: `Try to hit on her`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `She slaps you, leaving a red welt, and walks off. But hey, at least you made it out of the forest.`,
                                                                                        Choices: []
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `She blushes a bit, and agrees to continue walking with you a bit through the forest, at least until she needs to part ways`,
                                                                                        Choices: []
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `She stares at you blankly for a moment, and then begins to smile. But as she continues to smile, it only gets longer and longer. You watch in horror as her mouth gets endlessly large, splitting her face. As she opens her mouth, an inky darkness of horrors spills out, endless nightmares spewing from what was once her mouth. You realize now. She is the darkness of the forest.`,
                                                                                        Choices: [],
                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                    },
                                                                                ]
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `"HELP"`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You hear a few footsteps further from the wood that seem to head your direction at first, but then hesitate, and seem to sprint off away from you.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Yell "What the fuck"`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You yell into the forest, but are greeted with silence.\nMore silence.\n\nEven more silence.\n\nYou become trapped in an infinity of silence. At least, you were. Until it came.`,
                                                                                        Choices: [],
                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `You hear a faint "Sorry!" from the distance and then silence.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `AHHHHH`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `THE INFINITE VOID DEVOURS YOUR SOUL.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `*Scream*`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `THE INFINITE VOID DEVOURS YOUR SOUL.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `???`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `THE INFINITE VOID DEVOURS YOUR SOUL.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Try to chase after her`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `Your feet leave heavy impacts in the forests underbrush, trampling bushes and soil alike. Your breath gets heavy, trying to keep up with the woman you're chasing. Eventually you stumble out onto a path. THE path. It's the path you had been travelling on. With no sign of the woman at all.`,
                                                                                        Choices: []
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `You begin chasing, trying to keep up where you can. You can hear her just ahead, almost within your grasp. Your key to freedom from this forest. Then however, you hear steps behind you. You're being chased as well.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Keep going`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You ignore whoever, or whatever it is, and keep up your chase, seeking your freedom. The sounds of footsteps becomes rhythmic. First her footsteps, then yours, then whomever is following you. Is there even more? Your follower may have a follower of their own. Infinite footsteps ring in your ears. Running is all you know.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Keep running`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Running turns to bliss. You continue on. You run. You cease to exist. Running is all you know. All you've ever known. You are happy.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Run even more`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Running turns to bliss. You continue on. You run. You cease to exist. Running is all you know. All you've ever known. You are happy. You are one with the universe.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Look behind you`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Incredibly, it's you. You see yourself, looking behind yourself. Looking backwards. A series of you. Then you begin to notice the trees, the bushes, they all repeat in an endless cycle. You look forward once more, and finally notice, you recognize the womans outfit. It's you. It's always been you.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Stop running`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You stop running, but the rest continue on in an infinite line. You watch infinite Yous pass by, sprinting into an infinite void. You stumble back, and suddenly find yourself back on the road. You are nowhere in sight.\n\nYou, are alone.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Continue forth`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Running turns to bliss. You continue on. You ALL continue on. You're all that exists, yourself and all of your infinite selves. Wrapped in the warmth and comfort of your expansiveness. You are everything, you are the universe.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                            {
                                                ChoiceName: `Just keep sprinting`,
                                                Result: [
                                                    {
                                                        Dialogue: `You keep sprinting, looking for anything to guide you back to the path. Eventually you see it, a faint light in the distance.`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `Run towards it`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You make your way towards the light, a shimmering beacon in this dark forest. As you arrive, you find a floating orb of light`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Touch it`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You touch it, and your hand harmlessly passes through. Though you feel an energy inside, it's almost as if the orb is... speaking, to you?\n\n"Hello?"`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `"Hello!"`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `"Oh. Hello, would you free me?"`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Yes`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You follow the instructions of the orb, which allows you to free the orb. Released is a handsome mage. He is incredibly grateful for your help, and gives you a gift. He helps you find your way back to the path too!`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You released the creature within the orb. Oops. You've been tricked. It's a horrendous creature not of this plane.`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `No`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You can feel the anger shake the ground around you from the orb. Clearly this was a good choice, whatever's inside doesn't seem nice. In the shaking though, a tree falls over, and shows a clearing leading back to the path, what luck!`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You hear the sounds of disappointment from the orb, and the light disappears. You're now lost, without light. You sit in the forest, and eventually pass out. When you awake, you're starving, but suddenly on the path. Who knows how you got here.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `"Hi there, you have been granted one wish, for being kind. What would you like?"`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Money`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You gain infinite wealth. You buy your way out of the forest. You marry the cutest person you can find. You have all you could ever ask for...\n\nIs it enough?`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `More gold than you've ever seen before appears above you. At first you're delighted, but then as you feel yourself struck by a coin you realize your mistake. You begin to run, but you cannot. The gold rains from the sky, pelting you everywhere. Eventually, the mass of the gold coins crushes you to death, in a bloody mess.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `The orb shakes and sputters, and explodes in light. A moment passes, and you find yourself back on the path. You've been tricked, you have no wish, and the orb is gone.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Power`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `The orb shakes and sputters, and explodes in light. A moment passes, and you find yourself back on the path. You've been tricked, you have no wish, and the orb is gone.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You feel a crown placed atop your head, and as you turn around, suddenly you're in a palace. YOUR palace. You've been crowned king. You're the most powerful person in the civilized world.\n\nBut... something seems off.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You feel a surge of energy, as all the magic of the world is siphoned into you. The energy and life force from the trees crumble around you, all the magic that has ever been is being funneled straight into your body. It is incredible power. Is it all the magic.\n\nIt is... too much. You feel overwhelmed. The power is overflowing. It's filling you up, until you explode, in a beautiful explosion of light.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Infinite fun`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `The orb shakes and sputters, and explodes in light. A moment passes, and you find yourself back on the path. You've been tricked, you have no wish, and the orb is gone.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `Nothing happens. The orb says "Make your own fun" and disappears, though in the flash of light, you do find yourself back on the path.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `"Here, fight this, that's fun"`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Love`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `The orb shakes and sputters, and explodes in light. A moment passes, and you find yourself back on the path. You've been tricked, you have no wish, and the orb is gone.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `A beautiful individual appears before you. They're exactly your type, and clearly they're hopelessly in love with you. You can't help but smile, and you two almost instantly hit it off. Finding your way out of the forest is easy with them in your arms. Everything is wonderful.\n\nRight? You think...`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You feel your emotions surge within you, and feel a kinship with everyone you've ever met. Including this orb. A deep love that cannot be match. You love everyone. Everything. Everything is good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. Good. `,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `"F off"`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You explode to dust. Who knows how. Doesn't matter now, you're dead.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `The orb disappears. You're on your own bucko. Without help you stay lost for days on end. You starve.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `The orb transforms into a horrendous mass of dark energy. Oops.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Stay silent`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `"Hello? I'm afraid of the dark"`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Stay silent`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `The silence stretches on forever. Oops. Guess you should've spoken up when you could.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `The orb explodes, in a shower of light. The path appears. Wow, who knew?`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `The orb transforms into a gruesome unimaginable monster. `,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Say hello`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `"Oh. Hello, would you free me?"`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `Yes`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `You follow the instructions of the orb, which allows you to free the orb. Released is a handsome mage. He is incredibly grateful for your help, and gives you a gift. He helps you find your way back to the path too!`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `You released the creature within the orb. Oops. You've been tricked. It's a horrendous creature not of this plane.`,
                                                                                                                                        Choices: [],
                                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `No`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `You can feel the anger shake the ground around you from the orb. Clearly this was a good choice, whatever's inside doesn't seem nice. In the shaking though, a tree falls over, and shows a clearing leading back to the path, what luck!`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `You hear the sounds of disappointment from the orb, and the light disappears. You're now lost, without light. You sit in the forest, and eventually pass out. When you awake, you're starving, but suddenly on the path. Who knows how you got here.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Leave`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You leave, and return to wandering the forest. Until you see another orb of light, that looks very similar to the first.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Approach it`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You approach, but the light begins moving away from you. You find yourself compelled to continue following. Eventually, you are lead back to the path, what luck!`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `As you approach the orb disappears. But so does the world. You are plunged into darkness. And so darkness appears before you.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Walk away`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You walk away from the new orb, only to turn around and stumble into another clearing with an orb. As you turn again, you see more orbs. Infinite orbs. They're following you.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Run`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You run away, watching the orbs behind you collect into a horrific monster. Phew, glad you didn't stick around. However, as you run, you do accidentally run off a cliff. Should've watched where you were going.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You run deeper into the forest, and just as the darkness is about to overwhelm you: Light, you have found the path once more!`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Fight`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `The orbs collect and grow together, and their light dims, into a terrible monster of darkness`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ],
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Lick it`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You... lick it. It tastes sweet, like cotton candy. However, as you then pull away, you find your tongue stuck to the orb of light.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Uh oh`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `The orb begins to float into the air, taking you with it. The strain on you is unbearable, your entire weight being held entirely by your tongue. You try to grab the orb, but it has no physical form. You rise into the air, you can see the dark forest below you, you can see the path which you had wandered off from. You feel your tongue surely must snap, but it stays firmly attached. You continue to rise, up, up, and away.\n\nYou are gone.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Pull away`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `The orb begins to float into the air, taking you with it. The strain on you is unbearable, your entire weight being held entirely by your tongue. You try to grab the orb, but it has no physical form. You rise into the air, you can see the dark forest below you, you can see the path which you had wandered off from. You feel your tongue surely must snap, but it stays firmly attached. You continue to rise, up, up, and away.\n\nYou are gone.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        Dialogue: `You lick it, to my disappointment. It tastes like nothing, in fact, your face just passes through the orb of light, as if nothing is there at all. However, it does begin floating away.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Follow it`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You follow it, and eventually are lead back to the path. Wow! Thanks helpful orb.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `You follow it, the light blinding, until you are lead through the forest. Just as you think you might see the path ahead, you fall into a pit. Filled with spikes. I guess the orb doesn't like being licked.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Continue wandering`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You leave the orb alone and return to the forest. Uh okay. One second. *Flips pages* I'm not really sure what to do with you at this point, to be honest?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `What?`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Well you run into a forest, get lost, find an orb, and now you LICK it, and when it floats away you don't even follow? What now? I am currently writing hundreds of these scenarios, by hand, and you aren't even following a story? Who do you think I am? Do I have time for this? I have a job you know.\n\n
                                                                                                                        You know what, whatever, I don't have time for this. You find your way back to the path, magically, wow, congrats!`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `Well you run into a forest, get lost, find an orb, and now you LICK it, and when it floats away you don't even follow? What now? I am currently writing hundreds of these scenarios, by hand, and you aren't even following a story? Who do you think I am? Do I have time for this? I have a job you know.\n\n
                                                                                                                        You know what, here's a monster, that's what you want right?`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Keep going`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `What do you think I am?? Infinite content? I have to manually write every single one of these. This isn't being generated, I am personally writing every word. Does what I do mean nothing to you?`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `Correct`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Well. Wow. I just. I cannot believe this. After all I've done for you. You know, just be killed by this freak of nature`,
                                                                                                                                        Choices: [],
                                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `Well fine. I guess I'll provide no more content. This is the end. No resolution to this story.`,
                                                                                                                                        Choices: [],
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Sorry`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `That's what I thought. Listen, I said some things, you said some things, we can both say sorry and continue. Look, we'll even put you back on track. *AHEM*\n\nYou find your way back to the path.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Run away from it`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You sprint off away from the light. Who knows what that is? Probably a trick or a trap. However, you do unfortunately run right into a horrific monster of unimmaginable proportions. So uh, there's that.`,
                                                                        Choices: [],
                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                    },
                                                                    {
                                                                        Dialogue: `You run into the forest, and suddenly, as if it was never there at all, the dark forest is gone. It's simply, a normal forest. Right?\n\nRight?`,
                                                                        Choices: []
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                            {
                                                ChoiceName: `Stop and wait`,
                                                Result: [
                                                    {
                                                        Dialogue: `You wait and assess. You use that big brain of yours to think. What happened? The normal forest disappeared, and a dark forest appeared. Forests aren't supposed to do that, right?`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `Right!`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `So what could be happening? Maybe a spell was cast on you, and if that's the case, it means SOMETHING cast the spell, and you can kill things that cast spells. But how to find it?`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Yell for monster`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You yell into the forest as your voice echos through the trees. Huh, somehow that didn't seem to work. What now?`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Try again`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You try again, even louder this time, and for even longer. You yell and yell. Yet nothing happens. Your voice eventually gives out. But, at this very moment, an elderly woman approaches you.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Attack her`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You attack her, striking her down and she instantly crumbles. Her bloody, lifeless bodies lays on the forest floor. You monster! How could you kill a defenseless old woman?`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `I didn't mean to`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Well now you did. And you have to deal with this situation. You've just KILLED an old woman!\n\nIn fact, as you stand here, some voices nearby a coming closer. It sounds like a group of travellers will pass by any moment!`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Hide the body`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `Hide the body?? Now you're committing even more crimes! But fine, you hide the body. The group passes by without issue. And hey, apparently you found the path again. So good job. You murderer.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You try hiding the body, but make a lot of noise. You get some stares from the group passing by, until one screams, noticing the blood all over your hands. From the old woman you killed.`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Run away`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You run away from the gruesome sight of your murder... and straight into a horrendous monster, good luck!`,
                                                                                                                                                                        Choices: [],
                                                                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You run away deeper into the forest and become lost once more. So lost in fact, that you're never found. You murderer.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You run away, thankfully to the path, and are able to continue on your way. A murderer who got off scott free.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Murder them`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `What the fuck? Okay man I guess it's your story.\n
                                                                                                                                                                        Ahem. You murder them. All of them. Women, men, more old people, so many old people. They're all dead. But I guess you found the path again. Woohoo. So cool. Congrats/`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You try to murder them, like the murderer you are, but they fight back. Weren't expecting that huh? And they're STRONG. They kick your ass. They stab a sword through your gut. As you lying bleeding to death, they spit on you.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Hide nearby`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You hide behind a nearby tree as they pass. You can overhear them talk about being on their way to see their grandmother. They're hoping she didn't get lost in the forest as she often does.`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Confess`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You leave your hiding spot and confess. They're horrified by what you've done, and slay you where you stand. You know you deserve this.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You confess and they all are horrified. They sob and mourn over their dead grandmother. But hey, at least you found the path again.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Keep hiding`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You hide, full well knowing they'll never meet their grandmother again. Or maybe it happened to be a DIFFERENT old lady you killed. Eventually they leave, and you can continue on your way`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You hide. The voice never stop. They go on and on. Their conversation feels endless. It goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You hide nearby, and they stumble onto the womans corpse. A shrill shriek is let out.l They appear to know the woman. You've caused tremendous heartbreak.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You hide, allowing them to find the old woman. Unexpectedly, you begin to hear the sounds of crunching bones and slerping noises. Turns out they're horrific monsters! Who knew?`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Fight them`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You show yourself, and prepare to fight, like the murderer your are. They bare fangs - vampires, it turns out.`,
                                                                                                                                                                        Choices: [],
                                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Escape`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You escape, running down the path, away from danger`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You run away - or at least, you think you do. But not before they've cornered you. They knew where you were the whole time. Uh oh.`,
                                                                                                                                                                        Choices: [],
                                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Kill them`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `Really?? Wow. Man. Okay then. You kill them. Brutally. You now stand over a pile of bodies of your own making.`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Yikes`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `Yikes? Is that really all you have to say? After murder a group of people? Wow. Okay. Well. Story over. Good job. You win.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `Yikes indeed. I hope you're satisfied.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Find more victims`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `More? How bloodthirsty are you! Well okay. You run down the path, and find another group of travellers. They look at you surprised.`,
                                                                                                                                                                        Choices: [
                                                                                                                                                                            {
                                                                                                                                                                                ChoiceName: `Kill them`,
                                                                                                                                                                                Result: [
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You kill them. Again and again. Then you run down the path and do it again. This is the cycle you've begun. An endless cycle of death, one with no beginning and no end. You began this. Just remember, this path wasn't set from the beginning, you brought us here. Forever.`,
                                                                                                                                                                                        Choices: []
                                                                                                                                                                                    },
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You attempt to slay them until they fight back - oops vampires`,
                                                                                                                                                                                        Choices: [],
                                                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                                                    },
                                                                                                                                                                                ],
                                                                                                                                                                            },
                                                                                                                                                                            {
                                                                                                                                                                                ChoiceName: `Smile`,
                                                                                                                                                                                Result: [
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You smile and kill them. Again and again. Then you run down the path and do it again. This is the cycle you've begun. An endless cycle of death, one with no beginning and no end. You began this. Just remember, this path wasn't set from the beginning, you brought us here. Forever.`,
                                                                                                                                                                                        Choices: []
                                                                                                                                                                                    },
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You think smiling can get you out of this?`,
                                                                                                                                                                                        Choices: [
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `Yes`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `Well it can't. You smile and MURDER them. Again. And again. This is what happens. You can't back out now.`,
                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `No`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `At least you got that right. You continue on for ages. Eventually becoming a world renown serial killer. I hope you're happy.`,
                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                        ]
                                                                                                                                                                                    },
                                                                                                                                                                                ],
                                                                                                                                                                            },
                                                                                                                                                                        ]
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Repent`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `Too late. They see the blood on your hands...\n\nAnd they're hungry.`,
                                                                                                                                                                        Choices: [],
                                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `You drop to your knees, hoping to receive any kind of grace. But it's too late. You know what you've done.`,
                                                                                                                                                                        Choices: [],
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `How did you not MEAN to? You attacked her and she died! That's what happens when you attach people!`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `I thought she'd be fine`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `How is anyone fine after voting to, and I quote 'Attack her'? How did you think that was gonna turn out? Sunshine and rainbows?`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Yeah? Isnt this a game`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `A game? This is a womans life man! A poor little old lady! I can't even look at you. I must go.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `I mean yes but no. Anyway, rocks fall, everyone dies.`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `I thought it'd be fun`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `That's your problem, thinking murder is fun. From now on we're just going to play a peaceful game of tag okay?\n
                                                                                                                                                                        *AHEM*You're in a field with friends, playing tag, you're IT, what do you do?`,
                                                                                                                                                                        Choices: [
                                                                                                                                                                            {
                                                                                                                                                                                ChoiceName: `I tag someone`,
                                                                                                                                                                                Result: [
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You tagged them, and you've WON THE GAME CONGRATS! See, wasn't that way more fun? Tag is a much better game. I'm glad we were able to end this nicely`,
                                                                                                                                                                                        Choices: []
                                                                                                                                                                                    },
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `You tag someone, they run around and tag someone else, they tag you back, what a grand time, isn't that fun?`,
                                                                                                                                                                                        Choices: [
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `Yes`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `Right? Well thanks for playing with me :)`,
                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `No`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `Ugh, you're no fun. Tag is great. Tag is fun. You were having a great time until you had to go and ruin it. I'm sending you back to the dark forest.\n\nThe forest lurches and moans. Death is coming.`,
                                                                                                                                                                                                        Choices: [],
                                                                                                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                        ]
                                                                                                                                                                                    },
                                                                                                                                                                                ],
                                                                                                                                                                            },
                                                                                                                                                                            {
                                                                                                                                                                                ChoiceName: `I kill them`,
                                                                                                                                                                                Result: [
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `Okay, so clearly we're not learning anything. You go around and brutally murder all of your closest friends. At first they thought you were playing tag, but uh oh it turns out YOU'RE A BIG BAD MEANY HEAD WHO JUST WANTS TO MURDER. I truly cannot believe you. You've broken my heart, and with my heart, this adventure. I bid you goodbye.`,
                                                                                                                                                                                        Choices: [
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `Wait`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `No. You've wasted your chance. I'm done with you. All done. Too little too late.`,
                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                            {
                                                                                                                                                                                                ChoiceName: `Goodbye`,
                                                                                                                                                                                                Result: [
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `...`,
                                                                                                                                                                                                        Choices: [
                                                                                                                                                                                                            {
                                                                                                                                                                                                                ChoiceName: `...`,
                                                                                                                                                                                                                Result: [
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                        Dialogue: `Hello? Why are you still here? Game over. I'm tired of writing. It's done. Nothing left. Go home.`,
                                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                            },
                                                                                                                                                                                                            {
                                                                                                                                                                                                                ChoiceName: `Sooo?`,
                                                                                                                                                                                                                Result: [
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                        Dialogue: `So nothing. There's nothing at the end of this rainbow. You've wasted your time going down this branch.`,
                                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                            },
                                                                                                                                                                                                        ]
                                                                                                                                                                                                    },
                                                                                                                                                                                                    {
                                                                                                                                                                                                        Dialogue: `Are you still here? Go do something else. I'm leaving.`,
                                                                                                                                                                                                        Choices: [
                                                                                                                                                                                                            {
                                                                                                                                                                                                                ChoiceName: `I'm waiting`,
                                                                                                                                                                                                                Result: [
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                        Dialogue: `For what? There's nothing else. I'm tired. Goodbye.`,
                                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                            },
                                                                                                                                                                                                            {
                                                                                                                                                                                                                ChoiceName: `No`,
                                                                                                                                                                                                                Result: [
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                        Dialogue: `Well TOO BAD`,
                                                                                                                                                                                                                        Choices: []
                                                                                                                                                                                                                    },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                            },
                                                                                                                                                                                                        ]
                                                                                                                                                                                                    },
                                                                                                                                                                                                ],
                                                                                                                                                                                            },
                                                                                                                                                                                        ]
                                                                                                                                                                                    },
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `*Sigh*. You murder them. Sadly. I'm too tired now. Game over. See ya.`,
                                                                                                                                                                                        Choices: []
                                                                                                                                                                                    },
                                                                                                                                                                                    {
                                                                                                                                                                                        Dialogue: `SURPRISE VAMPIRE TAG`,
                                                                                                                                                                                        Choices: [],
                                                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                                                    },
                                                                                                                                                                                ],
                                                                                                                                                                            },
                                                                                                                                                                        ]
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `It was an accident`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `How do you accidentally select the attack her option? Its very clear. You had to click the button. Sigh. I have more to do. Vampires attack and you (probably) die`,
                                                                                                                                                        Choices: [],
                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Just kidding`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `Well then im just kidding about continuing to provide you content`,
                                                                                                                                                        Choices: [],
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Thought she was a monster`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `A monster? But I SAID she was an old woman.`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `You could lie`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `I've never lied. And I'm insulted that you think that. I give up on you.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `I'm sorry`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `Well sorry won't bring that old woman back, will it? Sigh. I truly am just done with you.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `I love murder`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Of COURSE you do. That's all you do. Murder murder murder. I bet if this text adventure was about murder you'd stick around even longer. I'd have thousands of viewers, all crying out for murder. "Please let us murder more old women, we need it!".\n\nWhat nonsense.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Say hello`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `She says hello, and seems to be lost. She's looking for directions.`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `Guess at directions`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `You guess at giving her directions, even though you're lost yourself. She thanks you and begins heading off in a direction. You hear screams in the distance. You assume all is well.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `She takes your guessed directions and heads off. A beam of light seems to glow above her. Somehow she must have made it out.`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Follow the glow`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You follow the glow, and find she has indeed found the path once more. Maybe you should listen to yourself more often.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You follow the glow, until you find her. But UH OH its a trap, shes a vampire, shit.`,
                                                                                                                                                        Choices: [],
                                                                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Wander`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You wander around, straight into a monster`,
                                                                                                                                                        Choices: [],
                                                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Tell her your lost`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `She looks sad. She explains shes trying to find her way to her grandchildrens home, but got lost in the forest. She doesn't know what she'll do now. You two decide to stick together. You spend ages in that forest. Years go by, yet she never seems to age. It goes on and on. Years. Eventually you ask, who is the old woman. You stare at her, until you realize you're looking at your own face.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                    {
                                                                                                                                        Dialogue: `She thanks you for what help you have given, and heads off. What a nice old woman.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ],
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Complain`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You moan and complain. Woe is me. My life sucks. How could this happen. Nothing happens.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `You complain to a nearby tree, who tells you to stuff it and leave him alone.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Cut down tree`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You cut down the tree as it screams in pain. You use its body to create a really tall ladder, which you use to then navigate your way out of the forest.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You cut down the tree, as its tree brothers watch in horror. You are then jumped by a tree.`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Leave`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Somehow you wander back to the path`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                    {
                                                                                                                        Dialogue: `You wander into the grasp of a terrifying mass of darkness`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Swing sword wildly`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You swing your sword around wildly. Surprisingly, nothing happens`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Try some more`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You keep swinging. Wow this is fun. Swoosh through the air. Nothing happens.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `You swing around, hit some trees, your blade dulls, as does the passage of time. Can we move on?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Yes`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Okay great. I guess. Well. I mean you've kinda soured the mood you know? I don't know man. Listen I'll just tell you, it was a dark force or whatever. Sigh. Here just see for yourself`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `No`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `*Sigh*. Okay. You swing some more. Time continues onward. In fact it continues so long, that you're here in this forest swinging around for ages. Literal ages. You swing and swing and swing. So long that you're now old. Ancient, in fact. Your skin is practically peeling away. You've wasted your life here, swinging a sword, for no reason.`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `Cool!`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Cool? Is it? You're old. You can't even hold your sword anymore. You're too weak now. Just swinging your arms around wildly. You're a useless old person. You can't do anything. Nothing. Nada. It's done. In fact, this story is done. The story is so old that the story crumbles to dust. The end.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Aw, no fun`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `You made this choice. Nobody else. And now the story is over. I hope you're happy.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Give up`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Thank god. You give up. We move on. Who could it be who is doing this magic, what kind of mastermind might it be? I'm so excited to find out`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Play blackjack`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Blackjack?? Now? We have a wizard or some evil force to go find! We can't just sit here and play Blackjack??`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `I said Blackjack`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Well FINE I guess. You play Blackjack. The dealer pulls a ten. You pull an 8. The dealer pulls another ten. You pull a ten. Do you pull?`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Yes`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You pull a 3, you win I guess, congrats.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `You pull a 5. You lose. Boohoo. Story over.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `No`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `Oh. Well. Okay. I was kind of interested if you'd win a guess. So uh. You just lose. The end`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Okay fine, magic time`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `YES. Okay you go into the forest and uh.. wait. What was it again? Hm. You've made me lose my place. Rats. Well. Hm. I guess the story is over now. You've kind of ruined it.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Find mage`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Thats what I'm talking about! You head off to find a mage, but surprise, it's actually an evil force of darkness!`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Why not?`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `Well, because they're forests. Normally they stay in one place you know? They really aren't known for disappearing, or changing that much. I guess unless it's like, the seasons, but that doesn't count.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `So?`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `SO? What does that mean? What kind of response is that? Do you even want to be here?`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Yes`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Well then put in a little work okay.\n\n
                                                                                                        *AHEM*FOREST IS SPOOKY. WHAT DO?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `I just hang out`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Well then fine. I guess don't be here. Don't participate. See if I care.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `I leave the forest`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `FINALLY. I mean. You leave the forest, somehow you find your way out. That's pretty wild huh? That's the reward you get for being reasonable.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `No`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Well then fine. I guess don't be here. Don't participate. See if I care.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Well fine. I fix it`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `What do you mean you fix it? What? What do you fix?`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `It`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `WHAT DOES THAT MEAN?\n\n*AHEM*Sorry. I needed a moment to compose myself. Okay. You set out into the forest to fix... it. You travel along, big scary forest. What do you do?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `It`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `I OKAY.\n\nI just can't with you right now. The forest eats you. The end.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Try to leave forest`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You try to leave the forest, but you get all turned around, oh no!`,
                                                                                                                        Choices: [
                                                                                                                            {
                                                                                                                                ChoiceName: `Give Up`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `Really? Give up? That's all you got. Man, you really are not worth the time huh? I guess the story ends and you die. Woohoo.`,
                                                                                                                                        Choices: []
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                            {
                                                                                                                                ChoiceName: `Try Again`,
                                                                                                                                Result: [
                                                                                                                                    {
                                                                                                                                        Dialogue: `That's it? Wow, really putting your best foot forward huh? Fine, I guess you try again, and guess what? Still nothing.`,
                                                                                                                                        Choices: [
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Try Again`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `IS THAT IT? IS THAT ALL YOU CAN DO? PRESS A DIFFERENT BUTTON`,
                                                                                                                                                        Choices: [
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `Try Again`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `[We're sorry to inform you, you narrator has left the job due to an unexpected circumstance. We apologize at this time and hope to see you again soon]`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                            {
                                                                                                                                                                ChoiceName: `No`,
                                                                                                                                                                Result: [
                                                                                                                                                                    {
                                                                                                                                                                        Dialogue: `[We're sorry to inform you, you narrator has left the job due to an unexpected circumstance. We apologize at this time and hope to see you again soon]`,
                                                                                                                                                                        Choices: []
                                                                                                                                                                    },
                                                                                                                                                                ],
                                                                                                                                                            },
                                                                                                                                                        ]
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                            {
                                                                                                                                                ChoiceName: `Oh well, give up`,
                                                                                                                                                Result: [
                                                                                                                                                    {
                                                                                                                                                        Dialogue: `FINE I GUESS YOU GIVE UP.`,
                                                                                                                                                        Choices: []
                                                                                                                                                    },
                                                                                                                                                ],
                                                                                                                                            },
                                                                                                                                        ]
                                                                                                                                    },
                                                                                                                                ],
                                                                                                                            },
                                                                                                                        ]
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Find monster`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Okay fine here's a monster`,
                                                                                                                        Choices: [],
                                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `The forest`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Okay. I guess. Well. Get out there. What do you do?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Leave the forest`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `Okay fine you leave the forest the end goodnight happily ever after`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Find path`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `You try to find the path, guess you did, cause the path has been found. The world is all good again`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `All of magic`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Well. You might just be... delusional. All of magic? You think YOU can do that?`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Yep`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `WELL. You. Can't. I say so. The end, goodbye, you lost. I hope that weighs on you.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `I guess not`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: `That's right. So I guess the story ends here, with you learning your limitations.`,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                        ]
                                    },
                                ]
                            },
                            {
                                ChoiceName: 'Stop and look around',
                                Result: [
                                    {
                                        Dialogue: `You stop and look around, searching for where the path might have gone. Surely you didn't move, so where could it be? But as you gaze into the unending wood, all you can see is forest that goes on for miles, an endless sea of wood and brush. However, something strange is bothering you, but you can't quite figure out what it is`,
                                        Choices: [
                                            {
                                                ChoiceName: `Think really hard`,
                                                Result: [
                                                    {
                                                        Dialogue: `You start thinking really hard, straining your brain for what possibly could be bothering you. Then you realize. There's a blank spot in your memory. In between the time of being on the path, and now, theres a section thats simply missing in your memory`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `Retrace your steps`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You look to the forest floor, squinting in the darkness, and find your messy trail through the underbrush. You begin following it back. Eventually it leads you to a sizable pool of blood, with no sign of a victim.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Investigate the blood`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You investigate the blood, and are able to determine that this is in fact YOUR blood. What could have injured you? You don't see any wounds on yourself, but yet theres a small pool of your blood here. What could be happening?`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Leave the area`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You begin walking away, but suddenly feel faint. You see the pool growing larger, your skin is growing pale and clammy. You stumble around hopelessly trying to keep your balance but it feels impossible. The pool of blood grows and grows. You fall to the ground, losing the ability to walk. You start attempting to crawl your way forward as you can see the pool growing to meet your feet. Your fingernails scrap through the dirt until you can't feel your fingers. The last of your energy gives out, as you feel on the brink of passing out. The last thing you see before the darkness takes you is your own blood filling your vision.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Search for clues`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You begin looking around, looking for whatever could be causing this. Then you see him. Standing not far away is a man clad all in black, staring at you with a deep hunger. You instinctively begin to back away, his gaze otherworldly. As your foot snaps a twig, the man leaps forward with amazing speed.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Check self for wounds`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You look yourself over for any injuries but find none, thankfully.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Leave the area`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You begin to leave, still seeking a way out of the forest, as an uneasy feeling begins to rise within you. A slight panic starting to overwhelm you at the sight of this blood. You're working yourself up into a frenzy, perhaps more so than is normal. As you turn, beginning to run you stumble into a black mass of death. A pure force of energy that is incomprehensible.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Look for clues`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You start looking for clues, examining the pool and surrounding areas. The trees have no marks, the ground is normal otherwise. As you tap the pool with a stick, you notice the stick isn't coated in blood. You experiment more and realize you have no interaction with the blood at all, except for one thing. A small red string, lifted out as you twirl a stick around it. You follow the string, as you find it inexplicably leads to you. The trail goes to your pant leg, and then up and inside. You try to feel around, and find the string on yourself, travelling up to your body. You feel it under your chest, and as you lift your shirt you can see your exposed heart, beating in rhythm, its pace quickening. The red string links directly to your heart. It begins tugging, and pulling at you. You feel your heart leap, and strain. You fall to your knees. It feels as if your heart is being undone, until the string flies out of the body, and you fall to the ground, dead.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Look around for suspect`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You quickly look around, seeking whatever suspects could be nearby. In the distance, you think you see a shadow dashing away from you`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Chase the shadow`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You take off after shadow, trying to keep its form in sight. It flickers, dodges and weaves through the forest, clearly trying to avoid you. You sprint with all your energy, dashing past trees and rocks. As the shadow moves, it seems to flicker and disappear. You run up to where you last saw it, and you've come to a crevice. A dark hole where you cannot see through.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Enter the hole`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Give up and leave`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Try to leave`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You try and leave, but as you take the first step you feel unsteady. You instinctively clutch your stomach and fall over. A terrible pain has entered your body. Then. A voice.\n\n"Giving up so easily, are you? Pathetic."`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `"F you"`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `"Help me"`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Try to run`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Check your stuff`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You look through the items in your bag, and notice several key items missing. Notably a knife, your journal, and your tinderbox.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Look for knife`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You look around for your knife, passing your boots through the underbrush to catch a glint of the blade. Seeing nothing you feel confused, until you see it as you look up: The knife is stuck into a tree, holding a note in place.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Read the note`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You walk up to the note, with shaking hands. It says\n\nThis is The Other One. You cannot stop me. Stop trying"`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Keep trying`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Give in`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Try to leave`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You try to leave, feeling yourself trembling. You look out into the forest and only see darkness. You begin moving, stumbling through the inky blackness. As you step forward, you suddenly feel nothing beneath your feet, and you tumble forward and begin falling. You see nothing but darkness around you, and the feeling of air passing by your face as you fall. You continue falling like this. You may attempt to scream, or flail. Nothing stops it. You are in the darkness for what feels like an eternity. Then eventually, a light below you, finally a beacon of safety. That is, until you hit the ground. A deep splattering that tears you apart.\n\nYou have died.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Look for journal`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You search around for your journal, wondering where it could've gone. After going through the surrounding area, you find a trail of blood that leads to a tree. Inspecting it reveals a nook within the tree, inside is your journal, it's cover coated in blood.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Look inside`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `Inside, it is covered in blood. Blooding scrawlings, text, sketches, all written in blood cover your original well taken notes. They all make reference to some horrible creature it just refers to as "it", and speaks of an unimaginable mass of evil and darkness.`,
                                                                                                        Choices: [
                                                                                                            {
                                                                                                                ChoiceName: `Run into forest`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                            {
                                                                                                                ChoiceName: `Burn the journal`,
                                                                                                                Result: [
                                                                                                                    {
                                                                                                                        Dialogue: ``,
                                                                                                                        Choices: []
                                                                                                                    },
                                                                                                                ],
                                                                                                            },
                                                                                                        ]
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Drop it and run`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You sprint off, a journal covered in blood isn't a good sign, and you don't need to be anywhere near it. Unfortunately, in your panic you're tripped by a branch. You fly through the air, caught unaware, and land on the ground with a crunch, your vision fading to unconciousness. Just before you black out, you swear you see something looming over you.\n\nAs you awaken, you find yourself back on the bright forest path. You feel content. Though, something feels wrong, as if something is different about you.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Look for tinderbox`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You search for your tinderbox, wondering what could have happened to it. Then in the distance you see a faint light. Heading towards it, you can see a large forest fire has started. You can only imagine the worst, and that it was your tinderbox that caused this.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Head towards the fire`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You head towards the massive fire, shadows becoming elongated and frightening. You feel the wall of heat before you reach it, almost pushing you backwards. As you push forward, it's a massive wall of fire, larger than any you've ever seen. Squinting through, in the back, you can see your tinderbox, floating at the core of the fire. It's somehow... angry.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`tinderbox`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Run away`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You run away, knowing the fire will only bring more danger. It very well could be related to your tinderbox, but you'll never know how. The fire grows in the background, you can hear the massive roar of the forest burning. However, the light is so intense that it does provide you enough illumination to find the path once again, and escape the forest.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                            {
                                                ChoiceName: `Give up and walk away`,
                                                Result: [
                                                    {
                                                        Dialogue: `You give up on thinking about this more, all that matters now is trying to find your way out of the forest. You look to the sun above, and start trying to figure your way back to where you came from. The darkness around is overwhelming, strange sounds at every angle. As you walk, you eventually hear a scream somewhere nearby.`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `Run towards the scream`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You take off in a sprint, running towards the scream. It continues on, a bloodcurdling scream of desperation and terror, the sound growing louder as you approach. Suddenly, as you're nearly upon it, the scream stops, leaving the forest silent aside from your footsteps. As you reach the clearing where you could only assume the scream was at, you find nothing.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Try to leave`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You try to leave, but you feel resistance. You look down, and see a hand gripping your foot, stuck out from the underbrush. In terror you try to rip away. You move your other foot, and it too is caught in the grasp of another hand.\n\n"You're ours" the voices say. Several hands begin to emerge from the underbrush, pulling you under, "Join us"\nJust as your vision is obscured by leaves and brush, as you're pulled down under, to who knows where, you simply hear a "Is anyone here?" as you join the collective. You all scream, to attract your new prey.`,
                                                                                        Choices: []
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Look around`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You look around, and see a pair of eyes in the darkness, staring at you, bloodshot. Looking around more, you see more pairs blinking through the darkness. This continues until you're surrounded by unblinking eyes.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Try to leave`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: ``,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `"Who's there?"`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: ``,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Stay still`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: ``,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Run away from scream`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You run, trying to avoid who, or what, the scream could be. But impossibly, even as you sprint away from the sound, the scream seems to only get louder and louder. You change directions but the sound only grows.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Keep running`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `The scream grows and grows until it's all you can hear. You begin to question if you've ever heard anything but the scream. You wonder if you've ever done anything else but run. An endless loop, a cycle, a torturous infinity brought upon by some cruel gods. The screaming is everything. It is all. You begin to feel a kinship with it. Perhaps it is god. It is all. You must embrace it. You are the scream, and it is you.\n\nYou have died.`,
                                                                                        Choices: []
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Stop moving`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You stop moving, and a moment later the screaming begins again. You start moving and it stops. You continue this, and find this pattern consistent.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Leave and find path`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: ``,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `"Who's there?"`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: ``,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Shout "You good?"`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `The screaming stops. Abruptly. Even the sounds of animals, bugs, or the wind have ceased. Your vision begins to rapidly blur and shift. Then, it's upon you.`,
                                                                        Choices: [],
                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                            {
                                                ChoiceName: `Make camp`,
                                                Result: [
                                                    {
                                                        Dialogue: `You decide that making camp, having a nice meal, and getting some rest would help you more in the long run than anything else. You bring out your standard supplies and make camp. What would you like to focus on first?`,
                                                        Choices: [
                                                            {
                                                                ChoiceName: `Pitch tent`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You setup your tent, a bit slowed stumbling around in the dark and cold. After a bit of time, and after you're nearly shivering, it is up. You can't help but feel a bit unsettled from the surrounding forest.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Sleep`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You lay down to sleep in the darkness, and surprisingly quickly find yourself in the world of dreams. Except where you normally have dreams, its just replaced with darkness. Infinite darkness. Your sleep seems to go on forever, and you feel as if you're still conscious. Time passes on, in your sleep, and it feels like eternity. You feel yourself growing old in this sleep. This infinite infinite sleep.\n\nAfter what feelings like decades, you awake. Your body is stiff, and as you rise you feel hair, and find you have a beard. You touch your face and find it wrinkled and old. The forest around you feels more ancient. You cough, and spit up blood. You return to sleep. You have died.`,
                                                                                        Choices: []
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Make fire`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You setup a fire, trying to create a refuge of light from the darkness beyond. Soon a fire sparks to life, creating a beacon in the darkness, a safe barricade from the shadows beyond. The flames flicker light upon your tent, highlighting it, and providing a sense of safety. You now determine you're safe enough to find rest, and as you lay down to sleep, the warmth from the fire makes you feel safe. You dream delightfully, and when you awaken, you find your tent is pitched near feet away from the path. You're able to pack and continue on your way.`,
                                                                                        Choices: []
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                            {
                                                                ChoiceName: `Make fire`,
                                                                Result: [
                                                                    {
                                                                        Dialogue: `You setup a fire, trying to create a refuge of light from the darkness beyond. Soon a fire sparks to life, creating a beacon in the darkness, a safe barricade from the shadows beyond.`,
                                                                        Choices: [
                                                                            {
                                                                                ChoiceName: `Pitch tent`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You quickly setup your tent, seeking refuge from the darkness of the forest. It goes up in no time at all thanks to the light and warmth provided by the fire. You still can't help but feel a bit unsettled from the surrounding forest.`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Go to bed`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You head to bed, though have trouble falling asleep. After a while of tossing and turning, you eventually fade. In the morning, all remnant of the dark forest are gone. It's a bright and lovely forest, the path you were on is only a few paces away. You're able to continue on your way.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `You fall asleep to frightful nightmares, a horrific creature is stalking you, chasing you down. You wake in a cold sweat, just to see the creature of your nightmares standing before you.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`blackmass`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Cook food`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You cook some food, your stomach growling at the smell. A wonderful, delicious smell. You bite into the cooked meat even as its too hot, and burn your tongue, but the taste is so good. It's one of the best meals you've ever had. When you open your eyes, a man is standing before you, licking his lips. You see fangs shine in the fire light. You're his next meal.`,
                                                                                                        Choices: [],
                                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Cook food`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You take some rations from your pack and begin roasting some food over the fire. As the smell of cooked meat reaches you, your stomach growls. Eventually you're able to dig in. Perhaps this isn't so bad, you have fire, food, what more could you need?`,
                                                                                        Choices: [
                                                                                            {
                                                                                                ChoiceName: `Sleep on ground`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You sleep on the rough and dirty ground, finding it difficult to get comfortable. Your eyes grow heavy despite that and you fall into a deep sleep. Perhaps too deep. You lose yourself in the sleep, you feel it's been eons since you've awakened. You continue to sleep. You never wake.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                    {
                                                                                                        Dialogue: `You sleep quickly, despite the unpleasant circumstances, but find yourself soon waking the next morning. Everything is normal and fine. You find you're able to continue on without issue.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                            {
                                                                                                ChoiceName: `Pitch tent`,
                                                                                                Result: [
                                                                                                    {
                                                                                                        Dialogue: `You start pitching your tent, every sound you make echoing in the darkness. At first you just think you're being loud, but as you pause you find it literally is echoing in the darkness. The echos cause more echos, you step back, a snapping branch echoing infinitely. Your ears fill with noise that can't be drowned out. You fall to the floor, the sound of which rattles your skull. It reverberates infinitely, your ears bleeding, as you lose consciousness. The next morning, you can't tell if it was a dream or not, but you find yourself hard of hearing, but are able to continue on your way.`,
                                                                                                        Choices: []
                                                                                                    },
                                                                                                ],
                                                                                            },
                                                                                        ]
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Sleep on ground`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You settle down, trying to find a patch of dirt thats comfortable enough. You settle in for restless sleep. You have dreams of fire and darkness, battling against one another. The fire pushes against you, warming you, until it feels burning. Hot, so hot. Too hot. You awaken, you've rolled into your fire, you're burning. You scream and yell, trying to put it out, but it's too late. Your vision is fading as you burn. You see a shadow looming over you. You can't see it's face, but you know it's smiling.`,
                                                                                        Choices: [],
                                                                                        EndingCallback: () => startFight(`vampire`)
                                                                                    },
                                                                                ],
                                                                            },
                                                                            {
                                                                                ChoiceName: `Stare into fire`,
                                                                                Result: [
                                                                                    {
                                                                                        Dialogue: `You stare into the fire, watching the flames burn through the wood. The shadows created are elongated and twisted in this forest. The flames provide you warmth and safety. You stare into them, you watch the flame. The flame. The flame. It is everything. The flame provides. You must only use the flame. The flame beckons. You feel yourself moving towards the flame. You must be closer. You step into the flame, the warmth flows through your body. It is endless, it is freedom, it is perfect. The flame withers you away, your new god offering you safety.\n\nYou stay there until the early morn. Your burnt body shivering in the morning air. As life leaves your body, you are at least glad to have been warm.`,
                                                                                        Choices: []
                                                                                    },
                                                                                ],
                                                                            },
                                                                        ]
                                                                    },
                                                                ],
                                                            },
                                                        ]
                                                    },
                                                ],
                                            },
                                        ]
                                    },
                                    // {
                                    //     Dialogue: ``,
                                    //     Choices: []
                                    // },
                                    // {
                                    //     Dialogue: ``,
                                    //     Choices: [
                                    //         {
                                    //             ChoiceName: ``,
                                    //             Result: [],
                                    //         },
                                    //     ]
                                    // },
                                ]
                            },
                            // {
                            //     ChoiceName: 'Yell for help',
                            //     Result: [
                            //         {
                            //             Dialogue: `You yell for help`,
                            //             Choices: []
                            //         },
                            //         {
                            //             Dialogue: `You yell for help`,
                            //             Choices: []
                            //         },
                            //     ]
                            // },
                        ]
                    },
        //             {
        //                 Dialogue: `Uh oh, apparently there WAS something in that bush nearby. Plus, it sounds kinda hungry. Bursting out from the bush is a huge Minotaur, with big fat muscles. And a bit axe. Oooo, he's so scary.\n\nWhat now?`,
        //                 Choices: [
        //                     {
        //                         ChoiceName: 'Face the Minotaur',
        //                         Result: [
        //                             {
        //                                 Dialogue: `Fight start`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `Fight start`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: 'Scream and shout',
        //                         Result: [
        //                             {
        //                                 Dialogue: `You scream and shout`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You scream and shout`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: 'Run away',
        //                         Result: [
        //                             {
        //                                 Dialogue: `You run away`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You run away`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                 ]
        //             },
        //         ]
        //     },
        //     {
        //         ChoiceName: `Investigate sound`,
        //         Result: [
        //             {
        //                 Dialogue: `Turns out it was just a bird. Who knew right? Though, as you look, this is a very rare species of bird, perhaps it has something to offer?`,
        //                 Choices: [
        //                     {
        //                         ChoiceName: `Try to pluck a feather`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You pluck a feather`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You pluck a feather`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `Let the bird go`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You let the bird go`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You let the bird go`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `See if its worth money`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You check, and it is worth money`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You check, and it is worth money`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                 ]
        //             },
        //             {
        //                 Dialogue: `Someone left a strange magical object here, making strange sounds. You're not quite sure what it does, but it seems like it's been here for a long time`,
        //                 Choices: [
        //                     {
        //                         ChoiceName: `See if its worth money`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `Its not`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `Its not`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `Throw it into the forest`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You toss it`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You toss it`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `Pocket it`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You pocket it`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You pocket it`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                 ]
        //             },
        //         ]
        //     },
        //     {
        //         ChoiceName: `Make scary noises`,
        //         Result: [
        //             {
        //                 Dialogue: `You make some strange sounds. I'm really not sure how, they're REALLY weird. Please see a doctor. Anyway, you make them and somehow you hear them
        //                 echoed back at you, almost like a recording. It sounds EXACTLY the same. Just as horrific as you did`,
        //                 Choices: [
        //                     {
        //                         ChoiceName: `Make more sounds`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `Your noises had the opposite effect. A horrific looking creature lurches out of the wood. Apparently whatever sounds you made were it's mating calls. It now appears to be seeking you as it's mate.\n\nWhat do you do?`,
        //                                 Choices: [
        //                                     {
        //                                         ChoiceName: `Pretend to be its mate`,
        //                                         Result: [
        //                                             {
        //                                                 Dialogue: `You pretend`,
        //                                                 Choices: []
        //                                             },
        //                                             {
        //                                                 Dialogue: `You pretend`,
        //                                                 Choices: []
        //                                             },
        //                                         ]
        //                                     },
        //                                     {
        //                                         ChoiceName: `Run away`,
        //                                         Result: [
        //                                             {
        //                                                 Dialogue: `You run`,
        //                                                 Choices: []
        //                                             },
        //                                             {
        //                                                 Dialogue: `You run`,
        //                                                 Choices: []
        //                                             },
        //                                         ]
        //                                     },
        //                                     {
        //                                         ChoiceName: `Try to act scary`,
        //                                         Result: [
        //                                             {
        //                                                 Dialogue: `You act scary`,
        //                                                 Choices: []
        //                                             },
        //                                             {
        //                                                 Dialogue: `You act scary`,
        //                                                 Choices: []
        //                                             },
        //                                         ]
        //                                     },
        //                                 ]
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `Follow the noise`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You follow`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You follow`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                     {
        //                         ChoiceName: `Keep walking`,
        //                         Result: [
        //                             {
        //                                 Dialogue: `You keep walking`,
        //                                 Choices: []
        //                             },
        //                             {
        //                                 Dialogue: `You keep walking`,
        //                                 Choices: []
        //                             },
        //                         ]
        //                     },
        //                 ]
        //             },
        //         ]
        //     }
        // ]
    // }
];

function startFight(enemy: string) {
    displayText(`Here is where a fight with a [${enemy}] would start... IF I HAD ANY`, () => {});

    setTimeout(playAdventureModule, 10000);
}

let playAdventure = true;

function playAdventureModule() {
    if(playAdventure) {
        //todo - either do another adventure, or go to dragon based on modules played
        let randomModule: AdventureModule = getRandomItem(modules)!;
        // handleAdventureModule(randomModule);

        // displayText(randomModule.Dialogue, () => {
        //     setTimeout(() => {
        //         handleAdventureModule(randomModule.Choices[0].Result[0])// getRandomItem(randomModule.Choices[0].Result[0].Choices[0].Result)!)
        //         // displayText(randomModule.Choices[0].Result[0].Dialogue, () => {
        //         //     setTimeout(() => {
        //         //         handleAdventureModule(randomModule.Choices[0].Result[0])// getRandomItem(randomModule.Choices[0].Result[0].Choices[0].Result)!)
        //         //     }, 3000);
        //         // })
        //     }, 3000);
        // });

        handleAdventureModule(randomModule)//getRandomItem(randomModule.Choices[0].Result)!);
    }
    else {
        taWS.send(JSON.stringify({ type: 'restartMonster' }));
    }

    playAdventure = !playAdventure;
}

function handleAdventureModule(module: AdventureModule) {
    displayText(module.Dialogue, () => {
        if(module.Choices.length === 0) {

            if(module.EndingCallback !== undefined) {
                setTimeout(module.EndingCallback, 7000);
                return;
            }
            //Play next adventure module
            setTimeout(playAdventureModule, 10000);

            return;
        }


        let choiceToModule: Map<string, Array<AdventureModule>> = new Map<string, Array<AdventureModule>>();
        let choices: Array<{title: string}> = [];
        for (let i = 0; i < module.Choices.length; i++) {
            choices.push({title: module.Choices[i].ChoiceName});

            choiceToModule.set(module.Choices[i].ChoiceName, module.Choices[i].Result);
        }

        let pollLength = 30;

        setTimeout(() => {
            createPoll({
                title: `What do you do?`,
                choices: choices
            }, pollLength);
        }, 1000);

        checkForEndOfPoll();

        function checkForEndOfPoll() {
            if(pollWinner !== '') {
                startNextAdventureSection();
            }
            else {
                setTimeout(checkForEndOfPoll, 1000);
            }
        }

        // let waitForPoll = setInterval(() => {
        //     console.log("Waiting for poll results")
        //     if(pollWinner !== '') {
        //         clearInterval(waitForPoll);
        //         console.log("Clearing interval")
        //
        //         setTimeout(startNextAdventureSection, 1000);
        //     }
        // }, 1000);

        function startNextAdventureSection() {
            let moduleOptions = choiceToModule.get(pollWinner);

            pollWinner = '';
            if(moduleOptions === undefined || moduleOptions.length === 0) {
                //End module

                console.error("Reached end of an adventure, with no last dialogue");

                setTimeout(playAdventureModule, 5000);
            }
            else {
                let chosenModule = getRandomItem(moduleOptions);

                handleAdventureModule(chosenModule!);
            }
        }
    });
}

// function waitForCondition(interval: number, conditionFn: () => boolean): Promise<void> {
//     return new Promise((resolve) => {
//         const intervalId = setInterval(() => {
//             if (conditionFn()) {
//                 clearInterval(intervalId);
//                 resolve();
//             }
//         }, interval);
//     });
// }

function createPoll(poll: { title: string, choices: Array<{title: string}>}, duration: number = 60) {
    isPollRunning = true;
    pollWinner = '';
    taWS.send(JSON.stringify({ type: 'poll', poll: poll, pollDuration: duration}));
}

function displayText(text: string, onComplete: () => void) {
    const textElement = document.getElementById('text')!;

    textElement.style.color = '#57a64a';
    textElement.innerHTML = '';
    textElement.style.whiteSpace = 'pre-line';
    textElement.style.fontSize = "100";
    textElement.style.fontFamily = "JetBrains Mono";

    // let utterance = new SpeechSynthesisUtterance(text);
    // utterance.onend = (event) => onComplete();
    // utterance.pitch = 0.7;
    // utterance.rate = 2;
    // utterance.volume = 1;
    // window.speechSynthesis.speak(utterance);
    taWS.send(JSON.stringify({ type: 'tts', text: text }));

    let additionalTime = 0;
    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        if(isPunctuationBig(char)){
            additionalTime += 1000;
        }
        else if(isPunctuationSmall(char)) {
            additionalTime += 500;
        }
    }

    setTimeout(() => {
        setTimeout(() => {
            onComplete();
        }, text.length * TEXT_SPEED + additionalTime + 1000);

        let index: number = 0;
        function typeLetter(): void {
            if (index < text.length) {
                let char = text.charAt(index);
                textElement.innerHTML += char;
                index++;
                setTimeout(typeLetter, isPunctuationBig(char) ? 1000 : isPunctuationSmall(char) ? 500 : TEXT_SPEED);
            }
        }

        typeLetter();
    }, 500)

}

function isPunctuationBig(char: string): boolean {
    // Regular expression that matches common punctuation characters
    // This includes . , ? ! ; : - _ ( ) [ ] { } " ' ` and others
    const punctuationRegex = /[.!:]/;

    return punctuationRegex.test(char);
}

function isPunctuationSmall(char: string): boolean {
    // Regular expression that matches common punctuation characters
    // This includes . , ? ! ; : - _ ( ) [ ] { } " ' ` and others
    const punctuationRegex = /[,;]/;

    return punctuationRegex.test(char);
}

function getRandomItem<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    // console.log(array.length);
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

