// integrate wetlands with collection 6 and remove "restinga" 
// wetlands wrong classified
// write to: dhemerson.costa@ipam.org.br

// define directories
var dir = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var col6 = 'CERRADO_col6_gapfill_incid_temporal_spatial_freq_v9';
var wetlands = 'CERRADO_col6_wetlands_gapfill_incid_temporal_spatial_freq_v56';
var file_out = 'CERRADO_col6_wetlandsv7_generalv9';

// regras para remoção da restinga
// import SRTM 
var srtm30 = ee.Image('USGS/SRTMGL1_003').select('elevation');

// import regions and select only region 1
var regions = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6_raster');
    regions = regions.updateMask(regions.eq(1));
    
// import IBGE's coastlines 
var coastline = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/coastline_ibge2017');

// define rule
var elevation = srtm30.updateMask(regions.eq(1).and(srtm30.lt(100)));

// compute coastline distance image
var distance = coastline.distance({searchRadius: 80000, maxError: 30})
               .updateMask(regions);

// import mapbiomas palette
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 45,
    'palette': palettes.get('classification5')
};

// list years to be integrated
var yearsList = ['1985', '1986', '1987', '1988', '1989',
                 '1990', '1991', '1992', '1993', '1994',
                 '1995', '1996', '1997', '1998', '1999',
                 '2000', '2001', '2002', '2003', '2004',
                 '2005', '2006', '2007', '2008', '2009',
                 '2010', '2011', '2012', '2013', '2014',
                 '2015', '2016', '2017', '2018', '2019',
                 '2020'];

// create empty recipe 
var recipe = ee.Image([]);

// perform integration 
yearsList.forEach(function(process_year) {
  // read collection 6 for the year i
  var col6_i = ee.Image(dir + col6)
              .select('classification_' + process_year);

  // read wetlands for the year i
  var wetlands_i = ee.Image(dir + wetlands).select('classificationWet_' + process_year);
      wetlands_i = wetlands_i.updateMask(wetlands_i.eq(11));
                 

  // integration according rules
  // wetlands upper grassland, savanna, pasture and ONVA
  var integration_i = col6_i.where(wetlands_i.eq(11).and(col6_i.eq(4)
                                                     .or(col6_i.eq(12)
                                                     .or(col6_i.eq(15)
                                                     .or(col6_i.eq(25))))), 11);
                                                   
  
  // extract wetlands wrong classified 
  var extracted = integration_i.updateMask(elevation);
      extracted = extracted.updateMask(distance);
      extracted = extracted.updateMask(extracted.eq(11));
    
  // remap extracted to original classification data
  var original = col6_i.updateMask(extracted);
                                
  // blend corrections to map (remove restinga)
     integration_i = integration_i.blend(original);
  
  // add band
  recipe = recipe.addBands(integration_i);
});

// print result
print (recipe);
Map.addLayer(recipe.select(['classification_2020']), vis, 'preview');
Map.addLayer(ee.Image(dir + col6).select(['classification_2020']), vis, 'geral');
Map.addLayer(ee.Image(dir + wetlands).select(['classificationWet_2020']), vis, 'wetlands');
Map.addLayer(recipe.geometry());

// export data
Export.image.toAsset({
    'image': recipe,
    'description': file_out,
    'assetId': dir + file_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': recipe.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
