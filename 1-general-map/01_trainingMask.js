// -- -- -- -- 01_trainingMask
// generate training mask based in stable pixels from mapbiomas collection 8.0, reference maps and GEDI data
// dhemerson.costa@ipam.org.br and barbara.silva@ipam.org.br

// Set Cerrado extent in which result will be exported 
var extent = ee.Geometry.Polygon(
  [[[-60.935545859442364, -1.734173093722467],
    [-60.935545859442364, -25.10422789569622],
    [-40.369139609442364, -25.10422789569622],
    [-40.369139609442364, -1.734173093722467]]], null, false);
  
// Read brazilian states (to be used to filter reference maps)
var assetStates = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

// Set directory for the output file
var dirout = 'users/dh-conciani/collection9/masks/';

// Set string to identify the output version
var version_out = '4';

// Read mapbiomas lulc -- collection 8.0
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1');

// Set function to reclassify collection by ipam-workflow classes 
var reclassify = function(image) {
  return image.remap({
    'from': [3, 4, 5, 6, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 36, 46, 47, 35, 48, 23, 24, 30, 25, 33, 31],
    'to':   [3, 4, 3, 3,  3, 11, 12, 12, 25, 12, 12, 15, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 25, 25, 25, 25, 33, 33]
    }
  );
};

// Set function to compute the number of classes over a given time-series 
var numberOfClasses = function(image) {
    return image.reduce(ee.Reducer.countDistinctNonNull()).rename('number_of_classes');
};

// Set years to be processed 
var years = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
             2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
             2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// Remap collection to ipam-workflow classes 
var recipe = ee.Image([]);      // build an empty container

// For each year
years.forEach(function(i) {
  
  // select classification for the year i
  var yi = reclassify(collection.select('classification_' + i)).rename('classification_' + i);
  
  // store into container
  recipe = recipe.addBands(yi);
});

// Get the number of classes 
var nClass = numberOfClasses(recipe);

// Now, get only the stable pixels (nClass equals to one)
var stable = recipe.select(0).updateMask(nClass.eq(1));

