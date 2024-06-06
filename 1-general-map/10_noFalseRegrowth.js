// -- -- -- -- 10_noFalseRegrowth
// post-processing filter: avoid the regrowth of native forests in silviculture areas and the false regeneration of wetlands in the last years
// barbara.silva@ipam.org.br and dhemerson.costa@ipam.org.br

// Set root directory
var root = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '9';
var outputVersion = '16';

// Define input file
var inputFile = 'CERRADO_col9_gapfill_v8_incidence_v8_temporal_v8_frequency_v'+inputVersion;

// Import MapBiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8'),
    'bands': 'classification_2023'
};

// Load input classification
var classificationInput = ee.Image(root + inputFile);
print('Input classification', classificationInput);
Map.addLayer(classificationInput, vis, 'Input classification');

// Step 1: avoid the regrowth of native forests in silviculture areas
// Set a minimum number of years for the class of anthropic areas
var x = 15;
var exedent_bands = classificationInput.slice(0,(x-1)).multiply(0).rename(['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13', 'b14']);

// Iterate over the bands of the classification image
var processedClassification = classificationInput.bandNames().slice(1).iterate(function(current, previous) {
    current = ee.String(current); // Convert the current band name to a string
    previous = ee.Image(previous); // Convert the previous result to an image
    
    // Select the current band from the classification image
    var img = classificationInput.select(current); 
    
    // Check if the last x years have been classified as anthropic class (21)
    var mosaic_per_Xyears = previous.slice(-1 * x).eq(21).reduce('sum').gte(x);
    
    // Replace native forest regrowth (class 3) with anthropic (class 21) where the condition is met
    var new_img = img.where(mosaic_per_Xyears.and(img.eq(3)), 21);

    // Add the new image as a band to the previous result
    return ee.Image(previous).addBands(new_img);
  },exedent_bands.addBands(classificationInput.select(0)));

// Remove the initial empty bands used for initialization
processedClassification = ee.Image(processedClassification).slice(x - 1);

// Step 2: Remove the false regeneration of wetlands in the last years
// Function to correct the class 11 (wetlands) based on the previous years
function correctWetlands(currentYear, previousYear) {
  return currentYear.where(currentYear.eq(11), previousYear);
}

// List of years to correct
var years = ee.List.sequence({'start': 2018, 'end': 2023}).getInfo();

// Initialize the processed image with all bands of interest
var correctedClassification = processedClassification; // from step 1

// Iterate over the years applying the correction
for (var i = 1; i < years.length; i++) {
  var currentYear = years[i];
  var previousYear = years[i - 1];
  
  var currentBand = processedClassification.select('classification_' + currentYear);
  var previousBand = processedClassification.select('classification_' + previousYear);
  
  // Apply the correction
  var correctedBand = correctWetlands(currentBand, previousBand);
  
  // Replace the corrected band in the processed classification image
  correctedClassification = correctedClassification.addBands(correctedBand.rename('classification_' + currentYear), null, true);
}

// Check filtered image
print('Output classification', correctedClassification);
Map.addLayer(correctedClassification, vis, 'Corrected image');

// Export as GEE asset
Export.image.toAsset({
    'image': correctedClassification,
    'description': inputFile+ '_noFalseRegrowth_v' + outputVersion,
    'assetId': out + inputFile + '_noFalseRegrowth_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classificationInput.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
