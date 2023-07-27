// -- -- -- -- 13_toWorkspace
// Script modelo para padronização dos assets do Mapbiomas~
// barbara.silva@ipam.org.br

// geometria para corrigir campo para afloramento 
var geometry_mask = ee.Image(1).clip(ee.FeatureCollection(ee.Geometry.MultiPolygon(
        [[[[-43.54367578400043, -18.53690253927378],
           [-43.54607904327777, -18.509557440463933],
           [-43.552945498355896, -18.496860015981152],
           [-43.58762109650043, -18.489696950925],
           [-43.614400271305115, -18.515743024006678],
           [-43.61646020782855, -18.52583481176097],
           [-43.62298334015277, -18.529090100124872],
           [-43.632596377262146, -18.544063628062915],
           [-43.65044916046527, -18.54927150407182],
           [-43.654569033512146, -18.538204577743524],
           [-43.66692865265277, -18.537553559748883],
           [-43.676541689762146, -18.55480469829488],
           [-43.684094790348084, -18.54504011691155],
           [-43.69885766876605, -18.551875382515696],
           [-43.70641076935199, -18.558710374469605],
           [-43.711560610660584, -18.567823271247534],
           [-43.714307192691834, -18.573030422263557],
           [-43.71533716095355, -18.577261115383273],
           [-43.720487002262146, -18.58409509016656],
           [-43.72117364776996, -18.59450823901314],
           [-43.720487002262146, -18.60492075119571],
           [-43.71739709747699, -18.616959424352938],
           [-43.72735345734027, -18.62541852281276],
           [-43.72460687530902, -18.638431698519668],
           [-43.717740420230896, -18.666081386480315],
           [-43.613370303043396, -18.68624655189411],
           [-43.55088556183246, -18.682669036326683],
           [-43.53234613312152, -18.617935495650585],
           [-43.53571571149347, -18.5616395729437]]],
         [[[-43.68437446393487, -18.77937018612342],
           [-43.674074781317685, -18.759216126441153],
           [-43.68952430524347, -18.703617456592323],
           [-43.71836341657159, -18.660036136969975],
           [-43.735186231513, -18.65645806831971],
           [-43.765741956610654, -18.65353050148915],
           [-43.7846247080755, -18.660686686799753],
           [-43.78050483502862, -18.686381408998123],
           [-43.770205152411435, -18.704593029452703],
           [-43.77089179791925, -18.713698104915327],
           [-43.75681556500909, -18.75401468779212],
           [-43.72660316266534, -18.773519255707004],
           [-43.713213575263, -18.77611969430262]]]])));
           
// mask to remove wetland from geomorfology
var wetland_to_grassland = ee.Image(1).clip(ee.FeatureCollection(ee.Geometry.MultiPolygon(
        [[[[-58.35715967096754, -13.65902188999379],
           [-58.35715967096754, -13.82976962831706],
           [-58.009717044014415, -13.82976962831706],
           [-58.009717044014415, -13.65902188999379]]],
         [[[-55.85895058657032, -14.292089975688981],
           [-55.85895058657032, -14.449067886431282],
           [-55.68591591860157, -14.449067886431282],
           [-55.68591591860157, -14.292089975688981]]],
         [[[-55.27392861391407, -14.2668035942895],
           [-55.27392861391407, -14.6338404028623],
           [-54.89352700258595, -14.6338404028623],
           [-54.89352700258595, -14.2668035942895]]],
         [[[-46.62723511748545, -16.77353976875004],
           [-46.62723511748545, -16.7929329851731],
           [-46.59667939238779, -16.7929329851731],
           [-46.59667939238779, -16.77353976875004]]],
         [[[-45.67217425963185, -16.310485298715367],
           [-45.67217425963185, -16.391526813509252],
           [-45.62479571959279, -16.391526813509252],
           [-45.62479571959279, -16.310485298715367]]],
         [[[-45.30390586423229, -16.347017198894918],
           [-45.30390586423229, -16.596575270824136],
           [-45.16657676266979, -16.596575270824136],
           [-45.16657676266979, -16.347017198894918]]],
         [[[-45.297039409154166, -16.49916078102644],
           [-45.297039409154166, -16.586046348715648],
           [-45.224941630833854, -16.586046348715648],
           [-45.224941630833854, -16.49916078102644]]],
         [[[-45.32313193845104, -16.50442768627535],
           [-45.32313193845104, -16.644606155773417],
           [-45.299785991185416, -16.644606155773417],
           [-45.299785991185416, -16.50442768627535]]],
         [[[-45.38561667966198, -16.556430666497214],
           [-45.38561667966198, -16.631448204804006],
           [-45.29566611813854, -16.631448204804006],
           [-45.29566611813854, -16.556430666497214]]],
         [[[-45.357464213841666, -16.530760059937975],
           [-45.357464213841666, -16.56037968726312],
           [-45.31969871091198, -16.56037968726312],
           [-45.31969871091198, -16.530760059937975]]]])));
           
