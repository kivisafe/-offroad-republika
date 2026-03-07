// ===== ОФРОУД РЕПУБЛИКА — ИНТЕРАКТИВНА КАРТА =====

const MAP_MARKERS = [
  // Бизнеси
  { id:'motohaus', type:'biz', lat:42.595, lng:23.593, emoji:'🏪', color:'var(--orange)',
    name:'МотоХаус Нови хан', sub:'Магазин · Части', rating:'★4.9', badge:'kabakchiev' },
  { id:'pesho', type:'biz', lat:42.150, lng:24.750, emoji:'🔧', color:'var(--green)',
    name:'Пешо Механика', sub:'Сервиз · Пловдив', rating:'★4.8', badge:'verified' },
  { id:'manolov', type:'biz', lat:42.500, lng:24.720, emoji:'🏅', color:'var(--earth)',
    name:'Треньор Манолов', sub:'Треньор · Манолово', rating:'★5.0', badge:'velichko' },
  { id:'kabakchiev', type:'biz', lat:42.870, lng:25.320, emoji:'🏆', color:'var(--orange)',
    name:'Кабакчиев', sub:'Шампион · Габрово', rating:'★5.0', badge:'kabakchiev' },
  { id:'edimoto', type:'biz', lat:42.700, lng:23.320, emoji:'🏍️', color:'var(--earth)',
    name:'EdiMoto', sub:'Мотори · София', rating:'★4.7', badge:'verified' },
  { id:'gosho', type:'biz', lat:43.210, lng:27.910, emoji:'⚡', color:'var(--orange)',
    name:'Гошо Електро', sub:'Електроника · Варна', rating:'★4.6', badge:null },

  // Маршрути
  { id:'stara-planina', type:'route', lat:42.720, lng:24.600, emoji:'🌲', color:'var(--green)',
    name:'Стара Планина Ендуро', sub:'85 km · Средна трудност', rating:null, badge:null },
  { id:'rodopi', type:'route', lat:41.700, lng:24.500, emoji:'🏔️', color:'var(--green)',
    name:'Родопи офроуд маршрут', sub:'120 km · Тежка', rating:null, badge:null },
  { id:'bgx-karlovo', type:'route', lat:42.640, lng:24.810, emoji:'🏁', color:'var(--green)',
    name:'BG-X Карлово', sub:'15 март · Състезание', rating:null, badge:null }
];

let komunaMap = null;
let bizLayer = null;
let routeLayer = null;

function createMarkerIcon(m) {
  return L.divIcon({
    className: 'k-marker',
    html: '<div class="k-marker-dot" style="background:' + m.color + '">' + m.emoji + '</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
}

function createPopupHtml(m) {
  let badgeHtml = '';
  if (m.badge === 'velichko') badgeHtml = '<span class="k-pop-badge k-badge-v">🏆 Величко</span>';
  else if (m.badge === 'kabakchiev') badgeHtml = '<span class="k-pop-badge k-badge-k">🏆 Кабакчиев ✓</span>';
  else if (m.badge === 'verified') badgeHtml = '<span class="k-pop-badge k-badge-ver">✓ Верифициран</span>';

  let ratingHtml = m.rating ? '<span class="k-pop-rating">' + m.rating + '</span>' : '';

  let actionHtml = m.type === 'biz'
    ? '<div class="k-pop-action" onclick="openProfile(\'' + m.id + '\')">Виж профил →</div>'
    : '<div class="k-pop-action" onclick="showToast(\'GPX маршрут — скоро!\')">Изтегли GPX →</div>';

  return '<div class="k-popup">' +
    '<div class="k-pop-head">' +
      '<span class="k-pop-emoji">' + m.emoji + '</span>' +
      '<div class="k-pop-info">' +
        '<div class="k-pop-name">' + m.name + ' ' + ratingHtml + '</div>' +
        '<div class="k-pop-sub">' + m.sub + '</div>' +
      '</div>' +
    '</div>' +
    badgeHtml +
    actionHtml +
  '</div>';
}

function initKomunaMap() {
  if (komunaMap) return;

  const container = document.getElementById('komunaMap');
  if (!container) return;

  komunaMap = L.map('komunaMap', {
    center: [42.7, 25.5],
    zoom: 8,
    zoomControl: false,
    attributionControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(komunaMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 17,
    subdomains: 'abcd'
  }).addTo(komunaMap);

  bizLayer = L.layerGroup();
  routeLayer = L.layerGroup();

  MAP_MARKERS.forEach(function(m) {
    var marker = L.marker([m.lat, m.lng], { icon: createMarkerIcon(m) });
    marker.bindPopup(createPopupHtml(m), {
      className: 'k-popup-wrapper',
      maxWidth: 260,
      minWidth: 200
    });
    if (m.type === 'biz') bizLayer.addLayer(marker);
    else routeLayer.addLayer(marker);
  });

  bizLayer.addTo(komunaMap);
  routeLayer.addTo(komunaMap);

  // Dashed route lines
  var routeCoords = MAP_MARKERS.filter(function(m) { return m.type === 'route'; })
    .map(function(m) { return [m.lat, m.lng]; });
  if (routeCoords.length > 1) {
    L.polyline(routeCoords, {
      color: '#5a8a3c',
      weight: 2,
      opacity: 0.5,
      dashArray: '8 6'
    }).addTo(routeLayer);
  }
}

function filterMap(type) {
  if (!komunaMap) return;
  if (type === 'biz') {
    komunaMap.addLayer(bizLayer);
    komunaMap.removeLayer(routeLayer);
  } else if (type === 'route') {
    komunaMap.removeLayer(bizLayer);
    komunaMap.addLayer(routeLayer);
  } else {
    komunaMap.addLayer(bizLayer);
    komunaMap.addLayer(routeLayer);
  }
}

// Lazy init: wait for Events tab to become visible
(function() {
  var eventsPage = document.getElementById('t-events');
  if (!eventsPage) return;

  var observer = new MutationObserver(function() {
    if (eventsPage.style.display !== 'none') {
      if (!komunaMap) initKomunaMap();
      // Fix tile rendering after container becomes visible
      setTimeout(function() { if (komunaMap) komunaMap.invalidateSize(); }, 50);
      setTimeout(function() { if (komunaMap) komunaMap.invalidateSize(); }, 300);
    }
  });

  observer.observe(eventsPage, { attributes: true, attributeFilter: ['style'] });

  // Also init if already visible
  if (eventsPage.style.display !== 'none') {
    initKomunaMap();
  }
})();
