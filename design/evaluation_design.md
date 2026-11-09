# Evaluation design

**Evidence date:** 9 November 2026  
**Status:** Stage 2 development baseline completed; protected
final-evaluation design not yet implemented.

## 1. Research question and scope

The broader research question concerns forest-change model transfer
from Amazonia source environments to dry woodland and montane forest
environments in Rwanda.

Stage 2 evaluates pipeline feasibility and agreement with provisional
source references. It does not establish Rwanda generalization,
foundation-model performance, or causal explanations of transfer loss.

Current scores apply only to eligible pixels in the selected Amazonia
development patches.

## 2. Prediction target and reference construction

The implemented target is persistent forest-to-agricultural conversion
versus stable forest at 30 m resolution.

References are derived from MapBiomas Amazonia Collection 6:

- Stable forest, label 0:
  forest formation, class 3, in 2020, 2021, 2022, and 2023.
- Persistent conversion, label 1:
  forest formation in 2020 and 2021, followed by pasture (15),
  agriculture (18), or mosaic of uses (21) in both 2022 and 2023.
- Ignored, label 255:
  all remaining pixels.

The exact asset is:

`projects/mapbiomas-public/assets/amazon/lulc/collection6/mapbiomas_collection60_integration_v1`

These labels are provisional and model-derived. They do not represent
all forest disturbances or independently verified ground truth.

The image interval is 2021–2023, while the nominal reference
transition is 2021–2022. Annual persistence does not identify the
disturbance date relative to each image acquisition.

## 3. Dataset and eligibility

The baseline contains ten source patches, each 224 × 224 pixels at
30 m resolution.

Each patch includes:

- Six reflectance bands before the change interval.
- Six reflectance bands after the interval.
- A joint imagery-validity mask.
- A provisional binary reference mask.
- Acquisition and grid metadata.

An evaluated pixel must:

1. Have valid, finite data in all six bands on both dates.
2. Pass the exported imagery-validity checks.
3. Have reference label 0 or 1.

Candidate acceptance required:

- Joint valid coverage of at least 80%.
- At least 500 eligible stable-forest pixels.
- At least 50 eligible conversion pixels.

All ten patches passed these numerical thresholds.

| Group | Patches | Stable pixels | Conversion pixels | Eligible pixels |
|---|---:|---:|---:|---:|
| B01 / DG01 | 9 | 221,179 | 5,144 | 226,323 |
| B02 / DG02 | 1 | 48,173 | 116 | 48,289 |
| Total | 10 | 269,352 | 5,260 | 274,612 |

The earlier `amazon_001` pilot is excluded from this baseline.
Akagera imagery is excluded from baseline fitting and scoring.

## 4. Prediction units and dependency groups

Pixels are prediction units, not independent experimental replicates.

The grouping procedure joins samples when they:

- Belong to the same candidate geographic block.
- Share an exact source-image ID.
- Have overlapping geographic bounding boxes.

Connected samples remain in the same dependency group.

The procedure produced:

- DG01: all nine B01 patches.
- DG02: the single B02 patch.

These are conservative development groups, not proof of complete
ecological or event-level independence. Independent disturbance-event
counts have not been established.

No random pixel split or subdivision of a patch is used to create
training and validation independence.

## 5. Implemented development folds

The baseline uses leave-one-group-out development evaluation.

| Fold | Training | Validation |
|---|---|---|
| Hold out DG01 | DG02: one patch | DG01: nine patches |
| Hold out DG02 | DG01: nine patches | DG02: one patch |

Each eligible validation pixel receives an out-of-fold prediction
from a model that did not fit on its dependency group.

Both groups participate in development across the two folds.
Neither group is an untouched final-test set.

Assignments:

`results/grouped_logistic_development_v1/development_fold_assignments.csv`

SHA-256:

`a975ef30a4c48207650cea3281bb5a6bb12cf7e29ca202b226e77fd94087db40`