var wetland_to_grassland2 = ee.Image(1).clip(ee.FeatureCollection(ee.Geometry.MultiPolygon(
        [[[-45.2483832882216, -16.362766029840177],
          [-45.28820872767473, -16.468151020580134],
          [-45.38845897181535, -16.566897444058696],
          [-45.37335277064348, -16.644542416918384],
          [-45.35412669642473, -16.627436898920447],
          [-45.31018138392473, -16.63927934314271],
          [-45.27310252650285, -16.590589066301014],
          [-45.18109202845598, -16.560315920465005],
          [-45.1934516475966, -16.51687223008368],
          [-45.20031810267473, -16.46156613307534],
          [-45.15637279017473, -16.44312725862372],
          [-45.1714789913466, -16.366718996670713]]])));

var palette = require('users/mapbiomas/modules:Palettes.js').get('classification7');

// Defina seu asset de entrada
var assetInput = 'projects/ee-barbaracsilva/assets/Collection_8/rocky-outcrop_step2/general-class-post/';
var file_name = 'CERRADO_col8_native14_rocky4';

// Carregue a sua coleção aqui
var collection = ee.Image(assetInput + '/' + file_name);
Map.addLayer (collection, {}, "input data");

// Defina seu asset de saída
var assetOutput = 'projects/mapbiomas-workspace/COLECAO8/classificacao';

// Defina a versão de saída
var outputVersion = '14';

// Defina o id de lançamento da coleção mapbiomas
var collectionId = 8.0;

// Se for bioma use este.
var theme = { 'type': 'biome', 'name': 'CERRADO' };

// Se for tema transversal use este.
// var theme = { 'type': 'theme', 'name': 'INFRAURBANA'};

// Defina a fonte produto do dado
var source = 'ipam';

// Todos os anos mapeados na coleção 8
var years = [
    '1985', '1986', '1987', '1988',
    '1989', '1990', '1991', '1992',
    '1993', '1994', '1995', '1996',
    '1997', '1998', '1999', '2000',
    '2001', '2002', '2003', '2004',
    '2005', '2006', '2007', '2008',
    '2009', '2010', '2011', '2012',
    '2013', '2014', '2015', '2016',
    '2017', '2018', '2019', '2020',
    '2021', '2022'
];

// Boundary box de todo o Brasil
var geometry = ee.Geometry.Polygon(
    [
        [
            [-75.46319738935682, 6.627809464162168],
            [-75.46319738935682, -34.62753178950752],
            [-32.92413488935683, -34.62753178950752],
            [-32.92413488935683, 6.627809464162168]
        ]
    ], null, false
);

years.forEach(
    function (year) {

        var imageYear = collection.select('classification_' + year);

        imageYear = imageYear.rename('classification');

        imageYear = imageYear
            .set('territory', 'BRAZIL')
            .set('biome', 'CERRADO')
            .set('collection_id', collectionId)
            .set('version', outputVersion)
            .set('source', source)
            .set('year', parseInt(year, 10))
            .set('description', 'native3_rocky4_versionB');

        var vis = {
            'min': 0,
            'max': 62,
            'palette': palette,
            'format': 'png'
        };

       var name = year + '-' + outputVersion;

        if (theme.type === 'biome') {
            name = theme.name + '-' + name;
        }
        
        print(imageYear);
        
        // perform reclassification of mosaic of agriculture and pasture to pasture into protected areas (except APAs and TIs)
        // build mask
        // import protected areas
        var pa = ee.Image(1).clip(
                    ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/areas-protegidas')
                            .filterMetadata('categoria', 'not_equals', 'APA')
                            .filterMetadata('categoria', 'not_equals', ''));

        // remap 21 into UCs to 15
        imageYear = imageYear.where(imageYear.eq(21).and(pa.eq(1)), 15);
       
        // remap 12 into mask to 29
        // imageYear = imageYear.where(imageYear.eq(12).and(geometry_mask.eq(1)), 29);
        
        // remap 11 into mask to 12
        // imageYear = imageYear.where(imageYear.eq(11).and(wetland_to_grassland.eq(1)), 12);
        // imageYear = imageYear.where(imageYear.eq(11).and(wetland_to_grassland2.eq(1)), 12);


        Map.addLayer(imageYear, vis, theme.name + ' ' + year, false);
        //print ('output', imageYear)
        
        Export.image.toAsset({
            'image': imageYear,
            'description': name,
            'assetId': assetOutput + '/' + name,
            'pyramidingPolicy': {'.default': 'mode'},
            'region': geometry,
            'scale': 30,
            'maxPixels': 1e13
        });
    }
);

var cerrado =  ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019').filter(ee.Filter.eq('Bioma','Cerrado'));
var line = ee.Image().paint(cerrado,'empty',3).visualize({palette:'FF0000'});
Map.addLayer(line, {min:0, max:1}, 'Cerrado limit');
