// -- -- -- -- 08_temporal
// post-processing filter: temporal filter is used to identify transitions between classes that are implausible
// barbara.silva@ipam.org.br and dhemerson.costa@ipam.org.br

// Import mapbiomas color schema 
var vis = {
    min: 0,
    max: 62,
    palette:require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Set root directory
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '8';
var outputVersion = '8';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v8_incidence_v'+inputVersion;

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);
Map.addLayer(classificationInput.select(['classification_2023']), vis, 'Input classification');

// Define empty classification to receive data
var classification = ee.Image([]);

// Remap agriculture and pasture classes to single-one [21]
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
    .forEach(function(year_i) {
      
      // Get year [i]
      var classification_i = classificationInput.select(['classification_' + year_i])
        // Remap classes
        .remap([3, 4, 11, 12, 15, 18, 25, 33],
               [3, 4, 11, 12, 21, 21, 25, 33])
               .rename('classification_' + year_i);
               
               // Insert into aggregated classification
               classification = classification.addBands(classification_i);
    });

// -- -- -- -- Set rules to mask mid years 
// -- -- Three years 
var rule_3yr = function(class_id, year, image) {
  // Get pixels to be mask when the mid year is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)    // previous
           .and(image.select(['classification_' + year]).neq(class_id))              // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id));  // next

  // Rectify value in the current year 
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

// -- -- Four years 
var rule_4yr = function(class_id, year, image) {
  // Get pixels to be mask when the mid years is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)      // previous
           .and(image.select(['classification_' + year]).neq(class_id))                // current
           .and(image.select(['classification_' + String(year + 1)]).neq(class_id))    // next
           .and(image.select(['classification_' + String(year + 2)]).eq(class_id));    // next two
  
  // Rectify value in the current year
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

// -- -- Five years
var rule_5yr = function(class_id, year, image) {
  // Get pixels to be mask when the mid years is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)      // previous
           .and(image.select(['classification_' + year]).neq(class_id))                // current
           .and(image.select(['classification_' + String(year + 1)]).neq(class_id))    // next
           .and(image.select(['classification_' + String(year + 2)]).neq(class_id))    // next two
           .and(image.select(['classification_' + String(year + 3)]).eq(class_id));    // next three
  
  // Rectify value in the current year
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

// -- -- -- -- Set functions to apply rules over the time-series for mid years
// -- -- Three years
var run_3yr = function(image, class_id) {
  // Create container with the first year (without previous year)
  var container = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2022}).getInfo()
      .forEach(function(year_i){
        // Run filter
        container = container.addBands(rule_3yr(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  container = container.addBands(image.select(['classification_2023']));
  
  return container;
};

// -- -- Four years
var run_4yr = function(image, class_id) {
  // Create container with the first year (without previous year)
  var container = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2021}).getInfo()
      .forEach(function(year_i){
        // Run filter
        container = container.addBands(rule_4yr(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  container = container.addBands(image.select(['classification_2022']))
                       .addBands(image.select(['classification_2023']));
  
  return container;
};

// -- -- Five years 
var run_5yr = function(image, class_id) {
  // Create container with the first year (without previous year)
  var container = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2020}).getInfo()
      .forEach(function(year_i){
        // run filter
        container = container.addBands(rule_5yr(class_id, year_i, image));
      }
    );
    
  // Insert last years (without suitable next year to apply filter)
  container = container.addBands(image.select(['classification_2021']))
                       .addBands(image.select(['classification_2022']))
                       .addBands(image.select(['classification_2023']));
  
  return container;
};

// -- -- -- -- Set rules to avoid deforestations from forest to grassland (or other inconsistent classes)
// -- -- Three years
var rule_3yr_deforestation = function(class_id, year, image) {
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id[0])   // previous
           .and(image.select(['classification_' + year]).eq(class_id[1]))              // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id[2])); // next
           
  // When transitions occurs from class_id 0 to 2, passing for the 1, use the value 3
    return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id[3]);
};

// -- -- Four years
var rule_4yr_deforestation = function(class_id, year, image) {
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id[0])   // previous
           .and(image.select(['classification_' + year]).eq(class_id[1]))              // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id[2]))  // next
           .and(image.select(['classification_' + String(year + 2)]).eq(class_id[3])); // next

           
  // When transitions occurs from class_id 0 to 3, passing for the 1 or 2, use the value 4
    return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id[4]);
};

// -- -- -- -- Set functions to apply rules over the time-series for deforestation
// -- -- Three years
var run_3yr_deforestation = function(image, class_id) {
  // Create container with the first year (without previous year)
  var container = image.select(['classification_1985']);
   // Ror each year in the window
  ee.List.sequence({'start': 1986, 'end': 2022}).getInfo()
      .forEach(function(year_i){
        // Run filter
        container = container.addBands(rule_3yr_deforestation(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next yr to apply filter)
  container = container.addBands(image.select(['classification_2023'])); 
  
  return container;
};

// -- -- Four years
var run_4yr_deforestation = function(image, class_id) {
  // Create container with the first year (without previous year)
  var container = image.select(['classification_1985']);
   // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2021}).getInfo()
      .forEach(function(year_i){
        // Run filter
        container = container.addBands(rule_4yr_deforestation(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  container = container.addBands(image.select(['classification_2022']))
                       .addBands(image.select(['classification_2023'])); 
  
  return container;
};

// -- -- -- -- Set functions to apply filter to first and last years
// -- -- First year [1985]
var run_3yr_first = function(class_id, image) {
  // Get pixels to be masked in the first year when next two were different
  var to_mask = image.select(['classification_1985']).neq(class_id)
           .and(image.select(['classification_1986']).eq(class_id))
           .and(image.select(['classification_1987']).eq(class_id));

  // Rectify value in the first year
  var first_yr = image.select(['classification_1985'])
                      .where(to_mask.eq(1), class_id);
  
  // Add bands of next years
  ee.List.sequence({'start': 1986, 'end': 2023}).getInfo()
      .forEach(function(year_i) {
        first_yr = first_yr.addBands(image.select(['classification_' + year_i]));
      });
  
  return first_yr;
};

// -- -- Last year [2023]
var run_3yr_last = function(class_id, image) {
  // Get pixels to be masked in the last year when previous two were different
  var to_mask = image.select(['classification_2023']).neq(class_id)
           .and(image.select(['classification_2022']).eq(class_id))
           .and(image.select(['classification_2021']).eq(class_id));
           
  // Rectify value in the last year
  var last_yr = image.select(['classification_2023'])
                      .where(to_mask.eq(1), class_id);
  
  // Create container with time series from first to last [-1]
  var container = ee.Image([]);
  
  // Insert data into container
  ee.List.sequence({'start': 1985, 'end': 2022}).getInfo()
      .forEach(function(year_i) {
        container = container.addBands(image.select(['classification_' + year_i]));
      });
  
  // Insert filtered last year
  return container.addBands(last_yr);
  
};

// -- -- -- -- End of functions 

// ** ** **

// -- -- -- -- Start of conditionals 

// Create object to be filtered
var to_filter = classification; 

// -- -- -- --  Apply 'deforestation' filters
// -- -- Four years
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 12, 21]);
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 21, 21]);

// -- -- Three years
to_filter = run_3yr_deforestation(to_filter, [3, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 12, 12, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 11, 3]);
to_filter = run_4yr_deforestation(to_filter, [3, 11, 11, 11, 3]);
to_filter = run_3yr_deforestation(to_filter, [4, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [11, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [12, 11, 21, 21]);


// -- -- -- -- Run time window general rules
// -- -- -- -- Filter middle years
var class_ordering = [4, 3, 12, 11, 21, 33, 25];

class_ordering.forEach(function(class_i) {
  
  // -- -- Five years
  to_filter = run_5yr(to_filter, class_i);
  
  // -- -- Four years
  to_filter = run_4yr(to_filter, class_i);
  
  // -- -- Three years
   to_filter = run_3yr(to_filter, class_i);
});

// -- -- Filter first year 
to_filter = run_3yr_first(12, to_filter);
to_filter = run_3yr_first(3, to_filter);
to_filter = run_3yr_first(4, to_filter);
to_filter = run_3yr_first(11, to_filter);

Map.addLayer(to_filter.select(['classification_2020']), vis, 'pre-last-year-filter 2020');

// -- -- Filter last year
var filtered = run_3yr_last(21, to_filter);
print('filtered', filtered);

Map.addLayer(classification.select(['classification_2020']), vis, 'unfiltered 2020');
Map.addLayer(filtered.select(['classification_2020']), vis, 'post-last-year-filter 2020');


// -- -- -- -- Avoid that filter runs over small deforestation (as atlantic rainforest)
// Remap native vegetation 
// Create an empty container for the remmapd collection
var remap_col = ee.Image([]);

// For each year
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
  .forEach(function(year_i) {
    // Get year [i] clasification
    var x = to_filter.select(['classification_' + year_i])
      // Perform remap
      .remap([3, 4, 11, 12, 21],
             [3, 3,  3,  3, 21])
             .rename('classification_' + year_i);
    // Put it on container data
    remap_col = remap_col.addBands(x);
  });

// Get regenrations from 2022 to 2023
var reg_last = remap_col.select(['classification_2023'])
                        .eq(3)
                        .and(remap_col.select(['classification_2022']).eq(21));

// Get regeneration sizes
var reg_size = reg_last.selfMask().connectedPixelCount(20, true).reproject('epsg:4326', null, 30);

// Get pixels with regenerations lower than 1 ha (900m² * 11 pixels) and retain 2022 class
var excludeReg = to_filter.select(['classification_2022'])
                    .updateMask(reg_size.lte(11).eq(1));

// Update 2023 year discarding only small regenerations
var x23 = to_filter.select(['classification_2023']).blend(excludeReg);

// Remove 2023 from time-series and add rectified data
to_filter = to_filter.slice(0,38).addBands(x23.rename('classification_2023'));
print ('to_filter image', to_filter);

Map.addLayer(to_filter.select(['classification_2020']), vis, 'big-reg-filter');
print ('Output classification', to_filter);

// Export as GEE asset
Export.image.toAsset({
    'image': to_filter,
    'description': inputFile + '_temporal_v' + outputVersion,
    'assetId': out +  inputFile + '_temporal_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
