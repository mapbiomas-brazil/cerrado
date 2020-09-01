#
import ee

ee.Initialize()

# Assets
ASSET_ADD = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/aux_col_5/aux_col_5_reg_'
ASSET_MOSAICS = 'projects/mapbiomas-workspace/MOSAICOS/workspace-c3'
ASSET_SAMPLES = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/train_col_5_CERRADO_reg'
ASSET_OUTPUT = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test'
ASSET_REGIONS = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/reg_b15_cerr_c5'
ASSET_REGIONS_RASTER = "projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/rasters_reg_b15_cerrado_c5"
ASSET_BIOMESVECTOR = 'projects/mapbiomas-workspace/AUXILIAR/biomas-raster-41'
ASSET_BIOMESRASTER = 'projects/mapbiomas-workspace/AUXILIAR/biomas_IBGE_250mil'


# User constants
BIOME_NAME = "CERRADO"

SAMPLES_VERSION = 'beta-4'

OUTPUT_VERSION = 'beta-8_53b'

RF_TREES = 100

YEARS = [
    '1985', '1986', '1987', '1988',
    '1989', '1990', '1991', '1992',
    '1993', '1994', '1995', '1996',
    '1997', '1998', '1999', '2000',
    '2001', '2002', '2003', '2004',
    '2005', '2006', '2007', '2008',
    '2009', '2010', '2011', '2012',
    '2013', '2014', '2015', '2016',
    '2017', '2018', '2019'
]

TILES = [
  "SF-23-V-D",
  "SF-23-X-A",
  "SF-23-V-B",
  "SE-23-Y-D",
  "SE-23-Z-C",
  "SE-23-Z-D",
  "SE-23-Z-A",
  "SE-23-Y-B",
  "SE-23-X-C",
  "SE-23-V-D",
  "SE-23-V-B",
  "SE-23-X-A",
  "SE-23-X-D",
  "SE-23-Z-B",
  "SE-23-X-B",
  "SD-23-X-B",
  "SD-23-X-D",
  "SD-24-Y-A",
  "SD-23-Z-B",
  "SD-24-Y-C",
  "SE-24-V-A",
  "SD-23-Z-D",
  "SD-23-Z-A",
  "SD-23-Z-C",
  "SD-23-Y-D",
  "SD-23-Y-B",
  "SD-23-X-C",
  "SD-23-V-D",
  "SD-23-V-B",
  "SD-23-X-A",
  "SC-23-Z-C",
  "SC-23-Y-D",
  "SC-23-Z-A",
  "SC-23-Y-B",
  "SC-23-X-C",
  "SC-23-V-D",
  "SB-23-Z-D",
  "SB-23-Z-C",
  "SC-23-X-A",
  "SC-23-V-B",
  "SB-23-Y-D",
  "SB-23-Y-B",
  "SB-23-Z-A",
  "SB-23-Z-B",
  "SB-23-X-D",
  "SB-23-X-C",
  "SB-23-V-D",
  "SB-23-X-A",
  "SB-23-V-B",
  "SA-23-Z-C",
  "SB-23-X-B",
  "SA-23-Z-D",
  "SB-24-V-C",
  "SB-24-V-A",
  "SA-24-Y-C",
  "SB-24-Y-A",
  "SA-24-Y-A",
  "SA-23-Z-B",
  "SA-23-Z-A",
  "SB-22-X-D",
  "SB-23-V-C",
  "SB-23-Y-A",
  "SB-23-Y-C",
  "SB-22-Z-D",
  "SC-22-X-B",
  "SB-22-Z-B",
  "SB-22-Z-C",
  "SC-22-X-A",
  "SD-21-X-B",
  "SD-21-X-D",
  "SD-22-V-C",
  "SC-22-Y-B",
  "SC-22-Y-D",
  "SD-22-V-B",
  "SD-22-V-D",
  "SC-22-Z-C",
  "SD-22-X-A",
  "SC-22-Z-A",
  "SC-22-X-C",
  "SC-22-X-D",
  "SC-22-Z-B",
  "SC-23-V-C",
  "SC-23-Y-A",
  "SC-23-V-A",
  "SC-23-Y-C",
  "SD-23-V-A",
  "SD-22-X-B",
  "SC-22-Z-D",
  "SD-22-X-C",
  "SD-22-X-D",
  "SD-22-Z-A",
  "SD-22-Z-B",
  "SD-22-Z-C",
  "SD-22-Z-D",
  "SD-23-Y-A",
  "SD-23-V-C",
  "SD-23-Y-C",
  "SE-23-V-A",
  "SE-23-V-C",
  "SE-22-X-B",
  "SE-22-X-D",
  "SE-22-X-A",
  "SE-22-X-C",
  "SE-22-V-D",
  "SE-22-V-B",
  "SE-22-Y-B",
  "SE-22-Y-A",
  "SE-22-V-C",
  "SE-22-V-A",
  "SD-22-Y-D",
  "SD-22-Y-C",
  "SD-22-Y-B",
  "SD-22-Y-A",
  "SE-21-X-B",
  "SD-21-Z-D",
  "SD-21-Z-B",
  "SE-21-X-D",
  "SE-21-Z-B",
  "SE-21-Z-C",
  "SE-21-X-A",
  "SE-21-V-B",
  "SE-21-Y-D",
  "SD-21-Y-C",
  "SD-21-Y-D",
  "SD-21-Y-A",
  "SD-21-Y-B",
  "SD-21-V-D",
  "SD-21-X-C",
  "SD-21-Z-A",
  "SD-21-Z-C",
  "SD-21-X-A",
  "SD-21-V-B",
  "SC-21-Y-D",
  "SC-21-Y-C",
  "SD-20-X-B",
  "SD-21-V-A",
  "SD-21-V-C",
  "SG-21-X-B",
  "SF-21-Z-C",
  "SF-21-Z-D",
  "SF-21-Z-A",
  "SF-21-Z-B",
  "SF-21-X-C",
  "SF-21-X-D",
  "SF-21-Y-B",
  "SF-21-V-D",
  "SF-21-V-B",
  "SF-21-X-A",
  "SF-21-X-B",
  "SE-21-Z-D",
  "SE-22-Y-C",
  "SF-22-V-A",
  "SF-22-V-C",
  "SF-22-Y-A",
  "SF-22-V-D",
  "SF-22-V-B",
  "SF-22-Y-B",
  "SF-22-Z-A",
  "SF-22-Z-C",
  "SF-22-X-A",
  "SE-22-Z-C",
  "SE-22-Z-A",
  "SE-22-Y-D",
  "SE-22-Z-B",
  "SE-22-Z-D",
  "SF-22-X-B",
  "SE-23-Y-A",
  "SE-23-Y-C",
  "SF-23-V-A",
  "SF-23-V-C",
  "SF-23-Y-A",
  "SF-22-X-D",
  "SF-22-Z-B",
  "SF-22-Z-D",
  "SG-22-X-A",
  "SG-22-X-B",
  "SF-23-Y-C"
]

