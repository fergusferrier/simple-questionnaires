const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const site = process.env.QUESTIONNAIRE_SITE_DIR || '_site';
const locales = Object.fromEntries(fs.readdirSync('_data/locales').map(file => [file.replace('.json', ''), JSON.parse(fs.readFileSync(path.join('_data/locales', file), 'utf8'))]));
const script = fs.readFileSync(path.join(site, 'app.js'), 'utf8');
function runtime(locale) {
  const context = vm.createContext({ window: { questionnaireLocale: locale } });
  vm.runInContext(script.slice(0, script.indexOf('(() => {')), context);
  return context;
}
function route(language, instrument) { return `${language === 'en' ? '' : language + '/'}${instrument}.html`; }

for (const [language, locale] of Object.entries(locales)) {
  const context = runtime(locale);
  test(`${language}: complete UI and intact substitutions`, () => {
    assert.deepEqual(Object.keys(locale.ui).sort(), Object.keys(locales.en.ui).sort());
    for (const [key, value] of Object.entries(locale.ui)) {
      assert.equal(typeof value, 'string'); assert.ok(value.trim(), key);
      assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (locales.en.ui[key].match(/\{\w+\}/g) || []).sort(), key);
      assert.ok(!/ZXQ\d|87654|\ufffd|\(cid:/.test(value), key);
    }
  });
  for (const [id, form] of Object.entries(locale.questionnaires)) {
    const count = { 'phq-9': 9, 'gad-7': 7, 'who-5': 5 }[id];
    const maxAnswer = id === 'who-5' ? 5 : 3;
    test(`${language}/${id}: all totals, labels, incomplete answers and copy text`, () => {
      assert.equal(form.items.length, count);
      for (const value of [...form.items, ...form.options]) { assert.ok(value.trim()); assert.ok(!/ZXQ\d|\ufffd|\(cid:/.test(value)); }
      assert.equal(form.options.length, maxAnswer + 1);
      for (let raw = 0; raw <= count * maxAnswer; raw++) {
        let remainder = raw;
        const answers = Array.from({ length: count }, () => { const value = Math.min(maxAnswer, remainder); remainder -= value; return value; });
        const result = context.scoreAnswers(id, answers);
        assert.equal(result.score, id === 'who-5' ? raw * 4 : raw);
        const band = id === 'phq-9' ? (raw < 5 ? 0 : raw < 10 ? 1 : raw < 15 ? 2 : raw < 20 ? 3 : 4) : (raw < 5 ? 0 : raw < 10 ? 1 : raw < 15 ? 2 : 3);
        assert.equal(result.label, id === 'who-5' ? (raw * 4 < 50 ? locale.ui.lowWellbeing : '') : form.bandLabels[band]);
        const copied = context.formatResult(id, answers, '2026-09-14');
        assert.ok(copied.includes(locale.ui.copyDisclaimer));
        if (form.translationNotice) assert.ok(copied.includes(form.translationNotice));
        for (const item of form.items) assert.ok(copied.includes(item));
        assert.ok(!copied.includes('undefined'));
      }
      assert.equal(context.scoreAnswers(id, Array(count).fill(null)), null);
      assert.throws(() => context.scoreAnswers(id, Array(count).fill(99)));
    });
    test(`${language}/${id}: static HTML, local navigation and reciprocal language links`, () => {
      const html = fs.readFileSync(path.join(site, route(language, id)), 'utf8');
      assert.ok(html.includes(`<html lang="${language}"`));
      assert.equal((html.match(/type="radio"/g) || []).length, count * (maxAnswer + 1));
      assert.ok(!/\{\{|\{%|undefined|ZXQ\d/.test(html));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes(`/${route(language, id)}"`));
      const navigation = html.match(/<nav[\s\S]*?<\/nav>/)[0];
      for (const instrument of Object.keys(locale.questionnaires)) assert.ok(navigation.includes(`/${route(language, instrument)}"`));
      for (const [other, translation] of Object.entries(locales)) {
        if (!translation.questionnaires[id]) continue;
        assert.ok(html.includes(`rel="alternate" hreflang="${other}"`));
        assert.ok(html.includes(`data-language="${other}"`));
      }
      assert.ok(html.includes('hreflang="x-default"'));
    });
  }
  test(`${language}: original history survives, other language records validate`, () => {
    const original = { version: 1, saving: true, results: [{ id: 'old-result', instrument: 'phq-9', version: 'PHQ-9-English', date: '2026-09-14T12:00:00Z', score: 12 }] };
    const validated = context.validateHistory(original);
    assert.equal(validated.results[0].locale, 'en');
    validated.results.push({ id: 'translated-result', instrument: 'who-5', version: 'WHO-5-English-2024', date: '2026-09-14T13:00:00Z', score: 72, locale: 'es', translationVersion: 'test-version' });
    assert.equal(context.validateHistory(validated).results[1].locale, 'es');
    if (locale.questionnaires['phq-9']) assert.equal(context.scoreAnswers('phq-9', [0, 0, 0, 0, 0, 0, 0, 0, 1]).support, true);
  });
}
test('language preferences honour priority, regional variants and unavailable translations', () => {
  const { preferredLanguage } = runtime(locales.en);
  assert.equal(preferredLanguage(['es-MX', 'en'], ['en', 'es', 'fr', 'de']), 'es');
  assert.equal(preferredLanguage(['en-GB', 'fr'], ['en', 'es', 'fr', 'de']), 'en');
  assert.equal(preferredLanguage(['fr-CA'], ['en', 'de']), null);
  assert.equal(preferredLanguage(['it', 'de-DE'], ['en', 'de']), 'de');
  assert.equal(preferredLanguage(['nb-NO'], ['en', 'no']), 'no');
  assert.equal(preferredLanguage(['tl-PH'], ['en', 'fil']), 'fil');
  assert.equal(preferredLanguage(['zh-TW'], ['en', 'zh', 'zh-Hant']), 'zh-Hant');
});
test('the home page offers all questionnaires without a redirect or JavaScript', () => {
  const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  assert.ok(!/http-equiv="refresh"|<script\b/.test(html));
  const cards = [...html.matchAll(/<a class="questionnaire-card" href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(cards.length, 3);
  for (const id of Object.keys(locales.en.questionnaires)) assert.ok(cards.some(url => url.endsWith(`/${id}.html`)));
  assert.ok(html.indexOf('<footer class="site-footer">') > html.indexOf('</main>'));
});
test('the sitemap lists the home page and published questionnaire pages', () => {
  const sitemap = fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8');
  const expected = Object.values(locales).reduce((count, locale) => count + Object.keys(locale.questionnaires).length, 0);
  assert.equal((sitemap.match(/<loc>/g) || []).length, expected + 1);
  const home = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
  const canonical = home.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
  for (const [language, locale] of Object.entries(locales)) for (const id of Object.keys(locale.questionnaires)) assert.ok(sitemap.includes(`/${route(language, id)}</loc>`));
});

test('every catalogued translation has exactly one published form', () => {
  const catalog = JSON.parse(fs.readFileSync('translations/catalog.json', 'utf8'));
  const sources = Array.isArray(catalog) ? catalog : catalog.sources;
  for (const source of sources) {
    const form = locales[source.locale]?.questionnaires[source.instrument];
    assert.ok(form, `${source.locale}/${source.instrument}`);
    assert.equal(form.source, source.url);
    assert.equal(source.status, 'included');
  }
  assert.equal(sources.length, Object.entries(locales).filter(([code]) => code !== 'en').reduce((n, [, locale]) => n + Object.keys(locale.questionnaires).length, 0));
});
