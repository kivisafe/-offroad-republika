// ===== ONBOARDING RITUAL =====
var ARCHETYPES={
  wolf:{emoji:'🐺',name:'Планинският вълк',desc:'Хард ендуро · самотник'},
  wanderer:{emoji:'🌲',name:'Горският скитник',desc:'Ендуро · трейлове'},
  warrior:{emoji:'💧',name:'Калният воин',desc:'Мотокрос · писта'},
  demon:{emoji:'⚡',name:'Скоростният демон',desc:'Рали · скорост'},
  traveler:{emoji:'🗺️',name:'Пътешественикът',desc:'ADV · турове'}
};
// ===== TIER SYSTEM =====
var TIERS={
  n:{name:'Новобранец',emoji:'🟤',minScore:0,color:'#8b5a2b',css:'lv-n'},
  m:{name:'Мераклия',emoji:'🟠',minScore:25,color:'var(--orange)',css:'lv-m'},
  p:{name:'Практик',emoji:'🔵',minScore:55,color:'#4682b4',css:'lv-p'},
  v:{name:'Ветеран',emoji:'🟤',minScore:90,color:'var(--earth)',css:'lv-v'},
  l:{name:'Легенда',emoji:'🟡',minScore:130,color:'#e8aa2c',css:'lv-l'}
};
var TIER_ORDER=['l','v','p','m','n'];
function calculateTierScore(){
  var bikes=getGarage();
  var log=getServiceLog();
  var score=0;
  score+=bikes.length*5;
  var totalMonths=0;bikes.forEach(function(b){totalMonths+=(b.months||0);});
  score+=Math.round(totalMonths*0.4);
  score+=log.length*2;
  if(localStorage.getItem('orOnboardingComplete')==='true')score+=3;
  var makes={};bikes.forEach(function(b){if(b.make)makes[b.make]=1;});
  if(Object.keys(makes).length>1)score+=3;
  var mods=getMods();score+=mods.length*3;
  mods.forEach(function(m){if(m.forumPostId)score+=2;});
  return score;
}
function calculateTier(score){
  if(typeof score==='undefined')score=calculateTierScore();
  for(var i=0;i<TIER_ORDER.length;i++){
    if(score>=TIERS[TIER_ORDER[i]].minScore)return TIER_ORDER[i];
  }
  return 'n';
}
function tierInfo(){
  var score=calculateTierScore();
  var key=calculateTier(score);
  var tier=TIERS[key];
  var nextKey=null,nextTier=null,pctToNext=100;
  var idx=TIER_ORDER.indexOf(key);
  if(idx>0){
    nextKey=TIER_ORDER[idx-1];nextTier=TIERS[nextKey];
    var range=nextTier.minScore-tier.minScore;
    pctToNext=range>0?Math.min(100,Math.round((score-tier.minScore)/range*100)):100;
  }
  return{key:key,tier:tier,score:score,nextKey:nextKey,nextTier:nextTier,pctToNext:pctToNext};
}
function getTierHints(info){
  var hints=[];
  if(!info)info=tierInfo();
  if(info.nextTier){
    var gap=info.nextTier.minScore-info.score;
    var bikes=getGarage();
    if(bikes.length<2)hints.push('Добави мотор в гаража (+5)');
    var totalMonths=0;bikes.forEach(function(b){totalMonths+=(b.months||0);});
    if(totalMonths<12)hints.push('Попълни месеци опит на мотора');
    var log=getServiceLog();
    if(log.length<5)hints.push('Запиши сервизни записи (+2 на запис)');
    var makes={};bikes.forEach(function(b){if(b.make)makes[b.make]=1;});
    if(Object.keys(makes).length<=1&&bikes.length>0)hints.push('Добави мотор от друга марка (+3)');
    var mods=getMods();
    if(mods.length<1)hints.push('Запиши модификация (+3)');
    else{var hasThread=false;mods.forEach(function(m){if(m.forumPostId)hasThread=true});if(!hasThread)hints.push('Създай build thread за мод (+2)');}
  }
  return hints.slice(0,3);
}
function renderTierBadge(tierKey){
  if(!tierKey)tierKey=calculateTier();
  var t=TIERS[tierKey];
  return '<span class="lv '+t.css+'">'+t.emoji+' '+t.name.toUpperCase()+'</span>';
}
function renderTierProgress(info){
  if(!info)info=tierInfo();
  var h='<div class="tier-progress"><div class="tier-bar"><div class="tier-fill tier-fill-'+info.key+'" style="width:'+info.pctToNext+'%"></div></div>';
  h+='<div class="tier-labels"><span>'+info.tier.name+' · '+info.score+' pts</span>';
  if(info.nextTier)h+='<span class="tier-next">→ '+info.nextTier.name+' ('+info.nextTier.minScore+')</span>';
  h+='</div></div>';
  var hints=getTierHints(info);
  if(hints.length){
    h+='<div class="tier-hints">';
    hints.forEach(function(t){h+='<div class="tier-hint">'+t+'</div>';});
    h+='</div>';
  }
  return h;
}
var _lastTierKey=null;
function refreshTierDisplay(){
  var info=tierInfo();
  // Tier-up celebration
  if(_lastTierKey&&_lastTierKey!==info.key){
    var tierObj=TIERS[info.key];
    if(tierObj)showCelebration(tierObj.emoji,'РАНГ: '+tierObj.name.toUpperCase()+'!','Продължавай напред, ездач!');
  }
  _lastTierKey=info.key;
  var gm=document.getElementById('obGreetMsg');
  if(gm){
    var user=getCurrentUser();
    var garage=getGarage();
    var bikeText=(garage.length>0&&garage[0].make)?(' · '+garage[0].make+' '+(garage[0].model||'')):'';
    gm.innerHTML=renderTierBadge(info.key)+(user?renderRoleBadge(user.role):'')+bikeText;
  }
  var gtb=document.getElementById('garageTierBadge');
  if(gtb)gtb.innerHTML=renderTierBadge(info.key);
}
var _obArchetype=null;
var _obBikeAdded=false;

function getUserType(){ return localStorage.getItem('orUserType'); }

function initOnboarding(){
  var done=localStorage.getItem('orOnboardingComplete');
  var overlay=document.getElementById('obOverlay');
  if(done==='true'){
    if(overlay)overlay.remove();
    showGreeting();
    applyUserPath(getUserType()||'rider');
    return;
  }
  // Show ritual overlay
  if(overlay)overlay.style.display='flex';
  // Hide topbar+nav during ritual
  var tb=document.querySelector('.topbar');if(tb)tb.style.display='none';
  var nav=document.getElementById('nav');if(nav)nav.style.display='none';
  // Animate counter
  var counter=document.getElementById('obCounter');
  if(counter){var base=2847;setInterval(function(){if(Math.random()>.6){base++;counter.textContent=base.toLocaleString();}},3000);}
}

function applyUserPath(type){
  if(type==='newbie'){
    applyNewbiePath();
  }
  if(type==='rider'){
    // Hide "Първи мотор?" banner for riders
    var onb=document.getElementById('onb');
    if(onb) onb.style.display='none';
  }
  // Top story toast (once per session)
  if(!sessionStorage.getItem('orTopStoryToast')){
    setTimeout(function(){
      showToast('🏆 Темата на Пешо Механика влезе в Сутрешния вестник! Прочетена от 1,247 ездача.','success');
      sessionStorage.setItem('orTopStoryToast','1');
    },4000);
  }
}

function applyNewbiePath(){
  // 1. One-time navigation hint
  if(!localStorage.getItem('orNavHintSeen')){
    var hint=document.createElement('div');
    hint.className='nav-hint';
    hint.id='navHint';
    hint.innerHTML='👆 Започни от <strong style="cursor:pointer" onclick="go(\'forum\')">Форум / Похвати</strong> → Гаражът <span class="hint-close" onclick="this.parentElement.remove();localStorage.setItem(\'orNavHintSeen\',\'1\')">✕</span>';
    var nav=document.getElementById('nav');
    if(nav) nav.parentElement.insertBefore(hint, nav.nextSibling);
  }

  // 2. Add tooltips to nav tabs
  var tipTexts={
    home:'Сутрешен вестник — новини, теми, истории',
    dir:'Намери верифициран майстор или магазин',
    forum:'Питай. Всички сме минали оттук.',
    maze:'Намери първия си мотор или части',
    academy:'Запиши се на тренировка с истински треньор',
    events:'Виж кога и къде карат хората'
  };
  document.querySelectorAll('.ntab').forEach(function(n){
    var t=n.dataset.t;
    if(tipTexts[t]){
      var tip=document.createElement('span');
      tip.className='ntab-tip';
      tip.textContent=tipTexts[t];
      n.appendChild(tip);
    }
  });

  // 3. Inject naruchnik + trainers into feed
  var feedGrid=document.getElementById('feedGrid');
  if(feedGrid){
    var naruchnik=document.createElement('div');
    naruchnik.className='newbie-naruchnik';
    naruchnik.innerHTML='<div class="newbie-naruchnik-title">📖 НАРЪЧНИК НА НОВОБРАНЕЦА</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px"><div class="fhb-item" onclick="go(\'maze\')">🏍️ Как да избера първи мотор</div><div class="fhb-item" onclick="openProfile(\'pesho\')">🔧 Намери механик близо до теб</div><div class="fhb-item" onclick="openProfile(\'manolov\')">🏅 Запиши се на тренировка</div><div class="fhb-item" onclick="go(\'events\')">🗺️ Първо каране — къде и с кого</div></div>';
    feedGrid.insertBefore(naruchnik, feedGrid.firstChild);

    var trainers=document.createElement('div');
    trainers.className='fc fc-full';
    trainers.style.borderLeft='3px solid var(--green)';
    trainers.innerHTML='<div class="fc-h"><div class="ava" style="background:rgba(90,138,60,.15)">🏅</div><div><span class="fc-n" style="color:var(--green)">ПРЕПОРЪЧАНИ ТРЕНЬОРИ</span><div class="meta">За нови ездачи</div></div></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px"><div class="garage-item" onclick="openProfile(\'manolov\')"><span>🏅</span><span>Треньор Манолов — Всички нива</span><span class="garage-heat" style="color:var(--green)">★ 5.0</span></div><div class="garage-item" onclick="go(\'academy\')"><span>🏍️</span><span>Мото Академия — Нови Хан</span><span class="garage-heat" style="color:var(--green)">→</span></div></div>';
    naruchnik.after(trainers);
  }
}

// ===== ONBOARDING STEP FUNCTIONS =====
function obNext(step){
  document.querySelectorAll('.ob-step').forEach(function(s){s.classList.remove('active');});
  var target=document.getElementById('obStep'+step);
  if(target)target.classList.add('active');
  if(step===4)populateCeremony();
}

function obSelectArchetype(card,key){
  document.querySelectorAll('.ob-arch-card').forEach(function(c){c.classList.remove('selected');});
  card.classList.add('selected');
  _obArchetype=key;
  localStorage.setItem('orArchetype',key);
  var btn=document.getElementById('obStep2Btn');
  if(btn)btn.classList.remove('ob-disabled');
}

function obAddBike(){
  var make=document.getElementById('obBikeMake').value;
  var model=document.getElementById('obBikeModel').value.trim();
  var year=document.getElementById('obBikeYear').value;
  if(!make){document.getElementById('obBikeMake').style.borderColor='var(--orange)';return;}
  var bike={make:make,model:model||'',year:year||'',status:'current',note:'',months:0};
  var garage=[];try{garage=JSON.parse(localStorage.getItem('orGarage'))||[];}catch(e){}
  garage.push(bike);
  localStorage.setItem('orGarage',JSON.stringify(garage));
  localStorage.setItem('orUserType','rider');
  _obBikeAdded=true;
  obNext(4);
}

function obSkipBike(){
  if(!localStorage.getItem('orGarage'))localStorage.setItem('orGarage','[]');
  localStorage.setItem('orUserType','newbie');
  _obBikeAdded=false;
  obNext(4);
}

function populateCeremony(){
  var arch=ARCHETYPES[_obArchetype]||ARCHETYPES.wolf;
  var be=document.getElementById('obBadgeEmoji');if(be)be.textContent=arch.emoji;
  var bl=document.getElementById('obBadgeLabel');if(bl)bl.textContent=arch.name;
  var tl=document.getElementById('obTierLabel');if(tl)tl.textContent=TIERS.n.name.toUpperCase();
  if(_obBikeAdded){
    var bc=document.getElementById('obCheckBike');
    if(bc){bc.classList.add('done');bc.querySelector('.ob-chk').textContent='✓';}
  }
  var pct=_obBikeAdded?60:40;
  setTimeout(function(){
    var fill=document.getElementById('obProgressFill');if(fill)fill.style.width=pct+'%';
    var num=document.getElementById('obProgressPct');
    if(num){var start=performance.now();var dur=800;(function tick(now){
      var p=Math.min((now-start)/dur,1);var e=1-(1-p)*(1-p);
      num.textContent=Math.round(pct*e);
      if(p<1)requestAnimationFrame(tick);
    })(performance.now());}
  },300);
}

function obFinish(){
  localStorage.setItem('orOnboardingComplete','true');
  var overlay=document.getElementById('obOverlay');
  if(overlay){overlay.style.opacity='0';setTimeout(function(){overlay.remove();},500);}
  var tb=document.querySelector('.topbar');if(tb)tb.style.display='';
  var nav=document.getElementById('nav');if(nav)nav.style.display='none'; // nav stays hidden for entry page
  showGreeting();
  applyUserPath(getUserType()||'rider');
  if(!getCurrentUser())setTimeout(showAccountPrompt,1500);
}

function showGreeting(){
  var user=getCurrentUser();
  var archKey=user?user.archetype:localStorage.getItem('orArchetype');
  var arch=archKey?ARCHETYPES[archKey]:null;
  var g=document.getElementById('obGreeting');if(!g)return;
  if(!user&&!arch)return;
  var ge=document.getElementById('obGreetEmoji');if(ge)ge.textContent=user?user.emoji:(arch?arch.emoji:'🏍️');
  var gn=document.getElementById('obGreetName');
  if(gn){
    var roleTitles={business:'Бизнес партньор',mechanic:'Майстор',trainer:'Треньор'};
    var subtitle=arch?arch.name:(user&&roleTitles[user.role]?roleTitles[user.role]:'');
    gn.textContent=user?user.name+(subtitle?' · '+subtitle:''):(arch?arch.name:'');
  }
  var gm=document.getElementById('obGreetMsg');
  if(gm){
    var info=tierInfo();
    var garage=getGarage();
    var bikeText=(garage.length>0&&garage[0].make)?(' · '+garage[0].make+' '+(garage[0].model||'')):'';
    gm.innerHTML=renderTierBadge(info.key)+renderRoleBadge(user?user.role:'rider')+bikeText;
  }
  g.style.display='flex';
}

function obReset(){
  localStorage.removeItem('orOnboardingComplete');
  localStorage.removeItem('orArchetype');
  localStorage.removeItem('orUserType');
  localStorage.removeItem('orGarage');
  localStorage.removeItem('orServiceLog');
  localStorage.removeItem('orNavHintSeen');
  localStorage.removeItem('orSession');
  localStorage.removeItem('orUsers');
  localStorage.removeItem('orForumPosts');
  localStorage.removeItem('orEventRegs');
  location.reload();
}

// ===== REPORT SYSTEM =====
function reportPost(el){
  el.textContent='✓ Пратено';
  el.style.color='var(--green)';
  el.style.opacity='1';
  el.onclick=null;
  showToast('📨 Сигналът е пратен до 3 случайни активни члена за преглед. Общността решава.','success');
}

// ===== NEW TOPIC WITH ZONE =====
function handleNewTopic(){
  if(!getCurrentUser()){toggleAuthModal();return}
  var zone=document.getElementById('newTopicZone');
  // Auto-select current zone if inside one
  if(zone&&!zone.value&&enterZone._current){zone.value=enterZone._current}
  if(!zone||!zone.value){showToast('⚠️ Избери зона преди да създадеш тема!');return}
  showNewTopicForm(zone.value);
}

// ===== PROFILES: Now data-driven via seedProfiles() + renderDynamicProfile() =====

// ===== POLISH: TIME AGO, AVATARS, TRANSITIONS =====
function timeAgo(dateStr){
  if(!dateStr)return '';
  var now=new Date();var d=new Date(dateStr);
  var diff=Math.floor((now-d)/1000);
  if(diff<60)return 'току-що';
  if(diff<3600)return 'преди '+Math.floor(diff/60)+' мин';
  if(diff<86400)return 'преди '+Math.floor(diff/3600)+' ч';
  if(diff<172800)return 'вчера';
  if(diff<604800)return 'преди '+Math.floor(diff/86400)+' дни';
  if(diff<2592000)return 'преди '+Math.floor(diff/604800)+' седм';
  return dateStr;
}
var AVA_COLORS=['#e8622c','#5a8a3c','#4682b4','#c49a6c','#d4a543','#8b5a8b','#e8aa2c','#6ba4d4','#a0522d','#cd5c5c'];
function userAvatar(user,size){
  size=size||32;
  if(!user||!user.name)return '<div class="ava-circle" style="width:'+size+'px;height:'+size+'px">?</div>';
  var initial=user.name.charAt(0).toUpperCase();
  var hash=0;for(var i=0;i<user.name.length;i++)hash=user.name.charCodeAt(i)+((hash<<5)-hash);
  var color=AVA_COLORS[Math.abs(hash)%AVA_COLORS.length];
  var fontSize=Math.round(size*0.42);
  var roleIcon='';
  if(user.role==='business')roleIcon='<span class="ava-role-dot" style="background:var(--orange)" title="Бизнес">🏪</span>';
  if(user.role==='mechanic')roleIcon='<span class="ava-role-dot" style="background:var(--green)" title="Механик">🔧</span>';
  if(user.role==='trainer')roleIcon='<span class="ava-role-dot" style="background:#6ba4d4" title="Треньор">🎓</span>';
  return '<div class="ava-circle" style="width:'+size+'px;height:'+size+'px;background:'+color+';font-size:'+fontSize+'px">'+initial+roleIcon+'</div>';
}

// ===== HASH ROUTING =====
var _hashNav=false; // guard: true when hashchange triggers navigation

function showEntry(){
  document.getElementById('entryBox').style.display='';
  document.getElementById('nav').style.display='none';
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('on')});
  document.querySelectorAll('.ntab').forEach(function(n){n.classList.remove('on')});
}

// ===== FUNCTIONS =====
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

// ===== FORUM ZONE SYSTEM =====
const zoneNames={newbie:'Новобранец',problem:'Проблем с мотора',tech:'Техническо',plan:'Планиране',skill:'Финес и похват',story:'Истории от пътя',chat:'Свободен разговор'};
const zoneColors={newbie:'#d4a543',problem:'var(--orange)',tech:'var(--green)',plan:'var(--earth)',skill:'#6ba4d4',story:'#8b6fb0',chat:'#7a8a6a'};

function enterZone(zone){
  if(!_hashNav) location.hash='#forum/'+zone;
  document.getElementById('forumZones').style.display='none';
  document.getElementById('forumThreads').style.display='block';
  document.getElementById('forumBc').style.display='';
  document.getElementById('forumBcZone').textContent=zoneNames[zone]||zone;
  // Show handbook only in newbie zone
  document.getElementById('forumHandbook').style.display=(zone==='newbie')?'':'none';
  // Show filter bar
  var fb=document.getElementById('forumFilter');
  if(fb){fb.style.display='';fb.querySelectorAll('.ff-chip').forEach(function(c){c.classList.remove('on')});var first=fb.querySelector('[data-filter="all"]');if(first)first.classList.add('on');}
  // Filter threads by zone
  document.querySelectorAll('#t-forum .ft').forEach(ft=>{
    ft.style.display=(ft.dataset.zone===zone)?'':'none';
  });
  // Store current zone for filter
  enterZone._current=zone;
  // Simulate reader counts
  setTimeout(simulateReaders,200);
}

function forumHome(){
  document.getElementById('forumZones').style.display='';
  document.getElementById('forumThreads').style.display='none';
  document.getElementById('forumBc').style.display='none';
  // Hide filter bar
  var fb=document.getElementById('forumFilter');if(fb)fb.style.display='none';
  // Show all threads
  document.querySelectorAll('#t-forum .ft').forEach(ft=>ft.style.display='');
  enterZone._current=null;
  // Update zone stats with real data
  updateZoneStats();
}

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
  var results={users:[],posts:[],listings:[],directory:[]};
  // 1. Users
  var users=getUsers();
  Object.keys(users).forEach(function(uid){
    var u=users[uid];
    if((u.name+' '+(u.city||'')+' '+(u.bio||'')).toLowerCase().indexOf(ql)>-1)
      results.users.push({id:uid,user:u});
  });
  // 2. Forum posts
  getForumPosts().forEach(function(p){
    if((p.title+' '+(p.body||'')+' '+(p.zone||'')).toLowerCase().indexOf(ql)>-1)
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

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

// ===== FORM VALIDATION =====
function validateField(fieldId,rules){
  var el=document.getElementById(fieldId);if(!el)return true;
  var val=(el.value||'').trim();
  var errId=fieldId+'_err';
  var existing=document.getElementById(errId);if(existing)existing.remove();
  el.classList.remove('field-error');
  for(var i=0;i<rules.length;i++){
    var r=rules[i];var fail=false;
    if(r.type==='required'&&!val)fail=true;
    if(r.type==='minlength'&&val.length<r.value)fail=true;
    if(r.type==='min'&&(parseFloat(val)<r.value||isNaN(parseFloat(val))))fail=true;
    if(fail){
      el.classList.add('field-error');
      var msg=document.createElement('span');msg.id=errId;msg.className='field-error-msg';msg.textContent=r.msg;
      el.parentNode.insertBefore(msg,el.nextSibling);
      return false;
    }
  }
  return true;
}
function validateForm(fields){
  var firstErr=null;var ok=true;
  fields.forEach(function(f){
    if(!validateField(f.id,f.rules)){ok=false;if(!firstErr)firstErr=document.getElementById(f.id)}
  });
  if(firstErr)firstErr.focus();
  return ok;
}

// ===== TOAST =====
let toastTimer;
function showToast(msg,type){
  var t=document.getElementById('toast');
  t.classList.remove('on','off');
  t.className='toast'+(type==='success'?' t-success':type==='error'?' t-error':'');
  t.innerHTML=msg;
  t.offsetHeight;// force reflow
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.classList.remove('on');t.classList.add('off')},3200);
}

// ===== BUTTON HANDLERS =====
function handleBtn(el,msg,type){
  event.stopPropagation();
  showToast(msg,type||'success');
  // Animate button if it's a "sign up" type
  if(el && msg.includes('Записан')){
    el.textContent='✓ Записан!';
    el.style.background='var(--green)';
    el.style.borderColor='var(--green)';
    el.disabled=true;
  }
}

// Delegate clicks on all .btn elements that aren't wired up
document.addEventListener('click',function(e){
  const btn=e.target.closest('.btn');
  if(!btn||btn.disabled)return;
  const t=btn.textContent.trim();
  // Only handle buttons that don't already have specific onclick
  if(btn.getAttribute('onclick'))return;

  if(t.includes('Свържи се'))showToast('✓ Заявката е изпратена! Ще получиш отговор до 24ч','success');
  else if(t.includes('Записвам се')){btn.textContent='✓ Записан!';btn.style.background='var(--green)';btn.style.borderColor='var(--green)';btn.disabled=true;showToast('🏁 Записан си! Ще получиш потвърждение.','success');}
  else if(t.includes('Карай с нас')){btn.textContent='✓ Записан!';btn.style.background='var(--green)';btn.style.borderColor='var(--green)';btn.disabled=true;showToast('🏁 Записан! Очакваме те на място.','success');}
  else if(t.includes('Прати съобщение'))showToast('✓ Съобщението е изпратено!','success');
  else if(t.includes('Провери наличност'))showToast('📦 Проверяваме... ще получиш отговор до 2ч','success');
  else if(t.includes('Запиши час'))showToast('✓ Часът е запазен!','success');
  else if(t.includes('Питай майстора'))showToast('✓ Въпросът е изпратен!','success');
  else if(t.includes('Намери частта'))showToast('🔍 Търсим... ще те уведомим при наличност','success');
  else if(t.includes('Разгледай'))showToast('📋 Зареждам каталога...','');
  else if(t.includes('Купи'))showToast('🎟️ Пренасочваме към плащане...','');
  else if(t.includes('Сподели'))showToast('📎 Линкът е копиран!','success');
  else if(t.includes('За треньора')){}
  else if(t.includes('Виж пълна'))showToast('📋 Зареждаме програмата...','');
  else if(t.includes('Маршрут до'))showToast('🗺️ Отваряме навигацията...','');
  else if(t.includes('Повече информация'))showToast('📋 Зареждаме детайлите...','');
});

// Like/reaction handler — toggle
document.addEventListener('click',function(e){
  const act=e.target.closest('.acts span');
  if(!act)return;
  const t=act.textContent;
  const m=t.match(/(\d+)/);
  if(m){
    if(act.dataset.liked){
      const n=parseInt(m[1])-1;
      act.textContent=t.replace(m[1],n);
      act.style.color='';
      delete act.dataset.liked;
    } else {
      const n=parseInt(m[1])+1;
      act.textContent=t.replace(m[1],n);
      act.style.color='var(--orange)';
      act.dataset.liked='1';
    }
  }
});

// ===== INIT ONBOARDING =====
// ===== V10: GARAGE SYSTEM =====
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
  if(!bikes.length){c.innerHTML='<div class="empty-state" style="padding:16px"><div class="empty-state-icon">🏍️</div><div class="empty-state-title">ГАРАЖЪТ Е ПРАЗЕН</div><div class="empty-state-desc">Добави мотора си — думата ти ще тежи повече във форума!</div></div>';return;}
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
      '<span class="'+logBtnClass+'" onclick="event.stopPropagation();toggleServiceBook('+i+')">📖 Книжка'+(logCount?' ('+logCount+')':'')+'</span>'+
      '<span class="'+modBtnClass+'" onclick="event.stopPropagation();toggleModMap('+i+')">🔧 Модове'+(modCount?' ('+modCount+')':'')+'</span>'+
      '<span class="garage-bike-btn" onclick="event.stopPropagation();toggleModForm('+i+')">+ Мод</span>'+
      '<span class="garage-bike-btn" onclick="event.stopPropagation();toggleAddRecord('+i+')">+ Запис</span></div>';
    var expandHtml='';
    if(_openServiceBook===i){expandHtml='<div class="slog-timeline">'+renderServiceTimeline(i)+'</div>';}
    if(_openAddForm===i){expandHtml+=renderAddRecordForm(i);}
    if(_openModMap===i){expandHtml+=renderModMap(i,false);}
    if(_openModForm===i){expandHtml+=renderModForm(i);}
    return '<div class="garage-bike-wrap"><div class="garage-bike"><div style="font-size:20px">🏍️</div><div class="garage-bike-info">'+
      '<div class="garage-bike-name">'+escHtml(b.make+' '+b.model)+' <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>'+
      '<div class="garage-bike-year">'+escHtml(String(b.year))+monthsHtml+'</div>'+noteHtml+actionsHtml+
      '</div><span class="garage-bike-remove" onclick="event.stopPropagation();removeBike('+i+')">✕</span></div>'+expandHtml+'</div>';
  }).join('');
}

function addBike(){
  var make=document.getElementById('garageMake').value;
  var model=document.getElementById('garageModel').value.trim();
  var year=document.getElementById('garageYear').value;
  var note=(document.getElementById('garageNote').value||'').trim().substring(0,200);
  var months=parseInt(document.getElementById('garageMonths').value)||0;
  if(!make||!model){showToast('⚠️ Избери марка и напиши модел!');return;}
  var bikes=getGarage();
  bikes.push({make:make,model:model,year:year||'?',status:_garageStatus,note:note,months:months});
  saveGarage(bikes);renderGarage();
  document.getElementById('garageMake').value='';
  document.getElementById('garageModel').value='';
  document.getElementById('garageYear').value='';
  document.getElementById('garageNote').value='';
  document.getElementById('garageMonths').value='';
  setGarageStatus('current');
  showToast('🏍️ '+make+' '+model+' добавен в гаража!','success');
  updateGarageBadge();renderForYourBike();refreshCredBadges();refreshTierDisplay();
}

function removeBike(i){
  var bikes=getGarage();var removed=bikes.splice(i,1)[0];
  saveGarage(bikes);renderGarage();
  showToast(removed.make+' '+removed.model+' махнат от гаража.');
  updateGarageBadge();renderForYourBike();refreshCredBadges();
}

function updateGarageBadge(){
  var count=getGarage().length;
  var badge=document.getElementById('garageBadge');
  if(badge){badge.textContent=count||'';badge.style.display=count?'':'none';}
}

// ===== SERVICE LOG =====
var SERVICE_TYPES={
  oil:{emoji:'🛢️',label:'Масло + филтър'},suspension:{emoji:'🔧',label:'Окачване ревизия'},
  chain:{emoji:'⛓️',label:'Верига + пиньон'},tires:{emoji:'🏍️',label:'Гуми'},
  electric:{emoji:'⚡',label:'Електрика'},engine:{emoji:'⚙️',label:'Двигател'},
  brakes:{emoji:'🔴',label:'Спирачки'},other:{emoji:'📝',label:'Друго'}
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
  if(!records.length)return '<div class="slog-empty">Няма записи. Добави първия!</div>';
  return records.map(function(r){
    var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
    var whoHtml=r.who==='self'?'<span class="slog-who-self">🧑‍🔧 Аз сам</span>':
      '<span class="slog-who link" onclick="event.stopPropagation();openProfile(\''+r.who+'\')">'+typeInfo.emoji+' '+escHtml(r.whoName)+'</span>';
    var confirmed=r.confirmed&&r.who!=='self'?'<span class="slog-confirmed">✅</span>':'';
    var costHtml=r.cost?'<span class="slog-cost">'+r.cost+' лв</span>':'';
    var noteHtml=r.note?'<div class="slog-note">'+escHtml(r.note)+'</div>':'';
    var nextHtml=r.next?'<div class="slog-next">⏭️ Следващо: '+escHtml(r.next)+'</div>':'';
    var hoursHtml=r.hours?'<span class="slog-hours">при '+r.hours+'ч</span>':'';
    return '<div class="slog-entry">'+
      '<div class="slog-head"><span class="slog-date">'+escHtml(r.date)+'</span><span class="slog-label">'+escHtml(r.label)+'</span>'+hoursHtml+costHtml+confirmed+'</div>'+
      '<div class="slog-body">'+whoHtml+noteHtml+nextHtml+'</div></div>';
  }).join('');
}

function renderAddRecordForm(bikeIdx){
  var bizOptions='<option value="self">🧑‍🔧 Аз сам</option>';
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
    '<input class="slog-input" type="number" id="slogHours'+bikeIdx+'" placeholder="При колко часа">'+
    '<select class="slog-input" id="slogWho'+bikeIdx+'">'+bizOptions+'</select>'+
    '<input class="slog-input" type="number" id="slogCost'+bikeIdx+'" placeholder="Цена (лв)">'+
    '<input class="slog-input" id="slogNote'+bikeIdx+'" placeholder="Бележка" maxlength="200">'+
    '<input class="slog-input" id="slogNext'+bikeIdx+'" placeholder="Следващо (на 150ч / след 3 мес.)">'+
    '<button class="btn btn-o" onclick="submitServiceRecord('+bikeIdx+')">Запиши</button>'+
  '</div>';
}

