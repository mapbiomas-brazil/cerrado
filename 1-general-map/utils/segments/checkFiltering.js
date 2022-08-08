// check consistency of filtered points
// dhemerson.costa@ipam.org.br

// normal samples
var samples = ee.FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v1');
// filtered samples (by segments) 
var filtered = ee.FeatureCollection('users/dh-conciani/collection7/sample/filtered_points/consolidated/samplePoints_filtered_v1');

// set mapbiomas pallete
var palettes = require('users/mapbiomas/modules:Palettes.js');
var paletteMapBiomas = palettes.get('classification6');

// make samples colored 
samples = samples.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(paletteMapBiomas)
                .get(feature.get('reference')),
            'width': 1,
        });
    }
).style(
    {
        'styleProperty': 'style'
    }
);

filtered = filtered.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(paletteMapBiomas)
                .get(feature.get('class')),
            'width': 1,
        });
    }
).style(
    {
        'styleProperty': 'style'
    }
);

Map.addLayer(samples, {}, 'samples');
Map.addLayer(filtered, {}, 'filtered');
