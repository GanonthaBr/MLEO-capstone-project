# Forest-change domain generalization — Stage 2

**Course:** 04-762 Machine Learning for Earth Observation, Fall 2026  
**Track:** Research  
**Team:** Bruno Payang Ganontha and Aichetou Abari Ilior  
**Repository:** https://github.com/GanonthaBr/MLEO-capstone-project  
**Evidence date:** 9 November 2026

## Project

This project investigates forest-change model transfer from Amazonia
source environments to dry woodland and montane forest environments
in Rwanda.

Stage 2 establishes data access, numerical quality checks, grouped
development evaluation, and an untuned baseline. It does not yet
evaluate foundation models or demonstrate transfer to Rwanda.

The implemented prediction task is narrower than general forest
disturbance: persistent forest-to-agricultural conversion versus
stable forest, using provisional MapBiomas references.

## Current results

- Ten Amazonia development patches passed numerical quality checks.
- Every patch is 224 × 224 pixels at 30 m resolution.
- Joint valid imagery coverage ranges from 99.9801% to 100%.
- There are 274,612 eligible reference pixels:
  - 269,352 stable-forest pixels.
  - 5,260 provisional conversion pixels.
- Dependency checks produced two development groups:
  - DG01 / B01: nine patches.
  - DG02 / B02: one patch.
- An untuned logistic-regression baseline completed both
  leave-one-group-out folds.
- Both fits converged.
- No exact source-image IDs crossed fold boundaries.
- No Rwanda imagery entered baseline training or evaluation.
- Protected final-evaluation assignments have not been created.
- The independent teammate rerun remains outstanding.

Pixel counts describe prediction support, not independent sample size.
Two geographic groups do not establish sufficiency for the broader
domain-generalization study.

## Baseline results

Results measure agreement with provisional reference labels on
eligible pixels.

| Held-out group | Average precision | Balanced accuracy | Conversion precision | Conversion recall | Conversion F1 | Conversion IoU |
|---|---:|---:|---:|---:|---:|---:|
| DG01 | 0.4402 | 0.8780 | 0.1023 | 0.9497 | 0.1848 | 0.1018 |
| DG02 | 0.2887 | 0.8724 | 0.2597 | 0.7500 | 0.3858 | 0.2390 |
| Equal-group mean | 0.3645 | 0.8752 | 0.1810 | 0.8498 | 0.2853 | 0.1704 |

The constant training-majority comparator has equal-group mean
average precision 0.0126 and balanced accuracy 0.5000.

The baseline ranks conversion pixels better than the constant
comparator, but precision at the fixed threshold is low.
The DG01 model was trained on one patch containing only 116
conversion pixels, which makes interpretation particularly fragile.

## Repository organization

- `Forest_Change_Pilot.ipynb`
  - Working Colab notebook: pilot loading, audits, and grouped baseline.
- `gee/`
  - Final GEE collection scripts, to be saved from the working scripts.
- `data/`
  - Input manifests, file hashes, and acquisition metadata.
- `checks/`
  - Raster-quality audits and shared-acquisition records.
- `design/`
  - Evaluation design, pilot-access disclosure, project changes,
    and remaining-work plan.
- `results/grouped_logistic_development_v1/`
  - Baseline configuration, environment, development assignments,
    dependency checks, metrics, runtime, and output hashes.
  - `figures/`: per-patch prediction and error figures.
  - `predictions/`: local out-of-fold prediction arrays, if retained.
  - `models/`: local fitted models, if retained.
- `reproducibility/`
  - Audit environment and independent-rerun record.
- `reports/`
  - Stage 2 report, once copied into this folder.

Raw imagery is stored separately in Google Drive. Models and prediction
arrays may be omitted from Git; they can be regenerated.

The README describes the intended repository layout. Ensure the
notebook, final GEE scripts, and report are copied into these locations
before pushing.

## Data sources

### Optical imagery

- Dataset: NASA HLS S30 v2.0.
- GEE asset: `NASA/HLS/HLSS30/v002`.
- DOI: https://doi.org/10.5067/HLS/HLSS30.002
- Bands: B2, B3, B4, B8A, B11, B12.
- Model order: blue, green, red, NIR, SWIR1, SWIR2.
- HLS reflectance is used as supplied by GEE without an additional
  scale factor.

Catalog:
https://developers.google.com/earth-engine/datasets/catalog/NASA_HLS_HLSS30_v002

### Provisional source references

- Dataset: MapBiomas Amazonia Collection 6, 1985–2023.
- GEE asset:
  `projects/mapbiomas-public/assets/amazon/lulc/collection6/mapbiomas_collection60_integration_v1`
- Annual bands used: 2020, 2021, 2022, 2023.

Derived labels:

- `0`: forest formation, class 3, in all four years.
- `1`: forest formation in 2020 and 2021, followed by pasture (15),
  agriculture (18), or mosaic of uses (21) in both 2022 and 2023.
- `255`: ignored.

