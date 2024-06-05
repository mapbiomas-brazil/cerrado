// --- --- --- 07_frequency
// post-processing filter: stabilize areas of rocky outcrop that have remained for at least 50% of the data time series
// barbara.silva@ipam.org.br 

// set metadata 
var input_version = '4';
var output_version = '4';

// set directories
var input = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class-post/CERRADO_col9_rocky_gapfill_v' + input_version;
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class-post/';

// load classification
var classification = ee.Image(input);
print ("input", classification);

// import mapbiomas color ramp 
var vis = {
      min: 0,
      max: 62,
      palette:require('users/mapbiomas/modules:Palettes.js').get('classification8'),
    };

// define the function to calc frequencies 
var filterFreq = function(image) {
    // expression to get frequency
     var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)' +
                    '+b(11)+b(12)+b(13)+b(14)+b(15)+b(16)+b(17)+b(18)+b(19)+b(20)' +
                    '+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)' +
                    '+b(31)+b(32)+b(33)+b(34)+b(35)+b(36)+b(37)+b(38))/39)';
    
    // get per class frequency 
    var rocky = image.eq(29).expression(exp);
    Map.addLayer(rocky, {palette:['purple', 'red', 'orange', 'yellow', 'green', 'darkgreen'], min:20, max:70}, 'frequency');
    
    // stabilize rocky when:
    var filtered = ee.Image(0).where(rocky.gte(50), 29)
                              .where(rocky.lt(50), 99);
    
    // get only pixels to be filtered
    filtered = filtered.updateMask(filtered.neq(0));

    return image.where(filtered, filtered);
};

// apply function  
var classification_filtered = filterFreq(classification);

// plot
Map.addLayer(classification.select(['classification_2021']), vis, 'classification');
Map.addLayer(classification_filtered.select(['classification_2021']), vis, 'filtered');
print ('output', classification_filtered);

// export as GEE asset
Export.image.toAsset({
    'image': classification_filtered,
    'description': 'CERRADO_col9_rocky_gapfill_frequency_v' + output_version,
    'assetId': dirout + 'CERRADO_col9_rocky_gapfill_frequency_v' + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
