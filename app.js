---
---
// Jekyll supplies the same questionnaire data used to render the HTML.
const questionnaires = {{ site.data.questionnaires | jsonify }};

function scoreAnswers(id, answers) {
  const q = questionnaires[id];
  if (!q || !Array.isArray(answers) || answers.length !== q.items.length) throw new Error('Invalid questionnaire or answer count.');
  if (answers.some(x => x !== null && (!Number.isInteger(x) || !q.values.includes(x)))) throw new Error('Invalid answer.');
  if (answers.some(x => x === null)) return null;
  const raw = answers.reduce((sum, value) => sum + value, 0);
  const score = id === 'who-5' ? raw * 4 : raw;
  return { score, raw, label: id === 'who-5' ? (score < 50 ? 'Low well-being' : '') : q.bands.find(([min, max]) => score >= min && score <= max)[2], support: id === 'phq-9' && answers[8] > 0 };
}
function validateHistory(input) {
  if (!input || input.version !== 1 || typeof input.saving !== 'boolean' || !Array.isArray(input.results) || input.results.length > 10000) throw new Error('Saved history has an unsupported format.');
  const ids = new Set();
  const results = input.results.map(row => {
    const q = row && Object.hasOwn(questionnaires, row.instrument) ? questionnaires[row.instrument] : null;
    if (!q || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id) || row.version !== q.version || !Number.isInteger(row.score) || row.score < 0 || row.score > q.max || (row.instrument === 'who-5' && row.score % 4 !== 0) || typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.date) || Number.isNaN(Date.parse(row.date))) throw new Error('The history contains an invalid or duplicate result.');
    ids.add(row.id);
    return { id: row.id, instrument: row.instrument, version: row.version, date: new Date(row.date).toISOString(), score: row.score };
  });
  return { version: 1, saving: input.saving, results };
}

function formatResult(id, values, date) {
  const q = questionnaires[id];
  const result = scoreAnswers(id, values);
  const items = q.items.map((question, index) => {
    const points = values[index];
    const answer = q.options[q.values.indexOf(points)];
    return `${index + 1}. ${question}\n${answer} (${points} ${points === 1 ? 'pt' : 'pts'})`;
  });
  let text = `${q.name} — ${date}\nTimeframe: past two weeks.\n\n${items.join('\n\n')}\n\nTotal: ${result.score}/${q.max}${result.label ? ` — ${result.label}` : ''}`;
  if (id === 'who-5') text += `\nRaw total: ${result.raw}/25, multiplied by 4.`;
  text += '\nScreening result, not a diagnosis.';
  if (result.support) text += '\nQuestion 9 was positive. Discuss this with a health professional promptly, regardless of the total score.';
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
  const dateFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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
      error('Browser history could not be read. Your score still works, but results will not be saved. Existing data has not been overwritten. You can reset this site’s data in your browser settings.');
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
      error('This result could not be saved. Browser storage may be blocked or full. You can still copy your result.');
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
    const row = { id: attempt, instrument, version: q.version, date: completedAt, score: current.score };
    const results = existing ? state.results.map(item => item.id === attempt ? row : item) : [...state.results, row];
    if (writeState({ ...state, results })) showResultNotice('✓ Result saved on this device.');
    else showResultNotice('Not saved. See the browser storage message below.', false);
  }
  function renderResult(shouldSave = true) {
    const values = answers();
    current = scoreAnswers(instrument, values);
    $('copy-fallback').hidden = true;
    $('copy-text').value = '';
    $('result-announcement').textContent = current
      ? `Result: ${current.score} out of ${q.max}${current.label ? `, ${current.label}` : ''}.`
      : 'Answer all questions to see your result.';
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
      const label = row.instrument === 'who-5' ? (row.score < 50 ? 'Low well-being' : '—') : definition.bands.find(([min, max]) => row.score >= min && row.score <= max)[2];
      for (const value of [dateFormat.format(new Date(row.date)), definition.name, `${row.score} / ${definition.max}`, label]) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      const td = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'row-delete'; button.type = 'button'; button.textContent = 'Delete';
      button.setAttribute('aria-label', `Delete ${definition.name} result from ${dateFormat.format(new Date(row.date))}`);
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
    $('delete-title').textContent = id === 'all' ? 'Delete all saved results?' : 'Delete this result?';
    $('delete-description').textContent = id === 'all'
      ? 'This removes the history for all three questionnaires from this browser and switches automatic saving off. This cannot be undone.'
      : 'This removes this result from your browser history. This cannot be undone.';
    $('confirm-delete').textContent = id === 'all' ? 'Delete everything' : 'Delete result';
    $('delete-dialog').showModal();
    $('cancel-delete').focus();
  }
  function deleteConfirmed() {
    if (pendingDelete === 'all') {
      try {
        localStorage.removeItem(key);
        state = emptyState(); storageIssue = false; suppressSave = true; error('');
        showResultNotice('');
        showNotice('history-status', 'Saved results deleted. Automatic saving is off.');
      } catch { error('The browser could not delete saved data. Try clearing this site’s data in your browser settings.'); }
    } else if (pendingDelete && readState()) {
      if (writeState({ ...state, results: state.results.filter(row => row.id !== pendingDelete) })) {
        if (pendingDelete === attempt) { suppressSave = true; showResultNotice(''); }
        showNotice('history-status', 'Result deleted.');
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
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => renderResult());
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
    try { await navigator.clipboard.writeText(resultText()); showResultNotice('✓ Result copied.'); }
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

})();
