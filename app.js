---
---
// Numeric definitions are shared by every language. Text arrives in locale.js.
const definitions = {{ site.data.questionnaires | jsonify }};
const locale = window.questionnaireLocale;
const t = locale.ui;
const questionnaires = Object.fromEntries(Object.entries(definitions).map(([id, definition]) => {
  const text = locale.questionnaires[id];
  return [id, { ...definition, ...text, bands: definition.bands.map(([min, max], index) => [min, max, text?.bandLabels[index] || '']) }];
}));
function message(key, values = {}) {
  return t[key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
}
function preferredLanguage(preferences, available) {
  for (const preference of preferences) {
    const normalized = preference.toLowerCase();
    const exact = available.find(code => code.toLowerCase() === normalized);
    if (exact) return exact;
    const language = normalized.split('-')[0];
    const base = { nb: 'no', tl: 'fil' }[language] || language;
    if (base === 'zh') {
      const traditional = /(?:hant|tw|hk|mo)/i.test(normalized);
      const chinese = available.find(code => code === (traditional ? 'zh-Hant' : 'zh'));
      if (chinese) return chinese;
    }
    const match = available.find(code => code.toLowerCase() === base);
    if (match) return match;
  }
  return null;
}

function scoreAnswers(id, answers) {
  const q = questionnaires[id];
  if (!q || !Array.isArray(answers) || answers.length !== q.items.length) throw new Error('Invalid questionnaire or answer count.');
  if (answers.some(x => x !== null && (!Number.isInteger(x) || !q.values.includes(x)))) throw new Error('Invalid answer.');
  if (answers.some(x => x === null)) return null;
  const raw = answers.reduce((sum, value) => sum + value, 0);
  const score = id === 'who-5' ? raw * 4 : raw;
  return { score, raw, label: id === 'who-5' ? (score < 50 ? t.lowWellbeing : '') : q.bands.find(([min, max]) => score >= min && score <= max)[2], support: id === 'phq-9' && answers[8] > 0 };
}
function validateHistory(input) {
  if (!input || input.version !== 1 || typeof input.saving !== 'boolean' || !Array.isArray(input.results) || input.results.length > 10000) throw new Error('Saved history has an unsupported format.');
  const ids = new Set();
  const results = input.results.map(row => {
    const q = row && Object.hasOwn(questionnaires, row.instrument) ? definitions[row.instrument] : null;
    if (!q || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id) || row.version !== q.version || !Number.isInteger(row.score) || row.score < 0 || row.score > q.max || (row.instrument === 'who-5' && row.score % 4 !== 0) || typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.date) || Number.isNaN(Date.parse(row.date))) throw new Error('The history contains an invalid or duplicate result.');
    ids.add(row.id);
    const language = row.locale || 'en';
    if (typeof language !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language)) throw new Error('Invalid saved language.');
    if (row.translationVersion !== undefined && (typeof row.translationVersion !== 'string' || row.translationVersion.length > 80)) throw new Error('Invalid translation version.');
    return { id: row.id, instrument: row.instrument, version: row.version, date: new Date(row.date).toISOString(), score: row.score, locale: language, ...(row.translationVersion ? { translationVersion: row.translationVersion } : {}) };
  });
  return { version: 1, saving: input.saving, results };
}

function formatResult(id, values, date) {
  const q = questionnaires[id];
  const result = scoreAnswers(id, values);
  const items = q.items.map((question, index) => {
    const points = values[index];
    const answer = q.options[q.values.indexOf(points)];
    return `${index + 1}. ${question}\n${answer} (${points} ${points === 1 ? t.point : t.points})`;
  });
  const label = result.label ? ` — ${result.label}` : '';
  let text = `${q.name} — ${date}\n${t.timeframe}\n\n${items.join('\n\n')}\n\n${message('copyTotal', { score: result.score, max: q.max, label })}`;
  if (id === 'who-5') text += `\n${message('copyRaw', { raw: result.raw })}`;
  if (q.translationNotice) text += `\n${q.translationNotice}`;
  text += `\n${t.copyDisclaimer}`;
  if (result.support) text += `\n${t.copySupport}`;
  return text;
}

