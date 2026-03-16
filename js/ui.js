// ===== UI & NAVIGATION MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar)
// Provides: go, entryGo, showEntry, openProfile, closeModal, initShopTabs,
//   toggleThread, toggleStory, toggleEvent, toggleMoto, search functions,
//   togglePM, AI chat, skeleton screens, card observer, animateCounter,
//   toggleMobileNav, handleRoute, sticky topbar

// ===== HASH ROUTING =====
var _hashNav=false; // guard: true when hashchange triggers navigation

function showEntry(){
  document.getElementById('entryBox').style.display='';
  document.getElementById('nav').style.display='none';
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('on')});
  document.querySelectorAll('.ntab').forEach(function(n){n.classList.remove('on')});
}

var _tabSwitching=false;
function go(t){
  if(t==='shops'||t==='masters') t='dir';
  if(t==='map') t='events';
  // Clear search on navigation
  hideSearchDrop();var _si=document.getElementById('searchIn');if(_si)_si.value='';
  // Set hash unless triggered by hashchange
  if(!_hashNav) location.hash='#'+t;
  _tabSwitching=true;
  var wall=document.querySelector('.wall');
  if(wall){
    // Only update section theme — NO sec-fade on .wall (causes full-page flicker)
    wall.className=wall.className.replace(/wall--\w+/g,'').trim();
    wall.classList.add('wall--'+t);
  }
  // Update wall tint overlay
  var tint=document.getElementById('wallTint');
  if(tint){
    var tints={home:'rgba(232,98,44,.03)',forum:'rgba(212,148,60,.05)',
      maze:'rgba(184,115,51,.04)',events:'rgba(90,138,60,.05)',
      academy:'rgba(70,130,180,.04)',dir:'rgba(139,109,75,.04)'};
    tint.style.background=tints[t]||'transparent';
  }
  document.querySelectorAll('.ntab').forEach(n=>n.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(n=>n.classList.remove('on'));
  const el=document.getElementById('t-'+t);
  // .tab CSS animation:fadeIn handles the entrance — no reflow trick needed
  if(el) el.classList.add('on');
  const map={home:0,dir:1,forum:2,maze:3,academy:4,events:5};
  document.querySelectorAll('.ntab')[map[t]]?.classList.add('on');
  document.getElementById('nav').style.display='';
  document.getElementById('entryBox').style.display='none';
  if(t==='forum') forumHome();
  // Track directory visit for registration checklist
  if(t==='dir'){var _uid=getCurrentUserId();if(_uid)localStorage.setItem('orDirVisited_'+_uid,'1')}
  // Close mobile nav if open
  var nav=document.getElementById('nav');if(nav)nav.classList.remove('mobile-show');
  var hb=document.getElementById('hamburger');if(hb)hb.classList.remove('open');
  // Update bottom mobile nav
  document.querySelectorAll('.bnav-btn').forEach(function(b){b.classList.toggle('on',b.dataset.t===t)});
  document.body.style.overflow='';
  window.scrollTo({top:0,behavior:'smooth'});
  // Allow skeletons again after tab content has rendered
  setTimeout(function(){_tabSwitching=false},50);
}

function entryGo(tab, filter){
  document.getElementById('entryBox').style.display='none';
  document.getElementById('nav').style.display='';
  // Un-hide all tabs for CSS system to work
  document.querySelectorAll('.tab').forEach(t=>t.style.display='');
  // Set hash for dir filter
  if(filter && tab==='dir' && !_hashNav) location.hash='#dir/'+filter;
  go(tab);
  // Pre-activate directory filter if specified
  if(filter && tab==='dir'){
    setTimeout(()=>{
      const f=document.querySelector('#dirFilters .df[data-fc="'+filter+'"]');
      if(f) f.click();
    },100);
  }
}

document.querySelectorAll('.ntab').forEach(n=>{
  n.addEventListener('click',()=>go(n.dataset.t));
});

function openProfile(id){
  if(id==='me')id=getCurrentUserId();
  if(!id){toggleAuthModal();return}
  // Track profile view
  trackProfileView(id);
  // Set hash for profile
  if(!_hashNav) location.hash='#profile/'+id;
  var html=renderDynamicProfile(id);
  if(!html)return;
  document.getElementById('modalContent').innerHTML=html;
  document.getElementById('modalBg').classList.add('on');
  document.body.style.overflow='hidden';
  // Init shop tabs if present
  initShopTabs();
  // V10: Render dynamic offers from businessData
  renderProfileOffers(id);
}

// ===== BUSINESS ANALYTICS =====
function trackProfileView(profileId){
  var key='orAnalytics_'+profileId;
  var data;try{data=JSON.parse(localStorage.getItem(key))||{}}catch(e){data={}}
  data.views=(data.views||0)+1;
  var today=new Date().toISOString().slice(0,10);
  if(!data.viewsByDay)data.viewsByDay={};
  data.viewsByDay[today]=(data.viewsByDay[today]||0)+1;
  localStorage.setItem(key,JSON.stringify(data));
}
function trackProfileClick(profileId,action){
  var key='orAnalytics_'+profileId;
  var data;try{data=JSON.parse(localStorage.getItem(key))||{}}catch(e){data={}}
  if(!data.clicks)data.clicks={};
  data.clicks[action]=(data.clicks[action]||0)+1;
  localStorage.setItem(key,JSON.stringify(data));
}
function getProfileAnalytics(profileId){
  try{return JSON.parse(localStorage.getItem('orAnalytics_'+profileId))||{}}catch(e){return{}}
}
function renderBizAnalytics(userId){
  var data=getProfileAnalytics(userId);
  if(!data.views)return '';
  var h='<div class="prof-sec"><div class="prof-sec-t">📊 АНАЛИТИКА</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">';
  h+='<div class="biz-stat-box"><div class="biz-stat-n">'+(data.views||0)+'</div><div class="biz-stat-l">Преглеждания</div></div>';
  var msgClicks=data.clicks?data.clicks.message||0:0;
  h+='<div class="biz-stat-box"><div class="biz-stat-n">'+msgClicks+'</div><div class="biz-stat-l">Съобщения</div></div>';
  var totalClicks=0;if(data.clicks)Object.keys(data.clicks).forEach(function(k){totalClicks+=data.clicks[k]});
  h+='<div class="biz-stat-box"><div class="biz-stat-n">'+totalClicks+'</div><div class="biz-stat-l">Кликове</div></div>';
  h+='</div>';
  // Last 7 days mini chart
  if(data.viewsByDay){
    var days=[];var today=new Date();
    for(var d=6;d>=0;d--){
      var dt=new Date(today);dt.setDate(dt.getDate()-d);
      var dk=dt.toISOString().slice(0,10);
      days.push({label:dt.getDate()+'.'+(dt.getMonth()+1),count:data.viewsByDay[dk]||0});
    }
    var max=Math.max.apply(null,days.map(function(d){return d.count}))||1;
    h+='<div style="display:flex;align-items:flex-end;gap:4px;height:40px;margin-top:8px">';
    days.forEach(function(d){
      var pct=Math.max(4,Math.round(d.count/max*36));
      h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="width:100%;height:'+pct+'px;background:var(--orange);border-radius:2px;opacity:.7"></div><span style="font:400 8px \'JetBrains Mono\',monospace;color:var(--text2);margin-top:2px">'+d.label+'</span></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function closeModal(){
  document.getElementById('modalBg').classList.remove('on');
  document.body.style.overflow='';
  // If hash is profile or listing route, go back in history
  if(location.hash.indexOf('#profile/')===0||location.hash.indexOf('#listing/')===0) history.back();
}

function initShopTabs(){
  const tabs=document.getElementById('shopTabs');
  if(!tabs)return;
  tabs.querySelectorAll('.ptab').forEach(t=>{
    t.addEventListener('click',()=>{
      tabs.querySelectorAll('.ptab').forEach(x=>x.classList.remove('on'));
      document.querySelectorAll('.ptab-c').forEach(x=>x.classList.remove('on'));
      t.classList.add('on');
      const target=document.getElementById('pt-'+t.dataset.pt);
      if(target)target.classList.add('on');
    });
  });
}

function toggleThread(el){
  const thread=el.querySelector('.thread');
  if(thread)thread.classList.toggle('on');
}

function toggleStory(el){
  el.classList.toggle('open');
}
function toggleEvent(el){
  el.classList.toggle('open');
  const more=el.querySelector('.fc-more');
  if(more) more.style.display=el.classList.contains('open')?'none':'';
}
function toggleMoto(el){
  el.classList.toggle('open');
}

// Maze subtabs
document.querySelectorAll('.mzt').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.mzt').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.mz-sub').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    document.getElementById('s-'+t.dataset.s)?.classList.add('on');
    if(t.dataset.s==='dna')renderDnaModels();
  });
});

