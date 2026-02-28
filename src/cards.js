// Card Database

const CardDatabase = {
    Handgun: (id) => new Card(
        id,
        "Handgun",
        "attack",
        1, // AP
        1, // Ammo
        "Fire a single 9mm round for 5 Damage.",
        (engine) => {
            engine.enemy.takeDamage(5);
            engine.ui.log(`Fired handgun for 5 damage!`);
        }
    ),
    Knife: (id) => new Card(
        id,
        "Combat Knife",
        "attack",
        1, // AP
        0, // Ammo
        "Slashing attack for 2 Damage. Costs 0 Ammo.",
        (engine) => {
            engine.enemy.takeDamage(2);
            engine.ui.log(`Slashed with knife for 2 damage!`);
        }
    ),
    Evade: (id) => new Card(
        id,
        "Evade",
        "defense",
        1, // AP
        0, // Ammo
        "Prepare to dodge. Grants 5 Block for this turn.",
        (engine) => {
            engine.player.block += 5;
            engine.ui.log(`Prepared to evade (5 Block).`);
        }
    ),
    Scavenge: (id) => new Card(
        id,
        "Scavenge",
        "utility",
        2, // AP
        0, // Ammo
        "Search the surroundings. Gain 2 Ammo.",
        (engine) => {
            engine.player.ammo = Math.min(engine.player.maxAmmo, engine.player.ammo + 2);
            engine.ui.log(`Scavenged 2 Ammo.`);
        }
    )
};
