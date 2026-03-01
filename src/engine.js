// Engine Architecture for Zombie Deckbuilder

class Card {
    constructor(id, name, type, apCost, ammoCost, descriptionFn, effectFn) {
        this.id = id;
        this.name = name;
        this.level = 1;
        this.type = type; // 'attack', 'defense', 'utility'
        this.apCost = apCost;
        this.ammoCost = ammoCost;
        this.descriptionFn = descriptionFn;
        this.effectFn = effectFn;
    }

    get description() {
        return this.descriptionFn(this);
    }

    get displayName() {
        return this.level > 1 ? `${this.name} +${this.level - 1}` : this.name;
    }

    upgrade() {
        this.level++;
    }

    effect(engine) {
        this.effectFn(engine, this);
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

        // Map Progression
        this.mapGenerator = null;
        this.currentFloor = 0;
        this.lastVisitedNode = null;

        this.turnState = 'player'; // 'player' or 'enemy'
        this.ui = null; // Will inject UIManager reference here in main.js
    }

    startRun() {
        this.mapGenerator = new MapGenerator(7); // 7 Floors to boss
        this.mapGenerator.generate();
        this.currentFloor = 0;
        this.lastVisitedNode = null;
        this.deck = [...this.getStartingDeck()];
        this.shuffleDeck();

        // Open map immediately
        this.ui.showMapModal();
    }

    travelToNode(node) {
        this.currentFloor = node.floor;
        this.lastVisitedNode = node;
        node.completed = true;
        this.ui.hideModals();

        // Next floor for the next map display
        this.currentFloor++;

        // Trigger encounter based on type
        if (node.type === 'safe') {
            this.ui.log("You entered a safe room. Found 15 HP and 5 Ammo!", 'heal');
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
            this.player.ammo = Math.min(this.player.maxAmmo, this.player.ammo + 5);
            this.ui.updateAll();
            // Just move onto the map again instantly for prototype purposes
            setTimeout(() => this.ui.showMapModal(), 2000);
        } else {
            // Pick new random enemy
            const enemyKeys = Object.keys(window.EnemyDatabase);
            const randomEnemyKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
            const enemy = window.EnemyDatabase[randomEnemyKey]();

            // Buff elites/bosses
            if (node.type === 'elite') {
                enemy.name = `Mutated ${enemy.name}`;
                enemy.hp *= 2;
                enemy.maxHp *= 2;
            } else if (node.type === 'boss') {
                enemy.name = `TYRANT`;
                enemy.hp = 150;
                enemy.maxHp = 150;
                enemy.spriteIcon = '👺';
            }

            this.ui.log(`You push deeper into the outbreak. A ${enemy.name} approaches!`);
            this.startCombat(enemy);
        }
    }

    dealDamageToEnemy(amount) {
        if (!this.enemy) return;
        this.enemy.takeDamage(amount);
        this.ui.playEnemyAnimation('hurt');
    }

    startCombat(enemyObj) {
        this.enemy = enemyObj;
        this.enemy.planTurn();
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
            this.ui.playEnemyAnimation('attack');

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
            this.turnState = 'drafting';
            this.prepareDraft();
        }
    }

    prepareDraft() {
        const cardTypes = Object.keys(window.CardDatabase);
        this.currentDraftChoices = [];

        // Combine all owned cards to see what we can upgrade
        const allOwnedCards = [...this.deck, ...this.discardPile, ...this.hand];

        for (let i = 0; i < 3; i++) {
            // 25% chance to offer an upgrade if we have cards
            if (Math.random() < 0.25 && allOwnedCards.length > 0) {
                // Pick random card to upgrade
                const targetCard = allOwnedCards[Math.floor(Math.random() * allOwnedCards.length)];
                this.currentDraftChoices.push({
                    type: 'upgrade',
                    targetCard: targetCard,
                    display: {
                        name: `[UPGRADE] ${targetCard.displayName}`,
                        desc: `Enhance this card to level ${targetCard.level + 1}.`,
                        icon: '✨'
                    }
                });
            } else {
                // Pick new card
                const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
                const newCard = window.CardDatabase[randomType](`card_${Date.now()}_${i}`);

                let icon = '📄';
                if (newCard.type === 'attack') icon = '🔫';
                if (newCard.name.includes('Knife')) icon = '🔪';
                if (newCard.type === 'defense') icon = '🛡️';
                if (newCard.type === 'utility') icon = '🎒';

                this.currentDraftChoices.push({
                    type: 'new',
                    card: newCard,
                    display: {
                        name: newCard.displayName,
                        desc: newCard.description,
                        icon: icon
                    }
                });
            }
        }

        this.ui.showVictoryModal(this.currentDraftChoices);
    }

    resolveDraft(choiceIndex) {
        if (choiceIndex !== -1) { // -1 means skip
            const choice = this.currentDraftChoices[choiceIndex];
            if (choice.type === 'upgrade') {
                choice.targetCard.upgrade();
                this.ui.log(`Upgraded ${choice.targetCard.displayName}!`, 'heal');
            } else {
                this.discardPile.push(choice.card);
                this.ui.log(`Added ${choice.card.displayName} to deck!`, 'heal');
            }
        } else {
            this.ui.log(`Skipped drafting.`);
        }

        this.nextRoom();
    }

    nextRoom() {
        this.ui.hideModals();

        // Reform the deck
        this.deck = [...this.deck, ...this.hand, ...this.discardPile];
        this.hand = [];
        this.discardPile = [];
        this.shuffleDeck();

        // Show map to travel to next node
        this.ui.showMapModal();
    }
}
