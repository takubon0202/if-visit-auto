// =============================================
// if(塾) ランナーゲーム - マリオ風横スクロール
// =============================================

class IFJukuGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = 800;
    this.height = 400;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // ゲーム状態
    this.gameState = 'start'; // start, playing, gameover, clear
    this.score = 0;
    this.distance = 0;
    this.goalDistance = 3000;

    // プレイヤー
    this.player = {
      x: 100,
      y: this.height - 100,
      width: 40,
      height: 56,
      velocityY: 0,
      isJumping: false,
      isInvincible: false,
      invincibleTimer: 0,
      frame: 0,
      frameTimer: 0
    };

    // 物理
    this.gravity = 0.8;
    this.jumpForce = -15;
    this.groundY = this.height - 60;

    // 障害物とアイテム
    this.obstacles = [];
    this.items = [];
    this.particles = [];

    // スクロール速度
    this.scrollSpeed = 5;
    this.baseScrollSpeed = 5;

    // 背景要素
    this.bgElements = [];
    this.initBackground();

    // 入力
    this.keys = {};
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;

    // イベントリスナー
    this.setupEventListeners();

    // ゲームループ開始
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  // 背景初期化
  initBackground() {
    // サイバーパンク風の背景ビル
    for (let i = 0; i < 10; i++) {
      this.bgElements.push({
        x: i * 150,
        width: 80 + Math.random() * 60,
        height: 100 + Math.random() * 150,
        speed: 1
      });
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    // キーボード
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (this.gameState === 'start') this.startGame();
        else if (this.gameState === 'gameover' || this.gameState === 'clear') this.resetGame();
        else if (this.gameState === 'playing') this.jump();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // タッチ/クリック
    this.canvas.addEventListener('click', (e) => {
      if (this.gameState === 'start') {
        this.startGame();
      } else if (this.gameState === 'gameover' || this.gameState === 'clear') {
        this.resetGame();
      } else if (this.gameState === 'playing') {
        this.jump();
      }
    });

    // タッチ操作
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;

      if (this.gameState === 'playing') {
        this.jump();
      }
    });
  }

  // ゲーム開始
  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.distance = 0;
    this.obstacles = [];
    this.items = [];
    this.spawnObstacle();
  }

  // リセット
  resetGame() {
    this.player.x = 100;
    this.player.y = this.groundY - this.player.height;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.isInvincible = false;
    this.scrollSpeed = this.baseScrollSpeed;
    this.startGame();
  }

  // ジャンプ
  jump() {
    if (!this.player.isJumping) {
      this.player.velocityY = this.jumpForce;
      this.player.isJumping = true;
      this.createJumpParticles();
    }
  }

  // ジャンプパーティクル
  createJumpParticles() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2,
        life: 20,
        color: '#00ffcc'
      });
    }
  }

  // 障害物生成
  spawnObstacle() {
    const types = ['spike', 'bug', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];

    const obstacle = {
      x: this.width + 50,
      type: type,
      passed: false
    };

    switch (type) {
      case 'spike':
        obstacle.y = this.groundY - 30;
        obstacle.width = 30;
        obstacle.height = 30;
        break;
      case 'bug':
        obstacle.y = this.groundY - 25;
        obstacle.width = 35;
        obstacle.height = 25;
        obstacle.frame = 0;
        break;
      case 'gap':
        obstacle.y = this.groundY;
        obstacle.width = 60;
        obstacle.height = 60;
        break;
    }

    this.obstacles.push(obstacle);

    // アイテムも一緒に生成
    if (Math.random() > 0.3) {
      this.spawnItem(obstacle.x + 100);
    }
  }

  // アイテム生成
  spawnItem(x) {
    const types = ['coin', 'star'];
    const type = Math.random() > 0.8 ? 'star' : 'coin';

    this.items.push({
      x: x + Math.random() * 100,
      y: this.groundY - 80 - Math.random() * 60,
      width: 25,
      height: 25,
      type: type,
      frame: 0
    });
  }

  // 更新
  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // 距離更新
    this.distance += this.scrollSpeed;

    // ゴール判定
    if (this.distance >= this.goalDistance) {
      this.gameState = 'clear';
      return;
    }

    // 速度を徐々に上げる
    this.scrollSpeed = this.baseScrollSpeed + (this.distance / 1000) * 0.5;

    // プレイヤー物理
    this.player.velocityY += this.gravity;
    this.player.y += this.player.velocityY;

    // 地面判定
    if (this.player.y >= this.groundY - this.player.height) {
      this.player.y = this.groundY - this.player.height;
      this.player.velocityY = 0;
      this.player.isJumping = false;
    }

    // 無敵タイマー
    if (this.player.isInvincible) {
      this.player.invincibleTimer--;
      if (this.player.invincibleTimer <= 0) {
        this.player.isInvincible = false;
      }
    }

    // アニメーションフレーム
    this.player.frameTimer++;
    if (this.player.frameTimer > 8) {
      this.player.frame = (this.player.frame + 1) % 4;
      this.player.frameTimer = 0;
    }

    // 障害物更新
    this.obstacles.forEach((obs, index) => {
      obs.x -= this.scrollSpeed;

      if (obs.type === 'bug') {
        obs.frame = (obs.frame + 0.2) % 2;
      }

      // 衝突判定
      if (this.checkCollision(this.player, obs) && !this.player.isInvincible) {
        if (obs.type === 'gap') {
          // 穴に落ちた
          this.gameState = 'gameover';
        } else {
          this.gameState = 'gameover';
        }
      }

      // スコア加算（通過時）
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true;
        this.score += 50;
      }
    });

    // 画面外の障害物を削除
    this.obstacles = this.obstacles.filter(obs => obs.x > -100);

    // 新しい障害物生成
    if (this.obstacles.length === 0 ||
        this.obstacles[this.obstacles.length - 1].x < this.width - 300) {
      this.spawnObstacle();
    }

    // アイテム更新
    this.items.forEach((item, index) => {
      item.x -= this.scrollSpeed;
      item.frame = (item.frame + 0.1) % 2;

      // 収集判定
      if (this.checkCollision(this.player, item)) {
        if (item.type === 'coin') {
          this.score += 100;
          this.createCoinParticles(item.x, item.y);
        } else if (item.type === 'star') {
          this.player.isInvincible = true;
          this.player.invincibleTimer = 180; // 3秒
          this.score += 300;
        }
        this.items.splice(index, 1);
      }
    });

    // 画面外のアイテムを削除
    this.items = this.items.filter(item => item.x > -50);

    // パーティクル更新
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // 背景更新
    this.bgElements.forEach(bg => {
      bg.x -= bg.speed;
      if (bg.x + bg.width < 0) {
        bg.x = this.width;
        bg.height = 100 + Math.random() * 150;
      }
    });
  }

  // コインパーティクル
  createCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 15,
        color: '#ffff00'
      });
    }
  }

  // 衝突判定
  checkCollision(a, b) {
    const padding = 5;
    return a.x + padding < b.x + b.width &&
           a.x + a.width - padding > b.x &&
           a.y + padding < b.y + b.height &&
           a.y + a.height - padding > b.y;
  }

  // 描画
  draw() {
    // 背景クリア
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // グリッド背景
    this.drawGrid();

    // 背景ビル
    this.drawBackground();

    // 地面
    this.drawGround();

    // 障害物
    this.obstacles.forEach(obs => this.drawObstacle(obs));

    // アイテム
    this.items.forEach(item => this.drawItem(item));

    // プレイヤー
    this.drawPlayer();

    // パーティクル
    this.drawParticles();

    // UI
    this.drawUI();

    // 状態別画面
    if (this.gameState === 'start') {
      this.drawStartScreen();
    } else if (this.gameState === 'gameover') {
      this.drawGameOverScreen();
    } else if (this.gameState === 'clear') {
      this.drawClearScreen();
    }
  }

  // グリッド背景
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
    this.ctx.lineWidth = 1;

    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  // 背景ビル
  drawBackground() {
    this.bgElements.forEach(bg => {
      const gradient = this.ctx.createLinearGradient(bg.x, this.height - bg.height, bg.x, this.height);
      gradient.addColorStop(0, 'rgba(0, 255, 204, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 204, 0.05)');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(bg.x, this.groundY - bg.height, bg.width, bg.height);

      // ビルのライト
      this.ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
      for (let y = this.groundY - bg.height + 20; y < this.groundY - 20; y += 30) {
        for (let x = bg.x + 10; x < bg.x + bg.width - 10; x += 20) {
          if (Math.random() > 0.5) {
            this.ctx.fillRect(x, y, 8, 8);
          }
        }
      }
    });
  }

  // 地面
  drawGround() {
    // メイン地面
    const groundGradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGradient.addColorStop(0, '#1a1a2e');
    groundGradient.addColorStop(1, '#0a0a0a');

    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // 地面ライン
    this.ctx.strokeStyle = '#00ffcc';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.width, this.groundY);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  // プレイヤー描画
  drawPlayer() {
    const p = this.player;

    // 無敵時は点滅
    if (p.isInvincible && Math.floor(p.invincibleTimer / 5) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // グロー効果
    this.ctx.shadowColor = p.isInvincible ? '#ffff00' : '#00ffcc';
    this.ctx.shadowBlur = 15;

    // 体（黄色いジャケット）
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.fillRect(p.x + 5, p.y + 15, 30, 25);

    // 頭
    this.ctx.fillStyle = '#fad7a0';
    this.ctx.fillRect(p.x + 8, p.y, 24, 20);

    // 髪（茶色）
    this.ctx.fillStyle = '#6b4423';
    this.ctx.fillRect(p.x + 5, p.y - 3, 30, 12);
    this.ctx.fillRect(p.x + 8, p.y + 5, 5, 8);

    // 目
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(p.x + 18, p.y + 8, 4, 4);
    this.ctx.fillRect(p.x + 26, p.y + 8, 4, 4);

    // ズボン
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(p.x + 8, p.y + 40, 24, 16);

    // 足（アニメーション）
    const legOffset = Math.sin(p.frame * Math.PI / 2) * 5;
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(p.x + 10, p.y + 50, 8, 6 + (p.isJumping ? 0 : legOffset));
    this.ctx.fillRect(p.x + 22, p.y + 50, 8, 6 + (p.isJumping ? 0 : -legOffset));

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  // 障害物描画
  drawObstacle(obs) {
    this.ctx.shadowColor = '#ff3366';
    this.ctx.shadowBlur = 10;

    switch (obs.type) {
      case 'spike':
        // スパイク
        this.ctx.fillStyle = '#ff3366';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x, obs.y + obs.height);
        this.ctx.lineTo(obs.x + obs.width / 2, obs.y);
        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'bug':
        // バグ（虫）
        this.ctx.fillStyle = '#ff3366';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // 足
        const legY = Math.floor(obs.frame) % 2 === 0 ? 2 : -2;
        this.ctx.fillRect(obs.x - 5, obs.y + obs.height - 5 + legY, 8, 3);
        this.ctx.fillRect(obs.x + obs.width - 3, obs.y + obs.height - 5 - legY, 8, 3);
        // 目
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(obs.x + 5, obs.y + 5, 6, 6);
        this.ctx.fillRect(obs.x + obs.width - 11, obs.y + 5, 6, 6);
        break;

      case 'gap':
        // 穴
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // 危険マーク
        this.ctx.strokeStyle = '#ff3366';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        break;
    }

    this.ctx.shadowBlur = 0;
  }

  // アイテム描画
  drawItem(item) {
    const bounce = Math.sin(Date.now() / 200) * 3;

    if (item.type === 'coin') {
      // コイン
      this.ctx.shadowColor = '#ffff00';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.arc(item.x + item.width / 2, item.y + item.height / 2 + bounce, item.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
      // 光沢
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(item.x + item.width / 2 - 3, item.y + item.height / 2 - 3 + bounce, 4, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (item.type === 'star') {
      // スター
      this.ctx.shadowColor = '#00ffcc';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = '#00ffcc';
      this.drawStar(item.x + item.width / 2, item.y + item.height / 2 + bounce, 5, item.width / 2, item.width / 4);
    }

    this.ctx.shadowBlur = 0;
  }

  // 星を描画
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // パーティクル描画
  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.life / 20;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    this.ctx.globalAlpha = 1;
  }

  // UI描画
  drawUI() {
    // スコア
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = 'bold 20px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText(`SCORE: ${this.score}`, 20, 35);

    // 距離（プログレスバー）
    const progress = Math.min(this.distance / this.goalDistance, 1);
    this.ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
    this.ctx.fillRect(20, 50, 200, 15);
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.fillRect(20, 50, 200 * progress, 15);

    this.ctx.font = '12px "Press Start 2P", monospace';
    this.ctx.fillText(`${Math.floor(progress * 100)}%`, 230, 62);

    this.ctx.shadowBlur = 0;
  }

  // スタート画面
  drawStartScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = 'bold 36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00ffcc';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('if(RUN)', this.width / 2, this.height / 2 - 50);

    this.ctx.font = '16px "Noto Sans JP", sans-serif';
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('スペースキー or クリックでスタート', this.width / 2, this.height / 2 + 20);
    this.ctx.fillText('スペースキー or タップでジャンプ', this.width / 2, this.height / 2 + 50);
  }

  // ゲームオーバー画面
  drawGameOverScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#ff3366';
    this.ctx.font = 'bold 36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#ff3366';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);

    this.ctx.font = '16px "Noto Sans JP", sans-serif';
    this.ctx.fillText('クリックでリトライ', this.width / 2, this.height / 2 + 60);
  }

  // クリア画面
  drawClearScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = 'bold 36px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00ff00';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('CLEAR!', this.width / 2, this.height / 2 - 50);

    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);

    this.ctx.font = '16px "Noto Sans JP", sans-serif';
    this.ctx.fillText('クリックでもう一度', this.width / 2, this.height / 2 + 60);
  }

  // ゲームループ
  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop);
  }
}

// グローバルに公開
window.IFJukuGame = IFJukuGame;
