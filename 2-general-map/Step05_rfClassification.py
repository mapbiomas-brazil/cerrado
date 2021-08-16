## importar API 
import ee
ee.Initialize()

## definir strings para label 
BIOME_NAME = "CERRADO"
SAMPLES_VERSION = '3'
OUTPUT_VERSION = '6'

## definir numero de árvores para o randomForest
RF_TREES = 100

## definir anos para classificar
YEARS = [ 
    '1985', '1986', '1987', '1988', '1989', 
    '1990', '1991', '1992', '1993', '1994', 
    '1995', '1996', '1997', '1998', '1999',
    '2000', '2001', '2002', '2003', '2004',
    '2005', '2006', '2007', '2008', '2009',
    '2010', '2011', '2012', '2013', '2014',
    '2015', '2016', '2017', '2018', '2019',
    '2020'
]

## definir regiões para classificar
REGION_IDS = [ 
    '1', '2', '3', '4', '5', '6', '7', 
    '8', '9', '10', '11', '12', '13', '14',
    '15', '16', '17', '18', '19', '20', '21',
    '22', '23', '24', '25', '26', '27', '28', 
    '29', '30', '31', '32', '33', '34', '35', 
    '36', '37', '38'
]

## defininir nomes das bandas
## surface reflectance mosaic - todas as 90 bandas
#BAND_NAMES = [
#          'blue_median', 'blue_median_wet', 'blue_median_dry', 'blue_min', 'blue_stdDev', 
#          'green_median', 'green_median_dry', 'green_median_wet', 'green_median_texture', 'green_min', 'green_stdDev',
#          'red_median', 'red_median_dry', 'red_min', 'red_median_wet', 'red_stdDev', 
#          'nir_median', 'nir_median_dry', 'nir_median_wet', 'nir_min', 'nir_stdDev',
#          'swir1_median', 'swir1_median_dry', 'swir1_median_wet', 'swir1_min', 'swir1_stdDev', 
#          'swir2_median', 'swir2_median_wet', 'swir2_median_dry', 'swir2_min', 'swir2_stdDev', 
#          'ndvi_median_dry', 'ndvi_median_wet', 'ndvi_median', 'ndvi_amp', 'ndvi_stdDev', 
#          'ndwi_median', 'ndwi_median_dry', 'ndwi_median_wet', 'ndwi_amp', 'ndwi_stdDev',
#          'evi2_median', 'evi2_median_dry', 'evi2_median_wet', 'evi2_amp', 'evi2_stdDev',
#          'savi_median_dry', 'savi_median_wet', 'savi_median', 'savi_stdDev',
#          'pri_median_dry', 'pri_median', 'pri_median_wet', 
#          'gcvi_median', 'gcvi_median_dry', 'gcvi_median_wet', 'gcvi_stdDev',
#          'hallcover_median', 'hallcover_stdDev',
#          'cai_median', 'cai_median_dry', 'cai_stdDev',
#          'gv_median', 'gv_amp', 'gv_stdDev', 
#          'gvs_median', 'gvs_median_dry', 'gvs_median_wet', 'gvs_stdDev',
#          'npv_median', 
#          'soil_median', 'soil_amp', 'soil_stdDev',
#          'cloud_median', 'cloud_stdDev', 
#          'shade_median', 'shade_stdDev', 
#         'ndfi_median', 'ndfi_median_dry', 'ndfi_median_wet', 'ndfi_amp', 'ndfi_stdDev',
#          'sefi_median', 'sefi_stdDev', 'sefi_median_dry', 
#          'wefi_median', 'wefi_median_wet', 'wefi_amp', 'wefi_stdDev',
#          'slope', 'latitude', 'longitude', 'amp_ndvi_3anos', 'textG'
#]

