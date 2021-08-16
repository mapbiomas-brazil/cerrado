// Script entirely from GT Água (AUTHOR)
// Adapted by dhemerson.costa@ipam.org.br to export  a sum of monthly water frequency (without filters) // 
// For default, select biome Cerrado, years from 1985 to 2019 and press OK

var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/waterFreq_';

// bioma
var biom;
var biom_str;
var year_0;
var year_1;

col = col.map(function (i) {
  var ano = ee.Number.parse(ee.String(i.get('system:index')).slice(12));
  return i.set('year', ano);
});

Map.addLayer(ee.Image().select(), {}, 'default layer 0', false);
Map.addLayer(ee.Image().select(), {}, 'default layer 1', false);
Map.addLayer(ee.Image().select(), {}, 'default layer 2', false);

var bioms_list = [
  'MATAATLANTICA',
  'CERRADO',
  'CAATINGA',
  'AMAZONIA',
  'PANTANAL',
  'PAMPA'
  ];

var year_0_txt = ui.Textbox('year 0');
var year_1_txt = ui.Textbox('year_1');

var select_biom = ui.Select({
  items: bioms_list, 
  placeholder: 'biome...', 
  onChange: function (chosen_biom) {
    biom = bioms.filter(ee.Filter.eq('name', chosen_biom));
    biom_str = chosen_biom;
  } 
});

var ok_button = ui.Button({
  label: 'OK', 
  onClick: function () {

var blues = [
  'ffffff',
  '00ffff',
  '0000ff',
  '000040'
  ];

var bands = [
  'w_1_w_1',
  'w_2_w_2',
  'w_3_w_3',
  'w_4_w_4',
  'w_5_w_5',
  'w_6_w_6',
  'w_7_w_7',
  'w_8_w_8',
  'w_9_w_9',
  'w_10_w_10',
  'w_11_w_11',
  'w_12_w_12',
  ];

var year_0 = ee.Number.parse(year_0_txt.getValue(), 10);
var year_1 = ee.Number.parse(year_1_txt.getValue(), 10);
  
var year_list = ee.List.sequence(year_0, year_1, 1);

var imgs_list = year_list.map(function (year) {
  return col.filter(ee.Filter.eq('year', year)).first();
});

var bands_imgCol_list = imgs_list.map(function (f) {
  
  var img = ee.Image(f);
  
  var bands_imgs = bands.map(function (band) {
    return img.select(band);
  });
  
  var bands_list = ee.List(bands_imgs);
  
  return bands_list;
});

var bands_list = bands_imgCol_list.flatten();

bands_list = bands_list.map(function (e) {
  return ee.Image(e).set('index', bands_list.indexOf(e).add(1));
});

var bands_imgCol = ee.ImageCollection.fromImages(bands_list.flatten()).map(function (i) {
  return i.float().rename('water');
});

var time_imgCol = bands_imgCol.map(function (i) {
  return i.multiply(ee.Number(i.get('index'))).rename('timeband').float();
});

var max = time_imgCol.reduce(ee.Reducer.max());
var min = time_imgCol.reduce(ee.Reducer.min());

var start = 0;
var end = ee.Image.constant(time_imgCol.size());

var red = end.subtract(max).updateMask(max).clip(biom);// max2end
var green = min.clip(biom);// start2min
var blue = bands_imgCol.reduce(ee.Reducer.sum()).clip(biom);

var rgb = ee.Image.rgb(red, green, blue);

var max_index = time_imgCol.size().getInfo();

var rgb_vis = {
  min:0,
  max: max_index
};

var rgb_layer = ui.Map.Layer(rgb, rgb_vis, 'temporal behavior ' + year_0_txt.getValue() + '-' + year_1_txt.getValue(), false);

var freq2_layer = ui.Map.Layer(blue, {palette: blues, min:1, max:max_index}, 'freq. total ' + year_0_txt.getValue() + '-' + year_1_txt.getValue(), true);

var mosaic_vis = {
  bands: ['red_p25', 'green_p25', 'blue_p25'],
  min:0, max: 1500
};

var layer_0 = ui.Map.Layer(ee.Image(1).clip(biom), {palette: '008000'}, 'background', true, 0.5);

Map.remove(Map.layers().get(0));
Map.layers().insert(0, layer_0);

Map.remove(Map.layers().get(1));
Map.layers().insert(1, freq2_layer);

Map.remove(Map.layers().get(2));
Map.layers().insert(2, rgb_layer);

//exportar frequencia
// print ('blue',blue)
Map.addLayer(blue.geometry(),{},'blue');
 Export.image.toAsset({
      image: blue, 
      description: 'waterFreq_' + biom_str + '_' + year_0_txt.getValue() + '_' + year_1_txt.getValue(), 
      scale: 30, 
      maxPixels: 26501164480, 
      assetId:  dirout + biom_str + '_' + year_0_txt.getValue() + '_' + year_1_txt.getValue(),
      region:geometry
    });
}
});

var fc_id_1 = Map.drawingTools().layers().get(0).getEeObject();
var fc_id_2 = Map.drawingTools().layers().get(1).getEeObject();
var fc_id_3 = Map.drawingTools().layers().get(2).getEeObject();
var fc_id_4 = Map.drawingTools().layers().get(3).getEeObject();
var fc_id_5 = Map.drawingTools().layers().get(4).getEeObject();
var fc_id_6 = Map.drawingTools().layers().get(5).getEeObject();
var fc_id_7 = Map.drawingTools().layers().get(6).getEeObject();
var fc_id_8 = Map.drawingTools().layers().get(7).getEeObject();
var fc_id_9 = Map.drawingTools().layers().get(8).getEeObject();
var fc_id_10 = Map.drawingTools().layers().get(9).getEeObject();
var fc_id_11 = Map.drawingTools().layers().get(10).getEeObject();
var fc_id_12 = Map.drawingTools().layers().get(11).getEeObject();
var fc_id_13 = Map.drawingTools().layers().get(12).getEeObject();
var fc_id_14 = Map.drawingTools().layers().get(13).getEeObject();
var fc_id_15 = Map.drawingTools().layers().get(14).getEeObject();
var fc_id_16 = Map.drawingTools().layers().get(15).getEeObject();

var global_inspection = fc_id_1
  .merge(fc_id_2)
  .merge(fc_id_3)
  .merge(fc_id_4)  
  .merge(fc_id_5)
  .merge(fc_id_6)
  .merge(fc_id_7)
  .merge(fc_id_8)
  .merge(fc_id_9)
  .merge(fc_id_10)
  .merge(fc_id_11)
  .merge(fc_id_12)
  .merge(fc_id_13)
  .merge(fc_id_14)
  .merge(fc_id_15)
  .merge(fc_id_16);


var export_button = ui.Button({
  label: 'Export', 
  onClick: function () {
    Export.table.toAsset({
      collection: global_inspection, 
      description: 'global_inspection_' + biom_str, 
      assetId:  'global_inspection_' + biom_str
    });

  }, 
  });  

var panel = ui.Panel([select_biom, year_0_txt, year_1_txt, ok_button, export_button], ui.Panel.Layout.flow('horizontal', false));

Map.add(panel);