MapBiomas data are distributed under CC BY 4.0. Attribute the source
and identify the binary reference masks as derived modifications.

Attribution:
MapBiomas Project — Collection 6 of the Annual Series of Land Use
and Land Cover Maps of Amazonia, accessed 9 November 2026.

Source and terms:
https://github.com/mapbiomas/user-toolkit

## Google Drive layout

Because the team did not have enough local storage to keep the imagery,
the shared source files are stored in Bruno's Google Drive. He has shared
them with the team. Before running the notebook, each collaborator must
make sure the shared files are organized in their own Google Drive under
the folder names below; Colab mounts that user's Drive, not Bruno's
Drive. Copy the shared files into the matching folders in `MyDrive` so
the notebook can find them.

The notebook expects these folders directly under `MyDrive`:

- `Akagera_HLS_Pilot/`
- `Amazonia_Source_Pilot/`
- `Amazonia_Source_Stage2/`
- `MLEO_STAGE2_SUBMISSION/`

Each Stage 2 source sample has five files:

- `<sample_id>_before_2021.tif`
- `<sample_id>_after_2023.tif`
- `<sample_id>_provisional_labels.tif`
- `<sample_id>_joint_valid.tif`
- `<sample_id>_metadata.csv`

The `_r2` suffix identifies recovered candidates. Preserve these IDs.

The original collection log records the first attempt. Its timeout
statuses do not describe the final quality of recovered exports.
Use `checks/amazon_stage2_recovery_audit.csv` for the completed audit.

## Reproducing the development baseline

1. Clone the repository and open `Forest_Change_Pilot.ipynb` in Colab.
2. Mount Google Drive.
3. Copy the shared source files from Bruno's Drive into your own mounted
   `MyDrive`, preserving the folder names and file layout above.
4. Install the notebook dependencies.
5. Run the complete cell headed:
   `AMAZONIA STAGE 2 — AUDIT ORIGINAL + RECOVERED EXPORTS`.
6. Confirm the expected sample IDs and quality-check results.
   This cell creates the in-memory `stage2_samples` dictionary.
7. Run the complete cell headed:
   `STAGE 2 — GROUPED DEVELOPMENT BASELINE`.
8. Compare assignments, metrics, confusion counts, and leakage checks
   against the saved reference run.
9. Record the independent rerun outcome in
   `reproducibility/independent_rerun.md`.

The earlier pilot cells are useful for reproducing pilot inspection
but are not required to fit the ten-patch baseline.

Do not blindly run the older evidence-writing cell after updating the
documentation: it contains the earlier one-patch README and design text
and can overwrite current files. The old collection-log diagnostic
also reports historical outcomes rather than recovery acceptance.

Running the baseline again creates a timestamped results directory
when the original run directory already exists. Preserve the original
reference results.

The input manifests contain expected SHA-256 hashes. Exact reproduction
should use the recorded exports. Re-running GEE selection is a new
collection attempt and must be checked against those recorded inputs.

## Baseline configuration

- Features: six before bands, six after bands, six signed differences.
- Preprocessing: StandardScaler fitted only on each training fold.
- Model: LogisticRegression.
- C: 1.0.
- Class weights: balanced.
- Solver: lbfgs.
- Maximum iterations: 1000.
- Tolerance: 1e-4.
- Recorded seed: 42.
- Decision threshold: 0.5.
- Sampling: all eligible pixels; no subsampling.
- Evaluation: leave one dependency group out.
- Hyperparameter or threshold tuning: none.

## Recorded environment

| Package | Version |
|---|---|
| Python | 3.13.18 |
| NumPy | 2.4.6 |
| pandas | 2.2.3 |
| rasterio | 1.5.2 |
| scikit-learn | 1.6.1 |
| joblib | 1.6.0 |

These are the versions reported by the executed notebook, not a
separately validated installation lockfile. Capture the actual
environment used for an independent rerun.

Both fits converged. Deprecation warnings are preserved in
`runtime_and_fit_checks.csv`. Runtime is environment-specific.

## Evaluation protection and limitations

All ten source patches are development samples. The earlier Amazonia
and Akagera pilots have also been inspected and cannot be described
as untouched final-test samples.

The saved development-assignment hash is:

`a975ef30a4c48207650cea3281bb5a6bb12cf7e29ca202b226e77fd94087db40`

This is not a protected-test manifest hash.

Important limitations:

- Only two conservative dependency groups are available.
- Exact disturbance dates are not verified.
- The 2021–2023 image interval is wider than the nominal
  2021–2022 reference transition.
- References are model-derived and remain provisional.
- Candidate screening favors conversion-containing, clear patches.
- Stable nonforest and other disturbance types are not evaluated.
- Grid equality does not prove subpixel image registration.
- No whole-region accuracy or converted-area claim is supported.
- No foundation-model or Rwanda transfer result is reported.
- Final protected assignments and independent reproduction remain
  incomplete.

See `design/evaluation_design.md` for the implemented design and
planned final-evaluation controls.
