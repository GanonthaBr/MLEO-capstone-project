// ============================================================
// AMAZONIA STAGE 2 — RECOVER TIMED-OUT CANDIDATES
//
// Run in the Google Earth Engine Code Editor.
//
// This script recovers nine candidates whose imagery selection
// timed out during the original collection:
//
//   B01: C01, C02, C03, C04, C06, C07, C08, C09
//   B02: C06
//
// The original amazon_B01_C05 sample is retained separately.
//
// Interactive requests:
//   projected coordinates, local tile discovery, image IDs.
//
// Batch export computations:
//   image-quality ranking, reference labels, joint coverage.
//
// Output folder: Amazonia_Source_Stage2 in Google Drive.
//
// An export is a DEVELOPMENT candidate, not automatic acceptance.
// Run the Colab raster audit before using a recovered sample.
//
// Re-running may create duplicate Drive filenames.
// Preserve the recorded exports for exact baseline reproduction.
// ============================================================


// -------------------------
// 1. Configuration
// -------------------------

var RUN_ID = 'amazon_stage2_recovery_v2';
var DRIVE_FOLDER = 'Amazonia_Source_Stage2';

var HLS_ASSET = 'NASA/HLS/HLSS30/v002';
var S2_ASSET = 'COPERNICUS/S2_SR_HARMONIZED';

var LABEL_ASSET =
  'projects/mapbiomas-public/assets/amazon/lulc/' +
  'collection6/mapbiomas_collection60_integration_v1';

var BEFORE_START = '2021-06-01';
var BEFORE_END = '2021-10-01';
var AFTER_START = '2023-06-01';
var AFTER_END = '2023-10-01';

var PATCH_SIZE = 224;
var PIXEL_SIZE = 30;
var PATCH_METRES = PATCH_SIZE * PIXEL_SIZE;
var TOTAL_PIXELS = PATCH_SIZE * PATCH_SIZE;

var SHORTLIST_SIZE = 6;

var MIN_JOINT_VALID = 0.80;
var MIN_CONVERSION_PIXELS = 50;
var MIN_STABLE_PIXELS = 500;

var INPUT_BANDS = [
  'B2', 'B3', 'B4', 'B8A', 'B11', 'B12'
];

var OUTPUT_BANDS = [
  'blue', 'green', 'red', 'nir', 'swir1', 'swir2'
];

var NODATA = -9999;

// Offsets from the original candidate-grid scan, in metres.
var OFFSETS = [
  [0, 0],
  [12000, 0],
  [-12000, 0],
  [0, 12000],
  [0, -12000],
  [12000, 12000],
  [-12000, -12000],
  [-12000, 12000],
  [12000, -12000]
];

// Candidates passed the original class screening but encountered
// imagery-selection timeouts.
var BLOCKS = [
  {
    group: 'B01',
    longitude: -53.20,
    latitude: -3.40,
    candidateNumbers: [1, 2, 3, 4, 6, 7, 8, 9]
  },
  {
    group: 'B02',
    longitude: -56.50,
    latitude: -4.50,
    candidateNumbers: [6]
  }
];

var taskLog = [];

Map.setCenter(-54.8, -4.0, 6);

print('Run:', RUN_ID);
print('Output folder:', DRIVE_FOLDER);
print('Recovering nine candidates with previous imagery timeouts.');
print('Pixel-quality calculations will run in export tasks.');
print('Exported candidates are NOT automatically accepted.');


// -------------------------
// 2. Utility functions
// -------------------------

function pad2(value) {
  return value < 10 ? '0' + value : String(value);
}

function errorText(error) {
  if (!error) {
    return 'Unknown error';
  }

  return error.message ? error.message : String(error);
}

function record(patch, status, detail) {
  var row = {
    run_id: RUN_ID,
    sample_id: patch.sampleId,
    parent_candidate_id: patch.parentId,
    candidate_group_id: patch.group,
    status: status,
    detail: detail || ''
  };

  taskLog.push(ee.Feature(null, row));

  print(patch.sampleId + ': ' + status);

  if (detail) {
    print(detail);
  }
}

