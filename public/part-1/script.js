const chatMessages = document.getElementById('chatMessages');
const centerContent = document.getElementById('centerContent');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let conversationData = null;
let currentConversationIndex = 0;
let isTyping = false;
let kiroCorrupted = false; // Track if Kiro has turned red

// Music elements
const introMusic = document.getElementById('introMusic');

// Check if we should show Kiroween ending screen
const urlParams = new URLSearchParams(window.location.search);
const isEndingScreen = urlParams.get('showKiroween') === 'true';

if (isEndingScreen) {
    // Show only the Kiroween content - STAY ON THIS SCREEN (ending)
    window.addEventListener('load', () => {
        const titleContent = document.getElementById('titleContent');
        const kiroweenContent = document.getElementById('kiroweenContent');
        const kiroweenImg = kiroweenContent.querySelector('.kiroween-img');
        
        titleContent.style.display = 'none';
        kiroweenContent.style.display = 'flex';
        kiroweenImg.style.opacity = '1'; // Show immediately, no animation
        
        console.log('✓ Showing Kiroween ending screen (permanent)');
    });
} else {
    // Normal Part 1 flow - Try to start music on page load
    window.addEventListener('load', () => {
        if (introMusic) {
            introMusic.volume = 0.5;
            introMusic.play().catch(e => {
                console.log('Autoplay blocked, will play on user interaction');
                // If autoplay is blocked, play on first user interaction
                document.addEventListener('click', () => {
                    introMusic.play().catch(err => console.log('Music play failed:', err));
                }, { once: true });
            });
        }
    });
}

// Title Screen Functions
function startGame() {
    // Don't run if this is the ending screen
    if (isEndingScreen) {
        console.log('Ending screen - startGame() blocked');
        return;
    }
    
    const titleContent = document.getElementById('titleContent');
    const kiroweenContent = document.getElementById('kiroweenContent');
    const kiroweenImg = kiroweenContent.querySelector('.kiroween-img');
    
    // Hide title content
    titleContent.style.display = 'none';
    
    // Show Kiroween content with image starting invisible
    kiroweenContent.style.display = 'flex';
    kiroweenImg.style.opacity = '0';
    
    // Start glitch animation after 3 second delay
    setTimeout(() => {
        kiroweenImg.classList.add('glitch');
        kiroweenImg.style.opacity = '1';
    }, 3000);
    
    // Glitch out image after 6.5 seconds
    setTimeout(() => {
        kiroweenImg.classList.remove('glitch');
        kiroweenImg.classList.add('glitch-out');
    }, 6500);
    
    // Switch to disclaimer after 7.5 seconds (after fade out completes)
    setTimeout(() => {
        showDisclaimer();
    }, 7500);
}

function showDisclaimer() {
    const kiroweenContent = document.getElementById('kiroweenContent');
    const disclaimerContent = document.getElementById('disclaimerContent');
    const disclaimerTitle = disclaimerContent.querySelector('.disclaimer-title');
    const disclaimerText = disclaimerContent.querySelector('.disclaimer-text');
    
    // Hide Kiroween content
    kiroweenContent.style.display = 'none';
    
    // Show disclaimer content
    disclaimerContent.style.display = 'flex';
    disclaimerTitle.style.opacity = '0';
    disclaimerText.style.opacity = '0';
    
    // Glitch in both title and text at the same time after 1 second delay
    setTimeout(() => {
        disclaimerTitle.classList.add('glitch');
        disclaimerTitle.style.opacity = '0.5';
        disclaimerText.classList.add('glitch');
        disclaimerText.style.opacity = '0.5';
    }, 1000);
    
    // Glitch out disclaimer after 11 seconds
    setTimeout(() => {
        disclaimerTitle.classList.remove('glitch');
        disclaimerTitle.classList.add('glitch-out');
        disclaimerText.classList.remove('glitch');
        disclaimerText.classList.add('glitch-out');
    }, 11000);
    
    // Start chat after 13 seconds total (after fade out completes)
    setTimeout(() => {
        startChat();
    }, 13000);
}

function startChat() {
    const introContainer = document.getElementById('introContainer');
    
    // Fade out intro container
    introContainer.style.opacity = '0';
    
    // After fade completes, hide and show main content
    setTimeout(() => {
        introContainer.style.display = 'none';
        
        // Show main content
        document.querySelector('.sidebar').style.display = 'flex';
        document.querySelector('.main-content').style.display = 'flex';
        
        // Start the conversation with initial delay from config
        const delay = conversationData?.initialDelay || 500;
        setTimeout(() => {
            playNextConversation();
        }, delay);
    }, 1000);
}



// Load conversation data
async function loadConversation() {
    try {
        const response = await fetch('conversation.json');
        conversationData = await response.json();
        console.log('Conversation loaded:', conversationData);
    } catch (error) {
        console.error('Error loading conversation:', error);
        // Fallback conversation
        conversationData = {
            typingSpeed: 50,
            responseDelay: 800,
            conversations: [
                {
                    user: "Hello! Can you help me?",
                    bot: "Of course! I'd be happy to help you. What do you need?"
                }
            ]
        };
    }
}

// Type text character by character
async function typeText(text, element, speed, glitchy = false, colorGlitch = false) {
    return new Promise(async (resolve) => {
        element.innerHTML = '';
        
        if (glitchy) {
            element.classList.add('glitch-text');
        }
        
        // Get the message container
        const messageContainer = element.closest('.message');
        
        // Glitch characters pool
        const glitchChars = ['$', '#', '%', '@', '&', '*', '!', '?', '~', '^', '|', '{', '}', '<', '>'];
        

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Wrap in span for color glitch
            if (colorGlitch) {
                const span = document.createElement('span');
                span.className = 'char-glitch';
                
                // Random color glitch on some characters (30% chance)
                if (char !== ' ' && char !== '\n' && Math.random() < 0.3) {
                    span.classList.add('red');
                    console.log('Color glitch applied:', char, 'red');
                }
                
                span.textContent = char;
                element.appendChild(span);
            } else if (glitchy && char !== ' ' && char !== '\n' && Math.random() < 0.25) {
                // Show random glitch character first
                const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                const tempText = document.createTextNode(glitchChar);
                element.appendChild(tempText);
                
                // Force update
                if (messageContainer) {
                    void messageContainer.offsetHeight;
                }
                
                requestAnimationFrame(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                });
                
                // Wait a bit then replace with real character
                await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
                
                // Replace glitch char with real char
                element.removeChild(tempText);
                element.appendChild(document.createTextNode(char));
            } else {
                element.appendChild(document.createTextNode(char));
            }
            
            // Force the message container to recalculate its size
            if (messageContainer) {
                void messageContainer.offsetHeight;
            }
            
            // Scroll chat messages to bottom
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
            

            // Variable speed for glitchy effect
            let delay = speed;
            if (glitchy && Math.random() < 0.15) {
                delay = speed + Math.random() * 300; // Random pause
            }
            
            await new Promise(r => setTimeout(r, delay));
        }
        
        resolve();
    });
}

