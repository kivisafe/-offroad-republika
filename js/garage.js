// ===== garage.js =====
// Garage CRUD, service log, modification system, mod map, credibility badges,
// profile garage/mods sections, seedServiceDemo, seedModsDemo
//
// Dependencies (must be loaded before this file):
//   core.js    — escHtml, showToast
//   auth.js    — getCurrentUserId, getCurrentUser
//   tier.js    — TIERS, ARCHETYPES (from onboarding.js), tierInfo, renderTierBadge,
//                renderTierProgress, refreshTierDisplay, calcTierForUser
//   app.js     — businessData, BIKE_DNA, renderForYourBike, validateForm,
//                refreshCredBadges (circular — called from addBike/removeBike),
//                forumHome, getForumPosts (referenced indirectly)
//
// Globals defined here:
//   migrateBike, getGarage, saveGarage, toggleGarage, _garageStatus, setGarageStatus,
//   renderGarage, addBike, removeBike, updateGarageBadge,
//   SERVICE_TYPES, getServiceLog, saveServiceLog, getServiceLogForBike,
//   addServiceRecord, removeServiceRecord, renderServiceTimeline,
//   renderAddRecordForm, submitServiceRecord,
//   _openServiceBook, _openAddForm, toggleServiceBook, toggleAddRecord,
//   seedServiceDemo,
//   MOD_TYPES, SYSTEM_ICONS, getMods, saveMods, getModsForBike, getModsForSystem,
//   addMod, removeMod, matchBikeToDna,
//   _openModMap, _openModSlot, _openModForm,
//   getModMapData, renderModMap, renderModSlotDetail,
//   toggleModMap, toggleModSlot, toggleModForm,
//   _modPartCount, renderModForm, addModPartRow, updateModComponents,
//   submitMod, createModBuildThread,
//   getGarageCredibility, renderCredibilityBadge, injectCredibilityBadges, refreshCredBadges,
//   renderProfileGarage, renderProfileMods, renderProfileGarageFor, renderProfileModsFor,
//   seedModsDemo, showAccountPrompt (from auth.js, referenced by obFinish in onboarding)
// ==========================================================================

function migrateBike(b){
  return {make:b.make||'',model:b.model||'',year:b.year||'?',status:b.status||'current',note:b.note||'',months:b.months||0};
}
function getGarage(){var uid=getCurrentUserId();var key=uid?'orGarage_'+uid:'orGarage';try{return(JSON.parse(localStorage.getItem(key))||[]).map(migrateBike)}catch(e){return[]}}
function saveGarage(bikes){var uid=getCurrentUserId();var key=uid?'orGarage_'+uid:'orGarage';localStorage.setItem(key,JSON.stringify(bikes))}
function toggleGarage(){document.getElementById('garagePanel').classList.toggle('on');renderGarage()}

var _garageStatus='current';
function setGarageStatus(st){
  _garageStatus=st;
  document.querySelectorAll('.garage-st-opt').forEach(function(el){el.classList.toggle('on',el.dataset.st===st)});
}

function renderGarage(){
  var bikes=getGarage();
  var c=document.getElementById('garageBikes');
  if(!c)return;
  if(!bikes.length){c.innerHTML='<div class="empty-state" style="padding:16px"><div class="empty-state-icon">\uD83C\uDFCD\uFE0F</div><div class="empty-state-title">\u0413\u0410\u0420\u0410\u0416\u042A\u0422 \u0415 \u041F\u0420\u0410\u0417\u0415\u041D</div><div class="empty-state-desc">\u0414\u043E\u0431\u0430\u0432\u0438 \u043C\u043E\u0442\u043E\u0440\u0430 \u0441\u0438 \u2014 \u0434\u0443\u043C\u0430\u0442\u0430 \u0442\u0438 \u0449\u0435 \u0442\u0435\u0436\u0438 \u043F\u043E\u0432\u0435\u0447\u0435 \u0432\u044A\u0432 \u0444\u043E\u0440\u0443\u043C\u0430!</div></div>';return;}
  c.innerHTML=bikes.map(function(b,i){
    var stClass=b.status==='current'?'garage-st-current':'garage-st-past';
    var stText=b.status==='current'?'КАРАМ':'КАРАЛ';
    var noteHtml=b.note?'<div class="garage-bike-note">'+escHtml(b.note)+'</div>':'';
    var monthsHtml=b.months?'<span class="garage-bike-months">'+b.months+' мес.</span>':'';
    var logCount=getServiceLogForBike(i).length;
    var modCount=getModsForBike(i).length;
    var logBtnClass=_openServiceBook===i?'garage-bike-btn on':'garage-bike-btn';
    var modBtnClass=_openModMap===i?'garage-bike-btn on':'garage-bike-btn';
    var actionsHtml='<div class="garage-bike-actions">'+
      '<span class="'+logBtnClass+'" onclick="event.stopPropagation();toggleServiceBook('+i+')">\uD83D\uDCD6 \u041A\u043D\u0438\u0436\u043A\u0430'+(logCount?' ('+logCount+')':'')+'</span>'+
      '<span class="'+modBtnClass+'" onclick="event.stopPropagation();toggleModMap('+i+')">\uD83D\uDD27 \u041C\u043E\u0434\u043E\u0432\u0435'+(modCount?' ('+modCount+')':'')+'</span>'+
      '<span class="garage-bike-btn" onclick="event.stopPropagation();toggleModForm('+i+')">+ \u041C\u043E\u0434</span>'+
      '<span class="garage-bike-btn" onclick="event.stopPropagation();toggleAddRecord('+i+')">+ \u0417\u0430\u043F\u0438\u0441</span>'+
      '<span class="garage-bike-btn garage-sell-btn" data-action="sell-bike" data-param="'+i+'">🏷️ Продай</span></div>';
    var expandHtml='';
    if(_openServiceBook===i){expandHtml='<div class="slog-timeline">'+renderServiceTimeline(i)+'</div>';}
    if(_openAddForm===i){expandHtml+=renderAddRecordForm(i);}
    if(_openModMap===i){expandHtml+=renderModMap(i,false);}
    if(_openModForm===i){expandHtml+=renderModForm(i);}
    return '<div class="garage-bike-wrap"><div class="garage-bike"><div style="font-size:20px">\uD83C\uDFCD\uFE0F</div><div class="garage-bike-info">'+
      '<div class="garage-bike-name">'+escHtml(b.make+' '+b.model)+' <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>'+
      '<div class="garage-bike-year">'+escHtml(String(b.year))+monthsHtml+'</div>'+noteHtml+actionsHtml+
      '</div><span class="garage-bike-remove" onclick="event.stopPropagation();removeBike('+i+')">\u2715</span></div>'+expandHtml+'</div>';
  }).join('');
}

