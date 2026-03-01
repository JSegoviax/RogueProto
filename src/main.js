// Main Bootloader

document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
    window.game.ui = new UIManager(window.game);

    // Initial log
    window.game.ui.log("You push open the heavy oak doors of the mansion.");

    // Boot into Map
    window.game.startRun();
});