The hash identifies the development assignments only. It does not
satisfy the protected-manifest requirement.

The grouping and fold-generation code is in the complete grouped
baseline cell of `Forest_Change_Pilot.ipynb`. It uses sorted IDs and
deterministic dependency rules rather than randomized fold allocation.

## 6. Fixed baseline and preprocessing

The baseline has 18 predictors:

- Six before-image reflectance bands.
- Six after-image reflectance bands.
- Six signed differences: after minus before.

Band order is blue, green, red, NIR, SWIR1, SWIR2.

No labels, solar-angle bands, geographic coordinates, or target-domain
observations enter the predictor matrix.

Fixed configuration:

- StandardScaler fitted inside each training-fold pipeline.
- LogisticRegression:
  - C = 1.0
  - class_weight = balanced
  - solver = lbfgs
  - max_iter = 1000
  - tol = 1e-4
  - random_state = 42
- Classification threshold = 0.5.
- All eligible training pixels are used.
- No pixel subsampling, hyperparameter search, calibration, or
  threshold tuning is performed.

The seed is recorded for reproducibility. The current lbfgs fit and
dependency-based grouping do not use randomized sample allocation.

The comparison baseline predicts the training-fold majority class.
Its constant ranking score is the training-fold conversion prevalence.

## 7. Metrics and observed results

Primary ranking metric:

- Conversion average precision.

Secondary metrics:

- Conversion precision.
- Conversion recall.
- Conversion F1.
- Conversion intersection over union.
- Balanced accuracy.
- Integer confusion counts.

Metrics are recorded per patch and per held-out group.
The headline summary is the arithmetic mean of the two group scores,
giving equal weight to groups.

Mean F1 is the mean of fold F1 values, not F1 calculated from mean
precision and mean recall.

| Held-out group | AP | Balanced accuracy | Precision | Recall | F1 | IoU |
|---|---:|---:|---:|---:|---:|---:|
| DG01 | 0.4402 | 0.8780 | 0.1023 | 0.9497 | 0.1848 | 0.1018 |
| DG02 | 0.2887 | 0.8724 | 0.2597 | 0.7500 | 0.3858 | 0.2390 |
| Equal-group mean | 0.3645 | 0.8752 | 0.1810 | 0.8498 | 0.2853 | 0.1704 |

Both fits converged.

The DG01 evaluation uses a model trained on only one patch with
116 positive pixels. The DG02 evaluation has only 116 positive
reference pixels. These constraints limit stability and interpretation.

Metrics describe agreement with provisional references within the
eligible mask, not unbiased whole-map accuracy.

## 8. Leakage checks and unresolved risks

### Spatial and acquisition dependence

The implementation merges patches by block, exact shared image ID,
and overlapping geographic bounding boxes.

Saved fit checks report zero exact shared image IDs across each
training/validation boundary.

Event-level dependence and broader regional correlations remain
unresolved. Non-overlap alone does not prove independence.

### Preprocessing

Standardization is fitted only on the training fold.
Validation pixels do not contribute to scaler fitting.

### Candidate selection

Candidate screening uses provisional reference classes and clear-image
availability. This is a retrospective, selected evaluation population.

It favors persistent conversion and excludes several other land-cover
and disturbance types. Scores cannot be extrapolated to all Amazonia
pixels or converted-area totals.

### Temporal information

The task is retrospective change detection using both image dates,
not forecasting.

Annual 2022–2023 references are used to construct labels and eligibility
masks, not predictor features. Their persistence rule affects sample
selection and does not resolve exact event timing.

### Reference circularity

MapBiomas labels are model-derived. Agreement with them is not
independent ecological validation.

Reference errors, mixed pixels, and boundary disagreement may account
for some apparent model errors.

### Pretraining overlap

No foundation model is used in the Stage 2 baseline.

Potential overlap with foundation-model pretraining data must be
assessed before future geographic-transfer claims.

### Target data

