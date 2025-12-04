// Top-Down Shooter Game Implementation

function initShooterGame() {
    const container = document.getElementById('gameContainer');
    const player = document.getElementById('shooterPlayer');
    const zombiesContainer = document.getElementById('shooterZombies');
    const scoreDisplay = document.getElementById('shooterScore');
    const gameOverScreen = document.getElementById('shooterGameOver');
    
    // Clear previous game
    zombiesContainer.innerHTML = '';
    gameOverScreen.style.display = 'none';
    
    shooterGame = {
        running: true,
        score: 0,
        player: {
            x: 250,
            y: 250,
            size: 40,
            speed: 5
        },
        zombies: [],
        zombieSpawnTimer: 0,
        zombieSpawnInterval: 60,
        keys: {},
        mouseX: 250,
        mouseY: 250
    };
    
    // Position player
    player.style.left = shooterGame.player.x + 'px';
    player.style.top = shooterGame.player.y + 'px';
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        shooterGame.keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        shooterGame.keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse movement for aiming
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        shooterGame.mouseX = e.clientX - rect.left;
        shooterGame.mouseY = e.clientY - rect.top;
        updatePlayerRotation();
    });
    
    // Touch movement for mobile
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        shooterGame.mouseX = touch.clientX - rect.left;
        shooterGame.mouseY = touch.clientY - rect.top;
        
        // Move player towards touch
        const dx = shooterGame.mouseX - shooterGame.player.x;
        const dy = shooterGame.mouseY - shooterGame.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            shooterGame.player.x += (dx / distance) * shooterGame.player.speed;
            shooterGame.player.y += (dy / distance) * shooterGame.player.speed;
        }
        
        updatePlayerRotation();
    });
    
    // Click/Tap to shoot
    container.addEventListener('click', shootZombie);
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        shooterGame.mouseX = touch.clientX - rect.left;
        shooterGame.mouseY = touch.clientY - rect.top;
        shootZombie(e);
    });
    
    // Start game loop
    shooterGameLoop();
}

function updatePlayerRotation() {
    const player = document.getElementById('shooterPlayer');
    const dx = shooterGame.mouseX - shooterGame.player.x;
    const dy = shooterGame.mouseY - shooterGame.player.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    player.style.transform = `rotate(${angle + 90}deg)`;
}

function shootZombie(e) {
    if (!shooterGame.running) return;
    
    const clickX = shooterGame.mouseX;
    const clickY = shooterGame.mouseY;
    
    // Check if clicked on a zombie
    for (let i = shooterGame.zombies.length - 1; i >= 0; i--) {
        const zombie = shooterGame.zombies[i];
        const dx = clickX - zombie.x;
        const dy = clickY - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
            // Hit!
            zombie.element.remove();
            shooterGame.zombies.splice(i, 1);
            shooterGame.score += 10;
            scoreDisplay.textContent = 'Score: ' + shooterGame.score;
            
            // Visual feedback
            createBloodSplatter(zombie.x, zombie.y);
            return;
        }
    }
}

function createBloodSplatter(x, y) {
    const splatter = document.createElement('div');
    splatter.className = 'blood-splatter';
    splatter.style.left = x + 'px';
    splatter.style.top = y + 'px';
    document.getElementById('shooterZombies').appendChild(splatter);
    
    setTimeout(() => splatter.remove(), 500);
}

function spawnZombie() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    // Spawn from random side
    switch(side) {
        case 0: // Top
            x = Math.random() * 500;
            y = -30;
            break;
        case 1: // Right
            x = 530;
            y = Math.random() * 500;
            break;
        case 2: // Bottom
            x = Math.random() * 500;
            y = 530;
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * 500;
            break;
    }
    
    const zombie = document.createElement('div');
    zombie.className = 'shooter-zombie';
    zombie.style.left = x + 'px';
    zombie.style.top = y + 'px';
    zombie.textContent = '🧟';
    
    document.getElementById('shooterZombies').appendChild(zombie);
    
    shooterGame.zombies.push({
        element: zombie,
        x: x,
        y: y,
        speed: 1 + Math.random() * 0.5
    });
}

function checkZombieCollision() {
    const player = shooterGame.player;
    
    for (let zombie of shooterGame.zombies) {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
            gameOverShooter();
            return true;
        }
    }
    return false;
}

function gameOverShooter() {
    shooterGame.running = false;
    const gameOverScreen = document.getElementById('shooterGameOver');
    gameOverScreen.style.display = 'flex';
    gameOverScreen.querySelector('.game-over-score').textContent = 'Score: ' + shooterGame.score;
    
    setTimeout(() => {
        gameOverScreen.addEventListener('click', () => {
            initShooterGame();
        }, { once: true });
    }, 100);
}

function shooterGameLoop() {
    if (!shooterGame.running) return;
    
    const player = document.getElementById('shooterPlayer');
    
    // Move player with WASD or Arrow keys
    if (shooterGame.keys['w'] || shooterGame.keys['arrowup']) {
        shooterGame.player.y = Math.max(0, shooterGame.player.y - shooterGame.player.speed);
    }
    if (shooterGame.keys['s'] || shooterGame.keys['arrowdown']) {
        shooterGame.player.y = Math.min(460, shooterGame.player.y + shooterGame.player.speed);
    }
    if (shooterGame.keys['a'] || shooterGame.keys['arrowleft']) {
        shooterGame.player.x = Math.max(0, shooterGame.player.x - shooterGame.player.speed);
    }
    if (shooterGame.keys['d'] || shooterGame.keys['arrowright']) {
        shooterGame.player.x = Math.min(460, shooterGame.player.x + shooterGame.player.speed);
    }
    
    player.style.left = shooterGame.player.x + 'px';
    player.style.top = shooterGame.player.y + 'px';
    
    // Spawn zombies
    shooterGame.zombieSpawnTimer++;
    if (shooterGame.zombieSpawnTimer > shooterGame.zombieSpawnInterval) {
        spawnZombie();
        shooterGame.zombieSpawnTimer = 0;
        // Increase difficulty
        shooterGame.zombieSpawnInterval = Math.max(30, shooterGame.zombieSpawnInterval - 0.5);
    }
    
    // Move zombies towards player
    for (let zombie of shooterGame.zombies) {
        const dx = shooterGame.player.x - zombie.x;
        const dy = shooterGame.player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            zombie.x += (dx / distance) * zombie.speed;
            zombie.y += (dy / distance) * zombie.speed;
            
            zombie.element.style.left = zombie.x + 'px';
            zombie.element.style.top = zombie.y + 'px';
            
            // Rotate zombie to face player
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            zombie.element.style.transform = `rotate(${angle + 90}deg)`;
        }
    }
    
    // Check collisions
    if (checkZombieCollision()) {
        return;
    }
    
    requestAnimationFrame(shooterGameLoop);
}
