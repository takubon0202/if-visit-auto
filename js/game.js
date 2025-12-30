// =============================================
// if(Run) ~塾長の挑戦~ - マリオ風横スクロールゲーム
// =============================================

class IFRunGame {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isFullscreen = options.fullscreen || false;

    // サイズ設定（レスポンシブ）
    this.setupSize();

    // ゲーム状態
    this.gameState = 'start'; // start, playing, gameover, clear, stageClear
    this.score = 0;
    this.totalScore = 0;
    this.distance = 0;

    // ステージ設定（5ステージ）
    this.currentStage = 1;
    this.maxStage = 5;
    this.stageSettings = {
      1: { goalDistance: 2000, name: 'はじまりの丘', obstacleRate: 0.4, bgColor: '#5C94FC' },
      2: { goalDistance: 2500, name: '森のステージ', obstacleRate: 0.5, bgColor: '#4A8A4A' },
      3: { goalDistance: 3000, name: '砂漠ステージ', obstacleRate: 0.55, bgColor: '#DEB887' },
      4: { goalDistance: 3500, name: '夜のステージ', obstacleRate: 0.6, bgColor: '#1a1a3e' },
      5: { goalDistance: 4000, name: '塾長城への道', obstacleRate: 0.65, bgColor: '#8B0000' }
    };
    this.goalDistance = this.stageSettings[1].goalDistance;

    // ゴールポール関連
    this.goalPoleX = 0;
    this.goalReached = false;
    this.flagY = 0;
    this.flagAnimating = false;

    // スピード設定
    this.speedSettings = {
      slow: { baseSpeed: 2.5, label: 'ゆっくり', color: '#00CC00', speedIncrease: 0.15 },
      normal: { baseSpeed: 3.5, label: 'ふつう', color: '#FFAA00', speedIncrease: 0.25 },
      fast: { baseSpeed: 5, label: 'はやい', color: '#FF4444', speedIncrease: 0.4 }
    };
    this.selectedSpeed = 'slow'; // デフォルトはゆっくり
    this.speedButtonRects = []; // クリック判定用

    // プレイヤー
    this.player = {
      x: 100,
      y: this.groundY - 56,
      width: 40,
      height: 56,
      velocityY: 0,
      isJumping: false,
      isInvincible: false,
      invincibleTimer: 0,
      frame: 0,
      frameTimer: 0
    };

    // 物理（マリオ風のふわっとしたジャンプ）
    this.gravity = 0.4;
    this.jumpForce = -11;

    // 障害物とアイテム
    this.obstacles = [];
    this.items = [];
    this.particles = [];

    // スクロール速度（デフォルトはゆっくり）
    this.scrollSpeed = this.speedSettings.slow.baseSpeed;
    this.baseScrollSpeed = this.speedSettings.slow.baseSpeed;

    // マリオ風背景要素
    this.clouds = [];
    this.hills = [];
    this.bushes = [];
    this.initMarioBackground();

    // 入力
    this.keys = {};
    this.setupEventListeners();

    // リサイズ対応
    window.addEventListener('resize', () => this.handleResize());

    // ゲームループ開始
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  // サイズ設定
  setupSize() {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    if (this.isFullscreen) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else if (isMobile) {
      this.width = Math.min(window.innerWidth - 32, 480);
      this.height = Math.floor(this.width * 0.6);
    } else if (isTablet) {
      this.width = Math.min(window.innerWidth - 64, 720);
      this.height = Math.floor(this.width * 0.55);
    } else {
      this.width = 960;
      this.height = 540;
    }

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.groundY = this.height - 80;

    // スケール計算
    this.scale = this.width / 960;
  }

  // リサイズハンドラ
  handleResize() {
    this.setupSize();
    if (this.player) {
      this.player.y = this.groundY - this.player.height;
    }
  }

