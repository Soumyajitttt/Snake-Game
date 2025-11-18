 document.addEventListener('DOMContentLoaded', () => {
            // --- CONSTANTS AND STATE ---
            const BOARD_SIZE = 50; // 50 columns wide
            const BOARD_ROWS = 30; // 30 rows high
            const PIXEL_SIZE = 20; // 20px per cell (matching CSS variable)
            const INITIAL_SNAKE = [{ x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_ROWS / 2) }];
            
            let snake = JSON.parse(JSON.stringify(INITIAL_SNAKE)); // Snake body segments
            let food = generateFood(); // Food position
            let direction = 'right'; // Current movement direction
            let gameInterval; // Interval id for the game loop
            let gameSpeed = 150; // Initial speed in milliseconds
            let score = 0;
            let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
            let isPaused = true;
            let lastKey = null; // To prevent immediate 180-degree turns
            
            // --- DOM ELEMENTS ---
            const board = document.querySelector('.board');
            const scoreDisplay = document.getElementById('score');
            const hScoreDisplay = document.getElementById('hscore');
            const startButton = document.getElementById('start');
            let gameOverMessage = document.getElementById('game-over-message'); // FIX: Changed const to let for reassignment in showCustomAlert

            // Initialize high score display
            hScoreDisplay.textContent = highScore;

            // --- GAME LOGIC FUNCTIONS ---

            function generateFood() {
                let newFood;
                do {
                    newFood = {
                        x: Math.floor(Math.random() * BOARD_SIZE) + 1,
                        y: Math.floor(Math.random() * BOARD_ROWS) + 1
                    };
                } while (isSnakeOccupying(newFood)); // food doesn't spawn on the snake
                return newFood;
            }

            function isSnakeOccupying(pos) {
                return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
            }

            function updateScore(newScore) {
                score = newScore;
                scoreDisplay.textContent = score;

                if (score > highScore) {
                    highScore = score;
                    hScoreDisplay.textContent = highScore;
                    localStorage.setItem('snakeHighScore', highScore);
                }
            }

            function moveSnake() {
                // Create the new head position based on direction
                const head = { ...snake[0] };

                switch (direction) {
                    case 'up': head.y -= 1; break;
                    case 'down': head.y += 1; break;
                    case 'left': head.x -= 1; break;
                    case 'right': head.x += 1; break;
                }

                //  Check for collision
                if (isCollision(head)) {
                    endGame();
                    return;
                }

                // Add new head to the front of the snake
                snake.unshift(head);
                
                // Check for food consumption
                if (head.x === food.x && head.y === food.y) {
                    updateScore(score + 1);
                    food = generateFood(); // Generate new food
                    // Speed up the game slightly
                    gameSpeed = Math.max(80, gameSpeed - 1); 
                    clearInterval(gameInterval);
                    gameInterval = setInterval(gameLoop, gameSpeed);
                } else {
                    // If no food, remove the tail (snake moves)
                    snake.pop();
                }
                
                // Re-render the game state
                drawGame();
            }

            function isCollision(head) {
                // Wall collision
                if (head.x < 1 || head.x > BOARD_SIZE || head.y < 1 || head.y > BOARD_ROWS) {
                    return true;
                }
                // Self collision (start checking from the second segment)
                for (let i = 1; i < snake.length; i++) {
                    if (head.x === snake[i].x && head.y === snake[i].y) {
                        return true;
                    }
                }
                return false;
            }

            function drawGame() {
                // Clear the board
                board.innerHTML = '';
                
                // Draw the snake
                snake.forEach((segment, index) => {
                    const segmentElement = document.createElement('div');
                    segmentElement.classList.add('snake-segment');
                    
                    // Add a head class for styling if desired
                    if (index === 0) {
                        segmentElement.classList.add('snake-head');
                    }

                    // Use CSS Grid to position the segment
                    segmentElement.style.gridColumnStart = segment.x;
                    segmentElement.style.gridRowStart = segment.y;

                    board.appendChild(segmentElement);
                });

                // Draw the food
                const foodElement = document.createElement('div');
                foodElement.classList.add('food');
                foodElement.style.gridColumnStart = food.x;
                foodElement.style.gridRowStart = food.y;
                board.appendChild(foodElement);
            }

            // --- GAME FLOW CONTROL ---

            function startGame() {
                if (!isPaused) return; 

                // Reset state
                snake = JSON.parse(JSON.stringify(INITIAL_SNAKE));
                direction = 'right';
                food = generateFood();
                gameSpeed = 150;
                updateScore(0);
                isPaused = false;
                
                // Hide game over message if visible
                if (gameOverMessage) gameOverMessage.style.display = 'none';

                // Update button text
                startButton.textContent = 'Game Running';
                startButton.disabled = true;

                // Start the game loop
                gameInterval = setInterval(gameLoop, gameSpeed);
                drawGame();
            }

            function gameLoop() {
                if (!isPaused) {
                    moveSnake();
                }
            }

            function endGame() {
                clearInterval(gameInterval);
                isPaused = true;
                startButton.textContent = 'Restart Game';
                startButton.disabled = false;
                showCustomAlert('Game Over! Your score: ' + score);
            }

            function showCustomAlert(message) {
                if (!gameOverMessage) {
                    // Create the element if it doesn't exist (only happens once)
                    const msg = document.createElement('div');
                    msg.id = 'game-over-message';
                    msg.classList.add('custom-alert');
                    msg.innerHTML = `<p>${message}</p><button onclick="document.getElementById('game-over-message').style.display='none'">OK</button>`;
                    board.appendChild(msg);
                    gameOverMessage = msg; // This assignment is now possible
                }
                gameOverMessage.querySelector('p').textContent = message;
                gameOverMessage.style.display = 'flex';
            }

            // --- INPUT HANDLING ---

            document.addEventListener('keydown', (e) => {
                if (isPaused) {
                    if (e.key === ' ' || e.key === 'Enter') {
                        startGame();
                    }
                    return;
                }
                
                // Logic to prevent 180-degree turns (e.g., going right then immediately left)
                let newDirection = direction;
                
                switch (e.key) {
                    case 'ArrowUp':
                    case 'w':
                        if (direction !== 'down') newDirection = 'up';
                        break;
                    case 'ArrowDown':
                    case 's':
                        if (direction !== 'up') newDirection = 'down';
                        break;
                    case 'ArrowLeft':
                    case 'a':
                        if (direction !== 'right') newDirection = 'left';
                        break;
                    case 'ArrowRight':
                    case 'd':
                        if (direction !== 'left') newDirection = 'right';
                        break;
                    default:
                        return; // Ignore other keys
                }
                
                // Update direction only if it changed
                if (newDirection !== direction) {
                    direction = newDirection;
                }
            });

            // Start button listener
            startButton.addEventListener('click', startGame);

            // Initial drawing
            drawGame();
        });