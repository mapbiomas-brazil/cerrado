var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
var versao_out = 4;

var class4FT = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step1_2')
var image_incidence_geral = ee.Image('projects/mapbiomas-workspace/COLECAO5/classificacao-test/CERRADO_step2_2');
var dirout = 'projects/mapbiomas-workspace/COLECAO5/classificacao-test/';

var incid_geral = 12 
print(image_incidence_geral)



//var class4Gap = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col4/MATA_ATLANTICA/class_col4_bioma/MA_col4_v2c')
var palettes = require('users/mapbiomas/modules:Palettes.js');
var pal = palettes.get('classification2');
var vis = {
      bands: 'classification_2018',
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
var vis2 = {
      min:0,
      max:34,
      palette: pal,
      format: 'png'
    };
Map.addLayer(class4FT, vis, 'class4FT');

var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

//Map.addLayer(class4Gap, {}, 'class GAP', false)
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"]
var palette_incidence = ['red']
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

var class4FT_corrigida = class4FT


var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1))              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda')
var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda)
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)))
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3)
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)))
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)))
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15)
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)))
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4)
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)))
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12)
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)


class4FT_corrigida = class4FT_corrigida.blend(corrige_borda)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4)
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12)
class4FT_corrigida = class4FT_corrigida.toByte()
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

//var connect = class4FT_corrigida.connectedPixelCount(100,false)
//print(class4FT_corrigida)

var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003',
'2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano))
}

class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents')

print(class4FT_corrigida)

Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_step2b_v-'+versao_out,
    'assetId': dirout+'CERRADO_step2b'+versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
