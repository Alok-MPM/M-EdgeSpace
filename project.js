/* projects.js v3 — projects panel, cleaner logic, delete-all added, koi native dialog nahi */
(() => {
  const LS = 'mes-projects';
  const $ = s => document.querySelector(s);
  const store = () => JSON.parse(localStorage.getItem(LS) || '{}');
  const put = d => localStorage.setItem(LS, JSON.stringify(d));
  let cur = null;

  // ek-baar migration purani single-scene save se
  (function migrateOld(){
    try{
      const old = JSON.parse(localStorage.getItem('mes-scene') || 'null');
      const d = store();
      if(old && old.length && !Object.keys(d).length){
        d['pold'] = { name: 'Purana Kaam', created: Date.now(), scene: old };
        put(d);
        localStorage.removeItem('mes-scene');
      }
    }catch(e){}
  })();

  const dump = () => window.SCENE3D.dump();

  function topbar(){
    $('#pname').textContent = cur ? ('📁 ' + cur.name) : '📁 —';
  }

  function touch(){
    if(!cur) return;
    const d = store();
    if(!d[cur.id]) return; // project kahi delete ho gaya
    d[cur.id].scene = dump();
    put(d);
    const dot = $('#saveDot');
    if(dot){ dot.style.opacity = 1; setTimeout(() => dot.style.opacity = .25, 400); }
  }

  function startSession(){
    const d = store();
    const id = 'p' + Date.now();
    const name = 'Session ' + new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    d[id] = { name, created: Date.now(), scene: [] };
    put(d);
    cur = { id, name };
    topbar();
    return id;
  }

  // ek hi tareeka "pakka?" confirm ka, delete aur delete-all dono ke liye
  function armThenConfirm(btn, onConfirm){
    if(btn.dataset.arm){
      onConfirm();
      return;
    }
    btn.dataset.arm = '1';
    const original = btn.textContent;
    btn.textContent = 'pakka?';
    btn.classList.add('armed');
    setTimeout(() => {
      btn.dataset.arm = '';
      btn.textContent = original;
      btn.classList.remove('armed');
    }, 2500);
  }

  function downloadJSON(data, name){
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (name || 'scene') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderCards(){
    const d = store();
    const grid = $('#pGrid');
    grid.innerHTML = '';
    const ids = Object.keys(d).sort((a, b) => d[b].created - d[a].created);

    if(!ids.length){
      grid.innerHTML = '<div class="pEmpty">Koi project nahi hai</div>';
      return;
    }

    ids.forEach(id => {
      const p = d[id];
      const el = document.createElement('div');
      el.className = 'card' + (cur && cur.id === id ? ' active' : '');
      el.innerHTML = `
        <b>${p.name}</b>
        <span>${(p.scene || []).length} obj • ${new Date(p.created).toLocaleDateString()}</span>
        <div class="row">
          <button data-a="open" title="Kholo">📂</button>
          <button data-a="dup" title="Duplicate">⧉</button>
          <button data-a="exp" title="Export">📤</button>
          <button data-a="del" title="Delete" class="danger">🗑</button>
        </div>`;

      el.querySelector('[data-a=open]').onclick = () => {
        cur = { id, name: p.name };
        window.SCENE3D.load(p.scene || []);
        closePanel();
        FX.toast('📂 ' + p.name + ' khula');
        topbar();
      };

      el.querySelector('[data-a=dup]').onclick = () => {
        const d2 = store();
        const copy = JSON.parse(JSON.stringify(p));
        copy.name = p.name + ' copy';
        copy.created = Date.now();
        d2['p' + Date.now()] = copy;
        put(d2);
        renderCards();
        FX.toast('⧉ duplicate ban gaya');
      };

      el.querySelector('[data-a=exp]').onclick = () => {
        downloadJSON(p.scene || [], p.name);
        FX.toast('📤 export ho gaya');
      };

      const delBtn = el.querySelector('[data-a=del]');
      delBtn.onclick = () => armThenConfirm(delBtn, () => {
        const d3 = store();
        delete d3[id];
        put(d3);
        if(cur && cur.id === id){ cur = null; topbar(); }
        renderCards();
        FX.toast('🗑 delete ho gaya');
      });

      grid.appendChild(el);
    });
  }

  function openPanel(){ renderCards(); $('#ppanel').style.display = 'flex'; }
  function closePanel(){ $('#ppanel').style.display = 'none'; }

  function deleteAllProjects(){
    put({});
    cur = null;
    window.SCENE3D.load([]);
    topbar();
    renderCards();
    FX.toast('🗑 sab projects delete ho gaye');
  }

  window.PROJ = {
    touch, startSession, openPanel,
    get cur(){ return cur; },

    copy: () => {
      const o = window.SCENE3D.selected();
      if(!o){ FX.toast('pehle object select karo (👉 hold)'); return; }
      localStorage.setItem('mes-clip', JSON.stringify(o));
      FX.toast('📋 model copy hua');
    },

    paste: () => {
      const c = JSON.parse(localStorage.getItem('mes-clip') || 'null');
      if(!c){ FX.toast('clip khali — pehle copy karo'); return; }
      c.p = (c.p || [0, 0, 0]).map(v => v + (Math.random() - .5) * .8);
      window.SCENE3D.load([...dump(), c]);
      FX.toast('📥 paste ho gaya');
    },

    export: () => downloadJSON(dump(), cur ? cur.name : 'scene'),

    import: file => {
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const arr = JSON.parse(reader.result);
          const d = store();
          const id = 'p' + Date.now();
          const name = (file.name || 'import').replace(/\.json$/i, '');
          d[id] = { name, created: Date.now(), scene: arr };
          put(d);
          FX.toast('📥 "' + name + '" project ban gaya — 📁 se kholo');
        }catch(e){
          FX.toast('❌ galat json file');
        }
      };
      reader.readAsText(file);
    }
  };

  $('#pbtn').onclick = openPanel;
  $('#pClose').onclick = closePanel;

  $('#pNew').onclick = () => {
    const d = store();
    const id = 'p' + Date.now();
    const name = $('#npName').value.trim() || ('Project ' + (Object.keys(d).length + 1));
    d[id] = { name, created: Date.now(), scene: [] };
    put(d);
    $('#npName').value = '';
    cur = { id, name };
    window.SCENE3D.load([]);
    closePanel();
    topbar();
    FX.toast('➕ ' + name + ' ready (fresh)');
  };

  $('#pExp').onclick = () => window.PROJ.export();

  $('#pImp').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => window.PROJ.import(input.files[0]);
    input.click();
  };

  const delAllBtn = $('#pDelAll');
  if(delAllBtn){
    delAllBtn.onclick = () => armThenConfirm(delAllBtn, deleteAllProjects);
  }

  topbar();
})();
