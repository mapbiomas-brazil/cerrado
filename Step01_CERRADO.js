var CERRADO_simpl = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-55.93941123986993, -23.44189379285751],
          [-55.63179405236993, -24.445963716189983],
          [-54.22554405236993, -24.045274385069558],
          [-54.13765342736993, -23.199763490455705],
          [-54.09370811486993, -22.51135355715787],
          [-52.95112998986993, -22.470750757703595],
          [-52.02827842736993, -21.69705513332371],
          [-51.23726280236993, -20.919180123716618],
          [-50.92964561486993, -20.095982879933672],
          [-50.57808311486993, -20.549289126544835],
          [-49.17183311486993, -21.165269076916754],
          [-49.43550498986993, -21.61536828781877],
          [-52.20405967736993, -22.02333799991112],
          [-52.24800498986993, -22.916723098051815],
          [-50.05073936486993, -23.159365629894015],
          [-51.19331748986993, -23.96498551403798],
          [-50.84175498986993, -24.96495921818276],
          [-49.08394248986993, -24.725691643047938],
          [-47.63374717736993, -24.125513088584434],
          [-46.93062217736993, -23.118955581496465],
          [-46.53511436486993, -21.32910164202919],
          [-45.83198936486993, -21.9010693256617],
          [-44.60152061486993, -21.247208128227555],
          [-43.45894248986993, -20.178500801517274],
          [-42.31636436486993, -18.603366797326704],
          [-41.65718467736993, -17.013521884639697],
          [-41.43745811486993, -16.213423741201662],
          [-41.61323936486993, -15.325315466800877],
          [-42.31636436486993, -14.646108056116763],
          [-41.87691123986993, -13.751459347215368],
          [-42.14058311486993, -12.510393673486243],
          [-43.01948936486993, -11.737026950952227],
          [-43.28316123986993, -12.25285475460132],
          [-43.37105186486993, -13.879481219927975],
          [-43.37105186486993, -15.325315466800877],
          [-43.63472373986993, -15.706408752821961],
          [-43.72261436486993, -14.390856300975543],
          [-43.54683311486993, -12.553292012746846],
          [-43.54683311486993, -11.134008938217683],
          [-43.59077842736993, -9.8809921591617],
          [-42.66792686486993, -8.362403843851283],
          [-41.92085655236993, -7.230406408878139],
          [-41.08589561486993, -6.270323198850285],
          [-41.08589561486993, -5.13341720021168],
          [-41.17378623986993, -3.117275485079216],
          [-41.78902061486993, -2.151511841973039],
          [-43.37105186486993, -1.6244562243362004],
          [-44.49878084834397, -2.883021454769535],
          [-45.15796053584397, -2.883021454769535],
          [-45.15796053584397, -4.023505993338825],
          [-46.21264803584397, -4.111175246210696],
          [-46.08081209834397, -4.987303891787094],
          [-48.58569491084397, -5.031081362955656],
          [-48.98120272334397, -7.477182305093342],
          [-49.20092928584397, -6.954016708032974],
          [-50.07983553584397, -6.9103926518431305],
          [-50.73901522334397, -9.693136233940017],
          [-52.58471834834397, -11.011618198953618],
          [-52.18921053584397, -11.744001435857388],
          [-52.67260897334397, -12.474443645759925],
          [-53.99096834834397, -13.031636933969308],
          [-54.82592928584397, -12.388613716141508],
          [-55.74878084834397, -11.744001435857388],
          [-56.49585116084397, -11.787023469512555],
          [-57.02319491084397, -13.33114895590769],
          [-57.63842928584397, -11.614895126960601],
          [-60.36303866084397, -11.270320874658228],
          [-60.80249178584397, -12.130955153171614],
          [-60.14331209834397, -14.482870163961616],
          [-58.73706209834397, -15.670958745413346],
          [-57.28686678584397, -14.695511879893187],
          [-58.38549959834397, -16.178063238876614],
          [-57.98999178584397, -17.1463526223761],
          [-57.33081209834397, -16.936273581604077],
          [-56.14428866084397, -16.47327674950646],
          [-55.13354647334397, -18.02606288784997],
          [-55.83667147334397, -19.482437873916712],
          [-57.59448397334397, -19.689450854098506],
          [-58.29760897334397, -21.4993795124547],
          [-57.94604647334397, -22.477333261520297],
          [-56.01245272334397, -22.68021819177981]]]);


