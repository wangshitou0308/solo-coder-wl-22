const wardrobeModule = {
  items: [],
  filterCat: 'all',
  filterScene: 'all',

  async init() {
    this.items = await DB.getAll('clothes');
    this.render();
  },

  filterCategory(btn, cat) {
    document.querySelectorAll('#wardrobeCategoryFilter .filter-tag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.filterCat = cat;
    this.renderGrid();
  },
  filterScene(btn, scene) {
    document.querySelectorAll('#wardrobeSceneFilter .scene-tag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.filterScene = scene;
    this.renderGrid();
  },

  getMonthWornCount(item) {
    const now = new Date();
    const ym = now.getFullYear() * 12 + now.getMonth();
    const dates = item.wornDates || [];
    return dates.filter(d => {
      const dt = new Date(d);
      return dt.getFullYear() * 12 + dt.getMonth() === ym;
    }).length;
  },

  isIdle(item) {
    if (item.wearCount === 0) {
      const days = Utils.daysDiff(Utils.todayStr(), item.createdAt || Utils.todayStr());
      return days > 60;
    }
    const last = item.lastWorn || item.createdAt || Utils.todayStr();
    return Utils.daysDiff(Utils.todayStr(), last) > 90;
  },

  showItemModal(editId = null) {
    const item = editId ? this.items.find(i => i.id === editId) : null;
    const selColor = item?.color || '白色';
    const selScene = item?.scenes || [];
    const selSeason = item?.seasons || [];

    const buildSub = (group) => {
      return Utils.CATEGORY_MAP[group].map(s =>
        `<option value="${s}" ${item?.subCategory === s ? 'selected' : ''}>${s}</option>`
      ).join('');
    };
    const group = item ? Utils.getCategoryGroup(item.subCategory) : '上衣';

    const swatches = Utils.COLORS.map(c =>
      `<div class="color-swatch ${c.name === selColor ? 'active' : ''}"
        style="background:${c.hex};${c.hex === '#FFFFFF' ? 'border:1px solid #eee' : ''}"
        data-color="${c.name}" onclick="wardrobeModule._pickColor(this,'${c.name}')" title="${c.name}"></div>`
    ).join('');

    const scenes = Utils.SCENES.map(s =>
      `<button class="tag-check scene ${selScene.includes(s) ? 'active' : ''}"
        onclick="this.classList.toggle('active');wardrobeModule._toggleTag(this,'scene_${s}')">${s}</button>`
    ).join('');

    const seasons = Utils.SEASONS.map(s =>
      `<button class="tag-check season ${selSeason.includes(s) ? 'active' : ''}"
        onclick="this.classList.toggle('active');wardrobeModule._toggleTag(this,'season_${s}')">${s}</button>`
    ).join('');

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${item ? '编辑衣物' : '添加衣物'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">衣物照片</label>
        <label class="photo-upload" id="cl-photo-box">
          ${item?.photo ? `<img src="${item.photo}" id="cl-photo-img">` :
            `<div><div class="photo-upload-icon">📷</div><div>点击上传图片</div></div>`}
          <input type="file" accept="image/*" capture="environment" style="display:none" id="cl-photo" onchange="wardrobeModule._onPhoto(event)">
        </label>
      </div>

      <div class="form-group">
        <label class="form-label">名称 *</label>
        <input type="text" class="form-input" id="cl-name" placeholder="如：白色基础款T恤" value="${item?.name || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">大类别</label>
          <select class="form-select" id="cl-group" onchange="wardrobeModule._onGroupChange(this.value)">
            ${Utils.CAT_ORDER.map(g => `<option value="${g}" ${g === group ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">具体品类</label>
          <select class="form-select" id="cl-sub">
            ${buildSub(group)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">尺码</label>
          <select class="form-select" id="cl-size">
            ${['XS', 'S', 'M', 'L', 'XL', 'XXL', '均码', '220', '225', '230', '235', '240', '245', '250', '255', '260'].map(s =>
              `<option ${item?.size === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">品牌</label>
          <input type="text" class="form-input" id="cl-brand" placeholder="如：ZARA" value="${item?.brand || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">价格 (¥)</label>
          <input type="number" class="form-input" id="cl-price" placeholder="0" value="${item?.price ?? ''}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">颜色</label>
        <input type="hidden" id="cl-color" value="${selColor}">
        <div class="color-swatch-row" id="cl-swatches">${swatches}</div>
      </div>

      <div class="form-group">
        <label class="form-label">适用场合</label>
        <div class="tag-check-group" id="cl-scenes">${scenes}</div>
      </div>

      <div class="form-group">
        <label class="form-label">适用季节</label>
        <div class="tag-check-group" id="cl-seasons">${seasons}</div>
      </div>

      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea class="form-textarea" id="cl-note" placeholder="材质、洗涤说明、购买链接等...">${item?.note || ''}</textarea>
      </div>

      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">取消</button>
        <button class="btn-primary btn-block btn-md" onclick="wardrobeModule.saveItem(${editId || 'null'})">保存</button>
      </div>
    `);
  },

  _pickColor(el, name) {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('cl-color').value = name;
  },

  _toggleTag() {},

  _onGroupChange(v) {
    const subs = Utils.CATEGORY_MAP[v];
    document.getElementById('cl-sub').innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  async _onPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await Utils.readFile(file, 500);
      const box = document.getElementById('cl-photo-box');
      const old = box.querySelector('img');
      if (old) old.remove();
      const img = document.createElement('img');
      img.src = dataUrl;
      img.id = 'cl-photo-img';
      const t = box.querySelector('div');
      if (t) t.remove();
      box.insertBefore(img, box.firstChild);
    } catch (err) {
      Utils.toast('图片处理失败');
    }
  },

  _getPhoto() {
    const img = document.getElementById('cl-photo-img');
    return img ? img.src : '';
  },

  async saveItem(editId) {
    const name = document.getElementById('cl-name').value.trim();
    if (!name) return Utils.toast('请输入衣物名称');
    const sub = document.getElementById('cl-sub').value;
    const scenes = Array.from(document.querySelectorAll('#cl-scenes .tag-check'))
      .filter(el => el.classList.contains('active'))
      .map(el => el.textContent.trim());
    const seasons = Array.from(document.querySelectorAll('#cl-seasons .tag-check'))
      .filter(el => el.classList.contains('active'))
      .map(el => el.textContent.trim());
    const data = {
      name,
      subCategory: sub,
      category: Utils.getCategoryGroup(sub),
      size: document.getElementById('cl-size').value,
      brand: document.getElementById('cl-brand').value.trim(),
      price: parseFloat(document.getElementById('cl-price').value) || 0,
      color: document.getElementById('cl-color').value,
      scenes, seasons,
      note: document.getElementById('cl-note').value.trim(),
      photo: this._getPhoto()
    };
    const old = editId ? this.items.find(i => i.id === editId) : null;
    if (editId) {
      await DB.put('clothes', {
        ...old, ...data,
        updatedAt: Utils.todayStr()
      });
      Utils.toast('已更新');
    } else {
      await DB.add('clothes', {
        ...data,
        wearCount: 0,
        wornDates: [],
        lastWorn: null,
        createdAt: Utils.todayStr(),
        updatedAt: Utils.todayStr()
      });
      Utils.toast('已添加到衣橱');
    }
    Utils.closeModal();
    await this.init();
    if (typeof shoppingModule !== 'undefined') shoppingModule.refresh();
  },

  async deleteItem(id) {
    if (!confirm('确定从衣橱中移除此衣物？')) return;
    await DB.remove('clothes', id);
    Utils.toast('已移除');
    await this.init();
    if (typeof shoppingModule !== 'undefined') shoppingModule.refresh();
  },

  viewItem(id) {
    const it = this.items.find(i => i.id === id);
    if (!it) return;
    const idle = this.isIdle(it);
    const monthWorn = this.getMonthWornCount(it);
    const cpCost = it.wearCount > 0 ? (it.price / it.wearCount).toFixed(1) : '-';
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">衣物详情</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      ${it.photo ? `<div style="border-radius:14px;overflow:hidden;margin-bottom:16px;"><img src="${it.photo}" style="width:100%;display:block;"></div>` : ''}
      <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
        <div>
          <h3 style="font-size:18px; margin-bottom:6px;">${it.name}</h3>
          <div style="color:var(--text-secondary); font-size:12px;">
            ${it.brand ? it.brand + ' · ' : ''}${it.subCategory} · ${it.size} · ${it.color}
          </div>
        </div>
        ${it.price ? `<div style="font-size:18px; font-weight:700; color:var(--primary);">¥${it.price}</div>` : ''}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px;">
        <div style="background:var(--bg-soft); padding:10px; border-radius:10px; text-align:center;">
          <div style="font-size:18px; font-weight:700; color:var(--primary);">${it.wearCount}</div>
          <div style="font-size:10px; color:var(--text-muted);">穿着次数</div>
        </div>
        <div style="background:var(--bg-soft); padding:10px; border-radius:10px; text-align:center;">
          <div style="font-size:18px; font-weight:700; color:#6a997a;">${monthWorn}</div>
          <div style="font-size:10px; color:var(--text-muted);">本月穿着</div>
        </div>
        <div style="background:var(--bg-soft); padding:10px; border-radius:10px; text-align:center;">
          <div style="font-size:16px; font-weight:700; color:#c9a8d4;">¥${cpCost}</div>
          <div style="font-size:10px; color:var(--text-muted);">单次成本</div>
        </div>
      </div>
      ${idle ? `<div style="background:#fff0f0; color:#c96565; padding:10px 12px; border-radius:10px; font-size:12px; margin-bottom:14px;">⚠️ 已闲置超过 ${it.wearCount === 0 ? '60' : '90'} 天未穿，可考虑断舍离</div>` : ''}
      ${it.scenes?.length ? `<div style="margin-bottom:10px;"><span style="font-size:12px; color:var(--text-muted);">场合：</span>${it.scenes.map(s => `<span class="ctag scene">${s}</span>`).join('')}</div>` : ''}
      ${it.seasons?.length ? `<div style="margin-bottom:10px;"><span style="font-size:12px; color:var(--text-muted);">季节：</span>${it.seasons.map(s => `<span style="padding:2px 8px; background:#e0f0e8; color:#6a997a; border-radius:10px; font-size:11px;">${s}</span>`).join('')}</div>` : ''}
      ${it.note ? `<div style="background:var(--bg-soft); padding:12px; border-radius:10px; font-size:12px; color:var(--text-secondary); line-height:1.7;">📝 ${it.note}</div>` : ''}
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="wardrobeModule.showItemModal(${it.id})">编辑</button>
        <button class="btn-danger btn-block btn-md" onclick="wardrobeModule.deleteItem(${it.id})">删除</button>
      </div>
    `);
  },

  render() {
    const total = this.items.length;
    const value = this.items.reduce((s, i) => s + (i.price || 0), 0);
    const now = new Date();
    const ym = now.getFullYear() * 12 + now.getMonth();
    const wornThisMonth = this.items.filter(i => (i.wornDates || []).some(d => {
      const dt = new Date(d);
      return dt.getFullYear() * 12 + dt.getMonth() === ym;
    })).length;
    document.getElementById('wsTotal').textContent = total;
    document.getElementById('wsValue').textContent = '¥' + value.toLocaleString();
    document.getElementById('wsWorn').textContent = wornThisMonth;

    const idleItems = this.items.filter(i => this.isIdle(i));
    const warn = document.getElementById('wardrobeWarning');
    if (idleItems.length > 0) {
      warn.style.display = 'block';
      warn.innerHTML = `💡 发现 <strong>${idleItems.length}</strong> 件衣物已闲置超过 ${idleItems[0].wearCount === 0 ? '60' : '90'} 天，不妨审视是否需要断舍离~`;
    } else {
      warn.style.display = 'none';
    }

    this.renderGrid();
  },

  renderGrid() {
    const grid = document.getElementById('wardrobeGrid');
    let items = this.items;
    if (this.filterCat !== 'all') items = items.filter(i => i.category === this.filterCat);
    if (this.filterScene !== 'all') items = items.filter(i => i.scenes?.includes(this.filterScene));
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state small"><div class="empty-icon">👗</div><p>还没有符合条件的衣物</p><p class="empty-sub">点击右上角添加你的第一件单品</p></div>`;
      return;
    }
    grid.innerHTML = items.map(it => {
      const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
      const idle = this.isIdle(it);
      const badge = idle
        ? `<div class="clothing-worn-badge idle">闲置${Utils.daysDiff(Utils.todayStr(), it.lastWorn || it.createdAt)}天</div>`
        : (it.wearCount > 0 ? `<div class="clothing-worn-badge">穿${it.wearCount}次</div>` : '');
      const tags = [
        it.color ? `<span class="ctag">${it.color}</span>` : '',
        ...(it.scenes || []).slice(0, 2).map(s => `<span class="ctag scene">${s}</span>`)
      ].join('');
      return `<div class="clothing-card" onclick="wardrobeModule.viewItem(${it.id})">
        ${badge}
        <div class="clothing-img">
          ${it.photo ? `<img src="${it.photo}">` : emoji}
        </div>
        <div class="clothing-info">
          <div class="clothing-name">${it.name}</div>
          <div class="clothing-meta">
            <span>${it.subCategory}${it.size ? '·' + it.size : ''}</span>
            ${it.price ? `<span>¥${it.price}</span>` : ''}
          </div>
          ${tags ? `<div class="clothing-tags">${tags}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }
};