function submitServiceRecord(bikeIdx){
  var typeKey=document.getElementById('slogType'+bikeIdx).value;
  var typeInfo=SERVICE_TYPES[typeKey]||SERVICE_TYPES.other;
  var whoKey=document.getElementById('slogWho'+bikeIdx).value;
  var whoName=whoKey==='self'?'Аз сам':(businessData[whoKey]?businessData[whoKey].name:whoKey);
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
  showToast('📖 Записът е добавен!','success');
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
    {bikeIdx:yzIdx,date:'2026-02',type:'other',label:'Контратежест',hours:120,who:'motohaus',whoName:'МотоХаус',cost:180,note:'Сменен на нов OEM',confirmed:true,next:''},
    {bikeIdx:yzIdx,date:'2026-01',type:'suspension',label:'Окачване ревизия',hours:110,who:'pesho',whoName:'Пешо Механика',cost:350,note:'Смяна масло + семеринги WP XPLOR',confirmed:true,next:'на 160ч'},
    {bikeIdx:yzIdx,date:'2025-11',type:'tires',label:'Гуми',hours:95,who:'self',whoName:'Аз сам',cost:0,note:'Michelin Enduro Medium',confirmed:false,next:''},
    {bikeIdx:yzIdx,date:'2025-09',type:'oil',label:'Масло + филтър',hours:80,who:'self',whoName:'Аз сам',cost:45,note:'Motorex 10W-50',confirmed:false,next:'на 130ч'}
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
  h+='<span class="mod-map-stats">'+totalMods+' мод'+(totalMods!==1?'а':'')+(totalCost?' \u00B7 '+totalCost+' \u043B\u0432':'')+' </span></div>';
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
  var installerOpts='<option value="self">🛠️ Сам</option>';
  var bKeys=Object.keys(businessData);
  for(var bi=0;bi<bKeys.length;bi++){
    var bz=businessData[bKeys[bi]];
    if(bz.type==='mechanic'||bz.type==='specialist'||bz.type==='dealer'){
      installerOpts+='<option value="'+bKeys[bi]+'">'+bz.icon+' '+bz.name+'</option>';
    }
  }
  var shopOpts='<option value="">— магазин —</option>';
  for(var sbi=0;sbi<bKeys.length;sbi++){
    var sbz=businessData[bKeys[sbi]];
    shopOpts+='<option value="'+bKeys[sbi]+'">'+sbz.icon+' '+sbz.name+'</option>';
  }
  _modPartCount=1;
  var h='<div class="mod-form">'+
    '<div class="mod-form-title">НОВА МОДИФИКАЦИЯ — '+escHtml(bike.make+' '+bike.model)+'</div>'+
    '<input class="slog-input" id="modTitle" placeholder="Заглавие (напр. WP XPLOR ребилд)">'+
    '<div class="mod-form-row">'+
      '<select class="slog-input" id="modSystem" onchange="updateModComponents('+bikeIdx+')">'+sysOpts+'</select>'+
      '<select class="slog-input" id="modComponent"><option value="">— компонент —</option></select>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<select class="slog-input" id="modType">'+typeOpts+'</select>'+
      '<select class="slog-input" id="modInstaller">'+installerOpts+'</select>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input class="slog-input" id="modDate" type="month" value="'+new Date().toISOString().slice(0,7)+'">'+
      '<input class="slog-input" id="modHours" type="number" placeholder="Часове на мотора" min="0">'+
    '</div>'+
    '<div class="mod-parts-section">'+
      '<div class="mod-form-subtitle">ЧАСТИ</div>'+
      '<div id="modPartsContainer">'+
        '<div class="mod-part-input-row">'+
          '<input class="slog-input" placeholder="Част" data-mod-part="name" data-idx="0">'+
          '<select class="slog-input" data-mod-part="from" data-idx="0">'+shopOpts+'</select>'+
          '<input class="slog-input" placeholder="Цена" type="number" data-mod-part="price" data-idx="0">'+
          '<span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span>'+
        '</div>'+
      '</div>'+
      '<span class="garage-bike-btn mod-add-part" onclick="addModPartRow()">+ Част</span>'+
    '</div>'+
    '<div class="mod-form-row">'+
      '<input class="slog-input" id="modCost" type="number" placeholder="Обща цена (лв)">'+
      '<input class="slog-input" id="modNote" placeholder="Бележка">'+
    '</div>'+
    '<div class="mod-form-actions">'+
      '<span class="garage-bike-btn on" onclick="submitMod('+bikeIdx+')">💾 Запиши мод</span>'+
      '<label class="mod-forum-check"><input type="checkbox" id="modBuildThread"> Създай build thread</label>'+
    '</div>'+
  '</div>';
  return h;
}

function addModPartRow(){
  var c=document.getElementById('modPartsContainer');if(!c)return;
  var idx=_modPartCount++;
  var shopOpts='<option value="">— магазин —</option>';
  var bKeys=Object.keys(businessData);
  for(var i=0;i<bKeys.length;i++){
    shopOpts+='<option value="'+bKeys[i]+'">'+businessData[bKeys[i]].icon+' '+businessData[bKeys[i]].name+'</option>';
  }
  var row=document.createElement('div');
  row.className='mod-part-input-row';
  row.innerHTML='<input class="slog-input" placeholder="Част" data-mod-part="name" data-idx="'+idx+'">'+
    '<select class="slog-input" data-mod-part="from" data-idx="'+idx+'">'+shopOpts+'</select>'+
    '<input class="slog-input" placeholder="Цена" type="number" data-mod-part="price" data-idx="'+idx+'">'+
    '<span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span>';
  c.appendChild(row);
}

function updateModComponents(bikeIdx){
  var sel=document.getElementById('modComponent');if(!sel)return;
  var sys=document.getElementById('modSystem');if(!sys)return;
  var sysKey=sys.value;
  sel.innerHTML='<option value="">— компонент —</option>';
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
    {id:'modTitle',rules:[{type:'required',msg:'Заглавието е задължително'}]}
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
  var installerName='Сам';
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
  showToast('🔧 Модификация записана!','success');
  refreshTierDisplay();
}

