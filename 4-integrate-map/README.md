## 1-rect-cerrado-sp.js
Perform local corrections in the state of São Paulo to avoid abrupt transitions from forest to savana among Cerrado and Mata Atlântica.
```javascript
// plot result
var cerrado = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_gapfill_incid_temporal_spatial_freq_v9');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
    };
    
Map.addLayer(cerrado.select(['classification_2020']), vis, 'cerrado'); 
```
[Link to script](https://code.earthengine.google.com/908fe176a42030772374522fde55c3ad)

## 2-integrate-wetlands-general.js
Integrate the wetlands map over general map. For this, we integrate wetlands (11) only over grassland (12), savanna (4) and pasture (15).
```javascript
// plot result
var cerrado = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_wetlandsv7_generalv9');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
    };
    
Map.addLayer(cerrado.select(['classification_2020']), vis, 'cerrado'); 
```
[Link to script](https://code.earthengine.google.com/19709467a524c44c9c899d1994074508)

## 3-create-mosaic-class.js
Convert pasture (15) and agriculture (19) to mosaic of agriculture and pasture (21)
```javascript
// plot result
var cerrado = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_final_v10');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
    };
    
Map.addLayer(cerrado.select(['classification_2020']), vis, 'cerrado'); 
```
[Link to script](https://code.earthengine.google.com/e9f54c277d9f5b4448fe149a83f436b8)

## 4-send-to-workspace.js
Slice bands into single images, insert production metadata and send to Mapbiomas workspace. <br>
Collection 6 done :-)
