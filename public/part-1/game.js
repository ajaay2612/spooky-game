const playButton = document.getElementById('playButton');
const backButton = document.getElementById('backButton');
const mainScreen = document.getElementById('mainScreen');
const gameScreen = document.getElementById('gameScreen');

// Play button click
playButton.addEventListener('click', () => {
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
});

// Back button click
backButton.addEventListener('click', () => {
    gameScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
});

// Add some spooky effects
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎃 Halloween Game Loaded! 🎃');
});
