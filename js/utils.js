const Utils = {
  fmtDate(d, sep = '-') {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}${sep}${m}${sep}${day}`;
  },
  todayStr() { return this.fmtDate(new Date()); },
  daysDiff(d1, d2) {
    const a = new Date(d1), b = new Date(d2);
    return Math.floor((a - b) / 86400000);
  },
  getMonthDays(y, m) { return new Date(y, m + 1, 0).getDate(); },
  getSeason(date = new Date()) {
    const m = date.getMonth();
    if (m >= 2 && m <= 4) return '春';
    if (m >= 5 && m <= 7) return '夏';
    if (m >= 8 && m <= 10) return '秋';
    return '冬';
  },
  getRandomTemp(season) {
    const ranges = { '春': [12, 22], '夏': [25, 35], '秋': [10, 20], '冬': [-5, 8] };
    const [min, max] = ranges[season] || [15, 25];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  mockWeather() {
    const s = this.getSeason();
    const t = this.getRandomTemp(s);
    const conds = {
      '春': [['☀️', '晴朗'], ['🌤️', '多云'], ['🌦️', '小雨'], ['💨', '微风']],
      '夏': [['☀️', '晴热'], ['⛈️', '雷阵雨'], ['🌦️', '阵雨'], ['💨', '南风']],
      '秋': [['☀️', '秋高气爽'], ['🍂', '微风'], ['🌧️', '秋雨'], ['🌤️', '多云']],
      '冬': [['❄️', '寒冷'], ['🌨️', '小雪'], ['☀️', '晴冷'], ['💨', '寒风']]
    };
    const c = conds[s][Math.floor(Math.random() * conds[s].length)];
    return { season: s, temp: t, icon: c[0], desc: c[1] };
  },
  toast(msg, dur = 2000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => el.classList.remove('show'), dur);
  },
  showModal(html) {
    const ov = document.getElementById('modalOverlay');
    const mc = document.getElementById('modalContainer');
    mc.innerHTML = html;
    ov.classList.add('show');
  },
  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
  },
  readFile(file, maxW = 600) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, maxW / img.width);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const cvs = document.createElement('canvas');
          cvs.width = w; cvs.height = h;
          cvs.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(cvs.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  COLORS: [
    { name: '白色', hex: '#FFFFFF', cat: '浅色系' },
    { name: '米白', hex: '#F5F1E8', cat: '浅色系' },
    { name: '灰色', hex: '#888888', cat: '中性色' },
    { name: '黑色', hex: '#1A1A1A', cat: '深色系' },
    { name: '藏青', hex: '#2D3E50', cat: '深色系' },
    { name: '卡其', hex: '#B89F6E', cat: '大地色' },
    { name: '棕色', hex: '#8B5A3C', cat: '大地色' },
    { name: '红色', hex: '#D45A5A', cat: '暖色系' },
    { name: '粉色', hex: '#E8A5B0', cat: '暖色系' },
    { name: '橙色', hex: '#F0A05A', cat: '暖色系' },
    { name: '黄色', hex: '#F0D05A', cat: '暖色系' },
    { name: '绿色', hex: '#6AAA7A', cat: '冷色系' },
    { name: '蓝色', hex: '#5A8AC4', cat: '冷色系' },
    { name: '紫色', hex: '#A87AC4', cat: '冷色系' },
    { name: '牛仔蓝', hex: '#4A6A8A', cat: '中性色' },
    { name: '条纹', hex: '#E8E8E8', cat: '图案' },
    { name: '格纹', hex: '#D8C8B8', cat: '图案' },
    { name: '碎花', hex: '#F0D8E0', cat: '图案' }
  ],
  CATEGORY_EMOJI: {
    'T恤': '👕', '衬衫': '👔', '卫衣': '🧥', '毛衣': '🧶', '吊带': '🎽',
    '西装外套': '🥼', '风衣': '🧥', '夹克': '🧥', '大衣': '🧥', '针织开衫': '🧶',
    '牛仔裤': '👖', '休闲裤': '👖', '西装裤': '👖', '运动裤': '🏃', '短裤': '🩳',
    '半身裙': '👗', '连衣裙': '👗', '背带裙': '👗',
    '高跟鞋': '👠', '平底鞋': '👞', '运动鞋': '👟', '靴子': '👢', '凉鞋': '👡',
    '包': '👜', '帽子': '🎩', '围巾': '🧣', '项链': '📿', '耳环': '💎', '腰带': '🎗️', '袜子': '🧦'
  },
  CATEGORY_MAP: {
    '上衣': ['T恤', '衬衫', '卫衣', '毛衣', '吊带'],
    '外套': ['西装外套', '风衣', '夹克', '大衣', '针织开衫'],
    '下装': ['牛仔裤', '休闲裤', '西装裤', '运动裤', '短裤', '半身裙', '背带裙'],
    '连衣裙': ['连衣裙'],
    '鞋靴': ['高跟鞋', '平底鞋', '运动鞋', '靴子', '凉鞋'],
    '配饰': ['包', '帽子', '围巾', '项链', '耳环', '腰带', '袜子']
  },
  CAT_ORDER: ['上衣', '外套', '下装', '连衣裙', '鞋靴', '配饰'],
  SCENES: ['通勤', '休闲', '运动', '约会', '正式'],
  SEASONS: ['春', '夏', '秋', '冬'],
  STYLES: ['极简', '甜美', '复古', '街头', '通勤', '度假'],

  DRESSING_GOALS: ['显瘦', '显高', '通勤专业', '温柔约会', '活力休闲', '高级感'],

  BODY_TYPE_ADVICE: {
    '🍎 苹果型': {
      fit: ['A字裙', 'V领上衣', '高腰下装', '宽松直筒', '落肩款'],
      avoid: ['紧身腰线', '短上衣', '低腰裤', '大面积横条', '腰部装饰'],
      colors: { top: '深色系', bottom: '浅色系/大地色', accent: '冷色系配饰' },
      tips: '上身深色收缩+下身浅色膨胀，引导视线下移'
    },
    '🍐 梨型': {
      fit: ['上宽下紧', '荷叶边上衣', 'A字裙', '直筒裤', '肩部装饰款'],
      avoid: ['紧身裤', '短裙', '胯部装饰', '低腰', '臀部口袋设计'],
      colors: { top: '浅色系/暖色系', bottom: '深色系', accent: '颈部配饰' },
      tips: '上身浅色膨胀+下身深色收缩，平衡肩胯比例'
    },
    '⏳ 沙漏型': {
      fit: ['收腰款', '高腰裙', '腰带装饰', 'X型连衣裙', '包臀裙'],
      avoid: ['oversize', '直筒裙', '低腰裤', '无腰线款', '均码宽松'],
      colors: { top: '任意', bottom: '同色系', accent: '腰间点缀' },
      tips: '强调腰线是关键，X版型最能展现身材优势'
    },
    '▢ 矩型': {
      fit: ['制造腰线款', '荷叶边', '层叠搭配', 'A字裙', '腰带装饰'],
      avoid: ['直筒连衣裙', '无腰线', '紧身套装', '过于平直剪裁'],
      colors: { top: '浅色系/暖色系', bottom: '深色系', accent: '腰间/颈部' },
      tips: '用腰线和层次感制造曲线，上下不同色增加层次'
    },
    '🔻 倒三角': {
      fit: ['下摆蓬松', 'A字裙', '阔腿裤', 'V领/方领', '下装装饰款'],
      avoid: ['垫肩', '泡泡袖', '一字领', '高领', '肩部装饰'],
      colors: { top: '深色系', bottom: '浅色系/暖色系', accent: '下半身点缀' },
      tips: '上身深色收缩+下身浅色膨胀，视觉平衡肩胯'
    },
    '✦ 匀称型': {
      fit: ['多数版型均可', '收腰款', '直筒', 'A字'],
      avoid: ['极端紧身', '极端oversize'],
      colors: { top: '任意', bottom: '任意', accent: '任意' },
      tips: '身材标准百搭，关注风格和场合即可'
    }
  },

  FEEDBACK_TAGS: [
    { id: 'too_cold', label: '太冷', icon: '🥶' },
    { id: 'too_hot', label: '太热', icon: '🥵' },
    { id: 'looks_fat', label: '显胖', icon: '😰' },
    { id: 'looks_slim', label: '显瘦', icon: '😍' },
    { id: 'complimented', label: '被夸了', icon: '✨' },
    { id: 'uncomfortable', label: '不舒服', icon: '😣' },
    { id: 'confident', label: '自信满满', icon: '💪' },
    { id: 'not_match', label: '搭配不协调', icon: '🤔' }
  ],

  colorMatch(a, b) {
    if (!a || !b) return 0.6;
    const ca = this.COLORS.find(c => c.name === a);
    const cb = this.COLORS.find(c => c.name === b);
    if (!ca || !cb) return 0.5;
    if (a === b) return 0.9;
    const rules = [
      { cats: ['浅色系', '深色系'], score: 0.95 },
      { cats: ['中性色', '暖色系'], score: 0.9 },
      { cats: ['中性色', '冷色系'], score: 0.9 },
      { cats: ['大地色', '浅色系'], score: 0.88 },
      { cats: ['大地色', '深色系'], score: 0.85 },
      { cats: ['暖色系', '浅色系'], score: 0.75 },
      { cats: ['冷色系', '浅色系'], score: 0.75 },
      { cats: ['暖色系', '大地色'], score: 0.7 },
      { cats: ['冷色系', '大地色'], score: 0.65 },
      { cats: ['图案', '浅色系'], score: 0.7 },
      { cats: ['图案', '深色系'], score: 0.65 }
    ];
    for (const r of rules) {
      if ((r.cats.includes(ca.cat) && r.cats.includes(cb.cat)) ||
          (ca.cat === r.cats[0] && cb.cat === r.cats[1]) ||
          (ca.cat === r.cats[1] && cb.cat === r.cats[0])) {
        return r.score;
      }
    }
    return 0.4;
  },
  getCategoryGroup(sub) {
    for (const [g, subs] of Object.entries(this.CATEGORY_MAP)) {
      if (subs.includes(sub)) return g;
    }
    return '上衣';
  },

  isItemSlimming(item, bodyType) {
    const advice = this.BODY_TYPE_ADVICE[bodyType];
    if (!advice) return 0;
    const name = (item.name || '').toLowerCase();
    const sub = item.subCategory || '';
    let score = 0;
    advice.fit.forEach(f => {
      if (name.includes(f) || sub.includes(f)) score += 15;
    });
    advice.avoid.forEach(f => {
      if (name.includes(f) || sub.includes(f)) score -= 15;
    });
    return score;
  },

  isItemHeightening(item) {
    const name = (item.name || '').toLowerCase();
    const sub = item.subCategory || '';
    let score = 0;
    if (name.includes('高腰') || sub.includes('高腰')) score += 20;
    if (name.includes('v领') || sub.includes('v领')) score += 10;
    if (item.category === '鞋靴' && (name.includes('高跟') || name.includes('厚底'))) score += 15;
    if (name.includes('短上衣') || name.includes('croptop')) score += 12;
    if (name.includes('低腰')) score -= 15;
    return score;
  },

  isItemProfessional(item) {
    const name = (item.name || '').toLowerCase();
    const sub = item.subCategory || '';
    let score = 0;
    if (sub.includes('西装') || sub.includes('衬衫') || sub.includes('西装裤')) score += 20;
    if (name.includes('西装') || name.includes('衬衫')) score += 15;
    if (item.category === '鞋靴' && (name.includes('高跟') || name.includes('皮鞋'))) score += 10;
    if (name.includes('破洞') || name.includes('拖鞋')) score -= 20;
    return score;
  },

  isItemGentle(item) {
    const name = (item.name || '').toLowerCase();
    const sub = item.subCategory || '';
    let score = 0;
    if (sub.includes('针织') || sub.includes('连衣裙') || sub.includes('半身裙')) score += 15;
    if (name.includes('针织') || name.includes('蕾丝') || name.includes('碎花')) score += 15;
    const warmColors = ['粉色', '米白', '白色', '碎花'];
    if (warmColors.includes(item.color)) score += 10;
    if (name.includes('铆钉') || name.includes('皮革')) score -= 15;
    return score;
  },

  goalScoreForItem(item, goal, bodyType) {
    switch (goal) {
      case '显瘦': return this.isItemSlimming(item, bodyType);
      case '显高': return this.isItemHeightening(item);
      case '通勤专业': return this.isItemProfessional(item);
      case '温柔约会': return this.isItemGentle(item);
      case '活力休闲': {
        let s = 0;
        if (item.category === '鞋靴' && item.subCategory === '运动鞋') s += 20;
        if ((item.name || '').includes('卫衣') || (item.name || '').includes('运动')) s += 15;
        return s;
      }
      case '高级感': {
        let s = 0;
        const advColors = ['黑色', '白色', '藏青', '卡其', '灰色'];
        if (advColors.includes(item.color)) s += 15;
        if (item.subCategory === '西装外套' || item.subCategory === '风衣' || item.subCategory === '大衣') s += 20;
        return s;
      }
      default: return 0;
    }
  },

  drawLineChart(canvas, data, color = '#d4919a') {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = canvas.height * dpr || 220 * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = canvas.height / dpr;
    const pad = { t: 20, r: 16, b: 30, l: 40 };
    const gw = w - pad.l - pad.r;
    const gh = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);
    if (!data || data.length < 1) {
      ctx.fillStyle = '#a9a9b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据，开始记录后即可查看趋势', w / 2, h / 2);
      return;
    }
    const vals = data.map(d => d.v);
    const minV = Math.min(...vals) * 0.95;
    const maxV = Math.max(...vals) * 1.05;
    const range = maxV - minV || 1;
    const gridYs = 4;
    ctx.strokeStyle = '#f0e6e8';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a9a9b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridYs; i++) {
      const y = pad.t + (gh / gridYs) * i;
      const v = maxV - (range / gridYs) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + gw, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), pad.l - 6, y + 3);
    }
    const stepX = data.length > 1 ? gw / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      x: pad.l + stepX * i,
      y: pad.t + gh - ((d.v - minV) / range) * gh,
      label: d.l, v: d.v
    }));
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
    grad.addColorStop(0, color + '44');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.t + gh);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.t + gh);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.fillStyle = '#7a7a8c';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(points.length / 6);
    points.forEach((p, i) => {
      if (i % labelStep === 0 || i === points.length - 1) {
        ctx.fillText(p.label, p.x, h - 10);
      }
    });
  }
};

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') Utils.closeModal();
});
