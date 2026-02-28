// Enemy definitions

const EnemyDatabase = {
    ShamblingZombie: () => new Enemy(
        'zombie_1',
        'Shambling Zombie',
        20,
        '🧟'
    ),
    ZombieDog: () => new Enemy(
        'dog_1',
        'Infected Dog',
        10,
        '🐕'
    ),
    Licker: () => new Enemy(
        'licker_1',
        'Licker Mutant',
        40,
        '🧠'
    )
};