function makePatch(block, projectedCentre, candidateNumber) {
  var offset = OFFSETS[candidateNumber - 1];

  var centreX = projectedCentre[0] + offset[0];
  var centreY = projectedCentre[1] + offset[1];

  var xmin = Math.floor(
    (centreX - PATCH_METRES / 2) / PIXEL_SIZE
  ) * PIXEL_SIZE;

  var ymax = Math.ceil(
    (centreY + PATCH_METRES / 2) / PIXEL_SIZE
  ) * PIXEL_SIZE;

  var xmax = xmin + PATCH_METRES;
  var ymin = ymax - PATCH_METRES;

  var transform = [
    PIXEL_SIZE, 0, xmin,
    0, -PIXEL_SIZE, ymax
  ];

  var region = ee.Geometry.Rectangle(
    [xmin, ymin, xmax, ymax],
    block.crs,
    false
  );

  // Slight inset avoids an extra boundary row or column.
  var exportRegion = ee.Geometry.Rectangle(
    [
      xmin + 0.01,
      ymin + 0.01,
      xmax - 0.01,
      ymax - 0.01
    ],
    block.crs,
    false
  );

  var parentId =
    'amazon_' + block.group + '_C' + pad2(candidateNumber);

  return {
    sampleId: parentId + '_r2',
    parentId: parentId,
    group: block.group,
    crs: block.crs,
    transform: transform,
    xmin: xmin,
    ymax: ymax,
    region: region,
    exportRegion: exportRegion,
    centre: ee.Geometry.Point(
      [
        xmin + PATCH_METRES / 2,
        ymax - PATCH_METRES / 2
      ],
      block.crs
    )
  };
}

function gridConstant(value, name, patch) {
  return ee.Image.constant(value)
    .rename(name)
    .reproject({
      crs: patch.crs,
      crsTransform: patch.transform
    })
    .clip(patch.region);
}

function sumOnPatch(image, patch) {
  return image.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: patch.region,
    crs: patch.crs,
    crsTransform: patch.transform,
    maxPixels: 1000000,
    tileScale: 4
  });
}


// -------------------------
// 3. Image preparation
// -------------------------

function prepareImage(image, patch) {
  image = ee.Image(image);

  // Reflectance in this GEE HLS collection is already scaled.
  // Do not apply another 0.0001 multiplier.
  var reflectance = image.select(
    INPUT_BANDS,
    OUTPUT_BANDS
  );

  var qa = image.select('Fmask');

  // Reject bits 1–4:
  // cloud, adjacent cloud/shadow, shadow, snow/ice.
  var clear = qa.bitwiseAnd(30).eq(0);

  // Reject high aerosol: bits 6–7 equal 3.
  var notHighAerosol = qa
    .rightShift(6)
    .bitwiseAnd(3)
    .neq(3);

  var allBandsPresent = reflectance.mask()
    .reduce(ee.Reducer.min())
    .gt(0);

  var good = clear
    .and(notHighAerosol)
    .and(allBandsPresent);

  // Explicit zero coverage outside the source-image footprint.
  var valid = gridConstant(0, 'valid', patch)
    .where(good.unmask(0, false), 1)
    .toByte();

  var result = reflectance
    .updateMask(good)
    .addBands(
      image.select(['SZA', 'SAA']).updateMask(good)
    )
    .addBands(valid);

  result = ee.Image(
    result.copyProperties(image, [
      'system:time_start',
      'CLOUD_COVERAGE'
    ])
  );

  return result.set({
    source_image_id: ee.String(HLS_ASSET)
      .cat('/')
      .cat(ee.String(image.get('system:index'))),
    acquisition_date: image.date().format('YYYY-MM-dd')
  }).clip(patch.region);
}


