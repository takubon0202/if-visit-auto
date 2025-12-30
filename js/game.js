// =============================================
// if(Run) ~塾長の挑戦~ - マリオ風横スクロールゲーム
// Version 2.0 - 大幅改善版
// =============================================

class IFRunGame {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isFullscreen = options.fullscreen || false;

    // サイズ設定
    this.setupSize();

    // ゲーム状態
    this.gameState = 'start';
    this.score = 0;
    this.totalScore = 0;
    this.distance = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.isFirstPlay = true;
    this.tutorialTimer = 0;

    // ステージ設定
    this.currentStage = 1;
    this.maxStage = 5;
    this.stageSettings = {
      1: { goalDistance: 1500, name: 'はじまりの丘', obstacleRate: 0.35, skyTop: '#4A90D9', skyBottom: '#87CEEB' },
      2: { goalDistance: 2000, name: '森のステージ', obstacleRate: 0.4, skyTop: '#2E8B57', skyBottom: '#90EE90' },
      3: { goalDistance: 2500, name: '砂漠ステージ', obstacleRate: 0.45, skyTop: '#FF8C00', skyBottom: '#FFD700' },
      4: { goalDistance: 3000, name: '夜のステージ', obstacleRate: 0.5, skyTop: '#1a1a3e', skyBottom: '#4B0082' },
      5: { goalDistance: 3500, name: '塾長城への道', obstacleRate: 0.55, skyTop: '#8B0000', skyBottom: '#FF6347' }
    };
    this.goalDistance = this.stageSettings[1].goalDistance;

    // ゴールポール
    this.goalReached = false;
    this.flagY = 0;
    this.flagAnimating = false;

    // スピード設定
    this.speedSettings = {
      slow: { baseSpeed: 3, label: 'ゆっくり', color: '#00CC00', speedIncrease: 0.08 },
      normal: { baseSpeed: 4, label: 'ふつう', color: '#FFAA00', speedIncrease: 0.12 },
      fast: { baseSpeed: 5.5, label: 'はやい', color: '#FF4444', speedIncrease: 0.18 }
    };
    this.selectedSpeed = 'slow';
    this.speedButtonRects = [];

    // プレイヤー初期化
    this.initPlayer();

    // 物理（マリオ風）
    this.gravity = 0.45;
    this.jumpForce = -12;

    // ゲーム要素
    this.obstacles = [];
    this.items = [];
    this.particles = [];
    this.decorations = [];
    this.floatingTexts = [];

    // スクロール
    this.scrollSpeed = this.speedSettings.slow.baseSpeed;
    this.baseScrollSpeed = this.speedSettings.slow.baseSpeed;

    // 背景要素
    this.clouds = [];
    this.hills = [];
    this.bushes = [];
    this.mountains = [];
    this.initBackground();

    // 画面エフェクト
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.flashColor = '#FFFFFF';

    // 入力
    this.keys = {};
    this.setupEventListeners();

    // リサイズ
    window.addEventListener('resize', () => this.handleResize());

    // ゲームループ
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  initPlayer() {
    this.player = {
      x: 80,
      y: this.groundY - 56,
      width: 44,
      height: 56,
      velocityY: 0,
      isJumping: false,
      isInvincible: false,
      invincibleTimer: 0,
      frame: 0,
      frameTimer: 0,
      hasDoubleJump: false,
      canDoubleJump: false,
      jumpCount: 0
    };
  }

  setupSize() {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    if (this.isFullscreen) {
      this.width = Math.min(window.innerWidth, 1400);
      this.height = Math.min(window.innerHeight, 800);
    } else if (isMobile) {
      this.width = Math.min(window.innerWidth - 20, 480);
      this.height = Math.floor(this.width * 0.65);
    } else if (isTablet) {
      this.width = Math.min(window.innerWidth - 40, 720);
      this.height = Math.floor(this.width * 0.58);
    } else {
      this.width = 900;
      this.height = 520;
    }

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.groundY = this.height - 70;
    this.scale = this.width / 900;
  }

  handleResize() {
    this.setupSize();
    if (this.player) {
      this.player.y = this.groundY - this.player.height;
    }
    this.initBackground();
  }