function addBike(){
  var make=document.getElementById('garageMake').value;
  var model=document.getElementById('garageModel').value.trim();
  var year=document.getElementById('garageYear').value;
  var note=(document.getElementById('garageNote').value||'').trim().substring(0,200);
  var months=parseInt(document.getElementById('garageMonths').value)||0;
  if(!make||!model){showToast('\u26A0\uFE0F \u0418\u0437\u0431\u0435\u0440\u0438 \u043C\u0430\u0440\u043A\u0430 \u0438 \u043D\u0430\u043F\u0438\u0448\u0438 \u043C\u043E\u0434\u0435\u043B!');return;}
  var bikes=getGarage();
  bikes.push({make:make,model:model,year:year||'?',status:_garageStatus,note:note,months:months});
  saveGarage(bikes);renderGarage();
  document.getElementById('garageMake').value='';
  document.getElementById('garageModel').value='';
  document.getElementById('garageYear').value='';
  document.getElementById('garageNote').value='';
  document.getElementById('garageMonths').value='';
  setGarageStatus('current');
  showToast('\uD83C\uDFCD\uFE0F '+make+' '+model+' \u0434\u043E\u0431\u0430\u0432\u0435\u043D \u0432 \u0433\u0430\u0440\u0430\u0436\u0430!','success');
  updateGarageBadge();renderForYourBike();refreshCredBadges();refreshTierDisplay();
}

function removeBike(i){
  var bikes=getGarage();var removed=bikes.splice(i,1)[0];
  saveGarage(bikes);renderGarage();
  showToast(removed.make+' '+removed.model+' \u043C\u0430\u0445\u043D\u0430\u0442 \u043E\u0442 \u0433\u0430\u0440\u0430\u0436\u0430.');
  updateGarageBadge();renderForYourBike();refreshCredBadges();
}

function updateGarageBadge(){
  var count=getGarage().length;
  var badge=document.getElementById('garageBadge');
  if(badge){badge.textContent=count||'';badge.style.display=count?'':'none';}
}

// ===== SERVICE LOG =====
var SERVICE_TYPES={
  oil:{emoji:'\uD83D\uDEE2\uFE0F',label:'\u041C\u0430\u0441\u043B\u043E + \u0444\u0438\u043B\u0442\u044A\u0440'},suspension:{emoji:'\uD83D\uDD27',label:'\u041E\u043A\u0430\u0447\u0432\u0430\u043D\u0435 \u0440\u0435\u0432\u0438\u0437\u0438\u044F'},
  chain:{emoji:'\u26D3\uFE0F',label:'\u0412\u0435\u0440\u0438\u0433\u0430 + \u043F\u0438\u043D\u044C\u043E\u043D'},tires:{emoji:'\uD83C\uDFCD\uFE0F',label:'\u0413\u0443\u043C\u0438'},
  electric:{emoji:'\u26A1',label:'\u0415\u043B\u0435\u043A\u0442\u0440\u0438\u043A\u0430'},engine:{emoji:'\u2699\uFE0F',label:'\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043B'},
  brakes:{emoji:'\uD83D\uDD34',label:'\u0421\u043F\u0438\u0440\u0430\u0447\u043A\u0438'},other:{emoji:'\uD83D\uDCDD',label:'\u0414\u0440\u0443\u0433\u043E'}
};

function getServiceLog(){var uid=getCurrentUserId();var key=uid?'orServiceLog_'+uid:'orServiceLog';try{return JSON.parse(localStorage.getItem(key))||[]}catch(e){return[]}}
function saveServiceLog(log){var uid=getCurrentUserId();var key=uid?'orServiceLog_'+uid:'orServiceLog';localStorage.setItem(key,JSON.stringify(log))}
function getServiceLogForBike(bikeIdx){return getServiceLog().filter(function(r){return r.bikeIdx===bikeIdx}).sort(function(a,b){return b.date>a.date?1:b.date<a.date?-1:0})}

function addServiceRecord(bikeIdx,rec){
  var log=getServiceLog();
  rec.bikeIdx=bikeIdx;
  log.push(rec);
  saveServiceLog(log);
}

function removeServiceRecord(globalIdx){
  var log=getServiceLog();
  log.splice(globalIdx,1);
  saveServiceLog(log);
}

function renderServiceTimeline(bikeIdx){
  var records=getServiceLogForBike(bikeIdx);
  if(!records.length)return '<div class="slog-empty">\u041D\u044F\u043C\u0430 \u0437\u0430\u043F\u0438\u0441\u0438. \u0414\u043E\u0431\u0430\u0432\u0438 \u043F\u044A\u0440\u0432\u0438\u044F!</div>';
  return records.map(function(r){
    var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
    var whoHtml=r.who==='self'?'<span class="slog-who-self">\uD83E\uDDD1\u200D\uD83D\uDD27 \u0410\u0437 \u0441\u0430\u043C</span>':
      '<span class="slog-who link" onclick="event.stopPropagation();openProfile(\''+r.who+'\')">'+typeInfo.emoji+' '+escHtml(r.whoName)+'</span>';
    var confirmed=r.confirmed&&r.who!=='self'?'<span class="slog-confirmed">\u2705</span>':'';
    var costHtml=r.cost?'<span class="slog-cost">'+r.cost+' \u043B\u0432</span>':'';
    var noteHtml=r.note?'<div class="slog-note">'+escHtml(r.note)+'</div>':'';
    var nextHtml=r.next?'<div class="slog-next">\u23ED\uFE0F \u0421\u043B\u0435\u0434\u0432\u0430\u0449\u043E: '+escHtml(r.next)+'</div>':'';
    var hoursHtml=r.hours?'<span class="slog-hours">\u043F\u0440\u0438 '+r.hours+'\u0447</span>':'';
    return '<div class="slog-entry">'+
      '<div class="slog-head"><span class="slog-date">'+escHtml(r.date)+'</span><span class="slog-label">'+escHtml(r.label)+'</span>'+hoursHtml+costHtml+confirmed+'</div>'+
      '<div class="slog-body">'+whoHtml+noteHtml+nextHtml+'</div></div>';
  }).join('');
}

function renderAddRecordForm(bikeIdx){
  var bizOptions='<option value="self">\uD83E\uDDD1\u200D\uD83D\uDD27 \u0410\u0437 \u0441\u0430\u043C</option>';
  if(typeof businessData!=='undefined'){
    Object.keys(businessData).forEach(function(k){
      bizOptions+='<option value="'+k+'">'+businessData[k].icon+' '+escHtml(businessData[k].name)+'</option>';
    });
  }
  var typeOptions='';
  Object.keys(SERVICE_TYPES).forEach(function(k){
    typeOptions+='<option value="'+k+'">'+SERVICE_TYPES[k].emoji+' '+SERVICE_TYPES[k].label+'</option>';
  });
  var now=new Date();var defDate=now.getFullYear()+'-'+(now.getMonth()+1<10?'0':'')+(now.getMonth()+1);
  return '<div class="slog-form" id="slogForm'+bikeIdx+'">'+
    '<select class="slog-input" id="slogType'+bikeIdx+'">'+typeOptions+'</select>'+
    '<input class="slog-input" type="month" id="slogDate'+bikeIdx+'" value="'+defDate+'">'+
    '<input class="slog-input" type="number" id="slogHours'+bikeIdx+'" placeholder="\u041F\u0440\u0438 \u043A\u043E\u043B\u043A\u043E \u0447\u0430\u0441\u0430">'+
    '<select class="slog-input" id="slogWho'+bikeIdx+'">'+bizOptions+'</select>'+
    '<input class="slog-input" type="number" id="slogCost'+bikeIdx+'" placeholder="\u0426\u0435\u043D\u0430 (\u043B\u0432)">'+
    '<input class="slog-input" id="slogNote'+bikeIdx+'" placeholder="\u0411\u0435\u043B\u0435\u0436\u043A\u0430" maxlength="200">'+
    '<input class="slog-input" id="slogNext'+bikeIdx+'" placeholder="\u0421\u043B\u0435\u0434\u0432\u0430\u0449\u043E (\u043D\u0430 150\u0447 / \u0441\u043B\u0435\u0434 3 \u043C\u0435\u0441.)">'+
    '<button class="btn btn-o" onclick="submitServiceRecord('+bikeIdx+')">\u0417\u0430\u043F\u0438\u0448\u0438</button>'+
  '</div>';
}

