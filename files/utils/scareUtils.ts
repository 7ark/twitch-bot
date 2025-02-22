import {Client} from "tmi.js";
import {ChangeProgressBar} from "./progressBarUtils";
import {PlaySound} from "./audioUtils";
import {AudioType} from "../streamSettings";
import {FadeOutLights, SetLightBrightness, SetLightColor} from "./lightsUtils";
import {CheckMessageSimilarity, Delay, GetRandomIntI, GetRandomItem, LevenshteinDistance} from "./utils";
import {
    AddStatusEffectToPlayer, CalculateMaxHealth,
    ChangePlayerHealth,
    GivePlayerObject,
    GivePlayerRandomObject,
    LoadPlayer
} from "./playerGameUtils";
import {DamageType, TriggerMonsterAttack} from "./monsterUtils";
import {ObjectRetrievalType} from "../inventoryDefinitions";

let scareWords: Array<string> = [
    `boo`,
    `halloween`,
    `ghost`,
    `ghostly`,
    `ghosts`,
    `skeleton`,
    `skeletons`,
    `zombie`,
    `zombies`,
    `scare`,
    `scares`,
    `scared`,
    `scaring`,
    `scary`,
    `witch`,
    `witches`,
    `witchcraft`,
    `haunt`,
    `haunted`,
    `haunting`,
    `vampire`,
    `vampires`,
    `werewolf`,
    `werewolves`,
    `pumpkin`,
    `pumpkins`,
    `creepy`,
    `creep`,
    `creeps`,
    `grave`,
    `graves`,
    `graveyard`,
    `graveyards`,
    `coffin`,
    `coffins`,
    `bat`,
    `bats`,
    `spider`,
    `spiders`,
    `spiderweb`,
    `spiderwebs`,
    `mummy`,
    `mummies`,
    `ghoul`,
    `ghouls`,
    `demon`,
    `demons`,
    `monster`,
    `monsters`,
    `scream`,
    `screams`,
    `screaming`,
    `blood`,
    `bloody`,
    `nightmare`,
    `nightmares`,
    `cursed`,
    `curse`,
    `curses`,
    `eerie`,
    `eerily`,
    `shadow`,
    `shadows`,
    `fear`,
    `fears`,
    `fearful`,
    `skull`,
    `skulls`,
    `phantom`,
    `phantoms`,
    `possession`,
    `possessed`,
    `undead`,
    `cobweb`,
    `cobwebs`,
    `apparition`,
    `apparitions`,
    `terror`,
    `terrify`,
    `terrified`,
    `terrifying`,
    `chilling`,
    `chill`,
    `chills`,
    `lurking`,
    `lurk`,
    `lurks`,
    `ominous`,
    `spirit`,
    `spirits`,
    `shriek`,
    `shrieks`,
    `wraith`,
    `wraiths`,
    `crypt`,
    `crypts`,
    `tomb`,
    `tombs`,
    `nightfall`,
    `specter`,
    `specters`,
    `fright`,
    `frights`,
    `gloom`,
    `gloomy`,
    `darkness`,
    `dark`,
    `curse`,
    `curses`,
    `thunder`,
    `lightning`,
    `fog`,
    `foggy`,
    `mist`,
    `misty`,
    `shadowy`,
    `whisper`,
    `whispers`,
    `whispering`,
    `omen`,
    `omens`,
    `raven`,
    `ravens`,
    `eerie`,
    `cackle`,
    `cackles`,
    `petrify`,
    `petrified`,
    `phantasm`,
    `phantasms`,
    `revenant`,
    `revenants`,
    `spectral`,
    `seance`,
    `seances`,
    `cryptic`,
    `scared`,
    `abandoned`,
    `abyss`,
    `agony`,
    `alarms`,
    `alien`,
    `alienated`,
    `anguish`,
    `arachnid`,
    `attack`,
    `attacks`,
    `attacking`,
    `banshee`,
    `banshees`,
    `beast`,
    `beasts`,
    `beware`,
    `bloodcurdling`,
    `bones`,
    `broom`,
    `broomstick`,
    `broomsticks`,
    `cadaver`,
    `cadavers`,
    `candle`,
    `candles`,
    `carnage`,
    `casket`,
    `caskets`,
    `caution`,
    `cemetery`,
    `cemeteries`,
    `chains`,
    `chase`,
    `chased`,
    `chasing`,
    `claws`,
    `cloak`,
    `cloaks`,
    `cold`,
    `conjure`,
    `conjured`,
    `corpse`,
    `corpses`,
    `crawl`,
    `crawling`,
    `creak`,
    `creaking`,
    `creature`,
    `creatures`,
    `cries`,
    `danger`,
    `dark`,
    `dead`,
    `death`,
    `decay`,
    `demented`,
    `departed`,
    `die`,
    `dies`,
    `dying`,
    `dire`,
    `disappear`,
    `disappeared`,
    `dread`,
    `entrails`,
    `evil`,
    `evoke`,
    `evoked`,
    `exorcism`,
    `exorcisms`,
    `fang`,
    `fangs`,
    `fearful`,
    `fester`,
    `festering`,
    `fiend`,
    `fiends`,
    `fire`,
    `flames`,
    `frighten`,
    `frightens`,
    `frightened`,
    `ghastly`,
    `goblin`,
    `goblins`,
    `gory`,
    `graveside`,
    `grim`,
    `grisly`,
    `groan`,
    `groans`,
    `guts`,
    `hair-raising`,
    `hallowed`,
    `harvest`,
    `haunt`,
    `haunts`,
    `haunted`,
    `horror`,
    `horrors`,
    `howl`,
    `howls`,
    `howling`,
    `ill-fated`,
    `illusion`,
    `illusions`,
    `imp`,
    `imps`,
    `invisible`,
    `kill`,
    `kills`,
    `killed`,
    `killing`,
    `killer`,
    `killers`,
    `lament`,
    `lantern`,
    `lanterns`,
    `macabre`,
    `magic`,
    `magical`,
    `malevolent`,
    `mausoleum`,
    `mausoleums`,
    `midnight`,
    `moon`,
    `moons`,
    `moonlight`,
    `morbid`,
    `morose`,
    `mourning`,
    `mystery`,
    `mysteries`,
    `necromancer`,
    `necromancy`,
    `night`,
    `nights`,
    `nocturnal`,
    `paranormal`,
    `peril`,
    `phantom`,
    `phantoms`,
    `piercing`,
    `poltergeist`,
    `poltergeists`,
    `possess`,
    `possesses`,
    `possessing`,
    `prey`,
    `preys`,
    `pyre`,
    `pyres`,
    `quiver`,
    `quivering`,
    `rattle`,
    `rattles`,
    `reaper`,
    `reapers`,
    `restless`,
    `ritual`,
    `rituals`,
    `roar`,
    `roars`,
    `rustle`,
    `rustling`,
    `scarecrow`,
    `scarecrows`,
    `shiver`,
    `shivers`,
    `sinister`,
    `slayer`,
    `slayers`,
    `spell`,
    `spells`,
    `spiderweb`,
    `spiderwebs`,
    `bewitched`,
    `bewitching`,
    `bewitch`,
    `bloodless`,
    `bloods`,
    `bloodthirsty`,
    `chill`,
    `chilled`,
    `creep`,
    `creeping`,
    `cursed`,
    `deadly`,
    `dreadful`,
    `dreaded`,
    `eeriest`,
    `fearless`,
    `fearing`,
    `fright`,
    `frightening`,
    `ghastly`,
    `ghastlier`,
    `ghastliest`,
    `gruesome`,
    `horrify`,
    `horrified`,
    `horrifying`,
    `killing`,
    `murder`,
    `murdered`,
    `murderous`,
    `nightmarish`,
    `possess`,
    `possessed`,
    `possessing`,
    `sinister`,
];

