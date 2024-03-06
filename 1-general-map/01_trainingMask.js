// -- -- -- -- 01_trainingMask
// generate training mask based in stable pixels from mapbiomas collection 8, reference maps and GEDI
// barbara.silva@ipam.org.br and dhemerson.costa@ipam.org.br

// set area of interest 
var CERRADO_simpl = 
    ee.Geometry.Polygon(
        [[[-61.58018892468989, -1.8506184138463584],
          [-61.58018892468989, -26.04174742534789],
          [-40.6622201746899, -26.04174742534789],
          [-40.6622201746899, -1.8506184138463584]]], null, false);

// string to identify the output version
var version_out = '2';

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification7')
};

// set directory for the output file
var dirout = 'projects/ee-barbarasilvaipam/assets/collection8/masks/';

// brazilian states 
var assetStates = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

// load collection 7.1
var colecao71 =  'projects/mapbiomas-workspace/COLECAO7/integracao';
colecao71 = ee.ImageCollection(colecao71)
  .filter(ee.Filter.eq('version','0-29'))
  .mosaic();

print ("Collection 7.1", colecao71);
  
// import data to mask stable pixels 
// PROBIO
var probioNV = ee.Image('users/felipelenti/probio_cerrado_ras');
    probioNV = probioNV.eq(1); // select only deforestation (value= 0)

// PRODES 00-21
var prodesNV = ee.Image('users/dh-conciani/basemaps/prodes_cerrado_00-21')
                  .remap([0, 2, 4, 6, 8, 10, 12, 13, 15, 14, 16, 17, 18, 19, 20, 21, 96, 97, 98, 99, 127],
                         [1, 1, 1, 1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,   0]); // deforestation equals to 1
                         
                         
// Inventário Florestal do Estado de São Paulo (World-View <1m)
var SEMA_SP = ee.Image('projects/mapbiomas-workspace/VALIDACAO/MATA_ATLANTICA/SP_IF_2020_2')
                .remap([3, 4, 5, 9, 11, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33],
                       [3, 4, 3, 9, 11, 12, 12, 15, 19, 19, 19, 21, 25, 25, 25, 25, 33, 25, 25, 25, 25, 33]);
                       
                // select only native vegetation patches
                var SEMA_bin = SEMA_SP.remap([3, 4, 9, 11, 12, 15, 19, 21, 25, 33],
                                             [1, 1, 0,  1,  1,  0,  0,  0,  0,  0]);
                // crop only for são paulo's 
                var SEMA_bin = SEMA_bin.unmask(0).updateMask(assetStates.eq(35));

// Mapa Temático do CAR para áreas úmidas do Estado do Tocantins (RapidEye 2m)
var SEMA_TO = ee.Image('users/dh-conciani/basemaps/TO_Wetlands_CAR');
    SEMA_TO = SEMA_TO.remap([11, 50, 128],
                            [11, 11, 0]);

// global tree canopy (Lang et al, 2022) http://arxiv.org/abs/2204.08322
var tree_canopy = ee.Image('users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1');
Map.addLayer(tree_canopy, {palette: ['red', 'orange', 'yellow', 'green'], min:0, max:30}, 'tree canopy', false);

// ***** end of products to filter stable samples //

// remap collection 7.1 using legend that cerrado team maps 
var colList = ee.List([]);
var col71remap = colecao71.select('classification_1985').remap(
                  [3, 4, 5, 11, 12, 29, 15, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                  [3, 4, 3, 11, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33]);

// convert to 8 bits
colList = colList.add(col71remap.int8());

// list years to be used in stability computation
var anos = ['1985','1986','1987','1988','1989','1990',
            '1991','1992','1993','1994','1995','1996',
            '1997','1998','1999','2000','2001','2002',
            '2003','2004','2005','2006','2007','2008',
            '2009','2010','2011','2012','2013','2014',
            '2015','2016','2017','2018','2019','2020',
            '2021'];

// remap collection 7.1 
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];

  var col71flor = colecao71.select('classification_' + ano).remap(
                  [3, 4, 5, 11, 12, 29, 15, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                  [3, 4, 3, 11, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33]);
  colList = colList.add(col71flor.int8());
}

// ***** start function to compute invariant pixels from 1985 to 2021
var collection = ee.ImageCollection(colList);

var unique = function(arr) {
    var u = {},
        a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
};

var getFrenquencyMask = function(collection, classId) {
    var classIdInt = parseInt(classId, 10);
    var maskCollection = collection.map(function(image) {
        return image.eq(classIdInt);
    });

    var frequency = maskCollection.reduce(ee.Reducer.sum());
    var frequencyMask = frequency.gte(classFrequency[classId])
        .multiply(classIdInt)
        .toByte();

    frequencyMask = frequencyMask.mask(frequencyMask.eq(classIdInt));
    return frequencyMask.rename('frequency').set('class_id', classId);
};

var lista_image = ee.List([]);

var classFrequency = { "3": 37,  "4": 37, "11": 37, "12": 37,
                      "15": 37, "19": 37, "21": 37, "25": 37, 
                      "33": 37
                      };
  
var frequencyMasks = Object.keys(classFrequency).map(function(classId) {
    return getFrenquencyMask(collection, classId);
});

frequencyMasks = ee.ImageCollection.fromImages(frequencyMasks);

// compute the stable pixels
var referenceMap = frequencyMasks.reduce(ee.Reducer.firstNonNull()).clip(CERRADO_simpl).aside(print);
    Map.addLayer(referenceMap, vis, 'stable pixels', false);

