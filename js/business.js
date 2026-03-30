// ===== BUSINESS MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar, validateForm)
// Also uses globals from app.js: getCurrentUser, getCurrentUserId, getUsers, getGarage, openProfile,
//   renderTierBadge, calcTierForUser, closeModal, getBizProfile, saveBizProfile
// Also uses from forum.js: getForumPosts
// Also uses from social.js: getMessages, saveMessages, addNotification, getNotifications, updateInboxBadge

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

// ===== V10: BUSINESS DATA =====
var businessData={
  motohaus:{name:'МотоХаус',icon:'🏪',type:'shop',city:'Нови хан',models:['yamaha','yz250f','yz125','wr450f'],tags:['части','окачване','wp','масла'],offers:[{title:'WP XPLOR Ревизия',price:'350 лв',desc:'Смяна масло + семеринги + настройка'},{title:'Yamaha OEM части -10%',price:'от 15 лв',desc:'Всички оригинални части Yamaha'}]},
  pesho:{name:'Пешо Механика',icon:'🔧',type:'mechanic',city:'Пловдив',models:['yamaha','yz250f','ktm','exc','husqvarna'],tags:['ремонт','окачване','двигател','вибрация','контратежест'],offers:[{title:'Инспекция при покупка',price:'80 лв',desc:'Пълен преглед + писмено становище'},{title:'Ревизия окачване',price:'от 120 лв',desc:'Предно/задно, всички марки'}]},
  edimoto_shop:{name:'EdiMoto',icon:'🏍️',type:'dealer',city:'София',models:['ktm','exc','husqvarna','fe','te','gasgas'],tags:['нов мотор','дилър','гаранция','конверсионен кит'],offers:[{title:'KTM EXC 2026 наличен',price:'от 24 900 лв',desc:'Фабрична гаранция 2г'},{title:'Конверсионен кит EXC→6Days',price:'2 800 лв',desc:'Пълен кит с монтаж'}]},
  gosho:{name:'Гошо Електро',icon:'⚡',type:'specialist',city:'Пловдив',models:['fantic','xef','euro5','ecu'],tags:['електрика','ecu','ремап','диагностика'],offers:[{title:'ECU диагностика',price:'60 лв',desc:'Пълно сканиране + доклад'}]},
  elilison:{name:'Ели Лисън',icon:'🧤',type:'shop',city:'София',models:['*'],tags:['екипировка','каска','ботуши','протектори','alpinestars','fox'],offers:[{title:'Alpinestars Tech 7 -15%',price:'680 лв',desc:'Всички размери на склад'}]}
};

// ===== NEWBIE HUB: BUSINESSES NEAR USER =====
function getBusinessesNearUser(userId){
  var users=getUsers();var user=users[userId];
  var userCity=(user&&user.city||'').toLowerCase().trim();
  var results=[];
  Object.keys(businessData).forEach(function(key){
    var biz=businessData[key];
    var bizCity=(biz.city||'').toLowerCase().trim();
    var bp=null;try{bp=JSON.parse(localStorage.getItem('orBizProfile_'+key))}catch(e){}
    var bpCity=bp&&bp.city?(bp.city).toLowerCase().trim():'';
    var city=bpCity||bizCity;
    var near=userCity&&city&&(city.indexOf(userCity)>-1||userCity.indexOf(city)>-1);
    results.push({key:key,biz:biz,city:biz.city||(bp&&bp.city)||'',near:near,bp:bp});
  });
  results.sort(function(a,b){return(b.near?1:0)-(a.near?1:0)});
  return results;
}

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
  var today=new Date().toISOString().split('T')[0];
  // Safe: all dynamic values are from trusted localStorage + seed data, escaped with escHtml
  container.innerHTML=offers.map(function(o){
    var hasUrl=o.url&&o.url.indexOf('http')===0;
    var isExpired=o.expiry&&o.expiry<today;
    var isInactive=o.active===false;
    var cls=isExpired||isInactive?'offer-expired':'';
    return '<div class="prof-item '+cls+'" style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">'
      +'<strong>'+(hasUrl?'<a href="'+escHtml(o.url)+'" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none">'+escHtml(o.title)+' ↗</a>':escHtml(o.title))+'</strong>'
      +'<span class="price-s">'+escHtml(o.price)+'</span></div>'
      +(isExpired?'<div style="font:500 9px \'JetBrains Mono\',monospace;color:#e85454;margin-top:2px">ИЗТЕКЛА</div>':'')
      +(isInactive?'<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--text2);margin-top:2px">НЕАКТИВНА</div>':'')
      +'<div class="meta" style="margin-top:4px">'+escHtml(o.desc)+'</div></div>';
  }).join('');
}

