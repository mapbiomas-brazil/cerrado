// -- -- -- -- 10_geomorfology
// apply geomorfology filters
// barbara.silva@ipam.org.br

var geometry2 = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.MultiPolygon(
        [[[[-44.32374930624647, -5.769340940543665],
           [-44.330615761324594, -5.755677428022526],
           [-44.333362343355844, -5.742696786901796],
           [-44.33954215292616, -5.724250104074567],
           [-44.35121512655897, -5.704436337216081],
           [-44.35739493612928, -5.68530515419796],
           [-44.37318778280897, -5.657290489377624],
           [-44.399280312105844, -5.638157742963459],
           [-44.40820670370741, -5.627907797784472],
           [-44.42605948691053, -5.623807769099364],
           [-44.43704581503553, -5.619024365786754],
           [-44.445972206637094, -5.626541124767492],
           [-44.45489859823866, -5.634057786596366],
           [-44.46931815390272, -5.636107768399066],
           [-44.47687125448866, -5.63132446627102],
           [-44.492664101168344, -5.627224461677482],
           [-44.51395011191053, -5.621757743921468],
           [-44.528369667574594, -5.621074400590904],
           [-44.542102577730844, -5.6203910564581925],
           [-44.553088905855844, -5.614240923183531],
           [-44.564075233980844, -5.600573728112535],
           [-44.57574820761366, -5.585539444310719],
           [-44.59085440878553, -5.575971971858628],
           [-44.62685770149841, -5.560253642918716],
           [-44.63578409309997, -5.549318905557935],
           [-44.65157693977966, -5.559570227781341],
           [-44.66050333138122, -5.562303883569052],
           [-44.68453592415466, -5.562303883569052],
           [-44.691402379232784, -5.56367070670016],
           [-44.686595860678096, -5.592373257564692],
           [-44.702388707357784, -5.603307192727371],
           [-44.70994180794372, -5.6162909748224585],
           [-44.696895543295284, -5.623124428175807],
           [-44.681102696615596, -5.630641134180487],
           [-44.67148965950622, -5.6422576703669725],
           [-44.667369786459346, -5.6525073620236155],
           [-44.663936558920284, -5.664123459831311],
           [-44.67972940559997, -5.6818888045326545],
           [-44.63235086556091, -5.717417848139628],
           [-44.617244664389034, -5.74542957805354],
           [-44.604198399740596, -5.765241921318865],
           [-44.59183878059997, -5.776172573400398],
           [-44.58359903450622, -5.789835591825585],
           [-44.573299351889034, -5.806913900200217],
           [-44.562999669271846, -5.796666977201768],
           [-44.524547520834346, -5.773439930140019],
           [-44.504634801107784, -5.756360611455334],
           [-44.490901890951534, -5.751578310186182],
           [-44.453136388021846, -5.744746381494838],
           [-44.444209996420284, -5.761826049346984],
           [-44.40781778450622, -5.760459694803881],
           [-44.38859171028747, -5.767974604093095],
           [-44.37485880013122, -5.788469304836508],
           [-44.357006016928096, -5.816477526860544],
           [-44.343273106771846, -5.813745078681815],
           [-44.313060704428096, -5.8130619645637385],
           [-44.295894566732784, -5.811012617234918],
           [-44.27598184700622, -5.808280142526011],
           [-44.269115391928096, -5.788469304836508],
           [-44.26499551888122, -5.7672914346335205],
           [-44.27254861946716, -5.729032634643099],
           [-44.28147501106872, -5.711268748052685],
           [-44.29520792122497, -5.697603844991756],
           [-44.31374734993591, -5.698970349943023],
           [-44.33297342415466, -5.70375309165451],
           [-44.334346715170284, -5.742696786901796]]],
         [[[-44.07748764777359, -5.624672935111339],
           [-44.09396713996109, -5.609639271905929],
           [-44.068561256172025, -5.612372694065017],
           [-44.04246872687515, -5.615106103409495],
           [-44.04040879035171, -5.587088050940039],
           [-44.04040879035171, -5.5631691405398405],
           [-44.04040879035171, -5.546767039592398],
           [-44.05139511847671, -5.537882377764844],
           [-44.049335181953275, -5.521479574372473],
           [-44.0452153089064, -5.504392838145065],
           [-44.0616948010939, -5.490039600161448],
           [-44.07336777472671, -5.478420059102684],
           [-44.071307838203275, -5.452446150805028],
           [-44.074054420234525, -5.426471118541088],
           [-44.09122055792984, -5.399127770874095],
           [-44.10770005011734, -5.37998669329145],
           [-44.12005966925796, -5.358110438754825],
           [-44.08435410285171, -5.345121041748691],
           [-44.06993454718765, -5.338968073275287],
           [-44.082294166328275, -5.314355582573175],
           [-44.06787461066421, -5.2911095493142835],
           [-44.0616948010939, -5.276067532691662],
           [-44.05688828253921, -5.248717477961348],
           [-44.06787461066421, -5.226836570319306],
           [-44.08435410285171, -5.219998629761364],
           [-44.104266822578275, -5.211109195588785],
           [-44.090533912422025, -5.19196229503103],
           [-44.0836674573439, -5.187175478962409],
           [-44.07542771125015, -5.1728148130566725],
           [-44.06100815558609, -5.1399892116691],
           [-44.04315537238296, -5.109897590662184],
           [-44.0287358167189, -5.085960064317233],
           [-44.0342289807814, -5.070229204946564],
           [-44.04796189093765, -5.066125439431654],
           [-44.04796189093765, -5.051078076432983],
           [-44.02942246222671, -5.033294378997849],
           [-44.021869361640775, -5.018246255220918],
           [-44.043842017890775, -4.986780876161098],
           [-44.054828346015775, -4.962154744626007],
           [-44.06238144660171, -4.949841333946631],
           [-44.08298081183609, -4.941632266131819],
           [-44.079547584297025, -4.915545542083732],
           [-44.07336777472671, -4.8957057646492395],
           [-44.07336777472671, -4.879970350209385],
           [-44.08641403937515, -4.870392091130907],
           [-44.10083359503921, -4.869023757261147],
           [-44.10632675910171, -4.8526035339137765],
           [-44.098773658515775, -4.8409723005739105],
           [-44.085040748359525, -4.837551311512243],
           [-44.079547584297025, -4.8218145393592415],
           [-44.087787330390775, -4.79376112894211],
           [-44.101520240547025, -4.77528630233664],
           [-44.09396713996109, -4.739019456498397],
           [-44.082294166328275, -4.710962665642742],
           [-44.079547584297025, -4.687010850539033],
           [-44.08092087531265, -4.670586274030667],
           [-44.079547584297025, -4.65005501261037],
           [-44.068561256172025, -4.637735968345246],
           [-44.06238144660171, -4.61651933319419],
           [-44.068561256172025, -4.595986501547011],
           [-44.08641403937515, -4.58366651845676],
           [-44.101520240547025, -4.574768620774028],
           [-44.090533912422025, -4.5494432306014945],
           [-44.107013404609525, -4.541229399014971],
           [-44.128986060859525, -4.5261704649845065],
           [-44.139972388984525, -4.492628987362653],
           [-44.1221196057814, -4.4933135227752885],
           [-44.096027076484525, -4.502212424619106],
           [-44.074054420234525, -4.505635050208012],
           [-44.049335181953275, -4.503581476787219],
           [-44.02530258917984, -4.4939980575452365],
           [-43.9738041760939, -4.496051657997945],
           [-43.917499244453275, -4.454293981511052],
           [-43.88866013312515, -4.414587762076003],
           [-43.892780006172025, -4.378987275868346],
           [-43.90719956183609, -4.340646396665111],
           [-43.91818588996109, -4.316682357092206],
           [-43.93741196417984, -4.300249435282296],
           [-43.95251816535171, -4.285870337927147],
           [-43.9463383557814, -4.266013044780251],
           [-43.95389145636734, -4.242046662691037],
           [-43.972430885078275, -4.243416190310435],
           [-43.99097031378921, -4.242731426804295],
           [-43.9847905042189, -4.220818674577781],
           [-43.98959702277359, -4.203698906381888],
           [-44.03354233527359, -4.178360959888538],
           [-44.05688828253921, -4.160897844278386],
           [-44.07474106574234, -4.148913129020318],
           [-44.097743690254056, -4.1441191919701375],
           [-44.11319321417984, -4.13521608894061],
           [-44.13482254767593, -4.134188801381418],
           [-44.1660649182814, -4.121861246921844],
           [-44.19111075909535, -4.1080889865078065],
           [-44.18149772198598, -4.110828506983256],
           [-44.16845145733754, -4.121444059850325],
           [-44.15712180645863, -4.121786494681986],
           [-44.14064231427113, -4.130689748502349],
           [-44.125879435853165, -4.139592902409403],
           [-44.11317649395863, -4.137538337310082],
           [-44.105623393372696, -4.116992393623323],
           [-44.091890483216446, -4.106034339976974],
           [-44.08330741436879, -4.107404104918714],
           [-44.08159080059926, -4.125210834884867],
           [-44.069917826966446, -4.120074319049122],
           [-44.06030478985707, -4.141305035919052],
           [-44.047945170716446, -4.146098990033558],
           [-44.03369691714333, -4.122421551539978],
           [-44.027860430326925, -4.105984526586218],
           [-44.024083880033956, -4.086465119896318],
           [-44.02065065249489, -4.073109462494003],
           [-44.019620684233175, -4.060780966568489],
           [-44.01756074770974, -4.023109397873481],
           [-44.02271058901833, -4.012835030650287],
           [-44.02477052554177, -3.9946833328872082],
           [-44.02477052554177, -3.962831271089521],
           [-44.02065065249489, -3.9450209807651153],
           [-44.019620684233175, -3.912481965652634],
           [-44.01618745669411, -3.89741083503154],
           [-44.00652649017761, -3.8751939907191457],
           [-44.02987243744324, -3.820043616872241],
           [-44.031383052395185, -3.8097667306011407],
           [-44.04030944399675, -3.779098529988118],
           [-44.07223846011003, -3.7681360215648763],
           [-44.092837825344404, -3.7681360215648763],
           [-44.10760070376237, -3.754775277685142],
           [-44.120303645656904, -3.755460449018072],
           [-44.15282443338294, -3.726243611108903],
           [-44.165184052523564, -3.7190490456696517],
           [-44.177880825378175, -3.7062156605421825],
           [-44.19230038104224, -3.7027896065819763],
           [-44.20294338641333, -3.714095534270104],
           [-44.22388607440161, -3.708271286549383],
           [-44.23521572528052, -3.706900869742199],
           [-44.23283442105657, -3.718521968634775],
           [-44.24038752164251, -3.750725774799265],
           [-44.255493722814386, -3.75415164197365],
           [-44.2671666964472, -3.768540137189458],
           [-44.2781530245722, -3.7938907157873736],
           [-44.277466379064386, -3.8254066136357308],
           [-44.2726598605097, -3.84595983618246],
           [-44.258240304845636, -3.8521257064174743],
           [-44.23214777554876, -3.8569213523819252],
           [-44.2726598605097, -3.904876318153154],
           [-44.27952631558782, -3.928167743696737],
           [-44.3001256808222, -3.9596786368333494],
           [-44.33033808316595, -3.9596786368333494],
           [-44.361355715034954, -3.9871967357711235],
           [-44.381268434761516, -4.042678522990662],
           [-44.38813488983964, -4.081034085064386],
           [-44.441006593941204, -4.115278575163777],
           [-44.471218996284954, -4.1330851288406905],
           [-44.471905641792766, -4.163903218075415],
           [-44.45885937714433, -4.197459320310084],
           [-44.43482678437089, -4.212524856939022],
           [-44.42933362030839, -4.274838283849783],
           [-44.38538830780839, -4.339885357127349],
           [-44.34144299530839, -4.363164004957671],
           [-44.348309450386516, -4.417249835122802],
           [-44.373028688667766, -4.4199882536766735],
           [-44.388821535347454, -4.461063314505277],
           [-44.35517590546464, -4.485022707128255],
           [-44.355862550972454, -4.514457456090538],
           [-44.340069704292766, -4.567163204416691],
           [-44.350369386909954, -4.58632797325374],
           [-44.34624951386308, -4.62123390799762],
           [-44.33251660370683, -4.642450401782664],
           [-44.33045666718339, -4.684197120865283],
           [-44.32496350312089, -4.710202015319584],
           [-44.331829958199016, -4.751944678606149],
           [-44.326336794136516, -4.799842979309153],
           [-44.323590212105266, -4.829264556309975],
           [-44.338314637592795, -4.86043361476113],
           [-44.35067425673342, -4.8898525547363825],
           [-44.37608014052248, -4.921322548083371],
           [-44.387753114155295, -4.935688789946424],
           [-44.41453228895998, -4.951422888370381],
           [-44.420712098530295, -4.987678296821182],
           [-44.434445008686545, -5.027351732043069],
           [-44.43307171767092, -5.051975408645873],
           [-44.45504437392092, -5.062234998060547],
           [-44.45779095595217, -5.103955648373047],
           [-44.45298443739748, -5.153196201697179],
           [-44.46671734755373, -5.184653448527023],
           [-44.45779095595217, -5.222947111288275],
           [-44.42551861708498, -5.251665824060979],
           [-44.43375836317873, -5.280383213771228],
           [-44.42757855360842, -5.302945944286525],
           [-44.43581829970217, -5.335079317768003],
           [-44.442684754780295, -5.387719713679941],
           [-44.42757855360842, -5.421899349367681],
           [-44.42414532606936, -5.438988442282131],
           [-44.456417664936545, -5.488202313161579],
           [-44.45023785536623, -5.528527320361945],
           [-44.43581829970217, -5.572949994915929],
           [-44.41659222548342, -5.613269206182912],
           [-44.39187298720217, -5.648802471067043],
           [-44.362614880007385, -5.717430721866964],
           [-44.30081678430426, -5.714697796709329],
           [-44.23558546106207, -5.713331329238201],
           [-44.151128063601135, -5.651836930083359],
           [-44.13327528039801, -5.616987199733098],
           [-44.11954237024176, -5.608786959716654],
           [-44.10786939660895, -5.612887094142597],
           [-44.09688306848395, -5.618353895185125]]]]),
    
    geometry = 
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.MultiPolygon(
        [[[[-57.59339247329127, -14.655567020526263],
           [-56.44532118422877, -14.660881395922306],
           [-56.45081434829127, -13.146580692453211],
           [-57.59888563735377, -13.157278850743921]]],
         [[[-48.10481795307204, -15.73866784098827],
           [-48.110997762642356, -15.768241071697238],
           [-48.108251180611106, -15.770388680458026],
           [-48.10413130756423, -15.774518633407084],
           [-48.100526418648215, -15.779639658272325],
           [-48.09589156147048, -15.785421305087135],
           [-48.088510122261496, -15.788064288703898],
           [-48.084046926460715, -15.789716135959726],
           [-48.07941206928298, -15.791533152387158],
           [-48.07460555072829, -15.791533152387158],
           [-48.06567915912673, -15.787899103237699],
           [-48.065850820503684, -15.789385767585852],
           [-48.06499251361892, -15.790872421026254],
           [-48.06413420673415, -15.794836776866838],
           [-48.05452116962478, -15.792689427083502],
           [-48.050057973823996, -15.785586492572987],
           [-48.045079793892356, -15.76625864343499],
           [-48.04713973041579, -15.753041960214091],
           [-48.056066122017356, -15.739328742329253],
           [-48.07649382587478, -15.734371929907963],
           [-48.09743651386306, -15.732389171108366]]],
         [[[-46.5113569166529, -10.82033102998492],
           [-46.496250715481025, -10.851690728523202],
           [-46.45917185805915, -10.82876137928621],
           [-46.42655619643806, -10.816621601173267],
           [-46.38226756118415, -10.777163930880732],
           [-46.430332746731025, -10.770755786304756],
           [-46.47565135024665, -10.796387545777614]]],
         [[[-46.62114202500339, -10.397743195297732],
           [-46.638651485452606, -10.405172174853456],
           [-46.61324560166354, -10.468986563553981],
           [-46.60894001856199, -10.51104650867701],
           [-46.62679280176511, -10.518135223287786],
           [-46.60989975049977, -10.551510372540134],
           [-46.61642288282399, -10.588972519628104],
           [-46.63942550733571, -10.594034621114176],
           [-46.642515412120865, -10.603483653384995],
           [-46.52406906202321, -10.584585297373737],
           [-46.540891876964615, -10.53699678218175],
           [-46.51479934766774, -10.526533071825563],
           [-46.521665802745865, -10.494802232228075],
           [-46.54775833204274, -10.494127072576992],
           [-46.56973098829274, -10.46340575088068],
           [-46.596853485851334, -10.443148269546478],
           [-46.59719680860524, -10.426603680364375]]],
         [[[-46.749632111339615, -10.270906623161657],
           [-46.77589630201344, -10.280196570963286],
           [-46.773321381359146, -10.289655146218946],
           [-46.782591095714615, -10.297086685073412],
           [-46.79443573072438, -10.299789019427669],
           [-46.79718231275563, -10.315326992303417],
           [-46.78327774122243, -10.322251276721921],
           [-46.76456665113454, -10.318029170203108],
           [-46.74207901075368, -10.322589042795778],
           [-46.745855561046646, -10.291175247952351]]]]);

