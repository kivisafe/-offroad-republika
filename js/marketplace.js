// ===== MARKETPLACE MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar, validateForm, renderMarkdown)
// Also uses globals from app.js: getCurrentUser, getCurrentUserId, getUsers, toggleAuthModal,
//   closeModal, go, _hashNav, openProfile, renderTierBadge, refreshHome,
//   skeletonThenRender, initCardObserver
// Also uses from forum.js: calcTierForUser
// Also uses from social.js: openSendMessage
// Also uses from garage.js: getGarage, getModsForBike, getServiceLogForBike, SERVICE_TYPES, SYSTEM_ICONS

// ===== МАЗЕТО LISTINGS =====
function getListings(){try{return JSON.parse(localStorage.getItem('orListings'))||[]}catch(e){return[]}}
function saveListings(l){localStorage.setItem('orListings',JSON.stringify(l))}
var SEED_LISTINGS=[
  {id:'seed_lst1',author:'marin',type:'part',title:'WP XPLOR пружини 5.0',desc:'Свалени при ъпгрейд. 50 моточаса, перфектни. Стават за 85-95кг ездач.',price:180,city:'Бургас',condition:'used',date:'2026-03-04',active:true,imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/WP_Suspension_logo.svg/200px-WP_Suspension_logo.svg.png'},
  {id:'seed_lst2',author:'ivo',type:'gear',title:'Alpinestars Tech 7 ботуши',desc:'Размер 44, два сезона. Малко надраскани отвън, вътре перфектни.',price:420,city:'София',condition:'used',date:'2026-03-03',active:true},
  {id:'seed_lst3',author:'marin',type:'bike',title:'KTM 250 SX-F 2020',desc:'Крос машина, 120 моточаса, пълна история. Картер AXP, ръчки Renthal, GET ECU.',price:9800,city:'Бургас',condition:'used',date:'2026-03-01',active:true,imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/KTM-Logo.svg/200px-KTM-Logo.svg.png'},
  {id:'seed_lst4',author:'gosho',type:'part',title:'GET GPA ECU кит за EXC 300 TPI',desc:'Нов, неотварян. Купен от Италия. Пълен кит с кабели и инструкция.',price:380,city:'Пловдив',condition:'new',date:'2026-02-28',active:true}
];

function findListing(listingId){
  var listings=getListings();
  for(var i=0;i<listings.length;i++){if(listings[i].id===listingId)return listings[i]}
  for(var i=0;i<SEED_LISTINGS.length;i++){if(SEED_LISTINGS[i].id===listingId)return SEED_LISTINGS[i]}
  return null;
}

function renderListingDetail(listing){
  var users=getUsers();
  var author=users[listing.author]||{name:'Анонимен',emoji:'👤',role:'rider',id:listing.author};
  var typeEmoji=listing.type==='bike'?'🏍️':listing.type==='gear'?'🧤':'⚙️';
  var typeLabel=listing.type==='bike'?'Мотор':listing.type==='gear'?'Екипировка':'Част';
  var condLabel=listing.condition==='new'?'Ново':listing.condition==='rebuild'?'Ребилд':'Употребявано';
  var condCls=listing.condition==='new'?'color:var(--green)':listing.condition==='rebuild'?'color:var(--orange)':'color:var(--text2)';
  var priceStr=listing.price?listing.price+' лв <span style="color:var(--text2);font-size:14px">/ '+Math.round(listing.price/1.956)+' €</span>':'По договаряне';
  var uid=getCurrentUserId();
  var h='<div class="listing-detail">';

  // Hero image (if imageUrl provided)
  if(listing.imageUrl){
    h+='<div class="listing-hero"><img src="'+escHtml(listing.imageUrl)+'" alt="'+escHtml(listing.title)+'" class="listing-hero-img" onerror="this.style.display=\'none\'"></div>';
  }

  // Header
  h+='<div style="padding:24px 24px 16px;border-bottom:1px solid var(--border)">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap"><span style="font-size:24px">'+typeEmoji+'</span><span class="badge b-cpo" style="font-size:10px">'+typeLabel+'</span><span class="badge" style="font-size:10px;'+condCls+'">'+condLabel+'</span></div>';
  h+='<div style="font:700 22px \'Bebas Neue\',sans-serif;letter-spacing:1px;color:var(--text)">'+escHtml(listing.title)+'</div>';
  h+='<div style="font:700 20px \'Bebas Neue\',sans-serif;color:var(--orange);margin-top:6px">'+priceStr+'</div>';
  h+='</div>';

  // Body
  h+='<div style="padding:16px 24px">';

  // External link
  if(listing.externalUrl){
    h+='<div style="margin-bottom:12px"><a href="'+escHtml(listing.externalUrl)+'" target="_blank" rel="noopener" class="listing-ext-link">🔗 Виж оригиналната обява →</a></div>';
  }

  // Description
  h+='<div class="prof-sec"><div class="prof-sec-t">📝 ОПИСАНИЕ</div><div style="font:400 13px \'Exo 2\',sans-serif;color:var(--text2);line-height:1.6">'+renderMarkdown(listing.desc)+'</div></div>';

  // Mods section (if listing has copied mods from garage)
  if(listing.mods&&listing.mods.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🔧 МОДИФИКАЦИИ ('+listing.mods.length+')</div>';
    h+='<div class="listing-mods-list">';
    listing.mods.forEach(function(m){
      var sysInfo=(typeof SYSTEM_ICONS!=='undefined'&&SYSTEM_ICONS[m.system])||{emoji:'🔧'};
      h+='<div class="listing-mod-row">';
      h+='<span class="listing-mod-sys">'+sysInfo.emoji+'</span>';
      h+='<span class="listing-mod-title">'+escHtml(m.title)+'</span>';
      if(m.type)h+='<span class="badge" style="font-size:9px;color:var(--earth)">'+escHtml(m.type)+'</span>';
      if(m.cost)h+='<span style="font:500 11px \'JetBrains Mono\',monospace;color:var(--orange)">'+m.cost+' лв</span>';
      h+='</div>';
    });
    h+='</div></div>';
  }

  // Service log section (if listing has copied service log)
  if(listing.serviceLog&&listing.serviceLog.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">📋 СЕРВИЗНА КНИЖКА ('+listing.serviceLog.length+' записа)</div>';
    h+='<div class="listing-service-list">';
    listing.serviceLog.forEach(function(r){
      var typeInfo=(typeof SERVICE_TYPES!=='undefined'&&SERVICE_TYPES[r.type])||{emoji:'📝',label:'Друго'};
      var whoText=r.who==='self'?'Аз сам':escHtml(r.whoName||'');
      var confirmed=r.confirmed&&r.who!=='self'?' ✅':'';
      var costText=r.cost?' · '+r.cost+' лв':'';
      h+='<div class="listing-service-row"><span>'+typeInfo.emoji+' '+escHtml(r.label)+'</span><span>'+whoText+costText+confirmed+'</span></div>';
    });
    h+='</div></div>';
  }

  // Details grid
  h+='<div class="prof-sec"><div class="prof-sec-t">📋 ДЕТАЙЛИ</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📍 Местоположение</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+escHtml(listing.city||'Не е посочен')+'</div>';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📅 Публикувана</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+timeAgo(listing.date)+'</div>';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📦 Състояние</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+condLabel+'</div>';
  if(listing.bikeLink)h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">🏍️ От гаража</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--green)">Да — с история</div>';
  h+='</div></div>';

  // Seller info
  h+='<div class="prof-sec"><div class="prof-sec-t">👤 ПРОДАВАЧ</div>';
  h+='<div style="display:flex;align-items:center;gap:10px;padding:8px 0">';
  h+=userAvatar(author,36);
  h+='<div><div style="font:600 13px \'Exo 2\',sans-serif;color:var(--text)">'+escHtml(author.name)+'</div>';
  h+='<div style="font:400 11px \'Exo 2\',sans-serif;color:var(--text2)">📍 '+escHtml(author.city||'—');
  if(author.role==='rider'){var tk=calcTierForUser(listing.author);if(tk)h+=' · '+renderTierBadge(tk)}
  h+='</div></div></div></div>';
  h+='</div>';

  // Actions
  h+='<div class="prof-actions">';
  h+='<button class="btn btn-o" onclick="closeModal();setTimeout(function(){openProfile(\''+escHtml(listing.author)+'\')},300)">👤 Виж профил</button>';
  if(uid&&uid!==listing.author){
    h+='<button class="btn btn-o" onclick="closeModal();setTimeout(function(){openSendMessage(\''+escHtml(listing.author)+'\')},300)">✉️ Прати съобщение</button>';
  }
  h+='<button class="btn btn-s" onclick="closeModal();setTimeout(function(){showAuthorListings(\''+escHtml(listing.author)+'\')},300)">📦 Други обяви от '+escHtml(author.name)+'</button>';
  if(uid===listing.author&&listing.id.indexOf('seed_')!==0){
    h+='<button class="btn btn-s" style="color:#e85454;border-color:#e85454" onclick="deleteListing(\''+escHtml(listing.id)+'\')">🗑️ Изтрий обявата</button>';
  }
  h+='<button class="btn btn-s" onclick="closeModal()">Затвори</button>';
  h+='</div>';
  return h;
}

function openListing(listingId){
  var listing=findListing(listingId);
  if(!listing){showToast('Обявата не е намерена');return}
  if(!listing.active){showToast('Тази обява вече не е активна');return}
  if(!_hashNav)location.hash='#listing/'+listingId;
  // Safe: all dynamic content is escaped with escHtml in renderListingDetail
  var html=renderListingDetail(listing);
  document.getElementById('modalContent').innerHTML=html;
  document.getElementById('modalBg').classList.add('on');
  document.body.style.overflow='hidden';
}

function deleteListing(listingId){
  var listings=getListings();
  var found=false;
  for(var i=0;i<listings.length;i++){
    if(listings[i].id===listingId){listings[i].active=false;found=true;break}
  }
  if(found){
    saveListings(listings);closeModal();
    renderDynamicListings();refreshHome();
    showToast('✅ Обявата е изтрита','success');
  }else{showToast('Не можеш да изтриеш тази обява')}
}

function showAuthorListings(authorId){go('maze')}

// ===== LISTING FORM =====
// prefill param: optional object {title, desc, type, condition, price, city, imageUrl, externalUrl, bikeLink, mods, serviceLog}
var _listingPrefill=null;
function showListingForm(prefill){
  var area=document.getElementById('listingFormArea');if(!area)return;
  if(!prefill&&area.querySelector('.listing-form')){area.innerHTML='';return}
  if(!getCurrentUser()){toggleAuthModal();return}
  _listingPrefill=prefill||null;
  var pf=_listingPrefill||{};
  // Safe: all prefill values are from localStorage (trusted) and escaped with escHtml
  area.innerHTML='<div class="listing-form"><div class="mod-form-title">'+(pf.bikeLink?'ПРОДАЙ ОТ ГАРАЖА':'НОВА ОБЯВА')+'</div>'+
    '<input id="lstTitle" placeholder="Заглавие (напр. WP вилка XPLOR 48)" maxlength="80" value="'+escHtml(pf.title||'')+'">'+
    '<textarea id="lstDesc" placeholder="Описание — състояние, причина за продажба...">'+(pf.desc?escHtml(pf.desc):'')+'</textarea>'+
    '<div class="mod-form-row">'+
      '<select id="lstType"><option value="part"'+(pf.type==='part'?' selected':'')+'>⚙️ Част</option><option value="bike"'+(pf.type==='bike'?' selected':'')+'>🏍️ Мотор</option><option value="gear"'+(pf.type==='gear'?' selected':'')+'>🧤 Екипировка</option></select>'+
      '<select id="lstCond"><option value="used"'+(pf.condition==='used'||!pf.condition?' selected':'')+'>Употребявано</option><option value="new"'+(pf.condition==='new'?' selected':'')+'>Ново</option><option value="rebuild"'+(pf.condition==='rebuild'?' selected':'')+'>Ребилд</option></select>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input id="lstPrice" type="number" placeholder="Цена (лв)" value="'+(pf.price||'')+'">'+
      '<input id="lstCity" placeholder="Град" value="'+escHtml(pf.city||'')+'">'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input id="lstImageUrl" placeholder="Линк към снимка (https://...)" value="'+escHtml(pf.imageUrl||'')+'" oninput="updateListingThumbPreview()">'+
      '<input id="lstExtUrl" placeholder="Линк към обявата (mobile.bg, OLX...)" value="'+escHtml(pf.externalUrl||'')+'">'+
    '</div>'+
    '<div id="lstThumbPreview" class="listing-thumb-preview">'+(pf.imageUrl?'<img src="'+escHtml(pf.imageUrl)+'" onerror="this.parentNode.innerHTML=\'\'">':'')+'</div>'+
    (pf.bikeLink?'<div style="font:400 11px \'Exo 2\',sans-serif;color:var(--green);margin:6px 0">✅ Модификации ('+((pf.mods||[]).length)+') и сервизна книжка ('+((pf.serviceLog||[]).length)+' записа) ще бъдат включени в обявата</div>':'')+
    '<div class="mod-form-actions">'+
      '<button class="btn btn-o" onclick="submitListing()">Публикувай</button>'+
      '<button class="btn btn-s" onclick="document.getElementById(\'listingFormArea\').innerHTML=\'\';_listingPrefill=null">Откажи</button>'+
    '</div></div>';
  document.getElementById('lstTitle').focus();
  // Scroll to form
  area.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function updateListingThumbPreview(){
  var url=(document.getElementById('lstImageUrl').value||'').trim();
  var prev=document.getElementById('lstThumbPreview');
  if(!prev)return;
  if(url&&(url.indexOf('http://')===0||url.indexOf('https://')===0)){
    // Safe: URL from user input is escaped, img onerror handles broken URLs
    prev.innerHTML='<img src="'+escHtml(url)+'" onerror="this.parentNode.innerHTML=\'\'">';
  }else{
    prev.innerHTML='';
  }
}

function submitListing(){
  if(!validateForm([
    {id:'lstTitle',rules:[{type:'required',msg:'Заглавието е задължително'},{type:'minlength',value:3,msg:'Минимум 3 символа'}]},
    {id:'lstDesc',rules:[{type:'required',msg:'Описанието е задължително'},{type:'minlength',value:10,msg:'Поне 10 символа'}]}
  ]))return;
  var title=(document.getElementById('lstTitle').value||'').trim();
  var desc=(document.getElementById('lstDesc').value||'').trim();
  var imageUrl=(document.getElementById('lstImageUrl').value||'').trim();
  var extUrl=(document.getElementById('lstExtUrl').value||'').trim();
  var user=getCurrentUser();if(!user){toggleAuthModal();return}
  var listing={
    id:'lst_'+Date.now(),author:user.id,
    type:document.getElementById('lstType').value,
    title:title,desc:desc,
    price:parseInt(document.getElementById('lstPrice').value)||0,
    city:(document.getElementById('lstCity').value||'').trim()||'Не е посочен',
    condition:document.getElementById('lstCond').value,
    date:new Date().toISOString().split('T')[0],
    active:true
  };
  if(imageUrl)listing.imageUrl=imageUrl;
  if(extUrl)listing.externalUrl=extUrl;
  // Copy prefill data (mods, serviceLog, bikeLink) from garage-to-maze flow
  var pf=_listingPrefill||{};
  if(pf.bikeLink)listing.bikeLink=pf.bikeLink;
  if(pf.mods&&pf.mods.length)listing.mods=pf.mods;
  if(pf.serviceLog&&pf.serviceLog.length)listing.serviceLog=pf.serviceLog;

  var listings=getListings();listings.unshift(listing);saveListings(listings);
  document.getElementById('listingFormArea').innerHTML='';
  _listingPrefill=null;
  renderDynamicListings();refreshHome();
  showToast('✅ Обявата е публикувана!','success');
}

function renderDynamicListings(){
  var container=document.getElementById('dynamicListings');if(!container)return;
  var listings=getListings().filter(function(l){return l.active});
  var all=listings.concat(SEED_LISTINGS);
  if(!all.length){container.innerHTML='<div class="empty-state"><div class="empty-state-icon">🔩</div><div class="empty-state-title">НЯМА ОБЯВИ</div><div class="empty-state-desc">Мазето е празно. Публикувай първата обява!</div><button class="btn btn-o" onclick="showListingForm()">＋ Нова обява</button></div>';return}
  skeletonThenRender('dynamicListings','listings',Math.min(all.length,4),function(){
    var users=getUsers();
    // Safe: all dynamic values are escaped with escHtml, imageUrl from trusted localStorage
    container.innerHTML='<div class="g-maze">'+all.map(function(l,idx){
      var author=users[l.author]||{name:'Анонимен',emoji:'👤'};
      var typeEmoji=l.type==='bike'?'🏍️':l.type==='gear'?'🧤':'⚙️';
      var condLabel=l.condition==='new'?'Ново':l.condition==='rebuild'?'Ребилд':'Употребявано';
      var priceStr=l.price?l.price+' лв <span class="dual">/ '+Math.round(l.price/1.956)+' €</span>':'По договаряне';
      var uid=getCurrentUserId();
      var msgBtn=(uid&&uid!==l.author)?'<div style="margin-top:8px"><button class="btn btn-o" style="font-size:10px" onclick="event.stopPropagation();openSendMessage(\''+l.author+'\')">Прати съобщение</button></div>':'';
      var thumbHtml=l.imageUrl?'<div class="listing-card-thumb"><img src="'+escHtml(l.imageUrl)+'" onerror="this.parentNode.style.display=\'none\'" alt=""></div>':'';
      var garageTag=l.bikeLink?'<span class="chip" style="background:var(--green);color:var(--bg);font-size:9px">🏍️ От гаража</span>':'';
      return '<div class="mc mc-dynamic card-enter" data-enter-delay="'+idx+'" onclick="openListing(\''+l.id+'\')" style="cursor:pointer">'+thumbHtml+'<div class="mc-top"><span class="mc-em">'+typeEmoji+'</span><span class="price">'+priceStr+'</span></div><div class="mc-nm">'+escHtml(l.title)+'</div><div class="mc-d">'+escHtml(l.desc)+'</div><div style="display:flex;gap:4px;margin:4px 0;flex-wrap:wrap"><span class="chip chip-cond">'+condLabel+'</span>'+garageTag+'</div><div class="mc-sell">📍 '+escHtml(l.city)+' · '+userAvatar(author,18)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+l.author+'\')">'+escHtml(author.name)+'</strong> · <span class="time-ago" title="'+escHtml(l.date)+'">'+timeAgo(l.date)+'</span></div>'+msgBtn+'</div>';
    }).join('')+'</div>';
    initCardObserver();
  });
}

// ===== GARAGE → MAZE FLOW =====
function sellBike(bikeIdx){
  var uid=getCurrentUserId();
  if(!uid){toggleAuthModal();return}
  var bikes=getGarage();
  var bike=bikes[bikeIdx];
  if(!bike){showToast('Мотор не е намерен');return}
  var mods=getModsForBike(bikeIdx);
  var services=getServiceLogForBike(bikeIdx);
  var user=getCurrentUser();

  // Build auto-description
  var desc=bike.make+' '+bike.model+' ('+bike.year+')\n';
  if(bike.note)desc+=bike.note+'\n';
  if(bike.months)desc+=bike.months+' месеца опит\n';
  if(mods.length){
    desc+='\n🔧 Модификации ('+mods.length+'):\n';
    mods.forEach(function(m){
      var sysInfo=(typeof SYSTEM_ICONS!=='undefined'&&SYSTEM_ICONS[m.system])||{emoji:'🔧'};
      desc+='- '+m.title;
      if(m.type)desc+=' ('+m.type+')';
      if(m.system)desc+=' — '+m.system;
      desc+='\n';
    });
  }
  if(services.length){
    desc+='\n📋 Сервизна книжка ('+services.length+' записа):\n';
    services.slice(0,10).forEach(function(r){
      var whoText=r.who==='self'?'Аз сам':(r.whoName||'');
      desc+='- '+r.date+': '+r.label+' — '+whoText;
      if(r.cost)desc+=' ('+r.cost+' лв)';
      if(r.confirmed&&r.who!=='self')desc+=' ✅';
      desc+='\n';
    });
  }

  // Close garage panel and navigate to maze tab, then open listing form pre-filled
  var gp=document.getElementById('garagePanel');if(gp)gp.classList.remove('on');
  go('maze');
  setTimeout(function(){
    showListingForm({
      title:bike.make+' '+bike.model+' '+bike.year,
      desc:desc.trim(),
      type:'bike',
      condition:'used',
      city:user&&user.city?user.city:'',
      bikeLink:{userId:uid,bikeIdx:bikeIdx},
      mods:mods.map(function(m){return{system:m.system,component:m.component,title:m.title,type:m.type,cost:m.cost,date:m.date}}),
      serviceLog:services.map(function(r){return{type:r.type,label:r.label,date:r.date,who:r.who,whoName:r.whoName,cost:r.cost,confirmed:r.confirmed}})
    });
  },200);
}
