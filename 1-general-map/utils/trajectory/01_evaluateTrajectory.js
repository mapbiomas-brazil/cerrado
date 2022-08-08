/**
 * import modules 
 */
var Mapp = require('users/joaovsiqueira1/packages:Mapp.js');
var Legend = require('users/joaovsiqueira1/packages:Legend.js');
var Palettes = require('users/mapbiomas/modules:Palettes.js');
var ColorRamp = require('users/joaovsiqueira1/packages:ColorRamp.js');
/**
 * define parameters 
 */
var asset = 'users/dh-conciani/collection7/c7-general-post/CERRADO_col7_gapfill_incidence_temporal_spatial_v3';

// the analysis runs only for the groups below
var classIds = [
    [3],      // forest
    [4],      // savanna
    [11],     // wetland
    [12],      // grassland
    [3, 4, 11, 12] // native
];

var periods = [
    // [1985, 1990],
    // [1990, 1995],
    // [1995, 2000],
    // [2000, 2005],
    // [2005, 2010],
    // [2010, 2015],
    // [2015, 2020],
    [1985, 2021],
];

var mpbPalette = Palettes.get('classification6');

// defined user functions
/**
 * 
 * @param {*} image 
 * @returns 
 */
var calculateNumberOfClasses = function (image) {

    var nClasses = image.reduce(ee.Reducer.countDistinctNonNull());

    return nClasses.rename('number_of_classes');
};

/**
 * 
 * @param {*} image 
 * @returns 
 */
var calculateNumberOfChanges = function (image) {

    var nChanges = image.reduce(ee.Reducer.countRuns()).subtract(1);

    return nChanges.rename('number_of_changes');
};

/**
 * 
 * @param {*} image 
 * @returns 
 */
var calculateNumberOfPresence = function (image) {

    var nChanges = image.reduce(ee.Reducer.sum());

    return nChanges.rename('number_of_presence');
};

/**
 * visualization
 */
var visParams = {
    'number_of_presence': {
        'min': 0,
        'max': 37,
        'palette': [
            "#ffffff",
            "#fff5f0",
            "#fee0d2",
            "#fcbba1",
            "#fc9272",
            "#fb6a4a",
            "#ef3b2c",
            "#cb181d",
            "#a50f15",
            "#67000d"
        ],
        'format': 'png'
    },
    'number_of_changes': {
        'min': 0,
        'max': 7,
        'palette': [
            "#C8C8C8",
            "#FED266",
            "#FBA713",
            "#cb701b",
            "#a95512",
            "#662000",
            "#cb181d"
        ],
        'format': 'png'
    },
    'number_of_classes': {
        'min': 0,
        'max': 5,
        'palette': [
            "#ffffff",
            "#C8C8C8",
            "#AE78B2",
            "#772D8F",
            "#4C226A",
            "#22053A"
        ],
        'format': 'png'
    },
    'stable': {
        'min': 0,
        'max': 49,
        'palette': mpbPalette,
        'format': 'png'
    },
    'trajectories': {
        'min': 0,
        'max': 7,
        'palette': [
            "#ffffff", //[0] Mask 
            "#941004", //[1] Loss without Alternation (Pr-Ab Ch=1)
            "#020e7a", //[2] Gain without Alternation (Ab-Pr Ch=1)
            "#f5261b", //[3] Loss with Alternation    (Pr-Ab Ch>2)
            "#14a5e3", //[4] Gain with Alternation    (Ab-Pr Ch>2)
            "#ffff00", //[5] All Alternation          (Ab-Ab or Pr-Pr Ch>1)
            "#666666", //[6] Stable Presence          (Pr-Pr Ch=0)
            "#c4c3c0", //[7] Stable Absence           (Ab-Ab Ch=0)
        ],
        'format': 'png'
    }
};


/**
 * 
 */
// all lulc images
var image = ee.Image(asset);

// create recipe to receive trajectories
var recipe = ee.Image([]);

