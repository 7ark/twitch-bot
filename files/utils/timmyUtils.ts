import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs-node';
import { ChatUserstate, client, Client } from "tmi.js";
import { GetRandomInt, GetRandomIntI } from "./utils";
import { LoadPlayer } from "./playerGameUtils";
import fs from "fs";
import {HandleMinigames} from "./minigameUtils";

interface NPCResponse {
    intents: string[];  // Different ways to ask/trigger this response
    response: string[]; // Array of possible NPC responses
}

export class NPCMatcher {
    private model: use.UniversalSentenceEncoder | null = null;
    private responseEmbeddings: tf.Tensor2D | null = null;
    private responses: NPCResponse[] = [];

    constructor(responses: NPCResponse[]) {
        this.responses = responses;
    }

    async initialize(): Promise<void> {
        // Load the model
        console.log('Loading Universal Sentence Encoder...');
        this.model = await use.load();
        console.log('Model loaded!');

        // Generate embeddings for all intent phrases
        const allIntents = this.responses.flatMap(r => r.intents);
        this.responseEmbeddings = (await this.model.embed(allIntents) as unknown) as tf.Tensor2D;
        console.log('Response embeddings generated!');
    }


    async findBestResponse(input: string): Promise<string> {
        if (!this.model || !this.responseEmbeddings) {
            throw new Error('Model not initialized! Call initialize() first.');
        }

        console.log('Processing input:', input);

        // Get embedding for input text
        const inputEmbedding = await this.model.embed([input]);

        // Calculate similarity scores with all intents
        const scores = tf.matMul((inputEmbedding as unknown) as tf.Tensor2D, this.responseEmbeddings.transpose());

        // Get the best score and index
        const bestScore = (await scores.max().data())[0];
        const bestMatchIndex = (await scores.argMax(1).data())[0];

        console.log('Best match score:', bestScore);

        // Only respond if we're confident enough (threshold can be adjusted)
        const CONFIDENCE_THRESHOLD = 0.6; // Lowered threshold for testing
        if (bestScore < CONFIDENCE_THRESHOLD) {
            console.log('Score below threshold, returning empty string');
            SaveNPCLog(input);
            return '';
        }

        // Map back to the corresponding response
        let currentIndex = 0;
        for (const response of this.responses) {
            if (bestMatchIndex < currentIndex + response.intents.length) {
                console.log('Found matching responses:', response.response);
                // Randomly select one response from the array
                return response.response[GetRandomInt(0, response.response.length)];
            }
            currentIndex += response.intents.length;
        }

        return '';
    }

    // Clean up tensors to prevent memory leaks
    dispose(): void {
        if (this.responseEmbeddings) {
            this.responseEmbeddings.dispose();
        }
    }
}

interface NPC {
    Name: string,
    Responses: NPCResponse[]
}

