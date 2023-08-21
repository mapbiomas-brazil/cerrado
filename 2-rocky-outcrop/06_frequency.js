// --- --- --- 06_frequency
// frequency filter 
// barbara.silva@ipam.org.br 

// define root 
var root = 'projects/ee-barbarasilvaipam/assets/collection8-rocky/general-class-post/';

// define input file 
var file_in = 'CERRADO_col8_rocky_gapfill_v3';

// define output version 
var version_out = 3;

// load classification
var classification = ee.Image(root + file_in);

// import mapbiomas color ramp 
var vis = {
      min: 0,
      max: 62,
      palette:require('users/mapbiomas/modules:Palettes.js').get('classification7'),
    };

// define the function to calc frequencies 
var filterFreq = function(image) {
  // expression to get frequency
 var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)' +
                '+b(11)+b(12)+b(13)+b(14)+b(15)+b(16)+b(17)+b(18)+b(19)+b(20)' +
                '+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)' +
                '+b(31)+b(32)+b(33)+b(34)+b(35)+b(36)+b(37))/38)';

  // get per class frequency 
  var rocky = image.eq(29).expression(exp);
  Map.addLayer(rocky, {palette:['purple', 'red', 'orange', 'yellow', 'green', 'darkgreen'], min:20, max:70}, 'freq')

  // stabilize rocky when:
  var filtered = ee.Image(0).where(rocky.gte(50), 29)
                            .where(rocky.lt(50), 99)

  // get only pixels to be filtered
  filtered = filtered.updateMask(filtered.neq(0));
  
  return image.where(filtered, filtered);
};

// apply function  
var classification_filtered = filterFreq(classification);

// plot
Map.addLayer(classification.select(['classification_2021']), vis, 'classification');
Map.addLayer(classification_filtered.select(['classification_2021']), vis, 'filtered');

// export as GEE asset
Export.image.toAsset({
    'image': classification_filtered,
    'description': 'CERRADO_col8_rocky_gapfill_frequency_v' + version_out,
    'assetId': root + 'CERRADO_col8_rocky_gapfill_frequency_v' + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