let sentencesSaid = [];


export async function CheckForScare(client: Client, username: string, text: string) {
    let processedText = text.toLowerCase();

    // Remove numbers and symbols, keeping only letters
    processedText = processedText.replace(/[^a-z]/g, '');

    let included = 0;
    for (let i = 0; i < scareWords.length; i++) {
        if(processedText.includes(scareWords[i])) {
            included++;
        }
    }

    if(included > 0) {
        let isTooSimilar = CheckMessageSimilarity(processedText, sentencesSaid);

        if (!isTooSimilar) {
            // Add the new sentence to sentencesSaid
            sentencesSaid.push(processedText);

            // Code to fill up the fright meter
            console.log(`"${text}" triggered the fright meter!`);
            if(included < 3) {
                await client.say(process.env.CHANNEL!, `@${username}, that's a scary thing to say! The fright meter has increased a tiny bit.`);
                await ChangeProgressBar(client, 10);
            }
            else if(included < 5) {
                await client.say(process.env.CHANNEL!, `@${username}, you're chilling me to my bones! The fright meter has increased a lot.`);
                await ChangeProgressBar(client,15);
            }
            else if(included < 8) {
                await client.say(process.env.CHANNEL!, `@${username}, I'M TERRIFIED! The fright meter has increased SO MUCH.`);
                await ChangeProgressBar(client,20);
            }
            else {
                await client.say(process.env.CHANNEL!, `@${username}, YOU'RE SO SCARY!`);
                await ChangeProgressBar(client,25);
            }
        } else {
            console.log(`"${text}" is too similar to a previous sentence.`);
            // await client.say(process.env.CHANNEL!, `@${username}, that frightening message is too similar to whats already been said!`);
        }
    }
}

