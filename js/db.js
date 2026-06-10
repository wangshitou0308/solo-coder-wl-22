const DB = (function() {
  const DB_NAME = 'xingying_db';
  const DB_VERSION = 1;
  const STORES = {
    bodyRecords: { key: 'id', auto: true, indexes: [['date', 'date', { unique: false }]] },
    clothes: { key: 'id', auto: true, indexes: [
      ['category', 'category', { unique: false }],
      ['scenes', 'scenes', { unique: false, multi: true }],
      ['wearCount', 'wearCount', { unique: false }],
      ['lastWorn', 'lastWorn', { unique: false }]
    ]},
    outfits: { key: 'id', auto: true, indexes: [
      ['date', 'date', { unique: false }],
      ['scenes', 'scenes', { unique: false, multi: true }],
      ['seasons', 'seasons', { unique: false, multi: true }]
    ]},
    wishlist: { key: 'id', auto: true, indexes: [['priority', 'priority', { unique: false }]] },
    inspirations: { key: 'id', auto: true, indexes: [['style', 'style', { unique: false }]] }
  };

  let db = null;
  const open = () => new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      Object.keys(STORES).forEach(name => {
        if (!d.objectStoreNames.contains(name)) {
          const cfg = STORES[name];
          const os = d.createObjectStore(name, { keyPath: cfg.key, autoIncrement: cfg.auto });
          (cfg.indexes || []).forEach(([iname, prop, opts]) => os.createIndex(iname, prop, opts));
        }
      });
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });

  const tx = (store, mode = 'readonly') => {
    const t = db.transaction(store, mode);
    return { store: t.objectStore(store), done: new Promise(r => t.oncomplete = r) };
  };

  const wrap = (req) => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const add = async (store, data) => {
    await open();
    const { store: s, done } = tx(store, 'readwrite');
    const id = await wrap(s.add(data));
    await done;
    return id;
  };
  const put = async (store, data) => {
    await open();
    const { store: s, done } = tx(store, 'readwrite');
    const id = await wrap(s.put(data));
    await done;
    return id;
  };
  const get = async (store, id) => {
    await open();
    const { store: s } = tx(store);
    return wrap(s.get(id));
  };
  const getAll = async (store, idx = null, key = null) => {
    await open();
    const { store: s } = tx(store);
    const src = idx ? s.index(idx) : s;
    return wrap(key ? src.getAll(key) : src.getAll());
  };
  const remove = async (store, id) => {
    await open();
    const { store: s, done } = tx(store, 'readwrite');
    await wrap(s.delete(id));
    await done;
  };
  const clear = async (store) => {
    await open();
    const { store: s, done } = tx(store, 'readwrite');
    await wrap(s.clear());
    await done;
  };
  const cursor = async (store, idx, fn) => {
    await open();
    const { store: s, done } = tx(store, 'readwrite');
    const src = idx ? s.index(idx) : s;
    const req = src.openCursor();
    req.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) { fn(cur); cur.continue(); }
    };
    await done;
  };

  return { open, add, put, get, getAll, remove, clear, cursor };
})();
