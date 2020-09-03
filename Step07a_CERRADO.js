
//==================Edicao Usuario====================================================================
//Trocar o asset abaixo
var version_out = 2
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/'
var palettes = require('users/mapbiomas/modules:Palettes.js');
var imc_carta2 = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')

var options = {
    "classFrequency": {
        "3": 35, // Ex: Para ser considerada persistente, esta classe precisa ter frequência maior que 15 na série temporal.
        "4": 35,
        "12": 35,
        "15": 35,
        "19": 35,
        "33": 35,
    },
};

var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};
var visParMedian = {'bands':['median_swir1','median_nir','median_red'], 'gain':[0.08, 0.06,0.2],'gamma':0.5 };

//editar os parametros
var anos = ['1985', '1986', '1987','1988', '1989', '1990','1991', '1992', '1993','1994', '1995', '1996','1997', '1998', '1999','2000', '2001', '2002','2003', '2004', '2005','2006', '2007', '2008','2009', '2010', '2011','2012', '2013', '2014','2015', '2016', '2017', '2018']
var classeIds =  [3,4,12,15,19,25,33]
var newClasseIds = [3,3,12,21,21,21,27]
var bioma = "CERRADO"


var colList = ee.List([])
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var colList = colList.add(imc_carta2.select(['classification_'+ano],['classification']))
}
var imc_carta = ee.ImageCollection(colList)

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

var vis2 = {
    'bands': '2018',
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
imc_carta2 = imc_carta2.select(['classification_1985', 'classification_1986', 'classification_1987', 'classification_1988', 'classification_1989', 
                                'classification_1990', 'classification_1991', 'classification_1992', 'classification_1993', 'classification_1994', 
                                'classification_1995', 'classification_1996', 'classification_1997', 'classification_1998', 'classification_1999',
                                'classification_2000', 'classification_2001', 'classification_2002', 'classification_2003', 'classification_2004', 
                                'classification_2005', 'classification_2006', 'classification_2007', 'classification_2008', 'classification_2009', 
                                'classification_2010', 'classification_2011', 'classification_2012', 'classification_2013', 'classification_2014',
                                'classification_2015',
                                'classification_2016', 'classification_2017', 'classification_2018',
                                'classification_2019'],
                               ['1985', '1986', '1987','1988', '1989', '1990','1991', '1992', '1993','1994', '1995', '1996','1997', '1998', '1999',
                                '2000', '2001', '2002','2003', '2004', '2005','2006', '2007', '2008','2009', '2010', '2011','2012', '2013', '2014',
                                '2015', '2016', '2017', '2018','2019'])
Map.addLayer(imc_carta2, vis2, 'MapBiomas'); 

image_incidence = image_incidence.mask(image_incidence.gt(10))
                       .set("version", version_out)
                       .set("biome", "CERRADO")
                       .set("step", "prep_incid");

image_incidence = image_incidence.addBands(image_incidence.where(image_incidence.gt(10),1).rename('valor1'))
image_incidence = image_incidence.addBands(image_incidence.select('valor1').connectedPixelCount(100,false).rename('connect'))
image_incidence = image_incidence.addBands(image_moda)
print(image_incidence)
Map.addLayer(image_incidence, {}, "incidents");

Export.image.toAsset({
    'image': image_incidence,
    'description': 'CERRADO_step2_'+version_out,
    'assetId': dirout+'CERRADO_step2_'+version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});