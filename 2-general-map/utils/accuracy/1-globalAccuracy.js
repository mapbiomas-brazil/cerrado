// cerrado pre-integration global accuracy 
// dhemerson.costa@ipam.org.br 

// select type (options = remmap, normal or col 5)
var type = 'remmap';

// import products
var file_path = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file_name = 'CERRADO_col6_final_v8';

// col 5
//var file_path = 'projects/mapbiomas-workspace/public/collection5/';
//var file_name = 'mapbiomas_collection50_integration_v1';

// label string
var label = file_name;

// LAPIG points
var assetPoints = 'projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8';

// classification regions
var regioesCollection = ee.FeatureCollection('users/dhconciani/base/cerrado_regioes_c6');

// regions of classification 
var regioes = [ 
                1,  2,  3,  4,  5,  6,  7,  8, 
                9, 10, 11, 12, 13, 14, 15, 16,
                17, 18, 19, 20, 21, 22, 23, 24,
                25, 26, 27, 28, 29, 30, 31, 32,
                33, 34, 35, 36, 37, 38
                ];

// define years to extract accuracy
var anos = [ 
            1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994,
            1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004,
            2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
            2015, 2016, 2017, 2018
            ];

// define biome
var bioma = "CERRADO";

// exclude this classes from LAPIG validation points (for col6)
if (type === 'remmap' || type === 'normal') {
  var excludedClasses = [
    "Não Observado",
    "Erro",
    "-",
    "Não consolidado",
    "Não consolidado",
    "Silvicultura",
    "silvicultura",
    "Floresta Plantada",
    "Cultura Anual",
    "Cultura Semi-Perene",
    "Mangue",
    "Outra Formação não Florestal",
    "Apicum",
    "Praia e Duna",
    "�rea �mida Natural n�o Florestal",
    "Área Úmida Natural não Florestal",
    "�rea �mida Natural N�o Florestal",
    "Área Úmida Natural Não Florestal",
    "Outra Forma��o Natural N�o Florestal",
    "Outra Formação Natural Não Florestal",
    "Rengeração",
    "Desmatamento"
  ]; 
}

// exclude this classes from LAPIG validation points (for col5)
if (type === 'col5') {
  var excludedClasses = [
    "Não Observado",
    "Erro",
    "-",
    "Não consolidado",
    "Não consolidado",
    "Cultura Anual",
    "Cultura Semi-Perene",
    "Mangue",
    "Apicum",
    "Praia e Duna",
    "�rea �mida Natural n�o Florestal",
    "Área Úmida Natural não Florestal",
    "�rea �mida Natural N�o Florestal",
    "Área Úmida Natural Não Florestal",
    "Outra Forma��o Natural N�o Florestal",
    "Outra Formação Natural Não Florestal",
    "Rengeração",
    "Desmatamento"
  ]; 
}


if (type === 'remmap') {
  // define pixel value that corresponds to each LAPIG class for col 6 remapped 21
  var classes = {
    "Cultura Anual": 21,
    "Cultura Perene": 21,
    "Cultura Semi-Perene": 21,
    "Infraestrutura Urbana": 25,
    "Mineração": 25,
    "Pastagem Cultivada": 21,
    "Formação Florestal": 3,
    "Rio, Lago e Oceano": 33,
    "Outra Área não Vegetada": 25,
    "Formação Campestre": 12,
    "Afloramento Rochoso": 25,
    "Formação Savânica": 4,
    "Pastagem Natural": 12,
    "Aquicultura": 33,
    "Outra �rea N�o Vegetada": 25,
    "Outra Área Não Vegetada": 25
  }; 
}

// define pixel value that corresponds to each LAPIG class for col 6
if (type === 'normal') {
  var classes = {
  "Cultura Anual": 19,
  "Cultura Perene": 19,
  "Cultura Semi-Perene": 19,
  "Infraestrutura Urbana": 25,
  "Mineração": 25,
  "Pastagem Cultivada": 15,
  "Formação Florestal": 3,
  "Rio, Lago e Oceano": 33,
  "Outra Área não Vegetada": 25,
  "Formação Campestre": 12,
  "Afloramento Rochoso": 25,
  "Formação Savânica": 4,
  "Pastagem Natural": 12,
  "Aquicultura": 33,
  "Outra �rea N�o Vegetada": 25,
  "Outra Área Não Vegetada": 25
  }; 
}

