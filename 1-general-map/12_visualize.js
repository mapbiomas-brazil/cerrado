// -- -- -- -- 12_visualize
// visualize final result
// barbara.silva@iapm.org.br

// visualize params
var visparams = {
  palette: require('users/mapbiomas/modules:Palettes.js').get('classification7'),
  min: 0,
  max: 62,
};

// input version
var version = '14';

// Collection 
var cerrado = ee.Image('projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_spatial_v'+version);
print ("Cerrado Col.8 - Version "+version, cerrado);
Map.addLayer(cerrado, {}, "Cerrado Col.8 - Version "+version, false);

var geometry = cerrado.geometry().buffer(2000).bounds();
var scale = 2500;
var oeel = require('users/OEEL/lib:loadAll');

// scale bar
var scale_bar = oeel.Map.scaleLayer({
  mapScale:scale,
  point:scale_point,
  size:2,
  color1:'#000000',
  color2:'#ffffff',
  //scale:5,
  direction:'right'
  });
Map.addLayer(scale_bar, {}, 'scale_bar', false);

// Widgets
cerrado.bandNames().evaluate(function(bands){
  
  var widgets = bands.map(function(band){

    var year = 'classification_'+band.slice(-4);
   // var year_image = text.draw(year, title_point, scale, {fontSize:24, textColor: '000000', outlineColor: 'fefefe', outlineWidth: 2, outlineOpacity: 0.6 });
    
    var mapa_base = ee.Image().visualize({palette:'fefefe'}) // backgroundCollor
      //.blend(year_image) 
      .blend(scale_bar);
    
    var lulc_year = cerrado.select(band).visualize(visparams);
    
    var ui_layer = ui.Map.Layer({
        eeObject:cerrado.select('classification_'+band.slice(-4)),
        visParams:visparams, 
        name:year,
        shown:true, 
        opacity:1
        });
    
    var thumbs = [lulc_year].map(function(image){
      return ui.Thumbnail({
        image:image
          .blend(mapa_base)
          .reproject({
            crs: 'EPSG:4326',
            crsTransform:[
              0.04166655782331577,
              0,
              -76.3331339323145,
              0,
              -0.04166655782331577,
              7.791646312960049
            ], 
          }),
        params:{
          dimensions:800,
          region:geometry.buffer(2000).bounds()
        },
        // onClick:,
        style:{
          height:'256px',
          backgroundColor:'fafafa'
        }
      });
    });

    var panel = ui.Panel({
      widgets:thumbs,
      layout:ui.Panel.Layout.Flow('horizontal'),
      style:{}
    });
    
    var check = ui.Checkbox({
      label:year,
      value:false,
      onChange:function(value){
        if (value === true){
          var position = Map.layers().length() - 2;
          Map.layers().insert(position,ui_layer);
        } else {
          Map.remove(ui_layer);
        }
      },
    });
    
    var panel2 = ui.Panel({
      widgets:check,
      layout:ui.Panel.Layout.Flow('horizontal'),
      style:{}
    });

    return ui.Panel({
      widgets:[panel2, panel], 
      layout:ui.Panel.Layout.Flow('vertical'),
      style:{}
    });
    
  });
  
    widgets = ui.Panel({
      widgets:widgets, 
      layout:ui.Panel.Layout.Flow('horizontal',true),
      style:{}
    });
    
  var splitPanel = ui.SplitPanel({
    firstPanel:ui.root.widgets().get(0), // ui.Map() nativa
    secondPanel:widgets,
    // orientation:,
    // wipe:,
    style:{}
  });
  
  ui.root.widgets().reset([splitPanel]);
    
});
