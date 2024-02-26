// -- -- -- -- 01_trainingMask
// generate training mask based in stable pixels from mapbiomas collection 8, reference maps and GEDI
//  dhemerson.costa@ipam.org.br and barbara.silva@ipam.org.br

// import cerrado extent as geometry
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
  .filterMetadata('Bioma', 'equals', 'Cerrado')
  .geometry();
  
// read brazilian states (to be used to filter reference maps)
var assetStates = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

// set directory for the output file
var dirout = 'users/dh-conciani/collection9/masks/';

// set string to identify the output version
var version_out = '1';

// read mapbiomas lulc 
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');

// set function to reclassify collection by ipam-workflow classes 
var reclassify = function(image) {
  return image.remap({
    'from': [3, 4, 5, 6, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 36, 46, 47, 35, 48, 23, 24, 30, 25, 33, 31],
    'to':   [3, 4, 3, 3,  3, 11, 12, 12, 25, 12, 12, 15, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 25, 25, 25, 25, 33, 33]
    }
  );
};

// set function to compute the number of classes over a given time-series 
var numberOfClasses = function(image) {
    return image.reduce(ee.Reducer.countDistinctNonNull()).rename('number_of_classes');
};

// set years to be processed 
var years = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
             2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
             2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// remap collection to ipam-workflow classes 
var recipe = ee.Image([]);      // build empty recipe
// for each year
years.forEach(function(i) {
  // select classification for the year i
  var yi = reclassify(collection.select('classification_' + i)).rename('classification_' + i);
  // store into recipe
  recipe = recipe.addBands(yi);
});

// get the number of classes 
var nClass = numberOfClasses(recipe);

// now, get only the stable pixels (nClass equals to one)
var stable = recipe.select(0).updateMask(nClass.eq(1));

// import the color ramp module from mapbiomas 
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7')
};

// Plot stable pixels
Map.addLayer(stable, vis, '0. MB stable pixels', false);

// * * * D E F O R E S T A T I O N      M A S K S
// 1- PRODES 
var prodes = ee.Image('projects/ee-sad-cerrado/assets/ANCILLARY/produtos_desmatamento/prodes_cerrado_raster_2000_2023_v20231116')
  // convert annual deforestation to a binary raster in which value 1 represents cummulative deforestation 
  .remap({
    'from': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 100],
    'to':   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,   0]
  }
);

// Erase stable pixels of native vegetation that were classified as deforestation by PRODES 
stable = stable.where(prodes.eq(1).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);
Map.addLayer(stable, vis, '1. Filtered by PRODES', false);


// 2- Sistema de Alerta de Desmatamento do Cerrado (SAD Cerrado)
var sad = ee.Image(1).clip(
  ee.FeatureCollection('projects/ee-sad-cerrado/assets/PUBLIC/SAD_CERRADO_ALERTAS')
    // filter to retain only deforestations at the end of 2023 
    .filterMetadata('detect_mon', 'less_than', 2401)
  );
  
// Erase stable pixels of native vegetation that were classified as deforestation by SAD 
stable = stable.where(sad.eq(1).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);
Map.addLayer(stable, vis, '2. Filtered by SAD', false);


// 3 - MapBiomas Alerta (MB Alerta)
var mb_alerta = ee.FeatureCollection('projects/ee-robertarocha/assets/MapBiomasAlerta_total')
  // get only deeforestation year (last two digits)
  .map(function(feature) {
    return feature.set('year', ee.Number(ee.String(ee.Number.parse(
      feature.get('AnoDetec')).int()).slice(2)));
  }
);

// Erase stable pixels of native vegetation that were classified as deforestation by |MB Alerta

// * * * R E F E R E N C E    M A P     M A S K S
// 4- Inventário Florestal do Estado de SP
var sema_sp = ee.Image('projects/mapbiomas-workspace/VALIDACAO/MATA_ATLANTICA/SP_IF_2020_2')
  .remap({
    'from': [3, 4, 5, 9, 11, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33],
    'to':   [3, 4, 3, 9, 11, 12, 12, 15, 19, 19, 19, 21, 25, 25, 25, 25, 33, 25, 25, 25, 25, 33]
  }
);

// Erase XX from YY

// 5- Mapeamento Temático do CAR para o Estado do Tocantins
var sema_to = ee.Image('users/dh-conciani/basemaps/TO_Wetlands_CAR')
  .remap({
    'from': [11, 50, 128],
    'to':   [11, 11, 0]
  }
);

// Erase XX from YY

// 6- Uso e cobertura da Terra no DF
var sema_df = ee.Image('projects/barbaracosta-ipam/assets/base/DF_cobertura-do-solo_2019_img');

// Erase XX from YY

// 7- Mapeamento de Campos de Murumdum do Estado de Goías 
var sema_go = ee.Image('');

// 8- Canopy heigth (in meters)
// From Lang et al., 2023 (https://www.nature.com/articles/s41559-023-02206-6)
var canopy_heigth = ee.Image('users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1');






// compute invariant pixels 