// for each period in list
periods.forEach(
    function (period) {
        var count = period[1] - period[0] + 1;

        var bands = Array.apply(null, Array(count)).map(
            function (_, i) {
                return 'classification_' + (period[0] + i).toString();
            }
        );

        // lulc images 
        var imagePeriod = image.select(bands);

        // number of classes
        var nClasses = calculateNumberOfClasses(imagePeriod);

        // number of changes
        var nChanges = calculateNumberOfChanges(imagePeriod);

        // stable
        var stable = imagePeriod.select(0).multiply(nClasses.eq(1));

        Map.addLayer(nClasses, visParams.number_of_classes, period + ' number of classes ', false);
        Map.addLayer(nChanges, visParams.number_of_changes, period + ' number of changes ', false);
        Map.addLayer(stable, visParams.stable, period + ' stable ', false);

        // trajectories
        classIds.forEach(
            function (classList) {
                var classIdsMask = ee.List(bands).iterate(
                    function (band, allMasks) {
                        var mask = imagePeriod.select([band])
                            .remap(classList, ee.List.repeat(1, classList.length), 0);

                        return ee.Image(allMasks).addBands(mask);
                    },
                    ee.Image().select()
                );

                classIdsMask = ee.Image(classIdsMask).rename(bands);

                // number of presence
                var nPresence = calculateNumberOfPresence(classIdsMask);

                // nChanges in classList
                var nChanges = calculateNumberOfChanges(classIdsMask);

                // nChanges rules in the analisys
                var nChangesEq0 = nChanges.eq(0); //  no change
                var nChangesEq1 = nChanges.eq(1); //  1 change
                var nChangesGt1 = nChanges.gt(1); // >1 changes
                // var nChangesGt2 = nChanges.gt(2); // >2 changes

                // lulc classIds masks for the first year and last year 
                var t1 = classIdsMask.select(bands[0]);
                var tn = classIdsMask.select(bands[bands.length - 1]);

                // categories
                var abAbCh0 = t1.eq(0).and(nChangesEq0);
                var prPrCh0 = t1.eq(1).and(nChangesEq0);
                var abPrCh1 = t1.eq(0).and(nChangesEq1).and(tn.eq(1));
                var prAbCh1 = t1.eq(1).and(nChangesEq1).and(tn.eq(0));
                var abPrCh2 = t1.eq(0).and(nChangesGt1).and(tn.eq(1));
                var prAbCh2 = t1.eq(1).and(nChangesGt1).and(tn.eq(0));
                var abAbCh1 = t1.eq(0).and(nChangesGt1).and(tn.eq(0));
                var prPrCh1 = t1.eq(1).and(nChangesGt1).and(tn.eq(1));

                // (*) the classes Ab-Ab and Pr-Pr the classes were joined
                var trajectories = ee.Image(0)
                    .where(prAbCh1, 1)  //[1] Pr-Ab Ch=1 | Loss without Alternation
                    .where(abPrCh1, 2)  //[2] Ab-Pr Ch=1 | Gain without Alternation
                    .where(prAbCh2, 3)  //[3] Pr-Ab Ch>2 | Loss with Alternation
                    .where(abPrCh2, 4)  //[4] Ab-Pr Ch>2 | Gain with Alternation
                    .where(abAbCh1, 5)  //[5] Ab-Ab Ch>1 | All Alternation (Ab-Ab)
                    .where(prPrCh1, 5)  //[5] Pr-Pr Ch>1 | All Alternation (Pr-Pr)
                    .where(prPrCh0, 6)  //[6] Pr-Pr Ch=0 | Stable Presence
                    .where(abAbCh0, 7); //[7] Ab-Ab Ch=0 | Stable Absence

                trajectories = trajectories.rename('trajectories').selfMask();

                Map.addLayer(nPresence, visParams.number_of_presence, period + ' number of years of presence ' + classList, false);
                Map.addLayer(trajectories, visParams.trajectories, period + ' trajectories ' + classList);
                
                // insert into recipe
                recipe = recipe.addBands(nPresence.rename('presence_' + classList))
                               .addBands(trajectories.rename('trajectories_' + classList));
            }
        );
    }
);

