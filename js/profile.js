// ===== PROFILE MODULE =====
// Dependencies: core.js (escHtml, showToast, renderMarkdown, validateForm)
// Provides: seedProfiles, renderDynamicProfile, renderProfileSetupBanner,
//   renderProfileEditForm, saveProfileEdits, renderAccumulatedValue,
//   getBizProfile, saveBizProfile, and all profile sub-functions

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
  // Specs — colored chips
  if(bp.specs&&bp.specs.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">🔧 СПЕЦИАЛИЗАЦИЯ</div>';
    h+='<div class="spec-chips">';
    bp.specs.forEach(function(s,i){
      var colors=['#e8622c','#5a8a3c','#4682b4','#c49a6c','#d4a543','#8b5a8b'];
      var col=colors[i%colors.length];
      h+='<span class="spec-chip-colored" style="border-color:'+col+';color:'+col+'">'+escHtml(s)+'</span>';
    });
    h+='</div></div>';
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
  // Pricing — table format
  if(bp.pricing&&bp.pricing.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">💰 ЦЕНОРАЗПИС</div>';
    h+='<div class="pricing-table">';
    bp.pricing.forEach(function(p){
      h+='<div class="pricing-row"><span class="pricing-service">'+escHtml(p.service)+'</span><span class="pricing-price">'+escHtml(p.price);
      if(p.dual)h+=' <span class="dual">/ '+escHtml(p.dual)+'</span>';
      h+='</span></div>';
    });
    h+='</div></div>';
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
  // Upcoming (trainers) — card format
  if(bp.upcoming&&bp.upcoming.length){
    h+='<div class="prof-sec"><div class="prof-sec-t">📅 ПРЕДСТОЯЩИ ТРЕНИРОВКИ</div>';
    bp.upcoming.forEach(function(u){
      h+='<div class="trainer-session-card">';
      h+='<div class="trainer-session-date">📅 '+escHtml(u.date||'')+'</div>';
      h+='<div class="trainer-session-details">';
      if(u.location)h+='<span>📍 '+escHtml(u.location)+'</span>';
      if(u.level)h+='<span>🎯 '+escHtml(u.level)+'</span>';
      if(u.time)h+='<span>⏰ '+escHtml(u.time)+'</span>';
      if(u.capacity)h+='<span>👥 макс. '+escHtml(String(u.capacity))+'</span>';
      h+='</div>';
      if(u.note)h+='<div style="font:400 11px \'Exo 2\',sans-serif;color:var(--text2);margin-top:4px">'+escHtml(u.note)+'</div>';
      if(u.cta)h+='<button class="btn btn-g" style="font-size:10px;padding:4px 12px;margin-top:6px">'+(typeof u.cta==='string'?escHtml(u.cta):'Карай с нас')+'</button>';
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
  h+='<div class="biz-product-grid">';
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
  h+='</div></div>';
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
    // Garage with enhanced header
    var gBikes=[];try{gBikes=JSON.parse(localStorage.getItem('orGarage_'+userId)||'[]')}catch(e){}
    if(gBikes.length){
      h+='<div class="prof-garage-header-bar"><span>🏍️ Гаражът на '+escHtml(user.name)+'</span><span class="prof-garage-count">'+gBikes.length+' мотор'+(gBikes.length>1?'а':'')+'</span></div>';
    }
    var garageHtml=renderProfileGarageFor(userId);
    if(garageHtml)h+=garageHtml;
    var modsHtml=renderProfileModsFor(userId);
    if(modsHtml)h+=modsHtml;
    // Recent forum activity
    h+=renderProfRiderActivity(userId);
  }

  // Business analytics (own profile only)
  if(isMe&&(user.role==='business'||user.role==='mechanic'||user.role==='trainer'))h+=renderBizAnalytics(userId);
  // Business Intel dashboard (own profile, biz/mech only)
  if(isMe&&(user.role==='business'||user.role==='mechanic'))h+=renderBizIntel(userId);
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
var _profSubscribedTags=[];

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
  // Tag subscriptions
  h+=renderTagSubscriptionUI(bp);
  return h;
}

function renderTagSubscriptionUI(bp){
  bp=bp||{};
  var existingSubs=bp.subscribedTags||[];
  _profSubscribedTags=existingSubs.slice();
  var h='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:12px 0 6px;border-top:1px solid var(--border);padding-top:10px">📡 ТАГОВЕ ЗА СЛЕДЕНЕ</div>';
  h+='<div class="prof-edit-field"><div style="font:400 11px \'Exo 2\',sans-serif;color:var(--text2);margin-bottom:6px">Пиши таг и избери от списъка или добави свой (макс. 10)</div>';
  // Selected tags as removable pills
  h+='<div class="intel-selected-tags" id="profSubSelectedTags">';
  existingSubs.forEach(function(t){
    h+='<span class="intel-sel-tag">'+escHtml(t)+' <span class="intel-sel-x" onclick="removeSubTag(\''+escHtml(t)+'\')">✕</span></span>';
  });
  h+='</div>';
  // Input with autocomplete
  h+='<div class="intel-tag-input-wrap" style="position:relative">';
  h+='<input class="prof-edit-input" id="profSubTagInput" placeholder="Напиши таг... (напр. окачване, ktm, масла)" autocomplete="off" oninput="onSubTagInput(this.value)" onkeydown="onSubTagKeydown(event)">';
  h+='<div class="intel-tag-dropdown" id="profSubTagDrop"></div>';
  h+='</div></div>';
  return h;
}
function onSubTagInput(val){
  var drop=document.getElementById('profSubTagDrop');if(!drop)return;
  var q=(val||'').trim().toLowerCase();
  if(q.length<1){drop.innerHTML='';drop.style.display='none';return}
  var allTags=getAllTags();
  var matches=allTags.filter(function(t){return t.toLowerCase().indexOf(q)>-1&&_profSubscribedTags.indexOf(t)===-1});
  // Check if exact match exists
  var exactExists=allTags.some(function(t){return t.toLowerCase()===q});
  var alreadyAdded=_profSubscribedTags.some(function(t){return t.toLowerCase()===q});
  var html='';
  matches.slice(0,8).forEach(function(t){
    html+='<div class="intel-tag-opt" onclick="addSubTag(\''+escHtml(t)+'\')"><span class="hashtag">#'+escHtml(t)+'</span></div>';
  });
  // If no exact match and not already added — offer to create custom
  if(!exactExists&&!alreadyAdded&&q.length>=2){
    html+='<div class="intel-tag-opt intel-tag-new" onclick="addSubTag(\''+escHtml(q)+'\')">+ Създай <strong>#'+escHtml(q)+'</strong></div>';
  }
  if(!html){drop.style.display='none';return}
  drop.innerHTML=html;drop.style.display='block';
}
function onSubTagKeydown(e){
  if(e.key==='Enter'){
    e.preventDefault();
    var input=document.getElementById('profSubTagInput');if(!input)return;
    var val=(input.value||'').trim().toLowerCase();if(val.length<2)return;
    // Pick first match or create custom
    var allTags=getAllTags();
    var match=allTags.find(function(t){return t.toLowerCase()===val});
    addSubTag(match||val);
  }
}
function addSubTag(tag){
  if(!tag)return;
  tag=tag.toLowerCase();
  if(_profSubscribedTags.indexOf(tag)>-1){showToast('Вече следиш #'+tag);return}
  if(_profSubscribedTags.length>=10){showToast('Максимум 10 тагове за следене');return}
  _profSubscribedTags.push(tag);
  refreshSubTagPills();
  var input=document.getElementById('profSubTagInput');if(input){input.value='';input.focus()}
  var drop=document.getElementById('profSubTagDrop');if(drop){drop.innerHTML='';drop.style.display='none'}
}
function removeSubTag(tag){
  var idx=_profSubscribedTags.indexOf(tag);
  if(idx>-1)_profSubscribedTags.splice(idx,1);
  refreshSubTagPills();
}
function refreshSubTagPills(){
  var container=document.getElementById('profSubSelectedTags');if(!container)return;
  var html='';
  _profSubscribedTags.forEach(function(t){
    html+='<span class="intel-sel-tag">'+escHtml(t)+' <span class="intel-sel-x" onclick="removeSubTag(\''+escHtml(t)+'\')">✕</span></span>';
  });
  container.innerHTML=html;
}

function renderProductRow(idx,p){
  // All values are from trusted localStorage (user's own profile data) or hardcoded defaults.
  // escHtml sanitizes all dynamic values. Safe for innerHTML in this closed-system context.
  p=p||{};
  var thumbPreview=p.thumb?'<img src="'+escHtml(p.thumb)+'" style="width:36px;height:36px;border-radius:4px;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display=\'none\'">':'';
  return '<div class="biz-product-row" style="background:rgba(232,98,44,.03);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px;margin-bottom:4px;align-items:center">'+(thumbPreview?'<div class="prod-thumb-preview">'+thumbPreview+'</div>':'')+'<input class="slog-input" style="flex:2" placeholder="Име на продукта" data-prod="name" value="'+escHtml(p.name||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Цена" data-prod="price" value="'+escHtml(p.price||'')+'">'
    +'<span class="mod-part-remove" onclick="this.closest(\'.biz-product-row\').remove()" style="cursor:pointer;color:var(--text2)">✕</span></div>'
    +'<div style="display:flex;gap:6px"><input class="slog-input" style="flex:1" placeholder="Линк към сайта (https://...)" data-prod="url" value="'+escHtml(p.url||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Снимка URL (thumbnail)" data-prod="thumb" value="'+escHtml(p.thumb||'')+'" oninput="updateThumbPreview(this)"></div>'
    +'<div style="display:flex;gap:6px;margin-top:4px"><input class="slog-input" style="flex:1" placeholder="Забележка (на склад, поръчка...)" data-prod="note" value="'+escHtml(p.note||'')+'">'
    +'<label style="display:flex;align-items:center;gap:3px;font:400 11px \'Exo 2\',sans-serif;color:var(--text2);white-space:nowrap"><input type="checkbox" data-prod="hot"'+(p.hot?' checked':'')+'>🔥 Горещо</label></div>'
    +'</div>';
}
function updateThumbPreview(input){
  var row=input.closest('.biz-product-row');if(!row)return;
  var existing=row.querySelector('.prod-thumb-preview');
  var url=(input.value||'').trim();
  if(!url){if(existing)existing.remove();return}
  if(!existing){
    existing=document.createElement('div');existing.className='prod-thumb-preview';
    var firstDiv=row.querySelector('div');
    firstDiv.insertBefore(existing,firstDiv.querySelector('[data-prod="name"]'));
  }
  var img=document.createElement('img');
  img.src=url;img.style.cssText='width:36px;height:36px;border-radius:4px;object-fit:cover;border:1px solid var(--border)';
  img.onerror=function(){this.style.display='none'};
  existing.textContent='';existing.appendChild(img);
}
function addProfProductRow(){
  var c=document.getElementById('profProductContainer');if(!c)return;
  if(c.querySelectorAll('.biz-product-row').length>=20){showToast('Максимум 20 продукта');return}
  var div=document.createElement('div');
  div.innerHTML=renderProductRow(_profProductCount++,{});
  var row=div.firstChild;
  c.appendChild(row);
}

function renderOfferRow(idx,o){
  o=o||{};
  var activeChecked=(o.active===false)?'':'checked';
  return '<div class="biz-offer-row" style="background:rgba(90,138,60,.03);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px"><input class="slog-input" style="flex:2" placeholder="Заглавие на офертата" data-offer="title" value="'+escHtml(o.title||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Цена" data-offer="price" value="'+escHtml(o.price||'')+'">'
    +'<span class="mod-part-remove" onclick="this.closest(\'.biz-offer-row\').remove()" style="cursor:pointer;color:var(--text2)">✕</span></div>'
    +'<div style="display:flex;gap:6px;margin-top:4px"><input class="slog-input" style="flex:1" placeholder="Описание" data-offer="desc" value="'+escHtml(o.desc||'')+'">'
    +'<input class="slog-input" style="flex:1" placeholder="Линк (https://...)" data-offer="url" value="'+escHtml(o.url||'')+'"></div>'
    +'<div style="display:flex;gap:6px;margin-top:4px;align-items:center"><input class="slog-input" style="flex:1" type="date" placeholder="Валидна до" data-offer="expiry" value="'+escHtml(o.expiry||'')+'">'
    +'<label style="display:flex;align-items:center;gap:3px;font:400 11px \'Exo 2\',sans-serif;color:var(--text2);white-space:nowrap"><input type="checkbox" data-offer="active" '+activeChecked+'>Активна</label></div>'
    +'</div>';
}
function addProfOfferRow(){
  var c=document.getElementById('profOfferContainer');if(!c)return;
  if(c.querySelectorAll('.biz-offer-row').length>=10){showToast('Максимум 10 оферти');return}
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
  h+='</div>';
  h+='<div style="margin-top:6px"><input class="slog-input" id="profCustomSpec" placeholder="Друга специализация..." style="max-width:200px;display:inline-block" onkeydown="if(event.key===\'Enter\'){event.preventDefault();addCustomSpec()}">';
  h+=' <span style="font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addCustomSpec()">+ Добави</span></div></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Ценоразпис</label><div id="profPricingContainer">';
  var existingPricing=bp.pricing||[];
  _profPricingCount=0;
  if(existingPricing.length){
    existingPricing.forEach(function(p,i){h+=renderPricingRow(i,p.service,p.price);_profPricingCount=i+1});
  }else{h+=renderPricingRow(0,'','');_profPricingCount=1}
  h+='</div><span style="display:inline-block;margin-top:4px;font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addProfPricingRow()">+ Добави услуга</span></div>';
  // Tag subscriptions for mechanic too
  h+=renderTagSubscriptionUI(bp);
  return h;
}
function renderPricingRow(idx,service,price){
  return '<div class="mod-part-input-row" style="grid-template-columns:1fr 100px auto;margin-bottom:4px"><input class="slog-input" placeholder="Услуга" data-pricing="service" value="'+escHtml(service||'')+'"><input class="slog-input" placeholder="напр. 50-80лв" data-pricing="price" value="'+escHtml(price||'')+'"><span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span></div>';
}
function addCustomSpec(){
  var input=document.getElementById('profCustomSpec');if(!input)return;
  var val=(input.value||'').trim();if(!val)return;
  if(_profSelectedSpecs.indexOf(val)>-1){showToast('Вече е добавена');input.value='';return}
  if(_profSelectedSpecs.length>=10){showToast('Максимум 10 специализации');return}
  _profSelectedSpecs.push(val);
  var bar=document.getElementById('profSpecsBar');
  if(bar){
    var span=document.createElement('span');
    span.className='ntf-tag on';span.textContent=val;
    span.onclick=function(){toggleProfSpec(val,span)};
    bar.appendChild(span);
  }
  input.value='';
}
function toggleProfSpec(spec,el){
  var idx=_profSelectedSpecs.indexOf(spec);
  if(idx>-1){_profSelectedSpecs.splice(idx,1);el.classList.remove('on')}
  else if(_profSelectedSpecs.length<10){_profSelectedSpecs.push(spec);el.classList.add('on')}
  else{showToast('Максимум 10 специализации')}
}
function addProfPricingRow(){
  var c=document.getElementById('profPricingContainer');if(!c)return;
  if(c.querySelectorAll('.mod-part-input-row').length>=20){showToast('Максимум 20 услуги');return}
  var row=document.createElement('div');
  row.className='mod-part-input-row';
  row.style.cssText='grid-template-columns:1fr 100px auto;margin-bottom:4px';
  // Static hardcoded placeholders only, no user data in innerHTML. Safe context.
  row.innerHTML='<input class="slog-input" placeholder="Услуга" data-pricing="service"><input class="slog-input" placeholder="напр. 50-80лв" data-pricing="price"><span class="mod-part-remove" onclick="this.parentElement.remove()">✕</span>';
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
  // Multiple sessions
  var upcoming=bp.upcoming||[];
  h+='<div class="prof-edit-field"><label class="auth-label">Предстоящи тренировки</label><div id="profSessionContainer">';
  _profSessionCount=0;
  if(upcoming.length){
    upcoming.forEach(function(s,i){h+=renderSessionRow(i,s);_profSessionCount=i+1});
  }else{h+=renderSessionRow(0,{location:bp.location||''});_profSessionCount=1}
  h+='</div><span style="display:inline-block;margin-top:4px;font:500 11px \'Exo 2\',sans-serif;color:var(--orange);cursor:pointer" onclick="addProfSessionRow()">+ Добави тренировка</span></div>';
  h+='<div class="prof-edit-field"><label class="auth-label">Менторство</label><input class="prof-edit-input" id="profEditMentorship" placeholder="Менторира 3 новобранци от..." value="'+escHtml(bp.mentorship||'')+'"></div>';
  return h;
}
function renderSessionRow(idx,s){
  s=s||{};
  return '<div class="trainer-session-row" style="background:rgba(90,138,60,.03);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px;align-items:center"><input class="slog-input" type="date" data-session="date" value="'+escHtml(s.dateISO||'')+'" style="flex:1">'
    +'<input class="slog-input" placeholder="Локация" data-session="location" value="'+escHtml(s.location||'')+'" style="flex:1">'
    +'<input class="slog-input" placeholder="Макс. участници" data-session="capacity" value="'+escHtml(s.capacity||'')+'" style="width:100px;flex:0 0 auto" type="number" min="1">'
    +'<span class="mod-part-remove" onclick="this.closest(\'.trainer-session-row\').remove()" style="cursor:pointer;color:var(--text2)">✕</span></div>'
    +'</div>';
}
function addProfSessionRow(){
  var c=document.getElementById('profSessionContainer');if(!c)return;
  if(c.querySelectorAll('.trainer-session-row').length>=10){showToast('Максимум 10 тренировки');return}
  var div=document.createElement('div');
  div.innerHTML=renderSessionRow(_profSessionCount++,{});
  c.appendChild(div.firstChild);
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
      var activeCb=row.querySelector('[data-offer="active"]');
      offers.push({
        title:title,
        price:(row.querySelector('[data-offer="price"]').value||'').trim(),
        desc:(row.querySelector('[data-offer="desc"]').value||'').trim(),
        url:(row.querySelector('[data-offer="url"]').value||'').trim(),
        expiry:(row.querySelector('[data-offer="expiry"]').value||'').trim(),
        active:activeCb?activeCb.checked:true
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
    bp.subscribedTags=_profSubscribedTags.slice();
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
    bp.subscribedTags=_profSubscribedTags.slice();
    saveBizProfile(user.id,bp);
  }
  if(user.role==='trainer'){
    var bp=getBizProfile(user.id)||{};
    el=document.getElementById('profEditTrainerExp');if(el)user.experience=el.value;
    var levelBoxes=document.querySelectorAll('.profTrainerLevel');
    var levels=[];
    levelBoxes.forEach(function(cb){if(cb.checked)levels.push(cb.value)});
    user.levels=levels.join(',');
    // Save multiple sessions
    var sessionRows=document.querySelectorAll('#profSessionContainer .trainer-session-row');
    var upcoming=[];
    var _months=['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
    sessionRows.forEach(function(row){
      var dateVal=(row.querySelector('[data-session="date"]').value||'').trim();
      if(!dateVal)return;
      var loc=(row.querySelector('[data-session="location"]').value||'').trim();
      var cap=(row.querySelector('[data-session="capacity"]').value||'').trim();
      var entry={dateISO:dateVal,location:loc};
      if(cap)entry.capacity=parseInt(cap)||0;
      try{var d=new Date(dateVal);entry.date=d.getDate()+' '+_months[d.getMonth()]}catch(e){entry.date=dateVal}
      upcoming.push(entry);
    });
    bp.upcoming=upcoming;
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

// ===== RIDER ACTIVITY =====
function renderProfRiderActivity(userId){
  var posts=[];
  try{posts=getForumPosts()}catch(e){}
  var myPosts=posts.filter(function(p){return p.author===userId}).sort(function(a,b){return(b.date||'')>(a.date||'')?1:-1}).slice(0,3);
  var myReplies=[];
  posts.forEach(function(p){
    if(!Array.isArray(p.replies))return;
    p.replies.forEach(function(r){
      if(r.author===userId)myReplies.push({postTitle:p.title,postId:p.id,text:r.text,date:r.date});
    });
  });
  myReplies.sort(function(a,b){return(b.date||'')>(a.date||'')?1:-1});
  myReplies=myReplies.slice(0,3);
  if(!myPosts.length&&!myReplies.length)return '';
  var h='<div class="prof-sec"><div class="prof-sec-t">📊 АКТИВНОСТ ВЪВ ФОРУМА</div>';
  if(myPosts.length){
    h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:8px 0 4px">ПОСЛЕДНИ ТЕМИ</div>';
    myPosts.forEach(function(p){
      h+='<div class="profile-activity-item" onclick="closeModal();setTimeout(function(){location.hash=\'#forum/post/'+escHtml(p.id)+'\'},{})"><span>💬</span><span class="profile-activity-title">'+escHtml(p.title)+'</span><span class="profile-activity-time">'+timeAgo(p.date)+'</span></div>';
    });
  }
  if(myReplies.length){
    h+='<div style="font:500 9px \'JetBrains Mono\',monospace;color:var(--earth);letter-spacing:1px;margin:8px 0 4px">ПОСЛЕДНИ ОТГОВОРИ</div>';
    myReplies.forEach(function(r){
      h+='<div class="profile-activity-item"><span>↩️</span><span class="profile-activity-title">'+escHtml(r.text.substring(0,60))+(r.text.length>60?'...':'')+'</span><span class="profile-activity-time">'+timeAgo(r.date)+'</span></div>';
    });
  }
  h+='</div>';
  return h;
}

// ===== BIKE COMMENTS =====
function getBikeComments(ownerId,bikeIdx){
  try{return JSON.parse(localStorage.getItem('orBikeComments_'+ownerId+'_'+bikeIdx))||[]}catch(e){return[]}
}
function saveBikeComments(ownerId,bikeIdx,comments){
  localStorage.setItem('orBikeComments_'+ownerId+'_'+bikeIdx,JSON.stringify(comments));
}

function renderBikeComments(ownerId,bikeIdx){
  var comments=getBikeComments(ownerId,bikeIdx);
  var uid=getCurrentUserId();
  var users=getUsers();
  var count=comments.length;
  // Safe: all dynamic content uses escHtml, data from trusted localStorage
  var h='<div class="bike-comments-toggle'+(count?' has-comments':'')+'" data-action="toggle-bike-comments">💬 Коментари'+(count?' ('+count+')':'')+'</div>';
  h+='<div class="bike-comments-body">';
  if(comments.length){
    comments.forEach(function(c){
      var cUser=users[c.author]||{name:c.authorName||'Анонимен',emoji:'👤'};
      h+='<div class="bike-comment">';
      h+=userAvatar(cUser,22);
      h+='<div class="bike-comment-content">';
      h+='<span class="bike-comment-author" onclick="openProfile(\''+escHtml(c.author)+'\')">'+escHtml(cUser.name)+'</span>';
      h+='<span class="bike-comment-time">'+timeAgo(c.date)+'</span>';
      h+='<div class="bike-comment-text">'+escHtml(c.text)+'</div>';
      h+='</div></div>';
    });
  }
  if(uid){
    h+='<div class="bike-comment-form">';
    h+='<textarea id="bikeComment_'+escHtml(ownerId)+'_'+bikeIdx+'" placeholder="Напиши коментар..." maxlength="300" class="bike-comment-input"></textarea>';
    h+='<button class="btn btn-o" style="font-size:10px;padding:4px 12px" data-action="submit-bike-comment" data-param="'+escHtml(ownerId)+'" data-param2="'+bikeIdx+'">Коментирай</button>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function submitBikeComment(ownerId,bikeIdx){
  var uid=getCurrentUserId();
  if(!uid){toggleAuthModal();return}
  var textarea=document.getElementById('bikeComment_'+ownerId+'_'+bikeIdx);
  if(!textarea)return;
  var text=textarea.value.trim();
  if(!text){showToast('Напиши коментар');return}
  if(text.length>300){showToast('Максимум 300 символа');return}
  var user=getCurrentUser();
  var comments=getBikeComments(ownerId,bikeIdx);
  if(comments.length>=50){showToast('Максимум 50 коментара');return}
  comments.push({
    id:'bc_'+Date.now(),
    author:uid,
    authorName:user.name,
    text:text,
    date:new Date().toISOString()
  });
  saveBikeComments(ownerId,bikeIdx,comments);
  textarea.value='';
  showToast('💬 Коментарът е добавен','success');
  // Re-render the profile to update comments
  if(typeof openProfile==='function')openProfile(ownerId);
}