// Academy subtabs
document.querySelectorAll('#acadTabs .act').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('#acadTabs .act').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('#t-academy .ac-sub').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    document.getElementById('ac-'+t.dataset.ac)?.classList.add('on');
  });
});

// Moto filters — AND logic between level and type + counter
(function(){
  var activeLevel=null, activeType=null;
  function filterMotos(){
    var visible=0;
    document.querySelectorAll('#motoGrid .mc').forEach(function(card){
      var cardLevels=(card.dataset.level||'').split(' ');
      var cardTypes=(card.dataset.type||'').split(' ');
      var matchLevel=!activeLevel||cardLevels.includes(activeLevel);
      var matchType=!activeType||cardTypes.includes(activeType);
      card.style.display=(matchLevel&&matchType)?'':'none';
      if(matchLevel&&matchType) visible++;
    });
    var counter=document.getElementById('mfCount');
    if(activeLevel||activeType){
      counter.style.display='';
      counter.textContent=visible?'Намерени: '+visible+' мотора':'Няма резултати за тази комбинация';
    } else {
      counter.style.display='none';
    }
  }
  document.querySelectorAll('#mfLevel .mf').forEach(function(f){
    f.addEventListener('click',function(){
      var val=f.dataset.level;
      if(activeLevel===val){activeLevel=null;f.classList.remove('on');}
      else{activeLevel=val;document.querySelectorAll('#mfLevel .mf').forEach(function(x){x.classList.remove('on')});f.classList.add('on');}
      filterMotos();
    });
  });
  document.querySelectorAll('#mfType .mf').forEach(function(f){
    f.addEventListener('click',function(){
      var val=f.dataset.type;
      if(activeType===val){activeType=null;f.classList.remove('on');}
      else{activeType=val;document.querySelectorAll('#mfType .mf').forEach(function(x){x.classList.remove('on')});f.classList.add('on');}
      filterMotos();
    });
  });
})();

