/**
 * if(塾) 保護者向け子ども理解サポートツール
 *
 * 注意事項:
 * - このツールは診断を行うものではありません
 * - お子さまの特性の「傾向」を把握し、関わり方のヒントを得るためのものです
 * - 心配なことがある場合は、専門家にご相談ください
 *
 * 参考: SDQ, ADHD-RS, AQ などの信頼性のある尺度を参考に設計
 * 監修視点: 臨床心理士・公認心理師の知見を反映
 */

class DiagnosticTool {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.currentStep = 0;
    this.answers = {};
    this.basicInfo = {};

    // 5つの評価領域（SDQ参考）
    this.domains = {
      attention: { name: '集中・注意力', icon: '🎯', color: '#00ffcc' },
      social: { name: '対人関係・コミュニケーション', icon: '💬', color: '#ff00ff' },
      emotion: { name: '情緒・感情', icon: '💚', color: '#00ff00' },
      behavior: { name: '行動・衝動性', icon: '⚡', color: '#ffcc00' },
      adaptation: { name: '学校適応・生活', icon: '🏫', color: '#ff6699' }
    };

    // 質問項目（各領域8問、計40問）
    this.questions = this.initQuestions();

    // ステップ構成
    this.steps = [
      { id: 'intro', title: 'はじめに' },
      { id: 'basic', title: '基本情報' },
      { id: 'questions', title: '質問' },
      { id: 'result', title: '結果' }
    ];

