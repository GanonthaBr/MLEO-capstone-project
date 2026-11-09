# Evaluation design

Status: DRAFT — not yet frozen.

## Research question
Assess forest-change model transfer from selected humid-tropical
Amazonia source sites to selected Rwandan woodland and montane sites.
The Stage 2 baseline establishes pipeline feasibility and agreement
with provisional source references; it does not establish target-domain
generalization.

## Prediction target
Binary forest conversion at 30 m. The current pilot restricts reference
labels to persistent forest-to-agricultural conversion and stable forest.
Other pixels are ignored. This is narrower than all canopy disturbance.

## Current evidence
One inspected Amazonia source patch is available. This is insufficient
for independent grouped out-of-fold evaluation.
Akagera is an inspected target-access pilot without verified change labels.

## Units and dependence
Pixels are prediction units, not independent replicates.
Assign patches to spatial blocks. Merge related blocks/groups when they
share an event, overlapping footprint, or acquisition dependency relevant
to the handout. Repeated seasonal pairs stay with their original group.
Do not randomly split pixels or neighboring subchips.

## Development and protected evaluation
Already inspected pilots are development/access samples.
Select new protected units, designate a custodian, and save their roles
before model development. Do not load protected labels, predictions,
errors or scores in the Stage 2 baseline.
Save assignments to design/protected_manifest.csv, commit them, and
record SHA-256 only after the actual assignments have been frozen.
An empty manifest does not satisfy this requirement.

## Proposed Stage 2 baseline
Untuned logistic regression using six bands before, six bands after,
and six signed band differences.
Proposed fixed settings:
- StandardScaler fitted only on each training fold.
- LogisticRegression(C=1.0, class_weight='balanced',
  solver='lbfgs', max_iter=1000, random_state=42).
- Fixed probability threshold 0.5.
- Seed 42 for any training-only pixel subsampling.
- No target-based tuning.
Confirm settings before obtaining baseline scores.

## Out-of-fold evaluation
Use grouped development folds only, with each scored group excluded
from fitting and preprocessing. Use three folds only if collected groups
and class support permit it; otherwise document a defensible smaller
design or report insufficiency. Do not manufacture independent groups
by dividing the existing pilot.
Report exact group assignments and group counts.

## Metrics
Report conversion precision, recall, F1 and confusion counts.
Give pooled out-of-fold results plus per-group results. Report undefined
metrics explicitly when a group lacks relevant positives.
Treat agreement with MapBiomas as proxy-reference agreement, not
independently verified forest-change accuracy.

## Uncertainty and scope
Resample independent groups, not pixels, for uncertainty intervals when
enough groups are available. With few groups, emphasize individual-group
results and acknowledge unstable uncertainty estimates.
No whole-Amazonia, whole-Rwanda or unbiased map-area accuracy claim.

## Leakage checks
Check sample IDs, duplicate file hashes, footprint overlap, shared
acquisition IDs, event groups, role conflicts and training-only fitting
of preprocessing. Record any unresolved dependence.
Document annual-label persistence filters as retrospective reference
construction; do not provide future labels as model inputs.
Investigate potential foundation-model pretraining overlap before
interpreting geographic transfer claims.

## Model selection
Stage 2 baseline configuration is fixed, not selected by performance.
Later model and threshold selection uses source development folds only.
Final evaluation remains protected until Stage 4.

## Remaining decisions
- Final image-date/reference alignment rule.
- Actual independent groups and train/validation/test allocations.
- Target reference source and lawful partner-independent fallback.
- Test-data custodian.
- Number of folds supported by collected data.
