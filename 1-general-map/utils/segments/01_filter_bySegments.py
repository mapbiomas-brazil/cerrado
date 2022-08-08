## filter outliers from stable samples by using segmentation, percentil reducer and sorting new samples
## for any issue or bug, write to dhemerson.costa@ipam.org.br and/or wallace.silva@ipam.org.br
## mapbiomas collection 7

## import api
import ee
import pandas as pd 

ee.Initialize()

## define bands to be used in the segmentation 
segment_bands = ["blue_median", "green_median", "red_median", "nir_median", "swir1_median", "swir2_median"];

## define directory to export new samples
dirout = 'users/dh-conciani/collection7/sample/filtered_points/byCarta/';

## define output version
version = '3';

##  import datasets 
##  stable samples from collection 6.0 
stable_pixels = ee.Image('users/dh-conciani/collection7/masks/cerrado_stablePixels_1985_2020_v1')\
     .remap([3, 4, 5, 11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],\
            [3, 4, 3, 12, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33]);

## mapbiomas classification
mapbiomas = stable_pixels

## unfiltered sample points (generated from stable pixels)
sample_points = ee.FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v3');

## landsat mosaic for the year of 2020 
landsat = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')\
    .filterMetadata('biome', 'equals', 'CERRADO')\
    .filterMetadata('year', 'equals', 2020)\
    .mosaic();

## import cerrado vector 
cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')\
    .filterMetadata('Bioma', 'equals', 'Cerrado');

## import ibge cartas and filter to cerrado 
cartas = ee.FeatureCollection("projects/mapbiomas-workspace/AUXILIAR/cartas")\
    .filterBounds(cerrado);

## create a list of values to iterate              
summary = cartas.aggregate_array('grid_name')\
    .remove('SG-21-X-B')\
    .getInfo();
#    .slice(0,1)

# for each carta[i] in summary
for carta_i in summary:
    ## start index
    print ('Processing: ' + carta_i)    
    ## select carta_i
    carta = cartas.filterMetadata('grid_name', 'equals', carta_i);
    ## convert carta_i feature to image 
    carta_mask = ee.Image(0).mask(0).paint(carta);
    
    ## mask landsat mosaic
    landsat_i = landsat.updateMask(carta_mask.eq(0));
    
    ## mask mapbiomas classification 
    mapbiomas_i = mapbiomas.updateMask(carta_mask.eq(0));
    
    ## filter bounds of the points 
    sample_points_i = sample_points.filterBounds(carta);
   
    ## compute the number of points
    in_number = sample_points_i.size().getInfo()
    print ('Input points: ' + str(in_number))
    
    ## define function to create segments  
    def getSegments (image, size, compactness, connectivity, neighborhoodSize):
        ## create seeds
        seeds = ee.Algorithms.Image.Segmentation.seedGrid(size, 'square'); 
        
        ## create segments
        snic = ee.Algorithms.Image.Segmentation.SNIC(
            image,
            size,
            compactness,
            connectivity,
            neighborhoodSize,
            seeds
            );

        ## paste properties
        snic = ee.Image(
            snic.copyProperties(image)\
            .copyProperties(image, ['system:footprint'])\
            .copyProperties(image, ['system:time_start']));
        
        ## out
        return snic.select(['clusters'], ['segments']);
    
    ## create segments
    segments = getSegments(image= landsat_i.select(segment_bands),
                           size= 12,
                           compactness= 1,
                           connectivity= 8,
                           neighborhoodSize= 24 #(2 * size)
                           ).reproject('EPSG:4326', None, 30);  
    
    ## define function to select only segments that overlaps sample points
    def selectSegments (properties, scale, segments_i, validateMap, samples):
        ## extract training sample class 
        samplesSegments = segments_i.sampleRegions(
          samples, 
          properties,
          scale 
      );
        
        ## extract segment ids and reference class
        segmentsValues = ee.List(
            samplesSegments.reduceColumns(
                ee.Reducer.toList().repeat(2),
                ['reference', 'segments']).get('list')
            );
        
        
        ## label segments with reference class
        similiarMask = segments_i.remap(
            ee.List(segmentsValues.get(1)),
            ee.List(segmentsValues.get(0)),
            0
            );
        
        return similiarMask.rename(['class']);
    
    ## apply function to select segments 
    selectedSegments = selectSegments(segments_i= segments,
                                      samples= sample_points_i,
                                      properties= ['reference'],
                                      scale= 30,
                                      validateMap= mapbiomas_i
                                      );    
  
    ## mask and rename 
    selectedSegments = selectedSegments.selfMask().rename(['reference']);     
    
    ## create percentil rule (crashes here - needs to select all classes, not only forest)
    percentil = segments.addBands(mapbiomas_i).reduceConnectedComponents(ee.Reducer.percentile([5, 95]), 'segments');
        
    ## validate and retain only segments with satifies percentil criterion
    validated = percentil.select(0).multiply(percentil.select(0).eq(percentil.select(1)));  
    
    ## mask and rename 
    selectedSegmentsValidated = selectedSegments.mask(selectedSegments.eq(validated)).rename('reference');
    
    ## define function to generate new samples based on validated segments
    def getNewSamples (image, extent):
        ## sort points 
        newSamples = image\
            .sample(
                region= extent.geometry(),
                scale= 30,
                factor= 0.022, # select 2.2% of the validated pixels as new samples
                seed= 1,
                dropNulls= True, 
                geometries= True 
        );
        
        return newSamples
    
    ## apply function to generate new points
    new = getNewSamples(image= selectedSegmentsValidated, 
                        extent= carta)  
      
    ## build exportation
    task = ee.batch.Export.table.toAsset(new,
                                         str(carta_i) + '_' + 'v' + str(version),\
                                         dirout + str(carta_i) + '_' + 'v' + str(version)) 
    
    ## export
    task.start()
    print ('done! ======================= > next')
    ## @ end of for @ ##
    