// get collection 
var classification = ee.Image('projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_v14');
print ('input', classification)

// get geomorfology 
var geomorfology = ee.Image('projects/ee-sad-cerrado/assets/ANCILLARY/geomorfologia_IBGE_2009_250_raster_30m')
                      .updateMask(classification.select(0));

Map.addLayer(geomorfology.randomVisualizer(), {}, 'geomorfology')

// get geometry 
var geometry = ee.Image(1).clip(ee.FeatureCollection(
   geometry
  ));


// get geometry 
var geometry2 = ee.Image(1).clip(ee.FeatureCollection(
   geometry2
  ));

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification7')
};

//Map.addLayer(geomorfology.randomVisualizer(), {}, 'geomorfology', false);
Map.addLayer(classification.select(['classification_2022']), vis, 'classification 2022');

// set recipe
var recipe = ee.Image([]);

// apply geomorfology filter to avoid that wetlands receive grassland class
ee.List.sequence({'start': 1985, 'end': 2022}).getInfo()
  .forEach(function(year_i) {
    // get classification [i]
    var image_i = classification.select(['classification_' + year_i]);
    // convert grassland over to wetland where
    var filtered_i = image_i
      .where(image_i.eq(12).and(geomorfology.eq(23)), 11)  // 23: plano de inundação 
      .where(image_i.eq(12).and(geomorfology.eq(29)), 11)  // 29: planície fluviolacustre
      .where(geometry.eq(1).and(image_i.eq(11)), 4);
      
    //bind
    recipe = recipe.addBands(filtered_i);
  });
  
