// pseudo-integrate preliminar Cerrado collection 6 with cross-cuting themes from colleciton 5
// dhemerson.conciani@ipam.org.br

// load mapbiomas assets
var public_col5 = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1');
var prelim_col6 = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_final_v10');
//var cerrado_col6 = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_gapfill_incid_temporal_spatial_freq_v6');

// define export parameters
var dir = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file = 'CERRADO_col6_final_v8_pseudointegration';

// list of years to be pseudo-integrated
var years_list = ['1985', '1986', '1987', '1988', '1989', '1990',
                  '1991', '1992', '1993', '1994', '1995', '1996',
                  '1997', '1998', '1999', '2000', '2001', '2002',
                  '2003', '2004', '2005', '2006', '2007', '2008',
                  '2009', '2010', '2011', '2012', '2013', '2014',
                  '2015', '2016', '2017', '2018', '2019'];

// load mapbiomas palette module
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 45,
    'palette': palettes.get('classification5')
};

// create empty files to receive data
var recipe = ee.Image([]);  // recipe to concatenate pseudo-integration time-series
var col5_i = ee.Image([]);  // empty object to receive yearly col5 data
var col6_i = ee.Image([]);  // empty object to receive yearly col6 data

// for each year
years_list.forEach(function(process_year) {
   // read data for the year [i]
    col6_i = prelim_col6.select('classification_' + process_year);
    col5_i = public_col5.select('classification_' + process_year)
             .updateMask(col6_i);
    
    // pseudo-integrate cross-cutting themes from collection 5 into collection 6
    col6_i = col6_i.blend(col5_i.updateMask(col5_i.eq(9)))      // forestry
                   .blend(col5_i.updateMask(col5_i.eq(15)))     // pasture
                   .blend(col5_i.updateMask(col5_i.eq(18)))     // agriculture
                   .blend(col5_i.updateMask(col5_i.eq(19)))     // temporary-crop
                   .blend(col5_i.updateMask(col5_i.eq(20)))     // sugar-cane
                   .blend(col5_i.updateMask(col5_i.eq(24)))     // urban-infrastructure
                   .blend(col5_i.updateMask(col5_i.eq(30)))     // mining
                   .blend(col5_i.updateMask(col5_i.eq(31)))     // aquaculture
                   .blend(col5_i.updateMask(col5_i.eq(36)))     // perennial crop
                   .blend(col5_i.updateMask(col5_i.eq(39)))     // soybean
                   .blend(col5_i.updateMask(col5_i.eq(41)));    // other perennial crop
    
    // stack pseudo-integratated data as a new band into recipe 
    recipe = recipe.addBands(col6_i);
});

// plot data
Map.addLayer(col5_i, vis, 'col5 2019');
Map.addLayer(col6_i, vis, 'col6 2019');
//Map.addLayer(cerrado_col6.select(['classification_2019']), vis, 'raw');

// print pseudo-integrated dataset
print (recipe);

// export as asset 
Export.image.toAsset({
    'image': recipe,
    'description': file,
    'assetId': dir + file,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': col6_i.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});

//Map.addLayer(recipe.select(['classification_2019']), vis, 'post int');
//Map.addLayer(prelim_col6.select(['classification_2019']), vis, 'pre int');
//Map.addLayer(image.updateMask(image.eq(14)));
