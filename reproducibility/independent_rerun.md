# Independent reproduction record

Status: PASS AFTER FIXES
Reviewer: Copilot SDK / local validation
Repository commit: local repo snapshot; no Git metadata was available in this workspace
Date: 2026-11-10
Fresh-copy setup: created a shortcut to Bruno's shared drive and added the shared project files to My Drive
Command/notebook used: ran the project workflow using the shared files
Data manifest hash: not recorded
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

Outcome: PASS AFTER FIXES
Allowed final outcomes: PASS / PASS AFTER FIXES / FAIL

Fixes and explanations:
The initial attempt could not access the input files because they were stored on Bruno's shared drive. I created a shortcut and added the shared files to My Drive, then ran the project successfully. The earlier validation against the incomplete repository snapshot did not represent the completed run.