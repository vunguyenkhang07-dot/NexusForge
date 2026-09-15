<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Hứng Trái Cây</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #1a1a2e;
            color: #fff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }

        h1 {
            margin-bottom: 12px;
            color: #ffdd59;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
            font-size: 2rem;
        }

        #game-container {
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            border-radius: 12px;
            overflow: hidden;
        }

        canvas {
            display: block;
            background-color: #87ceeb;
            transition: background-color 2s ease; /* Chuyển màu nền mượt mà */
        }

        .controls-hint {
            margin-top: 12px;
            font-size: 0.9rem;
            color: #dcdde1;
        }
    </style>
</head>
<body>

    <h1>GAME HỨNG TRÁI CÂY</h1>

    <div id="game-container">
        <canvas id="gameCanvas" width="500" height="600"></canvas>
    </div>

    <p class="controls-hint">Sử dụng <b>Phím Mũi Tên Trái/Phải</b> hoặc <b>Di chuyển Chuột</b> để điều khiển thanh hứng.</p>

    <script>
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        // --- CẤU HÌNH & TRẠNG THÁI GAME ---
        let score = 0;
        let lives = 3;
        let gameOver = false;

        // Kích thước thanh hứng cơ bản
        const BASE_PADDLE_WIDTH = 100;
        const PADDLE_HEIGHT = 18;

        const paddle = {
            x: canvas.width / 2 - BASE_PADDLE_WIDTH / 2,
            y: canvas.height - 30,
            width: BASE_PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            speed: 8,
            isExpanded: false,
            expandTimer: null
        };

        // Điều khiển phím
        let rightPressed = false;
        let leftPressed = false;

        // Danh sách vật phẩm rơi
        let items = [];
        let spawnTimer = 0;

        // Trạng thái hiệu ứng Rung màn hình (Screen Shake)
        let shakeDuration = 0;
        let shakeMagnitude = 0;

        // Các loại trái cây & vật phẩm
        const ITEM_TYPES = {
            APPLE: { type: 'fruit', symbol: '🍎', pts: 1, speed: 3 },
            BANANA: { type: 'fruit', symbol: '🍌', pts: 2, speed: 4 },
            WATERMELON: { type: 'fruit', symbol: '🍉', pts: 3, speed: 5 },
            BOMB: { type: 'bomb', symbol: '💣', pts: 0, speed: 4.5 },
            EXPAND: { type: 'powerup', symbol: '↔', pts: 0, speed: 3.5 } // Vật phẩm mở rộng thanh hứng
        };

        // --- SỰ KIỆN ĐIỀU KHIỂN ---
        document.addEventListener("keydown", (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
            if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
            if (e.key === "r" || e.key === "R") {
                if (gameOver) restartGame();
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
            if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
        });

        // Điều khiển bằng chuột
        canvas.addEventListener("mousemove", (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            paddle.x = mouseX - paddle.width / 2;
        });

        // --- HÀM TẠO HIỆU ỨNG RUNG MÀN HÌNH ---
        function triggerScreenShake(duration = 15, magnitude = 10) {
            shakeDuration = duration;
            shakeMagnitude = magnitude;
        }

        // --- TẠO VẬT PHẨM RƠI ---
        function spawnItem() {
            const rand = Math.random();
            let selectedType;

            if (rand < 0.50) {
                selectedType = ITEM_TYPES.APPLE;
            } else if (rand < 0.70) {
                selectedType = ITEM_TYPES.BANANA;
            } else if (rand < 0.82) {
                selectedType = ITEM_TYPES.WATERMELON;
            } else if (rand < 0.93) {
                selectedType = ITEM_TYPES.BOMB;
            } else {
                selectedType = ITEM_TYPES.EXPAND; // Mũi tên 2 đầu mở rộng
            }

            items.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: -30,
                radius: 20,
                ...selectedType
            });
        }

        // --- CẬP NHẬT MÀU NỀN THEO ĐIỂM SỐ ---
        function updateBackgroundTheme() {
            if (score < 10) {
                // Ban ngày (Xanh bầu trời)
                canvas.style.backgroundColor = "#87ceeb";
            } else if (score < 20) {
                // Hoàng hôn (Cam gạch / Tím ấm)
                canvas.style.backgroundColor = "#e67e22";
            } else {
                // Ban đêm (Xanh đen đậm)
                canvas.style.backgroundColor = "#1e272e";
            }
        }

        // --- KÍCH HOẠT VẬT PHẨM MỞ RỘNG ---
        function activateExpandPowerup() {
            paddle.width = BASE_PADDLE_WIDTH * 1.5; // Gấp rưỡi (150px)
            paddle.isExpanded = true;

            // Xóa bộ đếm thời gian cũ nếu ăn liên tiếp
            if (paddle.expandTimer) clearTimeout(paddle.expandTimer);

            // Trở về kích thước ban đầu sau 8 giây
            paddle.expandTimer = setTimeout(() => {
                paddle.width = BASE_PADDLE_WIDTH;
                paddle.isExpanded = false;
            }, 8000);
        }

        // --- CẬP NHẬT LOGIC GAME ---
        function update() {
            if (gameOver) return;

            // Di chuyển thanh hứng bằng bàn phím
            if (rightPressed && paddle.x < canvas.width - paddle.width) {
                paddle.x += paddle.speed;
            } else if (leftPressed && paddle.x > 0) {
                paddle.x -= paddle.speed;
            }

            // Giới hạn thanh hứng trong màn hình
            if (paddle.x < 0) paddle.x = 0;
            if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

            // Sinh vật phẩm theo thời gian
            spawnTimer++;
            if (spawnTimer > 40) {
                spawnItem();
                spawnTimer = 0;
            }

            // Cập nhật vị trí các vật phẩm
            for (let i = items.length - 1; i >= 0; i--) {
                let item = items[i];
                item.y += item.speed;

                // Kiểm tra va chạm với thanh hứng
                if (
                    item.y + item.radius >= paddle.y &&
                    item.y - item.radius <= paddle.y + paddle.height &&
                    item.x >= paddle.x &&
                    item.x <= paddle.x + paddle.width
                ) {
                    // Xử lý loại vật phẩm
                    if (item.type === 'fruit') {
                        score += item.pts;
                    } else if (item.type === 'bomb') {
                        lives--;
                        triggerScreenShake(20, 12); // Rung màn hình khi trúng bom
                        if (lives <= 0) gameOver = true;
                    } else if (item.type === 'powerup') {
                        activateExpandPowerup();
                    }

                    items.splice(i, 1);
                    continue;
                }

                // Xử lý khi vật phẩm rơi chạm đáy
                if (item.y - item.radius > canvas.height) {
                    if (item.type === 'fruit') {
                        lives--;
                        if (lives <= 0) gameOver = true;
                    }
                    items.splice(i, 1);
                }
            }

            updateBackgroundTheme();
        }

        // --- VẼ HÌNH TRÊN CANVAS ---
        function draw() {
            ctx.save();

            // Áp dụng hiệu ứng Rung màn hình (Screen Shake)
            if (shakeDuration > 0) {
                let offsetX = (Math.random() - 0.5) * shakeMagnitude;
                let offsetY = (Math.random() - 0.5) * shakeMagnitude;
                ctx.translate(offsetX, offsetY);
                shakeDuration--;
            }

            // Xóa màn hình
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Vẽ thanh hứng
            ctx.fillStyle = paddle.isExpanded ? "#2ecc71" : "#d35400"; // Đổi sang màu xanh khi đang mở rộng
            ctx.beginPath();
            ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();

            // 2. Vẽ các vật phẩm rơi
            ctx.font = "28px Sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            items.forEach(item => {
                ctx.fillText(item.symbol, item.x, item.y);
            });

            // 3. Vẽ UI (Điểm số & Mạng)
            ctx.fillStyle = score >= 20 ? "#ffffff" : "#2c3e50"; // Đổi màu chữ UI khi sang ban đêm
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "left";
            ctx.fillText(`Điểm: ${score}`, 15, 30);

            ctx.textAlign = "right";
            ctx.fillText(`Mạng: ${"❤️".repeat(lives)}`, canvas.width - 15, 30);

            // Trạng thái hiệu ứng mở rộng
            if (paddle.isExpanded) {
                ctx.fillStyle = "#f1c40f";
                ctx.font = "bold 13px Arial";
                ctx.textAlign = "center";
                ctx.fillText("⚡ THANH HỨNG MỞ RỘNG (↔) ⚡", canvas.width / 2, 30);
            }

            // 4. Màn hình Game Over
            if (gameOver) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "#e74c3c";
                ctx.font = "bold 36px Arial";
                ctx.textAlign = "center";
                ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

                ctx.fillStyle = "#ffffff";
                ctx.font = "20px Arial";
                ctx.fillText(`Tổng điểm của bạn: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
                ctx.font = "16px Arial";
                ctx.fillText("Bấm phím 'R' để chơi lại", canvas.width / 2, canvas.height / 2 + 65);
            }

            ctx.restore();
        }

        // --- KHỞI ĐỘNG LẠI GAME ---
        function restartGame() {
            score = 0;
            lives = 3;
            items = [];
            gameOver = false;
            paddle.width = BASE_PADDLE_WIDTH;
            paddle.isExpanded = false;
            if (paddle.expandTimer) clearTimeout(paddle.expandTimer);
        }

        // --- VÒNG LẶP CHÍNH (GAME LOOP) ---
        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        // Chạy game
        gameLoop();
    </script>
</body>
</html>
