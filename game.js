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

function playEatSound() { playSound(600, 'sine', 0.15); }
function playGoldFruitSound() {
    playSound(900, 'triangle', 0.1, 0.2);
    setTimeout(() => playSound(1200, 'sine', 0.25, 0.2), 80);
}
function playExplosionSound() {
    playSound(100, 'sawtooth', 0.6, 0.4);
    playSound(60, 'square', 0.8, 0.4);
}
function playGameOverSound() { playSound(150, 'sawtooth', 0.5); }

// --- DANH SÁCH CÁC LOẠI TRÁI CÂY ---
// Tất cả trái cây có điểm cơ bản = 10, bản vàng = 20
const FRUIT_TYPES = [
    { name: "apple", color: "#FF2400", score: 10, size: 24, speedMod: 3.5 },
    { name: "orange", color: "#FF8C00", score: 10, size: 24, speedMod: 3.8 },
    { name: "banana", color: "#FFE135", score: 10, size: 26, speedMod: 4.2 },
    { name: "strawberry", color: "#E30B5C", score: 10, size: 22, speedMod: 4.5 },
    { name: "watermelon", color: "#228B22", score: 10, size: 28, speedMod: 4.0 }
];

// --- CẤU HÌNH ĐỐI TƯỢNG ---
const basket = {
    x: canvas.width / 2 - 35,
    y: canvas.height - 35,
    width: 70,
    height: 22,
    speed: 11,
    dx: 0
};

// Trái cây hiện tại
const currentFruit = {
    x: Math.random() * (canvas.width - 26),
    y: 0,
    type: FRUIT_TYPES[0],
    isGold: false,
    speed: 3.5
};

// Quả bom
const bomb = {
    x: Math.random() * (canvas.width - 22),
    y: -100,
    size: 22,
    speed: 4,
    active: false
};

let score = 0;
let highScore = localStorage.getItem("fruit_game_highscore") || 0;
let gameOver = false;
let gameOverReason = "";

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
    gameOver = false;
    gameOverReason = "";
    resetFruit();
    resetBomb();
    gameLoop();
}

function resetFruit() {
    // Chọn ngẫu nhiên 1 trong 5 loại trái cây
    const randomType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    currentFruit.type = randomType;
    currentFruit.x = Math.random() * (canvas.width - randomType.size);
    currentFruit.y = -randomType.size;
    
    // Tỷ lệ 40% xuất hiện bản VÀNG (20 điểm)
    currentFruit.isGold = Math.random() < 0.4; 
    currentFruit.speed = randomType.speedMod + (score / 150);
}

function resetBomb() {
    if (Math.random() < 0.6) {
        bomb.active = true;
        bomb.x = Math.random() * (canvas.width - bomb.size);
        bomb.y = -Math.random() * 200 - 50;
        bomb.speed = 3.8 + (score / 120);
    } else {
        bomb.active = false;
        bomb.y = -200;
    }
}

// --- VẼ ĐỒ HỌA TRÁI CÂY & GIỎ ---

function drawBasket() {
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 6);
    ctx.fill();

    ctx.fillStyle = "#A0522D";
    ctx.fillRect(basket.x + 5, basket.y + 4, basket.width - 10, 4);
}

// Vẽ các loại trái cây
function drawFruit() {
    const cx = currentFruit.x + currentFruit.type.size / 2;
    const cy = currentFruit.y + currentFruit.type.size / 2;
    const r = currentFruit.type.size / 2;

    const mainColor = currentFruit.isGold ? "#FFD700" : currentFruit.type.color;

    ctx.save();

    switch (currentFruit.type.name) {
        case "apple":
        case "orange":
            // Quả hình tròn (Táo / Cam)
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = mainColor;
            ctx.fill();

            // Vệt sáng
            ctx.beginPath();
            ctx.arc(cx - r/3, cy - r/3, r/4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.fill();
            break;

        case "banana":
            // Chuối cong
            ctx.beginPath();
            ctx.arc(cx - 5, cy, r, -Math.PI / 3, Math.PI / 3);
            ctx.lineWidth = 8;
            ctx.strokeStyle = mainColor;
            ctx.stroke();
            break;

        case "strawberry":
            // Dâu tây dạng hình tam giác bo góc
            ctx.beginPath();
            ctx.moveTo(cx, cy + r);
            ctx.lineTo(cx - r, cy - r/2);
            ctx.lineTo(cx + r, cy - r/2);
            ctx.closePath();
            ctx.fillStyle = mainColor;
            ctx.fill();
            break;

        case "watermelon":
            // Dưa hấu nửa hình tròn
            ctx.beginPath();
            ctx.arc(cx, cy - 2, r, 0, Math.PI);
            ctx.fillStyle = currentFruit.isGold ? "#FFD700" : "#FF3333";
            ctx.fill();
            // Vỏ xanh
            ctx.beginPath();
            ctx.arc(cx, cy - 2, r, 0, Math.PI);
            ctx.lineWidth = 4;
            ctx.strokeStyle = currentFruit.isGold ? "#B8860B" : "#006400";
            ctx.stroke();
            break;
    }

    // Nếu là bản VÀNG thì vẽ hiệu ứng hào quang lấp lánh
    if (currentFruit.isGold) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// Vẽ Bom
function drawBomb() {
    if (!bomb.active) return;

    const cx = bomb.x + bomb.size / 2;
    const cy = bomb.y + bomb.size / 2;
    const r = bomb.size / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + 4, cy - r - 6);
    ctx.strokeStyle = "#D2691E";
    ctx.lineWidth = 2;
    ctx.stroke();

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

    // Di chuyển trái cây
    currentFruit.y += currentFruit.speed;

    // Hứng trái cây thành công
    if (
        currentFruit.y + currentFruit.type.size >= basket.y &&
        currentFruit.x + currentFruit.type.size >= basket.x &&
        currentFruit.x <= basket.x + basket.width
    ) {
        // Trái cây thường: 10 điểm | Trái cây vàng: 20 điểm
        const earnedScore = currentFruit.isGold ? 20 : 10;
        score += earnedScore;

        if (currentFruit.isGold) {
            playGoldFruitSound();
        } else {
            playEatSound();
        }

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("fruit_game_highscore", highScore);
        }

        resetFruit();
        if (!bomb.active) resetBomb();
    }

    // Trái cây rơi mất -> Thua
    if (currentFruit.y > canvas.height) {
        gameOver = true;
        gameOverReason = "BẠN ĐÃ BỎ SÓT TRÁI CÂY!";
        playGameOverSound();
    }

    // Di chuyển bom
    if (bomb.active) {
        bomb.y += bomb.speed;

        if (
            bomb.y + bomb.size >= basket.y &&
            bomb.x + bomb.size >= basket.x &&
            bomb.x <= basket.x + basket.width
        ) {
            gameOver = true;
            gameOverReason = "💥 BẠN ĐÃ TRÚNG BOM!";
            playExplosionSound();
        }

        if (bomb.y > canvas.height) {
            resetBomb();
        }
    }
}

// --- VẼ KHUNG HÌNH ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBasket();
    drawFruit();
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
