const app = {
  pageTitles: {
    body: '身材档案',
    wardrobe: '我的衣橱',
    outfit: '穿搭日记',
    recommend: '今日推荐',
    shopping: '购物清单',
    inspiration: '风格灵感'
  },

  currentPage: 'body',

  async init() {
    await DB.open();
    await Promise.all([
      bodyModule.init(),
      wardrobeModule.init()
    ]);
    await Promise.all([
      outfitModule.init(),
      recommendModule.init(),
      shoppingModule.init(),
      inspirationModule.init()
    ]);
    this._bindEvents();
    setTimeout(() => {
      this.switchPage('body');
      if (!localStorage.getItem('xy_welcome')) {
        localStorage.setItem('xy_welcome', '1');
        Utils.toast('欢迎使用型影！先去记录身材数据吧');
      }
    }, 100);
  },

  _bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Utils.closeModal();
    });
  },

  switchPage(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === 'page-' + page);
    });
    const title = this.pageTitles[page] || '';
    document.getElementById('pageTitle').textContent = title;
    this._refreshPage(page);
  },

  _refreshPage(page) {
    switch (page) {
      case 'body':
        bodyModule.renderChart();
        break;
      case 'wardrobe':
        wardrobeModule.render();
        break;
      case 'outfit':
        outfitModule.renderCalendar();
        outfitModule.renderList();
        outfitModule.renderRanks();
        break;
      case 'recommend':
        recommendModule.generate();
        break;
      case 'shopping':
        shoppingModule.refresh();
        break;
      case 'inspiration':
        inspirationModule.render();
        break;
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

if (!window.indexedDB) {
  alert('您的浏览器不支持 IndexedDB，部分功能无法使用。请使用 Chrome / Firefox / Safari 最新版本。');
}
