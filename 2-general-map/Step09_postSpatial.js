// Post-processing - Spatial filter 
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define geometry (raw extent of cerrado)
var geometry = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-42.306314047317365, -1.7207103925816054],
          [-44.415689047317365, -1.4571401339250152],
          [-54.259439047317365, -10.451581892159153],
          [-61.202798422317365, -10.624398320896237],
          [-61.202798422317365, -14.739254413487872],
          [-57.775064047317365, -18.027281070807337],
          [-59.005532797317365, -23.85214541157912],
          [-48.370767172317365, -25.84584109333063],
          [-40.548501547317365, -17.52511660076233],
          [-40.636392172317365, -2.774571568871124]]]);

// define input
var bioma = "CERRADO";
var file_in = 'CERRADO_col6_gapfill_incid_temporal_v6';

// define output
var dirout = 'projects/mapbiomas-workspace/COLECAO6/classificacao-test/';
var file_out = 'CERRADO_col6_gapfill_incid_temporal_spatial_v';
var version_out = 6;

// read image
var class4GAP = ee.Image(dirout + file_in);

// define minimum mapeable area
var filter_lte = 5;

// import mapbiomas color ramp
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
      bands: 'classification_1985',
      min:0,
      max:34,
      palette: palettes.get('classification2'),
      format: 'png'
    };

// plot 
Map.addLayer(class4GAP, vis, 'unfiltered');

// compute mode
var ano = '1985'; 
var moda_85 = class4GAP.select('classification_'+ ano).focal_mode(1, 'square', 'pixels')
var conn = class4GAP.select('classification_'+ ano).connectedPixelCount(100,false).rename('connect_'+ano)
moda_85 = moda_85.mask(conn.select('connect_'+ ano).lte(filter_lte))
var class_outTotal = class4GAP.select('classification_'+ano).blend(moda_85)

// plot mode
Map.addLayer(class_outTotal, vis, 'class4 MODA');

// define years to be filtered
var anos = ['1986','1987','1988','1989','1990','1991', '1992','1993','1994','1995',
            '1996','1997','1998','1999','2000','2001', '2002','2003','2004','2005',
            '2006','2007','2008','2009','2010','2011', '2012','2013','2014','2015',
            '2016','2017','2018', '2019', '2020'];

// apply spatial filter
for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  var moda = class4GAP.select('classification_'+ano).focal_mode(1, 'square', 'pixels')
  var conn = class4GAP.select('classification_'+ano).connectedPixelCount(100,false).rename('connect_'+ano)
  moda = moda.mask(conn.select('connect_'+ano).lte(filter_lte))
  var class_out = class4GAP.select('classification_'+ano).blend(moda)
  class_outTotal = class_outTotal.addBands(class_out)
}

// print
print(class_outTotal)

// set properties
class_outTotal = class_outTotal.set("version", version_out).set("step", "spatial")

// export as GEE asset
Export.image.toAsset({
    'image': class_outTotal,
    'description': file_out + version_out,
    'assetId': dirout + file_out + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': geometry,
    'scale': 30,
    'maxPixels': 1e13
});
