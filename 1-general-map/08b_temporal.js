// -- -- -- -- 08b_temporal
// temporal filter [step B] - cerrado biome 
// felipe.lenti@ipam.org.br

// set root directory 
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/';

var version_in = '14';
var version_out = '14';
// set file to be processed
var file_in = 'CERRADO_col8_gapfill_incidence_temporal_step-a_v'+version_in;

// import mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// import classification 
var inputClassification = ee.Image(root + file_in);

print ("input image", inputClassification);

// define empty classification to receive data
var classification = ee.Image([]);

// remap all anthopogenic classes only to single-one [21]
ee.List.sequence({'step':-1,'start': 2022, 'end': 1985}).getInfo()
    .forEach(function(year_i) {
      // get year [i]
      var classification_i = inputClassification.select(['classification_' + year_i])
        // remap
        .remap([3, 4, 11, 12, 15, 19, 21, 25, 33],
               [3, 4, 11, 12, 21, 21, 21, 25, 33])
               .rename('classification_' + year_i);
               // insert into classification
               classification = classification.addBands(classification_i);
    });
    
print('input', classification);

///////////////////////////// set rules to mask mid years 
// three years 
var rule_3yr = function(class_id, year, image) {
  // get pixels to be mask when the mid year is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)    // previous
           .and(image.select(['classification_' + year]).neq(class_id))              // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id));  // next
           
  // rectify value in the current year 
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

// four years 
var rule_4yr = function(class_id, year, image) {
  // get pixels to be mask when the mid years is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)      // previous
           .and(image.select(['classification_' + year]).neq(class_id))                // current
           .and(image.select(['classification_' + String(year + 1)]).neq(class_id))    // next
           .and(image.select(['classification_' + String(year + 2)]).eq(class_id));    // next two
  
  // rectify value in the current year
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

// five years
var rule_5yr = function(class_id, year, image) {
  // get pixels to be mask when the mid years is different of previous and next
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id)      // previous
           .and(image.select(['classification_' + year]).neq(class_id))                // current
           .and(image.select(['classification_' + String(year + 1)]).neq(class_id))    // next
           .and(image.select(['classification_' + String(year + 2)]).neq(class_id))    // next two
           .and(image.select(['classification_' + String(year + 3)]).eq(class_id));    // next three
  
  // rectify value in the current year
  return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id);
};

////////////////////// set functions to apply rules over the time-series for mid years
// three years
var run_3yr = function(image, class_id) {
  // create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // for each year in the window
  ee.List.sequence({'step':-1,'start': 2021, 'end': 1986}).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_3yr(class_id, year_i, image));
      }
    );
  // insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2022']));
  
  return recipe;
};

// four years
var run_4yr = function(image, class_id) {
  // create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // for each year in the window
  ee.List.sequence({'step':-1,'start': 2020, 'end': 1986}).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_4yr(class_id, year_i, image));
      }
    );
  // insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2021']))
                 .addBands(image.select(['classification_2022']));
  
  return recipe;
};

// five years 
var run_5yr = function(image, class_id) {
  // create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
  // for each year in the window
  ee.List.sequence({'step':-1,'start': 2019, 'end': 1986}).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_5yr(class_id, year_i, image));
      }
    );
  // insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2020']))
                 .addBands(image.select(['classification_2021']))
                 .addBands(image.select(['classification_2022']));
  
  return recipe;
};

////////////////////////////// set rules to avoid deforestations from forest to grassland (or other inconsistent classes)
// three years
var rule_3yr_deforestation = function(class_id, year, image) {
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id[0])   // previous
           .and(image.select(['classification_' + year]).eq(class_id[1]))              // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id[2])); // next
           
  // when transitions occurs from class_id 0 to 2, passing for the 1, use the value 3
    return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id[3]);
};

// four years
var rule_4yr_deforestation = function(class_id, year, image) {
  var to_mask = image.select(['classification_' + String(year - 1)]).eq(class_id[0])   // previous
           .and(image.select(['classification_' + year]).eq(class_id[1]))      // current
           .and(image.select(['classification_' + String(year + 1)]).eq(class_id[2]))  // next
           .and(image.select(['classification_' + String(year + 2)]).eq(class_id[3])); // next

           
  // when transitions occurs from class_id 0 to 3, passing for the 1 or 2, use the value 4
    return image.select(['classification_' + year])
              .where(to_mask.eq(1), class_id[4]);
};

////////////////////// set functions to apply rules over the time-series for deforestation
// three years
var run_3yr_deforestation = function(image, class_id) {
  // create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
   // for each year in the window
  ee.List.sequence({'step':-1,'start': 2021, 'end': 1986 }).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_3yr_deforestation(class_id, year_i, image));
      }
    );
  // insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2022'])); 
  
  return recipe;
};

// four years
var run_4yr_deforestation = function(image, class_id) {
  // create recipe with the first year (without previous year)
  var recipe = image.select(['classification_1985']);
   // for each year in the window
  ee.List.sequence({'step':-1,'start': 2020, 'end': 1986 }).getInfo()
      .forEach(function(year_i){
        // run filter
        recipe = recipe.addBands(rule_4yr_deforestation(class_id, year_i, image));
      }
    );
  // insert last years (without suitable next yr to apply filter)
  recipe = recipe.addBands(image.select(['classification_2021']))
                 .addBands(image.select(['classification_2022'])); 
  
  return recipe;
};


//////////////////////// end of functions 


/////////////////////////////// start of conditionals 

// create object to be filtered
var to_filter = classification; 

////////////////// apply 'deforestation' filters
// 4yr
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 12, 21]);
to_filter = run_4yr_deforestation(to_filter, [3, 12, 12, 21, 21]);
// 3yr
to_filter = run_3yr_deforestation(to_filter, [3, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 12, 12, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [3, 11, 11, 3]);
to_filter = run_4yr_deforestation(to_filter, [3, 11, 11, 11, 3]);
to_filter = run_3yr_deforestation(to_filter, [4, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [11, 12, 21, 21]);
to_filter = run_3yr_deforestation(to_filter, [12, 11, 21, 21]);


////////////// run time window general rules
///////////////// filter middle years
var class_ordering = [4, 3, 12, 11, 21, 33, 25];

class_ordering.forEach(function(class_i) {
  // 5 yr
  to_filter = run_5yr(to_filter, class_i);
   // 4 yr
  to_filter = run_4yr(to_filter, class_i);
  // 3yr
   to_filter = run_3yr(to_filter, class_i);
});


print ("output_image", to_filter);

Export.image.toAsset({
    'image': to_filter,
    'description': 'CERRADO_col8_gapfill_incidence_temporal_step-b_v' + version_out,
    'assetId': root +  'CERRADO_col8_gapfill_incidence_temporal_step-b_v' + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
