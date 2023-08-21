/** @description calculo do tempo após o fogo adaptado para  Cerrado
 - wallace.silva@ipam.org.br
*/
var scars = 'projects/mapbiomas-workspace/public/collection7_1/mapbiomas-fire-collection2-annual-burned-coverage-1';

scars = ee.Image(scars)
  .addBands(ee.Image(1).rename('burned_coverage_1984').byte());

var bandNames = ee.List.sequence(1984,2022,1);

print(bandNames);


var scars = 'projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-annual-burned-coverage-1';

scars = ee.Image(scars)
  .addBands(ee.Image(1).rename('burned_coverage_1984').byte())
  .addBands(ee.ImageCollection('users/geomapeamentoipam/Colecao_fogo_v6_0')
    .filter(ee.Filter.eq('year',2021))
    .mosaic()
    .rename('burned_coverage_2021'));

var bandNames = ee.List.sequence(1984,2021,1);

print(bandNames);

function fireAge (current, previous){
  
  // - 0º passo, variaveis de controle
  var year = ee.Number(current).int();
  var yearPost = year.add(1);
  var yearPrev = year.subtract(1);

  // - 1º passo, estimar o acumulado até o ano do looping    
  // estimando posição da lista no lopping
  var sliceIndex = bandNames.indexOf(current);
  sliceIndex = ee.Number(sliceIndex).add(1);
  var sliceList = bandNames.slice(0,sliceIndex,1);
  
  // mapeando lista com as imagens de fogo do ano
  var alreadyBurned = sliceList.map(function(y){
    return scars.select([ee.String('burned_coverage_').cat(ee.Number(y).int())])
      .rename('classification');
  });

  // reduzindo ela a uma unica imagem
  alreadyBurned = ee.ImageCollection(alreadyBurned).mosaic().byte();
  // definindo valor unifome em todos os pixels
  alreadyBurned = ee.Image(1).updateMask(alreadyBurned).byte();
  
  // - 2º passo, estimar o que queimou no ano do looping    
  var burnedThisYear = ee.Image(0).updateMask(scars.select([ee.String('burned_coverage_').cat(year)]))
    .byte();

  // - 3º passo, somar um a todas as areas que ja pegaram fogo em anos anteriores
  var newImage = ee.Image(previous)
    .select(ee.String('classification_').cat(yearPrev))
    .add(alreadyBurned).byte();

  // - 4º passo, mascarar as areas que pegaram fogo este ano
  newImage = newImage
    .blend(burnedThisYear);

  return ee.Image(previous)
    .addBands(
      newImage.rename(ee.String('classification_').cat(year))
    );
 
}

var first = ee.Image(0).mask(0).rename('classification_1983');
// var first = ee.Image(0).mask(0).rename('burned_coverage_1985');

var fireAgeImage = bandNames.iterate(fireAge,first);

fireAgeImage = ee.Image(fireAgeImage);

print(fireAgeImage);

// //  --- --- --- --- --- ---  ----  --- ---  --- ---  ---  ---  ---  ---  --- --- ---

var palette = [
  ['ffffff','F8D71F','DAA118','BD6C12','9F360B','810004','4D0709'],
  ['001219','000080','0000ff','0a9396','005f73','94d2bd','ee9b00','ca6702','bb3e03','ae2012','9b2226','800000']
];
palette = palette[1];

var visParams = {
  bands:['classification_2021'],
  bands:['classification_2020'],
  min:1,
  max:36,
  palette:palette.reverse()
};

Map.addLayer(fireAgeImage,visParams,'idade do fogo');
Map.addLayer(scars.gte(1),{},'scars');

var description = 'users/barbarasilvaIPAM/collection8/masks/fire_age';
var description = 'users/dh-conciani/collection7/masks/fire_age';

var bands = fireAgeImage.bandNames().slice(2);

print(bands);

var mask = ee.Image('users/dh-conciani/collection7/classification_regions/raster');

var image = fireAgeImage
  .select(bands)
  .updateMask(mask);

var geometry = mask.geometry();

Export.image.toAsset({
  image:image,
  description: 'fire_age',
  assetId:description,
  // pyramidingPolicy:,
  // dimensions:,
  region:geometry,
  scale:30,
  // crs:,
  // crsTransform:,
  maxPixels:1e13,
  // shardSize:
});
