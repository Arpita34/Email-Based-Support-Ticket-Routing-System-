/**
 * TicketAI — Frontend Logic
 * Handles classification requests, animated results, and session history.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Billing:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)' },
  Technical: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'  },
  Account:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)' },
  General:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
};

const PRIORITY_CLASSES = {
  High:   { cls: 'priority-high',   emoji: '🔴' },
  Medium: { cls: 'priority-medium', emoji: '🟡' },
  Low:    { cls: 'priority-low',    emoji: '🟢' },
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const emailInput       = document.getElementById('emailInput');
const charCount        = document.getElementById('charCount');
const classifyBtn      = document.getElementById('classifyBtn');
const clearBtn         = document.getElementById('clearBtn');
const resultCard       = document.getElementById('resultCard');
const loadingCard      = document.getElementById('loadingCard');
const errorCard        = document.getElementById('errorCard');
const errorMessage     = document.getElementById('errorMessage');
const resultCategory   = document.getElementById('resultCategory');
const categoryIcon     = document.getElementById('categoryIcon');
const categoryName     = document.getElementById('categoryName');
const priorityBadge    = document.getElementById('priorityBadge');
const confidenceValue  = document.getElementById('confidenceValue');
const confidenceBar    = document.getElementById('confidenceBar');
const scoreBars        = document.getElementById('scoreBars');
const resultTimestamp  = document.getElementById('resultTimestamp');
const historyList      = document.getElementById('historyList');
const historyEmpty     = document.getElementById('historyEmpty');
const clearHistoryBtn  = document.getElementById('clearHistoryBtn');

// ─── Session History ─────────────────────────────────────────────────────────
let sessionHistory = [];

// ─── Character Counter ────────────────────────────────────────────────────────
emailInput.addEventListener('input', () => {
  const len = emailInput.value.length;
  charCount.textContent = `${len} / 5000`;
  charCount.style.color = len > 4500 ? '#ef4444' : len > 4000 ? '#f59e0b' : '';
});

// ─── Quick Fill Buttons ───────────────────────────────────────────────────────
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.text;
    emailInput.value = text;
    emailInput.dispatchEvent(new Event('input'));
    emailInput.focus();

    // Visual feedback
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 150);
  });
});

// ─── Clear Button ─────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  emailInput.value = '';
  emailInput.dispatchEvent(new Event('input'));
  hideAll();
  emailInput.focus();
});

// ─── Clear History ────────────────────────────────────────────────────────────
clearHistoryBtn.addEventListener('click', () => {
  sessionHistory = [];
  renderHistory();
});

// ─── Classify Button ──────────────────────────────────────────────────────────
classifyBtn.addEventListener('click', classify);
emailInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') classify();
});

async function classify() {
  const text = emailInput.value.trim();
  if (!text) {
    shakeElement(emailInput);
    emailInput.focus();
    return;
  }

  setUIState('loading');

  try {
    const res = await fetch('/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_text: text }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }

    displayResult(data, text);
    addToHistory(text, data);
    setUIState('result');

  } catch (err) {
    errorMessage.textContent = err.message || 'Unable to connect to the classification server.';
    setUIState('error');
  }
}

// ─── Display Result ───────────────────────────────────────────────────────────
function displayResult(data, originalText) {
  const { category, confidence_pct, priority, icon, color, all_scores } = data;
  const catStyle = CATEGORY_COLORS[category] || { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' };
  const priStyle = PRIORITY_CLASSES[priority] || PRIORITY_CLASSES['Low'];

  // Category
  categoryIcon.textContent = icon;
  categoryName.textContent = category;
  categoryName.style.color = catStyle.color;
  resultCategory.style.borderColor = catStyle.border;

  // Priority
  priorityBadge.className = `priority-badge ${priStyle.cls}`;
  priorityBadge.textContent = `${priStyle.emoji}  ${priority} Priority`;

  // Timestamp
  resultTimestamp.textContent = new Date().toLocaleTimeString();

  // Confidence bar — trigger animation after a tick
  confidenceValue.textContent = '0%';
  confidenceBar.style.width = '0%';
  requestAnimationFrame(() => {
    setTimeout(() => {
      confidenceBar.style.width = `${confidence_pct}%`;
      animateNumber(confidenceValue, 0, confidence_pct, 1200, v => `${v.toFixed(1)}%`);
    }, 80);
  });

  // Score breakdown
  renderScoreBars(all_scores, category);

  // Glow the result card with category color
  resultCard.style.borderColor = catStyle.border;
  resultCard.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${catStyle.bg}`;
}

// ─── Score Breakdown Bars ─────────────────────────────────────────────────────
function renderScoreBars(scores, topCategory) {
  scoreBars.innerHTML = '';
  const cats = ['Billing', 'Technical', 'Account', 'General'];
  const catColors = { Billing: '#f59e0b', Technical: '#ef4444', Account: '#3b82f6', General: '#10b981' };

  cats.forEach((cat, i) => {
    const pct = ((scores[cat] || 0) * 100).toFixed(1);
    const isTop = cat === topCategory;

    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <span class="score-label">${cat}</span>
      <div class="score-track">
        <div class="score-fill" id="sf-${cat}"
          style="background: ${catColors[cat]}; ${isTop ? 'box-shadow: 0 0 8px ' + catColors[cat] + '55;' : 'opacity: 0.45;'}">
        </div>
      </div>
      <span class="score-pct">${pct}%</span>
    `;
    scoreBars.appendChild(row);

    // Animate fill after short stagger delay
    setTimeout(() => {
      const fill = document.getElementById(`sf-${cat}`);
      if (fill) fill.style.width = `${pct}%`;
    }, 100 + i * 80);
  });
}

// ─── History Panel ─────────────────────────────────────────────────────────────
function addToHistory(text, data) {
  sessionHistory.unshift({ text, data, time: new Date() });
  if (sessionHistory.length > 20) sessionHistory.pop();
  renderHistory();
}

function renderHistory() {
  if (sessionHistory.length === 0) {
    historyEmpty.classList.remove('hidden');
    // Remove all items except empty message
    Array.from(historyList.children).forEach(child => {
      if (child !== historyEmpty) child.remove();
    });
    return;
  }

  historyEmpty.classList.add('hidden');
  // Clear non-empty nodes
  Array.from(historyList.children).forEach(child => {
    if (child !== historyEmpty) child.remove();
  });

  sessionHistory.forEach(entry => {
    const { text, data, time } = entry;
    const catStyle = CATEGORY_COLORS[data.category] || { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)' };
    const preview = text.length > 80 ? text.slice(0, 80) + '…' : text;
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <span class="history-text" title="${escHtml(text)}">${escHtml(preview)}</span>
      <div class="history-meta">
        <span class="history-cat" style="color:${catStyle.color}; background:${catStyle.bg}; border: 1px solid ${catStyle.border}">
          ${data.icon} ${data.category}
        </span>
        <span class="history-time">${timeStr}</span>
      </div>
    `;

    // Click to re-fill textarea
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      emailInput.value = text;
      emailInput.dispatchEvent(new Event('input'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    historyList.appendChild(item);
  });
}

// ─── UI State Machine ─────────────────────────────────────────────────────────
function setUIState(state) {
  hideAll();
  classifyBtn.disabled = state === 'loading';

  if (state === 'loading') {
    loadingCard.classList.remove('hidden');
  } else if (state === 'result') {
    resultCard.classList.remove('hidden');
  } else if (state === 'error') {
    errorCard.classList.remove('hidden');
  }

  if (state !== 'idle') {
    resultCard.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
}

function hideAll() {
  resultCard.classList.add('hidden');
  loadingCard.classList.add('hidden');
  errorCard.classList.add('hidden');
  resultCard.style.boxShadow = '';
  resultCard.style.borderColor = '';
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

function animateNumber(el, from, to, duration, formatter) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = formatter(from + (to - from) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Inject shake keyframes ───────────────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}`;
document.head.appendChild(styleSheet);

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHistory();
emailInput.focus();
console.log('%c🎫 TicketAI', 'font-size:20px;font-weight:bold;color:#6366f1');
console.log('%cEmail-Based Support Ticket Routing System', 'color:#94a3b8');
console.log('%cCtrl+Enter to classify', 'color:#475569');
