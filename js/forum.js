// ===== FORUM MODULE =====
// Dependencies: core.js (escHtml, showToast, timeAgo, userAvatar, validateField, validateForm, btnSubmitEffect, renderMarkdown, getReports, saveReports)
// Also uses globals from app.js: getCurrentUser, getCurrentUserId, getUsers, getGarage, getMods, toggleAuthModal,
//   renderRoleBadge, TIERS, TIER_ORDER, calculateTier, renderTierBadge, showCelebration,
//   refreshHome, go, _hashNav, openProfile, skeletonThenRender, initCardObserver, simulateReaders,
//   addNotification, extractMentions, notifySubscribedBusinesses, openForumThread, filterByTag, trackTagSearch

// ===== FORUM FILTER CHIPS =====
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
  // Show newbie hub
  var hubEl=document.getElementById('newbieHub');
  if(hubEl){
    if(zone==='newbie'){hubEl.style.display='';renderNewbieHub();}
    else{hubEl.style.display='none';hubEl.innerHTML='';}
  }
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

// renderMarkdown is in core.js

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
  // Business Intel — notify subscribed businesses
  if(post.tags.length)notifySubscribedBusinesses(post.tags,post.id,post.title,user.id);
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
// getReports, saveReports are in core.js
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

// ===== NEWBIE HUB =====

var BEGINNER_BIKES=[
  {make:'KTM',model:'EXC 250/300',type:'enduro',years:'2014-2020',priceRange:'4000-7000',emoji:'🟠',why:'Лек, 2-тактов, лесен за поддръжка. Златният стандарт за ендуро.',level:'beginner-mid'},
  {make:'Yamaha',model:'WR250F',type:'enduro',years:'2015-2020',priceRange:'5000-8000',emoji:'🔵',why:'4-тактов, надежден, добър за дълги маршрути. По-тих от 2Т.',level:'beginner'},
  {make:'Honda',model:'CRF250L/Rally',type:'dual-sport',years:'2017-2023',priceRange:'6000-10000',emoji:'🔴',why:'Улично-регистриран, лек, перфектен ако караш и асфалт.',level:'beginner'},
  {make:'KTM',model:'EXC-F 250/350',type:'enduro',years:'2017-2022',priceRange:'6000-10000',emoji:'🟠',why:'4-тактов ендуро, повече мощност. За тези дето искат малко повече.',level:'beginner-mid'},
  {make:'Husqvarna',model:'FE 250/350',type:'enduro',years:'2017-2022',priceRange:'6000-10000',emoji:'⚪',why:'Като KTM EXC-F, но с различна ергономия. Същата платформа.',level:'beginner-mid'}
];

var _popularBikesCache=null;
function getPopularBikes(){
  if(_popularBikesCache)return _popularBikesCache;
  var users=getUsers();var agg={};
  Object.keys(users).forEach(function(uid){
    var bikes=[];try{bikes=JSON.parse(localStorage.getItem('orGarage_'+uid)||'[]')}catch(e){}
    bikes.forEach(function(b){
      if(!b.make||!b.model)return;
      var key=(b.make+' '+b.model).toLowerCase().trim();
      if(!agg[key])agg[key]={make:b.make,model:b.model,count:0,totalMonths:0,riders:[]};
      agg[key].count++;
      agg[key].totalMonths+=(b.months||0);
      var name=users[uid]&&users[uid].name||uid;
      if(agg[key].riders.indexOf(name)<0)agg[key].riders.push(name);
    });
  });
  var arr=Object.keys(agg).map(function(k){
    var item=agg[k];
    item.avgMonths=item.count>0?Math.round(item.totalMonths/item.count):0;
    return item;
  });
  arr.sort(function(a,b){return b.count-a.count});
  _popularBikesCache=arr;
  return arr;
}