  // マリオ風背景初期化
  initMarioBackground() {
    // 雲
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: i * 200 + Math.random() * 100,
        y: 40 + Math.random() * 60,
        width: 80 + Math.random() * 40,
        speed: 0.3
      });
    }

    // 丘
    this.hills = [];
    for (let i = 0; i < 4; i++) {
      this.hills.push({
        x: i * 350,
        width: 200 + Math.random() * 100,
        height: 80 + Math.random() * 40,
        speed: 0.8
      });
    }

    // 草むら
    this.bushes = [];
    for (let i = 0; i < 8; i++) {
      this.bushes.push({
        x: i * 180 + Math.random() * 50,
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: 1.5
      });
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    // キーボード
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (this.gameState === 'start') {
        // スピード選択（1, 2, 3キー）
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          this.selectedSpeed = 'slow';
          this.baseScrollSpeed = this.speedSettings.slow.baseSpeed;
          this.scrollSpeed = this.baseScrollSpeed;
          this.startGame();
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          this.selectedSpeed = 'normal';
          this.baseScrollSpeed = this.speedSettings.normal.baseSpeed;
          this.scrollSpeed = this.baseScrollSpeed;
          this.startGame();
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          this.selectedSpeed = 'fast';
          this.baseScrollSpeed = this.speedSettings.fast.baseSpeed;
          this.scrollSpeed = this.baseScrollSpeed;
          this.startGame();
        } else if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          // デフォルト（ゆっくり）でスタート
          this.baseScrollSpeed = this.speedSettings[this.selectedSpeed].baseSpeed;
          this.scrollSpeed = this.baseScrollSpeed;
          this.startGame();
        }
      } else if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (this.gameState === 'stageClear') this.nextStage();
        else if (this.gameState === 'gameover' || this.gameState === 'clear') this.resetGame();
        else if (this.gameState === 'playing') this.jump();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // クリック/タッチ
    this.canvas.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleClick(e);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick(e.touches[0]);
    });
  }

  // クリック/タッチ処理
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    if (this.gameState === 'start') {
      // スピードボタンのクリック判定
      for (const btn of this.speedButtonRects) {
        if (x >= btn.x && x <= btn.x + btn.width &&
            y >= btn.y && y <= btn.y + btn.height) {
          this.selectedSpeed = btn.speed;
          this.baseScrollSpeed = this.speedSettings[btn.speed].baseSpeed;
          this.scrollSpeed = this.baseScrollSpeed;
          this.startGame();
          return;
        }
      }
    } else if (this.gameState === 'stageClear') {
      this.nextStage();
    } else if (this.gameState === 'gameover' || this.gameState === 'clear') {
      this.resetGame();
    } else if (this.gameState === 'playing') {
      this.jump();
    }
  }

  // ゲーム開始
  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.distance = 0;
    this.obstacles = [];
    this.items = [];
    this.goalReached = false;
    this.flagAnimating = false;
    this.flagY = 0;
    this.goalDistance = this.stageSettings[this.currentStage].goalDistance;
    this.spawnObstacle();
  }

  // 次のステージへ
  nextStage() {
    this.currentStage++;
    this.totalScore += this.score;
    this.goalDistance = this.stageSettings[this.currentStage].goalDistance;
    this.resetForNextStage();
  }

  // 次のステージ用リセット
  resetForNextStage() {
    this.player.x = 100;
    this.player.y = this.groundY - this.player.height;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.isInvincible = false;
    this.scrollSpeed = this.baseScrollSpeed;
    this.distance = 0;
    this.obstacles = [];
    this.items = [];
    this.goalReached = false;
    this.flagAnimating = false;
    this.flagY = 0;
    this.gameState = 'playing';
    this.spawnObstacle();
  }

  // 最初からリセット
  resetGame() {
    this.currentStage = 1;
    this.totalScore = 0;
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
        color: '#8B4513'
      });
    }
  }

  // 障害物生成
  spawnObstacle() {
    const types = ['pipe', 'goomba', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];

    const obstacle = {
      x: this.width + 50,
      type: type,
      passed: false
    };

    switch (type) {
      case 'pipe':
        obstacle.y = this.groundY - 50;
        obstacle.width = 40;
        obstacle.height = 50;
        break;
      case 'goomba':
        obstacle.y = this.groundY - 30;
        obstacle.width = 35;
        obstacle.height = 30;
        obstacle.frame = 0;
        break;
      case 'gap':
        obstacle.y = this.groundY;
        obstacle.width = 70;
        obstacle.height = 80;
        break;
    }

    this.obstacles.push(obstacle);

    // アイテム生成
    if (Math.random() > 0.3) {
      this.spawnItem(obstacle.x + 100);
    }
  }

  // アイテム生成
  spawnItem(x) {
    const type = Math.random() > 0.85 ? 'star' : 'coin';

    this.items.push({
      x: x + Math.random() * 100,
      y: this.groundY - 100 - Math.random() * 60,
      width: 28,
      height: 28,
      type: type,
      frame: 0
    });
  }

  // 更新
  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // 距離更新
    this.distance += this.scrollSpeed;

    // ゴールポール到達判定
    if (this.distance >= this.goalDistance - 100 && !this.goalReached) {
      this.goalReached = true;
      this.flagAnimating = true;
      this.flagY = 0;
    }

    // ゴール到達後のフラグアニメーション
    if (this.flagAnimating) {
      this.flagY += 3;
      if (this.flagY >= 150) {
        this.flagAnimating = false;
        // ステージクリア判定
        if (this.currentStage >= this.maxStage) {
          this.gameState = 'clear'; // 全ステージクリア
        } else {
          this.gameState = 'stageClear'; // ステージクリア
        }
        return;
      }
    }

    // ゴールに到達したらスクロール停止
    if (this.goalReached) {
      this.scrollSpeed = 0;
      return;
    }

    // 速度を徐々に上げる（選択したスピードに応じた増加率）
    const speedIncrease = this.speedSettings[this.selectedSpeed].speedIncrease;
    this.scrollSpeed = this.baseScrollSpeed + (this.distance / 1000) * speedIncrease;

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
    this.obstacles.forEach((obs) => {
      obs.x -= this.scrollSpeed;

      if (obs.type === 'goomba') {
        obs.frame = (obs.frame + 0.15) % 2;
      }

      // 衝突判定
      if (this.checkCollision(this.player, obs) && !this.player.isInvincible) {
        this.gameState = 'gameover';
      }

      // スコア加算
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true;
        this.score += 50;
      }
    });

    // 画面外の障害物を削除
    this.obstacles = this.obstacles.filter(obs => obs.x > -100);

    // 新しい障害物生成
    if (this.obstacles.length === 0 ||
        this.obstacles[this.obstacles.length - 1].x < this.width - 350) {
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
          this.player.invincibleTimer = 180;
          this.score += 500;
        }
        this.items.splice(index, 1);
      }
    });

    this.items = this.items.filter(item => item.x > -50);

    // パーティクル更新
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    // 背景更新
    this.updateBackground();
  }

  // 背景更新
  updateBackground() {
    // 雲
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width + 50;
        cloud.y = 40 + Math.random() * 60;
      }
    });

    // 丘
    this.hills.forEach(hill => {
      hill.x -= hill.speed;
      if (hill.x + hill.width < 0) {
        hill.x = this.width + 100;
      }
    });

    // 草むら
    this.bushes.forEach(bush => {
      bush.x -= bush.speed;
      if (bush.x + bush.width < 0) {
        bush.x = this.width + 50;
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
        color: '#FFD700'
      });
    }
  }

  // 衝突判定
  checkCollision(a, b) {
    const padding = 8;
    return a.x + padding < b.x + b.width &&
           a.x + a.width - padding > b.x &&
           a.y + padding < b.y + b.height &&
           a.y + a.height - padding > b.y;
  }

  // 描画
  draw() {
    // マリオ風の空（グラデーション）
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGradient.addColorStop(0, '#5C94FC');
    skyGradient.addColorStop(0.7, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 雲
    this.drawClouds();

    // 丘
    this.drawHills();

    // 草むら
    this.drawBushes();

    // 地面
    this.drawGround();

    // ゴールフラグ（ゴールが近づいたら表示）
    this.drawGoal();

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
    } else if (this.gameState === 'stageClear') {
      this.drawStageClearScreen();
    } else if (this.gameState === 'clear') {
      this.drawClearScreen();
    }
  }

  // 雲を描画
  drawClouds() {
    this.ctx.fillStyle = '#FFFFFF';
    this.clouds.forEach(cloud => {
      // 雲を丸で構成
      const cx = cloud.x + cloud.width / 2;
      const cy = cloud.y;
      const r = cloud.width / 4;

      this.ctx.beginPath();
      this.ctx.arc(cx - r, cy, r * 0.8, 0, Math.PI * 2);
      this.ctx.arc(cx, cy - r * 0.3, r, 0, Math.PI * 2);
      this.ctx.arc(cx + r, cy, r * 0.8, 0, Math.PI * 2);
      this.ctx.arc(cx - r * 0.5, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
      this.ctx.arc(cx + r * 0.5, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // 丘を描画
  drawHills() {
    this.ctx.fillStyle = '#228B22';
    this.hills.forEach(hill => {
      this.ctx.beginPath();
      this.ctx.moveTo(hill.x, this.groundY);
      this.ctx.quadraticCurveTo(
        hill.x + hill.width / 2,
        this.groundY - hill.height,
        hill.x + hill.width,
        this.groundY
      );
      this.ctx.fill();

      // ハイライト
      this.ctx.fillStyle = '#32CD32';
      this.ctx.beginPath();
      this.ctx.moveTo(hill.x + hill.width * 0.3, this.groundY);
      this.ctx.quadraticCurveTo(
        hill.x + hill.width / 2,
        this.groundY - hill.height * 0.8,
        hill.x + hill.width * 0.6,
        this.groundY
      );
      this.ctx.fill();
      this.ctx.fillStyle = '#228B22';
    });
  }

  // 草むらを描画
  drawBushes() {
    this.ctx.fillStyle = '#228B22';
    this.bushes.forEach(bush => {
      const cx = bush.x + bush.width / 2;
      const cy = this.groundY - bush.height / 2;
      const r = bush.height / 2;

      this.ctx.beginPath();
      this.ctx.arc(cx - r * 0.8, cy, r, 0, Math.PI * 2);
      this.ctx.arc(cx, cy - r * 0.2, r * 1.2, 0, Math.PI * 2);
      this.ctx.arc(cx + r * 0.8, cy, r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // 地面を描画（レンガブロック風）
  drawGround() {
    const brickWidth = 40;
    const brickHeight = 20;
    const rows = Math.ceil((this.height - this.groundY) / brickHeight);
    const cols = Math.ceil(this.width / brickWidth) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * brickWidth - (row % 2) * (brickWidth / 2);
        const y = this.groundY + row * brickHeight;

        // レンガ色
        this.ctx.fillStyle = '#C84C0C';
        this.ctx.fillRect(x, y, brickWidth - 2, brickHeight - 2);

        // ハイライト
        this.ctx.fillStyle = '#E87840';
        this.ctx.fillRect(x, y, brickWidth - 2, 4);
        this.ctx.fillRect(x, y, 4, brickHeight - 2);

        // シャドウ
        this.ctx.fillStyle = '#8B3000';
        this.ctx.fillRect(x + brickWidth - 6, y + 4, 4, brickHeight - 6);
        this.ctx.fillRect(x + 4, y + brickHeight - 6, brickWidth - 6, 4);
      }
    }

    // 地面の上部ライン
    this.ctx.fillStyle = '#00AA00';
    this.ctx.fillRect(0, this.groundY - 8, this.width, 8);
  }

  // ゴールを描画（マリオ風フラッグポール）
  drawGoal() {
    if (this.gameState !== 'playing') return;

    // ゴールまでの残り距離
    const remainingDistance = this.goalDistance - this.distance;

    // ゴールポールが画面に近づいたら表示（残り300以内）
    if (remainingDistance <= 300) {
      // ゴールポールのX位置を計算
      const poleX = this.width - 80 + (300 - remainingDistance) * 0.8;
      this.drawFlagPole(poleX);
    }

    // ゴールまでの距離表示（常に表示）
    if (this.distance > 0 && !this.goalReached) {
      const remainingM = Math.max(0, Math.floor((this.goalDistance - this.distance) / 10));

      // 残り距離が少なくなると色が変わる
      let distanceColor = '#FFFFFF';
      if (remainingM <= 50) {
        distanceColor = '#00FF00';
      } else if (remainingM <= 100) {
        distanceColor = '#FFFF00';
      }

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(this.width / 2 - 70, 10, 140, 30);

      this.ctx.fillStyle = distanceColor;
      this.ctx.font = `bold ${Math.max(14, 16 * this.scale)}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`GOAL: ${remainingM}m`, this.width / 2, 30);
    }
  }

  // フラッグポールを描画（マリオ風）
  drawFlagPole(x) {
    const poleHeight = 180;
    const poleY = this.groundY - poleHeight;

    // ポールの土台（レンガ）
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x - 15, this.groundY - 20, 30, 20);
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(x - 12, this.groundY - 18, 24, 4);

    // ポール本体
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(x - 4, poleY, 8, poleHeight - 20);

    // ポール頂上の玉
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(x, poleY, 10, 0, Math.PI * 2);
    this.ctx.fill();

    // 旗（下がるアニメーション）
    const flagTopY = poleY + 10 + this.flagY;
    const flagHeight = 40;
    const flagWidth = 50;

    // 旗のなびき
    const wave = Math.sin(Date.now() / 150) * 5;

    // 旗本体（緑）
    this.ctx.fillStyle = '#00AA00';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 4, flagTopY);
    this.ctx.lineTo(x + flagWidth + wave, flagTopY + flagHeight / 3);
    this.ctx.lineTo(x + flagWidth + wave * 0.5, flagTopY + flagHeight * 2 / 3);
    this.ctx.lineTo(x + 4, flagTopY + flagHeight);
    this.ctx.closePath();
    this.ctx.fill();

    // 旗の模様（if塾マーク）
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${Math.max(10, 12 * this.scale)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('if', x + 25, flagTopY + flagHeight / 2 + 5);

    // GOAL表示
    if (!this.goalReached) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = `bold ${Math.max(14, 18 * this.scale)}px "Press Start 2P", monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText('GOAL', x, poleY - 20);
      this.ctx.shadowBlur = 0;
    }
  }

  // プレイヤー描画
  drawPlayer() {
    const p = this.player;

    // 無敵時は点滅
    if (p.isInvincible && Math.floor(p.invincibleTimer / 5) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // 影
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(p.x + p.width / 2, this.groundY - 2, p.width / 2, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 体（黄色いジャケット）
    this.ctx.fillStyle = '#F4D03F';
    this.ctx.fillRect(p.x + 5, p.y + 18, 30, 22);

    // 腕
    const armOffset = Math.sin(p.frame * Math.PI / 2) * 3;
    this.ctx.fillStyle = '#F4D03F';
    this.ctx.fillRect(p.x, p.y + 20 + armOffset, 8, 15);
    this.ctx.fillRect(p.x + 32, p.y + 20 - armOffset, 8, 15);

    // 頭
    this.ctx.fillStyle = '#FAD7A0';
    this.ctx.fillRect(p.x + 8, p.y + 2, 24, 18);

    // 髪（茶色）
    this.ctx.fillStyle = '#6B4423';
    this.ctx.fillRect(p.x + 5, p.y - 2, 30, 10);
    this.ctx.fillRect(p.x + 8, p.y + 6, 5, 8);
    this.ctx.fillRect(p.x + 27, p.y + 6, 5, 8);

    // 目
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(p.x + 14, p.y + 8, 4, 5);
    this.ctx.fillRect(p.x + 24, p.y + 8, 4, 5);

    // 笑顔
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(p.x + 16, p.y + 15, 8, 2);

    // ズボン
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(p.x + 8, p.y + 40, 24, 10);

    // 足（アニメーション）
    const legOffset = Math.sin(p.frame * Math.PI / 2) * 6;
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(p.x + 8, p.y + 48, 10, 8 + (p.isJumping ? 0 : legOffset));
    this.ctx.fillRect(p.x + 22, p.y + 48, 10, 8 + (p.isJumping ? 0 : -legOffset));

    this.ctx.globalAlpha = 1;
  }

  // 障害物描画
  drawObstacle(obs) {
    switch (obs.type) {
      case 'pipe':
        // 土管（マリオ風）
        this.ctx.fillStyle = '#00AA00';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // 土管の上部
        this.ctx.fillStyle = '#00CC00';
        this.ctx.fillRect(obs.x - 5, obs.y, obs.width + 10, 15);

        // ハイライト
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(obs.x + 5, obs.y + 15, 8, obs.height - 15);
        this.ctx.fillRect(obs.x, obs.y, obs.width + 5, 5);

        // シャドウ
        this.ctx.fillStyle = '#008800';
        this.ctx.fillRect(obs.x + obs.width - 8, obs.y + 15, 8, obs.height - 15);
        break;

      case 'goomba':
        // クリボー風の敵
        const bobY = Math.floor(obs.frame) % 2 === 0 ? 0 : 2;

        // 体
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(obs.x + obs.width / 2, obs.y + 10 + bobY, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // 眉毛（怒り顔）
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(obs.x + 5, obs.y + 5 + bobY, 10, 3);
        this.ctx.fillRect(obs.x + 20, obs.y + 5 + bobY, 10, 3);

        // 目
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(obs.x + 8, obs.y + 8 + bobY, 6, 8);
        this.ctx.fillRect(obs.x + 21, obs.y + 8 + bobY, 6, 8);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(obs.x + 10, obs.y + 10 + bobY, 3, 5);
        this.ctx.fillRect(obs.x + 22, obs.y + 10 + bobY, 3, 5);

        // 足
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(obs.x + 3, obs.y + 22 + bobY, 12, 8);
        this.ctx.fillRect(obs.x + 20, obs.y + 22 + bobY, 12, 8);
        break;

      case 'gap':
        // 穴
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // 穴の縁
        this.ctx.fillStyle = '#8B3000';
        this.ctx.fillRect(obs.x - 5, obs.y - 8, 10, 16);
        this.ctx.fillRect(obs.x + obs.width - 5, obs.y - 8, 10, 16);
        break;
    }
  }

  // アイテム描画
  drawItem(item) {
    const bounce = Math.sin(Date.now() / 150) * 4;
    const sparkle = Math.sin(Date.now() / 100) * 0.3 + 0.7;

    if (item.type === 'coin') {
      // コイン（回転アニメーション）
      const scaleX = Math.abs(Math.sin(Date.now() / 200));

      this.ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
      this.ctx.beginPath();
      this.ctx.ellipse(
        item.x + item.width / 2,
        item.y + item.height / 2 + bounce,
        item.width / 2 * Math.max(scaleX, 0.3),
        item.height / 2,
        0, 0, Math.PI * 2
      );
      this.ctx.fill();

      // コインの光沢
      this.ctx.fillStyle = '#FFEC8B';
      this.ctx.beginPath();
      this.ctx.ellipse(
        item.x + item.width / 2 - 3,
        item.y + item.height / 2 - 3 + bounce,
        4 * Math.max(scaleX, 0.3),
        4,
        0, 0, Math.PI * 2
      );
      this.ctx.fill();

    } else if (item.type === 'star') {
      // スター
      this.ctx.fillStyle = `rgba(255, 255, 0, ${sparkle})`;
      this.drawStar(
        item.x + item.width / 2,
        item.y + item.height / 2 + bounce,
        5,
        item.width / 2,
        item.width / 4
      );

      // 目
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(item.x + 8, item.y + 10 + bounce, 4, 4);
      this.ctx.fillRect(item.x + 16, item.y + 10 + bounce, 4, 4);

      // 笑顔
      this.ctx.fillRect(item.x + 10, item.y + 16 + bounce, 8, 2);
    }
  }

  // 星を描画
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
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
    const fontSize = Math.max(14, Math.floor(16 * this.scale));
    const smallFontSize = Math.max(10, Math.floor(12 * this.scale));

    // ステージ・スコア背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 180 * this.scale, 85 * this.scale);

    // ステージ表示
    this.ctx.fillStyle = '#00FFCC';
    this.ctx.font = `bold ${smallFontSize}px monospace`;
    this.ctx.textAlign = 'left';
    const stageName = this.stageSettings[this.currentStage].name;
    this.ctx.fillText(`STAGE ${this.currentStage}`, 20, 28);

    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `${Math.floor(smallFontSize * 0.9)}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText(stageName, 20, 45);

    // スコア
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${smallFontSize}px monospace`;
    this.ctx.fillText(`SCORE`, 20, 65);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
    this.ctx.fillText(`${this.score}`, 20, 85);

    // 距離プログレスバー
    const progress = Math.min(this.distance / this.goalDistance, 1);
    const barWidth = Math.min(180, this.width * 0.2);
    const barX = this.width - barWidth - 20;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX - 10, 10, barWidth + 20, 45 * this.scale);

    // ステージインジケーター（5つの丸）
    const indicatorY = 20;
    const indicatorGap = (barWidth - 20) / 5;
    for (let i = 1; i <= 5; i++) {
      const ix = barX + (i - 0.5) * indicatorGap;
      this.ctx.beginPath();
      this.ctx.arc(ix, indicatorY, 6, 0, Math.PI * 2);
      if (i < this.currentStage) {
        this.ctx.fillStyle = '#00FF00'; // クリア済み
      } else if (i === this.currentStage) {
        this.ctx.fillStyle = '#FFD700'; // 現在
      } else {
        this.ctx.fillStyle = '#444'; // 未プレイ
      }
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // プログレスバー
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, 35, barWidth, 12);
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(barX, 35, barWidth * progress, 12);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `${Math.floor(10 * this.scale)}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.floor(progress * 100)}%`, barX + barWidth / 2, 45);
  }

  // スタート画面
  drawStartScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(24, Math.floor(40 * this.scale));
    const subTitleSize = Math.max(16, Math.floor(24 * this.scale));
    const textSize = Math.max(12, Math.floor(16 * this.scale));
    const btnTextSize = Math.max(11, Math.floor(14 * this.scale));

    // タイトル
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#FF6600';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('if(Run)', this.width / 2, this.height / 2 - 80 * this.scale);

    // サブタイトル
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${subTitleSize}px "Noto Sans JP", sans-serif`;
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('~塾長の挑戦~', this.width / 2, this.height / 2 - 45 * this.scale);

    // 操作説明
    this.ctx.fillStyle = '#90EE90';
    this.ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText('タップ or スペースキーでジャンプ!', this.width / 2, this.height / 2 - 5 * this.scale);

    // スピード選択ラベル
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText('スピードを選んでスタート', this.width / 2, this.height / 2 + 30 * this.scale);

    // スピードボタン
    const buttonWidth = Math.max(90, 110 * this.scale);
    const buttonHeight = Math.max(40, 50 * this.scale);
    const buttonGap = Math.max(10, 15 * this.scale);
    const totalWidth = buttonWidth * 3 + buttonGap * 2;
    const startX = this.width / 2 - totalWidth / 2;
    const buttonY = this.height / 2 + 50 * this.scale;

    this.speedButtonRects = []; // ボタン位置をリセット

    const speeds = ['slow', 'normal', 'fast'];
    speeds.forEach((speed, index) => {
      const setting = this.speedSettings[speed];
      const btnX = startX + index * (buttonWidth + buttonGap);

      // ボタン位置を保存
      this.speedButtonRects.push({
        x: btnX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        speed: speed
      });

      // ボタン背景
      this.ctx.fillStyle = setting.color;
      this.ctx.fillRect(btnX, buttonY, buttonWidth, buttonHeight);

      // ボタン枠（選択中は強調）
      if (this.selectedSpeed === speed) {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(btnX, buttonY, buttonWidth, buttonHeight);
      }

      // ボタンテキスト
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = `bold ${btnTextSize}px "Noto Sans JP", sans-serif`;
      this.ctx.fillText(setting.label, btnX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    });

    // 注意書き
    this.ctx.fillStyle = '#888888';
    this.ctx.font = `${Math.floor(textSize * 0.8)}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText('※「ゆっくり」がおすすめです', this.width / 2, this.height / 2 + 115 * this.scale);
  }

  // ゲームオーバー画面
  drawGameOverScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(24, Math.floor(36 * this.scale));
    const scoreSize = Math.max(18, Math.floor(24 * this.scale));
    const textSize = Math.max(12, Math.floor(16 * this.scale));

    this.ctx.fillStyle = '#FF4444';
    this.ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#FF0000';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 40 * this.scale);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `${scoreSize}px "Press Start 2P", monospace`;
    this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10 * this.scale);

    // リトライボタン風
    this.ctx.fillStyle = '#4444FF';
    this.ctx.fillRect(this.width / 2 - 80, this.height / 2 + 40 * this.scale, 160, 40);
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `bold ${textSize}px monospace`;
    this.ctx.fillText('RETRY', this.width / 2, this.height / 2 + 65 * this.scale);
  }

  // ステージクリア画面
  drawStageClearScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(20, Math.floor(32 * this.scale));
    const stageSize = Math.max(16, Math.floor(22 * this.scale));
    const scoreSize = Math.max(14, Math.floor(18 * this.scale));
    const textSize = Math.max(12, Math.floor(14 * this.scale));

    // STAGE CLEAR
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00FF00';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('STAGE CLEAR!', this.width / 2, this.height / 2 - 80 * this.scale);

    // ステージ名
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `${stageSize}px "Noto Sans JP", sans-serif`;
    const stageName = this.stageSettings[this.currentStage].name;
    this.ctx.fillText(`STAGE ${this.currentStage}: ${stageName}`, this.width / 2, this.height / 2 - 40 * this.scale);

    // スコア
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${scoreSize}px monospace`;
    this.ctx.fillText(`STAGE SCORE: ${this.score}`, this.width / 2, this.height / 2);
    this.ctx.fillText(`TOTAL SCORE: ${this.totalScore + this.score}`, this.width / 2, this.height / 2 + 25 * this.scale);

    // 次のステージ情報
    if (this.currentStage < this.maxStage) {
      const nextStageName = this.stageSettings[this.currentStage + 1].name;
      this.ctx.fillStyle = '#90EE90';
      this.ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
      this.ctx.fillText(`次: STAGE ${this.currentStage + 1} - ${nextStageName}`, this.width / 2, this.height / 2 + 60 * this.scale);
    }

    // 次へボタン
    this.ctx.fillStyle = '#4444FF';
    this.ctx.fillRect(this.width / 2 - 90, this.height / 2 + 85 * this.scale, 180, 45);
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `bold ${textSize}px monospace`;
    this.ctx.fillText('NEXT STAGE', this.width / 2, this.height / 2 + 112 * this.scale);
  }

  // 全クリア画面（ステージ5クリア後）
  drawClearScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(20, Math.floor(36 * this.scale));
    const subTitleSize = Math.max(16, Math.floor(24 * this.scale));
    const scoreSize = Math.max(14, Math.floor(20 * this.scale));
    const textSize = Math.max(12, Math.floor(16 * this.scale));

    // GAME CLEAR
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('GAME CLEAR!', this.width / 2, this.height / 2 - 90 * this.scale);

    // おめでとう
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${subTitleSize}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText('全5ステージクリア！', this.width / 2, this.height / 2 - 50 * this.scale);

    // 最終スコア
    const finalScore = this.totalScore + this.score;
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = `bold ${scoreSize}px "Press Start 2P", monospace`;
    this.ctx.fillText(`FINAL SCORE`, this.width / 2, this.height / 2 - 10 * this.scale);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${Math.floor(scoreSize * 1.3)}px "Press Start 2P", monospace`;
    this.ctx.fillText(`${finalScore}`, this.width / 2, this.height / 2 + 25 * this.scale);

    // メッセージ
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
    this.ctx.fillText('おめでとう！塾長の冒険は大成功！', this.width / 2, this.height / 2 + 60 * this.scale);

    // もう一度ボタン
    this.ctx.fillStyle = '#FF6600';
    this.ctx.fillRect(this.width / 2 - 100, this.height / 2 + 85 * this.scale, 200, 45);
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = `bold ${textSize}px monospace`;
    this.ctx.fillText('PLAY AGAIN', this.width / 2, this.height / 2 + 112 * this.scale);
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

// 別タブでフルスクリーンゲームを開く
function openFullscreenGame() {
  const gameWindow = window.open('', '_blank', 'width=1200,height=700');
  gameWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>if(Run) ~塾長の挑戦~ | if(塾)</title>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #1a1a2e;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Noto Sans JP', sans-serif;
        }
        .game-container {
          text-align: center;
        }
        h1 {
          color: #FFD700;
          font-family: 'Press Start 2P', monospace;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        canvas {
          border: 4px solid #333;
          border-radius: 8px;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .controls {
          margin-top: 15px;
          color: #aaa;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="game-container">
        <h1>if(Run) ~塾長の挑戦~</h1>
        <canvas id="fullscreen-game-canvas"></canvas>
        <p class="controls">操作: スペースキー / タップ でジャンプ</p>
      </div>
      <script>${IFRunGame.toString()}</script>
      <script>
        new IFRunGame('fullscreen-game-canvas', { fullscreen: true });
      </script>
    </body>
    </html>
  `);
  gameWindow.document.close();
}

// グローバルに公開
window.IFRunGame = IFRunGame;
window.openFullscreenGame = openFullscreenGame;