function createModBuildThread(bikeIdx,mod){
  var bike=getGarage()[bikeIdx];if(!bike)return;
  var title='['+bike.make+' '+bike.model+'] — '+mod.title;
  var body='**Тип:** '+MOD_TYPES[mod.type].emoji+' '+MOD_TYPES[mod.type].label+'\n';
  body+='**Система:** '+SYSTEM_ICONS[mod.system].emoji+' '+SYSTEM_ICONS[mod.system].label+'\n';
  if(mod.parts.length){
    body+='\n**Части:**\n';
    mod.parts.forEach(function(p){
      var shopName=p.from&&businessData[p.from]?businessData[p.from].name:'—';
      body+='• '+p.name+' (от '+shopName+')'+( p.price?' — '+p.price+' лв':'')+'\n';
    });
  }
  body+='\n**Монтаж:** '+(mod.installedBy==='self'?'Сам':mod.installedByName)+'\n';
  if(mod.cost)body+='**Обща цена:** '+mod.cost+' лв\n';
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
  showToast('📝 Build thread създаден!','success');
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
  var parts=['🏍️ '+cred.total+' мотор'+(cred.total>1?'а':'')];
  if(cred.matchedBike){
    var verb=cred.matchedBike.status==='current'?'Карам':'Карал';
    parts.push(verb+' '+cred.matchedBike.make+' '+cred.matchedBike.model);
  }
  if(cred.years>0)parts.push(cred.years+'+ год.');
  return '<span class="cred-badge">'+escHtml(parts.join(' · '))+'</span>';
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
  var sumParts=[bikes.length+' мотор'+(bikes.length>1?'а':'')];
  if(years>0)sumParts.push(years+'+ годин'+(years>1?'и':'а')+' опит');
  else if(totalMonths>0)sumParts.push(totalMonths+' месец'+(totalMonths>1?'а':'')+' опит');

  function bikeCard(b,idx){
    var stClass=b.status==='current'?'garage-st-current':'garage-st-past';
    var stText=b.status==='current'?'КАРАМ СЕГА':'КАРАЛ';
    var c='<div class="prof-garage-bike"><div class="prof-garage-bike-head"><span class="prof-garage-bike-name">'+escHtml(b.make+' '+b.model)+'</span> <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>';
    c+='<div class="prof-garage-bike-year">'+escHtml(String(b.year));
    if(b.months)c+=' · '+b.months+' мес.';
    c+='</div>';
    if(b.note)c+='<div class="prof-garage-bike-note">'+escHtml(b.note)+'</div>';
    // Service log entries
    var records=getServiceLogForBike(idx).slice(0,5);
    if(records.length){
      c+='<div class="prof-slog">';
      records.forEach(function(r){
        var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
        var whoText=r.who==='self'?'Аз сам':escHtml(r.whoName);
        var confirmed=r.confirmed&&r.who!=='self'?' ✅':'';
        var costText=r.cost?' · '+r.cost+' лв':'';
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
  var archHtml=archKey&&ARCHETYPES[archKey]?('<span style="color:var(--orange)">'+ARCHETYPES[archKey].emoji+' '+ARCHETYPES[archKey].name+'</span> · '):'';
  var info=tierInfo();
  var tierHtml=renderTierBadge(info.key)+' · ';
  var progressHtml=renderTierProgress(info);
  return '<div class="prof-sec"><div class="prof-sec-t">⚙ ГАРАЖ</div><div class="prof-garage-summary">'+tierHtml+archHtml+escHtml(sumParts.join(' · '))+'</div>'+progressHtml+current.map(function(b){return bikeCard(b,bikes.indexOf(b))}).join('')+past.map(function(b){return bikeCard(b,bikes.indexOf(b))}).join('')+'</div>';
}

function renderProfileMods(){
  var bikes=getGarage();if(!bikes.length)return '';
  var hasMods=false;
  var h='<div class="prof-sec"><div class="prof-sec-t">🔧 МОДИФИКАЦИИ</div>';
  bikes.forEach(function(b,idx){
    var mods=getModsForBike(idx);if(!mods.length)return;
    hasMods=true;
    h+='<div class="prof-mod-bike-name">'+escHtml(b.make+' '+b.model)+'</div>';
    h+=renderModMap(idx,true);
    h+='<div class="prof-mod-log">';
    mods.slice(0,5).forEach(function(m){
      var sysInfo=SYSTEM_ICONS[m.system]||{emoji:'🔧'};
      h+='<div class="mod-log-row">';
      h+='<span class="mod-log-date">'+escHtml(m.date)+'</span>';
      h+='<span class="mod-log-sys">'+sysInfo.emoji+'</span>';
      h+='<span class="mod-log-title">'+escHtml(m.title)+'</span>';
      if(m.cost)h+='<span class="mod-log-cost">'+m.cost+' лв</span>';
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
    var sumParts=[bikes.length+' мотор'+(bikes.length>1?'а':'')];
    if(years>0)sumParts.push(years+'+ годин'+(years>1?'и':'а')+' опит');
    else if(totalMonths>0)sumParts.push(totalMonths+' месец'+(totalMonths>1?'а':'')+' опит');

    var log=JSON.parse(localStorage.getItem('orServiceLog_'+userId)||'[]');
    var mods=JSON.parse(localStorage.getItem('orMods_'+userId)||'[]');

    function bikeCardFor(b,idx){
      var stClass=b.status==='current'?'garage-st-current':'garage-st-past';
      var stText=b.status==='current'?'КАРАМ СЕГА':'КАРАЛ';
      var c='<div class="prof-garage-bike"><div class="prof-garage-bike-head"><span class="prof-garage-bike-name">'+escHtml(b.make+' '+b.model)+'</span> <span class="garage-st-badge '+stClass+'">'+stText+'</span></div>';
      c+='<div class="prof-garage-bike-year">'+escHtml(String(b.year));
      if(b.months)c+=' · '+b.months+' мес.';
      c+='</div>';
      if(b.note)c+='<div class="prof-garage-bike-note">'+escHtml(b.note)+'</div>';
      var records=log.filter(function(r){return r.bikeIdx===idx}).sort(function(a,b2){return b2.date>a.date?1:b2.date<a.date?-1:0}).slice(0,5);
      if(records.length){
        c+='<div class="prof-slog">';
        records.forEach(function(r){
          var typeInfo=SERVICE_TYPES[r.type]||SERVICE_TYPES.other;
          var whoText=r.who==='self'?'Аз сам':escHtml(r.whoName);
          var confirmed=r.confirmed&&r.who!=='self'?' ✅':'';
          var costText=r.cost?' · '+r.cost+' лв':'';
          c+='<div class="moto-pass-row"><span>'+typeInfo.emoji+' '+escHtml(r.label)+'</span><span>'+whoText+costText+confirmed+'</span></div>';
        });
        c+='</div>';
      }
      var bikeMods=mods.filter(function(m){return m.bikeIdx===idx});
      if(bikeMods.length){c+=renderModMap(idx,true)}
      return c+'</div>';
    }
    var archKey=userId===getCurrentUserId()?localStorage.getItem('orArchetype'):null;
    var archHtml=archKey&&ARCHETYPES[archKey]?('<span style="color:var(--orange)">'+ARCHETYPES[archKey].emoji+' '+ARCHETYPES[archKey].name+'</span> · '):'';
    var tk=calcTierForUser(userId);
    var tierHtml=tk?renderTierBadge(tk)+' · ':'';
    return '<div class="prof-sec"><div class="prof-sec-t">⚙ ГАРАЖ</div><div class="prof-garage-summary">'+tierHtml+archHtml+escHtml(sumParts.join(' · '))+'</div>'+current.map(function(b){return bikeCardFor(b,bikes.indexOf(b))}).join('')+past.map(function(b){return bikeCardFor(b,bikes.indexOf(b))}).join('')+'</div>';
  }catch(e){return ''}
}

function renderProfileModsFor(userId){
  try{
    var bikes=JSON.parse(localStorage.getItem('orGarage_'+userId)||'[]').map(migrateBike);
    if(!bikes.length)return '';
    var mods=JSON.parse(localStorage.getItem('orMods_'+userId)||'[]');
    var hasMods=false;
    var h='<div class="prof-sec"><div class="prof-sec-t">🔧 МОДИФИКАЦИИ</div>';
    bikes.forEach(function(b,idx){
      var bikeMods=mods.filter(function(m){return m.bikeIdx===idx}).sort(function(a,b2){return b2.date>a.date?1:b2.date<a.date?-1:0});
      if(!bikeMods.length)return;
      hasMods=true;
      h+='<div class="prof-mod-bike-name">'+escHtml(b.make+' '+b.model)+'</div>';
      h+=renderModMap(idx,true);
      h+='<div class="prof-mod-log">';
      bikeMods.slice(0,5).forEach(function(m){
        var sysInfo=SYSTEM_ICONS[m.system]||{emoji:'🔧'};
        h+='<div class="mod-log-row"><span class="mod-log-date">'+escHtml(m.date)+'</span><span class="mod-log-sys">'+sysInfo.emoji+'</span><span class="mod-log-title">'+escHtml(m.title)+'</span>';
        if(m.cost)h+='<span class="mod-log-cost">'+m.cost+' лв</span>';
        h+='</div>';
      });
      h+='</div>';
    });
    h+='</div>';
    return hasMods?h:'';
  }catch(e){return ''}
}

// ===== V10: BUSINESS DATA =====
var businessData={
  motohaus:{name:'МотоХаус',icon:'🏪',type:'shop',models:['yamaha','yz250f','yz125','wr450f'],tags:['части','окачване','wp','масла'],offers:[{title:'WP XPLOR Ревизия',price:'350 лв',desc:'Смяна масло + семеринги + настройка'},{title:'Yamaha OEM части -10%',price:'от 15 лв',desc:'Всички оригинални части Yamaha'}]},
  pesho:{name:'Пешо Механика',icon:'🔧',type:'mechanic',models:['yamaha','yz250f','ktm','exc','husqvarna'],tags:['ремонт','окачване','двигател','вибрация','контратежест'],offers:[{title:'Инспекция при покупка',price:'80 лв',desc:'Пълен преглед + писмено становище'},{title:'Ревизия окачване',price:'от 120 лв',desc:'Предно/задно, всички марки'}]},
  edimoto_shop:{name:'EdiMoto',icon:'🏍️',type:'dealer',models:['ktm','exc','husqvarna','fe','te','gasgas'],tags:['нов мотор','дилър','гаранция','конверсионен кит'],offers:[{title:'KTM EXC 2026 наличен',price:'от 24 900 лв',desc:'Фабрична гаранция 2г'},{title:'Конверсионен кит EXC→6Days',price:'2 800 лв',desc:'Пълен кит с монтаж'}]},
  gosho:{name:'Гошо Електро',icon:'⚡',type:'specialist',models:['fantic','xef','euro5','ecu'],tags:['електрика','ecu','ремап','диагностика'],offers:[{title:'ECU диагностика',price:'60 лв',desc:'Пълно сканиране + доклад'}]},
  elilison:{name:'Ели Лисън',icon:'🧤',type:'shop',models:['*'],tags:['екипировка','каска','ботуши','протектори','alpinestars','fox'],offers:[{title:'Alpinestars Tech 7 -15%',price:'680 лв',desc:'Всички размери на склад'}]}
};

// ===== V10: BUSINESS MATCHING =====
function getRelevantBusinesses(tags){
  var results=[];
  var tl=tags.map(function(t){return t.toLowerCase()});
  Object.keys(businessData).forEach(function(key){
    var biz=businessData[key];var score=0;
    biz.models.forEach(function(m){
      if(m==='*'){score+=0.5;return;}
      tl.forEach(function(t){if(t.indexOf(m)>-1||m.indexOf(t)>-1)score+=2;});
    });
    biz.tags.forEach(function(bt){
      tl.forEach(function(t){if(t.indexOf(bt)>-1||bt.indexOf(t)>-1)score+=1;});
    });
    if(score>1)results.push({key:key,biz:biz,score:score});
  });
  results.sort(function(a,b){return b.score-a.score});
  return results.slice(0,3);
}

function renderBusinessPanel(tags){
  var matches=getRelevantBusinesses(tags);
  if(!matches.length)return '';
  var html='<div class="biz-panel"><div class="biz-panel-title">🏪 СВЪРЗАНИ БИЗНЕСИ</div>';
  matches.forEach(function(m){
    html+='<div class="sbi" onclick="event.stopPropagation();openProfile(\''+m.key+'\')">';
    html+='<div class="sbi-i" style="font-size:11px">'+m.biz.icon+'</div>';
    html+='<div><strong style="font-size:12px">'+escHtml(m.biz.name)+'</strong>';
    if(m.biz.offers&&m.biz.offers.length){
      var o=m.biz.offers[0];
      html+='<div class="meta">'+escHtml(o.title)+' · '+escHtml(o.price)+'</div>';
    }
    html+='</div></div>';
  });
  html+='</div>';return html;
}

// ===== V10: AUTO BIZ PANEL IN THREADS =====
var _origToggleThread=typeof toggleThread==='function'?toggleThread:null;
function toggleThreadV10(el){
  // Call original toggleThread
  if(_origToggleThread)_origToggleThread(el);
  // Inject biz panel if has tags
  var tags=el.dataset.tags?el.dataset.tags.split(','):[];
  if(tags.length&&!el.querySelector('.biz-panel')){
    var bizHTML=renderBusinessPanel(tags);
    if(bizHTML){
      var insertPoint=el.querySelector('.ft-also')||el.querySelector('.pres');
      if(insertPoint)insertPoint.insertAdjacentHTML('beforebegin',bizHTML);
      else el.insertAdjacentHTML('beforeend',bizHTML);
    }
  }
}

// ===== V10: HOT TODAY DYNAMIC =====
function renderHotToday(){
  var container=document.getElementById('hotTodayItems');
  if(!container)return;
  var allOffers=[];
  Object.keys(businessData).forEach(function(key){
    var biz=businessData[key];
    if(biz.offers)biz.offers.forEach(function(o){allOffers.push({key:key,biz:biz,offer:o})});
  });
  allOffers.sort(function(){return 0.5-Math.random()});
  container.innerHTML=allOffers.slice(0,3).map(function(item){
    return '<div class="sbi" onclick="openProfile(\''+item.key+'\')"><div class="sbi-i">'+item.biz.icon+'</div><div><strong style="font-size:12px">'+escHtml(item.offer.title)+'</strong><div class="meta">'+escHtml(item.biz.name)+' · '+escHtml(item.offer.price)+'</div></div></div>';
  }).join('');
}

// ===== V10: FOR YOUR BIKE (personalized sidebar) =====
function renderForYourBike(){
  var container=document.getElementById('forYourBike');
  if(!container)return;
  var bikes=getGarage();
  if(!bikes.length){container.style.display='none';return;}
  container.style.display='';
  var bikeTerms=[];
  bikes.forEach(function(b){bikeTerms.push(b.make.toLowerCase());bikeTerms.push(b.model.toLowerCase())});
  var matches=getRelevantBusinesses(bikeTerms);
  if(!matches.length){container.style.display='none';return;}
  var itemsHTML=matches.map(function(m){
    var offerText=m.biz.offers&&m.biz.offers[0]?m.biz.offers[0].title+' · '+m.biz.offers[0].price:'';
    return '<div class="sbi" onclick="openProfile(\''+m.key+'\')"><div class="sbi-i">'+m.biz.icon+'</div><div><strong style="font-size:12px">'+escHtml(m.biz.name)+'</strong>'+(offerText?'<div class="meta">'+escHtml(offerText)+'</div>':'')+'</div></div>';
  }).join('');
  container.querySelector('.for-your-bike').innerHTML='<div class="for-your-bike-title">🎯 ЗА ТВОЯ МОТОР</div>'+itemsHTML;
}

// ===== V10: PROFILE OFFERS TAB =====
function renderProfileOffers(profileKey){
  // Try bizProfile first (user-saved data), then seed businessData
  var bp=getBizProfile(profileKey);
  var offers=bp&&bp.offers?bp.offers:(businessData[profileKey]&&businessData[profileKey].offers?businessData[profileKey].offers:null);
  if(!offers)return;
  var container=document.getElementById('pt-offers');
  if(!container)return;
  container.innerHTML=offers.map(function(o){
    var hasUrl=o.url&&o.url.indexOf('http')===0;
    return '<div class="prof-item" style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center">'
      +'<strong>'+(hasUrl?'<a href="'+escHtml(o.url)+'" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none">'+escHtml(o.title)+' ↗</a>':escHtml(o.title))+'</strong>'
      +'<span class="price-s">'+escHtml(o.price)+'</span></div>'
      +'<div class="meta" style="margin-top:4px">'+escHtml(o.desc)+'</div></div>';
  }).join('');
}

// ===== V10: INIT =====
// ===== FORUM FILTERS =====
function initForumFilters(){
  var fb=document.getElementById('forumFilter');
  if(!fb)return;
  fb.addEventListener('click',function(e){
    var chip=e.target.closest('.ff-chip');
    if(!chip)return;
    fb.querySelectorAll('.ff-chip').forEach(function(c){c.classList.remove('on')});
    chip.classList.add('on');
    var filter=chip.dataset.filter;
    var zone=enterZone._current;
    document.querySelectorAll('#t-forum .ft').forEach(function(ft){
      var zoneMatch=!zone||ft.dataset.zone===zone;
      var typeMatch=filter==='all'||ft.dataset.type===filter;
      ft.style.display=(zoneMatch&&typeMatch)?'':'none';
    });
  });
}

// ===== QUICK REACTIONS =====
function quickReact(btn){
  btn.classList.toggle('reacted');
  var txt=btn.textContent.trim();
  var parts=txt.match(/^(.+?)(\d+)?$/);
  if(parts){
    var label=parts[1].trim();
    var count=parseInt(parts[2])||0;
    count=btn.classList.contains('reacted')?(count+1):Math.max(0,count-1);
    btn.textContent=label+(count?' '+count:'');
  }
}

// ===== DNA CATALOG =====
var BIKE_DNA={
'ktm-exc-300':{name:'KTM EXC 300',make:'KTM',model:'EXC 300',emoji:'🏍️',years:'2018-2024',type:'enduro',systems:{
  engine:{name:'Двигател',emoji:'⚙️',desc:'2T 300cc TPI',components:[
    {id:'cylinder',name:'Цилиндър + бутало',emoji:'🔩',spec:'Nikasil 72mm',interval:'200ч',priceRange:'400-800 лв',tags:['двигател','цилиндър','ktm','exc'],premium:false},
    {id:'crankshaft',name:'Коляново дърво',emoji:'⚙️',spec:'Балансиран, контратежест',interval:'300ч',priceRange:'600-1200 лв',tags:['двигател','коляново','ktm','exc','контратежест'],premium:false},
    {id:'clutch',name:'Съединител',emoji:'🔧',spec:'Диафрагмен, 7 диска',interval:'150ч',priceRange:'180-350 лв',tags:['двигател','съединител','ktm'],premium:false},
    {id:'tpi',name:'TPI инжекция',emoji:'⚡',spec:'Synerject ECU, 2 инжектора',interval:'—',priceRange:'800-1500 лв',tags:['електрика','ecu','tpi','ktm','exc'],premium:true}
  ]},
  suspension:{name:'Окачване',emoji:'🔧',desc:'WP XPLOR 48 / WP XACT',components:[
    {id:'fork',name:'Предна вилка',emoji:'🔧',spec:'WP XPLOR 48mm, open chamber',interval:'100ч',priceRange:'350-680 лв ревизия',tags:['окачване','вилка','wp','ktm'],premium:false},
    {id:'shock',name:'Заден амортисьор',emoji:'🏋️',spec:'WP XACT, PDS система',interval:'100ч',priceRange:'300-600 лв ревизия',tags:['окачване','амортисьор','wp','ktm'],premium:false},
    {id:'linkage',name:'Линкаж',emoji:'🔩',spec:'Лагери + шарнири',interval:'50ч',priceRange:'80-200 лв',tags:['окачване','линкаж','ktm'],premium:false}
  ]},
  electrical:{name:'Електрика',emoji:'⚡',desc:'12V, Synerject ECU',components:[
    {id:'wiring',name:'Инсталация',emoji:'⚡',spec:'Жична, 12V',interval:'—',priceRange:'200-400 лв',tags:['електрика','инсталация','ktm'],premium:false},
    {id:'ecu',name:'ECU / ремап',emoji:'💻',spec:'Synerject + GET / Vortex',interval:'—',priceRange:'400-1200 лв',tags:['електрика','ecu','ремап','ktm','exc'],premium:true}
  ]},
  drivetrain:{name:'Задвижване',emoji:'⛓️',desc:'Верига + пиньони 520',components:[
    {id:'chain',name:'Верига + пиньони',emoji:'⛓️',spec:'520 o-ring, 13/50',interval:'40-60ч',priceRange:'120-280 лв',tags:['верига','пиньон','ktm'],premium:false},
    {id:'gearbox',name:'Скоростна кутия',emoji:'⚙️',spec:'6-степенна wide-ratio',interval:'—',priceRange:'400-900 лв',tags:['двигател','скоростна','ktm'],premium:false}
  ]},
  wheels:{name:'Колела',emoji:'🏍️',desc:'21"/18" спици',components:[
    {id:'tires',name:'Гуми',emoji:'🏍️',spec:'90/90-21 + 140/80-18',interval:'30-50ч',priceRange:'140-280 лв/бр',tags:['гуми','ендуро','ktm'],premium:false},
    {id:'rims',name:'Джанти + спици',emoji:'🔩',spec:'Excel, 36 спици',interval:'50ч проверка',priceRange:'300-600 лв/бр',tags:['джанти','спици','ktm'],premium:false},
    {id:'brakes',name:'Спирачки',emoji:'🔴',spec:'Brembo, 260/220mm',interval:'80ч накладки',priceRange:'60-180 лв',tags:['спирачки','brembo','ktm'],premium:false}
  ]},
  frame:{name:'Рама & защити',emoji:'🛡️',desc:'Хром-молибден, протектори',components:[
    {id:'guards',name:'Предпазители',emoji:'🛡️',spec:'Картер, ръце, радиатор',interval:'—',priceRange:'80-350 лв',tags:['предпазители','протектори','ktm','exc'],premium:false},
    {id:'radiator',name:'Радиатори',emoji:'🌡️',spec:'Алуминиеви ляв+десен',interval:'—',priceRange:'200-450 лв/бр',tags:['радиатор','охлаждане','ktm'],premium:false}
  ]}
}},
'yamaha-yz250f':{name:'Yamaha YZ250F',make:'Yamaha',model:'YZ250F',emoji:'🏍️',years:'2019-2024',type:'cross',systems:{
  engine:{name:'Двигател',emoji:'⚙️',desc:'4T 250cc DOHC',components:[
    {id:'valves',name:'Клапани + разпределение',emoji:'⚙️',spec:'Ti клапани, DOHC 4V',interval:'40ч провери, 80ч смяна',priceRange:'300-700 лв',tags:['двигател','клапани','yamaha','yz250f'],premium:false},
    {id:'piston',name:'Бутало + цилиндър',emoji:'🔩',spec:'77mm bore, кован',interval:'100ч',priceRange:'350-650 лв',tags:['двигател','бутало','цилиндър','yamaha','yz250f'],premium:false},
    {id:'crankshaft',name:'Коляново дърво',emoji:'⚙️',spec:'Контратежест, балансиран',interval:'200ч',priceRange:'500-1000 лв',tags:['двигател','коляново','контратежест','yamaha','yz250f','вибрация'],premium:false},
    {id:'oil',name:'Маслена система',emoji:'🛢️',spec:'Мокър картер, 1L',interval:'15ч или 3 карания',priceRange:'30-60 лв',tags:['масло','филтър','yamaha','yz250f'],premium:false}
  ]},
  suspension:{name:'Окачване',emoji:'🔧',desc:'KYB SSS 48mm',components:[
    {id:'fork',name:'Предна вилка',emoji:'🔧',spec:'KYB SSS 48mm, пружинна',interval:'80ч',priceRange:'280-550 лв ревизия',tags:['окачване','вилка','kyb','yamaha','yz250f'],premium:false},
    {id:'shock',name:'Заден амортисьор',emoji:'🏋️',spec:'KYB, link система',interval:'80ч',priceRange:'250-500 лв ревизия',tags:['окачване','амортисьор','kyb','yamaha','yz250f'],premium:false}
  ]},
  electrical:{name:'Електрика',emoji:'⚡',desc:'CDI, без TPI',components:[
    {id:'cdi',name:'CDI модул',emoji:'⚡',spec:'Оригинален CDI',interval:'—',priceRange:'85-185 лв',tags:['електрика','cdi','yamaha','yz250f'],premium:false}
  ]},
  drivetrain:{name:'Задвижване',emoji:'⛓️',desc:'DID 520',components:[
    {id:'chain',name:'Верига + пиньони',emoji:'⛓️',spec:'DID 520, 13/49',interval:'40-60ч',priceRange:'110-260 лв',tags:['верига','пиньон','yamaha','yz250f'],premium:false}
  ]},
  wheels:{name:'Колела',emoji:'🏍️',desc:'21"/19" крос',components:[
    {id:'tires',name:'Гуми',emoji:'🏍️',spec:'80/100-21 + 110/90-19',interval:'20-40ч',priceRange:'120-250 лв/бр',tags:['гуми','крос','yamaha','yz250f'],premium:false},
    {id:'brakes',name:'Спирачки',emoji:'🔴',spec:'Nissin, 270/240mm',interval:'60ч накладки',priceRange:'50-150 лв',tags:['спирачки','yamaha','yz250f'],premium:false}
  ]},
  frame:{name:'Рама & защити',emoji:'🛡️',desc:'Алуминиева bilateral beam',components:[
    {id:'guards',name:'Предпазители',emoji:'🛡️',spec:'Ръце + картер',interval:'—',priceRange:'60-300 лв',tags:['предпазители','yamaha','yz250f'],premium:false}
  ]}
}},
'honda-crf250r':{name:'Honda CRF250R',make:'Honda',model:'CRF250R',emoji:'🏍️',years:'2018-2024',type:'cross',systems:{
  engine:{name:'Двигател',emoji:'⚙️',desc:'4T 250cc Unicam',components:[
    {id:'valves',name:'Клапани Unicam',emoji:'⚙️',spec:'SOHC Unicam, Ti intake',interval:'30ч провери',priceRange:'250-600 лв',tags:['двигател','клапани','honda','crf'],premium:false},
    {id:'piston',name:'Бутало + цилиндър',emoji:'🔩',spec:'79mm bore',interval:'80ч',priceRange:'300-600 лв',tags:['двигател','бутало','honda','crf'],premium:false}
  ]},
  suspension:{name:'Окачване',emoji:'🔧',desc:'Showa 49mm SFF-Air',components:[
    {id:'fork',name:'Showa SFF-Air вилка',emoji:'🔧',spec:'49mm, air spring',interval:'60ч',priceRange:'300-600 лв ревизия',tags:['окачване','вилка','showa','honda','crf'],premium:false},
    {id:'shock',name:'Заден Showa',emoji:'🏋️',spec:'Pro-Link',interval:'60ч',priceRange:'280-550 лв',tags:['окачване','амортисьор','showa','honda','crf'],premium:false}
  ]},
  electrical:{name:'Електрика',emoji:'⚡',desc:'PGM-FI инжекция',components:[
    {id:'ecu',name:'ECU PGM-FI',emoji:'💻',spec:'GET/Vortex compatible',interval:'—',priceRange:'500-1200 лв',tags:['електрика','ecu','honda','crf'],premium:true}
  ]},
  drivetrain:{name:'Задвижване',emoji:'⛓️',desc:'RK 520',components:[
    {id:'chain',name:'Верига + пиньони',emoji:'⛓️',spec:'RK 520, 13/48',interval:'40ч',priceRange:'100-240 лв',tags:['верига','honda','crf'],premium:false}
  ]},
  wheels:{name:'Колела',emoji:'🏍️',desc:'21"/19"',components:[
    {id:'tires',name:'Гуми',emoji:'🏍️',spec:'MX стандарт',interval:'20-30ч',priceRange:'120-250 лв/бр',tags:['гуми','honda','crf'],premium:false}
  ]},
  frame:{name:'Рама & защити',emoji:'🛡️',desc:'Алуминиева twin-spar',components:[
    {id:'guards',name:'Предпазители',emoji:'🛡️',spec:'Ръце + картер',interval:'—',priceRange:'70-280 лв',tags:['предпазители','honda','crf'],premium:false}
  ]}
}},
'husqvarna-fe-350':{name:'Husqvarna FE 350',make:'Husqvarna',model:'FE 350',emoji:'🏍️',years:'2020-2024',type:'enduro',systems:{
  engine:{name:'Двигател',emoji:'⚙️',desc:'4T 350cc DOHC',components:[
    {id:'valves',name:'Клапани + разпределение',emoji:'⚙️',spec:'DOHC 4V, Ti',interval:'60ч',priceRange:'350-700 лв',tags:['двигател','клапани','husqvarna','fe'],premium:false},
    {id:'piston',name:'Бутало',emoji:'🔩',spec:'88mm bore',interval:'120ч',priceRange:'300-600 лв',tags:['двигател','бутало','husqvarna','fe'],premium:false}
  ]},
  suspension:{name:'Окачване',emoji:'🔧',desc:'WP XACT 48mm',components:[
    {id:'fork',name:'WP XACT вилка',emoji:'🔧',spec:'48mm, closed cartridge',interval:'100ч',priceRange:'350-650 лв',tags:['окачване','вилка','wp','husqvarna','fe'],premium:false},
    {id:'shock',name:'WP XACT амортисьор',emoji:'🏋️',spec:'PDS',interval:'100ч',priceRange:'300-600 лв',tags:['окачване','амортисьор','wp','husqvarna'],premium:false}
  ]},
  electrical:{name:'Електрика',emoji:'⚡',desc:'Keihin EMS',components:[
    {id:'ecu',name:'ECU Keihin',emoji:'💻',spec:'GET/Vortex compatible',interval:'—',priceRange:'500-1200 лв',tags:['електрика','ecu','husqvarna','fe'],premium:true}
  ]},
  drivetrain:{name:'Задвижване',emoji:'⛓️',desc:'DID 520',components:[
    {id:'chain',name:'Верига + пиньони',emoji:'⛓️',spec:'DID 520, 14/52',interval:'40ч',priceRange:'120-270 лв',tags:['верига','husqvarna','fe'],premium:false}
  ]},
  wheels:{name:'Колела',emoji:'🏍️',desc:'21"/18" ендуро',components:[
    {id:'tires',name:'Гуми',emoji:'🏍️',spec:'90/90-21 + 140/80-18',interval:'30-50ч',priceRange:'140-280 лв/бр',tags:['гуми','ендуро','husqvarna'],premium:false}
  ]},
  frame:{name:'Рама & защити',emoji:'🛡️',desc:'Хром-молибден',components:[
    {id:'guards',name:'Предпазители',emoji:'🛡️',spec:'Картер, ръце, радиатор',interval:'—',priceRange:'80-350 лв',tags:['предпазители','husqvarna','fe'],premium:false}
  ]}
}}
};

var BUILD_THREADS=[
  {bike:'ktm-exc-300',system:'suspension',title:'WP XPLOR пълен ребилд',author:'Пешо Механика',authorKey:'pesho',milestones:['Диагностика','Семеринги','Ревалвинг','Тест'],cost:'680 лв'},
  {bike:'yamaha-yz250f',system:'engine',title:'YZ250F вибрация — контратежест смяна',author:'Пешо Механика',authorKey:'pesho',milestones:['Диагностика','Свали двигател','Нов контратежест','Сглоби'],cost:'340 лв'},
  {bike:'ktm-exc-300',system:'electrical',title:'GET ECU ремап за хард ендуро',author:'Гошо Електро',authorKey:'gosho',milestones:['Диагностика','Flash','Тюнинг','Тест'],cost:'450 лв'},
  {bike:'honda-crf250r',system:'suspension',title:'Showa SFF-Air ребилд + пружини',author:'Пешо Механика',authorKey:'pesho',milestones:['Сваляне','Пружини','Масла','Сглобяване'],cost:'520 лв'}
];

var _dnaModel=null,_dnaSystem=null;

function dnaHome(){
  _dnaModel=null;_dnaSystem=null;
  document.getElementById('dnaModels').style.display='';
  document.getElementById('dnaSystems').style.display='none';
  document.getElementById('dnaComponents').style.display='none';
  document.getElementById('dnaBc').style.display='none';
  renderDnaModels();
}

function renderDnaModels(){
  var garage=getGarage();
  var grid=document.getElementById('dnaModelGrid');if(!grid)return;
  var h='';
  Object.keys(BIKE_DNA).forEach(function(key){
    var m=BIKE_DNA[key];
    var isYours=garage.some(function(b){return b.make&&b.model&&m.make.toLowerCase()===b.make.toLowerCase()&&m.model.toLowerCase().split(' ')[0]===b.model.toLowerCase().split(' ')[0]});
    h+='<div class="dna-model'+(isYours?' yours':'')+'" onclick="dnaSelectModel(\''+key+'\')">';
    h+='<div class="dna-model-emoji">'+m.emoji+'</div>';
    h+='<div class="dna-model-name">'+m.name+'</div>';
    h+='<div class="dna-model-sub">'+m.years+' · '+Object.keys(m.systems).length+' системи</div>';
    h+='</div>';
  });
  grid.innerHTML=h;
  var sc=document.getElementById('dnaGarageShortcut');
  if(sc&&garage.length>0&&garage[0].make){
    sc.style.display='';
    var bn=document.getElementById('dnaGarageBikeName');
    if(bn)bn.textContent=garage[0].make+' '+garage[0].model;
  }
}

function dnaFromGarage(){
  var garage=getGarage();if(!garage.length)return;
  var b=garage[0];var matchKey=null;
  Object.keys(BIKE_DNA).forEach(function(key){
    var d=BIKE_DNA[key];
    if(d.make.toLowerCase()===b.make.toLowerCase())matchKey=key;
  });
  if(matchKey)dnaSelectModel(matchKey);
  else showToast('🧬 ДНК за '+b.make+' '+b.model+' — скоро!','');
}

function dnaSelectModel(key){
  _dnaModel=key;_dnaSystem=null;
  var m=BIKE_DNA[key];if(!m)return;
  document.getElementById('dnaModels').style.display='none';
  document.getElementById('dnaSystems').style.display='';
  document.getElementById('dnaComponents').style.display='none';
  var bc=document.getElementById('dnaBc');bc.style.display='';
  document.getElementById('dnaBcSep1').style.display='';
  document.getElementById('dnaBcModel').style.display='';
  document.getElementById('dnaBcModel').textContent=m.name;
  document.getElementById('dnaBcSep2').style.display='none';
  document.getElementById('dnaBcSystem').style.display='none';
  document.getElementById('dnaSystemsHeader').innerHTML='<div style="margin-bottom:14px"><div class="sec-title" style="font-size:18px">'+m.emoji+' '+m.name+' · ДНК</div><div class="meta">'+m.years+' · '+m.type+'</div></div>';
  var g=document.getElementById('dnaSystemGrid');var h='';
  Object.keys(m.systems).forEach(function(sk){
    var s=m.systems[sk];
    h+='<div class="dna-sys" onclick="dnaSelectSystem(\''+key+'\',\''+sk+'\')">';
    h+='<div class="dna-sys-emoji">'+s.emoji+'</div>';
    h+='<div class="dna-sys-name">'+s.name+'</div>';
    h+='<div class="dna-sys-count">'+s.components.length+' компонента</div>';
    h+='</div>';
  });
  g.innerHTML=h;
  var bt=document.getElementById('dnaBuildThreads');
  var threads=BUILD_THREADS.filter(function(t){return t.bike===key});
  if(threads.length){
    var bh='<div style="font:500 10px \'JetBrains Mono\',monospace;letter-spacing:2px;color:var(--earth);margin-bottom:8px">🔧 BUILD THREADS</div>';
    threads.forEach(function(t){
      bh+='<div class="dna-build" onclick="event.stopPropagation();openProfile(\''+t.authorKey+'\')">';
      bh+='<div class="dna-build-title">'+t.title+' · <span style="color:var(--orange)">'+t.cost+'</span></div>';
      bh+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="meta">'+t.author+'</span><span class="dna dna-enduro" style="font-size:9px">✅ завършен</span></div>';
      bh+='<div class="dna-build-ms">';
      t.milestones.forEach(function(ms){bh+='<span class="dna-build-dot">'+ms+'</span>';});
      bh+='</div></div>';
    });
    bt.innerHTML=bh;
  } else bt.innerHTML='';
}

function dnaSelectSystem(modelKey,sysKey){
  _dnaSystem=sysKey;
  var m=BIKE_DNA[modelKey];if(!m)return;
  var s=m.systems[sysKey];if(!s)return;
  document.getElementById('dnaSystems').style.display='none';
  document.getElementById('dnaComponents').style.display='';
  document.getElementById('dnaBcSep2').style.display='';
  document.getElementById('dnaBcSystem').style.display='';
  document.getElementById('dnaBcSystem').textContent=s.name;
  document.getElementById('dnaBcModel').innerHTML='<span class="dna-bc-home" onclick="dnaSelectModel(\''+modelKey+'\')">'+m.name+'</span>';
  document.getElementById('dnaComponentsHeader').innerHTML='<div style="margin-bottom:14px"><div class="sec-title" style="font-size:18px">'+s.emoji+' '+m.name+' · '+s.name+'</div><div class="meta">'+s.desc+'</div></div>';
  var cl=document.getElementById('dnaCompList');var h='';
  s.components.forEach(function(c){
    var pc=c.premium?' dna-comp-premium':'';
    h+='<div class="dna-comp'+pc+'" onclick="this.classList.toggle(\'open\')">';
    h+='<div class="dna-comp-head">';
    h+='<div style="font-size:22px">'+c.emoji+'</div>';
    h+='<div class="dna-comp-info"><div class="dna-comp-name">'+c.name+'</div>';
    h+='<div class="dna-comp-spec">'+c.spec+(c.interval!=='—'?' · ⏱ '+c.interval:'')+'</div></div>';
    h+='<div class="dna-comp-price">'+c.priceRange+'</div></div>';
    h+='<span class="mc-expand" style="font-size:10px;color:var(--text2);margin-top:4px;display:block">подробности ↓</span>';
    h+='<div class="dna-comp-detail">';
    var biz=getRelevantBusinesses(c.tags);
    if(biz.length){
      h+='<div style="margin-bottom:8px"><div style="font:500 9px \'JetBrains Mono\',monospace;letter-spacing:1px;color:var(--earth);margin-bottom:4px">🏪 НАМЕРИ В</div>';
      biz.forEach(function(b){
        h+='<div style="margin-bottom:3px;cursor:pointer" onclick="event.stopPropagation();openProfile(\''+b.key+'\')">'+b.biz.icon+' <span class="link">'+b.biz.name+'</span>';
        if(b.biz.offers&&b.biz.offers[0])h+=' · <span style="color:var(--orange)">'+b.biz.offers[0].price+'</span>';
        h+='</div>';
      });
      h+='</div>';
    }
    h+='<div style="margin-bottom:4px"><div style="font:500 9px \'JetBrains Mono\',monospace;letter-spacing:1px;color:var(--earth);margin-bottom:4px">💬 ФОРУМ</div>';
    h+='<span class="link" onclick="event.stopPropagation();go(\'forum\')">Търси теми за '+c.name.toLowerCase()+' →</span></div>';
    h+='</div></div>';
  });
  cl.innerHTML=h;
}

// ===== AUTH SYSTEM =====
var ROLE_META={
  rider:{emoji:'🏍️',label:'Ездач',desc:'Карам офроуд'},
  business:{emoji:'🏪',label:'Бизнес',desc:'Магазин / Сервиз'},
  mechanic:{emoji:'🔧',label:'Майстор',desc:'Ремонтирам мотори'},
  trainer:{emoji:'🏅',label:'Треньор',desc:'Обучавам ездачи'}
};
var DEMO_USERS={
  marin:{id:'marin',name:'Марин Тодоров',emoji:'🏍️',role:'rider',city:'Бургас',bio:'KTM EXC 300, ендуро трейлове',archetype:'wanderer',joined:'2025-09'},
  ivo:{id:'ivo',name:'Иван Петров',emoji:'🏍️',role:'rider',city:'София',bio:'Fantic XEF 310, кросови уикенди',archetype:'warrior',joined:'2025-06'},
  motohaus:{id:'motohaus',name:'МотоХаус Нови хан',emoji:'🏪',role:'business',city:'Нови хан',bio:'Магазин & Сервиз · Ендуро, Мотокрос',shopType:'shop',workHours:'Пон-Съб 9-18',joined:'2024-01'},
  edimoto_shop:{id:'edimoto_shop',name:'EdiMoto',emoji:'🏍️',role:'business',city:'София',bio:'Официален дилър KTM Group & Kawasaki',shopType:'dealer',workHours:'Пон-Съб 9-18',joined:'2024-03'},
  pesho:{id:'pesho',name:'Пешо Механика',emoji:'🔧',role:'mechanic',city:'Пловдив',bio:'Окачване специалист',specialty:'окачване,wp,showa,kyb',joined:'2024-01'},
  gosho:{id:'gosho',name:'Гошо Електро',emoji:'⚡',role:'mechanic',city:'Варна',bio:'EFI, CDI, TPI, окабеляване',specialty:'електрика,ecu,ремап',joined:'2024-06'},
  manolov:{id:'manolov',name:'Величко Манолов',emoji:'🏅',role:'trainer',city:'Манолово',bio:'Легенда на мотокроса',experience:'20+',levels:'beginner,intermediate,advanced',joined:'2024-01'},
  kabakchiev:{id:'kabakchiev',name:'Теодор Кабакчиев',emoji:'🏆',role:'trainer',city:'Габрово',bio:'Световен Шампион Hard Enduro',experience:'15+',levels:'advanced,pro',joined:'2024-01'},
  edimoto:{id:'edimoto',name:'EdiMoto Части',emoji:'🏍️',role:'business',city:'София',bio:'Употребявани части · Всички марки',shopType:'parts',joined:'2024-06'},
  elilison:{id:'elilison',name:'Ели Лисън Мото',emoji:'🧤',role:'business',city:'София',bio:'Екипировка & Аксесоари',shopType:'gear',workHours:'Пон-Съб 10-19',joined:'2024-02'}
};

function getUsers(){try{return JSON.parse(localStorage.getItem('orUsers'))||{}}catch(e){return{}}}
function saveUsers(u){localStorage.setItem('orUsers',JSON.stringify(u))}
function getCurrentUserId(){return localStorage.getItem('orSession')||null}
function getCurrentUser(){var id=getCurrentUserId();if(!id)return null;var u=getUsers();return u[id]||null}
function loginAs(userId){localStorage.setItem('orSession',userId);refreshAuthUI();showGreeting();refreshTierDisplay();renderGarage();updateGarageBadge();seedMessages();seedNotifications();updateInboxBadge();updateStreak();refreshHome()}
function logout(){localStorage.removeItem('orSession');refreshAuthUI();showGreeting();refreshTierDisplay();renderGarage();updateGarageBadge();refreshHome();showToast('👋 До скоро!')}

function seedDemoAccounts(){
  var u=getUsers();
  if(Object.keys(u).length>0){
    // Merge missing DEMO_USERS entries into existing orUsers
    var changed=false;
    Object.keys(DEMO_USERS).forEach(function(k){if(!u[k]){u[k]=DEMO_USERS[k];changed=true}});
    if(changed)saveUsers(u);
    return;
  }
  u=Object.assign({},DEMO_USERS);saveUsers(u);
  // Seed marin's garage
  if(!localStorage.getItem('orGarage_marin'))localStorage.setItem('orGarage_marin',JSON.stringify([{make:'KTM',model:'EXC 300',year:'2019',status:'current',note:'Хард ендуро звяр',months:18}]));
  // Seed ivo's garage
  if(!localStorage.getItem('orGarage_ivo'))localStorage.setItem('orGarage_ivo',JSON.stringify([{make:'Fantic',model:'XEF 310',year:'2025',status:'current',note:'Чисто нов',months:3}]));
  // Seed marin's service log
  if(!localStorage.getItem('orServiceLog_marin'))localStorage.setItem('orServiceLog_marin',JSON.stringify([
    {bikeIdx:0,date:'2026-02',type:'other',label:'Контратежест',hours:120,who:'motohaus',whoName:'МотоХаус',cost:180,note:'Сменен на нов OEM',confirmed:true,next:''},
    {bikeIdx:0,date:'2026-01',type:'suspension',label:'Окачване ревизия',hours:110,who:'pesho',whoName:'Пешо Механика',cost:350,note:'Смяна масло + семеринги WP XPLOR',confirmed:true,next:'на 160ч'}
  ]));
  // Forum posts now seeded by seedForumDemo()
  // Seed event registrations
  if(!localStorage.getItem('orEventRegs'))localStorage.setItem('orEventRegs',JSON.stringify({'extreme-fest-2026':['marin','ivo','pesho','motohaus'],'training-22mar-kids':['ivo']}));
}

// ===== BIZ PROFILE HELPERS =====
function getBizProfile(userId){try{return JSON.parse(localStorage.getItem('orBizProfile_'+userId))||null}catch(e){return null}}
function saveBizProfile(userId,data){localStorage.setItem('orBizProfile_'+userId,JSON.stringify(data))}

function seedProfiles(){
  if(localStorage.getItem('orBizProfile_motohaus'))return;
  // motohaus — магазин & сервиз
  saveBizProfile('motohaus',{
    desc:'Магазин & Сервиз · Ендуро, Мотокрос, ATV',location:'Нови хан, на главния път',locationAction:'map',
    hours:'Понеделник — Събота: 9:00 — 18:00',phone:'+359 88 XXX XXXX',
    badges:[{text:'✓ Верифициран',cls:'b-ver'},{text:'✓ Интеркарс',cls:'b-ik'},{text:'🏆 Величко',cls:'b-leg'}],
    stats:[{n:'347',l:'Продажби'},{n:'4.9',l:'Рейтинг'},{n:'89',l:'Ревюта'},{n:'~2ч',l:'Отговор'}],
    about:'Пълен сервиз и магазин за офроуд мотори. Интеркарс партньор — поръчка нови части до 24ч. Сервиз окачване, двигатели, електроника.',
    tabs:[{id:'about',label:'За нас',def:true},{id:'motos',label:'Мотори'},{id:'parts',label:'Части'},{id:'revs',label:'Ревюта'},{id:'offers',label:'🏷️ Оферти'}],
    motos:[
      {name:'Fantic XEF 310 2025',note:'Евро 5',price:'15 800 лв',dual:'8 080 €'},
      {name:'Fantic XEF 250 2025',note:'Евро 5',price:'14 200 лв',dual:'7 262 €'},
      {name:'Yamaha YZ250F 2025',price:'18 900 лв',dual:'9 665 €'}
    ],
    parts:[
      {name:'WP XPLOR вилка ревизия',price:'680 лв',dual:'348 €',hot:true},
      {name:'Контратежест YZ250F',price:'140 лв',dual:'72 €',note:'На склад'},
      {name:'CDI модул KTM EXC',price:'185 лв',dual:'95 €',note:'Поръчка 24ч'},
      {name:'Цилиндър кит Namura YZ',price:'280 лв',dual:'143 €',note:'На склад'}
    ],
    reviews:[
      {stars:5,text:'Бързи, коректни, имат всичко. Контратежестът дойде за ден.',author:'Марин Тодоров',authorId:'marin',tier:'lv-m'},
      {stars:5,text:'Fantic-ът идеален. Документи за час, мотор готов.',author:'Иван Петров',tier:'lv-p'},
      {stars:4,text:'Добри цени, понякога бавна доставка за специфични части.',author:'Георги Димитров',tier:'lv-p'}
    ],
    actions:[{label:'Свържи се с МотоХаус',cls:'btn-o',action:'message'},{label:'Виж маршрут до тях',cls:'btn-s',action:'map'}]
  });
  // pesho — механик окачване
  saveBizProfile('pesho',{
    desc:'Окачване специалист · WP, Showa, KYB',location:'Пловдив',locationAction:'map',
    hours:'Понеделник — Петък: 8:30 — 17:30',
    badges:[{text:'✓ Окачване',cls:'b-ver'},{text:'🏆 Величко',cls:'b-leg'},{text:'🟡 СТАРА ШКОЛА',cls:'lv-v'}],
    stats:[{n:'456',l:'Сервиза'},{n:'5.0',l:'Рейтинг'},{n:'112',l:'Ревюта'},{n:'~1ч',l:'Отговор'}],
    specs:['Окачване','WP','Showa','KYB','Ендуро','Мотокрос'],
    about:'Ревизия и настройка окачване — WP XPLOR, Showa, KYB. Ендуро и мотокрос. Препраща към МотоДок за долна част на двигателя.',
    tabs:[{id:'about',label:'За нас',def:true},{id:'offers',label:'🏷️ Оферти'}],
    verifiedAnswers:[
      {text:'Вибрация на 6000 — контратежест коляновия вал, не окачване.',meta:'👍 127',link:'forum'},
      {text:'WP XPLOR за 90+ кг — по-твърди пружини задължително.',meta:'👍 45'}
    ],
    pricing:[
      {service:'Вилка ревизия (WP XPLOR 48)',price:'320 лв',dual:'164 €'},
      {service:'Заден амортисьор ревизия',price:'220 лв',dual:'112 €'},
      {service:'Пълен комплект (вилка + заден)',price:'480 лв',dual:'245 €'}
    ],
    referrals:[{text:'23 клиента препратени към МотоДок (долна част двигателя)'}],
    actions:[{label:'Запиши час',cls:'btn-o',action:'message'},{label:'Питай майстора',cls:'btn-s',action:'message'}]
  });
  // manolov — треньор легенда
  saveBizProfile('manolov',{
    desc:'Легенда на мотокроса · Треньор',location:'Манолово · Тренировъчна писта',locationAction:'map',
    badges:[{text:'👑 Легенда',cls:'b-leg'},{text:'👑 ЛЕГЕНДА',cls:'lv-l'}],
    stats:[{n:'300+',l:'Медала'},{n:'5.0',l:'Рейтинг'},{n:'156',l:'Препоръчват'},{n:'200+',l:'Тренирани'}],
    about:'Легенда на българския мотокрос. 300+ медала, десетилетия на пистата. Днес тренира нови поколения — от новобранци до експерти.',
    verifiedAnswers:[
      {text:'За новобранци — започнете с по-мек setup. Suspension tuning идва с опита.',meta:'преди 3д · 👍 89'},
      {text:'Michelin Enduro Medium е стандарт за БГ условия. Зимата — Mitas.',meta:'преди 1сед · 👍 67'},
      {text:'Не бързайте с моторите — научете се на стария преди да купите нов.',meta:'преди 2сед · 👍 134'}
    ],
    upcoming:[
      {date:'22 март',location:'Манолово',level:'Всички нива',time:'10:00',cta:true},
      {date:'5 април',location:'Манолово',note:'Преди BG-X'}
    ],
    mentorship:'Менторира 3 новобранци от Бургас, Пловдив, София',
    actions:[{label:'Запиши час при Величко',cls:'btn-o',action:'message'},{label:'Прати съобщение',cls:'btn-s',action:'message'}]
  });
  // kabakchiev — шампион треньор
  saveBizProfile('kabakchiev',{
    desc:'Световен Шампион Hard Enduro',location:'Габрово',locationAction:'map',
    badges:[{text:'🏆 Световен Шампион',cls:'b-champ'},{text:'👑 ЛЕГЕНДА',cls:'lv-l'}],
    stats:[{n:'🏆',l:'Световен'},{n:'5.0',l:'Рейтинг'},{n:'234',l:'Отговора'}],
    about:'Многократен световен шампион по Hard Enduro. Активен в общността — отговаря на въпроси за окачване, настройки, подготовка.',
    verifiedAnswers:[
      {text:'Sag 105-110mm. Без компромис.',meta:'👍 234'},
      {text:'TPI е бъдещето, но карбуратор за hard enduro — все още цар.',meta:'👍 178'}
    ],
    actions:[{label:'Прати съобщение',cls:'btn-o',action:'message'}]
  });
  // marin — ездач
  saveBizProfile('marin',{
    desc:'Ездач · Бургас',
    badges:[{text:'🟠 МЕРАКЛИЯ',cls:'lv-m'}],
    stats:[{n:'6',l:'Месеца'},{n:'12',l:'Поста'},{n:'3',l:'Маршрута'}],
    bikePass:{name:'KTM EXC 300 · 2019',rows:[
      {label:'Моточасове',value:'120ч'},
      {label:'Окачване ревизия',value:'Пешо Механика · ян 2026'},
      {label:'Контратежест',value:'Сменен · МотоХаус · фев 2026'},
      {label:'Гуми',value:'Michelin Enduro Medium'},
      {label:'Следващо',value:'Масло + филтър на 130ч'}
    ]},
    routes:[
      {emoji:'🏔️',name:'Рила Sunday',desc:'Самоков → Мальовица · 47 км',mapLink:true},
      {emoji:'🌲',name:'Странджа офроуд',desc:'Бургас → Малко Търново · 65 км'},
      {emoji:'🏁',name:'BG-X Карлово Кръг 2',desc:'Hobby клас · 15-ти'}
    ],
    mentor:{id:'manolov',name:'Треньор Манолов',quote:'Научи ме да не се боя от калта.'},
    actions:[{label:'Прати съобщение',cls:'btn-o',action:'message'},{label:'Виж обявите',cls:'btn-s',action:'maze'}]
  });
  // gosho — механик електроника
  saveBizProfile('gosho',{
    desc:'Електроника · EFI, CDI, TPI, окабеляване',location:'Варна',locationAction:'map',
    badges:[{text:'✓ Верифициран',cls:'b-ver'},{text:'🟡 СТАРА ШКОЛА',cls:'lv-v'}],
    stats:[{n:'4.8',l:'Рейтинг'},{n:'~30м',l:'Отговор'}],
    specs:['EFI','CDI','TPI','Окабеляване','KTM TPI','Yamaha FI'],
    about:'Диагностика и ремонт електроника — EFI системи, CDI модули, TPI, окабеляване.',
    tabs:[{id:'about',label:'За нас',def:true},{id:'offers',label:'🏷️ Оферти'}],
    pricing:[
      {service:'Диагностика',price:'50 лв',dual:'26 €'},
      {service:'CDI ремонт',price:'80-150 лв',dual:'41-77 €'},
      {service:'EFI/TPI пълна диагностика',price:'120 лв',dual:'61 €'}
    ],
    actions:[{label:'Питай майстора',cls:'btn-o',action:'message'}]
  });
  // edimoto — употребявани части
  saveBizProfile('edimoto',{
    desc:'Употребявани части · Всички марки',location:'София · Доставка из цялата страна',
    badges:[{text:'✓ Верифициран',cls:'b-ver'}],
    stats:[{n:'230+',l:'Части'},{n:'4.7',l:'Рейтинг'}],
    about:'Голям каталог употребявани части — окачване, двигател, електроника, рама, пластмаси. Всички марки.',
    actions:[{label:'Намери частта',cls:'btn-o',action:'message'},{label:'Виж в Мазето',cls:'btn-s',action:'maze'}]
  });
  // edimoto_shop — дилър
  saveBizProfile('edimoto_shop',{
    desc:'Официален дилър KTM Group & Kawasaki',location:'София',locationAction:'map',
    hours:'Понеделник — Събота: 9:00 — 18:00',
    badges:[{text:'✓ Верифициран',cls:'b-ver'},{text:'🏍️ KTM / Husqvarna / GasGas',cls:'b-champ'},{text:'🏍️ Kawasaki',cls:'b-kawa'}],
    stats:[{n:'4.8',l:'Рейтинг'},{n:'56',l:'Ревюта'},{n:'~1ч',l:'Отговор'}],
    about:'Оригинални части за KTM Group и Kawasaki. Сервиз на място — гаранционен и извънгаранционен.',
    tabs:[{id:'about',label:'За нас',def:true},{id:'motos',label:'Мотори'},{id:'offers',label:'🏷️ Оферти'}],
    brands:[
      {name:'KTM',desc:'EXC, SX, SX-F серии. Ендуро и мотокрос.'},
      {name:'Husqvarna',desc:'FE, TE, FC серии.'},
      {name:'GasGas',desc:'EC, MC серии.'},
      {name:'Kawasaki',desc:'KX, KLX серии.'}
    ],
    motos:[
      {name:'KTM 350 EXC-F 2025',price:'22 400 лв',dual:'11 453 €'},
      {name:'KTM 300 EXC TPI 2025',price:'21 800 лв',dual:'11 146 €'},
      {name:'Husqvarna FE 350 2025',price:'22 900 лв',dual:'11 709 €'},
      {name:'Kawasaki KX250 2025',price:'17 600 лв',dual:'9 001 €'}
    ],
    actions:[{label:'Свържи се с EdiMoto',cls:'btn-o',action:'message'},{label:'Виж маршрут до тях',cls:'btn-s',action:'map'}]
  });
  // elilison — екипировка
  saveBizProfile('elilison',{
    desc:'Аксесоари & Екипировка · Всички марки',location:'София',locationAction:'map',
    hours:'Понеделник — Събота: 10:00 — 19:00',delivery:'Доставка из цяла България · Еконт / Спиди',
    badges:[{text:'✓ Верифициран',cls:'b-ver'},{text:'🧤 Екипировка',cls:'b-gear'}],
    stats:[{n:'4.9',l:'Рейтинг'},{n:'120+',l:'Продукта'},{n:'73',l:'Ревюта'}],
    tabs:[{id:'about',label:'За нас',def:true},{id:'offers',label:'🏷️ Оферти'}],
    equipment:[
      {category:'Ботуши',brands:'Alpinestars Tech 5/7/10, Sidi, Gaerne',fromPrice:'380 лв',dual:'194 €'},
      {category:'Каски',brands:'Airoh, Bell, Shoei',fromPrice:'290 лв',dual:'148 €'},
      {category:'Ръкавици',brands:'Fox, Alpinestars, 100%',fromPrice:'45 лв',dual:'23 €'},
      {category:'Протектори',brands:'Leatt, Fox, Alpinestars',fromPrice:'120 лв',dual:'61 €'}
    ],
    accessories:[
      {category:'Ръчки',brands:'Renthal, ProTaper, Neken',fromPrice:'85 лв',dual:'43 €'},
      {category:'Предпазители',brands:'Acerbis, Polisport',fromPrice:'60 лв',dual:'31 €'},
      {category:'Графики',brands:'Factory Effex, One Industries',fromPrice:'140 лв',dual:'72 €'}
    ],
    topOffers:[
      {name:'Alpinestars Tech 7 Enduro',price:'890 лв',dual:'455 €'},
      {name:'Airoh Aviator 3 каска',price:'780 лв',dual:'399 €'}
    ],
    actions:[{label:'Свържи се',cls:'btn-o',action:'message'},{label:'Виж маршрут до тях',cls:'btn-s',action:'map'}]
  });
}

function toggleAuthModal(){
  var bg=document.getElementById('authModalBg');
  if(bg.classList.contains('on')){closeAuthModal();return}
  document.getElementById('authContent').innerHTML=renderLoginView();
  bg.classList.add('on');document.body.style.overflow='hidden';
}
function closeAuthModal(){document.getElementById('authModalBg').classList.remove('on');document.body.style.overflow=''}

function renderLoginView(){
  var h='<div style="padding:20px 24px">';
  h+='<div style="text-align:center;font:700 22px \'Bebas Neue\',sans-serif;letter-spacing:3px;color:var(--orange);margin-bottom:4px">ВЛЕЗ В РЕПУБЛИКАТА</div>';
  h+='<div style="text-align:center;font:400 12px \'Exo 2\',sans-serif;color:var(--text2);margin-bottom:16px">Избери демо акаунт или създай нов</div>';
  h+='<div class="demo-accounts">';
  var order=['marin','ivo','pesho','gosho','motohaus','edimoto_shop','edimoto','elilison','manolov','kabakchiev'];
  order.forEach(function(id){
    var u=DEMO_USERS[id];if(!u)return;
    var r=ROLE_META[u.role]||{};
    h+='<div class="demo-btn" onclick="loginAs(\''+id+'\');closeAuthModal();showToast(\'Здравей, '+escHtml(u.name)+'!\',\'success\')">';
    h+='<span class="demo-btn-emoji">'+u.emoji+'</span>';
    h+='<span>'+escHtml(u.name)+'<br><span class="demo-btn-role">'+escHtml(r.label||u.role)+'</span></span>';
    h+='</div>';
  });
  h+='</div>';
  h+='<div class="auth-divider">или</div>';
  h+='<div style="text-align:center"><span class="auth-switch"><span onclick="showRegisterView()">Създай нов акаунт →</span></span></div>';
  h+='</div>';
  return h;
}

var _regRole='rider';
function showRegisterView(){document.getElementById('authContent').innerHTML=renderRegisterView()}
function renderRegisterView(){
  var h='<div style="padding:20px 24px">';
  h+='<div style="text-align:center;font:700 22px \'Bebas Neue\',sans-serif;letter-spacing:3px;color:var(--orange);margin-bottom:12px">ПРИСЪЕДИНИ СЕ</div>';
  // Role selector
  h+='<div class="auth-label">Кой си ти?</div>';
  h+='<div class="auth-roles">';
  ['rider','business','mechanic','trainer'].forEach(function(r){
    var m=ROLE_META[r];
    var sel=r===_regRole?' selected':'';
    h+='<div class="auth-role'+sel+'" onclick="selectRegRole(this,\''+r+'\')">';
    h+='<div class="auth-role-emoji">'+m.emoji+'</div>';
    h+='<div class="auth-role-name">'+m.label+'</div>';
    h+='<div class="auth-role-desc">'+m.desc+'</div>';
    h+='</div>';
  });
  h+='</div>';
  // Common fields
  h+='<div class="auth-field"><label class="auth-label">Име / Псевдоним</label><input class="auth-input" id="regName" placeholder="Марин Тодоров" maxlength="50"></div>';
  h+='<div class="auth-field"><label class="auth-label">Град</label><input class="auth-input" id="regCity" placeholder="София, Пловдив..." maxlength="30"></div>';
  // Role-specific fields
  h+='<div id="regRoleFields">'+renderRoleFields(_regRole)+'</div>';
  h+='<button class="auth-submit" onclick="submitRegistration()">СЪЗДАЙ ПРОФИЛ</button>';
  h+='<div class="auth-switch" style="margin-top:12px"><span onclick="document.getElementById(\'authContent\').innerHTML=renderLoginView()">← Обратно към вход</span></div>';
  h+='</div>';
  return h;
}
function selectRegRole(el,role){
  _regRole=role;
  document.querySelectorAll('.auth-role').forEach(function(r){r.classList.remove('selected')});
  el.classList.add('selected');
  var rf=document.getElementById('regRoleFields');if(rf)rf.innerHTML=renderRoleFields(role);
}
function renderRoleFields(role){
  if(role==='rider'){
    var archKey=localStorage.getItem('orArchetype');
    return archKey?'<div style="font:400 11px \'Exo 2\',sans-serif;color:var(--text2);margin-bottom:8px">Архетип: '+(ARCHETYPES[archKey]?ARCHETYPES[archKey].emoji+' '+ARCHETYPES[archKey].name:'—')+'</div>':'';
  }
  if(role==='business')return '<div class="auth-field"><label class="auth-label">Тип бизнес</label><input class="auth-input" id="regShopType" placeholder="Магазин, Сервиз, Дилър..."></div><div class="auth-field"><label class="auth-label">Работно време</label><input class="auth-input" id="regWorkHours" placeholder="Пон-Съб 9-18"></div>';
  if(role==='mechanic')return '<div class="auth-field"><label class="auth-label">Специалност</label><input class="auth-input" id="regSpecialty" placeholder="окачване, двигател, електрика..."></div>';
  if(role==='trainer')return '<div class="auth-field"><label class="auth-label">Опит (години)</label><input class="auth-input" id="regExperience" placeholder="5+, 10+..."></div><div class="auth-field"><label class="auth-label">Нива</label><input class="auth-input" id="regLevels" placeholder="начинаещ, напреднал, про..."></div>';
  return '';
}
function submitRegistration(){
  if(!validateForm([
    {id:'regName',rules:[{type:'required',msg:'Името е задължително'},{type:'minlength',value:2,msg:'Минимум 2 символа'}]},
    {id:'regCity',rules:[{type:'required',msg:'Градът е задължителен'}]}
  ]))return;
  var name=(document.getElementById('regName').value||'').trim();
  var city=(document.getElementById('regCity').value||'').trim();
  var id=name.toLowerCase().replace(/[^a-zа-я0-9]/g,'_').substring(0,20)+'_'+Date.now()%10000;
  var users=getUsers();
  if(users[id]){id+='_2'}
  var user={id:id,name:name,emoji:ROLE_META[_regRole].emoji,role:_regRole,city:city,bio:'',joined:new Date().toISOString().substring(0,7)};
  // Role-specific
  if(_regRole==='rider'){user.archetype=localStorage.getItem('orArchetype')||'wolf'}
  if(_regRole==='business'){user.shopType=(document.getElementById('regShopType')||{}).value||'';user.workHours=(document.getElementById('regWorkHours')||{}).value||''}
  if(_regRole==='mechanic'){user.specialty=(document.getElementById('regSpecialty')||{}).value||''}
  if(_regRole==='trainer'){user.experience=(document.getElementById('regExperience')||{}).value||'';user.levels=(document.getElementById('regLevels')||{}).value||''}
  users[id]=user;saveUsers(users);
  // Migrate global data if rider
  if(_regRole==='rider')migrateGlobalData(id);
  // Add to businessData if mechanic/business
  if(_regRole==='mechanic'||_regRole==='business'){
    businessData[id]={name:user.name,icon:user.emoji,type:_regRole==='mechanic'?'mechanic':'shop',models:[],tags:user.specialty?user.specialty.split(','):[],offers:[]};
  }
  closeAuthModal();loginAs(id);
  showToast('🏁 Добре дошъл в Републиката, '+escHtml(name)+'!','success');
}

function refreshAuthUI(){
  var area=document.getElementById('authArea');if(!area)return;
  var user=getCurrentUser();
  if(!user){area.innerHTML='<button class="tbtn" onclick="toggleAuthModal()">🔐 Вход</button>';return}
  area.innerHTML='<span class="tbtn on" onclick="openProfile(\'me\')" title="Моят профил">'+user.emoji+' '+escHtml(user.name)+'</span><button class="tbtn" onclick="logout()" title="Изход">✕</button>';
}

function renderRoleBadge(role){
  var m=ROLE_META[role];if(!m)return '';
  return '<span class="role-badge role-'+role+'">'+m.emoji+' '+m.label+'</span>';
}

function migrateGlobalData(userId){
  var gk='orGarage_'+userId;
  if(!localStorage.getItem(gk)){var g=localStorage.getItem('orGarage');if(g)localStorage.setItem(gk,g)}
  var sk='orServiceLog_'+userId;
  if(!localStorage.getItem(sk)){var s=localStorage.getItem('orServiceLog');if(s)localStorage.setItem(sk,s)}
  var mk='orMods_'+userId;
  if(!localStorage.getItem(mk)){var m=localStorage.getItem('orMods');if(m)localStorage.setItem(mk,m)}
}

// ===== DYNAMIC PROFILE — SUB-FUNCTIONS =====

function renderProfHeader(user,bp,role){
  var ava=user.emoji||'🏍️';
  var h='<div class="prof-head">';
  h+='<div class="prof-top"><div class="prof-ava">'+ava+'</div><div><div class="prof-nm">'+escHtml(user.name)+'</div>';
  h+='<div class="prof-sp">'+escHtml(bp&&bp.desc?bp.desc:(role.label+' · 📍 '+escHtml(user.city||'—')))+'</div></div></div>';
  // Badges
  h+='<div class="prof-badges">';
  if(bp&&bp.badges){bp.badges.forEach(function(b){h+='<span class="badge '+escHtml(b.cls||'')+'">'+b.text+'</span>'})}
  h+=renderRoleBadge(user.role);
  if(user.role==='rider'){var tk=calcTierForUser(user.id);if(tk)h+=renderTierBadge(tk)}
  h+='</div>';
  // Stats
  h+='<div class="prof-stats">';
  if(bp&&bp.stats){bp.stats.forEach(function(s){h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(s.n)+'</div><div class="prof-stat-l">'+escHtml(s.l)+'</div></div>'})}
  else{h+=renderFallbackStats(user)}
  h+='</div></div>';
  return h;
}

function renderFallbackStats(user){
  var h='';
  if(user.role==='rider'){
    try{
      var bikes=JSON.parse(localStorage.getItem('orGarage_'+user.id)||'[]');
      var log=JSON.parse(localStorage.getItem('orServiceLog_'+user.id)||'[]');
      var mods=JSON.parse(localStorage.getItem('orMods_'+user.id)||'[]');
      var tk=calcTierForUser(user.id);var score=0;
      try{var bi=bikes.length*5;var tm=0;bikes.forEach(function(b){tm+=(b.months||0)});bi+=Math.round(tm*0.4);bi+=log.length*2;bi+=mods.length*3;score=bi}catch(e){}
      h+='<div class="prof-stat"><div class="prof-stat-n">'+bikes.length+'</div><div class="prof-stat-l">Мотори</div></div>';
      h+='<div class="prof-stat"><div class="prof-stat-n">'+log.length+'</div><div class="prof-stat-l">Записи</div></div>';
      h+='<div class="prof-stat"><div class="prof-stat-n">'+mods.length+'</div><div class="prof-stat-l">Модове</div></div>';
      h+='<div class="prof-stat"><div class="prof-stat-n">'+score+'</div><div class="prof-stat-l">Точки</div></div>';
      if(user.ridingType){var _rtL={enduro:'Ендуро',motocross:'Мотокрос',trail:'Трейл',rally:'Рали',road:'Пътен'};h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(_rtL[user.ridingType]||user.ridingType)+'</div><div class="prof-stat-l">Тип каране</div></div>'}
      if(user.ridingExperience){h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.ridingExperience)+'</div><div class="prof-stat-l">Години опит</div></div>'}
    }catch(e){h+='<div class="prof-stat"><div class="prof-stat-n">0</div><div class="prof-stat-l">Точки</div></div>'}
  }
  if(user.role==='business'){
    h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.shopType||'Магазин')+'</div><div class="prof-stat-l">Тип</div></div>';
    h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.workHours||'—')+'</div><div class="prof-stat-l">Часове</div></div>';
  }
  if(user.role==='mechanic'){
    h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.specialty||'Общ')+'</div><div class="prof-stat-l">Специалност</div></div>';
  }
  if(user.role==='trainer'){
    h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.experience||'—')+'</div><div class="prof-stat-l">Опит</div></div>';
    h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.levels||'—')+'</div><div class="prof-stat-l">Нива</div></div>';
  }
  h+='<div class="prof-stat"><div class="prof-stat-n">'+escHtml(user.joined||'—')+'</div><div class="prof-stat-l">Член от</div></div>';
  return h;
}

function renderProfTabs(tabs){
  if(!tabs||!tabs.length)return '';
  var h='<div class="prof-tabs" id="shopTabs">';
  tabs.forEach(function(t){h+='<div class="ptab'+(t.def?' on':'')+'" data-pt="'+escHtml(t.id)+'">'+escHtml(t.label)+'</div>'});
  h+='</div>';
  return h;
}

function renderProfAboutTab(bp,userId){
  var h='';
  // Location & hours
  if(bp.location||bp.hours||bp.phone||bp.delivery){
    h+='<div class="prof-sec"><div class="prof-sec-t">📍 ЛОКАЦИЯ & РАБОТНО ВРЕМЕ</div>';
    if(bp.location){h+='<div class="prof-item">📍 '+escHtml(bp.location);if(bp.locationAction==='map')h+=' · <span class="link" onclick="closeModal();go(\'map\')">Виж на картата →</span>';h+='</div>'}
    if(bp.hours)h+='<div class="prof-item">⏰ '+escHtml(bp.hours)+'</div>';
    if(bp.phone)h+='<div class="prof-item">📞 '+escHtml(bp.phone)+'</div>';
    if(bp.delivery)h+='<div class="prof-item">📦 '+escHtml(bp.delivery)+'</div>';
    h+='</div>';
  }
  // Specs
  if(bp.specs&&bp.specs.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🔧 СПЕЦИАЛИЗАЦИЯ</div>';
    bp.specs.forEach(function(s){h+='<div class="prof-item">'+escHtml(s)+'</div>'});
    h+='</div>';
  }
  // About
  if(bp.about){
    var aboutIcon=bp.aboutIcon||'🏪';
    h+='<div class="prof-sec"><div class="prof-sec-t">'+aboutIcon+' ЗА НАС</div>';
    h+='<div class="prof-item">'+escHtml(bp.about)+'</div></div>';
  }
  // Brands
  if(bp.brands&&bp.brands.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🏍️ МАРКИ</div>';
    bp.brands.forEach(function(b){h+='<div class="prof-item"><strong>'+escHtml(b.name)+'</strong> — '+escHtml(b.desc)+'</div>'});
    h+='</div>';
  }
  // Verified answers
  if(bp.verifiedAnswers&&bp.verifiedAnswers.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">✓ ВЕРИФИЦИРАНИ ОТГОВОРИ</div>';
    bp.verifiedAnswers.forEach(function(v){
      h+='<div class="prof-item">"'+escHtml(v.text)+'"';
      if(v.meta)h+=' · <span class="meta">'+escHtml(v.meta)+'</span>';
      if(v.link)h+=' · <span class="link" onclick="closeModal();go(\'forum\')">Виж темата →</span>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Pricing
  if(bp.pricing&&bp.pricing.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">💰 ЦЕНОРАЗПИС</div>';
    bp.pricing.forEach(function(p){
      h+='<div class="prof-item">'+escHtml(p.service)+' · <span class="price-s">'+escHtml(p.price);
      if(p.dual)h+=' <span class="dual">/ '+escHtml(p.dual)+'</span>';
      h+='</span></div>';
    });
    h+='</div>';
  }
  // Referrals
  if(bp.referrals&&bp.referrals.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🔄 ПРЕПРАТКИ</div>';
    bp.referrals.forEach(function(r){h+='<div class="prof-item">'+escHtml(r.text)+'</div>'});
    h+='</div>';
  }
  // Equipment
  if(bp.equipment&&bp.equipment.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🧤 ЕКИПИРОВКА</div>';
    bp.equipment.forEach(function(e){
      h+='<div class="prof-item"><strong>'+escHtml(e.category)+':</strong> '+escHtml(e.brands)+' · от <span class="price-s">'+escHtml(e.fromPrice);
      if(e.dual)h+=' <span class="dual">/ '+escHtml(e.dual)+'</span>';
      h+='</span></div>';
    });
    h+='</div>';
  }
  // Accessories
  if(bp.accessories&&bp.accessories.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🔧 АКСЕСОАРИ</div>';
    bp.accessories.forEach(function(a){
      h+='<div class="prof-item"><strong>'+escHtml(a.category)+':</strong> '+escHtml(a.brands)+' · от <span class="price-s">'+escHtml(a.fromPrice);
      if(a.dual)h+=' <span class="dual">/ '+escHtml(a.dual)+'</span>';
      h+='</span></div>';
    });
    h+='</div>';
  }
  // Top offers
  if(bp.topOffers&&bp.topOffers.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">⭐ ТОП ОФЕРТИ</div>';
    bp.topOffers.forEach(function(o){
      h+='<div class="shop-offer" style="margin:0 0 6px">🔥 <strong>'+escHtml(o.name)+'</strong> · <span class="price-s">'+escHtml(o.price);
      if(o.dual)h+=' <span class="dual">/ '+escHtml(o.dual)+'</span>';
      h+='</span></div>';
    });
    h+='</div>';
  }
  // Upcoming (trainers)
  if(bp.upcoming&&bp.upcoming.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">📅 ПРЕДСТОЯЩИ ТРЕНИРОВКИ</div>';
    bp.upcoming.forEach(function(u){
      h+='<div class="prof-item"><strong>'+escHtml(u.date||'')+'</strong>';
      if(u.location)h+=' · '+escHtml(u.location);
      if(u.level)h+=' · '+escHtml(u.level);
      if(u.time)h+=' · '+escHtml(u.time);
      if(u.note)h+=' · '+escHtml(u.note);
      if(u.cta)h+=' · <button class="btn btn-g" style="font-size:10px;padding:3px 8px">'+(typeof u.cta==='string'?escHtml(u.cta):'Карай с нас')+'</button>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Mentorship
  if(bp.mentorship){
    h+='<div class="prof-sec"><div class="prof-sec-t">🏅 МЕНТОРСТВО</div>';
    h+='<div class="prof-item">'+escHtml(bp.mentorship)+'</div></div>';
  }
  // Bike pass (marin-style)
  if(bp.bikePass){
    h+='<div class="prof-sec"><div class="prof-sec-t">🏍️ МОЯТ МОТОР</div>';
    h+='<div class="moto-pass"><div class="moto-pass-h">'+escHtml(bp.bikePass.name)+'</div>';
    if(bp.bikePass.rows){bp.bikePass.rows.forEach(function(r){h+='<div class="moto-pass-row"><span>'+escHtml(r.label)+'</span><span>'+escHtml(r.value)+'</span></div>'})}
    h+='</div></div>';
  }
  // Routes (marin-style)
  if(bp.routes&&bp.routes.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🗺️ МОИТЕ МАРШРУТИ</div>';
    bp.routes.forEach(function(r){
      h+='<div class="prof-item">'+r.emoji+' '+escHtml(r.name)+' · '+escHtml(r.desc);
      if(r.mapLink)h+=' · <span class="link" onclick="closeModal();go(\'map\')">Виж →</span>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Mentor (marin-style)
  if(bp.mentor){
    h+='<div class="prof-sec"><div class="prof-sec-t">🏅 МОЯТ МЕНТОР</div>';
    h+='<div class="prof-item"><span class="link" onclick="closeModal();setTimeout(function(){openProfile(\''+escHtml(bp.mentor.id)+'\')},300)">'+escHtml(bp.mentor.name)+'</span>';
    var mentorTier=calcTierForUser(bp.mentor.id);
    if(mentorTier)h+=' '+renderTierBadge(mentorTier);
    h+=' · "'+escHtml(bp.mentor.quote)+'"</div></div>';
  }
  return h;
}

function renderProfMotosTab(bp){
  if(!bp.motos||!bp.motos.length)return '';
  var h='<div class="prof-sec"><div class="prof-sec-t">🏍️ НОВИ МОТОРИ</div>';
  bp.motos.forEach(function(m){
    var hasUrl=m.url&&m.url.indexOf('http')===0;
    var hasThumb=m.thumb&&m.thumb.indexOf('http')===0;
    h+='<div class="biz-catalog-item">';
    if(hasThumb)h+='<div class="biz-cat-thumb"><img src="'+escHtml(m.thumb)+'" alt="'+escHtml(m.name)+'" onerror="this.parentElement.innerHTML=\'🏍️\'"></div>';
    h+='<div class="biz-cat-info">';
    h+='<div class="biz-cat-name">'+(hasUrl?'<a href="'+escHtml(m.url)+'" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none">'+escHtml(m.name)+' ↗</a>':'<strong>'+escHtml(m.name)+'</strong>');
    if(m.note)h+=' · '+escHtml(m.note);
    h+='</div>';
    h+='<div class="biz-cat-price">'+escHtml(m.price);
    if(m.dual)h+=' <span class="dual">/ '+escHtml(m.dual)+'</span>';
    h+='</div></div></div>';
  });
  h+='</div>';
  return h;
}

function renderProfPartsTab(bp){
  if(!bp.parts||!bp.parts.length)return '';
  var h='<div class="prof-sec"><div class="prof-sec-t">📦 ПРОДУКТИ</div>';
  bp.parts.forEach(function(p){
    var hasUrl=p.url&&p.url.indexOf('http')===0;
    var hasThumb=p.thumb&&p.thumb.indexOf('http')===0;
    h+='<div class="biz-catalog-item'+(p.hot?' hot':'')+'">';
    if(hasThumb)h+='<div class="biz-cat-thumb"><img src="'+escHtml(p.thumb)+'" alt="'+escHtml(p.name)+'" onerror="this.parentElement.innerHTML=\'📦\'"></div>';
    h+='<div class="biz-cat-info">';
    if(p.hot)h+='<span class="biz-cat-hot">🔥</span>';
    h+='<div class="biz-cat-name">'+(hasUrl?'<a href="'+escHtml(p.url)+'" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none">'+escHtml(p.name)+' ↗</a>':escHtml(p.name))+'</div>';
    h+='<div class="biz-cat-price">'+escHtml(p.price);
    if(p.dual)h+=' <span class="dual">/ '+escHtml(p.dual)+'</span>';
    h+='</div>';
    if(p.note)h+='<div class="biz-cat-note">'+escHtml(p.note)+'</div>';
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}

function renderProfRevsTab(bp,userId){
  var reviews=bp.reviews||[];
  // Also load user-submitted reviews from localStorage
  var userRevs=getUserReviews(userId);
  var allRevs=reviews.concat(userRevs);
  var h='<div class="prof-sec"><div class="prof-sec-t">⭐ РЕВЮТА ОТ ОБЩНОСТТА</div>';
  if(!allRevs.length)h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2);padding:8px 0">Няма ревюта все още. Бъди първият!</div>';
  allRevs.forEach(function(r){
    var stars='';for(var i=0;i<(r.stars||5);i++)stars+='⭐';
    h+='<div class="prof-item"><strong>'+stars+'</strong> "'+escHtml(r.text)+'" — ';
    if(r.authorId)h+='<span class="link" onclick="closeModal();setTimeout(function(){openProfile(\''+escHtml(r.authorId)+'\')},300)">'+escHtml(r.author)+'</span>';
    else h+=escHtml(r.author);
    if(r.tier){var tk=r.tier.replace('lv-','');if(TIERS[tk])h+=' '+renderTierBadge(tk)}
    h+='</div>';
  });
  // Add review form for logged-in users
  var cu=getCurrentUser();
  if(cu&&cu.id!==userId){
    h+='<div class="rev-form" style="margin-top:10px;padding:10px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.02)">';
    h+='<div style="font:500 10px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin-bottom:6px">ОСТАВИ РЕВЮ</div>';
    h+='<div style="display:flex;gap:4px;margin-bottom:6px" id="revStarsBar">';
    for(var s=1;s<=5;s++){
      h+='<span class="rev-star" data-star="'+s+'" onclick="setRevStar('+s+')" style="cursor:pointer;font-size:20px;opacity:0.3">⭐</span>';
    }
    h+='</div>';
    h+='<textarea class="slog-input" id="revText" placeholder="Напиши ревю..." style="min-height:50px;resize:vertical"></textarea>';
    h+='<button class="btn btn-o" style="margin-top:6px" onclick="submitReview(\''+escHtml(userId)+'\')">Публикувай</button>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

var _revStars=5;
function setRevStar(n){
  _revStars=n;
  var bar=document.getElementById('revStarsBar');if(!bar)return;
  bar.querySelectorAll('.rev-star').forEach(function(s){
    s.style.opacity=parseInt(s.dataset.star)<=n?'1':'0.3';
  });
}
function getUserReviews(profileId){
  try{return JSON.parse(localStorage.getItem('orReviews_'+profileId))||[]}catch(e){return[]}
}
function saveUserReviews(profileId,revs){
  localStorage.setItem('orReviews_'+profileId,JSON.stringify(revs));
}
function submitReview(profileId){
  var cu=getCurrentUser();if(!cu){toggleAuthModal();return}
  var textEl=document.getElementById('revText');
  var text=(textEl?textEl.value:'').trim();
  if(!text){showToast('⚠️ Напиши нещо!');return}
  if(text.length<5){showToast('⚠️ Поне 5 символа');return}
  var revs=getUserReviews(profileId);
  // Check if user already reviewed
  var existing=revs.findIndex(function(r){return r.authorId===cu.id});
  var tierKey=calcTierForUser(cu.id);
  var rev={stars:_revStars,text:text.substring(0,300),author:cu.name,authorId:cu.id,tier:tierKey?'lv-'+tierKey:'',date:new Date().toISOString().slice(0,10)};
  if(existing>-1)revs[existing]=rev;
  else revs.push(rev);
  saveUserReviews(profileId,revs);
  _revStars=5;
  showToast('✓ Ревюто е публикувано!','success');
  // Re-open profile to refresh
  closeModal();
  setTimeout(function(){openProfile(profileId)},300);
}

function renderProfTabContents(bp,userId){
  if(!bp||!bp.tabs||!bp.tabs.length)return '';
  var h='';
  bp.tabs.forEach(function(t){
    h+='<div class="ptab-c'+(t.def?' on':'')+'" id="pt-'+escHtml(t.id)+'">';
    if(t.id==='about')h+=renderProfAboutTab(bp,userId);
    else if(t.id==='motos')h+=renderProfMotosTab(bp);
    else if(t.id==='parts')h+=renderProfPartsTab(bp);
    else if(t.id==='revs')h+=renderProfRevsTab(bp,userId);
    else if(t.id==='offers'){/* empty — renderProfileOffers fills this */}
    h+='</div>';
  });
  return h;
}

function renderProfSections(bp,userId){
  // For profiles without tabs — render all content in one flow
  return renderProfAboutTab(bp,userId);
}

function renderProfActions(bp,userId){
  var h='<div class="prof-actions">';
  if(bp&&bp.actions){
    bp.actions.forEach(function(a){
      var onclick='';
      if(a.action==='message')onclick='closeModal();setTimeout(function(){openSendMessage(\''+escHtml(userId)+'\')},300)';
      else if(a.action==='map')onclick='closeModal();go(\'map\')';
      else if(a.action==='maze')onclick='closeModal();go(\'maze\')';
      h+='<button class="btn '+escHtml(a.cls||'btn-s')+'"'+(onclick?' onclick="'+onclick+'"':'')+'>'+escHtml(a.label)+'</button>';
    });
  }else{
    // Default actions
    h+='<button class="btn btn-o" onclick="closeModal();setTimeout(function(){openSendMessage(\''+escHtml(userId)+'\')},300)">Прати съобщение</button>';
  }
  h+='<button class="btn btn-s" onclick="closeModal()">Затвори</button>';
  h+='</div>';
  return h;
}

// ===== PROFILE COMPLETENESS CHECK =====
function isProfileIncomplete(user,bp){
  if(!user)return false;
  // Core check: bio is the minimum requirement for all roles
  if(!user.bio||!user.bio.trim())return true;
  // Role-specific: check that key identity data exists
  if(user.role==='business'){
    if(!bp)return true;
    if(!bp.location&&!bp.hours)return true;
    return false;
  }
  if(user.role==='mechanic'){
    if(!bp)return true;
    if(!bp.specs||!bp.specs.length)return true;
    return false;
  }
  if(user.role==='trainer'){
    if(!user.experience||!user.levels)return true;
    return false;
  }
  // rider: bio is enough (ridingType/experience are optional enrichment)
  return false;
}

function renderProfileSetupBanner(role){
  var roleName=role.label||'Потребител';
  var h='<div class="prof-setup-banner">';
  h+='<div class="prof-setup-icon">📋</div>';
  h+='<div class="prof-setup-text">';
  h+='<strong>Профилът ти е непопълнен</strong>';
  h+='<span>Попълни данните си, за да те намерят другите ездачи. Отнема 2 минути.</span>';
  h+='</div></div>';
  return h;
}

// ===== DYNAMIC PROFILE =====
function renderDynamicProfile(userId){
  var users=getUsers();var user=users[userId];if(!user)return null;
  var bp=getBizProfile(userId);
  var role=ROLE_META[user.role]||{label:'Потребител',emoji:'👤'};
  var isMe=getCurrentUserId()===userId;

  // Header: avatar, name, badges, stats
  var h=renderProfHeader(user,bp,role);

  // Setup mode: empty profile → show edit form front and center
  if(isMe&&isProfileIncomplete(user,bp)){
    h+='<div class="prof-body">';
    h+=renderProfileSetupBanner(role);
    h+=renderProfileEditForm(user,bp,true);
    h+='</div>';
    h+=renderProfActions(bp,userId);
    return h;
  }

  // Body
  h+='<div class="prof-body">';

  if(bp&&bp.tabs&&bp.tabs.length){
    // Tabbed layout (business/mechanic/dealer profiles)
    h+=renderProfTabs(bp.tabs);
    h+=renderProfTabContents(bp,userId);
    // Add standalone reviews if no revs tab exists
    if(!bp.tabs.some(function(t){return t.id==='revs'})&&(user.role==='business'||user.role==='mechanic'||user.role==='trainer')){
      h+=renderProfRevsTab(bp,userId);
    }
  }else if(bp){
    // No tabs but has biz profile data — render sections inline
    h+=renderProfSections(bp,userId);
    // Add reviews for business roles without tabs
    if(user.role==='business'||user.role==='mechanic'||user.role==='trainer'){
      h+=renderProfRevsTab(bp,userId);
    }
  }else{
    // No biz profile — basic user profile
    if(user.bio)h+='<div class="prof-sec"><div class="prof-sec-t">📝 ЗА МЕН</div><div style="font:400 13px \'Exo 2\',sans-serif;color:var(--text2);line-height:1.5">'+renderMarkdown(user.bio)+'</div></div>';
    // Contact section
    var _ct='';
    if(user.phone)_ct+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2);margin:3px 0">📞 '+escHtml(user.phone)+'</div>';
    if(user.instagram)_ct+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2);margin:3px 0">📷 <a href="https://instagram.com/'+escHtml(user.instagram.replace('@',''))+'" style="color:var(--orange)" target="_blank">'+escHtml(user.instagram)+'</a></div>';
    if(user.facebook){var _fbUrl=user.facebook.indexOf('http')===0?user.facebook:'https://facebook.com/'+user.facebook;_ct+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2);margin:3px 0">📘 <a href="'+escHtml(_fbUrl)+'" style="color:var(--orange)" target="_blank">'+escHtml(user.facebook)+'</a></div>'}
    if(_ct)h+='<div class="prof-sec"><div class="prof-sec-t">🔗 КОНТАКТ</div>'+_ct+'</div>';
  }

  // Garage injection for rider profiles
  if(user.role==='rider'){
    var garageHtml=renderProfileGarageFor(userId);
    if(garageHtml)h+=garageHtml;
    var modsHtml=renderProfileModsFor(userId);
    if(modsHtml)h+=modsHtml;
  }

  // Business analytics (own profile only)
  if(isMe&&(user.role==='business'||user.role==='mechanic'||user.role==='trainer'))h+=renderBizAnalytics(userId);
  // Accumulated value (own profile)
  if(isMe)h+=renderAccumulatedValue(userId);

  // Edit section for own profile
  if(isMe){
    h+=renderProfileEditForm(user,bp,false);
  }
  h+='</div>';

  // Actions
  h+=renderProfActions(bp,userId);
  return h;
}

// ===== PROFILE EDIT HELPERS (business/mechanic/trainer) =====
var SHOP_TYPES=[{v:'shop',l:'Магазин & Сервиз'},{v:'dealer',l:'Официален дилър'},{v:'parts',l:'Части'},{v:'gear',l:'Екипировка'},{v:'service',l:'Сервиз'}];
var MECH_SPECS=['Окачване','WP','Showa','KYB','Двигател','Електрика','Горна част','Долна част','Спирачки','Гуми','Предавки','EFI','CDI','TPI','Рама','Пластмаси'];
// ===== PROFILE EDIT FORM HELPER =====
function renderProfileEditForm(user,bp,isSetup){
  var title=isSetup?'✏️ ПОПЪЛНИ ПРОФИЛА СИ':'✏️ РЕДАКТИРАЙ';
  var btnLabel=isSetup?'ЗАПАЗИ И ВИЖДАЙ ПРОФИЛА СИ':'Запази';
  var btnStyle=isSetup?'margin-top:12px;width:100%;padding:12px;font-size:14px':'margin-top:8px';
  var h='<div class="prof-sec"><div class="prof-sec-t">'+title+'</div>';
  // Основни
  h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin-bottom:6px">ОСНОВНИ</div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Име</label><input class="prof-edit-input" id="profEditName" value="'+escHtml(user.name)+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Био</label><textarea class="prof-edit-input prof-edit-textarea" id="profEditBio" maxlength="200" placeholder="Кажи нещо за себе си... (поддържа **bold** и *italic*)">'+escHtml(user.bio||'')+'</textarea></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Град</label><input class="prof-edit-input" id="profEditCity" value="'+escHtml(user.city||'')+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Телефон</label><input class="prof-edit-input" id="profEditPhone" placeholder="088 123 4567" value="'+escHtml(user.phone||'')+'"></div>';
  // Role-specific
  if(user.role==='rider'){
    h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">ЕЗДАЧ</div>';
    var _ridingTypes=[{v:'enduro',l:'Ендуро'},{v:'motocross',l:'Мотокрос'},{v:'trail',l:'Трейл'},{v:'rally',l:'Рали'},{v:'road',l:'Пътен'}];
    h+='<div class="prof-edit-field"><label class="auth-label">Тип каране</label><select class="prof-edit-input" id="profEditRidingType"><option value="">— Избери —</option>';
    _ridingTypes.forEach(function(rt){h+='<option value="'+rt.v+'"'+(user.ridingType===rt.v?' selected':'')+'>'+rt.l+'</option>'});
    h+='</select></div>';
    var _expOpts=[{v:'<1',l:'Под 1 година'},{v:'1-3',l:'1-3 години'},{v:'3-5',l:'3-5 години'},{v:'5-10',l:'5-10 години'},{v:'10+',l:'10+ години'}];
    h+='<div class="prof-edit-field"><label class="auth-label">Опит (години)</label><select class="prof-edit-input" id="profEditExperience"><option value="">— Избери —</option>';
    _expOpts.forEach(function(e){h+='<option value="'+e.v+'"'+(user.ridingExperience===e.v?' selected':'')+'>'+e.l+'</option>'});
    h+='</select></div>';
  }else if(user.role==='business'){
    h+=renderBizEditFields(user,bp);
  }else if(user.role==='mechanic'){
    h+=renderMechEditFields(user,bp);
  }else if(user.role==='trainer'){
    h+=renderTrainerEditFields(user,bp);
  }
  // Социални
  h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">СОЦИАЛНИ</div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Instagram</label><input class="prof-edit-input" id="profEditInsta" placeholder="@username" value="'+escHtml(user.instagram||'')+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Facebook</label><input class="prof-edit-input" id="profEditFb" placeholder="facebook.com/username" value="'+escHtml(user.facebook||'')+'"></div>';
  h+='<button class="btn btn-o" style="'+btnStyle+'" onclick="saveProfileEdits()">'+btnLabel+'</button>';
  h+='</div>';
  return h;
}

var TRAINER_LEVELS=[{v:'beginner',l:'Начинаещи'},{v:'intermediate',l:'Напреднали'},{v:'advanced',l:'Експерти'},{v:'pro',l:'Про'}];
var _profSelectedSpecs=[];
var _profPricingCount=0;

var _profProductCount=0;
var _profOfferCount=0;

function renderBizEditFields(user,bp){
  bp=bp||{};
  var h='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">БИЗНЕС</div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Тип бизнес</label><select class="prof-edit-input" id="profEditShopType"><option value="">— Избери —</option>';
  SHOP_TYPES.forEach(function(st){h+='<option value="'+st.v+'"'+(user.shopType===st.v?' selected':'')+'>'+st.l+'</option>'});
  h+='</select></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Уебсайт</label><input class="prof-edit-input" id="profEditWebsite" placeholder="https://myshop.bg" value="'+escHtml(bp.website||'')+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Адрес / Локация</label><input class="prof-edit-input" id="profEditLocation" placeholder="Нови хан, на главния път" value="'+escHtml(bp.location||'')+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Работно време</label><input class="prof-edit-input" id="profEditWorkHours" placeholder="Пон-Съб 9:00-18:00" value="'+escHtml(bp.hours||'')+'"></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Доставка</label><input class="prof-edit-input" id="profEditDelivery" placeholder="Еконт / Спиди / на място" value="'+escHtml(bp.delivery||'')+'"></div>';
  // Product catalog
  h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">ПРОДУКТИ / КАТАЛОГ</div>';
  h+='<div class="prof-edit-field"><div id="profProductContainer">';
  var products=bp.products||[];
  _profProductCount=0;
  if(products.length){
    products.forEach(function(p,i){h+=renderProductRow(i,p);_profProductCount=i+1});
  }else{h+=renderProductRow(0,{});_profProductCount=1}
  h+='</div><span style="display:inline-block;margin-top:4px;font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addProfProductRow()">+ Добави продукт</span></div>';
  // Promo offers
  h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">ПРОМО ОФЕРТИ</div>';
  h+='<div class="prof-edit-field"><div id="profOfferContainer">';
  var offers=bp.offers||[];
  _profOfferCount=0;
  if(offers.length){
    offers.forEach(function(o,i){h+=renderOfferRow(i,o);_profOfferCount=i+1});
  }else{h+=renderOfferRow(0,{});_profOfferCount=1}
  h+='</div><span style="display:inline-block;margin-top:4px;font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addProfOfferRow()">+ Добави оферта</span></div>';
  return h;
}

function renderProductRow(idx,p){
  p=p||{};
  return '<div class="biz-product-row" style="background:rgba(232,98,44,.03);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px;margin-bottom:4px"><input class="slog-input" style="flex:2" placeholder="Име на продукта" data-prod="name" value="'+escHtml(p.name||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Цена" data-prod="price" value="'+escHtml(p.price||'')+'">'
    +'<span class="mod-part-remove" onclick="this.closest(\'.biz-product-row\').remove()" style="cursor:pointer;color:var(--text2)">✕</span></div>'
    +'<div style="display:flex;gap:6px"><input class="slog-input" style="flex:1" placeholder="Линк към сайта (https://...)" data-prod="url" value="'+escHtml(p.url||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Снимка URL (thumbnail)" data-prod="thumb" value="'+escHtml(p.thumb||'')+'"></div>'
    +'<div style="display:flex;gap:6px;margin-top:4px"><input class="slog-input" style="flex:1" placeholder="Забележка (на склад, поръчка...)" data-prod="note" value="'+escHtml(p.note||'')+'">'
    +'<label style="display:flex;align-items:center;gap:3px;font:400 11px \'Exo 2\',sans-serif;color:var(--text2);white-space:nowrap"><input type="checkbox" data-prod="hot"'+(p.hot?' checked':'')+'>🔥 Горещо</label></div>'
    +'</div>';
}
function addProfProductRow(){
  var c=document.getElementById('profProductContainer');if(!c)return;
  var div=document.createElement('div');
  div.innerHTML=renderProductRow(_profProductCount++,{});
  var row=div.firstChild;
  c.appendChild(row);
}

function renderOfferRow(idx,o){
  o=o||{};
  return '<div class="biz-offer-row" style="background:rgba(90,138,60,.03);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px"><input class="slog-input" style="flex:2" placeholder="Заглавие на офертата" data-offer="title" value="'+escHtml(o.title||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Цена" data-offer="price" value="'+escHtml(o.price||'')+'">'
    +'<span class="mod-part-remove" onclick="this.closest(\'.biz-offer-row\').remove()" style="cursor:pointer;color:var(--text2)">✕</span></div>'
    +'<div style="display:flex;gap:6px;margin-top:4px"><input class="slog-input" style="flex:1" placeholder="Описание" data-offer="desc" value="'+escHtml(o.desc||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Линк (https://...)" data-offer="url" value="'+escHtml(o.url||'')+'"></div>'
    +'</div>';
}
function addProfOfferRow(){
  var c=document.getElementById('profOfferContainer');if(!c)return;
  var div=document.createElement('div');
  div.innerHTML=renderOfferRow(_profOfferCount++,{});
  var row=div.firstChild;
  c.appendChild(row);
}

function renderMechEditFields(user,bp){
  bp=bp||{};
  var existingSpecs=bp.specs||[];
  _profSelectedSpecs=existingSpecs.slice();
  var h='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">МАЙСТОР</div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Специализации</label><div class="ntf-tags" id="profSpecsBar">';
  MECH_SPECS.forEach(function(s){
    var isOn=existingSpecs.indexOf(s)>-1?' on':'';
    h+='<span class="ntf-tag'+isOn+'" onclick="toggleProfSpec(\''+escHtml(s)+'\',this)">'+escHtml(s)+'</span>';
  });
  h+='</div></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Ценоразпис</label><div id="profPricingContainer">';
  var existingPricing=bp.pricing||[];
  _profPricingCount=0;
  if(existingPricing.length){
    existingPricing.forEach(function(p,i){h+=renderPricingRow(i,p.service,p.price);_profPricingCount=i+1});
  }else{h+=renderPricingRow(0,'','');_profPricingCount=1}
  h+='</div><span style="display:inline-block;margin-top:4px;font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addProfPricingRow()">+ Добави услуга</span></div>';
  return h;
}
function renderPricingRow(idx,service,price){
  return '<div class="mod-part-input-row" style="grid-template-columns:1fr 100px auto;margin-bottom:4px"><input class="slog-input" placeholder="Услуга" data-pricing="service" value="'+escHtml(service||'')+'"><input class="slog-input" placeholder="Цена (лв)" data-pricing="price" value="'+escHtml(price||'')+'"><span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span></div>';
}
function toggleProfSpec(spec,el){
  var idx=_profSelectedSpecs.indexOf(spec);
  if(idx>-1){_profSelectedSpecs.splice(idx,1);el.classList.remove('on')}
  else if(_profSelectedSpecs.length<10){_profSelectedSpecs.push(spec);el.classList.add('on')}
  else{showToast('Максимум 10 специализации')}
}
function addProfPricingRow(){
  var c=document.getElementById('profPricingContainer');if(!c)return;
  var row=document.createElement('div');
  row.className='mod-part-input-row';
  row.style.cssText='grid-template-columns:1fr 100px auto;margin-bottom:4px';
  row.innerHTML='<input class="slog-input" placeholder="Услуга" data-pricing="service"><input class="slog-input" placeholder="Цена (лв)" data-pricing="price"><span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span>';
  c.appendChild(row);
}

function renderTrainerEditFields(user,bp){
  bp=bp||{};
  var h='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">ТРЕНЬОР</div>';
  var _trExpOpts=[{v:'1-3',l:'1-3 години'},{v:'3-5',l:'3-5 години'},{v:'5-10',l:'5-10 години'},{v:'10-20',l:'10-20 години'},{v:'20+',l:'20+ години'}];
  h+='<div class="prof-edit-field"><label class="auth-label">Опит</label><select class="prof-edit-input" id="profEditTrainerExp"><option value="">— Избери —</option>';
  _trExpOpts.forEach(function(e){h+='<option value="'+e.v+'"'+((user.experience||'')===e.v?' selected':'')+'>'+e.l+'</option>'});
  h+='</select></div>';
  var currentLevels=(user.levels||'').split(',');
  h+='<div class="prof-edit-field"><label class="auth-label">Нива (може повече от едно)</label><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">';
  TRAINER_LEVELS.forEach(function(lv){
    var checked=currentLevels.indexOf(lv.v)>-1?' checked':'';
    h+='<label style="display:flex;align-items:center;gap:4px;font:400 12px \'Exo 2\',sans-serif;color:var(--text2);cursor:pointer"><input type="checkbox" class="profTrainerLevel" value="'+lv.v+'"'+checked+'> '+lv.l+'</label>';
  });
  h+='</div></div>';
  var nextSession=(bp.upcoming&&bp.upcoming[0])||{};
  h+='<div class="prof-edit-field"><label class="auth-label">Следваща тренировка</label><div style="display:flex;gap:8px"><input class="prof-edit-input" id="profEditNextDate" type="date" value="'+escHtml(nextSession.dateISO||'')+'" style="flex:1"><input class="prof-edit-input" id="profEditNextLocation" placeholder="Локация" value="'+escHtml(nextSession.location||bp.location||'')+'" style="flex:1"></div></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Менторство</label><input class="prof-edit-input" id="profEditMentorship" placeholder="Менторира 3 новобранци от..." value="'+escHtml(bp.mentorship||'')+'"></div>';
  return h;
}

function saveProfileEdits(){
  var user=getCurrentUser();if(!user)return;
  var newName=(document.getElementById('profEditName').value||'').trim();
  if(!newName){showToast('Името не може да е празно');return}
  user.name=newName;
  user.bio=(document.getElementById('profEditBio').value||'').trim().substring(0,200);
  user.city=(document.getElementById('profEditCity').value||'').trim();
  // Extended fields
  var el;
  el=document.getElementById('profEditPhone');if(el)user.phone=(el.value||'').trim();
  el=document.getElementById('profEditRidingType');if(el)user.ridingType=el.value;
  el=document.getElementById('profEditExperience');if(el)user.ridingExperience=el.value;
  el=document.getElementById('profEditInsta');if(el)user.instagram=(el.value||'').trim();
  el=document.getElementById('profEditFb');if(el)user.facebook=(el.value||'').trim();
  // Role-specific saves to orBizProfile
  if(user.role==='business'){
    var bp=getBizProfile(user.id)||{};
    el=document.getElementById('profEditShopType');if(el)user.shopType=el.value;
    el=document.getElementById('profEditWebsite');if(el)bp.website=(el.value||'').trim();
    el=document.getElementById('profEditLocation');if(el)bp.location=(el.value||'').trim();
    el=document.getElementById('profEditWorkHours');if(el)bp.hours=(el.value||'').trim();
    el=document.getElementById('profEditDelivery');if(el)bp.delivery=(el.value||'').trim();
    // Save products
    var prodRows=document.querySelectorAll('#profProductContainer .biz-product-row');
    var products=[];
    prodRows.forEach(function(row){
      var name=(row.querySelector('[data-prod="name"]').value||'').trim();
      if(!name)return;
      var hotCb=row.querySelector('[data-prod="hot"]');
      products.push({
        name:name,
        price:(row.querySelector('[data-prod="price"]').value||'').trim(),
        url:(row.querySelector('[data-prod="url"]').value||'').trim(),
        thumb:(row.querySelector('[data-prod="thumb"]').value||'').trim(),
        note:(row.querySelector('[data-prod="note"]').value||'').trim(),
        hot:hotCb?hotCb.checked:false
      });
    });
    bp.products=products;
    // Also populate parts array for profile display compatibility
    bp.parts=products.map(function(p){return{name:p.name,price:p.price,url:p.url,thumb:p.thumb,note:p.note,hot:p.hot}});
    // Save offers
    var offerRows=document.querySelectorAll('#profOfferContainer .biz-offer-row');
    var offers=[];
    offerRows.forEach(function(row){
      var title=(row.querySelector('[data-offer="title"]').value||'').trim();
      if(!title)return;
      offers.push({
        title:title,
        price:(row.querySelector('[data-offer="price"]').value||'').trim(),
        desc:(row.querySelector('[data-offer="desc"]').value||'').trim(),
        url:(row.querySelector('[data-offer="url"]').value||'').trim()
      });
    });
    bp.offers=offers;
    // Ensure tabs exist for profile display
    if(!bp.tabs||!bp.tabs.length){
      bp.tabs=[{id:'about',label:'За нас',def:true}];
      if(products.length)bp.tabs.push({id:'parts',label:'Продукти'});
      if(offers.length)bp.tabs.push({id:'offers',label:'🏷️ Оферти'});
    }
    if(user.bio)bp.desc=user.bio;
    saveBizProfile(user.id,bp);
  }
  if(user.role==='mechanic'){
    var bp=getBizProfile(user.id)||{};
    bp.specs=_profSelectedSpecs.slice();
    user.specialty=_profSelectedSpecs.join(',');
    var rows=document.querySelectorAll('#profPricingContainer .mod-part-input-row');
    var pricing=[];
    rows.forEach(function(row){
      var svc=(row.querySelector('[data-pricing="service"]').value||'').trim();
      var pr=(row.querySelector('[data-pricing="price"]').value||'').trim();
      if(svc)pricing.push({service:svc,price:pr});
    });
    bp.pricing=pricing;
    if(user.bio)bp.desc=user.bio;
    saveBizProfile(user.id,bp);
  }
  if(user.role==='trainer'){
    var bp=getBizProfile(user.id)||{};
    el=document.getElementById('profEditTrainerExp');if(el)user.experience=el.value;
    var levelBoxes=document.querySelectorAll('.profTrainerLevel');
    var levels=[];
    levelBoxes.forEach(function(cb){if(cb.checked)levels.push(cb.value)});
    user.levels=levels.join(',');
    var nd=document.getElementById('profEditNextDate');
    var nl=document.getElementById('profEditNextLocation');
    if(nd&&nd.value){
      var upcoming=bp.upcoming||[];
      var entry={dateISO:nd.value,location:(nl?nl.value:'').trim()};
      try{var d=new Date(nd.value);var _months=['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];entry.date=d.getDate()+' '+_months[d.getMonth()]}catch(e){entry.date=nd.value}
      if(upcoming.length)upcoming[0]=entry;else upcoming.push(entry);
      bp.upcoming=upcoming;
    }
    el=document.getElementById('profEditMentorship');if(el)bp.mentorship=(el.value||'').trim();
    if(user.bio)bp.desc=user.bio;
    saveBizProfile(user.id,bp);
  }
  var users=getUsers();users[user.id]=user;saveUsers(users);
  refreshAuthUI();showGreeting();
  showToast('✓ Профилът е обновен!','success');
  // Re-render profile in modal to show updated data (works for both setup and normal edit)
  var mc=document.getElementById('modalContent');
  if(mc){
    mc.innerHTML=renderDynamicProfile(user.id);
    initShopTabs();
    renderProfileOffers(user.id);
    // Scroll to top of modal
    var modal=mc.closest('.modal');if(modal)modal.scrollTop=0;
  }
}

// ===== FORUM PERSISTENCE =====
function getForumPosts(){try{return JSON.parse(localStorage.getItem('orForumPosts'))||[]}catch(e){return[]}}
function saveForumPosts(p){localStorage.setItem('orForumPosts',JSON.stringify(p))}
function getForumDraft(zone){try{return JSON.parse(localStorage.getItem('orForumDraft_'+zone))||null}catch(e){return null}}
function saveForumDraft(zone,data){localStorage.setItem('orForumDraft_'+zone,JSON.stringify(data))}
function clearForumDraft(zone){localStorage.removeItem('orForumDraft_'+zone)}

var FORUM_TAGS=['ktm','husqvarna','yamaha','honda','gas-gas','sherco','beta','fantic','окачване','двигател','електрика','гуми','спирачки','масла','ауспух','екипировка','тренировка','маршрут'];
var _ntSelectedType='q';
var _ntSelectedTags=[];
var _ntShowPreview=false;

function showNewTopicForm(zone){
  var area=document.getElementById('newTopicFormArea');if(!area)return;
  if(area.querySelector('.new-topic-form')){area.innerHTML='';return}
  _ntSelectedType='q';_ntSelectedTags=[];_ntShowPreview=false;
  var zn=zoneNames[zone]||zone;
  var typeButtons='<div class="ntf-types">';
  [{k:'q',l:'❓ Въпрос',d:'Питаш нещо'},{k:'e',l:'📝 Опит',d:'Споделяш опит'},{k:'s',l:'✅ Решено',d:'Публикуваш решение'},{k:'h',l:'🔥 Горещо',d:'Важна/спешна тема'}].forEach(function(t){
    typeButtons+='<div class="ntf-type-btn'+(t.k==='q'?' on':'')+'" data-type="'+t.k+'" onclick="selectTopicType(\''+t.k+'\',this)" title="'+t.d+'">'+t.l+'</div>';
  });
  typeButtons+='</div>';

  var tagPills='<div class="ntf-tags" id="ntfTagsBar">';
  var zoneTags={problem:['ktm','husqvarna','yamaha','honda','двигател','електрика','окачване'],tech:['окачване','двигател','електрика','гуми','спирачки','масла','ауспух'],skill:['тренировка','екипировка'],plan:['маршрут'],newbie:['екипировка','тренировка'],story:['маршрут'],chat:[]};
  var relevantTags=(zoneTags[zone]||[]).concat(FORUM_TAGS.filter(function(t){return(zoneTags[zone]||[]).indexOf(t)<0})).slice(0,12);
  relevantTags.forEach(function(t){
    tagPills+='<span class="ntf-tag" data-tag="'+t+'" onclick="toggleTopicTag(\''+t+'\',this)">'+t+'</span>';
  });
  tagPills+='</div>';

  var toolbar='<div class="ntf-toolbar"><button class="ntf-tool-btn" onclick="ntfInsert(\'bold\')" title="Bold (Ctrl+B)"><b>B</b></button><button class="ntf-tool-btn" onclick="ntfInsert(\'italic\')" title="Italic (Ctrl+I)"><i>I</i></button><button class="ntf-tool-btn" onclick="ntfInsert(\'link\')" title="Линк">🔗</button><button class="ntf-tool-btn" onclick="ntfInsert(\'image\')" title="Снимка (URL)">📷</button><button class="ntf-tool-btn" onclick="ntfInsert(\'code\')" title="Код">&lt;/&gt;</button></div>';

  area.innerHTML='<div class="new-topic-form">'+
    '<div class="ntf-header"><span>✏️ НОВА ТЕМА В '+escHtml(zn).toUpperCase()+'</span><span style="font:400 11px \'Exo 2\';color:var(--text2);letter-spacing:0">зона: '+escHtml(zn)+'</span></div>'+
    typeButtons+
    '<input id="ntTitle" placeholder="Заглавие — кратко и ясно (макс. 120 символа)" maxlength="120">'+
    '<div style="font:500 11px \'Exo 2\';color:var(--text2);margin:-4px 0 6px">🏷️ Тагове (опционално):</div>'+
    tagPills+
    toolbar+
    '<textarea id="ntBody" placeholder="Опиши проблема, въпроса или опита си...\n\nМожеш да ползваш:\n**bold** за удебелен текст\n*italic* за наклонен\n[линк](https://url) за връзка\n`код` за inline код"></textarea>'+
    '<div id="ntPreviewArea"></div>'+
    '<div class="ntf-actions">'+
      '<button class="btn btn-o" onclick="submitNewTopic(\''+zone+'\')">📤 Публикувай</button>'+
      '<button class="btn btn-s" onclick="toggleTopicPreview(\''+zone+'\')">👁️ Преглед</button>'+
      '<button class="btn btn-s" onclick="document.getElementById(\'newTopicFormArea\').innerHTML=\'\'">✕ Откажи</button>'+
    '</div>'+
  '</div>';
  // Load draft if exists
  var draft=getForumDraft(zone);
  if(draft){
    var titleEl=document.getElementById('ntTitle');
    var bodyEl=document.getElementById('ntBody');
    if(titleEl&&draft.title)titleEl.value=draft.title;
    if(bodyEl&&draft.body)bodyEl.value=draft.body;
    if(draft.type){_ntSelectedType=draft.type;selectTopicType(draft.type,document.querySelector('.ntf-type-btn[data-type="'+draft.type+'"]'))}
    if(draft.tags&&draft.tags.length){
      _ntSelectedTags=draft.tags.slice();
      draft.tags.forEach(function(t){var el=document.querySelector('.ntf-tag[data-tag="'+t+'"]');if(el)el.classList.add('on')});
    }
    showToast('📝 Чернова заредена','');
  }
  // Auto-save draft on input
  var _draftTimer=null;
  function saveDraftDebounced(){
    clearTimeout(_draftTimer);
    _draftTimer=setTimeout(function(){
      var t=(document.getElementById('ntTitle').value||'').trim();
      var b=(document.getElementById('ntBody').value||'').trim();
      if(t||b)saveForumDraft(zone,{title:t,body:b,type:_ntSelectedType,tags:_ntSelectedTags.slice()});
    },1000);
  }
  var ntTitle=document.getElementById('ntTitle');
  var ntBody=document.getElementById('ntBody');
  if(ntTitle)ntTitle.addEventListener('input',saveDraftDebounced);
  if(ntBody)ntBody.addEventListener('input',saveDraftDebounced);
  ntTitle.focus();
}

function selectTopicType(type,btn){
  _ntSelectedType=type;
  document.querySelectorAll('.ntf-type-btn').forEach(function(b){b.classList.remove('on')});
  btn.classList.add('on');
}

function toggleTopicTag(tag,el){
  var idx=_ntSelectedTags.indexOf(tag);
  if(idx>-1){_ntSelectedTags.splice(idx,1);el.classList.remove('on')}
  else if(_ntSelectedTags.length<5){_ntSelectedTags.push(tag);el.classList.add('on')}
  else{showToast('⚠️ Максимум 5 тага','');}
}

function ntfInsert(type){
  var ta=document.getElementById('ntBody');if(!ta)return;
  var start=ta.selectionStart,end=ta.selectionEnd,sel=ta.value.substring(start,end);
  var insert='';
  if(type==='bold')insert='**'+(sel||'текст')+'**';
  else if(type==='italic')insert='*'+(sel||'текст')+'*';
  else if(type==='link')insert='['+(sel||'текст')+'](https://)';
  else if(type==='image')insert='![снимка](https://)';
  else if(type==='code')insert=sel.indexOf('\n')>-1?'```\n'+sel+'\n```':'`'+(sel||'код')+'`';
  ta.value=ta.value.substring(0,start)+insert+ta.value.substring(end);
  ta.focus();
  var cursorPos=start+insert.length;
  if(type==='link'||type==='image')cursorPos=start+insert.indexOf('https://')+8;
  ta.setSelectionRange(cursorPos,cursorPos);
}

function renderMarkdown(text){
  if(!text)return '';
  var h=escHtml(text);
  // Code blocks first (```...```)
  h=h.replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>');
  // Inline code
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
  // Bold
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  // Italic
  h=h.replace(/\*(.+?)\*/g,'<em>$1</em>');
  // Images (before links so ![alt](url) doesn't match as link)
  h=h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" class="md-img" loading="lazy" onclick="event.stopPropagation();window.open(\'$2\',\'_blank\')">');
  // Links
  h=h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  // @mentions — validate against real users
  var users=getUsers();
  h=h.replace(/@([\w\u0400-\u04FF]+)/g,function(m,name){
    if(users[name])return '<a class="mention" onclick="event.stopPropagation();openProfile(\''+name+'\')">@'+name+'</a>';
    return m;
  });
  // #hashtags — clickable tag filter
  h=h.replace(/#([\w\u0400-\u04FF]+)/g,'<a class="hashtag" onclick="event.stopPropagation();filterByTag(\'$1\')">#$1</a>');
  // Blockquotes (lines starting with >)
  h=h.replace(/(^|<br>)&gt;\s?(.+?)(?=<br>|$)/g,'$1<div class="md-quote">$2</div>');
  // Line breaks
  h=h.replace(/\n/g,'<br>');
  return h;
}

function toggleTopicPreview(zone){
  _ntShowPreview=!_ntShowPreview;
  var area=document.getElementById('ntPreviewArea');if(!area)return;
  if(!_ntShowPreview){area.innerHTML='';return}
  var title=(document.getElementById('ntTitle').value||'').trim();
  var body=(document.getElementById('ntBody').value||'').trim();
  var typeLabels={q:'❓ ВЪПРОС',e:'📝 ОПИТ',s:'✅ РЕШЕНО',h:'🔥 ГОРЕЩО'};
  area.innerHTML='<div class="ntf-preview">'+
    '<div style="margin-bottom:8px"><span class="ft-type ft-type-'+_ntSelectedType+'">'+typeLabels[_ntSelectedType]+'</span>'+
    (_ntSelectedTags.length?' <span style="font-size:11px;color:var(--text2)">'+_ntSelectedTags.join(', ')+'</span>':'')+
    '</div>'+
    '<div style="font:700 15px \'Exo 2\';margin-bottom:8px">'+(title||'(без заглавие)')+'</div>'+
    '<div>'+renderMarkdown(body||'(без съдържание)')+'</div>'+
  '</div>';
}

function submitNewTopic(zone){
  var fields=[{id:'ntTitle',rules:[{type:'required',msg:'Заглавието е задължително'},{type:'minlength',value:5,msg:'Минимум 5 символа'}]}];
  var bodyEl=document.getElementById('ntBody');
  if(bodyEl&&bodyEl.value.trim().length>0&&bodyEl.value.trim().length<20){
    showToast('⚠️ Съдържанието трябва да е поне 20 символа','');return;
  }
  if(!validateForm(fields))return;
  var title=(document.getElementById('ntTitle').value||'').trim();
  var body=(bodyEl?bodyEl.value:'').trim();
  var user=getCurrentUser();if(!user){toggleAuthModal();return}
  var post={id:'post_'+Date.now(),zone:zone,type:_ntSelectedType||'q',title:title,body:body||'',tags:_ntSelectedTags.slice(),author:user.id,date:new Date().toISOString().split('T')[0],reactions:{like:[],wrench:[],thanks:[]},replies:[],likes:[]};
  var submitBtn=document.querySelector('#newTopicFormArea .btn-o');
  btnSubmitEffect(submitBtn);
  var posts=getForumPosts();
  // First post detection
  var isFirstPost=!posts.some(function(p){return p.author===user.id});
  posts.unshift(post);saveForumPosts(posts);
  clearForumDraft(zone);
  document.getElementById('newTopicFormArea').innerHTML='';
  _ntSelectedType='q';_ntSelectedTags=[];_ntShowPreview=false;
  renderUserThread(post,true);
  refreshHome();
  if(isFirstPost){
    showCelebration('🎉','ПЪРВАТА ТИ ТЕМА!','Добре дошъл в разговора, ездач!');
  }else{
    showToast('Темата е публикувана!','success');
  }
}

function renderUserThread(post,prepend){
  var users=getUsers();var author=users[post.author]||{name:'Анонимен',emoji:'👤',role:'rider'};
  var typeClass='ft-type-q',typeLabel='❓ ВЪПРОС';
  if(post.type==='e'){typeClass='ft-type-e';typeLabel='📝 ОПИТ'}
  if(post.type==='s'){typeClass='ft-type-s';typeLabel='✅ РЕШЕНО'}
  if(post.type==='h'){typeClass='ft-type-h';typeLabel='🔥 ГОРЕЩО'}
  // Tier badge for ALL authors (not just current user)
  var tierBadge='';
  if(author.role==='rider'){
    var authorTier=calcTierForUser(post.author);
    if(authorTier)tierBadge=' <span class="lv '+TIERS[authorTier].css+'">'+TIERS[authorTier].emoji+'</span>';
  }
  var roleBadge=author.role!=='rider'?renderRoleBadge(author.role):'';
  var replyCount=Array.isArray(post.replies)?post.replies.length:(post.replies||0);
  var curUid=getCurrentUserId();
  // Reactions — 3 types
  var rHtml=buildReactButtons(post,curUid);
  // Tags
  var tagsHtml='';
  if(Array.isArray(post.tags)&&post.tags.length){
    post.tags.forEach(function(t){tagsHtml+='<span class="ft-tag-pill">'+escHtml(t)+'</span>'});
  }
  // Body preview — strip markdown for card
  var bodyPreview='';
  if(post.body){
    var plain=post.body.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/```[\s\S]*?```/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
    bodyPreview='<div class="ft-p">'+escHtml(plain.substring(0,120))+(plain.length>120?'…':'')+'</div>';
  }
  var div=document.createElement('div');
  var extraClass=post.deleted?' post-deleted':'';
  if(post.moderation_status==='flagged')extraClass+=' post-flagged-card';
  div.className='ft ft-user card-enter'+extraClass;div.dataset.zone=post.zone;div.dataset.type=post.type;div.dataset.postId=post.id;
  div.setAttribute('onclick','toggleUserThread(\''+post.id+'\')');
  div.innerHTML='<div class="ft-top"><span class="ft-type '+typeClass+'">'+typeLabel+'</span><div class="ft-tag">'+escHtml(zoneNames[post.zone]||post.zone)+'</div>'+(tagsHtml?'<div class="ft-tags-row">'+tagsHtml+'</div>':'')+'<div class="ft-c"><div class="ft-t">'+escHtml(post.title)+'</div>'+bodyPreview+'<div class="ft-a">'+userAvatar(author,22)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+post.author+'\')">'+escHtml(author.name)+'</strong>'+tierBadge+roleBadge+' · <span class="time-ago" title="'+escHtml(post.date)+'">'+timeAgo(post.date)+'</span></div></div><div class="ft-s"><div class="ft-n">'+replyCount+'</div><div style="font-size:10px;color:var(--text2)">💬</div></div></div><div class="ft-react">'+rHtml+'</div><div class="thread" id="td_'+post.id+'"></div>';
  var container=document.getElementById('userForumPosts');
  if(container&&prepend)container.prepend(div);
  else if(container)container.appendChild(div);
}

function renderSavedPosts(){
  var posts=getForumPosts();var container=document.getElementById('userForumPosts');
  if(!container)return;container.innerHTML='';
  posts.forEach(function(p){renderUserThread(p,false)});
}

// ===== FORUM THREAD DETAIL (REPLIES) =====
function toggleUserThread(postId){
  var el=document.querySelector('[data-post-id="'+postId+'"]');if(!el)return;
  var detail=document.getElementById('td_'+postId);if(!detail)return;
  if(detail.classList.contains('on')){detail.classList.remove('on');detail.innerHTML=''}
  else{
    var posts=getForumPosts();var post=null;
    for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
    if(!post)return;
    detail.innerHTML=renderThreadDetail(post);detail.classList.add('on');
    setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'})},100);
  }
}
function renderThreadDetail(post){
  var users=getUsers();var html='';
  var replies=Array.isArray(post.replies)?post.replies:[];
  var uid=getCurrentUserId();
  var isFlagged=post.moderation_status==='flagged';
  var isDeleted=post.deleted===true;
  // Tags display
  if(Array.isArray(post.tags)&&post.tags.length){
    html+='<div class="th-tags">';
    post.tags.forEach(function(t){html+='<span class="ft-tag-pill">'+escHtml(t)+'</span>'});
    html+='</div>';
  }
  // Original post body (rendered as markdown)
  if(post.body){
    var au=users[post.author]||{name:'Анонимен',emoji:'👤',role:'rider'};
    var auTier='';
    if(au.role==='rider'){var tk=calcTierForUser(post.author);if(tk)auTier=' <span class="lv '+TIERS[tk].css+'">'+TIERS[tk].emoji+'</span>'}
    var auRole=au.role!=='rider'?renderRoleBadge(au.role):'';
    var editedLabel=post.editedAt?' <span class="meta" style="font-size:10px;opacity:.5">(редактирано '+timeAgo(post.editedAt)+')</span>':'';
    var opClass='th-post th-op'+(isDeleted?' post-deleted':'')+(isFlagged?' post-flagged':'');
    // OP action buttons
    var opActions='<div class="th-post-actions">';
    if(uid&&uid===post.author&&!isDeleted){
      opActions+='<button class="ft-react-btn" onclick="event.stopPropagation();editPost(\''+post.id+'\')" title="Редактирай">✏️</button>';
      opActions+='<button class="ft-react-btn" onclick="event.stopPropagation();deletePost(\''+post.id+'\')" title="Изтрий">🗑️</button>';
    }
    if(uid&&uid!==post.author&&!isDeleted){
      opActions+='<button class="ft-react-btn" onclick="event.stopPropagation();showReportMenu(\''+post.id+'\',null,this)" title="Докладвай">🚩</button>';
    }
    opActions+='</div>';
    var bodyContent=isFlagged&&uid!==post.author?'<div class="flagged-overlay" onclick="event.stopPropagation();this.closest(\'.post-flagged\').classList.remove(\'post-flagged\');this.remove()"><span>⚠️ Маркирано от общността</span><br><span style="font-size:10px;opacity:.7">Натисни за показване</span></div>'+renderMarkdown(post.body):renderMarkdown(post.body);
    html+='<div class="'+opClass+'"><div class="th-post-h">'+userAvatar(au,30)+'<div><strong class="link" onclick="event.stopPropagation();openProfile(\''+post.author+'\')">'+escHtml(au.name)+'</strong>'+auTier+auRole+' <span class="meta time-ago" title="'+escHtml(post.date)+'">· '+timeAgo(post.date)+'</span>'+editedLabel+'</div></div><div class="th-post-body">'+bodyContent+'</div>'+opActions+'</div>';
  }
  // Replies
  replies.forEach(function(r){
    var ra=users[r.author]||{name:'Анонимен',emoji:'👤',role:'rider'};
    var rlc=Array.isArray(r.likes)?r.likes.length:0;
    var rLiked=Array.isArray(r.likes)&&uid&&r.likes.indexOf(uid)>-1;
    var raTier='';
    if(ra.role==='rider'){var rtk=calcTierForUser(r.author);if(rtk)raTier=' <span class="lv '+TIERS[rtk].css+'">'+TIERS[rtk].emoji+'</span>'}
    var raRole=ra.role!=='rider'?renderRoleBadge(ra.role):'';
    var rDeleted=r.deleted===true;
    var rFlagged=r.flagged===true;
    var rEdited=r.editedAt?' <span class="meta" style="font-size:10px;opacity:.5">(редактирано)</span>':'';
    var isSolution=post.solutionReplyId===r.id;
    var replyClass='th-post'+(rDeleted?' post-deleted':'')+(rFlagged?' post-flagged':'')+(isSolution?' th-solution':'');
    // Solution badge
    var solutionBadge=isSolution?'<span class="solution-badge">✅ РЕШЕНИЕ</span> ':'';
    // Actions
    var actions='<div class="th-post-actions" data-reply-id="'+r.id+'">';
    if(!rDeleted){
      actions+='<button class="ft-react-btn'+(rLiked?' reacted':'')+'" onclick="event.stopPropagation();toggleReplyLike(\''+post.id+'\',\''+r.id+'\')">👍'+(rlc?' '+rlc:'')+'</button>';
      if(uid){
        var quoteBtn='<button class="ft-react-btn" onclick="event.stopPropagation();quoteReply(\''+post.id+'\',\''+escHtml(ra.name).replace(/'/g,'\\&apos;')+'\',this)" title="Цитирай">💬</button>';
        actions+=quoteBtn;
      }
      // Edit/delete for author
      if(uid&&uid===r.author){
        actions+='<button class="ft-react-btn" onclick="event.stopPropagation();editReply(\''+post.id+'\',\''+r.id+'\')" title="Редактирай">✏️</button>';
        actions+='<button class="ft-react-btn" onclick="event.stopPropagation();deleteReply(\''+post.id+'\',\''+r.id+'\')" title="Изтрий">🗑️</button>';
      }
      // Report for non-author
      if(uid&&uid!==r.author){
        actions+='<button class="ft-react-btn" onclick="event.stopPropagation();showReportMenu(\''+post.id+'\',\''+r.id+'\',this)" title="Докладвай">🚩</button>';
      }
      // Mark as solution (OP only, not own reply)
      if(uid&&uid===post.author&&r.author!==uid){
        actions+='<button class="ft-react-btn'+(isSolution?' reacted':'')+'" onclick="event.stopPropagation();markSolution(\''+post.id+'\',\''+r.id+'\')" title="'+(isSolution?'Премахни решение':'Маркирай като решение')+'">'+(isSolution?'❎':'✅')+'</button>';
      }
    }
    actions+='</div>';
    var bodyContent=rFlagged&&uid!==r.author?'<div class="flagged-overlay" onclick="event.stopPropagation();this.closest(\'.post-flagged\').classList.remove(\'post-flagged\');this.remove()"><span>⚠️ Маркирано от общността</span><br><span style="font-size:10px;opacity:.7">Натисни за показване</span></div>'+renderMarkdown(r.body):renderMarkdown(r.body);
    html+='<div class="'+replyClass+'" data-reply-id="'+r.id+'"><div class="th-post-h">'+userAvatar(ra,30)+'<div>'+solutionBadge+'<strong class="link" onclick="event.stopPropagation();openProfile(\''+r.author+'\')">'+escHtml(ra.name)+'</strong>'+raTier+raRole+' <span class="meta time-ago" title="'+escHtml(r.date)+'">· '+timeAgo(r.date)+'</span>'+rEdited+'</div></div><div class="th-post-body">'+bodyContent+'</div>'+actions+'</div>';
  });
  // Reply form
  if(getCurrentUser()&&!isDeleted){
    html+='<div class="reply-form"><textarea id="replyText_'+post.id+'" class="reply-textarea" placeholder="Напиши отговор...\n\nМожеш да ползваш **bold**, *italic*, `код`, @потребител, #таг"></textarea><div class="reply-form-actions"><button class="btn btn-o" style="font-size:11px" onclick="event.stopPropagation();submitReply(\''+post.id+'\')">📤 Отговори</button></div></div>';
  }else if(!getCurrentUser()){
    html+='<div class="reply-form" style="text-align:center;padding:12px"><span class="link" onclick="event.stopPropagation();toggleAuthModal()">Влез</span> за да отговориш</div>';
  }
  // Related posts ("Виж също")
  var related=getRelatedPosts(post.zone,post.id,3);
  if(related.length>0){
    html+='<div class="th-related"><div class="th-related-title">📌 Виж също от '+escHtml(zoneNames[post.zone]||post.zone)+'</div>';
    related.forEach(function(rp){
      var rpAuthor=users[rp.author]||{name:'Анонимен'};
      var rpReactions=getReactions(rp);
      var rpScore=rpReactions.like.length+rpReactions.wrench.length+rpReactions.thanks.length;
      var rpReplies=Array.isArray(rp.replies)?rp.replies.length:0;
      html+='<div class="th-related-item" onclick="event.stopPropagation();toggleUserThread(\''+rp.id+'\')">';
      html+='<div class="th-related-title-text">'+escHtml(rp.title)+'</div>';
      html+='<div class="meta">'+escHtml(rpAuthor.name)+' · 👍'+rpScore+' · 💬'+rpReplies+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  return html;
}
function quoteReply(postId,authorName,btn){
  var ta=document.getElementById('replyText_'+postId);if(!ta)return;
  var postEl=btn.closest('.th-post');if(!postEl)return;
  var bodyEl=postEl.querySelector('.th-post-body');if(!bodyEl)return;
  var text=bodyEl.textContent.trim().substring(0,200);
  var quote='> **'+authorName+':** '+text+'\n\n';
  ta.value=quote+ta.value;ta.focus();
  ta.setSelectionRange(ta.value.length,ta.value.length);
}
function submitReply(postId){
  if(!validateForm([
    {id:'replyText_'+postId,rules:[{type:'required',msg:'Напиши отговор'},{type:'minlength',value:2,msg:'Поне 2 символа'}]}
  ]))return;
  var ta=document.getElementById('replyText_'+postId);if(!ta)return;
  var body=ta.value.trim();
  var user=getCurrentUser();if(!user){toggleAuthModal();return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  if(!Array.isArray(post.replies))post.replies=[];
  post.replies.push({id:'r_'+Date.now(),author:user.id,body:body,date:new Date().toISOString().split('T')[0],likes:[]});
  saveForumPosts(posts);
  // Notifications
  var now=new Date();var nDate=now.toISOString().split('T')[0];var nTime=now.toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'});
  addNotification(post.author,{id:'notif_'+Date.now(),type:'reply',from:user.id,postId:post.id,postTitle:(post.title||'').substring(0,40),preview:body.substring(0,60),date:nDate,time:nTime,read:false});
  var mentions=extractMentions(body);
  for(var mi=0;mi<mentions.length;mi++){
    if(mentions[mi]!==user.id&&mentions[mi]!==post.author){
      addNotification(mentions[mi],{id:'notif_'+(Date.now()+mi+1),type:'mention',from:user.id,postId:post.id,postTitle:(post.title||'').substring(0,40),preview:body.substring(0,60),date:nDate,time:nTime,read:false});
    }
  }
  var detail=document.getElementById('td_'+postId);if(detail)detail.innerHTML=renderThreadDetail(post);
  // Pulse animation on newest reply
  if(detail){var lastReply=detail.querySelector('.th-post:last-of-type');if(lastReply){lastReply.classList.remove('reply-new');lastReply.offsetHeight;lastReply.classList.add('reply-new')}}
  var ft=document.querySelector('[data-post-id="'+postId+'"]');
  if(ft){var cn=ft.querySelector('.ft-n');if(cn)cn.textContent=post.replies.length}
  showToast('✅ Отговорът е публикуван!','success');
  refreshHome();
}

// ===== TIER FOR ANY USER =====
function calcTierForUser(uid){
  if(!uid)return null;
  try{
    var bikes=JSON.parse(localStorage.getItem('orGarage_'+uid)||'[]');
    var log=JSON.parse(localStorage.getItem('orServiceLog_'+uid)||'[]');
    var mods=JSON.parse(localStorage.getItem('orMods_'+uid)||'[]');
    var score=bikes.length*5;
    var totalMonths=0;bikes.forEach(function(b){totalMonths+=(b.months||0)});
    score+=Math.round(totalMonths*0.4);
    score+=log.length*2;
    var makes={};bikes.forEach(function(b){if(b.make)makes[b.make]=1});
    if(Object.keys(makes).length>1)score+=3;
    score+=mods.length*3;
    mods.forEach(function(m){if(m.forumPostId)score+=2});
    return calculateTier(score);
  }catch(e){return 'kalko'}
}

// ===== REACTION SYSTEM (3 types: like, wrench, thanks) =====
function getReactions(post){
  // Normalize: support both old format (post.likes[]) and new format (post.reactions{})
  var r=post.reactions||{};
  if(!Array.isArray(r.like))r.like=Array.isArray(post.likes)?post.likes.slice():[];
  if(!Array.isArray(r.wrench))r.wrench=[];
  if(!Array.isArray(r.thanks))r.thanks=[];
  return r;
}
function buildReactButtons(post,curUid){
  var r=getReactions(post);
  var pid=post.id;
  var html='';
  [{type:'like',emoji:'👍',label:'Полезно'},{type:'wrench',emoji:'🔧',label:'Имах го'},{type:'thanks',emoji:'🙏',label:'Мерси'}].forEach(function(rx){
    var count=r[rx.type].length;
    var active=curUid&&r[rx.type].indexOf(curUid)>-1;
    html+='<button class="ft-react-btn'+(active?' reacted':'')+'" data-react="'+rx.type+'" onclick="event.stopPropagation();toggleReaction(\''+pid+'\',\''+rx.type+'\')">'+rx.emoji+(count?' '+count:'')+'</button>';
  });
  return html;
}
function toggleReaction(postId,type){
  var uid=getCurrentUserId();if(!uid){toggleAuthModal();return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  // Ensure reactions object
  if(!post.reactions)post.reactions={};
  if(!Array.isArray(post.reactions.like))post.reactions.like=Array.isArray(post.likes)?post.likes.slice():[];
  if(!Array.isArray(post.reactions.wrench))post.reactions.wrench=[];
  if(!Array.isArray(post.reactions.thanks))post.reactions.thanks=[];
  // Also keep post.likes in sync for backward compat
  var arr=post.reactions[type];if(!arr)return;
  var idx=arr.indexOf(uid);
  var wasReacted=idx>-1;
  if(idx>-1){arr.splice(idx,1)}else{
    arr.push(uid);
    var now=new Date();
    addNotification(post.author,{id:'notif_'+Date.now(),type:'reaction',from:uid,postId:post.id,postTitle:(post.title||'').substring(0,40),preview:type,date:now.toISOString().split('T')[0],time:now.toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),read:false});
  }
  if(type==='like')post.likes=post.reactions.like.slice();
  // Optimistic UI: update button instantly
  var ft=document.querySelector('[data-post-id="'+postId+'"]');
  if(ft){
    var btns=ft.querySelectorAll('.ft-react .ft-react-btn[data-react="'+type+'"]');
    btns.forEach(function(btn){
      var count=post.reactions[type].length;
      var emoji=type==='like'?'👍':type==='wrench'?'🔧':'🙏';
      btn.textContent=emoji+(count?' '+count:'');
      btn.classList.toggle('reacted',post.reactions[type].indexOf(uid)>-1);
      if(!wasReacted){btn.classList.remove('liked-anim');btn.offsetHeight;btn.classList.add('liked-anim')}
    });
  }
  setTimeout(function(){saveForumPosts(posts)},0);
}

// ===== FORUM LIKES PERSIST (legacy — now wraps toggleReaction) =====
function toggleLike(postId){
  var uid=getCurrentUserId();if(!uid){toggleAuthModal();return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  if(!Array.isArray(post.likes))post.likes=[];
  var wasLiked=post.likes.indexOf(uid)>-1;
  var idx=post.likes.indexOf(uid);if(idx>-1)post.likes.splice(idx,1);else post.likes.push(uid);
  // Optimistic UI: update DOM instantly, save async
  var ft=document.querySelector('[data-post-id="'+postId+'"]');
  if(ft){var lb=ft.querySelector('.ft-react .ft-react-btn');if(lb){lb.textContent='👍 '+post.likes.length;lb.classList.toggle('reacted',post.likes.indexOf(uid)>-1);if(!wasLiked){lb.classList.remove('liked-anim');lb.offsetHeight;lb.classList.add('liked-anim')}}}
  setTimeout(function(){saveForumPosts(posts)},0);
}
function toggleReplyLike(postId,replyId){
  var uid=getCurrentUserId();if(!uid){toggleAuthModal();return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||!Array.isArray(post.replies))return;
  var reply=null;for(var j=0;j<post.replies.length;j++){if(post.replies[j].id===replyId){reply=post.replies[j];break}}
  if(!reply)return;
  if(!Array.isArray(reply.likes))reply.likes=[];
  var idx=reply.likes.indexOf(uid);if(idx>-1)reply.likes.splice(idx,1);else reply.likes.push(uid);
  saveForumPosts(posts);
  var detail=document.getElementById('td_'+postId);
  if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
}

// ===== FORUM EDIT / DELETE / REPORT / SOLUTION =====
function editPost(postId){
  var uid=getCurrentUserId();if(!uid)return;
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||post.author!==uid)return;
  var opEl=document.querySelector('#td_'+postId+' .th-op .th-post-body');if(!opEl)return;
  opEl.innerHTML='<textarea id="editPostBody_'+postId+'" class="reply-textarea" style="min-height:80px">'+escHtml(post.body||'')+'</textarea><div class="reply-form-actions" style="margin-top:6px"><button class="btn btn-o" style="font-size:11px" onclick="event.stopPropagation();savePostEdit(\''+postId+'\')">💾 Запази</button><button class="btn" style="font-size:11px;background:var(--card);border:1px solid var(--border);color:var(--text2)" onclick="event.stopPropagation();cancelPostEdit(\''+postId+'\')">Отмени</button></div>';
  document.getElementById('editPostBody_'+postId).focus();
}
function savePostEdit(postId){
  var ta=document.getElementById('editPostBody_'+postId);if(!ta)return;
  var newBody=ta.value.trim();
  if(newBody.length<5){showToast('⚠️ Минимум 5 символа','');return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  post.body=newBody;post.editedAt=new Date().toISOString();
  saveForumPosts(posts);
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
  showToast('✅ Постът е редактиран','success');
}
function cancelPostEdit(postId){
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
}
function editReply(postId,replyId){
  var uid=getCurrentUserId();if(!uid)return;
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||!Array.isArray(post.replies))return;
  var reply=null;for(var j=0;j<post.replies.length;j++){if(post.replies[j].id===replyId){reply=post.replies[j];break}}
  if(!reply||reply.author!==uid)return;
  var replyEl=document.querySelector('#td_'+postId+' [data-reply-id="'+replyId+'"] .th-post-body');if(!replyEl)return;
  replyEl.innerHTML='<textarea id="editReply_'+replyId+'" class="reply-textarea" style="min-height:60px">'+escHtml(reply.body||'')+'</textarea><div class="reply-form-actions" style="margin-top:6px"><button class="btn btn-o" style="font-size:11px" onclick="event.stopPropagation();saveReplyEdit(\''+postId+'\',\''+replyId+'\')">💾 Запази</button><button class="btn" style="font-size:11px;background:var(--card);border:1px solid var(--border);color:var(--text2)" onclick="event.stopPropagation();cancelReplyEdit(\''+postId+'\')">Отмени</button></div>';
  document.getElementById('editReply_'+replyId).focus();
}
function saveReplyEdit(postId,replyId){
  var ta=document.getElementById('editReply_'+replyId);if(!ta)return;
  var newBody=ta.value.trim();
  if(newBody.length<2){showToast('⚠️ Минимум 2 символа','');return}
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||!Array.isArray(post.replies))return;
  for(var j=0;j<post.replies.length;j++){
    if(post.replies[j].id===replyId){post.replies[j].body=newBody;post.replies[j].editedAt=new Date().toISOString();break}
  }
  saveForumPosts(posts);
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
  showToast('✅ Отговорът е редактиран','success');
}
function cancelReplyEdit(postId){
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post)return;
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
}
function deletePost(postId){
  var uid=getCurrentUserId();if(!uid)return;
  if(!confirm('Сигурен ли си, че искаш да изтриеш този пост?'))return;
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||post.author!==uid)return;
  post.body='[Изтрито от автора]';post.deleted=true;post.deletedAt=new Date().toISOString();
  saveForumPosts(posts);
  // Update card
  var ft=document.querySelector('[data-post-id="'+postId+'"]');
  if(ft){ft.classList.add('post-deleted');var bp=ft.querySelector('.ft-p');if(bp)bp.textContent='[Изтрито от автора]'}
  // Update thread detail
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
  showToast('🗑️ Постът е изтрит','');
}
function deleteReply(postId,replyId){
  var uid=getCurrentUserId();if(!uid)return;
  if(!confirm('Сигурен ли си, че искаш да изтриеш този отговор?'))return;
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||!Array.isArray(post.replies))return;
  for(var j=0;j<post.replies.length;j++){
    if(post.replies[j].id===replyId){
      if(post.replies[j].author!==uid)return;
      post.replies[j].body='[Изтрито от автора]';post.replies[j].deleted=true;post.replies[j].deletedAt=new Date().toISOString();break;
    }
  }
  saveForumPosts(posts);
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
  showToast('🗑️ Отговорът е изтрит','');
}

// ===== REPORT SYSTEM =====
function getReports(){try{return JSON.parse(localStorage.getItem('orReports')||'[]')}catch(e){return[]}}
function saveReports(r){localStorage.setItem('orReports',JSON.stringify(r))}
function showReportMenu(postId,replyId,btn){
  // Close any existing report dropdown
  document.querySelectorAll('.report-dropdown').forEach(function(d){d.remove()});
  var drop=document.createElement('div');drop.className='report-dropdown';
  var reasons=['Спам','Обидно съдържание','Грешна информация','Друго'];
  reasons.forEach(function(r){
    var opt=document.createElement('div');opt.className='report-option';opt.textContent='🚩 '+r;
    opt.onclick=function(e){e.stopPropagation();submitReport(postId,replyId,r);drop.remove()};
    drop.appendChild(opt);
  });
  btn.parentElement.style.position='relative';
  btn.parentElement.appendChild(drop);
  // Close on outside click
  setTimeout(function(){
    document.addEventListener('click',function closeReport(){drop.remove();document.removeEventListener('click',closeReport)});
  },10);
}
function submitReport(postId,replyId,reason){
  var uid=getCurrentUserId();if(!uid){toggleAuthModal();return}
  var reports=getReports();
  // Check unique: 1 report per user per post/reply
  var existing=reports.find(function(r){return r.postId===postId&&(r.replyId||null)===(replyId||null)&&r.reporterId===uid});
  if(existing){showToast('⚠️ Вече си докладвал този пост','');return}
  reports.push({postId:postId,replyId:replyId||null,reporterId:uid,reason:reason,date:new Date().toISOString()});
  saveReports(reports);
  // Check auto-flag: 3+ unique reports → flag
  var reportCount=reports.filter(function(r){return r.postId===postId&&(r.replyId||null)===(replyId||null)}).length;
  if(reportCount>=3){
    var posts=getForumPosts();
    for(var i=0;i<posts.length;i++){
      if(posts[i].id===postId){
        if(replyId){
          // Flag specific reply
          if(Array.isArray(posts[i].replies)){
            for(var j=0;j<posts[i].replies.length;j++){
              if(posts[i].replies[j].id===replyId){posts[i].replies[j].flagged=true;break}
            }
          }
        }else{
          posts[i].moderation_status='flagged';
        }
        saveForumPosts(posts);break;
      }
    }
  }
  showToast('🚩 Благодарим за сигнала','success');
}

// ===== MARK SOLUTION =====
function markSolution(postId,replyId){
  var uid=getCurrentUserId();if(!uid)return;
  var posts=getForumPosts();var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post||post.author!==uid){showToast('⚠️ Само авторът може да маркира решение','');return}
  // Toggle: if same reply is already solution, unmark
  if(post.solutionReplyId===replyId){
    post.solutionReplyId=null;
    post.type=post._origType||'q';
  }else{
    post._origType=post._origType||post.type;
    post.solutionReplyId=replyId;
    post.type='s';
  }
  saveForumPosts(posts);
  // Update thread card type badge
  var ft=document.querySelector('[data-post-id="'+postId+'"]');
  if(ft){
    var typeEl=ft.querySelector('.ft-type');
    if(typeEl){
      if(post.type==='s'){typeEl.className='ft-type ft-type-s';typeEl.textContent='✅ РЕШЕНО'}
      else{var tl={q:'❓ ВЪПРОС',e:'📝 ОПИТ',h:'🔥 ГОРЕЩО'};typeEl.className='ft-type ft-type-'+post.type;typeEl.textContent=tl[post.type]||'❓ ВЪПРОС'}
    }
  }
  // Re-render thread detail
  var detail=document.getElementById('td_'+postId);if(detail&&detail.classList.contains('on'))detail.innerHTML=renderThreadDetail(post);
  showToast(post.solutionReplyId?'✅ Маркирано като решение!':'Решението е премахнато','success');
}

// ===== FILTER BY TAG (from #hashtag click) =====
function filterByTag(tag){
  go('forum');
  // Show all zones, filter by tag
  setTimeout(function(){
    var found=false;
    document.querySelectorAll('#t-forum .ft').forEach(function(ft){
      var postId=ft.dataset.postId;if(!postId)return;
      var posts=getForumPosts();
      var post=posts.find(function(p){return p.id===postId});
      if(post&&Array.isArray(post.tags)&&post.tags.indexOf(tag)>-1){ft.style.display='';found=true}
      else if(post&&post.body&&post.body.toLowerCase().indexOf('#'+tag.toLowerCase())>-1){ft.style.display='';found=true}
      else{ft.style.display='none'}
    });
    // Show threads section, hide zones
    document.getElementById('forumZones').style.display='none';
    document.getElementById('forumThreads').style.display='block';
    var bc=document.getElementById('forumBc');if(bc)bc.style.display='';
    var bcZone=document.getElementById('forumBcZone');if(bcZone)bcZone.textContent='#'+tag;
    if(!found)showToast('Няма теми с таг #'+tag,'');
  },100);
}

// ===== RELATED POSTS =====
function getRelatedPosts(zone,excludeId,limit){
  limit=limit||3;
  var posts=getForumPosts().filter(function(p){
    return p.zone===zone&&p.id!==excludeId&&!p.deleted&&p.moderation_status!=='flagged';
  });
  // Sort by total reactions desc
  posts.sort(function(a,b){
    var ra=getReactions(a),rb=getReactions(b);
    var sa=ra.like.length+ra.wrench.length+ra.thanks.length+(Array.isArray(a.replies)?a.replies.length:0);
    var sb=rb.like.length+rb.wrench.length+rb.thanks.length+(Array.isArray(b.replies)?b.replies.length:0);
    return sb-sa;
  });
  return posts.slice(0,limit);
}

// ===== ZONE STATS =====
function getZoneStats(zone){
  var posts=getForumPosts().filter(function(p){return p.zone===zone&&!p.deleted});
  var now=Date.now();var weekMs=7*24*60*60*1000;
  var recent=posts.filter(function(p){return(now-new Date(p.date).getTime())<weekMs});
  return{total:posts.length,recent:recent.length};
}
function updateZoneStats(){
  document.querySelectorAll('.forum-zones .fz').forEach(function(fz){
    var zone=fz.dataset.zone;if(!zone)return;
    var stats=getZoneStats(zone);
    var countEl=fz.querySelector('.fz-count');
    if(countEl){
      var pulseClass='fz-pulse-calm';
      if(stats.recent>3)pulseClass='fz-pulse-hot';
      else if(stats.recent>0)pulseClass='fz-pulse-warm';
      countEl.innerHTML=stats.total+' '+(stats.total===1?'тема':'теми')+(stats.recent?' · <strong style="color:var(--orange)">'+stats.recent+' нови</strong>':'')+' <span class="fz-pulse '+pulseClass+'"></span>';
    }
  });
}

// ===== SEED FORUM DEMO =====
function seedForumDemo(){
  var posts=getForumPosts();var changed=false;
  posts.forEach(function(p){
    if(!Array.isArray(p.replies)){p.replies=[];changed=true}
    if(!Array.isArray(p.likes)){p.likes=[];changed=true}
    if(!Array.isArray(p.tags)){p.tags=[];changed=true}
    if(!p.reactions||!Array.isArray(p.reactions.like)){
      p.reactions={like:Array.isArray(p.likes)?p.likes.slice():[],wrench:[],thanks:[]};
      changed=true;
    }
  });
  if(changed)saveForumPosts(posts);
  if(posts.length>0)return;
  var seeds=[
    // --- Original seed posts ---
    {id:'post_seed1',zone:'problem',type:'q',title:'EXC 300 TPI губи мощност на горещо — идеи?',body:'След 30 минути каране мотора започва да дърпа слабо. На студено е ок. Инжекторите чистени, свещта нова. Какво да проверя?\n\nОпитах:\n- Нова свещ NGK\n- Чистене на инжектори\n- Проверка на въздушен филтър',tags:['ktm','двигател','електрика'],author:'marin',date:'2026-03-04',reactions:{like:['pesho','ivo','gosho'],wrench:['ivo'],thanks:[]},likes:['pesho','ivo','gosho'],replies:[
      {id:'r_s1_1',author:'pesho',body:'Може да е **fuel pump relay** — при горещо губят контакт. Провери с мултицет съпротивлението при работна температура.',date:'2026-03-04',likes:['marin','ivo']},
      {id:'r_s1_2',author:'ivo',body:'При мен беше **map сензора**. GET ECU-то го показа веднага с диагностика. Мина ми през Гошо Електро.',date:'2026-03-05',likes:['marin']},
      {id:'r_s1_3',author:'marin',body:'Мерси момчета! Ще пробвам с relay-то първо, после диагностика.',date:'2026-03-05',likes:[]}
    ]},
    {id:'post_seed2',zone:'tech',type:'e',title:'Мой опит с WP XPLOR ребилд — струва ли си?',body:'Направих пълен ребилд на вилката при Пешо. Пружини **5.0** за моите 95кг. Споделям впечатления след 20 моточаса.\n\nРазлика:\n- По-плавно поглъщане на корени и камъни\n- По-добър контрол при бързо каране\n- Цена: 380лв с труд',tags:['ktm','окачване'],author:'marin',date:'2026-03-02',reactions:{like:['pesho','ivo','gosho','kabakchiev'],wrench:[],thanks:['kabakchiev']},likes:['pesho','ivo','gosho','kabakchiev'],replies:[
      {id:'r_s2_1',author:'pesho',body:'Радвам се че си доволен! За следващия сервиз ще сменим и маслото на горната камера — ще стане още по-плавно.',date:'2026-03-02',likes:['marin']},
      {id:'r_s2_2',author:'kabakchiev',body:'XPLOR е страхотна вилка за ендуро. С правилните пружини прави чудеса. Одобрявам!',date:'2026-03-03',likes:['marin','pesho','ivo']}
    ]},
    {id:'post_seed3',zone:'newbie',type:'q',title:'Първи ендуро мотор — бюджет 5000лв, какво да гледам?',body:'Нов съм в офроуда. Карам на асфалт от 3 години. Искам нещо за гората, бюджет около 5000лв.\n\nКакво да препоръчате? Гледам:\n- KTM EXC 250\n- Yamaha WR250F\n- Honda CRF250X',tags:['екипировка'],author:'ivo',date:'2026-03-01',reactions:{like:['marin','pesho'],wrench:[],thanks:['marin']},likes:['marin','pesho'],replies:[
      {id:'r_s3_1',author:'marin',body:'За 5000лв гледай **KTM EXC 250/300** 2015-2017 или **Yamaha WR250F**. И двете са супер за начало. Внимавай за моточасовете.',date:'2026-03-01',likes:['ivo']},
      {id:'r_s3_2',author:'pesho',body:'Каквото и да вземеш, задели 500-800лв за първи сервиз. Винаги има какво да се оправи на втора ръка мотор.',date:'2026-03-02',likes:['ivo','marin']}
    ]},
    // --- Converted from HTML hardcoded threads ---
    {id:'post_yz250f',zone:'problem',type:'s',title:'Вибрация на 6000 оборота — какво да проверя?',body:'Появи се вибрация на 6000 об., на студено, след 10 мин изчезва. Мислех за окачване, но не съм сигурен. YZ250F 2019, 120 моточаса. Някой имал ли е подобно?',tags:['yamaha','двигател','окачване'],author:'marin',date:'2026-03-06',reactions:{like:['pesho','ivo','gosho','kabakchiev','motohaus','manolov'],wrench:['pesho','kabakchiev','ivo','gosho'],thanks:['pesho','kabakchiev','motohaus','manolov','ivo','gosho','elilison']},likes:[],solutionReplyId:'r_yz_1',replies:[
      {id:'r_yz_1',author:'pesho',body:'Ако вибрацията е при конкретни обороти и идва от долу — почти сигурно е **контратежест коляновия вал**. Не е окачване. Вдигни задницата и газирай — ако усещаш в степенките → долна част на двигателя. Промери контратежеста.',date:'2026-03-06',likes:['marin','kabakchiev','ivo','gosho','manolov']},
      {id:'r_yz_2',author:'kabakchiev',body:'Пешо е прав. Същото имах на моя 2018 YZ. **Контратежест + крайно уплътнение.** Не губи време с окачване — отвори долу.',date:'2026-03-07',likes:['marin','pesho','ivo']},
      {id:'r_yz_3',author:'motohaus',body:'Имаме контратежест за YZ250F 2019-2023 на склад. **140 лв**. Пратка утре или на място в Нови хан.',date:'2026-03-07',likes:['marin']},
      {id:'r_yz_4',author:'marin',body:'**РЕШЕНО!** Точно контратежест — 0.3mm разлика. Нов от МотоХаус, Пешо го смени за 4 часа. Мерси на всички!\n\nЦена: част **140 лв** + труд **120 лв** = **260 лв**',date:'2026-03-08',likes:['pesho','kabakchiev','motohaus','ivo']}
    ]},
    {id:'post_tpi',zone:'tech',type:'q',title:'TPI vs карбуратор — кое за какво?',body:'Горе TPI е по-чист, но долу при ниски обороти карбураторът дава повече контрол. Кой какъв опит има? Особено за hard enduro условия — кал, стръмни изкачвания, бавно каране.',tags:['ktm','двигател'],author:'kabakchiev',date:'2026-03-07',reactions:{like:['marin','pesho','ivo','gosho','manolov'],wrench:['marin','ivo','gosho','pesho'],thanks:['marin','ivo','gosho','manolov','pesho']},likes:[],replies:[
      {id:'r_tpi_1',author:'marin',body:'С моя EXC 300 TPI съм доволен за трейлове. Но на бавно каране в кал понякога усещам лек **lag** при газиране. Карбураторът реагира по-директно.',date:'2026-03-07',likes:['kabakchiev','ivo']},
      {id:'r_tpi_2',author:'gosho',body:'С правилен **ECU ремап** TPI-то може да стане доста по-отзивчиво долу. GET GPA е добър вариант. Ако някой иска — правя диагностика и настройка.',date:'2026-03-08',likes:['marin','kabakchiev','pesho']}
    ]},
    {id:'post_xef310',zone:'problem',type:'h',title:'XEF 310 Евро 5 — проблеми и решения',body:'Каталитичен конвертор, ECU ремап, какво работи реално. Споделям моя опит с Fantic XEF 310 и проблемите на Euro 5 версията.\n\nОсновни проблеми:\n- Загряване при бавно каране\n- ECU ограничава мощността\n- Катализаторът се задръства в кал',tags:['fantic','електрика'],author:'gosho',date:'2026-03-08',reactions:{like:['ivo','marin','pesho'],wrench:['ivo','marin','pesho'],thanks:['ivo','marin']},likes:[],replies:[
      {id:'r_xef_1',author:'ivo',body:'Имам същия мотор! Катализаторът е кошмар в калта. Свалих го и сложих **straight pipe** — разликата е огромна. Но за ТГП може да е проблем...',date:'2026-03-08',likes:['gosho','marin']}
    ]},
    {id:'post_gumi',zone:'tech',type:'e',title:'Ендуро гуми за БГ условия 2026',body:'Michelin Enduro Medium, Mitas, Maxxis — впечатления за кал, камъни, пясък. Тествах и трите марки през последните 2 сезона.\n\n**Michelin Enduro Medium** — универсална, най-добра за смесен терен\n**Mitas EF-07** — отлична за кал, по-мека гума\n**Maxxis Enduro** — евтина, но се износва бързо',tags:['гуми','ендуро'],author:'manolov',date:'2026-03-05',reactions:{like:['marin','pesho','ivo','gosho','kabakchiev','motohaus','edimoto'],wrench:['marin','pesho','ivo'],thanks:['marin','pesho','ivo','gosho','kabakchiev','motohaus','edimoto','elilison']},likes:[],replies:[
      {id:'r_gumi_1',author:'marin',body:'Michelin Enduro Medium карам от 6 месеца. За **Странджа и Родопи** е перфектна — камъни + кал + корени. Издържа ми 80 моточаса.',date:'2026-03-05',likes:['manolov','pesho','ivo']},
      {id:'r_gumi_2',author:'pesho',body:'За клиентите ми: ако карате предимно **кал и гора** — Mitas. За **смесен терен** — Michelin. Maxxis само за бюджет.',date:'2026-03-06',likes:['manolov','marin','ivo','kabakchiev']}
    ]},
    {id:'post_okachvane',zone:'tech',type:'q',title:'Showa vs WP XPLOR — за 90+ кг ездачи',body:'Бюджет до 800 лв за ревизия + пружини. Кой е по-добрият вариант? Карам предимно ендуро трейлове, тежа 95 кг с екипировка.\n\nЧувал съм че WP XPLOR е по-лесна за настройка, но Showa е по-стабилна на скорост.',tags:['окачване','wp'],author:'pesho',date:'2026-03-06',reactions:{like:['marin','ivo','kabakchiev'],wrench:['marin','ivo'],thanks:['marin']},likes:[],replies:[
      {id:'r_ok_1',author:'kabakchiev',body:'За 90+ кг **WP XPLOR с пружини 5.0-5.2** е по-добрият вариант. По-лесна за сервиз, по-предсказуема. Showa SFF-Air е добра, но по-сложна за настройка.',date:'2026-03-06',likes:['pesho','marin','ivo']},
      {id:'r_ok_2',author:'marin',body:'Аз съм 95кг и карам WP XPLOR с пружини 5.0. След ребилда при @pesho — перфектно. Препоръчвам!',date:'2026-03-07',likes:['pesho','kabakchiev']}
    ]},
    {id:'post_rodopi',zone:'story',type:'e',title:'Родопски рунд — 3 дни, 400км черни пътища',body:'Маршрут **Смолян → Триград → Доспат** с GPS tracks и снимки. Три дни офроуд из Родопите — едно от най-добрите ми пътувания.\n\nДен 1: Смолян → Широка лъка → Триград (130км)\nДен 2: Триград → Ягодинска пещера → Доспат (140км)\nДен 3: Доспат → Батак → връщане (130км)\n\nПътищата са предимно черни, има и горски. Нужен е мотор с добро окачване и гуми за кал.',tags:['маршрут'],author:'marin',date:'2026-03-07',reactions:{like:['pesho','ivo','kabakchiev','manolov'],wrench:['ivo','pesho'],thanks:['ivo','kabakchiev','manolov','pesho','gosho']},likes:[],replies:[
      {id:'r_rod_1',author:'ivo',body:'Страхотно! Някой ден ще го направим заедно. Пътят към Триград е **епичен** — особено спускането.',date:'2026-03-07',likes:['marin','kabakchiev']},
      {id:'r_rod_2',author:'manolov',body:'Родопите са перфектни за ендуро. За Триград — внимавайте с камъните след дъжд, стават много хлъзгави.',date:'2026-03-08',likes:['marin','ivo','pesho']}
    ]},
    {id:'post_sbirka',zone:'chat',type:'e',title:'Неделна кафе-сбирка София — кой идва?',body:'Тази неделя от 10:00 в Garage Cafe. Носете добро настроение и истории от пътя!\n\nПравим я всяка неделя — дойдете да се запознаем. Новобранци добре дошли!',tags:['среща','софия'],author:'ivo',date:'2026-03-08',reactions:{like:['marin','pesho','gosho','motohaus','manolov'],wrench:[],thanks:['marin','pesho','gosho']},likes:[],replies:[
      {id:'r_sb_1',author:'marin',body:'Идвам! Ще донеса снимки от Родопския рунд.',date:'2026-03-08',likes:['ivo','pesho']},
      {id:'r_sb_2',author:'pesho',body:'Ще мина след работа. Ако някой има въпроси за окачване — носете мотора!',date:'2026-03-08',likes:['ivo','marin']}
    ]},
    // --- Demo posts (previously in seedDemoAccounts) ---
    {id:'post_demo1',zone:'problem',type:'q',title:'Масло тече от предна вилка — WP XPLOR',body:'Забелязах масло на долните крачета след последното каране. Мотор: KTM EXC 300 2019. Някой имал ли е подобен проблем?\n\nТечът е малък, но видим. Мотоциклетът има 120 моточаса.',tags:['ktm','окачване'],author:'marin',date:'2026-03-04',reactions:{like:['pesho','ivo','gosho'],wrench:['pesho'],thanks:[]},likes:[],replies:[
      {id:'r_d1_1',author:'pesho',body:'Класика — **семеринги**. При 120ч е нормално. Ела при мен за ревизия, става за ден.',date:'2026-03-04',likes:['marin','ivo']},
      {id:'r_d1_2',author:'ivo',body:'При мен беше същото. Пешо ги смени за 3 часа. Препоръчвам SKF семеринги — по-издръжливи от оригиналните.',date:'2026-03-05',likes:['marin']}
    ]},
    {id:'post_demo2',zone:'newbie',type:'q',title:'Първа тренировка — какво да нося?',body:'Записах се при Манолов за 22 март. Какво оборудване ми трябва за начинаещ?\n\nИмам каска и ботуши. Какво друго е задължително?',tags:['екипировка','тренировка'],author:'ivo',date:'2026-03-05',reactions:{like:['marin','pesho','manolov','kabakchiev','gosho'],wrench:[],thanks:['manolov']},likes:[],replies:[
      {id:'r_d2_1',author:'manolov',body:'Задължително: **каска, ботуши, ръкавици, наколенки**. Останалото е по избор за начало, но силно препоръчвам гръден протектор.',date:'2026-03-05',likes:['ivo','marin','pesho']},
      {id:'r_d2_2',author:'marin',body:'Слушай Манолов! Аз на първата тренировка бях само с каска и ботуши — не беше приятно. Наколенките спасяват.',date:'2026-03-06',likes:['ivo','manolov']},
      {id:'r_d2_3',author:'kabakchiev',body:'Добре дошъл! Не се притеснявай — Манолов е най-добрият за начинаещи. Ще те научи правилно от самото начало.',date:'2026-03-06',likes:['ivo','manolov','marin']},
      {id:'r_d2_4',author:'pesho',body:'Виж при @elilison за екипировка — имат добри начални комплекти на разумна цена.',date:'2026-03-06',likes:['ivo','marin']}
    ]},
    // --- Plan & Skill zones ---
    {id:'post_plan1',zone:'plan',type:'e',title:'Уикенд маршрут Рила — ниво средно',body:'Планирам маршрут за уикенда:\n\n**Самоков → Мальовица → Говедарци** (около 50км офроуд)\n\nТерен: горски пътища + каменисти участъци. Нужни са добри гуми и поне среден опит. Тръгваме в събота 8:00 от Самоков.\n\nКой е с нас?',tags:['маршрут'],author:'marin',date:'2026-03-07',reactions:{like:['ivo','pesho','manolov'],wrench:[],thanks:['ivo']},likes:[],replies:[
      {id:'r_pl_1',author:'ivo',body:'Аз съм вътре! Ще дойда с Fantic-а. Има ли бензиностанция по маршрута?',date:'2026-03-07',likes:['marin']},
      {id:'r_pl_2',author:'manolov',body:'Хубав маршрут. Участъкът след Мальовица е каменист — карайте внимателно, особено при мокро.',date:'2026-03-08',likes:['marin','ivo']}
    ]},
    {id:'post_skill1',zone:'skill',type:'e',title:'Техника за стръмни изкачвания — стъпка по стъпка',body:'Споделям какво научих от Манолов за стръмни **каменисти изкачвания**:\n\n1. Застани прав на степенките\n2. Тежестта напред — лакти горе\n3. Постоянен газ — НЕ дръпвай рязко\n4. Гледай 3-4 метра напред, не пред гумата\n5. Ако загубиш тракция — лек натиск на съединителя\n\nНай-честата грешка: седиш на седалката. Стани прав!',tags:['тренировка'],author:'manolov',date:'2026-03-06',reactions:{like:['marin','ivo','pesho','kabakchiev','gosho'],wrench:[],thanks:['marin','ivo','pesho','gosho']},likes:[],replies:[
      {id:'r_sk_1',author:'kabakchiev',body:'Точно така. Бих добавил: при много стръмно — пусни въздух от предната гума до **0.6 бара**. Дава огромна разлика в тракцията.',date:'2026-03-06',likes:['manolov','marin','ivo','pesho']},
      {id:'r_sk_2',author:'marin',body:'Мерси! Точно това ми трябваше. На последното каране се изложих точно защото седях на седалката.',date:'2026-03-07',likes:['manolov','ivo']}
    ]}
  ];
  saveForumPosts(seeds);
}

// ===== МАЗЕТО LISTINGS =====
function getListings(){try{return JSON.parse(localStorage.getItem('orListings'))||[]}catch(e){return[]}}
function saveListings(l){localStorage.setItem('orListings',JSON.stringify(l))}
var SEED_LISTINGS=[
  {id:'seed_lst1',author:'marin',type:'part',title:'WP XPLOR пружини 5.0',desc:'Свалени при ъпгрейд. 50 моточаса, перфектни. Стават за 85-95кг ездач.',price:180,city:'Бургас',condition:'used',date:'2026-03-04',active:true},
  {id:'seed_lst2',author:'ivo',type:'gear',title:'Alpinestars Tech 7 ботуши',desc:'Размер 44, два сезона. Малко надраскани отвън, вътре перфектни.',price:420,city:'София',condition:'used',date:'2026-03-03',active:true},
  {id:'seed_lst3',author:'marin',type:'bike',title:'KTM 250 SX-F 2020',desc:'Крос машина, 120 моточаса, пълна история. Картер AXP, ръчки Renthal, GET ECU.',price:9800,city:'Бургас',condition:'used',date:'2026-03-01',active:true},
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
  // Header
  h+='<div style="padding:24px 24px 16px;border-bottom:1px solid var(--border)">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap"><span style="font-size:24px">'+typeEmoji+'</span><span class="badge b-cpo" style="font-size:10px">'+typeLabel+'</span><span class="badge" style="font-size:10px;'+condCls+'">'+condLabel+'</span></div>';
  h+='<div style="font:700 22px \'Bebas Neue\',sans-serif;letter-spacing:1px;color:var(--text)">'+escHtml(listing.title)+'</div>';
  h+='<div style="font:700 20px \'Bebas Neue\',sans-serif;color:var(--orange);margin-top:6px">'+priceStr+'</div>';
  h+='</div>';
  // Body
  h+='<div style="padding:16px 24px">';
  // Description
  h+='<div class="prof-sec"><div class="prof-sec-t">📝 ОПИСАНИЕ</div><div style="font:400 13px \'Exo 2\',sans-serif;color:var(--text2);line-height:1.6">'+renderMarkdown(listing.desc)+'</div></div>';
  // Details grid
  h+='<div class="prof-sec"><div class="prof-sec-t">📋 ДЕТАЙЛИ</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📍 Местоположение</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+escHtml(listing.city||'Не е посочен')+'</div>';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📅 Публикувана</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+timeAgo(listing.date)+'</div>';
  h+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2)">📦 Състояние</div><div style="font:600 12px \'Exo 2\',sans-serif;color:var(--text)">'+condLabel+'</div>';
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

function showListingForm(){
  var area=document.getElementById('listingFormArea');if(!area)return;
  if(area.querySelector('.listing-form')){area.innerHTML='';return}
  if(!getCurrentUser()){toggleAuthModal();return}
  area.innerHTML='<div class="listing-form"><div class="mod-form-title">НОВА ОБЯВА</div><input id="lstTitle" placeholder="Заглавие (напр. WP вилка XPLOR 48)" maxlength="80"><textarea id="lstDesc" placeholder="Описание — състояние, причина за продажба..."></textarea><div class="mod-form-row"><select id="lstType"><option value="part">⚙️ Част</option><option value="bike">🏍️ Мотор</option><option value="gear">🧤 Екипировка</option></select><select id="lstCond"><option value="used">Употребявано</option><option value="new">Ново</option><option value="rebuild">Ребилд</option></select></div><div class="mod-form-row"><input id="lstPrice" type="number" placeholder="Цена (лв)"><input id="lstCity" placeholder="Град"></div><div class="mod-form-actions"><button class="btn btn-o" onclick="submitListing()">Публикувай</button><button class="btn btn-s" onclick="document.getElementById(\'listingFormArea\').innerHTML=\'\'">Откажи</button></div></div>';
  document.getElementById('lstTitle').focus();
}
function submitListing(){
  if(!validateForm([
    {id:'lstTitle',rules:[{type:'required',msg:'Заглавието е задължително'},{type:'minlength',value:3,msg:'Минимум 3 символа'}]},
    {id:'lstDesc',rules:[{type:'required',msg:'Описанието е задължително'},{type:'minlength',value:10,msg:'Поне 10 символа'}]}
  ]))return;
  var title=(document.getElementById('lstTitle').value||'').trim();
  var desc=(document.getElementById('lstDesc').value||'').trim();
  var user=getCurrentUser();if(!user){toggleAuthModal();return}
  var listing={id:'lst_'+Date.now(),author:user.id,type:document.getElementById('lstType').value,title:title,desc:desc,price:parseInt(document.getElementById('lstPrice').value)||0,city:(document.getElementById('lstCity').value||'').trim()||'Не е посочен',condition:document.getElementById('lstCond').value,date:new Date().toISOString().split('T')[0],active:true};
  var listings=getListings();listings.unshift(listing);saveListings(listings);
  document.getElementById('listingFormArea').innerHTML='';
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
    container.innerHTML='<div class="g-maze">'+all.map(function(l,idx){
      var author=users[l.author]||{name:'Анонимен',emoji:'👤'};
      var typeEmoji=l.type==='bike'?'🏍️':l.type==='gear'?'🧤':'⚙️';
      var condLabel=l.condition==='new'?'Ново':l.condition==='rebuild'?'Ребилд':'Употребявано';
      var priceStr=l.price?l.price+' лв <span class="dual">/ '+Math.round(l.price/1.956)+' €</span>':'По договаряне';
      var uid=getCurrentUserId();
      var msgBtn=(uid&&uid!==l.author)?'<div style="margin-top:8px"><button class="btn btn-o" style="font-size:10px" onclick="event.stopPropagation();openSendMessage(\''+l.author+'\')">Прати съобщение</button></div>':'';
      return '<div class="mc mc-dynamic card-enter" data-enter-delay="'+idx+'" onclick="openListing(\''+l.id+'\')" style="cursor:pointer"><div class="mc-top"><span class="mc-em">'+typeEmoji+'</span><span class="price">'+priceStr+'</span></div><div class="mc-nm">'+escHtml(l.title)+'</div><div class="mc-d">'+escHtml(l.desc)+'</div><div style="display:flex;gap:4px;margin:4px 0"><span class="chip chip-cond">'+condLabel+'</span></div><div class="mc-sell">📍 '+escHtml(l.city)+' · '+userAvatar(author,18)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+l.author+'\')">'+escHtml(author.name)+'</strong> · <span class="time-ago" title="'+escHtml(l.date)+'">'+timeAgo(l.date)+'</span></div>'+msgBtn+'</div>';
    }).join('')+'</div>';
    initCardObserver();
  });
}

// ===== EVENTS DATA LAYER =====
var SEED_EVENTS=[
  {id:'extreme-fest-2026',title:'Extreme Enduro Fest',date:'2026-03-15',location:'Карлово',type:'race',registrants:67},
  {id:'bgx-krug3',title:'BG-X Ендуро — Кръг 3',date:'2026-03-15',location:'Карлово',type:'race',registrants:23},
  {id:'training-22mar',title:'Тренировка при Манолов',date:'2026-03-22',location:'Манолово',type:'training',registrants:8},
  {id:'rila-enduro-sunday',title:'Рила Ендуро Sunday',date:'2026-03-29',location:'Самоков',type:'ride',registrants:6},
  {id:'six-days-2026',title:'Six Days Crazy Job',date:'2026-04-15',location:'Казанлък',type:'race',registrants:47},
  {id:'bgx-krug4',title:'BG-X Ендуро — Кръг 4',date:'2026-05-15',location:'TBA',type:'race',registrants:0}
];
function getEvents(){return SEED_EVENTS}

// ===== ДИНАМИЧЕН ВЕСТНИК (FEED) =====
var FEED_TYPES={
  forum_hot:{emoji:'🔥',label:'Горещо от форума',color:'var(--orange)'},
  new_listing:{emoji:'🏪',label:'Ново в Мазето',color:'var(--earth)'},
  build_thread:{emoji:'🔧',label:'Build Thread',color:'var(--green)'},
  event_soon:{emoji:'🏁',label:'Наближава',color:'#6ba4d4'},
  new_member:{emoji:'👋',label:'Нов ездач',color:'#d4a543'}
};
function buildFeed(){
  var items=[];var posts=getForumPosts();var users=getUsers();
  var now=new Date();
  posts.forEach(function(p){
    var rc=Array.isArray(p.replies)?p.replies.length:0;
    var lc=Array.isArray(p.likes)?p.likes.length:0;
    var heat=lc*3+rc*2+1;
    // Time decay
    var daysAgo=Math.max(0,Math.round((now-new Date(p.date))/(1000*60*60*24)));
    heat*=Math.max(0.3,1-(daysAgo*0.1));
    items.push({type:'forum_hot',heat:heat,title:p.title,author:p.author,postId:p.id,replyCount:rc,likeCount:lc,date:p.date,zone:p.zone});
  });
  var listings=getListings().concat(SEED_LISTINGS);
  listings.forEach(function(l){
    var daysAgo=Math.max(0,Math.round((now-new Date(l.date))/(1000*60*60*24)));
    var heat=5+(l.price>0?2:0);
    heat*=Math.max(0.3,1-(daysAgo*0.1));
    items.push({type:'new_listing',heat:heat,title:l.title,author:l.author,listingId:l.id,price:l.price,city:l.city||'',date:l.date});
  });
  // Scan ALL users for build threads, not just hardcoded 3
  Object.keys(users).forEach(function(uid){
    var mods=[];try{mods=JSON.parse(localStorage.getItem('orMods_'+uid)||'[]')}catch(e){}
    mods.forEach(function(m){
      if(m.forumPostId){
        var daysAgo=Math.max(0,Math.round((now-new Date(m.date))/(1000*60*60*24)));
        var heat=8*Math.max(0.3,1-(daysAgo*0.1));
        items.push({type:'build_thread',heat:heat,title:m.title,author:uid,postId:m.forumPostId,date:m.date,system:m.system});
      }
    });
  });
  // Upcoming events — closer date = higher heat
  var today=now.toISOString().split('T')[0];
  getEvents().forEach(function(e){
    if(e.date>=today){
      var daysUntil=Math.max(0,Math.round((new Date(e.date)-now)/(1000*60*60*24)));
      var heat=Math.max(2,10-daysUntil*0.5);
      if(e.registrants>20)heat+=2;
      items.push({type:'event_soon',heat:heat,title:e.title,date:e.date,location:e.location||'',eventId:e.id,registrants:e.registrants||0});
    }
  });
  items.sort(function(a,b){return b.heat-a.heat});
  // Ensure content diversity: pick top items but guarantee at least 1 of each available type
  var result=[];var seenTypes={};var maxItems=12;
  // First pass: top items by heat
  items.forEach(function(item){
    if(result.length>=maxItems)return;
    result.push(item);
    seenTypes[item.type]=true;
  });
  // Second pass: if a type was missed, inject its best item
  var allTypes=['forum_hot','new_listing','event_soon','build_thread'];
  allTypes.forEach(function(t){
    if(seenTypes[t])return;
    var best=null;
    for(var i=0;i<items.length;i++){if(items[i].type===t){best=items[i];break}}
    if(best){result.push(best);seenTypes[t]=true}
  });
  result.sort(function(a,b){return b.heat-a.heat});
  return result;
}
function renderFeed(){
  var container=document.getElementById('dynamicFeed');if(!container)return;
  var items=buildFeed();if(!items.length){container.innerHTML='<div class="empty-state"><div class="empty-state-icon">📰</div><div class="empty-state-title">ВЕСТНИКЪТ Е ПРАЗЕН</div><div class="empty-state-desc">Скоро тук ще кипи живот! Създай тема или публикувай обява.</div><button class="btn btn-o" onclick="go(\'forum\')">Към форума</button></div>';return}
  skeletonThenRender('dynamicFeed','feed',Math.min(items.length,4),function(){
    var users=getUsers();
    container.innerHTML=items.map(function(item,idx){
      var ft=FEED_TYPES[item.type]||FEED_TYPES.forum_hot;
      var author=users[item.author]||{name:'Анонимен',emoji:'👤'};
      var meta='',onclick='',extraBadge='';
      if(item.type==='forum_hot'){
        meta='💬 '+(item.replyCount||0)+' · 👍 '+(item.likeCount||0);
        onclick="location.hash=\'#forum/post/"+item.postId+"\'";
        if(item.zone)extraBadge='<span class="feed-zone-badge">'+escHtml(zoneNames[item.zone]||item.zone)+'</span>';
      }else if(item.type==='new_listing'){
        meta=(item.price?'<span class="feed-price-badge">'+item.price+' лв</span>':'По договаряне')+(item.city?' · 📍 '+escHtml(item.city):'');
        onclick=item.listingId?"location.hash=\'#listing/"+item.listingId+"\'":" go(\'maze\')";
      }else if(item.type==='build_thread'){
        meta='🔧 '+(SYSTEM_ICONS[item.system]?SYSTEM_ICONS[item.system].name:(item.system||''));
        onclick=item.postId?"location.hash=\'#forum/post/"+item.postId+"\'":"go(\'forum\')";
      }else if(item.type==='event_soon'){
        meta='📍 '+escHtml(item.location||'')+(item.registrants?' · '+item.registrants+' записани':'');
        onclick="go(\'events\')";
      }
      var authorHtml='';
      if(item.author){
        authorHtml=userAvatar(author,18)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+item.author+'\')">'+escHtml(author.name)+'</strong> · ';
      }
      var card='<div class="feed-card card-enter" data-enter-delay="'+idx+'" onclick="'+onclick+'"><div class="feed-card-badge" style="background:'+ft.color+'22;color:'+ft.color+'">'+ft.emoji+' '+ft.label+'</div>'+extraBadge+'<div class="feed-card-title">'+escHtml(item.title)+'</div><div class="feed-card-meta">'+authorHtml+meta+' · <span class="time-ago">'+timeAgo(item.date)+'</span></div></div>';
      // "All caught up" divider after 5th item
      if(idx===4&&items.length>5)card+='<div class="caught-up card-enter" data-enter-delay="5"><div class="caught-up-icon">✅</div><div class="caught-up-text">Видя всичко ново</div><div class="caught-up-sub">Можеш да спреш тук или да продължиш надолу</div></div>';
      return card;
    }).join('');
    initCardObserver();
  });
}

// ===== СЪОБЩЕНИЯ =====
function getMessages(key){try{return JSON.parse(localStorage.getItem('orMsg_'+key))||[]}catch(e){return[]}}
function saveMessages(key,msgs){localStorage.setItem('orMsg_'+key,JSON.stringify(msgs))}
function openSendMessage(toUserId){
  if(!getCurrentUser()){toggleAuthModal();return}
  trackProfileClick(toUserId,'message');
  var users=getUsers();var to=users[toUserId]||{name:'Потребител'};
  var modal=document.getElementById('modalContent');
  modal.innerHTML='<div class="msg-compose"><div class="mod-form-title">✉️ СЪОБЩЕНИЕ ДО '+escHtml(to.name).toUpperCase()+'</div><textarea id="msgBody" class="reply-textarea" placeholder="Напиши съобщение..." style="min-height:80px"></textarea><div class="mod-form-actions"><button class="btn btn-o" onclick="sendMessage(\''+toUserId+'\')">Изпрати</button><button class="btn btn-s" onclick="closeModal()">Откажи</button></div></div>';
  document.getElementById('modalBg').classList.add('on');
  setTimeout(function(){var t=document.getElementById('msgBody');if(t)t.focus()},200);
}
function sendMessage(toUserId){
  if(!validateForm([
    {id:'msgBody',rules:[{type:'required',msg:'Напиши съобщение'},{type:'minlength',value:2,msg:'Поне 2 символа'}]}
  ]))return;
  var body=(document.getElementById('msgBody').value||'').trim();
  var user=getCurrentUser();if(!user)return;
  var msg={id:'msg_'+Date.now(),from:user.id,to:toUserId,body:body,date:new Date().toISOString().split('T')[0],time:new Date().toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),read:false};
  var inbox=getMessages(toUserId);inbox.unshift(msg);saveMessages(toUserId,inbox);
  var sent=getMessages(user.id+'_sent');sent.unshift(msg);saveMessages(user.id+'_sent',sent);
  closeModal();showToast('✅ Съобщението е изпратено!','success');updateInboxBadge();
}
function openInbox(tab){
  var user=getCurrentUser();if(!user){toggleAuthModal();return}
  var activeTab=tab||'notif';
  var modal=document.getElementById('modalContent');
  var inbox=getMessages(user.id);var notifs=getNotifications(user.id);var users=getUsers();
  var unreadN=notifs.filter(function(n){return!n.read}).length;
  var unreadM=inbox.filter(function(m){return!m.read}).length;
  var html='<div class="mod-form-title">ВХОДЯЩА КУТИЯ</div>';
  html+='<div class="inbox-tabs">';
  html+='<div class="inbox-tab'+(activeTab==='notif'?' active':'')+'" onclick="openInbox(\'notif\')">🔔 Известия'+(unreadN?' <span class="inbox-tab-count">'+unreadN+'</span>':'')+'</div>';
  html+='<div class="inbox-tab'+(activeTab==='msg'?' active':'')+'" onclick="openInbox(\'msg\')">✉️ Съобщения'+(unreadM?' <span class="inbox-tab-count">'+unreadM+'</span>':'')+'</div>';
  html+='</div>';
  if(activeTab==='notif'){
    if(!notifs.length){
      html+='<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-title">НЯМА ИЗВЕСТИЯ</div><div class="empty-state-desc">Когато някой отговори, реагира или те спомене — ще видиш тук.</div></div>';
    }else{
      notifs.forEach(function(n){
        var from=users[n.from]||{name:'Непознат',emoji:'👤'};
        var icon=n.type==='reply'?'💬':n.type==='mention'?'📢':n.preview==='wrench'?'🔧':n.preview==='thanks'?'🙏':'👍';
        var text='';
        if(n.type==='reply')text='<strong>'+escHtml(from.name)+'</strong> отговори на <strong>'+escHtml(n.postTitle||'')+'</strong>';
        else if(n.type==='reaction'){var emo=n.preview==='like'?'👍':n.preview==='wrench'?'🔧':'🙏';text='<strong>'+escHtml(from.name)+'</strong> реагира '+emo+' на <strong>'+escHtml(n.postTitle||'')+'</strong>'}
        else if(n.type==='mention')text='<strong>'+escHtml(from.name)+'</strong> те спомена в <strong>'+escHtml(n.postTitle||'')+'</strong>';
        html+='<div class="notif-item'+(n.read?'':' unread')+'" onclick="openForumThread(\''+n.postId+'\')">';
        html+='<div class="notif-row"><span class="notif-icon">'+icon+'</span><div class="notif-text">'+text+'</div></div>';
        if(n.type==='reply'&&n.preview)html+='<div class="notif-preview">'+escHtml(n.preview)+'</div>';
        html+='<div class="notif-meta">'+timeAgo(n.date)+(n.time?' · '+n.time:'')+'</div>';
        html+='</div>';
      });
    }
    notifs.forEach(function(n){n.read=true});saveNotifications(user.id,notifs);
  }else{
    if(!inbox.length){
      html+='<div class="empty-state"><div class="empty-state-icon">✉️</div><div class="empty-state-title">ПРАЗНА КУТИЯ</div><div class="empty-state-desc">Входящата ти кутия е празна. Когато някой ти пише, съобщенията ще се появят тук.</div></div>';
    }else{
      inbox.forEach(function(msg){
        var from=users[msg.from]||{name:'Непознат',emoji:'👤'};
        html+='<div class="msg-item'+(msg.read?'':' msg-unread')+'"><div class="msg-item-h"><span>'+userAvatar(from,24)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+msg.from+'\')">'+escHtml(from.name)+'</strong></span><span class="meta time-ago" title="'+escHtml(msg.date)+'">'+timeAgo(msg.date)+(msg.time?' · '+msg.time:'')+'</span></div><div class="msg-item-body">'+escHtml(msg.body)+'</div></div>';
      });
    }
    inbox.forEach(function(m){m.read=true});saveMessages(user.id,inbox);
  }
  modal.innerHTML=html;
  document.getElementById('modalBg').classList.add('on');
  updateInboxBadge();
}
function updateInboxBadge(){
  var badge=document.getElementById('inboxBadge');if(!badge)return;
  var user=getCurrentUser();if(!user){badge.style.display='none';return}
  var inbox=getMessages(user.id);
  var notifs=getNotifications(user.id);
  var unread=inbox.filter(function(m){return!m.read}).length+notifs.filter(function(n){return!n.read}).length;
  badge.textContent=unread;badge.style.display=unread?'':'none';
}
function seedMessages(){
  var uid=getCurrentUserId();if(!uid)return;
  var inbox=getMessages(uid);if(inbox.length>0)return;
  if(uid==='marin'){
    saveMessages('marin',[
      {id:'msg_seed1',from:'ivo',to:'marin',body:'Здравей! Видях обявата ти за пружините XPLOR 5.0. Още ли са налични? Аз съм 92кг, стават ли ми?',date:'2026-03-05',time:'14:30',read:false},
      {id:'msg_seed2',from:'pesho',to:'marin',body:'Марин, ребилдът на вилката е готов за следващия сервиз. Маслото на горната камера трябва да се смени. Обади се за час.',date:'2026-03-04',time:'10:15',read:false}
    ]);
  }
}

// ===== НОТИФИКАЦИИ =====
function getNotifications(uid){try{return JSON.parse(localStorage.getItem('orNotif_'+uid))||[]}catch(e){return[]}}
function saveNotifications(uid,notifs){localStorage.setItem('orNotif_'+uid,JSON.stringify(notifs))}
function addNotification(toUid,notif){
  if(!toUid||toUid===notif.from)return;
  var notifs=getNotifications(toUid);
  notifs.unshift(notif);
  if(notifs.length>50)notifs=notifs.slice(0,50);
  saveNotifications(toUid,notifs);
}
function extractMentions(text){
  var users=getUsers();var found=[];
  var re=/@([\w\u0400-\u04FF]+)/g;var m;
  while((m=re.exec(text))!==null){if(users[m[1]]&&found.indexOf(m[1])===-1)found.push(m[1])}
  return found;
}
function openForumThread(postId){
  closeModal();
  var posts=getForumPosts();
  var post=null;
  for(var i=0;i<posts.length;i++){if(posts[i].id===postId){post=posts[i];break}}
  if(!post){showToast('Темата не е намерена','error');return}
  go('forum');
  enterZone(post.zone);
  setTimeout(function(){
    var el=document.querySelector('[data-post-id="'+postId+'"]');
    if(el){toggleUserThread(postId);el.scrollIntoView({behavior:'smooth',block:'start'})}
  },250);
}
function seedNotifications(){
  var uid=getCurrentUserId();if(!uid)return;
  var notifs=getNotifications(uid);if(notifs.length>0)return;
  if(uid==='marin'){
    saveNotifications('marin',[
      {id:'notif_seed1',type:'reply',from:'pesho',postId:'post_yz250f',postTitle:'Вибрация на 6000 оборота',preview:'Провери контратежестта на коляновия вал...',date:'2026-03-07',time:'16:42',read:false},
      {id:'notif_seed2',type:'reaction',from:'ivo',postId:'post_yz250f',postTitle:'Вибрация на 6000 оборота',preview:'like',date:'2026-03-07',time:'18:10',read:false},
      {id:'notif_seed3',type:'mention',from:'kabakchiev',postId:'post_tpi',postTitle:'EXC 300 TPI — настройки на впръскването',preview:'@marin ти какъв филтър ползваш на...',date:'2026-03-08',time:'09:30',read:false}
    ]);
  }
}

// ===== EVENT REGISTRATION =====
function joinEvent(eventId,btn){
  var user=getCurrentUser();
  if(!user){toggleAuthModal();return}
  var regs=JSON.parse(localStorage.getItem('orEventRegs')||'{}');
  if(!regs[eventId])regs[eventId]=[];
  if(regs[eventId].indexOf(user.id)>-1){showToast('Вече си записан!');return}
  regs[eventId].push(user.id);
  localStorage.setItem('orEventRegs',JSON.stringify(regs));
  // Optimistic: instant button feedback
  if(btn){btn.textContent='✓ Записан!';btn.style.background='var(--green)';btn.style.color='var(--bg)';btn.style.transform='scale(1.05)';btn.onclick=null;setTimeout(function(){btn.style.transform=''},200)}
  showToast('✅ Записан си!','success');
}

function checkEventRegistrations(){
  var uid=getCurrentUserId();if(!uid)return;
  var regs=JSON.parse(localStorage.getItem('orEventRegs')||'{}');
  document.querySelectorAll('[onclick*="joinEvent"]').forEach(function(btn){
    var match=btn.getAttribute('onclick').match(/joinEvent\('([^']+)'/);
    if(match&&regs[match[1]]&&regs[match[1]].indexOf(uid)>-1){
      btn.textContent='✓ Записан!';btn.style.background='var(--green)';btn.style.color='var(--bg)';btn.onclick=null;
    }
  });
}

// ===== ACCOUNT PROMPT =====
function showAccountPrompt(){
  if(getCurrentUser())return;
  var g=document.getElementById('obGreeting');if(!g)return;
  var existing=document.getElementById('accountPrompt');if(existing)return;
  var div=document.createElement('div');div.className='ob-account-prompt';div.id='accountPrompt';
  div.innerHTML='<div class="ob-account-prompt-title">ЗАПАЗИ ПРОГРЕСА СИ</div><div class="ob-account-prompt-sub">Създай акаунт, за да не загубиш гаража и данните си</div><div class="ob-account-prompt-btns"><button class="btn btn-o" onclick="this.closest(\'#accountPrompt\').remove();toggleAuthModal()">Създай акаунт</button><button class="btn btn-s" onclick="this.closest(\'#accountPrompt\').remove()">По-късно</button></div>';
  g.parentElement.insertBefore(div,g.nextSibling);
}

function seedModsDemo(){
  var key='orMods_marin';
  if(localStorage.getItem(key))return;
  var mods=[
    {id:'mod_seed1',bikeIdx:0,system:'suspension',component:'fork',title:'WP XPLOR ребилд + пружини',type:'upgrade',
      parts:[{name:'WP пружини 5.0',from:'motohaus',price:280},{name:'SKF семеринги',from:'motohaus',price:45}],
      installedBy:'pesho',installedByName:'Пешо Механика',cost:680,date:'2026-01',hours:120,note:'По-твърди пружини за 95кг ездач',forumPostId:null,confirmed:true},
    {id:'mod_seed2',bikeIdx:0,system:'electrical',component:'ecu',title:'GET ECU ремап',type:'tune',
      parts:[{name:'GET GPA кит',from:'edimoto_shop',price:320}],
      installedBy:'gosho',installedByName:'Гошо Електро',cost:450,date:'2026-02',hours:140,note:'Power map за ендуро + дъжд',forumPostId:null,confirmed:true},
    {id:'mod_seed3',bikeIdx:0,system:'frame',component:'guards',title:'Пълен пакет предпазители',type:'protection',
      parts:[{name:'Картерна защита AXP',from:'motohaus',price:120},{name:'Протектори ръце Acerbis',from:'motohaus',price:85},{name:'Радиатор грил',from:'motohaus',price:65}],
      installedBy:'self',installedByName:'Сам',cost:270,date:'2025-12',hours:90,note:'Монтаж в гаража за 2 часа',forumPostId:null,confirmed:true}
  ];
  localStorage.setItem(key,JSON.stringify(mods));
}

// ===== HOMEPAGE CONTENT-FIRST =====
function renderHomeStats(){
  var el=document.getElementById('homeStats');if(!el)return;
  skeletonThenRender('homeStats','stats',4,function(){
    var users=getUsers();var posts=getForumPosts();
    var listings=getListings().concat(typeof SEED_LISTINGS!=='undefined'?SEED_LISTINGS:[]);
    var totalReplies=0;posts.forEach(function(p){totalReplies+=(p.replies||[]).length});
    var stats=[
      {n:Object.keys(users).length,l:'Ездачи'},
      {n:posts.length,l:'Теми'},
      {n:totalReplies,l:'Отговора'},
      {n:listings.length,l:'Обяви'}
    ];
    el.innerHTML='<div class="home-stat-grid">'+stats.map(function(s,i){
      return '<div class="home-stat-item card-enter" data-enter-delay="'+i+'"><div class="home-stat-n" data-count="'+s.n+'">0</div><div class="home-stat-l">'+s.l+'</div></div>';
    }).join('')+'</div>';
    el.querySelectorAll('.home-stat-n[data-count]').forEach(function(n){
      animateCounter(n,parseInt(n.dataset.count),600);
    });
    initCardObserver();
  });
}
function renderHomeLatestTopics(){
  var el=document.getElementById('homeLatestTopics');if(!el)return;
  // Skip if feed already shows forum items (avoid duplication)
  var feedEl=document.getElementById('dynamicFeed');
  if(feedEl&&feedEl.children.length>0){el.innerHTML='';return}
  var posts=getForumPosts().slice(0,3);
  if(!posts.length){el.innerHTML='';return}
  skeletonThenRender('homeLatestTopics','topics',3,function(){
    var users=getUsers();
    var html='<div class="home-section-title">💬 ПОСЛЕДНИ ТЕМИ <span class="more" onclick="go(\'forum\')">ВСИЧКИ →</span></div>';
    html+=posts.map(function(p,i){
      var a=users[p.author]||{name:'Анонимен',role:'rider'};
      var typeLabel='';
      if(p.type==='e')typeLabel='📝 ';else if(p.type==='s')typeLabel='✅ ';else if(p.type==='h')typeLabel='🔥 ';else typeLabel='❓ ';
      return '<div class="home-topic-card card-enter" data-enter-delay="'+i+'" onclick="location.hash=\'#forum/post/'+p.id+'\'">'+
        '<div class="home-topic-title">'+typeLabel+escHtml(p.title)+'</div>'+
        '<div class="meta" style="display:flex;align-items:center;gap:4px">'+userAvatar(a,16)+' '+escHtml(a.name)+' · '+timeAgo(p.date)+' · 💬 '+(p.replies||[]).length+'</div>'+
      '</div>';
    }).join('');
    el.innerHTML=html;
    initCardObserver();
  });
}
function renderHomeNewListings(){
  var el=document.getElementById('homeNewListings');if(!el)return;
  // Skip if feed already shows listing items (avoid duplication)
  var feedEl=document.getElementById('dynamicFeed');
  if(feedEl&&feedEl.children.length>0){el.innerHTML='';return}
  var listings=getListings().concat(typeof SEED_LISTINGS!=='undefined'?SEED_LISTINGS:[]).slice(0,6);
  if(!listings.length){el.innerHTML='';return}
  var users=getUsers();
  var html='<div class="home-section-title">🔩 НОВИ ОБЯВИ <span class="more" onclick="go(\'maze\')">ВСИЧКИ →</span></div>';
  html+='<div class="scroll-fade"><div class="home-listings-strip">';
  html+=listings.map(function(l){
    var typeEmoji=l.type==='bike'?'🏍️':l.type==='gear'?'🧤':'⚙️';
    var priceStr=l.price?l.price+' лв':'—';
    return '<div class="home-listing-card" onclick="location.hash=\'#listing/'+l.id+'\'">'+
      '<div class="home-listing-emoji">'+typeEmoji+'</div>'+
      '<div class="home-listing-title">'+escHtml(l.title)+'</div>'+
      '<div class="home-listing-price">'+priceStr+'</div>'+
    '</div>';
  }).join('');
  html+='</div></div>';
  el.innerHTML=html;
}
function renderHomeCta(){
  var el=document.getElementById('homeCta');if(!el)return;
  el.style.display=getCurrentUser()?'none':'';
}
function refreshHome(){renderFeed();renderHomeStats();renderHomeLatestTopics();renderHomeNewListings();renderHomeCta();showFreshnessBanner()}

// ===== CELEBRATION MOMENTS =====
var CONFETTI_COLORS=['#e8622c','#c49a6c','#5a8a3c','#d4943c','#4682b4','#e8e0d4','#b87333'];
function showConfetti(){
  var container=document.createElement('div');container.className='confetti-container';
  for(var i=0;i<40;i++){
    var piece=document.createElement('div');piece.className='confetti-piece';
    piece.style.left=Math.random()*100+'%';
    piece.style.background=CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)];
    piece.style.width=(6+Math.random()*8)+'px';
    piece.style.height=(6+Math.random()*8)+'px';
    piece.style.animationDelay=(Math.random()*1.5)+'s';
    piece.style.animation='confettiFall '+(2+Math.random()*2)+'s ease forwards';
    piece.style.animationDelay=(Math.random()*0.8)+'s';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(function(){container.remove()},5000);
}
function showCelebration(emoji,title,msg){
  showConfetti();
  var el=document.createElement('div');el.className='celebration-toast';
  el.innerHTML='<div class="celebration-emoji">'+emoji+'</div><div class="celebration-title">'+title+'</div><div class="celebration-msg">'+msg+'</div>';
  document.body.appendChild(el);
  setTimeout(function(){el.style.transition='opacity .4s,transform .4s';el.style.opacity='0';el.style.transform='translate(-50%,-50%) scale(.8)';setTimeout(function(){el.remove()},500)},3000);
}

// ===== STREAK SYSTEM =====
function getStreak(uid){
  if(!uid)return{current:0,longest:0,lastActive:null};
  try{return JSON.parse(localStorage.getItem('orStreak_'+uid))||{current:0,longest:0,lastActive:null}}catch(e){return{current:0,longest:0,lastActive:null}}
}
function saveStreak(uid,data){localStorage.setItem('orStreak_'+uid,JSON.stringify(data))}
function updateStreak(){
  var uid=getCurrentUserId();if(!uid)return;
  var streak=getStreak(uid);
  var today=new Date().toISOString().split('T')[0];
  if(streak.lastActive===today)return; // already counted today
  var yesterday=new Date(Date.now()-86400000).toISOString().split('T')[0];
  if(streak.lastActive===yesterday){
    streak.current++;
  }else if(streak.lastActive){
    streak.current=1; // streak broken
  }else{
    streak.current=1; // first visit
  }
  if(streak.current>streak.longest)streak.longest=streak.current;
  streak.lastActive=today;
  saveStreak(uid,streak);
  // Milestone celebrations (depends Step 5)
  if([3,7,14,30].indexOf(streak.current)>-1){
    showCelebration('🔥',streak.current+' ДНИ ПОРЕДНИ!','Не спирай, ездач! Streak-ът расте!');
  }
  renderStreakBadge();
}
function renderStreakBadge(){
  var uid=getCurrentUserId();if(!uid)return;
  var streak=getStreak(uid);
  // Topbar streak
  var topStreak=document.getElementById('topbarStreak');
  if(topStreak){
    if(streak.current>1){
      topStreak.innerHTML='🔥 '+streak.current;
      topStreak.style.display='';
    }else{
      topStreak.style.display='none';
    }
  }
}

// ===== ACTIVITY INDICATORS =====
function simulateReaders(){
  // Add "X четат" to forum threads
  document.querySelectorAll('.ft-user').forEach(function(ft){
    if(ft.querySelector('.reading-count'))return; // already added
    var n=Math.floor(Math.random()*8)+1;
    if(n>3){n=Math.floor(Math.random()*3)+1} // bias towards low numbers
    var rc=document.createElement('span');
    rc.className='reading-count';
    rc.innerHTML='<span class="activity-dot"></span>'+n+' четат';
    var meta=ft.querySelector('.ft-a');
    if(meta)meta.appendChild(document.createTextNode(' · ')),meta.appendChild(rc);
  });
}
function refreshOnlineCount(){
  var el=document.getElementById('onlineN');if(!el)return;
  var base=parseInt(el.textContent)||45;
  var delta=Math.floor(Math.random()*7)-3; // -3 to +3
  var next=Math.max(32,Math.min(68,base+delta));
  el.textContent=next;
}
// Refresh online count periodically
setInterval(refreshOnlineCount,15000);

// ===== ACCUMULATED VALUE DISPLAY =====
function renderAccumulatedValue(userId){
  var posts=getForumPosts();
  var myPosts=posts.filter(function(p){return p.author===userId});
  var myReplies=0;var totalLikes=0;
  posts.forEach(function(p){
    if(Array.isArray(p.replies))p.replies.forEach(function(r){if(r.author===userId)myReplies++});
    if(Array.isArray(p.likes)&&p.likes.indexOf(userId)>-1)totalLikes++;
  });
  var listings=getListings().filter(function(l){return l.author===userId});
  var streak=getStreak(userId);
  var vals=[
    {n:myPosts.length,l:'Теми',e:'📝'},
    {n:myReplies,l:'Отговори',e:'💬'},
    {n:totalLikes,l:'Лайкове',e:'👍'},
    {n:listings.length,l:'Обяви',e:'🔩'},
    {n:streak.longest,l:'Макс Streak',e:'🔥'}
  ];
  var h='<div class="prof-sec"><div class="prof-sec-t">🏆 ТВОЯТ ПРИНОС</div>';
  h+='<div class="value-grid">';
  vals.forEach(function(v){
    h+='<div class="value-item"><div class="value-n">'+v.e+' '+v.n+'</div><div class="value-l">'+v.l+'</div></div>';
  });
  h+='</div></div>';
  return h;
}

// ===== FRESHNESS BANNER =====
function getLastVisit(uid){return localStorage.getItem('orLastVisit_'+uid)||null}
function setLastVisit(uid){localStorage.setItem('orLastVisit_'+uid,new Date().toISOString().split('T')[0])}
function showFreshnessBanner(){
  var uid=getCurrentUserId();if(!uid)return;
  var lastVisit=getLastVisit(uid);
  if(!lastVisit){setLastVisit(uid);return} // first visit ever
  var today=new Date().toISOString().split('T')[0];
  if(lastVisit===today)return; // already visited today
  // Count new items since last visit
  var posts=getForumPosts();
  var listings=getListings().concat(typeof SEED_LISTINGS!=='undefined'?SEED_LISTINGS:[]);
  var newTopics=0,newReplies=0,newListings=0;
  posts.forEach(function(p){
    if(p.date>lastVisit)newTopics++;
    if(Array.isArray(p.replies))p.replies.forEach(function(r){if(r.date>lastVisit)newReplies++});
  });
  listings.forEach(function(l){if(l.date>lastVisit)newListings++});
  var total=newTopics+newReplies+newListings;
  if(total===0){setLastVisit(uid);return}
  var parts=[];
  if(newTopics)parts.push('📝 <strong>'+newTopics+'</strong> нови теми');
  if(newReplies)parts.push('💬 <strong>'+newReplies+'</strong> отговора');
  if(newListings)parts.push('🔩 <strong>'+newListings+'</strong> обяви');
  var banner=document.createElement('div');banner.className='freshness-banner';banner.id='freshnessBanner';
  banner.innerHTML='<div class="freshness-banner-icon">👋</div><div class="freshness-banner-text">Откакто те нямаше: '+parts.join(' · ')+'</div><span class="close-btn" onclick="this.parentElement.remove()">✕</span>';
  // Insert at top of home content
  var homeStats=document.getElementById('homeStats');
  if(homeStats&&homeStats.parentElement){homeStats.parentElement.insertBefore(banner,homeStats)}
  setLastVisit(uid);
}

// ===== BUTTON SUBMIT EFFECT =====
function btnSubmitEffect(btn){
  if(!btn)return;
  btn.classList.add('btn-submitting');
  setTimeout(function(){
    btn.classList.remove('btn-submitting');
    btn.classList.add('btn-success');
    setTimeout(function(){btn.classList.remove('btn-success')},1200);
  },400);
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

function initV10(){
  updateGarageBadge();
  renderHotToday();
  renderForYourBike();
  // toggleThread/toggleThreadV10 no longer needed (all threads are data-driven)
  // Seed service demo data
  seedServiceDemo();
  // Seed mods demo data
  seedModsDemo();
  // Inject credibility badges
  injectCredibilityBadges();
  // Tier display
  refreshTierDisplay();
  // Forum filters
  initForumFilters();
  // Auth system
  seedDemoAccounts();
  seedProfiles();
  refreshAuthUI();
  seedForumDemo();
  renderSavedPosts();
  updateZoneStats();
  renderDynamicListings();
  seedMessages();
  seedNotifications();
  updateInboxBadge();
  updateStreak();
  checkEventRegistrations();
  refreshHome();
  // Handle initial hash on page load
  if(location.hash && location.hash!=='#'){
    handleRoute();
  }
}

initOnboarding();
initV10();
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