// Show processing animation
function showProcessing() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = 'processing-message';
    
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'avatar-wrapper';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '';
    
    const kiroLabel = document.createElement('div');
    kiroLabel.className = 'kiro-label';
    kiroLabel.textContent = 'Kiro';
    
    avatarWrapper.appendChild(avatar);
    avatarWrapper.appendChild(kiroLabel);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const processing = document.createElement('div');
    processing.className = 'processing';
    processing.textContent = 'Thinking';
    
    content.appendChild(processing);
    messageDiv.appendChild(avatarWrapper);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Remove processing animation
function removeProcessing() {
    const processingMsg = document.getElementById('processing-message');
    if (processingMsg) {
        processingMsg.remove();
    }
}

// Add message to chat
async function addMessage(text, isUser = false, animate = true) {
    // Hide center content and show chat messages on first message
    if (centerContent.style.display !== 'none') {
        centerContent.style.display = 'none';
        chatMessages.style.display = 'flex';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    // Add Kiro label and avatar for bot messages only
    if (!isUser) {
        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'avatar-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '';
        
        // Check if this message is "No" to trigger corruption
        if (text === 'No') {
            kiroCorrupted = true;
            console.log('Kiro corrupted! Turning red.');
        }
        
        // Make avatar red if Kiro is corrupted
        if (kiroCorrupted) {
            avatar.classList.add('red-avatar');
            console.log('Red avatar applied for:', text.substring(0, 20));
        }
        
        const kiroLabel = document.createElement('div');
        kiroLabel.className = 'kiro-label';
        kiroLabel.textContent = 'Kiro';
        
        avatarWrapper.appendChild(avatar);
        avatarWrapper.appendChild(kiroLabel);
        messageDiv.appendChild(avatarWrapper);
        

    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    if (animate) {
        // Enable character glitch for horror messages (after conversation index 0)
        const isHorrorMessage = !isUser && currentConversationIndex > 0;
        // Enable color glitch after "Kiro...?" (conversation index 2 and onwards)
        const hasColorGlitch = !isUser && currentConversationIndex >= 2;
        
        console.log('Typing message:', text.substring(0, 30), 'Glitchy:', isHorrorMessage, 'ColorGlitch:', hasColorGlitch, 'Index:', currentConversationIndex);
        await typeText(text, content, conversationData.typingSpeed, isHorrorMessage, hasColorGlitch);
        
        // Trigger black screen AFTER "I'm taking you somewhere" finishes typing
        if (text.includes("I'm taking you somewhere")) {
            // Wait a moment after typing completes
            await new Promise(r => setTimeout(r, 1000));
            
            // Stop music
            if (introMusic) {
                introMusic.pause();
                introMusic.currentTime = 0;
            }
            
            // Instant black screen (no fade)
            const blackScreen = document.createElement('div');
            blackScreen.id = 'blackScreen';
            blackScreen.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                z-index: 10000;
                opacity: 1;
            `;
            document.body.appendChild(blackScreen);
            
            // Send completion message to parent to remove iframe and show Babylon.js
            console.log('🎮 Part 1 complete - sending message to parent');
            window.parent.postMessage({ type: 'part1Complete' }, '*');
        }
    } else {
        content.textContent = text;
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Chromatic aberration screen glitch effect
function startChromaticGlitch() {
    // Trigger glitch randomly with 70% chance (high percentage)
    const triggerGlitch = () => {
        if (Math.random() < 0.7) {
            // Trigger 3 times in quick succession
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    document.body.classList.add('chromatic-glitch');
                    
                    // Remove class after animation completes (0.2s)
                    setTimeout(() => {
                        document.body.classList.remove('chromatic-glitch');
                    }, 200);
                }, i * 300); // 300ms between each glitch
            }
        }
        
        // Schedule next potential glitch (random interval between 1-3 seconds)
        const nextGlitchDelay = 1000 + Math.random() * 2000;
        setTimeout(triggerGlitch, nextGlitchDelay);
    };
    
    // Start the glitch cycle
    triggerGlitch();
}

// Glitch previous messages randomly
function glitchPreviousMessages() {
    const allMessages = chatMessages.querySelectorAll('.message.bot .message-content');
    const glitchChars = ['$', '#', '%', '@', '&', '*', '!', '?', '~', '^', '|', '{', '}', '<', '>'];
    
    setInterval(() => {
        // Pick random message
        if (allMessages.length > 0) {
            const randomMsg = allMessages[Math.floor(Math.random() * allMessages.length)];
            const text = randomMsg.textContent;
            
            if (text && text.length > 0) {
                // Random color glitch
                if (Math.random() < 0.3) {
                    randomMsg.classList.add('color-glitch');
                    setTimeout(() => randomMsg.classList.remove('color-glitch'), 300);
                }
                
                // Random character glitch
                if (Math.random() < 0.2) {
                    const randomIndex = Math.floor(Math.random() * text.length);
                    if (text[randomIndex] !== ' ' && text[randomIndex] !== '\n') {
                        const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                        const newText = text.substring(0, randomIndex) + glitchChar + text.substring(randomIndex + 1);
                        randomMsg.textContent = newText;
                        
                        // Restore original after a moment
                        setTimeout(() => {
                            randomMsg.textContent = text;
                        }, 100 + Math.random() * 200);
                    }
                }
            }
        }
    }, 800 + Math.random() * 1200); // Random interval between glitches
}

// Simulate typing in input field
async function typeInInput(text, speed) {
    return new Promise((resolve) => {
        let index = 0;
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height
        
        const interval = setInterval(() => {
            if (index < text.length) {
                messageInput.value += text[index];
                index++;
                // Manually trigger resize after each character
                autoExpandTextarea();
            } else {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

// Play next conversation
async function playNextConversation() {
    if (!conversationData || isTyping) return;
    
    if (currentConversationIndex >= conversationData.conversations.length) {
        console.log('All conversations completed');
        return;
    }
    
    isTyping = true;
    const conversation = conversationData.conversations[currentConversationIndex];
    
    // Handle multiple user messages if user is an array
    const userMessages = Array.isArray(conversation.user) ? conversation.user : [conversation.user];
    
    for (const userMsg of userMessages) {
        // Type user message in input
        await typeInInput(userMsg, conversationData.typingSpeed);
        
        // Wait a bit before "sending"
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        await addMessage(userMsg, true, false);
        
        // Start chromatic aberration after "Kiro...?" message (conversation index 2)
        if (currentConversationIndex === 2 && userMsg.includes('Kiro')) {
            startChromaticGlitch();
        }
        
        // Small delay between multiple user messages
        if (userMessages.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }
    
    // Show processing animation
    showProcessing();
    
    // Wait before bot response (1.2x longer if game is true)
    const delay = conversation.game === true ? conversationData.responseDelay * 1.2 : conversationData.responseDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Remove processing and add bot response with typing animation
    removeProcessing();
    
    // Check if we need to create the Halloween game based on "game" flag
    if (conversation.game === true) {
        // Create combined message with bot text, files, and game
        await createGameMessage(conversation);
    } else {
        // Handle bot messages (can be string or array)
        const botMessages = Array.isArray(conversation.bot) ? conversation.bot : [conversation.bot];
        
        for (const botMsg of botMessages) {
            await addMessage(botMsg, false, true);
            
            // Small delay between multiple bot messages
            if (botMessages.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }
    }
    
    // Check if we just finished the game dialogue (index 0)
    // If so, don't auto-play next conversation - wait for game requirement
    const shouldPauseForGame = currentConversationIndex === 0 && !gameRequirementMet;
    
    currentConversationIndex++;
    isTyping = false;
    
    // Auto-play next conversation after a delay (unless paused for game)
    if (currentConversationIndex < conversationData.conversations.length && !shouldPauseForGame) {
        setTimeout(() => playNextConversation(), 2000);
    }
}

// Create combined game message with bot text, files, and game
async function createGameMessage(conversation) {
    
    // Create single bot message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'avatar-wrapper';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '';
    
    const kiroLabel = document.createElement('div');
    kiroLabel.className = 'kiro-label';
    kiroLabel.textContent = 'Kiro';
    
    avatarWrapper.appendChild(avatar);
    avatarWrapper.appendChild(kiroLabel);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Add bot text first
    const botText = document.createElement('div');
    botText.style.marginBottom = '12px';
    content.appendChild(botText);
    
    messageDiv.appendChild(avatarWrapper);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Type bot text
    await typeText(conversation.bot, botText, conversationData.typingSpeed);
    
    // Add file creation bars if files are defined
    if (conversation.files && conversation.files.length > 0) {
        for (const file of conversation.files) {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Get file icon based on extension
            let fileIcon = '📄';
            if (file.name.endsWith('.html')) {
                fileIcon = '<>';
            } else if (file.name.endsWith('.css')) {
                fileIcon = '#';
            } else if (file.name.endsWith('.js')) {
                fileIcon = 'JS';
            }
            
            const fileBar = document.createElement('div');
            fileBar.className = 'file-creation-bar';
            fileBar.innerHTML = `
                <span class="file-icon">${fileIcon}</span>
                <span class="file-name">${file.name}</span>
            `;
            
            content.appendChild(fileBar);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Add text below file bar
            await new Promise(resolve => setTimeout(resolve, 200));
            const fileText = document.createElement('div');
            fileText.style.marginBottom = '12px';
            fileText.style.marginTop = '8px';
            content.appendChild(fileText);
            await typeText(file.text, fileText, conversationData.typingSpeed);
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    
    // Add game embed at the end
    await new Promise(resolve => setTimeout(resolve, 500));
    await addGameEmbed(content);
}

// Add game embed to existing content
async function addGameEmbed(contentElement) {
    // Create a wrapper div for the game embed
    const gameWrapper = document.createElement('div');
    gameWrapper.style.marginTop = '12px';
    
    // Create the game embed structure
    const gameEmbed = document.createElement('div');
    gameEmbed.className = 'game-embed';
    
    const gameFrame = document.createElement('div');
    gameFrame.className = 'game-frame';
    
    const codePreview = document.createElement('div');
    codePreview.id = 'codePreview';
    codePreview.className = 'code-preview';
    codePreview.onclick = openGamePopup;
    
    // Create header first
    const codeHeader = document.createElement('div');
    codeHeader.className = 'code-header';
    codeHeader.innerHTML = `
        <span class="code-lang">JAVASCRIPT</span>
        <span class="code-filename">candy-game.js</span>
    `;
    
    // Create content (initially hidden)
    const codeContent = document.createElement('div');
    codeContent.className = 'code-content';
    codeContent.style.maxHeight = '0';
    codeContent.style.overflow = 'hidden';
    codeContent.style.transition = 'max-height 0.5s ease-out';
    codeContent.innerHTML = `
        <div class="code-line"><span class="code-comment">// 🍬 CANDY COLLECTING GAME</span></div>
        <div class="code-line"><span class="code-keyword">const</span> <span class="code-variable">game</span> = {</div>
        <div class="code-line">  <span class="code-property">mode:</span> <span class="code-string">'candy'</span>,</div>
        <div class="code-line">  <span class="code-property">controls:</span> <span class="code-string">'WASD / Arrow Keys'</span>,</div>
        <div class="code-line">  <span class="code-property">objective:</span> <span class="code-string">'Collect candies...'</span>,</div>
        <div class="code-line">  <span class="code-property">lives:</span> <span class="code-number">3</span>,</div>
        <div class="code-line">  <span class="code-property">enemies:</span> [<span class="code-string">'🕷️'</span>, <span class="code-string">'🕸️'</span>]</div>
        <div class="code-line">};</div>
    `;
    
    // Create play button (initially hidden)
    const playButton = document.createElement('div');
    playButton.className = 'play-button';
    playButton.style.display = 'none';
    playButton.innerHTML = `
        <span class="play-icon">▶</span>
        <p>Play Game</p>
    `;
    
    // Assemble structure
    codePreview.appendChild(codeHeader);
    codePreview.appendChild(codeContent);
    codePreview.appendChild(playButton);
    gameFrame.appendChild(codePreview);
    gameEmbed.appendChild(gameFrame);
    gameWrapper.appendChild(gameEmbed);
    contentElement.appendChild(gameWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Animate expansion after a short delay
    await new Promise(resolve => setTimeout(resolve, 300));
    codeContent.style.maxHeight = '300px';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show play button after code content is revealed
    await new Promise(resolve => setTimeout(resolve, 500));
    playButton.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Popup control functions
// Track game plays
let gamePlayCount = 0;
let gameRequirementMet = false;

function openGamePopup() {
    const popup = document.getElementById('gamePopup');
    if (!popup) {
        console.error('Game popup not found');
        return;
    }
    
    // Reset counter only on first open
    if (!gameRequirementMet) {
        gamePlayCount = 0;
    }
    
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Show main screen, hide game screen
    const mainScreen = document.getElementById('popupMainScreen');
    const gameContainer = document.getElementById('popupGameContainer');
    mainScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
    
    // Animate frames infinitely with 100ms delay
    const animatedFrame = document.getElementById('popupAnimatedFrame');
    let currentFrame = 1;
    let frameInterval;
    
    const animateFrames = () => {
        frameInterval = setInterval(() => {
            currentFrame++;
            if (currentFrame > 3) {
                currentFrame = 1;
            }
            animatedFrame.src = `assets/game/FRAME${currentFrame}.png`;
        }, 100);
    };
    
    animateFrames();
    
    // Add click handler to start game
    mainScreen.onclick = () => {
        clearInterval(frameInterval);
        startPopupGame();
    };
}

function startPopupGame() {
    // Hide main screen, show game screen
    const mainScreen = document.getElementById('popupMainScreen');
    const gameContainer = document.getElementById('popupGameContainer');
    mainScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Initialize the game
    setTimeout(() => {
        initCandyGame();
    }, 100);
}

function closeGamePopup() {
    const popup = document.getElementById('gamePopup');
    if (!popup) return;
    
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop game if running
    if (typeof candyGame !== 'undefined' && candyGame) {
        candyGame.running = false;
    }
    
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    

    
    // Clear game elements
    const itemsContainer = document.getElementById('candyItems');
    const grassContainer = document.getElementById('candyGrass');
    const winScreen = document.getElementById('candyWin');
    const loseScreen = document.getElementById('candyLose');
    
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (grassContainer) grassContainer.innerHTML = '';
    if (winScreen) winScreen.style.display = 'none';
    if (loseScreen) loseScreen.style.display = 'none';
    
    // Reset to main screen
    const mainScreen = document.getElementById('popupMainScreen');
    const gameContainer = document.getElementById('popupGameContainer');
    if (mainScreen) mainScreen.style.display = 'flex';
    if (gameContainer) gameContainer.style.display = 'none';
    
    // Remove black screen if it exists
    const blackScreen = document.getElementById('blackScreen');
    if (blackScreen) {
        blackScreen.remove();
    }
    
    // Check if game requirement is met and continue conversation
    if (gameRequirementMet && !isTyping) {
        setTimeout(() => {
            playNextConversation();
        }, 1000);
    }
}

// Game control functions
function startEmbeddedGame() {
    document.querySelector('.main-screen-embed').style.display = 'none';
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'block';
    initDOMGame();
}

function backToMainEmbed() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'none';
    document.querySelector('.main-screen-embed').style.display = 'flex';
    if (candyGame) {
        candyGame.running = false;
    }
}

function initCandyGame() {
    const gameContainer = document.getElementById('popupGameContainer');
    const player = document.getElementById('candyPlayer');
    const itemsContainer = document.getElementById('candyItems');
    const grassContainer = document.getElementById('candyGrass');
    const scoreDisplay = document.getElementById('candyScore');
    const winScreen = document.getElementById('candyWin');
    const wasdControls = document.getElementById('wasdControls');
    
    // Get container dimensions
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    // Clear previous game
    itemsContainer.innerHTML = '';
    grassContainer.innerHTML = '';
    const skeletonsContainer = document.getElementById('candySkeletons');
    if (skeletonsContainer) skeletonsContainer.innerHTML = '';
    winScreen.style.display = 'none';
    
    // Reset player sprite back to character
    player.style.backgroundImage = 'url(assets/game/main_character.png)';
    player.style.width = '120px';
    player.style.height = '120px';
    
    candyGame = {
        running: true,
        score: 0,
        targetScore: 5,
        containerWidth: containerWidth,
        containerHeight: containerHeight,
        player: {
            x: containerWidth / 2 - 60,
            y: containerHeight / 2,
            size: 120,
            speed: 5,
            direction: 1, // 1 for right, -1 for left
            bounceOffset: 0,
            bounceSpeed: 0,
            health: 3,
            invincible: false
        },
        items: [],
        skeletons: [],
        keys: {}
    };
    
    // Position player
    player.style.left = candyGame.player.x + 'px';
    player.style.top = candyGame.player.y + 'px';
    
    // Create grass decorations - spread evenly across the entire game area
    const grassPositions = [];
    const numGrassPatches = 80; // Many more grass patches
    
    // Create a grid-based distribution for even spread
    const gridSize = 10; // 10x10 grid
    const cellWidth = containerWidth / gridSize;
    const cellHeight = containerHeight / gridSize;
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            // Skip some cells randomly for natural look
            if (Math.random() > 0.6) continue;
            
            const grassType = Math.random() > 0.5 ? 1 : 2;
            const x = col * cellWidth + Math.random() * (cellWidth - 30) + 10;
            const y = row * cellHeight + Math.random() * (cellHeight - 30) + 10;
            
            const grass = document.createElement('div');
            grass.className = 'grass-decoration';
            grass.style.backgroundImage = `url(assets/game/grass${grassType}.png)`;
            grass.style.left = x + 'px';
            grass.style.top = y + 'px';
            grassContainer.appendChild(grass);
        }
    }
    
    // Spawn candies and donuts below hair (30% from top)
    const hairHeight = containerHeight * 0.3;
    const itemTypes = ['assets/game/candy1.png', 'assets/game/candy2.png', 'assets/game/donut1.png', 'assets/game/donut2.png'];
    for (let i = 0; i < 5; i++) {
        const item = document.createElement('div');
        item.className = 'candy-item';
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        item.style.backgroundImage = `url(${itemType})`;
        item.style.left = Math.random() * (containerWidth - 80) + 40 + 'px';
        item.style.top = Math.random() * (containerHeight - hairHeight - 80) + hairHeight + 40 + 'px';
        itemsContainer.appendChild(item);
        
        candyGame.items.push({
            element: item,
            x: parseFloat(item.style.left),
            y: parseFloat(item.style.top),
            collected: false
        });
    }
    
    // Spawn 3 skeleton enemies
    spawnSkeletons();
    
    // Initialize health display
    updateHealthDisplay();
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Start game loop
    candyGameLoop();
}

function handleKeyDown(e) {
    if (candyGame) {
        candyGame.keys[e.key.toLowerCase()] = true;
    }
}

function handleKeyUp(e) {
    if (candyGame) {
        candyGame.keys[e.key.toLowerCase()] = false;
    }
}

function checkCandyCollision() {
    const player = candyGame.player;
    const scoreDisplay = document.getElementById('candyScore');
    
    for (let item of candyGame.items) {
        if (item.collected) continue;
        
        const dx = player.x + 50 - item.x - 20;
        const dy = player.y + 50 - item.y - 20;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 45) {
            // Collect item
            item.collected = true;
            
            // Blink white effect on candy
            item.element.classList.add('blink');
            
            setTimeout(() => {
                item.element.style.display = 'none';
            }, 200);
            
            // Update score
            candyGame.score++;
            scoreDisplay.textContent = 'Score: ' + candyGame.score;
            
            // Blink score
            scoreDisplay.classList.remove('blink');
            void scoreDisplay.offsetWidth; // Trigger reflow
            scoreDisplay.classList.add('blink');
            
            setTimeout(() => {
                scoreDisplay.classList.remove('blink');
            }, 300);
            
            // Check win condition
            if (candyGame.score >= candyGame.targetScore) {
                winCandyGame();
            }
        }
    }
}

function spawnSkeletons() {
    const skeletonsContainer = document.getElementById('candySkeletons');
    
    // Spawn 3 skeletons from different edges
    for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'candy-skeleton';
        skeleton.style.backgroundImage = 'url(assets/game/skeleton1.svg)';
        skeletonsContainer.appendChild(skeleton);
        
        // Spawn from edges (top, right, bottom, or left)
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(edge) {
            case 0: // Top edge
                x = Math.random() * candyGame.containerWidth;
                y = 0;
                break;
            case 1: // Right edge
                x = candyGame.containerWidth - 40;
                y = Math.random() * candyGame.containerHeight;
                break;
            case 2: // Bottom edge
                x = Math.random() * candyGame.containerWidth;
                y = candyGame.containerHeight - 40;
                break;
            case 3: // Left edge
                x = 0;
                y = Math.random() * candyGame.containerHeight;
                break;
        }
        
        candyGame.skeletons.push({
            element: skeleton,
            x: x,
            y: y,
            speed: 1.5 + Math.random() * 0.5, // Slightly different speeds
            frame: 0,
            frameTimer: 0
        });
        
        skeleton.style.position = 'absolute';
        skeleton.style.left = x + 'px';
        skeleton.style.top = y + 'px';
    }
}

function updateSkeletons() {
    if (!candyGame.skeletons || candyGame.skeletons.length === 0) return;
    
    const player = candyGame.player;
    
    for (let skeleton of candyGame.skeletons) {
        // Move skeleton towards player
        const dx = player.x - skeleton.x;
        const dy = player.y - skeleton.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            skeleton.x += (dx / distance) * skeleton.speed;
            skeleton.y += (dy / distance) * skeleton.speed;
            
            skeleton.element.style.left = skeleton.x + 'px';
            skeleton.element.style.top = skeleton.y + 'px';
        }
        
        // Check collision with player
        if (!candyGame.player.invincible && distance < 45) {
            hitPlayer();
        }
    }
}

function hitPlayer() {
    candyGame.player.health--;
    candyGame.player.invincible = true;
    
    // Update health display
    updateHealthDisplay();
    
    // Flash player red
    const player = document.getElementById('candyPlayer');
    player.classList.add('hit');
    
    setTimeout(() => {
        player.classList.remove('hit');
        candyGame.player.invincible = false;
    }, 500);
    
    // Check if player lost
    if (candyGame.player.health <= 0) {
        loseCandyGame();
    }
}

function updateHealthDisplay() {
    const healthContainer = document.getElementById('candyHealth');
    healthContainer.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('div');
        heart.className = 'pixel-heart';
        if (i < candyGame.player.health) {
            heart.classList.add('full');
        } else {
            heart.classList.add('empty');
            heart.classList.add('blink-heart');
        }
        healthContainer.appendChild(heart);
    }
}

function loseCandyGame() {
    candyGame.running = false;
    gamePlayCount++;
    
    // Replace character with tombstone
    const player = document.getElementById('candyPlayer');
    player.style.backgroundImage = 'url(assets/game/tombstone.svg)';
    player.style.width = '60px';
    player.style.height = '80px';
    
    // Show lose screen
    const loseScreen = document.getElementById('candyLose');
    const loseRestart = loseScreen.querySelector('.lose-restart');
    
    setTimeout(() => {
        loseScreen.style.display = 'flex';
        
        // Check if this is the second play
        if (gamePlayCount >= 2) {
            gameRequirementMet = true;
            
            // Hide "Click to play again" text
            if (loseRestart) loseRestart.style.display = 'none';
            
            // Remove click handler
            loseScreen.onclick = null;
            
            // Close popup after 2 seconds
            setTimeout(() => {
                closeGamePopup();
            }, 2000);
        } else {
            // First play - show restart message and allow restart
            if (loseRestart) loseRestart.style.display = 'block';
            
            loseScreen.onclick = () => {
                loseScreen.style.display = 'none';
                startPopupGame();
            };
        }
    }, 1000);
}

function winCandyGame() {
    candyGame.running = false;
    gamePlayCount++;
    
    const winScreen = document.getElementById('candyWin');
    const winRestart = winScreen.querySelector('.win-restart');
    winScreen.style.display = 'flex';
    
    // Check if this is the second play
    if (gamePlayCount >= 2) {
        gameRequirementMet = true;
        
        // Hide "Click to play again" text
        if (winRestart) winRestart.style.display = 'none';
        
        // Remove click handler for second play
        winScreen.onclick = null;
        
        // Close popup after 2 seconds
        setTimeout(() => {
            closeGamePopup();
        }, 2000);
    } else {
        // Show "Click to play again" text for first play
        if (winRestart) winRestart.style.display = 'block';
        
        // Allow restart for first play only
        winScreen.onclick = () => {
            winScreen.style.display = 'none';
            startPopupGame();
        };
    }
}

function candyGameLoop() {
    if (!candyGame.running) return;
    
    const player = document.getElementById('candyPlayer');
    let isMoving = false;
    
    // Move player with WASD
    if (candyGame.keys['w'] || candyGame.keys['arrowup']) {
        candyGame.player.y = Math.max(0, candyGame.player.y - candyGame.player.speed);
        isMoving = true;
    }
    if (candyGame.keys['s'] || candyGame.keys['arrowdown']) {
        candyGame.player.y = Math.min(candyGame.containerHeight - candyGame.player.size, candyGame.player.y + candyGame.player.speed);
        isMoving = true;
    }
    if (candyGame.keys['a'] || candyGame.keys['arrowleft']) {
        candyGame.player.x = Math.max(0, candyGame.player.x - candyGame.player.speed);
        candyGame.player.direction = -1; // Facing left
        isMoving = true;
    }
    if (candyGame.keys['d'] || candyGame.keys['arrowright']) {
        candyGame.player.x = Math.min(candyGame.containerWidth - candyGame.player.size, candyGame.player.x + candyGame.player.speed);
        candyGame.player.direction = 1; // Facing right
        isMoving = true;
    }
    
    // Bounce animation when moving
    if (isMoving) {
        candyGame.player.bounceSpeed = 0.3;
        candyGame.player.bounceOffset = Math.sin(Date.now() * 0.02) * 5;
    } else {
        candyGame.player.bounceOffset *= 0.9;
        if (Math.abs(candyGame.player.bounceOffset) < 0.1) {
            candyGame.player.bounceOffset = 0;
        }
    }
    
    // Apply position and bounce
    player.style.left = candyGame.player.x + 'px';
    player.style.top = (candyGame.player.y + candyGame.player.bounceOffset) + 'px';
    
    // Flip character based on direction
    player.style.transform = `scaleX(${candyGame.player.direction})`;
    
    // Update skeletons
    updateSkeletons();
    
    // Check collisions
    checkCandyCollision();
    
    requestAnimationFrame(candyGameLoop);
}

// Candy Collecting Game
let candyGame = null;

function initDOMGame() {
    initCandyGame();
}

function initShooterGame() {
    const gameContainer = document.getElementById('gameContainer');
    const player = document.getElementById('gamePlayer');
    const obstaclesContainer = document.getElementById('gameObstacles');
    const scoreDisplay = document.getElementById('gameScore');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const cloudsContainer = document.getElementById('gameClouds');
    const skeletonsContainer = document.getElementById('gameSkeletons');
    
    // Clear previous game
    obstaclesContainer.innerHTML = '';
    cloudsContainer.innerHTML = '';
    skeletonsContainer.innerHTML = '';
    gameOverScreen.style.display = 'none';
    
    domGame = {
        running: true,
        score: 0,
        gameSpeed: 5,
        player: {
            y: 205,
            velocityY: 0,
            jumping: false,
            ground: 205
        },
        obstacles: [],
        clouds: [],
        obstacleTimer: 0,
        obstacleInterval: 100
    };
    
    // Create clouds
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud-dom';
        cloud.style.left = Math.random() * 500 + 'px';
        cloud.style.top = Math.random() * 150 + 20 + 'px';
        cloudsContainer.appendChild(cloud);
        domGame.clouds.push({
            element: cloud,
            x: parseFloat(cloud.style.left),
            speed: Math.random() * 0.5 + 0.3
        });
    }
    
    // Create skeleton decorations
    for (let i = 0; i < 10; i++) {
        const skeleton = document.createElement('img');
        skeleton.src = 'assets/game/skeleton.svg';
        skeleton.className = 'skeleton-decoration-dom';
        skeleton.style.left = i * 50 + 'px';
        skeleton.style.bottom = Math.sin(i * 0.5) * 10 + 'px';
        skeletonsContainer.appendChild(skeleton);
    }
    
    // Setup microphone
    setupDOMMicrophone();
    
    // Click to jump
    const clickHandler = () => {
        if (domGame.running) jumpDOM();
    };
    gameContainer.addEventListener('click', clickHandler);
    
    // Start game loop
    domGameLoop();
}

function jumpDOM() {
    if (!domGame.player.jumping && domGame.running) {
        domGame.player.velocityY = -12; // Negative velocity to jump up
        domGame.player.jumping = true;
    }
}

function setupDOMMicrophone() {
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let checkAudioInterval = null;
    let lastJumpTime = 0;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 256;
            microphone.connect(analyser);
            
            checkAudioInterval = setInterval(() => {
                if (!domGame || !domGame.running) return;
                
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                const maxValue = Math.max(...array);
                
                if (maxValue > 0) {
                    console.log('Sound detected:', maxValue);
                }
                
                const now = Date.now();
                if (maxValue > 500 && domGame.running && (now - lastJumpTime) > 300) {
                    console.log('JUMP! Sound level:', maxValue);
                    jumpDOM();
                    lastJumpTime = now;
                }
            }, 50);
            
            console.log('Microphone activated! Scream to jump!');
        })
        .catch(error => {
            console.error('Microphone access denied:', error);
        });
}

function createDOMObstacle() {
    const types = [
        { type: 'pumpkin', width: 35, height: 35 },
        { type: 'tombstone', width: 30, height: 40 }
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle-dom obstacle-' + type.type;
    obstacle.style.right = '-60px';
    
    document.getElementById('gameObstacles').appendChild(obstacle);
    
    domGame.obstacles.push({
        element: obstacle,
        x: 500,
        width: type.width,
        height: type.height
    });
}

function checkDOMCollision() {
    const playerRect = document.getElementById('gamePlayer').getBoundingClientRect();
    
    for (let obstacle of domGame.obstacles) {
        const obstacleRect = obstacle.element.getBoundingClientRect();
        
        if (playerRect.left < obstacleRect.right &&
            playerRect.right > obstacleRect.left &&
            playerRect.top < obstacleRect.bottom &&
            playerRect.bottom > obstacleRect.top) {
            return true;
        }
    }
    return false;
}

function domGameOver() {
    domGame.running = false;
    const gameOverScreen = document.getElementById('gameOverScreen');
    gameOverScreen.style.display = 'flex';
    gameOverScreen.querySelector('.game-over-score').textContent = 'Score: ' + Math.floor(domGame.score);
    
    setTimeout(() => {
        gameOverScreen.addEventListener('click', () => {
            initDOMGame();
        }, { once: true });
    }, 100);
}

function domGameLoop() {
    if (!domGame.running) return;
    
    // Update player
    const player = document.getElementById('gamePlayer');
    domGame.player.velocityY += 0.6; // Gravity pulls down
    domGame.player.y -= domGame.player.velocityY; // Subtract to move down (bottom decreases)
    
    if (domGame.player.y <= domGame.player.ground) {
        domGame.player.y = domGame.player.ground;
        domGame.player.velocityY = 0;
        domGame.player.jumping = false;
    }
    
    player.style.bottom = domGame.player.y + 'px';
    
    // Update clouds
    for (let cloud of domGame.clouds) {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
            cloud.x = 550;
        }
        cloud.element.style.left = cloud.x + 'px';
    }
    
    // Update obstacles
    domGame.obstacleTimer++;
    if (domGame.obstacleTimer > domGame.obstacleInterval) {
        createDOMObstacle();
        domGame.obstacleTimer = 0;
        domGame.obstacleInterval = Math.max(50, 100 - domGame.score / 50);
    }
    
    for (let i = domGame.obstacles.length - 1; i >= 0; i--) {
        const obstacle = domGame.obstacles[i];
        obstacle.x -= domGame.gameSpeed;
        obstacle.element.style.right = (500 - obstacle.x) + 'px';
        
        if (obstacle.x < -60) {
            obstacle.element.remove();
            domGame.obstacles.splice(i, 1);
        }
    }
    
    // Check collision
    if (checkDOMCollision()) {
        domGameOver();
        return;
    }
    
    // Update score
    domGame.score += 0.1;
    domGame.gameSpeed = 5 + domGame.score / 50;
    document.getElementById('gameScore').textContent = 'Score: ' + Math.floor(domGame.score);
    
    requestAnimationFrame(domGameLoop);
}

// Halloween Runner Game
let game = null;

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Load Press Start 2P font before starting game
    const fontFace = new FontFace('Press Start 2P', 'url(PressStart2P-Regular.ttf)');
    fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        console.log('Press Start 2P font loaded successfully');
    }).catch((error) => {
        console.error('Error loading font:', error);
    });
    
    // Game state
    game = {
        running: true,
        score: 0,
        gameSpeed: 5,
        gravity: 0.6,
        player: {
            x: 100,
            y: 200,
            width: 60,
            height: 80,
            velocityY: 0,
            jumping: false,
            image: new Image()
        },
        obstacles: [],
        obstacleTimer: 0,
        obstacleInterval: 100,
        ground: 280,
        skeletonImage: new Image(),
        clouds: [],
        cloudTimer: 0
    };
    
    // Preload skeleton image for bottom decoration
    game.skeletonImage.src = 'assets/game/skeleton.svg';
    
    // Initialize clouds
    for (let i = 0; i < 3; i++) {
        game.clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150 + 20,
            speed: Math.random() * 0.5 + 0.3,
            size: Math.random() * 20 + 30
        });
    }
    
    // Load player image
    game.player.image.src = 'assets/game/main_character.png';
    
    // Draw pixel cloud function
    function drawPixelCloud(ctx, x, y, size) {
        ctx.fillStyle = '#FFFFFF';
        const pixelSize = 5;
        
        // Better cloud shape in pixel art style
        const cloudPattern = [
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0,0]
        ];
        
        const scale = size / 55;
        for (let row = 0; row < cloudPattern.length; row++) {
            for (let col = 0; col < cloudPattern[row].length; col++) {
                if (cloudPattern[row][col] === 1) {
                    ctx.fillRect(
                        x + col * pixelSize * scale,
                        y + row * pixelSize * scale,
                        pixelSize * scale,
                        pixelSize * scale
                    );
                }
            }
        }
    }
    
    // Draw pixel obstacle function
    function drawPixelObstacle(ctx, x, y, type) {
        const pixelSize = 5;
        
        if (type === 'pumpkin') {
            // Pixel art pumpkin
            ctx.fillStyle = '#FF8C00';
            const pumpkinPattern = [
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1],
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0]
            ];
            
            for (let row = 0; row < pumpkinPattern.length; row++) {
                for (let col = 0; col < pumpkinPattern[row].length; col++) {
                    if (pumpkinPattern[row][col] === 1) {
                        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
                    }
                }
            }
            
            // Stem
            ctx.fillStyle = '#228B22';
            ctx.fillRect(x + 3 * pixelSize, y - pixelSize, pixelSize, pixelSize);
        } else if (type === 'tombstone') {
            // Pixel art tombstone
            ctx.fillStyle = '#808080';
            const tombstonePattern = [
                [0,1,1,1,1,0],
                [1,1,1,1,1,1],
                [1,1,1,1,1,1],
                [1,1,1,1,1,1],
                [1,1,1,1,1,1],
                [1,1,1,1,1,1],
                [1,1,1,1,1,1],
                [0,1,1,1,1,0]
            ];
            
            for (let row = 0; row < tombstonePattern.length; row++) {
                for (let col = 0; col < tombstonePattern[row].length; col++) {
                    if (tombstonePattern[row][col] === 1) {
                        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
                    }
                }
            }
            
            // RIP text
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + pixelSize, y + 2 * pixelSize, pixelSize, pixelSize);
            ctx.fillRect(x + 3 * pixelSize, y + 2 * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Obstacle types with emojis and SVG
    const obstacleTypes = [
        { type: 'svg', src: 'assets/game/skeleton.svg', width: 50, height: 70 },
        { type: 'pixel', pixelType: 'pumpkin', width: 35, height: 35 },
        { type: 'pixel', pixelType: 'tombstone', width: 30, height: 40 }
    ];
    
    // Jump function
    function jump() {
        if (!game.player.jumping && game.running) {
            game.player.velocityY = -12;
            game.player.jumping = true;
        }
    }
    
    // Setup microphone for voice detection
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let checkAudioInterval = null;
    let lastJumpTime = 0;
    
    async function setupMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            
            analyser.smoothingTimeConstant = 0.3;
            analyser.fftSize = 256;
            
            microphone.connect(analyser);
            
            // Use interval instead of deprecated ScriptProcessorNode
            checkAudioInterval = setInterval(() => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                
                // Get max value instead of average for better detection
                const maxValue = Math.max(...array);
                
                // Debug: log sound levels
                if (maxValue > 0) {
                    console.log('Sound detected:', maxValue);
                }
                
                // Jump on loud sounds above threshold
                const now = Date.now();
                if (maxValue > 150 && game.running && (now - lastJumpTime) > 300) {
                    console.log('JUMP! Sound level:', maxValue);
                    jump();
                    lastJumpTime = now;
                }
            }, 50); // Check every 50ms for faster response
            
            console.log('Microphone activated! Make any sound to jump!');
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Please allow microphone access to use voice control. You can still click to jump!');
        }
    }
    
    // Start microphone when game starts
    setupMicrophone();
    
    // Event listeners (keep click as backup)
    const clickHandler = (e) => {
        e.preventDefault();
        jump();
    };
    
    canvas.addEventListener('click', clickHandler);
    
    // Create obstacle
    function createObstacle() {
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacle = {
            x: canvas.width,
            y: game.ground - type.height,
            width: type.width,
            height: type.height,
            type: type.type,
            pixelType: type.pixelType
        };
        
        if (type.type === 'svg') {
            obstacle.image = new Image();
            obstacle.image.src = type.src;
        }
        
        game.obstacles.push(obstacle);
    }
    
    // Collision detection with padding to make it more forgiving
    function checkCollision(player, obstacle) {
        const padding = 10; // Add padding to make collision more accurate
        return player.x + padding < obstacle.x + obstacle.width - padding &&
               player.x + player.width - padding > obstacle.x + padding &&
               player.y + padding < obstacle.y + obstacle.height - padding &&
               player.y + player.height - padding > obstacle.y + padding;
    }
    
    // Game over
    function gameOver() {
        game.running = false;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('Score: ' + Math.floor(game.score), canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 50);
        
        // Restart on click
        const restartHandler = (e) => {
            e.preventDefault();
            canvas.removeEventListener('click', restartHandler);
            canvas.removeEventListener('click', clickHandler);
            if (checkAudioInterval) {
                clearInterval(checkAudioInterval);
            }
            initGame();
        };
        setTimeout(() => {
            canvas.removeEventListener('click', clickHandler);
            canvas.addEventListener('click', restartHandler);
        }, 100);
    }
    
    // Game loop
    function gameLoop() {
        if (!game.running) return;
        
        // Clear canvas and draw background
        ctx.fillStyle = '#D9CEB7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw and update clouds
        for (let cloud of game.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x < -cloud.size * 2) {
                cloud.x = canvas.width + cloud.size;
                cloud.y = Math.random() * 150 + 20;
            }
            drawPixelCloud(ctx, cloud.x, cloud.y, cloud.size);
        }
        
        // Draw platform (only a strip, not full height)
        const platformHeight = 15;
        ctx.fillStyle = '#B0A88F';
        ctx.fillRect(0, game.ground, canvas.width, platformHeight);
        
        // Background below platform remains #D9CEB7 (already drawn)
        
        // Draw skeleton decorations at bottom using SVG
        if (game.skeletonImage.complete && game.skeletonImage.naturalWidth > 0) {
            for (let x = 0; x < canvas.width; x += 50) {
                const offset = Math.sin(x * 0.1) * 10;
                ctx.drawImage(game.skeletonImage, x - 10, canvas.height - 60 + offset, 40, 50);
            }
        } else {
            // Fallback to skull emoji if skeleton.svg not loaded
            ctx.font = '30px Arial';
            for (let x = 0; x < canvas.width; x += 40) {
                const offset = Math.sin(x * 0.1) * 10;
                ctx.fillText('💀', x, canvas.height - 20 + offset);
            }
        }
        
        // Update player
        game.player.velocityY += game.gravity;
        game.player.y += game.player.velocityY;
        
        if (game.player.y >= game.ground - game.player.height) {
            game.player.y = game.ground - game.player.height;
            game.player.velocityY = 0;
            game.player.jumping = false;
        }
        
        // Draw player
        if (game.player.image.complete && game.player.image.naturalWidth > 0) {
            ctx.drawImage(game.player.image, game.player.x, game.player.y, game.player.width, game.player.height);
        } else {
            // Fallback: draw Frankenstein emoji
            ctx.font = '70px Arial';
            ctx.fillText('🧟', game.player.x, game.player.y + 70);
        }
        
        // Update obstacles
        game.obstacleTimer++;
        if (game.obstacleTimer > game.obstacleInterval) {
            createObstacle();
            game.obstacleTimer = 0;
            game.obstacleInterval = Math.max(50, 100 - game.score / 100);
        }
        
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = game.obstacles[i];
            obstacle.x -= game.gameSpeed;
            
            // Draw obstacle
            if (obstacle.type === 'svg' && obstacle.image && obstacle.image.complete && obstacle.image.naturalWidth > 0) {
                ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else if (obstacle.type === 'pixel') {
                drawPixelObstacle(ctx, obstacle.x, obstacle.y, obstacle.pixelType);
            } else if (obstacle.type === 'svg') {
                // Fallback for skeleton if image not loaded
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
            
            // Check collision
            if (checkCollision(game.player, obstacle)) {
                gameOver();
                return;
            }
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                game.obstacles.splice(i, 1);
            }
        }
        
        // Update score and increase speed
        game.score += 0.1;
        game.gameSpeed = 5 + game.score / 50; // Faster speed increase
        
        // Draw score
        ctx.fillStyle = 'black';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText('Score: ' + Math.floor(game.score), canvas.width - 20, 45);
        
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

// Manual send (for testing)
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (text === '' || isTyping) return;
    
    addMessage(text, true, false);
    messageInput.value = '';
    messageInput.style.height = 'auto'; // Reset height
    
    // Show processing animation
    showProcessing();
    
    // Simple echo response
    setTimeout(() => {
        removeProcessing();
        addMessage("Thanks for your message! This is a demo response.", false, true);
    }, conversationData?.responseDelay || 800);
}

// Auto-expand textarea
function autoExpandTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 300) + 'px';
}

messageInput.addEventListener('input', autoExpandTextarea);

// Event delegation for play button
chatMessages.addEventListener('click', (e) => {
    if (e.target.closest('.play-button')) {
        openGamePopup();
    }
});

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        sendMessage();
    }
});

// Start demo button (you can trigger this manually)
document.addEventListener('keydown', (e) => {
    // Press 'D' to start demo
    if (e.key === 'd' || e.key === 'D') {
        if (!isTyping && currentConversationIndex === 0) {
            playNextConversation();
        }
    }
    // Press 'R' to reset
    if (e.key === 'r' || e.key === 'R') {
        chatMessages.innerHTML = '';
        chatMessages.style.display = 'none';
        centerContent.style.display = 'flex';
        currentConversationIndex = 0;
        isTyping = false;
        messageInput.value = '';
    }
});

// Load conversation on page load and check intro screens setting
loadConversation().then(() => {
    // Check if intro screens should be skipped
    if (conversationData && conversationData.showIntroScreens === false) {
        // Hide intro container and show main content immediately
        document.getElementById('introContainer').style.display = 'none';
        document.querySelector('.sidebar').style.display = 'flex';
        document.querySelector('.main-content').style.display = 'flex';
        
        // Start conversation after initial delay
        const delay = conversationData?.initialDelay || 500;
        setTimeout(() => {
            playNextConversation();
        }, delay);
    }
});
