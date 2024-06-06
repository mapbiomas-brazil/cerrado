// -- -- -- -- 01_trainingMask
// generate training mask based in stable pixels from mapbiomas collection 8.0
// barbara.silva@ipam.org.br

// Output version
var version = '3';

// Set directory for the output file
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/';

// Read area of interest
var aoi_vec = ee.FeatureCollection("projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/aoi_v3");
var aoi_img = ee.Image(1).clip(aoi_vec);
Map.addLayer(aoi_vec, {palette:['red']}, 'Area of Interest');

// Random color schema  
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 1,
    'max': 29,
    'palette': ["32a65e","FFFFB2", "ffaa5f"]
};

// Load mapbiomas collection 8.0
var collection = ee.Image('projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1').updateMask(aoi_img);

// Set function to reclassify collection by native vegetation (1), non‑vegetation (2) and rocky outcrop (29)
var reclassify = function(image) {
  return image.remap({
    'from': [3, 4, 5, 6, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 46, 47, 35, 48, 9, 21, 23, 24, 30, 25, 33, 31, 27],
    'to':   [1, 1, 1, 1,  1,  1,  1,  1, 29,  1,  1,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  2, 2,  2,  2,  2,  2,  2,  2,  2,  2]
    }
  );
};

// Set function to compute the number of classes over a given time-series 
var numberOfClasses = function(image) {
    return image.reduce(ee.Reducer.countDistinctNonNull()).rename('number_of_classes');
};

// Set years to be processed 
var years = [ 1985, 1986, 1987, 1988, 1989, 1990, 
              1991, 1992, 1993, 1994, 1995, 1996, 
              1997, 1998, 1999, 2000, 2001, 2002, 
              2003, 2004, 2005, 2006, 2007, 2008, 
              2009, 2010, 2011, 2012, 2013, 2014,
              2015, 2016, 2017, 2018, 2019, 2020, 
              2021, 2022];

// Remap collection to  native vegetation and non‑vegetation classes 
var recipe = ee.Image([]);      // build an empty container

// For each year
years.forEach(function(i) {
  
  // Select classification for the year i
  var yi = reclassify(collection.select('classification_' + i)).rename('classification_' + i);
  
  // Store into a container
  recipe = recipe.addBands(yi);
});

// Get the number of classes 
var nClass = numberOfClasses(recipe);

// Now, get only the stable pixels (nClass equals to one)
var stable = recipe.select(0).updateMask(nClass.eq(1));

// Plot stable pixels
Map.addLayer(stable, vis, 'MB stable pixels');
print ('MB stable pixels', stable);

// Export as GEE asset
Export.image.toAsset({
    "image": stable,
    "description": 'cerrado_rockyTrainingMask_1985_2022_v' + version,
    "assetId": dirout + 'cerrado_rockyTrainingMask_1985_2022_v'+ version,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": aoi_vec.geometry()
});
