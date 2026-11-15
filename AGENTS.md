# AGENTS.md

## Project state

- An initial commit exists; current work is uncommitted. There is no CI or task runner; backend tests live in `backend/tests/`.
- `frontend/` has the Mission Control UI, a 2D Mars Explorer map, a graphical Route Planner and an Aeolian Dynamics page. The map renders real NASA Mars Trek WMTS mosaics (HiRISE and CTX of Jezero, global MOLA and a preliminary Jezero CTX mosaic) through OpenLayers and the backend. The Route Planner overlays a simulated traverse for visualization only; it has no route editing or terrain analysis. Aeolian Dynamics lists real metadata-only Mars manifests and runs observed-migration analyses on caller-supplied local files. Mission telemetry, targets, risks and events remain simulated, and no model prediction is shown.
- `backend/` is a FastAPI app exposing `GET /api/health`, the Mars catalog under `/api/v1/mars/`, verified/live WMTS capabilities and an `/api/v1/aeolian/` integration that runs `mars_ml` on caller-supplied local observations. Root `README.md` is the project doc; `docs/data_sources.md` records provenance.
- `mars_ml/` is an independent computer-vision/ML workspace for dune detection, registration, apparent 2D displacement, morphology, Mars metadata ingestion, migration analysis and grouped research models. Stage 1 covered the Earth-oriented CV pipeline; Stage 2 added verified Mars metadata, ingestion, migration methods, sequence orchestration and validation. It has its own Python 3.14 venv and does not import FastAPI or React. No satellite pixels or per-dune labels are committed, and no reusable model checkpoint is presented.

## Layout

- `frontend/` — Vite + React 19 + JavaScript (JSX). Entry: `src/main.jsx` -> `src/App.jsx`.
- `backend/` — FastAPI app factory in `app/main.py`, versioned routers under `app/api/v1/`, schemas in `app/schemas/`, static data in `app/services/`, config in `app/core/config.py`, tests in `tests/`. Uses the checked-in `.venv/` (Python 3.14).
- `mars_ml/` — independent CV/ML package with its own `.venv`; see `mars_ml/README.md`, `mars_ml/STAGE1_REPORT.md` and `mars_ml/STAGE2_REPORT.md`.
- `docs/` — data provenance in `data_sources.md`.

## Frontend

Run commands from `frontend/`. Dependencies are already installed; commit
`package-lock.json` with changes.

- `npm run dev` — Vite dev server on `http://localhost:5173`
- `npm run lint` — ESLint (JS/JSX)
- `npm run build` — `vite build`; there is no TypeScript typecheck step
- `npm run preview` — serve the production build

Verify changes with `npm run lint && npm run build` before finishing. There is
no test suite; for runtime confidence, serve the build and check the rendered
DOM (headless Chrome is available).

Source layout:

- `src/components/layout/` — app shell, sidebar, header.
- `src/components/dashboard/` — overview panels and stat cards.
- `src/components/charts/` — Chart.js wrappers; register new chart types in `chartSetup.js`.
- `src/components/map/` — `MarsMap` (OpenLayers), layer selector, controls, info, legend and attribution.
- `src/components/aeolian/` — dataset catalog/details, local-analysis form, observed results and prediction-unavailable panel.
- `src/pages/` — one page per route; `MarsExplorer.jsx` owns the map state and API calls.
- `src/services/` — `navigation.js` (nav + sections), `missionData.js` (all demo data) and `marsApi.js` (the only API client).
- `src/hooks/` — shared hooks (`useClock`).
- `src/styles/` — `global.css` (palette tokens), `layout.css`, `dashboard.css`, `pages.css`, `map.css`, `aeolian.css`.

Routes: `/`, `/explorer`, `/terrain`, `/routes`, `/targets`, `/ai`, `/aeolian`,
plus a 404. When adding a section, update both `src/App.jsx` and
`src/services/navigation.js`; every nav item must have a page.

This is a JSX-only app: ESLint targets `js/jsx`, there is no `tsconfig`, and
`vite.config.ts` only registers the React plugin. Do not add TypeScript source
files without migrating the lint/build setup.

All telemetry, progress, risks, targets, and events live in
`src/services/missionData.js` and are simulated. Keep the `SimulationNotice`
and `SIMULATED` labels; never present these values as real measurements or claim
an active human mission at Jezero Crater. The Mars Explorer map is the exception:
its HiRISE/CTX tiles and WMTS metadata are real NASA products. UI copy is
English; project docs are Spanish.

