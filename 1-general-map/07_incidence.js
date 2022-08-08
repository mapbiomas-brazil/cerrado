// filter spurious transitions by using the number of changes, connections and mode reducer
// for clarification write to dhemerson.costa@ipam.org.br

// set root imageCollection
var root = 'users/dh-conciani/collection7/c7-general-post/';

// set version
var input_version = '2';
var output_version = '8';

// define input file 
var file_in = 'CERRADO_col7_gapfill_v' + input_version;

// import mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// load input
var classification = ee.Image(root + file_in);

// remove wetlands from incidents filter
var classification_remap = classification.updateMask(classification.neq(11));

// compute number of classes and changes 
var nChanges = classification_remap.reduce(ee.Reducer.countRuns()).subtract(1).rename('number_of_changes');

// get the count of connections
var connected_nChanges = nChanges.connectedPixelCount({
      'maxSize': 100, 
      'eightConnected': false});

// compute the mode
var mode = classification_remap.reduce(ee.Reducer.mode());

// plot 
// number of changes
Map.addLayer(nChanges, {palette: ["#C8C8C8", "#FED266", "#FBA713", "#cb701b", "#a95512", "#662000", "#cb181d"],
                                  min: 0, max: 15}, 'number of changes', false);

Map.addLayer(connected_nChanges, {palette: ['green', 'yellow', 'orange', 'red'], min:0, max:10}, 'con. nChanges', false);

// classification
Map.addLayer(mode, vis, 'mode', false);
Map.addLayer(classification.select(['classification_2021']), vis, 'classification');

// get border pixels (high geolocation RMSE) to be masked by the mode
var border_mask = connected_nChanges.lte(6).and(nChanges.gt(12));
border_mask = border_mask.updateMask(border_mask.eq(1));    

// get borders to rectfy
var rect_border = mode.updateMask(border_mask);

// get classes to rectfy
var forest = ee.Image(3).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(3)));
var savanna = ee.Image(4).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(4)));
var grassland = ee.Image(12).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(12)));
var pasture = ee.Image(15).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(15)));
var agriculture = ee.Image(19).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(19)));
var mosaic = ee.Image(21).updateMask(connected_nChanges.gt(6).and(nChanges.gt(12)).and(mode.eq(21)));

// blend masks
var incidentsMask = rect_border.blend(forest)
                               .blend(pasture)
                               .blend(agriculture)
                               .blend(savanna)
                               .blend(grassland)
                               .toByte();

// build correction
classification = classification.blend(incidentsMask);
Map.addLayer(classification.select(['classification_2021']), vis, 'rectified');

// export as GEE asset
Export.image.toAsset({
    'image': classification,
    'description': 'CERRADO_col7_gapfill_incidence_v' + output_version,
    'assetId': root + 'CERRADO_col7_gapfill_incidence_v' + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
