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
function playLoseLifeSound() {
    playSound(220, 'sawtooth', 0.2, 0.3);
}
function playExplosionSound() {
    playSound(100, 'sawtooth', 0.6, 0.4);
    playSound(60, 'square', 0.8, 0.4);
}
function playGameOverSound() { playSound(150, 'sawtooth', 0.5); }

// --- TRẠNG THÁI GAME ---
let gameState = "MENU"; // Các trạng thái: MENU, PLAYING, GAMEOVER
let score = 0;
let lives = 3; // Thêm 3 mạng
let highScore = localStorage.getItem("fruit_game_highscore") || 0;
let gameOverReason = "";

// --- DANH SÁCH CÁC LOẠI TRÁI CÂY ---
const FRUIT_TYPES = [
    { name: "apple", color: "#FF2400", size: 28, speedMod: 3.5 },
    { name: "orange", color: "#FFA500", size: 28, speedMod: 3.8 },
    { name: "banana", color: "#FFE135", size: 30, speedMod: 4.2 },
    { name: "strawberry", color: "#E30B5C", size: 26, speedMod: 4.5 },
    { name: "watermelon", color: "#228B22", size: 32, speedMod: 4.0 }
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

const currentFruit = {
    x: Math.random() * (canvas.width - 32),
    y: 0,
    type: FRUIT_TYPES[0],
    isGold: false,
    speed: 3.5
};

const bomb = {
    x: Math.random() * (canvas.width - 22),
    y: -100,
    size: 24,
    speed: 4,
    active: false
};

// --- BẮT SỰ KIỆN NÚT VÀ PHÍM ---
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") basket.dx = -basket.speed;
    if (e.key === "ArrowRight" || e.key === "d") basket.dx = basket.speed;
    if ((gameState === "MENU" || gameState === "GAMEOVER") && e.key === " ") {
        startGame();
    }
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

canvas.addEventListener("click", () => {
    if (gameState === "MENU" || gameState === "GAMEOVER") startGame();
});
canvas.addEventListener("touchstart", (e) => {
    if (gameState === "MENU" || gameState === "GAMEOVER") {
        e.preventDefault();
        startGame();
    }
});

// --- QUẢN LÝ GAME ---
function startGame() {
    score = 0;
    lives = 3; // Khởi tạo 3 mạng khi bắt đầu game
    gameState = "PLAYING";
    gameOverReason = "";
    resetFruit();
    resetBomb();
}

function resetFruit() {
    const randomType = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    currentFruit.type = randomType;
    currentFruit.x = Math.random() * (canvas.width - randomType.size);
    currentFruit.y = -randomType.size;
    currentFruit.isGold = Math.random() < 0.4; // 40% xuất hiện bản VÀNG
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

// --- VẼ CHI TIẾT CÁC LOẠI TRÁI CÂY ---
function drawFruit() {
    const cx = currentFruit.x + currentFruit.type.size / 2;
    const cy = currentFruit.y + currentFruit.type.size / 2;
    const size = currentFruit.type.size;
    const r = size / 2;

    const mainColor = currentFruit.isGold ? "#FFD700" : currentFruit.type.color;

    ctx.save();

    if (currentFruit.type.name === "apple") {
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx - r / 3, cy, r * 0.7, 0, Math.PI * 2);
        ctx.arc(cx + r / 3, cy, r * 0.7, 0, Math.PI * 2);
        ctx.arc(cx, cy + r / 4, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#5C4033";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.quadraticCurveTo(cx + 3, cy - r * 0.9, cx + 5, cy - r * 1.1);
        ctx.stroke();

        ctx.fillStyle = currentFruit.isGold ? "#B8860B" : "#32CD32";
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - r * 0.8, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

    } else if (currentFruit.type.name === "orange") {
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.arc(cx, cy - r + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(cx - r / 2, cy, 2, 2);
        ctx.fillRect(cx + r / 3, cy - 3, 2, 2);
        ctx.fillRect(cx - 2, cy + r / 3, 2, 2);

    } else if (currentFruit.type.name === "banana") {
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(cx - 6, cy, r * 0.9, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        ctx.fillStyle = "#5C4033";
        ctx.beginPath();
        ctx.arc(cx + r / 2 - 2, cy - r + 3, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + r / 2 - 2, cy + r - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

    } else if (currentFruit.type.name === "strawberry") {
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r);
        ctx.quadraticCurveTo(cx - r * 1.1, cy - r * 0.2, cx - r * 0.8, cy - r * 0.5);
        ctx.quadraticCurveTo(cx, cy - r * 0.8, cx + r * 0.8, cy - r * 0.5);
        ctx.quadraticCurveTo(cx + r * 1.1, cy - r * 0.2, cx, cy + r);
        ctx.fill();

        ctx.fillStyle = currentFruit.isGold ? "#B8860B" : "#228B22";
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.5, 5, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = "#FFF8DC";
        const dots = [[-3, -2], [3, -2], [-5, 3], [5, 3], [0, 7]];
        dots.forEach(([dx, dy]) => {
            ctx.fillRect(cx + dx, cy + dy, 1.5, 2.5);
        });

    } else if (currentFruit.type.name === "watermelon") {
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.8);
        ctx.lineTo(cx - r, cy - r * 0.6);
        ctx.lineTo(cx + r, cy - r * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = currentFruit.isGold ? "#B8860B" : "#006400";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - r - 1, cy - r * 0.6);
        ctx.lineTo(cx + r + 1, cy - r * 0.6);
        ctx.stroke();

        ctx.fillStyle = "#000";
        ctx.fillRect(cx - 3, cy - 1, 2, 3);
        ctx.fillRect(cx + 3, cy - 1, 2, 3);
        ctx.fillRect(cx, cy + 5, 2, 3);
    }

    if (currentFruit.isGold) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// Vẽ giỏ hứng
function drawBasket() {
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 6);
    ctx.fill();

    ctx.fillStyle = "#A0522D";
    ctx.fillRect(basket.x + 5, basket.y + 4, basket.width - 10, 4);
}

// Vẽ Bom
function drawBomb() {
    if (!bomb.active) return;

    const cx = bomb.x + bomb.size / 2;
    const cy = bomb.y + bomb.size / 2;
    const r = bomb.size / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
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
    if (gameState !== "PLAYING") return;

    basket.x += basket.dx;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

    currentFruit.y += currentFruit.speed;

    // Hứng trái cây thành công
    if (
        currentFruit.y + currentFruit.type.size >= basket.y &&
        currentFruit.x + currentFruit.type.size >= basket.x &&
        currentFruit.x <= basket.x + basket.width
    ) {
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

    // Bỏ sót trái cây -> Trừ mạng
    if (currentFruit.y > canvas.height) {
        lives -= 1;
        if (lives > 0) {
            playLoseLifeSound();
            resetFruit();
        } else {
            gameState = "GAMEOVER";
            gameOverReason = "BẠN ĐÃ HẾT MẠNG!";
            playGameOverSound();
        }
    }

    // Né bom
    if (bomb.active) {
        bomb.y += bomb.speed;

        if (
            bomb.y + bomb.size >= basket.y &&
            bomb.x + bomb.size >= basket.x &&
            bomb.x <= basket.x + basket.width
        ) {
            gameState = "GAMEOVER";
            gameOverReason = "💥 BẠN ĐÃ TRÚNG BOM!";
            playExplosionSound();
        }

        if (bomb.y > canvas.height) {
            resetBomb();
        }
    }
}

// --- VẼ MÀN HÌNH ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "MENU") {
        // --- MÀN HÌNH MENU ---
        ctx.fillStyle = "rgba(255, 250, 240, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#2E8B57";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText("HỨNG TRÁI CÂY", canvas.width / 2, 80);

        ctx.fillStyle = "#555";
        ctx.font = "14px Arial";
        ctx.fillText("❤️ Có tổng cộng 3 mạng chơi", canvas.width / 2, 125);
        ctx.fillText("🍎 Trái Thường: +10 điểm", canvas.width / 2, 150);
        ctx.fillStyle = "#B8860B";
        ctx.fillText("🌟 Trái Vàng: +20 điểm", canvas.width / 2, 175);
        ctx.fillStyle = "#D9534F";
        ctx.fillText("💥 Bom đen: Nổ thua ngay!", canvas.width / 2, 200);

        ctx.fillStyle = "#D2691E";
        ctx.font = "bold 15px Arial";
        ctx.fillText("🏆 Kỷ lục: " + highScore + " điểm", canvas.width / 2, 240);

        // Nút Bắt đầu
        ctx.fillStyle = "#28A745";
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 80, 280, 160, 45, 10);
        ctx.fill();

        ctx.fillStyle = "#FFF";
        ctx.font = "bold 18px Arial";
        ctx.fillText("BẮT ĐẦU", canvas.width / 2, 308);

    } else if (gameState === "PLAYING") {
        // --- MÀN HÌNH CHƠI GAME ---
        drawBasket();
        drawFruit();
        drawBomb();

        // Hiển thị số Mạng (Lives) dạng trái tim
        let heartStr = "";
        for (let i = 0; i < lives; i++) heartStr += "❤️";
        ctx.fillStyle = "#FF0000";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.fillText(heartStr, 15, 30);

        // Hiển thị Điểm số
        ctx.fillStyle = "#222";
        ctx.font = "bold 16px Arial";
        ctx.fillText("Điểm: " + score, 110, 30);

        // Hiển thị Kỷ lục
        ctx.fillStyle = "#D2691E";
        ctx.textAlign = "right";
        ctx.fillText("Kỷ lục: " + highScore, canvas.width - 15, 30);

    } else if (gameState === "GAMEOVER") {
        // --- MÀN HÌNH GAME OVER ---
        drawBasket();
        drawFruit();
        drawBomb();

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FF3333";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 45);

        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 15px Arial";
        ctx.fillText(gameOverReason, canvas.width / 2, canvas.height / 2 - 12);

        ctx.fillStyle = "#FFF";
        ctx.font = "16px Arial";
        ctx.fillText("Điểm của bạn: " + score, canvas.width / 2, canvas.height / 2 + 22);

        // Nút Chơi lại
        ctx.fillStyle = "#007BFF";
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 75, canvas.height / 2 + 50, 150, 40, 8);
        ctx.fill();

        ctx.fillStyle = "#FFF";
        ctx.font = "bold 16px Arial";
        ctx.fillText("CHƠI LẠI", canvas.width / 2, canvas.height / 2 + 75);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
