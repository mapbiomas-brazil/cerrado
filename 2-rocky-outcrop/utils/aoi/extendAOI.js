// defining area of interest
// barbara.silva@ipam.org.br

// area of interest used in Collection 7.0
var aoi_vec = ee.FeatureCollection('users/dh-conciani/collection7/rocky/masks/aoi_v1').geometry();

// rocky outcrop samples updated to Collection 8.0
var rocky_samples = ee.FeatureCollection('users/barbarasilvaIPAM/rocky_outcrop/collection8/sample/afloramento_collect_v5').geometry();

var merge = rocky_samples.union(aoi_vec);

var buffer = merge.buffer(20000);
Map.addLayer(buffer, {color: 'Green'}, 'buffer');

var featureCollection = ee.FeatureCollection([buffer]);
Map.addLayer(featureCollection, {color: 'Blue'}, 'featureCollection');

Export.table.toAsset({
  collection: featureCollection,
  assetId: 'projects/ee-barbarasilvaipam/assets/collection8-rocky/masks/aoi_v5'
  });
