// -- -- -- -- 06_gapFill
// post-processing - fill gaps (nodata) with data from previous years
// barbara.silva@ipam.org.br

// set the cerrado extent 
var geometry = 
    ee.Geometry.Polygon(
        [[[-61.23436115564828, -1.2109638051779688],
          [-61.23436115564828, -26.098552002927054],
          [-40.31639240564828, -26.098552002927054],
          [-40.31639240564828, -1.2109638051779688]]], null, false);
          
// set metadata 
var input_version = '3';
var output_version = '3';

// set directories
var input = 'users/barbarasilvaIPAM/collection8/c8-general-class';
var output = 'projects/ee-barbarasilvaipam/assets/collection8/general-class-post/';
var filename = 'CERRADO_col8_gapfill_v';

// import classification 
var image = ee.ImageCollection(input)
            .filterMetadata('version', 'equals', input_version)
            .mosaic();

// discard zero pixels in the image
image = image.mask(image.neq(0));
print('input classification', image);

// get the mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7')
};

Map.addLayer(image.select(['classification_2022']), vis, 'input');

// set the list of years to be filtered
var years = ee.List.sequence({'start': 1985, 'end': 2022, step: 1}).getInfo();

// user defined functions
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

    // apply the gap fill form tn until t0
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

// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);

// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
var imageFilledYear = applyGapFill(imagePixelYear);

// check filtered image
print ('output classification', imageFilledtnt0);
Map.addLayer(imageFilledtnt0.select('classification_2022'), vis, 'filtered');

// write metadata
imageFilledtnt0 = imageFilledtnt0.set('vesion', output_version);

// export as GEE asset
Export.image.toAsset({
    'image': imageFilledtnt0,
    'description': filename + output_version,
    'assetId': output + filename + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