// define pixel value that corresponds to each LAPIG class for col 5
if (type === 'col5') {
  var classes = {
  "Cultura Anual": 19,
  "Cultura Perene": 36,
  "Cultura Semi-Perene": 36,
  "Infraestrutura Urbana": 24,
  "Mineração": 30,
  "Pastagem Cultivada": 15,
  "Silvicultura": 9,
  "silvicultura": 9,
  "Floresta Plantada": 9,
  "Formação Florestal": 3,
  "Rio, Lago e Oceano": 33,
  "Outra Área não Vegetada": 25,
  "Outra Formação não Florestal": 13,
  "Formação Campestre": 12,
  "Afloramento Rochoso": 29,
  "Formação Savânica": 4,
  "Pastagem Natural": 12,
  "Aquicultura": 33,
  "Outra �rea N�o Vegetada": 25,
  "Outra Área Não Vegetada": 25 
  }; 
}

// biomes vector
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
var bioma250mil_MA = biomes.mask(biomes.eq(4)); // subset only cerrado

// create class dictionary 
classes = ee.Dictionary(classes);

// import mapbiomas palette module
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// create empty recipe
var recipe_regiao = ee.List([]);
var recipe_ano = ee.List([]);
var recipe_acc = ee.List([]);

//// Get samples for each year and export using for-loop///
for (var Year in anos){
  var year = anos[Year];
  var ano = anos[Year];
  
  var class_GAP = ee.Image(file_path + file_name).select('classification_' + ano);
  var class_GAP = class_GAP.updateMask(class_GAP.neq(0));

  if (type === 'remmap') {
    class_GAP = class_GAP.remap([3, 4, 11, 12, 21, 25, 33],
                                [3, 4, 12, 12, 21, 25, 33]);
  }

Map.addLayer(class_GAP, vis, 'class_gapfill' + ano, false);

  var amostraTotal = ee.FeatureCollection(assetPoints)
      .filterMetadata('POINTEDITE', 'not_equals', 'true')
      .filterMetadata('BIOMA', 'equals', bioma)
      .filter(ee.Filter.inList('CLASS_' + ano, excludedClasses).not())
    .map(
        function (feature) {
            return feature.set('year', ano)
                .set('reference', classes.get(feature.get('CLASS_' + ano)));
        }
    );

    for (var i_reg=0;i_reg<regioes.length; i_reg++){
      var regiao = regioes[i_reg];
      var limite = regioesCollection.filterMetadata('mapb', "equals", regiao);
      
      var class_GAP_reg = class_GAP.clip(limite);
      var pt_reg = amostraTotal.filterBounds(limite);
      var valida_reg1 = class_GAP_reg.sampleRegions({collection: pt_reg, properties: ['reference'], scale: 30, geometries: false});
      
      // calc accuracy
      if (type === "remmap") {
        var accuracy= valida_reg1.errorMatrix('remapped', 'reference').accuracy();
      }
      if (type === "normal" || type === 'col5') {
        var accuracy= valida_reg1.errorMatrix('classification_' + ano,'reference').accuracy();
      }
      
      // update lists
      recipe_regiao = recipe_regiao.add(regiao);
      recipe_ano = recipe_ano.add(ano);
      recipe_acc = recipe_acc.add(accuracy);
    }
}

// create array with results
var result_array = ee.Array.cat([recipe_regiao, recipe_ano, recipe_acc], 1);
print ('result array', result_array);

// convert array into feature
var feature_array = ee.Feature(null, {
  result_array:result_array
});

print ('feature array', feature_array);

// export CSV to googleDrive
Export.table.toDrive({
  collection: ee.FeatureCollection(feature_array),
  description: label,
  folder: 'TEMP',
  fileFormat: 'CSV'
});


