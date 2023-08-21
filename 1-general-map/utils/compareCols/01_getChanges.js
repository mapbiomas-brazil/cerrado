// script para comparar coleções

// biomas
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// coleção 7.1
var col_71 = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
  .updateMask(biomes.eq(4));

// coleção 8
var col_8 = ee.ImageCollection('projects/mapbiomas-workspace/COLECAO8/integracao')
  .filter(ee.Filter.eq('version','0-16'))
  .mosaic()
  .updateMask(biomes.eq(4));

// print collections
//print(col_71, col_8);

// set classes
var original_classes = [3, 4, 5, 49, 11, 12, 32, 29, 50, 13, 15, 19, 39, 20, 40, 62, 41, 36, 46, 47, 48, 9, 21, 22, 23, 24, 30, 25, 33, 31, 27];
var remap_classes =    [3, 4, 3,  3, 11, 12, 12, 29, 12, 13, 15, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 9, 21, 22, 22, 22, 22, 22, 33, 33, 27];
var toAnalyze = [3, 4, 11, 12, 29, 15, 18, 9, 21, 22, 33];

// set years
var years = ee.List.sequence({'start': 2021, 'end': 2021, 'step': 1}).getInfo();

// remap collection[s]
var recipe_71 = ee.Image([]);
var recipe_8 = ee.Image([]);

// change the scale if you need.
var scale = 30;

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-COMPARE';
                
// Image area in hectares
var pixelArea = ee.Image.pixelArea().divide(10000);

// Load the base ecoregions for Cerrado
var ecoregions = ee.FeatureCollection('users/geomapeamentoipam/AUXILIAR/territorios/ecoregions_cerrado');
var ecoregions_img = ee.Image().paint(ecoregions, 'region');

// Multiply ecoregions by 100 to create a territory layer
var territory = ecoregions_img.multiply(100);
Map.addLayer(territory.randomVisualizer());

  
// create recipe to bind data
var recipe_table = ee.FeatureCollection([]);

years.forEach(function(year_i) {
  // read image [i] - collection 7.1
  var classification_i = col_71.select('classification_' + year_i)
    .remap(original_classes, remap_classes)
    .rename('classification_' + year_i);
    
  // read image [j] - collection 8.0
  var classification_j = col_8.select('classification_' + year_i)
    .remap(original_classes, remap_classes)
    .rename('classification_' + year_i);
    
  // store both
  recipe_71 = recipe_71.addBands(classification_i);
  recipe_8 = recipe_8.addBands(classification_j);
});

// import the color ramp module from mapbiomas 
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// inspect
//print(recipe_71, recipe_8)
Map.addLayer(recipe_71.select('classification_2021'), vis, 'Col 7.1');
Map.addLayer(recipe_8.select('classification_2021'), vis, 'Col 8');

// for each year
years.forEach(function(year_i) {
  // get collections for year i
  var col_71_i = recipe_71.select('classification_' + year_i);
  var col_8_i = recipe_8.select('classification_' + year_i);
  
  //Map.addLayer(col_71_i, vis, 'col71i '+ year_i, false);
  //Map.addLayer(col_8_i, vis, 'col8i '+ year_i, false);
  
  // for each from class (previous collection)
  toAnalyze.forEach(function(class_j) {
    
    // get class j in from
    var col_71_ij = col_71_i.updateMask(col_71_i.eq(class_j));
    // and use to get classification in the new collection 
    var col_8_ij = col_8_i.updateMask(col_71_ij);
    
    //Map.addLayer(col_71_ij, vis, 'col71 ' + year_i + ', ' + class_j, false);
    //Map.addLayer(col_8_ij, vis, 'col8 ' + year_i + ', ' + class_j, false);
    
    // Geometry to export
      var geometry = col_8_ij.geometry();
      
      // convert a complex object to a simple feature collection 
        var convert2table = function (obj) {
          obj = ee.Dictionary(obj);
            var territory = obj.get('territory');
            var classesAndAreas = ee.List(obj.get('groups'));
            
            var tableRows = classesAndAreas.map(
                function (classAndArea) {
                    classAndArea = ee.Dictionary(classAndArea);
                    var classId = classAndArea.get('class');
                    var area = classAndArea.get('sum');
                    var tableColumns = ee.Feature(null)
                        .set('ecoregion', territory)
                        .set('year', year_i)
                        .set('from', class_j)
                        .set('to', classId)
                        .set('area', area)
                    return tableColumns;
                }
            );
        
            return ee.FeatureCollection(ee.List(tableRows));
        };
        
      // compute the area
      var calculateArea = function (image, territory, geometry) {
          var territotiesData = pixelArea.addBands(territory).addBands(image)
                .reduceRegion({
                    reducer: ee.Reducer.sum().group(1, 'class').group(1, 'territory'),
                    geometry: geometry,
                    scale: scale,
                    maxPixels: 1e13
                });
                
            territotiesData = ee.List(territotiesData.get('groups'));
            var areas = territotiesData.map(convert2table);
            areas = ee.FeatureCollection(areas).flatten();
            return areas;
        };
        
      // perform per year 
      var areas = years.map(
            function (band_i) {
                var image = col_8_ij.select('classification_' + band_i);
                var areas = calculateArea(image, territory, geometry);
                // set additional properties
                areas = areas.map(
                    function (feature) {
                        return feature.set('year', band_i);
                    }
                );
                return areas;
            }
        );
        
        // apply function
        areas = ee.FeatureCollection(areas).flatten();
        // store
        recipe_table = recipe_table.merge(areas);
  });

});

// store
Export.table.toDrive({
      collection: recipe_table,
      description: 'compareCollections_71_8',
      folder: driverFolder,
      fileFormat: 'CSV'
});
