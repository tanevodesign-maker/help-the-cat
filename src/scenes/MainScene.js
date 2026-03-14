class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Load environment assets
        this.load.image('bg', 'assets/bg.png');
        this.load.image('grass', 'assets/grass.png');

        // Load characters & props
        this.load.image('dispenser', 'assets/dispenser_default.png');
        this.load.image('dispenser_success', 'assets/dispenser_success.png');
        this.load.image('dispenser_open', 'assets/dispenser_open.png');
        this.load.image('cat', 'assets/cat_sad.png');
        this.load.image('cat_back', 'assets/cat_back.png');
        this.load.image('cat_cry', 'assets/cat_cry.png');
        this.load.image('cat_happy', 'assets/cat_happy.png');
        this.load.image('failure_message', 'assets/failure_message.svg');
        this.load.image('start_message', 'assets/start_message.svg');
        this.load.image('pot', 'assets/pot_default.png');
        this.load.image('bowl', 'assets/bowl_default.png');
        this.load.image('book_green', 'assets/book_green_default.png');
        this.load.image('book_red', 'assets/book_red_default.png');
        this.load.image('can_empty', 'assets/can_empty_default.png');
        this.load.image('confetti', 'assets/confetti.png');
        this.load.image('success_card_default', 'assets/success_card_default.png');
        this.load.image('success_card_hover', 'assets/success_card_hover.png');
        this.load.image('success_card_pressed', 'assets/success_card_pressed.png');
        this.load.image('restart', 'assets/restart.svg');
        this.load.image('info', 'assets/info.svg');
        this.load.image('info_message', 'assets/info_message.svg');

        // Audio
        this.load.audio('bg_music', 'assets/backgrund_track.mp3');
        this.load.audio('click', 'assets/click.mp3');
        this.load.audio('meow', 'assets/meow.mp3');
        this.load.audio('success_snd', 'assets/sucess.mp3');

        // Load dragged state variants
        this.load.image('pot_dragged', 'assets/pot_dragged.png');
        this.load.image('bowl_dragged', 'assets/bowl_dragged.png');
        this.load.image('book_green_dragged', 'assets/book_green_dragged.png');
        this.load.image('book_red_dragged', 'assets/book_red_dragged_dragged.png');
        this.load.image('can_empty_dragged', 'assets/can_empty_dragged.png');
    }

    create() {
        console.log("MainScene.js: V2.1 Interaction & Layout Refinement Active");
        // Background: full screen, centered, depth 0
        this.add.image(960, 540, 'bg').setDisplaySize(1920, 1080).setDepth(0);

        // Start Background Music immediately (Note: Browsers may block this until first interaction)
        if (!this.sound.get('bg_music') || !this.sound.get('bg_music').isPlaying) {
            this.sound.play('bg_music', { loop: true, volume: 0.18 });
        }

        // Zones Setup
        this.add.zone(1120, 800, 400, 500).setRectangleDropZone(400, 500);

        // Objects (Depth 2)
        const dispenser = this.add.image(960, 540, 'dispenser').setDepth(2);
        this.dispenser = dispenser; // Global reference for success state
        const pot = this.add.image(1246.5, 793.5, 'pot').setDepth(2);
        const bowl = this.add.image(131, 905, 'bowl').setDepth(2);

        // Cat: depth 4.5 (In front of stack objects 3.x, behind grass 5)
        const cat = this.add.image(659, 804, 'cat').setDepth(4.5);
        this.cat = cat; // Assign to scene property for global reference
        cat.setData('originalX', 659);
        cat.setData('originalY', 804);
        cat.setData('onStack', false);
        cat.setData('isJumping', false);

        // Secondary Props
        const book_green = this.add.image(1766.5, 57.5, 'book_green').setDepth(1);
        const book_red = this.add.image(1736.5, 1043.5, 'book_red').setDepth(4); 
        const can_empty = this.add.image(444.4, 802.2, 'can_empty').setAngle(80).setDepth(4); 

        // Grass: foreground overlay at bottom, depth 5
        this.add.image(960, 1080, 'grass').setOrigin(0.5, 1).setDepth(5);

        // Set up interactive props
        const props = [
            { sprite: pot, defaultKey: 'pot', draggedKey: 'pot_dragged', isRotated: false },
            { sprite: bowl, defaultKey: 'bowl', draggedKey: 'bowl_dragged', isRotated: false },
            { sprite: book_green, defaultKey: 'book_green', draggedKey: 'book_green_dragged', isRotated: false },
            { sprite: book_red, defaultKey: 'book_red', draggedKey: 'book_red_dragged', isRotated: false },
            { sprite: can_empty, defaultKey: 'can_empty', draggedKey: 'can_empty_dragged', isRotated: true }
        ];

        // Track stacked objects and active tooltip
        this.stack = [];
        this.activeTooltip = null;
        this.tooltipTween = null;
        this.tooltipTimer = null;

        // Make dispenser interactive for success state
        this.dispenser.setInteractive();
        this.dispenser.on('pointerdown', () => {
            if (this.dispenser.texture.key === 'dispenser_success') {
                this.sound.play('click', { volume: 0.3 }); // Click sound for dispenser interaction
                this.dispenser.setTexture('dispenser_open');
                
                this.time.delayedCall(100, () => {
                    this.cat.setTexture('cat_happy');
                    this.dispenser.setTexture('dispenser');
                });

                this.time.delayedCall(200, () => {
                    this.sound.play('success_snd', { volume: 0.45 }); // Success sound at 0.45
                    this.createConfetti();
                });

                // Trigger success card shortly after confetti starts (600ms delay)
                this.time.delayedCall(600, () => {
                    this.showSuccessCard();
                });
            }
        });
        
        // Create Start Tooltip (floating guide)
        const startX = this.cat.x;
        const startY = this.cat.y - 140;
        this.startTooltip = this.add.image(startX, startY, 'start_message')
            .setOrigin(0.5)
            .setDepth(10);
            
        this.startTooltipTween = this.tweens.add({
            targets: this.startTooltip,
            y: startY - 8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        props.forEach(prop => {
            const s = prop.sprite;
            // Store original data
            s.setData('originalX', s.x);
            s.setData('originalY', s.y);
            s.setData('originalDepth', s.depth);
            s.setData('originalAngle', s.angle);
            s.setData('defaultKey', prop.defaultKey);
            s.setData('draggedKey', prop.draggedKey);
            s.setData('isStacked', false);

            // Create shadow effect
            const shadow = this.add.image(s.x, s.y + 3, s.texture.key)
                .setOrigin(0.5)
                .setTint(0x000000)
                .setAlpha(0)
                .setAngle(s.angle)
                .setDepth(s.depth - 0.01);
            s.setData('shadow', shadow);

            // Make interactive
            s.setInteractive({ draggable: true });

            s.on('pointerover', () => {
                this.tweens.add({
                    targets: shadow,
                    alpha: 0.18,
                    duration: 120
                });
            });

            s.on('pointerout', () => {
                this.tweens.add({
                    targets: shadow,
                    alpha: 0,
                    duration: 120
                });
            });
        });

        // Set up cat interaction (Click only, no drag)
        cat.setInteractive();

        cat.on('pointerdown', () => {
            this.sound.play('click', { volume: 0.3 }); // Click sound for cat interaction
            this.hideTooltip(); // Hide any existing tooltip instantly when clicking
            if (!this.cat.getData('isJumping') && !this.cat.getData('onStack')) {
                this.triggerCatJump(this.cat);
            }
        });
        
        // Set up drag events
        this.input.on('dragstart', (pointer, gameObject) => {
            // Dismiss start tooltip on first interaction
            if (this.startTooltip) {
                if (this.startTooltipTween) this.startTooltipTween.stop();
                this.startTooltip.destroy();
                this.startTooltip = null;
            }

            if (gameObject === cat) return; // Prevent cat drag
            this.sound.play('click', { volume: 0.3 }); // Click sound for drag start

            this.tweens.killTweensOf(gameObject);

            if (gameObject.getData('isStacked')) {
                gameObject.setData('isStacked', false);
                this.stack = this.stack.filter(item => item !== gameObject);
                this.rebuildStack();
            }

            gameObject.setTexture(gameObject.getData('draggedKey'));
            gameObject.setDepth(100);
            gameObject.setAngle(0);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === cat) return;
            gameObject.x = dragX;
            gameObject.y = dragY;

            const shadow = gameObject.getData('shadow');
            if (shadow) {
                shadow.x = dragX;
                shadow.y = dragY + 3;
                shadow.setDepth(gameObject.depth - 0.01);
                shadow.setAngle(gameObject.angle);
            }
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            if (gameObject === cat) return;
            gameObject.setTexture(gameObject.getData('defaultKey'));
            
            if (!dropped) {
                this.snapToOriginal(gameObject);
            }
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            this.resetCat(cat);
            gameObject.setData('isStacked', true);
            this.stack.push(gameObject);
            gameObject.setDepth(3 + this.stack.length * 0.1); 
            gameObject.setAngle(0);
            this.rebuildStack();
        });

        // Initialize HUD
        this.createHUD();
    }

    createHUD() {
        const { width, height } = this.scale;
        const padding = 24;
        const spacing = 16;
        const iconSize = 48;

        // Info Button (Far Right)
        const infoX = width - padding - (iconSize / 2);
        const infoY = height - padding - (iconSize / 2);
        const infoBtn = this.add.image(infoX, infoY, 'info')
            .setDisplaySize(iconSize, iconSize)
            .setDepth(25)
            .setInteractive({ useHandCursor: true });

        // Restart Button (Left of Info)
        const restartX = infoX - iconSize - spacing;
        const restartY = infoY;
        const restartBtn = this.add.image(restartX, restartY, 'restart')
            .setDisplaySize(iconSize, iconSize)
            .setDepth(25)
            .setInteractive({ useHandCursor: true });

        // Hover Tooltips
        this.setupHUDTooltip(restartBtn, 'Restart');
        this.setupHUDTooltip(infoBtn, 'Info');

        // Button Actions
        restartBtn.on('pointerdown', () => {
            this.sound.play('click', { volume: 0.3 });
            this.restartGame();
        });
        
        infoBtn.on('pointerdown', () => {
            this.sound.play('click', { volume: 0.3 });
            this.toggleInfoMessage(infoBtn);
        });

        // Click outside listener to close info message
        this.input.on('pointerdown', (pointer) => {
            if (this.infoMessage && !this.infoMessage.getBounds().contains(pointer.x, pointer.y) && !infoBtn.getBounds().contains(pointer.x, pointer.y)) {
                this.tweens.add({
                    targets: this.infoMessage,
                    alpha: 0,
                    duration: 120,
                    onComplete: () => {
                        if (this.infoMessage) {
                            this.infoMessage.destroy();
                            this.infoMessage = null;
                        }
                    }
                });
            }
        });
    }

    setupHUDTooltip(target, text) {
        const tooltip = this.add.text(target.x, target.y - 10, text, {
            fontSize: '16px',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5, 1)
        .setDepth(26)
        .setAlpha(0);

        target.on('pointerover', () => {
            this.tweens.add({
                targets: tooltip,
                alpha: 1,
                duration: 120
            });
        });

        target.on('pointerout', () => {
            this.tweens.add({
                targets: tooltip,
                alpha: 0,
                duration: 120
            });
        });
    }

    toggleInfoMessage(infoBtn) {
        if (this.infoMessage) {
            this.tweens.add({
                targets: this.infoMessage,
                alpha: 0,
                duration: 120,
                onComplete: () => {
                    if (this.infoMessage) {
                        this.infoMessage.destroy();
                        this.infoMessage = null;
                    }
                }
            });
            return;
        }

        const tooltipKey = 'info_message';
        const tooltipTexture = this.textures.get(tooltipKey).get();
        const tooltipWidth = tooltipTexture.width;
        const tooltipHeight = tooltipTexture.height;

        // Positioning: Right edge of tooltip = Right edge of info icon
        // Vertical spacing: 4px above the icon
        const iconBounds = infoBtn.getBounds();
        let targetX = iconBounds.right - (tooltipWidth / 2); // Center for origin 0.5
        let targetY = iconBounds.top - (tooltipHeight / 2) - 4;

        // Clamping X within screen bounds
        const screenWidth = this.scale.width;
        const margin = 12;
        targetX = Phaser.Math.Clamp(targetX, tooltipWidth / 2 + margin, screenWidth - (tooltipWidth / 2) - margin);

        this.infoMessage = this.add.image(targetX, targetY, tooltipKey)
            .setOrigin(0.5)
            .setDepth(30)
            .setAlpha(0);

        this.tweens.add({
            targets: this.infoMessage,
            alpha: 1,
            duration: 120
        });
    }

    snapToOriginal(gameObject) {
        gameObject.setData('isStacked', false);
        gameObject.setDepth(gameObject.getData('originalDepth'));
        
        const shadow = gameObject.getData('shadow');

        this.tweens.add({
            targets: gameObject,
            x: gameObject.getData('originalX'),
            y: gameObject.getData('originalY'),
            angle: gameObject.getData('originalAngle'),
            duration: 250,
            ease: 'Back.easeOut'
        });

        if (shadow) {
            shadow.setDepth(gameObject.getData('originalDepth') - 0.01);
            this.tweens.add({
                targets: shadow,
                x: gameObject.getData('originalX'),
                y: gameObject.getData('originalY') + 3,
                angle: gameObject.getData('originalAngle'),
                duration: 250,
                ease: 'Back.easeOut'
            });
        }
    }

    resetCat(cat) {
        if (cat && cat.getData('onStack')) {
            cat.setData('onStack', false);
            cat.setData('isJumping', false);
            cat.setTexture('cat');
            
            this.tweens.add({
                targets: cat,
                x: cat.getData('originalX'),
                y: cat.getData('originalY'),
                duration: 400,
                ease: 'Cubic.easeOut'
            });
        }
    }

    rebuildStack() {
        let currentY = 920; 
        const stackX = 1120;
        const verticalOffset = -12;

        this.stack.forEach((gameObject, index) => {
            const defaultKey = gameObject.getData('defaultKey');
            const defaultTextureHeight = this.textures.get(defaultKey).get().height;
            const targetY = currentY - (defaultTextureHeight / 2);
            
            this.tweens.add({
                targets: gameObject,
                x: stackX,
                y: targetY,
                angle: 0,
                duration: 200,
                ease: 'Quad.easeOut'
            });
            
            const shadow = gameObject.getData('shadow');
            if (shadow) {
                shadow.setDepth(3 + index * 0.1 - 0.01);
                this.tweens.add({
                    targets: shadow,
                    x: stackX,
                    y: targetY + 3,
                    angle: 0,
                    duration: 200,
                    ease: 'Quad.easeOut'
                });
            }
            
            this.sound.play('click', { volume: 0.3 }); // Click sound when item snaps to stack
            
            currentY = currentY - defaultTextureHeight - verticalOffset;
            gameObject.setDepth(3 + index * 0.1);
        });
    }

    triggerCatJump(cat) {
        if (this.stack.length === 0) return;

        cat.setData('isJumping', true);
        cat.setTexture('cat_back');

        let currentLevelTop = 920;
        const verticalOffset = -12;
        
        this.stack.forEach(gameObject => {
            const defaultKey = gameObject.getData('defaultKey');
            const defaultTextureHeight = this.textures.get(defaultKey).get().height;
            currentLevelTop = currentLevelTop - defaultTextureHeight - verticalOffset;
        });

        const catHeight = this.textures.get('cat_back').get().height;
        const targetX = 1120;
        const targetY = currentLevelTop - (catHeight / 2) + 24; 

        // Parabolic jump parameters
        const startX = cat.x;
        const startY = cat.y;
        const jumpHeight = 150;

        this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 600,
            onUpdate: (tween) => {
                const progress = tween.getValue();
                cat.x = startX + (targetX - startX) * progress;
                cat.y = startY + (targetY - startY) * progress - jumpHeight * Math.sin(progress * Math.PI);
            },
            onComplete: () => {
                // Success State Detection
                if (this.stack.length === 5) {
                    this.dispenser.setTexture('dispenser_success');
                    
                    this.time.delayedCall(500, () => {
                        const startReturnX = cat.x;
                        const startReturnY = cat.y;
                        const returnTargetX = cat.getData('originalX');
                        const returnTargetY = cat.getData('originalY');

                        this.tweens.addCounter({
                            from: 0,
                            to: 1,
                            duration: 600,
                            onUpdate: (t) => {
                                const p = t.getValue();
                                cat.x = startReturnX + (returnTargetX - startReturnX) * p;
                                cat.y = startReturnY + (returnTargetY - startReturnY) * p - jumpHeight * Math.sin(p * Math.PI);
                            },
                            onComplete: () => {
                                cat.setData('isJumping', false);
                                cat.setData('onStack', false);
                                // No tooltip on success
                            }
                        });
                    });
                } 
                // Failure Condition
                else if (this.stack.length < 5) {
                    this.time.delayedCall(500, () => {
                        // Start return jump and swap texture IMMEDIATELY
                        cat.setTexture('cat_cry');
                        this.sound.play('meow', { volume: 0.35 }); // Play meow on failure
                        
                        const startReturnX = cat.x;
                        const startReturnY = cat.y;
                        const returnTargetX = cat.getData('originalX');
                        const returnTargetY = cat.getData('originalY');

                        this.tweens.addCounter({
                            from: 0,
                            to: 1,
                            duration: 600,
                            onUpdate: (t) => {
                                const p = t.getValue();
                                cat.x = startReturnX + (returnTargetX - startReturnX) * p;
                                cat.y = startReturnY + (returnTargetY - startReturnY) * p - jumpHeight * Math.sin(p * Math.PI);
                            },
                            onComplete: () => {
                                cat.setData('isJumping', false);
                                cat.setData('onStack', false);
                                this.showTooltip(cat, "I still can't reach it!");
                            }
                        });
                    });
                } else {
                    cat.setData('isJumping', false);
                    cat.setData('onStack', true);
                }
            }
        });
    }

    showTooltip(target, message) {
        this.hideTooltip(); // Ensure only one exists at a time

        // Position failure_message script above head with -100px offset
        const originalWidth = this.textures.get('failure_message').get().width;
        const originalHeight = this.textures.get('failure_message').get().height;
        const bubble = this.add.image(target.x, target.y - 100, 'failure_message')
            .setOrigin(0.5)
            .setDepth(10)
            .setAlpha(0)
            .setDisplaySize(originalWidth - 2, originalHeight - 2);

        this.activeTooltip = bubble;

        this.tooltipTween = this.tweens.add({
            targets: bubble,
            alpha: 1,
            y: bubble.y - 20,
            duration: 300,
            onComplete: () => {
                this.tooltipTimer = this.time.delayedCall(2000, () => {
                    this.tooltipTween = this.tweens.add({
                        targets: bubble,
                        alpha: 0,
                        y: bubble.y - 20,
                        duration: 500,
                        onComplete: () => {
                            this.hideTooltip();
                        }
                    });
                });
            }
        });
    }

    hideTooltip() {
        if (this.tooltipTween) {
            this.tooltipTween.stop();
            this.tooltipTween = null;
        }
        if (this.tooltipTimer) {
            this.tooltipTimer.remove();
            this.tooltipTimer = null;
        }
        if (this.activeTooltip) {
            this.activeTooltip.destroy();
            this.activeTooltip = null;
        }
    }

    createConfetti() {
        const emitter = this.add.particles(0, -20, 'confetti', {
            x: { min: 0, max: 1920 },
            y: -20,
            lifespan: 3000,
            gravityY: 250,
            speedY: { min: 200, max: 280 },
            speedX: { min: -80, max: 80 },
            scale: { min: 0.4, max: 0.6 },
            rotate: { min: 0, max: 360 },
            alpha: { start: 1, end: 0 },
            emitting: false // Triggered by explode()
        });

        // Depth 6 to be above everything (grass is 5)
        emitter.setDepth(6);

        // One-time burst of 10 pieces
        emitter.explode(10);

        // Destroy the emitter after particles have finished
        this.time.delayedCall(4000, () => {
            emitter.destroy();
        });
    }

    showSuccessCard() {
        if (this.successCard) return;

        const { width, height } = this.scale;

        // Create background dim overlay (depth: 15)
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000)
            .setDepth(15)
            .setAlpha(0)
            .setInteractive(); // Blocks interaction with game scene

        this.tweens.add({
            targets: this.overlay,
            alpha: 0.7,
            duration: 200
        });

        // Create soft shadow layer (depth: 17, offset Y: 12, alpha: 0.25)
        this.cardShadow = this.add.image(width / 2, height / 2 + 12, 'success_card_default')
            .setOrigin(0.5)
            .setDepth(17)
            .setTint(0x000000)
            .setAlpha(0)
            .setScale(0);

        const card = this.add.image(width / 2, height / 2, 'success_card_default')
            .setOrigin(0.5)
            .setDepth(20)
            .setInteractive()
            .setScale(0)
            .setAlpha(0);

        this.successCard = card;

        // Bounce entrance animation: scale 0 -> 1.1 -> 1, alpha 0 -> 1
        this.tweens.add({
            targets: [card, this.cardShadow],
            scaleX: 1,
            scaleY: 1,
            alpha: { from: 0, to: (target) => target === card ? 1 : 0.25 },
            duration: 280,
            ease: 'Back.Out'
        });

        // Hover states
        card.on('pointerover', () => card.setTexture('success_card_hover'));
        card.on('pointerout', () => card.setTexture('success_card_default'));
        
        // Pressed state
        card.on('pointerdown', () => card.setTexture('success_card_pressed'));
        
        // Click action
        card.on('pointerup', () => {
            this.sound.play('click', { volume: 0.3 });
            this.restartGame();
        });
    }

    restartGame() {
        // Clear success card, shadow, and overlay
        if (this.successCard) {
            this.successCard.destroy();
            this.successCard = null;
        }
        if (this.cardShadow) {
            this.cardShadow.destroy();
            this.cardShadow = null;
        }
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        // Reset all stacked objects and shadows
        [...this.stack].forEach(obj => {
            this.snapToOriginal(obj);
        });
        this.stack = [];

        // Ensure all shadows are invisible across all props
        this.children.list.forEach(child => {
            if (child.getData && child.getData('shadow')) {
                const shadow = child.getData('shadow');
                this.tweens.add({
                    targets: shadow,
                    alpha: 0,
                    duration: 120
                });
            }
        });

        // Reset Cat
        this.cat.setTexture('cat');
        this.cat.setData('onStack', false);
        this.cat.setData('isJumping', false);
        this.tweens.add({
            targets: this.cat,
            x: this.cat.getData('originalX'),
            y: this.cat.getData('originalY'),
            duration: 400,
            ease: 'Cubic.easeOut'
        });

        // Reset Dispenser
        this.dispenser.setTexture('dispenser');

        // Hide any remaining tooltips/UI
        this.hideTooltip();
        if (this.infoMessage) {
            this.infoMessage.destroy();
            this.infoMessage = null;
        }
    }

    update() {}
}
