// Engine Architecture for Zombie Deckbuilder

class Card {
    constructor(id, name, type, apCost, ammoCost, description, effect) {
        this.id = id;
        this.name = name;
        this.type = type; // 'attack', 'defense', 'utility'
        this.apCost = apCost;
        this.ammoCost = ammoCost; // 0 if it doesn't use ammo (like a knife)
        this.description = description;
        this.effect = effect; // function(engine)
    }
}

class Enemy {
    constructor(id, name, hp, spriteIcon) {
        this.id = id;
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.spriteIcon = spriteIcon;
        this.currentIntent = null;
    }

    // Logic for what the enemy will do on their turn
    planTurn() {
        // Simple logic: 70% chance to attack, 30% to block/do nothing
        const roll = Math.random();
        if (roll < 0.7) {
            this.currentIntent = {
                type: 'attack',
                value: Math.floor(Math.random() * 4) + 3, // 3 - 6 damage
                description: "Intends to Bite"
            };
        } else {
            this.currentIntent = {
                type: 'block',
                value: 5,
                description: "Stumbles unpredictably (Adds block)"
            };
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }
}

class GameEngine {
    constructor() {
        this.player = {
            maxHp: 30,
            hp: 30,
            maxAp: 3,
            ap: 3,
            maxAmmo: 10,
            ammo: 5,
            block: 0 // Resets each turn usually
        };

        this.deck = [];
        this.discardPile = [];
        this.hand = [];
        this.enemy = null;

        this.turnState = 'player'; // 'player' or 'enemy'
        this.ui = null; // Will inject UIManager reference here in main.js
    }

    startCombat(enemyObj) {
        this.enemy = enemyObj;
        this.enemy.planTurn();
        this.deck = [...this.getStartingDeck()];
        this.shuffleDeck();
        this.startPlayerTurn();
    }

    getStartingDeck() {
        // Just creating fresh instances for the new game
        return [
            CardDatabase.Handgun('card_1'),
            CardDatabase.Handgun('card_2'),
            CardDatabase.Handgun('card_3'),
            CardDatabase.Knife('card_4'),
            CardDatabase.Evade('card_5'),
            CardDatabase.Evade('card_6'),
            CardDatabase.Scavenge('card_7'),
            CardDatabase.Scavenge('card_8')
        ];
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        this.ui.log("Deck shuffled.");
    }

    drawCard() {
        if (this.deck.length === 0) {
            if (this.discardPile.length === 0) {
                this.ui.log("No cards left in deck or discard!");
                return;
            }
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        this.hand.push(this.deck.pop());
    }

    startPlayerTurn() {
        this.turnState = 'player';
        this.player.ap = this.player.maxAp;
        this.player.block = 0; // Wipe block from last turn

        // Draw 5 cards
        for (let i = 0; i < 5; i++) {
            this.drawCard();
        }

        this.ui.log("--- PLAYER TURN ---");
        this.ui.updateAll();
    }

    playCard(cardId) {
        if (this.turnState !== 'player') return;

        const cardIndex = this.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const card = this.hand[cardIndex];

        // Resource Check
        if (this.player.ap < card.apCost) {
            this.ui.log(`Not enough AP to play ${card.name}!`);
            return;
        }
        if (this.player.ammo < card.ammoCost) {
            this.ui.log(`Not enough AMMO to play ${card.name}!`);
            return;
        }

        // Consume Resources
        this.player.ap -= card.apCost;
        this.player.ammo -= card.ammoCost;

        // Apply Effect
        card.effect(this);

        // Discard card
        this.discardPile.push(this.hand.splice(cardIndex, 1)[0]);

        this.ui.updateAll();
        this.checkWinState();
    }

    endPlayerTurn() {
        if (this.turnState !== 'player') return;

        // Discard remaining hand
        while (this.hand.length > 0) {
            this.discardPile.push(this.hand.pop());
        }

        this.turnState = 'enemy';
        this.ui.updateAll();

        setTimeout(() => this.executeEnemyTurn(), 1000); // 1 sec delay for drama
    }

    executeEnemyTurn() {
        if (!this.enemy) return;
        this.ui.log("--- ENEMY TURN ---");

        const intent = this.enemy.currentIntent;
        if (intent.type === 'attack') {
            const rawDamage = intent.value;
            // Apply block first
            let damageTaken = Math.max(0, rawDamage - this.player.block);
            this.player.block = Math.max(0, this.player.block - rawDamage);

            this.player.hp -= damageTaken;
            this.ui.log(`Enemy dealt ${rawDamage} damage! (${damageTaken} actual)`, 'damage-player');
        } else if (intent.type === 'block') {
            this.ui.log("Enemy stumbles and hardens its stance.");
            // We'll add enemy block logic later if needed
        }

        // Plan next turn
        this.enemy.planTurn();

        this.ui.updateAll();

        if (this.player.hp <= 0) {
            this.ui.showGameOver();
        } else {
            setTimeout(() => this.startPlayerTurn(), 1000);
        }
    }

    checkWinState() {
        if (this.enemy && this.enemy.hp <= 0) {
            this.ui.log(`You killed the ${this.enemy.name}!`);
            this.enemy = null;
            this.ui.showVictoryModal();
        }
    }
}
