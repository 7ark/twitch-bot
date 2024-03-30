import {ClassType} from "./playerData";

export enum MoveType {
    Attack,
    PlaySound,
    ChangeMonitorRotation,
    DarkenMonitor,
    TeleportCameraRandomly, //wizard
    SayAllChat, //Warrior roar
    Silence, //rogue
}

export interface ClassMove {
    Command: string;
    Description: string;
    ClassRequired: ClassType;
    LevelRequirement?: number;
    Type: MoveType;

    //Attacking
    ChanceToMiss?: number;
    Damage?: { min: number, max: number };
    StunChance?: number;

    //Play Sound
    SoundFile?: string;

    //Final text
    SuccessText: Array<string>;
}

export function getMove(name: string) {
    for (let i = 0; i < attackDefinitions.length; i++) {
        if(attackDefinitions[i].Command === name) {
            return attackDefinitions[i];
        }
    }

    return undefined;
}

export const attackDefinitions: Array<ClassMove> = [

    //Attacks
    {
        Command: 'smash',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,

        ChanceToMiss: 20,
        Damage: { min: 1, max: 2 },
        SuccessText: [`{name} smashes Bytefire with a hammer for {0} damage!`],
    },
    {
        Command: 'slash',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,

        ChanceToMiss: 30,
        Damage: { min: 2, max: 3 },
        SuccessText: [`@{name} slashes at Bytefire with a blade for {0} damage!`],
    },
    {
        Command: 'shoot',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 40,
        Damage: { min: 5, max: 8 },
        SuccessText: [`@{name} shoots an arrow at Bytefire for {0} damage!`],
    },
    {
        Command: 'stab',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 50,
        Damage: { min: 7, max: 12 },
        SuccessText: [`@{name} stabs at Bytefire with a sword for {0} damage!`],
    },
    {
        Command: 'charge',
        Description: `An attack that deals damage to Bytefire, with a 10% chance to stun him`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        StunChance: 10,

        ChanceToMiss: 50,
        Damage: { min: 7, max: 12 },
        SuccessText: [`@{name} charges at Bytefire, slamming their shield into him for {0} damage!`],
    },
    {
        Command: 'rage',
        Description: `An attack that deals massive damage to Bytefire`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        ChanceToMiss: 50,
        Damage: { min: 10, max: 20 },
        SuccessText: [`@{name} gets into a frenzied rage, and starts beating the shit out of Bytefire for {0} damage!`],
    },
    {
        Command: 'cast bolt',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,

        ChanceToMiss: 20,
        Damage: { min: 1, max: 2 },
        SuccessText: [`@{name} fires a bolt at Bytefire and it hits for {0} damage!`],
    },
    {
        Command: 'cast fireball',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,

        ChanceToMiss: 40,
        Damage: { min: 5, max: 10 },
        SuccessText: [`@{name} shoots a fireball at Bytefire and it explodes for {0} damage!`],
    },
    {
        Command: 'cast freezing ray',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 40,
        Damage: { min: 8, max: 12 },
        SuccessText: [`@{name} blasts Bytefire with a freezing ray for {0} damage!`],
    },
    {
        Command: 'cast feels',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 50,
        Damage: { min: 7, max: 12 },
        SuccessText: [`@{name} uses 'feels' on Bytefire, making him very sad, and causing him to take {0} damage!`],
    },
    {
        Command: 'cast lightning',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 40,
        Damage: { min: 10, max: 15 },
        SuccessText: [`@{name} calls down a bolt of lightning on Bytefire for {0} damage!`],
    },
    {
        Command: 'cast meteor shower',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        ChanceToMiss: 20,
        Damage: { min: 5, max: 25 },
        SuccessText: [`@{name} summons a meteor shower and rains massive rocks down on Bytefire for {0} damage!`],
    },
    {
        Command: 'throw',
        Description: `An attack that lets you throw an object from your inventory at Bytefire. (Use !inventory to check what you have)`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,

        ChanceToMiss: 20,
        SuccessText: [`@{name} throws {object} at Bytefire for {0} damage!`],
    },
    {
        Command: 'backstab',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,

        ChanceToMiss: 30,
        Damage: { min: 4, max: 6 },
        SuccessText: [`@{name} backstabs Bytefire using a dagger for {0} damage!`],
    },
    {
        Command: 'sneak attack',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 40,
        Damage: { min: 8, max: 15 },
        SuccessText: [`@{name} stabs Bytefire while hidden in the shadows for {0} damage!`],
    },
    {
        Command: 'blackmail',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 30,
        Damage: { min: 3, max: 13 },
        SuccessText: [`@{name} blackmails Bytefire with sensitive information, and he takes {0} psychic damage!`],
    },
    {
        Command: 'poison dart',
        Description: `An attack that deals damage to Bytefire and poison damage over time (wip)`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,

        ChanceToMiss: 30,
        Damage: { min: 3, max: 13 },
        SuccessText: [`@{name} shoots a poisoned dart at Byte, causing him to take {0} damage, and extra damage for the next 10 seconds!`],
    },
    {
        Command: 'cancel',
        Description: `An attack that deals damage to Bytefire`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Attack,

        ChanceToMiss: 50,
        Damage: { min: 8, max: 15 },
        SuccessText: [
            `@{name} cancels Bytefire after some drunk tweets he made, and he takes {0} damage to his reputation!`,
            `@{name} cancels Bytefire for plagiarizing someone else's work, and he takes {0} damage to his reputation!`,
            `@{name} cancels Bytefire for insulting people he disagreed with, and he takes {0} damage to his reputation!`,
            `@{name} cancels Bytefire for some tweets he made in 1995, and he takes {0} damage to his reputation!`,
            `@{name} cancels Bytefire after some jokes he made, and he takes {0} damage to his reputation!`,
            `@{name} cancels Bytefire after burning people to a crisp, and he takes {0} damage to his reputation!`,
        ],
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

        SuccessText: [`@{name} inspired chat! Every message said will now be said out loud`],
    },

    //Teleport camera
    // {
    //     Command: 'cast teleport',
    //     Description: `A special ability that moves Corys camera to another place on stream randomly for 15 seconds`,
    //     ClassRequired: ClassType.Mage,
    //     LevelRequirement: 10,
    //     Type: MoveType.TeleportCameraRandomly,
    //     SoundFile: 'teleport',
    //
    //     SuccessText: [`@{name} teleported Corys camera to another place!`],
    // },

    //Silence
    {
        Command: 'silence',
        Description: `A special ability that mutes Cory for 10 seconds`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Silence,
        SoundFile: 'silence',

        SuccessText: [`@{name} silenced Cory for 10 seconds.`],
    },
];