The Akagera pilot has already been inspected and is disclosed as an
access/development pilot. It is not an untouched final-evaluation site.

No Akagera imagery or labels entered this baseline.

## 9. Protected final evaluation — not implemented

The following are not yet available:

- Final protected source/target unit assignments.
- `design/protected_manifest.csv`.
- A protected-manifest commit and SHA-256 hash.
- A named test-data custodian.
- An executed protected-data exclusion guard.
- Verified target reference labels.

Therefore Stage 2 checklist item E3 remains NOT MET.

Already inspected development samples must not be retrospectively
described as untouched test data.

Before future protected evaluation:

1. Identify additional source and target units.
2. Check acquisition, spatial, and event dependencies.
3. Assign roles before inspecting protected labels or model outputs.
4. Save and commit actual assignments and their SHA-256 hash.
5. Record independent-unit counts and permitted reference summaries.
6. Name a custodian and define access responsibilities.
7. Add a code guard that rejects protected IDs during training,
   validation, threshold selection, and calibration.
8. Keep protected labels, predictions, errors, and scores unavailable
   for model development.
9. Evaluate the frozen final method once in Stage 4.

An empty manifest or a development-fold hash is not a substitute.

## 10. Uncertainty and sufficiency

There are only two conservative dependency groups.
Pixel bootstrap intervals would incorrectly treat related observations
as independent and will not be reported.

For Stage 2:

- Report both group results.
- Report the equal-group mean as exploratory.
- Describe group imbalance and reference uncertainty.
- Do not claim a precise population-level confidence interval.

For later stages, collect enough independent units to support
group-level resampling or another justified uncertainty design.
Keep paired model comparisons on the same evaluation units.

Sufficiency conclusion:

The current data support a limited access, quality-check, and grouped
baseline demonstration. They do not establish sufficiency for the
broader Amazonia-to-Rwanda domain-generalization study.

## 11. Future model selection

The Stage 2 baseline remains unchanged as an initial control.

For later eligible model comparisons:

- Use source-development folds for selecting models and settings.
- Proposed primary selection metric: equal-group mean average precision.
- Report precision, recall, F1, and IoU alongside it.
- Prefer the simpler model when development performance is effectively
  tied.
- Perform any threshold selection or calibration only within
  development data, with a documented evaluation protocol.
- Do not use protected target scores to select models or settings.
- Do not present the current exploratory scores as untouched estimates
  for methods subsequently tuned against these same groups.

Verify model checkpoint, spectral-band, temporal, and modality
compatibility before including Prithvi or CROMA.

## 12. Reproducibility and evidence

Reference run:

`results/grouped_logistic_development_v1/`

Key records:

- `config.json`
- `environment.json`
- `metrics.csv`
- `equal_group_mean_metrics.csv`
- `runtime_and_fit_checks.csv`
- `dependency_checks.csv`
- `development_fold_assignments.csv`
- `development_fold_assignments.sha256`
- `run_summary.json`
- `output_manifest.csv`
- `predictions/`
- `figures/`

Input evidence:

- `data/amazon_stage2_recovery_manifest.csv`
- `data/amazon_stage2_recovery_acquisitions.csv`
- `checks/amazon_stage2_recovery_audit.csv`
- `checks/amazon_stage2_shared_acquisitions.csv`
- `design/pilot_access_disclosure.csv`

The uploaded output files matched their recorded hashes during report
preparation. File-integrity verification is not an independent
training rerun.

The independent teammate rerun remains NOT YET RUN. Record its
repository commit, input hashes, environment, discrepancies, fixes,
and final outcome in `reproducibility/independent_rerun.md`.

Before the rerun, use the existing acceptance criteria:

- Matching input hashes and development assignments.
- Matching integer confusion counts for the fixed baseline, or a
  numerical tolerance explicitly agreed before rerunning.
- Matching leakage-check outcomes.
- No protected-data access.

Individual team contribution and review statements remain to be added.