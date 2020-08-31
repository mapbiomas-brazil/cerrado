var bioma = "CERRADO";
var versao = '5-beta-4'
var regiao = 1
  
var anos = [
            1985,
            1986,
            1987,1988,1989,
            1990,1991,1992,1993,1994,
            1995,1996,1997,1998,1999,
            2000,
            2001,2002,2003,2004,
            2005,2006,2007,2008,2009,
            2010,2011,2012,2013,2014,
            2015,2016,2017,2018,2019
]

var bandNames = ee.List([
  "median_red_dry", "median_red", "median_hallcover", "median_swir2", 
          "stdDev_gv", "median_shade", "min_red", "median_swir1", "median_ndfi", 
          "amp_gv", "median_nir_wet", "median_ndwi", "median_swir1_wet", 
          "min_green", "median_gcvi_wet", "median_green_dry", "median_ndvi_wet", 
          "median_evi2_wet", "median_ndvi_dry", "median_nir", "median_green", 
          "amp_evi2", "stdDev_evi2", "median_swir1_dry", "median_pri", 
          "median_ndvi", "min_nir", "median_savi_dry", "median_nir_dry", 
          "median_savi_wet", "median_wefi_wet", "median_evi2_dry", "median_gvs_wet", 
          "median_ndfi_wet", "median_gcvi", "amp_wefi", "median_ndfi_dry", 
          "stdDev_savi", "stdDev_nir", "median_pri_dry", "amp_ndvi", "median_gvs", 
          "stdDev_ndvi", "median_red_wet", "stdDev_wefi", "amp_ndfi", "median_swir2_dry",
          "slope",'textG', 'latitude', 'longitude'
  ]);
  

//Kernel used to compute entropy  
var square = ee.Kernel.square({radius: 5}); 
  
var slope = ee.Terrain.slope(ee.Image("JAXA/ALOS/AW3D30_V1_1").select("AVE")).rename("slope");
var dirasset = 'projects/mapbiomas-workspace/MOSAICOS/workspace-c3';
var diraux = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/aux_col_5/aux_col_5_reg_';
var pts = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/samples_col5_CERRADO_v_5-beta-1');
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/';
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/reg_b15_cerr_c5');
var biomes = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-raster-41');
var bioma250mil_CE = biomes.mask(biomes.eq(3));

print(pts.limit(5))

var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var mosaicoCer = ee.ImageCollection(dirasset)
                        .filterMetadata('biome', 'equals', bioma);
var colecReg = ee.FeatureCollection([]);

  
  var regioes_lista = [
                       //[1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], 
                       //[12], [13], [14], [15], [16], [17], [18], [19], [20], [21], [22],
                       //[23], [12], [25], [26], [27], [28], [29], [30], [31], [32], [33], 
                       //[34], [35], [36], [37], [38]
                       ];
regioes_lista.forEach(function(lista){
  anos.forEach(function(ano){
    
    var regiao = lista[0];
  //  print(regiao)
    var limite = regioesCollection.filterMetadata('mapb', "equals", regiao).geometry().bounds();
    
    var mosaicoAux = ee.Image(diraux + String(regiao)+ '_ano_' + String(ano))
                        .rename([
                'amp_ndvi_3anos',
                'textG',
                'longitude',
                'latitude',
                'slope',
            ]);
    
    var mosaicoTotal = mosaicoCer
                        .filterMetadata('year', 'equals', (ano))
                        .filterBounds(limite)
                        .mosaic()
                        .updateMask(mosaicoAux.select(0))
                        .select(bandNames.remove("slope").remove('textG').remove('latitude').remove('longitude'));
  
    mosaicoTotal = mosaicoTotal.addBands(mosaicoAux).addBands(ee.Image(ano).int16().rename("year"));
    print(mosaicoTotal.bandNames());
    // Map.addLayer(mosaicoTotal, {}, 'mosaico', false);
    
    var pts_reg = pts.filterMetadata('mapb', 'equals', regiao);
    print(pts_reg.size());
    
    var training = mosaicoTotal.sampleRegions({collection:pts_reg,
                                               scale:30,
                                               geometries:true,
                                               tileScale:2
    });
    
    training = training.filter(ee.Filter.notNull(bandNames));
  // print(training.size());
  // print(training.first());
  
  
  // Export.table.toAsset(training,
  //                     'train_col_5_CERRADO_reg'+ regiao+'_'+ano+'_v_'+versao+'_51b',
  //                     dirout + 'train_col_5_CERRADO_reg'+ regiao+'_'+ano+'_v_'+versao+'_51b');
  colecReg = colecReg.merge(training);
   print(colecReg.size());
   print(colecReg.first());
  });  

    Export.table.toAsset(colecReg,
                      'train_col_5_CERRADO_reg'+regiao+'_v_'+versao+'_51b',
                      dirout + 'train_col_5_CERRADO_reg'+ regiao+'_v_'+versao+'_51b');
});
  