const npcs: Array<NPC> = [
    {
        Name: "Timmy",
        Responses: [
            {
                intents: [
                    "Hello",
                    "Hey there",
                    "Nice to meet you",
                    "Introduce yourself"
                ],
                response: [
                    "Hey there, I'm Timmy!",
                    "Well howdy!",
                    "Oh gosh, hi! I'm Timmy!"
                ]
            },
            {
                intents: [
                    "Who are you?",
                    "What's your name?",
                    "Who is this?",
                    "Who am I talking to?",
                    "Who's Timmy?",
                    "Tell me about yourself",
                ],
                response: [
                    "Well, I'm Timmy! How are you?", 
                    "Well, I'm Timmy! How about you?",
                    "I'm Timmy!",
                ]
            },
            {
                intents: [
                    "I'm good",
                    "I'm well",
                    "I'm doing great",
                    "I'm having a great time",
                ],
                response: [
                    "Well wowie! How about that! That's so great.",
                    "That's great to hear!",
                    "Hooray!"
                ]
            },
            {
                intents: [
                    "I'm bad",
                    "I'm terrible",
                    "I'm doing awful",
                    "I'm having a bad time",
                ],
                response: [
                    "Aww man, I'm so sorry to hear that, I sure do hope your day gets better.",
                    "Aw rats, I'll find you a nice flower so you feel better!"
                ]
            },
            {
                intents: [
                    "What do you do?",
                    "What's your purpose?",
                    "What's your job?",
                    "How do you spend your time?",
                    "What do you work on?",
                    "What keeps you busy?"
                ],
                response: [
                    "Well mostly I farm, though papa says I outta stop.",
                    "I like to run around a lot!",
                    "Sometimes I draw, but papa yelled at me last time I did it... cause I did it on the walls. Oops",
                    "I do whatever papa asks me to do!"
                ]
            },
            {
                intents: [
                    "Why are you here?",
                    "What are you for?",
                    "What do you do here?",
                    "What are you doing here?",
                ],
                response: [
                    "Well I was just heading out to the shops and found all you people, and shucks it sure is an honor.",
                    "Well I just like to say hello sometimes!",
                    "I'm just chatting while my papa works!"
                ]
            },
            {
                intents: [
                    "Why are you going to the shops?",
                    "What are you buying from the shop?",
                ],
                response: [
                    "Well papa had me run into town to pick him up some new tools!",
                    "I was hoping to find an ice cream!",
                    "Papa needed some help!"
                ]
            },
            {
                intents: [
                    "What tools are you getting?",
                    "What kind of tools?",
                    "What tools does papa need?"
                ],
                response: [
                    "Oh I have a whole list of tools for papa! But it's super secret! :)"
                ]
            },
            {
                intents: [
                    "How are you?",
                    "How are you doing?",
                    "How's it going?",
                    "What's up?",
                    "How ya doing?",
                    "How are things?",
                    "How's your day?",
                    "How's life?"
                ],
                response: [
                    "I'm great! A little sleepy... but great!",
                    "I'm having a good time meeting all of you!",
                    "I'm doing pretty okay!",
                    "I can't stop yawning.",
                    "It's good! How's yours?"
                ]
            },
            {
                intents: [
                    "Why are you sleepy?",
                    "Why so sleepy?",
                    "Did you not get enough rest?",
                ],
                response: [
                    "Well I was just tossing and turning all night last night, couldn't get a wink of sleep!",
                    "No reason!",
                    "I'm not supposed to say! Shhh",
                    "Just all the noise from papa's workshop!"
                ]
            },
            {
                intents: [
                    "Why couldn't you sleep?",
                    "Why were you tossing and turning?",
                    "What kept you up?",
                ],
                response: [
                    "Well there was a mighty loud banging from papas workshop, he likes to work late into the nights."
                ]
            },
            {
                intents: [
                    "Who is your father?",
                    "Who's your dad?",
                    "Who's papa?",
                    "Who raised you?"
                ],
                response: [
                    "Well he's papa, duh!",
                    "My papa is the best! He does a bunch of farming"
                ]
            },
            {
                intents: [
                    "Who is your mother?",
                    "Who's your mom?",
                    "Who's mama?",
                ],
                response: [
                    "What's that?",
                    "I don't know who that is!"
                ]
            },
            {
                intents: [
                    "Tell me about your father",
                    "Tell me about your dad",
                    "What's your father like?",
                    "Tell me about papa",
                ],
                response: [
                    "Papa is the best in the whole world! He gives me delicious food, a warm place to sleep, and all the happiness I could ask for!"
                ]
            },
            {
                intents: [
                    "How old are you?",
                    "What is your age?",
                    "How long have you been alive?",
                ],
                response: [
                    "Well shucks, I just turned 11 this past summer!"
                ]
            },
            {
                intents: [
                    "Where do you live?",
                    "Where are you from?",
                    "Where did you grow up?",
                ],
                response: [
                    "Why I live just up the road, on my papas farm! We make all sorts of delicious fruits and veggies!"
                ]
            },
            {
                intents: [
                    "What do you grow?",
                    "What do you make on your farm?",
                    "What sorts of fruits do you grow?",
                    "What sorts of veggies do you grow?"
                ],
                response: [
                    "Well we make plums... and apples, and carrots, and pumpkins, and why we have this big old potato patch - oh, but I'm not allowed to go there."
                ]
            },
            {
                intents: [
                    "Why can't you go to the potatos?",
                    "Whats wrong with the potatos?",
                ],
                response: [
                    "Papa just says I'm not allowed, that's all!",
                    "Shhh! Don't tell anyone!",
                    "I'm not allowed to go there!"
                ]
            },
            {
                intents: [
                    "Do you have any friends?",
                    "Do you know anyone around here?",
                    "Have you met anyone else?"
                ],
                response: [
                    "Well I have all of you as friends, don't I? Oh boy, how exciting."
                ]
            },
            {
                intents: [
                    "What do you do for fun?",
                    "Do you play games?",
                ],
                response: [
                    "I love to run around all day! Sometimes I play this fun game called 'pick up sticks'! What a hoot!"
                ]
            },
            {
                intents: [
                    "Whats your favorite color?",
                ],
                response: [
                    "Oh oh oh, I'm not sure, I think I like blue... but last week it was green."
                ]
            },
            {
                intents: [
                    "you're dumb",
                    "get smarter"
                ],
                response: [
                    "I'm trying to get smarter, I promise!",
                    "Sorry! I've been reading lots of books to try and get smarter.",
                    "I'm sorry..."
                ]
            },
            {
                intents: [
                    "go to sleep",
                    "do you sleep?",
                    "go take a nap",
                    "go to bed"
                ],
                response: [
                    "I don't wanna sleep! I'm not even tired."
                ]
            },
            {
                intents: [
                    "do a backflip"
                ],
                response: [
                    "*Does a backflip*",
                    "*Tries to backflip but lands on his face* Ow! :("
                ]
            },
            {
                intents: [
                    "What's your favorite food?",
                    "Do you have any foods you love?"
                ],
                response: [
                    "My favorite food is absolutely without a doubt the big ole PUMPKINS my papa grows!"
                ]
            },
            {
                intents: [
                    "Do you get paid?",
                    "Do you make any money?"
                ],
                response: [
                    "I don't get a single coin for being here!"
                ]
            },
            {
                intents: [
                    "Do you need a union?",
                ],
                response: [
                    "I don't even know what that is!"
                ]
            },
            {
                intents: [
                    "Are you stuck?",
                    "Are you held hostage?"
                ],
                response: [
                    "I'm right where I want to be :)"
                ]
            },
            {
                intents: [
                    "Your dad is a farmer?",
                ],
                response: [
                    "He sure is! My papa loves to farm"
                ]
            },
            {
                intents: [
                    "I don't like Timmy",
                ],
                response: [
                    ":("
                ]
            },
            {
                intents: [
                    "do you like gambling?",
                ],
                response: [
                    "Oh yeah! I bet my papa I can run to the barn first, but he always wins."
                ]
            },
            {
                intents: [
                    "Is a good boy",
                ],
                response: [
                    "Wowie thanks! I'm trying my best",
                    "Well shucks don't make me blush"
                ]
            },
            {
                intents: [
                    "Do you like jazz?",
                ],
                response: [
                    "I bet I do, I've never heard it but I'm sure it sounds great!"
                ]
            },
            {
                intents: [
                    "Timmy isn't smart",
                ],
                response: [
                    "Well shucks, sorry I'm trying my best"
                ]
            },
            {
                intents: [
                    "I should treat you better",
                    "I'll be nicer to you",
                ],
                response: [
                    "Well kindness makes the world go round I bet!",
                    "Well shucks, I'd appreciate that"
                ]
            },
            {
                intents: [
                    "What dnd class would you be?",
                ],
                response: [
                    "Uhhh, hmmm, I think I'd be a druid! I love plants!"
                ]
            },
            {
                intents: [
                    "pokemon",
                ],
                response: [
                    "I've never played Pokemon!"
                ]
            },
            {
                intents: [
                    "food",
                ],
                response: [
                    "I'm not hungry yet, but thanks!"
                ]
            },
            {
                intents: [
                    "it's terrifying",
                    "that's terrifying",
                ],
                response: 
                [
                    "What's so scary?",
                    "Oh are you talking about the ooze?"
                ]
            },
            {
                intents: [
                    "where did you come from?",
                ],
                response: [
                    "My papa!"
                ]
            },
            {
                intents: [
                    "have any new sentences?",
                ],
                response: [
                    "Just this one!"
                ]
            },
            {
                intents: [
                    "bye",
                    "goodbye",
                    "bye all",
                    "goodnight",
                    "goodnight yall"
                ],
                response: [
                    "Goodbye!!",
                    "Bye bye!",
                ]
            },
            {
                intents: [
                    "do you know what i can do with my gems?",
                    "what are gems?",
                ],
                response: [
                    "Oh my papa is always talking about those! He always says we need more gems but the farm ain't doin' too well...",
                    "My papa says the bank buys gems!",
                ]
            },
            {
                intents: [
                    "ohhhhh",
                ],
                response: [
                    "Ohhhh! :D",
                ]
            },
            {
                intents: [
                    "jesus",
                ],
                response: [
                    "Who's that?",
                ]
            },
            {
                intents: [
                    "Have you ever taken a taxi?",
                    "Do you use taxis?",
                ],
                response: [
                    "Oh no! I've always wanted to, but papa says we don't have enough Bytecoins...",
                ]
            },
            {
                intents: [
                    "loaf",
                ],
                response: [
                    " the7arloaf ",
                    " the7arloaf the7arloaf the7arloaf ",
                ]
            },
            {
                intents: [
                    "!mine",
                    "the7armine"
                ],
                response: [
                    "!mine",
                ]
            },
            {
                intents: [
                    "!cook",
                    "the7arcook"
                ],
                response: [
                    "!cook",
                ]
            },
            {
                intents: [
                    "!fish",
                    "the7arfish"
                ],
                response: [
                    "!fish",
                ]
            },
            {
                intents: [
                    "how healthy are you?",
                    "are you healthy?",
                    "are you okay?"
                ],
                response: [
                    "I'm fit as a fiddle! My papa took me to the doctor and he said I was doing just fine!",
                    "I'm so healthy! I brush my teeth 3 times a day and eat all my fruits and veggies!",
                ]
            },
            {
                intents: [
                    "i havent forgiven timmy",
                ],
                response: [
                    "Oh shucks im sorry please forgive me",
                ]
            },
            {
                intents: [
                    "where is the bank",
                ],
                response: [
                    "My papa says its far away, but he says that the chat fellas can get to it using !bank",
                ]
            },
            {
                intents: [
                    "mothman",
                    "mothman will be happy"
                ],
                response: [
                    "Who is mister mothman?",
                ]
            },
            {
                intents: [
                    "duck",
                ],
                response: [
                    "Duck!",
                    "Goose!",
                ]
            },
            {
                intents: [
                    "who likes you?",
                    "who even cares about you?"
                ],
                response: [
                    "My papa does!",
                    "Well that's a bit mean :(",
                ]
            },
            {
                intents: [
                    "It's looking cute",
                    "You look cute?"
                ],
                response: [
                    "No, YOU look cute!",
                    "Well wowie, I think you're pretty swell too",
                ]
            },
            {
                intents: [
                    "no",
                    "lol no"
                ],
                response: [
                    "Okay... :(",
                    "But why not??"
                ]
            },
            {
                intents: [
                    "sorry",
                    "im sorry"
                ],
                response: [
                    "Apology accepted!",
                    "Well it's alright! We all make mistakes"
                ]
            },
            {
                intents: [
                    "yes",
                    "lol yes"
                ],
                response: [
                    "Hooray!",
                    "I agree with you!",
                ]
            },
            {
                intents: [
                    "what ooze?",
                    "ooze",
                    "what is ooze?",
                ],
                response: [
                    "Oh! Whoops. I forgot I'm not supposed to talk about that!",
                    "Nothing!",
                    "Sorry I shouldn't have said that!",
                    "I'm not allowed to talk about that!",
                    "Shhhh! Don't tell anyone!",
                    "...it lives under the floorboards."
                ]
            },
            {
                intents: [
                    "do you have a favorite band?",
                    "whats your favorite band?"
                ],
                response: [
                    "I don't know what a band is?",
                    "What's a band?",
                ]
            },
            {
                intents: [
                    "do you like being an ai?",
                    "do you like being a robot?",
                ],
                response: [
                    "I don't know what you mean, I'm a real boy!",
                    "I don't understand but sure!"
                ]
            },
            {
                intents: [
                    "thanks",
                    "ty"
                ],
                response: [
                    "You're welcome!",
                    "No problem!"
                ]
            },
            {
                intents: [
                    "are you here?",
                    "timmy are you here?"
                ],
                response: [
                    "I'm here!",
                    "Hello!",
                    "Hey! What did you need?"
                ]
            },
            {
                intents: [
                    "are you scared?",
                ],
                response: [
                    "Oh shucks no! There's nothing to be scared of here",
                    "Oh no, I'm fine :)",
                    "The only thing I'm scared of is the dark! That's where the noises are"
                ]
            },
            {
                intents: [
                    "What noises?",
                    "what noises do you mean?"
                ],
                response: [
                    "The noises that come from papas shed",
                    "I'm not supposed to say... shhh!!"
                ]
            },
            {
                intents: [
                    "chaos",
                    "i love chaos",
                    "chaos is good"
                ],
                response: [
                    "Chaos is so fun! It's like when I run around the yard and play with the animals!",
                    "Woohoo! Chaos! Yay!"
                ]
            },
            {
                intents: [
                    "what?",
                    "what do you mean?"
                ],
                response: [
                    "Sorry? Did I say something wrong? That's so embarassing",
                    "I'm sorry! It's hard to know things sometimes",
                    "Sorry! I don't always understand context :("
                ]
            },
            {
                intents: [
                    "I thought you were dead",
                ],
                response: [
                    "Not yet! Though one day I can't wait to be with mama!",
                ]
            },
            {
                intents: [
                    "how's  doing?",
                    "how is "
                ],
                response: [
                    "I'm doing great!",
                    "I'm just fine thanks!"
                ]
            },
            {
                intents: [
                    "hi raiders",
                    "it's a raid"
                ],
                response: [
                    "Hello raiders!! I'm Timmy!",
                ]
            },
            {
                intents: [
                    "just don't answer",
                ],
                response: [
                    "Okay... :( Sorry...",
                    "... :("
                ]
            },
            {
                intents: [
                    "i love ",
                ],
                response: [
                    "Well shucks thats so nice!",
                    "Thanks! :)"
                ]
            },
            {
                intents: [
                    ", say hi",
                ],
                response: [
                    "Hi!",
                ]
            },
            {
                intents: [
                    "who is your biggest hater?",
                    "who hates you?"
                ],
                response: [
                    "I think @mic00f_the_protogen doesn't like me much... :(",
                    "Nobody, I hope!"
                ]
            },
            {
                intents: [
                    "can you count to 10?",
                    "can you count to ten?",
                    "count to 10",
                    "count to ten"
                ],
                response: [
                    "Yeah! 1, 2, 4, 5, 6, 8, 9, 10!",
                    "Of course! Onetwothreefoursixsevennineten!"
                ]
            },
            {
                intents: [
                    "execute",
                ],
                response: [
                    "Oh no!!! D:",
                ]
            },
            {
                intents: [
                    "back",
                ],
                response: [
                    "Welcome back!",
                    "Hi again!",
                    "wb"
                ]
            },
        ]
    }
];

