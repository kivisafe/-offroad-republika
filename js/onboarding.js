// ===== onboarding.js =====
// Onboarding ritual flow, archetypes, user path, report system, new topic handler
//
// Dependencies (must be loaded before this file):
//   core.js   — escHtml, showToast
//   auth.js   — getCurrentUser, getCurrentUserId, toggleAuthModal, showAccountPrompt
//   tier.js   — TIERS, tierInfo, renderTierBadge, renderTierProgress, refreshTierDisplay, showCelebration
//   garage.js — getGarage
//   forum.js  — showNewTopicForm (referenced by handleNewTopic)
//
// Globals defined here:
//   ARCHETYPES, _obArchetype, _obBikeAdded,
//   getUserType, initOnboarding, applyUserPath, applyNewbiePath,
//   obNext, obSelectArchetype, obAddBike, obSkipBike, populateCeremony,
//   obFinish, showGreeting, obReset, reportPost, handleNewTopic
// ==========================================================================

var ARCHETYPES={
  wolf:{emoji:'\uD83D\uDC3A',name:'\u041F\u043B\u0430\u043D\u0438\u043D\u0441\u043A\u0438\u044F\u0442 \u0432\u044A\u043B\u043A',desc:'\u0425\u0430\u0440\u0434 \u0435\u043D\u0434\u0443\u0440\u043E \u00B7 \u0441\u0430\u043C\u043E\u0442\u043D\u0438\u043A'},
  wanderer:{emoji:'\uD83C\uDF32',name:'\u0413\u043E\u0440\u0441\u043A\u0438\u044F\u0442 \u0441\u043A\u0438\u0442\u043D\u0438\u043A',desc:'\u0415\u043D\u0434\u0443\u0440\u043E \u00B7 \u0442\u0440\u0435\u0439\u043B\u043E\u0432\u0435'},
  warrior:{emoji:'\uD83D\uDCA7',name:'\u041A\u0430\u043B\u043D\u0438\u044F\u0442 \u0432\u043E\u0438\u043D',desc:'\u041C\u043E\u0442\u043E\u043A\u0440\u043E\u0441 \u00B7 \u043F\u0438\u0441\u0442\u0430'},
  demon:{emoji:'\u26A1',name:'\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u043D\u0438\u044F\u0442 \u0434\u0435\u043C\u043E\u043D',desc:'\u0420\u0430\u043B\u0438 \u00B7 \u0441\u043A\u043E\u0440\u043E\u0441\u0442'},
  traveler:{emoji:'\uD83D\uDDFA\uFE0F',name:'\u041F\u044A\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0435\u043D\u0438\u043A\u044A\u0442',desc:'ADV \u00B7 \u0442\u0443\u0440\u043E\u0432\u0435'}
};

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
      showToast('\uD83C\uDFC6 \u0422\u0435\u043C\u0430\u0442\u0430 \u043D\u0430 \u041F\u0435\u0448\u043E \u041C\u0435\u0445\u0430\u043D\u0438\u043A\u0430 \u0432\u043B\u0435\u0437\u0435 \u0432 \u0421\u0443\u0442\u0440\u0435\u0448\u043D\u0438\u044F \u0432\u0435\u0441\u0442\u043D\u0438\u043A! \u041F\u0440\u043E\u0447\u0435\u0442\u0435\u043D\u0430 \u043E\u0442 1,247 \u0435\u0437\u0434\u0430\u0447\u0430.','success');
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
    hint.innerHTML='\uD83D\uDC46 \u0417\u0430\u043F\u043E\u0447\u043D\u0438 \u043E\u0442 <strong style="cursor:pointer" onclick="go(\'forum\')">\u0424\u043E\u0440\u0443\u043C / \u041F\u043E\u0445\u0432\u0430\u0442\u0438</strong> \u2192 \u0413\u0430\u0440\u0430\u0436\u044A\u0442 <span class="hint-close" onclick="this.parentElement.remove();localStorage.setItem(\'orNavHintSeen\',\'1\')">\u2715</span>';
    var nav=document.getElementById('nav');
    if(nav) nav.parentElement.insertBefore(hint, nav.nextSibling);
  }

  // 2. Add tooltips to nav tabs
  var tipTexts={
    home:'\u0421\u0443\u0442\u0440\u0435\u0448\u0435\u043D \u0432\u0435\u0441\u0442\u043D\u0438\u043A \u2014 \u043D\u043E\u0432\u0438\u043D\u0438, \u0442\u0435\u043C\u0438, \u0438\u0441\u0442\u043E\u0440\u0438\u0438',
    dir:'\u041D\u0430\u043C\u0435\u0440\u0438 \u0432\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u0430\u043D \u043C\u0430\u0439\u0441\u0442\u043E\u0440 \u0438\u043B\u0438 \u043C\u0430\u0433\u0430\u0437\u0438\u043D',
    forum:'\u041F\u0438\u0442\u0430\u0439. \u0412\u0441\u0438\u0447\u043A\u0438 \u0441\u043C\u0435 \u043C\u0438\u043D\u0430\u043B\u0438 \u043E\u0442\u0442\u0443\u043A.',
    maze:'\u041D\u0430\u043C\u0435\u0440\u0438 \u043F\u044A\u0440\u0432\u0438\u044F \u0441\u0438 \u043C\u043E\u0442\u043E\u0440 \u0438\u043B\u0438 \u0447\u0430\u0441\u0442\u0438',
    academy:'\u0417\u0430\u043F\u0438\u0448\u0438 \u0441\u0435 \u043D\u0430 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430 \u0441 \u0438\u0441\u0442\u0438\u043D\u0441\u043A\u0438 \u0442\u0440\u0435\u043D\u044C\u043E\u0440',
    events:'\u0412\u0438\u0436 \u043A\u043E\u0433\u0430 \u0438 \u043A\u044A\u0434\u0435 \u043A\u0430\u0440\u0430\u0442 \u0445\u043E\u0440\u0430\u0442\u0430'
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
    naruchnik.innerHTML='<div class="newbie-naruchnik-title">\uD83D\uDCD6 \u041D\u0410\u0420\u042A\u0427\u041D\u0418\u041A \u041D\u0410 \u041D\u041E\u0412\u041E\u0411\u0420\u0410\u041D\u0415\u0426\u0410</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px"><div class="fhb-item" onclick="go(\'maze\')">\uD83C\uDFCD\uFE0F \u041A\u0430\u043A \u0434\u0430 \u0438\u0437\u0431\u0435\u0440\u0430 \u043F\u044A\u0440\u0432\u0438 \u043C\u043E\u0442\u043E\u0440</div><div class="fhb-item" onclick="openProfile(\'pesho\')">\uD83D\uDD27 \u041D\u0430\u043C\u0435\u0440\u0438 \u043C\u0435\u0445\u0430\u043D\u0438\u043A \u0431\u043B\u0438\u0437\u043E \u0434\u043E \u0442\u0435\u0431</div><div class="fhb-item" onclick="openProfile(\'manolov\')">\uD83C\uDFC5 \u0417\u0430\u043F\u0438\u0448\u0438 \u0441\u0435 \u043D\u0430 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430</div><div class="fhb-item" onclick="go(\'events\')">\uD83D\uDDFA\uFE0F \u041F\u044A\u0440\u0432\u043E \u043A\u0430\u0440\u0430\u043D\u0435 \u2014 \u043A\u044A\u0434\u0435 \u0438 \u0441 \u043A\u043E\u0433\u043E</div></div>';
    feedGrid.insertBefore(naruchnik, feedGrid.firstChild);

    var trainers=document.createElement('div');
    trainers.className='fc fc-full';
    trainers.style.borderLeft='3px solid var(--green)';
    trainers.innerHTML='<div class="fc-h"><div class="ava" style="background:rgba(90,138,60,.15)">\uD83C\uDFC5</div><div><span class="fc-n" style="color:var(--green)">\u041F\u0420\u0415\u041F\u041E\u0420\u042A\u0427\u0410\u041D\u0418 \u0422\u0420\u0415\u041D\u042C\u041E\u0420\u0418</span><div class="meta">\u0417\u0430 \u043D\u043E\u0432\u0438 \u0435\u0437\u0434\u0430\u0447\u0438</div></div></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px"><div class="garage-item" onclick="openProfile(\'manolov\')"><span>\uD83C\uDFC5</span><span>\u0422\u0440\u0435\u043D\u044C\u043E\u0440 \u041C\u0430\u043D\u043E\u043B\u043E\u0432 \u2014 \u0412\u0441\u0438\u0447\u043A\u0438 \u043D\u0438\u0432\u0430</span><span class="garage-heat" style="color:var(--green)">\u2605 5.0</span></div><div class="garage-item" onclick="go(\'academy\')"><span>\uD83C\uDFCD\uFE0F</span><span>\u041C\u043E\u0442\u043E \u0410\u043A\u0430\u0434\u0435\u043C\u0438\u044F \u2014 \u041D\u043E\u0432\u0438 \u0425\u0430\u043D</span><span class="garage-heat" style="color:var(--green)">\u2192</span></div></div>';
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
    if(bc){bc.classList.add('done');bc.querySelector('.ob-chk').textContent='\u2713';}
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
  var ge=document.getElementById('obGreetEmoji');if(ge)ge.textContent=user?user.emoji:(arch?arch.emoji:'\uD83C\uDFCD\uFE0F');
  var gn=document.getElementById('obGreetName');
  if(gn){
    var roleTitles={business:'\u0411\u0438\u0437\u043D\u0435\u0441 \u043F\u0430\u0440\u0442\u043D\u044C\u043E\u0440',mechanic:'\u041C\u0430\u0439\u0441\u0442\u043E\u0440',trainer:'\u0422\u0440\u0435\u043D\u044C\u043E\u0440'};
    var subtitle=arch?arch.name:(user&&roleTitles[user.role]?roleTitles[user.role]:'');
    gn.textContent=user?user.name+(subtitle?' \u00B7 '+subtitle:''):(arch?arch.name:'');
  }
  var gm=document.getElementById('obGreetMsg');
  if(gm){
    var info=tierInfo();
    var garage=getGarage();
    var bikeText=(garage.length>0&&garage[0].make)?(' \u00B7 '+garage[0].make+' '+(garage[0].model||'')):'';
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
  el.textContent='\u2713 \u041F\u0440\u0430\u0442\u0435\u043D\u043E';
  el.style.color='var(--green)';
  el.style.opacity='1';
  el.onclick=null;
  showToast('\uD83D\uDCE8 \u0421\u0438\u0433\u043D\u0430\u043B\u044A\u0442 \u0435 \u043F\u0440\u0430\u0442\u0435\u043D \u0434\u043E 3 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u0438 \u0447\u043B\u0435\u043D\u0430 \u0437\u0430 \u043F\u0440\u0435\u0433\u043B\u0435\u0434. \u041E\u0431\u0449\u043D\u043E\u0441\u0442\u0442\u0430 \u0440\u0435\u0448\u0430\u0432\u0430.','success');
}

// ===== NEW TOPIC WITH ZONE =====
function handleNewTopic(){
  if(!getCurrentUser()){toggleAuthModal();return}
  var zone=document.getElementById('newTopicZone');
  // Auto-select current zone if inside one
  if(zone&&!zone.value&&enterZone._current){zone.value=enterZone._current}
  if(!zone||!zone.value){showToast('\u26A0\uFE0F \u0418\u0437\u0431\u0435\u0440\u0438 \u0437\u043E\u043D\u0430 \u043F\u0440\u0435\u0434\u0438 \u0434\u0430 \u0441\u044A\u0437\u0434\u0430\u0434\u0435\u0448 \u0442\u0435\u043C\u0430!');return}
  showNewTopicForm(zone.value);
}
