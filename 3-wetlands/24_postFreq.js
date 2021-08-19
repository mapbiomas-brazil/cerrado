// Post-processing - Frequency filter
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define input
var bioma = "CERRADO";
var file_in = bioma + '_col6_wetlands_gapfill_incid_temporal_spatial_v54';

// define output
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file_out = bioma + '_col6_wetlands_gapfill_incid_temporal_spatial_freq_v';
var version_out = 54;

// read input as image
var class4 = ee.Image(dirout + file_in);

// define year to plot example
var ano = '2019';

// import mapbiomas color ramp 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
      bands: 'classification_'+ ano,
      min: 0,
      max: 49,
      palette: palettes.get('classification6');,
      format: 'png'
    };

// import collection 5.0
var col5 = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1')

// plot collection 5.0
Map.addLayer(col5.updateMask(class4.select(['classification_' + ano])), vis, 'col5')

// define the function to calc frequencies 
var filtrofreq = function(mapbiomas){
 // General rule
 var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
      '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31)+b(32)+b(33)+b(34)+b(35))/36 )';
  
  // get frequency
  var AgrFreq = mapbiomas.eq(19).expression(exp);
  var pastureFreq = mapbiomas.eq(15).expression(exp);
  var florFreq = mapbiomas.eq(3).expression(exp);
  var savFreq = mapbiomas.eq(4).expression(exp);
  var wetFreq = mapbiomas.eq(11).expression(exp);
  var grassFreq = mapbiomas.eq(12).expression(exp);

  // select pixels that were native vegetation at least 90% of the time series
  var vegMask = ee.Image(0).where((florFreq.add(savFreq).add(grassFreq).add(wetFreq)).gte(90), 1);  

  // apply for all the time-series when:
  var  vegMap = ee.Image(0)
                          .where(vegMask.eq(1).and(AgrFreq.gt(50)), 19)
                          .where(vegMask.eq(1).and(pastureFreq.gt(50)), 15)
                          .where(vegMask.eq(1).and(wetFreq.gt(50)), 11)
                          .where(vegMask.eq(1).and(florFreq.gt(50)), 3)
                          .where(vegMask.eq(1).and(grassFreq.gt(50)), 12)
                          .where(vegMask.eq(1).and(savFreq.gt(50)), 4)

  // mask pixels that were not filtered
  vegMap = vegMap.updateMask(vegMap.neq(0))

  var saida = mapbiomas.where(vegMap, vegMap)
 
  return saida;
}

// set properties   
  var saida = filtrofreq(class4)
  saida = saida
  .set('version', version_out)
  .set('biome', bioma)
  .set('step', 'frequency')

// print 
print(class4)
print(saida)

// plot 
Map.addLayer(class4, vis, 'image');
Map.addLayer(saida, vis, 'filtered');

// export as GEE asset
Export.image.toAsset({
    'image': saida,
    'description': file_out + version_out,
    'assetId': dirout + file_out + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': class4.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
