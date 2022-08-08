// read all raster values and export each one as a independent raster image
// dhemerson.costa@ipam.org.br

// load raster
var regions = ee.Image('users/dh-conciani/collection7/classification_regions/raster');

// load vector
var region_vec = ee.FeatureCollection('users/dh-conciani/collection7/classification_regions/vector');

// define output imageCollection
var output = 'users/dh-conciani/collection7/classification_regions/eachRegion/';

// list raster values
var values = ee.List.sequence({'start':1, 'end': 38, 'step': 1}).getInfo();

// for each region
values.forEach(function(value_i) {
  // get region 
  var region_i = regions.updateMask(regions.eq(value_i)).set('mapb', String(value_i));
  // get region vector 
  var region_i_vec = region_vec.filterMetadata('mapb', 'equals', value_i);
  // export
    Export.image.toAsset({image: region_i,
                          description: 'reg_' + String(value_i),
                          assetId: output + 'reg_' + String(value_i),
                          region: region_i_vec,
                          scale:30,
                          maxPixels:1e13
                          });
                        }
                      );
