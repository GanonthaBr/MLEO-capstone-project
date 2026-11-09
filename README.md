# Forest-change domain-generalization capstone — Stage 2

Team: Bruno Payang Ganontha and Aichetou Abari Ilior
Track: Research
GitHub URL: NOT YET CREATED

## Current status
Amazonia and Akagera access pilots completed in the working notebook.
The saved automated audit covers amazon_001.
No baseline scores or finalized protected splits are claimed.

## Contents
- data/: manifests and acquisition metadata; no raw imagery copied here.
- checks/: reproducible data-quality outputs.
- design/: draft evaluation design, project changes and pilot disclosure.
- figures/: required M1–M4 figures, to be generated.
- results/: baseline outputs, not yet generated.
- reports/: submission report, to be completed.
- reproducibility/: environment and independent-rerun record.

## Data location
Raw exports remain in Google Drive:
- MyDrive/Amazonia_Source_Pilot
- MyDrive/Akagera_HLS_Pilot

## Running
Mount Google Drive in Colab, install rasterio, and run the collection,
inspection and Stage 2 audit cells.
Save the actual working notebook into this repository before submission.
The notebook is not automatically copied by the audit cell.

## Important limitations
MapBiomas reference labels are provisional and model-derived.
The inspected source patch is not a sufficient independent evaluation set.
No protected-manifest hash is supplied until real assignments are frozen.
No final-test labels or results should enter Stage 2 model development.
