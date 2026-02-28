// Main Bootloader

document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
    window.game.ui = new UIManager(window.game);

    // Initial log
    window.game.ui.log("You push open the heavy oak doors of the mansion.");
    window.game.ui.log("A shambling shape turns toward you...", "damage-enemy");

    // Start with a basic zombie
    window.game.startCombat(EnemyDatabase.ShamblingZombie());
});