    this.init();
  }

  initQuestions() {
    return {
      attention: [
        { id: 'a1', text: '宿題や作業を途中で投げ出してしまうことがある', reverse: false },
        { id: 'a2', text: '話を最後まで聞かずに行動してしまうことがある', reverse: false },
        { id: 'a3', text: '忘れ物や失くし物が多い', reverse: false },
        { id: 'a4', text: '好きなことには長時間集中できる', reverse: true, strength: true },
        { id: 'a5', text: '細かいところまでよく気がつく', reverse: true, strength: true },
        { id: 'a6', text: 'ぼーっとしていることが多いと言われる', reverse: false },
        { id: 'a7', text: '順序立てて物事を進めることに困難を感じることがある', reverse: false },
        { id: 'a8', text: '興味のあることへの知識が豊富', reverse: true, strength: true }
      ],
      social: [
        { id: 's1', text: '同年代の友達と遊ぶより、一人でいることを好む', reverse: false },
        { id: 's2', text: '相手の気持ちを読み取るのが難しいことがある', reverse: false },
        { id: 's3', text: '冗談やたとえ話を文字通りに受け取ってしまう', reverse: false },
        { id: 's4', text: '自分の得意なことを人に教えるのが好き', reverse: true, strength: true },
        { id: 's5', text: '正直で誠実、ストレートに物事を伝える', reverse: true, strength: true },
        { id: 's6', text: '空気を読むことが難しいと感じることがある', reverse: false },
        { id: 's7', text: '目を合わせて話すことに抵抗を感じることがある', reverse: false },
        { id: 's8', text: '特定の分野について深い知識を持っている', reverse: true, strength: true }
      ],
      emotion: [
        { id: 'e1', text: '些細なことで不安になりやすい', reverse: false },
        { id: 'e2', text: '新しい環境や変化に慣れるのに時間がかかる', reverse: false },
        { id: 'e3', text: '感情の起伏が激しい', reverse: false },
        { id: 'e4', text: '共感力が高く、人の気持ちに敏感', reverse: true, strength: true },
        { id: 'e5', text: '芸術や音楽など、感性が豊か', reverse: true, strength: true },
        { id: 'e6', text: '失敗を過度に恐れる傾向がある', reverse: false },
        { id: 'e7', text: '特定の音や感触、光に敏感に反応する', reverse: false },
        { id: 'e8', text: '想像力が豊かで、創造的なアイデアを持っている', reverse: true, strength: true }
      ],
      behavior: [
        { id: 'b1', text: '順番を待つのが難しい', reverse: false },
        { id: 'b2', text: 'じっとしていると落ち着かなくなることがある', reverse: false },
        { id: 'b3', text: '思いついたらすぐに行動してしまう', reverse: false },
        { id: 'b4', text: '行動力があり、チャレンジ精神がある', reverse: true, strength: true },
        { id: 'b5', text: 'エネルギッシュで活動的', reverse: true, strength: true },
        { id: 'b6', text: '特定のやり方やルーティンへのこだわりが強い', reverse: false },
        { id: 'b7', text: '急な予定変更に対応するのが難しい', reverse: false },
        { id: 'b8', text: '決めたことは最後までやり遂げる粘り強さがある', reverse: true, strength: true }
      ],
      adaptation: [
        { id: 'ad1', text: '朝起きるのが辛そう、または起きられない', reverse: false },
        { id: 'ad2', text: '学校に行くことに抵抗を示すことがある', reverse: false },
        { id: 'ad3', text: '学校での出来事をあまり話さない', reverse: false },
        { id: 'ad4', text: '家では元気だが、外では疲れやすい', reverse: false },
        { id: 'ad5', text: '自分のペースで学ぶと理解が早い', reverse: true, strength: true },
        { id: 'ad6', text: '読み書きや計算で特定の困難がある', reverse: false },
        { id: 'ad7', text: '安心できる環境では力を発揮できる', reverse: true, strength: true },
        { id: 'ad8', text: '独自の視点や考え方を持っている', reverse: true, strength: true }
      ]
    };
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="diagnostic">
        <div class="diagnostic__progress">
          <div class="diagnostic__progress-bar" style="width: 0%"></div>
        </div>
        <div class="diagnostic__content">
          ${this.renderStep()}
        </div>
      </div>
    `;
    this.updateProgress();
  }

  renderStep() {
    switch(this.steps[this.currentStep].id) {
      case 'intro': return this.renderIntro();
      case 'basic': return this.renderBasicInfo();
      case 'questions': return this.renderQuestions();
      case 'result': return this.renderResult();
      default: return '';
    }
  }

  renderIntro() {
    return `
      <div class="diagnostic__step diagnostic__step--intro">
        <div class="diagnostic__icon">🌱</div>
        <h3 class="diagnostic__title">お子さま理解サポートツール</h3>
        <p class="diagnostic__subtitle">〜 お子さまの特性を知り、より良い関わり方を見つける 〜</p>

        <div class="diagnostic__notice diagnostic__notice--info">
          <h4>このツールについて</h4>
          <p>このツールは<strong>医療的な診断を行うものではありません</strong>。</p>
          <p>お子さまの特性の傾向を把握し、ご家庭での関わり方のヒントを得るためのものです。</p>
        </div>

        <div class="diagnostic__features">
          <div class="diagnostic__feature">
            <span class="diagnostic__feature-icon">✓</span>
            <span>約5分で回答できます</span>
          </div>
          <div class="diagnostic__feature">
            <span class="diagnostic__feature-icon">✓</span>
            <span>回答データは保存されません</span>
          </div>
          <div class="diagnostic__feature">
            <span class="diagnostic__feature-icon">✓</span>
            <span>強みと課題の両面をお伝えします</span>
          </div>
          <div class="diagnostic__feature">
            <span class="diagnostic__feature-icon">✓</span>
            <span>具体的な関わり方のアドバイス付き</span>
          </div>
        </div>

        <div class="diagnostic__notice diagnostic__notice--warning">
          <p>お子さまの様子で心配なことがある場合は、スクールカウンセラーや医療機関などの専門家にご相談されることをおすすめします。</p>
        </div>

        <button type="button" class="btn btn--diagnostic" data-action="start">
          はじめる
        </button>
      </div>
    `;
  }

  renderBasicInfo() {
    return `
      <div class="diagnostic__step diagnostic__step--basic">
        <h3 class="diagnostic__title">お子さまについて教えてください</h3>

        <div class="diagnostic__form-group">
          <label class="diagnostic__label">お子さまの年齢</label>
          <div class="diagnostic__options diagnostic__options--age">
            <button type="button" class="diagnostic__option" data-field="age" data-value="lower-elementary">
              小学校低学年<small>（1〜3年生）</small>
            </button>
            <button type="button" class="diagnostic__option" data-field="age" data-value="upper-elementary">
              小学校高学年<small>（4〜6年生）</small>
            </button>
            <button type="button" class="diagnostic__option" data-field="age" data-value="junior-high">
              中学生
            </button>
            <button type="button" class="diagnostic__option" data-field="age" data-value="high-school">
              高校生
            </button>
          </div>
        </div>

        <div class="diagnostic__form-group">
          <label class="diagnostic__label">主なお困りごと（複数選択可）</label>
          <div class="diagnostic__options diagnostic__options--concerns">
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="learning">
              <span class="diagnostic__option-icon">📚</span>
              <span>学習面</span>
            </button>
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="social">
              <span class="diagnostic__option-icon">👥</span>
              <span>対人関係</span>
            </button>
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="behavior">
              <span class="diagnostic__option-icon">💨</span>
              <span>行動面</span>
            </button>
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="school-refusal">
              <span class="diagnostic__option-icon">🏠</span>
              <span>登校しぶり・不登校</span>
            </button>
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="emotion">
              <span class="diagnostic__option-icon">💭</span>
              <span>情緒・メンタル</span>
            </button>
            <button type="button" class="diagnostic__option diagnostic__option--multi" data-field="concerns" data-value="other">
              <span class="diagnostic__option-icon">❓</span>
              <span>その他・わからない</span>
            </button>
          </div>
        </div>

        <div class="diagnostic__nav">
          <button type="button" class="btn btn--diagnostic-secondary" data-action="back">
            戻る
          </button>
          <button type="button" class="btn btn--diagnostic" data-action="next" disabled>
            次へ
          </button>
        </div>
      </div>
    `;
  }

  renderQuestions() {
    const allQuestions = this.getAllQuestions();
    const questionsPerPage = 5;
    const totalPages = Math.ceil(allQuestions.length / questionsPerPage);
    const currentPage = Math.floor(Object.keys(this.answers).length / questionsPerPage);
    const startIdx = currentPage * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, allQuestions.length);
    const currentQuestions = allQuestions.slice(startIdx, endIdx);

    return `
      <div class="diagnostic__step diagnostic__step--questions">
        <div class="diagnostic__question-header">
          <span class="diagnostic__question-count">質問 ${startIdx + 1}〜${endIdx} / ${allQuestions.length}</span>
        </div>

        <div class="diagnostic__questions">
          ${currentQuestions.map((q, idx) => this.renderQuestion(q, startIdx + idx)).join('')}
        </div>

        <div class="diagnostic__nav">
          <button type="button" class="btn btn--diagnostic-secondary" data-action="back">
            戻る
          </button>
          <button type="button" class="btn btn--diagnostic" data-action="next" ${this.canProceedQuestions(currentQuestions) ? '' : 'disabled'}>
            ${endIdx >= allQuestions.length ? '結果を見る' : '次へ'}
          </button>
        </div>
      </div>
    `;
  }

  renderQuestion(question, index) {
    const options = [
      { value: 0, label: 'あてはまらない' },
      { value: 1, label: 'あまりあてはまらない' },
      { value: 2, label: 'どちらともいえない' },
      { value: 3, label: 'ややあてはまる' },
      { value: 4, label: 'あてはまる' }
    ];

    const currentAnswer = this.answers[question.id];

    return `
      <div class="diagnostic__question" data-question-id="${question.id}">
        <p class="diagnostic__question-text">
          <span class="diagnostic__question-number">${index + 1}.</span>
          ${question.text}
        </p>
        <div class="diagnostic__answer-options">
          ${options.map(opt => `
            <button type="button"
              class="diagnostic__answer ${currentAnswer === opt.value ? 'diagnostic__answer--selected' : ''}"
              data-question="${question.id}"
              data-value="${opt.value}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderResult() {
    const scores = this.calculateScores();
    const analysis = this.analyzeResults(scores);

    return `
      <div class="diagnostic__step diagnostic__step--result">
        <h3 class="diagnostic__title">お子さまの特性プロファイル</h3>

        <div class="diagnostic__notice diagnostic__notice--info">
          <p>これは傾向を示すもので、診断ではありません。気になる点がある場合は専門家にご相談ください。</p>
        </div>

        <div class="diagnostic__chart-container">
          <canvas id="diagnostic-chart" width="300" height="300"></canvas>
        </div>

        <div class="diagnostic__scores">
          ${Object.entries(this.domains).map(([key, domain]) => `
            <div class="diagnostic__score-item" style="--domain-color: ${domain.color}">
              <div class="diagnostic__score-header">
                <span class="diagnostic__score-icon">${domain.icon}</span>
                <span class="diagnostic__score-name">${domain.name}</span>
              </div>
              <div class="diagnostic__score-bar">
                <div class="diagnostic__score-fill" style="width: ${scores[key].percentage}%"></div>
              </div>
              <span class="diagnostic__score-value">${scores[key].level}</span>
            </div>
          `).join('')}
        </div>

        ${this.renderStrengths(analysis.strengths)}
        ${this.renderChallenges(analysis.challenges)}
        ${this.renderAdvice(analysis)}
        ${this.renderProfessionalGuidance(analysis)}
        ${this.renderIfJukuInfo(analysis)}

        <div class="diagnostic__nav">
          <button type="button" class="btn btn--diagnostic-secondary" data-action="restart">
            もう一度やり直す
          </button>
          <a href="#application-form" class="btn btn--diagnostic">
            見学を申し込む
          </a>
        </div>
      </div>
    `;
  }

  renderStrengths(strengths) {
    if (!strengths.length) return '';

    return `
      <div class="diagnostic__section diagnostic__section--strengths">
        <h4 class="diagnostic__section-title">
          <span class="diagnostic__section-icon">✨</span>
          お子さまの強み
        </h4>
        <ul class="diagnostic__list">
          ${strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  renderChallenges(challenges) {
    if (!challenges.length) return '';

    return `
      <div class="diagnostic__section diagnostic__section--challenges">
        <h4 class="diagnostic__section-title">
          <span class="diagnostic__section-icon">💡</span>
          サポートが効果的な領域
        </h4>
        <ul class="diagnostic__list">
          ${challenges.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  renderAdvice(analysis) {
    return `
      <div class="diagnostic__section diagnostic__section--advice">
        <h4 class="diagnostic__section-title">
          <span class="diagnostic__section-icon">🏠</span>
          ご家庭でできること
        </h4>
        <div class="diagnostic__advice-list">
          ${analysis.advice.map(a => `
            <div class="diagnostic__advice-item">
              <h5 class="diagnostic__advice-title">${a.title}</h5>
              <p class="diagnostic__advice-text">${a.text}</p>
              ${a.examples ? `
                <div class="diagnostic__advice-examples">
                  <span class="diagnostic__advice-label">具体例:</span>
                  <ul>
                    ${a.examples.map(e => `<li>${e}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderProfessionalGuidance(analysis) {
    if (!analysis.needsProfessional) return '';

    return `
      <div class="diagnostic__section diagnostic__section--professional">
        <h4 class="diagnostic__section-title">
          <span class="diagnostic__section-icon">🏥</span>
          専門家への相談について
        </h4>
        <p class="diagnostic__professional-text">
          いくつかの領域で傾向が見られます。お子さまをより深く理解し、
          適切なサポートを受けるために、以下のような専門機関への相談をおすすめします。
        </p>
        <ul class="diagnostic__professional-list">
          <li><strong>スクールカウンセラー</strong> - 学校での困りごとについて相談できます</li>
          <li><strong>教育相談センター</strong> - お住まいの地域の相談窓口です</li>
          <li><strong>発達障害者支援センター</strong> - 発達に関する専門的なアドバイスを受けられます</li>
          <li><strong>小児科・児童精神科</strong> - 医療的な観点からの評価を受けられます</li>
        </ul>
        <p class="diagnostic__professional-note">
          相談することは、お子さまのためを思う保護者として自然なことです。
          一人で抱え込まず、専門家の力を借りることを検討してみてください。
        </p>
      </div>
    `;
  }

  renderIfJukuInfo(analysis) {
    return `
      <div class="diagnostic__section diagnostic__section--ifjuku">
        <h4 class="diagnostic__section-title">
          <span class="diagnostic__section-icon">💻</span>
          if(塾)でのサポート
        </h4>
        <div class="diagnostic__ifjuku-content">
          <p>if(塾)は、一人ひとりの特性に合わせた学びを提供しています。</p>
          <ul class="diagnostic__ifjuku-features">
            <li><strong>自分のペースで学べる</strong> - 決まったカリキュラムがないから、焦る必要がありません</li>
            <li><strong>オンラインで安心</strong> - 自宅から参加できるので、登校のハードルがありません</li>
            <li><strong>AI先生が24時間サポート</strong> - わからないことがあってもすぐに質問できます</li>
            <li><strong>好きなことを深められる</strong> - プログラミングを通じて、興味を伸ばせます</li>
          </ul>
          ${analysis.matchPoints ? `
            <div class="diagnostic__match">
              <h5>お子さまとif(塾)の相性ポイント</h5>
              <ul>
                ${analysis.matchPoints.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getAllQuestions() {
    const questions = [];
    Object.entries(this.questions).forEach(([domain, domainQuestions]) => {
      domainQuestions.forEach(q => {
        questions.push({ ...q, domain });
      });
    });
    return questions;
  }

  calculateScores() {
    const scores = {};

    Object.entries(this.questions).forEach(([domain, questions]) => {
      let total = 0;
      let count = 0;

      questions.forEach(q => {
        if (this.answers[q.id] !== undefined) {
          let score = this.answers[q.id];
          // 逆転項目（強みの質問）は逆転させない
          // 困難の質問のみをカウント
          if (!q.strength) {
            total += score;
            count++;
          }
        }
      });

      const maxScore = count * 4;
      const percentage = maxScore > 0 ? (total / maxScore) * 100 : 0;

      let level;
      if (percentage < 25) level = '気になる程度は低い';
      else if (percentage < 50) level = 'やや気になる';
      else if (percentage < 75) level = '気になる傾向あり';
      else level = '傾向が見られる';

      scores[domain] = {
        total,
        percentage: Math.round(percentage),
        level
      };
    });

    return scores;
  }

  analyzeResults(scores) {
    const analysis = {
      strengths: [],
      challenges: [],
      advice: [],
      needsProfessional: false,
      matchPoints: []
    };

    // 強みの分析
    Object.entries(this.questions).forEach(([domain, questions]) => {
      questions.forEach(q => {
        if (q.strength && this.answers[q.id] >= 3) {
          const strengthTexts = this.getStrengthText(q.id);
          if (strengthTexts) {
            analysis.strengths.push(strengthTexts);
          }
        }
      });
    });

    // 課題の分析
    Object.entries(scores).forEach(([domain, score]) => {
      if (score.percentage >= 50) {
        const challengeText = this.getChallengeText(domain, score.percentage);
        if (challengeText) {
          analysis.challenges.push(challengeText);
        }

        if (score.percentage >= 75) {
          analysis.needsProfessional = true;
        }
      }
    });

    // アドバイスの生成
    analysis.advice = this.generateAdvice(scores);

    // if(塾)とのマッチポイント
    analysis.matchPoints = this.generateMatchPoints(scores);

    return analysis;
  }

  getStrengthText(questionId) {
    const strengthMap = {
      'a4': '好きなことには高い集中力を発揮できます',
      'a5': '細部への注意力が優れています',
      'a8': '特定分野への深い知識と探究心があります',
      's4': '知識を共有することに喜びを感じます',
      's5': '誠実で正直な性格が魅力です',
      's8': '専門的な知識や関心を持っています',
      'e4': '他者への共感力が高く、思いやりがあります',
      'e5': '芸術的・音楽的な感性が豊かです',
      'e8': '創造力と想像力に優れています',
      'b4': 'チャレンジ精神と行動力があります',
      'b5': 'エネルギッシュで活動的です',
      'b8': '粘り強く、最後までやり遂げる力があります',
      'ad5': '自分のペースで学ぶと高い理解力を発揮します',
      'ad7': '安心できる環境で力を発揮できます',
      'ad8': '独自の視点と考え方を持っています'
    };
    return strengthMap[questionId];
  }

  getChallengeText(domain, percentage) {
    const challengeMap = {
      attention: percentage >= 75
        ? '集中力の維持に困難さがあるかもしれません'
        : '注意を持続させることにやや困難があるようです',
      social: percentage >= 75
        ? '対人関係やコミュニケーションで困難さを感じているかもしれません'
        : '社会的なやり取りで戸惑うことがあるようです',
      emotion: percentage >= 75
        ? '感情のコントロールや不安への対処が難しいかもしれません'
        : '情緒面でのサポートが効果的かもしれません',
      behavior: percentage >= 75
        ? '衝動性や行動の調整に困難があるかもしれません'
        : '行動面でのサポートが役立つかもしれません',
      adaptation: percentage >= 75
        ? '学校生活や日常の適応に困難を感じているかもしれません'
        : '環境への適応にサポートがあると良いかもしれません'
    };
    return challengeMap[domain];
  }

  generateAdvice(scores) {
    const advice = [];

    // 共通のアドバイス
    advice.push({
      title: 'お子さまの「できた」を見つける',
      text: '小さなことでも「できたこと」を見つけて、具体的に褒めましょう。自己肯定感を育てることが、すべての成長の土台になります。',
      examples: [
        '「最後まで頑張ったね」',
        '「自分で気づけたのがすごいね」',
        '「昨日より上手にできたね」'
      ]
    });

    // 領域別アドバイス
    if (scores.attention.percentage >= 50) {
      advice.push({
        title: '環境を整える',
        text: '集中しやすい環境づくりが効果的です。刺激を減らし、取り組みやすい工夫をしましょう。',
        examples: [
          'デスク周りをシンプルに整理する',
          'タイマーを使って短い時間から取り組む',
          '一度に一つのことに集中できるようにする'
        ]
      });
    }

    if (scores.social.percentage >= 50) {
      advice.push({
        title: 'コミュニケーションを可視化する',
        text: '言葉だけでなく、視覚的な情報も活用すると伝わりやすくなります。',
        examples: [
          '予定をホワイトボードに書き出す',
          '約束事をリストにして見えるところに貼る',
          '気持ちカードを使って感情を表現する練習をする'
        ]
      });
    }

    if (scores.emotion.percentage >= 50) {
      advice.push({
        title: '安心できる居場所をつくる',
        text: 'お子さまが落ち着ける場所と時間を確保しましょう。気持ちを受け止める姿勢が大切です。',
        examples: [
          '話を遮らずに最後まで聞く',
          '「そう思ったんだね」と気持ちを受け止める',
          'クールダウンできるスペースを用意する'
        ]
      });
    }

    if (scores.behavior.percentage >= 50) {
      advice.push({
        title: '見通しを持たせる',
        text: '次に何があるかを事前に伝えることで、行動の切り替えがスムーズになります。',
        examples: [
          '「あと5分で終わりだよ」と予告する',
          '一日のスケジュールを朝に確認する',
          '変更がある時は早めに伝える'
        ]
      });
    }

    if (scores.adaptation.percentage >= 50) {
      advice.push({
        title: '無理をさせない',
        text: 'お子さまのエネルギーには限りがあります。休息と回復の時間を大切にしましょう。',
        examples: [
          '「頑張りすぎなくていいよ」と伝える',
          '本人のペースを尊重する',
          '学校以外の居場所も用意する'
        ]
      });
    }

    // 保護者へのメッセージ
    advice.push({
      title: '保護者自身のケアも大切に',
      text: 'お子さまをサポートするためには、保護者自身の心身の健康が不可欠です。一人で抱え込まず、周囲の力を借りましょう。',
      examples: [
        '同じ悩みを持つ保護者とつながる',
        '自分だけの時間を確保する',
        '専門家に相談することを躊躇しない'
      ]
    });

    return advice;
  }

  generateMatchPoints(scores) {
    const points = [];

    if (scores.attention.percentage >= 50) {
      points.push('自分のペースで学べるので、集中できる環境を自分で調整できます');
    }

    if (scores.social.percentage >= 50) {
      points.push('オンラインなので、対面のプレッシャーを感じにくい環境で学べます');
    }

    if (scores.emotion.percentage >= 50) {
      points.push('AI先生にいつでも質問でき、人に聞くことへの心理的ハードルを下げられます');
    }

    if (scores.behavior.percentage >= 50) {
      points.push('決まったカリキュラムがないので、興味のあることに没頭できます');
    }

    if (scores.adaptation.percentage >= 50) {
      points.push('自宅から参加できるので、登校の負担なく学びを続けられます');
    }

    // 強みとの関連
    const allQuestions = this.getAllQuestions();
    const hasCreativity = allQuestions.some(q =>
      q.strength && (q.id === 'e8' || q.id === 'ad8') && this.answers[q.id] >= 3
    );
    if (hasCreativity) {
      points.push('創造力を活かして、プログラミングで自分のアイデアを形にできます');
    }

    const hasDeepInterest = allQuestions.some(q =>
      q.strength && (q.id === 'a8' || q.id === 's8') && this.answers[q.id] >= 3
    );
    if (hasDeepInterest) {
      points.push('深い興味・関心を持てる分野を、さらに追求できます');
    }

    return points.slice(0, 4); // 最大4つまで
  }

  canProceedQuestions(currentQuestions) {
    return currentQuestions.every(q => this.answers[q.id] !== undefined);
  }

  updateProgress() {
    const progressBar = this.container.querySelector('.diagnostic__progress-bar');
    if (!progressBar) return;

    let progress = 0;
    const allQuestions = this.getAllQuestions();

    switch(this.steps[this.currentStep].id) {
      case 'intro':
        progress = 0;
        break;
      case 'basic':
        progress = 10;
        break;
      case 'questions':
        const answered = Object.keys(this.answers).length;
        progress = 10 + (answered / allQuestions.length) * 80;
        break;
      case 'result':
        progress = 100;
        break;
    }

    progressBar.style.width = `${progress}%`;
  }

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action], [data-field], [data-question]');
      if (!target) return;

      // アクションボタン
      if (target.dataset.action) {
        this.handleAction(target.dataset.action);
        return;
      }

      // 基本情報の選択
      if (target.dataset.field) {
        this.handleBasicInfoSelect(target);
        return;
      }

      // 質問への回答
      if (target.dataset.question) {
        this.handleAnswer(target);
        return;
      }
    });
  }

  handleAction(action) {
    switch(action) {
      case 'start':
        this.currentStep = 1;
        break;
      case 'next':
        if (this.currentStep === 2) {
          const allQuestions = this.getAllQuestions();
          const answered = Object.keys(this.answers).length;
          if (answered >= allQuestions.length) {
            this.currentStep = 3;
          }
        } else {
          this.currentStep++;
        }
        break;
      case 'back':
        if (this.currentStep === 2) {
          const answered = Object.keys(this.answers).length;
          if (answered > 5) {
            // 質問ページ内で戻る
            const questionsToRemove = Object.keys(this.answers).slice(-5);
            questionsToRemove.forEach(key => delete this.answers[key]);
          } else {
            this.currentStep--;
          }
        } else {
          this.currentStep--;
        }
        break;
      case 'restart':
        this.currentStep = 0;
        this.answers = {};
        this.basicInfo = {};
        break;
    }

    this.render();
    this.scrollToTop();

    // 結果ページでチャートを描画
    if (this.steps[this.currentStep].id === 'result') {
      setTimeout(() => this.drawChart(), 100);
    }
  }

  handleBasicInfoSelect(target) {
    const field = target.dataset.field;
    const value = target.dataset.value;

    if (field === 'age') {
      // 単一選択
      const siblings = this.container.querySelectorAll(`[data-field="age"]`);
      siblings.forEach(el => el.classList.remove('diagnostic__option--selected'));
      target.classList.add('diagnostic__option--selected');
      this.basicInfo.age = value;
    } else if (field === 'concerns') {
      // 複数選択
      target.classList.toggle('diagnostic__option--selected');
      if (!this.basicInfo.concerns) this.basicInfo.concerns = [];

      if (target.classList.contains('diagnostic__option--selected')) {
        this.basicInfo.concerns.push(value);
      } else {
        this.basicInfo.concerns = this.basicInfo.concerns.filter(v => v !== value);
      }
    }

    // 次へボタンの有効化チェック
    const nextBtn = this.container.querySelector('[data-action="next"]');
    if (nextBtn) {
      const canProceed = this.basicInfo.age &&
        this.basicInfo.concerns &&
        this.basicInfo.concerns.length > 0;
      nextBtn.disabled = !canProceed;
    }
  }

  handleAnswer(target) {
    const questionId = target.dataset.question;
    const value = parseInt(target.dataset.value);

    this.answers[questionId] = value;

    // 選択状態の更新
    const question = target.closest('.diagnostic__question');
    question.querySelectorAll('.diagnostic__answer').forEach(el => {
      el.classList.remove('diagnostic__answer--selected');
    });
    target.classList.add('diagnostic__answer--selected');

    // 次へボタンの有効化チェック
    this.updateNextButton();
    this.updateProgress();
  }

  updateNextButton() {
    const allQuestions = this.getAllQuestions();
    const questionsPerPage = 5;
    const currentPage = Math.floor(Object.keys(this.answers).length / questionsPerPage);
    const startIdx = currentPage * questionsPerPage;
    const endIdx = Math.min(startIdx + questionsPerPage, allQuestions.length);
    const currentQuestions = allQuestions.slice(startIdx, endIdx);

    const nextBtn = this.container.querySelector('[data-action="next"]');
    if (nextBtn) {
      nextBtn.disabled = !this.canProceedQuestions(currentQuestions);
    }
  }

  scrollToTop() {
    const section = this.container.closest('.diagnostic-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  drawChart() {
    const canvas = document.getElementById('diagnostic-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scores = this.calculateScores();
    const domains = Object.keys(this.domains);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景のグリッドを描画
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      for (let j = 0; j <= domains.length; j++) {
        const angle = (Math.PI * 2 / domains.length) * j - Math.PI / 2;
        const r = (radius / 4) * i;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 軸を描画
    domains.forEach((domain, i) => {
      const angle = (Math.PI * 2 / domains.length) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // ラベル
      const labelX = centerX + Math.cos(angle) * (radius + 25);
      const labelY = centerY + Math.sin(angle) * (radius + 25);
      ctx.fillStyle = this.domains[domain].color;
      ctx.font = '12px "Noto Sans JP"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.domains[domain].icon, labelX, labelY);
    });

    // データを描画
    ctx.beginPath();
    domains.forEach((domain, i) => {
      const angle = (Math.PI * 2 / domains.length) * i - Math.PI / 2;
      const value = scores[domain].percentage / 100;
      const r = radius * value;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // 塗りつぶし
    ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
    ctx.fill();

    // 線
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 点を描画
    domains.forEach((domain, i) => {
      const angle = (Math.PI * 2 / domains.length) * i - Math.PI / 2;
      const value = scores[domain].percentage / 100;
      const r = radius * value;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.domains[domain].color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('diagnostic-container')) {
    new DiagnosticTool('diagnostic-container');
  }
});
