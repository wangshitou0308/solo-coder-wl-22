const bodyModule = {
  records: [],
  currentTrend: 'weight',

  async init() {
    this.records = (await DB.getAll('bodyRecords')).sort((a, b) => new Date(a.date) - new Date(b.date));
    this.render();
  },

  calcBMI(h, w) { return w / Math.pow(h / 100, 2); },

  bmiCategory(bmi) {
    if (bmi < 18.5) return { t: '偏瘦', c: '#5A8AC4' };
    if (bmi < 24) return { t: '标准', c: '#6AAA7A' };
    if (bmi < 28) return { t: '偏胖', c: '#F0A05A' };
    return { t: '肥胖', c: '#D45A5A' };
  },

  bodyTypeClassify(r) {
    if (!r.waist || !r.hip || !r.shoulder) return { t: '待评估', d: '缺少围度数据' };
    const whr = r.waist / r.hip;
    const swr = r.shoulder / r.waist;
    const bustHipDiff = Math.abs((r.bust || 90) - r.hip);
    if (whr > 0.85 && r.waist > (r.hip - 5)) return { t: '🍎 苹果型', d: '腰腹圆润，建议A字版型' };
    if (whr < 0.75 && r.hip > r.shoulder) return { t: '🍐 梨型', d: '胯宽肩窄，建议上宽下紧' };
    if (swr > 1.4 && whr < 0.8) return { t: '⏳ 沙漏型', d: '肩胯均衡腰细，收腰款最佳' };
    if (bustHipDiff < 5 && whr > 0.75 && whr < 0.85) return { t: '▢ 矩型', d: '线条平直，建议制造腰线' };
    if (r.shoulder > r.hip + 3) return { t: '🔻 倒三角', d: '肩宽胯窄，建议下装蓬松' };
    return { t: '✦ 匀称型', d: '身材标准，适配多种风格' };
  },

  showRecordModal(editId = null) {
    const rec = editId ? this.records.find(r => r.id === editId) : null;
    const today = Utils.todayStr();
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${rec ? '编辑身体数据' : '记录身体数据'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
      </div>
      <div class="form-group">
        <label class="form-label">记录日期</label>
        <input type="date" class="form-input" id="br-date" value="${rec ? rec.date : today}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">身高 (cm)</label>
          <input type="number" class="form-input" id="br-height" step="0.1" placeholder="165" value="${rec?.height ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">体重 (kg)</label>
          <input type="number" class="form-input" id="br-weight" step="0.1" placeholder="52" value="${rec?.weight ?? ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">肩宽 (cm)</label>
          <input type="number" class="form-input" id="br-shoulder" step="0.1" placeholder="38" value="${rec?.shoulder ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">胸围 (cm)</label>
          <input type="number" class="form-input" id="br-bust" step="0.1" placeholder="86" value="${rec?.bust ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">腰围 (cm)</label>
          <input type="number" class="form-input" id="br-waist" step="0.1" placeholder="68" value="${rec?.waist ?? ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">臀围 (cm)</label>
          <input type="number" class="form-input" id="br-hip" step="0.1" placeholder="90" value="${rec?.hip ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">大腿围 (cm)</label>
          <input type="number" class="form-input" id="br-thigh" step="0.1" placeholder="52" value="${rec?.thigh ?? ''}">
        </div>
        <div class="form-group">
          <label class="form-label">小腿围 (cm)</label>
          <input type="number" class="form-input" id="br-calf" step="0.1" placeholder="34" value="${rec?.calf ?? ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-input" id="br-note" placeholder="如：生理期、运动后..." value="${rec?.note ?? ''}">
      </div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-ghost btn-block btn-md" onclick="Utils.closeModal()">取消</button>
        <button class="btn-primary btn-block btn-md" onclick="bodyModule.saveRecord(${editId || 'null'})">保存记录</button>
      </div>
    `);
  },

  async saveRecord(editId) {
    const val = id => {
      const v = document.getElementById(id)?.value;
      return v === '' ? null : parseFloat(v);
    };
    const data = {
      date: document.getElementById('br-date').value,
      height: val('br-height'),
      weight: val('br-weight'),
      shoulder: val('br-shoulder'),
      bust: val('br-bust'),
      waist: val('br-waist'),
      hip: val('br-hip'),
      thigh: val('br-thigh'),
      calf: val('br-calf'),
      note: document.getElementById('br-note').value || null
    };
    if (!data.date) return Utils.toast('请选择日期');
    if (data.height && (data.height < 100 || data.height > 230)) return Utils.toast('身高不合理');
    if (data.weight && (data.weight < 20 || data.weight > 200)) return Utils.toast('体重不合理');

    if (editId) {
      await DB.put('bodyRecords', { ...this.records.find(r => r.id === editId), ...data });
      Utils.toast('记录已更新');
    } else {
      await DB.add('bodyRecords', data);
      Utils.toast('记录已添加');
    }
    Utils.closeModal();
    await this.init();
  },

  async deleteRecord(id) {
    if (!confirm('确定删除此记录？')) return;
    await DB.remove('bodyRecords', id);
    Utils.toast('已删除');
    await this.init();
  },

  switchTrend(btn, type) {
    document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.currentTrend = type;
    this.renderChart();
  },

  renderChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas || this.records.length === 0) {
      Utils.drawLineChart(canvas, null);
      return;
    }
    const map = {
      weight: { key: 'weight', label: '体重', unit: 'kg' },
      bmi: { key: 'bmi', label: 'BMI', unit: '' },
      waist: { key: 'waist', label: '腰围', unit: 'cm' },
      hip: { key: 'hip', label: '臀围', unit: 'cm' }
    };
    const cfg = map[this.currentTrend];
    const data = this.records
      .filter(r => {
        if (cfg.key === 'bmi') return r.height && r.weight;
        return r[cfg.key] != null;
      })
      .map(r => {
        const v = cfg.key === 'bmi' ? this.calcBMI(r.height, r.weight) : r[cfg.key];
        const d = new Date(r.date);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        return { v: Number(v.toFixed(2)), l: label };
      });
    const colors = { weight: '#d4919a', bmi: '#c9a8d4', waist: '#f5c6a5', hip: '#a8c8d4' };
    Utils.drawLineChart(canvas, data, colors[this.currentTrend]);
  },

  renderSilhouette(r) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (!r) {
      ['m-shoulder', 'm-bust', 'm-waist', 'm-hip', 'm-height'].forEach(id => set(id, '-'));
      return;
    }
    set('m-height', r.height ? r.height + 'cm' : '-');
    set('m-shoulder', r.shoulder ? '肩' + r.shoulder : '-');
    set('m-bust', r.bust ? '胸' + r.bust : '-');
    set('m-waist', r.waist ? '腰' + r.waist : '-');
    set('m-hip', r.hip ? '臀' + r.hip : '-');
  },

  render() {
    const latest = this.records[this.records.length - 1];
    if (latest && latest.height && latest.weight) {
      const bmi = this.calcBMI(latest.height, latest.weight);
      const bc = this.bmiCategory(bmi);
      document.getElementById('currentBMI').textContent = bmi.toFixed(1);
      const bcEl = document.getElementById('bmiCategory');
      bcEl.textContent = bc.t;
      bcEl.style.color = bc.c;
    }
    if (latest && latest.waist && latest.hip) {
      document.getElementById('currentWHR').textContent = (latest.waist / latest.hip).toFixed(2);
    }
    if (latest && latest.shoulder && latest.waist) {
      document.getElementById('currentSWR').textContent = (latest.shoulder / latest.waist).toFixed(2);
    }
    const bt = this.bodyTypeClassify(latest || {});
    document.getElementById('bodyType').textContent = bt.t;
    document.getElementById('bodyTypeDesc').textContent = bt.d;

    this.renderSilhouette(latest);
    this.renderChart();

    const list = document.getElementById('bodyRecordList');
    if (this.records.length === 0) {
      list.innerHTML = `<div class="empty-state small"><div class="empty-icon">📝</div><p>还没有身体数据记录</p><p class="empty-sub">点击右上角「记录数据」开始追踪</p></div>`;
      return;
    }
    const sorted = [...this.records].reverse();
    list.innerHTML = sorted.map(r => {
      const bmi = r.height && r.weight ? this.calcBMI(r.height, r.weight).toFixed(1) : '-';
      return `<div class="record-item">
        <div>
          <div class="record-date">${r.date}</div>
          <div class="record-data" style="margin-top:4px;">
            ${r.weight ? `<span>体重 <strong>${r.weight}kg</strong></span>` : ''}
            ${r.height ? `<span>BMI <strong>${bmi}</strong></span>` : ''}
            ${r.waist ? `<span>腰围 <strong>${r.waist}cm</strong></span>` : ''}
          </div>
          ${r.note ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">📌 ${r.note}</div>` : ''}
        </div>
        <div class="record-actions">
          <button class="record-del" onclick="bodyModule.showRecordModal(${r.id})">编辑</button>
          <button class="record-del" onclick="bodyModule.deleteRecord(${r.id})">删除</button>
        </div>
      </div>`;
    }).join('');
  }
};
