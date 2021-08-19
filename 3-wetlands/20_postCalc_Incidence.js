// Post-processing - Compute per pixel incidence (number of changes) 
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define input
var version_in = 'CERRADO_col6_wetlands_gapfill_v54';
var bioma = "CERRADO";

// define output
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var version_out = 54;

// import mapbiomas color ramp
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// load input
var imc_carta2 = ee.Image(dirout + version_in);

// define years to be assessed
var anos = ['1985', '1986', '1987','1988', '1989', '1990','1991', '1992', '1993','1994', '1995', 
            '1996','1997', '1998', '1999','2000', '2001', '2002','2003', '2004', '2005','2006', 
            '2007', '2008','2009', '2010', '2011','2012', '2013', '2014','2015', '2016', '2017', 
            '2018', '2019', '2020'];

// define reclassification rules
var classeIds =  [3, 4, 11, 12, 15, 19, 25, 33];
var newClasseIds = [3, 3, 11, 12, 21, 21, 21, 27];

// define max frequency for each class
var options = {
    "classFrequency": {
        "3":  36, 
        "4":  36,
        "11": 36,
        "12": 36,
        "15": 36,
        "19": 36,
        "33": 36,
    },
};


var colList = ee.List([]);
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var colList = colList.add(imc_carta2.select(['classificationWet_'+ano],['classificationWet']));
}
var imc_carta = ee.ImageCollection(colList);

var img1 =  ee.Image(imc_carta.first());

var image_moda = imc_carta2.reduce(ee.Reducer.mode());

// ******* incidence **********
var imagefirst = img1.addBands(ee.Image(0)).rename(["classificationWet", "incidence"]);

var incidence = function(imgActual, imgPrevious){
  
  imgActual = ee.Image(imgActual);
  imgPrevious = ee.Image(imgPrevious);
  
  var imgincidence = imgPrevious.select(["incidence"]);
  
  var classification0 = imgPrevious.select(["classificationWet"]);
  var classification1 = imgActual.select(["classificationWet"]);
  
  
  var change  = ee.Image(0);
  change = change.where(classification0.neq(classification1), 1);
  imgincidence = imgincidence.where(change.eq(1), imgincidence.add(1));
  
  return imgActual.addBands(imgincidence);
  
};

var imc_carta4 = imc_carta.map(function(image) {
    image = image.remap(classeIds, newClasseIds, 27)
    image = image.mask(image.neq(27));
    return image.rename('classificationWet');
});

Map.addLayer(imc_carta4, vis, 'imc_carta4');

var image_incidence = ee.Image(imc_carta4.iterate(incidence, imagefirst)).select(["incidence"]);
//image_incidence = image_incidence.clip(geometry);

var vis2 = {
    'bands': '2018',
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"];
imc_carta2 = imc_carta2.select(['classificationWet_1985', 'classificationWet_1986', 'classificationWet_1987', 'classificationWet_1988', 'classificationWet_1989', 
                                'classificationWet_1990', 'classificationWet_1991', 'classificationWet_1992', 'classificationWet_1993', 'classificationWet_1994', 
                                'classificationWet_1995', 'classificationWet_1996', 'classificationWet_1997', 'classificationWet_1998', 'classificationWet_1999',
                                'classificationWet_2000', 'classificationWet_2001', 'classificationWet_2002', 'classificationWet_2003', 'classificationWet_2004', 
                                'classificationWet_2005', 'classificationWet_2006', 'classificationWet_2007', 'classificationWet_2008', 'classificationWet_2009', 
                                'classificationWet_2010', 'classificationWet_2011', 'classificationWet_2012', 'classificationWet_2013', 'classificationWet_2014',
                                'classificationWet_2015', 'classificationWet_2016', 'classificationWet_2017', 'classificationWet_2018', 'classificationWet_2019',
                                'classificationWet_2020'],
                                
                               ['1985', '1986', '1987','1988', '1989', '1990','1991', '1992', '1993','1994', '1995', '1996','1997', '1998', '1999',
                                '2000', '2001', '2002','2003', '2004', '2005','2006', '2007', '2008','2009', '2010', '2011','2012', '2013', '2014',
                                '2015', '2016', '2017', '2018', '2019', '2020']);
                                
Map.addLayer(imc_carta2, vis2, 'MapBiomas'); 

// build incidence image and paste metadata
image_incidence = image_incidence.mask(image_incidence.gt(10))
                       .set("version", version_out)
                       .set("biome", "CERRADO")
                       .set("step", "prep_incid");

image_incidence = image_incidence.addBands(image_incidence.where(image_incidence.gt(10),1).rename('valor1'));
image_incidence = image_incidence.addBands(image_incidence.select('valor1').connectedPixelCount(100,false).rename('connect'));
image_incidence = image_incidence.addBands(image_moda);
print(image_incidence);
Map.addLayer(image_incidence, {}, "incidents");

// Export as GEE asset
Export.image.toAsset({
    'image': image_incidence,
    'description': 'CERRADO_col6_wetlands_incidMask_v'+ version_out,
    'assetId': dirout+'CERRADO_col6_wetlands_incidMask_v'+ version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': image_incidence.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