//Map.addLayer(recipe.select(['classification_2021']), vis, 'filtered 2021');

// global tree canopy (Lang et al, 2022) http://arxiv.org/abs/2204.08322
var tree_canopy = ee.Image('users/nlang/ETH_GlobalCanopyHeight_2020_10m_v1');
Map.addLayer(tree_canopy, {palette: ['red', 'orange', 'yellow', 'green'], min:0, max:30}, 'tree canopy', false);

// set recipe
var recipe2 = ee.Image([]);

// apply GEDI filter in a problematic transition betwen amazon and cerrado
ee.List.sequence({'start': 1985, 'end': 2022}).getInfo()
  .forEach(function(year_i) {
    // get classification [i]
    var image_i = recipe.select(['classification_' + year_i]);
    // convert grassland over to wetland where
    var filtered_i = image_i
        .where(image_i.eq(4).and(tree_canopy.gte(10).and(geometry2.eq(1))), 3)
        .where(image_i.eq(3).and(tree_canopy.lt(10).and(geometry2.eq(1))), 4);

    //bind
    recipe2 = recipe2.addBands(filtered_i);
  });
  
// plot filtered
Map.addLayer(recipe2.select(['classification_2022']), vis, 'filtered 2022');
print ('output', recipe2);

// export as GEE asset
Export.image.toAsset({
    'image': recipe2,
    'description': 'CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_v14',
    'assetId': 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO8_DEV/CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_v14',
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
