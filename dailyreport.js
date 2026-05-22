// ═══════════════════════════════════════════════════════════════════════════
// JJIKGO Daily Report Tool — Logic
// ═══════════════════════════════════════════════════════════════════════════

var MENU_CATEGORIES = [
  { name:'NON COFFEE', items:['Taro Latte','Matcha Latte'] },
  { name:'GREEN TEA', items:['Lychee Green Tea','Lemon Green Tea','Mango Green Tea'] },
  { name:'MILK TEA', items:['Brown Sugar Milk Tea','Caramel Milk Tea','Hazelnut Milk Tea','Taro Milk Tea','Vanilla Milk Tea'] },
  { name:'SIDE DISH', items:['Chicken Nugget','French Fries','Sosis','Mix Platter','Snack Set A','Snack Set B','Taro','Cheetos'] }
];

var ALL_MENU = [];
MENU_CATEGORIES.forEach(function(cat){ cat.items.forEach(function(m){ ALL_MENU.push(m); }); });

var BOOTH_TYPES = ['Red Box','Teddy Bear','Vintage Album','Vintage Vinyl','Vintage Hotel','Vintage Elevator','Supermarket','Subway','Pas Foto'];

var EQUIPMENT = ['Camera','Monitor','PC','Mouse','AC'];
var CLEANING = ['Booth Cleaning','Toilet Cleaning','Floor Mopping','Glass Cleaning','Trash Disposal','Warehouse Arrangement'];
var MARKETING = ['Instagram Reel Upload','Instagram Story Upload','TikTok Upload','Google Review Request','Promotion Running'];

var LS_SETTINGS = 'jjikgo_dr_settings';
var LS_DRAFT = 'jjikgo_dr_draft';
var LS_CUMULATIVE = 'jjikgo_dr_cumulative';
var FB_PATH = 'dailysettings/Serang';

var settings = {};
var cumulative = {};
var fbDB = null;