// Import mapbiomas color schema 
var vis = {
    min: 0,
    max: 62,
    palette:require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Plot stable pixels
Map.addLayer(stable, vis, '0. MB stable pixels', false);


// * * * D E F O R E S T A T I O N   M A S K S
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

// 2- Cerrado Deforestation Alert System (SAD Cerrado)
var sad = ee.Image(1).clip(
  ee.FeatureCollection('projects/ee-sad-cerrado/assets/PUBLIC/SAD_CERRADO_ALERTAS')
    // add 2021 data, from another asset  
    .merge(ee.FeatureCollection('projects/ee-sad-cerrado/assets/WARNINGS/SAD_CERRADO_ALERTAS_2021'))
    // filter to retain only deforestations at the end of 2023 
    .filterMetadata('detect_mon', 'less_than', 2401)
  );
  
// Erase stable pixels of native vegetation that were classified as deforestation by SAD 
stable = stable.where(sad.eq(1).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);
Map.addLayer(stable, vis, '2. Filtered by SAD', false);

// 3 - MapBiomas Alert (MB Alerta)
var mb_alerta = ee.Image('projects/ee-sad-cerrado/assets/ANCILLARY/produtos_desmatamento/mb_alertas_up_to_2023_020524');

// Erase stable pixels of native vegetation that were classified as deforestation by MB Alerta 
stable = stable.where(mb_alerta.gte(1).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);
Map.addLayer(stable, vis, '3. Filtered by MB Alerta', false);


// * * * R E F E R E N C E    M A P     M A S K S
// 4- Forest Inventory of the State of São Paulo
var sema_sp = ee.Image('projects/mapbiomas-workspace/MAPA_REFERENCIA/MATA_ATLANTICA/SP_IF_2020_2')
  .remap({
    'from': [3, 4, 5, 9, 11, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33],
    'to':   [3, 4, 3, 0, 11, 12, 12, 0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
  }
);

// Erase stable pixels of native vegetation that wasn't classifeid as in the SEMA SP map
stable = stable.where(sema_sp.eq(0).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);

// Remove grasslands from São Paulo state
stable = stable.where(stable.eq(12).and(assetStates.eq(35)), 27);

// Apply rules for native vegetation
stable = stable
  // Forest Formation
  .where(stable.eq(3).and(sema_sp.neq(3)), 27)
  .where(stable.neq(3).and(sema_sp.eq(3)), 3)
  // Savanna Formation
  .where(stable.eq(4).and(sema_sp.neq(4)), 27)
  .where(stable.neq(4).and(sema_sp.eq(4)), 4)
  // Grassland
  .where(stable.gte(1).and(sema_sp.eq(12)), 12)
  // Wetland
  .where(stable.neq(11).and(sema_sp.eq(11)), 11);

Map.addLayer(stable, vis, '4. Filtered by SEMA SP', false);

// 5- CAR Thematic Mapping for the State of Tocantins
var sema_to = ee.Image('users/dh-conciani/basemaps/TO_Wetlands_CAR')
  .remap({
    'from': [11, 50, 128],
    'to':   [11, 11, 0]
  }
);

// Replace stable pixels of savanna and grassland that was wetland in the reference map by wetland
stable = stable.where(sema_to.eq(11).and(stable.eq(4).or(stable.eq(12).or(stable.eq(27)))), 11);
Map.addLayer(stable, vis, '5. Filtered by SEMA TO', false);

// 6- Land use and cover map of Distrito Federal
var sema_df = ee.Image('projects/barbaracosta-ipam/assets/base/DF_cobertura-do-solo_2019_img')
  // get only native vegetation
  .remap({
    'from': [3, 4, 11, 12],
    'to':   [3, 4, 11, 12],
    'defaultValue': 0
  }
);

// Erase stable pixels of native vegetation that wasn't in the SEMA DF map
stable = stable.where(sema_df.eq(0).and(stable.eq(3).or(stable.eq(4).or(stable.eq(11).or(stable.eq(12))))), 27);
Map.addLayer(stable, vis, '6. Filtered by SEMA DF', false);

// 7- Mapping 'Campos de Murundus' in the State of Goiás 
var sema_go = ee.Image(11).clip(
  ee.FeatureCollection('users/dh-conciani/basemaps/SEMA_GO_Murundus')
);

// Replace stable pixels of savanna and grassland that was wetland in the reference map by wetland
stable = stable.where(sema_go.eq(11).and(stable.eq(4).or(stable.eq(12).or(stable.eq(27)))), 11);
Map.addLayer(stable, vis, '7. Filtered by SEMA GO', false);


// * * * G E D I    B A S E D    M A S K 
// 8- Canopy heigth (in meters)
// From Lang et al., 2023 (https://www.nature.com/articles/s41559-023-02206-6)
var canopy_heigth = ee.Image('users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1');

// Filter stable pixels by using field-based rules per vegetation type 
stable = stable.where(stable.eq(3).and(canopy_heigth.lt(4)), 50)
               .where(stable.eq(4).and(canopy_heigth.lte(2)), 50)
               .where(stable.eq(4).and(canopy_heigth.gte(8)), 50)
               .where(stable.eq(11).and(canopy_heigth.gte(15)), 50)
               .where(stable.eq(12).and(canopy_heigth.gte(6)), 50)
               .where(stable.eq(15).and(canopy_heigth.gte(8)), 50)
               .where(stable.eq(19).and(canopy_heigth.gt(7)), 50)
               .where(stable.eq(25).and(canopy_heigth.gt(0)), 50)
               .where(stable.eq(33).and(canopy_heigth.gt(0)), 50);

Map.addLayer(stable, vis, '8. Filtered by GEDI', false);

// Export as GEE asset
Export.image.toAsset({
    "image": stable.toInt8(),
    "description": 'cerrado_trainingMask_1985_2022_v' + version_out,
    "assetId": dirout + 'cerrado_trainingMask_1985_2022_v'+ version_out,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": extent
});  