var year = 2017
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'bands': ['classification_' + String(year)],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};




var assetMosaics = 'projects/mapbiomas-workspace/MOSAICOS/workspace-c3';
var assetBiomes = 'projects/mapbiomas-workspace/AUXILIAR/biomas-raster';
var biomes = ee.Image(assetBiomes);
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/';

var version_out = '_5-beta-1';//PRODES E PROBIO para excluir amostras de VN nas estaveis que nao sao VN nestas bases

var probioNV = ee.Image('users/felipelenti/probio_cerrado_ras');//.randomVisualizer().aside(Map.addLayer);
    probioNV = probioNV.eq(1);
var prodesNV = ee.Image('users/felipelenti/prodes_cerrado_2000_2019')//.randomVisualizer().aside(Map.addLayer);
    prodesNV = prodesNV.unmask(1).eq(1);
var colecao41 = ee.Image('projects/mapbiomas-workspace/public/collection4_1/mapbiomas_collection41_integration_v1');
Map.addLayer(colecao41, vis, 'Classes ORIGINAIS 85 a 18', true);



var colList = ee.List([]);
var col41remap = colecao41.select('classification_1985').remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 21,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
//Map.addLayer(col23floresta00, {'palette': 'f4f4f4,0a5903'}, 'Ano 2000 Floresta', false);
//col31remap = col31remap.select([0],['classification_1985']).int8()

colList = colList.add(col41remap.int8());

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018'];
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];

  var col4flor = colecao41.select('classification_'+ano).remap(
                 [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                 [3, 4, 3, 21,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
//  Map.addLayer(col23flor, {'palette': 'f4f4f4,0a5903'}, 'Ano '+ano, false);
//  col31remap = col31remap.addBands(col3flor.select([0],['classification_'+ano])).int8()
  colList = colList.add(col4flor.int8());
};

//Map.addLayer(col31remap, vis, 'Col 3 - '+year, false);

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

/**
 * REFERENCE MAP
 */

//var colList = ee.List([])
//  
//var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996',
//  '1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010',
//  '2011','2012','2013','2014','2015','2016','2017'];
//for (var i_ano=0;i_ano<anos.length; i_ano++){
//  var ano = anos[i_ano];
////    Map.addLayer(collection1.select('classification_'+ano), options.vis, 'Classes'+ano, false);
//  var colList = colList.add(col31remap.select('classification_'+ano))
//}
//var collection = ee.ImageCollection(colList)


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
//FUNCTION: LOOP for each carta

var lista_image = ee.List([]);
//print(lista_image)

var classFrequency = {"3": 34, "4": 34, "12": 34,"15": 34, "19": 34, "25": 34, "33": 34};
  
//print(Object.keys(classFrequency))

var frequencyMasks = Object.keys(classFrequency).map(function(classId) {
    return getFrenquencyMask(collection, classId);
});

frequencyMasks = ee.ImageCollection.fromImages(frequencyMasks);

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
    // referenceMap = referenceMap.updateMask(referenceMap.neq(27)).rename("reference");

var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// Map.addLayer(referenceMap, vis, 'Classes persistentes 85 a 17', true);
Map.addLayer(referenceMapRef, vis, 'Classes persistentes e Mapas Ref', true);

Export.image.toAsset({
    "image": referenceMapRef.toInt8(),
    "description": 'CE_amostras_estaveis85a18_col41_v'+version_out,
    "assetId": dirout + 'CE_amostras_estaveis85a18_col41_v'+version_out,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": CERRADO_simpl
});  

