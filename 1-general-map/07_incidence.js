// -- -- -- -- 07_incidence
// filter spurious transitions by using the number of changes, connections and mode reducer
// felipe.lenti@ipam.org.br

// set root imageCollection
var root = 'projects/ee-barbarasilvaipam/assets/collection8/general-class-post/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/';

// set version
var input_version = '3';
var output_version = '5';
var thresh_events = 11;

// define input file 
var file_in = 'CERRADO_col8_gapfill_v' + input_version;

// import mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// load input
var classification = ee.Image(root + file_in);

//aggregate as Anthropic or Natural
//Aggregating MapBiomas legend
var k_original = [
    3, 4, 5,//forest, savnna, mangrove
    11, 12, 13,//wetlands, grasslands and other non-forest formation
    15,//pasture
    30,//saltflat
    19, 39, 20, 40, 62, 41, 36, 46, 47, 48,//agriculture
    9,//planted forest
    21,//mosaic of uses
    23, 24, 30, 25,//non vegetated areas
    33, 31, //water bodies
    27 //non observed
    ]; 
    
// The expected output classes of the mapAggregation method:
//1 = anthropic use; 2 = natural vegetation; 0 = not vegetated classes
var k_aggregate = [
    2, 2, 2,//forest, savnna, mangrove
    2, 2, 2,//wetlands, grasslands and other non-forest formation
    1,//pasture
    0,//saltflat
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,//agriculture
    1,//planted forest
    1,//mosaic of uses
    1, 1, 1, 1,//non vegetated areas
    0, 0, //water bodies
    0 //non observed
    ];

// remove wetlands from incidents filter
var classification_remap = classification.updateMask(classification.neq(11));

var classification_aggr = ee.Image([]);

ee.List.sequence({'start': 1985, 'end': 2021}).getInfo()
    .forEach(function(year_i) {
      // get year [i]
      var classification_i = classification_remap.select(['classification_' + year_i])
        // remap
        .remap(k_original,
               k_aggregate)
               .rename('classification_' + year_i);
               // insert into classification
               classification_aggr = classification_aggr.addBands(classification_i);
    });
    classification_aggr = classification_aggr.updateMask(classification_aggr.neq(0));
// compute number of classes and changes 
var nChanges = classification_aggr.reduce(ee.Reducer.countRuns()).subtract(1).rename('number_of_changes');
// get the count of connections
var connected_nChanges = nChanges.connectedPixelCount({
      'maxSize': 20, 
      'eightConnected': true});

// compute the mode
var mode = classification.reduce(ee.Reducer.mode());
var mode_agg = classification_aggr.reduce(ee.Reducer.mode());

Map.addLayer(classification.select(['classification_2021']), vis, 'classification');
// get border pixels (high geolocation RMSE) to be masked by the mode
var border_mask = connected_nChanges.lte(6).and(nChanges.gt(10));
border_mask = border_mask.updateMask(border_mask.eq(1));

// get borders to rectfy
var rect_border = ee.Image(21).updateMask(border_mask);

// get classes to rectify
var rect_all = ee.Image(21).updateMask(connected_nChanges.gt(6).and(nChanges.gte(thresh_events)));

// blend masks
var incidentsMask = rect_border.blend(rect_all)
                               .toByte();

// build correction
classification = classification.blend(incidentsMask);
Map.addLayer(classification.select(['classification_2021']), vis, 'rectified');
// Map.addLayer(classification, {}, 'all_rectified', false);

// export as GEE asset
Export.image.toAsset({
    'image': classification,
    'description': 'CERRADO_col8_gapfill_incidence_v' + output_version,
    'assetId': out + 'CERRADO_col8_gapfill_incidence_v' + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
