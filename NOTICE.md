# Questionnaire sources and rights

Sources checked on 2026-09-14.

## PHQ-9

The English wording follows the [published form hosted by Stanford](https://med.stanford.edu/content/dam/sm/ppc/documents/DBP/PHQ-9_bilingual.pdf). Scoring guidance comes from the [University of Washington AIMS Center](https://aims.uw.edu/resource/phq-9-depression-scale/) and [Kroenke, Spitzer and Williams, 2001](https://doi.org/10.1046/j.1525-1497.2001.016009606.x).

The nine scored items total 0–27. Severity bands are 0–4, 5–9, 10–14, 15–19 and 20–27. The separate functioning question is unscored. A positive response to item 9 displays support information independently of the total score.

## GAD-7

The English wording follows the [published form hosted by the University of Washington](https://aims.uw.edu/wordpress/wp-content/uploads/2023/06/GAD-7_English_0.pdf). Scoring follows [Spitzer and colleagues, 2006](https://doi.org/10.1001/archinte.166.10.1092).

The seven items total 0–21. Severity bands are 0–4, 5–9, 10–14 and 15–21.

PHQ-9 and GAD-7 were developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. The forms state that no permission is required to reproduce, translate, display or distribute them.

## WHO-5

World Health Organization. *The World Health Organization-Five Well-Being Index (WHO-5).* Geneva: World Health Organization; 2024. [Original publication](https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01).

© World Health Organization 2024. Licensed under [CC BY-NC-SA 3.0 IGO](https://creativecommons.org/licenses/by-nc-sa/3.0/igo/). The questionnaire and its adapted digital presentation in this project use the same licence. This permits attributed, non-commercial reuse under its terms. WHO does not endorse this project. The WHO logo is not used.

The interface changes the layout and uses selection markers instead of printed answer scores. Item wording, response labels and scoring are preserved. The five items total 0–25, multiplied by four for a score of 0–100. Higher scores indicate better well-being. Scores below 50 suggest poor well-being and further assessment.

## Privacy behaviour

Scoring runs in the browser. No answers or scores are transmitted. There are no tracking scripts, cookies, external fonts or remote runtime dependencies.

An explicit saving choice persists in `simple-questionnaires.history.v1` in localStorage. Stored records contain an identifier, questionnaire identifier and version, completion timestamp and total score. Individual answers are not stored. Correcting a completed questionnaire updates the same record. Starting again creates a new attempt.

History is shared across the three routes on the same origin. Deleting all saved results removes this storage key and disables automatic saving. The code never clears unrelated localStorage keys.

The optional browser WebMCP tool fills the current questionnaire and uses the same scoring and saving rules as the form. Browsers without WebMCP support use the ordinary controls.

GitHub Pages logs visitor IP addresses for security. This is separate from questionnaire responses. External source and support links navigate to other sites only when selected.
