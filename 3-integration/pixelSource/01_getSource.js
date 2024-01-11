// get pixel source to meansure filter effect 
// dhemerson.costa@ipam.org.br

// set output dir
var output = 'users/dh-conciani/basemaps';
var filename = 'pixelSource_col8';

// read biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// set filters and assets
var assets = {
  'gapfill': 'projects/ee-barbarasilvaipam/assets/collection8/general-class-post/CERRADO_col8_gapfill_v3',
  'incidence': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_v5',
  'temporal': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_v14',
  'freq': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_v14',
  'geomorpho': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_v14',
  'spatial': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_spatial_v14',
  'integration': 'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
};

// set years to be processed
var years_list = [1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
                  2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
                  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// set function to remap collection
var remapCols = function(image) {
  // build empty recipe
  var recipe = ee.Image([]);
  years_list.forEach(function(year_i) {
    // get x
    var x = image.select('classification_' + year_i)
      .remap({
        'from':  [29, 3, 4, 5, 6, 49, 11, 12, 32, 19, 50, 13, 15, 39, 20, 40, 62, 41, 36, 46, 47, 35, 48, 9, 21, 23, 24, 30, 25, 33, 31],
        //'to':    [3, 4, 3, 3,  0, 11, 12,  0, 19, 0,  0,  0, 15, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 9,21, 25, 25, 25, 25, 33, 33],
        'to':    [25, 3, 4, 3, 3,  0, 11, 12,  0, 21, 0,  0, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,21, 25, 25, 25, 25, 33, 33],
        'defaultValue': 0
        }) // mask zeros
      .selfMask();
    // store
    recipe = recipe.addBands(x.rename('classification_' + year_i));

  });
  
  return recipe;
};

// read assets and remap them
var gapfill = remapCols(ee.Image(assets.gapfill));
var incidence = remapCols(ee.Image(assets.incidence));
var temporal = remapCols(ee.Image(assets.temporal));
var freq = remapCols(ee.Image(assets.freq));
var geomorpho = remapCols(ee.Image(assets.geomorpho));
var spatial = remapCols(ee.Image(assets.spatial));
var integration = remapCols(ee.Image(assets.integration));

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification7')
};

// build recipe
var recipe2 = ee.Image([]);

// get pixel-source per year 
years_list.forEach(function(year_i) {

  // get layers
  var gapfill_i = gapfill.select('classification_' + year_i);
  var incidence_i = incidence.select('classification_' + year_i);
  var temporal_i = temporal.select('classification_' + year_i);
  var freq_i = freq.select('classification_' + year_i);
  var geomorpho_i = geomorpho.select('classification_' + year_i);
  var spatial_i = spatial.select('classification_' + year_i);
  var integration_i = integration.select('classification_' + year_i);
  
  // build pixel-source
  var source = ee.Image(0)
    // appears in gapfill
    .where(gapfill_i.neq(0), 8)
    // apears in incidence
    .where(incidence_i.neq(gapfill_i), 7)
    // appears in temporal
    .where(temporal_i.neq(incidence_i), 6)
    // appears in frequency
    .where(freq_i.neq(temporal_i), 5)
    // appears in geomorpho
    .where(geomorpho_i.neq(freq_i), 4)
    // appears in spatial
    .where(spatial_i.neq(geomorpho_i), 3)
    // appears in integration
    .where(integration_i.neq(spatial_i), 2)
    // stable over versions
    .where(integration_i.eq(spatial_i).and(spatial_i.eq(geomorpho_i).and(geomorpho_i.eq(freq_i).and(freq_i.eq(temporal_i).and(temporal_i.eq(incidence_i).and(incidence_i.eq(gapfill_i)))))), 1)
  .selfMask()
  .rename('classification_' + year_i);
  
  // store
  recipe2 = recipe2.addBands(source);
});

// check
recipe2 = recipe2.updateMask(biomes.eq(4)).aside(Map.addLayer);
print(recipe2);

var cerrado_geometry = 
    ee.Geometry.Polygon(
        [[[-61.267821440420335, -1.733640363392174],
          [-61.267821440420335, -25.540695674939442],
          [-40.877196440420335, -25.540695674939442],
          [-40.877196440420335, -1.733640363392174]]], null, false);



// export as ee.Image
Export.image.toAsset({
    "image": recipe2.toInt8(),
    "description": filename,
    "assetId": output + '/' + filename,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": cerrado_geometry
});  