// ===== BUSINESS INTEL =====
function getAllTags(){
  var tags={};
  getForumPosts().forEach(function(p){
    if(Array.isArray(p.tags))p.tags.forEach(function(t){tags[t.toLowerCase()]=t});
  });
  Object.keys(businessData).forEach(function(k){
    businessData[k].tags.forEach(function(t){tags[t.toLowerCase()]=t});
  });
  return Object.keys(tags).map(function(k){return tags[k]});
}
function trackTagSearch(tag){
  if(!tag)return;
  var key=tag.toLowerCase();
  try{var d=JSON.parse(localStorage.getItem('orTagSearch'))||{}}catch(e){var d={}}
  d[key]=(d[key]||0)+1;
  localStorage.setItem('orTagSearch',JSON.stringify(d));
}
function getTagSearchStats(){
  try{return JSON.parse(localStorage.getItem('orTagSearch'))||{}}catch(e){return{}}
}
function notifySubscribedBusinesses(tags,postId,postTitle,authorId){
  if(!tags||!tags.length)return;
  var users=getUsers();
  var tagsLower=tags.map(function(t){return t.toLowerCase()});
  Object.keys(users).forEach(function(uid){
    var u=users[uid];
    if(u.role!=='business'&&u.role!=='mechanic')return;
    if(uid===authorId)return;
    var bp=getBizProfile(uid)||{};
    var subs=bp.subscribedTags||[];
    if(!subs.length)return;
    var matched=subs.filter(function(s){return tagsLower.indexOf(s.toLowerCase())>-1});
    if(matched.length){
      addNotification(uid,{
        id:'notif_intel_'+Date.now()+'_'+uid,
        type:'intel',
        from:authorId||'system',
        postId:postId,
        postTitle:(postTitle||'').substring(0,50),
        preview:'Тагове: #'+matched.join(' #'),
        date:new Date().toISOString().split('T')[0],
        time:new Date().toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),
        read:false
      });
    }
  });
}
function renderBizIntel(userId){
  var bp=getBizProfile(userId)||{};
  var subs=bp.subscribedTags||[];
  if(!subs.length)return '';
  var posts=getForumPosts();
  var searchStats=getTagSearchStats();
  var now=new Date();var weekAgo=new Date(now);weekAgo.setDate(weekAgo.getDate()-7);
  var weekStr=weekAgo.toISOString().split('T')[0];
  // Tag activity — count posts per subscribed tag (last 7 days)
  var tagActivity=[];
  subs.forEach(function(tag){
    var tl=tag.toLowerCase();
    var count=0;var lastPost=null;
    posts.forEach(function(p){
      if(!Array.isArray(p.tags))return;
      var match=p.tags.some(function(pt){return pt.toLowerCase()===tl});
      if(match){
        if(p.date>=weekStr)count++;
        if(!lastPost||p.date>lastPost.date)lastPost=p;
      }
    });
    tagActivity.push({tag:tag,count:count,lastPost:lastPost,searches:searchStats[tl]||0});
  });
  // Hot topics — posts matching subscribed tags, sorted by replies+reactions
  var hotTopics=[];
  var subsLower=subs.map(function(s){return s.toLowerCase()});
  posts.forEach(function(p){
    if(!Array.isArray(p.tags))return;
    var match=p.tags.some(function(pt){return subsLower.indexOf(pt.toLowerCase())>-1});
    if(!match)return;
    var replyCount=Array.isArray(p.replies)?p.replies.length:0;
    var rxCount=0;
    if(p.reactions){Object.keys(p.reactions).forEach(function(k){rxCount+=(Array.isArray(p.reactions[k])?p.reactions[k].length:0)})}
    hotTopics.push({post:p,score:replyCount*2+rxCount});
  });
  hotTopics.sort(function(a,b){return b.score-a.score});
  hotTopics=hotTopics.slice(0,5);
  // Render
  var h='<div class="prof-sec intel-section"><div class="prof-sec-t">📡 INTEL DASHBOARD</div>';
  // Subscribed tags with activity
  h+='<div class="intel-tags-grid">';
  tagActivity.forEach(function(ta){
    h+='<div class="intel-tag">';
    h+='<span class="hashtag">#'+escHtml(ta.tag)+'</span>';
    if(ta.count)h+=' <span class="intel-badge">'+ta.count+' нови</span>';
    if(ta.searches)h+=' <span class="intel-search-badge">🔍'+ta.searches+'</span>';
    h+='</div>';
  });
  h+='</div>';
  // Hot topics
  if(hotTopics.length){
    h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:10px 0 6px">🔥 ГОРЕЩИ ТЕМИ</div>';
    var users=getUsers();
    var myRole=(users[userId]||{}).role||'business';
    var btnLabel=myRole==='mechanic'?'🔧 МОГА ДА ПОМОГНА':'📦 ИМАМЕ ГО!';
    hotTopics.forEach(function(ht){
      var p=ht.post;
      var replyCount=Array.isArray(p.replies)?p.replies.length:0;
      h+='<div class="intel-hot">';
      h+='<div class="intel-hot-title" onclick="openForumThread(\''+p.id+'\')">'+escHtml(p.title)+'</div>';
      h+='<div class="intel-hot-meta">💬'+replyCount+' · ';
      if(Array.isArray(p.tags))h+=p.tags.map(function(t){return'#'+escHtml(t)}).join(' ');
      h+=' · '+timeAgo(p.date)+'</div>';
      h+='<button class="intel-respond-btn" onclick="event.stopPropagation();openIntelRespond(\''+p.id+'\',\''+escHtml(p.author)+'\',\''+escHtml((p.title||'').replace(/'/g,''))+'\')">'+btnLabel+'</button>';
      h+='</div>';
    });
  }
  // Search demand
  var demandTags=tagActivity.filter(function(ta){return ta.searches>0}).sort(function(a,b){return b.searches-a.searches});
  if(demandTags.length){
    h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:10px 0 6px">📊 ТЪРСЕНЕ (DEMAND)</div>';
    var maxS=demandTags[0].searches;
    demandTags.forEach(function(dt){
      var pct=Math.max(8,Math.round(dt.searches/maxS*100));
      h+='<div class="intel-demand"><span class="intel-demand-tag">#'+escHtml(dt.tag)+'</span><div class="intel-demand-bar"><div class="intel-demand-fill" style="width:'+pct+'%"></div></div><span class="intel-demand-n">'+dt.searches+'</span></div>';
    });
  }
  h+='</div>';
  return h;
}


// ===== INTEL RESPOND (ИМАМЕ ГО / МОГА ДА ПОМОГНА) =====
function openIntelRespond(postId,authorId,postTitle){
  var user=getCurrentUser();if(!user)return;
  var users=getUsers();
  var author=users[authorId]||{name:'Непознат'};
  var isMech=user.role==='mechanic';
  var modal=document.getElementById('modalContent');
  var html='<div class="mod-form-title">'+(isMech?'🔧 МОГА ДА ПОМОГНА':'📦 ИМАМЕ ГО!')+'</div>';
  html+='<div style="font:400 12px \'Exo 2\',sans-serif;color:var(--text2);margin-bottom:10px">Относно: <strong>'+escHtml(postTitle)+'</strong><br>До: <strong>'+escHtml(author.name)+'</strong></div>';
  if(!isMech){
    // Business: link + note
    html+='<div class="prof-edit-field"><label class="auth-label">Линк към продукта</label><input class="prof-edit-input" id="irLink" placeholder="https://myshop.bg/product/..."></div>';
    html+='<div class="prof-edit-field"><label class="auth-label">Цена (по желание)</label><input class="prof-edit-input" id="irPrice" placeholder="120 лв, 85€..."></div>';
    html+='<div class="prof-edit-field"><label class="auth-label">Бележка</label><input class="prof-edit-input" id="irNote" placeholder="На склад, доставка утре..."></div>';
  }else{
    // Mechanic: free text
    html+='<div class="prof-edit-field"><label class="auth-label">Твоето съобщение</label><textarea class="prof-edit-input" id="irNote" rows="3" placeholder="Имам опит с тоя проблем. Диагностика 30-50лв, ела да го погледнем..."></textarea></div>';
  }
  html+='<button class="btn btn-o" style="margin-top:8px;width:100%" onclick="sendIntelRespond(\''+postId+'\',\''+authorId+'\',\''+escHtml(postTitle.replace(/'/g,''))+'\')">'+(isMech?'🔧 Изпрати':'📦 Изпрати')+'</button>';
  modal.innerHTML=html;
  document.getElementById('modalBg').classList.add('on');
}
function sendIntelRespond(postId,authorId,postTitle){
  var user=getCurrentUser();if(!user)return;
  var isMech=user.role==='mechanic';
  var note=(document.getElementById('irNote')?document.getElementById('irNote').value:'').trim();
  var link='',price='';
  if(!isMech){
    link=(document.getElementById('irLink')?document.getElementById('irLink').value:'').trim();
    price=(document.getElementById('irPrice')?document.getElementById('irPrice').value:'').trim();
    if(!link&&!note){showToast('Добави линк или бележка','');return}
  }else{
    if(!note){showToast('Напиши съобщение','');return}
  }
  // Build DM body
  var body='';
  if(isMech){
    body='🔧 МОГА ДА ПОМОГНА\n📋 Относно: '+postTitle+'\n\n'+note;
  }else{
    body='📦 ИМАМЕ ГО!\n📋 Относно: '+postTitle;
    if(link)body+='\n🔗 '+link;
    if(price)body+='\n💰 '+price;
    if(note)body+='\n💬 '+note;
  }
  // Send as DM
  var msg={
    id:'msg_intel_'+Date.now(),
    from:user.id,
    to:authorId,
    body:body,
    type:'intel_respond',
    postId:postId,
    date:new Date().toISOString().split('T')[0],
    time:new Date().toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),
    read:false
  };
  var inbox=getMessages(authorId);inbox.unshift(msg);saveMessages(authorId,inbox);
  var sent=getMessages(user.id+'_sent');sent.unshift(msg);saveMessages(user.id+'_sent',sent);
  closeModal();
  showToast('✅ Изпратено на '+((getUsers()[authorId]||{}).name||'потребителя')+'!','success');
  updateInboxBadge();
}