export async function TriggerScare(client: Client) {
    let scareOptions = [
        async () => {
            setTimeout(async () => {
                await SetLightColor(1, 0, 0);
                await SetLightBrightness(1);
            }, 10);

            PlaySound("scare1", AudioType.ImportantStreamEffects, "wav", () => {
                FadeOutLights();
            });
        },
        async () => {
            setTimeout(async () => {
                await SetLightColor(1, 0, 0);
                await SetLightBrightness(1);
            }, 100);

            PlaySound("scare2", AudioType.ImportantStreamEffects, "wav", () => {
                FadeOutLights();
            });
        },
        async () => {
            setTimeout(async () => {
                await SetLightColor(1, 0, 0);
                await SetLightBrightness(1);
            }, 10);

            PlaySound("scare3", AudioType.ImportantStreamEffects, "wav", () => {
                FadeOutLights();
            });
        },
        async () => {
            setTimeout(async () => {
                await SetLightColor(1, 0, 0);
                await SetLightBrightness(1);
            }, 10);

            PlaySound("scare4", AudioType.ImportantStreamEffects, "wav", () => {
                FadeOutLights();
            });
        },
        async () => {
            setTimeout(async () => {
                await SetLightBrightness(0);
            }, 10);

            PlaySound("scare5", AudioType.ImportantStreamEffects, "wav", () => {
                FadeOutLights();
            });
        },
    ];

    let scare = GetRandomItem(scareOptions)!;

    await scare();

    setTimeout(async () => {
        await client.say(process.env.CHANNEL!, `FRIGHT METER FILLED! Scaring Cory...`);
    }, 1000)

    await Delay(3000);

}

export async function TrickOrTreat(client: Client, username: string) {
    let isTrick = GetRandomIntI(0, 1) == 0; //50/50 chance

    let intro = `@${username}, `;
    intro += GetRandomItem([
        `as the door swings open, you yell "TRICK OR TREAT!" and `,
        `you knock on the door, candy bucket ready, and `,
        `the door creaks open slowly, as a figure appears... `,
        `you shout "TRICK OR TREAT!" with excitement before the door even opens. You hear footsteps as it's finally revealed `,
        `you approach a haunted house with flickering lights, nearby wailing, and creaky floorboards. You hesitantly knock, and `,
        `as fog rolls in around your feet, you knock on the eerie door, and `,
        `you step onto the porch of the haunted house, ready to shout, but the door opens before you can, and `,
        `you ring the doorbell, hearing horrifying laughter inside, and `,
        `as bats swoop overhead, you knock on the door, candy bag in hand, and `,
    ]);

    if(isTrick) {
        await client.say(process.env.CHANNEL!, `${intro}it's a TRICK!`);

        let randomTrick = GetRandomItem([
            () => {
                let player = LoadPlayer(username);
                let scaledDamage = Math.ceil(GetRandomIntI(player.CurrentHealth * 0.1, player.CurrentHealth * 0.3));
                ChangePlayerHealth(client, username, -scaledDamage, DamageType.Psychic, "A Halloween Trick");
            },
            async () => {
                await client.say(process.env.CHANNEL!, `The fright meter increases...`);
                await ChangeProgressBar(client, GetRandomIntI(2, 10));
            },
            async () => {
                await client.say(process.env.CHANNEL!, `@${username}, you've angered The Pumpkin Lord with your trick...`);
                await TriggerMonsterAttack(client);
            },
            async () => {
                await client.say(process.env.CHANNEL!, `@${username}, you feel yourself grow weaker...`);
                AddStatusEffectToPlayer(username, StatusEffect.AllVulnerability, 60 * 5);
            }
        ])!;

        await randomTrick();
    }
    else {
        await client.say(process.env.CHANNEL!, `${intro}it's a TREAT!`);

        let randomTreat = GetRandomItem([
            () => {
                let player = LoadPlayer(username);
                if(player.CurrentHealth >= CalculateMaxHealth(player)) {
                    GivePlayerObject(client, username, "candy");
                }
                else {
                    let scaledHealth = Math.ceil(GetRandomIntI(player.CurrentHealth * 0.1, player.CurrentHealth * 0.3));
                    ChangePlayerHealth(client, username, scaledHealth, DamageType.Psychic, "A Halloween Treat");
                }
            },
            () => {
                for (let i = 0; i < 3; i++) {
                    GivePlayerObject(client, username, "candy");
                }
            },
            async () => {
                await GivePlayerRandomObject(client, username, ObjectRetrievalType.RandomReward);
            },
        ])!;

        await randomTreat();
    }
}
