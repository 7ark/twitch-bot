import {Affliction, ClassType, GetAfflictionDescription, Upgrade, UpgradeType} from "./valueDefinitions";

export const UpgradeDefinitions: Array<Upgrade> = [
    {
        Name: `Learn Move`,
        Description: `Learn a random new combat move`,
        Effects: [
            {
                Type: UpgradeType.LearnMove,
                Strength: 0
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: false,
        Rarity: 40,
        IsPermanent: false
    },
    {
        Name: `Tough`,
        Description: `Increase max HP by {0}%`,
        Effects: [
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 15
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Incredible Resolve`,
        Description: `Take {0}% less damage when below 30% HP`,
        Effects: [
            {
                Type: UpgradeType.LessDamageWhenBelow30Percent,
                Strength: 10
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `New Shield`,
        Description: `Increase your armor by {0}`,
        Effects: [
            {
                Type: UpgradeType.IncreaseAC,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Unkillable`,
        Description: `Whenever you would take fatal damage, you have a {0}% chance to be set to 1HP instead`,
        Effects: [
            {
                Type: UpgradeType.FatalDamageSave,
                Strength: 10
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Critical Eye`,
        Description: `Attacks have an additional {0}% chance to be a critical hit`,
        Effects: [
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Extra Strength`,
        Description: `Attacks deal {0}% more damage`,
        Effects: [
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: 10
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Rapid Strike`,
        Description: `For each consecutive hit where you don't miss, add {0}% more damage to your attacks`,
        Effects: [
            {
                Type: UpgradeType.ConsecutiveDamage,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Fast Learner`,
        Description: `Gain {0}% more EXP`,
        Effects: [
            {
                Type: UpgradeType.MoreEXP,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Speedy`,
        Description: `Personal cooldowns are reduced by {0}%`,
        Effects: [
            {
                Type: UpgradeType.ReducedCooldowns,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Cooldown Mastery`,
        Description: `{0}% chance to not trigger personal cooldowns when using a move`,
        Effects: [
            {
                Type: UpgradeType.CooldownCancelChance,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Hoarder`,
        Description: `Defeating a monster gives {0} gems`,
        Effects: [
            {
                Type: UpgradeType.DefeatGems,
                Strength: 250
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Afflictions
    {
        Name: `Burning Hands`,
        Description: `Attacking monsters now inflicts {0} burning. ${GetAfflictionDescription(Affliction.Burning)}`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 2,
                AfflictionsImposed: [Affliction.Burning]
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Inflict Curse`,
        Description: `Attacking monsters now inflicts {0} curse. ${GetAfflictionDescription(Affliction.Curse)}`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 1,
                AfflictionsImposed: [Affliction.Curse]
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Double Afflictions`,
        Description: `Any upgrade that inflicts an affliction now inflicts {0} more`,
        Effects: [
            {
                Type: UpgradeType.MoreAfflictions,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ApplyAffliction, UpgradeType.RandomAfflictionChance],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Plague Bearer`,
        Description: `Apply {0} burning and {1} more of any affliction you inflict`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 1,
                AfflictionsImposed: [Affliction.Burning]
            },
            {
                Type: UpgradeType.MoreAfflictions,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Toxic Healer`,
        Description: `Apply {0} poison on attacks and heal {1} when monsters take affliction damage`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 2,
                AfflictionsImposed: [Affliction.Poison]
            },
            {
                Type: UpgradeType.HealWhenMonsterTakesAfflictionDamage,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Curse Weaver`,
        Description: `Apply {0} curse and inflict {1} more of any affliction`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 1,
                AfflictionsImposed: [Affliction.Curse]
            },
            {
                Type: UpgradeType.MoreAfflictions,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ApplyAffliction],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //TODO New
    {
        Name: `Turtle`,
        Description: `Gain {0}% health, deal {1}% less damage`,
        Effects: [
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 25
            },
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: -25
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Recovery`,
        Description: `Each time a monster takes damage from an affliction, heal {0}`,
        Effects: [
            {
                Type: UpgradeType.HealWhenMonsterTakesAfflictionDamage,
                Strength: 1
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ApplyAffliction],
        Savable: true,
        Rarity: 3,
        IsPermanent: false
    },
    {
        Name: `Front Liner`,
        Description: `Take {0} extra damage for each player who would be hit by a monster attack, everyone else in chat takes {0} less damage. Gain {1}% more max HP`,
        Effects: [
            {
                Type: UpgradeType.ShieldDamageFromOtherPlayers,
                Strength: 3
            },
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 10
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Hardy`,
        Description: `Take {0}% less damage`,
        Effects: [
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 5
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Noodle Arms`,
        Description: `Take {0}% less damage, but deal 10% less damage`,
        Effects: [
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 10
            },
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: -10
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Team Player`,
        Description: `Gain {0}% more max HP`,
        Effects: [
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 5
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ShieldDamageFromOtherPlayers],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Team Shield`,
        Description: `Take {0}% less damage`,
        Effects: [
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 10
            },
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ShieldDamageFromOtherPlayers],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    {
        Name: `Berserker's Fury`,
        Description: `Deal {0}% more damage and gain {1}% crit chance, but take {2}% more damage`,
        Effects: [
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: 15
            },
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 5
            },
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: -10 // more damage taken
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Arcane Scholar`,
        Description: `Gain {0}% more EXP and {1}% cooldown reduction, but deal {2}% less damage`,
        Effects: [
            {
                Type: UpgradeType.MoreEXP,
                Strength: 10
            },
            {
                Type: UpgradeType.ReducedCooldowns,
                Strength: 10
            },
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: -10
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Fortune's Blessing`,
        Description: `Gain {0}% crit chance, {1} gems per enemy defeated, and {2}% chance to not trigger cooldowns`,
        Effects: [
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 3
            },
            {
                Type: UpgradeType.DefeatGems,
                Strength: 150
            },
            {
                Type: UpgradeType.CooldownCancelChance,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Fortress`,
        Description: `Gain {0} armor, {1}% max HP, and {2}% chance to be set to 1hp instead of dying`,
        Effects: [
            {
                Type: UpgradeType.IncreaseAC,
                Strength: 2
            },
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 10
            },
            {
                Type: UpgradeType.FatalDamageSave,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Merchant Warrior`,
        Description: `Gain {0} gems per defeat and {1}% chance for gems equal to damage dealt`,
        Effects: [
            {
                Type: UpgradeType.DefeatGems,
                Strength: 150
            },
            {
                Type: UpgradeType.GemsForDamageChance,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Greedy Fighter`,
        Description: `Gain {0} gems per defeat and {1}% more EXP, but deal {2}% less damage`,
        Effects: [
            {
                Type: UpgradeType.DefeatGems,
                Strength: 200
            },
            {
                Type: UpgradeType.MoreEXP,
                Strength: 8
            },
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: -8
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Desperate Warrior`,
        Description: `When below 30% HP: deal {0}% more damage and take {1}% less damage`,
        Effects: [
            {
                Type: UpgradeType.MoreDamageWhenBelow30Percent,
                Strength: 15
            },
            {
                Type: UpgradeType.LessDamageWhenBelow30Percent,
                Strength: 10
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Combat Medic`,
        Description: `Heal {0}% of damage dealt and {1} when monsters take affliction damage`,
        Effects: [
            {
                Type: UpgradeType.HealForDamageDealt,
                Strength: 5
            },
            {
                Type: UpgradeType.HealWhenMonsterTakesAfflictionDamage,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [UpgradeType.ApplyAffliction],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Precision Fighter`,
        Description: `Gain +{0} to hit, {1}% crit chance, and {2}% consecutive damage bonus`,
        Effects: [
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 2
            },
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 3
            },
            {
                Type: UpgradeType.ConsecutiveDamage,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Flurry Master`,
        Description: `{0}% cooldown reduction, {1}% chance to not trigger cooldowns, and +{2} to hit`,
        Effects: [
            {
                Type: UpgradeType.ReducedCooldowns,
                Strength: 8
            },
            {
                Type: UpgradeType.CooldownCancelChance,
                Strength: 5
            },
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
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
        Effects: [
            {
                Type: UpgradeType.WarriorStrikeTwiceChance,
                Strength: 15
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Just Better`,
        Description: `All damage you take is reduced by {0}%`,
        Effects: [
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Last Stand`,
        Description: `Deal {0}% more damage when below 30% health`,
        Effects: [
            {
                Type: UpgradeType.MoreDamageWhenBelow30Percent,
                Strength: 15
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Precise Blows`,
        Description: `Gain +{0} to all attack to-hit modifiers`,
        Effects: [
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 2
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 3,
        IsPermanent: false
    },
    {
        Name: `Weapon Master`,
        Description: `{0}% chance to strike twice, +{1} to hit, and {2}% more damage when below 30% HP`,
        Effects: [
            {
                Type: UpgradeType.WarriorStrikeTwiceChance,
                Strength: 10
            },
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 1
            },
            {
                Type: UpgradeType.MoreDamageWhenBelow30Percent,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Unstoppable Force`,
        Description: `Take {0}% less damage, {1}% chance to strike twice, and +{2} armor`,
        Effects: [
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 8
            },
            {
                Type: UpgradeType.WarriorStrikeTwiceChance,
                Strength: 8
            },
            {
                Type: UpgradeType.IncreaseAC,
                Strength: 1
            }
        ],
        ClassRequirements: [ClassType.Warrior],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Rogue
    {
        Name: `Lifeblood`,
        Description: `Every attack has a {0}% chance to have lifesteal`,
        Effects: [
            {
                Type: UpgradeType.LifestealChance,
                Strength: 5
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Poisonous`,
        Description: `Attacking monsters now inflicts {0} poison. ${GetAfflictionDescription(Affliction.Poison)}`,
        Effects: [
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 3,
                AfflictionsImposed: [Affliction.Poison]
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 10,
        IsPermanent: false
    },
    {
        Name: `Rich Adventurer`,
        Description: `Every attack has a {0}% chance to give gems equal to the damage dealt`,
        Effects: [
            {
                Type: UpgradeType.GemsForDamageChance,
                Strength: 5
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Vital Knowledge`,
        Description: `Attacks have an additional {0}% chance to be a critical hit`,
        Effects: [
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 5
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Dodge Recovery`,
        Description: `When the monster misses you with an attack, heal by {0}`,
        Effects: [
            {
                Type: UpgradeType.DodgeHeal,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Shadow Assassin`,
        Description: `{0}% lifesteal chance, {1}% crit chance, and heal {2} when monsters miss you`,
        Effects: [
            {
                Type: UpgradeType.LifestealChance,
                Strength: 5
            },
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 5
            },
            {
                Type: UpgradeType.DodgeHeal,
                Strength: 5
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Wealthy Assassin`,
        Description: `{0}% chance for gems equal to damage, {1} gems per defeat, and apply {2} poison`,
        Effects: [
            {
                Type: UpgradeType.GemsForDamageChance,
                Strength: 5
            },
            {
                Type: UpgradeType.DefeatGems,
                Strength: 100
            },
            {
                Type: UpgradeType.ApplyAffliction,
                Strength: 1,
                AfflictionsImposed: [Affliction.Poison]
            }
        ],
        ClassRequirements: [ClassType.Rogue],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 8,
        IsPermanent: false
    },

    //Mage
    {
        Name: `Better Wand`,
        Description: `Every Mage attack does {0}% more damage`,
        Effects: [
            {
                Type: UpgradeType.MoreMageDamage,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Better Wand`,
        Description: `Every attack has a {0}% chance to apply a random affliction`,
        Effects: [
            {
                Type: UpgradeType.RandomAfflictionChance,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Arcane Intelligence`,
        Description: `Gain {0}% more EXP`,
        Effects: [
            {
                Type: UpgradeType.MoreEXP,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Arcane Focus`,
        Description: `All attacks have a {0}% chance to double the number of afflictions on a monster`,
        Effects: [
            {
                Type: UpgradeType.DoubleAfflictionsChance,
                Strength: 5
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [UpgradeType.ApplyAffliction, UpgradeType.RandomAfflictionChance],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Chaos Mage`,
        Description: `{0}% chance for random afflictions, {1}% chance to double afflictions, and {2}% more mage damage`,
        Effects: [
            {
                Type: UpgradeType.RandomAfflictionChance,
                Strength: 8
            },
            {
                Type: UpgradeType.DoubleAfflictionsChance,
                Strength: 3
            },
            {
                Type: UpgradeType.MoreMageDamage,
                Strength: 8
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Scholar Mage`,
        Description: `{0}% more EXP, {1}% cooldown reduction, and {2}% more mage damage`,
        Effects: [
            {
                Type: UpgradeType.MoreEXP,
                Strength: 8
            },
            {
                Type: UpgradeType.ReducedCooldowns,
                Strength: 5
            },
            {
                Type: UpgradeType.MoreMageDamage,
                Strength: 8
            }
        ],
        ClassRequirements: [ClassType.Mage],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Cleric
    {
        Name: `Divine Favor`,
        Description: `Healing effects are {0}% stronger`,
        Effects: [
            {
                Type: UpgradeType.StrongerHealing,
                Strength: 25
            }
        ],
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Blessed Armor`,
        Description: `Increase armor by {0} when above 70% health`,
        Effects: [
            {
                Type: UpgradeType.IncreaseArmorWhenAbove70Percent,
                Strength: 3
            }
        ],
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Healing Hands`,
        Description: `Heal {0}% of your damage dealt`,
        Effects: [
            {
                Type: UpgradeType.HealForDamageDealt,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Battle Cleric`,
        Description: `{0}% stronger healing, heal {1}% of damage dealt, and +{2} armor when above 70% HP`,
        Effects: [
            {
                Type: UpgradeType.StrongerHealing,
                Strength: 15
            },
            {
                Type: UpgradeType.HealForDamageDealt,
                Strength: 5
            },
            {
                Type: UpgradeType.IncreaseArmorWhenAbove70Percent,
                Strength: 2
            }
        ],
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },
    {
        Name: `Divine Guardian`,
        Description: `{0}% stronger healing, take {1} extra damage per player hit, and {2}% max HP`,
        Effects: [
            {
                Type: UpgradeType.StrongerHealing,
                Strength: 20
            },
            {
                Type: UpgradeType.ShieldDamageFromOtherPlayers,
                Strength: 1
            },
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 10
            }
        ],
        ClassRequirements: [ClassType.Cleric],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: false
    },

    //Permanent
    {
        Name: `SUPER LEARNER`,
        Description: `Get {0}% more EXP`,
        Effects: [
            {
                Type: UpgradeType.MoreEXP,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER HURTER`,
        Description: `Do {0}% more damage`,
        Effects: [
            {
                Type: UpgradeType.DamageChangePercentage,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER HARDY`,
        Description: `Gain {0}% more max HP`,
        Effects: [
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER CRIT`,
        Description: `Gain {0}% chance to critical hit`,
        Effects: [
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 5
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER SHIELD`,
        Description: `Gain {0} armor`,
        Effects: [
            {
                Type: UpgradeType.IncreaseAC,
                Strength: 2
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER SMACKER`,
        Description: `Gain +{0} to all attack to-hit modifiers`,
        Effects: [
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 2
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER COMBO`,
        Description: `Gain {0}% crit chance and {1}% consecutive damage bonus`,
        Effects: [
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 3
            },
            {
                Type: UpgradeType.ConsecutiveDamage,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER TANK`,
        Description: `Gain {0}% max HP and {1} armor`,
        Effects: [
            {
                Type: UpgradeType.IncreaseMaxHPPercent,
                Strength: 3
            },
            {
                Type: UpgradeType.IncreaseAC,
                Strength: 1
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER SPEED`,
        Description: `{0}% cooldown reduction and {1}% chance to not trigger cooldowns`,
        Effects: [
            {
                Type: UpgradeType.ReducedCooldowns,
                Strength: 3
            },
            {
                Type: UpgradeType.CooldownCancelChance,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER RICH`,
        Description: `Gain {0} gems per defeat and {1}% more EXP`,
        Effects: [
            {
                Type: UpgradeType.DefeatGems,
                Strength: 100
            },
            {
                Type: UpgradeType.MoreEXP,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER ACCURATE`,
        Description: `Gain +{0} to hit and {1}% crit chance`,
        Effects: [
            {
                Type: UpgradeType.ChangeHitModifier,
                Strength: 1
            },
            {
                Type: UpgradeType.CriticalHitChance,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    },
    {
        Name: `SUPER SURVIVOR`,
        Description: `{0}% chance to be set to 1hp instead of dying and {1}% less damage taken`,
        Effects: [
            {
                Type: UpgradeType.FatalDamageSave,
                Strength: 3
            },
            {
                Type: UpgradeType.TakenDamageChangedByPercent,
                Strength: 3
            }
        ],
        ClassRequirements: [],
        UpgradeRequirements: [],
        Savable: true,
        Rarity: 5,
        IsPermanent: true
    }
];