BAND_NAMES = [
    'median_pri_dry',
    'median_nir',
    'stdDev_wefi',
    'median_swir2_dry',
    'amp_evi2',
    'median_swir1_dry',
    'median_pri',
    'stdDev_savi',
    'median_nir_wet',
    'median_red_wet',
    'stdDev_evi2',
    'median_ndvi',
    'median_ndvi_wet',
    'median_evi2_wet',
    'median_red',
    'median_shade',
    'stdDev_ndvi',
    'median_hallcover',
    'median_ndfi_dry',
    'min_green',
    'min_nir',
    'median_savi_dry',
    'amp_wefi',
    'median_gvs',
    'median_swir1',
    'median_gvs_wet',
    'min_red',
    'median_ndwi',
    'median_gcvi_wet',
    'median_green',
    'median_swir1_wet',
    'median_swir2',
    'stdDev_gv',
    'median_wefi_wet',
    'median_ndfi',
    'median_green_dry',
    'amp_ndvi',
    'median_red_dry',
    'median_nir_dry',
    'stdDev_nir',
    'median_gcvi',
    'amp_gv',
    'median_ndfi_wet',
    'amp_ndfi',
    'median_evi2_dry',
    'median_savi_wet',
    'median_ndvi_dry',
    'latitude',
    'longitude',
    'amp_ndvi_3anos',
    'textG',
    'slope'

]
#new biome regions
#1,15,16,2,25,29,37,5,6
REGION_IDS = [
    
    
    
    #"2", "1", "25",
    
  #"15", "16",
    
    #"29","37",
    
    "5","6"
    
    
    
    #conta1
    #"1",
    #"10",
    #"14",
    #"15",
    #"16",
    #"17",
    #"18",
    
    #conta2
    # "19",
    # "2",
    # "24",
    # "25",
    # "26",
    # "27",
    # "28",
    

    #conta4
    # "3",
    # "30",
    # "31",
    # "32",
    # "33",
    # "34",
    # "35",
    

    #conta5
    # "38",
    # "4",
    # "8",
    # "9",
    # "36",
    # "37",
    # "29",
]


def maskCollections(ic, reg):
    
    def maskImg (img):
        result = img.updateMask(ee.Image(reg.first()))
        return result
    
    masked = ic.map(maskImg)
    return masked

# Script
regions = ee.FeatureCollection(ASSET_REGIONS)
ic_regions = ee.ImageCollection(ASSET_REGIONS_RASTER)
mosaics = ee.ImageCollection(ASSET_MOSAICS)\
            .filter(ee.Filter.inList("grid_name", TILES))


for regionId in REGION_IDS:

    region = regions.filterMetadata('mapb', 'equals', int(regionId)).geometry().bounds()
    region_ras = ic_regions.filterMetadata('mapb', 'equals', int(regionId))
    #YEARS = DICT_YEARS[regionId]
    YEARS = YEARS

    for year in YEARS:
        print(year, regionId)

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

        print(samples.size().getInfo())

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
        classifier = ee.Classifier.randomForest(numberOfTrees=RF_TREES)\
            .train(samplesTotal, 'reference', BAND_NAMES)

        classified = mosaicTotal.classify(classifier).mask(mosaicTotal.select('median_red'))

        classified = classified.rename(['classification_' + str(year)])\
            .toInt8()

        # set properties
        classified = classified\
            .set('collection', '5')\
            .set('versao', OUTPUT_VERSION)\
            .set('biome', BIOME_NAME)\
            .set('mapb', int(regionId))\
            .set('year', int(year))

        name = "classification-5-cerrado-region-" + str(regionId) + '-year-' + str(year) + '_v_' + OUTPUT_VERSION

        # export to asset
        task = ee.batch.Export.image.toAsset(
            image=classified.toInt8(),
            description=name,
            assetId=ASSET_OUTPUT + '/' + name,
            scale=30,
            pyramidingPolicy={'.default': 'mode'},
            maxPixels=1e13,
            region=region
        )

        task.start()