var incidentsLegend = Legend.getLegend(
    {
        "title": "Number of changes",
        "layers": [
            [visParams.number_of_changes.palette[0], 0, " no Change"],
            [visParams.number_of_changes.palette[1], 1, " 1 Change"],
            [visParams.number_of_changes.palette[2], 2, " 2 Changes"],
            [visParams.number_of_changes.palette[3], 3, " 3 Changes"],
            [visParams.number_of_changes.palette[4], 4, " 4 Changes"],
            [visParams.number_of_changes.palette[5], 5, " 5 Changes"],
            [visParams.number_of_changes.palette[6], 6, ">6 Changes"],
        ],
        "style": {
            "backgroundColor": "#21242E",
            "color": "#ffffff",
            "fontSize": '12px',
            "iconSize": '14px',
        },
        "orientation": "vertical"
    }
);

var statesLegend = Legend.getLegend(
    {
        "title": "Number of classes",
        "layers": [
            [visParams.number_of_classes.palette[1], 1, " 1 Class"],
            [visParams.number_of_classes.palette[2], 2, " 2 Classes"],
            [visParams.number_of_classes.palette[3], 3, " 3 Classes"],
            [visParams.number_of_classes.palette[4], 4, " 4 Classes"],
            [visParams.number_of_classes.palette[5], 5, ">5 Classes"],
        ],
        "style": {
            "backgroundColor": "#21242E",
            "color": "#ffffff",
            "fontSize": '12px',
            "iconSize": '14px',
        },
        "orientation": "vertical"
    }
);

var trajectoriesLegend = Legend.getLegend(
    {
        "title": "Trajectories",
        "layers": [
            [visParams.trajectories.palette[0], 0, "Mask"],
            [visParams.trajectories.palette[1], 1, "Loss without Alternation"],
            [visParams.trajectories.palette[2], 2, "Gain without Alternation"],
            [visParams.trajectories.palette[3], 3, "Loss with Alternation"],
            [visParams.trajectories.palette[4], 4, "Gain with Alternation"],
            [visParams.trajectories.palette[5], 5, "All Alternation"],
            [visParams.trajectories.palette[6], 6, "Stable Presence"],
            [visParams.trajectories.palette[7], 7, "Stable Absence"],
        ],
        "style": {
            "backgroundColor": "#21242E",
            "color": "#ffffff",
            "fontSize": '12px',
            "iconSize": '14px',
        },
        "orientation": "vertical"
    }
);

ColorRamp.init(
    {
        'orientation': 'horizontal',
        'backgroundColor': '21242E',
        'fontColor': 'ffffff',
        'height': '10px',
        'width': '150px',
    }
);

ColorRamp.add({
    'title': 'Number of years of presence',
    'min': visParams.number_of_presence.min,
    'max': visParams.number_of_presence.max,
    'palette': visParams.number_of_presence.palette,
});

// Get legend widget
var colorRamp1 = ColorRamp.getWidget();

