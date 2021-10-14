// frequency filter - apply only in pixels that changed between native vegetation classes

// define settings
var bioma = "CERRADO";
var file_in = bioma + '_sentinel_gapfill_wetland_temporal_spatial_v2';
var file_out = bioma + '_sentinel_gapfill_wetland_temporal_spatial_freq_v';
var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/SENTINEL/classification_sentinel/';
var version_out = 2;

// import classification
var class4 = ee.Image(dirout + file_in);

// define mapbiomas color rmap
var vis = {
      bands: 'classification_2019',
      min: 0,
      max: 49,
      palette: require('users/mapbiomas/modules:Palettes.js').get('classification6'),
      format: 'png'
    };

// compute frequency 
var filtrofreq = function(mapbiomas){
  // calc expression 
 var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4))/6 )';

  // get frequency
  var florFreq = mapbiomas.eq(3).expression(exp);
  var savFreq = mapbiomas.eq(4).expression(exp);
  var wetFreq = mapbiomas.eq(11).expression(exp);
  var grassFreq = mapbiomas.eq(12).expression(exp);

  // select pixels that were native vegetation at least [x]% of the time series
  var vegMask = ee.Image(0).where((florFreq.add(savFreq).add(wetFreq).add(grassFreq)).gte(79), 1);
  Map.addLayer(vegMask, {}, 'mask');

  // define rules per class
  var  vegMap = ee.Image(0)
                          .where(vegMask.eq(1).and(florFreq.gt(50)), 3)
                          .where(vegMask.eq(1).and(wetFreq.gt(50)), 11)
                          .where(vegMask.eq(1).and(grassFreq.gt(50)), 12)
                          .where(vegMask.eq(1).and(savFreq.gt(50)), 4);
  
  // update with results
  vegMap = vegMap.updateMask(vegMap.neq(0));
  //NaovegMask = NaovegMask.updateMask(NaovegMask.neq(0))//.clip(BiomaPA)
  //Map.addLayer(vegMap, vis, 'vegetacao estavel', true);
  //Map.addLayer(NaovegMask, vis, 'Não vegetacao estavel', true);
  
  var saida = mapbiomas.where(vegMap, vegMap);
  //saida = saida.where(NaovegMask, NaovegMask)
  
  return saida;
};

  var saida = filtrofreq(class4);
  saida = saida
    .set('version', version_out)
    .set('biome', bioma)
    .set('step', 'frequency');

print('classification', class4);
print('filtered', saida);

// plot results
Map.addLayer(class4, vis, 'classification');
Map.addLayer(saida, vis, 'filtered');

// export as GEE asset
Export.image.toAsset({
    'image': saida,
    'description': file_out + version_out,
    'assetId': dirout + file_out + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': saida.geometry(),
    'scale': 10,
    'maxPixels': 1e13
});
