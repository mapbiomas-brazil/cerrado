// -- -- -- -- 05_gapFill
// post-processing - fill gaps (nodata) with data from previous years
// barbara.silva@ipam.org.br

// set the cerrado extent 
var geometry = ee.Geometry.Polygon (
[[[-41.37543452290266,-3.6773987041014786],
  [-48.273939094899134,-6.563020899300923],
  [-48.24659702837338,-9.798906539350297],
  [-49.46053964500549,-12.7089177827255],
  [-50.59234499311172,-14.49329620462519],
  [-52.64207960438195,-15.181085022681668],
  [-57.59252323349536,-14.986692873017187],
  [-58.242578606836716,-15.943307480893033],
  [-57.146197800223625,-16.910053753329763],
  [-57.141504574451865,-17.917776362571292],
  [-57.07361219664365,-18.673685045570164],
  [-57.35785649393868,-19.512827252680655],
  [-58.06505073320582,-20.692941488617265],
  [-56.61596440610372,-22.122773040137734],
  [-54.382244055542735,-19.809042125463858],
  [-53.69411037204978,-18.28747883455363],
  [-52.46842999860558,-17.5502256029074],
  [-49.34009411498674,-16.889662647042297],
  [-48.55759401802354,-17.823527949886824],
  [-48.028130117601854,-18.322928900186156],
  [-47.8811414334333,-19.631023180971603],
  [-47.7402397960028,-20.315912186663887],
  [-47.178597239902444,-20.93821466886093],
  [-46.420962681797846,-21.094287228232602],
  [-45.598267298001325,-20.774496578697853],
  [-42.99747272243816,-19.70487946455934],
  [-42.57451633581474,-18.60373760975882],
  [-42.24564900325984,-16.06000100035008],
  [-42.358140276276764,-15.055560224012149],
  [-43.07074399890996,-15.110935176172486],
  [-43.69689718392297,-15.546162902310774],
  [-45.15858205402829,-17.243566398567214],
  [-45.59698997709771,-16.532881370042322],
  [-46.7381011219985,-14.416834035054313],
  [-44.541873088239804,-12.667054102327889],
  [-43.61838110815923,-9.434881068955413],
  [-46.07753196667198,-7.043265545851765],
  [-40.66218289953771,-5.178029098641075],
  [-41.37543452290266,-3.6773987041014786]]]);
  
// set metadata 
var input_version = '3';
var output_version = '3';

// set directories
var input = 'projects/ee-barbarasilvaipam/assets/collection8-rocky/general-class/CERRADO_col8_rocky_v3';
var output = 'projects/ee-barbarasilvaipam/assets/collection8-rocky/general-class-post/';
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
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification7')
};

Map.addLayer(image.select(['classification_2022']), vis, 'input');

// set the list of years to be filtered
var years = ee.List.sequence({'start': 1985, 'end': 2022, step: 1}).getInfo();

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