// ***** process masks to improve stable pixels 
// mask native vegetation pixels by usign deforestation from PROBIO
var referenceMapRef = referenceMap
                        //.where(probioNV.eq(0)
                        //.and(referenceMap.eq(3)
                        //.or(referenceMap.eq(4)
                        //.or(referenceMap.eq(12)))), 27);

// mask native vegetation by using PRODES (fro 2000 to 2021)
var referenceMapRef = referenceMapRef.where(prodesNV.eq(1)
                        .and(referenceMapRef.eq(3)
                        .or(referenceMapRef.eq(4)
                        .or(referenceMapRef.eq(11)
                        .or(referenceMapRef.eq(12))))), 27);

// mask using the "Inventario Florestal do Estado de São Paulo
// erase native vegetation samples that was not native vegetation on reference data
var referenceMapRef = referenceMapRef.where(SEMA_bin.eq(0)
                        .and(referenceMapRef.eq(3)
                        .or(referenceMapRef.eq(4)
                        .or(referenceMapRef.eq(11)
                        .or(referenceMapRef.eq(12))))), 27)
                          
// erase anthropogenic classes from mapbiomas that was classified as natural on reference data
                        .where(SEMA_bin.eq(1)
                        .and(referenceMapRef.eq(15)
                        .or(referenceMapRef.eq(19)
                        .or(referenceMapRef.eq(21)))), 27);

// remove grassland pixels from sao paulo state
var referenceMapRef = referenceMapRef.where(referenceMapRef.eq(12).and(assetStates.eq(35)), 27);

// insert raw grassland from reference into são paulo state
var referenceMapRef = referenceMapRef.blend(SEMA_SP.updateMask(SEMA_SP.eq(12)));

// select  pixels that Mapbiomas and IF-SP agree that are the same native vegetation class
                                      // forest
var referenceMapRef = referenceMapRef.where(referenceMapRef.eq(3).and(SEMA_SP.eq(3)), 3)
                                     .where(referenceMapRef.eq(3).and(SEMA_SP.neq(3)), 27)
                                     .where(referenceMapRef.neq(3).and(SEMA_SP.eq(3)), 3)
                                     // savanna
                                     .where(referenceMapRef.eq(4).and(SEMA_SP.eq(4)), 4)
                                     .where(referenceMapRef.eq(4).and(SEMA_SP.neq(4)), 27)
                                     .where(referenceMapRef.neq(4).and(SEMA_SP.eq(4)), 4)
                                     // wetland 
                                     .where(referenceMapRef.eq(11).and(SEMA_SP.eq(11)), 11)
                                     .where(referenceMapRef.eq(11).and(SEMA_SP.neq(11)), 11)
                                     .where(referenceMapRef.neq(11).and(SEMA_SP.eq(11)), 11);

// rect wetlands from Tocantins state by using SEMA-CAR reference map
var referenceMapRef = referenceMapRef.where(SEMA_TO.eq(11).and(referenceMapRef.eq(11)), 11)
                                     .where(SEMA_TO.eq(11).and(referenceMapRef.eq(3)), 3)
                                     .where(SEMA_TO.eq(11).and(referenceMapRef.eq(4)), 11)
                                     .where(SEMA_TO.eq(11).and(referenceMapRef.eq(12)), 11)
                                     .where(SEMA_TO.eq(11).and(referenceMapRef.eq(27)), 11);

// discard masked pixels
var referenceMapRef = referenceMapRef.updateMask(referenceMapRef.neq(27));

// // mask deforestations in MapBiomas Alerta
var alerta = ee.Image('projects/ee-ipam-cerrado/assets/Collection_8/masks/alerta-image-16-22').unmask(0);
var referenceMapRef = referenceMapRef.updateMask(alerta.neq(1));

var sad = ee.Image('projects/ee-ipam-cerrado/assets/Collection_8/masks/sad-image-21_22').unmask(0);
var referenceMapRef = referenceMap.updateMask(sad.neq(1));

// plot correctred stable samples
Map.addLayer(referenceMapRef, vis, 'filtered by basemaps', false);

// filter pixels by using GEDI derived tree canopy
var gedi_filtered = referenceMapRef.where(referenceMapRef.eq(3).and(tree_canopy.lt(8)), 50)
                                   .where(referenceMapRef.eq(4).and(tree_canopy.lte(2)), 50)
                                   .where(referenceMapRef.eq(4).and(tree_canopy.gte(12)), 50)
                                   .where(referenceMapRef.eq(11).and(tree_canopy.gte(15)), 50)
                                   .where(referenceMapRef.eq(12).and(tree_canopy.gte(6)), 50)
                                   .where(referenceMapRef.eq(15).and(tree_canopy.gte(8)), 50)
                                   .where(referenceMapRef.eq(19).and(tree_canopy.gt(7)), 50)
                                   .where(referenceMapRef.eq(25).and(tree_canopy.gt(0)), 50)
                                   .where(referenceMapRef.eq(33).and(tree_canopy.gt(0)), 50);

// plot map                               
// remove masked values
var stable_pixels = gedi_filtered.updateMask(gedi_filtered.neq(50));
Map.addLayer(stable_pixels, vis, 'filtered gedi');

 // export to workspace asset
Export.image.toAsset({
    "image": stable_pixels.toInt8(),
    "description": 'cerrado_stablePixels_1985_2021_v' + version_out,
    "assetId": dirout + 'cerrado_stablePixels_1985_2021_v'+ version_out,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": CERRADO_simpl
});  