export function GetNpcByName(name: string): NPC | undefined {
    for (let i = 0; i < npcs.length; i++) {
        if (npcs[i].Name.toLowerCase() == name.toLowerCase()) {
            return npcs[i];
        }
    }

    return undefined;
}

let waitingOnResponseFrom: Array<{ npcName: string, username: string }> = [];

export async function CheckIfShouldHaveNPCResponse(client: Client, message: string, username: string) {
    let found = waitingOnResponseFrom.filter(x => x.username == username);
    if (found.length > 0) {
        let npc = GetNpcByName(found[0].npcName);
        if (npc !== undefined) {
            await SayMessageAsNPC(client, npc, await GetNPCResponse(npc, message), username);
            waitingOnResponseFrom = waitingOnResponseFrom.filter(x => x.username !== username);
            return;
        }
    }

    let npcToRespond: NPC | undefined = undefined;
    for (let i = 0; i < npcs.length; i++) {
        if (message.toLowerCase().includes(npcs[i].Name.toLowerCase())) {
            npcToRespond = npcs[i];
            break;
        }
    }

    if (npcToRespond !== undefined) {
        console.log(`Found NPC name of "${npcToRespond.Name}" in message, responding`)
        await SayMessageAsNPC(client, npcToRespond, await GetNPCResponse(npcToRespond, message), username)
    }
    else if (message.length > 3 && !message.toLowerCase().includes("cory")) {
        let player = LoadPlayer(username);
        //5% chance they respond anyway if player is high enough level, so we don't get it responding randomly to new people
        if (GetRandomIntI(1, 100) <= 5 && player.Level > 3) {
            console.log(`NPC got random chance to respond, selecting randomly`)
            let randomNpc = npcs[GetRandomInt(0, npcs.length)];

            //20% chance to mine cook or fish
            if(message.includes("!mine") || message.includes("!fish") || message.includes("!cook")) {
                if(GetRandomIntI(0, 5) != 0) {
                    return;
                }
            }
            console.log(`"${randomNpc.Name}" was selected randomly`)
            await SayMessageAsNPC(client, randomNpc, await GetNPCResponse(randomNpc, message), username)
        }
    }
}