function findNewbieTopics(limit){
  limit=limit||6;
  var keywords=['първи мотор','начинаещ','бюджет','какво да купя','нов ездач','първо каране','какво да гледам','за начало','екипировка за начинаещ'];
  var posts=getForumPosts().filter(function(p){
    if(p.deleted||p.flagged)return false;
    if(p.zone==='newbie')return true;
    var txt=((p.title||'')+(p.body||'')).toLowerCase();
    for(var i=0;i<keywords.length;i++){if(txt.indexOf(keywords[i])>-1)return true}
    if(p.tags&&p.tags.length){
      for(var j=0;j<p.tags.length;j++){if(p.tags[j]==='екипировка'||p.tags[j]==='тренировка')return true}
    }
    return false;
  });
  posts.forEach(function(p){
    var r=p.reactions||{like:[],wrench:[],thanks:[]};
    p._score=(Array.isArray(p.replies)?p.replies.length:0)*2+
      (Array.isArray(r.like)?r.like.length:0)+
      (Array.isArray(r.wrench)?r.wrench.length:0)+
      (Array.isArray(r.thanks)?r.thanks.length:0);
  });
  posts.sort(function(a,b){return b._score-a._score});
  return posts.slice(0,limit);
}

function renderNewbieHub(){
  var el=document.getElementById('newbieHub');if(!el)return;
  _popularBikesCache=null; // Fresh data each render
  var uid=getCurrentUserId();
  var user=uid?getCurrentUser():null;
  var users=getUsers();
  var h='<div class="newbie-hub">';

  // === Section A: Community popular bikes ===
  var popular=getPopularBikes();
  h+='<div class="newbie-section">';
  h+='<div class="newbie-section-title">🏍️ ОБЩНОСТТА ПРЕПОРЪЧВА</div>';
  if(popular.length){
    h+='<div class="newbie-section-sub">Какво карат хората в Републиката</div>';
    h+='<div class="newbie-bikes-grid">';
    popular.slice(0,5).forEach(function(b){
      h+='<div class="newbie-bike-card" data-action="search-go" data-param="'+escHtml(b.make+' '+b.model)+'">';
      h+='<div class="nbc-name">'+escHtml(b.make)+' <strong>'+escHtml(b.model)+'</strong></div>';
      h+='<div class="nbc-stat">'+b.count+' ездач'+(b.count>1?'и':'')+(b.avgMonths?' · ~'+b.avgMonths+' мес. опит':'')+'</div>';
      h+='<div class="nbc-riders">'+b.riders.slice(0,3).map(function(r){return escHtml(r)}).join(', ')+(b.riders.length>3?' +':'')+'</div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Expert recommendations
  h+='<div class="newbie-section-sub" style="margin-top:12px">Експертен списък за начинаещи</div>';
  h+='<div class="newbie-expert-grid">';
  BEGINNER_BIKES.forEach(function(b){
    h+='<div class="newbie-expert-card">';
    h+='<div class="nec-header"><span class="nec-emoji">'+b.emoji+'</span> <strong>'+escHtml(b.make)+' '+escHtml(b.model)+'</strong></div>';
    h+='<div class="nec-meta">'+escHtml(b.type)+' · '+escHtml(b.years)+' · <span class="nec-price">'+escHtml(b.priceRange)+' лв</span></div>';
    h+='<div class="nec-why">'+escHtml(b.why)+'</div>';
    var lvl=b.level==='beginner'?'🟢 Начинаещ':'🟡 Начинаещ-среден';
    h+='<div class="nec-level">'+lvl+'</div>';
    h+='</div>';
  });
  h+='</div>';
  h+='</div>';

  // === Section B: Bikes for sale in Maze ===
  var allListings=(getListings()||[]).concat(SEED_LISTINGS||[]);
  var bikeListings=allListings.filter(function(l){return l.type==='bike'&&l.active!==false});
  bikeListings.sort(function(a,b){return(a.price||0)-(b.price||0)});
  h+='<div class="newbie-section">';
  h+='<div class="newbie-section-title">💰 МОТОРИ В МАЗЕТО</div>';
  if(bikeListings.length){
    h+='<div class="newbie-section-sub">Най-достъпните обяви за мотори</div>';
    h+='<div class="newbie-listings-grid">';
    bikeListings.slice(0,4).forEach(function(l){
      var seller=users[l.author];
      h+='<div class="newbie-listing-card" data-action="open-listing" data-param="'+escHtml(l.id)+'">';
      if(l.imageUrl)h+='<div class="nlc-thumb"><img src="'+escHtml(l.imageUrl)+'" alt="" onerror="this.parentNode.remove()"></div>';
      h+='<div class="nlc-title">'+escHtml(l.title)+'</div>';
      h+='<div class="nlc-price">'+(l.price?l.price.toLocaleString()+' лв':'Цена по запитване')+'</div>';
      h+='<div class="nlc-meta">📍 '+escHtml(l.city||'—')+' · '+(l.condition==='new'?'Ново':'Употребявано')+'</div>';
      if(seller)h+='<div class="nlc-seller">от '+escHtml(seller.name||l.author)+'</div>';
      h+='</div>';
    });
    h+='</div>';
    h+='<div class="newbie-more" data-action="go" data-param="maze">Виж всички в Мазето →</div>';
  }else{
    h+='<div class="newbie-empty">Все още няма обяви за мотори. <span data-action="go" data-param="maze" class="link">Виж Мазето</span></div>';
  }
  h+='</div>';

  // === Section C: Businesses near you ===
  h+='<div class="newbie-section">';
  h+='<div class="newbie-section-title">🔧 МАЙСТОРИ И МАГАЗИНИ</div>';
  if(uid&&user){
    var bizList=getBusinessesNearUser(uid);
    var hasNear=bizList.some(function(b){return b.near});
    if(hasNear){
      h+='<div class="newbie-section-sub">Близо до '+escHtml(user.city||'теб')+'</div>';
    }else if(!user.city){
      h+='<div class="newbie-city-hint">📍 <span data-action="profile" data-param="'+escHtml(uid)+'" class="link">Добави града си в профила</span> за по-точни препоръки</div>';
    }
    h+='<div class="newbie-biz-grid">';
    bizList.forEach(function(item){
      var b=item.biz;var bp=item.bp;
      h+='<div class="newbie-biz-card'+(item.near?' near':'')+'" data-action="profile" data-param="'+escHtml(item.key)+'">';
      h+='<div class="nbzc-icon">'+b.icon+'</div>';
      h+='<div class="nbzc-body">';
      h+='<div class="nbzc-name">'+escHtml(b.name)+(item.near?' <span class="nbzc-near">БЛИЗО</span>':'')+'</div>';
      var typeLabel={shop:'Магазин',mechanic:'Механик',dealer:'Дилър',specialist:'Специалист'}[b.type]||b.type;
      h+='<div class="nbzc-type">'+escHtml(typeLabel)+' · 📍 '+escHtml(item.city||'—')+'</div>';
      if(b.offers&&b.offers[0])h+='<div class="nbzc-offer">'+escHtml(b.offers[0].title)+' — '+escHtml(b.offers[0].price)+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }else{
    h+='<div class="newbie-section-sub">Регистрирай се за персонализирани препоръки</div>';
    h+='<div class="newbie-biz-grid">';
    Object.keys(businessData).forEach(function(key){
      var b=businessData[key];
      h+='<div class="newbie-biz-card" data-action="profile" data-param="'+escHtml(key)+'">';
      h+='<div class="nbzc-icon">'+b.icon+'</div>';
      h+='<div class="nbzc-body">';
      h+='<div class="nbzc-name">'+escHtml(b.name)+'</div>';
      var typeLabel={shop:'Магазин',mechanic:'Механик',dealer:'Дилър',specialist:'Специалист'}[b.type]||b.type;
      h+='<div class="nbzc-type">'+escHtml(typeLabel)+' · 📍 '+escHtml(b.city||'—')+'</div>';
      if(b.offers&&b.offers[0])h+='<div class="nbzc-offer">'+escHtml(b.offers[0].title)+' — '+escHtml(b.offers[0].price)+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  h+='</div>';

  // === Section D: Hot newbie topics ===
  var topics=findNewbieTopics(6);
  h+='<div class="newbie-section">';
  h+='<div class="newbie-section-title">💬 ГОРЕЩИ ТЕМИ ЗА НАЧИНАЕЩИ</div>';
  if(topics.length){
    h+='<div class="newbie-topics-list">';
    topics.forEach(function(p){
      var replyCount=Array.isArray(p.replies)?p.replies.length:0;
      var typeEmoji={q:'❓',e:'📝',s:'✅',h:'🔥'}[p.type]||'💬';
      var topReply='';
      if(p.replies&&p.replies.length){
        var best=p.replies[0];
        p.replies.forEach(function(r){if((Array.isArray(r.likes)?r.likes.length:0)>(Array.isArray(best.likes)?best.likes.length:0))best=r});
        var authorName=users[best.author]&&users[best.author].name||best.author;
        var snippet=(best.body||'').replace(/[*_#`\[\]]/g,'').slice(0,80);
        topReply='<div class="ntt-reply"><strong>'+escHtml(authorName)+':</strong> '+escHtml(snippet)+(best.body.length>80?'...':'')+'</div>';
      }
      h+='<div class="newbie-topic-card" data-action="open-forum-thread" data-param="'+escHtml(p.id)+'">';
      h+='<div class="ntc-header"><span class="ntc-type">'+typeEmoji+'</span> <span class="ntc-title">'+escHtml(p.title)+'</span></div>';
      h+='<div class="ntc-meta">'+replyCount+' отговор'+(replyCount!==1?'а':'')+' · '+timeAgo(p.date)+'</div>';
      if(topReply)h+=topReply;
      h+='</div>';
    });
    h+='</div>';
  }else{
    h+='<div class="newbie-empty">Все още няма теми. <span data-action="new-topic-zone" data-param="newbie" class="link">Създай първата!</span></div>';
  }
  h+='</div>';

  // === Section E: Checklist (compact, logged-in only) ===
  if(uid&&user){
    var clKey='orRegChecklist_'+uid;
    var clData;try{clData=JSON.parse(localStorage.getItem(clKey)||'{}')}catch(e){clData={}}
    if(!clData.dismissed){
      var garage=getGarage();
      var myPosts=getForumPosts().filter(function(p){return p.author===uid});
      var bp=null;try{bp=JSON.parse(localStorage.getItem('orBizProfile_'+uid))}catch(e){}
      var items=[
        {done:garage.length>0,label:'Добави мотор в гаража',emoji:'🏍️'},
        {done:myPosts.length>0,label:'Създай първата си тема',emoji:'💬'},
        {done:!!(user.city&&user.bio),label:'Попълни профила си',emoji:'📝'}
      ];
      var doneCount=items.filter(function(i){return i.done}).length;
      if(doneCount<items.length){
        h+='<div class="newbie-section newbie-checklist">';
        h+='<div class="newbie-section-title">📋 ТВОЯТ ПРОГРЕС ('+doneCount+'/'+items.length+')</div>';
        h+='<div class="newbie-check-bar"><div class="newbie-check-fill" style="width:'+Math.round(doneCount/items.length*100)+'%"></div></div>';
        h+='<div class="newbie-check-items">';
        items.forEach(function(item){
          h+='<div class="newbie-check-item'+(item.done?' done':'')+'"><span>'+(item.done?'✓':item.emoji)+'</span> '+escHtml(item.label)+'</div>';
        });
        h+='</div></div>';
      }
    }
  }else{
    h+='<div class="newbie-section newbie-cta">';
    h+='<div class="newbie-cta-text">🏁 <strong>Регистрирай се</strong> и започни пътя си в Републиката</div>';
    h+='<button class="btn btn-o" data-action="auth-toggle">Влез / Регистрирай се</button>';
    h+='</div>';
  }

  h+='</div>';
  el.innerHTML=h;
  if(typeof initCardObserver==='function')initCardObserver();
}
