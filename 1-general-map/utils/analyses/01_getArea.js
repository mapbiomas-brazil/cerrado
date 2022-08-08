// get area by territory 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// define root imageCollection
var root = 'users/dh-conciani/collection7/c7-general-post/';

// define files to process 
var asset = [
  //root + 'CERRADO_col7_gapfill_v1',
  //root + 'CERRADO_col7_gapfill_incidence_v1'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v1'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v2',
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v3',
  //root + 'CERRADO_col7_gapfill_incidence_temporal_spatial_v2',
  //root + 'CERRADO_col7_gapfill_incidence_temporal_spatial_v3'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_v3'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_v4'
  // root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_v5'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_integration_v5'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_perturbance_v5'
  //root + 'CERRADO_col7_gapfill_v2',
  //root + 'CERRADO_col7_gapfill_incidence_v6',
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v6'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_v6'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v7'
  //root + 'CERRADO_col7_gapfill_incidence_v8'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_v8'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_v8'
  //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_v8'
   //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_spatial_v8'
   //root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_spatial_v9'
   root + 'CERRADO_col7_pseudo_v9',
   root + 'CERRADO_col7_pseudoRocky_v9'
  ];

// define classification regions 
var territory = ee.Image('users/dh-conciani/collection7/classification_regions/raster')
        .rename('territory');

// plot regions
Map.addLayer(territory.randomVisualizer());


// change the scale if you need.
var scale = 30;

// define the years to bem computed 
var years = ee.List.sequence({'start': 1985, 'end': 2021, 'step': 1}).getInfo();

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT';

// for each file 
asset.map(function(file) {
  // get the classification for the file[i] 
  var asset_i = ee.Image(file).selfMask();
  // set only the basename
  var basename = file.slice(ee.String(root).length().getInfo());
  
  // Image area in km2
  var pixelArea = ee.Image.pixelArea().divide(10000);
  
  // Geometry to export
  var geometry = asset_i.geometry();
  
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
                  .set('territory', territory)
                  .set('class_id', classId)
                  .set('area', area)
                  .set('file', basename);
                  
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
          var areas = calculateArea(image, territory, geometry);
          // set additional properties
          areas = areas.map(
              function (feature) {
                  return feature.set('year', year);
              }
          );
          return areas;
      }
  );
  
  areas = ee.FeatureCollection(areas).flatten();
  
  Export.table.toDrive({
      collection: areas,
      description: basename,
      folder: driverFolder,
      fileFormat: 'CSV'
  });
});
