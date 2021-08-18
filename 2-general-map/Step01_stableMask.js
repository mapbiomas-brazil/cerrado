// Generate stable pixels by using Mapbiomas Collection 5.0 data
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// cerrado bound box
var CERRADO_simpl = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-42.306314047317365, -1.7207103925816054],
          [-44.415689047317365, -1.4571401339250152],
          [-54.259439047317365, -10.451581892159153],
          [-61.202798422317365, -10.624398320896237],
          [-61.202798422317365, -14.739254413487872],
          [-57.775064047317365, -18.027281070807337],
          [-59.005532797317365, -23.85214541157912],
          [-48.370767172317365, -25.84584109333063],
          [-40.548501547317365, -17.52511660076233],
          [-40.636392172317365, -2.774571568871124]]]);

// define year to plot a sample from collection 5.0
var year = 2000;
var version_out = '2'; // set a string to identify the output version

// import the color ramp from mapbiomas
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// landsat surface reflectance data - from collection 6.0
var assetMosaics = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics'; 

// brazilian biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// brazilian administration states
var assetStates = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

// set directory for the output file
var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/';

// load collection 5.0
var colecao5 = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1');

// load data to mask unstable samples
// probio
var probioNV = ee.Image('users/felipelenti/probio_cerrado_ras');
    probioNV = probioNV.eq(1);
// prodes
var prodesNV = ee.Image('users/felipelenti/prodes_cerrado_2000_2019');
    prodesNV = prodesNV.unmask(1).eq(1);
// instituto florestal do estado de sp
var SEMA_SP = ee.Image('projects/mapbiomas-workspace/VALIDACAO/MATA_ATLANTICA/SP_IF_2020_2');
SEMA_SP = SEMA_SP.remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 21,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
//Map.addLayer(SEMA_SP, vis, 'SEMA_SP', false);
var SEMA_bin = SEMA_SP.remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                  var SEMA_bin = SEMA_bin.unmask(0).updateMask(assetStates.eq(35));

// remap collection 5 using legend that cerrado maps 
var colList = ee.List([]);
var col5remap = colecao5.select('classification_1985').remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 21,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
// convert to 8 bits
colList = colList.add(col5remap.int8());

// list years to be used in stability computation
var anos = ['1985','1986','1987','1988','1989','1990',
            '1991','1992','1993','1994','1995','1996',
            '1997','1998','1999','2000','2001','2002',
            '2003','2004','2005','2006','2007','2008',
            '2009','2010','2011','2012','2013','2014',
            '2015','2016','2017','2018', '2019'];

// remap collection 5 
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];

  var col5flor = colecao5.select('classification_' + ano).remap(
                 [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                 [3, 4, 3, 21,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
  colList = colList.add(col5flor.int8());
}

// read collection 
var collection = ee.ImageCollection(colList);

// define function to get stable pixels
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

// set maximum frequency for each class (collection 5.0 equals to 35) 
var classFrequency = {"3": 35, "4": 35, "12": 35,"15": 35, "19": 35, "25": 35, "33": 35};

// mask collection by frequency 
var frequencyMasks = Object.keys(classFrequency).map(function(classId) {
    return getFrenquencyMask(collection, classId);
});

frequencyMasks = ee.ImageCollection.fromImages(frequencyMasks);

// mask stable samples that are not stable on reference data
// PROBIO - since collection 4.1
var referenceMap = frequencyMasks.reduce(ee.Reducer.firstNonNull()).clip(CERRADO_simpl).aside(print);
var referenceMapRef = referenceMap.where(probioNV.eq(0)
                                                 .and(referenceMap.eq(3)
                                                                   .or(referenceMap.eq(4))
                                                                   .or(referenceMap.eq(12))),
                                                  27);
    referenceMapRef = referenceMapRef.where(prodesNV.eq(0)
                                                    .and(referenceMapRef.eq(3)
                                                                   .or(referenceMapRef.eq(4))
                                                                   .or(referenceMapRef.eq(12))),
                                                  27);
    
    referenceMapRef = referenceMapRef.updateMask(referenceMapRef.neq(27)).rename("reference");

// Inventário Florestal do Estado de SP - Since Collection 6.0 
// erase native vegetation samples that was not native vegetation on reference data
var referenceMapRef2 = referenceMapRef.where(SEMA_bin.eq(0).and(referenceMapRef.eq(3)
                                                            .or(referenceMapRef.eq(4)
                                                            .or(referenceMapRef.eq(12)))),27);

 referenceMapRef2 = referenceMapRef2.updateMask(referenceMapRef2.neq(27)).rename("reference");

// erase anthropogenic classes from mapbiomas that was classified as natural on reference data
var referenceMapRef3 = referenceMapRef2.where(SEMA_bin.eq(1).and(referenceMapRef2.eq(15)
                                                            .or(referenceMapRef2.eq(19)
                                                            .or(referenceMapRef2.eq(25)
                                                            .or(referenceMapRef2.eq(33))))),27);

    referenceMapRef3 = referenceMapRef3.updateMask(referenceMapRef3.neq(27)).rename("reference");

// insert grassland from Inventário Florestal into São Paulo state stable pixels for this class
var referenceMapRef4 = referenceMapRef3.blend(SEMA_SP.updateMask(SEMA_SP.eq(12)));

// plot stable samples 
Map.addLayer(referenceMapRef4, vis, 'final');

// export as GEE asset
Export.image.toAsset({
    "image": referenceMapRef4.toInt8(),
    "description": 'CE_amostras_estaveis85a19_col5_v'+version_out,
    "assetId": dirout + 'CE_amostras_estaveis85a19_col5_v'+version_out,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": CERRADO_simpl
});  
