// -- -- -- -- 09_frequency
// post-processing filter: stabilize areas of native vegetation that have remained for at least 90% of the data time series
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
var outputVersion = '9';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v8_incidence_v8_temporal_v'+inputVersion;

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);
Map.addLayer(classificationInput.select(['classification_2023']), vis, 'Input classification');

// Define the function to calc frequencies 
var filterFreq = function(image) {
  // Expression to get frequency
 var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)' +
                '+b(11)+b(12)+b(13)+b(14)+b(15)+b(16)+b(17)+b(18)+b(19)+b(20)' +
                '+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)' +
                '+b(31)+b(32)+b(33)+b(34)+b(35)+b(36)+b(37)+b(38))/39)';

  // Get per class frequency 
  var forest = image.eq(3).expression(exp);
  var savanna = image.eq(4).expression(exp);
  var wetland = image.eq(11).expression(exp);
  var grassland = image.eq(12).expression(exp);

  // Select pixels that were native vegetation in at least 90% of the time series
  var stable_native = ee.Image(0).where(forest
                                 .add(savanna)
                                 .add(wetland)
                                 .add(grassland)
                                 .gte(90), 1);

  Map.addLayer (stable_native, vis, "stable_native", false);

  // Stabilize native class when:
  var filtered = ee.Image(0).where(stable_native.eq(1).and(forest.gte(75)), 3)
                            .where(stable_native.eq(1).and(wetland.gte(60)), 11)
                            .where(stable_native.eq(1).and(savanna.gt(50)), 4)
                            .where(stable_native.eq(1).and(grassland.gt(50)), 12);

  // Get only pixels to be filtered
  filtered = filtered.updateMask(filtered.neq(0));
  
  return image.where(filtered, filtered);
};

// Apply function  
var classification_filtered = filterFreq(classificationInput);

Map.addLayer(classification_filtered.select(['classification_2023']), vis, 'filtered');
print('Output classification', classification_filtered);

// Export as GEE asset
Export.image.toAsset({
    'image': classification_filtered,
    'description': inputFile + '_frequency_v' + outputVersion,
    'assetId': out +  inputFile + '_frequency_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification_filtered.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
