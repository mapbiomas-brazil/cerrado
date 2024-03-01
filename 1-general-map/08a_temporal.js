// -- -- -- -- 08a_temporal
// temporal filter [step A] - cerrado biome 
// felipe.lenti@ipam.org.br


// This variable holds the version of the code being used
var input_version = "5";//all classes, 2yrs before and 2 yrs after
var output_version = "14";//all classes, 2yrs before and 2 yrs after
//(plus year of first detection) for secondary vegetation detection
//and 2yrs before and 1 yr after for deforestation (plus year of detection)

// This variable holds the output location for the results of the code
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/';

// This variable holds the location of the raster image for the biomes limits
var assetBiomes = 'projects/mapbiomas-workspace/AUXILIAR/biomas-raster-41';


// Load the biomes raster image
var biomes = ee.Image(assetBiomes).eq(4).selfMask();

//Map.addLayer(biomes)

//  The main input is the MapBiomas Collection as a multiband
var asset = root + 'CERRADO_col8_gapfill_incidence_v' + input_version;
var imgInput = ee.Image(asset).updateMask(biomes);
print ("input image", imgInput);

// Define the parameters for the temporal filter execution
var params = {
  version: output_version,
  // Mapbiomas classification that should be considered
  asset: imgInput,
   classes: {
    // Mapbiomas classes (col8)
    mapbiomas: [
      3, 4, 5,//forest, savnna, mangrove
      11, 12, 13,//wetlands, grasslands and other non-forest formation
      15,//pasture
      0,//saltflat
      19, 39, 20, 40, 62, 41, 36, 46, 47, 48,//agriculture
      9,//planted forest
      21,//mosaic of uses
      23, 24, 30, 25,//non vegetated areas
      33, 31, //water bodies
      27 //non observed
    ], 
    
    // The expected output classes of the mapAggregation method:
    //1 = anthropic use; 2 = natural vegetation; 0 = not vegetated classes
    aggregate: [
      2, 2, 2,//forest, savnna, mangrove
      2, 2, 2,//wetlands, grasslands and other non-forest formation
      1,//pasture
      7,//saltflat
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1,//agriculture
      1,//planted forest
      1,//mosaic of uses
      1, 1, 1, 1,//non vegetated areas
      7, 7, //water bodies
      7 //non observed
    ],
  },
  startYear: 2021, // The most recent year to be processed
  endYear: 1987, // The least recent year to be processed
  consolidation: {
    deforestation: 2, // Number of years to consolidate a deforestation
    regeneration: 3, // Number of years to consolidate a regeneration
    past: 2, // Number of previous consistent years to validate a transition
  },
  addMap: {
    years: [2019],
    visualizationLULC: {
      'min': 0,
      'max': 49,
      'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')},
    },
    visualizationAggr: {
      'min': 1, 'max': 7,
      'palette': ['fff6bf', '127622', '56d117', 'ea1c1c', '6fc4b7', 'magenta', '8c8c8c']
      
    },
};

//Function to facilitate filtering by year: start must be greater than end
var yearFilter = function (startY, endY) {
    return ee.Filter.and(
        ee.Filter.gte('year', startY),
        ee.Filter.lte('year', endY)
    );
};

//Function to mutate an ImageCollection to a multiband Image
var collection2multiband = function (collection) {

      var imageList = collection.toList(collection.size()).slice(1);
    
      var multiBand = imageList.iterate(
          function (band, image) {
    
              return ee.Image(image).addBands(ee.Image(band));
          },
          ee.Image(collection.first())
      );
    
      return ee.Image(multiBand);
};

// Function to convert a multiband image into an image collection
function mapbiomasToCollection(multiband, yearList){
  // Get the list of band names
  var col = ee.ImageCollection([]);
  var result  = yearsList.map(function(y){
    y = ee.Number(y).int();
    var band = multiband.select([ee.String("classification_").cat(ee.String(y))]);
    return band.set({"year": y});
  });
    return  ee.ImageCollection.fromImages(result);
}

// Function to get an image for a specific year from an ImageCollection
var imageOfYear = function (mapbiomasAggregate, year) {
    return ee.Image(mapbiomasAggregate.filterMetadata('year', 'equals', year).first());
};

// Function to aggregate a classification map over multiple years
var mapAggregation = function (classification, yearsList, bandNamePrefix, inputClasses, outputClasses) {
    var aggregateImages = ee.List(yearsList).map(function (year) {
        year = ee.Number(year).int();
        var reclass = classification.select(ee.String(bandNamePrefix).cat(ee.String(year)));
        reclass = reclass.remap(inputClasses, outputClasses, 0);
        reclass = reclass.rename(["classification"]);
        reclass = reclass.set({'year': year});
        
        return ee.Image(reclass);
    });
    
    return ee.ImageCollection.fromImages(aggregateImages).sort("year", false);
};


