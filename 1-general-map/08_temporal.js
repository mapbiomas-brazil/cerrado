// -- -- -- -- 08_temporal
// temporal filter - cerrado biome 
// barbara.silva@ipam.org.br

// Set root directory
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '4';
var outputVersion = '1';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v4_incidence_v'+inputVersion;

// import mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Load input classification
var inputClassification = ee.Image(root + inputFile);
print('Input classification', inputClassification);

// Define empty classification to receive data
var classification = ee.Image([]);

// Remap all anthopogenic classes only to single-one [21]
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
    .forEach(function(year_i) {
      
      // Get year [i]
      var classification_i = inputClassification.select(['classification_' + year_i])
        // Remap classes
        .remap([3, 4, 11, 12, 15, 18, 25, 33],
               [3, 4, 11, 12, 15, 18, 25, 33])
               .rename('classification_' + year_i);
               
               // Insert into aggregated classification
               classification = classification.addBands(classification_i);
    });

// -- -- -- -- -- -- -- -- -- -- -- -- Set rules to mask mid years 
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

// -- -- -- -- -- -- -- -- -- -- -- -- Set functions to apply rules over the time-series for mid years
// -- -- Three years
var run_3yr = function(image, class_id) {
  // Create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2022}).getInfo()
      .forEach(function(year_i){
        // Run filter
        recipe = recipe.addBands(rule_3yr(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  recipe = recipe.addBands(image.select(['classification_2023']));
  
  return recipe;
};

// -- -- Four years
var run_4yr = function(image, class_id) {
  // Create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2021}).getInfo()
      .forEach(function(year_i){
        // Run filter
        recipe = recipe.addBands(rule_4yr(class_id, year_i, image));
      }
    );
  // iInsert last years (without suitable next year to apply filter)
  recipe = recipe.addBands(image.select(['classification_2022']))
                 .addBands(image.select(['classification_2023']));
  
  return recipe;
};

// -- -- Five years 
var run_5yr = function(image, class_id) {
  // Create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2020}).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_5yr(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  recipe = recipe.addBands(image.select(['classification_2021']))
                 .addBands(image.select(['classification_2022']))
                 .addBands(image.select(['classification_2023']));
  
  return recipe;
};

// -- -- -- -- -- -- -- -- -- -- -- -- Set rules to avoid deforestations from forest to grassland (or other inconsistent classes)
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

// -- -- -- -- -- -- -- -- -- -- -- -- Set functions to apply rules over the time-series for deforestation
// -- -- Three years
var run_3yr_deforestation = function(image, class_id) {
  // Create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
   // Ror each year in the window
  ee.List.sequence({'start': 1986, 'end': 2022}).getInfo()
      .forEach(function(year_i){
        // Run filter
        recipe = recipe.addBands(rule_3yr_deforestation(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2023'])); 
  
  return recipe;
};

// -- -- Four years
var run_4yr_deforestation = function(image, class_id) {
  // Create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
   // For each year in the window
  ee.List.sequence({'start': 1986, 'end': 2021}).getInfo()
      .forEach(function(year_i){
        // Run filter
        recipe = recipe.addBands(rule_4yr_deforestation(class_id, year_i, image));
      }
    );
  // Insert last years (without suitable next year to apply filter)
  recipe = recipe.addBands(image.select(['classification_2022']))
                 .addBands(image.select(['classification_2023'])); 
  
  return recipe;
};

// -- -- -- -- -- -- -- -- -- -- -- -- Set functions to apply filter to first and last years
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
  
  // Create recipe with time series from first to last [-1]
  var recipe = ee.Image([]);
  
  // Insert data into recipe
  ee.List.sequence({'start': 1985, 'end': 2022}).getInfo()
      .forEach(function(year_i) {
        recipe = recipe.addBands(image.select(['classification_' + year_i]));
      });
  
  // Insert filtered last year
  return recipe.addBands(last_yr);
  
};

// -- -- -- -- -- -- -- -- -- -- -- -- End of functions 

// ** ** **

// -- -- -- -- -- -- -- -- -- -- -- -- Start of conditionals 

// Create object to be filtered
var to_filter = classification; 

// -- -- -- -- -- -- -- -- -- -- -- --  Apply 'deforestation' filters
// -- -- Four years
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 12, 15]);
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 15, 15]);

// -- -- Three years
to_filter = run_3yr_deforestation(to_filter, [3, 12, 15, 15]);
to_filter = run_3yr_deforestation(to_filter, [3, 12, 12, 15]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 15, 15]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 11, 3]);
to_filter = run_4yr_deforestation(to_filter, [3, 11, 11, 11, 3]);
to_filter = run_3yr_deforestation(to_filter, [4, 12, 15, 15]);
to_filter = run_3yr_deforestation(to_filter, [11, 12, 15, 15]);
to_filter = run_3yr_deforestation(to_filter, [12, 11, 15, 15]);


// -- -- -- -- -- -- -- -- -- -- -- -- Run time window general rules
// -- -- -- -- -- -- -- -- -- -- -- -- Filter middle years
var class_ordering = [4, 3, 12, 11, 15, 33, 25];

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

Map.addLayer(to_filter.select(['classification_2023']), vis, 'pre-last-year-filter 2023');

// -- -- Filter last year
var filtered = run_3yr_last(15, to_filter);
print('filtered', filtered);

Map.addLayer(classification.select(['classification_2023']), vis, 'unfiltered 2023');
Map.addLayer(filtered.select(['classification_2023']), vis, 'post-last-year-filter 2023');


// -- -- -- -- -- -- -- -- -- -- -- -- Avoid that filter runs over small deforestation (as atlantic rainforest)
// Remap native vegetation 
// Create an empty recipe for the remmapd collection
var remap_col = ee.Image([]);

// For each year
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
  .forEach(function(year_i) {
    // Get year [i] clasification
    var x = to_filter.select(['classification_' + year_i])
      // Perform remap
      .remap([3, 4, 11, 12, 15],
             [3, 3,  3,  3, 15])
             .rename('classification_' + year_i);
    // Put it on container data
    remap_col = remap_col.addBands(x);
  });

// Get regenrations from 2022 to 2023
var reg_last = remap_col.select(['classification_2023'])
                        .eq(3)
                        .and(remap_col.select(['classification_2023']).eq(15));

// Get regeneration sizes
var reg_size = reg_last.selfMask().connectedPixelCount(20,true).reproject('epsg:4326', null, 30);

// Get pixels with regenerations lower than 1 ha (900 * 11) and retain 2022 class
var excludeReg = to_filter.select(['classification_2022'])
                    .updateMask(reg_size.lte(10).eq(1));

// Update 2023 year discarding only small regenerations
var x21 = to_filter.select(['classification_2023']).blend(excludeReg);

// Remove 2023 from time-series and add rectified data
to_filter = to_filter.slice(0,38).addBands(x21.rename('classification_2023'));

Map.addLayer(to_filter.select(['classification_2023']), vis, 'big-reg-filter');
print ('Output classification', to_filter);

Export.image.toAsset({
    'image': to_filter,
    'description': 'CERRADO_col9_gapfill_v4_incidence_v'+inputVersion+'_temporal_v' + outputVersion,
    'assetId': out +  'CERRADO_col9_gapfill_v4_incidence_v'+inputVersion+'_temporal_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
