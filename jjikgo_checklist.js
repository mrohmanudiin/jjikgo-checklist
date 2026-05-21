/* ═══════════════════════════════════════════════════════════════════════════
   JJIKGO Daily Cleanliness Checker — Application Logic
   Firebase Realtime Database · Timestamp Watermark · HD Excel Export
   ═══════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE CONFIG — GANTI DENGAN CREDENTIAL PROJECT ANDA
// Pastikan Realtime Database rules di-set ke:
//   { "rules": { ".read": true, ".write": true } }
// atau rules yang sesuai untuk production.
// ═══════════════════════════════════════════════════════════════════════════
var firebaseConfig = {
  apiKey: "AIzaSyBNilwTxVcx4r1FECM12mVZ_yM2XhqLoX0",
  authDomain: "jjikgo-checklist.firebaseapp.com",
  databaseURL: "https://jjikgo-checklist-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jjikgo-checklist"
};

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST DATA DEFINITION
// ═══════════════════════════════════════════════════════════════════════════
var CATEGORIES = [
  { name: 'Outdoor Seating Area', items: [
    ['Table Organized','Meja Tertata'], ['Glass Clean','Kaca Bersih'],
    ['Floor Clean','Lantai Bersih'], ['No Bad Smell','Tidak Bau'],
    ['Lighting Work','Lampu Berfungsi'], ['Ceiling Fan Work','Kipas Langit-Langit Berfungsi'],
    ['Floor Mat Clean','Keset Bersih']
  ]},
  { name: 'Cafe Area', items: [
    ['Table Organized','Meja Tertata'], ['Receipt Photo Print Working','Printer Foto Struk Berfungsi'],
    ['Air Conditioning Good','AC Baik'], ['No Bad Smell','Tidak Bau'],
    ['Lighting Working','Lampu Berfungsi'], ['Floor Clean','Lantai Bersih']
  ]},
  { name: 'Accessories Area', items: [
    ['Accessories Organized','Aksesoris Tertata'], ['Wardrobe Clean','Lemari Bersih'],
    ['Accessories Clean','Aksesoris Bersih'], ['Mirror Clean','Cermin Bersih']
  ]},
  { name: 'Kitchen/Bar', items: [
    ['Tools Organized','Peralatan Tertata'], ['Stocks Organized','Stok Tertata'],
    ['Boxes Organized','Kotak Tertata'], ['Tools Clean','Peralatan Bersih']
  ]},
  { name: 'Toilet', items: [
    ['No Bad Smell','Tidak Bau'], ['Toilet Clean','Toilet Bersih'],
    ['Tissue Available','Tisu Tersedia'], ['Floor Clean','Lantai Bersih']
  ]},
  { name: 'Photobooth Area', items: [
    ['Camera Cabinet Clean','Lemari Kamera Bersih'], ['Tools Organized','Peralatan Tertata'],
    ['Air Conditioning Good','AC Baik'], ['Lighting Working','Lampu Berfungsi'],
    ['Floor Clean','Lantai Bersih'], ['Camera Working Properly','Kamera Berfungsi Baik']
  ]}
];

var ALL_ITEMS = [];
CATEGORIES.forEach(function(cat, ci) {
  cat.items.forEach(function(pair, ii) {
    ALL_ITEMS.push({
      category: cat.name,
      catIdx: ci,
      name: pair[0],
      nameId: pair[1],
      idx: ALL_ITEMS.length
    });
  });
});
var TOTAL_ITEMS = ALL_ITEMS.length;

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
var PHOTO_MAX_W = 800;   // storage resolution
var PHOTO_MAX_H = 600;
var PHOTO_QUALITY = 0.65; // JPEG quality for storage
var XL_PHOTO_W = 600;    // Excel embed width (HD)
var XL_PHOTO_H = 450;    // Excel embed height

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════
var LS_NAME = 'jjikgo_operator_name';
var myName = localStorage.getItem(LS_NAME) || '';
var myBranch = 'Serang';
var sessionKey = '';
var sessionMeta = null;
var itemsData = {};
var editingData = {};
var presenceData = {};
var editingIdx = -1;
var db = null;
var sessionRef = null;
var itemsRef = null;
var editingRef = null;
var presenceRef = null;

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE INIT
// ═══════════════════════════════════════════════════════════════════════════
var firebaseReady = false;
var firebaseError = '';

function initFirebase() {
  // Check if Firebase CDN loaded
  if (typeof firebase === 'undefined') {
    firebaseError = 'Firebase SDK gagal dimuat. Periksa koneksi internet.';
    console.error(firebaseError);
    return;
  }

  // Check if config has been filled in
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    firebaseError = 'Firebase belum dikonfigurasi. Edit firebaseConfig di jjikgo_checklist.js dengan credential project Anda.';
    console.error(firebaseError);
    return;
  }

  if (!firebaseConfig.databaseURL || firebaseConfig.databaseURL.indexOf('YOUR_PROJECT') >= 0) {
    firebaseError = 'databaseURL Firebase belum diisi. Edit firebaseConfig di jjikgo_checklist.js.';
    console.error(firebaseError);
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    firebaseReady = true;

    // Quick connectivity test
    db.ref('.info/connected').on('value', function(snap) {
      if (snap.val() === true) {
        firebaseReady = true;
        firebaseError = '';
      } else {
        firebaseReady = false;
        firebaseError = 'Tidak terhubung ke Firebase. Periksa databaseURL dan rules.';
      }
      updateConnectionStatus();
    });
  } catch (e) {
    firebaseError = 'Gagal inisialisasi Firebase: ' + e.message;
    console.error(firebaseError);
  }
}
initFirebase();

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function showScreen(name) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  var el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
(function init() {
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  if (myName) document.getElementById('lobbyName').value = myName;
  showScreen('lobby');

  // Photo input handler
  document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);

  // Show connection status after a short delay (wait for Firebase to init)
  setTimeout(function() {
    updateConnectionStatus();
  }, 1500);
})();

// ═══════════════════════════════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════════════════════════════
function enterLobby() {
  var name = document.getElementById('lobbyName').value.trim();
  var branch = document.getElementById('lobbyBranch').value.trim();
  if (!name) { showFeedback('Nama Anda wajib diisi'); return; }
  if (!branch) { showFeedback('Branch wajib diisi'); return; }

  myName = name;
  myBranch = branch;
  localStorage.setItem(LS_NAME, myName);

  var dateStr = document.getElementById('startDate').value.replace(/-/g, '');
  // sessionKey = DDMMYY_Branch
  sessionKey = dateStr.substring(6, 8) + dateStr.substring(4, 6) + dateStr.substring(2, 4) + '_' + myBranch;

  if (!db) { showFeedback('Firebase belum dikonfigurasi. Cek firebaseConfig di JS.'); return; }

  db.ref('sessions/' + sessionKey + '/meta').once('value').then(function(snap) {
    if (snap.exists()) {
      sessionMeta = snap.val();
      attachRealtime();
      showScreen('list');
      renderList();
    } else {
      document.getElementById('startSection').classList.add('show');
      showFeedback('Belum ada sesi hari ini untuk branch ini. Silakan buat sesi baru.');
    }
  }).catch(function(err) {
    showFeedback('Gagal konek Firebase: ' + err.message);
  });
}

function showFeedback(msg) {
  var el = document.getElementById('lobbyFeedback');
  el.textContent = msg;
  el.classList.add('show');
  el.style.color = 'var(--warning)';
}

function updateConnectionStatus() {
  var fb = document.getElementById('lobbyFeedback');
  var cs = document.getElementById('connStatus');
  if (!cs) return;

  if (firebaseReady) {
    fb.classList.remove('show');
    cs.className = 'conn-status connected';
    cs.querySelector('.conn-text').textContent = 'Terhubung ke Firebase';
  } else if (firebaseError) {
    cs.className = 'conn-status error';
    cs.querySelector('.conn-text').textContent = firebaseError;
  } else {
    cs.className = 'conn-status';
    cs.querySelector('.conn-text').textContent = 'Menghubungkan ke Firebase...';
  }
}

function enterLobby() {
  var name = document.getElementById('lobbyName').value.trim();
  var branch = document.getElementById('lobbyBranch').value.trim();
  if (!name) { showFeedback('Nama Anda wajib diisi'); return; }
  if (!branch) { showFeedback('Branch wajib diisi'); return; }

  if (!firebaseReady) {
    showFeedback(firebaseError || 'Firebase belum siap. Tunggu koneksi atau cek konfigurasi.');
    return;
  }

  myName = name;
  myBranch = branch;
  localStorage.setItem(LS_NAME, myName);

  var dateStr = document.getElementById('startDate').value.replace(/-/g, '');
  // sessionKey = DDMMYY_Branch
  sessionKey = dateStr.substring(6, 8) + dateStr.substring(4, 6) + dateStr.substring(2, 4) + '_' + myBranch;

  db.ref('sessions/' + sessionKey + '/meta').once('value').then(function(snap) {
    if (snap.exists()) {
      sessionMeta = snap.val();
      attachRealtime();
      showScreen('list');
      renderList();
    } else {
      document.getElementById('startSection').classList.add('show');
      showFeedback('Belum ada sesi hari ini untuk branch ini. Silakan buat sesi baru.');
    }
  }).catch(function(err) {
    var msg = err.message || '';
    if (msg.indexOf('PERMISSION_DENIED') >= 0) {
      showFeedback('Akses Firebase ditolak. Pastikan Realtime Database rules di-set ke: { "rules": { ".read": true, ".write": true } }');
    } else if (msg.indexOf('NETWORK') >= 0 || msg.indexOf('network') >= 0) {
      showFeedback('Gagal koneksi jaringan ke Firebase. Cek koneksi internet.');
    } else {
      showFeedback('Gagal konek Firebase: ' + msg);
    }
  });
}

function createSession() {
  var date = document.getElementById('startDate').value;
  var manager = document.getElementById('startManager').value.trim();
  var checkedBy = document.getElementById('startCheckedBy').value.trim();
  if (!date) { showFeedback('Date wajib diisi'); return; }
  if (!checkedBy) { showFeedback('Checked By wajib diisi'); return; }

  var dateStr = date.replace(/-/g, '');
  sessionKey = dateStr.substring(6, 8) + dateStr.substring(4, 6) + dateStr.substring(2, 4) + '_' + myBranch;

  sessionMeta = {
    date: date,
    branch: myBranch,
    manager: manager,
    checkedBy: checkedBy,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };

  // Initialize all 31 items with empty state
  var items = {};
  for (var i = 0; i < TOTAL_ITEMS; i++) {
    items[i] = {
      photoBase64: '',
      photoChecked: 'N',
      issue: 'N',
      forcedC: 'N',
      comment: '',
      lastEditedBy: '',
      updatedAt: 0
    };
  }

  db.ref('sessions/' + sessionKey).set({
    meta: sessionMeta,
    items: items,
    editing: {},
    presence: {}
  }).then(function() {
    attachRealtime();
    showScreen('list');
    renderList();
    showToast('Sesi berhasil dibuat!');
  }).catch(function(err) {
    showFeedback('Gagal buat sesi: ' + err.message);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// REALTIME ATTACH
// ═══════════════════════════════════════════════════════════════════════════
function attachRealtime() {
  sessionRef = db.ref('sessions/' + sessionKey);
  itemsRef = sessionRef.child('items');
  editingRef = sessionRef.child('editing');
  presenceRef = sessionRef.child('presence');

  // Own presence
  var safeName = sanitizeKey(myName);
  presenceRef.child(safeName).set(true);
  presenceRef.child(safeName).onDisconnect().remove();

  // Items listener
  itemsRef.on('value', function(snap) {
    itemsData = snap.val() || {};
    if (document.getElementById('screen-list').classList.contains('active')) {
      renderList();
    }
    if (document.getElementById('screen-detail').classList.contains('active') && editingIdx >= 0) {
      renderDetail();
    }
    updateProgress();
  });

  // Editing state listener
  editingRef.on('value', function(snap) {
    editingData = snap.val() || {};
    cleanExpiredEditing();
    if (document.getElementById('screen-detail').classList.contains('active') && editingIdx >= 0) {
      renderDetail();
    }
    if (document.getElementById('screen-list').classList.contains('active')) {
      renderList();
    }
  });

  // Presence listener
  presenceRef.on('value', function(snap) {
    presenceData = snap.val() || {};
    updateOnlineCount();
  });

  // Meta listener (in case it changes)
  sessionRef.child('meta').on('value', function(snap) {
    if (snap.exists()) sessionMeta = snap.val();
    if (document.getElementById('screen-list').classList.contains('active')) {
      renderList();
    }
  });
}

function detachRealtime() {
  if (itemsRef) itemsRef.off();
  if (editingRef) editingRef.off();
  if (presenceRef) presenceRef.off();
  if (sessionRef) sessionRef.child('meta').off();
}

function cleanExpiredEditing() {
  var now = Date.now();
  var keys = Object.keys(editingData);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = editingData[k];
    if (v && (now - v.time) > 90000) {
      editingRef.child(k).remove();
    }
  }
}

function sanitizeKey(name) {
  return name.replace(/[.#$/[\]]/g, '_');
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS & ONLINE
// ═══════════════════════════════════════════════════════════════════════════
function updateProgress() {
  var photoCount = 0;
  for (var i = 0; i < TOTAL_ITEMS; i++) {
    if (itemsData[i] && itemsData[i].photoChecked === 'Y') photoCount++;
  }
  var pct = Math.round((photoCount / TOTAL_ITEMS) * 100);
  var labels = ['progressText', 'detailProgressText'];
  var fills = ['progressFill', 'detailProgressFill'];
  for (var j = 0; j < labels.length; j++) {
    var el = document.getElementById(labels[j]);
    if (el) el.textContent = photoCount + '/' + TOTAL_ITEMS + ' foto';
  }
  for (var k = 0; k < fills.length; k++) {
    var fl = document.getElementById(fills[k]);
    if (fl) fl.style.width = pct + '%';
  }
}

function updateOnlineCount() {
  var count = Object.keys(presenceData).length;
  var dot = document.getElementById('onlineDot');
  var cnt = document.getElementById('onlineCount');
  if (dot) dot.style.background = count > 0 ? 'var(--success)' : 'var(--text3)';
  if (cnt) cnt.textContent = count + ' online';
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEM LIST RENDERING
// ═══════════════════════════════════════════════════════════════════════════
function renderList() {
  if (!sessionMeta) return;

  document.getElementById('listTitle').textContent = sessionMeta.branch + ' Checklist';
  document.getElementById('listMeta').textContent =
    formatDate(sessionMeta.date) + ' \u00B7 Manager: ' + (sessionMeta.manager || '-') +
    ' \u00B7 Checked by: ' + sessionMeta.checkedBy;

  var html = '';
  var currentCat = '';
  for (var i = 0; i < ALL_ITEMS.length; i++) {
    var item = ALL_ITEMS[i];
    if (item.category !== currentCat) {
      currentCat = item.category;
      html += '<div class="cat-divider">' + currentCat + '</div>';
    }

    var data = itemsData[i] || {};
    var photoChecked = data.photoChecked || 'N';
    var stateClass = 'state-pending';
    var icon = '\u25CB';
    var iconClass = 'pending';
    if (photoChecked === 'Y') {
      stateClass = 'state-done'; icon = '\u2713'; iconClass = 'done';
    } else if (photoChecked === 'N' && data.updatedAt) {
      stateClass = 'state-skip'; icon = '\u26A0'; iconClass = 'skip';
    }

    var badges = '';
    if (data.issue === 'Y') badges += '<span class="badge badge-issue">ISSUE</span>';
    if (data.forcedC === 'Y') badges += '<span class="badge badge-forced">FORCED C</span>';

    var editorInfo = '';
    var ed = editingData[i];
    if (ed && ed.name && ed.name !== myName) {
      editorInfo = '<div class="info-editor">Diedit oleh ' + escHTML(ed.name) + '</div>';
    }

    html += '<div class="item-row ' + stateClass + '" onclick="openDetail(' + i + ')">';
    html += '<span class="status-icon ' + iconClass + '">' + icon + '</span>';
    html += '<div class="info">';
    html += '<div class="info-name">' + escHTML(item.name) + '</div>';
    html += '<div class="info-id">' + escHTML(item.nameId) + '</div>';
    html += editorInfo;
    html += '</div>';
    html += '<div class="badges">' + badges + '</div>';
    html += '</div>';
  }

  document.getElementById('listContent').innerHTML = html;

  // Export button
  var photoCount = 0;
  for (var j = 0; j < TOTAL_ITEMS; j++) {
    if (itemsData[j] && itemsData[j].photoChecked === 'Y') photoCount++;
  }
  var exportArea = document.getElementById('exportArea');
  if (photoCount >= 20) {
    exportArea.innerHTML = '<button class="btn btn-primary btn-block" onclick="exportExcel()">Download Excel</button>';
  } else {
    exportArea.innerHTML = '<div class="warning-inline">Minimal 20/31 item memiliki foto untuk export (' + photoCount + '/31 saat ini)</div>';
  }

  updateProgress();
  updateOnlineCount();
}

// ═══════════════════════════════════════════════════════════════════════════
// ITEM DETAIL
// ═══════════════════════════════════════════════════════════════════════════
function openDetail(idx) {
  // Move editing flag atomically: remove old, set new
  if (editingIdx >= 0 && editingIdx !== idx && editingRef) {
    editingRef.child(String(editingIdx)).remove();
  }
  editingIdx = idx;
  showScreen('detail');

  if (editingRef) {
    var edRef = editingRef.child(String(idx));
    edRef.set({ name: myName, time: Date.now() });
    edRef.onDisconnect().remove();
  }

  renderDetail();
  updateProgress();
}

function clearEditing() {
  if (editingIdx >= 0 && editingRef) {
    editingRef.child(String(editingIdx)).remove();
  }
  editingIdx = -1;
}

function navigateDetail(delta) {
  var newIdx = editingIdx + delta;
  if (newIdx < 0 || newIdx >= TOTAL_ITEMS) return;
  openDetail(newIdx);
}

function backToList() {
  clearEditing();
  showScreen('list');
  renderList();
}

function renderDetail() {
  if (editingIdx < 0) return;
  var idx = editingIdx;
  var item = ALL_ITEMS[idx];
  var data = itemsData[idx] || {};
  var card = document.getElementById('itemCard');
  var nav = document.getElementById('detailNav');
  var prevDis = idx === 0 ? 'disabled style="opacity:0.4"' : '';
  var nextDis = idx === TOTAL_ITEMS - 1 ? 'disabled style="opacity:0.4"' : '';

  var editingByOthers = '';
  var ed = editingData[idx];
  if (ed && ed.name && ed.name !== myName) {
    editingByOthers = '<div class="editing-badge">Sedang diedit oleh ' + escHTML(ed.name) + '</div>';
  }

  var lastEdit = data.lastEditedBy
    ? '<div class="last-edited">Terakhir: ' + escHTML(data.lastEditedBy) + ' \u00B7 ' + formatTime(data.updatedAt) + '</div>'
    : '';

  var hasPhoto = data.photoBase64 && data.photoBase64.length > 100;

  card.innerHTML =
    '<div class="item-header">' +
      '<div class="item-category">' + escHTML(item.category) + '</div>' +
      '<div class="item-name">' + escHTML(item.name) + '</div>' +
      '<div class="item-name-id">' + escHTML(item.nameId) + '</div>' +
      editingByOthers +
      lastEdit +
    '</div>' +
    '<div class="photo-area' + (hasPhoto ? ' has-photo' : '') + '" id="photoArea" onclick="triggerPhoto()">' +
      (hasPhoto
        ? '<img src="' + data.photoBase64 + '" alt="Photo">'
        : '<div class="photo-placeholder"><span class="icon">&#128247;</span><span>Tap untuk ambil foto</span></div>'
      ) +
      (hasPhoto
        ? '<div class="photo-actions">' +
            '<button onclick="event.stopPropagation();retakePhoto()" title="Ulang">&#8635;</button>' +
            '<button onclick="event.stopPropagation();deletePhoto()" title="Hapus">&#10005;</button>' +
          '</div>'
        : '') +
    '</div>' +
    '<div class="toggle-group">' +
      '<span class="toggle-label">Issue?</span>' +
      '<div class="toggle-row">' +
        '<button class="toggle-btn' + (data.issue === 'N' ? ' active-n' : '') + '" onclick="setToggle(\'issue\',\'N\')">N</button>' +
        '<button class="toggle-btn' + (data.issue === 'Y' ? ' active-y' : '') + '" onclick="setToggle(\'issue\',\'Y\')">Y</button>' +
      '</div>' +
    '</div>' +
    '<div class="toggle-group">' +
      '<span class="toggle-label">Forced C?</span>' +
      '<div class="toggle-row">' +
        '<button class="toggle-btn' + (data.forcedC === 'N' ? ' active-n' : '') + '" onclick="setToggle(\'forcedC\',\'N\')">N</button>' +
        '<button class="toggle-btn' + (data.forcedC === 'Y' ? ' active-y' : '') + '" onclick="setToggle(\'forcedC\',\'Y\')">Y</button>' +
      '</div>' +
    '</div>' +
    '<div class="toggle-group">' +
      '<span class="toggle-label">Comment (maks 200 karakter)</span>' +
      '<textarea id="detailComment" maxlength="200" placeholder="Tulis catatan..." onblur="saveComment(this.value)">' + escHTML(data.comment || '') + '</textarea>' +
    '</div>';

  nav.innerHTML =
    '<div class="detail-nav-layout">' +
      '<button class="btn btn-nav-prev" onclick="navigateDetail(-1)" ' + prevDis + '>&larr; Sebelumnya</button>' +
      '<button class="btn btn-nav-list" onclick="backToList()">&#9776; List</button>' +
      '<button class="btn btn-nav-next" onclick="navigateDetail(1)" ' + nextDis + '>Selanjutnya &rarr;</button>' +
    '</div>';
}

function setToggle(field, value) {
  if (editingIdx < 0 || !itemsRef) return;
  if (field === 'forcedC' && value === 'Y') {
    var cur = itemsData[editingIdx];
    if (cur && cur.forcedC !== 'Y' && !confirm('Yakin ini Forced C?')) return;
  }
  var update = {};
  update[field] = value;
  update.lastEditedBy = myName;
  update.updatedAt = firebase.database.ServerValue.TIMESTAMP;
  itemsRef.child(String(editingIdx)).update(update);
}

function saveComment(val) {
  if (editingIdx < 0 || !itemsRef) return;
  itemsRef.child(String(editingIdx)).update({
    comment: val,
    lastEditedBy: myName,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PHOTO HANDLING WITH TIMESTAMP WATERMARK
// ═══════════════════════════════════════════════════════════════════════════
function triggerPhoto() {
  document.getElementById('photoInput').click();
}

function handlePhotoSelect(e) {
  var file = e.target.files[0];
  if (!file || editingIdx < 0 || !itemsRef) { e.target.value = ''; return; }

  var item = ALL_ITEMS[editingIdx];
  var itemName = item.name;

  processPhotoWithWatermark(file, itemName, function(dataUrl) {
    itemsRef.child(String(editingIdx)).update({
      photoBase64: dataUrl,
      photoChecked: 'Y',
      lastEditedBy: myName,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  });

  e.target.value = '';
}

function processPhotoWithWatermark(file, itemName, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      // Resize to storage dimensions
      var w = img.width, h = img.height;
      if (w > PHOTO_MAX_W) { h = h * (PHOTO_MAX_W / w); w = PHOTO_MAX_W; }
      if (h > PHOTO_MAX_H) { w = w * (PHOTO_MAX_H / h); h = PHOTO_MAX_H; }

      var canvas = document.createElement('canvas');
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Add timestamp watermark
      addWatermark(canvas, itemName);

      var dataUrl = canvas.toDataURL('image/jpeg', PHOTO_QUALITY);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function addWatermark(canvas, itemName) {
  var ctx = canvas.getContext('2d');
  var now = new Date();
  var dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  var timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var branch = myBranch;
  if (sessionMeta && sessionMeta.branch) branch = sessionMeta.branch;
  var text = 'JJIKGO | ' + dateStr + ' ' + timeStr + ' | ' + branch + ' | ' + itemName;

  var barHeight = Math.max(28, Math.round(canvas.height * 0.06));
  var fontSize = Math.max(11, Math.round(canvas.width * 0.016));

  // Semi-transparent black bar at bottom
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

  // Thin gold line above the bar
  ctx.fillStyle = '#C9A84C';
  ctx.fillRect(0, canvas.height - barHeight - 2, canvas.width, 2);

  // Timestamp text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold ' + fontSize + 'px ' + getFontStack();
  ctx.textBaseline = 'middle';

  // Truncate text if too long
  var maxWidth = canvas.width - 16;
  var displayText = text;
  while (ctx.measureText(displayText).width > maxWidth && displayText.length > 20) {
    displayText = displayText.substring(0, displayText.length - 4) + '...';
  }
  ctx.fillText(displayText, 8, canvas.height - barHeight / 2);
}

function getFontStack() {
  return 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
}

function retakePhoto() {
  triggerPhoto();
}

function deletePhoto() {
  if (editingIdx < 0 || !itemsRef) return;
  itemsRef.child(String(editingIdx)).update({
    photoBase64: '',
    photoChecked: 'N',
    lastEditedBy: myName,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT — HD PHOTOS
// ═══════════════════════════════════════════════════════════════════════════
function exportExcel() {
  var btn = document.querySelector('#exportArea .btn-primary');
  if (!btn) return;
  btn.textContent = 'Generating...';
  btn.disabled = true;

  // Fetch latest data fresh
  itemsRef.once('value').then(function(snap) {
    var data = snap.val() || {};
    return buildExcel(data);
  }).then(function(buffer) {
    var parts = sessionMeta.date.split('-');
    var fname = parts[2] + parts[1] + parts[0].substring(2) +
      '_JJIKGO_Cleanliness_Checklist_' +
      (sessionMeta.checkedBy || 'Staff').replace(/[^a-zA-Z0-9]/g, '_') + '.xlsx';
    downloadBlob(buffer, fname,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast('Excel berhasil didownload!');
  }).catch(function(e) {
    console.error(e);
    showToast('Gagal export: ' + e.message);
  }).finally(function() {
    btn.textContent = 'Download Excel';
    btn.disabled = false;
  });
}

function buildExcel(data) {
  return new Promise(function(resolve, reject) {
    try {
      var workbook = new ExcelJS.Workbook();
      var ws = workbook.addWorksheet('JJIKGO Cleanliness Checklist');

      ws.getColumn('A').width = 22;
      ws.getColumn('B').width = 30;
      ws.getColumn('C').width = 8;
      ws.getColumn('D').width = 8;
      ws.getColumn('E').width = 16;
      ws.getColumn('F').width = 9;
      ws.getColumn('G').width = 11;
      ws.getColumn('H').width = 28;
      ws.getColumn('I').width = 22;

      // Display size for images in Excel — small & neat, but source is HD
      var IMG_DISPLAY_W = 120;
      var IMG_DISPLAY_H = 90;
      var IMG_ROW_HEIGHT = 72;

      // Row 1 — Title
      ws.mergeCells('A1:I1');
      var t = ws.getCell('A1');
      t.value = 'JJIKGO DAILY CLEANLINESS CHECKLIST';
      t.font = { bold: true, size: 16, color: { argb: 'FF000000' } };
      t.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      // Row 2 — Header info
      ws.getCell('A2').value = 'Date';
      ws.getCell('B2').value = sessionMeta.date;
      ws.getCell('C2').value = 'Branch';
      ws.getCell('D2').value = sessionMeta.branch;
      ws.getCell('E2').value = 'Manager';
      ws.getCell('F2').value = sessionMeta.manager;
      ws.getCell('H2').value = 'Checked By';
      ws.getCell('I2').value = sessionMeta.checkedBy;
      ['A2', 'C2', 'E2', 'H2'].forEach(function(c) {
        ws.getCell(c).font = { bold: true, size: 11 };
      });
      ws.getRow(2).height = 22;
      ws.getRow(3).height = 6;

      // Row 4 — Column headers
      var headers = ['Category', 'Checklist Item', 'Point', 'Score', 'Photo Checked', 'Issue?', 'Forced C?', 'Comment', 'Photo'];
      headers.forEach(function(h, i) {
        var c = ws.getCell(4, i + 1);
        c.value = h;
        c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      ws.getRow(4).height = 28;

      // Rows 5–35 — Data
      var imageJobs = [];
      for (var i = 0; i < TOTAL_ITEMS; i++) {
        var row = 5 + i;
        var item = ALL_ITEMS[i];
        var d = data[i] || {};

        ws.getCell(row, 1).value = item.category;
        ws.getCell(row, 2).value = item.name + '\n(' + item.nameId + ')';
        ws.getCell(row, 3).value = 5;
        ws.getCell(row, 4).value = null;
        ws.getCell(row, 5).value = d.photoChecked || 'N';
        ws.getCell(row, 6).value = d.issue || 'N';
        ws.getCell(row, 7).value = d.forcedC || 'N';
        ws.getCell(row, 8).value = d.comment || '';

        for (var c = 1; c <= 9; c++) {
          var cell = ws.getCell(row, c);
          cell.font = { size: 10 };
          cell.alignment = { vertical: 'middle', wrapText: c === 8 };
          cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        }
        [3, 4, 5, 6, 7].forEach(function(c) {
          ws.getCell(row, c).alignment = { horizontal: 'center', vertical: 'middle' };
        });
        ws.getRow(row).height = 22;

        if (d.photoBase64 && d.photoBase64.length > 100) {
          imageJobs.push({ row: row, dataUrl: d.photoBase64 });
        }
      }

      // Summary rows
      var sr = 5 + TOTAL_ITEMS; // row 36
      ws.getCell(sr, 1).value = 'TOTAL POINT';
      ws.getCell(sr, 1).font = { bold: true, size: 11 };
      ws.getCell(sr, 3).value = { formula: 'SUM(C5:C' + (sr - 1) + ')' };
      ws.getCell(sr, 3).font = { bold: true, size: 11 };
      ws.getCell(sr, 3).alignment = { horizontal: 'center' };
      ws.getRow(sr).height = 22;

      ws.getCell(sr + 1, 1).value = 'TOTAL SCORE';
      ws.getCell(sr + 1, 1).font = { bold: true, size: 11 };
      ws.getCell(sr + 1, 4).value = { formula: 'SUM(D5:D' + (sr - 1) + ')' };
      ws.getCell(sr + 1, 4).font = { bold: true, size: 11 };
      ws.getCell(sr + 1, 4).alignment = { horizontal: 'center' };
      ws.getRow(sr + 1).height = 22;

      ws.getCell(sr + 2, 1).value = 'PERSENTASE';
      ws.getCell(sr + 2, 1).font = { bold: true, size: 11 };
      ws.getCell(sr + 2, 4).value = { formula: '(D' + (sr + 1) + '/C' + sr + ')*100' };
      ws.getCell(sr + 2, 4).numFormat = '0.00"%"';
      ws.getCell(sr + 2, 4).font = { bold: true, size: 11 };
      ws.getCell(sr + 2, 4).alignment = { horizontal: 'center' };
      ws.getRow(sr + 2).height = 22;

      ws.getCell(sr + 3, 1).value = 'GRADE';
      ws.getCell(sr + 3, 1).font = { bold: true, size: 11 };
      ws.getCell(sr + 3, 4).value = { formula: 'IF(D' + (sr + 2) + '>=90,"A",IF(D' + (sr + 2) + '>=75,"B","C"))' };
      ws.getCell(sr + 3, 4).font = { bold: true, size: 11 };
      ws.getCell(sr + 3, 4).alignment = { horizontal: 'center' };
      ws.getRow(sr + 3).height = 22;

      // Forced C Conditions
      var fr = sr + 5;
      ws.getCell(fr, 1).value = 'FORCED C CONDITIONS';
      ws.getCell(fr, 1).font = { bold: true, size: 11 };
      var conditions = ['Toilet bad smell', 'Photo booth bad smell', 'Customer complaint', 'Severe floor dirt', 'Trash overflow'];
      conditions.forEach(function(cond, ci) {
        ws.getCell(fr + 1 + ci, 1).value = '- ' + cond;
        ws.getCell(fr + 1 + ci, 1).font = { size: 10, color: { argb: 'FF666666' } };
      });

      // Embed photos — original full-res source, small neat display
      if (imageJobs.length === 0) {
        resolve(workbook.xlsx.writeBuffer());
        return;
      }

      var completed = 0;
      imageJobs.forEach(function(job) {
        // Extract base64 from data URL — no re-encode, preserves full resolution
        var b64 = job.dataUrl.split(',')[1];
        if (!b64) { completed++; checkDone(); return; }

        try {
          var imageId = workbook.addImage({ base64: b64, extension: 'jpeg' });
          ws.addImage(imageId, {
            tl: { col: 8, row: job.row - 1 },
            ext: { width: IMG_DISPLAY_W, height: IMG_DISPLAY_H }
          });
          ws.getRow(job.row).height = IMG_ROW_HEIGHT;
        } catch (imgErr) {
          ws.getCell(job.row, 9).value = '[Image error]';
        }
        completed++;
        checkDone();
      });

      function checkDone() {
        if (completed === imageJobs.length) {
          resolve(workbook.xlsx.writeBuffer());
        }
      }
    } catch (e) {
      reject(e);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK JUMP
// ═══════════════════════════════════════════════════════════════════════════
function openQuickJump() {
  var body = document.getElementById('qjBody');
  var html = '';
  var currentCat = '';

  for (var i = 0; i < ALL_ITEMS.length; i++) {
    var item = ALL_ITEMS[i];
    if (item.category !== currentCat) {
      currentCat = item.category;
      html += '<div class="qj-cat">' + currentCat + '</div>';
    }
    var d = itemsData[i] || {};
    var icon = '\u25CB', cls = '';
    if (d.photoChecked === 'Y') { icon = '\u2713'; cls = 'color:var(--success)'; }
    else if (d.photoChecked === 'N' && d.updatedAt) { icon = '\u26A0'; cls = 'color:var(--warning)'; }
    else { cls = 'color:var(--text3)'; }
    html +=
      '<div class="qj-item" onclick="quickJumpTo(' + i + ')">' +
        '<span class="qj-num">#' + (i + 1) + '</span>' +
        '<span class="qj-name">' + escHTML(item.name) + '<span class="qj-name-id">' + escHTML(item.nameId) + '</span></span>' +
        '<span class="qj-stat" style="' + cls + '">' + icon + '</span>' +
      '</div>';
  }

  body.innerHTML = html;
  document.getElementById('qjOverlay').classList.add('show');

  setTimeout(function() {
    var targetIdx = editingIdx >= 0 ? editingIdx : 0;
    var items = body.querySelectorAll('.qj-item');
    if (items[targetIdx]) items[targetIdx].scrollIntoView({ block: 'center' });
  }, 100);
}

function closeQuickJump() {
  document.getElementById('qjOverlay').classList.remove('show');
}

function quickJumpTo(idx) {
  closeQuickJump();
  clearEditing();
  openDetail(idx);
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════════════
function showModal(html) {
  document.getElementById('modalSheet').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function escHTML(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

function formatDate(d) {
  if (!d) return '';
  var parts = d.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function downloadBlob(data, filename, mime) {
  var blob = new Blob([data], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
