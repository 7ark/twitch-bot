import {DamageType} from "./utils/monsterUtils";

export enum QuestType {
    DoCook,
    DoMine,
    DoFish,
    DealDamage,
    TellJoke, //Deprecated
    GetItem,
    Gamble,
    LevelUp
}

export interface Quest {
    Type: QuestType;
    Progress: number;
    Goal: number;
    FiveStarDifficulty: number;
}

export enum IconType {
    Info, Scroll, Pencil, Coins,
    Bottle, Box, Fruit, Bomb,
    Bananas, CheeseWheel, Beer, Letter,
    Rabbit, Crystal, BottleBlue, PureNail,
    Hammer, DiamondAxe, Wabbajack, ObsidianDagger,
    PoolNoodle, PortalCake, PowerHelmet , DuckHuntGun,
    CardboardBox, Candy, Present
}

export enum ClassType { Mage, Warrior, Rogue, Cleric }

export enum StatusEffect {
    DoubleExp,
    Drunk,
    DoubleAccuracy,
    FireResistance,
    ColdResistance,
    AllVulnerability,
    IncreaseACBy3,
    Poisoned,
    IncreasedDamage,
    DoubleDamage,
    BetterChanceToCrit,
    AllResistance,
}

export interface StatusEffectModule {
    Effect: StatusEffect;
    WhenEffectStarted: Date;
    EffectTimeInSeconds: number;
}

export interface CommandCooldown {
    Command: string;
    WhenDidCommand: Date;
    CommandCooldownInSeconds: number;
}

export interface EquippableObjectReference {
    ObjectName: string;
    RemainingDurability: number;
}

export interface Player {
    Username: string;
    Level: number;
    CurrentHealth: number; //Max calculated based on level
    Classes: Array<Class>;
    LevelUpAvailable: boolean;
    CurrentExp: number;
    CurrentExpNeeded: number;
    KnownMoves: Array<string>;
    Voice?: string;
    Inventory: Array<string>;
    PassiveModeEnabled: boolean;
    Deaths: number;
    StatusEffects: Array<StatusEffectModule>;
    CommandCooldowns: Array<CommandCooldown>;
    EquippedObject?: EquippableObjectReference | undefined;
    EquippedBacklog?: Array<EquippableObjectReference>;
    Gems: number;
    SpendableGems: number;
    CurrentQuest: Quest | undefined;
    CozyPoints: number;
    HasVip: boolean;
    MovePoints: number;
}

export interface Class {
    Type: ClassType;
    Level: number;
}

export enum MoveType {
    Attack,
    PlaySound,
    ChangeMonitorRotation,
    DarkenMonitor,
    TeleportCameraRandomly, //wizard
    SayAllChat, //Warrior roar
    Silence, //rogue
    GainHPOnCrit, //warrior
    Heal, //Cleric
    GiveBuff, //Cleric
}

export interface ClassMove {
    Command: string;
    Description: string;
    ClassRequired?: ClassType;
    LevelRequirement?: number;
    Type: MoveType;
    MovePointsToUnlock: number;

    //Attacking
    HitModifier?: number;
    Damage?: { min: number, max: number };
    DamageTypes?: Array<DamageType>;
    StunChance?: number;
    Poison?: boolean;

    HealAmount?: { min: number, max: number };
    BuffLengthInSeconds?: number;
    BuffToGive?: StatusEffect;
    //Play Sound
    SoundFile?: string;

    //Final text
    SuccessText: Array<string>;

    PersonalMoveCooldownInSeconds?: number;
}
