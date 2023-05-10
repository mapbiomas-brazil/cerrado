// --- --- --- 15_integrate 
// integrate rocky-outcrop over cerrado native vegetation
// barbara.silva@ipam.org.br

// import files
var native = ee.Image('projects/ee-ipam-cerrado/assets/Collection_8/CERRADO_col8_gapfill_incidence_temporal_frequency_geomorfology_spatial_v0');
var rocky = ee.Image('projects/ee-ipam-cerrado/assets/Collection_8/rocky-outcrop/general-class-post/CERRADO_col8_rocky_gapfill_frequency_v1');
var biome = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// import mapbiomas color ramp
var vis = {
      min:0,
      max:62,
      palette: require('users/mapbiomas/modules:Palettes.js').get('classification7'),
    };

// create recipe
var recipe = ee.Image([]);

// chapada dos veadeiros
var geometry_veadeiros = 
    ee.Image(1).clip(ee.FeatureCollection(ee.Geometry.Polygon(
        [[[-47.91136858164175, -13.828379924704489],
          [-47.91136858164175, -14.275996243879357],
          [-47.28377458750113, -14.275996243879357],
          [-47.28377458750113, -13.828379924704489]]], null, false)));
          
// create mask
var mask = biome.updateMask(biome.eq(4)).where(geometry_veadeiros.eq(1), 1);

// integrate
ee.List.sequence({'start': 1985, 'end': 2022}).getInfo()
  .forEach(function(year_i) {
    // get year i
    var native_i = native.select(['classification_' + year_i]);
    var rocky_i = rocky.select(['classification_' + year_i]);
    
    // integrate
    var integrated_i = native_i.where(rocky_i.eq(29).and(mask.neq(1)), 29);
    
    // apply a post-integration spatial filter
    // compute the focal model
    var focal_mode = integrated_i
                    .unmask(0)
                    .focal_mode({'radius': 1, 'kernelType': 'square', 'units': 'pixels'});
     
    // compute te number of connections
    var connections = integrated_i
                      .unmask(0)
                      .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
            
    // get the focal model when the number of connections of same class is lower than parameter
    var to_mask = focal_mode.updateMask(connections.lte(6));
    
    // apply filter
    integrated_i = integrated_i
                    .blend(to_mask)
                    .reproject('EPSG:4326', null, 30)
                    .updateMask(biome.eq(4));
                    
    // add to recipe
    recipe = recipe.addBands(integrated_i);
  });

// plot
Map.addLayer(native.select(['classification_2010']), vis, 'native');
Map.addLayer(recipe.select(['classification_2010']), vis, 'integrated');
print('ouput image', recipe);

// set output directory
var root = 'projects/ee-ipam-cerrado/assets/Collection_8/rocky-outcrop/general-class-post/';

// export as GEE asset
Export.image.toAsset({
    'image': recipe,
    'description': 'CERRADO_col8_native1_rocky1',
    'assetId': root + 'CERRADO_col8_native1_rocky1',
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': native.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
