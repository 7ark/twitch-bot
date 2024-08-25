import {ClassType} from "./utils/utils";
import {DamageType} from "./utils/dragonUtils";

export enum MoveType {
    Attack,
    PlaySound,
    ChangeMonitorRotation,
    DarkenMonitor,
    TeleportCameraRandomly, //wizard
    SayAllChat, //Warrior roar
    Silence, //rogue
    GainHPOnCrit, //warrior
}

export interface ClassMove {
    Command: string;
    Description: string;
    ClassRequired: ClassType;
    LevelRequirement?: number;
    Type: MoveType;

    //Attacking
    HitModifier?: number;
    Damage?: { min: number, max: number };
    DamageTypes?: Array<DamageType>;
    StunChance?: number;
    Poison?: boolean;

    //Play Sound
    SoundFile?: string;

    //Final text
    SuccessText: Array<string>;
}

export function GetMove(name: string) {
    for (let i = 0; i < AttackDefinitions.length; i++) {
        if(AttackDefinitions[i].Command === name) {
            return AttackDefinitions[i];
        }
    }

    return undefined;
}

export const AttackDefinitions: Array<ClassMove> = [
    //WARRIOR
    {
        Command: 'smash',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,

        HitModifier: 2,
        Damage: { min: 1, max: 2 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`{name} rolled {roll} and smashes Bytefire with a hammer for {0} damage!`],
    },
    {
        Command: 'slash',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,

        HitModifier: 2,
        Damage: { min: 2, max: 3 },
        DamageTypes: [DamageType.Slashing],
        SuccessText: [`@{name} rolled {roll} and slashes at Bytefire with a blade for {0} damage!`],
    },
    {
        Command: 'shoot',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 4,
        Damage: { min: 5, max: 8 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and shoots an arrow at Bytefire for {0} damage!`],
    },
    {
        Command: 'stab',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 4,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and stabs at Bytefire with a sword for {0} damage!`],
    },
    {
        Command: 'charge',
        Description: `An attack that deals damage to Bytefire, with a 10% chance to stun him`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        StunChance: 10,

        HitModifier: 5,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and charges at Bytefire, slamming their shield into him for {0} damage!`],
    },
    {
        Command: 'rage',
        Description: `An attack that deals massive damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 6,
        Damage: { min: 10, max: 20 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and gets into a frenzied rage, and starts beating the shit out of Bytefire for {0} damage!`],
    },
    {
        Command: 'focus jab',
        Description: `An attack that deals massive damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 8,
        Damage: { min: 20, max: 40 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and moves their mind to a place of extreme concentration, and then lets forth a series of devastating kicks and punches in quick succession, hurting Bytefire for {0} damage!`],
    },

    //MAGE
    {
        Command: 'cast bolt',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,

        HitModifier: 2,
        Damage: { min: 3, max: 6 },
        DamageTypes: [DamageType.Fire, DamageType.Cold],
        SuccessText: [`@{name} rolled {roll} and fires a bolt at Bytefire and it hits for {0} damage!`],
    },
    {
        Command: 'cast fireball',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,

        HitModifier: 3,
        Damage: { min: 5, max: 10 },
        DamageTypes: [DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and shoots a fireball at Bytefire and it explodes for {0} damage!`],
    },
    {
        Command: 'cast freezing ray',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 4,
        Damage: { min: 8, max: 12 },
        DamageTypes: [DamageType.Cold],
        SuccessText: [`@{name} rolled {roll} and blasts Bytefire with a freezing ray for {0} damage!`],
    },
    {
        Command: 'cast feels',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 5,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [`@{name} rolled {roll} and uses 'feels' on Bytefire, making him very sad, and causing him to take {0} damage!`],
    },
    {
        Command: 'cast lightning',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 4,
        Damage: { min: 10, max: 15 },
        DamageTypes: [DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and calls down a bolt of lightning on Bytefire for {0} damage!`],
    },
    {
        Command: 'cast meteor shower',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 6,
        Damage: { min: 5, max: 25 },
        DamageTypes: [DamageType.Bludgeoning, DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and summons a meteor shower and rains massive rocks down on Bytefire for {0} damage!`],
    },
    {
        Command: 'cast devastation',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 6,
        Damage: { min: 10, max: 50 },
        DamageTypes: [DamageType.Cold, DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and sends torrents of ice and fire in all directions, destroying the land around Bytefire for {0} damage!`],
    },

    //ROGUE
    {
        Command: 'throw',
        Description: `An attack that lets you throw an object from your inventory at Bytefire. (Use !inventory to check what you have)`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,

        HitModifier: 2,
        SuccessText: [`@{name} rolled {roll} and throws {object} at Bytefire for {0} damage!`],
    },
    {
        Command: 'backstab',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,

        HitModifier: 2,
        Damage: { min: 4, max: 6 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and backstabs Bytefire using a dagger for {0} damage!`],
    },
    {
        Command: 'sneak attack',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        HitModifier: 5,
        Damage: { min: 8, max: 15 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and stabs Bytefire while hidden in the shadows for {0} damage!`],
    },
    {
        Command: 'blackmail',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 4,
        Type: MoveType.Attack,

        HitModifier: 7,
        Damage: { min: 3, max: 13 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [`@{name} rolled {roll} and blackmails Bytefire with sensitive information, and he takes {0} damage!`],
    },
    {
        Command: 'poison dart',
        Description: `An attack that deals damage to Bytefire and poison damage over time`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        Poison: true,

        HitModifier: 4,
        Damage: { min: 3, max: 13 },
        DamageTypes: [DamageType.Poison],
        SuccessText: [`@{name} rolled {roll} and shoots a poisoned dart at Byte, causing him to take {0} damage, and extra damage for the next minute!`],
    },
    {
        Command: 'cancel',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 6,
        Damage: { min: 8, max: 15 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [
            `@{name} rolled {roll} and cancels Bytefire after some drunk tweets he made, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels Bytefire for plagiarizing someone else's work, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels Bytefire for insulting people he disagreed with, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels Bytefire for some tweets he made in 1995, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels Bytefire after some jokes he made, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels Bytefire after burning people to a crisp, and he takes {0} damage to his reputation!`,
        ],
    },
    {
        Command: 'frozen shadow',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        HitModifier: 7,
        Damage: { min: 10, max: 20 },
        DamageTypes: [DamageType.Cold],
        SuccessText: [
            `@{name} rolled {roll} and lurks just behind Bytefire, where he can never see. Bytefire feels the cold chill emanating from you, and he takes {0} damage!`,
            `@{name} rolled {roll} and shadowy tentacles wrap around Bytefire, cold tentacles of shadow that chill his scales, and he takes {0} damage!`,
        ],
    },

    //Give health on crits
    {
        Command: 'heroic speech',
        Description: `An ability that allows everyone in chat to gain HP on critical hits for 5 minutes`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.GainHPOnCrit,

        SuccessText: [`@{name} is giving a heroic speech`],
    },

    //Play sounds
    {
        Command: 'battlecry',
        Description: `A special ability that plays a battlecry sound, and gives everyone extra Exp`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 3,
        Type: MoveType.PlaySound,

        SoundFile: 'battlecry',
        SuccessText: [`@{name} has started a battle cry! Use !battlecry within 30 seconds to join and gain more exp for 5 minutes.`],
    },

    //Monitor Rotation
    {
        Command: 'cast confusion',
        Description: `A special ability that rotates or flips the screen on Cory`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 3,
        Type: MoveType.ChangeMonitorRotation,
        SoundFile: 'confusion',

        SuccessText: [`@{name} cast confusion! The screen has been rotated for 15 seconds`],
    },

    //Monitor Darken
    {
        Command: 'shroud',
        Description: `A special ability that darkens the screen so Cory can't see for 20 seconds`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 3,
        Type: MoveType.DarkenMonitor,
        SoundFile: 'shroud',

        SuccessText: [`@{name} shrouded Cory in darkness! The screen has been darkened for 20 seconds`],
    },

    //Say all chat
    {
        Command: 'inspire',
        Description: `A special ability that makes it so all chat messages are said out loud for 20 seconds`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.SayAllChat,
        SoundFile: 'inspire',

        SuccessText: [`@{name} inspired chat! Every message said for the next minute will now be said out loud`],
    },

    //Teleport camera
    {
        Command: 'cast teleport',
        Description: `A special ability that moves Corys camera to another place on stream randomly for 15 seconds`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.TeleportCameraRandomly,
        SoundFile: 'teleport',

        SuccessText: [`@{name} teleported Corys camera to another place!`],
    },

    //Silence
    {
        Command: 'silence',
        Description: `A special ability that mutes Cory for 15 seconds`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Silence,
        SoundFile: 'silence',

        SuccessText: [`@{name} silenced Cory for 15 seconds.`],
    },
];
