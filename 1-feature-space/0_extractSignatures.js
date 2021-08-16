// extract spectral signatures from Landsat SR mosaics by using LAPIG reference points
// Dhemerson E. Conciani - IPAM (dhemerson.costa@ipam.org.br)

// define inpuit parameters
var biomeName = 'CERRADO';  // biome
var year = 2019;            // year to extract signatures

// define assets 
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics';
var assetBiomes = 'projects/mapbiomas-workspace/AUXILIAR/biomas-raster-41';

// import data
// biomes
var biomes = ee.Image(assetBiomes);
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
              .filterMetadata("Bioma", "equals", "Cerrado");

// Landsat SR mosaics
var collectionMosaics = ee.ImageCollection(assetMosaics);

// filter mosaics to Cerrado biome 
var biomeCollection = collectionMosaics
    .filterMetadata('biome', 'equals', biomeName);

// filter mosaics to the year
biomeCollection = biomeCollection
    .filterMetadata('year', 'equals', year);
    
// import validation points to Cerrado
var points = ee.FeatureCollection('projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8')
            .filterBounds(cerrado);

// reduce mosaic to a single image
var medianImage = biomeCollection.median();

// plot image
Map.addLayer(medianImage,
    {
        bands: ['swir1_median', 'nir_median', 'red_median'],
        gain: [0.08, 0.06, 0.2],
        gamma: 0.85
    },
    biomeName + ' ' + String(year)
);

// extract spectral values
var featureCollectionMedian = medianImage
  .reduceRegions({
    collection:points,
    reducer:ee.Reducer.median(),
    scale:30,
    tileScale:2
    });

// export csv
 Export.table.toDrive({
   collection:featureCollectionMedian,
   description:'extract_points' + '_' + year,
   folder: 'TEMP',
   fileFormat: 'CSV',
});
