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
