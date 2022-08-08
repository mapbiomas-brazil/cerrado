// remove outliers from stable pixels by using segmentation (test js script)
// dhemerson.costa@ipam.org.br

var cartas = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/cartas');
var geometry = cartas.filterMetadata('grid_name', 'equals', 'SD-23-Y-C');
var carta_mask = ee.Image(0).mask(0).paint(geometry);
    

// define dir to export new samples
var dirout = 'users/dh-conciani/collection7/sample/filtered_points/byCarta/';

// define output version
var version = '2';

// cerrado extent
var cerrado_extent = ee.Geometry.Polygon(
        [[[-62.30982042125685, -0.9217170277068568],
          [-62.30982042125685, -25.759333772762382],
          [-39.63403917125685, -25.759333772762382],
          [-39.63403917125685, -0.9217170277068568]]], null, false);

// import datasets 
// stable samples 
var stable_pixels = ee.Image('users/dh-conciani/collection7/masks/cerrado_stablePixels_1985_2020_v1')
                      .remap([3, 4, 5, 11, 12, 29, 15, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                             [3, 4, 3, 12, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33]);

// color ramp module from mapbiomas 
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// mapbiomas classification
var mapbiomas = stable_pixels.updateMask(carta_mask.eq(0));

// sample points (un-filtered)
var sample_points = ee.FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v2')
                      .filterBounds(geometry);
                      print ('number of sample points: ', sample_points.size());

// color ponts using mapbiomas color ramp
var samplesStyled = sample_points.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(require('users/mapbiomas/modules:Palettes.js').get('classification6'))
                .get(feature.get('reference')),
            'width': 1,
        });
    }
).style(
    {
        'styleProperty': 'style'
    }
);

// landsat mosaic for the year of 2020 
var landsat = ee.ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')
                .filterMetadata('biome', 'equals', 'CERRADO')
                .filterMetadata('year', 'equals', 2021)
                .mosaic()
                .updateMask(carta_mask.eq(0))
                .updateMask(mapbiomas);

// plot landsat mosaic
Map.addLayer(landsat, {
    'bands': ['swir1_median', 'nir_median', 'red_median'],
    'gain': [0.08, 0.07, 0.2],
    'gamma': 0.85
}, 'Landsat', true);

// plot mapbiomas 
Map.addLayer(mapbiomas, vis, 'mapbiomas [remmaped]', false);


// define bandnames to be used in the segmentation 
var segment_bands = ["blue_median", "green_median", "red_median", "nir_median", "swir1_median", "swir2_median"];

// function to create segments
var getSegments = function (image, size) {
    // define the seed
    var seeds = ee.Algorithms.Image.Segmentation.seedGrid(
        {
            size: size,
            gridType: 'square'
        }
    );
    // create segments
    var snic = ee.Algorithms.Image.Segmentation.SNIC({
        image: image,
        size: size,
        compactness: 1,
        connectivity: 8,
        neighborhoodSize: 2 * size,
        seeds: seeds
    });
    // paste properties
    snic = ee.Image(
        snic.copyProperties(image)
            .copyProperties(image, ['system:footprint'])
            .copyProperties(image, ['system:time_start']));
    // out
    return snic.select(['clusters'], ['segments']);//.int64();
};

// create segments
var segments = getSegments(landsat.select(segment_bands), 12);
    // reproject
    segments = segments.reproject('EPSG:4326', null, 30);
    //print ('raw segments', segments);

// plot segments
Map.addLayer(segments.randomVisualizer(), {}, 'segments img', false);


// define function to select only segments that overlaps sample points
var selectSegments = function (segments, validateMap, samples) {
  // extract training sample class 
    var samplesSegments = segments.sampleRegions({
        collection: samples,
        properties: ['reference'],
        scale: 30,
        // geometries: true
    });

  // extract the segment number 
    var segmentsValues = ee.List(
        samplesSegments.reduceColumns(
            ee.Reducer.toList().repeat(2),
            ['reference', 'segments']
        ).get('list')
    );

    //print(segmentsValues.get(1),
    //      segmentsValues.get(0));

    var similiarMask = segments.remap(
        ee.List(segmentsValues.get(1)),
        ee.List(segmentsValues.get(0)),
        0
    );

    return similiarMask.rename(['class']);
};

// apply function to select segments
var selectedSegments = selectSegments(segments, mapbiomas, sample_points);
    selectedSegments = selectedSegments.selfMask().rename(['class']);

//print ('filtered segments', selectedSegments);
Map.addLayer(selectedSegments, vis, 'selected segments', false);

// plot sample points
Map.addLayer(samplesStyled, {}, 'raw samples', false);

// create percentil rule
var percentil = segments.addBands(mapbiomas).reduceConnectedComponents(ee.Reducer.percentile([5, 95]), 'segments');

// validate and retain only segments with satifies percentil rule
var validated = percentil.select(0).multiply(percentil.select(0).eq(percentil.select(1)));
var selectedSegmentsValidated = selectedSegments.mask(selectedSegments.eq(validated)).rename('referece');

// plot validated
Map.addLayer(selectedSegmentsValidated, vis, 'validated segments', false);

// create a new set of samples based on the validated segments
var newSamples = selectedSegmentsValidated
    .sample({
        region: landsat.geometry(),
        scale: 30,
        factor: 0.022, // select 2.2% of the validated pixels as new samples
        dropNulls: true,
        geometries: true
    });
    print ('number of new sample points', newSamples.size());

// apply style to new points
var newSamplesStyled = newSamples.map(
    function (feature) {
        return feature.set('style', {
             'color': ee.List(require('users/mapbiomas/modules:Palettes.js').get('classification6'))
                .get(feature.get('reference')),
            'width': 1,
        });
    }
).style(
    {
        'styleProperty': 'style'
    }
);

// plot new points
Map.addLayer(newSamplesStyled, {}, 'new samples', true);