// ===== SEARCH (data-driven with debounce) =====
var _searchTimer=null;
function handleSearch(q){debouncedSearch(q)}
function debouncedSearch(q){
  if(_searchTimer)clearTimeout(_searchTimer);
  if(!q||q.length<2){hideSearchDrop();return}
  _searchTimer=setTimeout(function(){executeSearch(q)},300);
}
function hideSearchDrop(){var d=document.getElementById('searchDrop');if(d)d.innerHTML=''}
function executeSearch(q){
  var drop=document.getElementById('searchDrop');if(!drop)return;
  if(q.length<2){hideSearchDrop();return}
  var ql=q.toLowerCase();
  // #hashtag → direct tag filter
  if(ql.charAt(0)==='#'&&ql.length>2){hideSearchDrop();trackTagSearch(q.substring(1));filterByTag(q.substring(1));var si=document.getElementById('searchIn');if(si)si.blur();return}
  var results={users:[],posts:[],listings:[],directory:[],events:[],tags:[]};
  // 1. Users
  var users=getUsers();
  Object.keys(users).forEach(function(uid){
    var u=users[uid];
    if((u.name+' '+(u.city||'')+' '+(u.bio||'')).toLowerCase().indexOf(ql)>-1)
      results.users.push({id:uid,user:u});
  });
  // 2. Forum posts (title, body, zone + tags)
  getForumPosts().forEach(function(p){
    if((p.title+' '+(p.body||'')+' '+(p.zone||'')+' '+(Array.isArray(p.tags)?p.tags.join(' '):'')).toLowerCase().indexOf(ql)>-1)
      results.posts.push(p);
  });
  // 3. Listings
  var allLst=getListings().filter(function(l){return l.active}).concat(typeof SEED_LISTINGS!=='undefined'?SEED_LISTINGS:[]);
  allLst.forEach(function(l){
    if((l.title+' '+(l.desc||'')+' '+(l.city||'')).toLowerCase().indexOf(ql)>-1)
      results.listings.push(l);
  });
  // 4. Directory (businessData)
  if(typeof businessData!=='undefined'){
    Object.keys(businessData).forEach(function(key){
      var biz=businessData[key];
      if((biz.name+' '+(biz.type||'')+' '+biz.tags.join(' ')+' '+biz.models.join(' ')).toLowerCase().indexOf(ql)>-1)
        results.directory.push({key:key,biz:biz});
    });
  }
  // 5. Events
  var events=typeof getEvents==='function'?getEvents():[];
  events.forEach(function(ev){
    if((ev.title+' '+(ev.location||'')+' '+(ev.type||'')).toLowerCase().indexOf(ql)>-1)
      results.events.push(ev);
  });
  // 6. Tag hints — unique tags matching query
  var tagSet={};
  getForumPosts().forEach(function(p){
    if(Array.isArray(p.tags))p.tags.forEach(function(t){
      if(t.toLowerCase().indexOf(ql)>-1)tagSet[t.toLowerCase()]=t;
    });
  });
  results.tags=Object.keys(tagSet).map(function(k){return tagSet[k]}).slice(0,5);
  renderSearchResults(results,q);
}
function renderSearchResults(results,query){
  var drop=document.getElementById('searchDrop');if(!drop)return;
  var html='';var users=getUsers();
  // Users
  if(results.users.length){
    html+='<div class="search-cat">👤 ПОТРЕБИТЕЛИ</div>';
    html+=results.users.slice(0,5).map(function(r){
      return '<div class="search-item" onclick="location.hash=\'#profile/'+escHtml(r.id)+'\'">'+userAvatar(r.user,20)+' '+escHtml(r.user.name)+'<span style="color:var(--text2);margin-left:auto;font-size:10px">'+escHtml(r.user.city||'')+'</span></div>';
    }).join('');
    if(results.users.length>5)html+='<div class="search-item" style="color:var(--orange);font-size:11px" onclick="go(\'dir\')">Виж всички '+results.users.length+' →</div>';
  }
  // Forum
  if(results.posts.length){
    html+='<div class="search-cat">💬 ТЕМИ</div>';
    html+=results.posts.slice(0,5).map(function(p){
      var ic=p.type==='e'?'📝':p.type==='s'?'✅':p.type==='h'?'🔥':'❓';
      return '<div class="search-item" onclick="location.hash=\'#forum/post/'+escHtml(p.id)+'\'">'+ic+' '+escHtml(p.title.substring(0,50))+'<span style="color:var(--text2);margin-left:auto;font-size:10px">💬 '+(p.replies||[]).length+'</span></div>';
    }).join('');
    if(results.posts.length>5)html+='<div class="search-item" style="color:var(--orange);font-size:11px" onclick="go(\'forum\')">Виж всички '+results.posts.length+' →</div>';
  }
  // Listings
  if(results.listings.length){
    html+='<div class="search-cat">🏍️ ОБЯВИ</div>';
    html+=results.listings.slice(0,5).map(function(l){
      var te=l.type==='bike'?'🏍️':l.type==='gear'?'🧤':'⚙️';
      return '<div class="search-item" onclick="location.hash=\'#listing/'+escHtml(l.id)+'\'">'+te+' '+escHtml(l.title.substring(0,45))+'<span style="color:var(--orange);margin-left:auto;font-size:10px">'+(l.price?l.price+' лв':'—')+'</span></div>';
    }).join('');
    if(results.listings.length>5)html+='<div class="search-item" style="color:var(--orange);font-size:11px" onclick="go(\'maze\')">Виж всички '+results.listings.length+' →</div>';
  }
  // Directory
  if(results.directory.length){
    html+='<div class="search-cat">📋 ДИРЕКТОРИЯ</div>';
    html+=results.directory.slice(0,5).map(function(d){
      return '<div class="search-item" onclick="location.hash=\'#profile/'+escHtml(d.key)+'\'">'+d.biz.icon+' '+escHtml(d.biz.name)+'<span style="color:var(--text2);margin-left:auto;font-size:10px">'+escHtml(d.biz.type||'')+'</span></div>';
    }).join('');
    if(results.directory.length>5)html+='<div class="search-item" style="color:var(--orange);font-size:11px" onclick="go(\'dir\')">Виж всички '+results.directory.length+' →</div>';
  }
  // Events
  if(results.events&&results.events.length){
    html+='<div class="search-cat">🏁 СЪБИТИЯ</div>';
    html+=results.events.slice(0,5).map(function(ev){
      return '<div class="search-item" onclick="go(\'events\')">🏁 '+escHtml(ev.title)+'<span style="color:var(--text2);margin-left:auto;font-size:10px">'+escHtml(ev.location||'')+' · '+escHtml(ev.date||'')+'</span></div>';
    }).join('');
  }
  // Tags
  if(results.tags&&results.tags.length){
    html+='<div class="search-cat">🏷️ ТАГОВЕ</div>';
    html+=results.tags.map(function(t){
      return '<div class="search-item" onclick="hideSearchDrop();trackTagSearch(\''+escHtml(t)+'\');filterByTag(\''+escHtml(t)+'\')"><span class="hashtag">#'+escHtml(t)+'</span><span style="color:var(--text2);margin-left:auto;font-size:10px">Виж теми →</span></div>';
    }).join('');
  }
  if(!html)html='<div class="search-item" style="color:var(--text2)">Няма резултати за "'+escHtml(query)+'"</div>';
  drop.innerHTML=html;
}

