// -- -- -- -- 08_computeProportion_step2
// compute area to sort samples - second phase
// barbara.silva@ipam.org.br

// // input metadata
var version = '4';

// define classes to be assessed
var classes = [3, 4, 11, 12, 15, 19, 21, 29, 33];

// output directory
var dirout = 'projects/ee-barbaracsilva/assets/Collection_8/rocky-outcrop_step2/sample/area/';

// area of interest for rocky outcrop
var aoi = ee.Image(1).clip(ee.FeatureCollection('projects/ee-barbarasilvaipam/assets/collection8-rocky/masks/aoi_v5'));

// rocky ouytcrop
var rocky = ee.Image('projects/ee-barbarasilvaipam/assets/collection8-rocky/general-class-post/CERRADO_col8_rocky_gapfill_frequency_spatial_v4')
              .select(['classification_2021']);

// stable pixels collection 7.1
var stable = ee.Image('projects/ee-barbarasilvaipam/assets/collection8/masks/cerrado_stablePixels_1985_2021_v2')
                // insert rocky outcrop 
                .blend(rocky.updateMask(rocky.eq(29)))
                .updateMask(aoi.eq(1));

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification7')
};

// get cerrado biome
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                .filterMetadata('Bioma', 'equals', 'Cerrado');
                
// define function to compute area (skm)
var pixelArea = ee.Image.pixelArea().divide(1000000);

// define function to get class area 
// for each region 
var getArea = function(feature) {
  // get classification for the region [i]
  var mapbiomas_i = stable.clip(feature);
  // for each class [j]
  classes.forEach(function(class_j) {
    // create the reference area
    var reference_ij = pixelArea.mask(mapbiomas_i.eq(class_j));
    // compute area and insert as metadata into the feature 
    feature = feature.set(String(class_j),
                         ee.Number(reference_ij.reduceRegion({
                                      reducer: ee.Reducer.sum(),
                                      geometry: feature.geometry(),
                                      scale: 30,
                                      maxPixels: 1e13
                                      }).get('area')
                                  )
                              ); // end of set
                          }); // end of class_j function
  // return feature
  return feature;
}; 

var computed_obj = cerrado.map(getArea);
print (computed_obj);

Map.addLayer(aoi, {palette: ['red', 'blue'], min:1, max:2}, 'aoi');
Map.addLayer(stable, vis, 'stable');

// export computation as GEE asset
Export.table.toAsset({'collection': computed_obj, 
                      'description': 'stable_v' + version,
                      'assetId': dirout + 'stable_v' + version});
