# Simple Questionnaires

PHQ-9, GAD-7 and WHO-5, with instant scores and optional history in your browser.

Jekyll renders all three pages from one HTML layout and one questionnaire data file. The published pages contain the full questions and native radio controls. Shared vanilla JavaScript handles scoring and history; one CSS file controls presentation.

## Edit the site

| File | Edit here |
| --- | --- |
| `_layouts/questionnaire.html` | Shared page structure and interface text |
| `_data/questionnaires.yml` | Questionnaire wording, answer options, scoring bands and sources |
| `styles.css` | Shared styles and responsive layouts |
| `app.js` | Scoring, saving and interaction logic |
| `phq-9.html`, `gad-7.html`, `who-5.html` | Small page declarations selecting each questionnaire |

Jekyll writes generated files to `_site/`. Edit the source files above; generated files are replaced on the next build.

## Preview locally

Install Ruby and Bundler, then install this project's dependencies once:

```sh
bundle install
```

Start the preview:

```sh
bundle exec jekyll serve --host 127.0.0.1 --port 4173
```

Open [PHQ-9](http://127.0.0.1:4173/phq-9.html), [GAD-7](http://127.0.0.1:4173/gad-7.html) or [WHO-5](http://127.0.0.1:4173/who-5.html). Saving a source file rebuilds the site; refresh the browser to see the change.

To generate the static site without starting a server:

```sh
bundle exec jekyll build
```

## Publish on GitHub Pages

1. Push this directory to its own public GitHub repository
2. Set `url` in `_config.yml` to the site's origin, such as `https://USERNAME.github.io`
3. Set `baseurl` to the repository path, such as `/simple-questionnaires`, or leave it empty for a site at the domain root
4. In **Settings → Pages**, select **Deploy from a branch**, choose the source branch and **/(root)**, then save

GitHub Pages runs Jekyll and publishes the generated HTML. Canonical links use the configured URL; navigation and assets use the configured base path. For a local preview of a repository-path site, append `--baseurl ''` to the preview command.

A dedicated hostname isolates saved results from unrelated Pages projects on the same origin. Set it before people start saving history: browser storage does not move between origins.

## Change questionnaire content

Verify wording and scoring against the original source before changing an instrument. Check score boundaries and keyboard controls after changes. The matrix appears from 640px, joined rows from 481–639px, and joined vertical choices at 480px and below.

These are screening instruments, not a diagnostic service. Source attribution and terms are in [NOTICE.md](NOTICE.md).
