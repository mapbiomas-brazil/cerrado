// -- -- -- -- 06_gapFill
// post-processing - fill gaps (nodata) with data from previous years
// barbara.silva@ipam.org.br

// Set the cerrado extent 
var geometry = 
    ee.Geometry.Polygon(
        [[[-61.23436115564828, -1.2109638051779688],
          [-61.23436115564828, -26.098552002927054],
          [-40.31639240564828, -26.098552002927054],
          [-40.31639240564828, -1.2109638051779688]]], null, false);

// Set root directory
var input = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-MAP';
var out = 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-POST/';

// Set metadata
var inputVersion = '4';
var outputVersion = '4';

// Import MapBiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

// Load input classification
var classificationInput = ee.ImageCollection(input)
            .filterMetadata('version', 'equals', inputVersion)
            .mosaic();
            
Map.addLayer(classificationInput.select(['classification_2022']), vis, 'Input classification');

// Discard zero pixels in the image
classificationInput = classificationInput.mask(classificationInput.neq(0));
print('Input classification', classificationInput);

// Set the list of years to be filtered
var years = ee.List.sequence({'start': 1985, 'end': 2023, step: 1}).getInfo();

// User defined functions
var applyGapFill = function (image) {

    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = image.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select([0]));

                return currentImage.addBands(previousImage);

            }, ee.Image(imageAllBands.select([bandNames.get(0)]))
        );

    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // Apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();

    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {

                var currentImage = imageFilledt0tn.select(ee.String(bandName));

                previousImage = ee.Image(previousImage);

                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));

                return previousImage.addBands(currentImage);

            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );

    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);

    return imageFilledtnt0;
};

// Get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// Generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(classificationInput.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// Insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                classificationInput.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(classificationInput.select(0))
            )
        );
    }
);

// Convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);

// Generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);

// Apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
var imageFilledYear = applyGapFill(imagePixelYear);

// check filtered image
print('Output classification', imageFilledtnt0);
Map.addLayer(imageFilledtnt0.select('classification_2022'), vis, 'filtered');

// write metadata
imageFilledtnt0 = imageFilledtnt0.set('version', outputVersion);

// export as GEE asset
Export.image.toAsset({
    'image': imageFilledtnt0,
    'description': 'CERRADO_col9_gapfill_v' + outputVersion,
    'assetId': out + 'CERRADO_col9_gapfill_v' + outputVersion,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