var mapbiomasLegend = Legend.getLegend(
    {
        "title": "MapBiomas",
        "layers": [
            [visParams.stable.palette[0], 0, 'Non Observed'],
            [visParams.stable.palette[3], 3, 'Forest Formation'],
            [visParams.stable.palette[4], 4, 'Savanna Formation'],
            [visParams.stable.palette[5], 5, 'Mangrove'],
            [visParams.stable.palette[49], 49, 'Wooded Restinga'],
            [visParams.stable.palette[11], 11, 'Wetland'],
            [visParams.stable.palette[12], 12, 'Grassland'],
            [visParams.stable.palette[32], 32, 'Salt flat'],
            [visParams.stable.palette[29], 29, 'Rocky outcrop'],
            [visParams.stable.palette[13], 13, 'Other Non Forest Natural Formation'],
            [visParams.stable.palette[18], 18, 'Agriculture'],
            [visParams.stable.palette[39], 39, 'Soybean'],
            [visParams.stable.palette[20], 20, 'Sugar Cane'],
            [visParams.stable.palette[40], 40, 'Rice'],
            [visParams.stable.palette[41], 41, ' Other Temporary Crops'],
            [visParams.stable.palette[46], 46, 'Coffee'],
            [visParams.stable.palette[47], 47, 'Citrus'],
            [visParams.stable.palette[48], 48, 'Other Perennial Crops'],
            [visParams.stable.palette[9], 9, 'Forest Plantation'],
            [visParams.stable.palette[15], 15, 'Pasture'],
            [visParams.stable.palette[21], 21, 'Mosaic of Agriculture and Pasture'],
            [visParams.stable.palette[22], 22, 'Non Vegetated Area'],
            [visParams.stable.palette[23], 23, 'Beach and Dune'],
            [visParams.stable.palette[24], 24, 'Urban Area'],
            [visParams.stable.palette[30], 30, 'Mining'],
            [visParams.stable.palette[25], 25, 'Other Non Vegetated Area'],
            [visParams.stable.palette[33], 33, 'River, Lake and Ocean'],
            [visParams.stable.palette[31], 31, 'Aquaculture'],
        ],
        "style": {
            "backgroundColor": "#ffffff",
            "color": "#212121",
            "fontSize": '12px',
            "iconSize": '14px',
        },
        "orientation": "vertical"
    }
);

var panel = ui.Panel({
    widgets: [
        incidentsLegend,
        statesLegend,
        trajectoriesLegend,
        colorRamp1,
        // mapbiomasLegend
    ],
    style: {
        position: 'bottom-left',
        backgroundColor: '21242E',
    }
});

Map.add(panel);

