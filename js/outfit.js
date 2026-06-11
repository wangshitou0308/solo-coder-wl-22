const outfitModule = {
  outfits: [],
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedItems: [],
  currentView: 'calendar',
  _pendingReasons: null,
  _pendingGoal: null,
  _currentRating: 0,
  _modalGoal: '',
  _modalReasons: [],

  async init() {
    this.outfits = (await DB.getAll('outfits')).sort((a, b) => new Date(b.date) - new Date(a.date));
    this.renderCalendar();
    this.renderList();
    this.renderRanks();
  },

  switchView(btn, view) {
    document.querySelectorAll('.otab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.outfit-view').forEach(v => v.classList.remove('active'));
    document.getElementById('outfit' + view.charAt(0).toUpperCase() + view.slice(1) + 'View').classList.add('active');
    this.currentView = view;
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    this.renderCalendar();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    this.renderCalendar();
  },

  renderCalendar() {
    document.getElementById('calTitle').textContent = `${this.currentYear}年${this.currentMonth + 1}月`;
    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const days = Utils.getMonthDays(this.currentYear, this.currentMonth);
    const prevDays = Utils.getMonthDays(this.currentYear, this.currentMonth - 1);
    const today = new Date();
    const todayStr = Utils.fmtDate(today);
    const outfitMap = {};
    this.outfits.forEach(o => { outfitMap[o.date] = (outfitMap[o.date] || 0) + 1; });

    let html = '';
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-cell other-month"><span class="cal-day-num">${prevDays - i}</span></div>`;
    }
    for (let d = 1; d <= days; d++) {
      const ds = Utils.fmtDate(new Date(this.currentYear, this.currentMonth, d));
      const isToday = ds === todayStr;
      const hasO = outfitMap[ds];
      let dots = '';
      if (hasO) {
        dots = '<div class="cal-dot">';
        for (let i = 0; i < Math.min(hasO, 3); i++) dots += '<span class="cd"></span>';
        dots += '</div>';
      }
      html += `<div class="cal-cell ${isToday ? 'today' : ''} ${hasO ? 'has-outfit' : ''}" onclick="outfitModule.showDayOutfits('${ds}')">
        <span class="cal-day-num">${d}</span>${dots}
      </div>`;
    }
    const remain = 42 - (firstDay + days);
    for (let i = 1; i <= remain; i++) {
      html += `<div class="cal-cell other-month"><span class="cal-day-num">${i}</span></div>`;
    }
    grid.innerHTML = html;
  },

  showDayOutfits(date) {
    const list = this.outfits.filter(o => o.date === date);
    if (list.length === 0) {
      if (confirm(`${date} 还没有穿搭记录，现在创建一条？`)) this.showOutfitModal(null, date);
      return;
    }
    list.forEach(o => this.viewOutfit(o.id));
  },

  showOutfitModal(editId = null, presetDate = null) {
    const of = editId ? this.outfits.find(o => o.id === editId) : null;
    const today = presetDate || of?.date || Utils.todayStr();
    const selScenes = of?.scenes || [];
    const selSeasons = of?.seasons || [Utils.getSeason(new Date(today))];
    this.selectedItems = of?.itemIds || [];
    this._currentRating = of?.rating || 0;
    const selFeedback = of?.feedbackTags || [];
    const weather = of?.weather || Utils.mockWeather();
    const goal = of?.goal || this._pendingGoal || '';
    const reasons = of?.reasons || this._pendingReasons || [];
    this._modalGoal = goal;
    this._modalReasons = reasons;
    this._pendingReasons = null;
    this._pendingGoal = null;

    let diaryText = of?.diary || '';
    if (!editId && reasons.length > 0 && !diaryText) {
      diaryText = reasons.join('\n');
    }

    const scenes = Utils.SCENES.map(s =>
      `<button class="tag-check scene ${selScenes.includes(s) ? 'active' : ''}"
        onclick="this.classList.toggle('active')">${s}</button>`
    ).join('');
    const seasons = Utils.SEASONS.map(s =>
      `<button class="tag-check season ${selSeasons.includes(s) ? 'active' : ''}"
        onclick="this.classList.toggle('active')">${s}</button>`
    ).join('');

    const starsHtml = [1, 2, 3, 4, 5].map(i =>
      `<span class="star" data-val="${i}" onclick="outfitModule._setRating(${i})" style="font-size:28px;cursor:pointer;color:${i <= this._currentRating ? '#f0c040' : '#ddd'};transition:color 0.2s;">★</span>`
    ).join('');

    const feedbackHtml = Utils.FEEDBACK_TAGS.map(t =>
      `<button class="tag-check ${selFeedback.includes(t.id) ? 'active' : ''}" data-fid="${t.id}" onclick="this.classList.toggle('active')">${t.icon} ${t.label}</button>`
    ).join('');

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${of ? '编辑穿搭' : '新建穿搭'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">穿搭日期</label>
          <input type="date" class="form-input" id="of-date" value="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">天气图标</label>
          <select class="form-select" id="of-wicon">
            ${['☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '❄️', '🌨️', '💨', '🍂'].map(i =>
              `<option ${weather.icon === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">温度 (°C)</label>
          <input type="number" class="form-input" id="of-wtemp" value="${weather.temp}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">天气描述</label>
        <input type="text" class="form-input" id="of-wdesc" value="${weather.desc}">
      </div>

      <div class="form-group">
        <label class="form-label">穿搭满意度</label>
        <div id="of-rating-stars" style="display:flex;gap:4px;">${starsHtml}</div>
        <input type="hidden" id="of-rating" value="${this._currentRating}">
      </div>

      <div class="form-group">
        <label class="form-label">穿搭感受</label>
        <div class="tag-check-group" id="of-feedback">${feedbackHtml}</div>
      </div>

      <div class="form-group">
        <label class="form-label">适用场合</label>
        <div class="tag-check-group" id="of-scenes">${scenes}</div>
      </div>

      <div class="form-group">
        <label class="form-label">适用季节</label>
        <div class="tag-check-group" id="of-seasons">${seasons}</div>
      </div>

      <div class="form-group">
        <label class="form-label">选择衣物
          <span id="of-selected-count" style="color:var(--primary); font-weight:600;"> (${this.selectedItems.length} 件已选)</span>
        </label>
        <div class="selected-pills" id="of-selected-pills">${this._renderPills()}</div>
        ${wardrobeModule.items.length === 0 ?
          `<div style="background:var(--bg-soft); padding:14px; border-radius:10px; text-align:center; font-size:12px; color:var(--text-muted);">衣橱为空，请先添加衣物</div>`
          : this._renderPicker()}
      </div>

      <div class="form-group">
        <label class="form-label">今日上身照（可选）</label>
        <label class="photo-upload" id="of-photo-box" style="aspect-ratio:4/3;">
          ${of?.photo ? `<img src="${of.photo}" id="of-photo-img">` :
            `<div><div class="photo-upload-icon">📸</div><div>点击拍照或上传</div></div>`}
          <input type="file" accept="image/*" capture="environment" style="display:none" id="of-photo" onchange="outfitModule._onPhoto(event)">
        </label>
      </div>

      <div class="form-group">
        <label class="form-label">活动日记</label>
        <textarea class="form-textarea" id="of-diary" placeholder="今天去了哪里？心情如何？有什么穿搭心得...">${diaryText}</textarea>
      </div>

      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">取消</button>
        <button class="btn-primary btn-block btn-md" onclick="outfitModule.saveOutfit(${editId || 'null'})">保存穿搭</button>
      </div>
    `);
  },

  _setRating(val) {
    this._currentRating = val;
    document.getElementById('of-rating').value = val;
    document.querySelectorAll('#of-rating-stars .star').forEach(s => {
      const sv = parseInt(s.dataset.val);
      s.style.color = sv <= val ? '#f0c040' : '#ddd';
    });
  },

  _renderPicker() {
    let html = '';
    Utils.CAT_ORDER.forEach(cat => {
      const items = wardrobeModule.items.filter(i => i.category === cat);
      if (items.length === 0) return;
      html += `<div class="wp-cat-title">${cat}</div>`;
      html += `<div class="wardrobe-picker-grid">`;
      items.forEach(it => {
        const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
        const sel = this.selectedItems.includes(it.id);
        html += `<div class="wp-item ${sel ? 'selected' : ''}" onclick="outfitModule._toggleItem(${it.id}, this)">
          ${it.photo ? `<img src="${it.photo}">` : `<div style="margin-top:5px;">${emoji}</div>`}
          <span>${it.name}</span>
        </div>`;
      });
      html += `</div>`;
    });
    return html;
  },

  _renderPills() {
    if (this.selectedItems.length === 0) return '';
    return this.selectedItems.map(id => {
      const it = wardrobeModule.items.find(i => i.id === id);
      if (!it) return '';
      return `<span class="sp-pill">${Utils.CATEGORY_EMOJI[it.subCategory] || '👕'} ${it.name}
        <button class="sp-close" onclick="event.stopPropagation();outfitModule._removePill(${id})">✕</button></span>`;
    }).join('');
  },

  _toggleItem(id, el) {
    if (this.selectedItems.includes(id)) {
      this.selectedItems = this.selectedItems.filter(x => x !== id);
      el.classList.remove('selected');
    } else {
      this.selectedItems.push(id);
      el.classList.add('selected');
    }
    document.getElementById('of-selected-count').textContent = ` (${this.selectedItems.length} 件已选)`;
    document.getElementById('of-selected-pills').innerHTML = this._renderPills();
  },

  _removePill(id) {
    this.selectedItems = this.selectedItems.filter(x => x !== id);
    document.getElementById('of-selected-count').textContent = ` (${this.selectedItems.length} 件已选)`;
    document.getElementById('of-selected-pills').innerHTML = this._renderPills();
    document.querySelectorAll('.wp-item').forEach(el => {
      el.classList.remove('selected');
    });
    const pickerItems = document.querySelectorAll('.wp-item');
    this.selectedItems.forEach(sid => {
      pickerItems.forEach(el => {
        const onclick = el.getAttribute('onclick') || '';
        if (onclick.includes(`(${sid},`)) el.classList.add('selected');
      });
    });
  },

  async _onPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await Utils.readFile(file, 700);
      const box = document.getElementById('of-photo-box');
      const old = box.querySelector('img');
      if (old) old.remove();
      const img = document.createElement('img');
      img.src = dataUrl;
      img.id = 'of-photo-img';
      const t = box.querySelector('div');
      if (t) t.remove();
      box.insertBefore(img, box.firstChild);
    } catch (err) { Utils.toast('图片处理失败'); }
  },

  _getPhoto() {
    const img = document.getElementById('of-photo-img');
    return img ? img.src : '';
  },

  async _updateWearCounts(oldIds, newIds, date) {
    const removed = (oldIds || []).filter(id => !newIds.includes(id));
    const added = newIds.filter(id => !(oldIds || []).includes(id));
    for (const id of removed) {
      const it = wardrobeModule.items.find(i => i.id === id);
      if (!it) continue;
      it.wearCount = Math.max(0, (it.wearCount || 0) - 1);
      it.wornDates = (it.wornDates || []).filter(d => d !== date);
      if (it.lastWorn === date) {
        it.lastWorn = it.wornDates.length ? [...it.wornDates].sort().pop() : null;
      }
      await DB.put('clothes', it);
    }
    for (const id of added) {
      const it = wardrobeModule.items.find(i => i.id === id);
      if (!it) continue;
      it.wearCount = (it.wearCount || 0) + 1;
      it.wornDates = [...new Set([...(it.wornDates || []), date])];
      if (!it.lastWorn || date > it.lastWorn) it.lastWorn = date;
      await DB.put('clothes', it);
    }
  },

  async saveOutfit(editId) {
    const date = document.getElementById('of-date').value;
    if (!date) return Utils.toast('请选择日期');
    if (this.selectedItems.length === 0) return Utils.toast('请至少选择一件衣物');

    const scenes = Array.from(document.querySelectorAll('#of-scenes .tag-check'))
      .filter(el => el.classList.contains('active'))
      .map(el => el.textContent.trim());
    const seasons = Array.from(document.querySelectorAll('#of-seasons .tag-check'))
      .filter(el => el.classList.contains('active'))
      .map(el => el.textContent.trim());
    const feedbackTags = Array.from(document.querySelectorAll('#of-feedback .tag-check'))
      .filter(el => el.classList.contains('active'))
      .map(el => el.dataset.fid);
    const rating = parseInt(document.getElementById('of-rating').value) || 0;

    const data = {
      date,
      weather: {
        icon: document.getElementById('of-wicon').value,
        temp: parseInt(document.getElementById('of-wtemp').value),
        desc: document.getElementById('of-wdesc').value
      },
      scenes, seasons,
      itemIds: [...this.selectedItems],
      photo: this._getPhoto(),
      diary: document.getElementById('of-diary').value.trim(),
      rating,
      feedbackTags,
      goal: this._modalGoal || '',
      reasons: this._modalReasons || [],
      updatedAt: Utils.todayStr()
    };

    this._modalGoal = '';
    this._modalReasons = [];

    const old = editId ? this.outfits.find(o => o.id === editId) : null;
    if (editId) {
      await this._updateWearCounts(old.itemIds, data.itemIds, date);
      await DB.put('outfits', { ...old, ...data });
      Utils.toast('穿搭已更新');
    } else {
      await DB.add('outfits', { ...data, createdAt: Utils.todayStr() });
      await this._updateWearCounts([], data.itemIds, date);
      Utils.toast('穿搭已保存');
    }
    Utils.closeModal();
    await wardrobeModule.init();
    await this.init();
  },

  async deleteOutfit(id) {
    if (!confirm('确定删除此穿搭记录？衣物穿着次数将同步更新')) return;
    const of = this.outfits.find(o => o.id === id);
    if (of) await this._updateWearCounts(of.itemIds, [], of.date);
    await DB.remove('outfits', id);
    Utils.toast('已删除');
    Utils.closeModal();
    await wardrobeModule.init();
    await this.init();
  },

  viewOutfit(id) {
    const of = this.outfits.find(o => o.id === id);
    if (!of) return;
    const items = of.itemIds.map(iid => wardrobeModule.items.find(i => i.id === iid)).filter(Boolean);
    const itemsHtml = items.map(it => {
      const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
      return `<div class="oi-item">
        <div class="oi-img">${it.photo ? `<img src="${it.photo}">` : emoji}</div>
        <div class="oi-name">${it.name}</div>
      </div>`;
    }).join('');

    const ratingStars = of.rating ? `<div style="margin-bottom:8px;">
      <span style="font-size:13px;color:var(--text-muted);">满意度：</span>
      ${[1,2,3,4,5].map(i => `<span style="font-size:18px;color:${i <= of.rating ? '#f0c040' : '#ddd'};">★</span>`).join('')}
    </div>` : '';

    const feedbackHtml = (of.feedbackTags && of.feedbackTags.length > 0) ? `<div style="margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px;">
      ${of.feedbackTags.map(fid => {
        const tag = Utils.FEEDBACK_TAGS.find(t => t.id === fid);
        return tag ? `<span style="padding:3px 8px;background:var(--bg-soft);border-radius:10px;font-size:11px;">${tag.icon} ${tag.label}</span>` : '';
      }).join('')}
    </div>` : '';

    const goalHtml = of.goal ? `<div style="margin-bottom:8px;">
      <span style="font-size:12px;color:var(--text-muted);">搭配目标：</span>
      <span style="padding:3px 10px;background:linear-gradient(135deg,#e8a5b0,#c9a8d4);color:#fff;border-radius:10px;font-size:11px;">${of.goal}</span>
    </div>` : '';

    const reasonsHtml = (of.reasons && of.reasons.length > 0) ? `<div style="margin-bottom:8px;background:var(--bg-soft);padding:10px 12px;border-radius:10px;font-size:12px;color:var(--text-secondary);line-height:1.7;">
      ${of.reasons.map(r => '· ' + r).join('<br>')}
    </div>` : '';

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${of.date} 穿搭</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div class="outfit-date" style="font-size:16px;">${of.date}</div>
            <div class="outfit-weather">${of.weather?.icon || '☀️'} ${of.weather?.temp || ''}°C · ${of.weather?.desc || ''}</div>
          </div>
          <div class="outfit-scenes">
            ${(of.seasons || []).map(s => `<span class="outfit-season">${s}</span>`).join('')}
            ${(of.scenes || []).map(s => `<span class="outfit-scene-tag">${s}</span>`).join('')}
          </div>
        </div>
      </div>
      ${ratingStars}
      ${feedbackHtml}
      ${goalHtml}
      ${reasonsHtml}
      <div class="outfit-items" style="margin-bottom:14px;">${itemsHtml}</div>
      ${of.photo ? `<div class="outfit-photo" style="margin:0 0 14px;"><img src="${of.photo}"></div>` : ''}
      ${of.diary ? `<div class="outfit-diary">📖 ${of.diary}</div>` : ''}
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="outfitModule.showOutfitModal(${of.id})">编辑</button>
        <button class="btn-danger btn-block btn-md" onclick="outfitModule.deleteOutfit(${of.id})">删除</button>
      </div>
    `);
  },

  renderList() {
    const list = document.getElementById('outfitList');
    if (this.outfits.length === 0) {
      list.innerHTML = `<div class="empty-state small"><div class="empty-icon">📅</div><p>还没有穿搭记录</p><p class="empty-sub">记录每日穿搭，构建你的时尚档案</p></div>`;
      return;
    }
    list.innerHTML = this.outfits.map(o => {
      const items = o.itemIds.map(iid => wardrobeModule.items.find(i => i.id === iid)).filter(Boolean);
      const itemsHtml = items.slice(0, 6).map(it => {
        const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
        return `<div class="oi-item"><div class="oi-img">${it.photo ? `<img src="${it.photo}">` : emoji}</div><div class="oi-name">${it.name}</div></div>`;
      }).join('');
      const ratingBadge = o.rating ? `<span style="font-size:12px;color:#f0c040;">${'★'.repeat(o.rating)}${'☆'.repeat(5 - o.rating)}</span>` : '';
      return `<div class="outfit-card" onclick="outfitModule.viewOutfit(${o.id})">
        <div class="outfit-header">
          <div>
            <div class="outfit-date">${o.date}</div>
            <div class="outfit-weather">${o.weather?.icon || '☀️'} ${o.weather?.temp || ''}°C · ${o.weather?.desc || ''}</div>
          </div>
          <div class="outfit-scenes">
            ${ratingBadge}
            ${(o.seasons || []).map(s => `<span class="outfit-season">${s}</span>`).join('')}
            ${(o.scenes || []).slice(0, 2).map(s => `<span class="outfit-scene-tag">${s}</span>`).join('')}
          </div>
        </div>
        <div class="outfit-items">${itemsHtml}</div>
        ${o.diary ? `<div class="outfit-diary" style="-webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden;">📖 ${o.diary}</div>` : ''}
      </div>`;
    }).join('');
  },

  renderRanks() {
    const satisfactionArr = this.outfits
      .filter(o => o.rating && o.rating >= 1)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    document.getElementById('rankSatisfactionList').innerHTML = satisfactionArr.length === 0 ?
      `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">暂无数据（保存穿搭时评分即可上榜）</div>` :
      satisfactionArr.map((o, i) => {
        const itemNames = o.itemIds.map(iid => {
          const it = wardrobeModule.items.find(x => x.id === iid);
          return it ? it.name : '';
        }).filter(Boolean).slice(0, 3).join('、');
        return `<div class="rank-item" onclick="outfitModule.viewOutfit(${o.id})" style="cursor:pointer;">
          <div class="rank-num">${i + 1}</div>
          <div class="rank-info" style="flex:1;">
            <div class="rank-name" style="display:flex;align-items:center;gap:6px;">
              <span style="color:#f0c040;font-size:14px;">${'★'.repeat(o.rating)}${'☆'.repeat(5 - o.rating)}</span>
              <span style="font-size:13px;">${o.date}</span>
            </div>
            <div class="rank-meta" style="margin-top:2px;">${itemNames || '无单品信息'}</div>
          </div>
          <div class="rank-value" style="font-size:14px;color:#f0c040;">${o.rating}分</div>
        </div>`;
      }).join('');

    const freqMap = {};
    this.outfits.forEach(o => o.itemIds.forEach(id => { freqMap[id] = (freqMap[id] || 0) + 1; }));
    const freqArr = Object.entries(freqMap)
      .map(([id, c]) => ({ it: wardrobeModule.items.find(i => i.id == id), count: c }))
      .filter(x => x.it)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    document.getElementById('rankFreqList').innerHTML = freqArr.length === 0 ?
      `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">暂无数据</div>` :
      freqArr.map((r, i) => {
        const emoji = Utils.CATEGORY_EMOJI[r.it.subCategory] || '👕';
        return `<div class="rank-item">
          <div class="rank-num">${i + 1}</div>
          <div class="rank-img">${r.it.photo ? `<img src="${r.it.photo}">` : emoji}</div>
          <div class="rank-info">
            <div class="rank-name">${r.it.name}</div>
            <div class="rank-meta">${r.it.subCategory} · ${r.it.color || ''}</div>
          </div>
          <div class="rank-value">${r.count}次</div>
        </div>`;
      }).join('');

    const valArr = wardrobeModule.items
      .filter(i => i.price > 0 && i.wearCount > 0)
      .map(i => ({ it: i, cost: i.price / i.wearCount }))
      .sort((a, b) => a.cost - b.cost)
      .slice(0, 10);

    document.getElementById('rankValueList').innerHTML = valArr.length === 0 ?
      `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">暂无数据（需要已穿过且有价格的衣物）</div>` :
      valArr.map((r, i) => {
        const emoji = Utils.CATEGORY_EMOJI[r.it.subCategory] || '👕';
        return `<div class="rank-item">
          <div class="rank-num">${i + 1}</div>
          <div class="rank-img">${r.it.photo ? `<img src="${r.it.photo}">` : emoji}</div>
          <div class="rank-info">
            <div class="rank-name">${r.it.name}</div>
            <div class="rank-meta">原价¥${r.it.price} · 穿${r.it.wearCount}次</div>
          </div>
          <div class="rank-value">¥${r.cost.toFixed(1)}</div>
        </div>`;
      }).join('');
  },

  getHighRatedOutfits() {
    return this.outfits.filter(o => (o.rating || 0) >= 4);
  }
};
