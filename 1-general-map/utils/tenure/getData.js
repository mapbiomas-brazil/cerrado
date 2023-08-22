// get land cover and land use (mapbiomas collection 7) per land tenure and state
// for the cerrado biome 
// dhemerson.costa@ipam.org.br

// read land-tenure
var tenure = ee.Image('users/mapbiomascerrado1/fundiario_ipam/fundiario');

// get no information (0) and change value to 400 (to avoid miss-masking)
var no_info = tenure.updateMask(tenure.eq(0)).remap([0], [400]);

// blend adjust over tenure
var territory = tenure.blend(no_info)
                  // rename band to 'tenure'
                  .rename('tenure');

// read mapbiomas collection 7
var mapbiomas = ee.ImageCollection('projects/mapbiomas-workspace/COLECAO8/integracao')
      .filter(ee.Filter.eq('version','0-16'))
      .mosaic()
      .select('classification_2022')
      //.updateMask(territory)
      .aside(print);

// read states
var states = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster')
      // clip by reference
      .updateMask(territory);
      
Map.addLayer(territory.randomVisualizer(), {}, 'tenure');
Map.addLayer(states.randomVisualizer(), {}, 'states');

// define states to be computed (pixel-values)
var states_list = [21, 22, 17, 29 ,51, 15, 52, 53, 31, 50, 35, 41, 11];

// define the years to compute area
var years = ee.List.sequence({'start': 1985, 'end': 2022, 'step': 1}).getInfo();

// define area unit (hectares)
var pixelArea = ee.Image.pixelArea().divide(10000);

// for each state
states_list.forEach(function(state_i) {
  
// get mapbiomas classification only for the state_i
var asset_i = mapbiomas.updateMask(states.eq(state_i));

// get tenure only for the state_i
var territory_i = territory.updateMask(asset_i.select(0));

// convert a complex object to a simple feature collection 
var convert2table = function (obj) {
    obj = ee.Dictionary(obj);
      var territory = obj.get('tenure');
      var classesAndAreas = ee.List(obj.get('groups'));
      
      var tableRows = classesAndAreas.map(
          function (classAndArea) {
              classAndArea = ee.Dictionary(classAndArea);
              var classId = classAndArea.get('class');
              var area = classAndArea.get('sum');
              var tableColumns = ee.Feature(null)
                  .set('tenure', territory)
                  .set('class_id', classId)
                  .set('area', area)
                  .set('state', state_i);
                  
              return tableColumns;
          }
      );
  
      return ee.FeatureCollection(ee.List(tableRows));
  };
  
// compute the area
var calculateArea = function (image, territory, geometry) {
    var territotiesData = pixelArea.addBands(territory).addBands(image)
        .reduceRegion({
            reducer: ee.Reducer.sum().group(1, 'class').group(1, 'tenure'),
            geometry: geometry,
            scale: 30,
            maxPixels: 1e12
        });
        
    territotiesData = ee.List(territotiesData.get('groups'));
    var areas = territotiesData.map(convert2table);
    areas = ee.FeatureCollection(areas).flatten();
    return areas;
  };

// perform per year 
var areas = years.map(
    function (year) {
        var image = asset_i.select('classification_' + year);
        var areas = calculateArea(image, territory_i, territory_i.geometry());
        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('year', year);
            }
        );
        return areas;
    }
);

// flatten
areas = ee.FeatureCollection(areas).flatten();

// export table
Export.table.toDrive({
      collection: areas,
      description: state_i + '_class_per_tenure_v2',
      folder: 'AREA-EXPORT',
      fileFormat: 'CSV'
  });

});


// import mapbiomas palette
var mapb_pal = {'min': 0,
                'max': 49,
                'palette': require('users/mapbiomas/modules:Palettes.js')
                .get('classification6')
              };
              
Map.addLayer(mapbiomas.select(['classification_2022']), mapb_pal, 'mapbiomas');
