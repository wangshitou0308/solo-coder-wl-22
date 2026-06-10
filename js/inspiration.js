const inspirationModule = {
  items: [],
  currentStyleFilter: 'all',
  linkCandidates: {},

  async init() {
    this.items = (await DB.getAll('inspirations')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    this.render();
  },

  filterStyle(btn, s) {
    document.querySelectorAll('.inspo-tag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.currentStyleFilter = s;
    this.render();
  },

  _checkLinked(note) {
    if (!note) return false;
    if (note.includes('✓') || note.includes('衣橱有') || note.includes('类似款有')) return true;
    return false;
  },

  showAddModal(editId = null) {
    const item = editId ? this.items.find(i => i.id === editId) : null;
    const selStyle = item?.style || '极简';
    const styles = Utils.STYLES.map(s =>
      `<button class="tag-check ${s === selStyle ? 'active' : ''}" onclick="this.parentElement.querySelectorAll('.tag-check').forEach(t=>t.classList.remove('active'));this.classList.add('active');document.getElementById('in-style').value='${s}'">${s}</button>`
    ).join('');

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${item ? '编辑灵感' : '收藏穿搭灵感'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">穿搭图片</label>
        <label class="photo-upload" id="in-photo-box" style="aspect-ratio:3/4;">
          ${item?.image ? `<img src="${item.image}" id="in-photo-img">` :
            `<div><div class="photo-upload-icon">🖼️</div><div>点击上传或粘贴图片</div></div>`}
          <input type="file" accept="image/*" style="display:none" id="in-photo" onchange="inspirationModule._onPhoto(event)">
        </label>
      </div>

      <div class="form-group">
        <label class="form-label">或粘贴图片 URL</label>
        <input type="text" class="form-input" id="in-url" placeholder="https://..." oninput="inspirationModule._onUrl(this.value)" value="${item?.url || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">风格分类</label>
        <input type="hidden" id="in-style" value="${selStyle}">
        <div class="tag-check-group">${styles}</div>
      </div>

      <div class="form-group">
        <label class="form-label">灵感笔记（单品解析/搭配要点）</label>
        <textarea class="form-textarea" id="in-note" placeholder="如：白色oversize衬衫+高腰牛仔裤+小白鞋，强调腰线，上宽下紧">${item?.note || ''}</textarea>
      </div>

      <div class="checkbox-row">
        <input type="checkbox" id="in-linked" ${item?.linked ? 'checked' : ''}>
        <label for="in-linked">衣橱中已有类似款可替代</label>
      </div>

      <div class="form-group" style="margin-top:12px;">
        <label class="form-label">关联我的衣橱单品（可选）</label>
        ${wardrobeModule.items.length === 0 ?
          '<div style="font-size:12px;color:var(--text-muted);">衣橱暂无单品</div>' :
          `<div class="wardrobe-picker-grid" id="in-link-picker">
            ${wardrobeModule.items.slice(0, 24).map(it => {
              const emoji = Utils.CATEGORY_EMOJI[it.subCategory] || '👕';
              const sel = item?.linkedItems?.includes(it.id) ? 'selected' : '';
              return `<div class="wp-item ${sel}" onclick="this.classList.toggle('selected');inspirationModule._toggleLink(${it.id})">
                ${it.photo ? `<img src="${it.photo}">` : `<div style="margin-top:5px;">${emoji}</div>`}
                <span>${it.name}</span>
              </div>`;
            }).join('')}
          </div>
          <div class="form-hint">点击标记衣橱中有类似单品</div>`
        }
      </div>

      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">取消</button>
        <button class="btn-primary btn-block btn-md" onclick="inspirationModule.saveItem(${editId || 'null'})">保存灵感</button>
      </div>
    `);
    this.linkCandidates = editId ? new Set(item.linkedItems || []) : new Set();
  },

  _toggleLink(id) {
    if (this.linkCandidates.has(id)) this.linkCandidates.delete(id);
    else this.linkCandidates.add(id);
  },

  async _onPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await Utils.readFile(file, 600);
      const box = document.getElementById('in-photo-box');
      const old = box.querySelector('img');
      if (old) old.remove();
      const img = document.createElement('img');
      img.src = dataUrl;
      img.id = 'in-photo-img';
      const t = box.querySelector('div');
      if (t) t.remove();
      box.insertBefore(img, box.firstChild);
      const url = document.getElementById('in-url');
      if (url) url.value = '';
    } catch (err) { Utils.toast('图片处理失败'); }
  },

  _onUrl(v) {
    if (!v) return;
    const box = document.getElementById('in-photo-box');
    const old = box.querySelector('img');
    if (old) old.remove();
    const img = document.createElement('img');
    img.src = v;
    img.id = 'in-photo-img';
    img.onerror = () => { if (img.parentNode) img.remove(); };
    const t = box.querySelector('div');
    if (t) t.remove();
    box.insertBefore(img, box.firstChild);
  },

  _getImage() {
    const img = document.getElementById('in-photo-img');
    if (img) return img.src;
    return '';
  },

  async saveItem(editId) {
    const image = this._getImage();
    const url = document.getElementById('in-url').value.trim();
    if (!image && !url) return Utils.toast('请上传或粘贴图片');
    const style = document.getElementById('in-style').value;
    const linkedItems = Array.from(this.linkCandidates || []);
    const linked = document.getElementById('in-linked').checked || linkedItems.length > 0;

    const data = {
      image: image || url,
      url: url || '',
      style,
      note: document.getElementById('in-note').value.trim(),
      linked,
      linkedItems,
      updatedAt: Utils.todayStr()
    };
    const old = editId ? this.items.find(i => i.id === editId) : null;
    if (editId) {
      await DB.put('inspirations', { ...old, ...data });
      Utils.toast('灵感已更新');
    } else {
      await DB.add('inspirations', { ...data, createdAt: Utils.todayStr() });
      Utils.toast('灵感已收藏');
    }
    Utils.closeModal();
    await this.init();
  },

  async deleteItem(id, ev) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    if (!confirm('确定删除此灵感？')) return;
    await DB.remove('inspirations', id);
    Utils.toast('已删除');
    await this.init();
  },

  viewItem(id) {
    const it = this.items.find(i => i.id === id);
    if (!it) return;
    const linkedClothes = (it.linkedItems || []).map(iid => wardrobeModule.items.find(i => i.id === iid)).filter(Boolean);
    const linkedHtml = linkedClothes.length > 0 ? `
      <div style="margin-top:14px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">🧥 衣橱中类似款（${linkedClothes.length}件）</div>
        <div class="outfit-items">
          ${linkedClothes.map(c => {
            const emoji = Utils.CATEGORY_EMOJI[c.subCategory] || '👕';
            return `<div class="oi-item" onclick="Utils.closeModal();wardrobeModule.viewItem(${c.id})" style="cursor:pointer;">
              <div class="oi-img">${c.photo ? `<img src="${c.photo}">` : emoji}</div>
              <div class="oi-name">${c.name}</div>
            </div>`;
          }).join('')}
        </div>
      </div>` : '';

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">灵感详情</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div style="border-radius:14px;overflow:hidden;margin-bottom:14px; background:var(--bg-soft);">
        <img src="${it.image}" style="width:100%;display:block;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'padding:40px;text-align:center;color:var(--text-muted);\\'>图片加载失败</div>'">
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div>
          <span style="padding:4px 12px; background:linear-gradient(135deg,#d4a5d4,#c9a8d4); color:white; border-radius:14px; font-size:12px; font-weight:500;">${it.style}</span>
          ${it.linked ? '<span style="margin-left:6px;padding:4px 10px;background:rgba(168,213,186,0.95);color:white;border-radius:10px;font-size:11px;font-weight:600;">✓ 衣橱有替代</span>' : ''}
        </div>
        <div style="font-size:11px; color:var(--text-muted);">${it.createdAt || ''}</div>
      </div>
      ${it.note ? `<div class="outfit-diary">💭 ${it.note}</div>` : ''}
      ${linkedHtml}
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="inspirationModule.showAddModal(${it.id})">编辑</button>
        <button class="btn-danger btn-block btn-md" onclick="inspirationModule.deleteItem(${it.id})">删除</button>
      </div>
    `);
  },

  render() {
    const grid = document.getElementById('inspoMasonry');
    let items = this.items;
    if (this.currentStyleFilter !== 'all') items = items.filter(i => i.style === this.currentStyleFilter);
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="column-span:all;"><div class="empty-icon">✨</div><p>灵感板是空的</p><p class="empty-sub">收集喜欢的穿搭图，打造你的风格参考库</p></div>`;
      return;
    }
    grid.innerHTML = items.map(it => `
      <div class="inspo-card" onclick="inspirationModule.viewItem(${it.id})">
        <img class="inspo-img" src="${it.image}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 120%22><rect fill=%22%23faf2f3%22 width=%22100%22 height=%22120%22/><text x=%2250%22 y=%2260%22 fill=%22%23c9a8d4%22 font-size=%2230%22 text-anchor=%22middle%22>✨</text></svg>'">
        <div class="inspo-overlay">
          <span class="inspo-style-tag">${it.style}</span>
          ${it.linked ? '<span class="inspo-linked">✓ 衣橱有</span>' : ''}
        </div>
        ${it.note ? `<div class="inspo-note">💭 ${it.note.length > 30 ? it.note.slice(0, 30) + '…' : it.note}</div>` : ''}
        <button class="inspo-del" onclick="inspirationModule.deleteItem(${it.id}, event)">✕</button>
      </div>
    `).join('');
  }
};
