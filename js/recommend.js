const recommendModule = {
  weather: null,
  schedule: '通勤',
  recs: [],
  prefs: { sceneFreq: {} },

  async init() {
    this.weather = Utils.mockWeather();
    this._calcPrefs();
    await this.generate();
  },

  _calcPrefs() {
    const recent = outfitModule.outfits.slice(0, 30);
    this.prefs.sceneFreq = {};
    this.prefs.categoryFreq = {};
    this.prefs.colorFreq = {};
    recent.forEach(o => {
      (o.scenes || []).forEach(s => this.prefs.sceneFreq[s] = (this.prefs.sceneFreq[s] || 0) + 1);
      o.itemIds.forEach(iid => {
        const it = wardrobeModule.items.find(i => i.id === iid);
        if (!it) return;
        this.prefs.categoryFreq[it.category] = (this.prefs.categoryFreq[it.category] || 0) + 1;
        if (it.color) this.prefs.colorFreq[it.color] = (this.prefs.colorFreq[it.color] || 0) + 1;
      });
    });
  },

  onScheduleChange() {
    this.schedule = document.getElementById('scheduleType').value;
    this.generate();
  },

  refresh() {
    this.weather = Utils.mockWeather();
    this._updateWeatherCard();
    this.generate();
    Utils.toast('已为您生成新的推荐');
  },

  _updateWeatherCard() {
    const w = this.weather;
    document.getElementById('weatherIcon').textContent = w.icon;
    document.getElementById('weatherTemp').textContent = w.temp + '°C';
    document.getElementById('weatherDesc').textContent = w.desc;
    const szn = { '春': '春季', '夏': '夏季', '秋': '秋季', '冬': '冬季' };
    document.getElementById('weatherSeason').textContent = szn[w.season] || w.season;
  },

  _filterBySeason(items, season) {
    const map = { '春': ['春', '春秋', '四季'], '夏': ['夏', '四季'], '秋': ['秋', '春秋', '四季'], '冬': ['冬', '春秋', '四季'] };
    const ok = map[season] || [season];
    return items.filter(i => {
      if (!i.seasons || i.seasons.length === 0) return true;
      return i.seasons.some(s => ok.includes(s));
    });
  },

  _filterByScene(items, scene) {
    return items.filter(i => {
      if (!i.scenes || i.scenes.length === 0) return true;
      return i.scenes.includes(scene);
    });
  },

  _tempLayer(temp) {
    if (temp >= 28) return { needOuter: false, needTop: true, needBottom: true, weight: 'light' };
    if (temp >= 23) return { needOuter: false, needTop: true, needBottom: true, weight: 'light-mid' };
    if (temp >= 18) return { needOuter: false, needTop: true, needBottom: true, weight: 'mid' };
    if (temp >= 10) return { needOuter: true, needTop: true, needBottom: true, weight: 'mid-heavy' };
    return { needOuter: true, needTop: true, needBottom: true, weight: 'heavy' };
  },

  _needDress(scene) {
    return scene === '约会' || scene === '正式';
  },

  _scoreItem(it, ctx, usedColors) {
    let s = 0;
    const daysSinceLast = it.lastWorn ? Utils.daysDiff(Utils.todayStr(), it.lastWorn) : 999;
    if (daysSinceLast >= 14) s += 25;
    else if (daysSinceLast >= 7) s += 18;
    else if (daysSinceLast >= 3) s += 10;
    else s += 2;
    if (it.wearCount === 0) s += 20;
    if (it.seasons?.includes(ctx.season)) s += 12;
    if (it.scenes?.includes(ctx.scene)) s += 15;
    if (usedColors.length > 0) {
      const avg = usedColors.reduce((sum, c) => sum + Utils.colorMatch(c, it.color), 0) / usedColors.length;
      s += avg * 25;
    }
    if (this.prefs.colorFreq?.[it.color]) {
      s += Math.min(8, this.prefs.colorFreq[it.color]);
    }
    s += Math.random() * 8;
    return s;
  },

  _pickFromCat(cat, ctx, usedColors, n = 1, excludeIds = []) {
    let pool = wardrobeModule.items.filter(i => i.category === cat && !excludeIds.includes(i.id));
    pool = this._filterBySeason(pool, ctx.season);
    pool = this._filterByScene(pool, ctx.scene);
    if (pool.length === 0) {
      pool = wardrobeModule.items.filter(i => i.category === cat && !excludeIds.includes(i.id));
    }
    if (pool.length === 0) return [];
    const scored = pool.map(i => ({ it: i, s: this._scoreItem(i, ctx, usedColors) }))
                        .sort((a, b) => b.s - a.s);
    return scored.slice(0, n);
  },

  async generate() {
    this._updateWeatherCard();
    const ctx = { season: this.weather.season, scene: this.schedule, temp: this.weather.temp };
    const layer = this._tempLayer(ctx.temp);
    const needDress = this._needDress(ctx.scene);
    const plans = [];

    for (let attempt = 0; attempt < 5; attempt++) {
      const items = [];
      const usedColors = [];
      let totalScore = 0;
      let reasons = [];

      if (needDress) {
        const dress = this._pickFromCat('连衣裙', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
        if (dress) {
          items.push(dress);
          usedColors.push(dress.it.color);
          totalScore += dress.s;
        }
      } else {
        const top = this._pickFromCat('上衣', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
        if (top) { items.push(top); usedColors.push(top.it.color); totalScore += top.s; }
        const bot = this._pickFromCat('下装', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
        if (bot) { items.push(bot); usedColors.push(bot.it.color); totalScore += bot.s; }
      }

      if (layer.needOuter) {
        const outer = this._pickFromCat('外套', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
        if (outer) { items.push(outer); usedColors.push(outer.it.color); totalScore += outer.s; }
      }

      const shoe = this._pickFromCat('鞋靴', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
      if (shoe) { items.push(shoe); usedColors.push(shoe.it.color); totalScore += shoe.s; }

      if (Math.random() > 0.4) {
        const acc = this._pickFromCat('配饰', ctx, usedColors, 1, items.map(i => i.it?.id))[0];
        if (acc) { items.push(acc); usedColors.push(acc.it.color); totalScore += acc.s; }
      }

      if (items.length < 3) continue;

      if (ctx.temp >= 28) reasons.push('🌞 轻薄透气，适合夏日');
      else if (ctx.temp <= 10) reasons.push('❄️ 层次保暖，抗御低温');
      else reasons.push('🌿 厚度适中，舒适得体');
      reasons.push(`👔 ${ctx.scene}场合专属搭配`);

      const newWorn = items.filter(x => x.it.wearCount === 0).length;
      if (newWorn > 0) reasons.push(`✨ 激活${newWorn}件新品`);

      const allIds = items.map(x => x.it.id).sort().join(',');
      if (plans.some(p => p.itemIds === allIds)) continue;

      plans.push({
        itemIds: allIds,
        items: items.map(x => x.it),
        score: Math.min(100, Math.round(totalScore / Math.max(items.length, 3) * 1.3)),
        reasons,
        colors: usedColors.filter(Boolean),
        ctx: { ...ctx }
      });
      if (plans.length >= 3) break;
    }

    this.recs = plans;
    this.render();
  },

  async saveAsOutfit(idx) {
    const plan = this.recs[idx];
    if (!plan) return;
    outfitModule.selectedItems = plan.items.map(i => i.id);
    outfitModule.showOutfitModal(null, Utils.todayStr());
  },

  render() {
    const tip = document.getElementById('recommendTip');
    const tips = {
      '通勤': '💼 今日是通勤日，为您挑选干练不失品味的搭配，兼顾舒适与专业感',
      '休闲': '🍃 休闲时光，舒适与颜值并存的搭配，自在做自己',
      '约会': '💕 约会场合，挑选既显气色又增添好感度的造型',
      '运动': '🏃 今日有运动安排，透气舒适的运动装让你活力满满',
      '正式': '👑 正式场合，经典端庄的搭配帮你hold住全场'
    };
    tip.textContent = tips[this.schedule] || '';

    const list = document.getElementById('recommendList');
    if (this.recs.length === 0) {
      list.innerHTML = `<div class="empty-state small"><div class="empty-icon">🧥</div><p>衣橱单品不足，无法生成完整搭配</p><p class="empty-sub">请先添加上衣、下装（或连衣裙）、鞋靴等基础单品</p></div>`;
      return;
    }
    list.innerHTML = this.recs.map((p, idx) => {
      const itemsHtml = p.items.map(it => {
        const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
        return `<div class="rec-item">
          <div class="rec-item-img">${it.photo ? `<img src="${it.photo}">` : emoji}</div>
          <div class="rec-item-name">${it.name}</div>
        </div>`;
      }).join('');

      const tags = [
        `<span class="rec-tag rt-season">${p.ctx.season}季</span>`,
        `<span class="rec-tag rt-scene">${p.ctx.scene}</span>`,
        ...p.colors.slice(0, 2).map(c => `<span class="rec-tag rt-color">${c}</span>`)
      ].join('');

      return `<div class="recommend-card">
        <div class="rec-score">匹配度 ${p.score}%</div>
        <div class="rec-title">推荐方案 ${idx + 1}</div>
        <div class="rec-reason">${p.reasons.join(' · ')}</div>
        <div class="rec-items">${itemsHtml}</div>
        <div class="rec-tags">${tags}</div>
        <div class="rec-actions">
          <button class="btn-ghost btn-sm" onclick="recommendModule.saveAsOutfit(${idx})">📅 作为今日穿搭</button>
          <button class="btn-primary btn-sm" onclick="recommendModule._detail(${idx})">查看详情</button>
        </div>
      </div>`;
    }).join('');
  },

  _detail(idx) {
    const p = this.recs[idx];
    if (!p) return;
    const items = p.items.map(it => {
      const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
      return `<div class="oi-item"><div class="oi-img">${it.photo ? `<img src="${it.photo}">` : emoji}</div><div class="oi-name">${it.name}</div></div>`;
    }).join('');
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">方案详情 · 匹配度${p.score}%</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div style="background:var(--bg-soft); padding:12px; border-radius:10px; margin-bottom:14px; font-size:12px; color:var(--text-secondary); line-height:1.8;">
        ${p.reasons.map(r => '· ' + r).join('<br>')}
      </div>
      <div class="outfit-items">${items}</div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">关闭</button>
        <button class="btn-primary btn-block btn-md" onclick="Utils.closeModal();recommendModule.saveAsOutfit(${idx})">保存为穿搭</button>
      </div>
    `);
  }
};
