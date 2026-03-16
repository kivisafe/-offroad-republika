// ===== FEED & HOMEPAGE MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar, renderMarkdown)
// Provides: FEED_TYPES, buildFeed, renderFeed, renderHomeStats,
//   renderHomeLatestTopics, renderHomeNewListings, renderHomeCta, refreshHome,
//   simulateReaders, refreshOnlineCount, getLastVisit, setLastVisit, showFreshnessBanner

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
      var freshTag='';if(item.date&&(new Date()-new Date(item.date))<7200000)freshTag='<span class="fresh-badge">нов</span>';
      var card='<div class="feed-card card-enter" data-enter-delay="'+idx+'" onclick="'+onclick+'"><div class="feed-card-badge" style="background:'+ft.color+'22;color:'+ft.color+'">'+ft.emoji+' '+ft.label+'</div>'+extraBadge+freshTag+'<div class="feed-card-title">'+escHtml(item.title)+'</div><div class="feed-card-meta">'+authorHtml+meta+' · <span class="time-ago">'+timeAgo(item.date)+'</span></div></div>';
      // "All caught up" divider after 5th item
      if(idx===4&&items.length>5)card+='<div class="caught-up card-enter" data-enter-delay="5"><div class="caught-up-icon">✅</div><div class="caught-up-text">Видя всичко ново</div><div class="caught-up-sub">Можеш да спреш тук или да продължиш надолу</div></div>';
      return card;
    }).join('');
    initCardObserver();
  });
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
function refreshHome(){renderRegChecklist();renderFeed();renderHomeStats();renderHomeLatestTopics();renderHomeNewListings();renderHomeCta();showFreshnessBanner()}

// ===== REGISTRATION CHECKLIST =====
// Note: All data is from trusted localStorage (user's own data), no external input.
// Labels are hardcoded strings, not user-supplied. Safe for innerHTML in this context.
function renderRegChecklist(){
  var el=document.getElementById('regChecklist');if(!el)return;
  var uid=getCurrentUserId();
  if(!uid){el.innerHTML='';return}
  var clKey='orRegChecklist_'+uid;
  var clData;try{clData=JSON.parse(localStorage.getItem(clKey)||'{}')}catch(e){clData={}}
  if(clData.dismissed){el.innerHTML='';return}
  var user=getCurrentUser();if(!user)return;
  var bp=null;try{bp=JSON.parse(localStorage.getItem('orBizProfile_'+uid))}catch(e){}
  var garage=getGarage();
  var myPosts=getForumPosts().filter(function(p){return p.author===uid});
  var regs=JSON.parse(localStorage.getItem('orEventRegs')||'{}');
  var hasEvent=false;
  Object.keys(regs).forEach(function(k){if(Array.isArray(regs[k])&&regs[k].indexOf(uid)>-1)hasEvent=true});
  var dirVisited=!!localStorage.getItem('orDirVisited_'+uid);
  var items=[
    {done:garage.length>0,label:'Добави мотор в гаража',emoji:'🏍️',action:"go('garage')"},
    {done:!isProfileIncomplete(user,bp),label:'Попълни профила си',emoji:'📝',action:"openProfile('"+escHtml(uid)+"')"},
    {done:myPosts.length>0,label:'Създай първата си тема',emoji:'💬',action:"go('forum')"},
    {done:dirVisited,label:'Разгледай Директорията',emoji:'📋',action:"go('dir')"},
    {done:hasEvent,label:'Присъедини се към събитие',emoji:'🏁',action:"go('events')"}
  ];
  var doneCount=items.filter(function(i){return i.done}).length;
  if(doneCount===items.length){el.innerHTML='';return}
  var pct=Math.round(doneCount/items.length*100);
  var html='<div class="reg-checklist card-enter"><div class="reg-checklist-header"><div class="reg-checklist-title">ПЪРВИ СТЪПКИ ('+doneCount+'/'+items.length+')</div><span class="reg-checklist-dismiss" onclick="dismissRegChecklist()">Скрий</span></div>';
  html+='<div class="reg-check-progress"><div class="reg-check-bar" style="width:'+pct+'%"></div></div>';
  items.forEach(function(item){
    html+='<div class="reg-check-item'+(item.done?' done':'')+'"'+(item.done?'':' onclick="'+item.action+'"')+'><div class="reg-check-icon">'+(item.done?'✓':item.emoji)+'</div><div class="reg-check-label">'+item.label+'</div>'+(item.done?'':'<span class="reg-check-go">→</span>')+'</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}
function dismissRegChecklist(){
  var uid=getCurrentUserId();if(!uid)return;
  localStorage.setItem('orRegChecklist_'+uid,JSON.stringify({dismissed:true}));
  var el=document.getElementById('regChecklist');if(el)el.innerHTML='';
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
