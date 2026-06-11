const bodyModule = {
  records: [],
  currentTrend: 'weight',
  _prevBodyType: null,
  bodyTypeChanged: false,

  async init() {
    this.records = (await DB.getAll('bodyRecords')).sort((a, b) => new Date(a.date) - new Date(b.date));
    this.bodyTypeChanged = false;
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
    if (!r || !r.waist || !r.hip || !r.shoulder) return { t: '待评估', d: '缺少围度数据' };
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

  _calcSizeRef(record) {
    if (!record) return null;
    const sizes = [
      { label: 'XS', h: 155, bust: 80, waist: 62, hip: 86 },
      { label: 'S', h: 160, bust: 84, waist: 66, hip: 90 },
      { label: 'M', h: 165, bust: 88, waist: 70, hip: 94 },
      { label: 'L', h: 170, bust: 92, waist: 74, hip: 98 },
      { label: 'XL', h: 175, bust: 96, waist: 78, hip: 102 }
    ];
    let best = null;
    let bestScore = Infinity;
    for (const s of sizes) {
      let diff = 0;
      let n = 0;
      if (record.height) { diff += Math.abs(record.height - s.h); n++; }
      if (record.bust) { diff += Math.abs(record.bust - s.bust); n++; }
      if (record.waist) { diff += Math.abs(record.waist - s.waist); n++; }
      if (record.hip) { diff += Math.abs(record.hip - s.hip); n++; }
      if (n === 0) continue;
      if (diff / n < bestScore) {
        bestScore = diff / n;
        best = s.label;
      }
    }
    return best;
  },

  renderStyleAdviceCard() {
    const container = document.getElementById('styleAdviceCard');
    if (!container) return;
    const latest = this.records[this.records.length - 1];
    const bt = this.bodyTypeClassify(latest || {});
    const advice = Utils.BODY_TYPE_ADVICE[bt.t];
    if (!advice) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = `<div class="section-card">
      <div class="section-header">
        <h3>👗 体型穿搭建议</h3>
        <span style="font-size:12px;color:var(--primary);font-weight:500;">${bt.t}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:12px;font-weight:600;color:#6AAA7A;margin-bottom:6px;">✅ 适合版型</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${advice.fit.map(f => `<span class="ctag">${f}</span>`).join('')}</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:#D45A5A;margin-bottom:6px;">❌ 避免版型</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${advice.avoid.map(f => `<span class="ctag">${f}</span>`).join('')}</div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">🎨 推荐颜色位置</div>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap;">
          <span>上身: ${advice.colors.top}</span>
          <span>下身: ${advice.colors.bottom}</span>
          <span>点缀: ${advice.colors.accent}</span>
        </div>
      </div>
      <div style="margin-top:10px;padding:8px 12px;background:var(--bg-soft);border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.6;">
        💡 ${advice.tips}
      </div>
    </div>`;
  },

  _renderSizeRef() {
    const container = document.getElementById('sizeRefCard');
    if (!container) return;
    const latest = this.records[this.records.length - 1];
    const size = this._calcSizeRef(latest);
    if (!size) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = `<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:14px 16px;box-shadow:var(--shadow-sm);border:1px solid var(--border);display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--primary-light),var(--secondary-light));display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📏</div>
      <div>
        <div style="font-size:12px;color:var(--text-muted);">参考尺码</div>
        <div style="font-size:22px;font-weight:700;font-family:'Playfair Display',serif;color:var(--primary);">${size}</div>
      </div>
      <div style="margin-left:auto;font-size:11px;color:var(--text-muted);max-width:140px;">基于身高/胸围/腰围/臀围综合推荐</div>
    </div>`;
  },

  _getLatestTarget() {
    for (let i = this.records.length - 1; i >= 0; i--) {
      const r = this.records[i];
      if (r.targetWeight || r.targetWaist) return r;
    }
    return null;
  },

  _renderTargetSection() {
    const container = document.getElementById('targetSection');
    if (!container) return;
    const latest = this.records[this.records.length - 1];
    const targetRec = this._getLatestTarget();
    if (!targetRec || (!targetRec.targetWeight && !targetRec.targetWaist)) {
      container.innerHTML = '';
      return;
    }
    const tw = targetRec.targetWeight;
    const twaist = targetRec.targetWaist;
    const cw = latest?.weight;
    const cwaist = latest?.waist;
    let html = `<div class="section-card"><div class="section-header"><h3>🎯 目标设定</h3></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">`;
    if (tw) {
      const diff = cw != null ? (cw - tw).toFixed(1) : null;
      const diffColor = diff != null ? (cw > tw ? '#D45A5A' : cw < tw ? '#5A8AC4' : '#6AAA7A') : 'var(--text-muted)';
      const diffLabel = diff != null ? (cw > tw ? `+${diff}` : diff) : '-';
      html += `<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:12px;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">体重目标</div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${tw}<span style="font-size:12px;font-weight:400;"> kg</span></div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">当前 <strong>${cw ?? '-'}</strong> kg · 差值 <span style="color:${diffColor};font-weight:600;">${diffLabel}</span></div>
      </div>`;
    }
    if (twaist) {
      const diff = cwaist != null ? (cwaist - twaist).toFixed(1) : null;
      const diffColor = diff != null ? (cwaist > twaist ? '#D45A5A' : cwaist < twaist ? '#5A8AC4' : '#6AAA7A') : 'var(--text-muted)';
      const diffLabel = diff != null ? (cwaist > twaist ? `+${diff}` : diff) : '-';
      html += `<div style="background:var(--bg-soft);border-radius:var(--radius-md);padding:12px;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">腰围目标</div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${twaist}<span style="font-size:12px;font-weight:400;"> cm</span></div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">当前 <strong>${cwaist ?? '-'}</strong> cm · 差值 <span style="color:${diffColor};font-weight:600;">${diffLabel}</span></div>
      </div>`;
    }
    html += `</div></div>`;
    container.innerHTML = html;
  },

  showRecordModal(editId = null) {
    const rec = editId ? this.records.find(r => r.id === editId) : null;
    const targetRec = this._getLatestTarget();
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
      <div style="margin:16px 0 8px;padding-top:14px;border-top:1px solid var(--border);">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px;">🎯 目标设定</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">目标体重 (kg)</label>
            <input type="number" class="form-input" id="br-targetWeight" step="0.1" placeholder="50" value="${rec?.targetWeight ?? targetRec?.targetWeight ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">目标腰围 (cm)</label>
            <input type="number" class="form-input" id="br-targetWaist" step="0.1" placeholder="65" value="${rec?.targetWaist ?? targetRec?.targetWaist ?? ''}">
          </div>
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
    const prevLatest = this.records.length > 0 ? this.records[this.records.length - 1] : null;
    const prevType = prevLatest ? this.bodyTypeClassify(prevLatest).t : null;
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
      targetWeight: val('br-targetWeight'),
      targetWaist: val('br-targetWaist'),
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

    const newLatest = this.records[this.records.length - 1];
    const newType = newLatest ? this.bodyTypeClassify(newLatest).t : null;
    if (prevType && newType && prevType !== newType) {
      this.bodyTypeChanged = true;
      this._prevBodyType = prevType;
      Utils.toast(`体型变化：${prevType} → ${newType}，推荐策略将自动调整`);
    }
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

    const targetRec = this._getLatestTarget();
    let targetVal = null;
    if (this.currentTrend === 'weight' && targetRec?.targetWeight) targetVal = targetRec.targetWeight;
    if (this.currentTrend === 'waist' && targetRec?.targetWaist) targetVal = targetRec.targetWaist;
    if (targetVal != null && data.length > 0) {
      this._drawTargetLine(canvas, targetVal, data);
    }
  },

  _drawTargetLine(canvas, targetVal, data) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = canvas.height / dpr;
    const pad = { t: 20, r: 16, b: 30, l: 40 };
    const gh = h - pad.t - pad.b;
    const vals = data.map(d => d.v);
    const minV = Math.min(...vals) * 0.95;
    const maxV = Math.max(...vals) * 1.05;
    const range = maxV - minV || 1;
    if (targetVal < minV || targetVal > maxV) return;
    const y = pad.t + gh - ((targetVal - minV) / range) * gh;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#D45A5A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#D45A5A';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('目标 ' + targetVal, w - pad.r, y - 5);
    ctx.restore();
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
    document.getElementById('currentBMI').textContent = '-';
    const bcEl = document.getElementById('bmiCategory');
    bcEl.textContent = '';
    bcEl.style.color = '';
    document.getElementById('currentWHR').textContent = '-';
    document.getElementById('currentSWR').textContent = '-';

    const latest = this.records[this.records.length - 1];
    if (latest && latest.height && latest.weight) {
      const bmi = this.calcBMI(latest.height, latest.weight);
      const bc = this.bmiCategory(bmi);
      document.getElementById('currentBMI').textContent = bmi.toFixed(1);
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
    this.renderStyleAdviceCard();
    this._renderSizeRef();
    this._renderTargetSection();

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
