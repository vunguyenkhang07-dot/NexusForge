const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ÂM THANH (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playEatSound() { playSound(600, 'sine', 0.15); }
function playGameOverSound() { playSound(150, 'sawtooth', 0.5); }

// --- CẤU HÌNH ĐỐI TƯỢNG ---
const basket = {
    x: canvas.width / 2 - 35,
    y: canvas.height - 35,
    width: 70,
    height: 22,
    speed: 7,
    dx: 0
};

const apple = {
    x: Math.random() * (canvas.width - 24),
    y: 0,
    size: 24,
    speed: 3.5
};

let score = 0;
let highScore = localStorage.getItem("apple_game_highscore") || 0;
let gameOver = false;

// --- SỰ KIỆN BÀN PHÍM (MÁY TÍNH) ---
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") basket.dx = -basket.speed;
    if (e.key === "ArrowRight" || e.key === "d") basket.dx = basket.speed;
    if (gameOver && e.key === " ") restartGame();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d") {
        basket.dx = 0;
    }
});

// --- SỰ KIỆN CẢM ỨNG (ĐIỆN THOẠI) ---
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// Bấm nút Trái
btnLeft.addEventListener("touchstart", (e) => {
    e.preventDefault();
    basket.dx = -basket.speed;
});
btnLeft.addEventListener("touchend", (e) => {
    e.preventDefault();
    basket.dx = 0;
});
// Thêm sự kiện Chuột cho nút để test trên máy tính
btnLeft.addEventListener("mousedown", () => basket.dx = -basket.speed);
btnLeft.addEventListener("mouseup", () => basket.dx = 0);

// Bấm nút Phải
btnRight.addEventListener("touchstart", (e) => {
    e.preventDefault();
    basket.dx = basket.speed;
});
btnRight.addEventListener("touchend", (e) => {
    e.preventDefault();
    basket.dx = 0;
});
btnRight.addEventListener("mousedown", () => basket.dx = basket.speed);
btnRight.addEventListener("mouseup", () => basket.dx = 0);

// Chạm vào màn hình canvas để chơi lại khi Game Over
canvas.addEventListener("click", () => {
    if (gameOver) restartGame();
});
canvas.addEventListener("touchstart", (e) => {
    if (gameOver) {
        e.preventDefault();
        restartGame();
    }
});

function restartGame() {
    score = 0;
    apple.speed = 3.5;
    gameOver = false;
    resetApple();
    gameLoop();
}

function resetApple() {
    apple.x = Math.random() * (canvas.width - apple.size);
    apple.y = -apple.size;
    apple.speed += 0.25;
}

// --- VẼ ĐỒ HỌA ---
function drawBasket() {
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 6);
    ctx.fill();

    ctx.fillStyle = "#A0522D";
    ctx.fillRect(basket.x + 5, basket.y + 4, basket.width - 10, 4);
}

function drawApple() {
    const cx = apple.x + apple.size / 2;
    const cy = apple.y + apple.size / 2;
    const r = apple.size / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#FF2400";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - r/3, cy - r/3, r/4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + 2, cy - r - 5);
    ctx.strokeStyle = "#5C4033";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - r - 3, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#32CD32";
    ctx.fill();
}

function update() {
    if (gameOver) return;

    basket.x += basket.dx;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

    apple.y += apple.speed;

    if (
        apple.y + apple.size >= basket.y &&
        apple.x + apple.size >= basket.x &&
        apple.x <= basket.x + basket.width
    ) {
        score += 10;
        playEatSound();

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("apple_game_highscore", highScore);
        }

        resetApple();
    }

    if (apple.y > canvas.height) {
        gameOver = true;
        playGameOverSound();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawApple();

    ctx.fillStyle = "#222";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Điểm: " + score, 15, 30);
    
    ctx.fillStyle = "#D2691E";
    ctx.fillText("Kỷ lục: " + highScore, canvas.width - 120, 30);

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FFF";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "16px Arial";
        ctx.fillText("Điểm của bạn: " + score, canvas.width / 2, canvas.height / 2 + 15);
        ctx.fillText("Chạm vào màn hình để chơi lại", canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = "start";
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();
