// frequency filter 
// dhemerson.costa@ipam.org.br

// define root 
var root = 'users/dh-conciani/collection7/c7-general-post/';

// define input file 
var file_in = 'CERRADO_col7_gapfill_incidence_temporal_v20';

// define output version 
var version_out = 20;

// load classification
var classification = ee.Image(root + file_in);

// import mapbiomas color ramp 
var vis = {
      min: 0,
      max: 49,
      palette:require('users/mapbiomas/modules:Palettes.js').get('classification6'),
    };

// define the function to calc frequencies 
var filterFreq = function(image) {
  // expression to get frequency
 var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)' +
                '+b(11)+b(12)+b(13)+b(14)+b(15)+b(16)+b(17)+b(18)+b(19)+b(20)' +
                '+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)' +
                '+b(31)+b(32)+b(33)+b(34)+b(35)+b(36))/37)';

  // get per class frequency 
  var forest = image.eq(3).expression(exp);
  var savanna = image.eq(4).expression(exp);
  var wetland = image.eq(11).expression(exp);
  var grassland = image.eq(12).expression(exp);

  // select pixels that were native vegetation at least 95% of the time series
  var stable_native = ee.Image(0).where(forest
                                   .add(savanna)
                                   .add(wetland)
                                   .add(grassland)
                                   .gte(90), 1);
                                   
  // stabilize native class when:
  var filtered = ee.Image(0).where(stable_native.eq(1).and(forest.gte(75).and(classification.select(['classification_2021']).neq(3))), 3)
                            .where(stable_native.eq(1).and(wetland.gte(50)), 11)
                            .where(stable_native.eq(1).and(savanna.gt(50)), 4)
                            .where(stable_native.eq(1).and(grassland.gt(50)), 12);

  // get only pixels to be filtered
  filtered = filtered.updateMask(filtered.neq(0));
  
  return image.where(filtered, filtered);
};

// apply function  
var classification_filtered = filterFreq(classification);

// plot
Map.addLayer(classification.select(['classification_1990']), vis, 'classification');
Map.addLayer(classification_filtered.select(['classification_1990']), vis, 'filtered');

// export as GEE asset
Export.image.toAsset({
    'image': classification_filtered,
    'description': 'CERRADO_col7_gapfill_incidence_temporal_frequency_v' + version_out,
    'assetId': root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_v' + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