// -------------------------
// 4. Provisional reference labels
// -------------------------

function makeLabels(patch) {
  var mapbiomas = ee.Image(LABEL_ASSET);

  var y2020 = mapbiomas.select('classification_2020');
  var y2021 = mapbiomas.select('classification_2021');
  var y2022 = mapbiomas.select('classification_2022');
  var y2023 = mapbiomas.select('classification_2023');

  function convertedClass(image) {
    return image.eq(15)
      .or(image.eq(18))
      .or(image.eq(21));
  }

  var stable = y2020.eq(3)
    .and(y2021.eq(3))
    .and(y2022.eq(3))
    .and(y2023.eq(3));

  var conversion = y2020.eq(3)
    .and(y2021.eq(3))
    .and(convertedClass(y2022))
    .and(convertedClass(y2023));

  // 0 = stable forest
  // 1 = persistent agricultural conversion
  // 255 = ignored
  return gridConstant(255, 'label', patch)
    .where(stable.unmask(0, false), 0)
    .where(conversion.unmask(0, false), 1)
    .toUint8();
}


// -------------------------
// 5. Lightweight discovery
// -------------------------

function discoverTile(patch, callback) {
  // Sentinel-2 identifies the local MGRS tile only.
  // Actual exported reflectance comes from HLS S30.
  ee.ImageCollection(S2_ASSET)
    .filterBounds(patch.centre)
    .filterDate(AFTER_START, AFTER_END)
    .aggregate_histogram('MGRS_TILE')
    .evaluate(function(histogram, error) {
      if (error || !histogram) {
        callback(null, errorText(error));
        return;
      }

      var tiles = Object.keys(histogram)
        .sort(function(a, b) {
          return histogram[b] - histogram[a] ||
            a.localeCompare(b);
        });

      if (!tiles.length) {
        callback(null, 'No local MGRS tile was found.');
        return;
      }

      callback(tiles[0].replace(/^T/, ''), null);
    });
}

function getShortlist(tile, start, end, callback) {
  // Explicit ID-prefix filtering prevents distant-tile selection.
  ee.ImageCollection(HLS_ASSET)
    .filterDate(start, end)
    .filter(
      ee.Filter.stringStartsWith(
        'system:index',
        'T' + tile + '_'
      )
    )
    .filter(
      ee.Filter.notNull(['CLOUD_COVERAGE'])
    )
    .sort('CLOUD_COVERAGE')
    .limit(SHORTLIST_SIZE)
    .aggregate_array('system:index')
    .evaluate(function(ids, error) {
      if (error || !ids || !ids.length) {
        callback(
          null,
          error
            ? errorText(error)
            : 'No HLS images found for the tile and date window.'
        );
        return;
      }

      callback(ids, null);
    });
}


// -------------------------
// 6. Batch-only quality ranking
// -------------------------

function selectBestForBatch(ids, patch) {
  // ids is a small client-side list.
  // Pixel reductions are evaluated by the export tasks.
  var candidates = ids.map(function(id, index) {
    var prepared = prepareImage(
      ee.Image(HLS_ASSET + '/' + id),
      patch
    );

    var validPixels = ee.Number(
      sumOnPatch(
        prepared.select('valid'),
        patch
      ).get('valid')
    );

    var fraction = validPixels.divide(TOTAL_PIXELS);

    // Favor earlier shortlist position when coverage ties.
    // Adjustment is smaller than one pixel of coverage.
    var score = fraction.subtract(index * 1e-10);

    return prepared.set({
      valid_fraction: fraction,
      selection_score: score,
      shortlist_rank: index + 1
    });
  });

  return ee.Image(
    ee.ImageCollection.fromImages(candidates)
      .sort('selection_score', false)
      .first()
  );
}


// -------------------------
// 7. Export candidate and metadata
// -------------------------