## surface reflectance mosaic - 59 bandas selecionadas pelo featureSpace
BAND_NAMES = [
                "cai_median", "cai_median_dry", "evi2_amp", "evi2_median", "evi2_median_dry", "evi2_median_wet",
                "gcvi_median", "gcvi_median_dry", "gcvi_median_wet", "gcvi_stdDev","green_median", "green_median_wet", 
                "green_min", "gv_amp", "gv_median", "gv_stdDev","gvs_median", "gvs_median_dry", "gvs_median_wet",
                "hallcover_median","ndfi_amp", "ndfi_median", "ndfi_median_dry", "ndfi_median_wet","ndvi_median",
                "ndvi_median_dry", "ndvi_median_wet", "ndwi_amp", "ndwi_median", "ndwi_median_dry", "ndwi_median_wet",
                "nir_median", "nir_median_dry", "nir_median_wet", "nir_min","pri_median_dry", "pri_median_wet", 
                "red_median", "red_median_dry", "red_median_wet", "red_min","savi_median", "savi_median_dry", 
                "savi_median_wet", "sefi_median", "sefi_median_dry","shade_median","slope","soil_median",
                "swir1_median", "swir1_median_dry", "swir1_median_wet", "swir1_min", "swir2_median", "swir2_median_dry", 
                "swir2_median_wet", "swir2_min", "wefi_median", "wefi_median_wet", 
                'latitude', 'longitude', 'amp_ndvi_3anos', 'textG'
]

## surface reflectance mosaic - 48 bandas que eram usadas nos antigos mosaicos
#BAND_NAMES = [
#          "red_median_dry", "red_median", "swir2_median", "hallcover_median", "gv_stdDev",
#          "shade_median", "red_min", "swir1_median", "ndfi_median", "gv_amp", "nir_median_wet", 
#          "ndwi_median", "swir1_median_wet", "green_min", "gcvi_median_wet", "ndvi_median_wet", 
#          "evi2_median_wet", "ndvi_median_dry", "nir_median", "green_median", "evi2_amp", "swir1_median_dry",
#          "ndvi_median", "savi_median_dry", "nir_median_dry", "savi_median_wet", "wefi_median_wet", "evi2_median_dry",
#          "gvs_median_wet", "ndfi_median_wet", "gcvi_median", "ndfi_median_dry", "pri_median_dry", "gvs_median",
#          "red_median_wet", "ndfi_amp", "swir2_median_dry", "slope", "green_median_dry", "evi2_stdDev", "pri_median",
#          "wefi_amp", "nir_stdDev", "ndvi_amp", "ndvi_stdDev", "wefi_stdDev", "savi_stdDev"
#  ]


## definir assets
### amostras auxiliares 
ASSET_ADD = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/auxMosaics/aux_col_6_reg_'
### mosaicos da coleção 6 - surface reflectance
ASSET_MOSAICS = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics'
### mosaicos da coleção 6 - surface reflectance
ASSET_MOSAICS_L7 = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics-landsat-7'
### amostras de treinamento 
ASSET_SAMPLES = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/training_v3/train_col_6_CERRADO_reg'
### output da classificação 
ASSET_OUTPUT = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/'
### asset de regiões (vetor)
ASSET_REGIONS = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6'
### asset das regiões (raster)
ASSET_REGIONS_RASTER = "users/dhconciani/base/cerrado_regioes_c6_rasterBands"
### asset de biomas (vetor)
ASSET_BIOMESVECTOR = 'projects/mapbiomas-workspace/AUXILIAR/biomas-2019'
### asset de biomas (raster)
ASSET_BIOMESRASTER = 'projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster'


## classificação
def maskCollections(ic, reg):
    
    def maskImg (img):
        result = img.updateMask(ee.Image(reg.first()))
        return result
    
    masked = ic.map(maskImg)
    return masked

# Script
regions = ee.FeatureCollection(ASSET_REGIONS)
ic_regions = ee.ImageCollection(ASSET_REGIONS_RASTER)