  initBackground() {
    // 遠くの山
    this.mountains = [];
    for (let i = 0; i < 3; i++) {
      this.mountains.push({
        x: i * 400 + Math.random() * 100,
        width: 300 + Math.random() * 150,
        height: 120 + Math.random() * 60,
        speed: 0.3
      });
    }

    // 雲（大きく目立つ）
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: i * 220 + Math.random() * 80,
        y: 30 + Math.random() * 50,
        size: 50 + Math.random() * 40,
        speed: 0.4 + Math.random() * 0.3
      });
    }

    // 丘（大きく）
    this.hills = [];
    for (let i = 0; i < 4; i++) {
      this.hills.push({
        x: i * 300 - 50,
        width: 250 + Math.random() * 100,
        height: 100 + Math.random() * 50,
        speed: 0.7
      });
    }

    // 草むら
    this.bushes = [];
    for (let i = 0; i < 10; i++) {
      this.bushes.push({
        x: i * 120 + Math.random() * 40,
        width: 50 + Math.random() * 30,
        height: 25 + Math.random() * 15,
        speed: 1.2
      });
    }

    // 装飾（花など）
    this.decorations = [];
    for (let i = 0; i < 8; i++) {
      this.decorations.push({
        x: i * 150 + Math.random() * 80,
        type: Math.random() > 0.5 ? 'flower' : 'mushroom',
        speed: 1.5
      });
    }
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;

      if (this.gameState === 'start') {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          this.selectSpeedAndStart('slow');
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          this.selectSpeedAndStart('normal');
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          this.selectSpeedAndStart('fast');
        } else if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          this.selectSpeedAndStart(this.selectedSpeed);
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

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick(e.touches[0]);
    }, { passive: false });
  }

  selectSpeedAndStart(speed) {
    this.selectedSpeed = speed;
    this.baseScrollSpeed = this.speedSettings[speed].baseSpeed;
    this.scrollSpeed = this.baseScrollSpeed;
    this.startGame();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    if (this.gameState === 'start') {
      for (const btn of this.speedButtonRects) {
        if (x >= btn.x && x <= btn.x + btn.width &&
            y >= btn.y && y <= btn.y + btn.height) {
          this.selectSpeedAndStart(btn.speed);
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

  startGame() {
    this.gameState = 'playing';
    this.score = 0;
    this.distance = 0;
    this.combo = 0;
    this.obstacles = [];
    this.items = [];
    this.floatingTexts = [];
    this.goalReached = false;
    this.flagAnimating = false;
    this.flagY = 0;
    this.goalDistance = this.stageSettings[this.currentStage].goalDistance;
    this.initPlayer();
    this.player.y = this.groundY - this.player.height;

    // 初回プレイ時はチュートリアルを表示
    if (this.isFirstPlay) {
      this.tutorialTimer = 180; // 3秒間表示
    }

    // 最初の障害物を少し離して配置
    setTimeout(() => this.spawnObstacle(), 800);
  }

  nextStage() {
    this.currentStage++;
    this.totalScore += this.score;
    this.goalDistance = this.stageSettings[this.currentStage].goalDistance;
    this.resetForNextStage();
  }

  resetForNextStage() {
    this.player.x = 80;
    this.player.y = this.groundY - this.player.height;
    this.player.velocityY = 0;
    this.player.isJumping = false;
    this.player.isInvincible = false;
    this.player.jumpCount = 0;
    this.scrollSpeed = this.baseScrollSpeed;
    this.distance = 0;
    this.combo = 0;
    this.obstacles = [];
    this.items = [];
    this.floatingTexts = [];
    this.goalReached = false;
    this.flagAnimating = false;
    this.flagY = 0;
    this.gameState = 'playing';
    setTimeout(() => this.spawnObstacle(), 300);
  }

  resetGame() {
    this.currentStage = 1;
    this.totalScore = 0;
    this.maxCombo = 0;
    this.initBackground();
    this.startGame();
  }

  jump() {
    // 通常ジャンプ
    if (!this.player.isJumping) {
      this.player.velocityY = this.jumpForce;
      this.player.isJumping = true;
      this.player.jumpCount = 1;
      this.createJumpParticles();
    }
    // ダブルジャンプ（パワーアップ時）
    else if (this.player.hasDoubleJump && this.player.canDoubleJump && this.player.jumpCount < 2) {
      this.player.velocityY = this.jumpForce * 0.85;
      this.player.jumpCount = 2;
      this.player.canDoubleJump = false;
      this.createDoubleJumpParticles();
    }
  }

  createJumpParticles() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3,
        life: 25,
        color: '#8B4513',
        size: 4 + Math.random() * 3
      });
    }
  }

  createDoubleJumpParticles() {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 20,
        color: '#FFD700',
        size: 5
      });
    }
  }

  spawnObstacle() {
    if (this.gameState !== 'playing') return;

    const types = ['pipe', 'goomba', 'goomba', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];

    const obstacle = {
      x: this.width + 50,
      type: type,
      passed: false
    };

    switch (type) {
      case 'pipe':
        const pipeHeight = 45 + Math.random() * 25;
        obstacle.y = this.groundY - pipeHeight;
        obstacle.width = 48;
        obstacle.height = pipeHeight;
        break;
      case 'goomba':
        obstacle.y = this.groundY - 32;
        obstacle.width = 36;
        obstacle.height = 32;
        obstacle.frame = 0;
        obstacle.walkOffset = 0;
        break;
      case 'gap':
        obstacle.y = this.groundY;
        obstacle.width = 65;
        obstacle.height = 100;
        break;
    }

    this.obstacles.push(obstacle);

    // アイテム生成
    if (Math.random() > 0.25) {
      this.spawnItem(obstacle.x + 80 + Math.random() * 60);
    }
  }

  spawnItem(x) {
    const rand = Math.random();
    let type;
    if (rand > 0.92) {
      type = 'star';
    } else if (rand > 0.85) {
      type = 'doubleJump';
    } else {
      type = 'coin';
    }

    const heightVariation = type === 'coin' ? 80 + Math.random() * 50 : 100;

    this.items.push({
      x: x,
      y: this.groundY - heightVariation,
      width: 30,
      height: 30,
      type: type,
      frame: 0,
      collected: false
    });
  }

  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // 距離更新
    this.distance += this.scrollSpeed;

    // ゴール判定
    if (this.distance >= this.goalDistance - 50 && !this.goalReached) {
      this.goalReached = true;
      this.flagAnimating = true;
      this.flagY = 0;
      this.flashScreen('#00FF00', 0.3);
      this.createGoalParticles();
    }

    // フラグアニメーション
    if (this.flagAnimating) {
      this.flagY += 2.5;
      if (this.flagY >= 140) {
        this.flagAnimating = false;
        if (this.currentStage >= this.maxStage) {
          this.gameState = 'clear';
        } else {
          this.gameState = 'stageClear';
        }
        return;
      }
    }

    if (this.goalReached) {
      this.scrollSpeed = Math.max(0, this.scrollSpeed - 0.2);
      return;
    }

    // 速度を徐々に上げる
    const speedIncrease = this.speedSettings[this.selectedSpeed].speedIncrease;
    this.scrollSpeed = this.baseScrollSpeed + (this.distance / 1000) * speedIncrease;

    // プレイヤー物理
    this.player.velocityY += this.gravity;
    this.player.y += this.player.velocityY;

    // ジャンプ頂点付近でダブルジャンプ可能に
    if (this.player.isJumping && this.player.velocityY > -2 && this.player.jumpCount === 1) {
      this.player.canDoubleJump = true;
    }

    // 地面判定
    if (this.player.y >= this.groundY - this.player.height) {
      this.player.y = this.groundY - this.player.height;
      this.player.velocityY = 0;
      this.player.isJumping = false;
      this.player.jumpCount = 0;
      this.player.canDoubleJump = false;
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
    if (this.player.frameTimer > 6) {
      this.player.frame = (this.player.frame + 1) % 4;
      this.player.frameTimer = 0;
    }

    // 障害物更新
    this.obstacles.forEach((obs) => {
      obs.x -= this.scrollSpeed;

      if (obs.type === 'goomba') {
        obs.frame = (obs.frame + 0.12) % 2;
        obs.walkOffset = Math.sin(Date.now() / 200) * 2;
      }

      // 衝突判定
      if (!obs.passed && this.checkCollision(this.player, obs)) {
        if (this.player.isInvincible) {
          // 無敵時は敵を倒す
          if (obs.type === 'goomba') {
            this.score += 200;
            this.addFloatingText(obs.x, obs.y, '+200', '#FFD700');
            obs.passed = true;
          }
        } else {
          this.gameState = 'gameover';
          this.screenShake = 15;
          this.flashScreen('#FF0000', 0.4);
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        }
      }

      // 障害物通過スコア
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true;
        this.score += 50;
        this.combo++;

        // コンボボーナス
        if (this.combo >= 5 && this.combo % 5 === 0) {
          const bonus = this.combo * 20;
          this.score += bonus;
          this.addFloatingText(this.player.x, this.player.y - 30, `${this.combo}コンボ! +${bonus}`, '#FF00FF');
          this.flashScreen('#FF00FF', 0.15);

          // 10コンボ以上で派手なエフェクト
          if (this.combo >= 10) {
            for (let i = 0; i < 15; i++) {
              this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 8 - 3,
                life: 30,
                color: ['#FFD700', '#FF00FF', '#00FFFF'][i % 3],
                size: 5
              });
            }
          }
        }
      }
    });

    // 障害物削除と生成
    this.obstacles = this.obstacles.filter(obs => obs.x > -100);

    const minGap = 280 - this.scrollSpeed * 15;
    if (this.obstacles.length === 0 ||
        this.obstacles[this.obstacles.length - 1].x < this.width - minGap) {
      if (Math.random() < this.stageSettings[this.currentStage].obstacleRate) {
        this.spawnObstacle();
      }
    }

    // アイテム更新
    this.items = this.items.filter(item => {
      item.x -= this.scrollSpeed;
      item.frame = (item.frame + 0.15) % 2;

      if (!item.collected && this.checkCollision(this.player, item)) {
        item.collected = true;
        this.collectItem(item);
        return false;
      }

      return item.x > -50;
    });

    // パーティクル更新
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      return p.life > 0;
    });

    // フローティングテキスト更新
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y -= 1.5;
      t.life--;
      return t.life > 0;
    });

    // 背景更新
    this.updateBackground();

    // 画面エフェクト更新
    if (this.screenShake > 0) this.screenShake--;
    if (this.flashAlpha > 0) this.flashAlpha -= 0.05;

    // チュートリアルタイマー
    if (this.tutorialTimer > 0) {
      this.tutorialTimer--;
      if (this.tutorialTimer === 0) {
        this.isFirstPlay = false;
      }
    }
  }

  collectItem(item) {
    switch (item.type) {
      case 'coin':
        this.score += 100;
        this.createCoinParticles(item.x, item.y);
        this.addFloatingText(item.x, item.y, '+100', '#FFD700');
        break;
      case 'star':
        this.player.isInvincible = true;
        this.player.invincibleTimer = 240;
        this.score += 500;
        this.createStarParticles(item.x, item.y);
        this.addFloatingText(item.x, item.y - 20, '無敵!', '#FF00FF');
        this.flashScreen('#FFFF00', 0.2);
        break;
      case 'doubleJump':
        this.player.hasDoubleJump = true;
        this.score += 300;
        this.createPowerUpParticles(item.x, item.y);
        this.addFloatingText(item.x, item.y - 20, '2段ジャンプ!', '#00FFFF');
        break;
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 40 });
  }

  flashScreen(color, alpha) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  updateBackground() {
    const speed = this.scrollSpeed;

    this.mountains.forEach(m => {
      m.x -= m.speed * speed * 0.3;
      if (m.x + m.width < 0) m.x = this.width + 100;
    });

    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x + c.size * 2 < 0) {
        c.x = this.width + 50;
        c.y = 30 + Math.random() * 50;
      }
    });

    this.hills.forEach(h => {
      h.x -= h.speed * speed * 0.5;
      if (h.x + h.width < 0) h.x = this.width + 100;
    });

    this.bushes.forEach(b => {
      b.x -= b.speed * speed * 0.7;
      if (b.x + b.width < 0) b.x = this.width + 50;
    });

    this.decorations.forEach(d => {
      d.x -= d.speed * speed * 0.8;
      if (d.x < -30) d.x = this.width + 50 + Math.random() * 100;
    });
  }

  createCoinParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + 15,
        y: y + 15,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 25,
        color: '#FFD700',
        size: 4 + Math.random() * 3
      });
    }
  }

  createStarParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.particles.push({
        x: x + 15,
        y: y + 15,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        life: 30,
        color: ['#FFFF00', '#FF00FF', '#00FFFF'][i % 3],
        size: 6
      });
    }
  }

  createPowerUpParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x + 15,
        y: y + 15,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 25,
        color: '#00FFFF',
        size: 5
      });
    }
  }

  createGoalParticles() {
    // 紙吹雪エフェクト
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.width * 0.7 + Math.random() * this.width * 0.3,
        y: Math.random() * this.height * 0.5,
        vx: (Math.random() - 0.7) * 4,
        vy: Math.random() * 3 + 1,
        life: 80,
        color: ['#FFD700', '#FF00FF', '#00FFFF', '#00FF00', '#FF6600'][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 4
      });
    }
  }

  checkCollision(a, b) {
    const padding = 8;
    return a.x + padding < b.x + b.width - padding &&
           a.x + a.width - padding > b.x + padding &&
           a.y + padding < b.y + b.height - padding &&
           a.y + a.height - padding > b.y + padding;
  }

  // ==================== 描画 ====================

  draw() {
    const ctx = this.ctx;

    // 画面シェイク
    ctx.save();
    if (this.screenShake > 0) {
      const shake = this.screenShake * 0.5;
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
    }

    // 背景描画
    this.drawSky();
    this.drawMountains();
    this.drawClouds();
    this.drawHills();
    this.drawBushes();
    this.drawDecorations();
    this.drawGround();

    // ゴールポール（常に描画を試みる）
    if (this.gameState === 'playing' || this.gameState === 'stageClear' || this.gameState === 'clear') {
      this.drawGoalPole();
    }

    // ゲーム要素
    this.obstacles.forEach(obs => this.drawObstacle(obs));
    this.items.forEach(item => this.drawItem(item));
    this.drawPlayer();
    this.drawParticles();
    this.drawFloatingTexts();

    // UI
    this.drawUI();

    // 画面フラッシュ
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // オーバーレイ画面
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

  drawSky() {
    const stage = this.stageSettings[this.currentStage];
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    gradient.addColorStop(0, stage.skyTop);
    gradient.addColorStop(0.6, stage.skyBottom);
    gradient.addColorStop(1, '#E8F4E8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawMountains() {
    const ctx = this.ctx;
    this.mountains.forEach(m => {
      // 山本体
      ctx.fillStyle = '#6B8E6B';
      ctx.beginPath();
      ctx.moveTo(m.x, this.groundY);
      ctx.lineTo(m.x + m.width / 2, this.groundY - m.height);
      ctx.lineTo(m.x + m.width, this.groundY);
      ctx.closePath();
      ctx.fill();

      // 雪
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(m.x + m.width / 2, this.groundY - m.height);
      ctx.lineTo(m.x + m.width * 0.35, this.groundY - m.height * 0.7);
      ctx.lineTo(m.x + m.width * 0.65, this.groundY - m.height * 0.7);
      ctx.closePath();
      ctx.fill();
    });
  }

  drawClouds() {
    const ctx = this.ctx;
    ctx.fillStyle = '#FFFFFF';

    this.clouds.forEach(c => {
      const s = c.size;
      // ふわふわした雲
      ctx.beginPath();
      ctx.arc(c.x, c.y, s * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.4, c.y - s * 0.15, s * 0.6, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.9, c.y, s * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.2, c.y + s * 0.2, s * 0.35, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.65, c.y + s * 0.2, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawHills() {
    const ctx = this.ctx;

    this.hills.forEach(h => {
      // 丘本体（明るい緑）
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.moveTo(h.x, this.groundY);
      ctx.quadraticCurveTo(
        h.x + h.width / 2, this.groundY - h.height,
        h.x + h.width, this.groundY
      );
      ctx.closePath();
      ctx.fill();

      // ハイライト
      ctx.fillStyle = '#90EE90';
      ctx.beginPath();
      ctx.moveTo(h.x + h.width * 0.2, this.groundY);
      ctx.quadraticCurveTo(
        h.x + h.width * 0.4, this.groundY - h.height * 0.6,
        h.x + h.width * 0.5, this.groundY
      );
      ctx.closePath();
      ctx.fill();
    });
  }

  drawBushes() {
    const ctx = this.ctx;

    this.bushes.forEach(b => {
      ctx.fillStyle = '#228B22';
      const r = b.height / 2;
      ctx.beginPath();
      ctx.arc(b.x, this.groundY - r, r, 0, Math.PI * 2);
      ctx.arc(b.x + r * 1.2, this.groundY - r * 1.1, r * 1.2, 0, Math.PI * 2);
      ctx.arc(b.x + r * 2.4, this.groundY - r, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDecorations() {
    const ctx = this.ctx;

    this.decorations.forEach(d => {
      if (d.type === 'flower') {
        // 花
        const y = this.groundY - 15;
        ctx.fillStyle = '#228B22';
        ctx.fillRect(d.x, y, 3, 15);

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(d.x + 1, y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(d.x + 1, y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // キノコ
        const y = this.groundY;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(d.x, y - 12, 6, 12);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(d.x + 3, y - 16, 10, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(d.x - 2, y - 18, 3, 0, Math.PI * 2);
        ctx.arc(d.x + 8, y - 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  drawGround() {
    const ctx = this.ctx;
    const brickW = 36;
    const brickH = 18;
    const rows = Math.ceil((this.height - this.groundY) / brickH) + 1;
    const cols = Math.ceil(this.width / brickW) + 2;

    // 草の層
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(0, this.groundY - 8, this.width, 12);

    // 草のギザギザ
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < this.width; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, this.groundY - 8);
      ctx.lineTo(i + 7, this.groundY - 14);
      ctx.lineTo(i + 14, this.groundY - 8);
      ctx.fill();
    }

    // レンガブロック
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offset = (row % 2) * (brickW / 2);
        const x = col * brickW - offset;
        const y = this.groundY + row * brickH;

        // レンガ本体
        ctx.fillStyle = '#C84C0C';
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);

        // ハイライト
        ctx.fillStyle = '#E07830';
        ctx.fillRect(x + 1, y + 1, brickW - 2, 3);
        ctx.fillRect(x + 1, y + 1, 3, brickH - 2);

        // シャドウ
        ctx.fillStyle = '#8B3000';
        ctx.fillRect(x + brickW - 4, y + 4, 3, brickH - 5);
        ctx.fillRect(x + 4, y + brickH - 4, brickW - 5, 3);
      }
    }
  }

  drawGoalPole() {
    const remainingDist = this.goalDistance - this.distance;

    // 画面内に入ってきたら表示
    if (remainingDist > this.width + 100) return;

    const poleX = this.width - 100 + (this.width - remainingDist);
    if (poleX < -50) return;

    const ctx = this.ctx;
    const poleHeight = 180;
    const poleTop = this.groundY - poleHeight;

    // ポール台座
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(poleX - 18, this.groundY - 25, 36, 25);
    ctx.fillStyle = '#654321';
    ctx.fillRect(poleX - 15, this.groundY - 23, 30, 5);

    // ポール本体（緑）
    const poleGradient = ctx.createLinearGradient(poleX - 5, 0, poleX + 5, 0);
    poleGradient.addColorStop(0, '#006400');
    poleGradient.addColorStop(0.5, '#00AA00');
    poleGradient.addColorStop(1, '#006400');
    ctx.fillStyle = poleGradient;
    ctx.fillRect(poleX - 5, poleTop + 15, 10, poleHeight - 40);

    // ポール頂上の金の玉
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(poleX, poleTop + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(poleX - 3, poleTop + 7, 4, 0, Math.PI * 2);
    ctx.fill();

    // 旗
    const flagTop = poleTop + 25 + this.flagY;
    const wave = Math.sin(Date.now() / 120) * 6;

    ctx.fillStyle = '#00AA00';
    ctx.beginPath();
    ctx.moveTo(poleX + 5, flagTop);
    ctx.lineTo(poleX + 55 + wave, flagTop + 18);
    ctx.lineTo(poleX + 50 + wave * 0.7, flagTop + 35);
    ctx.lineTo(poleX + 5, flagTop + 50);
    ctx.closePath();
    ctx.fill();

    // 旗の縁取り
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    ctx.stroke();

    // if マーク
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${14 * this.scale}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('if', poleX + 28, flagTop + 32);

    // GOAL表示
    if (!this.goalReached) {
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${20 * this.scale}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.fillText('GOAL', poleX, poleTop - 15);
      ctx.shadowBlur = 0;
    }

    // 距離表示（画面上部）
    if (!this.goalReached && remainingDist > 0) {
      const distM = Math.floor(remainingDist / 10);
      let distColor = '#FFFFFF';
      let encourageMsg = '';

      if (distM <= 20) {
        distColor = '#00FF00';
        encourageMsg = 'もうすぐゴール!';
      } else if (distM <= 50) {
        distColor = '#00FF00';
        encourageMsg = 'あと少し!';
      } else if (distM <= 80) {
        distColor = '#FFFF00';
        encourageMsg = 'がんばれ!';
      }

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const boxH = encourageMsg ? 45 : 28;
      ctx.fillRect(this.width / 2 - 85, 55, 170, boxH);
      ctx.fillStyle = distColor;
      ctx.font = `bold ${14 * this.scale}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`GOAL: ${distM}m`, this.width / 2, 74);

      // 応援メッセージ
      if (encourageMsg) {
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${12 * this.scale}px "Noto Sans JP", sans-serif`;
        ctx.fillText(encourageMsg, this.width / 2, 92);
      }
    }
  }

  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;

    // 無敵時は虹色に光る
    if (p.isInvincible) {
      const hue = (Date.now() / 10) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 15;

      if (Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.7;
      }
    }

    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.width / 2, this.groundY - 2, p.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 体（黄色ジャケット）
    const bodyGradient = ctx.createLinearGradient(p.x + 5, p.y + 18, p.x + 35, p.y + 40);
    bodyGradient.addColorStop(0, '#FFE44D');
    bodyGradient.addColorStop(1, '#E6C200');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(p.x + 7, p.y + 20, 30, 22);

    // ジャケットのボタン
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(p.x + 20, p.y + 24, 4, 4);
    ctx.fillRect(p.x + 20, p.y + 32, 4, 4);

    // 腕（アニメーション）
    const armSwing = p.isJumping ? 3 : Math.sin(p.frame * Math.PI / 2) * 4;
    ctx.fillStyle = '#FFE44D';
    ctx.fillRect(p.x + 2, p.y + 22 + armSwing, 8, 14);
    ctx.fillRect(p.x + 34, p.y + 22 - armSwing, 8, 14);

    // 手
    ctx.fillStyle = '#FAD7A0';
    ctx.fillRect(p.x + 3, p.y + 34 + armSwing, 6, 6);
    ctx.fillRect(p.x + 35, p.y + 34 - armSwing, 6, 6);

    // 頭
    ctx.fillStyle = '#FAD7A0';
    ctx.beginPath();
    ctx.arc(p.x + 22, p.y + 12, 14, 0, Math.PI * 2);
    ctx.fill();

    // 髪（茶色）
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(p.x + 22, p.y + 8, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(p.x + 8, p.y + 8, 6, 10);
    ctx.fillRect(p.x + 30, p.y + 8, 6, 10);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(p.x + 15, p.y + 10, 4, 5);
    ctx.fillRect(p.x + 26, p.y + 10, 4, 5);

    // 目のハイライト
    ctx.fillStyle = '#FFF';
    ctx.fillRect(p.x + 16, p.y + 11, 2, 2);
    ctx.fillRect(p.x + 27, p.y + 11, 2, 2);

    // 頬（ピンク）
    ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
    ctx.beginPath();
    ctx.arc(p.x + 12, p.y + 16, 3, 0, Math.PI * 2);
    ctx.arc(p.x + 32, p.y + 16, 3, 0, Math.PI * 2);
    ctx.fill();

    // 笑顔
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x + 22, p.y + 16, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // ズボン
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(p.x + 10, p.y + 42, 24, 8);

    // 足（アニメーション）
    const legSwing = p.isJumping ? 0 : Math.sin(p.frame * Math.PI / 2) * 5;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(p.x + 10, p.y + 48, 10, 8 + legSwing);
    ctx.fillRect(p.x + 24, p.y + 48, 10, 8 - legSwing);

    // ダブルジャンプ可能時のエフェクト
    if (p.hasDoubleJump && p.isJumping && p.canDoubleJump) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  drawObstacle(obs) {
    const ctx = this.ctx;

    switch (obs.type) {
      case 'pipe':
        // 土管本体
        const pipeGradient = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        pipeGradient.addColorStop(0, '#006400');
        pipeGradient.addColorStop(0.3, '#00AA00');
        pipeGradient.addColorStop(0.7, '#00AA00');
        pipeGradient.addColorStop(1, '#006400');
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(obs.x, obs.y + 16, obs.width, obs.height - 16);

        // 土管の上部
        ctx.fillStyle = '#00CC00';
        ctx.fillRect(obs.x - 4, obs.y, obs.width + 8, 18);

        // リム
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(obs.x - 4, obs.y, obs.width + 8, 5);

        // 黒い入口
        ctx.fillStyle = '#001100';
        ctx.fillRect(obs.x + 8, obs.y + 5, obs.width - 16, 10);
        break;

      case 'goomba':
        const bobY = obs.walkOffset || 0;

        // 体
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + 12 + bobY, 16, 0, Math.PI * 2);
        ctx.fill();

        // 怒り眉毛
        ctx.fillStyle = '#000';
        ctx.save();
        ctx.translate(obs.x + 8, obs.y + 6 + bobY);
        ctx.rotate(-0.3);
        ctx.fillRect(0, 0, 10, 3);
        ctx.restore();
        ctx.save();
        ctx.translate(obs.x + obs.width - 8, obs.y + 6 + bobY);
        ctx.rotate(0.3);
        ctx.fillRect(-10, 0, 10, 3);
        ctx.restore();

        // 目
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(obs.x + 12, obs.y + 12 + bobY, 5, 0, Math.PI * 2);
        ctx.arc(obs.x + 24, obs.y + 12 + bobY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(obs.x + 13, obs.y + 13 + bobY, 2.5, 0, Math.PI * 2);
        ctx.arc(obs.x + 25, obs.y + 13 + bobY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 牙
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(obs.x + 14, obs.y + 22 + bobY);
        ctx.lineTo(obs.x + 18, obs.y + 26 + bobY);
        ctx.lineTo(obs.x + 22, obs.y + 22 + bobY);
        ctx.fill();

        // 足
        ctx.fillStyle = '#654321';
        const footOffset = Math.floor(obs.frame) % 2 === 0 ? 2 : -2;
        ctx.fillRect(obs.x + 4 + footOffset, obs.y + 24 + bobY, 12, 8);
        ctx.fillRect(obs.x + 20 - footOffset, obs.y + 24 + bobY, 12, 8);
        break;

      case 'gap':
        // 穴（黒い部分）
        ctx.fillStyle = '#000';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // 穴の縁
        ctx.fillStyle = '#8B3000';
        ctx.fillRect(obs.x - 6, obs.y - 8, 8, 16);
        ctx.fillRect(obs.x + obs.width - 2, obs.y - 8, 8, 16);
        break;
    }
  }

  drawItem(item) {
    const ctx = this.ctx;
    const bounce = Math.sin(Date.now() / 120) * 5;
    const glow = Math.sin(Date.now() / 80) * 0.3 + 0.7;

    if (item.type === 'coin') {
      // コイン
      const scaleX = Math.abs(Math.sin(Date.now() / 150));

      ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
      ctx.beginPath();
      ctx.ellipse(
        item.x + 15, item.y + 15 + bounce,
        15 * Math.max(scaleX, 0.2), 15,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // コインの光沢
      ctx.fillStyle = '#FFEC8B';
      ctx.beginPath();
      ctx.ellipse(
        item.x + 12, item.y + 10 + bounce,
        5 * Math.max(scaleX, 0.2), 4,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // ¥マーク
      if (scaleX > 0.5) {
        ctx.fillStyle = '#B8860B';
        ctx.font = `bold ${12 * this.scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('¥', item.x + 15, item.y + 20 + bounce);
      }

    } else if (item.type === 'star') {
      // 星（無敵アイテム）
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 10;

      ctx.fillStyle = `rgba(255, 255, 0, ${glow})`;
      this.drawStar(item.x + 15, item.y + 15 + bounce, 5, 16, 7);

      // 目
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(item.x + 10, item.y + 12 + bounce, 2, 0, Math.PI * 2);
      ctx.arc(item.x + 20, item.y + 12 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();

      // 笑顔
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(item.x + 15, item.y + 17 + bounce, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

    } else if (item.type === 'doubleJump') {
      // ダブルジャンプアイテム（羽）
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;

      // 靴
      ctx.fillStyle = '#00CED1';
      ctx.beginPath();
      ctx.arc(item.x + 15, item.y + 20 + bounce, 12, 0, Math.PI * 2);
      ctx.fill();

      // 羽
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(item.x + 5, item.y + 15 + bounce);
      ctx.quadraticCurveTo(item.x - 8, item.y + 5 + bounce, item.x + 5, item.y + bounce);
      ctx.quadraticCurveTo(item.x + 12, item.y + 8 + bounce, item.x + 5, item.y + 15 + bounce);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(item.x + 25, item.y + 15 + bounce);
      ctx.quadraticCurveTo(item.x + 38, item.y + 5 + bounce, item.x + 25, item.y + bounce);
      ctx.quadraticCurveTo(item.x + 18, item.y + 8 + bounce, item.x + 25, item.y + 15 + bounce);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  drawStar(cx, cy, spikes, outerR, innerR) {
    const ctx = this.ctx;
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      const maxLife = p.life > 50 ? 80 : 25;
      ctx.globalAlpha = Math.min(1, p.life / maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawFloatingTexts() {
    const ctx = this.ctx;
    this.floatingTexts.forEach(t => {
      ctx.globalAlpha = t.life / 40;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${16 * this.scale}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  drawUI() {
    const ctx = this.ctx;
    const fs = Math.max(12, 14 * this.scale);
    const fsSmall = Math.max(10, 11 * this.scale);

    // 左上：ステージ・スコア
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(8, 8, 160 * this.scale, 48);

    // ステージ
    ctx.fillStyle = '#00FFCC';
    ctx.font = `bold ${fsSmall}px "Press Start 2P", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${this.currentStage}`, 16, 24);

    // スコア
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${fs}px "Press Start 2P", monospace`;
    ctx.fillText(`${this.score}`, 16, 46);

    // 右上：進捗
    const barW = Math.min(140, this.width * 0.16);
    const barX = this.width - barW - 16;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(barX - 8, 8, barW + 16, 40);

    // ステージドット
    const dotGap = (barW - 10) / 5;
    for (let i = 1; i <= 5; i++) {
      const dx = barX + (i - 0.5) * dotGap;
      ctx.beginPath();
      ctx.arc(dx, 18, 5, 0, Math.PI * 2);
      if (i < this.currentStage) ctx.fillStyle = '#00FF00';
      else if (i === this.currentStage) ctx.fillStyle = '#FFD700';
      else ctx.fillStyle = '#444';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // プログレスバー
    const progress = Math.min(this.distance / this.goalDistance, 1);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, 30, barW, 10);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(barX, 30, barW * progress, 10);

    // コンボ表示
    if (this.combo >= 3) {
      ctx.fillStyle = '#FF00FF';
      ctx.font = `bold ${fs}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${this.combo} COMBO!`, this.width / 2, 28);
    }

    // ダブルジャンプアイコン
    if (this.player.hasDoubleJump) {
      ctx.fillStyle = 'rgba(0,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(this.width - 30, this.height - 30, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00FFFF';
      ctx.font = `bold ${10 * this.scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('x2', this.width - 30, this.height - 26);
    }

    // チュートリアル表示
    if (this.tutorialTimer > 0 && this.gameState === 'playing') {
      const alpha = Math.min(1, this.tutorialTimer / 30);
      ctx.globalAlpha = alpha;

      // 背景
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const tutorialW = 280 * this.scale;
      const tutorialH = 80 * this.scale;
      const tutorialX = this.width / 2 - tutorialW / 2;
      const tutorialY = this.height / 2 - 20;
      ctx.fillRect(tutorialX, tutorialY, tutorialW, tutorialH);

      // 枠線
      ctx.strokeStyle = '#00FFCC';
      ctx.lineWidth = 3;
      ctx.strokeRect(tutorialX, tutorialY, tutorialW, tutorialH);

      // テキスト
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${16 * this.scale}px "Noto Sans JP", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('障害物を避けてゴールを目指そう!', this.width / 2, tutorialY + 30);

      ctx.fillStyle = '#90EE90';
      ctx.font = `${14 * this.scale}px "Noto Sans JP", sans-serif`;
      ctx.fillText('タップ or スペースキーでジャンプ', this.width / 2, tutorialY + 55);

      ctx.globalAlpha = 1;
    }
  }

  drawStartScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(28, 42 * this.scale);
    const subSize = Math.max(18, 24 * this.scale);
    const textSize = Math.max(12, 15 * this.scale);
    const btnSize = Math.max(12, 14 * this.scale);

    // タイトル
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur = 15;
    ctx.fillText('if(Run)', this.width / 2, this.height * 0.28);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF';
    ctx.font = `${subSize}px "Noto Sans JP", sans-serif`;
    ctx.fillText('~塾長の挑戦~', this.width / 2, this.height * 0.38);

    // 操作説明
    ctx.fillStyle = '#90EE90';
    ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
    ctx.fillText('タップ or スペースキーでジャンプ!', this.width / 2, this.height * 0.48);

    // スピード選択
    ctx.fillStyle = '#FFF';
    ctx.fillText('スピードを選んでスタート', this.width / 2, this.height * 0.56);

    // ボタン
    const btnW = Math.max(95, 110 * this.scale);
    const btnH = Math.max(44, 52 * this.scale);
    const btnGap = Math.max(12, 16 * this.scale);
    const totalW = btnW * 3 + btnGap * 2;
    const startX = this.width / 2 - totalW / 2;
    const btnY = this.height * 0.62;

    this.speedButtonRects = [];
    const speeds = ['slow', 'normal', 'fast'];

    speeds.forEach((speed, i) => {
      const s = this.speedSettings[speed];
      const bx = startX + i * (btnW + btnGap);

      this.speedButtonRects.push({ x: bx, y: btnY, width: btnW, height: btnH, speed });

      // ボタン
      ctx.fillStyle = s.color;
      ctx.fillRect(bx, btnY, btnW, btnH);

      // 選択中
      if (this.selectedSpeed === speed) {
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, btnY, btnW, btnH);
      }

      // ラベル
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${btnSize}px "Noto Sans JP", sans-serif`;
      ctx.fillText(s.label, bx + btnW / 2, btnY + btnH / 2 + 5);
    });

    // 注意
    ctx.fillStyle = '#888';
    ctx.font = `${Math.max(10, 12 * this.scale)}px "Noto Sans JP", sans-serif`;
    ctx.fillText('※「ゆっくり」がおすすめです', this.width / 2, this.height * 0.85);
  }

  drawGameOverScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(24, 36 * this.scale);
    const scoreSize = Math.max(16, 22 * this.scale);
    const textSize = Math.max(12, 16 * this.scale);

    ctx.fillStyle = '#FF4444';
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.fillText('GAME OVER', this.width / 2, this.height * 0.35);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD700';
    ctx.font = `${scoreSize}px "Press Start 2P", monospace`;
    ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height * 0.48);

    if (this.maxCombo >= 5) {
      ctx.fillStyle = '#FF00FF';
      ctx.font = `${textSize}px "Press Start 2P", monospace`;
      ctx.fillText(`MAX COMBO: ${this.maxCombo}`, this.width / 2, this.height * 0.56);
    }

    // リトライボタン
    ctx.fillStyle = '#4444FF';
    const btnW = 160;
    const btnH = 44;
    ctx.fillRect(this.width / 2 - btnW / 2, this.height * 0.65, btnW, btnH);
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${textSize}px monospace`;
    ctx.fillText('RETRY', this.width / 2, this.height * 0.65 + btnH / 2 + 5);
  }

  drawStageClearScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(22, 32 * this.scale);
    const subSize = Math.max(16, 20 * this.scale);
    const textSize = Math.max(12, 15 * this.scale);

    ctx.fillStyle = '#00FF00';
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 15;
    ctx.fillText('STAGE CLEAR!', this.width / 2, this.height * 0.28);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD700';
    ctx.font = `${subSize}px "Noto Sans JP", sans-serif`;
    const stageName = this.stageSettings[this.currentStage].name;
    ctx.fillText(`STAGE ${this.currentStage}: ${stageName}`, this.width / 2, this.height * 0.38);

    ctx.fillStyle = '#FFF';
    ctx.font = `${textSize}px monospace`;
    ctx.fillText(`STAGE SCORE: ${this.score}`, this.width / 2, this.height * 0.48);
    ctx.fillText(`TOTAL: ${this.totalScore + this.score}`, this.width / 2, this.height * 0.55);

    // 次のステージ
    if (this.currentStage < this.maxStage) {
      const nextName = this.stageSettings[this.currentStage + 1].name;
      ctx.fillStyle = '#90EE90';
      ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
      ctx.fillText(`次: STAGE ${this.currentStage + 1} - ${nextName}`, this.width / 2, this.height * 0.65);
    }

    // ボタン
    ctx.fillStyle = '#4444FF';
    const btnW = 180;
    const btnH = 44;
    ctx.fillRect(this.width / 2 - btnW / 2, this.height * 0.73, btnW, btnH);
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${textSize}px monospace`;
    ctx.fillText('NEXT STAGE', this.width / 2, this.height * 0.73 + btnH / 2 + 5);
  }

  drawClearScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const titleSize = Math.max(24, 38 * this.scale);
    const subSize = Math.max(18, 24 * this.scale);
    const scoreSize = Math.max(16, 22 * this.scale);
    const textSize = Math.max(12, 16 * this.scale);

    // 紙吹雪エフェクト
    for (let i = 0; i < 30; i++) {
      const x = (Date.now() / 20 + i * 50) % this.width;
      const y = (Date.now() / 30 + i * 30) % this.height;
      ctx.fillStyle = ['#FFD700', '#FF00FF', '#00FFFF', '#00FF00'][i % 4];
      ctx.fillRect(x, y, 6, 6);
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME CLEAR!', this.width / 2, this.height * 0.25);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF';
    ctx.font = `${subSize}px "Noto Sans JP", sans-serif`;
    ctx.fillText('全5ステージクリア!', this.width / 2, this.height * 0.35);

    const finalScore = this.totalScore + this.score;
    ctx.fillStyle = '#00FF00';
    ctx.font = `bold ${scoreSize}px "Press Start 2P", monospace`;
    ctx.fillText('FINAL SCORE', this.width / 2, this.height * 0.46);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(scoreSize * 1.4)}px "Press Start 2P", monospace`;
    ctx.fillText(`${finalScore}`, this.width / 2, this.height * 0.55);

    ctx.fillStyle = '#FFF';
    ctx.font = `${textSize}px "Noto Sans JP", sans-serif`;
    ctx.fillText('おめでとう! 塾長の冒険は大成功!', this.width / 2, this.height * 0.65);

    // ボタン
    ctx.fillStyle = '#FF6600';
    const btnW = 200;
    const btnH = 48;
    ctx.fillRect(this.width / 2 - btnW / 2, this.height * 0.75, btnW, btnH);
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${textSize}px monospace`;
    ctx.fillText('PLAY AGAIN', this.width / 2, this.height * 0.75 + btnH / 2 + 5);
  }

  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop);
  }
}

// フルスクリーン
function openFullscreenGame() {
  const win = window.open('', '_blank', 'width=1200,height=700');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>if(Run) ~塾長の挑戦~ | if(塾)</title>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Noto Sans JP',sans-serif}
        .container{text-align:center}
        h1{color:#FFD700;font-family:'Press Start 2P',monospace;margin-bottom:20px;text-shadow:2px 2px 4px rgba(0,0,0,0.5);font-size:24px}
        canvas{border:4px solid #333;border-radius:8px;box-shadow:0 0 30px rgba(0,0,0,0.5)}
        .controls{margin-top:15px;color:#aaa;font-size:14px}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>if(Run) ~塾長の挑戦~</h1>
        <canvas id="fullscreen-game"></canvas>
        <p class="controls">操作: スペースキー / タップ でジャンプ</p>
      </div>
      <script>${IFRunGame.toString()}</script>
      <script>new IFRunGame('fullscreen-game',{fullscreen:true});</script>
    </body>
    </html>
  `);
  win.document.close();
}

window.IFRunGame = IFRunGame;
window.openFullscreenGame = openFullscreenGame;