function submitServiceRecord(bikeIdx){
  var typeKey=document.getElementById('slogType'+bikeIdx).value;
  var typeInfo=SERVICE_TYPES[typeKey]||SERVICE_TYPES.other;
  var whoKey=document.getElementById('slogWho'+bikeIdx).value;
  var whoName=whoKey==='self'?'\u0410\u0437 \u0441\u0430\u043C':(businessData[whoKey]?businessData[whoKey].name:whoKey);
  var rec={
    date:document.getElementById('slogDate'+bikeIdx).value||'',
    type:typeKey,label:typeInfo.label,
    hours:parseInt(document.getElementById('slogHours'+bikeIdx).value)||0,
    who:whoKey,whoName:whoName,
    cost:parseInt(document.getElementById('slogCost'+bikeIdx).value)||0,
    note:(document.getElementById('slogNote'+bikeIdx).value||'').trim().substring(0,200),
    next:(document.getElementById('slogNext'+bikeIdx).value||'').trim(),
    confirmed:whoKey!=='self'
  };
  addServiceRecord(bikeIdx,rec);
  showToast('\uD83D\uDCD6 \u0417\u0430\u043F\u0438\u0441\u044A\u0442 \u0435 \u0434\u043E\u0431\u0430\u0432\u0435\u043D!','success');
  renderGarage();refreshTierDisplay();
  // Re-open the service book for this bike
  setTimeout(function(){toggleServiceBook(bikeIdx)},50);
}

var _openServiceBook=-1;
var _openAddForm=-1;

function toggleServiceBook(bikeIdx){
  if(_openServiceBook===bikeIdx){_openServiceBook=-1;}
  else{_openServiceBook=bikeIdx;_openAddForm=-1;}
  renderGarage();
  if(_openServiceBook>=0){
    setTimeout(function(){
      var tl=document.querySelector('.slog-timeline');
      var gb=document.getElementById('garageBikes');
      if(tl&&gb)gb.scrollTop=tl.offsetTop-gb.offsetTop-10;
    },50);
  }
}

function toggleAddRecord(bikeIdx){
  if(_openAddForm===bikeIdx){_openAddForm=-1;}
  else{_openAddForm=bikeIdx;_openServiceBook=bikeIdx;}
  renderGarage();
  if(_openAddForm>=0){
    setTimeout(function(){
      var f=document.querySelector('.slog-form');
      var gb=document.getElementById('garageBikes');
      if(f&&gb)gb.scrollTop=f.offsetTop-gb.offsetTop-10;
    },50);
  }
}

function seedServiceDemo(){
  var bikes=getGarage();var log=getServiceLog();
  if(log.length>0)return;
  var yzIdx=-1;
  bikes.forEach(function(b,i){if(b.model.indexOf('YZ250F')>-1||b.model.indexOf('yz250f')>-1)yzIdx=i;});
  if(yzIdx<0&&bikes.length>0)yzIdx=0;
  if(yzIdx<0)return;
  var demo=[
    {bikeIdx:yzIdx,date:'2026-02',type:'other',label:'\u041A\u043E\u043D\u0442\u0440\u0430\u0442\u0435\u0436\u0435\u0441\u0442',hours:120,who:'motohaus',whoName:'\u041C\u043E\u0442\u043E\u0425\u0430\u0443\u0441',cost:180,note:'\u0421\u043C\u0435\u043D\u0435\u043D \u043D\u0430 \u043D\u043E\u0432 OEM',confirmed:true,next:''},
    {bikeIdx:yzIdx,date:'2026-01',type:'suspension',label:'\u041E\u043A\u0430\u0447\u0432\u0430\u043D\u0435 \u0440\u0435\u0432\u0438\u0437\u0438\u044F',hours:110,who:'pesho',whoName:'\u041F\u0435\u0448\u043E \u041C\u0435\u0445\u0430\u043D\u0438\u043A\u0430',cost:350,note:'\u0421\u043C\u044F\u043D\u0430 \u043C\u0430\u0441\u043B\u043E + \u0441\u0435\u043C\u0435\u0440\u0438\u043D\u0433\u0438 WP XPLOR',confirmed:true,next:'\u043D\u0430 160\u0447'},
    {bikeIdx:yzIdx,date:'2025-11',type:'tires',label:'\u0413\u0443\u043C\u0438',hours:95,who:'self',whoName:'\u0410\u0437 \u0441\u0430\u043C',cost:0,note:'Michelin Enduro Medium',confirmed:false,next:''},
    {bikeIdx:yzIdx,date:'2025-09',type:'oil',label:'\u041C\u0430\u0441\u043B\u043E + \u0444\u0438\u043B\u0442\u044A\u0440',hours:80,who:'self',whoName:'\u0410\u0437 \u0441\u0430\u043C',cost:45,note:'Motorex 10W-50',confirmed:false,next:'\u043D\u0430 130\u0447'}
  ];
  saveServiceLog(demo);
}

// ===== MODIFICATION SYSTEM =====
var MOD_TYPES={
  upgrade:{emoji:'\u2B06\uFE0F',label:'\u042A\u043F\u0433\u0440\u0435\u0439\u0434'},
  swap:{emoji:'\uD83D\uDD04',label:'\u0421\u043C\u044F\u043D\u0430'},
  tune:{emoji:'\uD83C\uDF9B\uFE0F',label:'\u0422\u044E\u043D\u0438\u043D\u0433'},
  protection:{emoji:'\uD83D\uDEE1\uFE0F',label:'\u0417\u0430\u0449\u0438\u0442\u0430'},
  cosmetic:{emoji:'\uD83C\uDFA8',label:'\u0412\u0438\u0437\u0443\u0430\u043B\u043D\u0430'}
};
var SYSTEM_ICONS={
  engine:{emoji:'\u2699\uFE0F',label:'\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043B'},
  suspension:{emoji:'\uD83D\uDD27',label:'\u041E\u043A\u0430\u0447\u0432\u0430\u043D\u0435'},
  electrical:{emoji:'\u26A1',label:'\u0415\u043B\u0435\u043A\u0442\u0440\u0438\u043A\u0430'},
  drivetrain:{emoji:'\u26D3\uFE0F',label:'\u0417\u0430\u0434\u0432\u0438\u0436\u0432\u0430\u043D\u0435'},
  wheels:{emoji:'\uD83C\uDFCD\uFE0F',label:'\u041A\u043E\u043B\u0435\u043B\u0430'},
  frame:{emoji:'\uD83D\uDEE1\uFE0F',label:'\u0420\u0430\u043C\u0430 & \u0437\u0430\u0449\u0438\u0442\u0438'}
};

