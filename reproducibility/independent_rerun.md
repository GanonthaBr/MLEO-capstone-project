# Independent reproduction record

Status: FAIL
Reviewer: Copilot SDK / local validation
Repository commit: local repo snapshot; no Git metadata was available in this workspace
Date: 2026-11-10
Fresh-copy setup: validated the Stage 2 output bundle from the provided repository snapshot under `results/grouped_logistic_development_v1`
Command/notebook used: Python validation script against `output_manifest.csv`, `run_summary.json`, `development_fold_assignments.csv`, `equal_group_mean_metrics.csv`, and `runtime_and_fit_checks.csv`
Data manifest hash: not re-collected; the provided snapshot does not include a fresh, verifiable data-manifest rerun for this local validation
Software environment:
- Python 3.13.15
- NumPy 2.5.2
- pandas 3.0.5
- rasterio 1.5.1
- scikit-learn 1.9.1
- joblib 1.6.0
- Platform: Windows-11-10.0.26200-SP0

Predeclared acceptance criteria:
- Same file hashes and split assignments.
- Same integer confusion counts for a fixed deterministic baseline,
  or a documented numerical tolerance agreed before rerunning.
- Same leakage-check outcomes.
- No protected data accessed.

Outcome: FAIL
Allowed final outcomes: PASS / PASS AFTER FIXES / FAIL

Fixes and explanations:
The repository’s saved Stage 2 output record is not self-consistent, so the rerun cannot be accepted as reproducible.

Evidence from the local validation:
- `results/grouped_logistic_development_v1/output_manifest.csv` lists expected SHA-256 values for `config.json`, `dependency_checks.csv`, `development_fold_assignments.csv`, `equal_group_mean_metrics.csv`, `metrics.csv`, `environment.json`, and a set of `predictions/*.npz` files.
- The actual hashes on disk do not match those expected values; for example, `config.json` is expected to be `376a1c5...` but the file on disk hashes to `7f1a4a...`.
- `run_summary.json` records `development_assignment_sha256` as `a975ef30a4c48207650cea3281bb5a6bb12cf7e29ca202b226e77fd94087db40`, but the actual `development_fold_assignments.csv` hash is `bc7a1e0eadfe41a999b62626c8a9df868d75b91e2df1fde0e67f268f3e060a0f`.
- The `predictions/` directory listed by the manifest is not present in the repo snapshot. The manifest therefore references files that do not exist.

Because the recorded manifest, saved outputs, and repo artifacts disagree with each other, the Stage 2 development baseline is not currently reproducible to the specified acceptance criteria.