// ===== SOCIAL MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar, validateForm)
// Also uses globals from app.js: getCurrentUser, getCurrentUserId, getUsers, toggleAuthModal,
//   closeModal, go, openProfile, getBizProfile, saveBizProfile
// Also uses from forum.js: getForumPosts, enterZone, toggleUserThread
// Also uses from business.js: trackProfileClick

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
        var icon=n.type==='reply'?'💬':n.type==='mention'?'📢':n.type==='intel'?'📡':n.preview==='wrench'?'🔧':n.preview==='thanks'?'🙏':'👍';
        var text='';
        if(n.type==='reply')text='<strong>'+escHtml(from.name)+'</strong> отговори на <strong>'+escHtml(n.postTitle||'')+'</strong>';
        else if(n.type==='reaction'){var emo=n.preview==='like'?'👍':n.preview==='wrench'?'🔧':'🙏';text='<strong>'+escHtml(from.name)+'</strong> реагира '+emo+' на <strong>'+escHtml(n.postTitle||'')+'</strong>'}
        else if(n.type==='mention')text='<strong>'+escHtml(from.name)+'</strong> те спомена в <strong>'+escHtml(n.postTitle||'')+'</strong>';
        else if(n.type==='intel')text='Нова тема по твоите тагове: <strong>'+escHtml(n.postTitle||'')+'</strong>';
        html+='<div class="notif-item'+(n.read?'':' unread')+'" onclick="openForumThread(\''+n.postId+'\')">';
        html+='<div class="notif-row"><span class="notif-icon">'+icon+'</span><div class="notif-text">'+text+'</div></div>';
        if((n.type==='reply'||n.type==='intel')&&n.preview)html+='<div class="notif-preview">'+escHtml(n.preview)+'</div>';
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
        var isIntel=msg.type==='intel_respond';
        var extraCls=isIntel?' msg-intel':'';
        var bodyHtml='';
        if(isIntel){
          // Rich render for intel responses — parse lines for links
          bodyHtml=escHtml(msg.body).replace(/🔗\s*(https?:\/\/\S+)/g,'🔗 <a href="$1" target="_blank" class="intel-link">$1</a>');
          bodyHtml=bodyHtml.replace(/\n/g,'<br>');
        }else{
          bodyHtml=escHtml(msg.body);
        }
        var clickPost=isIntel&&msg.postId?' onclick="openForumThread(\''+msg.postId+'\')"':'';
        html+='<div class="msg-item'+(msg.read?'':' msg-unread')+extraCls+'"><div class="msg-item-h"><span>'+userAvatar(from,24)+' <strong class="link" onclick="event.stopPropagation();openProfile(\''+msg.from+'\')">'+escHtml(from.name)+'</strong>'+(isIntel?' <span class="intel-msg-badge">'+(from.role==='mechanic'?'🔧 Майстор':'📦 Магазин')+'</span>':'')+'</span><span class="meta time-ago" title="'+escHtml(msg.date)+'">'+timeAgo(msg.date)+(msg.time?' · '+msg.time:'')+'</span></div><div class="msg-item-body"'+clickPost+'>'+bodyHtml+'</div></div>';
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
function seedBizSubscriptions(){
  // Seed tag subscriptions for demo business/mechanic users
  var seeds={
    pesho:['окачване','wp','showa','вибрация','сервиз'],
    motohaus:['части','окачване','wp','масла','филтри'],
    edimoto_shop:['ktm','нов мотор','дилър','exc','husqvarna'],
    gosho:['гуми','окачване','вериги','спирачки'],
    elilison:['ендуро','тренировка','техника','начинаещ']
  };
  Object.keys(seeds).forEach(function(uid){
    var bp=getBizProfile(uid);
    if(!bp)return;
    if(bp.subscribedTags&&bp.subscribedTags.length)return;
    bp.subscribedTags=seeds[uid];
    saveBizProfile(uid,bp);
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
