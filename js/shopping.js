const shoppingModule = {
  wishlist: [],
  BASIC_ITEMS: [
    { name: '白色T恤', category: '上衣', icon: '👕', priority: 'high', reason: '百搭之王，几乎可搭配任何下装' },
    { name: '黑色西装裤', category: '下装', icon: '👖', priority: 'high', reason: '通勤场合必备，显瘦显腿长' },
    { name: '白色衬衫', category: '上衣', icon: '👔', priority: 'high', reason: '可正式可休闲，一衣多穿' },
    { name: '直筒牛仔裤', category: '下装', icon: '👖', priority: 'high', reason: '万年百搭款，任何上装都能搭' },
    { name: '小白鞋', category: '鞋靴', icon: '👟', priority: 'high', reason: '舒适减龄，适配休闲风' },
    { name: '黑色高跟鞋', category: '鞋靴', icon: '👠', priority: 'mid', reason: '提升气场，正式场合必备' },
    { name: '米色风衣', category: '外套', icon: '🧥', priority: 'mid', reason: '春秋季刚需，气质担当' },
    { name: '灰色毛衣', category: '上衣', icon: '🧶', priority: 'mid', reason: '冬季万能内搭，温柔百搭' },
    { name: '黑色大衣', category: '外套', icon: '🧥', priority: 'high', reason: '冬季通勤约会都能打' },
    { name: '基础款包', category: '配饰', icon: '👜', priority: 'mid', reason: '通勤装电脑，颜色百搭' },
    { name: '黑色半裙', category: '下装', icon: '👗', priority: 'mid', reason: '约会通勤两相宜' },
    { name: '小黑裙', category: '连衣裙', icon: '👗', priority: 'mid', reason: '经典不出错，任何场合都HOLD住' },
    { name: '条纹T恤', category: '上衣', icon: '👕', priority: 'low', reason: '海魂风，增加休闲感层次' },
    { name: '卡其裤', category: '下装', icon: '👖', priority: 'low', reason: '大地色系，更显质感' },
    { name: '牛仔外套', category: '外套', icon: '🧥', priority: 'low', reason: '减龄神器，春秋叠穿必备' },
    { name: '羊毛围巾', category: '配饰', icon: '🧣', priority: 'low', reason: '秋冬搭配亮点，提升温暖感' }
  ],
  ESSENTIAL_COLORS: ['白色', '黑色', '灰色', '卡其', '蓝色', '牛仔蓝'],

  async init() {
    this.wishlist = (await DB.getAll('wishlist')).sort((a, b) => {
      const po = { high: 0, mid: 1, low: 2 };
      return (po[a.priority] ?? 1) - (po[b.priority] ?? 1);
    });
    this.refresh();
  },

  refresh() {
    this.renderAnalysis();
    this.renderSuggestions();
    this.renderWishlist();
  },

  _countBy(items, key) {
    const map = {};
    items.forEach(i => {
      const v = i[key];
      if (Array.isArray(v)) v.forEach(x => map[x] = (map[x] || 0) + 1);
      else map[v] = (map[v] || 0) + 1;
    });
    return map;
  },

  renderAnalysis() {
    const items = wardrobeModule.items;
    const panel = document.getElementById('analysisPanel');
    if (items.length === 0) {
      panel.innerHTML = `<div class="empty-state small"><div class="empty-icon">🔍</div><p>添加衣物后自动生成品类分析</p></div>`;
      return;
    }
    const catCount = this._countBy(items, 'category');
    const colorCount = this._countBy(items, 'color');
    const sceneCount = this._countBy(items, 'scenes');
    const total = items.length;
    const maxCat = Math.max(...Object.values(catCount), 1);

    const catBars = Utils.CAT_ORDER.map(cat => {
      const n = catCount[cat] || 0;
      const w = (n / maxCat) * 100;
      return `<div class="analysis-chart-row">
        <div class="ac-label">${cat}</div>
        <div class="ac-bar-wrap"><div class="ac-bar" style="width:${w}%;"></div></div>
        <div class="ac-num">${n}件</div>
      </div>`;
    }).join('');

    const topColors = Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([c, n]) => {
        const co = Utils.COLORS.find(x => x.name === c)?.hex || '#ccc';
        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--bg-soft);border-radius:14px;font-size:11px;margin:3px 4px 3px 0;">
          <span style="width:12px;height:12px;border-radius:50%;background:${co};${c === '白色' ? 'border:1px solid #eee' : ''};display:inline-block;"></span>
          ${c} ${n}件
        </span>`;
      }).join('');

    const sceneBars = Object.entries(sceneCount).sort((a, b) => b[1] - a[1]).map(([s, n]) => {
      const w = (n / Math.max(...Object.values(sceneCount))) * 100;
      return `<div class="analysis-chart-row">
        <div class="ac-label">${s}</div>
        <div class="ac-bar-wrap"><div class="ac-bar" style="width:${w}%;background:linear-gradient(90deg,var(--secondary),var(--primary));"></div></div>
        <div class="ac-num">${n}</div>
      </div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">暂无场合标签</div>';

    const totalValue = items.reduce((s, i) => s + (i.price || 0), 0);
    const avgWear = total > 0 ? (items.reduce((s, i) => s + (i.wearCount || 0), 0) / total).toFixed(1) : 0;

    panel.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div style="background:linear-gradient(135deg,#fef6e4,#fde8d4);padding:12px;border-radius:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#c98a45;">${total}</div>
          <div style="font-size:10px;color:#a87840;">衣橱单品数</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0eaf5,#e8d6ef);padding:12px;border-radius:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#8a6a99;">¥${totalValue.toLocaleString()}</div>
          <div style="font-size:10px;color:#785a88;">总投入价值</div>
        </div>
        <div style="background:linear-gradient(135deg,#e8f4e8,#d0e8d8);padding:12px;border-radius:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#6a997a;">${avgWear}</div>
          <div style="font-size:10px;color:#5a886a;">平均穿着次数</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">📦 品类结构</div>
      ${catBars}
      <div style="font-size:13px;font-weight:600;margin:16px 0 8px;color:var(--text-primary);">🎨 颜色分布 TOP6</div>
      <div>${topColors || '<span style="color:var(--text-muted);font-size:12px;">暂无颜色数据</span>'}</div>
      <div style="font-size:13px;font-weight:600;margin:16px 0 8px;color:var(--text-primary);">🏢 场合覆盖</div>
      ${sceneBars}
      <div class="analysis-summary">
        ${this._summary()}
      </div>
    `;
  },

  _summary() {
    const items = wardrobeModule.items;
    const catCount = this._countBy(items, 'category');
    const colorCount = this._countBy(items, 'color');
    const sceneCount = this._countBy(items, 'scenes');
    const tips = [];
    const missingCats = Utils.CAT_ORDER.filter(c => !catCount[c] || catCount[c] <= 1);
    if (missingCats.length > 0) tips.push(`品类不均衡：缺少${missingCats.join('、')}，建议逐步补齐。`);
    const topColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0];
    if (topColor && topColor[1] / items.length > 0.5) tips.push(`颜色过于集中：${topColor[0]}占比过高，可尝试更多色彩丰富搭配。`);
    const missScenes = Utils.SCENES.filter(s => !sceneCount[s]);
    if (missScenes.length > 0) tips.push(`场合有短板：${missScenes.join('、')}暂无适配，遇到相应场合可能尴尬。`);
    if (items.length >= 10) {
      const idle = items.filter(i => wardrobeModule.isIdle(i)).length;
      if (idle > 0) tips.push(`衣橱断舍离提醒：有${idle}件单品闲置过久，可考虑清理或闲鱼。`);
    }
    if (tips.length === 0) tips.push('✨ 你的衣橱结构非常健康，保持搭配灵感不断！');
    return tips.map(t => '· ' + t).join('<br>');
  },

  renderSuggestions() {
    const items = wardrobeModule.items;
    const el = document.getElementById('suggestList');
    if (items.length === 0) {
      el.innerHTML = `<div class="empty-state small" style="padding:20px;"><div class="empty-icon" style="font-size:36px;">💡</div><p>添加衣物后自动识别缺口</p></div>`;
      return;
    }
    const catCount = this._countBy(items, 'category');
    const subCount = this._countBy(items, 'subCategory');
    const colorCount = this._countBy(items, 'color');
    const sceneCount = this._countBy(items, 'scenes');
    const ownedNames = items.map(i => i.name.replace(/\s+/g, ''));

    const suggestions = [];
    this.BASIC_ITEMS.forEach(bi => {
      const hasMatch = items.some(i => {
        if (i.subCategory === bi.name) return true;
        if (Utils.getCategoryGroup(bi.category) !== i.category) return false;
        const ni = i.name.replace(/\s+/g, '');
        const bn = bi.name.replace(/\s+/g, '');
        return ni.includes(bn.slice(0, 2)) || bn.includes(ni.slice(0, 2));
      });
      if (hasMatch) return;
      const catLack = (catCount[bi.category] || 0) < 2;
      suggestions.push({ ...bi, score: (catLack ? 5 : 0) + (bi.priority === 'high' ? 5 : bi.priority === 'mid' ? 2 : 1) });
    });
    this.ESSENTIAL_COLORS.forEach(c => {
      if (!colorCount[c] || colorCount[c] < 2) {
        suggestions.push({
          name: `${c}系基础款`, category: '上衣', icon: '🎨', priority: colorCount[c] ? 'low' : 'mid',
          reason: `${c}单品${colorCount[c] ? '不足' : '缺失'}，补齐${colorCount[c] ? '可增加' : '完善'}搭配多样性`,
          score: colorCount[c] ? 2 : 4
        });
      }
    });
    Utils.SCENES.forEach(s => {
      if (!sceneCount || !sceneCount[s] || sceneCount[s] < 2) {
        suggestions.push({
          name: `${s}场合1-2套`, category: '综合', icon: '🎯',
          priority: (sceneCount?.[s] ? 'low' : 'mid'),
          reason: `缺少${s}专用搭配，遇到${s}场合时可能捉襟见肘`,
          score: sceneCount?.[s] ? 1 : 3
        });
      }
    });

    suggestions.sort((a, b) => b.score - a.score);
    const finalList = suggestions.slice(0, 10);

    if (finalList.length === 0) {
      el.innerHTML = `<div style="padding:14px;background:var(--bg-soft);border-radius:10px;text-align:center;font-size:13px;color:var(--text-secondary);">🎉 你的衣橱已很完善，暂无明显短板</div>`;
      return;
    }
    const pclass = { high: 'sp-high', mid: 'sp-mid', low: 'sp-low' };
    const ptext = { high: '高优先', mid: '中优先', low: '低优先' };
    el.innerHTML = finalList.map((s, i) => `
      <div class="suggest-item">
        <div class="si-icon">${s.icon}</div>
        <div class="si-info">
          <div class="si-name">${s.name}</div>
          <div class="si-reason">💡 ${s.reason}</div>
        </div>
        <span class="si-priority ${pclass[s.priority]}">${ptext[s.priority]}</span>
        <div class="si-actions">
          <button class="si-btn si-add" onclick="shoppingModule._fromSuggest(${i})">加入</button>
        </div>
      </div>
    `).join('');
    this._suggestCache = finalList;
  },

  async _fromSuggest(idx) {
    const s = this._suggestCache[idx];
    if (!s) return;
    await DB.add('wishlist', {
      name: s.name,
      category: s.category,
      priority: s.priority,
      budget: 0,
      note: s.reason,
      source: '建议',
      createdAt: Utils.todayStr()
    });
    Utils.toast(`已加入意向清单：${s.name}`);
    await this.init();
  },

  showItemModal(editId = null) {
    const item = editId ? this.wishlist.find(w => w.id === editId) : null;
    const priorities = [
      { v: 'high', t: '🔥 高优先' },
      { v: 'mid', t: '⭐ 中优先' },
      { v: 'low', t: '📌 低优先' }
    ];
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${item ? '编辑意向' : '添加采购意向'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div class="form-group">
        <label class="form-label">单品名称 *</label>
        <input type="text" class="form-input" id="sh-name" placeholder="如：米色风衣" value="${item?.name || ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">类别</label>
          <select class="form-select" id="sh-category">
            ${Utils.CAT_ORDER.map(c => `<option ${item?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            <option value="综合" ${item?.category === '综合' ? 'selected' : ''}>综合</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">优先级</label>
          <select class="form-select" id="sh-priority">
            ${priorities.map(p => `<option value="${p.v}" ${item?.priority === p.v ? 'selected' : ''}>${p.t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">预算 (¥)</label>
          <input type="number" class="form-input" id="sh-budget" placeholder="0" value="${item?.budget ?? ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">备注（购买链接/品牌/尺码参考）</label>
        <textarea class="form-textarea" id="sh-note" placeholder="如：某猫旗舰店 ¥599，尺码M">${item?.note || ''}</textarea>
      </div>
      ${item?.source === '建议' ? '' : ''}
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">取消</button>
        <button class="btn-primary btn-block btn-md" onclick="shoppingModule.saveItem(${editId || 'null'})">保存</button>
      </div>
    `);
  },

  async saveItem(editId) {
    const name = document.getElementById('sh-name').value.trim();
    if (!name) return Utils.toast('请输入名称');
    const data = {
      name,
      category: document.getElementById('sh-category').value,
      priority: document.getElementById('sh-priority').value,
      budget: parseFloat(document.getElementById('sh-budget').value) || 0,
      note: document.getElementById('sh-note').value.trim(),
      source: editId ? (this.wishlist.find(w => w.id === editId)?.source || '手动') : '手动',
      updatedAt: Utils.todayStr()
    };
    const old = editId ? this.wishlist.find(w => w.id === editId) : null;
    if (editId) {
      await DB.put('wishlist', { ...old, ...data });
      Utils.toast('已更新');
    } else {
      await DB.add('wishlist', { ...data, createdAt: Utils.todayStr() });
      Utils.toast('已加入意向清单');
    }
    Utils.closeModal();
    await this.init();
  },

  async deleteItem(id) {
    if (!confirm('确定删除？')) return;
    await DB.remove('wishlist', id);
    Utils.toast('已删除');
    await this.init();
  },

  async buyItem(id) {
    const w = this.wishlist.find(x => x.id === id);
    if (!w) return;
    wardrobeModule.showItemModal();
    setTimeout(() => {
      document.getElementById('cl-name').value = w.name;
      document.getElementById('cl-price').value = w.budget || '';
      try {
        const cat = Utils.CAT_ORDER.includes(w.category) ? w.category : '上衣';
        document.getElementById('cl-group').value = cat;
        wardrobeModule._onGroupChange(cat);
      } catch (e) {}
      document.getElementById('cl-note').value = w.note ? `[购自意向清单]\n${w.note}` : '[购自意向清单]';
    }, 100);
  },

  renderWishlist() {
    const total = this.wishlist.reduce((s, w) => s + (w.budget || 0), 0);
    document.getElementById('budgetTotal').textContent = '¥' + total.toLocaleString();
    const el = document.getElementById('wishlist');
    if (this.wishlist.length === 0) {
      el.innerHTML = `<div class="empty-state small" style="padding:20px;"><div class="empty-icon" style="font-size:36px;">📋</div><p>清单是空的，先从建议里选几件？</p></div>`;
      return;
    }
    const pclass = { high: 'sp-high', mid: 'sp-mid', low: 'sp-low' };
    const ptext = { high: '高', mid: '中', low: '低' };
    el.innerHTML = this.wishlist.map(w => `
      <div class="wish-item">
        <div class="si-icon" style="width:38px;height:38px;font-size:18px;">
          ${Utils.CATEGORY_EMOJI[w.category] || Utils.CATEGORY_EMOJI['T恤'] || '🛍️'}
        </div>
        <div class="si-info">
          <div class="si-name">
            ${w.name}
            ${w.source === '建议' ? '<span style="font-size:9px;padding:1px 6px;background:#e0f0e8;color:#6a997a;border-radius:8px;margin-left:4px;">建议</span>' : ''}
          </div>
          <div class="si-reason">${w.category}${w.note ? ' · ' + w.note.slice(0, 24) : ''}</div>
        </div>
        <span class="si-priority ${pclass[w.priority]}">${ptext[w.priority]}</span>
        <div class="si-budget">${w.budget ? '¥' + w.budget : '--'}</div>
        <div class="si-actions" style="flex-direction:column;gap:4px;">
          <button class="si-btn si-bought" title="已购入，添加到衣橱" onclick="shoppingModule.buyItem(${w.id})">购入</button>
          <button class="si-btn si-del" onclick="shoppingModule.deleteItem(${w.id})">删除</button>
        </div>
      </div>
    `).join('');
  }
};
