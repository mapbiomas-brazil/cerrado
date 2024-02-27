/** 
 * @description Cálculo do tempo após o fogo adaptado para o Cerrado
 * - wallace.silva@ipam.org.br
 */

// Carregando a coleção de dados de cicatrizes de fogo
var scars = 'projects/mapbiomas-workspace/FOGO_COL2/SUBPRODUTOS/mapbiomas-fire-collection2-annual-burned-coverage-v2';

// Adicionando uma banda artificial para o ano de 1984
scars = ee.Image(scars)
  .addBands(ee.Image(1).rename('burned_coverage_1984').byte());
  
// Adicionando banda artificial para o ano de 2023, replicando o dado de 2022 
scars = scars.addBands(scars.select(['burned_coverage_2022'],['burned_coverage_2023']));

// Criando uma lista de nomes de bandas de 1984 a 2023
var bandNames = ee.List.sequence(1984, 2023, 1);

// Imprimindo a lista de nomes de bandas
print(bandNames);

// Definindo uma função para calcular a idade do fogo
function fireAge(current, previous) {
  
  // 0º passo, variáveis de controle
  var year = ee.Number(current).int();
  var yearPost = year.add(1);
  var yearPrev = year.subtract(1);

  // 1º passo, estimar o acumulado até o ano do looping
  var sliceIndex = bandNames.indexOf(current);
  sliceIndex = ee.Number(sliceIndex).add(1);
  var sliceList = bandNames.slice(0, sliceIndex, 1);

  var alreadyBurned = sliceList.map(function(y) {
    return scars.select([ee.String('burned_coverage_').cat(ee.Number(y).int())])
      .rename('classification');
  });

  alreadyBurned = ee.ImageCollection(alreadyBurned).mosaic().byte();
  alreadyBurned = ee.Image(1).updateMask(alreadyBurned).byte();

  // 2º passo, estimar o que queimou no ano do looping
  var burnedThisYear = ee.Image(0).updateMask(scars.select([ee.String('burned_coverage_').cat(year)]))
    .byte();

  // 3º passo, somar um a todas as áreas que já pegaram fogo em anos anteriores
  var newImage = ee.Image(previous)
    .select(ee.String('classification_').cat(yearPrev))
    .add(alreadyBurned).byte();

  // 4º passo, mascarar as áreas que pegaram fogo este ano
  newImage = newImage.blend(burnedThisYear);

  return ee.Image(previous)
    .addBands(newImage.rename(ee.String('classification_').cat(year)));
}

// Inicializando a primeira imagem
var first = ee.Image(0).mask(0).rename('classification_1983');

// Iterando sobre os anos para calcular a idade do fogo
var fireAgeImage = bandNames.iterate(fireAge, first);

// Convertendo a imagem final
fireAgeImage = ee.Image(fireAgeImage);

// Imprimindo a imagem resultante
print(fireAgeImage);

// Paleta de cores para visualização
var palette = [
  ['ffffff','F8D71F','DAA118','BD6C12','9F360B','810004','4D0709'],
  ['001219','000080','0000ff','0a9396','005f73','94d2bd','ee9b00','ca6702','bb3e03','ae2012','9b2226','800000']
];
palette = palette[1];

// Parâmetros de visualização
var visParams = {
  bands: ['classification_2022'],
  min: 1,
  max: 38,
  palette: palette.reverse()
};

// Imprimindo a imagem de idade do fogo
print('fireAgeImage', fireAgeImage);

// Adicionando camadas ao mapa
Map.addLayer(fireAgeImage, visParams, 'idade do fogo');
Map.addLayer(scars.gte(1), {}, 'scars');

// Definindo a descrição e caminho no Earth Engine para exportação
var description = 'users/barbarasilvaIPAM/collection8/masks/fire_age';
var description = 'users/dh-conciani/collection7/masks/fire_age';

// Obtendo as bandas relevantes para exportação
var bands = fireAgeImage.bandNames().slice(2);

// Carregando uma máscara
var mask = ee.Image('users/dh-conciani/collection7/classification_regions/raster');

// Selecionando bandas e aplicando a máscara
var image = fireAgeImage
  .select(bands)
  .updateMask(mask);

// Obtendo a geometria da máscara
var geometry = mask.geometry();

// Exportando a imagem para o Asset
Export.image.toAsset({
  image: image,
  description: 'fire_age',
  assetId: description,
  region: geometry,
  scale: 30,
  maxPixels: 1e13,
});
