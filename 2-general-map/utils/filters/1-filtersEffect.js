// code to assess impact of each filter by class in temporal series
// developed by IPAM - dhemerson.costa@ipam.org.br

// import cerrado biome - used to compute reducers
var regions = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');

// define root directory 
var root = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test';

// define file of each filter
var gapfill = ee.Image (root + '/' + 'CERRADO_col6_gapfill_v6');
var incidence = ee.Image (root + '/' + 'CERRADO_col6_gapfill_incid_v6');
var temporal = ee.Image (root + '/' + 'CERRADO_col6_gapfill_incid_temporal_v6');
var spatial = ee.Image (root + '/' + 'CERRADO_col6_gapfill_incid_temporal_spatial_v6');
var frequency = ee.Image (root + '/' + 'CERRADO_col6_gapfill_incid_temporal_spatial_freq_v8');

// define years to be processed
var years = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992',
             '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
             '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
             '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016',
             '2017', '2018', '2019', '2020'];

// define class to be process (please, run with only one)
var classes = [15];

// define empty recipe to receive data
var recipe = ee.FeatureCollection([]);

// for each year [i]
years.forEach(function(process_year) {
  // read t0, that is, gapfill 
  var gapfill_i = gapfill.select(['classification_' + process_year]);
  // read t1, that is, incidence
  var incidence_i = incidence.select(['classification_' + process_year]);
  // read t2, that is, temporal
  var temporal_i = temporal.select(['classification_' + process_year]);
  // read t3, that is, spatial
  var spatial_i = spatial.select(['classification_' + process_year]);
  // read t4, that is, frequency
  var frequency_i = frequency.select(['classification_' + process_year]);
  
  // for each class [j]
  classes.forEach(function(process_class) {
    // mask only to class j
    var t0_j = gapfill_i.updateMask(gapfill_i.eq(process_class));
    var t1_j = incidence_i.updateMask(t0_j);
    var t2_j = temporal_i.updateMask(t0_j);
    var t3_j = spatial_i.updateMask(t0_j);
    var t4_j = frequency_i.updateMask(t0_j);
    
    // define parallel function to compute counts
    // gapfill to incidence
    var t0_to_t1 = function(feature) {
      // compute frequency for the reference class 
      var count_t0 = t0_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // compute frequency for the t1
      var count_t1 = t1_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // store frequencies into a dictionary
      var value_t0 = ee.Dictionary(ee.Number(count_t0.get('classification_' + process_year)));
      var value_t1 = ee.Dictionary(ee.Number(count_t1.get('classification_' + process_year)));
      // return values as metadata
        return feature.set('ref', process_class).set('ref_count', value_t0.get(ee.String(ee.Number(process_class)))).set(value_t1).set('year', process_year).set('label', 'INCIDENCE');
      };
      
    // gapfill to temporal
    var t0_to_t2 = function(feature) {
      // compute frequency for the reference class 
      var count_t0 = t0_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // compute frequency for the t1
      var count_t2 = t2_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // store frequencies into a dictionary
      var value_t0 = ee.Dictionary(ee.Number(count_t0.get('classification_' + process_year)));
      var value_t2 = ee.Dictionary(ee.Number(count_t2.get('classification_' + process_year)));
      // return values as metadata
        return feature.set('ref', process_class).set('ref_count', value_t0.get(ee.String(ee.Number(process_class)))).set(value_t2).set('year', process_year).set('label', 'TEMPORAL');
      };
      
    // gapfill to spatial
    var t0_to_t3 = function(feature) {
      // compute frequency for the reference class 
      var count_t0 = t0_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // compute frequency for the t1
      var count_t3 = t3_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // store frequencies into a dictionary
      var value_t0 = ee.Dictionary(ee.Number(count_t0.get('classification_' + process_year)));
      var value_t3 = ee.Dictionary(ee.Number(count_t3.get('classification_' + process_year)));
      // return values as metadata
        return feature.set('ref', process_class).set('ref_count', value_t0.get(ee.String(ee.Number(process_class)))).set(value_t3).set('year', process_year).set('label', 'SPATIAL');
      };
      
    // gapfill to frequency
    var t0_to_t4 = function(feature) {
      // compute frequency for the reference class 
      var count_t0 = t0_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // compute frequency for the t1
      var count_t4 = t4_j.reduceRegion({reducer: ee.Reducer.frequencyHistogram(), geometry : feature.geometry(), scale:30, maxPixels: 1e13});
      // store frequencies into a dictionary
      var value_t0 = ee.Dictionary(ee.Number(count_t0.get('classification_' + process_year)));
      var value_t4 = ee.Dictionary(ee.Number(count_t4.get('classification_' + process_year)));
      // return values as metadata
        return feature.set('ref', process_class).set('ref_count', value_t0.get(ee.String(ee.Number(process_class)))).set(value_t4).set('year', process_year).set('label', 'FREQUENCY');
      };
    
    // apply functios by region
    var t0_to_t1_j = regions.map(t0_to_t1);
    var t0_to_t2_j = regions.map(t0_to_t2);
    var t0_to_t3_j = regions.map(t0_to_t3);
    var t0_to_t4_j = regions.map(t0_to_t4);
    
    // merge all regions into a single recipe
    var recipe_j = t0_to_t1_j.merge(t0_to_t2_j).merge(t0_to_t3_j).merge(t0_to_t4_j);
    // and put into general recipe
        recipe = recipe.merge(recipe_j);
    });
  });

// create labels based in class ID
if (classes == 3) {
  var export_label = 'forest';
} if (classes == 4) {
    var export_label = 'savanna';
  } if (classes == 12) {
      var export_label = 'grassland';
    } if (classes == 15) {
      var export_label = 'pasture';
      }

// export result as table 
Export.table.toDrive({
  collection: recipe,
  description: export_label + '_filtersEffect',
  folder: 'TEMP',
  fileFormat: 'CSV'
});