function getMods(){var uid=getCurrentUserId();var key=uid?'orMods_'+uid:'orMods';try{return JSON.parse(localStorage.getItem(key))||[]}catch(e){return[]}}
function saveMods(mods){var uid=getCurrentUserId();var key=uid?'orMods_'+uid:'orMods';localStorage.setItem(key,JSON.stringify(mods))}
function getModsForBike(bikeIdx){return getMods().filter(function(m){return m.bikeIdx===bikeIdx}).sort(function(a,b){return b.date>a.date?1:b.date<a.date?-1:0})}
function getModsForSystem(bikeIdx,system){return getModsForBike(bikeIdx).filter(function(m){return m.system===system})}
function addMod(bikeIdx,mod){var mods=getMods();mod.bikeIdx=bikeIdx;mod.id='mod_'+Date.now();mods.push(mod);saveMods(mods);return mod}
function removeMod(modId){var mods=getMods();var idx=-1;mods.forEach(function(m,i){if(m.id===modId)idx=i});if(idx>-1)mods.splice(idx,1);saveMods(mods)}

function matchBikeToDna(bike){
  if(!bike)return null;
  var mk=(bike.make||'').toLowerCase().replace(/\s+/g,'');
  var md=(bike.model||'').toLowerCase().replace(/\s+/g,'');
  var keys=Object.keys(BIKE_DNA);
  for(var i=0;i<keys.length;i++){
    var d=BIKE_DNA[keys[i]];
    if(d.make.toLowerCase().replace(/\s+/g,'')===mk){
      var dModel=d.model.toLowerCase().replace(/\s+/g,'');
      if(dModel===md||md.indexOf(dModel.split(' ')[0])>-1||dModel.indexOf(md.split(' ')[0])>-1)return keys[i];
    }
  }
  return null;
}

// Mod Map state
var _openModMap=-1;
var _openModSlot=null;
var _openModForm=-1;

function getModMapData(bikeIdx){
  var mods=getModsForBike(bikeIdx);
  var sm={};
  ['engine','suspension','electrical','drivetrain','wheels','frame'].forEach(function(s){
    sm[s]={mods:[],count:0,totalCost:0,status:'stock'};
  });
  mods.forEach(function(m){if(sm[m.system]){sm[m.system].mods.push(m);sm[m.system].count++;sm[m.system].totalCost+=(m.cost||0);sm[m.system].status='modified'}});
  return sm;
}