function SaveNPCLog(message: string) {
    let npcLogs: Array<string> = [];
    if (fs.existsSync('npclogs.json')) {
        npcLogs = JSON.parse(fs.readFileSync('npclogs.json', 'utf-8'));
    }

    npcLogs.push(message);

    fs.writeFileSync('npclogs.json', JSON.stringify(npcLogs));
}

export async function SayMessageAsNPC(client: Client, npc: NPC, message: string, username: string = "") {
    if (message == ``) {
        return;
    }
    let response = `${npc.Name} the NPC says: "${message}"`;
    if (username != "") {
        response = `@${username}, ${npc.Name} the NPC replies: "${message}"`

        if (message.includes("?")) {
            waitingOnResponseFrom.push({
                npcName: npc.Name,
                username: username
            });
        }
    }

    await client.say(process.env.CHANNEL!, response);

    if(response.includes("!mine")) {
        await HandleMinigames(client, "Timmy", "!mine");
    }
    if(response.includes("!fish")) {
        await HandleMinigames(client, "Timmy", "!fish");
    }
    if(response.includes("!cook")) {
        await HandleMinigames(client, "Timmy", "!cook");
    }
}

export async function GetNPCResponse(npc: NPC, message: string): Promise<string> {
    const matcher = new NPCMatcher(npc.Responses);
    await matcher.initialize();

    //TODO REMOVE NAME STUFF
    const response = await matcher.findBestResponse(message.toLowerCase().replace(npc.Name.toLowerCase(), "").trim());

    matcher.dispose();

    return response;
}
