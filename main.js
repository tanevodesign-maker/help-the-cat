const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    backgroundColor: '#111122', // Updated subtle blue-dark
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MainScene]
};

console.log("main.js: Phaser Config Version 1.1 Loaded");
const game = new Phaser.Game(config);