// Map filter — Leaflet layers
document.querySelectorAll('.ml').forEach(f=>{
  f.addEventListener('click',()=>{
    f.parentElement.querySelectorAll('.ml').forEach(x=>x.classList.remove('on'));
    f.classList.add('on');
    if(typeof filterMap==='function') filterMap(f.dataset.mt);
  });
});

// Directory filters — real filtering
document.querySelectorAll('#dirFilters .df').forEach(f=>{
  f.addEventListener('click',()=>{
    document.querySelectorAll('#dirFilters .df').forEach(x=>x.classList.remove('on'));
    f.classList.add('on');
    const cat=f.dataset.fc;
    document.querySelectorAll('.g-dir .dc').forEach(card=>{
      if(cat==='all'||card.dataset.cat===cat){
        card.style.display='';
      } else {
        card.style.display='none';
      }
    });
  });
});

function togglePM(){
  document.body.classList.toggle('pm');
  const b=document.getElementById('pmBtn');
  b.classList.toggle('on');
  b.innerHTML=document.body.classList.contains('pm')?'👁 Скрий':'👁 Презентация';
}

// Tire scroll
const tire=document.getElementById('tire');
window.addEventListener('scroll',()=>{
  const p=window.scrollY/(document.body.scrollHeight-window.innerHeight);
  tire.style.height=(p*100)+'vh';
});