function initFirebase(){
  if(typeof firebase==='undefined') return;
  try{
    if(!firebase.apps||!firebase.apps.length) firebase.initializeApp({apiKey:"AIzaSyBNilwTxVcx4r1FECM12mVZ_yM2XhqLoX0",authDomain:"jjikgo-checklist.firebaseapp.com",databaseURL:"https://jjikgo-checklist-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"jjikgo-checklist"});
    fbDB = firebase.database();
  }catch(e){}
}

function syncSettingsToFirebase(){
  if(!fbDB) return;
  fbDB.ref(FB_PATH+'/settings').set(settings).catch(function(){});
}

function loadSettingsFromFirebase(callback){
  if(!fbDB){ callback(); return; }
  fbDB.ref(FB_PATH+'/settings').once('value').then(function(snap){
    if(snap.exists() && snap.val() && Object.keys(snap.val()).length>0){ settings = snap.val(); localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }
    return fbDB.ref(FB_PATH+'/cumulative').once('value');
  }).then(function(snap){
    if(snap.exists() && snap.val() && Object.keys(snap.val()).length>0){ cumulative = snap.val(); localStorage.setItem(LS_CUMULATIVE, JSON.stringify(cumulative)); }
    callback();
  }).catch(function(){ callback(); });
}

function saveCumulativeToFirebase(){
  if(fbDB) fbDB.ref(FB_PATH+'/cumulative').set(cumulative).catch(function(){});
}

function cumKey(day, date){
  return date.getFullYear()+'-'+(date.getMonth()+1)+'_'+day;
}

function currentMonthPrefix(){
  var t = new Date();
  return t.getFullYear()+'-'+(t.getMonth()+1)+'_';
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
(function init(){
  initFirebase();
  loadSettings();
  loadCumulative();
  loadSettingsFromFirebase(function(){
    loadSettings();
    loadCumulative();
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('rDate').value = today;
    document.getElementById('rStore').value = settings.storeName || '';
    document.getElementById('rManager').value = settings.managerName || '';
    document.getElementById('rPreparedBy').value = settings.preparedBy || '';
    draft = getDraftFromStorage();
    renderAllReport();
    restoreDraftToDOM();
    switchTab('report');
  });
})();

// ═══════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════
function switchTab(name){
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(function(b){
    if(b.textContent.toLowerCase().indexOf(name)>=0) b.classList.add('active');
  });
  if(name==='report'){ restoreDraftToDOM(); updateAllTotals(); }
  if(name==='settings'){ renderAllSettings(); }
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS LOAD/SAVE
// ═══════════════════════════════════════════════════════════════════════════
function loadSettings(){
  var raw = localStorage.getItem(LS_SETTINGS);
  if(raw){
    try{ settings = JSON.parse(raw); }catch(e){}
  }
  if(!settings.storeName) settings.storeName = 'JJIKGO Serang';
  if(!settings.managerName) settings.managerName = 'M. Rohmanudin';
  if(!settings.preparedBy) settings.preparedBy = 'M. Rohmanudin';
  if(!settings.staff) settings.staff = [
    {name:'aldi',position:'Barista'},{name:'noval',position:'Staff Photobooth'},
    {name:'huril',position:'Barista'},{name:'saldi',position:'Staff Photobooth'},
    {name:'dito',position:'Barista'},{name:'reyvan',position:'Staff Photobooth'},
    {name:'Rohman',position:'Manager'}
  ];
  if(!settings.menuPrices) settings.menuPrices = {};
  ALL_MENU.forEach(function(m){ if(!settings.menuPrices[m]) settings.menuPrices[m]=0; });
  if(!settings.boothPrices) settings.boothPrices = {};
  BOOTH_TYPES.forEach(function(b){ if(!settings.boothPrices[b]) settings.boothPrices[b]=0; });
}

function saveSettings(){
  settings.storeName = document.getElementById('sStore').value.trim();
  settings.managerName = document.getElementById('sManager').value.trim();
  settings.preparedBy = document.getElementById('sPreparedBy').value.trim();
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  syncSettingsToFirebase();
  document.getElementById('rStore').value = settings.storeName;
  document.getElementById('rManager').value = settings.managerName;
  document.getElementById('rPreparedBy').value = settings.preparedBy;
  renderAllReport();
  updateAllTotals();
  showToast('Settings disimpan & di-sync');
}

function loadCumulative(){
  var raw = localStorage.getItem(LS_CUMULATIVE);
  if(raw){ try{ cumulative = JSON.parse(raw); }catch(e){} }
  var migrated = false;
  var prefix = currentMonthPrefix();
  for(var k in cumulative){
    if(/^\d+$/.test(k)){
      cumulative[prefix+k] = cumulative[k];
      delete cumulative[k];
      migrated = true;
    }
  }
  if(migrated){ localStorage.setItem(LS_CUMULATIVE, JSON.stringify(cumulative)); }
}

function saveCumulative(){
  localStorage.setItem(LS_CUMULATIVE, JSON.stringify(cumulative));
  saveCumulativeToFirebase();
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS RENDERING
// ═══════════════════════════════════════════════════════════════════════════
function renderAllSettings(){
  document.getElementById('sStore').value = settings.storeName || '';
  document.getElementById('sManager').value = settings.managerName || '';
  document.getElementById('sPreparedBy').value = settings.preparedBy || '';
  renderStaffList();
  renderMenuPrices();
  renderBoothPrices();
  renderCumulativeTable();
}

function renderStaffList(){
  var html='';
  settings.staff.forEach(function(s,i){
    html+='<div class="staff-row"><input value="'+esc(s.name)+'" onchange="updateStaff('+i+',\'name\',this.value)"><select onchange="updateStaff('+i+',\'position\',this.value)"><option value="Barista"'+(s.position==='Barista'?' selected':'')+'>Barista</option><option value="Staff Photobooth"'+(s.position==='Staff Photobooth'?' selected':'')+'>Staff Photobooth</option><option value="Manager"'+(s.position==='Manager'?' selected':'')+'>Manager</option></select><button class="tbl-del" onclick="deleteStaff('+i+')">×</button></div>';
  });
  document.getElementById('staffList').innerHTML=html;
}

function addStaff(){ settings.staff.push({name:'',position:'Barista'}); renderStaffList(); }
function updateStaff(i,field,val){ settings.staff[i][field]=val; }
function deleteStaff(i){ settings.staff.splice(i,1); renderStaffList(); }

function renderMenuPrices(){
  var html='';
  MENU_CATEGORIES.forEach(function(cat){
    html+='<div class="sub">'+cat.name+'</div>';
    cat.items.forEach(function(m){
      html+='<div class="tbl-row"><span class="tbl-name">'+m+'</span><input type="number" value="'+(settings.menuPrices[m]||0)+'" onchange="settings.menuPrices[\''+esc(m)+'\']=+this.value" style="width:90px"> <span style="font-size:12px;color:var(--text3)">IDR</span></div>';
    });
  });
  document.getElementById('menuPriceList').innerHTML=html;
}

function renderBoothPrices(){
  var html='';
  BOOTH_TYPES.forEach(function(b){
    html+='<div class="tbl-row"><span class="tbl-name">'+b+'</span><input type="number" value="'+(settings.boothPrices[b]||0)+'" onchange="settings.boothPrices[\''+esc(b)+'\']=+this.value" style="width:90px"> <span style="font-size:12px;color:var(--text3)">IDR</span></div>';
  });
  document.getElementById('boothPriceList').innerHTML=html;
}

// ═══════════════════════════════════════════════════════════════════════════
// CUMULATIVE TABLE
// ═══════════════════════════════════════════════════════════════════════════
function renderCumulativeTable(){
  var today = new Date();
  var days = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  var html='<div class="tbl-row" style="font-weight:700"><span style="width:50px">Tgl</span><span style="flex:1">Revenue</span><span style="flex:1">Expense</span></div>';
  for(var d=1;d<=days;d++){
    var key = cumKey(d, today);
    var rev = cumulative[key] ? cumulative[key].revenue||0 : 0;
    var exp = cumulative[key] ? cumulative[key].expense||0 : 0;
    html+='<div class="tbl-row"><span style="width:50px;font-size:12px">'+d+'</span><input type="number" value="'+rev+'" onchange="setCumulative('+d+',\'revenue\',+this.value)" style="flex:1"><input type="number" value="'+exp+'" onchange="setCumulative('+d+',\'expense\',+this.value)" style="flex:1"></div>';
  }
  document.getElementById('cumulativeTable').innerHTML=html;
}

function setCumulative(day,field,val){
  var today = new Date();
  var key = cumKey(day, today);
  if(!cumulative[key]) cumulative[key]={revenue:0,expense:0};
  cumulative[key][field]=val;
  saveCumulative();
}

function recalcCumulative(){ renderCumulativeTable(); }

// ═══════════════════════════════════════════════════════════════════════════
// REPORT RENDERING
// ═══════════════════════════════════════════════════════════════════════════
function renderAllReport(){
  renderCafeTable();
  renderBoothTable();
  renderCumulativeDisplay();
  renderExpenseList();
  renderRefundList();
  renderShiftLists();
  renderInventoryList();
  renderComplaintList();
  renderToggles();
  updateSalaryInfo();
}

function renderCafeTable(){
  var html='';
  MENU_CATEGORIES.forEach(function(cat){
    html+='<div class="sub">'+cat.name+'</div>';
    cat.items.forEach(function(m){
      var price = settings.menuPrices[m]||0;
      var qty = reportQty(m);
      var rev = qty*price;
      html+='<div class="tbl-row"><span class="tbl-name">'+m+'</span><span class="tbl-qty"><div class="qty-ctrl"><button onclick="deltaQty(\''+escJS(m)+'\',-1)">-</button><input type="number" id="qty_'+sanitize(m)+'" value="'+qty+'" min="0" onchange="setQty(\''+escJS(m)+'\',+this.value)"><button onclick="deltaQty(\''+escJS(m)+'\',1)">+</button></div></span><span class="tbl-rev">'+fmt(rev)+'</span><input class="tbl-remark" placeholder="Remark" id="rmk_'+sanitize(m)+'" value="'+esc(reportRemark(m))+'"></div>';
    });
  });
  document.getElementById('cafeSalesTable').innerHTML=html;
}

function renderBoothTable(){
  var html='';
  BOOTH_TYPES.forEach(function(b){
    var price = settings.boothPrices[b]||0;
    var qty = reportQty(b);
    var rev = qty*price;
    html+='<div class="tbl-row"><span class="tbl-name">'+b+'</span><span class="tbl-qty"><div class="qty-ctrl"><button onclick="deltaQty(\''+escJS(b)+'\',-1)">-</button><input type="number" id="qty_'+sanitize(b)+'" value="'+qty+'" min="0" onchange="setQty(\''+escJS(b)+'\',+this.value)"><button onclick="deltaQty(\''+escJS(b)+'\',1)">+</button></div></span><span class="tbl-rev">'+fmt(rev)+'</span></div>';
  });
  document.getElementById('boothSalesTable').innerHTML=html;
}

function updateAllTotals(){
  // Cafe total
  var cafeQty=0, cafeRev=0;
  ALL_MENU.forEach(function(m){ var q=reportQty(m); cafeQty+=q; cafeRev+=q*(settings.menuPrices[m]||0); });
  document.getElementById('cafeTotal').innerHTML='TOTAL: '+cafeQty+' transactions · IDR '+fmt(cafeRev);

  // Booth total
  var boothQty=0, boothRev=0;
  BOOTH_TYPES.forEach(function(b){ var q=reportQty(b); boothQty+=q; boothRev+=q*(settings.boothPrices[b]||0); });
  var selfRev = +(document.getElementById('rSelfRevenue')?document.getElementById('rSelfRevenue').value:0)||0;
  boothRev += selfRev;
  document.getElementById('boothTotal').innerHTML='TOTAL: '+boothQty+' transactions · IDR '+fmt(boothRev);

  // Expense total
  var expTotal = 0;
  var expRows = document.querySelectorAll('#expenseList .tbl-row input[type=number]');
  expRows.forEach(function(inp){ expTotal += (+inp.value||0); });
  document.getElementById('expenseTotal').innerHTML='Total Expense: IDR '+fmt(expTotal);

  updateSalaryInfo();
}

function updateSelfStudio(){ updateAllTotals(); }

function deltaQty(name, delta){
  var id = 'qty_'+sanitize(name);
  var el = document.getElementById(id);
  if(el){ el.value = Math.max(0, (+el.value||0)+delta); setQty(name, +el.value); }
}

function setQty(name,val){
  var id = 'qty_'+sanitize(name);
  var el = document.getElementById(id);
  if(el) el.value = Math.max(0, val||0);
  saveDraft();
  updateAllTotals();
}

function reportQty(name){
  var el = document.getElementById('qty_'+sanitize(name));
  return el ? (+el.value||0) : 0;
}

function reportRemark(name){
  var el = document.getElementById('rmk_'+sanitize(name));
  return el ? el.value : '';
}

function renderCumulativeDisplay(){
  var today = new Date();
  var days = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  var html='<div class="tbl-row" style="font-weight:700"><span style="width:50px">Tgl</span><span style="flex:1">Revenue</span><span style="flex:1">Expense</span></div>';
  var totalRev=0, totalExp=0;
  for(var d=1;d<=days;d++){
    var key=cumKey(d, today);
    var rev=cumulative[key]?cumulative[key].revenue||0:0;
    var exp=cumulative[key]?cumulative[key].expense||0:0;
    var isToday = d===today.getDate();
    if(rev===0 && exp===0 && !isToday) continue;
    totalRev+=rev; totalExp+=exp;
    html+='<div class="tbl-row'+(isToday?' style="background:rgba(201,168,76,0.1)"':'')+'"><span style="width:50px;font-size:12px">'+d+(isToday?' *':'')+'</span><span style="flex:1">'+fmt(rev)+'</span><span style="flex:1">'+fmt(exp)+'</span></div>';
  }
  html+='<div class="total-row">TOTAL: IDR '+fmt(totalRev)+' Revenue · IDR '+fmt(totalExp)+' Expense</div>';
  document.getElementById('cumulativeDisplay').innerHTML=html;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSE / REFUND
// ═══════════════════════════════════════════════════════════════════════════
function renderExpenseList(){
  var list = getReportList('expenses');
  var html='';
  list.forEach(function(e,i){
    html+='<div class="tbl-row"><input type="number" value="'+e.amount+'" placeholder="Nominal" onchange="updateExpense('+i+',\'amount\',+this.value)" style="width:100px"><input value="'+esc(e.desc||'')+'" placeholder="Keterangan" onchange="updateExpense('+i+',\'desc\',this.value)" style="flex:1"><button class="tbl-del" onclick="deleteExpense('+i+')">×</button></div>';
  });
  document.getElementById('expenseList').innerHTML=html;
}

function addExpense(){ var list=getReportList('expenses'); list.push({amount:0,desc:''}); saveDraft(); renderExpenseList(); }
function updateExpense(i,field,val){ var list=getReportList('expenses'); if(list[i]) list[i][field]=val; saveDraft(); updateAllTotals(); }
function deleteExpense(i){ var list=getReportList('expenses'); list.splice(i,1); saveDraft(); renderExpenseList(); updateAllTotals(); }

function renderRefundList(){
  var list = getReportList('refunds');
  var html='';
  list.forEach(function(v,i){
    html+='<div class="tbl-row"><span style="width:30px;font-size:12px;color:var(--text3)">'+(i+1)+'</span><input type="number" value="'+(v||'')+'" placeholder="Nominal Refund" onchange="updateRefund('+i+',+this.value)" style="flex:1"><button class="tbl-del" onclick="deleteRefund('+i+')">×</button></div>';
  });
  document.getElementById('refundList').innerHTML=html;
}

function addRefund(){ var list=getReportList('refunds'); list.push(0); saveDraft(); renderRefundList(); }
function updateRefund(i,val){ var list=getReportList('refunds'); if(list[i]!==undefined) list[i]=val; saveDraft(); }
function deleteRefund(i){ var list=getReportList('refunds'); list.splice(i,1); saveDraft(); renderRefundList(); }

// ═══════════════════════════════════════════════════════════════════════════
// STAFF SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════
function renderShiftLists(){
  renderShift(1); renderShift(2);
}

function renderShift(num){
  var list = getReportList('shift'+num);
  var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  var tstr = pad(tomorrow.getDate())+'/'+pad(tomorrow.getMonth()+1)+'/'+String(tomorrow.getFullYear()).substring(2);
  var timeStr = num===1?'08.00-16.00':'14.00-22.00';
  var html='';
  list.forEach(function(s,i){
    var staffOpts = settings.staff.map(function(st){ return '<option value="'+esc(st.name)+'"'+(s.name===st.name?' selected':'')+'>'+esc(st.name)+'</option>'; }).join('');
    staffOpts = '<option value="">Pilih...</option>'+staffOpts+'<option value="__other__">Lainnya...</option>';
    html+='<div class="staff-row">';
    html+='<select onchange="updateShift('+num+','+i+',\'position\',this.value)" style="width:50px"><option value="Shift '+num+'" selected>Shift '+num+'</option></select>';
    html+='<select onchange="updateShiftName('+num+','+i+',this.value)" style="flex:1">'+staffOpts+'</select>';
    html+='<input value="'+tstr+' '+timeStr+'" readonly style="width:100px;font-size:11px">';
    html+='<select onchange="updateShift('+num+','+i+',\'status\',this.value)"><option value="Barista"'+(s.status==='Barista'?' selected':'')+'>Barista</option><option value="Staff Photobooth"'+(s.status==='Staff Photobooth'?' selected':'')+'>Staff Photobooth</option><option value="Manager"'+(s.status==='Manager'?' selected':'')+'>Manager</option><option value="Kasir"'+(s.status==='Kasir'?' selected':'')+'>Kasir</option><option value="Security"'+(s.status==='Security'?' selected':'')+'>Security</option></select>';
    html+='<button class="tbl-del" onclick="deleteShift('+num+','+i+')">×</button></div>';
  });
  document.getElementById('shift'+num+'List').innerHTML=html;
}

function addShift(num){
  var list=getReportList('shift'+num);
  list.push({position:'Shift '+num,name:'',status:'Barista'});
  saveDraft(); renderShift(num);
}

function updateShift(num,i,field,val){
  var list=getReportList('shift'+num);
  if(list[i]) list[i][field]=val;
  saveDraft();
}

function updateShiftName(num,i,val){
  var list=getReportList('shift'+num);
  if(!list[i]) return;
  if(val==='__other__'){ val=prompt('Nama staff:'); if(!val) return; }
  list[i].name=val;
  saveDraft(); renderShift(num);
}

function deleteShift(num,i){
  var list=getReportList('shift'+num);
  list.splice(i,1);
  saveDraft(); renderShift(num);
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════
function renderInventoryList(){
  var list=getReportList('inventory');
  var html='';
  list.forEach(function(inv,i){
    var remaining = (inv.startQty||0)-(inv.used||0);
    var needOrder = remaining <= (inv.threshold||5) ? '<span style="color:var(--danger);font-weight:700">YESSS</span>' : 'No';
    html+='<div class="tbl-row"><input value="'+esc(inv.item||'')+'" placeholder="Item" onchange="updateInventory('+i+',\'item\',this.value)" style="flex:1"><input type="number" value="'+inv.startQty+'" placeholder="Start" onchange="updateInventory('+i+',\'startQty\',+this.value)" style="width:55px"><input type="number" value="'+inv.used+'" placeholder="Used" onchange="updateInventory('+i+',\'used\',+this.value)" style="width:55px"><span style="width:40px;text-align:center;font-size:12px">'+remaining+'</span><span style="width:50px;font-size:10px">'+needOrder+'</span><button class="tbl-del" onclick="deleteInventory('+i+')">×</button></div>';
  });
  document.getElementById('inventoryList').innerHTML=html;
}

function addInventory(){ getReportList('inventory').push({item:'',startQty:0,used:0,threshold:5}); saveDraft(); renderInventoryList(); }
function updateInventory(i,field,val){ var list=getReportList('inventory'); if(list[i]) list[i][field]=val; saveDraft(); renderInventoryList(); }
function deleteInventory(i){ getReportList('inventory').splice(i,1); saveDraft(); renderInventoryList(); }

// ═══════════════════════════════════════════════════════════════════════════
// COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════
function renderComplaintList(){
  var list=getReportList('complaints');
  var html='';
  list.forEach(function(c,i){
    html+='<div class="tbl-row"><input value="'+esc(c.complaint||'')+'" placeholder="Complaint" onchange="updateComplaint('+i+',\'complaint\',this.value)" style="flex:1"><input value="'+esc(c.cause||'')+'" placeholder="Cause" onchange="updateComplaint('+i+',\'cause\',this.value)" style="flex:1"><input value="'+esc(c.action||'')+'" placeholder="Action" onchange="updateComplaint('+i+',\'action\',this.value)" style="flex:1"><select onchange="updateComplaint('+i+',\'needHQ\',this.value)"><option value="No"'+(!c.needHQ||c.needHQ==='No'?' selected':'')+'>No</option><option value="Yes"'+(c.needHQ==='Yes'?' selected':'')+'>Yes</option></select><button class="tbl-del" onclick="deleteComplaint('+i+')">×</button></div>';
  });
  document.getElementById('complaintList').innerHTML=html;
}

function addComplaint(){ getReportList('complaints').push({complaint:'',cause:'',action:'',needHQ:'No'}); saveDraft(); renderComplaintList(); }
function updateComplaint(i,field,val){ var list=getReportList('complaints'); if(list[i]) list[i][field]=val; saveDraft(); }
function deleteComplaint(i){ getReportList('complaints').splice(i,1); saveDraft(); renderComplaintList(); }

// ═══════════════════════════════════════════════════════════════════════════
// TOGGLES (Equipment, Cleaning, Marketing)
// ═══════════════════════════════════════════════════════════════════════════
function renderToggles(){
  var eq=getReportData('equipment');
  var html='';
  EQUIPMENT.forEach(function(e){
    var state = eq[e]||'Done';
    html+='<div class="toggle-check"><span class="tgl-name">'+e+'</span><button class="'+(state==='Done'?'tgl-done':'tgl-issue')+'" onclick="toggleEq(\''+escJS(e)+'\')">'+(state==='Done'?'Done':'Issue')+'</button>';
    if(state==='Issue') html+='<input placeholder="Deskripsi masalah" value="'+esc(eq[e+'_note']||'')+'" onchange="toggleEqNote(\''+escJS(e)+'\',this.value)" style="flex:1">';
    html+='</div>';
  });
  document.getElementById('equipmentList').innerHTML=html;

  var cl=getReportData('cleaning');
  html='';
  CLEANING.forEach(function(c){
    var done = cl[c]!==false;
    html+='<div class="toggle-check"><span class="tgl-name">'+c+'</span><button class="'+(done?'tgl-done':'tgl-issue')+'" onclick="toggleClean(\''+escJS(c)+'\')">'+(done?'Done':'Not Done')+'</button></div>';
  });
  document.getElementById('cleaningList').innerHTML=html;

  var mk=getReportData('marketing');
  html='';
  MARKETING.forEach(function(m){
    var done = mk[m]!==false;
    html+='<div class="toggle-check"><span class="tgl-name">'+m+'</span><button class="'+(done?'tgl-done':'tgl-issue')+'" onclick="toggleMkt(\''+escJS(m)+'\')">'+(done?'Done':'Not Done')+'</button></div>';
  });
  document.getElementById('marketingList').innerHTML=html;
}

function toggleEq(name){
  var eq=getReportData('equipment');
  eq[name]=eq[name]==='Done'?'Issue':'Done';
  saveDraft(); renderToggles();
}
function toggleEqNote(name,val){
  var eq=getReportData('equipment');
  eq[name+'_note']=val;
  saveDraft();
}
function toggleClean(name){
  var cl=getReportData('cleaning');
  cl[name]=cl[name]===false?true:false;
  saveDraft(); renderToggles();
}
function toggleMkt(name){
  var mk=getReportData('marketing');
  mk[name]=mk[name]===false?true:false;
  saveDraft(); renderToggles();
}

// ═══════════════════════════════════════════════════════════════════════════
// SALARY INFO
// ═══════════════════════════════════════════════════════════════════════════
function updateSalaryInfo(){
  var totalRev = 0;
  var prefix = currentMonthPrefix();
  for(var k in cumulative){
    if(k.indexOf(prefix)===0) totalRev += (cumulative[k]?cumulative[k].revenue||0:0);
  }
  // Add today's revenue
  ALL_MENU.forEach(function(m){ totalRev+=reportQty(m)*(settings.menuPrices[m]||0); });
  BOOTH_TYPES.forEach(function(b){ totalRev+=reportQty(b)*(settings.boothPrices[b]||0); });
  totalRev += +(document.getElementById('rSelfRevenue')?document.getElementById('rSelfRevenue').value:0)||0;

  var maxSalary = Math.round(totalRev*0.15);
  document.getElementById('salaryInfo').textContent = 'Max monthly salary: not over 15% of total revenue (IDR '+fmt(maxSalary)+')';
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAFT — single in-memory object, synced to localStorage
// ═══════════════════════════════════════════════════════════════════════════
var draft = {};

function getDraftFromStorage(){
  var raw = localStorage.getItem(LS_DRAFT);
  var d = {};
  if(raw){ try{ d = JSON.parse(raw); }catch(e){ d = {}; } }
  if(!d.qty) d.qty={};
  if(!d.remarks) d.remarks={};
  if(!d.expenses) d.expenses=[];
  if(!d.refunds) d.refunds=[];
  if(!d.shift1) d.shift1=[];
  if(!d.shift2) d.shift2=[];
  if(!d.inventory) d.inventory=[];
  if(!d.complaints) d.complaints=[];
  if(!d.equipment) d.equipment={};
  if(!d.cleaning) d.cleaning={};
  if(!d.marketing) d.marketing={};
  return d;
}

function restoreDraftToDOM(){
  if(draft.date) document.getElementById('rDate').value = draft.date;
  if(draft.weather) document.getElementById('rWeather').value = draft.weather;
  if(draft.selfStudio){
    document.getElementById('rSelfSessions').value = draft.selfStudio.sessions||0;
    document.getElementById('rSelfPersons').value = draft.selfStudio.persons||0;
    document.getElementById('rSelfRevenue').value = draft.selfStudio.revenue||0;
  }
  if(draft.influencerName) document.getElementById('rInfluencerName').value=draft.influencerName;
  if(draft.influencerURL) document.getElementById('rInfluencerURL').value=draft.influencerURL;
  if(draft.incident) document.getElementById('rIncident').value=draft.incident;
  if(draft.uploadPayments){ document.getElementById('rUpload1').value=draft.uploadPayments[0]||''; document.getElementById('rUpload2').value=draft.uploadPayments[1]||''; document.getElementById('rUpload3').value=draft.uploadPayments[2]||''; }
  if(draft.deliveryRequests){ document.getElementById('rDelivery1').value=draft.deliveryRequests[0]||''; document.getElementById('rDelivery2').value=draft.deliveryRequests[1]||''; document.getElementById('rDelivery3').value=draft.deliveryRequests[2]||''; }
  if(draft.qty){ for(var k in draft.qty){ var el=document.getElementById('qty_'+sanitize(k)); if(el) el.value=draft.qty[k]; } }
  updateAllTotals();
}

function saveDraft(){
  draft.date = document.getElementById('rDate')?document.getElementById('rDate').value:'';
  draft.weather = document.getElementById('rWeather')?document.getElementById('rWeather').value:'Bright';
  draft.selfStudio = { sessions: +(document.getElementById('rSelfSessions')?document.getElementById('rSelfSessions').value:0)||0, persons: +(document.getElementById('rSelfPersons')?document.getElementById('rSelfPersons').value:0)||0, revenue: +(document.getElementById('rSelfRevenue')?document.getElementById('rSelfRevenue').value:0)||0 };
  ALL_MENU.forEach(function(m){ draft.qty[m]=reportQty(m); });
  ALL_MENU.forEach(function(m){ draft.remarks[m]=reportRemark(m); });
  BOOTH_TYPES.forEach(function(b){ draft.qty[b]=reportQty(b); });
  draft.influencerName = document.getElementById('rInfluencerName')?document.getElementById('rInfluencerName').value:'';
  draft.influencerURL = document.getElementById('rInfluencerURL')?document.getElementById('rInfluencerURL').value:'';
  draft.incident = document.getElementById('rIncident')?document.getElementById('rIncident').value:'';
  draft.uploadPayments = [document.getElementById('rUpload1')?document.getElementById('rUpload1').value:'',document.getElementById('rUpload2')?document.getElementById('rUpload2').value:'',document.getElementById('rUpload3')?document.getElementById('rUpload3').value:''];
  draft.deliveryRequests = [document.getElementById('rDelivery1')?document.getElementById('rDelivery1').value:'',document.getElementById('rDelivery2')?document.getElementById('rDelivery2').value:'',document.getElementById('rDelivery3')?document.getElementById('rDelivery3').value:''];
  localStorage.setItem(LS_DRAFT, JSON.stringify(draft));
}

function getReportList(key){
  if(!draft[key]) draft[key]=[];
  return draft[key];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
function toggleSection(id){
  var el = document.getElementById(id);
  if(el) el.classList.toggle('collapsed');
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL GENERATION
// ═══════════════════════════════════════════════════════════════════════════
function generateExcel(){
  var dateVal = document.getElementById('rDate').value;
  if(!dateVal){ showToast('Tanggal wajib diisi'); return; }
  saveDraft();

  try{
    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet('JJIKGO Daily Report');
    ws.getColumn('A').width = 22;
    ws.getColumn('B').width = 22;
    ws.getColumn('C').width = 22;
    ws.getColumn('D').width = 18;

    var row = 1;
    // Title
    ws.mergeCells('A'+row+':D'+row);
    var tc = ws.getCell('A'+row); tc.value='JJIKGO DAILY REPORT'; tc.font={bold:true,size:14}; tc.alignment={horizontal:'center',vertical:'middle'};
    row+=2;

    // Header info
    var info = [['Date',dateVal],['Store',settings.storeName],['Manager',settings.managerName],['Weather',document.getElementById('rWeather').value],['Prepared by',settings.preparedBy]];
    info.forEach(function(pair){
      ws.getCell('A'+row).value=pair[0]; ws.getCell('A'+row).font={bold:true};
      ws.getCell('B'+row).value=pair[1]; row++;
    });
    row++;

    // Section A
    row = writeSectionHeader(ws,row,'A. Daily Sales Cafe');
    row = writeTableHeader(ws,row,['Menu','Transactions','Daily Revenue IDR','Remark']);
    MENU_CATEGORIES.forEach(function(cat){
      ws.mergeCells('A'+row+':D'+row);
      ws.getCell('A'+row).value=cat.name; ws.getCell('A'+row).font={bold:true}; ws.getCell('A'+row).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDDDDDD'}};
      row++;
      cat.items.forEach(function(m){
        var qty = draft.qty?draft.qty[m]||0:0;
        var price = settings.menuPrices[m]||0;
        ws.getCell('A'+row).value=m;
        ws.getCell('B'+row).value=qty;
        ws.getCell('C'+row).value=qty*price;
        ws.getCell('D'+row).value=draft.remarks?draft.remarks[m]||'':'';
        applyBorder(ws,row,1,4);
        row++;
      });
    });
    // Cafe total
    var cafeQty=0,cafeRev=0;
    ALL_MENU.forEach(function(m){ var q=draft.qty?draft.qty[m]||0:0; cafeQty+=q; cafeRev+=q*(settings.menuPrices[m]||0); });
    ws.getCell('A'+row).value='TOTAL'; ws.getCell('A'+row).font={bold:true};
    ws.getCell('B'+row).value=cafeQty; ws.getCell('B'+row).font={bold:true};
    ws.getCell('C'+row).value=cafeRev; ws.getCell('C'+row).font={bold:true};
    applyBorder(ws,row,1,4); row+=2;

    // Section B
    row = writeSectionHeader(ws,row,'B. Daily Sales by Photo Booth Type');
    row = writeTableHeader(ws,row,['Booth Type','Transactions','Daily Revenue IDR','']);
    var boothQty=0,boothRev=0;
    BOOTH_TYPES.forEach(function(b){
      var q = draft.qty?draft.qty[b]||0:0;
      var p = settings.boothPrices[b]||0;
      boothQty+=q; boothRev+=q*p;
      ws.getCell('A'+row).value=b;
      ws.getCell('B'+row).value=q;
      ws.getCell('C'+row).value=q*p;
      applyBorder(ws,row,1,4); row++;
    });
    // Pas Foto (same as above, already in BOOTH_TYPES)
    // Self Studio
    ws.getCell('A'+row).value='Self Studio';
    var ss = draft.selfStudio||{};
    ws.getCell('B'+row).value=(ss.sessions||0)+' Sesion / '+(ss.persons||0)+' Person';
    ws.getCell('C'+row).value=ss.revenue||0;
    boothRev += ss.revenue||0;
    applyBorder(ws,row,1,4); row++;
    // Booth total
    ws.getCell('A'+row).value='TOTAL'; ws.getCell('A'+row).font={bold:true};
    ws.getCell('B'+row).value=boothQty; ws.getCell('B'+row).font={bold:true};
    ws.getCell('C'+row).value=boothRev; ws.getCell('C'+row).font={bold:true};
    applyBorder(ws,row,1,4); row+=2;

    // Section C: Cumulative
    row = writeSectionHeader(ws,row,'C. Monthly Cumulative Sales');
    row = writeTableHeader(ws,row,['Date','Daily Revenue (IDR)','Daily Expense (IDR)','Total (IDR)']);
    var today = new Date(dateVal);
    var days = new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
    var runTotal=0;
    for(var d=1;d<=days;d++){
      var key=cumKey(d, today);
      var rev=cumulative[key]?cumulative[key].revenue||0:0;
      var exp=cumulative[key]?cumulative[key].expense||0:0;
      if(d===today.getDate()){ rev+=cafeRev+boothRev; exp+=getExpenseTotal(); }
      runTotal+=rev-exp;
      ws.getCell('A'+row).value=pad(d)+'/'+pad(today.getMonth()+1)+'/'+today.getFullYear();
      ws.getCell('B'+row).value=rev;
      ws.getCell('C'+row).value=exp;
      ws.getCell('D'+row).value=runTotal;
      applyBorder(ws,row,1,4); row++;
    }
    row++;

    // Section D: Expense
    row = writeSectionHeader(ws,row,'D. DAILY EXPENSE');
    row = writeTableHeader(ws,row,['Date','Daily Expense','Keterangan','']);
    var expList = draft.expenses||[];
    expList.forEach(function(e){
      ws.getCell('A'+row).value=dateVal;
      ws.getCell('B'+row).value=e.amount||0;
      ws.getCell('C'+row).value=e.desc||'';
      applyBorder(ws,row,1,4); row++;
    });
    row++;

    // Refund
    ws.getCell('A'+row).value='REFUND Date'; ws.getCell('A'+row).font={bold:true};
    ws.getCell('B'+row).value='Daily Refund (IDR)'; ws.getCell('B'+row).font={bold:true};
    row++;
    var refList = draft.refunds||[];
    refList.forEach(function(v,r){
      if(v&&v>0){
        ws.getCell('A'+row).value=dateVal;
        ws.getCell('B'+row).value=v;
        applyBorder(ws,row,1,2); row++;
      }
    });
    row++;

    // Staff Schedule
    row = writeSectionHeader(ws,row,'Tomorrow Staff Schedule');
    row = writeTableHeader(ws,row,['Position','Name','Shift Time','Status']);
    var tomorrow = new Date(dateVal); tomorrow.setDate(tomorrow.getDate()+1);
    var tDate = pad(tomorrow.getDate())+'/'+pad(tomorrow.getMonth()+1)+'/'+String(tomorrow.getFullYear()).substring(2);
    [1,2].forEach(function(num){
      var list = draft['shift'+num]||[];
      list.forEach(function(s){
        if(!s.name) return;
        ws.getCell('A'+row).value=s.position||('Shift '+num);
        ws.getCell('B'+row).value=s.name;
        ws.getCell('C'+row).value=tDate+' '+(num===1?'08.00-16.00':'14.00-22.00');
        ws.getCell('D'+row).value=s.status||'';
        applyBorder(ws,row,1,4); row++;
      });
    });
    ws.getCell('A'+row).value='Max monthly salary'; ws.getCell('A'+row).font={bold:true};
    ws.getCell('B'+row).value='not over 15% of total revenue'; row+=2;

    // Inventory
    row = writeSectionHeader(ws,row,'DNP Paper & Inventory Status');
    row = writeTableHeader(ws,row,['Item','Start Qty','Used Today','Remaining','Need Order?']);
    var invList = draft.inventory||[];
    invList.forEach(function(inv){
      var rem = (inv.startQty||0)-(inv.used||0);
      ws.getCell('A'+row).value=inv.item||''; ws.getCell('B'+row).value=inv.startQty||0;
      ws.getCell('C'+row).value=inv.used||0; ws.getCell('D'+row).value=rem;
      ws.getCell('E'+row).value=rem<=(inv.threshold||5)?'YESSS':'No';
      applyBorder(ws,row,1,5); row++;
    });
    row++;

    // Complaint
    row = writeSectionHeader(ws,row,'Customer Complaint & Google Review Check');
    row = writeTableHeader(ws,row,['Complaint/Review','Cause/Rating','Action Taken','Need HQ Support']);
    var compList = draft.complaints||[];
    compList.forEach(function(c){
      ws.getCell('A'+row).value=c.complaint||''; ws.getCell('B'+row).value=c.cause||'';
      ws.getCell('C'+row).value=c.action||''; ws.getCell('D'+row).value=c.needHQ||'No';
      applyBorder(ws,row,1,4); row++;
    });
    row++;

    // Equipment
    row = writeSectionHeader(ws,row,'EQUIPMENT STATUS');
    row = writeTableHeader(ws,row,['Equipment','Status','Issue','']);
    var eqData = draft.equipment||{};
    EQUIPMENT.forEach(function(e){
      var state = eqData[e]||'Done';
      ws.getCell('A'+row).value=e;
      ws.getCell('B'+row).value=state==='Done'?'Done':'Issue';
      ws.getCell('C'+row).value=state==='Issue'?(eqData[e+'_note']||''):'';
      applyBorder(ws,row,1,3); row++;
    });
    row++;

    // Cleaning
    row = writeSectionHeader(ws,row,'CLEANING CHECKLIST');
    row = writeTableHeader(ws,row,['Area','Done','','']);
    var clData = draft.cleaning||{};
    CLEANING.forEach(function(c){
      ws.getCell('A'+row).value=c;
      ws.getCell('B'+row).value=clData[c]!==false?'Done':'Not Done';
      applyBorder(ws,row,1,2); row++;
    });
    row++;

    // Marketing
    row = writeSectionHeader(ws,row,'MARKETING & SNS ACTIVITY');
    row = writeTableHeader(ws,row,['Activity','Done','','']);
    var mkData = draft.marketing||{};
    MARKETING.forEach(function(m){
      ws.getCell('A'+row).value=m;
      ws.getCell('B'+row).value=mkData[m]!==false?'Done':'Not Done';
      applyBorder(ws,row,1,2); row++;
    });
    ws.getCell('A'+row).value='Influencer visit'; ws.getCell('B'+row).value=draft.influencerName||''; applyBorder(ws,row,1,2); row++;
    ws.getCell('A'+row).value='Influencer posting URL'; ws.getCell('B'+row).value=draft.influencerURL||''; applyBorder(ws,row,1,2); row+=2;

    // Incident
    row = writeSectionHeader(ws,row,'INCIDENT / SPECIAL REPORT');
    ws.getCell('A'+row).value=draft.incident||''; row+=3;

    // HQ Support
    row = writeSectionHeader(ws,row,'9. HQ SUPPORT REQUEST');
    ws.getCell('A'+row).value='Upload payment'; ws.getCell('A'+row).font={bold:true}; row++;
    var ups = draft.uploadPayments||['','',''];
    for(var u=0;u<3;u++){ ws.getCell('A'+row).value=ups[u]||''; row++; }
    ws.getCell('A'+row).value='Delivery request'; ws.getCell('A'+row).font={bold:true}; row++;
    var drs = draft.deliveryRequests||['','',''];
    for(var dr=0;dr<3;dr++){ ws.getCell('A'+row).value=drs[dr]||''; row++; }

    // Update cumulative after download
    var todayKey = cumKey(today.getDate(), today);
    if(!cumulative[todayKey]) cumulative[todayKey]={revenue:0,expense:0};
    cumulative[todayKey].revenue = cafeRev+boothRev;
    cumulative[todayKey].expense = getExpenseTotal();
    saveCumulative();

    // Download
    var parts = dateVal.split('-');
    var fname = parts[2]+parts[1]+parts[0].substring(2)+'_JJIKGO_'+(settings.managerName||'report').toLowerCase().replace(/[^a-z0-9]/g,'_')+'.xlsx';
    wb.xlsx.writeBuffer().then(function(buf){
      downloadBlob(buf,fname,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      showToast('Laporan berhasil didownload!');
    });
  }catch(e){ console.error(e); showToast('Gagal generate: '+e.message); }
}

function writeSectionHeader(ws,row,title){
  ws.mergeCells('A'+row+':D'+row);
  ws.getCell('A'+row).value=title;
  ws.getCell('A'+row).font={bold:true,size:12};
  ws.getCell('A'+row).alignment={horizontal:'center'};
  return row+1;
}

function writeTableHeader(ws,row,headers){
  headers.forEach(function(h,i){
    ws.getCell(String.fromCharCode(65+i)+row).value=h;
    ws.getCell(String.fromCharCode(65+i)+row).font={bold:true,size:10};
    ws.getCell(String.fromCharCode(65+i)+row).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDDDDDD'}};
    ws.getCell(String.fromCharCode(65+i)+row).alignment={horizontal:'center',vertical:'middle'};
  });
  return row+1;
}

function applyBorder(ws,row,colStart,colEnd){
  for(var c=colStart;c<=colEnd;c++){
    ws.getCell(String.fromCharCode(64+c)+row).border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}};
  }
}

function getExpenseTotal(){
  var list = draft.expenses||[];
  var total=0;
  list.forEach(function(e){ total+=e.amount||0; });
  return total;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function esc(s){ if(!s) return ''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function escJS(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,'\\\''); }
function sanitize(s){ return (s||'').replace(/[^a-zA-Z0-9]/g,'_'); }
function fmt(n){ return (n||0).toLocaleString('id-ID'); }
function pad(n){ return n<10?'0'+n:''+n; }

function showToast(msg){
  var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove('show');},2500);
}

function downloadBlob(data,filename,mime){
  var blob=new Blob([data],{type:mime}); var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