for regionId in REGION_IDS:

    region = regions.filterMetadata('mapb', 'equals', int(regionId)).geometry().bounds()
    region_ras = ic_regions.filterMetadata('mapb', 'equals', regionId)
    #YEARS = DICT_YEARS[regionId]
    YEARS = YEARS
    print("region:", regionId)

    for year in YEARS:
        print("year:", year)
        time_marker = int(year) - 1985
        #print ("years since first year:", time_marker)

        mosaicAux = ee.Image(ASSET_ADD + regionId+ '_ano_' + str(year))\
            .rename([
                'amp_ndvi_3anos',
                'textG',
                'longitude',
                'latitude',
                'slope',
            ])\
            .updateMask(ee.Image(region_ras.first()))
        
        
        water = ee.FeatureCollection(ASSET_SAMPLES + regionId + '_ano_' + str(year) + '_' + SAMPLES_VERSION)\
            .filter(ee.Filter.eq("reference", 33))\
            .filter(ee.Filter.eq("slope", 0))\
            .limit(175)

        samples = ee.FeatureCollection(ASSET_SAMPLES + regionId + '_ano_' + str(year) + '_' + SAMPLES_VERSION)\
            .filter(ee.Filter.neq("reference", 33))\
            .merge(water)
        
        ## compute samples size
        
        print("number of samples:", samples.size().getInfo())
        ## create 80% subsample when size is greater than 110k  and lower than 140k
        if (samples.size().getInfo() > 110000) and (samples.size().getInfo() < 140000):
            print ('subsample of 80% performed')
            samples = samples.randomColumn().filter(ee.Filter.gt('random', 0.2))
            print("new number of samples:", samples.size().getInfo())
            
        ## create 65% subsample when size is greater than 140k and lower than 175k 
        if (samples.size().getInfo() > 140000) and (samples.size().getInfo() < 175000):
            print ('subsample of 65% performed')
            samples = samples.randomColumn().filter(ee.Filter.gt('random', 0.35))
            print("new number of samples:", samples.size().getInfo())
            
        ## create 50% subsample when size is greater than 175k 
        if (samples.size().getInfo() > 175000) and (samples.size().getInfo() < 200000):
            print ('subsample of 50% performed')
            samples = samples.randomColumn().filter(ee.Filter.gt('random', 0.5))
            print("new number of samples:", samples.size().getInfo())
            
        ## create 40% subsample when size is greater than 200k 
        if (samples.size().getInfo() > 200000):
            print ('subsample of 40% performed')
            samples = samples.randomColumn().filter(ee.Filter.gt('random', 0.6))
            print("new number of samples:", samples.size().getInfo())

        ## create conditional to import mosaics (TM/OLI for all years and ETM+ for 2012)
        if (year != '2012' and year != '2002'):
            mosaics = ee.ImageCollection(ASSET_MOSAICS)\
                .filterMetadata('biome', 'equals', 'CERRADO')\
                .filterMetadata('version', 'equals', '2')
            print ('TM/OLI')
        else:
            mosaics = ee.ImageCollection(ASSET_MOSAICS_L7)\
                .filterMetadata('biome', 'equals', 'CERRADO')\
                .filterMetadata('version', 'equals', '2')
            print ('ETM+')
          

       
        mosaicTotal = mosaics\
            .filterMetadata('year', 'equals', int(year))\

        mosaicTotal = maskCollections(mosaicTotal, region_ras)\
            .mosaic()

        mosaicTotal = ee.Image(mosaicTotal)\
            .updateMask(ee.Image(region_ras.first()))\
            .addBands(mosaicAux)\
            .select(BAND_NAMES)\
        
        #print(mosaicTotal.bandNames().getInfo())
        mosaicTotal = mosaicTotal
        # samples
        samplesTotal = samples.filter(
            ee.Filter.inList(
                "reference",
                [3, 4, 12, 15, 19, 33, 25]
            )
        )

        # classification
        classifier = ee.Classifier.smileRandomForest(numberOfTrees=RF_TREES)\
            .train(samplesTotal, 'reference', BAND_NAMES)

        classified = mosaicTotal.classify(classifier).mask(mosaicTotal.select('red_median'))

        classified = classified.rename(['classification_' + str(year)])\
            .toInt8()

        # set properties
        classified = classified\
            .set('collection', '6')\
            .set('version', int(OUTPUT_VERSION))\
            .set('biome', BIOME_NAME)\
            .set('mapb', int(regionId))\
            .set('year', int(year))
        
        ## If first year, create image, else, add bands and stack data 
        if (time_marker == 0): 
            stacked_classification = classified
         
        else: 
            stacked_classification = stacked_classification.addBands(classified)            
        
        print ('=======================================')  
        
    print ('exporting stacked classification')
    name = BIOME_NAME + "_reg_" + str(regionId) + '_85a20' + '_v_' + OUTPUT_VERSION
    
    # export to asset
    task = ee.batch.Export.image.toAsset(
        image=stacked_classification.toInt8(),
        description=name,
        assetId= ASSET_OUTPUT + name,
        scale=30,
        pyramidingPolicy={'.default': 'mode'},
        maxPixels=1e13,
        region=region
    )

    task.start()
        
    print ('------------> NEXT REGION --------->')
