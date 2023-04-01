// get area by territory 
// dhemerson.costa@ipam.org.br

// an adaptation from:
// calculate area of @author João Siqueira

// define root imageCollection
var root = 'users/dh-conciani/basemaps/';

// define files to process 
var asset = [
   root + 'agreement_cerrado_col71',
   root + 'agreement_cerrado_col71_forest',
   root + 'agreement_cerrado_col71_non_forest'
  ];

// define classification regions 
var biomas = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
var cerrado = biomas.updateMask(biomas.eq(4));

var territory = cerrado.rename('territory');

// plot regions
Map.addLayer(territory.randomVisualizer());


// change the scale if you need.
var scale = 30;

// define the years to bem computed 
var years = ['constant'];

// define a Google Drive output folder 
var driverFolder = 'AREA-EXPORT-AGREE';

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
          var image = asset_i.select(year);
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
