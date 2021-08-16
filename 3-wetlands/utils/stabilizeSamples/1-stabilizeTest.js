// teste de establização (amostras)

// importar coleção do cerrado
var col6 = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_wetlands_gapfill_incid_temporal_spatial_freq_v52');

// definir anos para processar 
var yearsList = [1985, 1986, 1987, 1988, 1989,
                 1990, 1991, 1992, 1993, 1994,
                 1995, 1996, 1997, 1998, 1999,
                 2000, 2001, 2002, 2003, 2004,
                 2005, 2006, 2007, 2008, 2009,
                 2010, 2011, 2012, 2013, 2014,
                 2015, 2016, 2017, 2018, 2019,
                 2020];
                 

// criar um recipiente vazio
var recipe = ee.Image([]);

yearsList.forEach(function(process_year) {

  // carregar correçao do ano i
  var col6_i = col6.select(['classificationWet_' + process_year]);
  print ('ano certo', col6_i);
  
  // criar variavel corrigida nula
  var corrected_i = ee.Image([]);
    
  // carregar t - 1
  if (process_year == 1985) {
      var col6_it = col6_i;
      print ('ano atrás', col6_it);
    }
  if (process_year > 1985) {
      var col6_it = recipe.select(['classificationWet_' + (process_year - 1)]);
      print ('ano atrás', col6_it);
  }
  
  // corrigir ano i
    corrected_i = col6_i.updateMask(col6_it.eq(11));
    corrected_i = corrected_i.updateMask(corrected_i.eq(11));

  // empilhar banda
  recipe = recipe.addBands(corrected_i);
});

print (recipe);

// carregar palhetas
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 45,
    'palette': palettes.get('classification5')
};

Map.addLayer(col6.select(['classificationWet_2020']), vis, 'bruta');
Map.addLayer(recipe.select(['classificationWet_2020']), {}, 'corrigida');
Map.addLayer(recipe.geometry());

// exportar dados
  Export.image.toAsset({
    'image': recipe,
    'description': 'CERRADO_col6_wetlands_gapfill_incid_temporal_spatial_freq_v53',
    'assetId': 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_wetlands_gapfill_incid_temporal_spatial_freq_v53',
     'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': recipe.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