(() => {
  'use strict';
  const instrument = document.body.dataset.instrument;
  const q = questionnaires[instrument];
  const key = 'simple-questionnaires.history.v1';
  const $ = id => document.getElementById(id);
  document.querySelector('.history').hidden = false;
  const form = $('questionnaire');
  const emptyState = () => ({ version: 1, saving: false, results: [] });
  let state = emptyState();
  let current = null;
  let attempt = crypto.randomUUID();
  let completedAt = null;
  let suppressSave = false;
  let storageIssue = false;
  let pendingDelete = null;
  const noticeTimers = new Map();
  const dateFormat = new Intl.DateTimeFormat(locale.code, { year: 'numeric', month: Intl.DateTimeFormat.supportedLocalesOf(locale.code).length ? 'short' : '2-digit', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  function error(message) {
    $('storage-error').hidden = !message;
    $('storage-error').textContent = message;
  }
  function showNotice(id, message, dismiss = true) {
    clearTimeout(noticeTimers.get(id));
    $(id).textContent = message;
    if (message && dismiss) noticeTimers.set(id, setTimeout(() => { $(id).textContent = ''; }, 4000));
  }
  function showResultNotice(message, dismiss = true) {
    showNotice('save-status', message, dismiss);
  }
  function readState() {
    try {
      const raw = localStorage.getItem(key);
      state = raw ? validateHistory(JSON.parse(raw)) : emptyState();
      storageIssue = false;
      error('');
      return true;
    } catch {
      storageIssue = true;
      error(t.readError);
      return false;
    }
  }
  function writeState(next) {
    try {
      next = validateHistory(next);
      localStorage.setItem(key, JSON.stringify(next));
      state = next;
      storageIssue = false;
      error('');
      return true;
    } catch {
      error(t.writeError);
      return false;
    }
  }
  function answers() {
    const data = new FormData(form);
    return q.items.map((_, index) => data.has(`q${index}`) ? Number(data.get(`q${index}`)) : null);
  }
  function persistCurrent() {
    if (!current || suppressSave || !readState() || !state.saving) return;
    const existing = state.results.find(row => row.id === attempt);
    const row = { id: attempt, instrument, version: q.version, locale: locale.code, translationVersion: q.translationVersion, date: completedAt, score: current.score };
    const results = existing ? state.results.map(item => item.id === attempt ? row : item) : [...state.results, row];
    if (writeState({ ...state, results })) showResultNotice(t.saved);
    else showResultNotice(t.notSaved, false);
  }
  function renderResult(shouldSave = true) {
    const values = answers();
    current = scoreAnswers(instrument, values);
    $('copy-fallback').hidden = true;
    $('copy-text').value = '';
    $('result-announcement').textContent = current
      ? message('announcement', { score: current.score, max: q.max, label: current.label ? `, ${current.label}` : '' })
      : t.incomplete;
    $('result-prompt').hidden = !!current;
    $('result-score').hidden = !current;
    $('result-details').hidden = !current;
    $('score-advice').hidden = !current || (instrument !== 'who-5' && current.score < 10);
    $('result-actions').hidden = !current;
    $('copy-result').disabled = !current;
    $('support').hidden = !(instrument === 'phq-9' && values[8] !== null && values[8] > 0);
    if (current) {
      if (!completedAt) completedAt = new Date().toISOString();
      $('score-value').textContent = String(current.score);
      if ($('result-label')) $('result-label').textContent = current.label;
      showResultNotice('');
      if (shouldSave) persistCurrent();
    } else {
      $('score-value').textContent = '—';
      if ($('result-label')) $('result-label').textContent = '';
      showResultNotice('');
    }
    for (const band of document.querySelectorAll('[data-score-min]')) {
      const selected = current && current.score >= Number(band.dataset.scoreMin) && current.score <= Number(band.dataset.scoreMax);
      if (selected) band.setAttribute('aria-current', 'true');
      else band.removeAttribute('aria-current');
    }
    renderHistory();
  }
  function renderHistory() {
    $('saving-toggle').checked = state.saving && !storageIssue;
    $('saving-toggle').disabled = storageIssue;
    $('save-result').hidden = !current || state.saving;
    $('save-result').disabled = storageIssue;
    const rows = [...state.results].sort((a, b) => b.date.localeCompare(a.date));
    const body = $('history-rows');
    body.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement('tr');
      const definition = questionnaires[row.instrument];
      const bandKeys = row.instrument === 'phq-9' ? ['bandMinimal', 'bandMild', 'bandModerate', 'bandModeratelySevere', 'bandSevere'] : ['bandMinimal', 'bandMild', 'bandModerate', 'bandSevere'];
      const label = row.instrument === 'who-5' ? (row.score < 50 ? t.lowWellbeing : '—') : t[bandKeys[definition.bands.findIndex(([min, max]) => row.score >= min && row.score <= max)]];
      for (const value of [dateFormat.format(new Date(row.date)), definition.name, `${row.score} / ${definition.max}`, label]) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      const td = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'row-delete'; button.type = 'button'; button.textContent = t.delete;
      button.setAttribute('aria-label', message('deleteRow', { name: definition.name, date: dateFormat.format(new Date(row.date)) }));
      button.addEventListener('click', () => confirmDeletion(row.id));
      td.append(button); tr.append(td); body.append(tr);
    }
    $('history-table').hidden = rows.length === 0;
    $('history-empty').hidden = rows.length !== 0;
    $('history-count').textContent = rows.length ? ` · ${rows.length}` : '';
    $('delete-all').hidden = rows.length === 0;
  }
  function setSaving(enabled) {
    if (!readState()) { renderHistory(); return; }
    if (writeState({ ...state, saving: enabled })) {
      if (enabled) { suppressSave = false; persistCurrent(); }
      else showResultNotice('');
    }
    renderHistory();
  }
  function confirmDeletion(id) {
    pendingDelete = id;
    $('delete-title').textContent = id === 'all' ? t.deleteAllTitle : t.deleteOneTitle;
    $('delete-description').textContent = id === 'all'
      ? t.deleteAllDescription
      : t.deleteOneDescription;
    $('confirm-delete').textContent = id === 'all' ? t.deleteEverything : t.deleteResult;
    $('delete-dialog').showModal();
    $('cancel-delete').focus();
  }
  function deleteConfirmed() {
    if (pendingDelete === 'all') {
      try {
        localStorage.removeItem(key);
        state = emptyState(); storageIssue = false; suppressSave = true; error('');
        showResultNotice('');
        showNotice('history-status', t.deletedAll);
      } catch { error(t.deleteError); }
    } else if (pendingDelete && readState()) {
      if (writeState({ ...state, results: state.results.filter(row => row.id !== pendingDelete) })) {
        if (pendingDelete === attempt) { suppressSave = true; showResultNotice(''); }
        showNotice('history-status', t.deletedOne);
      }
    }
    pendingDelete = null;
    $('delete-dialog').close();
    renderHistory();
    $('saving-toggle').focus();
  }
  function resultText() {
    return formatResult(instrument, answers(), dateFormat.format(new Date(completedAt)));
  }
  // Sticky prompts and headings must not cover an answer reached with the keyboard.
  const prompt = form.querySelector('.instructions');
  const matrixHeading = form.querySelector('thead');
  form.addEventListener('focusin', event => {
    if (!event.target.matches('input[type="radio"]')) return;
    const heading = matrixHeading.offsetHeight ? matrixHeading : prompt;
    if (getComputedStyle(heading).position !== 'sticky') return;
    const answerTop = event.target.getBoundingClientRect().top;
    const headingBottom = Math.max(prompt.getBoundingClientRect().bottom, matrixHeading.getBoundingClientRect().bottom);
    if (answerTop < headingBottom + 8) event.target.scrollIntoView({ block: 'center' });
  });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => { $('language-suggestion').hidden = true; renderResult(); });
  $('saving-toggle').addEventListener('change', event => setSaving(event.target.checked));
  $('save-result').addEventListener('click', () => {
    setSaving(true);
    if (state.saving) $('copy-result').focus();
  });
  $('print-result').addEventListener('click', () => window.print());
  $('new-result').addEventListener('click', () => {
    form.reset(); current = null; attempt = crypto.randomUUID(); completedAt = null; suppressSave = false;
    $('copy-fallback').hidden = true; renderResult(false);
    form.querySelector('input').focus();
  });
  $('copy-result').addEventListener('click', async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(resultText()); showResultNotice(t.copied); }
    catch { $('copy-fallback').hidden = false; $('copy-text').value = resultText(); $('copy-text').focus(); $('copy-text').select(); }
  });
  $('delete-all').addEventListener('click', () => confirmDeletion('all'));
  $('cancel-delete').addEventListener('click', () => $('delete-dialog').close());
  $('confirm-delete').addEventListener('click', deleteConfirmed);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      readState(); renderHistory();
      showResultNotice('');
    }
  });
  form.reset(); readState(); renderResult(false);
  const languageLinks = [...document.querySelectorAll('[data-language]')];
  const language = preferredLanguage(navigator.languages || [navigator.language], languageLinks.map(link => link.dataset.language));
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('simple-questionnaires.language-dismissed') === '1'; } catch { /* Suggestions also work when storage is unavailable. */ }
  if (!dismissed && language && language !== locale.code) {
    const link = languageLinks.find(item => item.dataset.language === language);
    $('language-suggestion-text').textContent = link.dataset.prompt;
    $('language-suggestion-link').textContent = link.dataset.visit;
    $('language-suggestion-link').href = link.href;
    $('dismiss-language').textContent = link.dataset.dismiss;
    $('language-suggestion').lang = language;
    $('language-suggestion').dir = link.dataset.direction;
    $('language-suggestion').hidden = false;
  }
  $('dismiss-language').addEventListener('click', () => {
    $('language-suggestion').hidden = true;
    try { sessionStorage.setItem('simple-questionnaires.language-dismissed', '1'); } catch { /* Dismissal still applies to this page. */ }
    form.querySelector('input').focus();
  });

})();