`src/services/marsApi.js` is the only API client. It defaults to
`http://127.0.0.1:8000` and reads `VITE_API_BASE_URL`. The map expects the
backend catalog/capabilities endpoints; keep loading, error and retry states
when changing it. OpenLayers uses the Mars projection `IAU2000:104905` in
degrees and streams tiles directly from `trek.nasa.gov`; do not proxy or cache
tiles in the backend. The Aeolian page expects the backend dataset/analyze
endpoints and accepts only relative image/mask paths under `AEOLIAN_DATA_ROOT`;
it does not upload files. Keep prediction UI explicitly unavailable and never
render simulated model output.

Use the CSS variables in `src/styles/global.css` instead of hardcoded palette
values, and keep new UI responsive (the sidebar becomes a drawer under 900px).

`cesium` is declared as a dependency but is not imported or configured anywhere
yet. Do not add Cesium until the dedicated 3D map stage: it needs static-asset /
`CESIUM_BASE_URL` setup.

## Backend

Use the checked-in backend venv for backend work; it is separate from the
`mars_ml` venv.

- `backend/.venv/bin/python`, `backend/.venv/bin/pip` (Python 3.14)
- Install: `backend/.venv/bin/pip install -r backend/requirements.txt`

Run from `backend/`:

- `.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000` — dev server on `127.0.0.1:8000`
- `.venv/bin/python -m pytest -q` — backend tests (currently 54 passed; no external network calls)
- `.venv/bin/python -m compileall app tests` — quick syntax check
- Health check is `GET /api/health`; versioned routes live under `/api/v1/mars/`; docs are at `/docs`, `/redoc`, and `/openapi.json`.
- `GET /api/v1/mars/layers/{layer_id}/capabilities` returns the verified WMTS snapshot; add `?live=true` to fetch GetCapabilities from NASA Mars Trek (502 on upstream failure). The catalog has ten layers; four are `visualizable` (HiRISE, CTX, global MOLA and preliminary CTX).
- `GET /api/v1/aeolian/datasets` lists the five metadata-only Mars manifests from `mars_ml`. `POST /api/v1/aeolian/analyze` runs `run_mars_sequence` on local image/mask pairs plus explicit UTC dates, CRS and optional metric scale; results are stored in memory and returned by `GET /api/v1/aeolian/results/{analysis_id}`.
- `POST /api/v1/aeolian/predict` always returns `501 not_implemented`. Do not add a prediction result until a validated checkpoint, run report and independent Mars validation exist.
- Aeolian inputs must stay relative to `AEOLIAN_DATA_ROOT` (default `../mars_ml/datasets/mars`). Reject path escapes, mixed CRS, naive datetimes and scale/CRS mismatches; never infer metres from a degree grid. Keep observed migration separate from model predictions.
- Provenance and bounding boxes are documented in `docs/data_sources.md`.

`fastapi`, `uvicorn`, `pydantic`, `httpx`, `python-dotenv`, `pytest`, `numpy`,
`opencv-python-headless` and `rasterio` are installed, plus editable `mars_ml`
(`--no-deps`, because the backend pins its runtime subset). `app/services/aeolian_service.py`
imports the installed editable `mars_ml` package without copying its code or
modifying `sys.path`. Config loads
from `backend/.env` (see `.env.example`); CORS defaults
include `http://localhost:5173`, `http://127.0.0.1:5173`,
`http://localhost:4173`, and `http://127.0.0.1:4173`. Add future endpoints as
routers in `app/api/v1/`, with schemas in `app/schemas/` and static or external
data logic in `app/services/`. Do not reintroduce Flask or `run.py`. NASA
metadata must stay source-referenced and must not fabricate measurements,
acquisition dates, projections, or bounding boxes; tests must not depend on
external NASA services. WMTS metadata lives in `app/services/mars_wmts.py`;
Aeolian integration lives in `app/services/aeolian_service.py` with schemas in
`app/schemas/aeolian.py` and the router in `app/api/v1/aeolian.py`.

## ML workspace (`mars_ml`)

Use the checked-in `mars_ml/.venv`, not the backend venv. `mars_ml` is installed
editable in both venvs, so `mars_ml.*` imports resolve from any directory; the
documented commands still use the repository root for consistency.

- Environment: `mars_ml/.venv/bin/python` (Python 3.14), created with `uv`.
- Install: `uv pip install --python mars_ml/.venv/bin/python -e mars_ml`.
- Optional training extra (PyTorch, not installed): add
  `-r mars_ml/requirements-training.txt`.
- Tests: `mars_ml/.venv/bin/python -m pytest mars_ml/tests -q` (currently 96 passed; synthetic and local fixtures only, no network).
- Syntax check: `mars_ml/.venv/bin/python -m compileall -q mars_ml`.
- Installed: NumPy 2.5.4, OpenCV headless 5.0.0.93, Rasterio 1.5.2, Matplotlib
  3.11.2, pytest 9.2.0, pandas 3.1.1, pyshp 3.1.8, openpyxl 3.1.5,
  scikit-learn 1.9.1, joblib 1.6.0.
