// -- -- -- -- 07_incidence
// Filter spurious transitions by using the number of changes, connection number, and mode reducer
// barbara.silva@ipam.org.br

// Set root directory
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '4';
var outputVersion = '4';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v' + inputVersion;

// Import MapBiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);
Map.addLayer(classificationInput.select(['classification_2023']), vis, 'Input classification');

// Aggregate MapBiomas classes in level 0 (natural or anthropic)
var originalClasses = [
    3, 4,    // Forest, Savanna
    11, 12,  // Wetlands, Grasslands
    15, // Pasture
    18, // Agriculture
    25, // Non-vegetated areas
    33, // Water
    27  // Non-observed
];

var aggregatedClasses = [
    2, 2,    // Forest, Savanna
    2, 2,  // Wetlands, Grasslands
    1, // Pasture
    1, // Agriculture
    2, // Non-vegetated areas
    2, // Water
    1  // Non-observed
];

var classificationAggregated = ee.Image([]);

// Set number of transitions (1/3 of the time series)
var thresholdEvents = 13;

ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
    .forEach(function(year) {

        // Get year [i]
        var classificationYear = classificationInput.select(['classification_' + year])
            // Remap classes
            .remap(originalClasses, aggregatedClasses)
            .rename('classification_' + year);
            
        // Insert into aggregated classification
        classificationAggregated = classificationAggregated.addBands(classificationYear);
    });

classificationAggregated = classificationAggregated.updateMask(classificationAggregated.neq(0));

// Compute number of classes and changes
var numChanges = classificationAggregated.reduce(ee.Reducer.countRuns()).subtract(1).rename('number_of_changes');

// Get the count of connections
var connectedNumChanges = numChanges.connectedPixelCount({
    'maxSize': 100,
    'eightConnected': true
});

// Compute the mode of the pixel values in the time series
var modeImage = classificationInput.reduce(ee.Reducer.mode());

// Mask for correction of transition areas (0,6 ha)
var borderMask = connectedNumChanges.lte(7).and(numChanges.gt(10));
borderMask = borderMask.updateMask(borderMask.eq(1));

// Mask for rectifying all areas
var rectBorder = modeImage.updateMask(borderMask);
var rectAll = modeImage.updateMask(connectedNumChanges.gt(7).and(numChanges.gte(thresholdEvents)));

// Blend masks
var incidentsMask = rectBorder.blend(rectAll).toByte();

// Apply the corrections
var correctedClassification = classificationInput.blend(incidentsMask);

Map.addLayer(correctedClassification.select(['classification_2023']), vis, 'Output classification');
print('Output classification', correctedClassification);

// Export as GEE asset
Export.image.toAsset({
    'image': correctedClassification,
    'description': 'CERRADO_col9_gapfill_v'+inputVersion+'_incidence_v' + outputVersion,
    'assetId': out +  'CERRADO_col9_gapfill_v'+inputVersion+'_incidence_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': correctedClassification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
