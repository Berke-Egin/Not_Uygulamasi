(() => {
  'use strict';
  const KEY = 'notika.v1';
  const $ = id => document.getElementById(id);
  const categories = { personal: 'Kişisel', work: 'İş', ideas: 'Fikirler', education: 'Öğrenme' };
  const priorities = { high: 'Yüksek öncelik', medium: 'Orta öncelik', low: 'Düşük öncelik' };
  const palette = { cream: '#f8f5eb', purple: '#f1edf8', green: '#edf3e9', pink: '#f8efed', blue: '#edf2f6', white: '#ffffff' };
  const views = { all: 'Tüm notlar', pinned: 'Sabitlenenler', reminders: 'Hatırlatıcılar', archive: 'Arşiv' };
  const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const defaults = () => ({ notes: [], view: 'all', category: 'all', query: '', priority: 'all', sort: 'updated', editing: null, scroll: 0 });
  let state = defaults(), pendingDelete = null, toastTimer, storageFailed = false;
  function validNote(n) { return n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.body === 'string' && Object.hasOwn(priorities,n.priority) && Object.hasOwn(categories,n.category) && Object.hasOwn(palette,n.color) && Number.isFinite(n.created) && Number.isFinite(n.updated) && typeof n.pinned === 'boolean' && typeof n.archived === 'boolean' && (n.reminder === null || (typeof n.reminder === 'string' && Number.isFinite(Date.parse(n.reminder)))) && (n.acknowledged === null || typeof n.acknowledged === 'string'); }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      if (!Array.isArray(loaded.notes) || !loaded.notes.every(validNote)) throw new Error('Invalid data');
      state = { ...defaults(), ...loaded };
      if (!Object.hasOwn(views,state.view)) state.view = 'all';
      if (state.category !== 'all' && !Object.hasOwn(categories,state.category)) state.category = 'all';
      if (state.priority !== 'all' && !Object.hasOwn(priorities,state.priority)) state.priority = 'all';
      if (!['updated','created','priority','reminder'].includes(state.sort)) state.sort = 'updated';
      if (typeof state.query !== 'string') state.query = '';
    }
  } catch { storageFailed = true; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3500); }
  function persist() {
    if (storageFailed) { $('saveState').textContent = '⚠ Kayıt kullanılamıyor — yedek alın'; return false; }
    try { localStorage.setItem(KEY, JSON.stringify(state)); $('saveState').textContent = '●  Tüm değişiklikler kaydedildi'; $('draftState').textContent = '✓ Değişiklikler kaydedildi'; return true; }
    catch { $('saveState').textContent = '⚠ Kaydedilemedi — yedek alın'; $('draftState').textContent = 'Kaydedilemedi. Notlarını dışa aktar.'; toast('Tarayıcı depolaması kullanılamıyor veya dolu. Yedek almayı unutma.'); return false; }
  }
  const dateText = value => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  function el(tag, cls, text) { const item = document.createElement(tag); if (cls) item.className = cls; if (text !== undefined) item.textContent = text; return item; }
  function action(symbol, label, handler, active = false) { const b = el('button','icon-button' + (active ? ' is-pinned' : ''),symbol); b.type = 'button'; b.title = label; b.setAttribute('aria-label',label); b.onclick = event => { event.stopPropagation(); handler(); }; return b; }
  function render() {
    const active = state.notes.filter(n => !n.archived);
    $('allCount').textContent = active.length;
    $('pinnedCount').textContent = active.filter(n => n.pinned).length;
    $('reminderCount').textContent = active.filter(n => n.reminder && n.acknowledged !== n.reminder).length;
    $('archiveCount').textContent = state.notes.length - active.length;
    $('statTotal').textContent = active.length;
    $('statHigh').textContent = active.filter(n => n.priority === 'high').length;
    $('statReminders').textContent = $('reminderCount').textContent;
    $('breadcrumbView').textContent = views[state.view];
    $('pageTitle').textContent = state.view === 'all' ? 'Düşüncelerine yer aç.' : views[state.view];
    $('pageSubtitle').textContent = { all: 'Aklındakileri yaz, önceliklerini belirle. Gerisini bize bırak.', pinned: 'Her zaman elinin altında olsun istediklerin.', reminders: 'Doğru zamanda, küçük bir hatırlatma.', archive: 'Saklamak istediğin, şimdilik kenara ayırdığın notlar.' }[state.view];
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active',b.dataset.view === state.view));
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected',b.dataset.filter === state.category));
    const query = state.query.toLocaleLowerCase('tr-TR');
    let notes = state.notes.filter(n => (state.view === 'archive' ? n.archived : !n.archived) && (state.view !== 'pinned' || n.pinned) && (state.view !== 'reminders' || (n.reminder && n.acknowledged !== n.reminder)) && (state.category === 'all' || n.category === state.category) && (state.priority === 'all' || n.priority === state.priority) && (n.title + '\n' + n.body).toLocaleLowerCase('tr-TR').includes(query));
    const rank = { high: 0, medium: 1, low: 2 };
    notes.sort((a,b) => Number(b.pinned) - Number(a.pinned) || (state.sort === 'priority' ? rank[a.priority] - rank[b.priority] : state.sort === 'reminder' ? (a.reminder ? Date.parse(a.reminder) : Infinity) - (b.reminder ? Date.parse(b.reminder) : Infinity) : b[state.sort] - a[state.sort]) || b.updated - a.updated);
    $('listTitle').replaceChildren(document.createTextNode(state.view === 'all' ? 'Notların ' : views[state.view] + ' '), el('span','',notes.length));
    const grid = $('notesGrid'); grid.replaceChildren();
    for (const n of notes) {
      const card = el('article','note-card'); card.dataset.color = n.color; card.tabIndex = 0; card.setAttribute('aria-label',(n.title || 'Başlıksız not') + ' — düzenle');
      card.onclick = () => openEditor(n.id); card.onkeydown = e => { if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEditor(n.id); } };
      const top = el('div','card-top'); const priority = el('span','priority ' + n.priority); priority.append(el('span','priority-dot'),document.createTextNode(priorities[n.priority]));
      const actions = el('div','card-actions'); actions.append(action('⚑',n.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle',() => update(n,{pinned:!n.pinned}),n.pinned),action(n.archived ? '↶' : '▤',n.archived ? 'Arşivden çıkar' : 'Arşivle',() => update(n,{archived:!n.archived})),action('×','Notu sil',() => { pendingDelete = n.id; $('confirmDialog').showModal(); })); top.append(priority,actions);
      card.append(top,el('h3','',n.title || 'Başlıksız not'),el('p','note-preview',n.body || 'Yazmaya başlamak için tıkla…'));
      if (n.reminder) card.append(el('div','reminder-chip' + (Date.parse(n.reminder) <= Date.now() && n.acknowledged !== n.reminder ? ' overdue' : ''),(n.acknowledged === n.reminder ? '✓ ' : '◷ ') + dateText(n.reminder)));
      const bottom = el('div','card-bottom'); bottom.append(el('span','category-tag',categories[n.category]),el('span','',dateText(n.updated))); card.append(bottom); grid.append(card);
    }
    if (!notes.length) grid.append(el('div','empty-state',state.notes.length ? 'Burada henüz bir not yok. Filtrelerini değiştirebilir veya yeni bir not oluşturabilirsin.' : 'Burası senin boş sayfan. İlk notunla başlayalım.'));
    if (state.view !== 'archive') { const add = el('button','add-card'); add.append(el('span','add-circle','＋'),el('strong','','Yeni bir not oluştur'),el('small','','Bir fikir, bir plan, bir hatırlatma…')); add.onclick = () => openEditor(); grid.append(add); }
    checkReminders();
  }
  function update(note, values) { Object.assign(note,values,{updated:Date.now()}); persist(); render(); }
  function openEditor(id) {
    let n = state.notes.find(n => n.id === id);
    if (!n) { n = { id:uid(), title:'', body:'', priority:'low', category:state.category === 'all' ? 'personal' : state.category, color:'cream', pinned:false, archived:false, reminder:null, acknowledged:null, created:Date.now(), updated:Date.now() }; state.notes.unshift(n); }
    state.editing = n.id;
    $('editorLabel').textContent = n.title || n.body ? 'NOTUNU DÜZENLE' : 'YENİ NOT';
    $('noteTitle').value = n.title; $('noteBody').value = n.body; $('notePriority').value = n.priority; $('noteCategory').value = n.category; $('noteReminder').value = n.reminder || ''; $('notePinned').checked = n.pinned;
    renderColors(n.color); persist(); render();
    if (!$('editor').open) $('editor').showModal();
    $('noteTitle').focus();
  }
  function renderColors(color) { $('colors').replaceChildren(); for (const [name,value] of Object.entries(palette)) { const b = el('button','color-button' + (name === color ? ' selected' : '')); b.type = 'button'; b.style.background = value; b.setAttribute('aria-label',({cream:'Krem',purple:'Mor',green:'Yeşil',pink:'Pembe',blue:'Mavi',white:'Beyaz'})[name]); b.setAttribute('aria-pressed',String(name === color)); b.onclick = () => { const n = state.notes.find(n => n.id === state.editing); if(n) update(n,{color:name}); renderColors(name); }; $('colors').append(b); } }
  function saveEditor() {
    const n = state.notes.find(n => n.id === state.editing); if (!n) return;
    const value = $('noteReminder').value;
    const reminder = value && Number.isFinite(Date.parse(value)) ? value : null;
    if (reminder !== n.reminder) n.acknowledged = null;
    update(n,{title:$('noteTitle').value,body:$('noteBody').value,priority:$('notePriority').value,category:$('noteCategory').value,reminder,pinned:$('notePinned').checked});
  }
  function closeEditor() { saveEditor(); state.editing = null; persist(); $('editor').close(); }
  function checkReminders() {
    const due = state.notes.filter(n => !n.archived && n.reminder && n.acknowledged !== n.reminder && Date.parse(n.reminder) <= Date.now());
    const banner = $('reminderBanner'); banner.hidden = !due.length; banner.replaceChildren();
    if (due.length) { banner.append(el('strong','',`◷ ${due.length} hatırlatıcının zamanı geldi`)); for (const n of due) { const row = el('div',''); const open = el('button','',n.title || 'Başlıksız not'); open.onclick = () => openEditor(n.id); const done = el('button','','Tamamlandı ✓'); done.onclick = () => update(n,{acknowledged:n.reminder}); row.append(open,done); banner.append(row); } }
  }
  $('newNote').onclick = () => openEditor();
  $('closeEditor').onclick = closeEditor;
  $('editor').addEventListener('cancel',e => { e.preventDefault(); closeEditor(); });
  $('noteForm').onsubmit = e => { e.preventDefault(); closeEditor(); };
  ['noteTitle','noteBody','notePriority','noteCategory','noteReminder','notePinned'].forEach(id => $(id).addEventListener('input',saveEditor));
  $('navigation').onclick = e => { const b = e.target.closest('[data-view]'); if (b) { state.view = b.dataset.view; persist(); render(); } };
  $('tabs').onclick = e => { const b = e.target.closest('[data-filter]'); if (b) { state.category = b.dataset.filter; persist(); render(); } };
  for (const [id,key,event] of [['search','query','input'],['priorityFilter','priority','change'],['sort','sort','change']]) { $(id).value = state[key]; $(id).addEventListener(event,() => { state[key] = $(id).value; persist(); render(); }); }
  $('cancelDelete').onclick = () => $('confirmDialog').close();
  $('confirmDelete').onclick = () => { state.notes = state.notes.filter(n => n.id !== pendingDelete); pendingDelete = null; persist(); render(); $('confirmDialog').close(); toast('Not silindi.'); };
  $('exportBtn').onclick = () => { const blob = new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),notes:state.notes},null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = el('a'); a.href = url; a.download = `notika-yedek-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); toast('Notların yedek dosyası indirildi.'); };
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 10 * 1024 * 1024) throw new Error(); const data = JSON.parse(await file.text()); if (data.version !== 1 || !Array.isArray(data.notes) || !data.notes.every(validNote)) throw new Error(); let count = 0; for (const n of data.notes) { const same = state.notes.find(old => old.id === n.id); if (same && JSON.stringify(same) === JSON.stringify(n)) continue; state.notes.push({...n,id:same ? uid() : n.id}); count++; } const saved = persist(); render(); toast(`${count} not içe aktarıldı.${saved ? '' : ' Kalıcı kayıt başarısız; yedek alın.'}`); } catch { toast('Dosya okunamadı. Geçerli bir Notika yedeği seç (en fazla 10 MB).'); } finally { e.target.value = ''; } };
  document.addEventListener('keydown',e => { if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || $('editor').open || $('confirmDialog').open) return; if(e.key.toLowerCase() === 'n') { e.preventDefault(); openEditor(); } if(e.key === '/') { e.preventDefault(); $('search').focus(); } });
  window.addEventListener('pagehide',() => { state.scroll = window.scrollY; persist(); });
  document.addEventListener('visibilitychange',() => { if(document.hidden) { state.scroll = window.scrollY; persist(); } else checkReminders(); });
  $('todayLabel').textContent = new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long'}).format(new Date());
  render();
  if (storageFailed) { $('saveState').textContent = '⚠ Kayıt okunamadı — mevcut verinin üzerine yazılmıyor'; toast('Tarayıcı kayıtları okunamadı. Mevcut verilerin korunuyor.'); }
  const restoredScroll = Number.isFinite(state.scroll) ? state.scroll : 0;
  if (state.editing && state.notes.some(n => n.id === state.editing)) openEditor(state.editing);
  requestAnimationFrame(() => window.scrollTo(0,restoredScroll));
  setInterval(checkReminders,15000);
})();
