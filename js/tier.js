// ===== tier.js =====
// Tier/rank system, confetti celebrations, streak tracking
//
// Dependencies (must be loaded before this file):
//   core.js   — (no direct deps, but tier functions are called from many places)
//   auth.js   — getCurrentUserId, getCurrentUser, renderRoleBadge
//   garage.js — getGarage, getServiceLog, getMods (used by calculateTierScore)
//
// Globals defined here:
//   TIERS, TIER_ORDER,
//   calculateTierScore, calculateTier, tierInfo, getTierHints,
//   renderTierBadge, renderTierProgress,
//   _lastTierKey, refreshTierDisplay,
//   calcTierForUser,
//   CONFETTI_COLORS, showConfetti, showCelebration,
//   getStreak, saveStreak, updateStreak, renderStreakBadge
// ==========================================================================

var TIERS={
  n:{name:'\u041D\u043E\u0432\u043E\u0431\u0440\u0430\u043D\u0435\u0446',emoji:'\uD83D\uDFE4',minScore:0,color:'#8b5a2b',css:'lv-n'},
  m:{name:'\u041C\u0435\u0440\u0430\u043A\u043B\u0438\u044F',emoji:'\uD83D\uDFE0',minScore:25,color:'var(--orange)',css:'lv-m'},
  p:{name:'\u041F\u0440\u0430\u043A\u0442\u0438\u043A',emoji:'\uD83D\uDD35',minScore:55,color:'#4682b4',css:'lv-p'},
  v:{name:'\u0412\u0435\u0442\u0435\u0440\u0430\u043D',emoji:'\uD83D\uDFE4',minScore:90,color:'var(--earth)',css:'lv-v'},
  l:{name:'\u041B\u0435\u0433\u0435\u043D\u0434\u0430',emoji:'\uD83D\uDFE1',minScore:130,color:'#e8aa2c',css:'lv-l'}
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
    if(bikes.length<2)hints.push('\u0414\u043E\u0431\u0430\u0432\u0438 \u043C\u043E\u0442\u043E\u0440 \u0432 \u0433\u0430\u0440\u0430\u0436\u0430 (+5)');
    var totalMonths=0;bikes.forEach(function(b){totalMonths+=(b.months||0);});
    if(totalMonths<12)hints.push('\u041F\u043E\u043F\u044A\u043B\u043D\u0438 \u043C\u0435\u0441\u0435\u0446\u0438 \u043E\u043F\u0438\u0442 \u043D\u0430 \u043C\u043E\u0442\u043E\u0440\u0430');
    var log=getServiceLog();
    if(log.length<5)hints.push('\u0417\u0430\u043F\u0438\u0448\u0438 \u0441\u0435\u0440\u0432\u0438\u0437\u043D\u0438 \u0437\u0430\u043F\u0438\u0441\u0438 (+2 \u043D\u0430 \u0437\u0430\u043F\u0438\u0441)');
    var makes={};bikes.forEach(function(b){if(b.make)makes[b.make]=1;});
    if(Object.keys(makes).length<=1&&bikes.length>0)hints.push('\u0414\u043E\u0431\u0430\u0432\u0438 \u043C\u043E\u0442\u043E\u0440 \u043E\u0442 \u0434\u0440\u0443\u0433\u0430 \u043C\u0430\u0440\u043A\u0430 (+3)');
    var mods=getMods();
    if(mods.length<1)hints.push('\u0417\u0430\u043F\u0438\u0448\u0438 \u043C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F (+3)');
    else{var hasThread=false;mods.forEach(function(m){if(m.forumPostId)hasThread=true});if(!hasThread)hints.push('\u0421\u044A\u0437\u0434\u0430\u0439 build thread \u0437\u0430 \u043C\u043E\u0434 (+2)');}
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
  h+='<div class="tier-labels"><span>'+info.tier.name+' \u00B7 '+info.score+' pts</span>';
  if(info.nextTier)h+='<span class="tier-next">\u2192 '+info.nextTier.name+' ('+info.nextTier.minScore+')</span>';
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
    if(tierObj)showCelebration(tierObj.emoji,'\u0420\u0410\u041D\u0413: '+tierObj.name.toUpperCase()+'!','\u041F\u0440\u043E\u0434\u044A\u043B\u0436\u0430\u0432\u0430\u0439 \u043D\u0430\u043F\u0440\u0435\u0434, \u0435\u0437\u0434\u0430\u0447!');
  }
  _lastTierKey=info.key;
  var gm=document.getElementById('obGreetMsg');
  if(gm){
    var user=getCurrentUser();
    var garage=getGarage();
    var bikeText=(garage.length>0&&garage[0].make)?(' \u00B7 '+garage[0].make+' '+(garage[0].model||'')):'';
    gm.innerHTML=renderTierBadge(info.key)+(user?renderRoleBadge(user.role):'')+bikeText;
  }
  var gtb=document.getElementById('garageTierBadge');
  if(gtb)gtb.innerHTML=renderTierBadge(info.key);
}

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
    showCelebration('\uD83D\uDD25',streak.current+' \u0414\u041D\u0418 \u041F\u041E\u0420\u0415\u0414\u041D\u0418!','\u041D\u0435 \u0441\u043F\u0438\u0440\u0430\u0439, \u0435\u0437\u0434\u0430\u0447! Streak-\u044A\u0442 \u0440\u0430\u0441\u0442\u0435!');
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
      topStreak.innerHTML='\uD83D\uDD25 '+streak.current;
      topStreak.style.display='';
    }else{
      topStreak.style.display='none';
    }
  }
}