// Live online counter
setInterval(()=>{
  document.getElementById('onlineN').textContent=42+Math.floor(Math.random()*12);
},8000);

// Close modal on Escape
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeChatIfOpen()}});

// ===== AI CHAT =====
function toggleChat(){
  const p=document.getElementById('chatPanel');
  p.classList.toggle('on');
  
  if(p.classList.contains('on'))document.getElementById('chatIn').focus();
}
function closeChatIfOpen(){
  document.getElementById('chatPanel').classList.remove('on');
}

// Mock chat responses - pattern matched
const mockChat=[
  {k:['вибрация','тресе','шум','стук','чука'],r:'Вибрация при високи обороти обикновено е контратежест или лагер на коляновия вал. Препоръчвам <link:pesho> — специалист по окачване и двигатели, решава такива проблеми за 2-4 часа. Цена около 140-220 лв.'},
  {k:['масло','филтър','сервиз','ревизия','обслужване'],r:'Стандартен сервиз интервал за ендуро: масло на 15-20 моточаса, филтър на 30. <link:motohaus> имат всички масла и филтри на склад, а <link:pesho> прави пълни ревизии.'},
  {k:['купя','продам','цена','обява','части','резервн'],r:'Разгледай <goto:maze:Мазето> — там има употребявани части и мотори от общността. Всичко е проверено. Ако търсиш ново — <link:edimoto_shop> са официален дилър на KTM/Husqvarna/GasGas.'},
  {k:['събитие','състезание','надпревар','кръг','bg-x'],r:'🏁 Следващото голямо събитие е <strong>Extreme Enduro Fest</strong> — 15-16 март в Карлово! Състезание, скара, музика. Отиди в <goto:events:Събития> за пълната програма и записване.'},
  {k:['ktm','кейтием'],r:'За KTM модели — <link:edimoto_shop> са официален дилър. Имат EXC серията и 350 EXC-F 2025 на склад. За сервиз и части — <link:motohaus> работят с всички KTM модели.'},
  {k:['yamaha','ямаха','yz'],r:'Yamaha YZ серията е класика. <link:motohaus> са дилъри и имат части на склад. В <goto:maze:Мазето> има и употребявани YZ250F от 6,800 лв.'},
  {k:['honda','хонда','crf'],r:'Honda CRF-ове са надеждни за ендуро. <link:motohaus> могат да поръчат части. За електроника и CDI — <link:gosho> е най-добрият в България.'},
  {k:['gasgas','гасгас','fantic','фантик','husqvarna','хускварна'],r:'<link:edimoto_shop> са официален дилър на GasGas, Husqvarna и Fantic. Имат нови модели и пълна гаранция.'},
  {k:['начинаещ','първи мотор','нов съм','какво да купя','за начинаещ'],r:'Добре дошъл! 🏁 За начинаещи препоръчвам тренировка при <link:manolov> — следващата е на 22 март, безплатна. За първи мотор — 250cc 4-тактов е идеален. Разгледай <goto:maze:Мазето> за употребявани.'},
  {k:['карта','маршрут','рила','родоп','стара планина','пътека'],r:'В <goto:events:Събития> ще намериш картата с маршрути. Рила офроуд (Самоков → Мальовица, 47км) е класически. Следващото неделно каране: 29 март.'},
  {k:['окачване','вилк','амортисьор','showa','wp','kyb','пружин'],r:'За окачване — <link:pesho> е номер 1 в България. WP XPLOR ревизия от 220 лв, заден амортисьор от 320 лв. Одобрен от <link:kabakchiev> лично.'},
  {k:['гуми','протектор','michelin','dunlop'],r:'Горещата тема във форума сега е "Ендуро гуми БГ 2026" — 91 отговора! Отиди във <goto:forum:Форума>. <link:motohaus> имат Michelin Enduro на склад.'},
  {k:['електрик','cdi','efi','tpi','кабел','датчик','диагностик'],r:'За електроника — <link:gosho> в Варна е специалистът. CDI/EFI/TPI диагностика от 50 лв. Може и дистанционна консултация.'},
  {k:['тренир','треньор','уча','урок','школа'],r:'<link:manolov> е легенда — води тренировки за всички нива в Манолово. Следваща дата: 22 март, неделя. Безплатно! Носи гуми за кал.'},
  {k:['академия','тренировка','обучен','курс','тур','турове'],r:'🎓 Разгледай <goto:academy:Академията> — тренировки с Димитър Манолов в Нови Хан, треньорски профили и организирани турове из цяла България. Следващата тренировка: 22 март!'},
  {k:['здрав','здрасти','привет','хей','добър'],r:'Здравей! 🔧 Аз съм AI механикът на общността. Питай ме за мотори, части, ремонти, събития — или просто кажи какво търсиш и ще те насоча.'},
];
const defaultReply='Интересен въпрос! Препоръчвам да разгледаш <goto:forum:Форума> — там общността обсъжда всичко. Или провери <goto:dir:Директорията> за майстори и магазини наблизо.';

