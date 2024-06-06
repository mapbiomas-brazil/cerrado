// -- -- -- -- 00_aoiArea
// define the area to map the rocky outcrop class
// barbara.silva@ipam.org.br

// Define string to use as version
var version = '3';
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/';

// Rocky outcrop samples updated to Collection 9.0
var rocky_samples = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/rocky-outcrop-collected_v2').geometry();
Map.addLayer(rocky_samples, {color: 'black'}, 'rocky_samples');

// Define a buffer 50,000 m
var buffer = rocky_samples.buffer(50000);
Map.addLayer(buffer, {color: 'Green'}, 'buffer');

// Create a feature collection
var featureCollection = ee.FeatureCollection([buffer]);
print ('AOI', featureCollection);

Map.addLayer(featureCollection, {color: 'Blue'}, 'AOI area');

// Export as GEE asset
Export.table.toAsset({
  collection: featureCollection,
  description: 'aoi_v'+version,
  assetId: dirout+'aoi_v'+version
  });
