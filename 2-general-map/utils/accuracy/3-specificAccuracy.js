// perform overall and specific accuracy analisys by 'mapbiomas carta'
// write to "dhemerson.costa@ipam.org.br"

// define root folder for the classification data
var file_path = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file_name = 'CERRADO_col6_gapfill_incid_temporal_spatial_freq_v7_rect';

// import classification data - each band needs to correspond to one year 
var classification = ee.Image(file_path + file_name);
// import validation points 
var assetPoints = ee.FeatureCollection('projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8');
// import classification regions
var regionsCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');
// import biomes vector
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
// filter biomes vector only to Cerrado 
var vec_cerrado = biomes.mask(biomes.eq(4)); 

// define years to be assessed 
var years = [ 
            1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994,
            1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004,
            2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
            2015, 2016, 2017, 2018
            ];
            
// exclude this classes from validation points (for col6)
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
    "Mineração",
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

// define pixel value that corresponds to each LAPIG class for col 6
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

// create class dictionary 
classes = ee.Dictionary(classes);

// create empty recipe to receive data
var recipe = ee.FeatureCollection([]);

// for each year:
years.forEach(function(year_i){
  // import image classification for the year [i]
  var classification_i = classification.select('classification_' + year_i);
  // use only vlaid pixels, that is, not equal to zero
      classification_i = classification_i.updateMask(classification_i.neq(0));
      
  // import validation points and filter only to Cerrado 
  var valPoints_i = assetPoints
                    .filterMetadata('POINTEDITE', 'not_equals', 'true')
                    .filterMetadata('BIOMA', 'equals', 'CERRADO')
                    .filter(ee.Filter.inList('CLASS_' + year_i, excludedClasses).not())
                    .map(function(feature) {
                      return feature.set('year', year_i).set('reference', classes.get(feature.get('CLASS_' + year_i)));
                    });
  
  // for each region:
  var computeAccuracy = regionsCollection.map(function(feature) {
    // clip classification for the year [i]
    var classification_ij = classification_i.clip(feature);
    
    // filter validation points to the year [i] 
    var valPoints_ij = valPoints_i.filterBounds(feature.geometry());
    
    // extract classification value for each point and pair it with the reference data
    var paired_data = classification_ij.sampleRegions({
                      collection: valPoints_ij, 
                      properties: ['reference'], 
                      scale: 30, 
                      geometries: false});
    
    // compute confusion matrix
    var confusionMatrix= paired_data.errorMatrix('classification_' + year_i, 'reference');
    
    // compute accuracy metrics
    var global_accuracy = confusionMatrix.accuracy();
    var user_accuracy = confusionMatrix.consumersAccuracy();
    var producer_accuracy = confusionMatrix.producersAccuracy();
   
    // insert accuracy metrics as metadata for each vector
    return feature.set('GLOBAL_ACC', global_accuracy)
                  .set('FOREST_COMMISSION', ee.Number(1).subtract(user_accuracy.get([0, 3])))
                  .set('SAVANNA_COMMISSION', ee.Number(1).subtract(user_accuracy.get([0, 4])))
                  .set('GRASSLAND_COMMISSION', ee.Number(1).subtract(user_accuracy.get([0, 12])))
                  .set('PASTURE_COMMISSION', ee.Number(1).subtract(user_accuracy.get([0, 15])))
                  .set('FOREST_OMISSION', ee.Number(1).subtract(producer_accuracy.get([3, 0])))
                  .set('SAVANNA_OMISSION', ee.Number(1).subtract(producer_accuracy.get([4, 0])))
                  .set('GRASSLAND_OMISSION', ee.Number(1).subtract(producer_accuracy.get([12, 0])))
                  .set('PASTURE_OMISSION', ee.Number(1).subtract(producer_accuracy.get([15, 0])))
                  .set('VERSION', file_name)
                  .set('YEAR', year_i);
    });
  
  // update recipe with yearly data
  recipe = recipe.merge(computeAccuracy);

});

//print (recipe);

// export result as CSV
Export.table.toDrive({
  collection: recipe,
  description: 'accuracy_' + file_name,
  folder: 'TEMP',
  fileFormat: 'CSV'
});
