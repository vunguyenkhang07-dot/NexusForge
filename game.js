const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ÂM THANH (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration, startVol = 0.1) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(startVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Âm thanh khi ăn táo đỏ
function playEatSound() { 
    playSound(600, 'sine', 0.15); 
}

// Âm thanh đặc biệt khi ăn Táo Vàng (tiếng chuông ngân cao)
function playGoldAppleSound() {
    playSound(900, 'triangle', 0.1, 0.2);
    setTimeout(() => playSound(1200, 'sine', 0.25, 0.2), 80);
}

// Âm thanh khi hứng phải Bom (Tiếng nổ)
function playExplosionSound() {
    playSound(100, 'sawtooth', 0.6, 0.4);
    playSound(60, 'square', 0.8, 0.4);
}

// Âm thanh khi để táo rơi mất
function playGameOverSound() { 
    playSound(150, 'sawtooth', 0.5); 
}

// --- CẤU HÌNH ĐỐI TƯỢNG ---
const basket = {
    x: canvas.width / 2 - 35,
    y: canvas.height - 35,
    width: 70,
    height: 22,
    speed: 7,
    dx: 0
};

// Quả táo (Thường hoặc Vàng)
const apple = {
    x: Math.random() * (canvas.width - 24),
    y: 0,
    size: 24,
    speed: 3.5,
    isGold: false
};

// Quả bom
const bomb = {
    x: Math.random() * (canvas.width - 22),
    y: -100, // Ban đầu giấu bom ở trên
    size: 22,
    speed: 4,
    active: false
};

let score = 0;
let highScore = localStorage.getItem("apple_game_highscore") || 0;
let gameOver = false;
let gameOverReason = ""; // Lý do thua (Rơi táo hay Trúng bom)

// --- BẮT SỰ KIỆN MÁY TÍNH & CẢM ỨNG ---
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

const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); basket.dx = -basket.speed; });
btnLeft.addEventListener("touchend", (e) => { e.preventDefault(); basket.dx = 0; });
btnLeft.addEventListener("mousedown", () => basket.dx = -basket.speed);
btnLeft.addEventListener("mouseup", () => basket.dx = 0);

btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); basket.dx = basket.speed; });
btnRight.addEventListener("touchend", (e) => { e.preventDefault(); basket.dx = 0; });
btnRight.addEventListener("mousedown", () => basket.dx = basket.speed);
btnRight.addEventListener("mouseup", () => basket.dx = 0);

canvas.addEventListener("click", () => { if (gameOver) restartGame(); });
canvas.addEventListener("touchstart", (e) => { if (gameOver) { e.preventDefault(); restartGame(); } });

// --- QUẢN LÝ GAME ---
function restartGame() {
    score = 0;
    apple.speed = 3.5;
    gameOver = false;
    gameOverReason = "";
    resetApple();
    resetBomb();
    gameLoop();
}

function resetApple() {
    apple.x = Math.random() * (canvas.width - apple.size);
    apple.y = -apple.size;
    // Tỷ lệ 20% ra Táo Vàng x2 điểm
    apple.isGold = Math.random() < 0.2; 
    apple.speed = (apple.isGold ? 4.2 : 3.5) + (score / 100); // Tăng dần theo điểm
}

function resetBomb() {
    // Chỉ kích hoạt bom khi đã đạt trên 20 điểm
    if (score >= 20 && Math.random() < 0.7) {
        bomb.active = true;
        bomb.x = Math.random() * (canvas.width - bomb.size);
        bomb.y = -Math.random() * 200 - 50; // Xuất hiện ngẫu nhiên sau táo
        bomb.speed = 3.8 + (score / 120);
    } else {
        bomb.active = false;
        bomb.y = -200;
    }
}

// --- VẼ ĐỒ HỌA ---

// Vẽ cái giỏ
function drawBasket() {
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 6);
    ctx.fill();

    ctx.fillStyle = "#A0522D";
    ctx.fillRect(basket.x + 5, basket.y + 4, basket.width - 10, 4);
}

// Vẽ Táo đỏ / Táo vàng
function drawApple() {
    const cx = apple.x + apple.size / 2;
    const cy = apple.y + apple.size / 2;
    const r = apple.size / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    // Táo vàng hoặc Táo đỏ
    ctx.fillStyle = apple.isGold ? "#FFD700" : "#FF2400";
    ctx.fill();

    // Vệt sáng bóng
    ctx.beginPath();
    ctx.arc(cx - r/3, cy - r/3, r/4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fill();

    // Cuống táo
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + 2, cy - r - 5);
    ctx.strokeStyle = "#5C4033";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lá táo
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - r - 3, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = "#32CD32";
    ctx.fill();
}

// Vẽ Quả Bom 💣
function drawBomb() {
    if (!bomb.active) return;

    const cx = bomb.x + bomb.size / 2;
    const cy = bomb.y + bomb.size / 2;
    const r = bomb.size / 2;

    // Thân bom màu đen
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();

    // Ngòi nổ
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + 4, cy - r - 6);
    ctx.strokeStyle = "#D2691E";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tia lửa ngòi nổ
    ctx.beginPath();
    ctx.arc(cx + 4, cy - r - 7, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#FF4500";
    ctx.fill();
}

// --- LOGIC GAME ---
function update() {
    if (gameOver) return;

    // Di chuyển giỏ
    basket.x += basket.dx;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

    // Di chuyển táo
    apple.y += apple.speed;

    // Hứng táo thành công
    if (
        apple.y + apple.size >= basket.y &&
        apple.x + apple.size >= basket.x &&
        apple.x <= basket.x + basket.width
    ) {
        if (apple.isGold) {
            score += 20; // Táo vàng x2 điểm (+20)
            playGoldAppleSound();
        } else {
            score += 10; // Táo thường (+10)
            playEatSound();
        }

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("apple_game_highscore", highScore);
        }

        resetApple();
        if (!bomb.active) resetBomb(); // Có cơ hội xuất hiện bom mới
    }

    // Táo rơi mất -> Thua
    if (apple.y > canvas.height) {
        gameOver = true;
        gameOverReason = "BẠN ĐÃ ĐỂ TÁO RƠI!";
        playGameOverSound();
    }

    // Di chuyển bom (nếu đang kích hoạt)
    if (bomb.active) {
        bomb.y += bomb.speed;

        // Va chạm Bom với Giỏ -> Nổ thua cuộc
        if (
            bomb.y + bomb.size >= basket.y &&
            bomb.x + bomb.size >= basket.x &&
            bomb.x <= basket.x + basket.width
        ) {
            gameOver = true;
            gameOverReason = "💥 BẠN ĐÃ TRÚNG BOM!";
            playExplosionSound();
        }

        // Bom rơi khỏi màn hình thì biến mất
        if (bomb.y > canvas.height) {
            resetBomb();
        }
    }
}

// --- VẼ KHUNG HÌNH ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawApple();
    drawBomb();

    // Điểm số & Kỷ lục
    ctx.fillStyle = "#222";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Điểm: " + score, 15, 30);
    
    ctx.fillStyle = "#D2691E";
    ctx.fillText("Kỷ lục: " + highScore, canvas.width - 120, 30);

    // Màn hình Game Over
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FF3333";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 16px Arial";
        ctx.fillText(gameOverReason, canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = "#FFF";
        ctx.font = "16px Arial";
        ctx.fillText("Điểm của bạn: " + score, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText("Chạm màn hình / Space để chơi lại", canvas.width / 2, canvas.height / 2 + 55);
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
