var bioma = "CERRADO";
var versao = '5-beta-4'
var dirOut = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/aux_col_5/';  
var anos = [
            // 1985,
            // 1986,
            // 1987,1988,1989,
            // 1990,1991,1992,1993,1994,
            // 1995,1996,1997,1998,1999,
            //2000,
             2001,2002,2003,2004,
            // 2005,2006,2007,2008,2009,
            // 2010,2011,2012,2013,2014,
            // 2015,2016,2017,2018,2019
]

var bandNames = ee.List([
  "median_ndvi_dry",
  "median_ndvi_wet",
  "median_green",
  
  ]);
  
var  outputs = ee.List([
  "slope",
  'textG',
  'latitude',
  'longitude'
  ]);
  

//Kernel used to compute entropy  
var square = ee.Kernel.square({radius: 5}); 
  
var slope = ee.Terrain.slope(ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE")).rename("slope");
var dirasset = 'projects/mapbiomas-workspace/MOSAICOS/workspace-c3';
var pts = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/samples_col5_CERRADO_v_5-beta-1');
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/train_';
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/reg_b15_cerr_c5');
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-raster-41');
var bioma250mil_CE = biomes.mask(biomes.eq(4)).aside(Map.addLayer);

print(pts.limit(5))

var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var mosaicoCer = ee.ImageCollection(dirasset)
                        .filterMetadata('biome', 'equals', bioma)
                        .select(bandNames);
var colecReg = ee.FeatureCollection([]);

  
  var regioes_lista = [
                       [12] 
                       //[1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], 
                       //[12], [13], [14], [15], [16], [17], [18], [19], [20], [21], [22],
                       //[23], [12], [25], [26], [27], [28], [29], [30], [31], [32], [33], 
                       //[34], [35], [36], [37], [38]
                       ];
regioes_lista.forEach(function(lista){
    var regiao = lista[0];
  anos.forEach(function(ano){
    
  //  print(regiao)
    var limite = regioesCollection.filterMetadata('mapb', "equals", regiao).geometry().bounds();
    
    
    var mosaicoTotal = mosaicoCer
                        .filterMetadata('year', 'equals', (ano))
                        .filterBounds(limite)
                        .mosaic();
  
    var mosaico1ano_antes = mosaicoCer
                      .filterMetadata('year', 'equals', ( ano - 1))
                      .filterBounds(limite)
                      .mosaic()
                      .select(['median_ndvi_dry','median_ndvi_wet']);
  
  
    var mosaico2anos_antes = mosaicoCer
                      .filterMetadata('year', 'equals', ( ano - 2))
                      .filterBounds(limite)
                      .mosaic()
                      .select(['median_ndvi_dry','median_ndvi_wet']);
                      
    var min3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('median_ndvi_dry'),
                                                  mosaico1ano_antes.select('median_ndvi_dry'),
                                                  mosaico2anos_antes.select('median_ndvi_dry')]).min();
    
    var max3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('median_ndvi_wet'),
                                                  mosaico1ano_antes.select('median_ndvi_wet'),
                                                  mosaico2anos_antes.select('median_ndvi_wet')]).max();
                                                  
    var amp3anos = max3anos.subtract(min3anos).rename('amp_ndvi_3anos');

    var ll = ee.Image.pixelLonLat().mask(bioma250mil_CE);
    
    var long = ll.select('longitude').add(34.8).multiply(-1).multiply(1000).toInt16();
    var lati = ll.select('latitude').add(5).multiply(-1).multiply(1000).toInt16();
    var entropyG = mosaicoTotal.select('median_green').entropy(square);

    var ndvi_color = '0f330f, 005000, 4B9300, 92df42, bff0bf, FFFFFF, eee4c7, ecb168, f90000';
    var visParNDFI_amp = {'min':0, 'max':60, 'palette':ndvi_color};
    Map.addLayer(amp3anos, visParNDFI_amp, 'amp3anos', true);
    
    if (ano < 1987){
       amp3anos = ee.Image(0).rename('amp_ndvi_3anos');
    }
    var mosaicoOut = amp3anos.addBands(long.rename('longitude'))
                             .addBands(lati.rename('latitude' ))
                             .addBands(entropyG.select([0],['textG']).multiply(100).int16())
                             .addBands(slope.int8().clip(limite));
        mosaicoOut = ee.Image(mosaicoOut.setMulti({"year":ano, "mapb": regiao }));                     
     print(mosaicoOut);
    
    var label ='aux_col_5_reg_'+regiao+"_ano_"+ano;
    Map.addLayer(mosaicoOut.randomVisualizer(), {}, 'mosaico', false);
    Export.image.toAsset({image:mosaicoOut,
                          description:label,
                          assetId:dirOut+label,
                          region:limite,
                          scale:30,
                          maxPixels:1e13
                          });
    });
    
});
  
  
  

