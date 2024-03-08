// -- -- -- -- 05_gapFill
// post-processing - fill gaps (nodata) with data from previous years
// barbara.silva@ipam.org.br

// set the rocky outcrop extent 
var geometry = ee.Geometry.Polygon (
[[[-41.89424073899461,-3.5402242777700574],
[-48.83760011399461,-6.385663504252147],
[-48.96943605149461,-10.557420640233374],
[-50.81513917649461,-13.906814250754953],
[-58.68135011399461,-14.503234080476853],
[-58.50556886399461,-22.293613049106106],
[-55.78095948899461,-22.374910342856523],
[-53.18818605149461,-18.463398351122954],
[-49.36494386399461,-17.92066736932659],
[-47.82685792649461,-22.21226843307078],
[-42.64131105149461,-19.99858562581205],
[-41.76240480149461,-13.821484186840916],
[-43.21260011399461,-13.565307050922476],
[-43.08076417649461,-8.998421853698893],
[-45.10224855149461,-7.214743125944735],
[-40.26826417649461,-5.336504449649562],
[-41.05927980149461,-3.1015101677947055],
[-41.89424073899461,-3.5402242777700574]]]);

// set metadata 
var input_version = '0';
var output_version = '0';

// set directories
var input = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class/CERRADO_col9_rocky_v0';
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class-post/';
var filename = 'CERRADO_col8_rocky_gapfill_v';

// import classification 
var image = ee.Image(input);

// mask and discard values equal to zero
image = image.mask(image.neq(0));
print('input classification', image);

// get the mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
};

Map.addLayer(image.select(['classification_2022']), vis, 'input');

// set the list of years to be filtered
var years = ee.List.sequence({'start': 1985, 'end': 2023, step: 1}).getInfo();

/**
 * User defined functions
 */
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
imageFilledtnt0 = imageFilledtnt0.set('version', output_version);

// export as GEE asset
Export.image.toAsset({
    'image': imageFilledtnt0,
    'description': filename + output_version,
    'assetId': dirout + filename + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});