function getMockReply(msg){
  const m=msg.toLowerCase();
  for(const c of mockChat){
    if(c.k.some(k=>m.includes(k))) return c.r;
  }
  return defaultReply;
}

function linkify(text){
  return text
    .replace(/<link:(\w+)>/g,(_, id)=>{
      const names={pesho:'Пешо Механика',motohaus:'МотоХаус',gosho:'Гошо Електро',manolov:'Треньор Манолов',kabakchiev:'Кабакчиев',edimoto_shop:'EdiMoto',elilison:'Ели Лисън'};
      return `<span class="link" onclick="closeChatIfOpen();openProfile('${id}')">${names[id]||id}</span>`;
    })
    .replace(/<goto:(\w+):([^>]+)>/g,(_, tab, label)=>{
      return `<span class="link" onclick="closeChatIfOpen();go('${tab}')">${label}</span>`;
    });
}

async function sendChat(){
  const input=document.getElementById('chatIn');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';

  const msgs=document.getElementById('chatMsgs');
  msgs.innerHTML+=`<div class="chat-msg user">${escHtml(msg)}</div>`;
  msgs.innerHTML+=`<div class="chat-typing" id="typing">🔧 Механикът мисли...</div>`;
  msgs.scrollTop=msgs.scrollHeight;
  document.getElementById('chatSendBtn').disabled=true;

  // Simulate typing delay
  const delay=800+Math.random()*700;
  await new Promise(r=>setTimeout(r,delay));

  document.getElementById('typing')?.remove();
  const reply=getMockReply(msg);
  msgs.innerHTML+=`<div class="chat-msg bot">${linkify(reply)}</div>`;
  document.getElementById('chatSendBtn').disabled=false;
  msgs.scrollTop=msgs.scrollHeight;
}