var Inspector = {

    options: {
        'title': 'Inspector',
        'legend': 'none',
        'chartArea': {
            left: 50,
            right: 5,
        },
        'titleTextStyle': {
            color: '#ffffff',
            fontSize: 12,
            bold: true,
            italic: false
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            // title: 'Date', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 8,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            viewWindow: {
                max: 36,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Class', // muda isso aqui
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            viewWindow: {
                max: 50,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 2
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'lineWidth': 0,
        // 'width': '300px',
        'height': '150px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { color: '#21242E' }
        },

    },

    assets: {
        image: image,
        // imagef: image
    },

    data: {
        imagef: null,
        point: null
    },

    legend: {
        0: { 'color': mpbPalette[0], 'name': 'Non Observed' },
        3: { 'color': mpbPalette[3], 'name': 'Forest Formation' },
        4: { 'color': mpbPalette[4], 'name': 'Savanna Formation' },
        5: { 'color': mpbPalette[5], 'name': 'Mangrove' },
        49: { 'color': mpbPalette[49], 'name': 'Wooded Restinga' },
        11: { 'color': mpbPalette[11], 'name': 'Wetland' },
        12: { 'color': mpbPalette[12], 'name': 'Grassland' },
        32: { 'color': mpbPalette[32], 'name': 'Salt flat' },
        29: { 'color': mpbPalette[29], 'name': 'Rocky outcrop' },
        13: { 'color': mpbPalette[13], 'name': 'Other Non Forest Natural Formation' },
        18: { 'color': mpbPalette[18], 'name': 'Agriculture' },
        39: { 'color': mpbPalette[39], 'name': 'Soybean' },
        20: { 'color': mpbPalette[20], 'name': 'Sugar Cane' },
        40: { 'color': mpbPalette[40], 'name': 'Rice' },
        41: { 'color': mpbPalette[41], 'name': ' Other Temporary Crops' },
        46: { 'color': mpbPalette[46], 'name': 'Coffee' },
        47: { 'color': mpbPalette[47], 'name': 'Citrus' },
        48: { 'color': mpbPalette[48], 'name': 'Other Perennial Crops' },
        9: { 'color': mpbPalette[9], 'name': 'Forest Plantation' },
        15: { 'color': mpbPalette[15], 'name': 'Pasture' },
        21: { 'color': mpbPalette[21], 'name': 'Mosaic of Agriculture and Pasture' },
        22: { 'color': mpbPalette[22], 'name': 'Non Vegetated Area' },
        23: { 'color': mpbPalette[23], 'name': 'Beach and Dune' },
        24: { 'color': mpbPalette[24], 'name': 'Urban Area' },
        30: { 'color': mpbPalette[30], 'name': 'Mining' },
        25: { 'color': mpbPalette[25], 'name': 'Other Non Vegetated Area' },
        33: { 'color': mpbPalette[33], 'name': 'River, Lake and Ocean' },
        31: { 'color': mpbPalette[31], 'name': 'Aquaculture' },
    },

    loadData: function () {
        Inspector.data.image = ee.Image(Inspector.assets.image);
        // Inspector.data.imagef = ee.Image(Inspector.assets.imagef);
    },

    init: function () {
        Inspector.loadData();
        Inspector.ui.init();
    },

    getSamplePoint: function (image, points) {

        var sample = image.sampleRegions({
            'collection': points,
            'scale': 30,
            'geometries': true
        });

        return sample;
    },

    ui: {

        init: function () {

            Inspector.ui.form.init();
            Inspector.ui.activateMapOnClick();

        },

        activateMapOnClick: function () {

            Map.onClick(
                function (coords) {
                    var point = ee.Geometry.Point(coords.lon, coords.lat);

                    var bandNames = Inspector.data.image.bandNames();

                    var newBandNames = bandNames.map(
                        function (bandName) {
                            var name = ee.String(ee.List(ee.String(bandName).split('_')).get(1));

                            return name;
                        }
                    );

                    var image = Inspector.data.image.select(bandNames, newBandNames);

                    Inspector.ui.inspect(Inspector.ui.form.chartInspector, image, point, 1.0);
                }
            );
        },

        refreshGraph: function (chart, sample, opacity) {

            sample.evaluate(
                function (featureCollection) {

                    if (featureCollection !== null) {
                        // print(featureCollection.features);

                        var pixels = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        var bands = Object.getOwnPropertyNames(pixels[0]);

                        // Add class value
                        var dataTable = bands.map(
                            function (band) {
                                var value = pixels.map(
                                    function (pixel) {
                                        return pixel[band];
                                    }
                                );

                                return [band].concat(value);
                            }
                        );

                        // Add point style and tooltip
                        dataTable = dataTable.map(
                            function (point) {
                                var color = Inspector.legend[point[1]].color;
                                var name = Inspector.legend[point[1]].name;
                                var value = String(point[1]);

                                var style = 'point {size: 4; fill-color: ' + color + '; opacity: ' + opacity + '}';
                                var tooltip = 'year: ' + point[0] + ', class: [' + value + '] ' + name;

                                return point.concat(style).concat(tooltip);
                            }
                        );

                        var headers = [
                            'serie',
                            'id',
                            { 'type': 'string', 'role': 'style' },
                            { 'type': 'string', 'role': 'tooltip' }
                        ];

                        dataTable = [headers].concat(dataTable);

                        chart.setDataTable(dataTable);

                    }
                }
            );
        },

        refreshMap: function () {

            var pointLayer = Map.layers().filter(
                function (layer) {
                    return layer.get('name') === 'Point';
                }
            );

            if (pointLayer.length > 0) {
                Map.remove(pointLayer[0]);
                Map.addLayer(Inspector.data.point, {}, 'Point');
            } else {
                Map.addLayer(Inspector.data.point, {}, 'Point');
            }

        },

        inspect: function (chart, image, point, opacity) {

            // aqui pode fazer outras coisas além de atualizar o gráfico
            Inspector.data.point = Inspector.getSamplePoint(image, ee.FeatureCollection(point));

            Inspector.ui.refreshMap(Inspector.data.point);
            Inspector.ui.refreshGraph(chart, Inspector.data.point, opacity);

        },

        form: {

            init: function () {

                Inspector.ui.form.panelInspector.add(Inspector.ui.form.chartInspector);
                // Inspector.ui.form.panelInspector.add(Inspector.ui.form.chartInspectorf);

                Inspector.options.title = 'Temporal series';
                Inspector.ui.form.chartInspector.setOptions(Inspector.options);

                Map.add(Inspector.ui.form.panelInspector);
            },

            panelInspector: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '500px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartInspector: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            ]),

            // chartInspectorf: ui.Inspector([
            //     ['Serie', ''],
            //     ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            // ])
        }
    }
};

Inspector.init();

//
var Chart = {

    options: {
        'title': 'Trajectories Analysis',
        'titleTextStyle': {
            color: '#ffffff',
            // fontSize: 10,
            bold: true,
            italic: false
        },

        'legend': {
            position: 'top',
            maxLines: 1,
            textStyle: {
                color: '#ffffff',
                // fontSize: 8,
                // fontName: 'Arial',
                bold: false,
                italic: false
            }
        },
        'bar': { 'groupWidth': '100%' },
        'isStacked': true,
        'chartArea': {
            left: 50,
            right: 5,
            bottom: 100,
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            title: 'Period', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                // fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            // viewWindow: {
            //     max: 36,
            //     min: 0
            // },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Area (km2)',
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                // fontSize: 10,
                bold: false,
                italic: false
            },
            // viewWindow: {
            //     max: 200000,
            //     min: -200000
            // },
            gridlines: {
                color: '#21242E',
                // interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            },
            format: 'short'
        },
        'lineWidth': 0,
        // 'width': '300px',
        'height': '300px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { 'color': "#941004" }, // [11] Loss (Loss without Alternation)
            1: { 'color': "#f5261b" }, // [13] Loss (Loss with Alternation)
            2: { 'color': "#14a5e3" }, // [14] Loss (Gain with Alternation)
            3: { 'color': "#ffff00" }, // [15] Loss (All Alternation)

            4: { 'color': "#020e7a" }, // [22] Gain (Gain without Alternation) 
            5: { 'color': "#f5261b" }, // [23] Gain (Loss with Alternation) 
            6: { 'color': "#14a5e3" }, // [24] Gain (Gain with Alternation) 
            7: { 'color': "#ffff00" }, // [25] Gain (All Alternation) 
        },

    },

    assets: {
        tables: {
            biomes: 'users/joaovsiqueira1/brazil-biomes-trajectorties-3a',
            country: 'users/joaovsiqueira1/brazil-country-trajectorties-3a'
        }
    },

    data: {
        table: null,
    },

    variables: {
        territory_id: 'Brazil',
        trajectory_ids: [
            11, // Loss (Loss without Alternation)
            13, // Loss (Loss with Alternation)
            14, // Loss (Gain with Alternation)
            15, // Loss (All Alternation)
            22, // Gain (Gain without Alternation)
            23, // Gain (Loss with Alternation)
            24, // Gain (Gain with Alternation)
            25, // Gain (All Alternation)
        ],
        trajectory_names: [
            'L.Loss without Alternation',
            'L.Loss with Alternation',
            'L.Gain with Alternation',
            'L.All Alternation',
            'G.Gain without Alternation',
            'G.Loss with Alternation',
            'G.Gain with Alternation',
            'G.All Alternation',
        ]
    },

    periods: [
        "1985-1986",
        "1986-1987",
        "1987-1988",
        "1988-1989",
        "1989-1990",
        "1990-1991",
        "1991-1992",
        "1992-1993",
        "1993-1994",
        "1994-1995",
        "1995-1996",
        "1996-1997",
        "1997-1998",
        "1998-1999",
        "1999-2000",
        "2000-2001",
        "2001-2002",
        "2002-2003",
        "2003-2004",
        "2004-2005",
        "2005-2006",
        "2006-2007",
        "2007-2008",
        "2008-2009",
        "2009-2010",
        "2010-2011",
        "2011-2012",
        "2012-2013",
        "2013-2014",
        "2014-2015",
        "2015-2016",
        "2016-2017",
        "2017-2018",
        "2018-2019",
        "2019-2020",
        "2020-2021"
    ],

    loadData: function () {
        Chart.data.table = ee.FeatureCollection(Chart.assets.tables.country);
    },

    init: function () {
        Chart.loadData();
        Chart.ui.init();
    },

    ui: {

        init: function () {

            Chart.ui.form.init();
            Chart.ui.refreshGraph(
                Chart.variables.territory_id,
                Chart.variables.trajectory_ids
            );

        },

        refreshGraph: function (territory_id, trajectory_ids) {

            var table = Chart.data.table
                .filter(ee.Filter.eq('name_en', territory_id))
                .filter(ee.Filter.inList('trajectory_id', trajectory_ids));
            // print(Chart.data.table)
            // print(territory_id);
            // print(table);

            table.sort('trajectory_id').evaluate(
                function (featureCollection) {

                    if (featureCollection !== null) {

                        var properties = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        // print(properties);
                        // print(Chart.periods);

                        // Add class value
                        var dataTable = Chart.periods.map(
                            function (period) {
                                var value = properties.map(
                                    function (prop) {

                                        var area = prop[period];

                                        if ([11, 13, 14, 15].indexOf(prop.trajectory_id) !== -1) {
                                            area = -1 * area;
                                        }

                                        return Math.floor(area / 100); // convert to km2
                                    }
                                );

                                return [period].concat(value).concat('stroke-width:0');
                            }
                        );

                        var headers = ["Period"].concat(Chart.variables.trajectory_names).concat({ 'role': 'style' });

                        dataTable = [headers].concat(dataTable);
                        // print(dataTable);
                        Chart.ui.form.chartTrajectories.setDataTable(dataTable);

                    }
                }
            );
        },

        form: {

            init: function () {

                Chart.ui.form.panelChart.add(Chart.ui.form.selectTerritory);
                Chart.ui.form.panelChart.add(Chart.ui.form.chartTrajectories);

                Chart.options.title = 'Trajectories Analysis';
                Chart.ui.form.chartTrajectories.setOptions(Chart.options);

                Map.add(Chart.ui.form.panelChart);
            },

            panelChart: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '500px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartTrajectories: ui.Chart([
                ["Period", ""],
                ['', 0],
            ], 'ColumnChart'),

            selectTerritory: ui.Select({
                'items': [
                    'Brazil',
                    'AMAZÔNIA',
                    'CAATINGA',
                    'CERRADO',
                    'MATA ATLÂNTICA',
                    'PAMPA',
                    'PANTANAL'
                ],
                'value': 'Brazil',
                'onChange': function (value) {
                    Chart.variables.territory_id = value;

                    if (value == 'Brazil') {
                        Chart.data.table = ee.FeatureCollection(Chart.assets.tables.country);
                    } else {
                        Chart.data.table = ee.FeatureCollection(Chart.assets.tables.biomes);
                    }

                    Chart.ui.refreshGraph(
                        Chart.variables.territory_id,
                        Chart.variables.trajectory_ids
                    );
                },
                'style': {
                    'width': '150px',
                    'backgroundColor': '#21242E66',
                    'color': '#21242E',
                }
            })

        }
    }
};

Chart.init();

Map.setOptions({
    'styles': {
        'Dark': Mapp.getStyle('Dark')
    }
});

// get classification regions
var region = ee.FeatureCollection('users/dh-conciani/collection7/classification_regions/vector');

// get validation points
var validation = ee.FeatureCollection('projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8');

// get problematic regions
Map.addLayer(validation.filterBounds(region.filterMetadata('mapb', 'equals', 10)), {}, 'reg')

// apply filters
print(recipe);
