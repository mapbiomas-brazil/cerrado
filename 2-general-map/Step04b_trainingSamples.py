## For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>
## Export yearly spectral signatures for each region and year to be used as training samples
## Exported data is composed by spatialPoints with spectral signature values grouped by column

import ee
ee.Initialize()

## define strings to use as metadata
bioma = "CERRADO"    ## biome
versao = "3"         ## version string

## define output directory
dirout = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/training_v3/'

## define surface reflectance mosaic
## landsat 5 and 8
dirasset = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics'         
## landsat 7
dirassetL7 = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics-landsat-7'

## import classification regions
regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6')

## import sample points (generated by step 3)
pts = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/samples_v3/samples_col6_CERRADO_v3')

## auxiliary mosaics (generated by the step 4A)
diraux = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/auxMosaics/aux_col_6_reg_'

## define regions to extract spectral signatures (spatial operator)
regioes_lista = [     
                        [1],  [2],  [3],  [4],  [5],  [6],  [7],  [8],  [9], [10], [11], 
                       [12], [13], [14], [15], [16], [17], [18], [19], [20], [21], [22],
                       [23], [24], [25], [26], [27], [28], [29], [30], [31], [32], [33], 
                       [34], [35], [36], [37], [38]
                       ]

## define years to extract spectral signatures (temporal operator)
anos = [   
            1985, 1986, 1987, 1988, 1989,
            1990, 1991, 1992, 1993, 1994,
            1995, 1996, 1997, 1998, 1999,
            2000, 2001, 2002, 2003, 2004,
            2005, 2006, 2007, 2008, 2009,
            2010, 2011, 2012, 2013, 2014, 
            2015, 2016, 2017, 2018, 2019, 2020
]

## surface reflectance bandnames
bandNames = ee.List([
          'blue_median', 'blue_median_wet', 'blue_median_dry', 'blue_min', 'blue_stdDev', 
          'green_median', 'green_median_dry', 'green_median_wet', 'green_median_texture', 'green_min', 'green_stdDev',
          'red_median', 'red_median_dry', 'red_min', 'red_median_wet', 'red_stdDev', 
          'nir_median', 'nir_median_dry', 'nir_median_wet', 'nir_min', 'nir_stdDev',
          'swir1_median', 'swir1_median_dry', 'swir1_median_wet', 'swir1_min', 'swir1_stdDev', 
          'swir2_median', 'swir2_median_wet', 'swir2_median_dry', 'swir2_min', 'swir2_stdDev', 
          'ndvi_median_dry', 'ndvi_median_wet', 'ndvi_median', 'ndvi_amp', 'ndvi_stdDev', 
          'ndwi_median', 'ndwi_median_dry', 'ndwi_median_wet', 'ndwi_amp', 'ndwi_stdDev',
          'evi2_median', 'evi2_median_dry', 'evi2_median_wet', 'evi2_amp', 'evi2_stdDev',
          'savi_median_dry', 'savi_median_wet', 'savi_median', 'savi_stdDev',
          'pri_median_dry', 'pri_median', 'pri_median_wet', 
          'gcvi_median', 'gcvi_median_dry', 'gcvi_median_wet', 'gcvi_stdDev',
          'hallcover_median', 'hallcover_stdDev',
          'cai_median', 'cai_median_dry', 'cai_stdDev',
          'gv_median', 'gv_amp', 'gv_stdDev', 
          'gvs_median', 'gvs_median_dry', 'gvs_median_wet', 'gvs_stdDev',
          'npv_median', 
          'soil_median', 'soil_amp', 'soil_stdDev',
          'cloud_median', 'cloud_stdDev', 
          'shade_median', 'shade_stdDev', 
          'ndfi_median', 'ndfi_median_dry', 'ndfi_median_wet', 'ndfi_amp', 'ndfi_stdDev',
          'sefi_median', 'sefi_stdDev', 'sefi_median_dry', 
          'wefi_median', 'wefi_median_wet', 'wefi_amp', 'wefi_stdDev',
          'slope'
  ])
  

## define function to perform spectral signature extraction - training samples creation
## call each region in 'regioes_lista', store in 'regiao' by 'lista' 
for lista in regioes_lista:
    regiao = lista[0]
    
    ## nested function - for each region, read each value in 'anos' and store in 'ano'
    for ano in anos:
        print ('regiao ' + str(regiao) + ' || ano ' + str(ano))
        ## subset region
        limite = regioesCollection.filterMetadata('mapb', "equals", regiao).geometry().bounds()
       
        ## when year is different of 2002 or 2012, use Landsat 5 (TM) and Landsat 8 asset
        mosaicoCer = ee.ImageCollection(dirasset)\
            .filterMetadata('biome', 'equals', bioma)\
            .filterMetadata('version', 'equals', '2')
    
        ## when year is equal to 2002 or 2012, use Landsat 7 (ETM+) asset 
        if (ano == 2012 or ano == 2002):
            mosaicoCer = ee.ImageCollection(dirassetL7)\
                .filterMetadata('biome', 'equals', bioma)\
                .filterMetadata('version', 'equals', '2')
                    
        ## import auxiliary mosaic
        mosaicoAux = ee.Image(diraux + str(regiao)+ '_ano_' + str(ano))\
            .rename(['amp_ndvi_3anos', 'textG', 'longitude',\
                     'latitude', 'slope'])
        
        ## read yearly mosaic with auxiliary data 
        mosaicoTotal = mosaicoCer.filterMetadata('year', 'equals', (ano))\
            .filterBounds(limite)\
            .mosaic()\
            .updateMask(mosaicoAux.select(1))\
            .select(bandNames.remove("slope").remove('textG').remove('latitude').remove('longitude'))
        
        ## write year as pixel values and use as a additional band
        mosaicoTotal = mosaicoTotal.addBands(mosaicoAux).addBands(ee.Image(ano).int16().rename("year"));
       
        ## subset sample point for the region i
        pts_reg = pts.filterMetadata('mapb', 'equals', regiao);
        print('number of points: ', pts_reg.size().getInfo()) ## print number of points
        
        ## extract spectral signatures 
        training = mosaicoTotal.sampleRegions(collection= pts_reg, scale= 30, geometries= True, tileScale= 2)
        
        ## remove NA or NULL from extracted data
        training = training.filter(ee.Filter.notNull(bandNames))
        
        ## export training data 
        task = ee.batch.Export.table.toAsset(training, 'train_col_6_CERRADO_reg' + str(regiao) + '_ano_' + str(ano) + '_' + versao,\
                                             dirout + 'train_col_6_CERRADO_reg' + str(regiao) + '_ano_' + str(ano) + '_' + versao)
        
        ## start task
        task.start()
        
        print ('======================')
    
print ("..end..")