// ===== SKELETON SCREENS =====
var SKELETON_DELAY=120; // ms — кратко за да се усети shimmer, не бави UX
function skeletonThenRender(containerId,type,count,renderFn){
  // Skip skeletons during tab switch — render instantly to avoid flicker
  if(_tabSwitching){renderFn();return;}
  showSkeleton(containerId,type,count);
  setTimeout(function(){renderFn()},SKELETON_DELAY);
}
function showSkeleton(containerId,type,count){
  var el=document.getElementById(containerId);if(!el)return;
  count=count||3;
  var html='';
  if(type==='feed'){
    for(var i=0;i<count;i++){
      html+='<div class="skeleton skeleton-card" style="padding:14px"><div class="skeleton skeleton-text short" style="margin-bottom:10px"></div><div class="skeleton skeleton-text long"></div><div style="display:flex;align-items:center;gap:8px;margin-top:12px"><div class="skeleton skeleton-avatar"></div><div class="skeleton skeleton-text" style="width:120px"></div></div></div>';
    }
  }else if(type==='listings'){
    html='<div class="skeleton-grid cols-2">';
    for(var i=0;i<count;i++){
      html+='<div class="skeleton skeleton-card" style="padding:14px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><div class="skeleton skeleton-text" style="width:24px;height:24px;border-radius:50%"></div><div class="skeleton skeleton-text" style="width:80px"></div></div><div class="skeleton skeleton-text long"></div><div class="skeleton skeleton-text short" style="margin-top:8px"></div></div>';
    }
    html+='</div>';
  }else if(type==='topics'){
    for(var i=0;i<count;i++){
      html+='<div class="skeleton skeleton-card" style="padding:12px;height:60px"><div class="skeleton skeleton-text long"></div><div style="display:flex;align-items:center;gap:6px;margin-top:8px"><div class="skeleton skeleton-avatar" style="width:16px;height:16px"></div><div class="skeleton skeleton-text" style="width:100px"></div></div></div>';
    }
  }else if(type==='stats'){
    html='<div class="home-stat-grid">';
    for(var i=0;i<4;i++){
      html+='<div class="skeleton skeleton-stat"></div>';
    }
    html+='</div>';
  }
  el.innerHTML=html;
}

