// Card Database

window.CardDatabase = {
    Handgun: (id) => new Card(
        id, "Handgun", "attack", 1, 1,
        (c) => `Fire a single 9mm round for ${4 + c.level} Damage.`,
        (engine, c) => {
            const dmg = 4 + c.level;
            engine.enemy.takeDamage(dmg);
            engine.ui.log(`Fired handgun for ${dmg} damage!`);
        }
    ),
    Knife: (id) => new Card(
        id, "Combat Knife", "attack", 1, 0,
        (c) => `Slashing attack for ${1 + c.level} Damage. Costs 0 Ammo.`,
        (engine, c) => {
            const dmg = 1 + c.level;
            engine.enemy.takeDamage(dmg);
            engine.ui.log(`Slashed with knife for ${dmg} damage!`);
        }
    ),
    Evade: (id) => new Card(
        id, "Evade", "defense", 1, 0,
        (c) => `Prepare to dodge. Grants ${3 + (c.level * 2)} Block for this turn.`,
        (engine, c) => {
            const block = 3 + (c.level * 2);
            engine.player.block += block;
            engine.ui.log(`Prepared to evade (${block} Block).`);
        }
    ),
    Scavenge: (id) => new Card(
        id, "Scavenge", "utility", 2, 0,
        (c) => `Search the surroundings. Gain ${1 + c.level} Ammo.`,
        (engine, c) => {
            const ammoGain = 1 + c.level;
            engine.player.ammo = Math.min(engine.player.maxAmmo, engine.player.ammo + ammoGain);
            engine.ui.log(`Scavenged ${ammoGain} Ammo.`);
        }
    ),
    Shotgun: (id) => new Card(
        id, "Shotgun", "attack", 2, 2,
        (c) => `Blast a wide spread for ${10 + (c.level * 2)} Damage.`,
        (engine, c) => {
            const dmg = 10 + (c.level * 2);
            engine.enemy.takeDamage(dmg);
            engine.ui.log(`Blasted shotgun for ${dmg} damage!`);
        }
    ),
    FirstAid: (id) => new Card(
        id, "First Aid Spray", "utility", 1, 0,
        (c) => `Heal for ${10 + (c.level * 5)} HP.`,
        (engine, c) => {
            const heal = 10 + (c.level * 5);
            engine.player.hp = Math.min(engine.player.maxHp, engine.player.hp + heal);
            engine.ui.log(`Sprayed First Aid: Healed ${heal} HP.`, 'heal');
        }
    )
};
