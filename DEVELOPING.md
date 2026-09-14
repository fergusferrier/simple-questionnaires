# Develop and maintain the site

Jekyll renders every questionnaire page from one HTML layout, shared scoring definitions and a text file per language. The published pages contain the full questions and native radio controls. Shared vanilla JavaScript handles scoring and history; one CSS file controls presentation.

## Edit the site

| File | Edit here |
| --- | --- |
| `_layouts/questionnaire.html` | Shared page structure |
| `_data/questionnaires.yml` | Shared scoring definitions and academic references |
| `_data/locales/<code>.json` | Translated interface, questionnaire wording, answer labels and source provenance |
| `styles.css` | Shared styles and responsive layouts |
| `app.js` | Scoring, saving and interaction logic |
| `phq-9.html`, `gad-7.html`, `who-5.html` | English page declarations |
| `<code>/`, such as `es/` or `ar/` | Translated page declarations and locale script selectors |
| `translations/catalog.json` | Source PDF URLs, checksums, variants and review status |

Jekyll writes generated files to `_site/`. Edit the source files above; generated files are replaced on the next build.

## Preview locally

Install Ruby and Bundler, then install this project's dependencies once:

```sh
bundle install
```

Start the preview:

```sh
bundle exec jekyll serve --host 127.0.0.1 --port 4173 --baseurl ''
```

Open [PHQ-9](http://127.0.0.1:4173/phq-9.html), [GAD-7](http://127.0.0.1:4173/gad-7.html) or [WHO-5](http://127.0.0.1:4173/who-5.html). Saving a source file rebuilds the site; refresh the browser to see the change.

To generate the static site without starting a server:

```sh
bundle exec jekyll build
```

## Publish on GitHub Pages

GitHub Pages publishes the repository root on `codex/initial-site`. Push changes to that branch to publish an update.

GitHub Pages runs Jekyll and publishes the generated HTML. Canonical links use the URL in `_config.yml`; navigation and assets use its base path. The preview command overrides that path locally.

A dedicated hostname isolates saved results from unrelated Pages projects on the same origin. Set it before people start saving history: browser storage does not move between origins.

## Change questionnaire content

Verify wording and scoring against the original source before changing an instrument. Check score boundaries and keyboard controls after changes. The matrix appears from 640px, joined rows from 481–639px, and joined vertical choices at 480px and below.

These are screening instruments, not a diagnostic service. Source attribution and terms are in the [README](README.md#sources-and-permissions).

## Maintain translations

English is the default at existing URLs. Translations have paths such as `/es/phq-9.html`. Each page contains its complete translated form before JavaScript runs. Jekyll emits the page's text as `locale.js`; the same `app.js` scores every language. There is no runtime translation service.

1. Select and verify a source from the [translation catalogue](translations/README.md). Preserve the wording, item order and response-to-score mapping. Record any deliberate adaptations.
2. Create `_data/locales/<code>.json` using English as the interface-key reference. Translate every interface string and preserve substitution tokens such as `{score}`. Include only questionnaires with verified translations.
3. Add a small `<code>/<instrument>.html` declaration for each available questionnaire, with `layout: questionnaire`, `questionnaire: <instrument>` and `lang: "<code>"` in its front matter. Copy a current locale's `index.html` and `locale.js` selectors, changing their `lang`. Quote language codes in YAML, especially `"no"`, which YAML otherwise treats as a boolean.
4. Set `dir` appropriately. Arabic, Hebrew, Persian and Urdu use right-to-left layouts. Test the question order, joined button corners, numeric scores and saved history.
5. Run the checks below, then review all included forms in the browser. Complete a form, copy its result, save, change language and delete history. Check keyboard controls and widths around 480px and 640px.
6. Mark the reviewed sources `included` in the catalogue.

Navigation falls back explicitly to English if another questionnaire is unavailable in the current language. Language suggestions and footer links only offer translations of the current questionnaire. Canonical URLs, reciprocal `hreflang` links, English `x-default` and the sitemap are rendered from the available locale data.

The browser may suggest a language from `navigator.languages`, but never redirects automatically. The suggestion disappears when answering starts; dismissal lasts for the browser session. Language links remain inside the footer's Languages disclosure.

History stays shared across languages on the same origin. Existing English records remain valid. New records also retain their locale and translation version. Keep the legacy numeric definition `version` values stable unless deliberately migrating stored history.

## Check a build

Node.js is only needed for the built-in test runner, not for building or running the website. No npm dependencies are required.

```sh
bundle exec jekyll build
node --test tests/i18n.test.cjs
node --check _site/app.js
```

The tests cover every possible total and severity boundary, incomplete forms, copied answer text, existing saved history, interface keys, language preferences, static forms, navigation, language links and sitemap coverage. Set `QUESTIONNAIRE_SITE_DIR` when testing a build in another directory.