// ===== CARD ENTRANCE OBSERVER =====
var _cardObserver=null;
function initCardObserver(){
  if(!('IntersectionObserver' in window))return;
  if(_cardObserver)_cardObserver.disconnect();
  _cardObserver=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var delay=parseInt(e.target.dataset.enterDelay||'0')*60;
        setTimeout(function(){e.target.classList.add('visible')},delay);
        _cardObserver.unobserve(e.target);
      }
    });
  },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.card-enter:not(.visible)').forEach(function(el){
    // Above-fold cards — make instantly visible to avoid blank flash after tab switch
    var rect=el.getBoundingClientRect();
    if(rect.top<window.innerHeight+50){
      el.classList.add('visible');
    }else{
      _cardObserver.observe(el);
    }
  });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el,target,duration){
  if(!el||!target)return;
  duration=duration||600;
  var start=0;var startTime=null;
  function tick(ts){
    if(!startTime)startTime=ts;
    var p=Math.min((ts-startTime)/duration,1);
    var eased=1-Math.pow(1-p,3);
    el.textContent=Math.floor(eased*target);
    if(p<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ===== MOBILE NAV =====
function toggleMobileNav(){
  var nav=document.getElementById('nav');
  var btn=document.getElementById('hamburger');
  if(!nav||!btn)return;
  var isOpen=nav.classList.contains('mobile-show');
  if(isOpen){
    nav.classList.remove('mobile-show');btn.classList.remove('open');
    document.body.style.overflow='';
  }else{
    nav.classList.add('mobile-show');btn.classList.add('open');
    document.body.style.overflow='hidden';
  }
}

// ===== HASH ROUTING HANDLER =====
function handleRoute(){
  var hash=location.hash.replace('#','')||'';
  _hashNav=true;
  if(!hash||hash===''){
    showEntry();
  } else if(hash==='home'||hash==='dir'||hash==='forum'||hash==='maze'||hash==='academy'||hash==='events'){
    go(hash);
  } else if(hash.indexOf('forum/post/')===0){
    var postId=hash.replace('forum/post/','');
    go('forum');
    // Find which zone the post belongs to, then open it
    setTimeout(function(){
      var posts=getForumPosts();
      for(var i=0;i<posts.length;i++){
        if(posts[i].id===postId){
          enterZone(posts[i].zone);
          setTimeout(function(){toggleUserThread(postId)},100);
          break;
        }
      }
    },150);
  } else if(hash.indexOf('forum/')===0){
    var zone=hash.replace('forum/','');
    go('forum');
    enterZone(zone);
  } else if(hash.indexOf('dir/')===0){
    var filter=hash.replace('dir/','');
    entryGo('dir',filter);
  } else if(hash.indexOf('profile/')===0){
    var uid=hash.replace('profile/','');
    openProfile(uid);
  } else if(hash.indexOf('listing/')===0){
    var lid=hash.replace('listing/','');
    openListing(lid);
  } else {
    go('home');
  }
  _hashNav=false;
}
window.addEventListener('hashchange',handleRoute);

// ===== STICKY TOPBAR =====
(function(){
  var topbar=document.querySelector('.topbar');
  if(!topbar)return;
  var lastY=0;
  window.addEventListener('scroll',function(){
    var y=window.scrollY;
    if(y>80){topbar.classList.add('sticky')}else{topbar.classList.remove('sticky')}
    lastY=y;
  },{passive:true});
})();
