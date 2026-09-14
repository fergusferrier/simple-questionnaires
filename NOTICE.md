# Questionnaire sources and rights

Sources checked on 2026-09-14.

## PHQ-9

Kroenke K, Spitzer RL, Williams JBW. [The PHQ-9: validity of a brief depression severity measure](https://doi.org/10.1046/j.1525-1497.2001.016009606.x). *Journal of General Internal Medicine*. 2001;16(9):606–613.

Item wording and response options follow the [English form hosted by Stanford](https://med.stanford.edu/content/dam/sm/ppc/documents/DBP/PHQ-9_bilingual.pdf). This is a university-hosted copy of the questionnaire, not the original research publication. Further guidance is available from the [University of Washington AIMS Center](https://aims.uw.edu/resource/phq-9-depression-scale/).

The nine scored items total 0–27. Severity bands are 0–4, 5–9, 10–14, 15–19 and 20–27. The introductory instruction is shortened and the ancillary unscored functioning question is omitted. A positive response to item 9 displays support information independently of the total score.

## GAD-7

Spitzer RL, Kroenke K, Williams JBW, Löwe B. [A brief measure for assessing generalized anxiety disorder: the GAD-7](https://doi.org/10.1001/archinte.166.10.1092). *Archives of Internal Medicine*. 2006;166(10):1092–1097.

The English wording follows the [form hosted by the University of Washington](https://aims.uw.edu/wordpress/wp-content/uploads/2023/06/GAD-7_English_0.pdf). This is a university-hosted copy. The paper's DOI is the persistent academic reference. Guidance on the threshold for further evaluation is reproduced by the [American Academy of Family Physicians](https://www.aafp.org/afp/2015/0501/p617).

The seven items total 0–21. Severity bands are 0–4, 5–9, 10–14 and 15–21.

PHQ-9 and GAD-7 were developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational grant from Pfizer Inc. The forms state that no permission is required to reproduce, translate, display or distribute them. [PHQ Screeners](https://www.phqscreeners.com/) is the instruments' distribution site. These permissions concern the questionnaire forms, not unrestricted reuse of the journal articles.

## WHO-5

World Health Organization. *The World Health Organization-Five Well-Being Index (WHO-5).* Geneva: World Health Organization; 2024. [Original publication](https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01).

© World Health Organization 2024. Licensed under [CC BY-NC-SA 3.0 IGO](https://creativecommons.org/licenses/by-nc-sa/3.0/igo/). The questionnaire and its adapted digital presentation in this project use the same licence. This permits attributed, non-commercial reuse under its terms. WHO does not endorse this project. The WHO logo is not used.

The interface changes the layout, simplifies the introductory instruction and uses selection markers instead of printed answer scores. Item wording, response labels and scoring are preserved. The five items total 0–25, multiplied by four for a score of 0–100. Higher scores indicate better well-being. Scores below 50 suggest poor well-being and further assessment. This web presentation has not been separately validated.

## Privacy behaviour

Scoring runs in the browser. No answers or scores are transmitted. There are no tracking scripts, cookies, external fonts or remote runtime dependencies.

An explicit saving choice persists in `simple-questionnaires.history.v1` in localStorage. Stored records contain an identifier, questionnaire identifier and version, completion timestamp and total score. Individual answers are not stored. Correcting a completed questionnaire updates the same record. Starting again creates a new attempt.

History is shared across the three routes on the same origin. Deleting all saved results removes this storage key and disables automatic saving. The code never clears unrelated localStorage keys.

GitHub Pages logs visitor IP addresses for security. This is separate from questionnaire responses. External source and support links navigate to other sites only when selected.
