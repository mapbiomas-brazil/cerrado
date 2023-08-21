// get deforestation reference data from mapbiomas alertas and sad cerrado
// dhemerson.costa@ipam.org.br

var geometry = 
    ee.Geometry.Polygon(
        [[[-66.83608510740797, 1.4526246939509826],
          [-66.83608510740797, -31.38895083817552],
          [-36.77749135740797, -31.38895083817552],
          [-36.77749135740797, 1.4526246939509826]]], null, false);


// sad
// 2022-2023
var sad = ee.FeatureCollection('projects/ee-sad-cerrado/assets/PUBLIC/SAD_CERRADO_ALERTAS')
  // bind 2021 data
  .merge(ee.FeatureCollection('projects/ee-sad-cerrado/assets/WARNINGS/SAD_CERRADO_ALERTAS_2021'))
  // extract year from 'change_dt' and retain only last two digits (e. g. 2022 -> 22) 
  //.map(function(feature) {
  //  var year = ee.String(feature.get('change_dt')).slice(0, 4);
  //  var lastTwoDigits = year.slice(2);
  //  return feature.set('year', ee.Number(lastTwoDigits));
  //})
  // remove 2023 data
  .filterMetadata('detect_mon', 'less_than', 2301);


// alertas
var alertas = ee.FeatureCollection('projects/ee-robertarocha/assets/MapBiomasAlerta_total')
  // get only deeforestation year (last two digits)
  .map(function(feature) {
    return feature.set('year', ee.Number(ee.String(ee.Number.parse(
      feature.get('AnoDetec')).int()).slice(2)));
  });

// build images
var sad_image = ee.Image(1).clip(sad);
var alertas_image = ee.Image(1).clip(alertas);

Map.addLayer(sad_image, {palette: ['orange'], min:0, max:1}, 'SAD');
Map.addLayer(alertas_image, {palette: ['yellow'], min:0, max: 1}, 'ALERTA');

var dirout = 'projects/ee-ipam-cerrado/assets/Collection_8/masks/';

// export
Export.image.toAsset({
		image: sad_image,
    description: 'sad-image-21_22',
    assetId: dirout+'sad-image-21_22',
    assetId: 'export/sad-image-21_22',
    region: geometry,
    scale: 30,
    maxPixels: 1e13,
});

// export
Export.image.toAsset({
		image: alertas_image,
    description: 'alerta-image-16-22',
    assetId: dirout+'alerta-image-16-22',
    assetId: 'export/alerta-image-16-22',
    region: geometry,
    scale: 30,
    maxPixels: 1e13,
});

// get samples
var samples = ee.FeatureCollection('users/barbarasilvaIPAM/collection8/sample/points/samplePoints_v1');

// apply pallete
// set mapbiomas pallete
var palettes = require('users/mapbiomas/modules:Palettes.js');
var paletteMapBiomas = palettes.get('classification6');

// make samples colored 
samples = samples.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(paletteMapBiomas)
                .get(feature.get('reference')),
            'width': 1,
        });
    }
).style(
    {
        'styleProperty': 'style'
    }
);

Map.addLayer(samples, {}, 'MapBiomas Samples')