- Single-pair inference: `mars_ml/.venv/bin/python -m mars_ml.inference.dune_analysis --help`.
- Dated sequence runner: `mars_ml/.venv/bin/python -m mars_ml.inference.mars_sequence --help`.
- Explicit-table migration training: `mars_ml/.venv/bin/python -m mars_ml.training.train_migration --help`.
- Single source of usage and limitations: `mars_ml/README.md`. Reports:
  `mars_ml/STAGE1_REPORT.md` and `mars_ml/STAGE2_REPORT.md`.

Module map:

- `computer_vision/` — `image_io.py` (load/validate/normalize/crop/GeoTIFF/PDS3,
  CRS units, checksums), `image_registration.py` (ORB+RANSAC, phase correlation,
  reliability gate), `dune_segmentation.py` (classical baseline +
  checkpoint-gated U-Net adapter), `displacement_detection.py` (centroids,
  Farneback, Lucas-Kanade, metric scale), plus crest, correlation, geometry,
  annotation-rasterization and uncertainty helpers.
- `ingestion/` — Mars manifest validation (`catalog.py`), raster/vector/table/PDS
  readers (`readers.py`), annotation rasterization (`annotations.py`),
  allowlisted dry-run download planning (`download.py`) and local size/SHA-256
  verification (`validation.py`).
- `aeolian_dynamics/` — morphology, migration, method-aware
  `migration_analysis.py`, grouped `migration_models.py`, explicit-covariate
  `hybrid_model.py`, environmental observations/sources and planetary constants.
- `training/` — grouped manifest (`prepare_dataset.py`), segmentation
  dry-run/training (`train_segmentation.py`), pixel classifier
  (`train_classifier.py`), explicit-table migration training
  (`train_migration.py`), migration metrics and `evaluate.py`.
- `validation/` — aggregated published-range catalog (`published_measurements.py`)
  and comparison that rejects per-dune relabelling (`compare.py`).
- `inference/` — `dune_analysis.py` (single pair CLI) and `mars_sequence.py`
  (dated sequence orchestration, JSON plan runner and CLI).
- `visualization/plots.py` — PNG artifacts.
- `datasets/earth/sahara/scene_catalog.json` and `datasets/mars/*/dataset.json` —
  verified metadata only; no pixels. `datasets/mars/manifest.json` indexes five
  Mars manifests (Hargraves, Coprates, repeat CTX, HiRISE, Jezero);
  `environmental_sources.json` and `published_measurements.json` hold
  unverified-source and aggregate-context records respectively.
- `models/`, `notebooks/` — no weights or notebooks.

Scientific rules for this workspace:

- Do not modify `frontend/` or `backend/` from `mars_ml`.
- Never invent scenes, dates, bboxes, resolutions, labels, environmental
  observations or metrics. Tests use synthetic fixtures; never present them as
  satellite imagery or scientific validation.
- Never claim a trained model unless a checkpoint and its run report exist.
  `UNetSegmenter` must keep raising when PyTorch or the checkpoint is absent.
- Convert pixels to metres only with an explicit verified `meters_per_pixel`.
  Do not infer scale from a CRS or a degree grid.
- Withhold displacement when registration is unreliable and migration when
  dates, scale or reliability are missing. Preserve rejection reasons in JSON.
- A downloaded file is checksum-verified only when its manifest SHA-256 matches.
  `size_verified` is not `verified`; never describe size-only checks as a
  checksum match.
- Keep sequence-plan masks single-band and binary; do not infer a missing mask,
  date or metre scale from filenames or a degree grid.
- Do not apply Earth migration rates or parameters to Mars. Mars values in
  `planetary_parameters.py` are references; transport coefficients must remain
  explicit and labelled as requiring calibration.
- Do not present climatology as simultaneous in-situ weather. Missing
  environmental fields stay missing.
- Preserve direction conventions: `dx` east, `dy` north, azimuth clockwise from
  north; image rows are inverted.

Real metadata sources already verified: Copernicus STAC
(`https://catalogue.dataspace.copernicus.eu/stac/search`, `sentinel-2-l2a`) and
USGS STAC (`https://landsatlook.usgs.gov/stac-server/search`,
`landsat-c2l2-sr`). Do not add unverified scene metadata. Do not store
credentials. Mars datasets hold verified metadata manifests only; pixels,
per-dune labels and trained checkpoints are not committed. Environmental source
entries remain `metadata_verified: false`; published ranges are aggregate
context, never per-dune training labels. Geometry change is never a migration
rate; `advancing_front` is not implemented.
