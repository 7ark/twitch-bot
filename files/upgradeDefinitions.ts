import {Affliction, ClassType, GetAfflictionDescription, Upgrade, UpgradeType} from "./valueDefinitions";

export const UpgradeDefinitions: Array<Upgrade> = [
    {
        Name: `Learn Move`,
        Description: `Learn a random new combat move`,
        Type: UpgradeType.LearnMove,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 0,
        Savable: false,
        Rarity: 40,
        IsPermanent: false
    },
    {
        Name: `Tough`,
        Description: `Increase max HP by {0}%`,
        Type: UpgradeType.IncreaseMaxHP,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 15,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Incredible Resolve`,
        Description: `Take {0}% less damage when below 30% HP`,
        Type: UpgradeType.LessDamageWhenBelow30Percent,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `New Shield`,
        Description: `Increase your armor by {0}`,
        Type: UpgradeType.IncreaseAC,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 3,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Unkillable`,
        Description: `Whenever you would take fatal damage, you have a {0}% chance to be set to 1HP instead`,
        Type: UpgradeType.FatalDamageSave,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Critical Eye`,
        Description: `Attacks have an additional {0}% chance to be a critical hit`,
        Type: UpgradeType.CriticalHitChance,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Super Strength`,
        Description: `Attacks deal {0}% more damage`,
        Type: UpgradeType.IncreasedDamage,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Rapid Strike`,
        Description: `For each consecutive hit where you don't miss, add {0}% more damage to your attacks`,
        Type: UpgradeType.ConsecutiveDamage,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Fast Learner`,
        Description: `Gain {0}% more EXP`,
        Type: UpgradeType.MoreEXP,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Speedy`,
        Description: `Personal cooldowns are reduced by {0}%`,
        Type: UpgradeType.ReducedCooldowns,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Cooldown Mastery`,
        Description: `{0}% chance to not trigger personal cooldowns when using a move`,
        Type: UpgradeType.CooldownCancelChance,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Hoarder`,
        Description: `Defeating a monster gives {0} gems`,
        Type: UpgradeType.DefeatGems,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 250,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Afflictions
    {
        Name: `Burning Hands`,
        Description: `Attacking monsters now inflicts {0} burning. ${GetAfflictionDescription(Affliction.Burning)}`,
        Type: UpgradeType.ApplyAffliction,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [Affliction.Burning],
        Strength: 2,
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Inflict Curse`,
        Description: `Attacking monsters now inflicts {0} curse. ${GetAfflictionDescription(Affliction.Curse)}`,
        Type: UpgradeType.ApplyAffliction,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [Affliction.Curse],
        Strength: 2,
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Double Afflictions`,
        Description: `Any upgrade that inflicts an affliction now inflicts {0} more`,
        Type: UpgradeType.MoreAfflictions,
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ApplyAffliction, UpgradeType.RandomAfflictionChance],
        AfflictionsImposed: [],
        Strength: 1,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //TODO New
    // {
    //     Name: `Turtle`,
    //     Description: `Gain {0}% health, deal 25% less damage`,
    //     Type: UpgradeType.GainPercentHealthDeal25PercentLessDamage,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [],
    //     AfflictionsImposed: [],
    //     Strength: 25,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Recovery`,
    //     Description: `Each time a monster takes damage from an affliction, heal {0}`,
    //     Type: UpgradeType.HealWhenMonsterTakesAfflictionDamage,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [UpgradeType.ApplyAffliction],
    //     AfflictionsImposed: [],
    //     Strength: 1,
    //     Savable: true,
    //     Rarity: 3,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Front Liner`,
    //     Description: `Each time the monster attacks, {0}% of the damage other players would take is instead passed to you`,
    //     Type: UpgradeType.ShieldDamageFromOtherPlayers,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [],
    //     AfflictionsImposed: [],
    //     Strength: 40,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Hardy`,
    //     Description: `Take {0}% less damage`,
    //     Type: UpgradeType.ReduceDamage,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [],
    //     AfflictionsImposed: [],
    //     Strength: 5,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Noodle Arms`,
    //     Description: `Take {0}% less damage, but deal 10% less damage`,
    //     Type: UpgradeType.ReduceDamageButDealLess,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [],
    //     AfflictionsImposed: [],
    //     Strength: 10,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Team Player`,
    //     Description: `Gain {0}% more max HP`,
    //     Type: UpgradeType.IncreaseMaxHP,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [UpgradeType.ShieldDamageFromOtherPlayers],
    //     AfflictionsImposed: [],
    //     Strength: 20,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    // {
    //     Name: `Team Shield`,
    //     Description: `Take {0}% less damage`,
    //     Type: UpgradeType.ReduceDamage,
    //     ClassRequirements: [],
    //     UpgradeRequirements: [UpgradeType.ShieldDamageFromOtherPlayers],
    //     AfflictionsImposed: [],
    //     Strength: 10,
    //     Savable: true,
    //     Rarity: 5,
    //     IsPermanent: false
    // },
    //receives % more damage from other players, unlocks many from above, but also + extra health
    //each time you do x, % chance to destroy random item
    //-gems but plus hp
    //better exchange rate on bank
    //% chance when you gain an item to have it destroyed but you gain dmg/hp
    //separate upgrades: each time an item you have is destroyed, increase max hp/heal/deal damage equal to rarity?
    //+%dmg -%hp
    //reduce cleric specific cooldowns for like heals and shit

    //Class specific

    //Warrior
    {
        Name: `Weapon Mastery`,
        Description: `Every Warrior attack has a {0}% chance to strike twice`,
        Type: UpgradeType.WarriorStrikeTwiceChance,
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 15,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Just Better`,
        Description: `All damage is reduced by {0}%`,
        Type: UpgradeType.DamageReduction,
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Last Stand`,
        Description: `Deal {0}% more damage when below 30% health`,
        Type: UpgradeType.MoreDamageWhenBelow30Percent,
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 15,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Rogue
    {
        Name: `Lifeblood`,
        Description: `Every attack has a {0}% chance to have lifesteal`,
        Type: UpgradeType.LifestealChance,
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Poisonous`,
        Description: `Attacking monsters now inflicts {0} poison. ${GetAfflictionDescription(Affliction.Poison)}`,
        Type: UpgradeType.ApplyAffliction,
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        AfflictionsImposed: [Affliction.Poison],
        Strength: 3,
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Rich Adventurer`,
        Description: `Every attack has a {0}% chance to give gems equal to the damage dealt`,
        Type: UpgradeType.GemsForDamageChance,
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Vital Knowledge`,
        Description: `Attacks have an additional {0}% chance to be a critical hit`,
        Type: UpgradeType.CriticalHitChance,
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Dodge Recovery`,
        Description: `When the monster misses you with an attack, heal by {0}`,
        Type: UpgradeType.DodgeHeal,
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Mage
    {
        Name: `Better Wand`,
        Description: `Every Mage attack does {0}% more damage`,
        Type: UpgradeType.MoreMageDamage,
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Better Wand`,
        Description: `Every attack has a {0}% chance to apply a random affliction`,
        Type: UpgradeType.RandomAfflictionChance,
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Arcane Intelligence`,
        Description: `Gain {0}% more EXP`,
        Type: UpgradeType.MoreEXP,
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Arcane Focus`,
        Description: `All attacks have a {0}% chance to double the number of afflictions on a monster`,
        Type: UpgradeType.DoubleAfflictionsChance,
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [UpgradeType.ApplyAffliction, UpgradeType.RandomAfflictionChance],
        AfflictionsImposed: [],
        Strength: 5,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Cleric
    {
        Name: `Divine Favor`,
        Description: `Healing effects are {0}% stronger`,
        Type: UpgradeType.StrongerHealing,
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 25,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Blessed Armor`,
        Description: `Increase armor by {0} when above 70% health`,
        Type: UpgradeType.IncreaseArmorWhenAbove70Percent,
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 3,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Healing Hands`,
        Description: `Heal {0}% of your damage dealt`,
        Type: UpgradeType.HealForDamageDealt,
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Permanent
    {
        Name: `SUPER LEARNER`,
        Description: `Get 10% more EXP`,
        Type: UpgradeType.MoreEXP,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER HURTER`,
        Description: `Do 10% more damage`,
        Type: UpgradeType.IncreasedDamage,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER HARDY`,
        Description: `Gain 10% more max HP`,
        Type: UpgradeType.IncreaseMaxHP,
        ClassRequirements: [],
        UpgradeRequirements: [],
        AfflictionsImposed: [],
        Strength: 10,
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
];
