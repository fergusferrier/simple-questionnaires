# Translation sources

Spanish, French and German are included for all three questionnaires. Each uses published questionnaire wording, with translated interface text. English remains at the existing URLs.

The remaining source documents are ready for later batches. The catalogue records 124 non-English PDFs across 56 language/script codes, checked on 14 September 2026:

| Questionnaire | Selected source PDFs | Included | Awaiting review |
| --- | ---: | ---: | ---: |
| PHQ-9 | 51 | 3 | 48 |
| GAD-7 | 43 | 3 | 40 |
| WHO-5 | 30 | 3 | 27 |

- [catalog.json](catalog.json) records each selected language, regional variant, source URL, local filename, SHA-256 checksum and status
- [pfizer-variants.json](pfizer-variants.json) retains the full PHQ Screeners catalogue, including alternative country/community variants
- `source-pdfs/` holds the downloaded originals locally; PDFs are excluded from Git and the published website

Restore or verify the archive from the repository root with Python 3 and curl:

```sh
python3 scripts/download-sources.py
```

The script stops if a file's checksum changes, so a revised source cannot silently replace the version used for transcription.

## Source choices

PHQ-9 and GAD-7 use the Spanish for Spain, French for France and German for Germany forms from [PHQ Screeners](https://www.phqscreeners.com/). The original distribution catalogue is [here](https://www.phqscreeners.com/js/ul_to_dropdownvfinal.js).

WHO-5 uses translations distributed with the [WHO publication](https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01). The Spanish and German forms date from 1998 and the French form from 1999; their distribution alongside the 2024 publication does not make them newly translated or newly validated. WHO's accompanying notice says that these translations predate its acceptance of copyright and that the English edition is binding.

In Spanish WHO-5 item 4, the printed typo “descandado” is corrected to “descansado”. This correction is also disclosed beside the source link on the page. Introductory instructions are shortened for the digital layout. Scored item order, answer options and scoring are retained. PHQ-9's ancillary unscored functioning question remains omitted.

Questionnaire wording was checked against the nine PDFs. Interface translations were machine-assisted and then reviewed during implementation; they have not had independent native-speaker or clinical review. The web presentation has not been separately validated. Report corrections through the repository's issue tracker without including personal answers or results.

## Add the next batch

Availability is per questionnaire: a language does not need all three forms. Choose one documented regional variant per language, preserving a separate script code where needed, such as `zh-Hant`.

Read and visually check each source PDF before including it. Some pending files have broken text extraction or scanned pages; extracted text alone is not sufficient. Translate the whole interface, including feedback, scoring context and safety information. Keep wording and provenance in `_data/locales/<code>.json`; follow the [development guide](../DEVELOPING.md) for page declarations and checks.

Only locale files and page declarations create website pages. A source marked `pending-review` in this catalogue is not a published translation. The catalogue, scripts and PDFs are excluded from the site build.