// var limite = regioesCollection.filterMetadata('mapb', "equals", regiao).aside(print);
// var mySamples = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/samples_col5_CERRADO_v_5-beta-1')
//                   .filter(ee.Filter.eq("mapb", regiao))
//                   //.limit(10);
// print(mySamples.first());
// var blank = ee.Image(0).mask(0);
// var outline = blank.paint(limite, 'AA0000', 2); 
// var visPar = {'palette':'000000','opacity': 0.6};
// Map.addLayer(outline, visPar, String(regiao), false);


// var train_total = ee.FeatureCollection([]);


// for (var i_ano=0;i_ano<anos.length; i_ano++){
//   var ano = anos[i_ano];
// //  print(ano)
//   var mosaic = ee.ImageCollection(dirasset)
//                       .filterMetadata('biome', 'equals', bioma)
//                       .filterMetadata("system:index", "contains", ano )
//                       .select(ee.List(bandNames).remove("latitude").remove("longitude")
//                                                 .remove("slope").remove("textG"))
//                       .filterBounds(limite)
// //    print(mosaic.size())
//     mosaic = mosaic.mosaic().clip(limite)
    
//     mosaic = mosaic.addBands(slope.int8().clip(limite))
//     var entropyG = mosaic.select('median_green').entropy(square);
//     mosaic = mosaic.addBands(entropyG.select([0],['textG']).multiply(100).int16())
//     //Generate lat/lon image
//     var ll = ee.Image.pixelLonLat();
    
//     var long = ll.select('longitude').add(34.8).multiply(-1).multiply(1000).toInt16()
//     var lati = ll.select('latitude').add(5).multiply(-1).multiply(1000).toInt16()
    
//     mosaic = mosaic.addBands(long.rename('longitude'))
//     mosaic = mosaic.addBands(lati.rename('latitude' ))
   


//     var training_year = mosaic
// //      .addBands(ee.Image.pixelLonLat())
//       .sampleRegions({
//           'collection': mySamples,
//           'properties': ['reference', 'mapb'],
//           'scale': 30,
//           'geometries': true
//       });
//     training_year = training_year.map(function(feat) {return feat.set({'year': ano})});
    
//     train_total = train_total.merge(training_year)

// }
// print(train_total.limit(1))
// //print(train_total.size())

// Export.table.toAsset(train_total,
// 'train_col5_'+bioma+'_reg'+String(regiao)+'_v'+versao,
// dirout+bioma+'_reg'+String(regiao)+'_v'+versao
// );


















// var pts = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/MATA_ATLANTICA/SAMPLES/exp1pontos_exp1_balanceado_' + versao + '_reg')
// Map.addLayer(pts, {}, 'pt', false)

// var anos = [
// //            1985,
// //            1986,
// //            1987,1988,1989,
//             1990,1991,1992,1993,1994,
// //            1995,1996,1997,1998,1999,
// //            2000,2001,2002,2003,2004,
// //            2005,2006,2007,2008,2009,
// //            2010,2011,2012,2013,2014,
// //            2015,2016,2017,2018,2019
//             ];

// for (var i_ano=0;i_ano<anos.length; i_ano++){
//   var ano = anos[i_ano];

