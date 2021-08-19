// Generate training mask by using stable pixels from ciclo 1
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// input file - ciclo 1 classification
var wetlands= ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_wetlands_gapfill_incid_temporal_spatial_freq_v53');

// collection 5.0 mapbiomas stable samples
var stableC5 = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/stablePixels_C5');

// set directory for the output file
var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/'; 

// biomes
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');

// brazilian political states
var assetStates = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

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

// import the color ramp from mapbiomas
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// load data to mask unstable samples
// probio
var probioNV = ee.Image('users/felipelenti/probio_cerrado_ras');
    probioNV = probioNV.eq(1);
// PROBIO
var prodesNV = ee.Image('users/felipelenti/prodes_cerrado_2000_2019');
    prodesNV = prodesNV.unmask(1).eq(1);

// remap collection 5 using legend that cerrado maps 
var colList = ee.List([]);
var col5remap = wetlands.select('classificationWet_1985').remap(
                  [3, 4, 5,  9, 11, 12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 21, 11, 12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);

// convert to 8 bits
colList = colList.add(col5remap.int8());

// list years to be used in stability computation
var anos = ['1985','1986','1987','1988','1989','1990',
            '1991','1992','1993','1994','1995','1996',
            '1997','1998','1999','2000','2001','2002',
            '2003','2004','2005','2006','2007','2008',
            '2009','2010','2011','2012','2013','2014',
            '2015','2016','2017','2018', '2019'];


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];

  var col5flor = wetlands.select('classificationWet_' + ano).remap(
                 [3, 4, 5,  9, 11, 12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                 [3, 4, 3, 21, 11, 12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
  colList = colList.add(col5flor.int8());
}

// read collection 
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
///////////////////////////


// set maximum frequency for each class (collection 5.0 equals to 35) 
var lista_image = ee.List([]);
var classFrequency = { "3": 36,  "4": 36, "11": 36, "12": 36,
                      "15": 36, "19": 36, "25": 36, "33": 36};

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

// extract only wetlands class
var referenceMapRef = referenceMapRef.updateMask(referenceMapRef.eq(11));

// insert stable samples of wetlands upper c5 stable samples
var training_mask = stableC5.blend(referenceMapRef);

// Plot map
Map.addLayer(training_mask, vis, 'training mask ciclo 2', true);

// export as GEE asset
Export.image.toAsset({
    "image": training_mask.toInt8(),
    "description": 'trainingMask_wetlands_c6_ciclo2_v53',
    "assetId": dirout + 'trainingMask_wetlands_c6_ciclo2_v53',
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": CERRADO_simpl
});  
