import {DamageType} from "./utils/monsterUtils";
import {ClassMove, ClassType, MoveType, StatusEffect} from "./valueDefinitions";


export function GetMove(name: string) {
    for (let i = 0; i < MoveDefinitions.length; i++) {
        if(MoveDefinitions[i].Command === name) {
            return MoveDefinitions[i];
        }
    }

    return undefined;
}

export const MoveDefinitions: Array<ClassMove> = [
    {
        Command: 'punch',
        Description: `An attack that deals bludgeoning damage to monsters`,
        Type: MoveType.Attack,
        MovePointsToUnlock: 0,

        HitModifier: 0,
        Damage: { min: 1, max: 5 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`{name} rolled {roll} and punches {monster} for {0} damage!`],
    },

    //WARRIOR
    {
        Command: 'smash',
        Description: `A warrior attack that deals bludgeoning damage to monsters`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 2,
        Damage: { min: 1, max: 2 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`{name} rolled {roll} and smashes {monster} with a hammer for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'slash',
        Description: `A warrior attack that deals slashing damage to monsters`,
        ClassRequired: ClassType.Warrior,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 2,
        Damage: { min: 2, max: 3 },
        DamageTypes: [DamageType.Slashing],
        SuccessText: [`@{name} rolled {roll} and slashes at {monster} with a blade for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'shoot',
        Description: `A warrior attack that deals piercing damage to monsters`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 4,
        Damage: { min: 5, max: 8 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and shoots an arrow at {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'stab',
        Description: `A warrior attack that deals piercing damage to monsters`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 4,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and stabs at {monster} with a sword for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'charge',
        Description: `A warrior attack that deals bludgeoning damage to monsters, with a 10% chance to stun him`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,
        StunChance: 10,

        HitModifier: 5,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and charges at {monster}, slamming their shield into him for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'rage',
        Description: `A warrior attack that deals massive bludgeoning damage to {monster}`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 6,
        Damage: { min: 10, max: 20 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and gets into a frenzied rage, and starts beating the shit out of {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'focus jab',
        Description: `A warrior attack that deals massive bludgeoning damage to {monster}`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 8,
        Damage: { min: 20, max: 40 },
        DamageTypes: [DamageType.Bludgeoning],
        SuccessText: [`@{name} rolled {roll} and moves their mind to a place of extreme concentration, and then lets forth a series of devastating kicks and punches in quick succession, hurting {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },

    //MAGE
    {
        Command: 'cast bolt',
        Description: `A mage spell that deals fire OR cold damage to monsters`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 2,
        Damage: { min: 3, max: 6 },
        DamageTypes: [DamageType.Fire, DamageType.Cold],
        SuccessText: [`@{name} rolled {roll} and fires a bolt at {monster} and it hits for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast fireball',
        Description: `A mage spell that deals fire damage to monsters`,
        ClassRequired: ClassType.Mage,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 3,
        Damage: { min: 5, max: 10 },
        DamageTypes: [DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and shoots a fireball at {monster} and it explodes for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast freezing ray',
        Description: `A mage spell that deals cold damage to monsters`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 4,
        Damage: { min: 8, max: 12 },
        DamageTypes: [DamageType.Cold],
        SuccessText: [`@{name} rolled {roll} and blasts {monster} with a freezing ray for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast feels',
        Description: `A mage spell that deals psychic damage to monsters`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 5,
        Damage: { min: 7, max: 12 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [`@{name} rolled {roll} and uses 'feels' on {monster}, making him very sad, and causing him to take {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast lightning',
        Description: `A mage spell that deals fire damage to monsters`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 4,
        Damage: { min: 10, max: 15 },
        DamageTypes: [DamageType.Lightning],
        SuccessText: [`@{name} rolled {roll} and calls down a bolt of lightning on {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast meteor shower',
        Description: `A mage spell that deals bludgeoning OR fire damage to monsters`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 6,
        Damage: { min: 5, max: 25 },
        DamageTypes: [DamageType.Bludgeoning, DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and summons a meteor shower and rains massive rocks down on {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cast devastation',
        Description: `A mage spell that deals cold OR fire damage to monsters`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 6,
        Damage: { min: 10, max: 25 },
        DamageTypes: [DamageType.Cold, DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and sends torrents of ice and fire in all directions, destroying the land around {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },

    //ROGUE
    {
        Command: 'throw',
        Description: `A rogue attack that lets you throw an object from your inventory at {monster}. (Use !inventory to check what you have)`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 2,
        SuccessText: [`@{name} rolled {roll} and throws {object} at {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'backstab',
        Description: `A rogue attack that deals piercing damage to monsters`,
        ClassRequired: ClassType.Rogue,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 2,
        Damage: { min: 4, max: 6 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and backstabs {monster} using a dagger for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'sneak attack',
        Description: `A rogue attack that deals piercing damage to monsters`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 5,
        Damage: { min: 8, max: 15 },
        DamageTypes: [DamageType.Piercing],
        SuccessText: [`@{name} rolled {roll} and stabs {monster} while hidden in the shadows for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'blackmail',
        Description: `A rogue attack that deals psychic damage to monsters`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 4,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 7,
        Damage: { min: 3, max: 13 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [`@{name} rolled {roll} and blackmails {monster} with sensitive information, and he takes {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'poison dart',
        Description: `A rogue attack that deals poison damage to monsters and poison damage over time`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,
        Poison: true,

        HitModifier: 4,
        Damage: { min: 3, max: 13 },
        DamageTypes: [DamageType.Poison],
        SuccessText: [`@{name} rolled {roll} and shoots a poisoned dart at Byte, causing him to take {0} damage, and extra damage for the next minute!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'cancel',
        Description: `A rogue attack that deals psychic damage to monsters`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 6,
        Damage: { min: 8, max: 15 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [
            `@{name} rolled {roll} and cancels {monster} after some drunk tweets he made, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels {monster} for plagiarizing someone else's work, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels {monster} for insulting people he disagreed with, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels {monster} for some tweets he made in 1995, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels {monster} after some jokes he made, and he takes {0} damage to his reputation!`,
            `@{name} rolled {roll} and cancels {monster} after burning people to a crisp, and he takes {0} damage to his reputation!`,
        ],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'frozen shadow',
        Description: `A rogue attack that deals cold damage to monsters`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 7,
        Damage: { min: 10, max: 20 },
        DamageTypes: [DamageType.Cold],
        SuccessText: [
            `@{name} rolled {roll} and lurks just behind {monster}, where he can never see. {monster} feels the cold chill emanating from you, and he takes {0} damage!`,
            `@{name} rolled {roll} and shadowy tentacles wrap around {monster}, cold tentacles of shadow that chill his scales, and he takes {0} damage!`,
        ],
        PersonalMoveCooldownInSeconds: 60
    },

    //CLERIC
    {
        Command: 'smite',
        Description: `A cleric attack that deals fire damage to monsters`,
        ClassRequired: ClassType.Cleric,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 3,
        Damage: { min: 5, max: 10 },
        DamageTypes: [DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and smites {monster} using a powerful smite for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'heal',
        Description: `Heals a target for a small amount, cannot be used on self. Ex. !heal @the7ark`,
        ClassRequired: ClassType.Cleric,
        Type: MoveType.Heal,
        MovePointsToUnlock: 10,

        HealAmount: { min: 2, max: 15 },
        SuccessText: [`@{name} is healing {target}!`],
        PersonalMoveCooldownInSeconds: 120
    },
    {
        Command: 'divine strike',
        Description: `A cleric attack that deals fire damage to monsters`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 3,
        Damage: { min: 10, max: 15 },
        DamageTypes: [DamageType.Fire],
        SuccessText: [`@{name} rolled {roll} and drives a radiant burst of flame into {monster}, channeling their magical energy into the attack for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'banish',
        Description: `A cleric attack that deals psychic damage to monsters`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 5,
        Type: MoveType.Attack,
        MovePointsToUnlock: 10,

        HitModifier: 3,
        Damage: { min: 10, max: 15 },
        DamageTypes: [DamageType.Psychic],
        SuccessText: [`@{name} rolled {roll} and sends a barrage of otherworldly horrors into the mind of {monster} for {0} damage!`],
        PersonalMoveCooldownInSeconds: 60
    },
    {
        Command: 'restore',
        Description: `Heals a target for a large amount, cannot be used on self. Ex. !restore @the7ark`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 5,
        Type: MoveType.Heal,
        MovePointsToUnlock: 10,

        HealAmount: { min: 15, max: 50 },
        SuccessText: [`@{name} is restoring {target}s health!`],
        PersonalMoveCooldownInSeconds: 240
    },
    {
        Command: 'shield',
        Description: `Gives a shield to a target for 5 minutes. Ex. !shield @the7ark`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 5,
        Type: MoveType.GiveBuff,
        BuffToGive: StatusEffect.IncreaseACBy3,
        BuffLengthInSeconds: 60 * 5,
        MovePointsToUnlock: 10,

        SuccessText: [`@{name} is shielding {target}! Their armor is increased by 3 for {0} seconds.`],
        PersonalMoveCooldownInSeconds: 60 * 8
    },
    {
        Command: 'spiritual weapon',
        Description: `Gives a target a spiritual weapon to help them, and increase their damage. Ex. !spiritual weapon @the7ark`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 8,
        Type: MoveType.GiveBuff,
        BuffToGive: StatusEffect.IncreasedDamage,
        BuffLengthInSeconds: 60 * 5,
        MovePointsToUnlock: 10,

        SuccessText: [`@{name} is giving {target} a spiritual weapon! Their attack damage has increased for {0} seconds.`],
        PersonalMoveCooldownInSeconds: 60 * 8
    },
    {
        Command: 'bless',
        Description: `Grants a magical blessing to a target, and decreases damage they take. Ex. !bless @the7ark`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 8,
        Type: MoveType.GiveBuff,
        BuffToGive: StatusEffect.AllResistance,
        BuffLengthInSeconds: 60 * 5,
        MovePointsToUnlock: 10,

        SuccessText: [`@{name} is blessing {target}! They take less damage for {0} seconds.`],
        PersonalMoveCooldownInSeconds: 60 * 8
    },
    {
        Command: 'guidance',
        Description: `Guide a target to allow them to crit easier. Ex. !guidance @the7ark`,
        ClassRequired: ClassType.Cleric,
        LevelRequirement: 10,
        Type: MoveType.GiveBuff,
        BuffToGive: StatusEffect.BetterChanceToCrit,
        BuffLengthInSeconds: 60 * 7,
        MovePointsToUnlock: 10,

        SuccessText: [`@{name} is giving {target} guidance! They have an increased chance to crit for {0} seconds.`],
        PersonalMoveCooldownInSeconds: 60 * 10
    },

    //Give health on crits
    {
        Command: 'heroic speech',
        Description: `An ability that allows everyone in chat to gain HP on critical hits for 5 minutes`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 5,
        Type: MoveType.GainHPOnCrit,
        MovePointsToUnlock: 10,

        SuccessText: [`@{name} is giving a heroic speech, and everyone gains HP on critical hits for the next 5 minutes.`],
    },

    //Play sounds
    {
        Command: 'battlecry',
        Description: `A special ability that plays a battlecry sound, and gives everyone extra Exp`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 3,
        Type: MoveType.PlaySound,
        MovePointsToUnlock: 10,
        PersonalMoveCooldownInSeconds: 10,

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
        MovePointsToUnlock: 10,
        SoundFile: 'confusion',
        PersonalMoveCooldownInSeconds: 15 * 60,

        SuccessText: [`@{name} cast confusion! The screen has been rotated for 15 seconds`],
    },

    //Monitor Darken
    {
        Command: 'shroud',
        Description: `A special ability that darkens the screen so Cory can't see for 20 seconds`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 3,
        Type: MoveType.DarkenMonitor,
        MovePointsToUnlock: 10,
        SoundFile: 'shroud',
        PersonalMoveCooldownInSeconds: 10 * 60,

        SuccessText: [`@{name} shrouded Cory in darkness! The screen has been darkened for 20 seconds`],
    },

    //Say all chat
    {
        Command: 'inspire',
        Description: `A special ability that makes it so all chat messages are said out loud for 5 minutes`,
        ClassRequired: ClassType.Warrior,
        LevelRequirement: 10,
        Type: MoveType.SayAllChat,
        MovePointsToUnlock: 10,
        SoundFile: 'inspire',

        SuccessText: [`@{name} inspired chat! Every message said for the next 1 minutes will now be said out loud`],
    },

    //Teleport camera
    {
        Command: 'cast teleport',
        Description: `A special ability that moves Corys camera to another place on stream randomly for 15 seconds`,
        ClassRequired: ClassType.Mage,
        LevelRequirement: 10,
        Type: MoveType.TeleportCameraRandomly,
        MovePointsToUnlock: 10,
        SoundFile: 'teleport',
        PersonalMoveCooldownInSeconds: 10 * 60,

        SuccessText: [`@{name} teleported Corys camera to another place!`],
    },

    //Silence
    {
        Command: 'silence',
        Description: `A special ability that mutes Cory for 15 seconds`,
        ClassRequired: ClassType.Rogue,
        LevelRequirement: 10,
        Type: MoveType.Silence,
        MovePointsToUnlock: 10,
        SoundFile: 'silence',
        PersonalMoveCooldownInSeconds: 10 * 60,

        SuccessText: [`@{name} silenced Cory for 15 seconds.`],
    },
];
