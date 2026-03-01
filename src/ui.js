// UI Controller

class UIManager {
    constructor(engine) {
        this.engine = engine;

        // DOM Elements
        this.logList = document.getElementById('log-list');

        this.playerHpBar = document.getElementById('player-health-bar');
        this.playerHpText = document.getElementById('player-hp-text');
        this.playerApText = document.getElementById('player-ap-text');
        this.playerAmmoText = document.getElementById('player-ammo-text');
        this.playerHand = document.getElementById('player-hand');
        this.endTurnBtn = document.getElementById('btn-end-turn');

        this.enemyHpBar = document.getElementById('enemy-health-bar');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.enemyName = document.getElementById('enemy-name');
        this.enemyIntent = document.getElementById('intent-text');
        this.enemySprite = document.getElementById('enemy-sprite');

        this.overlay = document.getElementById('overlay');
        this.rewardModal = document.getElementById('reward-modal');
        this.gameOverModal = document.getElementById('game-over-modal');

        this.setupListeners();
    }

    setupListeners() {
        this.endTurnBtn.addEventListener('click', () => {
            if (this.engine.turnState === 'player') {
                this.engine.endPlayerTurn();
            }
        });
    }

    log(message, cssClass = '') {
        const li = document.createElement('li');
        li.innerText = message;
        if (cssClass) li.className = cssClass;
        this.logList.appendChild(li);

        // Auto scroll
        this.logList.parentElement.scrollTop = this.logList.parentElement.scrollHeight;
    }

    updateAll() {
        this.updatePlayerStats();
        this.updateEnemyStats();
        this.renderHand();
    }

    updatePlayerStats() {
        const p = this.engine.player;
        this.playerHpText.innerText = `${p.hp} / ${p.maxHp}`;
        this.playerHpBar.style.width = `${(p.hp / p.maxHp) * 100}%`;

        const blockStr = p.block > 0 ? ` (+${p.block} Block)` : '';
        this.playerApText.innerText = `${p.ap} / ${p.maxAp}${blockStr}`;
        this.playerAmmoText.innerText = `${p.ammo} / ${p.maxAmmo}`;

        if (this.engine.turnState === 'player') {
            this.endTurnBtn.disabled = false;
            this.endTurnBtn.style.opacity = '1';
        } else {
            this.endTurnBtn.disabled = true;
            this.endTurnBtn.style.opacity = '0.5';
        }
    }

    updateEnemyStats() {
        const e = this.engine.enemy;
        if (!e) return;

        this.enemyName.innerText = e.name;
        this.enemyHpText.innerText = `${e.hp} / ${e.maxHp}`;
        this.enemyHpBar.style.width = `${(e.hp / e.maxHp) * 100}%`;

        if (e.currentIntent) {
            this.enemyIntent.innerText = e.currentIntent.description;
        } else {
            this.enemyIntent.innerText = "Staring blankly.";
        }
    }

    renderHand() {
        this.playerHand.innerHTML = '';
        this.engine.hand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';

            // Highlight cards we can't afford
            if (this.engine.player.ap < card.apCost || this.engine.player.ammo < card.ammoCost || this.engine.turnState !== 'player') {
                cardEl.classList.add('disabled');
            }

            // Visual flair
            let icon = '📄';
            if (card.type === 'attack') icon = '🔫';
            if (card.name.includes('Knife')) icon = '🔪';
            if (card.type === 'defense') icon = '🛡️';
            if (card.type === 'utility') icon = '🎒';

            cardEl.innerHTML = `
                <div class="card-header">
                    <span class="card-name">${card.name}</span>
                    <span class="card-ap-cost">${card.apCost}</span>
                </div>
                <div class="card-image">${icon}</div>
                <div class="card-desc">${card.description}</div>
                ${card.ammoCost > 0 ? `<div class="card-ammo-cost">Ammo: ${card.ammoCost}</div>` : ''}
            `;

            cardEl.addEventListener('click', () => {
                this.engine.playCard(card.id);
            });

            this.playerHand.appendChild(cardEl);
        });
    }

    showGameOver() {
        this.overlay.classList.remove('hidden');
        this.gameOverModal.classList.remove('hidden');
    }

    showVictoryModal(choices) {
        this.overlay.classList.remove('hidden');
        this.rewardModal.classList.remove('hidden');

        const choicesContainer = document.getElementById('reward-choices');
        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'flex';
        choicesContainer.style.gap = '20px';
        choicesContainer.style.justifyContent = 'center';
        choicesContainer.style.margin = '20px 0';

        choices.forEach((choice, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            // Visual distinction for upgrades
            if (choice.type === 'upgrade') {
                cardEl.style.borderColor = '#f1c40f'; // Yellow gold
                cardEl.style.boxShadow = '0 0 15px rgba(241, 196, 15, 0.5)';
            }

            cardEl.innerHTML = `
                <div class="card-header">
                    <span class="card-name" style="font-size: 13px;">${choice.display.name}</span>
                </div>
                <div class="card-image">${choice.display.icon || '📄'}</div>
                <div class="card-desc">${choice.display.desc}</div>
            `;

            cardEl.addEventListener('click', () => {
                this.engine.resolveDraft(index);
            });

            choicesContainer.appendChild(cardEl);
        });

        const skipBtn = document.getElementById('btn-skip-reward');
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        newSkipBtn.addEventListener('click', () => {
            this.engine.resolveDraft(-1);
        });
    }

    hideModals() {
        this.overlay.classList.add('hidden');
        this.rewardModal.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
    }
}