//   var regioes_lista = [//regiao,    3,   14,    4,     9,   12,   13,   29,   22,   33],
//       ['reg_01'],['reg_02'],['reg_03'],['reg_04'],['reg_05'],['reg_06'],['reg_07'],['reg_08'],['reg_09'],['reg_10'],['reg_11'],['reg_12'],['reg_13'],['reg_14'],['reg_15'],
//       ['reg_16'],['reg_17'],['reg_18'],['reg_19'],['reg_20'],['reg_21'],['reg_22'],['reg_23'],['reg_24'],['reg_25'],['reg_26'],['reg_27'],['reg_28'],['reg_29'],['reg_30']
//       ]
  
//   for (var i_regiao=0;i_regiao<regioes_lista.length; i_regiao++){
//     var lista = regioes_lista[i_regiao];
//     var regiao = lista[0];
//   //  print(regiao)
//     var limite = regioesCollection.filterMetadata('reg_id', "equals", regiao);
    
    
//     var mosaicoTotal = ee.ImageCollection(dirasset)
//                         .filterMetadata('biome', 'equals', bioma)
//                         .filterMetadata('year', 'equals', (ano))
//                         .filterBounds(limite)
//                         .mosaic()
  
//     var mosaico1ano_antes = ee.ImageCollection(dirasset)
//                       .filterMetadata('biome', 'equals', bioma)
//                       .filterMetadata('year', 'equals', ( ano - 1))
//                       .filterBounds(limite)
//                       .mosaic()
  
  
//     var mosaico2anos_antes = ee.ImageCollection(dirasset)
//                       .filterMetadata('biome', 'equals', bioma)
//                       .filterMetadata('year', 'equals', ( ano - 2))
//                       .filterBounds(limite)
//                       .mosaic()
                      
//     var min3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('median_ndvi_dry'),
//                                                   mosaico1ano_antes.select('median_ndvi_dry'),
//                                                   mosaico2anos_antes.select('median_ndvi_dry')]).min()
    
//     var max3anos = ee.ImageCollection.fromImages([mosaicoTotal.select('median_ndvi_wet'),
//                                                   mosaico1ano_antes.select('median_ndvi_wet'),
//                                                   mosaico2anos_antes.select('median_ndvi_wet')]).max()
//     var amp3anos = max3anos.subtract(min3anos).rename('amp_ndvi_3anos')
//     var ndvi_color = '0f330f, 005000, 4B9300, 92df42, bff0bf, FFFFFF, eee4c7, ecb168, f90000'
//     var visParNDFI_amp = {'min':0, 'max':60, 'palette':ndvi_color};
//     //Map.addLayer(amp3anos, visParNDFI_amp, 'amp3anos', true);
//     mosaicoTotal = mosaicoTotal.addBands(amp3anos)

//     var ll = ee.Image.pixelLonLat().mask(bioma250mil_MA);
    
//     var long = ll.select('longitude').add(34.8).multiply(-1).multiply(1000).toInt16()
//     var lati = ll.select('latitude').add(5).multiply(-1).multiply(1000).toInt16()
    
//     mosaicoTotal = mosaicoTotal.addBands(long.rename('longitude'))
//     mosaicoTotal = mosaicoTotal.addBands(lati.rename('latitude' ))
//     mosaicoTotal = mosaicoTotal.select(bandNames)
// //    print(mosaicoTotal)
// //    Map.addLayer(mosaicoTotal, {}, 'mosaico', false)
    
//     var pts_reg = pts.filterMetadata('reg_id', 'equals', regiao)
// //    print(pts_reg.size())
    
//     var training = mosaicoTotal.sampleRegions({
//         'collection': pts_reg,
//         'scale': 30,
//         'tileScale': 4,
//         'geometries': true
//     });
      
//     if (i_regiao == 0){ var training_reg = training }  
//     else {training_reg = training_reg.merge(training); }
//   }    
// //print(training.limit(1))
// //print(training_reg.size())

// Export.table.toAsset(training_reg, 'pontos_exp2_'+versao+'_'+ano+'_mos4_35bandas', dirout + 'pontos_exp2_'+versao+'_'+ano+'_mos4_35bandas');  

  
// }

