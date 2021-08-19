// Post-processing - Apply incidence filter
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define input
var class4FT = ee.Image(dirout + 'CERRADO_col6_wetlands_gapfill_v53');
var image_incidence_geral = ee.Image(dirout + 'CERRADO_col6_wetlands_incidMask_v53');

// define output
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file_out = 'gapfill_incid_v';
var versao_out = 53;

// define the incidence threshold 
var incid_geral = 12 ;

// print image
print(image_incidence_geral);

// import mapbiomas color ramp
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
      bands: 'classificationWet_2020',
      min: 0,
      max: 49,
      palette: palettes.get('classification6'),
      format: 'png'
    };

// plot image without correction
Map.addLayer(class4FT, vis, 'gapfill');

// define years to be assessed
var anos3 = ['1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
              '1996','1997','1998','1999','2000','2001','2002','2003','2004','2005',
              '2006','2007','2008','2009','2010','2011','2012','2013','2014','2015',
              '2016','2017','2018','2019', '2020'];

// define color ramp for incidence
var palette_incidence = ["#C8C8C8","#FED266","#FBA713","#cb701b", "#cb701b", "#a95512", "#a95512", "#662000",  "#662000", "#cb181d"];
var palette_incidence = ['red'];

// plot incidence
Map.addLayer(image_incidence_geral, {bands: 'incidence', palette:palette_incidence, min:8, max:20}, "incidents", false);

// create recipe
var class4FT_corrigida = class4FT;

// apply incidence filter
var maskIncid_borda = image_incidence_geral.select('connect').lte(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral));
maskIncid_borda = maskIncid_borda.mask(maskIncid_borda.eq(1));              
Map.addLayer(maskIncid_borda, {palette:"#f49e27", min:1, max:1}, 'maskIncid_borda');

var corrige_borda = image_incidence_geral.select('mode').mask(maskIncid_borda);
//Map.addLayer(corrige_borda, vis2, 'corrige_borda', false);

var maskIncid_anual3 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(3)));
maskIncid_anual3 = ee.Image(3).mask(maskIncid_anual3);
//Map.addLayer(maskIncid_anual3, vis2, 'maskIncid_anual3', false)

var maskIncid_anual15 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(15)));
maskIncid_anual15 = ee.Image(15).mask(maskIncid_anual15);
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)

var maskIncid_anual19 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(19)));
maskIncid_anual19 = ee.Image(15).mask(maskIncid_anual15);
//Map.addLayer(maskIncid_anual15, vis2, 'maskIncid_anual15', false)


var maskIncid_anual4 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(4)));
maskIncid_anual4 = ee.Image(4).mask(maskIncid_anual4);
//Map.addLayer(maskIncid_anual4, vis2, 'maskIncid_anual4', false)

var maskIncid_anual12 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(12)));
maskIncid_anual12 = ee.Image(12).mask(maskIncid_anual12);
//Map.addLayer(maskIncid_anual12, vis2, 'maskIncid_anual12', false)

var maskIncid_anual11 = image_incidence_geral.select('connect').gt(6)
              .and(image_incidence_geral.select('incidence').gt(incid_geral))
              .and((image_incidence_geral.select('mode').eq(11)));
maskIncid_anual11 = ee.Image(11).mask(maskIncid_anual11);

// blend corrections
class4FT_corrigida = class4FT_corrigida.blend(corrige_borda);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual3);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual15);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual19);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual4);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual12);
class4FT_corrigida = class4FT_corrigida.blend(maskIncid_anual11);
class4FT_corrigida = class4FT_corrigida.toByte();
class4FT_corrigida = class4FT_corrigida.where(class4FT.eq(33), 33);
Map.addLayer(class4FT_corrigida, vis, 'class4FT corrigida');

// add connections as aux band for the years j
var anos = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995',
            '1996','1997','1998','1999','2000','2001','2002','2003', '2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019', '2020'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  class4FT_corrigida = class4FT_corrigida.addBands(class4FT_corrigida.select('classificationWet_'+ano).connectedPixelCount(100,false).rename('connect_'+ano));
}

// set properties 
class4FT_corrigida = class4FT_corrigida.set ("version", versao_out).set('step', 'incidents');
print(class4FT_corrigida);

// Export as GEE asset
Export.image.toAsset({
    'image': class4FT_corrigida,
    'description': 'CERRADO_col6_wetlands_' + file_out + versao_out,
    'assetId': dirout + 'CERRADO_col6_wetlands_' + file_out + versao_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': class4FT_corrigida.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
