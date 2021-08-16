// compute area by class considering cerrado mapbiomas collection 6 
// dhemerson.costa@ipam.org.br

// import ibges biome
var biomas = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
var cerrado = biomas.updateMask(biomas.eq(4));

// function to compute area in squared-kilometers
var pixelArea = ee.Image.pixelArea().divide(1000000);

// define collection 5 asset
var file_path = 'projects/mapbiomas-workspace/public/collection5/';
var file_name = 'mapbiomas_collection50_integration_v1';

// define collection 6 asset
//var file_path = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
//var file_name = 'CERRADO_col6_CERRADO_col6_geral_v1';

var dir_out = 'TEMP2';
var export_name = 'area_col5';

// define cerrado regions asset
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');

// regions to compute class area
var regioes = [ 
                 1,  2,  3,  4,  5,  6,  7,  8, 
                 9, 10, 11, 12, 13, 14, 15, 16,
                 17, 18, 19, 20, 21, 22, 23, 24,
                 25, 26, 27, 28, 29, 30, 31, 32,
                 33, 34, 35, 36, 37, 38
                ];

// years to compute class area
var anos = [ 
             //1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994,
             //1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004,
             2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
             2015, 2016, 2017, 2018, 2019//, 2020
            ];

// create an empty recipe to receive data
var recipe = ee.FeatureCollection([]);

anos.forEach(function(process_year) {
  // for each year
  // load classification
  var img_i = ee.Image(file_path + file_name).select(['classification_' + process_year]);
  img_i = img_i.updateMask(cerrado);
  
  regioes.forEach(function(process_region) {
    // for each region
    // select region polygon
    var pol_reg = regioesCollection.filterMetadata('mapb', 'equals', process_region); 
    
    // clip yearly image to each region 
    var img_clip = img_i.clip(pol_reg);
    
    // compute area 
    var area03 = pixelArea.mask(img_clip.eq(3));
    var area04 = pixelArea.mask(img_clip.eq(4));
    var area12 = pixelArea.mask(img_clip.eq(12));
    //var area21 = pixelArea.mask(img_clip.eq(21));
    var area15 = pixelArea.mask(img_clip.eq(15));
    var area25 = pixelArea.mask(img_clip.eq(25));
    var area33 = pixelArea.mask(img_clip.eq(33));
    
    // paste area as metadata into region polygon 
    pol_reg = ee.Feature(pol_reg.geometry())
          .set('forest', ee.Number(area03.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          .set('savanna', ee.Number(area04.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          .set('grassland', ee.Number(area12.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          //.set('mosaic', ee.Number(area21.reduceRegion({reducer: ee.Reducer.sum(),
          //    geometry: pol_reg.geometry(),
          //    scale: 30,
          //    maxPixels: 1e13}).get('area')))
          .set('pasture', ee.Number(area15.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          .set('other_nonVeg', ee.Number(area25.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          .set('water', ee.Number(area33.reduceRegion({reducer: ee.Reducer.sum(),
              geometry: pol_reg.geometry(),
              scale: 30,
              maxPixels: 1e13}).get('area')))
          .set('region', process_region)
          .set('year', process_year);
    
    // bind into recipe
    recipe = recipe.merge(pol_reg);
  });
});

// plot diagnosys
print ('recipe.first()',recipe.first());
print ('recipe.size()',recipe.size());
print ('recipe',recipe);
//Map.addLayer(recipe,{},'recipe');

// exporto to gDrive
Export.table.toDrive({
  collection: recipe,
  description: export_name,
  folder: dir_out,
  fileFormat: 'CSV'
});
