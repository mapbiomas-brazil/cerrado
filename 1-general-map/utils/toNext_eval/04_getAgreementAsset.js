// comparação entre produtos do cerrado - ano referencia 2013
// dhemerson.costa@ipam.org.br

// carregar raster do cerrado
var biomas = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
var cerrado = biomas.updateMask(biomas.eq(4));

// create bounds
var cerrado_bounds = ee.Geometry.Polygon(
                      [[[-61.19728727185188, -1.642455519663336],
                        [-61.19728727185188, -25.854482319615563],
                        [-40.19142789685188, -25.854482319615563],
                        [-40.19142789685188, -1.642455519663336]]], null, false);

// carregar Mapbiomas
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection7_1/mapbiomas_collection71_integration_v1')
                    .select(['classification_2013'])
                    .updateMask(cerrado);


// modulo de cores mapbiomas
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

Map.addLayer(mapbiomas, vis, 'mapbiomas');

// carregar Terrea Class
var terra_class = ee.Image('users/dhconciani/base/TerraClass_Cerrado_2013');

// carregar FBDS
var fbds = ee.Image('users/dhconciani/base/FBDS_Cerrado_2013');

// carregar FIP
var fip = ee.ImageCollection('users/dh-conciani/basemaps/fip-inpe-2004')
                  .map(function(image)  {
                    return image.updateMask(image.neq(0));
                    }
                  )
                  .mosaic();
                  
// carregar PRODES
var prodes = ee.Image('users/dh-conciani/basemaps/prodes_cerrado_00-21');


// descontar desmatamentos até 2013 do FIP usando o prodes
fip = fip.updateMask(prodes.neq(4))
         .updateMask(prodes.neq(6))
         .updateMask(prodes.neq(8))
         .updateMask(prodes.neq(10))
         .updateMask(prodes.neq(12))
         .updateMask(prodes.neq(13));
         
// reclassificar mapas (0 anthropogenic, 1 native)
// Mapbiomas
mapbiomas = mapbiomas.remap([3, 4,  5, 11, 12, 32, 29, 15, 19, 39, 20, 40, 41, 36, 46, 47, 48, 9, 21, 23, 24, 30, 25, 33, 31],
                            [3, 10, 3, 10, 10,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0,  0,  0,  0,  0,  0,  0,  0]);

// Terra Class
terra_class = ee.Image(127).blend(
          terra_class.remap([1, 2, 3, 4, 5,  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 26, 99],
                            [0, 0, 0, 0, 10, 3, 0, 0, 0,  0,  0, 10,  0,  0,  0,  0, 127]))
                     .updateMask(cerrado);

// FBDS
fbds = ee.Image(127).blend(
          fbds.remap([0,   1, 2, 3, 4,  5, 6, 7],
                     [127, 0, 0, 0, 3, 10, 0, 0]))
                     .updateMask(cerrado);

// FIPre
fip = ee.Image(127).blend(
                fip.remap([1, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 25, 29, 31, 32, 34, 37, 38, 39, 40, 41, 42, 43, 44],
                          [3, 3,  3, 10, 10,  0, 10, 10, 10, 10, 10, 10, 10,  0,  0,  0,  0,  0,  0,  0, 10, 10, 10, 10,  0]))
                          .updateMask(cerrado);

// plotar mapas
Map.addLayer(mapbiomas, vis, 'mapbiomas', false);
Map.addLayer(terra_class, vis, 'terra_class', false);
Map.addLayer(fbds, vis, 'fbds', false);
Map.addLayer(fip, vis, 'fip', false);

// calcular concordancia no nivel 0 (nativa nao nativa)
var agreement_L0 = ee.Image(0)
    // concordancia entre os 4 produtos
    // Mapbiomas + TC + FBDS + FIP
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(3).or(fip.eq(10))), 141234)

    // concordancia entre 3 produtos
    // Mapbiomas + TC + FBDS
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(0).or(fip.eq(127))), 13124)
    // Mapbiomas + TC + FIP
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(3).or(fip.eq(10))), 13134)
    // Mapbiomas + FBDS + FIP
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(3).or(fip.eq(10))), 13123)
    // TC + FBDS + FIP
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(3).or(fip.eq(10))), 23234)
    
    // concordancia entre 2 produtos
    // Mapbiomas + TC
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(0).or(fip.eq(127))), 1214)    
    // Mapbiomas + FBDS
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(0).or(fip.eq(127))), 1212)    
    // Mapbiomas + FIP
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(3).or(fip.eq(10))), 1213)  
    // TC + FBDS
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(0).or(fip.eq(127))), 2224)   
    // TC + FIP
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(3).or(fip.eq(10))), 2234)  
    // FBDS + FIP
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(3).or(fip.eq(10))), 2223)  
          
    // ocorrencia apenas em 1 produto
    // apenas Mapbiomas
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(0).or(fip.eq(127))), 211)  
    // apenas FBDS
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(3).or(fbds.eq(10))).and(fip.eq(0).or(fip.eq(127))), 212)  
    // apenas TC
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(3).or(terra_class.eq(10)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(0).or(fip.eq(127))), 214) 
    // apenas FIP
    .where(mapbiomas.eq(0).or(mapbiomas.eq(127)).and(terra_class.eq(0).or(terra_class.eq(127)))
          .and(fbds.eq(0).or(fbds.eq(127))).and(fip.eq(3).or(fip.eq(10))), 213)  
          
    // Mapbiomas quando só ele exista
    .where(mapbiomas.eq(3).or(mapbiomas.eq(10)).and(terra_class.eq(127))
          .and(fbds.gt(10)).and(fip.eq(127)), 219)  
    
    .updateMask(cerrado);

// plot map
Map.addLayer(agreement_L0.randomVisualizer(), {}, 'agree')

// export as GEE asset
Export.image.toAsset({
    'image': agreement_L0,
    'description': 'agreement_cerrado_col71',
    'assetId': 'users/dh-conciani/basemaps/agreement_cerrado_col71',
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': cerrado_bounds,
    'scale': 30,
    'maxPixels': 1e13
});