// Assign parameters to local variables for easier access
var asset = params.asset;
var aggregateClasses = params.classes.aggregate;
var mapbiomasClasses = params.classes.mapbiomas;
var startYear = ee.Number(params.startYear);
var endYear = ee.Number(params.endYear);
var defConsolidationTime = ee.Number(params.consolidation.deforestation);
var regConsolidationTime = ee.Number(params.consolidation.regeneration);
var pastConsolidationTime = ee.Number(params.consolidation.past);
var visualizationAggr = params.addMap.visualizationAggr;
var visualizationLULC = params.addMap.visualizationLULC;
var yearsToShow = params.addMap.years;

// Create a list of years between the start and end year
var yearsList = ee.List.sequence(2022, 1985, -1);
print("ordered years list for algorithm", yearsList);

//Tranform MapBiomas LULC series into a collection

var lulc = mapbiomasToCollection(asset, yearsList);

print("LULC MapBiomas as collection", lulc);

// Call a custom function to aggregate the MapBiomas data, returning an Image Collection
var mapbiomasAggregate = mapAggregation(asset,
                                        yearsList,
                                        "classification_",
                                        mapbiomasClasses,
                                        aggregateClasses);
//This is an ImageCollection
print("complete series for aggregated input", mapbiomasAggregate);

//Transform MapBiomas aggregated ImageCollection to a multibband Image and rename bands
var mapbiomasAggregateBands = collection2multiband(
  mapbiomasAggregate.map(function(img){
  var year = img.get("year");
  return img.rename(ee.String("classification_").cat(ee.String(year)));
}));
print("complete series for MapBiomas Aggregated as multiband",mapbiomasAggregateBands);

// Initialize an image with 0s for further processing
var product = ee.Image(0);

// The basemap in this version is the 2021 LULC map
var basemap = imageOfYear(lulc, startYear.add(1)).remap([3, 4, 11, 12, 15, 19, 21, 25, 33],
               [3, 4, 11, 12, 21, 21, 21, 25, 33]).rename("classification_2022"); 
print("basemap 2022", basemap);


// Use the mapbiomas LULC ImageCollection and iterate over it
// to to detect transition events and check their temporal consistency 