function createExports(patch, tile, beforeIds, afterIds) {
  var before = selectBestForBatch(beforeIds, patch);
  var after = selectBestForBatch(afterIds, patch);

  var labels = makeLabels(patch);

  var joint = before.select('valid')
    .and(after.select('valid'))
    .rename('joint_valid')
    .toUint8();

  var countImage = joint
    .addBands(
      labels.eq(0)
        .and(joint)
        .rename('eligible_stable')
    )
    .addBands(
      labels.eq(1)
        .and(joint)
        .rename('eligible_conversion')
    )
    .addBands(
      labels.eq(0).rename('candidate_stable')
    )
    .addBands(
      labels.eq(1).rename('candidate_conversion')
    );

  var counts = sumOnPatch(countImage, patch);

  var jointFraction = ee.Number(
    counts.get('joint_valid')
  ).divide(TOTAL_PIXELS);

  var stableCount = ee.Number(
    counts.get('eligible_stable')
  );

  var conversionCount = ee.Number(
    counts.get('eligible_conversion')
  );

  var passesNumericQC = jointFraction
    .gte(MIN_JOINT_VALID)
    .and(stableCount.gte(MIN_STABLE_PIXELS))
    .and(conversionCount.gte(MIN_CONVERSION_PIXELS));

  var common = {
    run_id: RUN_ID,
    sample_id: patch.sampleId,
    parent_candidate_id: patch.parentId,
    candidate_group_id: patch.group,

    evaluation_role: 'development_candidate',
    acceptance_status: 'pending_colab_audit',

    crs: patch.crs,
    grid_xmin: patch.xmin,
    grid_ymax: patch.ymax,
    pixel_size: PIXEL_SIZE,
    patch_width: PATCH_SIZE,
    patch_height: PATCH_SIZE,

    requested_tile: tile,
    tile: tile,

    joint_valid_fraction: jointFraction,
    eligible_stable_pixels: stableCount,
    eligible_conversion_pixels: conversionCount,
    candidate_stable_pixels: counts.get('candidate_stable'),
    candidate_conversion_pixels: counts.get('candidate_conversion'),
    passes_numeric_qc: passesNumericQC,

    minimum_joint_valid_fraction: MIN_JOINT_VALID,
    minimum_stable_pixels: MIN_STABLE_PIXELS,
    minimum_conversion_pixels: MIN_CONVERSION_PIXELS,

    label_asset: LABEL_ASSET,
    label_status: 'provisional_unverified',
    label_transition: '2021_to_2022',
    label_persistence_years: '2020_2021_2022_2023',
    image_interval: '2021_to_2023',
    ecological_suitability: 'unverified',

    selection_method:
      'fixed_tile_cloud_shortlist_batch_patch_quality',

    shortlist_size: SHORTLIST_SIZE,
    before_shortlist_count: beforeIds.length,
    after_shortlist_count: afterIds.length,
    before_candidate_ids: beforeIds.join('|'),
    after_candidate_ids: afterIds.join('|')
  };

  function metadataRow(image, role) {
    return ee.Feature(patch.region, common).set({
      role: role,
      date: image.get('acquisition_date'),
      image_id: image.get('source_image_id'),
      valid_fraction: image.get('valid_fraction'),
      cloud_coverage: image.get('CLOUD_COVERAGE'),
      selected_shortlist_rank: image.get('shortlist_rank')
    });
  }

  function exportRaster(image, suffix, noData) {
    Export.image.toDrive({
      image: image.unmask(noData, false),
      description: patch.sampleId + '_' + suffix,
      folder: DRIVE_FOLDER,
      fileNamePrefix: patch.sampleId + '_' + suffix,
      region: patch.exportRegion,
      crs: patch.crs,
      crsTransform: patch.transform,
      maxPixels: 1000000,
      fileFormat: 'GeoTIFF',
      formatOptions: {
        cloudOptimized: true,
        noData: noData
      }
    });
  }

  exportRaster(
    before.toFloat(),
    'before_2021',
    NODATA
  );

  exportRaster(
    after.toFloat(),
    'after_2023',
    NODATA
  );

  exportRaster(
    labels,
    'provisional_labels',
    255
  );

  // Zero = no joint coverage; 255 is reserved for nodata.
  exportRaster(
    joint,
    'joint_valid',
    255
  );

  Export.table.toDrive({
    collection: ee.FeatureCollection([
      metadataRow(before, 'before'),
      metadataRow(after, 'after')
    ]),
    description: patch.sampleId + '_metadata',
    folder: DRIVE_FOLDER,
    fileNamePrefix: patch.sampleId + '_metadata',
    fileFormat: 'CSV'
  });

  record(
    patch,
    'export_tasks_created',
    'Five tasks created; acceptance awaits raster and metadata audit.'
  );
}