function renderModMap(bikeIdx,compact){
  var data=getModMapData(bikeIdx);
  var totalMods=0,totalCost=0;
  Object.keys(data).forEach(function(s){totalMods+=data[s].count;totalCost+=data[s].totalCost});
  var h='<div class="mod-map'+(compact?' mod-map-compact':'')+'">';
  h+='<div class="mod-map-header"><span class="mod-map-title">\uD83D\uDD27 MOD MAP</span>';
  h+='<span class="mod-map-stats">'+totalMods+' \u043C\u043E\u0434'+(totalMods!==1?'\u0430':'')+(totalCost?' \u00B7 '+totalCost+' \u043B\u0432':'')+' </span></div>';
  h+='<div class="mod-map-grid">';
  ['engine','suspension','electrical','drivetrain','wheels','frame'].forEach(function(sk){
    var sys=data[sk];var ic=SYSTEM_ICONS[sk];
    var cls=sys.status==='modified'?'mod-slot-modified':'mod-slot-stock';
    var isOpen=_openModSlot&&_openModSlot.bikeIdx===bikeIdx&&_openModSlot.sysKey===sk;
    if(isOpen)cls+=' on';
    h+='<div class="mod-slot '+cls+'" onclick="event.stopPropagation();toggleModSlot('+bikeIdx+',\''+sk+'\')">';
    h+='<div class="mod-slot-emoji">'+ic.emoji+'</div>';
    h+='<div class="mod-slot-name">'+ic.label+'</div>';
    if(sys.count>0){
      h+='<div class="mod-slot-count">'+sys.count+' \u043C\u043E\u0434'+(sys.count>1?'\u0430':'')+'</div>';
      h+='<div class="mod-slot-cost">'+sys.totalCost+' \u043B\u0432</div>';
    }else{
      h+='<div class="mod-slot-stock-label">\u0421\u0422\u041E\u041A</div>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  // Slot detail if open
  if(_openModSlot&&_openModSlot.bikeIdx===bikeIdx){
    h+='<div class="mod-detail-expand">'+renderModSlotDetail(bikeIdx,_openModSlot.sysKey)+'</div>';
  }
  return h;
}

function renderModSlotDetail(bikeIdx,sysKey){
  var mods=getModsForSystem(bikeIdx,sysKey);
  if(!mods.length)return '<div class="mod-detail-empty">\u041D\u044F\u043C\u0430 \u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u0432 \u0442\u0430\u0437\u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u0430.</div>';
  return mods.map(function(m){
    var ti=MOD_TYPES[m.type]||MOD_TYPES.upgrade;
    var whoH=m.installedBy==='self'?'<span>\uD83E\uDDD1\u200D\uD83D\uDD27 \u0410\u0437 \u0441\u0430\u043C</span>':'<span class="link" onclick="event.stopPropagation();openProfile(\''+m.installedBy+'\')">'+escHtml(m.installedByName)+'</span>';
    var partsH=m.parts&&m.parts.length?m.parts.map(function(p){
      var sn=p.from&&businessData[p.from]?businessData[p.from].name:(p.from||'\u2014');
      var shopClick=p.from&&businessData[p.from]?' onclick="event.stopPropagation();openProfile(\''+p.from+'\')"':'';
      return '<div class="mod-part-row"><span>'+escHtml(p.name)+'</span><span class="mod-part-from"'+shopClick+'>'+escHtml(sn)+'</span><span class="mod-part-price">'+p.price+' \u043B\u0432</span></div>';
    }).join(''):'';
    var fLink=m.forumPostId?'<div class="mod-forum-link" onclick="event.stopPropagation();go(\'forum\')">\uD83D\uDCAC \u0412\u0438\u0436 build thread \u2192</div>':'';
    return '<div class="mod-entry"><div class="mod-entry-head">'
      +'<span class="mod-entry-type '+m.type+'">'+ti.emoji+' '+ti.label+'</span>'
      +'<span class="slog-date">'+escHtml(m.date)+'</span>'
      +(m.hours?'<span class="slog-hours">\u043F\u0440\u0438 '+m.hours+'\u0447</span>':'')
      +'<span class="slog-cost">'+m.cost+' \u043B\u0432</span>'
      +'</div><div class="mod-entry-title">'+escHtml(m.title)+'</div>'
      +'<div class="mod-entry-body">\u041C\u043E\u043D\u0442\u0430\u0436: '+whoH+'</div>'
      +(partsH?'<div class="mod-parts">'+partsH+'</div>':'')
      +(m.note?'<div class="slog-note">'+escHtml(m.note)+'</div>':'')
      +fLink+'</div>';
  }).join('');
}

function toggleModMap(bikeIdx){
  if(_openModMap===bikeIdx){_openModMap=-1;_openModSlot=null}else{_openModMap=bikeIdx;_openModSlot=null;_openModForm=-1}
  renderGarage();
}
function toggleModSlot(bikeIdx,sysKey){
  if(_openModSlot&&_openModSlot.bikeIdx===bikeIdx&&_openModSlot.sysKey===sysKey){_openModSlot=null}else{_openModSlot={bikeIdx:bikeIdx,sysKey:sysKey}}
  renderGarage();
}
function toggleModForm(bikeIdx){
  if(_openModForm===bikeIdx){_openModForm=-1}else{_openModForm=bikeIdx;_openModMap=-1;_openModSlot=null;_openServiceBook=-1;_openAddForm=-1}
  renderGarage();
}

var _modPartCount=1;
function renderModForm(bikeIdx){
  var bike=getGarage()[bikeIdx];if(!bike)return'';
  var dnaKey=matchBikeToDna(bike);
  var sysOpts='';
  var sysKeys=Object.keys(SYSTEM_ICONS);
  for(var si=0;si<sysKeys.length;si++){
    sysOpts+='<option value="'+sysKeys[si]+'">'+SYSTEM_ICONS[sysKeys[si]].emoji+' '+SYSTEM_ICONS[sysKeys[si]].label+'</option>';
  }
  var typeOpts='';
  var tKeys=Object.keys(MOD_TYPES);
  for(var ti=0;ti<tKeys.length;ti++){
    typeOpts+='<option value="'+tKeys[ti]+'">'+MOD_TYPES[tKeys[ti]].emoji+' '+MOD_TYPES[tKeys[ti]].label+'</option>';
  }
  var installerOpts='<option value="self">\uD83D\uDEE0\uFE0F \u0421\u0430\u043C</option>';
  var bKeys=Object.keys(businessData);
  for(var bi=0;bi<bKeys.length;bi++){
    var bz=businessData[bKeys[bi]];
    if(bz.type==='mechanic'||bz.type==='specialist'||bz.type==='dealer'){
      installerOpts+='<option value="'+bKeys[bi]+'">'+bz.icon+' '+bz.name+'</option>';
    }
  }
  var shopOpts='<option value="">\u2014 \u043C\u0430\u0433\u0430\u0437\u0438\u043D \u2014</option>';
  for(var sbi=0;sbi<bKeys.length;sbi++){
    var sbz=businessData[bKeys[sbi]];
    shopOpts+='<option value="'+bKeys[sbi]+'">'+sbz.icon+' '+sbz.name+'</option>';
  }
  _modPartCount=1;
  var h='<div class="mod-form">'+
    '<div class="mod-form-title">\u041D\u041E\u0412\u0410 \u041C\u041E\u0414\u0418\u0424\u0418\u041A\u0410\u0426\u0418\u042F \u2014 '+escHtml(bike.make+' '+bike.model)+'</div>'+
    '<input class="slog-input" id="modTitle" placeholder="\u0417\u0430\u0433\u043B\u0430\u0432\u0438\u0435 (\u043D\u0430\u043F\u0440. WP XPLOR \u0440\u0435\u0431\u0438\u043B\u0434)">'+
    '<div class="mod-form-row">'+
      '<select class="slog-input" id="modSystem" onchange="updateModComponents('+bikeIdx+')">'+sysOpts+'</select>'+
      '<select class="slog-input" id="modComponent"><option value="">\u2014 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u2014</option></select>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<select class="slog-input" id="modType">'+typeOpts+'</select>'+
      '<select class="slog-input" id="modInstaller">'+installerOpts+'</select>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input class="slog-input" id="modDate" type="month" value="'+new Date().toISOString().slice(0,7)+'">'+
      '<input class="slog-input" id="modHours" type="number" placeholder="\u0427\u0430\u0441\u043E\u0432\u0435 \u043D\u0430 \u043C\u043E\u0442\u043E\u0440\u0430" min="0">'+
    '</div>'+
    '<div class="mod-parts-section">'+
      '<div class="mod-form-subtitle">\u0427\u0410\u0421\u0422\u0418</div>'+
      '<div id="modPartsContainer">'+
        '<div class="mod-part-input-row">'+
          '<input class="slog-input" placeholder="\u0427\u0430\u0441\u0442" data-mod-part="name" data-idx="0">'+
          '<select class="slog-input" data-mod-part="from" data-idx="0">'+shopOpts+'</select>'+
          '<input class="slog-input" placeholder="\u0426\u0435\u043D\u0430" type="number" data-mod-part="price" data-idx="0">'+
          '<span class="mod-part-remove" onclick="this.parentElement.remove()">\u2715</span>'+
        '</div>'+
      '</div>'+
      '<span class="garage-bike-btn mod-add-part" onclick="addModPartRow()">+ \u0427\u0430\u0441\u0442</span>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input class="slog-input" id="modCost" type="number" placeholder="\u041E\u0431\u0449\u0430 \u0446\u0435\u043D\u0430 (\u043B\u0432)">'+
      '<input class="slog-input" id="modNote" placeholder="\u0411\u0435\u043B\u0435\u0436\u043A\u0430">'+
    '</div>'+
    '<div class="mod-form-actions">'+
      '<span class="garage-bike-btn on" onclick="submitMod('+bikeIdx+')">\uD83D\uDCBE \u0417\u0430\u043F\u0438\u0448\u0438 \u043C\u043E\u0434</span>'+
      '<label class="mod-forum-check"><input type="checkbox" id="modBuildThread"> \u0421\u044A\u0437\u0434\u0430\u0439 build thread</label>'+
    '</div>'+
  '</div>';
  return h;
}

function addModPartRow(){
  var c=document.getElementById('modPartsContainer');if(!c)return;
  var idx=_modPartCount++;
  var shopOpts='<option value="">\u2014 \u043C\u0430\u0433\u0430\u0437\u0438\u043D \u2014</option>';
  var bKeys=Object.keys(businessData);
  for(var i=0;i<bKeys.length;i++){
    shopOpts+='<option value="'+bKeys[i]+'">'+businessData[bKeys[i]].icon+' '+businessData[bKeys[i]].name+'</option>';
  }
  var row=document.createElement('div');
  row.className='mod-part-input-row';
  row.innerHTML='<input class="slog-input" placeholder="\u0427\u0430\u0441\u0442" data-mod-part="name" data-idx="'+idx+'">'+
    '<select class="slog-input" data-mod-part="from" data-idx="'+idx+'">'+shopOpts+'</select>'+
    '<input class="slog-input" placeholder="\u0426\u0435\u043D\u0430" type="number" data-mod-part="price" data-idx="'+idx+'">'+
    '<span class="mod-part-remove" onclick="this.parentElement.remove()">\u2715</span>';
  c.appendChild(row);
}

function updateModComponents(bikeIdx){
  var sel=document.getElementById('modComponent');if(!sel)return;
  var sys=document.getElementById('modSystem');if(!sys)return;
  var sysKey=sys.value;
  sel.innerHTML='<option value="">\u2014 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442 \u2014</option>';
  var bike=getGarage()[bikeIdx];if(!bike)return;
  var dnaKey=matchBikeToDna(bike);
  if(dnaKey&&BIKE_DNA[dnaKey]&&BIKE_DNA[dnaKey].systems[sysKey]){
    var comps=BIKE_DNA[dnaKey].systems[sysKey].components;
    for(var i=0;i<comps.length;i++){
      sel.innerHTML+='<option value="'+comps[i].id+'">'+comps[i].emoji+' '+comps[i].name+'</option>';
    }
  }
}

function submitMod(bikeIdx){
  if(!validateForm([
    {id:'modTitle',rules:[{type:'required',msg:'\u0417\u0430\u0433\u043B\u0430\u0432\u0438\u0435\u0442\u043E \u0435 \u0437\u0430\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E'}]}
  ]))return;
  var title=(document.getElementById('modTitle').value||'').trim();
  var system=document.getElementById('modSystem').value;
  var component=document.getElementById('modComponent').value;
  var type=document.getElementById('modType').value;
  var installer=document.getElementById('modInstaller').value;
  var date=document.getElementById('modDate').value||new Date().toISOString().slice(0,7);
  var hours=parseInt(document.getElementById('modHours').value)||0;
  var cost=parseInt(document.getElementById('modCost').value)||0;
  var note=(document.getElementById('modNote').value||'').trim();
  var buildThread=document.getElementById('modBuildThread')&&document.getElementById('modBuildThread').checked;
  // collect parts
  var parts=[];
  var nameEls=document.querySelectorAll('[data-mod-part="name"]');
  var fromEls=document.querySelectorAll('[data-mod-part="from"]');
  var priceEls=document.querySelectorAll('[data-mod-part="price"]');
  for(var i=0;i<nameEls.length;i++){
    var pn=(nameEls[i].value||'').trim();
    if(pn){
      parts.push({name:pn,from:fromEls[i]?fromEls[i].value:'',price:parseInt(priceEls[i]?priceEls[i].value:0)||0});
    }
  }
  var installerName='\u0421\u0430\u043C';
  if(installer!=='self'&&businessData[installer]){installerName=businessData[installer].name;}
  var mod={
    system:system,component:component,title:title,type:type,
    parts:parts,installedBy:installer,installedByName:installerName,
    cost:cost,date:date,hours:hours,note:note,forumPostId:null,confirmed:true
  };
  var saved=addMod(bikeIdx,mod);
  if(buildThread){createModBuildThread(bikeIdx,saved);}
  _openModForm=-1;_openModMap=bikeIdx;_openModSlot=null;
  renderGarage();
  showToast('\uD83D\uDD27 \u041C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0430!','success');
  refreshTierDisplay();
}

function createModBuildThread(bikeIdx,mod){
  var bike=getGarage()[bikeIdx];if(!bike)return;
  var title='['+bike.make+' '+bike.model+'] \u2014 '+mod.title;
  var body='**\u0422\u0438\u043F:** '+MOD_TYPES[mod.type].emoji+' '+MOD_TYPES[mod.type].label+'\n';
  body+='**\u0421\u0438\u0441\u0442\u0435\u043C\u0430:** '+SYSTEM_ICONS[mod.system].emoji+' '+SYSTEM_ICONS[mod.system].label+'\n';
  if(mod.parts.length){
    body+='\n**\u0427\u0430\u0441\u0442\u0438:**\n';
    mod.parts.forEach(function(p){
      var shopName=p.from&&businessData[p.from]?businessData[p.from].name:'\u2014';
      body+='\u2022 '+p.name+' (\u043E\u0442 '+shopName+')'+( p.price?' \u2014 '+p.price+' \u043B\u0432':'')+'\n';
    });
  }
  body+='\n**\u041C\u043E\u043D\u0442\u0430\u0436:** '+(mod.installedBy==='self'?'\u0421\u0430\u043C':mod.installedByName)+'\n';
  if(mod.cost)body+='**\u041E\u0431\u0449\u0430 \u0446\u0435\u043D\u0430:** '+mod.cost+' \u043B\u0432\n';
  if(mod.note)body+='\n'+mod.note;
  var uid=getCurrentUserId();
  var posts=JSON.parse(localStorage.getItem('orForumPosts')||'[]');
  var post={
    id:'p'+Date.now(),zone:'tech',type:'e',
    title:title,body:body,author:uid,
    date:new Date().toISOString().split('T')[0],
    likes:[],replies:[],tags:[bike.make.toLowerCase(),bike.model.toLowerCase(),mod.system],
    modId:mod.id
  };
  posts.push(post);
  localStorage.setItem('orForumPosts',JSON.stringify(posts));
  // link back
  var mods=getMods();
  for(var i=0;i<mods.length;i++){if(mods[i].id===mod.id){mods[i].forumPostId=post.id;break;}}
  saveMods(mods);
  showToast('\uD83D\uDCDD Build thread \u0441\u044A\u0437\u0434\u0430\u0434\u0435\u043D!','success');
}

// ===== CREDIBILITY BADGE =====
function getGarageCredibility(threadTags){
  var bikes=getGarage();
  if(!bikes.length)return null;
  var totalMonths=0;var matchedBike=null;
  bikes.forEach(function(b){
    totalMonths+=(b.months||0);
    if(!matchedBike&&threadTags&&threadTags.length){
      var bikeStr=(b.make+' '+b.model).toLowerCase();
      threadTags.forEach(function(tag){
        if(bikeStr.indexOf(tag.toLowerCase())>-1||tag.toLowerCase().indexOf(b.model.toLowerCase())>-1)matchedBike=b;
      });
    }
  });
  return {total:bikes.length,totalMonths:totalMonths,years:Math.floor(totalMonths/12),matchedBike:matchedBike};
}

function renderCredibilityBadge(threadTags){
  var cred=getGarageCredibility(threadTags);
  if(!cred)return '';
  var parts=['\uD83C\uDFCD\uFE0F '+cred.total+' \u043C\u043E\u0442\u043E\u0440'+(cred.total>1?'\u0430':'')];
  if(cred.matchedBike){
    var verb=cred.matchedBike.status==='current'?'\u041A\u0430\u0440\u0430\u043C':'\u041A\u0430\u0440\u0430\u043B';
    parts.push(verb+' '+cred.matchedBike.make+' '+cred.matchedBike.model);
  }
  if(cred.years>0)parts.push(cred.years+'+ \u0433\u043E\u0434.');
  return '<span class="cred-badge">'+escHtml(parts.join(' \u00B7 '))+'</span>';
}

function injectCredibilityBadges(){
  document.querySelectorAll('.ft[data-tags]').forEach(function(ft){
    var tags=ft.dataset.tags?ft.dataset.tags.split(','):[];
    var badgeHtml=renderCredibilityBadge(tags);
    if(!badgeHtml)return;
    var ftAuthor=ft.querySelector('.ft-a');
    if(ftAuthor&&!ftAuthor.querySelector('.cred-badge'))ftAuthor.insertAdjacentHTML('beforeend',' '+badgeHtml);
    ft.querySelectorAll('.th-post-h').forEach(function(h){
      if(!h.querySelector('.cred-badge'))h.insertAdjacentHTML('beforeend',badgeHtml);
    });
  });
}

function refreshCredBadges(){
  document.querySelectorAll('.cred-badge').forEach(function(el){el.remove()});
  injectCredibilityBadges();
}

// ===== PROFILE GARAGE SECTION =====
function renderProfileGarage(){
  var bikes=getGarage();
  if(!bikes.length)return '';
  var current=bikes.filter(function(b){return b.status==='current'});
  var past=bikes.filter(function(b){return b.status!=='current'});
  var totalMonths=0;
  bikes.forEach(function(b){totalMonths+=(b.months||0)});
  var years=Math.floor(totalMonths/12);
  var sumParts=[bikes.length+' \u043C\u043E\u0442\u043E\u0440'+(bikes.length>1?'\u0430':'')];
  if(years>0)sumParts.push(years+'+ \u0433\u043E\u0434\u0438\u043D'+(years>1?'\u0438':'\u0430')+' \u043E\u043F\u0438\u0442');
  else if(totalMonths>0)sumParts.push(totalMonths+' \u043C\u0435\u0441\u0435\u0446'+(totalMonths>1?'\u0430':'')+' \u043E\u043F\u0438\u0442');

  function bikeCard(b,idx){
    var stClass=b.status==='current'?'garage-st-current':'garage-st-past';
    var stText=b.status==='current'?'\u041A\u0410\u0420\u0410\u041C \u0421\u0415\u0413\u0410':'\u041A\u0410\u0420\u0410\u041B';
    var c='<div class="prof-garage-bike"><div class="prof-garage-bike-head"><span class="prof-garage-bike-name">'+escHtml(b.make+' '+b.model)+'</span> <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>';
    c+='<div class="prof-garage-bike-year">'+escHtml(String(b.year));
    if(b.months)c+=' \u00B7 '+b.months+' \u043C\u0435\u0441.';
    c+='</div>';
    if(b.note)c+='<div class="prof-garage-bike-note">'+escHtml(b.note)+'</div>';
    // Service log entries
    var records=getServiceLogForBike(idx).slice(0,5);
    if(records.length){
      c+='<div class="prof-slog">';
      records.forEach(function(r){
        var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
        var whoText=r.who==='self'?'\u0410\u0437 \u0441\u0430\u043C':escHtml(r.whoName);
        var confirmed=r.confirmed&&r.who!=='self'?' \u2705':'';
        var costText=r.cost?' \u00B7 '+r.cost+' \u043B\u0432':'';
        c+='<div class="moto-pass-row"><span>'+typeInfo.emoji+' '+escHtml(r.label)+'</span><span>'+whoText+costText+confirmed+'</span></div>';
      });
      c+='</div>';
    }
    // Compact mod map
    var bikeMods=getModsForBike(idx);
    if(bikeMods.length){c+=renderModMap(idx,true);}
    return c+'</div>';
  }
  var archKey=localStorage.getItem('orArchetype');
  var archHtml=archKey&&ARCHETYPES[archKey]?('<span style="color:var(--orange)">'+ARCHETYPES[archKey].emoji+' '+ARCHETYPES[archKey].name+'</span> \u00B7 '):'';
  var info=tierInfo();
  var tierHtml=renderTierBadge(info.key)+' \u00B7 ';
  var progressHtml=renderTierProgress(info);
  return '<div class="prof-sec"><div class="prof-sec-t">\u2699 \u0413\u0410\u0420\u0410\u0416</div><div class="prof-garage-summary">'+tierHtml+archHtml+escHtml(sumParts.join(' \u00B7 '))+'</div>'+progressHtml+current.map(function(b){return bikeCard(b,bikes.indexOf(b))}).join('')+past.map(function(b){return bikeCard(b,bikes.indexOf(b))}).join('')+'</div>';
}

function renderProfileMods(){
  var bikes=getGarage();if(!bikes.length)return '';
  var hasMods=false;
  var h='<div class="prof-sec"><div class="prof-sec-t">\uD83D\uDD27 \u041C\u041E\u0414\u0418\u0424\u0418\u041A\u0410\u0426\u0418\u0418</div>';
  bikes.forEach(function(b,idx){
    var mods=getModsForBike(idx);if(!mods.length)return;
    hasMods=true;
    h+='<div class="prof-mod-bike-name">'+escHtml(b.make+' '+b.model)+'</div>';
    h+=renderModMap(idx,true);
    h+='<div class="prof-mod-log">';
    mods.slice(0,5).forEach(function(m){
      var sysInfo=SYSTEM_ICONS[m.system]||{emoji:'\uD83D\uDD27'};
      h+='<div class="mod-log-row">';
      h+='<span class="mod-log-date">'+escHtml(m.date)+'</span>';
      h+='<span class="mod-log-sys">'+sysInfo.emoji+'</span>';
      h+='<span class="mod-log-title">'+escHtml(m.title)+'</span>';
      if(m.cost)h+='<span class="mod-log-cost">'+m.cost+' \u043B\u0432</span>';
      h+='</div>';
    });
    h+='</div>';
  });
  h+='</div>';
  return hasMods?h:'';
}

// Parameterized versions for any userId
function renderProfileGarageFor(userId){
  try{
    var bikes=JSON.parse(localStorage.getItem('orGarage_'+userId)||'[]').map(migrateBike);
    if(!bikes.length)return '';
    var current=bikes.filter(function(b){return b.status==='current'});
    var past=bikes.filter(function(b){return b.status!=='current'});
    var totalMonths=0;bikes.forEach(function(b){totalMonths+=(b.months||0)});
    var years=Math.floor(totalMonths/12);
    var sumParts=[bikes.length+' \u043C\u043E\u0442\u043E\u0440'+(bikes.length>1?'\u0430':'')];
    if(years>0)sumParts.push(years+'+ \u0433\u043E\u0434\u0438\u043D'+(years>1?'\u0438':'\u0430')+' \u043E\u043F\u0438\u0442');
    else if(totalMonths>0)sumParts.push(totalMonths+' \u043C\u0435\u0441\u0435\u0446'+(totalMonths>1?'\u0430':'')+' \u043E\u043F\u0438\u0442');

    var log=JSON.parse(localStorage.getItem('orServiceLog_'+userId)||'[]');
    var mods=JSON.parse(localStorage.getItem('orMods_'+userId)||'[]');

    function bikeCardFor(b,idx){
      var stClass=b.status==='current'?'garage-st-current':'garage-st-past';
      var stText=b.status==='current'?'\u041A\u0410\u0420\u0410\u041C \u0421\u0415\u0413\u0410':'\u041A\u0410\u0420\u0410\u041B';
      var c='<div class="prof-garage-bike"><div class="prof-garage-bike-head"><span class="prof-garage-bike-name">'+escHtml(b.make+' '+b.model)+'</span> <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>';
      c+='<div class="prof-garage-bike-year">'+escHtml(String(b.year));
      if(b.months)c+=' \u00B7 '+b.months+' \u043C\u0435\u0441.';
      c+='</div>';
      if(b.note)c+='<div class="prof-garage-bike-note">'+escHtml(b.note)+'</div>';
      var records=log.filter(function(r){return r.bikeIdx===idx}).sort(function(a,b2){return b2.date>a.date?1:b2.date<a.date?-1:0}).slice(0,5);
      if(records.length){
        c+='<div class="prof-slog">';
        records.forEach(function(r){
          var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
          var whoText=r.who==='self'?'\u0410\u0437 \u0441\u0430\u043C':escHtml(r.whoName);
          var confirmed=r.confirmed&&r.who!=='self'?' \u2705':'';
          var costText=r.cost?' \u00B7 '+r.cost+' \u043B\u0432':'';
          c+='<div class="moto-pass-row"><span>'+typeInfo.emoji+' '+escHtml(r.label)+'</span><span>'+whoText+costText+confirmed+'</span></div>';
        });
        c+='</div>';
      }
      var bikeMods=mods.filter(function(m){return m.bikeIdx===idx});
      if(bikeMods.length){c+=renderModMap(idx,true)}
      // Bike comments section
      if(typeof renderBikeComments==='function')c+=renderBikeComments(userId,idx);
      return c+'</div>';
    }
    var archKey=userId===getCurrentUserId()?localStorage.getItem('orArchetype'):null;
    var archHtml=archKey&&ARCHETYPES[archKey]?('<span style="color:var(--orange)">'+ARCHETYPES[archKey].emoji+' '+ARCHETYPES[archKey].name+'</span> \u00B7 '):'';
    var tk=calcTierForUser(userId);
    var tierHtml=tk?renderTierBadge(tk)+' \u00B7 ':'';
    return '<div class="prof-sec"><div class="prof-sec-t">\u2699 \u0413\u0410\u0420\u0410\u0416</div><div class="prof-garage-summary">'+tierHtml+archHtml+escHtml(sumParts.join(' \u00B7 '))+'</div>'+current.map(function(b){return bikeCardFor(b,bikes.indexOf(b))}).join('')+past.map(function(b){return bikeCardFor(b,bikes.indexOf(b))}).join('')+'</div>';
  }catch(e){return ''}
}

function renderProfileModsFor(userId){
  try{
    var bikes=JSON.parse(localStorage.getItem('orGarage_'+userId)||'[]').map(migrateBike);
    if(!bikes.length)return '';
    var mods=JSON.parse(localStorage.getItem('orMods_'+userId)||'[]');
    var hasMods=false;
    var h='<div class="prof-sec"><div class="prof-sec-t">\uD83D\uDD27 \u041C\u041E\u0414\u0418\u0424\u0418\u041A\u0410\u0426\u0418\u0418</div>';
    bikes.forEach(function(b,idx){
      var bikeMods=mods.filter(function(m){return m.bikeIdx===idx}).sort(function(a,b2){return b2.date>a.date?1:b2.date<a.date?-1:0});
      if(!bikeMods.length)return;
      hasMods=true;
      h+='<div class="prof-mod-bike-name">'+escHtml(b.make+' '+b.model)+'</div>';
      h+=renderModMap(idx,true);
      h+='<div class="prof-mod-log">';
      bikeMods.slice(0,5).forEach(function(m){
        var sysInfo=SYSTEM_ICONS[m.system]||{emoji:'\uD83D\uDD27'};
        h+='<div class="mod-log-row"><span class="mod-log-date">'+escHtml(m.date)+'</span><span class="mod-log-sys">'+sysInfo.emoji+'</span><span class="mod-log-title">'+escHtml(m.title)+'</span>';
        if(m.cost)h+='<span class="mod-log-cost">'+m.cost+' \u043B\u0432</span>';
        h+='</div>';
      });
      h+='</div>';
    });
    h+='</div>';
    return hasMods?h:'';
  }catch(e){return ''}
}

function seedModsDemo(){
  var key='orMods_marin';
  if(localStorage.getItem(key))return;
  var mods=[
    {id:'mod_seed1',bikeIdx:0,system:'suspension',component:'fork',title:'WP XPLOR \u0440\u0435\u0431\u0438\u043B\u0434 + \u043F\u0440\u0443\u0436\u0438\u043D\u0438',type:'upgrade',
      parts:[{name:'WP \u043F\u0440\u0443\u0436\u0438\u043D\u0438 5.0',from:'motohaus',price:280},{name:'SKF \u0441\u0435\u043C\u0435\u0440\u0438\u043D\u0433\u0438',from:'motohaus',price:45}],
      installedBy:'pesho',installedByName:'\u041F\u0435\u0448\u043E \u041C\u0435\u0445\u0430\u043D\u0438\u043A\u0430',cost:680,date:'2026-01',hours:120,note:'\u041F\u043E-\u0442\u0432\u044A\u0440\u0434\u0438 \u043F\u0440\u0443\u0436\u0438\u043D\u0438 \u0437\u0430 95\u043A\u0433 \u0435\u0437\u0434\u0430\u0447',forumPostId:null,confirmed:true},
    {id:'mod_seed2',bikeIdx:0,system:'electrical',component:'ecu',title:'GET ECU \u0440\u0435\u043C\u0430\u043F',type:'tune',
      parts:[{name:'GET GPA \u043A\u0438\u0442',from:'edimoto_shop',price:320}],
      installedBy:'gosho',installedByName:'\u0413\u043E\u0448\u043E \u0415\u043B\u0435\u043A\u0442\u0440\u043E',cost:450,date:'2026-02',hours:140,note:'Power map \u0437\u0430 \u0435\u043D\u0434\u0443\u0440\u043E + \u0434\u044A\u0436\u0434',forumPostId:null,confirmed:true},
    {id:'mod_seed3',bikeIdx:0,system:'frame',component:'guards',title:'\u041F\u044A\u043B\u0435\u043D \u043F\u0430\u043A\u0435\u0442 \u043F\u0440\u0435\u0434\u043F\u0430\u0437\u0438\u0442\u0435\u043B\u0438',type:'protection',
      parts:[{name:'\u041A\u0430\u0440\u0442\u0435\u0440\u043D\u0430 \u0437\u0430\u0449\u0438\u0442\u0430 AXP',from:'motohaus',price:120},{name:'\u041F\u0440\u043E\u0442\u0435\u043A\u0442\u043E\u0440\u0438 \u0440\u044A\u0446\u0435 Acerbis',from:'motohaus',price:85},{name:'\u0420\u0430\u0434\u0438\u0430\u0442\u043E\u0440 \u0433\u0440\u0438\u043B',from:'motohaus',price:65}],
      installedBy:'self',installedByName:'\u0421\u0430\u043C',cost:270,date:'2025-12',hours:90,note:'\u041C\u043E\u043D\u0442\u0430\u0436 \u0432 \u0433\u0430\u0440\u0430\u0436\u0430 \u0437\u0430 2 \u0447\u0430\u0441\u0430',forumPostId:null,confirmed:true}
  ];
  localStorage.setItem(key,JSON.stringify(mods));
}