var product = lulc.filter(yearFilter(endYear, startYear))
                                .iterate(
    function (image, previousStepLULC) {
      
        //Get the year of the current image from the "year" property.
        var    year = ee.Number(image.get("year")).int();
        
        //Get a list with all years processed so far
        var yearsDone = ee.List.sequence(startYear.add(1), year.add(1), -1);
        
        //Convert the "previous" object to an ee.Image, so that we can manipulate it.
        previousStepLULC = ee.Image(previousStepLULC);
        
        //Extract the last band of the "previous" object, which corresponds to the
        //the next year in chronological sequence
        var mapFromLastStepLULC = previousStepLULC.slice(-1).remap([3, 4, 11, 12, 15, 19, 21, 25, 33],
               [3, 4, 11, 12, 21, 21, 21, 25, 33]).rename(ee.String('classification_')
                                     .cat(ee.String(year.add(1).int())));
        
        //Aggregate the original LULC classes
        var previousStep = mapAggregation(previousStepLULC,
                                        yearsDone,
                                        "classification_",
                                        mapbiomasClasses,
                                        aggregateClasses);
                           
            previousStep = collection2multiband(previousStep);

        // result from the previous iteration.
        var mapFromLastStep = mapFromLastStepLULC.remap(mapbiomasClasses, aggregateClasses)
                                                 .rename(mapFromLastStepLULC.bandNames().getString(0))
                                                 .toByte();
        //
        var imageAgg = image.remap(mapbiomasClasses, aggregateClasses)
                                                 .rename(ee.String('product_')
                                                 .cat(ee.String(year))).toByte();
                                                 
        //Number of bands expected in the result (original number of bands minus first and last years)
        var bandNumsResult = mapbiomasAggregateBands.slice(1,-1).bandNames().size();
        
        // Counter for number of bands processed so far
        var bandNum = ee.Number(previousStepLULC.bandNames().size()).int();
        
        // Counter for index of bands processed so far
        //adjusted for processing past consolidation
        var pastBandNum = ee.List([bandNum.int(),//1-35
                                   ee.Number(bandNumsResult).subtract(1)])//=35
                            .reduce(ee.Reducer.min());
            pastBandNum = ee.Number(pastBandNum).int(); 
        // The aggregated map for the next step (year-1)
        var mapAggrNextStep = imageOfYear(mapbiomasAggregate, year.subtract(1));
        
        // All mapped events of deforestation and secondary vegetation
        var def = mapAggrNextStep.eq(2).and(imageAgg.eq(1)) ;
        var reg = mapAggrNextStep.eq(1).and(imageAgg.eq(2));
        
        var others = image.updateMask(imageAgg.eq(7));
        
        var defConsolidation = previousStep
                .slice(bandNum.subtract(defConsolidationTime.subtract(1)))// = last band from previousstep
                .eq(1)
                .reduce(ee.Reducer.sum())
                .eq(defConsolidationTime.subtract(1));

        var defConsolidationPast = mapbiomasAggregateBands.slice(1,-1)
                .slice(pastBandNum, pastBandNum.add(pastConsolidationTime.subtract(1)))
                .eq(2)
                .reduce(ee.Reducer.sum())
                .eq(pastConsolidationTime);
        
        var defConsolidated = def.and(defConsolidation);
        var defConfirmed = defConsolidated.and(defConsolidationPast);
            
        var defDenied = def.and(defConfirmed.not());
        
        //Calculate secondary vegetation event image
        var regConsolidation = previousStep
                .slice(bandNum.subtract(regConsolidationTime.subtract(1)))
                .eq(2)
                .reduce(ee.Reducer.sum())
                .eq(regConsolidationTime.subtract(1));
        //This is for debugging 
        //    regConsolidation = ee.Image(1);
            
            
        // Calculate secondary vegetation consolidation in past images
        var regConsolidationPast = mapbiomasAggregateBands.slice(1,-1)
                .slice(pastBandNum, pastBandNum.add(pastConsolidationTime.subtract(1)))
                .eq(1)
                .reduce(ee.Reducer.sum())
                .eq(pastConsolidationTime);

        // Convert regEvent to an ee.Image object
        var regConsolidated = reg.and(regConsolidation);
        var regConfirmed = regConsolidated.and(regConsolidationPast);
        var regDenied = reg.and(regConfirmed.not());                  
       
        //Computing the resulting map for focal year, based on detections and corrections
         var testExceptionReg = mapFromLastStep.eq(2)
                                               .and(reg).and(regConsolidated.not());
                                               
        var selectedBandsPreviousStepLULC = previousStepLULC.bandNames()
                                            .filter(ee.Filter.neq(
                                            'item', previousStepLULC.bandNames().slice(-1).getString(0))
                                            );
            selectedBandsPreviousStepLULC = ee.List(selectedBandsPreviousStepLULC);                                
            previousStepLULC = previousStepLULC.select(selectedBandsPreviousStepLULC);
            mapFromLastStepLULC = mapFromLastStepLULC
                                  .where(testExceptionReg, 21);
                              
            
            previousStepLULC = previousStepLULC.addBands(mapFromLastStepLULC);
            

        var newBasemap = image.where(defDenied.and(defConsolidated), image)
                              .where(defDenied.and(defConsolidated.not()), mapFromLastStepLULC)
                              .where(regDenied.and(regConsolidated), image)
                              .where(regDenied.and(regConsolidated.not()), mapFromLastStepLULC);
            
            newBasemap = newBasemap.where(regDenied.eq(1), mapFromLastStepLULC);
            newBasemap = ee.Image(newBasemap).blend(others);
            
        var product_year = newBasemap.rename(ee.String('classification_')
                                     .cat(ee.String(year))).toByte();
        
        return (previousStepLULC.addBands(product_year));
        }, basemap
);

var product = ee.Image(product).set("version", params.version);
    product = product.addBands(asset.select(
      ["classification_1986", "classification_1985"]));
var bandsReversed = product.bandNames().reverse();
    product = product.select(bandsReversed);
print("product", product);

var totalDif = asset
              .neq(product)
              .reduce(ee.Reducer.sum())
              .neq(0)
              .selfMask();

for(var i in yearsToShow) {
    
    var year = yearsToShow[i];
    var filtered = product.select('classification_'+year);
    var unfiltered = asset.select('classification_'+year)
    .remap([3, 4, 11, 12, 15, 19, 21, 25, 33],
           [3, 4, 11, 12, 21, 21, 21, 25, 33]);
                                  
    Map.addLayer(unfiltered, visualizationLULC, 'old_classification_'+year, true);
    Map.addLayer(filtered, visualizationLULC, 'new_classification_'+year, true);
    Map.addLayer(filtered.neq(unfiltered).selfMask(), {palette:["magenta"]}, 'difference_'+year, true);
}
  //Map.addLayer(totalDif, {palette:["magenta"]}, "total difference");

print ("output_image", product);

// export as GEE asset
Export.image.toAsset({
    'image': product,
    'description': 'CERRADO_col8_gapfill_incidence_temporal_step-a_v' + params.version,
    'assetId': out + 'CERRADO_col8_gapfill_incidence_temporal_step-a_v' + params.version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': imgInput.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
