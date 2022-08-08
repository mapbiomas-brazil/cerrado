// apply geomorfology filters
// dhemerson.costa@ipam.org.br

// get collection 
var classification = ee.Image('users/dh-conciani/collection7/c7-general-post/CERRADO_col7_gapfill_incidence_temporal_frequency_v8');

// get geomorfology 
var geomorfology = ee.Image('users/juandoblas/geomorfologia_IBGE_2009_250_raster_30m')
                      .updateMask(classification.select(0));


// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

//Map.addLayer(geomorfology.randomVisualizer(), {}, 'geomorfology', false);
Map.addLayer(classification.select(['classification_2021']), vis, 'classification 2021');

// set recipe
var recipe = ee.Image([]);

// apply geomorfology filter to avoid that wetlands receive grassland class
ee.List.sequence({'start': 1985, 'end': 2021}).getInfo()
  .forEach(function(year_i) {
    // get classification [i]
    var image_i = classification.select(['classification_' + year_i]);
    // convert grassland over to wetland where
    var filtered_i = image_i
      .where(image_i.eq(12).and(geomorfology.eq(23)), 11)  // 23: plano de inundação 
      .where(image_i.eq(12).and(geomorfology.eq(29)), 11)  // 29: planície fluviolacustre
           
    //bind
    recipe = recipe.addBands(filtered_i);
  });
  
Map.addLayer(recipe.select(['classification_2021']), vis, 'filtered 2021');

// export as GEE asset
Export.image.toAsset({
    'image': recipe2,
    'description': 'CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_v8',
    'assetId': 'users/dh-conciani/collection7/c7-general-post/CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_v6',
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
