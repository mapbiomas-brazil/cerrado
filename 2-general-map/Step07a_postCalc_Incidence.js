// Post-processing - Compute per pixel incidence (number of changes) 
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define input 
var version_in = 'CERRADO_col6_gapfill_v6';
var bioma = "CERRADO";

// define output
var version_out = 6;
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';

// import mapbiomas color ramp
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// load input
var imc_carta2 = ee.Image(dirout + version_in);

// define years to be assessed
var anos = ['1985', '1986', '1987','1988', '1989', '1990','1991', '1992', '1993','1994', '1995', 
            '1996','1997', '1998', '1999','2000', '2001', '2002','2003', '2004', '2005','2006', 
            '2007', '2008','2009', '2010', '2011','2012', '2013', '2014','2015', '2016', '2017', 
            '2018', '2019', '2020'];

// define reclassification rules
var classeIds =    [3, 4, 12, 15, 19, 25, 33];
var newClasseIds = [3, 3, 12, 21, 21, 21, 27];

// define max frequency for each class
var options = {
    "classFrequency": {
        "3":  36, 
        "4":  36,
        "12": 36,
        "15": 36,
        "19": 36,
        "33": 36,
    },
};

var colList = ee.List([]);
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var colList = colList.add(imc_carta2.select(['classification_'+ano],['classification']));
}
var imc_carta = ee.ImageCollection(colList);

var img1 =  ee.Image(imc_carta.first());

var image_moda = imc_carta2.reduce(ee.Reducer.mode());

// ******* incidence **********
var imagefirst = img1.addBands(ee.Image(0)).rename(["classification", "incidence"]);

var incidence = function(imgActual, imgPrevious){
  
  imgActual = ee.Image(imgActual);
  imgPrevious = ee.Image(imgPrevious);
  
  var imgincidence = imgPrevious.select(["incidence"]);
  
  var classification0 = imgPrevious.select(["classification"]);
  var classification1 = imgActual.select(["classification"]);
  
  
  var change  = ee.Image(0);
  change = change.where(classification0.neq(classification1), 1);
  imgincidence = imgincidence.where(change.eq(1), imgincidence.add(1));
  
  return imgActual.addBands(imgincidence);
  
};

var imc_carta4 = imc_carta.map(function(image) {
    image = image.remap(classeIds, newClasseIds, 27)
    image = image.mask(image.neq(27));
    return image.rename('classification');
});

Map.addLayer(imc_carta4, vis, 'imc_carta4');

var image_incidence = ee.Image(imc_carta4.iterate(incidence, imagefirst)).select(["incidence"]);
//image_incidence = image_incidence.clip(geometry);

var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"];
imc_carta2 = imc_carta2.select(['classification_1985', 'classification_1986', 'classification_1987', 'classification_1988', 'classification_1989', 
                                'classification_1990', 'classification_1991', 'classification_1992', 'classification_1993', 'classification_1994', 
                                'classification_1995', 'classification_1996', 'classification_1997', 'classification_1998', 'classification_1999',
                                'classification_2000', 'classification_2001', 'classification_2002', 'classification_2003', 'classification_2004', 
                                'classification_2005', 'classification_2006', 'classification_2007', 'classification_2008', 'classification_2009', 
                                'classification_2010', 'classification_2011', 'classification_2012', 'classification_2013', 'classification_2014',
                                'classification_2015', 'classification_2016', 'classification_2017', 'classification_2018', 'classification_2019',
                                'classification_2020'],
                                
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
    'description': 'CERRADO_col6_incidMask_v'+ version_out,
    'assetId': dirout+'CERRADO_col6_incidMask_v'+ version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': image_incidence.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
