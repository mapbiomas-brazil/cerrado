var ano = '2019';

var bioma = "CERRADO";
var file_in = bioma + '_col6_wetlands_gapfill_incid_temporal_spatial_v53';
var file_out = bioma + '_col6_wetlands_gapfill_incid_temporal_spatial_freq_v';
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var version_out = 53;

var class4 = ee.Image(dirout + file_in);


var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classificationWet_'+ ano,
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };

var col5 = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1')

Map.addLayer(col5.updateMask(class4.select(['classification_' + ano])), vis, 'col5')

var filtrofreq = function(mapbiomas){
  ////////Calculando frequencias
  //////////////////////
  ////////////////////
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

  //////seleciona o que foi vegetação nativa pelo menos X% da série
  var vegMask = ee.Image(0)
                           .where((florFreq.add(savFreq).add(grassFreq).add(wetFreq)).gte(90), 1);
  
  //var NaovegMask = ee.Image(0)
  //                         .where(agro.gt(95), 21)
  
  /////converte para toda série
  var  vegMap = ee.Image(0)
                          .where(vegMask.eq(1).and(AgrFreq.gt(33)), 19)
                          .where(vegMask.eq(1).and(pastureFreq.gt(33)), 15)
                          .where(vegMask.eq(1).and(wetFreq.gt(50)), 11)
                          .where(vegMask.eq(1).and(florFreq.gt(33)), 3)
                          .where(vegMask.eq(1).and(grassFreq.gt(33)), 12)
                          .where(vegMask.eq(1).and(savFreq.gt(33)), 4)

  vegMap = vegMap.updateMask(vegMap.neq(0))//.clip(BiomaPA)
  //NaovegMask = NaovegMask.updateMask(NaovegMask.neq(0))//.clip(BiomaPA)
  //Map.addLayer(vegMap, vis, 'vegetacao estavel', true);
  //Map.addLayer(NaovegMask, vis, 'Não vegetacao estavel', true);

  var saida = mapbiomas.where(vegMap, vegMap)
  //saida = saida.where(NaovegMask, NaovegMask)
  
  return saida;
}


  
  var saida = filtrofreq(class4)
  saida = saida
  .set('version', version_out)
  .set('biome', bioma)
  .set('step', 'frequency')

print(class4)
print(saida)

Map.addLayer(class4, vis, 'image');

Map.addLayer(saida, vis, 'filtered');


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