// -------------------------
// 8. Sequential task preparation
// -------------------------

function processPatch(patch, done) {
  print('Preparing candidate:', patch.sampleId);

  discoverTile(patch, function(tile, tileError) {
    if (tileError) {
      record(patch, 'tile_discovery_failed', tileError);
      done();
      return;
    }

    getShortlist(
      tile,
      BEFORE_START,
      BEFORE_END,
      function(beforeIds, beforeError) {
        if (beforeError) {
          record(
            patch,
            'before_discovery_failed',
            beforeError
          );
          done();
          return;
        }

        getShortlist(
          tile,
          AFTER_START,
          AFTER_END,
          function(afterIds, afterError) {
            if (afterError) {
              record(
                patch,
                'after_discovery_failed',
                afterError
              );
              done();
              return;
            }

            createExports(
              patch,
              tile,
              beforeIds,
              afterIds
            );

            done();
          }
        );
      }
    );
  });
}

function processBlock(blockIndex) {
  if (blockIndex >= BLOCKS.length) {
    finish();
    return;
  }

  var block = BLOCKS[blockIndex];

  var zone =
    Math.floor((block.longitude + 180) / 6) + 1;

  var epsgBase =
    block.latitude < 0 ? 32700 : 32600;

  block.crs = 'EPSG:' + (epsgBase + zone);

  ee.Geometry.Point([
    block.longitude,
    block.latitude
  ])
    .transform(block.crs, 1)
    .coordinates()
    .evaluate(function(coordinates, error) {
      if (error || !coordinates) {
        taskLog.push(ee.Feature(null, {
          run_id: RUN_ID,
          candidate_group_id: block.group,
          status: 'block_coordinate_error',
          detail: errorText(error)
        }));

        print(
          'Coordinate request failed for:',
          block.group
        );

        processBlock(blockIndex + 1);
        return;
      }

      function nextCandidate(index) {
        if (index >= block.candidateNumbers.length) {
          processBlock(blockIndex + 1);
          return;
        }

        var patch = makePatch(
          block,
          coordinates,
          block.candidateNumbers[index]
        );

        processPatch(patch, function() {
          nextCandidate(index + 1);
        });
      }

      nextCandidate(0);
    });
}

function finish() {
  Export.table.toDrive({
    collection: ee.FeatureCollection(taskLog),
    description: RUN_ID + '_task_log',
    folder: DRIVE_FOLDER,
    fileNamePrefix: RUN_ID + '_task_log',
    fileFormat: 'CSV'
  });

  print('Task preparation finished.');
  print('Open Tasks and start the recovery exports.');
  print('Up to 45 sample tasks plus one task-log export.');
  print('Existing amazon_B01_C05 exports are preserved.');
  print('Export success is not sample acceptance.');
  print('Next: audit recovery metadata and rasters in Colab.');
  print('No protected assignments or baseline results created.');

  print(
    'Sources: NASA HLS S30 v2.0; ' +
    'MapBiomas Amazonia Collection 6.'
  );

  print(
    'MapBiomas labels are derived modifications; ' +
    'retain source attribution and dataset version.'
  );
}


// -------------------------
// 9. Start
// -------------------------

processBlock(0);