// perform mapbiomas stability class analisys
// dhemerson.costa@ipam.org.br

// define collections
var collections = ['3.1', '4.1', '5.0', '6.0'];

// load cerrado raster
var biomas = ee.Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster');
var cerrado = biomas.updateMask(biomas.eq(4));

// load regions vector
var regions_vec = ee.FeatureCollection('users/dhconciani/base/cerrado_regioes_c6');

// count recipe
var recipe_vec = ee.FeatureCollection([]);

// import mapbiomas pallete
var vis = {
      min: 0,
      max: 45,
      palette: require('users/mapbiomas/modules:Palettes.js').get('classification5'),
      format: 'png'
    };

// For each collection
collections.forEach(function(col_i) {
  // declare recipes
  var collection;
  var yearsMap;
  var yyyyList;
  
  // import respective collection
  if (col_i == '3.1'){
    collection = ee.Image('projects/mapbiomas-workspace/public/collection3_1/mapbiomas_collection31_integration_v1');
    yyyyList = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995',
                '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006',
                '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
  }
  if (col_i == '4.1'){
    collection = ee.Image('projects/mapbiomas-workspace/public/collection4_1/mapbiomas_collection41_integration_v1');
    yyyyList = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995',
                '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006',
                '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', 
                '2018'];
  }
  if (col_i == '5.0'){
    collection = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1');
    yyyyList = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995',
                '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006',
                '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', 
                '2018', '2019'];
  }
  if (col_i == '6.0'){
    collection = ee.ImageCollection('projects/mapbiomas-workspace/COLECAO6/mapbiomas-collection60-integration-v0-10').mosaic();
    yyyyList = ['1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995',
                '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006',
                '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', 
                '2018', '2019', '2020'];
  }
  
  // mask only to cerrado biome
      collection = collection.updateMask(cerrado);
      
  // list classes from level-3
  var level3 = ee.List([
                 3, 4, 5, // Natural Forest Formation,
                 15, // Pasture,
                 9, // Forest Plantation,
                 11, 12, 13, 32, // Non Forest Formation,
                 21, // Mosaic of Agriculture and Pasture,
                 19, 20, 28, 36, 39, 41, // Agriculture,
                 23, 24, 25, 29, 30, // Non Vegetated Areas,
                 26, 33, 31, // Water Bodies,
                 27 // Non Observed
                 ]);
  
  // Aggregate into level 1               
  var aggregate = ee.List([
                1, 1, 1,
                2,
                2, 
                1, 1, 1, 1,
                2,
                2, 2, 2,2,2,2,
                2, 2, 2, 2, 2,
                2, 2, 2,
                2
                ]);
                
  var ListClassBins = ee.List([]);

  var collection2multiband = function (collection) {
  
      var imageList = collection.toList(collection.size()).slice(1);
  
      var multiBand = imageList.iterate(
          function (band, image) {
  
              return ee.Image(image).addBands(ee.Image(band));
          },
          ee.Image(collection.first())
      );
  
      return ee.Image(multiBand);
  };
  
  
  var remap2bin = function (listedYear) {
    var img = collection.select(ee.List(yyyyList).indexOf(listedYear));
    var name = img.bandNames().get(0);
    img = img.remap(level3, aggregate, 0);
    
    return(img.rename(ee.String(name)));
  } ;
  
  var classBin = collection2multiband(ee.ImageCollection.fromImages(ee.List(yyyyList).map(remap2bin).flatten()));

  var stable = classBin.reduce(ee.Reducer.countDistinct()).eq(1); 
  var naturalStable = stable.eq(1).and(classBin.select(0).eq(1)); 
  var naturalStableClasses = classBin.eq(1).updateMask(classBin.eq(1)).where(naturalStable.eq(1),
                                            collection);
      naturalStableClasses = naturalStableClasses.updateMask(naturalStableClasses.gt(1));                                      
                        
  var classes = [3, 4, 11, 12];
  
  var freq = ee.List(classes).map(function (k){
    k = ee.Number(k);
    var freqClass = naturalStableClasses.eq(ee.Image(k)).reduce(ee.Reducer.sum());
        freqClass = freqClass.updateMask(freqClass.neq(0));
    return (freqClass.rename(ee.String("class_").cat(ee.String(k))).unmask(0));
  });
  freq = collection2multiband(ee.ImageCollection.fromImages(freq)).aside(print);
  freq = freq.updateMask(freq.gt(1));
  
  // select image ofr each band
  var r_floresta = freq.select(['class_3']);
  var r_savana = freq.select(['class_4']);
  var r_wetland = freq.select(['class_11']);
  var r_campo = freq.select(['class_12']);
  
  // for each class
  classes.forEach(function(process_class) {
    // and for each region
    var computeFreq = function(region_i) {
        var count;
        var value;
        
    if (process_class == 3) {
      count = r_floresta.reduceRegion({
                reducer  : ee.Reducer.frequencyHistogram(),
                geometry : region_i.geometry(),
                scale: 30,
                maxPixels: 1e13});
                
      value = ee.Dictionary(ee.Number(count.get('class_3')));
    }
    if (process_class == 4) {
      count = r_savana.reduceRegion({
                reducer  : ee.Reducer.frequencyHistogram(),
                geometry : region_i.geometry(),
                scale: 30,
                maxPixels: 1e13});
                
       value = ee.Dictionary(ee.Number(count.get('class_4')));
    }
    if (process_class == 11) {
      count = r_wetland.reduceRegion({
                reducer  : ee.Reducer.frequencyHistogram(),
                geometry : region_i.geometry(),
                scale: 30,
                maxPixels: 1e13});
                
        value = ee.Dictionary(ee.Number(count.get('class_11')));
    }
    if (process_class == 12) {
      count = r_campo.reduceRegion({
                reducer  : ee.Reducer.frequencyHistogram(),
                geometry : region_i.geometry(),
                scale: 30,
                maxPixels: 1e13});
                
      value = ee.Dictionary(ee.Number(count.get('class_12')));
    }
    
    return region_i.set(value).set('col', col_i).set('ref', process_class);
    };
    
    // compute
    var values = regions_vec.map(computeFreq);
    print (col_i, values.first());
    // bind
    recipe_vec = recipe_vec.merge(values);
    });
  });
  
  Export.table.toDrive({
  collection: recipe_vec,
  description: 'freq_cols',
  folder: 'gee',
  fileFormat: 'CSV'
});
  
  
