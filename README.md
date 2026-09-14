# Simple questionnaires

PHQ-9, GAD-7 and WHO-5, with instant scores and optional history in your browser.

Each questionnaire is a self-contained HTML file with inline CSS and vanilla JavaScript. The repository has no packages, dependencies or build step. Edit the HTML files directly. Keep shared behaviour consistent across the three files.

## Preview locally

From this directory, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [the PHQ-9 page](http://127.0.0.1:4173/phq-9/). The other routes are `/gad-7/` and `/who-5/`.

Use a local server when checking history. Browsers do not guarantee consistent localStorage behaviour for `file:` URLs.

## Publish on GitHub Pages

1. Push this directory to its own public GitHub repository
2. Open **Settings → Pages**
3. Select **Deploy from a branch**, choose the branch containing these files, and select **/(root)**
4. Save the setting

GitHub serves the HTML files directly. `.nojekyll` disables Jekyll processing. Relative links support both a repository path and a dedicated domain.

Use a dedicated hostname to isolate saved results from unrelated Pages projects on the same origin. Set the hostname before people start saving history, because browser storage does not move between origins.

After publishing, add the final questionnaire URLs as canonical links and list them in a sitemap. Verify the site in Search Console and request indexing.

## Change the questionnaires

Verify wording and scoring against the original source before changing an instrument. Keep the visible questions, the embedded questionnaire definitions and accessible answer labels consistent. Test the score boundaries and keyboard controls after changes.

The files contain standard screening instruments, not a diagnostic service. Source attribution and terms are in [NOTICE.md](NOTICE.md).
