// ===== AUTH MODULE =====
// Dependencies: core.js (escHtml, validateForm, showToast)
// Provides: ROLE_META, DEMO_USERS, getUsers, saveUsers, getCurrentUserId, getCurrentUser,
//   loginAs, logout, seedDemoAccounts, toggleAuthModal, closeAuthModal, renderLoginView,
//   showRegisterView, renderRegisterView, submitRegistration, refreshAuthUI,
//   renderRoleBadge, migrateGlobalData, showAccountPrompt, selectRegRole, renderRoleFields,
//   getBizProfile, saveBizProfile, seedProfiles

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
function loginAs(userId){localStorage.setItem('orSession',userId);refreshAuthUI();showGreeting();refreshTierDisplay();renderGarage();updateGarageBadge();seedMessages();seedNotifications();seedBizSubscriptions();updateInboxBadge();updateStreak();refreshHome()}
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
  // motohaus
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
  // pesho
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
  // manolov
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
  // kabakchiev
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
  // marin
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
  // gosho
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
  // edimoto
  saveBizProfile('edimoto',{
    desc:'Употребявани части · Всички марки',location:'София · Доставка из цялата страна',
    badges:[{text:'✓ Верифициран',cls:'b-ver'}],
    stats:[{n:'230+',l:'Части'},{n:'4.7',l:'Рейтинг'}],
    about:'Голям каталог употребявани части — окачване, двигател, електроника, рама, пластмаси. Всички марки.',
    actions:[{label:'Намери частта',cls:'btn-o',action:'message'},{label:'Виж в Мазето',cls:'btn-s',action:'maze'}]
  });
  // edimoto_shop
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
  // elilison
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
  h+='<div class="auth-field"><label class="auth-label">Име / Псевдоним</label><input class="auth-input" id="regName" placeholder="Марин Тодоров" maxlength="50"></div>';
  h+='<div class="auth-field"><label class="auth-label">Град</label><input class="auth-input" id="regCity" placeholder="София, Пловдив..." maxlength="30"></div>';
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
  if(_regRole==='rider'){user.archetype=localStorage.getItem('orArchetype')||'wolf'}
  if(_regRole==='business'){user.shopType=(document.getElementById('regShopType')||{}).value||'';user.workHours=(document.getElementById('regWorkHours')||{}).value||''}
  if(_regRole==='mechanic'){user.specialty=(document.getElementById('regSpecialty')||{}).value||''}
  if(_regRole==='trainer'){user.experience=(document.getElementById('regExperience')||{}).value||'';user.levels=(document.getElementById('regLevels')||{}).value||''}
  users[id]=user;saveUsers(users);
  if(_regRole==='rider')migrateGlobalData(id);
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

// ===== ACCOUNT PROMPT =====
function showAccountPrompt(){
  if(getCurrentUser())return;
  var g=document.getElementById('obGreeting');if(!g)return;
  var existing=document.getElementById('accountPrompt');if(existing)return;
  var div=document.createElement('div');div.className='ob-account-prompt';div.id='accountPrompt';
  div.innerHTML='<div class="ob-account-prompt-title">ЗАПАЗИ ПРОГРЕСА СИ</div><div class="ob-account-prompt-sub">Създай акаунт, за да не загубиш гаража и данните си</div><div class="ob-account-prompt-btns"><button class="btn btn-o" onclick="this.closest(\'#accountPrompt\').remove();toggleAuthModal()">Създай акаунт</button><button class="btn btn-s" onclick="this.closest(\'#accountPrompt\').remove()">По-късно</button></div>';
  g.parentElement.insertBefore(div,g.nextSibling);
}
