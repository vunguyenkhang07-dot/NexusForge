const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Cấu hình người chơi (Cái giỏ)
const basket = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 30,
    width: 60,
    height: 20,
    speed: 7,
    dx: 0
};

// Cấu hình quả táo
const apple = {
    x: Math.random() * (canvas.width - 20),
    y: 0,
    size: 20,
    speed: 4
};

let score = 0;
let gameOver = false;

// Bắt sự kiện bàn phím
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") basket.dx = -basket.speed;
    if (e.key === "ArrowRight" || e.key === "d") basket.dx = basket.speed;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d") {
        basket.dx = 0;
    }
});

// Hàm cập nhật trạng thái game
function update() {
    if (gameOver) return;

    // Di chuyển giỏ
    basket.x += basket.dx;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

    // Di chuyển táo
    apple.y += apple.speed;

    // Va chạm: Hứng được táo
    if (
        apple.y + apple.size >= basket.y &&
        apple.x + apple.size >= basket.x &&
        apple.x <= basket.x + basket.width
    ) {
        score += 10;
        resetApple();
    }

    // Táo rơi chạm đáy (Thua cuộc)
    if (apple.y > canvas.height) {
        gameOver = true;
    }
}

// Reset quả táo lên đỉnh màn hình
function resetApple() {
    apple.x = Math.random() * (canvas.width - apple.size);
    apple.y = 0;
    apple.speed += 0.2; // Tăng dần tốc độ sau mỗi lần hứng
}

// Vẽ các đối tượng lên Canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ giỏ
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

    // Vẽ táo
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(apple.x + apple.size / 2, apple.y + apple.size / 2, apple.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ điểm số
    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.fillText("Điểm: " + score, 10, 25);

    // Thông báo thua
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px Arial";
        ctx.fillText("GAME OVER", 110, canvas.height / 2);
        ctx.fillStyle = "#000";
        ctx.font = "16px Arial";
        ctx.fillText("F5 để chơi lại", 150, canvas.height / 2 + 30);
    }
}

// Vòng lặp chính của game
function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();