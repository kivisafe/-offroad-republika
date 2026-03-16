// ===== CORE: Event Bus + Shared Helpers =====
// All modules communicate through OR.emit/OR.on — no direct dependencies

var OR = {
  _events: {},
  on: function(event, fn) {
    (this._events[event] = this._events[event] || []).push(fn);
  },
  off: function(event, fn) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(function(f) { return f !== fn; });
  },
  emit: function(event, data) {
    (this._events[event] || []).forEach(function(fn) { fn(data); });
  }
};

// ===== SAFE HTML =====
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== TOAST SYSTEM =====
// Note: msg parameter is always escaped before display to prevent XSS
var _toastTimer;
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(_toastTimer);
  // Always use textContent for safety — no raw HTML in toasts
  t.textContent = '';
  t.textContent = msg;
  t.className = 'toast on' + (type ? ' t-' + type : '');
  _toastTimer = setTimeout(function() { t.classList.remove('on'); }, 3000);
}

// ===== TIME AGO =====
function timeAgo(dateStr) {
  if (!dateStr) return '';
  var now = new Date(), d = new Date(dateStr);
  var diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'сега';
  if (diff < 3600) return Math.floor(diff / 60) + 'м';
  if (diff < 86400) return Math.floor(diff / 3600) + 'ч';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'д';
  return Math.floor(diff / 2592000) + 'м';
}

// ===== USER AVATARS =====
var AVA_COLORS = ['#e8622c', '#5a8a3c', '#4682b4', '#c49a6c', '#d4a543', '#8b5a8b', '#e8aa2c', '#6ba4d4', '#a0522d', '#cd5c5c'];
function userAvatar(user, size) {
  if (!user) return '';
  var s = size || 32;
  if (user.emoji && user.emoji.length <= 2) {
    var hash = 0;
    for (var i = 0; i < (user.id || '').length; i++) hash = (hash * 31 + (user.id || '').charCodeAt(i)) & 0xffff;
    var bg = AVA_COLORS[hash % AVA_COLORS.length];
    return '<div class="user-ava" style="width:' + s + 'px;height:' + s + 'px;background:' + bg + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + Math.round(s * 0.5) + 'px">' + user.emoji + '</div>';
  }
  return '<div class="user-ava" style="width:' + s + 'px;height:' + s + 'px;background:var(--card);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:' + Math.round(s * 0.5) + 'px">&#x1F464;</div>';
}

// ===== FORM VALIDATION =====
function validateField(fieldId, rules) {
  var el = document.getElementById(fieldId);
  if (!el) return true;
  var val = el.value.trim();
  var errEl = document.getElementById(fieldId + '-err');
  for (var i = 0; i < rules.length; i++) {
    var r = rules[i];
    if (r.required && !val) { if (errEl) errEl.textContent = r.msg || 'Задължително поле'; el.classList.add('input-err'); return false; }
    if (r.minLen && val.length < r.minLen) { if (errEl) errEl.textContent = r.msg || 'Минимум ' + r.minLen + ' символа'; el.classList.add('input-err'); return false; }
    if (r.maxLen && val.length > r.maxLen) { if (errEl) errEl.textContent = r.msg || 'Максимум ' + r.maxLen + ' символа'; el.classList.add('input-err'); return false; }
    if (r.pattern && !r.pattern.test(val)) { if (errEl) errEl.textContent = r.msg || 'Невалиден формат'; el.classList.add('input-err'); return false; }
  }
  if (errEl) errEl.textContent = '';
  el.classList.remove('input-err');
  return true;
}
function validateForm(fields) {
  var valid = true;
  for (var i = 0; i < fields.length; i++) {
    if (!validateField(fields[i].id, fields[i].rules)) valid = false;
  }
  return valid;
}

// ===== BUTTON HANDLERS =====
function handleBtn(el, msg, type) {
  if (event) event.stopPropagation();
  showToast(msg || 'Готово!', type || 'success');
}

// ===== BUTTON SUBMIT EFFECT =====
function btnSubmitEffect(btn) {
  if (!btn) return;
  btn.classList.add('btn-submitting');
  btn.setAttribute('disabled', 'true');
  setTimeout(function() {
    btn.classList.remove('btn-submitting');
    btn.removeAttribute('disabled');
  }, 1200);
}

// ===== MARKDOWN RENDERER =====
function renderMarkdown(text) {
  if (!text) return '';
  var h = escHtml(text);
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/`(.+?)`/g, '<code>$1</code>');
  h = h.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(m, alt, src) {
    return '<img src="' + escHtml(src) + '" alt="' + escHtml(alt) + '" style="max-width:100%;border-radius:8px;margin:8px 0">';
  });
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m, label, href) {
    return '<a href="' + escHtml(href) + '" target="_blank" rel="noopener" style="color:var(--orange)">' + label + '</a>';
  });
  h = h.replace(/@(\w+)/g, '<span class="mention" onclick="openProfile(\'$1\')">@$1</span>');
  h = h.replace(/#([\wа-яА-Я]+)/g, function(m, tag) {
    return '<span class="hashtag" onclick="filterByTag(\'' + escHtml(tag) + '\')">#' + escHtml(tag) + '</span>';
  });
  h = h.replace(/\n/g, '<br>');
  return h;
}

// ===== REPORT SYSTEM (data layer) =====
function getReports() { try { return JSON.parse(localStorage.getItem('orReports') || '[]'); } catch (e) { return []; } }
function saveReports(r) { localStorage.setItem('orReports', JSON.stringify(r)); }
