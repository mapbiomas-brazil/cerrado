// -- -- -- -- 11_spatial
// spatial filter - minimum area
// barbara.silva@ipam.org.br

// Set root directory
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '1';
var outputVersion = '1';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v4_incidence_v4_temporal_v1_frequency_v'+inputVersion;

// Import MapBiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);

// Plot  input version
Map.addLayer(classificationInput.select(['classification_2010']), vis, 'input 2010');

// Create an empty container
var filtered = ee.Image([]);

// Set filter size
var filter_size = 6;

// Apply first sequence of the spatial filter
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
      .forEach(function(year_i) {
        // Compute the focal model
        var focal_mode = classificationInput.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 8, 'kernelType': 'square', 'units': 'pixels'});
 
        // Compute te number of connections
        var connections = classificationInput.select(['classification_' + year_i])
                .unmask(0)
                .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
        
        // Get the focal model when the number of connections of same class is lower than parameter
        var to_mask = focal_mode.updateMask(connections.lte(filter_size));

        // Apply filter
        var classification_i = classificationInput.select(['classification_' + year_i])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);

        // Stack into container
        filtered = filtered.addBands(classification_i.updateMask(classification_i.neq(0)));
        }
      );

// print first sequence of the spatial filter
Map.addLayer(filtered.select(['classification_2010']), vis, 'filtered 2010 - round 1');

// set container 
var container = ee.Image([]);

// Apply second sequence of the spatial filter
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
      .forEach(function(year_i) {
        // Compute the focal model
        var focal_mode = filtered.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 8, 'kernelType': 'square', 'units': 'pixels'});
 
        // Compute te number of connections
        var connections = filtered.select(['classification_' + year_i])
                .unmask(0)
                .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
        
        //Get the focal model when the number of connections of same class is lower than parameter
        var to_mask = focal_mode.updateMask(connections.lte(filter_size));

        // Apply filter
        var classification_i = filtered.select(['classification_' + year_i])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);

        // Stack into container
        container = container.addBands(classification_i.updateMask(classification_i.neq(0)));
        }
      );

Map.addLayer(container.select(['classification_2010']), vis, 'filtered 2010 - round 2');

var container2 = ee.Image([]);

// Fill zeros (blank spaces generated by regions register)
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
  .forEach(function(year_i) {
    // Compute the focal mode with an extended kernel
    var focal_mode =  container.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 4, 'kernelType': 'square', 'units': 'pixels'});
                
    // Get only blank pixels (value equals to zero) 
    var to_mask = focal_mode.updateMask(container.select(['classification_2010']).unmask(0).eq(0));
    
    // Apply filter
    var classification_i = container.select(['classification_' + '2010'])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);
    
    // Stack into container
    container2 = container2.addBands(classification_i.updateMask(classification_i.neq(0)));
  });

Map.addLayer(container2.select(['classification_2010']), vis, 'final filled');
print('Output classification', container2);

// export as GEE asset
Export.image.toAsset({
    'image': container2,
    'description': 'CERRADO_col9_gapfill_v4_incidence_v4_temporal_v1_frequency_v'+inputVersion+'_spatial_v' + outputVersion,
    'assetId': root + 'CERRADO_col9_gapfill_v4_incidence_v4_temporal_v1_frequency_v'+inputVersion+'_spatial_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classificationInput.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
