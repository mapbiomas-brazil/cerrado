// -- -- -- -- 07_incidence
// post-processing filter: filter spurious transitions by using the number of changes, connection number, and mode reducer
// barbara.silva@ipam.org.br and dhemerson.costa@ipam.org.br

// Import mapbiomas color schema 
var vis = {
    min: 0,
    max: 62,
    palette:require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Set root directory 
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '8';
var outputVersion = '8';
var thresholdEvents = 13;

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v' + inputVersion;

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);
Map.addLayer(classificationInput.select(['classification_2023']), vis, 'Input classification');

// Aggregate MapBiomas classes in level 2
var originalClasses = [
    3, 4,    // Forest, Savanna
    11, 12,  // Wetlands, Grasslands
    15,      // Pasture
    18,      // Agriculture
    25,      // Non-vegetated areas
    33,      // Water
    27       // Non-observed
];

var aggregatedClasses = [
    2, 2,    // Forest, Savanna
    2, 2,    // Wetlands, Grasslands
    1,       // Pasture
    1,       // Agriculture
    1,       // Non-vegetated areas
    7,       // Water
    7        // Non-observed
];

var classificationAggregated = ee.Image([]);

// Remove 'forest' class from incidents filter (avoid over-estimation)
var classification_remap = classificationInput.updateMask(classificationInput.neq(3));

// Set the list of years to be filtered
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
    .forEach(function(year) {
      
        // Get year [i]
        var classificationYear = classification_remap.select(['classification_' + year])
            // Remap classes
            .remap(originalClasses, aggregatedClasses)
            .rename('classification_' + year);
            
        // Insert into aggregated classification
        classificationAggregated = classificationAggregated.addBands(classificationYear);
    });

classificationAggregated = classificationAggregated.updateMask(classificationAggregated.neq(0));

// Compute number of classes and changes
var numChanges = classificationAggregated.reduce(ee.Reducer.countRuns()).subtract(1).rename('number_of_changes');
Map.addLayer(numChanges, {palette: ["#C8C8C8", "#FED266", "#FBA713", "#cb701b", "#a95512", "#662000", "#cb181d"],
                                  min: 0, max: 15}, 'number of changes', false);

// Get the count of connections
var connectedNumChanges = numChanges.connectedPixelCount({
    'maxSize': 100,
    'eightConnected': true
});

// Compute the mode of the pixel values in the time series
var modeImage = classification_remap.reduce(ee.Reducer.mode());

// Get border pixels (high geolocation RMSE) to be masked by the mode (7 pixels = 0,6 ha)
var borderMask = connectedNumChanges.lte(7).and(numChanges.gt(10));
borderMask = borderMask.updateMask(borderMask.eq(1));

// Get borders to rectify
var rectBorder = modeImage.updateMask(borderMask);
var rectAll = modeImage.updateMask(connectedNumChanges.gt(7).and(numChanges.gte(thresholdEvents)));

// Blend masks
var incidentsMask = rectBorder.blend(rectAll).toByte();

// Apply the corrections
var correctedClassification = classificationInput.blend(incidentsMask);

Map.addLayer(correctedClassification.select(['classification_2023']), vis, 'Corrected classification');
print('Output classification', correctedClassification);

// Export as GEE asset
Export.image.toAsset({
    'image': correctedClassification,
    'description': inputFile + '_incidence_v' + outputVersion,
    'assetId': out +  inputFile + '_incidence_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': correctedClassification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
