// MoodTrip · motor de viaje: trayectos y cuestas, generador, guía automática, horarios, moods, edición y presupuesto
// (archivo de la app: scripts clásicos que comparten el ámbito global, en el orden de index.html)
/* ===================== TIPOS PRINCIPALES (JSDoc) =====================
   El motor trabaja con estas estructuras. Las pantallas (js/app.js) solo leen `plan` y `meta`
   y modifican el viaje a través de applyEdit(); nunca tocan los días a mano.

 * @typedef {[number,number]} LatLon  latitud, longitud
 * @typedef {"desayuno"|"sight"|"comida"|"merienda"|"atardecer"|"cena"|"copas"|"disco"|"foto"|"compras"|"souvenir"|"familia"} Cat
 *
 * Un sitio del pool de una ciudad (guía hecha a mano, guía automática de Wikidata o añadido por el usuario).
 * @typedef {Object} Place
 * @property {string} nm        nombre (clave de COORDS, IMG, VENUEX, HOURS…; único entre ciudades)
 * @property {Cat} cat
 * @property {string[]} m       moods: cultural, relax, aventura, gastro, fiesta, romantico, compras, souvenir, foto
 * @property {string} [d]       descripción
 * @property {LatLon} [c]       coordenadas (de COORDS)
 * @property {string} [kind]    tipo de sitio (museo, palacio, mirador…), ver kindOf()
 * @property {number} [dur]     minutos de visita, ver durOf()
 * @property {number|null} [el] metros sobre la parte baja de la ciudad (cuestas)
 * @property {boolean} [auto]   viene de la guía automática (Wikidata)
 * @property {boolean} [own]    lo ha añadido el usuario
 * @property {boolean} [excursion]
 *
 * Una franja del día. El horario (hora de inicio y fin) NO se guarda: lo calcula runSchedule() cada vez.
 * @typedef {Object} Slot
 * @property {Cat|"pausa"} cat
 * @property {string} label     «Mañana», «Comida», «Excursión», «Añadido»…
 * @property {Place} [item]     el sitio (si no hay, es una parada genérica «Cena por la zona de…»)
 * @property {{t:string,d:string,gm?:string}} [gen]
 * @property {LatLon} [at]      zona de una parada genérica
 * @property {number} dur       minutos
 * @property {number} [fixedAt] minuto del día al que debe empezar (comidas, ocaso, noche); >1440 = madrugada
 * @property {number} [userAt]  hora fijada por el usuario
 * @property {boolean} [user]   añadida por el usuario (la reparación nunca la quita)
 *
 * @typedef {Object} Day
 * @property {number} d
 * @property {"llegada"|"barrio"|"excursion"|"salida"|"unico"} type
 * @property {Slot[]} slots
 * @property {number} start     minuto de inicio del día
 * @property {number|null} end  minuto tope (vuelo de vuelta)
 * @property {Date|null} date
 * @property {number|null} wd   día de la semana (0 = domingo)
 * @property {string[]} [fixNotes] arreglos de repairDay(), se explican en «Por qué hoy es así»
 *
 * @typedef {Object} Trip       lo que devuelve planTrip(): el estado completo del viaje
 * @property {string} key       ciudad (p. ej. "barcelona" o "auto:cuenca")
 * @property {string} cc        país (LOCALES)
 * @property {{moods:string[],ritmo:string,compania:string,presup:string,familia:boolean,mayores:boolean}} o
 * @property {{items:Place[],center:LatLon}} P   pool de sitios preparado
 * @property {Day[]} days
 * @property {Set<string>} used sitios ya en el plan (no se repiten)
 * @property {Object<string,number>} [legOv] minutos reales de transporte por tramo (legKey)
 *
 * Una edición del usuario: se guarda y se vuelve a aplicar al reabrir (apunta a su parada por nombre).
 * @typedef {{d:number,op:"swap"|"del"|"move"|"time"|"add"|"own"|"pause"|"repl",i?:number,ref?:string,dir?:number,at?:number|null,dur?:number,nm?:string,c?:LatLon,after?:number,afterRef?:string}} Edit
 *
 * Entrada principal: generar(destino, días, moods, ritmo, compañía, opts) → {key, plan, meta, trip}
 *   plan[d]  = paradas pintables del día d (hora, nombre, precio, horario, cierre…)
 *   meta[d]  = ficha del día (título, por qué, plan B, moods del día, comprobaciones)
 */
/* ============ CÓMO LLEGAR entre paradas ============ */
const COORDS={
  // Budapest
  "New York Café":[47.4979,19.0703],"Madal Café (Hold utca)":[47.5028,19.0512],"Gerlóczy Kávéház":[47.4956,19.0556],
  "Parlamento de Budapest":[47.5072,19.0456],"Bastión de los Pescadores":[47.5021,19.0347],"Iglesia de Matías":[47.5018,19.0340],
  "Basílica de San Esteban (cúpula)":[47.5008,19.0540],"Gran Sinagoga de Dohány":[47.4956,19.0608],"Castillo de Buda":[47.4960,19.0397],
  "Casa del Terror":[47.5079,19.0648],"Balneario Széchenyi":[47.5188,19.0823],"Baños Rudas (terma turca)":[47.4869,19.0489],
  "Isla Margarita":[47.5269,19.0464],"Cuevas de Pálvölgyi":[47.5419,18.9889],"Mercado Central (lángos)":[47.4869,19.0586],
  "Gettó Gulyás":[47.4986,19.0631],"Karaván Street Food":[47.4972,19.0631],"Hold utcai Piac":[47.5039,19.0510],
  "Colina Gellért y Citadella":[47.4869,19.0461],"360 Bar (rooftop)":[47.5009,19.0606],"Crucero al atardecer por el Danubio":[47.4997,19.0466],
  "Mazel Tov":[47.4969,19.0625],"Menza (Liszt Ferenc tér)":[47.5056,19.0651],"VakVarjú":[47.5006,19.0529],
  "Szimpla Kert (previa)":[47.4972,19.0633],"Mika Tivadar Mulató":[47.4977,19.0617],"Doboz":[47.4974,19.0606],
  "Instant-Fogas Complex":[47.5028,19.0656],"Akvárium Klub":[47.4969,19.0536],"Ötkert":[47.5007,19.0524],"Corvintető (rooftop club)":[47.4889,19.0700],
  // Split
  "D16 Coffee":[43.5085,16.4404],"Bokeria Kitchen & Wine":[43.5079,16.4400],"Café Bar Galerija":[43.5089,16.4392],
  "Palacio de Diocleciano":[43.5081,16.4402],"Catedral de San Domnio":[43.5083,16.4408],"Sótanos del Palacio":[43.5078,16.4404],
  "Templo de Júpiter":[43.5085,16.4400],"Colina Marjan":[43.5097,16.4250],"Paseo Riva":[43.5074,16.4390],"Playa de Bačvice":[43.5045,16.4470],
  "Excursión a las cascadas de Krka":[43.8060,15.9700],"Barco a Hvar y la Cueva Azul":[43.1729,16.4413],
  "Villa Spiza":[43.5089,16.4415],"Konoba Matejuška":[43.5070,16.4368],"Fife":[43.5066,16.4360],
  "Mirador Vidilica":[43.5096,16.4330],"Atardecer en la Riva":[43.5074,16.4390],"Sustipan":[43.5052,16.4320],
  "Konoba Fetivi":[43.5078,16.4360],"Dvor":[43.5095,16.4520],"Bajamonti":[43.5086,16.4395],
  "Academia Ghetto Club":[43.5083,16.4399],"Charlie's Bar":[43.5085,16.4405],"To je tinTo (vinos)":[43.5082,16.4396],
  "Central The Club":[43.5089,16.4380],"Vanilla Club":[43.5100,16.4430],"Bačvice (Tropic / O'Hara)":[43.5045,16.4470],"Carpe Diem (Hvar)":[43.1722,16.4410],
  // Seúl
  "Café Onion Anguk":[37.5765,126.9860],"Isaac Toast":[37.5700,126.9830],"Nudake (House of Dosan)":[37.5249,127.0386],
  "Palacio Gyeongbokgung":[37.5796,126.9770],"Bukchon Hanok Village":[37.5826,126.9830],"Changdeokgung y Jardín Secreto":[37.5794,126.9910],
  "Templo Jogyesa":[37.5736,126.9820],"Torre N de Seúl (Namsan)":[37.5512,126.9882],"Insadong":[37.5740,126.9850],"Dongdaemun DDP":[37.5670,127.0090],
  "Senderismo en Bukhansan":[37.6586,126.9776],"Spa coreano (jjimjilbang)":[37.5300,126.9640],"Mercado Gwangjang":[37.5701,127.0019],
  "Tosokchon Samgyetang":[37.5779,126.9718],"Street food en Myeongdong":[37.5636,126.9850],"Río Han en Banpo":[37.5130,126.9960],
  "Atardecer en Namsan":[37.5512,126.9882],"Muralla de Naksan":[37.5800,127.0070],"Barbacoa coreana (Maple Tree House)":[37.5380,126.9970],
  "Pojangmacha de Hongdae":[37.5550,126.9237],"Myeongdong Kyoja":[37.5630,126.9850],"Southside Parlor (Itaewon)":[37.5340,126.9930],
  "Bares de Hongdae":[37.5550,126.9237],"Bar de makgeolli (Insadong)":[37.5740,126.9850],"Octagon (Gangnam)":[37.5040,127.0040],
  "Cakeshop (Itaewon)":[37.5345,126.9940],"NB2 (Hongdae)":[37.5540,126.9230],"Soap Seoul (Gangnam)":[37.5010,127.0260],
  // Lisboa
  "Manteigaria":[38.7106,-9.1426],"Fábrica Coffee Roasters":[38.7197,-9.1432],"Pastéis de Belém":[38.6975,-9.2033],
  "Torre de Belém":[38.6916,-9.2160],"Monasterio de los Jerónimos":[38.6979,-9.2065],"Castillo de San Jorge":[38.7139,-9.1335],
  "Tranvía 28 por Alfama":[38.7110,-9.1300],"Elevador de Santa Justa":[38.7120,-9.1393],"Plaza del Comercio":[38.7077,-9.1366],
  "LX Factory":[38.7026,-9.1790],"Oceanário de Lisboa":[38.7634,-9.0938],"Excursión a Sintra":[38.7876,-9.3905],
  "Time Out Market":[38.7070,-9.1455],"Cervejaria Ramiro":[38.7223,-9.1357],"O Trevo (bifana)":[38.7100,-9.1430],
  "Miradouro da Senhora do Monte":[38.7178,-9.1320],"Miradouro de Santa Catarina":[38.7106,-9.1469],"Miradouro de São Pedro de Alcântara":[38.7155,-9.1440],
  "Cena con fado en Alfama":[38.7115,-9.1290],"Taberna da Rua das Flores":[38.7095,-9.1430],
  "Pink Street (Cais do Sodré)":[38.7070,-9.1452],"Pensão Amor":[38.7068,-9.1448],"Park Bar":[38.7110,-9.1470],"Bairro Alto de bares":[38.7128,-9.1450],
  "Lux Frágil":[38.7165,-9.1230],"Musicbox (Cais do Sodré)":[38.7065,-9.1450],"Ministerium Club":[38.7077,-9.1366],
  // Praga
  "Café Savoy":[50.0790,14.4070],"Sisters Bistro":[50.0890,14.4250],"Café Louvre":[50.0820,14.4190],
  "Puente de Carlos al amanecer":[50.0865,14.4114],"Castillo de Praga y San Vito":[50.0909,14.4016],"Reloj astronómico":[50.0870,14.4208],
  "Barrio judío (Josefov)":[50.0900,14.4180],"Colina y torre de Petřín":[50.0835,14.3950],"Casa Danzante":[50.0755,14.4140],
  "Muro de John Lennon":[50.0865,14.4070],"Vyšehrad":[50.0640,14.4190],"Lokál":[50.0905,14.4250],"Cervecería U Fleků":[50.0790,14.4200],
  "Cervecería-jardín de Letná":[50.0950,14.4170],"Crucero por el Moldava":[50.0870,14.4120],"U Pinkasů (cervecería)":[50.0840,14.4230],"Mlejnice":[50.0875,14.4220],
  "Hemingway Bar":[50.0870,14.4160],"Anonymous Bar":[50.0875,14.4185],"Karlovy Lázně":[50.0860,14.4135],"Roxy":[50.0905,14.4250],"Lucerna Music Bar":[50.0815,14.4255],
  // Roma
  "Sant'Eustachio Il Caffè":[41.8986,12.4760],"Pasticcería Regoli (maritozzo)":[41.8945,12.5160],"Roscioli Caffè":[41.8950,12.4720],
  "Coliseo y Foro Romano":[41.8902,12.4922],"Museos Vaticanos y Capilla Sixtina":[41.9029,12.4545],"Basílica de San Pedro":[41.9022,12.4539],
  "Panteón de Agripa":[41.8986,12.4769],"Fontana di Trevi":[41.9009,12.4833],"Piazza di Spagna":[41.9059,12.4828],
  "Galería Borghese":[41.9142,12.4922],"Castel Sant'Angelo":[41.9031,12.4663],"Trastevere (callejear)":[41.8893,12.4690],
  "Da Enzo al 29":[41.8880,12.4760],"Supplizio":[41.8956,12.4720],"Pizza al taglio en Bonci":[41.9070,12.4470],"Gelato en Giolitti":[41.9001,12.4781],
  "Jardín de los Naranjos":[41.8843,12.4797],"Atardecer en el Gianicolo":[41.8918,12.4630],
  "Tonnarello (Trastevere)":[41.8885,12.4685],"Flavio al Velavevodetto":[41.8760,12.4760],
  "Freni e Frizioni":[41.8898,12.4700],"Drink Kong":[41.8948,12.4930],"Shari Vari Playhouse":[41.8970,12.4760],"Goa Club":[41.8570,12.4760],
  // Ámsterdam
  "Bakers & Roasters":[52.3550,4.8910],"Winkel 43 (apple pie)":[52.3740,4.8830],"Dignita":[52.3580,4.8720],
  "Casa de Ana Frank":[52.3752,4.8840],"Rijksmuseum":[52.3600,4.8852],"Museo Van Gogh":[52.3584,4.8811],
  "Crucero por los canales de Ámsterdam":[52.3680,4.8920],"Vondelpark":[52.3580,4.8686],"Barrio Jordaan":[52.3740,4.8830],
  "Begijnhof":[52.3690,4.8900],"Mercado de las flores":[52.3667,4.8917],"Excursión a Zaanse Schans":[52.4742,4.8170],
  "Foodhallen":[52.3660,4.8690],"Cata de quesos Reypenaer":[52.3720,4.8870],"Arenque de Stubbe's Haring":[52.3760,4.8970],
  "A'DAM Lookout":[52.3840,4.9020],"Crucero al atardecer por los canales":[52.3680,4.8918],"Café marrón Café Chris":[52.3740,4.8810],
  "Moeders":[52.3725,4.8810],"The Pancake Bakery":[52.3760,4.8840],"Brouwerij 't IJ":[52.3667,4.9267],
  "Wynand Fockink":[52.3720,4.8960],"Bares de Leidseplein":[52.3640,4.8810],"Paradiso":[52.3622,4.8836],"Melkweg":[52.3645,4.8810],"Escape (Rembrandtplein)":[52.3667,4.8957],
  // Berlín
  "Five Elephant":[52.4940,13.4280],"Distrikt Coffee":[52.5320,13.4010],"Markthalle Neun":[52.5020,13.4330],
  "Puerta de Brandeburgo":[52.5163,13.3777],"East Side Gallery":[52.5050,13.4400],"Isla de los Museos":[52.5212,13.3967],
  "Memorial del Holocausto":[52.5139,13.3789],"Cúpula del Reichstag":[52.5186,13.3762],"Checkpoint Charlie":[52.5076,13.3904],
  "Tempelhofer Feld":[52.4730,13.4030],"Catedral de Berlín":[52.5191,13.4010],"Mustafa's Gemüse Kebap":[52.4990,13.3910],
  "Curry 36 (currywurst)":[52.4990,13.3870],"Burgermeister":[52.5010,13.4430],"Klunkerkranich":[52.4810,13.4290],
  "Crucero por el Spree":[52.5190,13.4000],"Oberbaumbrücke":[52.5018,13.4456],"Prater Garten":[52.5390,13.4110],"Max und Moritz":[52.5020,13.4170],
  "Monkey Bar":[52.5050,13.3360],"Bares de Kreuzberg":[52.4980,13.4200],"Berghain / Panorama Bar":[52.5110,13.4430],"Tresor":[52.5106,13.4199],"Sisyphos":[52.4980,13.4730],
  // París
  "Du Pain et des Idées":[48.8690,2.3620],"Café de Flore":[48.8540,2.3330],"Pierre Hermé (macarons)":[48.8520,2.3320],
  "Torre Eiffel":[48.8584,2.2945],"Museo del Louvre":[48.8606,2.3376],"Museo de Orsay":[48.8600,2.3266],
  "Notre-Dame e Île de la Cité":[48.8530,2.3499],"Montmartre y Sacré-Cœur":[48.8867,2.3431],"Arco del Triunfo":[48.8738,2.2950],
  "Sainte-Chapelle":[48.8554,2.3450],"Jardin d'Acclimatation":[48.87809,2.26489],"Cité des Sciences et de l'Industrie":[48.89567,2.38797],"Gran Galería de la Evolución y Ménagerie":[48.8421,2.35624],"Jardín de Luxemburgo":[48.8462,2.3372],"Excursión a Versalles":[48.8049,2.1204],
  "L'As du Fallafel":[48.8571,2.3590],"Bouillon Chartier":[48.8720,2.3430],"Marché des Enfants Rouges":[48.8630,2.3625],
  "Trocadéro":[48.8617,2.2890],"Crucero por el Sena":[48.8600,2.3050],"Azotea de Galeries Lafayette":[48.8736,2.3320],
  "Chez Janou (Marais)":[48.8570,2.3660],"Bouillon Pigalle":[48.8820,2.3370],"Bares de Oberkampf":[48.8650,2.3780],
  "Little Red Door":[48.8615,2.3640],"Canal Saint-Martin":[48.8710,2.3660],"Rex Club":[48.8700,2.3470],"La Machine du Moulin Rouge":[48.8842,2.3322],"Badaboum":[48.8530,2.3760],
  // Madrid
  "Chocolatería San Ginés":[40.4165,-3.7080],"La Mallorquina":[40.4169,-3.7035],"Federal Café":[40.4260,-3.7080],
  "Museo del Prado":[40.4138,-3.6921],"Museo Reina Sofía":[40.4080,-3.6945],"Palacio Real de Madrid":[40.4180,-3.7143],
  "Parque del Retiro":[40.4153,-3.6845],"Plaza Mayor":[40.4155,-3.7074],"Mercado de San Miguel":[40.4154,-3.7090],
  "Estadio Santiago Bernabéu":[40.4531,-3.6883],"Barrio de Malasaña":[40.4260,-3.7030],"Bocadillo de calamares":[40.4150,-3.7080],
  "Tapas en la Cava Baja":[40.4118,-3.7095],"Sidrería Casa Mingo":[40.4220,-3.7240],"Templo de Debod":[40.4240,-3.7178],
  "Azotea del Círculo de Bellas Artes":[40.4185,-3.6960],"Casa Botín":[40.4143,-3.7080],"Taberna La Bola":[40.4190,-3.7110],
  "Salmón Gurú":[40.4148,-3.6990],"Bares de Malasaña":[40.4255,-3.7035],"Cañas por La Latina":[40.4118,-3.7095],
  "Teatro Kapital":[40.4090,-3.6960],"Joy Eslava":[40.4170,-3.7050],"Fabrik":[40.2890,-3.7860],
  // Londres
  "The Breakfast Club":[51.5230,-0.0790],"Dishoom":[51.5115,-0.1270],"Regency Café":[51.4940,-0.1370],
  "Big Ben y Westminster":[51.5007,-0.1246],"British Museum":[51.5194,-0.1270],"Torre de Londres":[51.5081,-0.0759],
  "London Eye":[51.5033,-0.1196],"Tate Modern":[51.5076,-0.0994],"Buckingham Palace":[51.5014,-0.1419],
  "Notting Hill y Portobello":[51.5170,-0.2050],"Tower Bridge":[51.5055,-0.0754],"Borough Market":[51.5055,-0.0910],
  "Poppies Fish & Chips":[51.5210,-0.0720],"Camden Market":[51.5414,-0.1460],"Sky Garden":[51.5113,-0.0838],
  "Primrose Hill":[51.5390,-0.1600],"Sunday roast en un pub histórico":[51.5100,-0.1300],"Flat Iron (chuletón)":[51.5130,-0.1310],
  "Nightjar":[51.5260,-0.0870],"Pubs del Soho":[51.5130,-0.1320],"Bares de Shoreditch":[51.5260,-0.0790],
  "Fabric":[51.5195,-0.1020],"Ministry of Sound":[51.4945,-0.0990],"XOYO":[51.5270,-0.0830],
  // Atenas
  "Little Kook":[37.9770,23.7260],"Desayuno griego (yogur y miel)":[37.9750,23.7340],"Kafeneio (café griego)":[37.9740,23.7290],
  "Acrópolis y Partenón":[37.9715,23.7257],"Museo de la Acrópolis":[37.9684,23.7286],"Ágora antigua":[37.9750,23.7220],
  "Plaka":[37.9720,23.7290],"Monastiraki":[37.9760,23.7257],"Colina Licabeto":[37.9836,23.7430],
  "Templo de Zeus Olímpico":[37.9693,23.7330],"Cambio de guardia (Syntagma)":[37.9755,23.7360],"Excursión a Cabo Sunión":[37.6503,24.0246],
  "Souvlaki en Monastiraki":[37.9760,23.7260],"Mercado central de Varvakios":[37.9810,23.7270],"Mezze en una taverna":[37.9720,23.7290],
  "Colina Filopappos":[37.9685,23.7200],"Rooftop con vistas a la Acrópolis":[37.9763,23.7258],"Taverna en Plaka":[37.9720,23.7300],
  "Cena en azotea con vistas a la Acrópolis":[37.9760,23.7260],"Brettos (bar histórico)":[37.9710,23.7300],"Bares de Psiri":[37.9780,23.7240],
  "Bares de Gazi":[37.9780,23.7110],"Six d.o.g.s":[37.9785,23.7270],"Lohan Nightclub":[37.9800,23.7250],"Bolivar Beach Bar":[37.9300,23.7000],
  // Viena
  "Café Central":[48.2107,16.3656],"Café Sacher (Sachertorte)":[48.2036,16.3690],"Café Hawelka":[48.2090,16.3700],
  "Palacio de Schönbrunn":[48.1845,16.3122],"Catedral de San Esteban":[48.2085,16.3731],"Palacio de Hofburg":[48.2065,16.3657],
  "Belvedere (El Beso de Klimt)":[48.1915,16.3805],"Ópera de Viena":[48.2030,16.3690],"Hundertwasserhaus":[48.2074,16.3936],
  "Naschmarkt":[48.1985,16.3625],"Figlmüller (schnitzel)":[48.2087,16.3760],"Würstelstand":[48.2010,16.3700],
  "Noria del Prater":[48.2165,16.3960],"Crucero por el Danubio":[48.2280,16.4000],"Kahlenberg":[48.2730,16.3330],
  "Figlmüller (cena)":[48.2087,16.3762],"Heuriger en Grinzing":[48.2540,16.3400],"Loos American Bar":[48.2080,16.3710],
  "Bares del Bermudadreieck":[48.2110,16.3760],"Sky Bar":[48.2050,16.3720],"Flex":[48.2170,16.3760],"Pratersauna":[48.2130,16.4100],"Volksgarten":[48.2065,16.3610],
  // Dublín
  "Full Irish breakfast":[53.3440,-6.2670],"Queen of Tarts":[53.3440,-6.2680],"Bewley's (Grafton St)":[53.3410,-6.2600],
  "Trinity College y Book of Kells":[53.3438,-6.2546],"Castillo de Dublín":[53.3429,-6.2674],"Catedral de San Patricio":[53.3395,-6.2716],
  "Guinness Storehouse":[53.3419,-6.2867],"Temple Bar":[53.3456,-6.2640],"Cárcel de Kilmainham":[53.3417,-6.3097],
  "Excursión a los acantilados de Moher":[52.9715,-9.4309],"Irish stew en un gastropub":[53.3440,-6.2660],"Leo Burdock (fish and chips)":[53.3430,-6.2710],
  "Coddle dublinés":[53.3440,-6.2655],"Ha'penny Bridge":[53.3465,-6.2630],"Howth (paseo costero)":[53.3870,-6.0660],
  "Phoenix Park":[53.3550,-6.3290],"The Brazen Head":[53.3450,-6.2770],"The Woollen Mills":[53.3470,-6.2630],
  "Pubs de Temple Bar":[53.3456,-6.2640],"The Long Hall":[53.3415,-6.2640],"Guinness en un pub local":[53.3440,-6.2650],
  "Copper Face Jacks":[53.3370,-6.2580],"The Academy":[53.3490,-6.2620],"Whelan's":[53.3360,-6.2660],
  // Copenhague
  "Sankt Peders Bageri (bollos)":[55.6790,12.5710],"Atelier September":[55.6840,12.5860],"Original Coffee":[55.6792,12.5712],
  "Nyhavn":[55.6797,12.5910],"La Sirenita":[55.6929,12.5993],"Palacio de Amalienborg":[55.6843,12.5934],
  "Jardines de Tivoli":[55.6736,12.5681],"Castillo de Rosenborg":[55.6857,12.5773],"Christiania":[55.6760,12.5990],
  "Torre Redonda (Rundetaarn)":[55.6813,12.5757],"Iglesia de Nuestro Salvador":[55.6736,12.5938],"Torvehallerne (mercado)":[55.6835,12.5705],
  "Smørrebrød tradicional":[55.6800,12.5800],"Reffen street food":[55.6920,12.6020],"Nyhavn al atardecer":[55.6798,12.5912],
  "Crucero por los canales (Nyhavn)":[55.6797,12.5908],"CopenHill":[55.6915,12.6120],"Restaurante en el Meatpacking":[55.6680,12.5620],
  "Hot dog danés (pølser)":[55.6790,12.5700],"Bares de Meatpacking (Kødbyen)":[55.6680,12.5620],"Mikkeller":[55.6690,12.5560],
  "Ruby":[55.6770,12.5800],"Culture Box":[55.6840,12.5870],"Vega":[55.6650,12.5430],"Rust":[55.6890,12.5560],
  // Estambul
  "Desayuno turco (kahvaltı)":[41.0270,28.9740],"Café turco (Mandabatmaz)":[41.0330,28.9770],"Simit con té":[41.0080,28.9770],
  "Santa Sofía":[41.0086,28.9800],"Mezquita Azul":[41.0054,28.9768],"Palacio de Topkapi":[41.0115,28.9834],
  "Cisterna Basílica":[41.0084,28.9779],"Bazar de las Especias":[41.0165,28.9707],"Torre de Gálata":[41.0256,28.9744],
  "Barrio de Balat":[41.0290,28.9490],"Gran Bazar":[41.0106,28.9680],"Kebab / döner":[41.0300,28.9750],
  "Balık ekmek (Eminönü)":[41.0175,28.9730],"Mezze en Kadıköy":[40.9900,29.0270],"Torre de Gálata al atardecer":[41.0256,28.9744],
  "Crucero por el Bósforo":[41.0220,28.9740],"Rooftop con vistas a Santa Sofía":[41.0080,28.9790],"Meyhane (mezze y rakı)":[41.0300,28.9770],
  "Kebab house":[41.0290,28.9740],"Bares de Karaköy / Beyoğlu":[41.0250,28.9770],"Rooftop bar (360 Istanbul)":[41.0330,28.9770],
  "Nargile (cachimba)":[41.0090,28.9650],"Klein Phonotheque":[41.0260,28.9740],"Sortie (Bósforo)":[41.0470,29.0340],"Babylon":[41.0350,28.9780],
  // Edimburgo
  "Scottish breakfast":[55.9520,-3.1880],"The Milkman (café)":[55.9510,-3.1900],"The Edinburgh Larder":[55.9510,-3.1850],
  "Castillo de Edimburgo":[55.9486,-3.1999],"Royal Mile":[55.9500,-3.1870],"Palacio de Holyrood":[55.9526,-3.1722],
  "Dean Village":[55.9520,-3.2180],"Victoria Street (Harry Potter)":[55.9480,-3.1940],"National Museum of Scotland":[55.9469,-3.1900],
  "Excursión a las Highlands":[56.6700,-5.0000],"Haggis, neeps & tatties":[55.9490,-3.1880],"Fish and chips":[55.9530,-3.1870],
  "Mary's Milk Bar (gelato)":[55.9470,-3.1930],"Calton Hill":[55.9550,-3.1820],"Arthur's Seat":[55.9440,-3.1620],
  "Camera Obscura":[55.9489,-3.1955],"Whisky y haggis en un pub":[55.9490,-3.1880],"The Witchery":[55.9488,-3.1958],
  "The Bow Bar (whisky)":[55.9485,-3.1945],"Pubs de Grassmarket":[55.9470,-3.1955],"Panda & Sons":[55.9540,-3.2030],
  "The Liquid Room":[55.9485,-3.1920],"Cabaret Voltaire":[55.9495,-3.1880],"Bongo Club":[55.9500,-3.1860],
  // Florencia
  "Cappuccino y cornetto (Ditta Artigianale)":[43.7680,11.2580],"Café Gilli":[43.7715,11.2545],"Pasticcería florentina":[43.7710,11.2550],
  "Catedral (Duomo) y cúpula":[43.7731,11.2560],"Galería de los Uffizi":[43.7678,11.2553],"Ponte Vecchio":[43.7680,11.2531],
  "Galería de la Academia (David)":[43.7766,11.2590],"Palazzo Vecchio":[43.7693,11.2562],"Jardines de Bóboli":[43.7625,11.2480],
  "Mercado de San Lorenzo":[43.7765,11.2535],"Mercato Centrale":[43.7765,11.2536],"Bistecca alla fiorentina":[43.7740,11.2560],
  "All'Antico Vinaio (panini)":[43.7690,11.2570],"Lampredotto (panino)":[43.7720,11.2540],"Piazzale Michelangelo":[43.7629,11.2650],
  "Ponte Vecchio al atardecer":[43.7681,11.2532],"Rooftop La Terrazza":[43.7700,11.2535],"Trattoria toscana":[43.7730,11.2510],
  "Osteria en Oltrarno":[43.7670,11.2470],"Aperitivo en Santo Spirito":[43.7670,11.2480],"Le Volpi e l'Uva":[43.7685,11.2540],
  "Rooftop bar con vistas":[43.7700,11.2540],"Space Club":[43.7790,11.2480],"Tenax":[43.8000,11.2100],"YAB":[43.7710,11.2510],
  // Venecia
  "Caffè Florian":[45.4340,12.3380],"Pasticceria Tonolo":[45.4350,12.3250],"Caffè del Doge":[45.4380,12.3340],
  "Plaza de San Marcos y Basílica":[45.4345,12.3387],"Palacio Ducal":[45.4337,12.3401],"Puente de Rialto":[45.4380,12.3358],
  "Gran Canal en vaporetto":[45.4380,12.3340],"Puente de los Suspiros":[45.4340,12.3410],"Murano y Burano":[45.4853,12.4170],
  "Campanile de San Marcos":[45.4341,12.3389],"Cicchetti en un bacaro":[45.4385,12.3350],"Mercado de Rialto":[45.4390,12.3345],
  "Risotto al nero o fritto misto":[45.4370,12.3300],"Paseo en góndola":[45.4340,12.3360],"Zattere al atardecer":[45.4290,12.3250],
  "Terraza del Fondaco dei Tedeschi":[45.4382,12.3367],"Trattoria veneciana":[45.4370,12.3280],"Osteria con cicchetti":[45.4385,12.3340],
  "Spritz en Campo Santa Margherita":[45.4357,12.3245],"Giro de ombre (bacaros)":[45.4380,12.3350],"Skyline Rooftop (Giudecca)":[45.4270,12.3190],
  "Piccolo Mondo":[45.4310,12.3260],"Il Muretto (Jesolo)":[45.5050,12.6300],"Molocinque (Mestre)":[45.4900,12.2400],
  // Oporto
  "Majestic Café":[41.1470,-8.6060],"Combi Coffee":[41.1500,-8.6100],"Pastel de nata (Manteigaria)":[41.1465,-8.6110],
  "Librería Lello":[41.1469,-8.6147],"Torre dos Clérigos":[41.1456,-8.6140],"Estación de São Bento":[41.1456,-8.6107],
  "Ribeira":[41.1405,-8.6110],"Puente Don Luís I":[41.1399,-8.6094],"Bodegas de Oporto (Gaia)":[41.1380,-8.6110],
  "Palacio de la Bolsa":[41.1414,-8.6155],"Francesinha":[41.1480,-8.6080],"Mercado do Bolhão":[41.1490,-8.6060],
  "Bacalhau":[41.1460,-8.6090],"Jardim do Morro":[41.1385,-8.6090],"Crucero por el Duero":[41.1400,-8.6120],
  "Puente Don Luís I al atardecer":[41.1399,-8.6095],"Bodega de vino de Oporto (cata)":[41.1380,-8.6120],"Tasca portuguesa":[41.1470,-8.6090],
  "Galerias de Paris":[41.1480,-8.6130],"Wine bar (Prova)":[41.1450,-8.6140],"Rooftop (Base / Miradouro Ignez)":[41.1455,-8.6135],
  "Maus Hábitos":[41.1490,-8.6070],"Plano B":[41.1460,-8.6140],"Gare Porto":[41.1530,-8.6020],
  // Cracovia
  "Charlotte (boulangerie)":[50.0640,19.9320],"Café Bunkier":[50.0625,19.9320],"Obwarzanek (pretzel)":[50.0617,19.9370],
  "Plaza del Mercado (Rynek)":[50.0616,19.9370],"Castillo de Wawel":[50.0540,19.9354],"Basílica de Santa María":[50.0617,19.9395],
  "Barrio judío de Kazimierz":[50.0510,19.9450],"Fábrica de Schindler":[50.0476,19.9614],"Excursión a Auschwitz-Birkenau":[50.0270,19.2030],
  "Minas de sal de Wieliczka":[49.9830,20.0540],"Puerta de San Florián":[50.0655,19.9415],"Pierogi":[50.0610,19.9380],
  "Zapiekanka (Plac Nowy)":[50.0510,19.9440],"Milk bar (bar mleczny)":[50.0620,19.9370],"Montículo de Kościuszko":[50.0550,19.8920],
  "Paseo del Vístula (Wawel)":[50.0540,19.9340],"Forum Przestrzenie":[50.0480,19.9320],"Restaurante polaco (Pod Wawelem)":[50.0560,19.9360],
  "Cena judía en Kazimierz":[50.0510,19.9452],"Bares de Kazimierz (Alchemia)":[50.0512,19.9440],"Wódka Café Bar":[50.0510,19.9450],
  "Rooftop bar":[50.0620,19.9380],"Prozak 2.0":[50.0610,19.9360],"Szpitalna 1":[50.0640,19.9420],"Coco Music Club":[50.0613,19.9378],
  // Estocolmo
  "Fika (kanelbulle)":[59.3340,18.0700],"Vete-Katten":[59.3340,18.0640],"Brunch en Södermalm":[59.3140,18.0720],
  "Gamla Stan":[59.3257,18.0700],"Palacio Real de Estocolmo":[59.3268,18.0717],"Museo Vasa":[59.3280,18.0915],
  "Ayuntamiento (Stadshuset)":[59.3275,18.0543],"Museo ABBA":[59.3235,18.0950],"Djurgården":[59.3260,18.1000],
  "Fotografiska":[59.3180,18.0850],"Excursión por el archipiélago":[59.3200,18.2000],"Albóndigas suecas (köttbullar)":[59.3300,18.0700],
  "Östermalms Saluhall":[59.3360,18.0740],"Smörgås de arenque":[59.3300,18.0702],"Monteliusvägen":[59.3200,18.0560],
  "Skinnarviksberget":[59.3175,18.0490],"Crucero por el archipiélago":[59.3260,18.0760],"Restaurante de köttbullar":[59.3300,18.0705],
  "Cena en Södermalm":[59.3140,18.0720],"Bares de Södermalm":[59.3142,18.0722],"Icebar Stockholm":[59.3320,18.0590],
  "Rooftop TAK":[59.3320,18.0640],"Trädgården":[59.3120,18.0850],"Berns":[59.3320,18.0720],"Under Bron":[59.3120,18.0852],
  // Bruselas
  "Gofres de Maison Dandoy":[50.8470,4.3520],"Café Belga":[50.8270,4.3700],"Peck 47 (brunch)":[50.8500,4.3500],
  "Grand Place":[50.8467,4.3525],"Manneken Pis":[50.8450,4.3499],"Atomium":[50.8949,4.3415],
  "Museo Magritte":[50.8420,4.3590],"Galerías Saint-Hubert":[50.8480,4.3540],"Parque del Cincuentenario":[50.8400,4.3930],
  "Ruta del cómic":[50.8480,4.3560],"Moules-frites":[50.8480,4.3540],"Frites (Maison Antoine)":[50.8420,4.3800],
  "Place du Jeu de Balle":[50.8370,4.3460],"Place du Grand Sablon":[50.8410,4.3560],"Atomium iluminado":[50.8949,4.3416],
  "Mont des Arts al atardecer":[50.8440,4.3570],"Restaurante de moules-frites":[50.8480,4.3542],"Chez Léon":[50.8485,4.3530],
  "Delirium Café":[50.8475,4.3540],"Bares de Saint-Géry":[50.8485,4.3470],"Cantillon (cerveza lambic)":[50.8430,4.3360],
  "Fuse":[50.8360,4.3470],"C12":[50.8470,4.3570],"Bloody Louis":[50.8460,4.3560],
  // Sevilla
  "Tostada con tomate y jamón":[37.3880,-5.9920],"Churros en El Comercio":[37.3890,-5.9930],"Café con leche en una plaza":[37.3880,-5.9950],
  "Catedral y Giralda":[37.3859,-5.9932],"Real Alcázar":[37.3830,-5.9905],"Plaza de España":[37.3772,-5.9869],
  "Barrio de Santa Cruz":[37.3850,-5.9900],"Metropol Parasol (Setas)":[37.3933,-5.9920],"Torre del Oro":[37.3826,-5.9963],
  "Triana":[37.3840,-6.0030],"Parque de María Luisa":[37.3740,-5.9880],"Tapas en Eslava":[37.4000,-5.9970],
  "Mercado de Triana":[37.3855,-6.0010],"Pescaíto frito":[37.3840,-6.0020],"Setas de Sevilla (mirador)":[37.3933,-5.9921],
  "Paseo por el Guadalquivir":[37.3840,-5.9970],"Azotea con vistas a la Giralda":[37.3860,-5.9920],"Tablao flamenco con cena":[37.3870,-5.9900],
  "Tapeo por el centro":[37.3890,-5.9930],"Terrazas de la Alameda de Hércules":[37.4000,-5.9950],"Rooftop (Hotel Doña María)":[37.3855,-5.9921],
  "Rebujito en un bar":[37.4000,-5.9952],"Bahía / Antique (Isla Cartuja)":[37.4080,-6.0030],"Boss":[37.4082,-6.0032],"Lo Nuestro":[37.3850,-5.9905],
  // Múnich
  "Café Frischhut (Schmalznudel)":[48.1350,11.5739],"Man Versus Machine (café de especialidad)":[48.1310,11.5700],"Weisswurst en Schneider Bräuhaus":[48.1360,11.5790],
  "Marienplatz y el Glockenspiel":[48.1374,11.5755],"Frauenkirche":[48.1386,11.5736],"Residenz y el Antiquarium":[48.1417,11.5779],
  "Jardín Inglés":[48.1520,11.5920],"Surfistas del Eisbach":[48.1435,11.5876],"Alte Pinakothek":[48.1481,11.5700],
  "Olympiapark y su torre":[48.1731,11.5466],"BMW Welt y Museo BMW":[48.1770,11.5560],"Palacio de Nymphenburg":[48.1583,11.5033],
  "Excursión a Neuschwanstein":[47.5576,10.7498],"Viktualienmarkt (puestos)":[48.1352,11.5764],"Hofbräuhaus":[48.1376,11.5799],
  "Augustiner Bräustuben":[48.1394,11.5437],"Torre de San Pedro (Alter Peter)":[48.1364,11.5757],"Biergarten de la Torre China":[48.1524,11.5926],
  "Monopteros al atardecer":[48.1490,11.5870],"Wirtshaus in der Au":[48.1250,11.5860],"Zum Dürnbräu":[48.1366,11.5790],
  "Ratskeller (sótano del ayuntamiento)":[48.1372,11.5755],"Gärtnerplatz (terrazas)":[48.1319,11.5754],"Schumann's Bar":[48.1428,11.5786],
  "Augustiner am Dom":[48.1381,11.5739],"Blitz Club (electrónica)":[48.1298,11.5838],"P1":[48.1442,11.5859],"Pacha München":[48.1416,11.5697],
  "Kaufingerstraße y Sendlinger Straße":[48.1379,11.5710],"Delicatessen de Dallmayr":[48.1385,11.5770],"Neues Rathaus desde Marienplatz":[48.1374,11.5755],
  // Niza
  "Café con vistas en el Cours Saleya":[43.6953,7.2745],"Marinette (brunch)":[43.6987,7.2814],"Tourte de blettes en una boulangerie":[43.6970,7.2760],
  "Paseo de los Ingleses":[43.6950,7.2650],"Vieux Nice":[43.6961,7.2756],"Colina del Castillo":[43.6949,7.2799],
  "Museo Matisse":[43.7196,7.2760],"Museo Marc Chagall":[43.7093,7.2699],"Plaza Masséna":[43.6975,7.2700],
  "Catedral rusa de San Nicolás":[43.7020,7.2560],"Èze y su jardín exótico":[43.7275,7.3617],"Villefranche-sur-Mer":[43.7040,7.3110],
  "Baño en la playa (Plage Beau Rivage)":[43.6942,7.2720],"Socca en Chez Pipo":[43.7003,7.2828],"Mercado del Cours Saleya":[43.6953,7.2745],
  "Pan bagnat junto al puerto":[43.6976,7.2850],"Atardecer en Rauba Capeu (#ILoveNice)":[43.6942,7.2830],"Apéro en una terraza del Vieux Nice":[43.6958,7.2755],
  "Puerto Lympia al caer el sol":[43.6960,7.2870],"La Rossettisserie":[43.6972,7.2768],"Bistrot d'Antoine":[43.6968,7.2775],
  "Cocina nizarda en Le Safari":[43.6951,7.2752],"Rue Bonaparte (Le Petit Marais)":[43.6996,7.2825],"Les Distilleries Idéales":[43.6962,7.2757],
  "Wayne's Bar":[43.6955,7.2758],"High Club":[43.6907,7.2542],"Le Glam":[43.6979,7.2802],"Beach club de verano (Castel Plage)":[43.6938,7.2788],
  "Avenue Jean Médecin":[43.7010,7.2680],"Jabones y lavanda del Vieux Nice":[43.6961,7.2756],"El damero de la Place Masséna":[43.6975,7.2700],
  // Milán
  "Marchesi 1824 (Galleria)":[45.4659,9.1898],"Pavé":[45.4794,9.2043],"Espresso al banco, como un milanés":[45.4650,9.1880],
  "Duomo de Milán":[45.4642,9.1900],"Terrazas del Duomo":[45.4642,9.1905],"Galleria Vittorio Emanuele II":[45.4659,9.1900],
  "La Última Cena":[45.4659,9.1708],"Castillo Sforzesco y Parque Sempione":[45.4705,9.1793],"Teatro alla Scala":[45.4672,9.1895],
  "Brera":[45.4720,9.1880],"Bosco Verticale y Porta Nuova":[45.4855,9.1900],"Fondazione Prada":[45.4443,9.2043],
  "Cimitero Monumentale":[45.4855,9.1790],"Panzerotti de Luini":[45.4655,9.1907],"Risotto alla milanese":[45.4630,9.1850],
  "Mercato Centrale (Centrale FS)":[45.4863,9.2043],"Aperitivo en los Navigli":[45.4520,9.1740],"Spritz frente al Duomo":[45.4643,9.1893],
  "Highline Galleria":[45.4661,9.1897],"Cotoletta en una trattoria":[45.4640,9.1830],"Trattoria Torre di Pisa (Brera)":[45.4715,9.1870],
  "Pizza en Piz":[45.4636,9.1837],"Bar Basso":[45.4785,9.2212],"Colonne di San Lorenzo":[45.4583,9.1815],
  "Corso Como":[45.4830,9.1870],"Armani Privé":[45.4692,9.1926],"Alcatraz":[45.4930,9.1745],"Magazzini Generali":[45.4420,9.1990],
  "Quadrilatero della Moda":[45.4685,9.1950],"Eataly Smeraldo":[45.4810,9.1870],"El toro de la Galleria":[45.4659,9.1900],
};
const FARES={budapest:"450 Ft (~1,15 €)",split:"~1,30 €",seoul:"1.400 ₩ (~1 €)",lisboa:"~1,80 € (metro/bus)",praga:"32 Kč (~1,30 €)",roma:"1,50 € (100 min)",amsterdam:"~3,40 € (GVB 1h)",berlin:"3,80 € (zona AB)",paris:"2,15 € (ticket t+)",madrid:"1,50-2 € (metro)",londres:"£2,80 (contactless z1)",atenas:"1,20 € (90 min)",viena:"2,40 € (sencillo)",dublin:"€2,60 (Leap card)",copenhague:"24 kr (~3,20 €)",estambul:"~15 TL (Istanbulkart)",edimburgo:"£2 (bus Lothian)",florencia:"1,70 € (90 min)",venecia:"9,50 € (vaporetto)",oporto:"~1,60 € (Andante)",cracovia:"4 zł (~0,90 €)",estocolmo:"39 kr (~3,40 €)",bruselas:"2,10 € (STIB)",sevilla:"1,40 € (Tussam)",munich:"3,90 € (MVV zona M)",niza:"1,70 € (Lignes d'Azur)",milan:"2,20 € (ATM 90 min)"};
function hav(a,b){const R=6371,dLat=(b[0]-a[0])*Math.PI/180,dLon=(b[1]-a[1])*Math.PI/180,la1=a[0]*Math.PI/180,la2=b[0]*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function taxiEst(km,key){const c={budapest:[1.0,0.8],split:[3,1.2],seoul:[2.5,0.8]}[key]||[3,1.2];return Math.round(c[0]+c[1]*km)+" €";}
function connector(prev,next,destino,key,po){
  const cP=COORDS[prev.a.t],cN=COORDS[next.a.t];
  const mapUrl=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prev.a.t+", "+destino)}&destination=${encodeURIComponent(next.a.t+", "+destino)}&travelmode=transit`;
  if(!cP||!cN)return `<div class="conn"><span class="crec">${ico("pin")} Cómo llegar</span><span class="cdetail"><a class="cmap" href="${mapUrl}" target="_blank" rel="noopener">ver ruta en Google Maps ↗</a></span></div>`;
  const km=hav(cP,cN);
  // altura de cada punta (la de la guía o la de la guía automática): las cuestas también cuentan
  const eP=elevOf({nm:prev.a.t,el:prev.a.el,auto:prev.a.auto}),eN=elevOf({nm:next.a.t,el:next.a.el,auto:next.a.auto});
  const [up,down]=climb(eP,eN);
  const walk=Math.max(1,Math.round(walkMin(km,up,down))),bike=Math.max(1,Math.round(km*STREET/15*60+up/6));
  const wkm=(km*STREET).toFixed(1).replace(".",",");
  const fare=FARES[key]||"billete local";
  const late=next.time>="22:30"||next.time<="05:00";
  const how=up>=40&&km<=12?hillHow(next.a.t):"";
  const easy=!!(po&&po.mayores);
  const steep=(up>=60||(easy&&up>=30))&&km>0.5&&km<=12;
  let rec;
  if(km<0.12&&up<15)rec=`${ico("walk")} Al lado, ve andando`;
  else if(steep&&how)rec=`${ico("bus")} Cuesta arriba (+${up} m): sube en transporte`;
  else if(steep)rec=`${ico("bus")} Cuesta arriba (+${up} m): mejor en bus o taxi`;
  else if(easy&&walk>12&&km<=12)rec=`${ico("taxi")} Mejor en transporte o taxi: ${walk} min andando es mucho para hoy`;
  else if(walk<=18)rec=`${ico("walk")} A un paseo, ve andando`;
  else if(km>12)rec=`${ico("train")} Excursión: tour/tren/ferry (medio día)`;
  else if(walk<=30&&!late)rec=`${ico("walk")} Paseo largo, o bus si vas cansado`;
  else rec=late?`${ico("taxi")} Lejos y de noche: mejor taxi`:`${ico("bus")} Lejos: bus o metro`;
  const parts=[];
  if(km<=4.5)parts.push(`${ico("walk")} ${walk} min · ~${wkm} km${up>=25?` · sube ${up} m`:(down>=40?` · cuesta abajo`:"")}`);
  if(km<=9&&!steep)parts.push(`${ico("bike")} ${bike} min`);
  if((km>1.2||steep)&&km<=12)parts.push(`${ico("bus")} ${fare} <a class="cmap" href="${mapUrl}" target="_blank" rel="noopener">ruta y parada ↗</a>`);
  if((km>2.5||(steep&&late))&&km<=12)parts.push(`${ico("taxi")} ~${taxiEst(km*STREET,key)}`);
  if(km>12)parts.push(`<a class="cmap" href="${mapUrl}" target="_blank" rel="noopener">cómo llegar ↗</a>`);
  // líneas y paradas reales (Transitous) bajo demanda, solo si el servicio está activado (body.tr-on)
  const trBtn=(km>0.8||steep)&&km<=12?`<button type="button" class="ctr" data-f="${cP[0]},${cP[1]}" data-t="${cN[0]},${cN[1]}" data-at="${prev.end||prev.time||""}"${prev.hotel?` data-hotel="1"`:""}>${ico("route")} Ver líneas y paradas</button><div class="ctr-out"></div>`:"";
  return `<div class="conn"><span class="crec">${rec}</span><span class="cdetail">${parts.join(" · ")}</span>${how?`<span class="chow">${how}</span>`:""}${trBtn}</div>`;
}
// ---------- transporte público con líneas reales (prototipo, ver api/route.js) ----------
let TRANSIT_ON=null;
function transitPing(){if(TRANSIT_ON!==null){document.body.classList.toggle("tr-on",TRANSIT_ON);return;}
  TRANSIT_ON=false;fetch("/api/route?ping=1",{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(d=>{TRANSIT_ON=!!(d&&d.ok);document.body.classList.toggle("tr-on",TRANSIT_ON);}).catch(()=>{});}
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}
const TRICO={SUBWAY:"train",METRO:"train",RAIL:"train",REGIONAL_RAIL:"train",REGIONAL_FAST_RAIL:"train",SUBURBAN:"train",HIGHSPEED_RAIL:"train",LONG_DISTANCE:"train",TRAM:"train",FUNICULAR:"train",BUS:"bus",COACH:"bus",FERRY:"route",CABLE_CAR:"route",AERIAL_LIFT:"route"};
function transitHtml(d){
  if(!d||!d.ok){const why={no_route:"No hay datos de transporte público para este tramo"+(d&&d.walkMin?` (andando: unos ${d.walkMin} min)`:"")+".",disabled:"Las líneas en directo no están activadas."}[d&&d.reason]||"No se ha podido calcular la ruta ahora mismo.";return `<p class="trx dim">${why} Usa «ruta y parada» para verlo en Google Maps.</p>`;}
  const one=(R,alt)=>`<ol class="trl${alt?" alt":""}">`+R.legs.map(l=>l.walk?`<li>${ico("walk")} Camina ${l.min} min${l.to?` hasta <b>${esc(l.to)}</b>`:" hasta el destino"}</li>`
    :`<li>${ico(TRICO[l.mode]||"bus")} <span class="trline"${l.color?` style="--lc:#${esc(l.color)}"`:""}>${esc(l.line||l.modo)}</span> ${l.modo}${l.head?` dirección <b>${esc(l.head)}</b>`:""}: sube en <b>${esc(l.from||"")}</b> y baja en <b>${esc(l.to||"")}</b> · ${l.stops} ${l.stops===1?"parada":"paradas"} · ${l.min} min${l.agency?` <span class="dim">(${esc(l.agency)})</span>`:""}</li>`).join("")+`</ol>`;
  const R=d.routes[0],A=d.routes[1];
  return `<div class="trx"><p><b>${R.min} min</b>${R.transfers?` · ${R.transfers} ${R.transfers===1?"transbordo":"transbordos"}`:" · sin transbordos"}${d.walkMin&&d.walkMin<=R.min+5?` · andando serían ${d.walkMin} min`:""}</p>${one(R)}${A?`<details><summary>Otra opción: ${A.min} min${A.transfers?`, ${A.transfers} transbordo${A.transfers>1?"s":""}`:""}</summary>${one(A,true)}</details>`:""}
    <p class="dim">Horario programado${R.legs.some(l=>l.realTime)?" (con datos en tiempo real en algún tramo)":", no en tiempo real"}. Rutas: <a href="https://transitous.org/sources/" target="_blank" rel="noopener">Transitous y sus fuentes</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p></div>`;
}
// hora local de la ciudad → instante UTC (con su huso y horario de verano: la misma regla que el ocaso)
function cityUTC(cc,day,at){
  const L=LOCALES[cc||""];let off=L&&L.tz!=null?L.tz:null;if(off==null)return "";
  if(L.dst){const y=day.getFullYear(),u=Date.UTC(y,day.getMonth(),day.getDate(),12);if(u>=lastSunday(y,2)&&u<lastSunday(y,9))off+=1;}
  const [hh,mm]=at.split(":").map(Number);let mins=hh*60+mm;const d=new Date(day);if(mins>=1440){mins-=1440;d.setDate(d.getDate()+1);}
  return new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),0,mins)-off*36e5).toISOString().slice(0,16)+"Z";
}
function tripDay(IT,d){let day=IT&&IT.inDate?dayDate(IT.inDate,d):null;if(!day){day=new Date(Date.now()+864e5);while([0,6].includes(day.getDay()))day.setDate(day.getDate()+1);}return day;} // sin fecha: un día laborable
function fetchRoute(f,t,IT,d,at){
  const tq=cityUTC(IT&&IT.trip&&IT.trip.cc,tripDay(IT,d),/^\d{2}:\d{2}$/.test(at||"")?at:"10:00");
  return fetch(`/api/route?flat=${f[0]}&flon=${f[1]}&tlat=${t[0]}&tlon=${t[1]}${tq?`&t=${tq}`:""}`,{signal:AbortSignal.timeout(15000)}).then(r=>r.ok?r.json():null).catch(()=>null);
}
// clave de un tramo (para guardar el tiempo real del transporte y usarlo en el horario)
function legKey(a,b){return a&&b?`${(+a[0]).toFixed(4)},${(+a[1]).toFixed(4)}>${(+b[0]).toFixed(4)},${(+b[1]).toFixed(4)}`:"";}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".ctr");if(!b)return;e.preventDefault();e.stopPropagation();
  const out=b.nextElementSibling;if(!out)return;if(out.dataset.done){out.hidden=!out.hidden;return;}
  const f=b.dataset.f.split(",").map(Number),t=b.dataset.t.split(",").map(Number);
  const IT=window.curItin?window.curItin():null;
  b.disabled=true;out.innerHTML=`<p class="trx dim">Buscando líneas…</p>`;
  fetchRoute(f,t,IT,IT?IT.cur||0:0,b.dataset.at).then(d=>{
    const k=legKey(f,t),R=d&&d.ok&&d.routes[0];
    const used=IT&&IT.trip&&IT.trip.legOv&&IT.trip.legOv[k]!=null;
    out.innerHTML=transitHtml(d)+(IT&&!IT.inDate?`<p class="trx dim">Sin fecha de viaje, calculado para un día laborable a esa hora.</p>`:"")
      +(R&&b.dataset.hotel!=="1"?(used?`<p class="trx dim">${ico("check")} El horario del día ya usa este tiempo real.</p>`:`<button type="button" class="tr-use" data-k="${k}" data-min="${R.min}">Usar estos ${R.min} min en el horario del día</button>`):"");
    out.dataset.done=1;b.disabled=false;});
},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".tr-use");if(!b)return;e.preventDefault();e.stopPropagation();
  if(window.moodtripUseLegs)window.moodtripUseLegs({[b.dataset.k]:+b.dataset.min});},true);

/* ============ GENERADOR (días completos) ============ */
// «palma de mallorca» → «Palma de Mallorca» (las partículas en minúscula, salvo al principio)
const CAP_LOW=new Set(["de","del","la","las","los","el","y","e","en","di","da","do","dos","das","sur","am","an","im"]);
function cap(s){return s.trim().split(/(\s+)/).map((w,i)=>i>0&&CAP_LOW.has(w.toLowerCase())?w.toLowerCase():w.replace(/^(\p{L})/u,c=>c.toUpperCase())).join("");}
// el mismo sitio con otro nombre (el Harder Kulm y su pasarela): no se repite el mismo día
function sameSpot(a,b){if(!a||!b)return false;const x=norm(shortNm(a.nm)),y=norm(shortNm(b.nm));return x.includes(y)||y.includes(x)||norm(a.nm).includes(y)||norm(b.nm).includes(x);}
function resolveKey(destino){const ex=inDest.dataset.key;if(ex&&DB[ex])return ex;const n=norm(destino);if(DB[n])return n;if(ALIAS[n]&&DB[ALIAS[n]])return ALIAS[n];const f=DESTINOS.find(d=>norm(d.n)===n&&d.key);if(f)return f.key;for(const a in ALIAS){if(n.includes(a)&&DB[ALIAS[a]])return ALIAS[a];}return null;}

function poolDe(key){let pool=key&&DB[key]?DB[key].slice():null;if(pool&&EXTRAS[key])pool=pool.concat(EXTRAS[key]);if(pool&&AUX[key])pool=pool.concat(AUX[key]);return pool;}
/* Ciudades con guía hecha a mano: tienen los imprescindibles, pero pocos sitios para un viaje largo.
   Se completan con monumentos, parques y restaurantes con historia de Wikidata (la misma fuente que la guía
   automática), sin duplicar lo que ya está en la guía. Así un viaje de 6 días a Roma no se queda en blanco. */
const AUX={},AUXP={},AUXT={};
const AUXQ={split:"Split",seoul:"Seúl",budapest:"Budapest"};
const NOTSIGHT=/^(universidad|university|hospital|estaci[oó]n|station|aeropuerto|airport|colegio|instituto|escuela|school|facultad|edificio de oficinas|sede de|ciudad del? |archivo|biblioteca nacional|ministerio|embajada)/i;
function fetchPlaces(q){
  const n=norm(q),lk="em_city_"+n;
  try{const s=JSON.parse(localStorage.getItem(lk)||"null");if(s&&s.v===3&&Date.now()-s.t<14*864e5)return Promise.resolve({...s.d,fetched:s.t});}catch(e){}
  return fetch("/api/places?v=3&city="+encodeURIComponent(n),{signal:AbortSignal.timeout(65000)}).then(r=>r.ok?r.json():null).then(d=>{
    if(d&&d.ok){try{localStorage.setItem(lk,JSON.stringify({v:3,t:Date.now(),d}));}catch(e){}}return d;}).catch(()=>null);
}
function loadAux(key){
  if(!key||isAuto(key)||!DB[key])return Promise.resolve(null);
  if(AUXP[key])return AUXP[key];
  const dn=(DESTINOS.find(x=>x.key===key&&!/^(croacia|corea)/i.test(norm(x.n)))||{}).n||key;
  return AUXP[key]=fetchPlaces(AUXQ[key]||dn).then(data=>{
    if(!data||!data.ok||!data.items)return null;
    const mine=(DB[key].concat(EXTRAS[key]||[])).map(a=>({n:norm(a.nm),c:COORDS[a.nm]})).filter(x=>x.c);
    // de Wikipedia solo se cogen visitas conocidas; miradores, cafés, bares y restaurantes ya los trae la guía
    const keep=new Set(["sight"]); // restaurantes: mejor los de la guía o el mapa de la zona (Wikipedia mezcla estrellas Michelin y casas de comidas)
    const out=[];
    data.items.map(cleanItem).forEach(it=>{
      if(!keep.has(it.cat)||NOTSIGHT.test(it.nm))return;
      if(it.cat==="sight"&&(it.fame||0)<6)return;               // solo lo bastante conocido
      // plazas que son cruces de tráfico y monumentos menores (una lámpara, una placa): solo si son muy conocidos
      if(it.cat==="sight"&&((it.kind==="plaza"&&(it.fame||0)<15)||((!it.kind||it.kind==="monumento")&&(it.fame||0)<12)))return;
      if((it.cat==="comida"||it.cat==="cena")&&((it.fame||0)<3||/cine|cinema|teatro|fado|club|\bbar\b|caf[eé]|k[aá]v[eé]h[aá]z|kaffee|coffee/i.test(it.nm)))return;
      const nn=norm(it.nm);
      // ¿ya está en la guía? (mismo sitio a menos de 150 m, o nombre parecido a menos de 600 m)
      if(mine.some(m=>{const k=hav(m.c,it.c);return m.n===nn||k<.15||(k<.6&&(m.n.includes(nn)||nn.includes(m.n.split(" (")[0])));}))return;
      let nm=it.nm.charAt(0).toUpperCase()+it.nm.slice(1);
      if(COORDS[nm]&&hav(COORDS[nm],it.c)>1)nm=`${nm} (${data.city})`;
      COORDS[nm]=it.c;if(it.img&&!IMG[nm])IMG[nm]=it.img;
      out.push({cat:it.cat,nm,m:it.m||[],d:it.d||"",q:it.img?(it.nm+" "+data.city):"",auto:true,fame:it.fame||0,kind:it.kind||"",zona:it.zona||"",lux:!!it.lux,near:it.near?it.near.map(x=>x.charAt(0).toUpperCase()+x.slice(1)):null,
        el:it.ea!=null&&ELEV0[key]!=null?Math.round(it.ea-ELEV0[key]):null});
    });
    AUX[key]=out;AUXT[key]=data.fetched||Date.now();return out;
  });
}

/* ============ GUÍA AUTOMÁTICA: cualquier ciudad del mundo, sin IA y gratis ============
   /api/places devuelve sitios reales (Wikidata + OpenStreetMap) y aquí se convierten al mismo formato
   que las 27 ciudades curadas (DB/COORDS/IMG), así el generador, los mapas y las fichas funcionan igual.
   Se guarda en el navegador 14 días y en la CDN de Vercel 30 días: cada ciudad se calcula una vez. */
const AUTO={};
const autoPending={};
function isAuto(key){return !!key&&String(key).startsWith("auto:");}
function ensureCity(dest){
  dest=(dest||"").trim();if(!dest)return Promise.resolve(null);
  const cur=resolveKey(dest);
  if(cur)return Promise.race([loadAux(cur).catch(()=>null),new Promise(r=>setTimeout(r,12000))]).then(()=>cur);
  const n=norm(dest);
  if(autoPending[n])return autoPending[n];
  return autoPending[n]=(async()=>{
    let data=null;const lk="em_city_"+n;
    try{const s=JSON.parse(localStorage.getItem(lk)||"null");if(s&&s.v===3&&Date.now()-s.t<14*864e5)data={...s.d,fetched:s.t};}catch(e){}
    if(!data){
      try{const r=await fetch("/api/places?v=3&city="+encodeURIComponent(n),{signal:AbortSignal.timeout(65000)});if(r.ok)data=await r.json();}catch(e){data=null;}
      if(data&&data.ok){try{localStorage.setItem(lk,JSON.stringify({v:3,t:Date.now(),d:data}));}catch(e){}}
    }
    delete autoPending[n];
    if(!data||!data.ok||!data.items||!data.items.length)return null;
    return registerAuto(dest,data);
  })();
}
// lo que llega de Wikidata/OpenStreetMap se pinta con innerHTML: fuera etiquetas y caracteres de HTML
function cleanExt(x){return typeof x==="string"?x.replace(/[<>"`]/g,"").replace(/&(?![a-z]+;)/gi,"y").slice(0,300):x;}
function cleanItem(it){return {...it,nm:cleanExt(it.nm),d:cleanExt(it.d),zona:cleanExt(it.zona),near:Array.isArray(it.near)?it.near.map(cleanExt):it.near,img:typeof it.img==="string"&&/^https:\/\/(upload|commons)\.wikimedia\.org\//.test(it.img)?it.img:""};}
function registerAuto(dest,data){
  data={...data,city:cleanExt(data.city),country:cleanExt(data.country),items:(data.items||[]).map(cleanItem)};
  const k="auto:"+norm(data.city||dest);
  const pool=[];
  // altitud relativa a la parte baja de la ciudad (la mediana de sus sitios), para sumar las cuestas
  const eas=data.items.map(i=>i.ea).filter(e=>e!=null).sort((a,b)=>a-b),e0=eas.length?eas[Math.floor(eas.length/2)]:null;
  data.items.forEach(it=>{
    // COORDS/IMG son globales: si el nombre ya existe en OTRA ciudad, se le añade la ciudad para no pisarlo
    let nm=it.nm?it.nm.charAt(0).toUpperCase()+it.nm.slice(1):it.nm; // "catedral de Cuenca" → "Catedral de Cuenca"
    if(COORDS[nm]&&hav(COORDS[nm],it.c)>25)nm=`${it.nm} (${data.city})`;
    COORDS[nm]=it.c;
    if(it.img&&!IMG[nm])IMG[nm]=it.img;
    // sin foto propia no se busca por nombre (un bar "London" traería fotos de Londres): sale foto temática
    pool.push({cat:it.cat,nm,m:it.m||[],d:it.d||"",q:it.img?(it.nm+" "+data.city):"",auto:true,fame:it.fame||0,kind:it.kind||"",zona:it.zona||"",lux:!!it.lux,near:it.near?it.near.map(x=>x.charAt(0).toUpperCase()+x.slice(1)):null,
      el:it.ea!=null&&e0!=null?it.ea-e0:null});
  });
  DB[k]=pool;
  ALIAS[norm(dest)]=k;if(data.city)ALIAS[norm(data.city)]=k;
  AUTO[k]={city:data.city,country:data.country,cc:data.cc,c:data.c,counts:data.counts||{},sources:data.sources||{},fetched:data.fetched||Date.now()};
  return k;
}
function cityCenter(key){
  if(AUTO[key])return AUTO[key].c;
  const p=key&&DB[key]?poolDe(key):null;return p?centroide(p):null;
}

/* ============ CONCIERTOS (Ticketmaster) ============ */
const eventsCache={};
function loadEvents(key,inDate,days){
  const c=cityCenter(key);if(!c)return Promise.resolve(null);
  const d0=inDate||new Date().toISOString().slice(0,10);
  const d1=new Date(Date.parse(d0)+Math.max(0,(days||3)-1)*864e5).toISOString().slice(0,10);
  const ck=`${key}|${d0}|${d1}`;
  if(eventsCache[ck])return eventsCache[ck];
  return eventsCache[ck]=fetch(`/api/events?lat=${c[0]}&lon=${c[1]}&from=${d0}&to=${d1}`,{signal:AbortSignal.timeout(15000)})
    .then(r=>r.ok?r.json():null).then(j=>j&&j.ok?j.events:null).catch(()=>null);
}
// minutos del día; horas <06:00 cuentan como del día siguiente (la disco a la 01:30 va al final, no al principio)
function toMin(hhmm){if(!hhmm)return null;const p=hhmm.split(":");const h=+p[0],m=+(p[1]||0);let t=h*60+m;if(h<6)t+=1440;return t;}
const ARR_TRANSFER=90, DEP_MARGIN=210; // margen aeropuerto→hotel y centro→aeropuerto (min)
function flightLink(num){const n=(num||"").replace(/\s+/g,"").toUpperCase();return n?`https://www.flightaware.com/live/flight/${encodeURIComponent(n)}`:null;}
function arrivalMarker(time,destino,num){
  return {time,svg:"plane",rot:"down",lb:"Llegada",a:{t:"Aterrizas en "+cap(destino),real:false,m:[],marker:"in",link:flightLink(num),
    d:`Llegada prevista ${time}. Cuenta ~1h 30 para maletas y aeropuerto→hotel antes de empezar el plan.`+(num?` Vuelo ${num.toUpperCase()}.`:"")}};
}
function departureMarker(time,destino,num){
  return {time,svg:"plane",rot:"up",lb:"Vuelo de vuelta",a:{t:"Vuelo de salida",real:false,m:[],marker:"out",link:flightLink(num),
    d:`Salida ${time}. Sal del centro con tiempo: ~2h 30 en el aeropuerto + el trayecto. No apures el último plan.`+(num?` Vuelo ${num.toUpperCase()}.`:"")}};
}
/* ===================== CUESTAS: altitud real de cada sitio =====================
   Altura (m) sobre la parte baja de su ciudad, medida con Open-Meteo (modelo de terreno de 90 m).
   Solo se guardan los que suben o bajan 20 m o más; el resto cuenta como llano. ELEV0 = altitud de la parte baja
   (la mediana de los sitios de la guía), para pasar a relativa la altitud que trae la guía automática. */
/*ELEV-DATA*/
const ELEV0={"budapest":117,"split":17,"seoul":35,"lisboa":39,"praga":205,"roma":35,"amsterdam":7,"berlin":38,"paris":49,"madrid":655,"londres":22,"atenas":81,"viena":190,"dublin":15,"copenhague":7,"estambul":52,"edimburgo":80,"florencia":63,"venecia":10,"oporto":84,"cracovia":217,"estocolmo":19,"bruselas":30,"sevilla":15,"munich":524,"niza":20,"milan":132,"barcelona":24,"granada":702,"valencia":23,"malaga":21,"bilbao":19,"napoles":45,"tokio":23,"palma":21,"chamonix":1042,"interlaken":639,"santorini":129};
const ELEV={"Parlamento de Budapest":-20,"Bastión de los Pescadores":55,"Iglesia de Matías":60,"Castillo de Buda":45,"Baños Rudas (terma turca)":65,"Cuevas de Pálvölgyi":175,"Colina Gellért y Citadella":105,"Crucero al atardecer por el Danubio":-20,"Colina Marjan":85,"Excursión a las cascadas de Krka":125,"Dvor":35,"Bukchon Hanok Village":30,"Changdeokgung y Jardín Secreto":20,"Torre N de Seúl (Namsan)":235,"Senderismo en Bukhansan":745,"Spa coreano (jjimjilbang)":-25,"Río Han en Banpo":-30,"Atardecer en Namsan":235,"Muralla de Naksan":40,"Barbacoa coreana (Maple Tree House)":60,"Pojangmacha de Hongdae":-20,"Bares de Hongdae":-20,"Octagon (Gangnam)":-25,"Cakeshop (Itaewon)":25,"Pastéis de Belém":-25,"Torre de Belém":-40,"Monasterio de los Jerónimos":-30,"Castillo de San Jorge":40,"Plaza del Comercio":-30,"LX Factory":-35,"Oceanário de Lisboa":-40,"Excursión a Sintra":425,"Time Out Market":-30,"Miradouro da Senhora do Monte":35,"Miradouro de Santa Catarina":20,"Miradouro de São Pedro de Alcântara":20,"Pink Street (Cais do Sodré)":-30,"Pensão Amor":-25,"Bairro Alto de bares":35,"Musicbox (Cais do Sodré)":-35,"Ministerium Club":-30,"Puente de Carlos al amanecer":-20,"Castillo de Praga y San Vito":45,"Colina y torre de Petřín":120,"Vyšehrad":30,"Cervecería-jardín de Letná":30,"Crucero por el Moldava":-20,"Karlovy Lázně":-20,"Pasticcería Regoli (maritozzo)":20,"Galería Borghese":30,"Castel Sant'Angelo":-20,"Goa Club":-20,"Klunkerkranich":20,"Prater Garten":20,"Museo del Louvre":20,"Montmartre y Sacré-Cœur":80,"Excursión a Versalles":95,"Bouillon Pigalle":20,"La Machine du Moulin Rouge":25,"Palacio Real de Madrid":-25,"Estadio Santiago Bernabéu":60,"Barrio de Malasaña":20,"Sidrería Casa Mingo":-70,"Bares de Malasaña":20,"London Eye":-20,"Tower Bridge":-20,"Sky Garden":20,"Primrose Hill":35,"Desayuno griego (yogur y miel)":25,"Acrópolis y Partenón":55,"Plaka":25,"Colina Licabeto":85,"Excursión a Cabo Sunión":-25,"Mezze en una taverna":25,"Colina Filopappos":35,"Bares de Gazi":-40,"Bolivar Beach Bar":-65,"Noria del Prater":-25,"Crucero por el Danubio":-20,"Kahlenberg":215,"Heuriger en Grinzing":45,"Pratersauna":-25,"Phoenix Park":25,"Café turco (Mandabatmaz)":30,"Bazar de las Especias":-35,"Kebab / döner":30,"Balık ekmek (Eminönü)":-50,"Mezze en Kadıköy":-40,"Crucero por el Bósforo":-40,"Kebab house":20,"Bares de Karaköy / Beyoğlu":-25,"Rooftop bar (360 Istanbul)":30,"Sortie (Bósforo)":-50,"Scottish breakfast":-20,"The Milkman (café)":-25,"The Edinburgh Larder":-25,"Palacio de Holyrood":-40,"Dean Village":-40,"Excursión a las Highlands":135,"Arthur's Seat":125,"Camera Obscura":25,"The Witchery":25,"The Bow Bar (whisky)":20,"Panda & Sons":-20,"Ponte Vecchio":-25,"Piazzale Michelangelo":35,"Ponte Vecchio al atardecer":-25,"Tenax":-20,"Estación de São Bento":-25,"Ribeira":-65,"Puente Don Luís I":-85,"Bodegas de Oporto (Gaia)":-80,"Palacio de la Bolsa":-50,"Jardim do Morro":-85,"Crucero por el Duero":-70,"Puente Don Luís I al atardecer":-85,"Bodega de vino de Oporto (cata)":-85,"Gare Porto":45,"Excursión a Auschwitz-Birkenau":25,"Minas de sal de Wieliczka":30,"Montículo de Kościuszko":85,"Fotografiska":-20,"Excursión por el archipiélago":35,"Café Belga":35,"Atomium":20,"Museo Magritte":30,"Parque del Cincuentenario":50,"Frites (Maison Antoine)":25,"Place du Grand Sablon":25,"Atomium iluminado":20,"Excursión a Neuschwanstein":420,"Colina del Castillo":25,"Museo Matisse":95,"Museo Marc Chagall":20,"Èze y su jardín exótico":385,"High Club":-20,"Le Glam":35,"Beach club de verano (Castel Plage)":-20,"Fondazione Prada":-20,"Magazzini Generali":-20,"Park Güell":150,"Casa Batlló":20,"La Pedrera (Casa Milà)":30,"MNAC y escalinata de Montjuïc":40,"Fundació Joan Miró":45,"Castell de Montjuïc":155,"Playa de la Barceloneta":-20,"Recinte Modernista de Sant Pau":35,"Barrio de Gràcia":50,"CosmoCaixa":150,"Tibidabo":480,"Excursión a Montserrat":705,"Cervecería Catalana":25,"La Bodegueta (Rambla de Catalunya)":30,"Bar Mut":35,"La Pepita (Gràcia)":35,"Bunkers del Carmel":205,"Mirador del Alcalde (Montjuïc)":100,"Plaça del Sol (Gràcia)":45,"Dry Martini":35,"Razzmatazz":-20,"Passeig de Gràcia":20,"Alhambra y Generalife":75,"Albaicín":70,"Carrera del Darro y Paseo de los Tristes":20,"Sacromonte y sus cuevas":70,"Monasterio de la Cartuja":35,"Parque de las Ciencias":-40,"Bar Poë":-20,"Taberna La Tana":-20,"Carmen de Aben Humeya":45,"El Trillo":65,"Mirador de San Nicolás":70,"Mirador de San Cristóbal":55,"Mirador de San Miguel Alto":115,"Peña La Platería (flamenco)":65,"Cerámica de Fajalauza en el Albaicín":40,"Puente de Cabrera y la Alhambra":20,"El Cabanyal":-20,"Playa de la Malvarrosa":-25,"Excursión a la Albufera y El Palmar":-20,"Casa Carmela":-20,"La Pepica":-20,"Bodega La Pascuala":-20,"Casa Montaña":-20,"Ciudad de las Artes al atardecer":-20,"La Fábrica de Hielo (Cabanyal)":-20,"Puente de l'Assut de l'Or":-20,"Castillo de Gibralfaro":75,"Muelle Uno y Palmeral de las Sorpresas":-20,"Jardín Botánico de la Concepción":75,"Excursión al Caminito del Rey":270,"José Carlos García":-20,"Mirador de Gibralfaro":100,"La Farola y el Muelle Uno":-20,"Museo Guggenheim Bilbao":-20,"Basílica de Begoña":70,"Puente Zubizuri":-20,"Excursión al Puente Bizkaia":-20,"Sorginzulo":70,"Nerua":-20,"Mirador de Artxanda":115,"Parque Etxebarria":40,"Back&Stage":-20,"Castel Nuovo":-30,"Castel dell'Ovo":-40,"Castel Sant'Elmo y la Certosa":200,"Museo de Capodimonte":110,"Quartieri Spagnoli y el mural de Maradona":30,"Catacumbas de San Gennaro":70,"Excursión a Pompeya":-35,"Excursión al Vesubio":975,"Excursión a Capri":405,"L'Antica Pizzeria da Michele":-20,"Pizzeria Starita":45,"50 Kalò":-30,"Mimì alla Ferrovia":-20,"Borgo Marinari al atardecer":-45,"Belvedere de San Martino":175,"L'Antiquario":-30,"Baretti de Chiaia":-20,"Santuario Meiji":25,"Cruce de Shibuya":20,"Shinjuku Gyoen":20,"Shimokitazawa":25,"Jardín Hama-rikyu":-20,"Excursión a Nikko":645,"Omoide Yokocho":25,"Tempura Tsunahachi (Shinjuku)":35,"Odaiba al atardecer (Rainbow Bridge)":-25,"Nonbei Yokocho":20,"Bar Benfiddich":35,"Castell de Bellver":90,"Fundació Miró Mallorca":40,"Playa de Can Pere Antoni":-20,"Portixol y Ciutat Jardí":-20,"Excursión a Valldemossa":390,"Excursión a Sóller en el tren de Sóller":20,"Excursión a la playa de Es Trenc":-20,"Tren de Montenvers y Mar de Glace":810,"Le Brévent":935,"Lac Blanc":1320,"Lac des Gaillands":-20,"Cascade du Dard":230,"Excursión a Annecy":-590,"Lac des Gaillands al atardecer":-20,"Café Schuh":-70,"Harder Kulm":260,"Höhematte":-65,"Unterseen (casco antiguo)":-70,"Cuevas de San Beato":80,"Crucero por el lago de Brienz":-75,"Iseltwald":-70,"Excursión al Jungfraujoch":2815,"Excursión al valle de Lauterbrunnen":165,"Excursión a Grindelwald First":415,"Excursión a Schynige Platte":1330,"Hüsi Bierhaus":-70,"Restaurant Bebbis":-70,"Restaurant Goldener Anker":-75,"Restaurante del Harder Kulm":725,"Pasarela de los dos lagos (Harder Kulm)":725,"Mama's House (Fira)":85,"Fira y el paseo de la caldera":85,"Ruta por la caldera de Fira a Oia":150,"Imerovigli y la roca de Skaros":190,"Pyrgos":200,"Museo de la Thera Prehistórica":85,"Yacimiento de Akrotiri":-100,"Playa Roja":-130,"Playa de Perissa":-130,"Playa de Kamari":-110,"Bahía de Ammoudi":-105,"Catamarán por la caldera":-120,"Lucky's Souvlakis":85,"Metaxi Mas":60,"Ammoudi Fish Tavern":-120,"Atardecer en el castillo de Oia":-65,"Santo Wines al atardecer":155,"Koo Club":90};
/*/ELEV-DATA*/
// cómo subir a los cerros conocidos sin dejarte las piernas (lo que te diría alguien de allí)
const HILLHOW=[
  [/montju/i,"Sube en el funicular de Montjuïc desde el metro Paral·lel (va con el billete normal) y, hasta el castillo, en el teleférico o el bus 150."],
  [/bunkers|tur[oó] de la rovira/i,"Bus V17 o 22 hasta arriba y los últimos minutos andando."],
  [/park g[uü]ell/i,"Metro L3 hasta Vallcarca y las escaleras mecánicas de la Baixada de la Glòria, o el bus V19 o 24 hasta la puerta."],
  [/tibidabo/i,"Bus T2A desde Plaça Catalunya, o FGC hasta Av. Tibidabo y el funicular."],
  [/cosmocaixa/i,"FGC hasta Avinguda Tibidabo y 10 minutos andando, o el bus V15."],
  [/alhambra|generalife/i,"Minibús C30 o C32 desde Plaza Isabel la Católica: te deja en la puerta."],
  [/sacromonte/i,"Minibús C34 desde Plaza Nueva."],
  [/albaic|san nicol[aá]s|san crist[oó]bal|san miguel alto|el trillo|aben humeya|plater[ií]a|fajalauza/i,"Minibús C31 o C32 desde Plaza Nueva (y bajas andando por la Carrera del Darro)."],
  [/castillo de buda|basti[oó]n de los pescadores|iglesia de mat[ií]as/i,"Funicular (Sikló) desde el Puente de las Cadenas, o el bus 16 desde Deák tér."],
  [/gell[eé]rt|citadella/i,"Bus 27 hasta la parada Búsuló Juhász y cinco minutos andando."],
  [/castillo de praga/i,"Tranvía 22 hasta Pražský hrad y entras por arriba; luego bajas andando a Malá Strana."],
  [/pet[rř][ií]n/i,"Funicular de Petřín desde Újezd (va con el billete normal)."],
  [/montmartre|sacr[eé]-c/i,"Funicular de Montmartre (con un billete de metro) y te ahorras los escalones."],
  [/castillo de san jorge|castelo/i,"Tranvía 28 o bus 737, o los ascensores gratis de la Baixa (Rua dos Fanqueiros) hasta medio camino."],
  [/senhora do monte|gra[cç]a/i,"Tranvía 28 hasta Graça y unos minutos andando."],
  [/bairro alto|s[aã]o pedro de alc/i,"Elevador da Glória desde Restauradores (va con la tarjeta Viva Viagem)."],
  [/namsan|torre n de se/i,"Teleférico de Namsan o el bus amarillo 01."],
  [/piazzale michelangelo|san miniato/i,"Bus 12 o 13, o sube por las escaleras de San Niccolò (15 minutos)."],
  [/colina del castillo/i,"Ascensor del castillo (gratis), junto a la Torre Bellanda."],
  [/kahlenberg/i,"Bus 38A desde Heiligenstadt (metro U4)."],
  [/licabeto/i,"Funicular desde Kolonaki (calle Aristipou)."],
  [/grinzing/i,"Tranvía 38 hasta el final de la línea."],
];
function hillHow(nm){const r=HILLHOW.find(h=>h[0].test(nm||""));return r?r[1]:"";}
// altura relativa de un sitio: la guardada (guía hecha a mano) o la que trae la guía automática; null = no se sabe
function elevOf(a){if(!a)return null;if(ELEV[a.nm]!=null)return ELEV[a.nm];if(a.el!=null)return a.el;return a.auto?null:0;}
// desnivel de un tramo: [sube, baja] en metros (0 si no conocemos alguna de las dos alturas)
function climb(e1,e2){if(e1==null||e2==null)return [0,0];return [Math.max(0,e2-e1),Math.max(0,e1-e2)];}

/* ===================== MOTOR DE VIAJE: días con sentido =====================
   Cada día tiene un TIPO (llegada, barrio, excursión, salida), una ZONA y un HORARIO real:
   · los sitios se reparten por cercanía (un día = una zona, sin cruzar la ciudad),
   · la hora de cada parada sale de lo que dura de verdad + el trayecto desde la anterior,
   · se come y se cena a la hora del país, y el atardecer va a la hora real del ocaso si hay fecha,
   · tras una noche de discoteca, el día siguiente empieza tarde,
   · nada se inventa: si no hay un sitio fiable, se dice y se abre el mapa en esa zona.
   Determinista: el mismo viaje da siempre el mismo plan (los enlaces compartidos coinciden). */

// país de cada ciudad curada (para horarios, propinas y zona horaria)
const KEYCC={budapest:"HU",split:"HR",seoul:"KR",lisboa:"PT",praga:"CZ",roma:"IT",amsterdam:"NL",berlin:"DE",paris:"FR",madrid:"ES",londres:"GB",atenas:"GR",viena:"AT",dublin:"IE",copenhague:"DK",estambul:"TR",edimburgo:"GB",florencia:"IT",venecia:"IT",oporto:"PT",cracovia:"PL",estocolmo:"SE",bruselas:"BE",sevilla:"ES",munich:"DE",niza:"FR",milan:"IT",barcelona:"ES",granada:"ES"};
function ccOf(key){if(!key)return"";if(typeof AUTO!=="undefined"&&AUTO[key])return AUTO[key].cc||"";return KEYCC[key]||"";}
// costumbres por país: horas de comer/cenar/salir, propinas y zona horaria (tz estándar; dst = horario de verano europeo)
const LOCALES={
  ES:{n:"España",bk:"09:30",lunch:"14:00",dinner:"21:00",night:"23:00",club:"01:00",tz:1,dst:1,tip:"La propina no es obligatoria: se redondea o se deja un 5-10 % si te han atendido bien.",meal:"Aquí se come tarde: comida sobre las 14:00 y cena a partir de las 21:00. Entre las 16:00 y las 20:00 muchas cocinas están cerradas."},
  PT:{n:"Portugal",bk:"09:00",lunch:"13:00",dinner:"20:00",night:"22:30",club:"00:30",tz:0,dst:1,tip:"Propina opcional (5-10 %). Ojo con el «couvert»: el pan, las aceitunas o el queso que te ponen al sentarte se cobran si los tocas.",meal:"Comida de 12:30 a 14:30 y cena desde las 19:30-20:00."},
  IT:{n:"Italia",bk:"09:00",lunch:"13:00",dinner:"20:00",night:"22:30",club:"00:30",tz:1,dst:1,tip:"En la cuenta suele ir el «coperto» (cubierto, 1-3 €): no hace falta dejar más. El café en la barra cuesta menos que sentado.",meal:"Comida de 12:30 a 14:30 y cena desde las 19:30-20:00. De 18:00 a 20:00 es la hora del aperitivo."},
  FR:{n:"Francia",bk:"09:00",lunch:"12:30",dinner:"20:00",night:"22:30",club:"00:30",tz:1,dst:1,tip:"El servicio va incluido («service compris»): como mucho se redondea.",meal:"Se come de 12:00 a 14:00 y se cena de 19:30 a 21:30; fuera de esas horas muchas cocinas no sirven."},
  HU:{n:"Hungría",bk:"09:00",lunch:"12:30",dinner:"19:30",night:"22:00",club:"00:00",tz:1,dst:1,tip:"Mira la cuenta: muchos restaurantes ya suman un «szervízdíj» del 10-15 %. Si no lo incluye, deja ~10 %.",meal:"Se come sobre las 12:30 y se cena pronto, hacia las 19:00-19:30."},
  CZ:{n:"Chequia",bk:"09:00",lunch:"12:30",dinner:"19:00",night:"22:00",club:"00:00",tz:1,dst:1,tip:"Se redondea o se deja ~10 %, diciéndoselo al camarero al pagar.",meal:"Comida a mediodía (muchos sitios tienen menú del día barato de 11:00 a 14:00) y cena hacia las 19:00."},
  AT:{n:"Austria",bk:"09:00",lunch:"12:30",dinner:"19:00",night:"22:00",club:"00:00",tz:1,dst:1,tip:"Se redondea un 5-10 % al pagar, diciendo el total al camarero.",meal:"Comida 12:00-14:00 y cena desde las 18:30-19:00."},
  DE:{n:"Alemania",bk:"09:00",lunch:"12:30",dinner:"19:00",night:"22:00",club:"00:00",tz:1,dst:1,tip:"Se redondea un 5-10 % diciendo el total al camarero. Lleva algo de efectivo: aún hay bares que no aceptan tarjeta.",meal:"Comida 12:00-14:00 y cena desde las 18:30-19:00."},
  NL:{n:"Países Bajos",bk:"09:00",lunch:"12:30",dinner:"19:00",night:"22:00",club:"00:00",tz:1,dst:1,tip:"Propina opcional: se redondea. Casi todo se paga con tarjeta.",meal:"Almuerzo ligero a mediodía y cena pronto, hacia las 18:30-19:00."},
  BE:{n:"Bélgica",bk:"09:00",lunch:"12:30",dinner:"19:30",night:"22:00",club:"00:00",tz:1,dst:1,tip:"El servicio va incluido; se redondea si quieres.",meal:"Comida 12:00-14:00 y cena desde las 19:00."},
  GB:{n:"Reino Unido",bk:"09:00",lunch:"13:00",dinner:"19:30",night:"21:30",club:"23:30",tz:0,dst:1,tip:"Mira si la cuenta trae «service charge» (12,5 %); si no, deja ~10 %. En los pubs se pide en la barra y no se deja propina.",meal:"Comida 12:00-14:00 y cena 18:30-21:00. Muchos pubs cierran sobre las 23:00."},
  IE:{n:"Irlanda",bk:"09:00",lunch:"13:00",dinner:"19:30",night:"21:30",club:"23:30",tz:0,dst:1,tip:"En restaurantes, ~10 % si no va incluido; en los pubs se pide en la barra y no se deja propina.",meal:"Comida 12:30-14:30 y cena 18:30-21:00."},
  DK:{n:"Dinamarca",bk:"09:00",lunch:"12:00",dinner:"18:30",night:"21:30",club:"00:00",tz:1,dst:1,tip:"El servicio va incluido. Casi todo se paga con tarjeta (algunos sitios ni aceptan efectivo).",meal:"Comida ligera a mediodía y cena pronto, de 18:00 a 19:00."},
  SE:{n:"Suecia",bk:"09:00",lunch:"12:00",dinner:"18:30",night:"21:30",club:"00:00",tz:1,dst:1,tip:"El servicio va incluido. Muchos sitios solo aceptan tarjeta.",meal:"«Dagens lunch» (menú del día) de 11:00 a 14:00 y cena pronto, de 18:00 a 19:00."},
  GR:{n:"Grecia",bk:"09:30",lunch:"14:00",dinner:"21:00",night:"23:00",club:"01:00",tz:2,dst:1,tip:"Se redondea o se deja un 5-10 %.",meal:"Se come tarde (14:00-15:00) y se cena a partir de las 21:00."},
  TR:{n:"Turquía",bk:"09:00",lunch:"13:00",dinner:"20:00",night:"22:30",club:"00:30",tz:3,dst:0,tip:"En restaurantes se deja un 5-10 %.",meal:"Comida 12:30-14:00 y cena desde las 19:30-20:00."},
  PL:{n:"Polonia",bk:"09:00",lunch:"13:00",dinner:"19:00",night:"22:00",club:"00:00",tz:1,dst:1,tip:"~10 %. Ojo: si al pagar dices «dziękuję» (gracias), el camarero entiende que se queda con el cambio.",meal:"Comida 13:00-15:00 y cena hacia las 19:00."},
  HR:{n:"Croacia",bk:"09:00",lunch:"13:00",dinner:"20:00",night:"22:30",club:"00:30",tz:1,dst:1,tip:"Se redondea o se deja ~10 %.",meal:"Comida 12:30-14:30 y cena desde las 19:30-20:00."},
  KR:{n:"Corea del Sur",bk:"09:00",lunch:"12:00",dinner:"18:30",night:"21:00",club:"23:30",tz:9,dst:0,tip:"No se deja propina.",meal:"Comida 12:00-13:00 y cena desde las 18:00."},
  JP:{n:"Japón",bk:"09:00",lunch:"12:00",dinner:"19:00",night:"21:00",club:"23:30",tz:9,dst:0,tip:"No se deja propina: puede incomodar.",meal:"Comida 11:30-13:30 y cena 18:00-20:00. Muchos restaurantes cierran cocina pronto."},
  US:{n:"EE. UU.",bk:"09:00",lunch:"12:30",dinner:"19:00",night:"22:00",club:"23:30",tz:null,tip:"La propina es casi obligatoria: 18-20 % en restaurantes y 1-2 $ por copa.",meal:"Comida 12:00-13:30 y cena 18:00-20:00."},
  _:{n:"",bk:"09:00",lunch:"13:00",dinner:"20:00",night:"22:00",club:"00:30",tz:null,tip:"",meal:""}
};
// cómo moverse por cada ciudad (lo que le contarías a un amigo)
const TRANSIT={
  budapest:"Metro, tranvía y bus van con el mismo billete; si vas a moverte mucho, saca un pase de 24 o 72 h (o compra en la app BudapestGO). El tranvía 2, junto al Danubio, es un paseo en sí mismo.",
  barcelona:"La T-casual (10 viajes, metro y bus) sale mucho más barata que los billetes sueltos. Gótico, Born, Raval y Eixample se hacen andando; el metro, para Sagrada Família, Park Güell y Montjuïc.",
  granada:"El centro se hace andando. A la Alhambra y al Albaicín sube en los minibuses rojos (C30 a la Alhambra, C31 y C32 al Albaicín): las cuestas son duras.",
  lisboa:"Carga la tarjeta Viva Viagem con saldo («zapping») y úsala en metro, bus, tranvía y elevadores. Lisboa es de cuestas: sube en tranvía o elevador y baja andando.",
  roma:"El centro histórico se recorre andando; el metro solo tiene tres líneas. El billete de 100 min vale para metro y bus, y en los tornos se puede pagar con tarjeta contactless.",
  paris:"Metro para todo: carga billetes en una tarjeta Navigo Easy o en el móvil. El centro, a lo largo del Sena, se cruza andando.",
  londres:"Paga con tu tarjeta contactless en metro y bus (no hace falta Oyster): hay un tope diario, así que nunca pagas de más.",
  madrid:"Tarjeta Multi recargable para metro y bus. Sol, Austrias, Letras y Malasaña se hacen andando.",
  amsterdam:"Andando o en bici por el centro; tranvía con tarjeta contactless. Cuidado al cruzar: los carriles bici van en serio.",
  berlin:"Billete AB para casi todo; valídalo antes de subir (no hay tornos, pero sí revisores). Las distancias son grandes: U-Bahn y S-Bahn.",
  praga:"Billete de 30, 90 min o de 24 h; valídalo al entrar. Ciudad Vieja y Malá Strana se hacen andando.",
  viena:"Pase de 24, 48 o 72 h; valídalo antes. El centro, dentro del Ring, se hace andando.",
  atenas:"Metro desde el aeropuerto; Plaka, Monastiraki y la Acrópolis se hacen a pie.",
  dublin:"El centro se hace andando; para bus y tranvía (Luas), la Leap Visitor Card.",
  copenhague:"Bici o andando por el centro; el metro funciona 24 h y llega al aeropuerto.",
  estambul:"Istanbulkart para tranvía, metro y ferris: cruzar el Bósforo en ferry es un plan barato y precioso.",
  edimburgo:"Todo andando (con cuestas); bus Lothian pagando con contactless.",
  florencia:"Todo andando: el centro es casi peatonal.",
  venecia:"Andando y en vaporetto; si vas a usarlo más de tres veces, compensa el pase de 24 o 48 h. Algunos días hay tasa de acceso a la ciudad: compruébalo.",
  oporto:"Tarjeta Andante para metro y bus. Mucha cuesta: el centro y la Ribeira, andando.",
  cracovia:"La Ciudad Vieja y Kazimierz se hacen andando; tranvía para lo demás.",
  estocolmo:"Transporte SL pagando con contactless; Gamla Stan andando y ferry a Djurgården.",
  bruselas:"El centro se hace andando; metro y tranvía STIB con contactless.",
  sevilla:"Todo andando o en bici pública (Sevici); el metro apenas pasa por el centro.",
  munich:"Billete de día de MVV; el centro (Marienplatz, Odeonsplatz) se hace andando.",
  niza:"Tranvía desde el aeropuerto; el casco viejo y el paseo de los Ingleses, andando.",
  milan:"Metro pagando con contactless; Duomo, Brera y los Navigli también se hacen andando.",
  seoul:"Tarjeta T-money para metro y bus: el metro llega a todo.",
  split:"El casco antiguo, andando; los ferris a las islas salen del puerto.",
};
// sitios que hay que reservar (con cuánta antelación y por qué)
const BOOK=[
  [/alhambra/i,"3-4 semanas (más en primavera y verano)","La entrada fija la hora de los Palacios Nazaríes: si llegas tarde, no entras."],
  [/sagrada fam/i,"1-2 semanas","Entrada con hora. Las torres tienen plazas limitadas."],
  [/park g[uü]ell/i,"unos días","La zona monumental tiene aforo por franjas de 30 minutos."],
  [/casa batll[oó]|pedrera|casa mil[aà]/i,"unos días","Online es más barato que en taquilla y te ahorras la cola."],
  [/vaticano|sixtina/i,"2-3 semanas","Sin reserva, colas de 1-2 horas."],
  [/coliseo|colosseo|colosseum/i,"1-3 semanas","Plazas limitadas por franja; la entrada incluye Foro y Palatino."],
  [/borghese/i,"1-2 semanas","Reserva obligatoria con hora; visitas de 2 horas."],
  [/[uú]ltima cena|cenacolo/i,"1-2 meses","Grupos pequeños de 15 minutos: se agota muy rápido."],
  [/uffizi|accademia/i,"1-2 semanas en temporada","Entrada con hora."],
  [/anne frank/i,"unas 6 semanas","Solo online: las entradas salen unas 6 semanas antes y vuelan."],
  [/torre eiffel|tour eiffel/i,"1-2 semanas","Con hora para subir; la cima se agota antes."],
  [/louvre/i,"1-2 semanas","Entrada con hora obligatoria."],
  [/parlamento de budapest|hungarian parliament/i,"unos días","Solo se entra con visita guiada a hora fija."],
  [/sintra|pena/i,"unos días","El Palácio da Pena va con franja horaria."],
  [/acr[oó]polis/i,"unos días","Entrada por franjas horarias; ve a primera hora por el calor."],
  [/real alc[aá]zar|alc[aá]zar de sevilla/i,"1-2 semanas","Entrada con hora."],
  [/neuschwanstein/i,"2-4 semanas","Solo con visita guiada a hora fija."],
  [/sch[oö]nbrunn/i,"unos días","Entrada al palacio con hora."],
  [/wieliczka/i,"unos días","Visita guiada por idiomas a hora fija."],
  [/auschwitz/i,"2-4 semanas","Entrada gratuita, pero con reserva y hora; en temporada se agota."],
  [/torre de londres|tower of london/i,"unos días","Online es más barato que en la puerta."],
  [/palacio real de madrid/i,"unos días","Online te ahorras la cola."],
  [/topkap/i,"unos días","Online te ahorras la cola de taquilla."],
  [/sz[eé]chenyi/i,"opcional","Online te saltas la cola y eliges taquilla o cabina."],
  [/terrazas del duomo/i,"unos días","Con hora en temporada."],
  [/palau de la m[uú]sica/i,"unos días","Se visita con guía a hora fija."],
];
// cierres semanales que conocemos con seguridad (0 = domingo)
const CLOSED=[
  [/louvre/i,2,"los martes"],[/orsay/i,1,"los lunes"],[/uffizi/i,1,"los lunes"],[/accademia/i,1,"los lunes"],[/borghese/i,1,"los lunes"],
  [/vaticano|sixtina/i,0,"los domingos (salvo el último del mes)"],[/reina sof/i,2,"los martes"],[/[uú]ltima cena|cenacolo/i,1,"los lunes"],
  [/casa del terror/i,1,"los lunes"],[/sinagoga de doh/i,6,"los sábados"],[/mercado central/i,0,"los domingos"],[/topkap/i,2,"los martes"],[/gran bazar/i,0,"los domingos"],
  [/museu picasso|museo picasso/i,1,"los lunes"],[/fundaci[oó]n? (joan )?mir[oó]/i,1,"los lunes"],[/\bmnac\b|museo nacional de arte de catalu/i,1,"los lunes"],[/palau g[uü]ell/i,1,"los lunes"],
  [/boquer/i,0,"los domingos"],[/abad[ií]a de westminster/i,0,"los domingos (solo misas)"],[/torre de bel[eé]m/i,1,"los lunes"],[/jer[oó]nimos/i,1,"los lunes"],[/academia \(david\)/i,1,"los lunes"],[/alte pinakothek/i,1,"los lunes"],[/museo matisse/i,2,"los martes"],[/chagall/i,2,"los martes"],[/magritte/i,1,"los lunes"],[/fondazione prada/i,2,"los martes"],[/parque de las ciencias/i,1,"los lunes"],[/santa caterina/i,0,"los domingos"],[/museo nacional de tokio/i,1,"los lunes"],[/gyeongbokgung/i,2,"los martes"],[/changdeokgung/i,1,"los lunes"],
];
const WDN=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
function bookOf(nm){const r=BOOK.find(b=>b[0].test(nm));return r?[r[1],r[2]]:null;}
// el día de cierre puede ser uno (1 = lunes) o varios ([1,5] = lunes y viernes)
function closedOf(nm){const r=CLOSED.find(b=>b[0].test(nm));if(!r)return null;const wds=[].concat(r[1]);return {wd:wds[0],wds,txt:r[2]};}
// horario habitual de los sitios que conocemos: [nombre, abre, cierra de abril a octubre, cierra de noviembre a marzo]
// (null = se visita por fuera / no tiene horario que importe). Son horarios orientativos: la ficha siempre dice que se confirme.
const HOURS=[
  [/castillo de buda|palacio de diocleciano|buckingham|saint-hubert|galleria vittorio|basti[oó]n de los pescadores|east side gallery|checkpoint/i,null],
  [/abad[ií]a de westminster/i,"09:30","15:30"],[/catedral de san pablo|st\.? paul/i,"08:30","16:30"],
  [/sagrada fam/i,"09:00","20:00","18:00"],[/park g[uü]ell/i,"09:30","19:30","17:30"],[/casa batll[oó]/i,"09:00","20:00"],[/pedrera|casa mil[aà]/i,"09:00","20:30","18:30"],
  [/museu picasso/i,"10:00","19:00"],[/palau de la m[uú]sica/i,"09:30","15:30"],[/\bmnac\b/i,"10:00","20:00","18:00"],[/fundaci[oó] joan mir[oó]/i,"10:00","20:00","18:00"],
  [/castell de montju/i,"10:00","20:00","18:00"],[/sant pau/i,"09:30","18:30","17:00"],[/palau g[uü]ell/i,"10:00","20:00","17:30"],[/cosmocaixa/i,"10:00","20:00"],[/boquer/i,"08:00","20:30"],[/santa caterina/i,"08:00","15:30"],
  [/alhambra/i,"08:30","20:00","18:00"],[/catedral y capilla real/i,"10:00","18:15"],[/san jer[oó]nimo/i,"10:00","19:00","18:00"],[/cartuja/i,"10:00","19:00","18:00"],[/parque de las ciencias/i,"10:00","19:00"],[/ba[nñ]uelo/i,"09:00","14:30"],
  [/parlamento de budapest/i,"08:00","18:00","16:00"],[/iglesia de mat[ií]as/i,"09:00","17:00"],[/bas[ií]lica de san esteban/i,"09:00","17:45"],[/sinagoga de doh/i,"10:00","18:00","16:00"],[/casa del terror/i,"10:00","18:00"],[/sz[eé]chenyi/i,"07:00","22:00"],[/rudas/i,"06:00","20:00"],[/p[aá]lv[oö]lgyi/i,"10:00","16:00"],
  [/san domnio/i,"08:00","19:00","17:00"],[/s[oó]tanos del palacio/i,"08:30","21:00","17:00"],
  [/gyeongbokgung/i,"09:00","18:00","17:00"],[/changdeokgung/i,"09:00","18:00","17:30"],[/torre n de se/i,"10:00","23:00"],
  [/torre de bel[eé]m/i,"09:30","18:00","17:30"],[/jer[oó]nimos/i,"09:30","18:00","17:30"],[/castillo de san jorge/i,"09:00","21:00","18:00"],[/elevador de santa justa/i,"07:30","23:00","21:00"],[/ocean[aá]rio/i,"10:00","20:00","19:00"],
  [/castillo de praga/i,"09:00","17:00","16:00"],[/reloj astron/i,"09:00","21:00"],[/josefov/i,"09:00","18:00","16:30"],[/pet[rř][ií]n/i,"10:00","22:00","20:00"],
  [/coliseo/i,"08:30","19:15","16:30"],[/vaticanos/i,"08:00","18:30"],[/bas[ií]lica de san pedro/i,"07:00","19:00","18:30"],[/pante[oó]n de agripa/i,"09:00","19:00"],[/borghese/i,"09:00","19:00"],[/castel sant/i,"09:00","19:30"],
  [/ana frank/i,"09:00","22:00"],[/rijks/i,"09:00","17:00"],[/van gogh/i,"09:00","18:00"],[/begijnhof/i,"09:00","17:00"],[/mercado de las flores/i,"09:00","17:30"],
  [/isla de los museos/i,"10:00","18:00"],[/reichstag/i,"08:00","24:00"],[/catedral de berl/i,"09:00","19:00","18:00"],
  [/louvre/i,"09:00","18:00"],[/orsay/i,"09:30","18:00"],[/notre-dame/i,"07:50","19:00"],[/sainte-chapelle/i,"09:00","19:00","17:00"],[/arco del triunfo/i,"10:00","23:00","22:30"],[/torre eiffel/i,"09:30","23:45"],
  [/museo del prado/i,"10:00","20:00"],[/reina sof/i,"10:00","21:00"],[/palacio real de madrid/i,"10:00","19:00","18:00"],[/mercado de san miguel/i,"10:00","24:00"],[/bernab[eé]u/i,"09:30","19:00"],
  [/british museum/i,"10:00","17:00"],[/torre de londres/i,"09:00","17:30","16:30"],[/london eye/i,"10:00","20:30","18:00"],[/tate modern/i,"10:00","18:00"],
  [/acr[oó]polis y parten/i,"08:00","20:00","17:00"],[/museo de la acr[oó]polis/i,"09:00","20:00","17:00"],[/[aá]gora antigua/i,"08:00","20:00","17:00"],[/zeus ol[ií]mpico/i,"08:00","20:00","17:00"],
  [/sch[oö]nbrunn/i,"08:30","17:30","17:00"],[/hofburg/i,"09:00","18:00","17:30"],[/belvedere/i,"09:00","18:00"],
  [/book of kells/i,"08:30","17:00"],[/castillo de dubl/i,"09:45","17:45"],[/san patricio/i,"09:30","17:00"],[/guinness/i,"09:30","19:00"],[/kilmainham/i,"09:30","17:30"],
  [/tivoli/i,"11:00","22:00"],[/rosenborg/i,"10:00","17:00","16:00"],[/rundetaarn|torre redonda/i,"10:00","20:00","18:00"],[/nuestro salvador/i,"09:30","19:30","16:00"],[/amalienborg/i,"10:00","17:00","16:00"],
  [/santa sof[ií]a/i,"09:00","19:00"],[/mezquita azul/i,"09:00","18:00"],[/topkap/i,"09:00","18:00","16:45"],[/cisterna bas/i,"09:00","22:00"],[/bazar de las especias/i,"08:00","19:30"],[/torre de g[aá]lata/i,"08:30","23:00"],[/gran bazar/i,"08:30","19:00"],
  [/castillo de edimburgo/i,"09:30","18:00","17:00"],[/holyrood/i,"09:30","18:00","16:30"],[/national museum of scotland/i,"10:00","17:00"],
  [/catedral \(duomo\)/i,"08:30","19:00"],[/uffizi/i,"08:15","18:30"],[/academia \(david\)/i,"08:15","18:50"],[/palazzo vecchio/i,"09:00","19:00"],[/b[oó]boli/i,"08:15","18:30","16:30"],
  [/plaza de san marcos y bas/i,"09:30","17:15"],[/palacio ducal/i,"09:00","19:00","18:00"],[/campanile/i,"09:30","21:00","17:45"],
  [/librer[ií]a lello/i,"09:30","19:00"],[/cl[eé]rigos/i,"09:00","19:00"],[/bodegas de oporto/i,"10:00","18:00"],[/palacio de la bolsa/i,"09:00","18:30","17:30"],
  [/wawel/i,"09:30","17:00","16:00"],[/bas[ií]lica de santa mar[ií]a/i,"11:30","18:00"],[/schindler/i,"09:00","19:00","18:00"],
  [/palacio real de estocolmo/i,"10:00","17:00","16:00"],[/museo vasa/i,"08:30","18:00","17:00"],[/stadshuset/i,"09:00","16:00"],[/museo abba/i,"10:00","19:00","18:00"],[/fotografiska/i,"10:00","23:00"],
  [/atomium/i,"10:00","18:00"],[/magritte/i,"10:00","17:00"],
  [/catedral y giralda/i,"10:45","17:00"],[/real alc[aá]zar/i,"09:30","19:00","17:00"],[/metropol parasol/i,"09:30","24:00"],[/torre del oro/i,"09:30","18:45"],
  [/frauenkirche/i,"08:00","20:00"],[/residenz/i,"09:00","18:00","17:00"],[/alte pinakothek/i,"10:00","18:00"],[/olympiapark/i,"09:00","23:00"],[/museo bmw/i,"10:00","18:00"],[/nymphenburg/i,"09:00","18:00","16:00"],
  [/museo matisse/i,"10:00","18:00","17:00"],[/chagall/i,"10:00","18:00","17:00"],[/catedral rusa/i,"09:00","18:00"],
  [/duomo de mil[aá]n|terrazas del duomo/i,"09:00","19:00"],[/[uú]ltima cena/i,"08:15","18:45"],[/scala/i,"09:30","17:30"],[/fondazione prada/i,"10:00","19:00"],
];
// horario típico por tipo de sitio, para los que no tenemos en la lista (se dice que es aproximado)
const HOURK={museo:["10:00","18:00"],palacio:["10:00","18:00","17:00"],ruinas:["09:00","19:00","17:00"],zoo:["10:00","18:00","17:00"],cueva:["10:00","17:00"],torre:["10:00","19:00","18:00"],mercado:["08:00","14:30"]};
// temporada de los sitios que solo abren una parte del año: [nombre, meses (1-12), texto]. Sin fecha se avisa en la parada.
const SEASON=[];
function seasonOf(nm){const r=SEASON.find(x=>x[0].test(nm||""));return r?{months:r[1],txt:r[2]}:null;}
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
// horario de un sitio un día concreto: abre (o), cierra (c), si es dato conocido y el texto para la ficha
function hoursOf(a,date){
  if(!a||a.excursion)return null;
  const r=HOURS.find(x=>x[0].test(a.nm));let o,cs,cw;
  if(r){if(!r[1])return null;[,o,cs,cw]=r;}
  else{const k=HOURK[a.kind];if(!k)return null;[o,cs,cw]=k;}
  cw=cw||cs;
  const season=date?(date.getMonth()>=3&&date.getMonth()<=9):null;
  const c=season===false||season===null?cw:cs; // sin fecha, el horario corto (el de invierno): mejor llegar con margen
  return {o:tmin(o),c:tmin(c),cs:tmin(cs),cw:tmin(cw),known:!!r,season};
}
function hoursTxt(H){
  const o=hm(H.o),c=hm(H.c).replace(/^00:00$/,"medianoche");
  if(!H.known)return `Suele abrir de ${o} a ${c} (es el horario típico de este tipo de sitio): confírmalo en su web.`;
  if(H.cs!==H.cw&&H.season==null)return `De ${o} a ${hm(H.cs)} de abril a octubre; de noviembre a marzo, hasta las ${hm(H.cw)}. Puede cambiar en festivos: confírmalo en su web.`;
  return `De ${o} a ${c}${H.cs!==H.cw?(H.season?" (horario de verano)":" (horario de invierno)"):""}. Puede cambiar en festivos: confírmalo en su web.`;
}
// ¿se puede hacer esta visita empezando a esta hora? (llegar abierto y salir antes de que cierre)
function openAt(a,date,st,dur){const H=hoursOf(a,date);return !H||(st>=H.o-30&&st+dur<=H.c);}
// noches en que abre cada discoteca (0 = domingo; la noche del viernes es 5 aunque se salga de madrugada) y, si solo abre en temporada, en qué meses
const CLUBN=[
  [/jamboree|opium barcelona|instant-fogas|karlovy l|joy eslava|copper face|whelan|six d\.o\.g\.s|space club/i,[0,1,2,3,4,5,6]],
  [/sala apolo/i,[1,4,5,6]],[/razzmatazz|marula/i,[4,5,6]],[/teatro kapital/i,[4,5,6,0]],[/fabrik/i,[6]],
  [/berghain/i,[5,6],"La Klubnacht empieza el sábado a medianoche y sigue hasta el lunes."],[/tresor/i,[3,5,6]],[/sisyphos/i,[5,6]],
  [/fabric\b|ministry of sound/i,[5,6]],[/rex club/i,[3,4,5,6]],[/lucerna/i,[5,6]],[/ministerium/i,[5,6]],[/culture box|klein phono|tenax|molocinque|under bron|alcatraz|fuse|c12/i,[5,6]],
  [/tr[aä]dg[aå]rden/i,[3,4,5,6],null,[5,6,7,8,9]],[/bolivar/i,[0,1,2,3,4,5,6],null,[6,7,8,9]],[/sortie/i,[3,4,5,6],null,[6,7,8,9]],
  [/il muretto/i,[5,6],null,[5,6,7,8,9]],[/carpe diem|vanilla club|ba[cč]vice/i,[0,1,2,3,4,5,6],null,[6,7,8,9]],[/castel plage/i,[0,1,2,3,4,5,6],null,[4,5,6,7,8,9,10]],
];
function clubOf(a){if(!a||a.cat!=="disco")return null;const r=CLUBN.find(x=>x[0].test(a.nm));return {days:r?r[1]:[4,5,6],known:!!r,note:r&&r[2]||null,months:r&&r[3]||null};}
function clubOpen(a,wd,date){const c=clubOf(a);if(!c)return true;if(wd!=null&&!c.days.includes(wd))return false;if(c.months&&date&&!c.months.includes(date.getMonth()+1))return false;return true;}
function nightsTxt(days){
  if(days.length===7)return "todas las noches";
  const ab=["dom","lun","mar","mié","jue","vie","sáb"];const ord=[1,2,3,4,5,6,0].filter(d=>days.includes(d));
  const runs=[];ord.forEach(d=>{const L=runs[runs.length-1];const pos=[1,2,3,4,5,6,0].indexOf(d);if(L&&L.end===pos-1){L.end=pos;L.to=d;}else runs.push({from:d,to:d,end:pos});});
  const parts=runs.map(r=>r.from===r.to?ab[r.from]:([1,2,3,4,5,6,0].indexOf(r.to)-[1,2,3,4,5,6,0].indexOf(r.from)===1?`${ab[r.from]} y ${ab[r.to]}`:`${ab[r.from]} a ${ab[r.to]}`));
  return parts.length>1?parts.slice(0,-1).join(", ")+" y "+parts[parts.length-1]:parts[0];
}
function clubInfo(a,wd,date){const c=clubOf(a);if(!c)return null;
  return {txt:nightsTxt(c.days),known:c.known,note:c.note,months:c.months?`de ${MESES[c.months[0]-1]} a ${MESES[c.months[c.months.length-1]-1]}`:null,open:wd==null?null:clubOpen(a,wd,date)};}

// ---------- tipo de sitio, duración y precio honesto ----------
function kindOf(a){
  if(a.kind)return a.kind;
  const n=norm(a.nm);
  if(/^excursi|^barco a|minas de sal|senderismo|acantilados|highlands|cabo sunion|zaanse|versalles|auschwitz|neuschwanstein/.test(n))return "excursion";
  if(/balneario|banos |\bbanos\b|termas|thermal|\bbath|hammam|szechenyi|rudas|gellert furdo/.test(n))return "termas";
  if(/sacromonte|albaicin|barri gotic|barrio gotico|el born|el raval|gracia/.test(n))return "barrio";
  if(/parque de las ciencias|ciencia|science|planetario|cosmocaixa/.test(n))return "museo";
  if(/cueva|cave/.test(n))return "cueva";
  if(/coliseo|colosseo|foro romano|palatino|acropolis|ruinas|caracalla|\bagora\b|pompeya|teatro romano/.test(n))return "ruinas";
  if(/fontana|fuente|fountain|brunnen|font magica/.test(n))return "fuente";
  if(/tranvia|tram |elevador|funicular|teleferico|cremallera/.test(n))return "transporte";
  if(/parlamento|parliament|castel |castel$/.test(n))return "palacio";
  if(/museo|museu|museum|galeria|gallery|pinacoteca|kunst|rijks|prado|uffizi|louvre|orsay|tate|thyssen|vaticanos|casa del terror|fundaci|centro de arte|book of kells|biblioteca|cosmocaixa/.test(n))return "museo";
  if(/mirador|miradouro|colina|\bhill|lookout|panoram|citadella|bastion|pincio|gianicolo|bunker|turo |tibidabo|san nicolas|san miguel alto/.test(n))return "mirador";
  if(/palacio|palau|palace|castillo|castell|castle|alcazar|fortaleza|ciudadela|schloss|hrad|zamek|topkap|alhambra|torre de londres|wawel|generalife|casa batllo|pedrera|casa vicens|casa mila|belvedere|schonbrunn|hofburg|versalles|neuschwanstein/.test(n))return "palacio";
  if(/catedral|basilica|iglesia|church|sinagoga|mezquita|templo|temple|kirche|duomo|abadia|capilla|monasterio|santuario|shrine|chapel|sagrada familia|sainte|notre|santa maria|cartuja/.test(n))return "iglesia";
  if(/mercado|market|markt|piac|mercat|halle|bazar|boqueria/.test(n))return "mercado";
  if(/\bzoo\b|zoologic|acuario|aquarium|oceanario/.test(n))return "zoo";
  if(/playa|beach|praia|plage|spiaggia|barceloneta|bogatell/.test(n))return "playa";
  if(/parque|park|jardin|garden|isla |island|bosque|retiro|tiergarten|vondel|boboli|botan|ciutadella/.test(n))return "parque";
  if(/crucero|cruise|barco|boat|kayak|gondola|vaporetto|ferry|golondrina/.test(n))return "crucero";
  if(/avenida|avenue|boulevard|bulevar|\bcalle|barrio|quarter|callej|trastevere|kazimierz|alfama|gotico|\bborn\b|albaicin|sacromonte|montmartre|marais|soho|bukchon|plaka|\bcalle|street|strasse|rambla|paseo|canal|realejo|gracia/.test(n))return "barrio";
  if(/plaza|piazza|square|platz|namesti|placa|place |rynek/.test(n))return "plaza";
  if(/torre|tower|turm|campanile|cupula|noria|london eye/.test(n))return "torre";
  if(/puente|bridge|ponte|\bmost\b|brucke/.test(n))return "puente";
  if(/tranvia|tram |elevador|funicular|teleferico/.test(n))return "transporte";
  if(/tour|ruta |espectaculo|show|fado|flamenco|concierto|opera|teatro|tablao/.test(n))return "espectaculo";
  return "monumento";
}
const KDUR={ruinas:150,fuente:20,excursion:450,termas:150,cueva:90,museo:120,palacio:105,iglesia:45,mercado:60,zoo:150,parque:70,playa:120,crucero:75,mirador:40,barrio:90,plaza:25,torre:50,puente:20,transporte:45,espectaculo:90,monumento:45,sala:75,disco:150};
const DURX=[[/alhambra/i,210],[/vaticanos|sixtina/i,210],[/louvre/i,180],[/coliseo|colosseo/i,150],[/sagrada fam/i,90],[/park g[uü]ell/i,75],[/prado/i,150],[/british museum/i,150],[/rijks/i,150],[/uffizi/i,150],[/acr[oó]polis/i,120],[/topkap/i,150],[/sch[oö]nbrunn/i,120],[/parlamento/i,60],[/castillo de praga|hrad/i,150],[/montju[iï]c/i,150],[/casa batll[oó]|pedrera|casa mil[aà]/i,75],[/san esteban/i,45],[/castillo de buda/i,90],[/isla margarita/i,75]];
const CDUR={desayuno:45,comida:75,merienda:30,cena:90,atardecer:50,copas:90,disco:150,compras:60,souvenir:40,foto:25,familia:90};
function durOf(a){
  if(a.durX)return a.durX;
  const x=DURX.find(d=>d[0].test(a.nm));if(x&&a.cat==="sight")return x[1];
  if(a.cat==="sight")return KDUR[a.kind]||60;
  if(a.cat==="atardecer")return /bar|rooftop|azotea|terraza|crucero|barco|cruise/i.test(a.nm)?75:45;
  return CDUR[a.cat]||60;
}
function fmtDur(m){if(m>=360)return"Día completo (con el trayecto)";const h=Math.floor(m/60),r=m%60;return h?(h+" h"+(r?" "+r:"")):(m+" min");}
const FREEK=new Set(["parque","playa","mirador","barrio","plaza","puente","fuente"]);
const PAIDK=new Set(["ruinas","museo","palacio","termas","zoo","crucero","torre","espectaculo","cueva","excursion","transporte"]);
const PAIDX=/sagrada|sinagoga|san esteban|c[uú]pula|duomo|westminster|sainte-chapelle|santa sof|sant pau|catedral de sevilla|st\.? paul|alhambra|generalife|pante[oó]n|hospital de la santa|castel sant|jer[oó]nimos|parlamento|parliament|abad[ií]a del sacromonte|capilla real|cartuja/i;
// precio honesto: "Gratis" cuando lo es, rango orientativo solo donde tenemos datos curados, y nada inventado en el resto
function priceOf(a,cat,key){
  if(a.own)return {txt:"",unknown:true}; // sitio añadido por el usuario: no sabemos su precio y no se inventa
  const curated=!a.auto;
  const vx=typeof VENUEX!=="undefined"&&VENUEX[a.nm]&&VENUEX[a.nm].price;
  if(vx&&/[^€\s\-–·]/.test(vx))return /gratis/i.test(vx)?{free:true,txt:vx}:{txt:vx};
  if(cat==="sight"||cat==="foto"||cat==="atardecer"){
    const paidBar=cat==="atardecer"&&/bar|rooftop|azotea|terraza|crucero|barco|cruise|hotel/i.test(a.nm);
    if(!paidBar&&(FREEK.has(a.kind)||(a.kind==="mercado"&&cat!=="comida"))&&!PAIDX.test(a.nm))return {free:true,txt:"Gratis"};
    if(a.kind==="iglesia"&&!PAIDX.test(a.nm))return {txt:"Gratis o con entrada según la zona"};
    if(cat==="foto")return {free:true,txt:"Gratis"};
    if(a.kind==="transporte")return {txt:(typeof FARES!=="undefined"&&FARES[key])?`Billete de transporte (${FARES[key]})`:"Billete de transporte",paid:true};
    if(PAIDK.has(a.kind)||PAIDX.test(a.nm)||paidBar){
      if(curated&&typeof priceLabel==="function"){const bk=bookOf(a.nm);const lv=(VENUEX[a.nm]&&VENUEX[a.nm].price)||(paidBar?"€€":(bk&&bk[0]!=="opcional"?"€€-€€€":"€€"));return {txt:priceLabel(lv,paidBar?"copas":"sight",key)+" · aprox.",paid:true};}
      return {txt:"De pago · mira el precio en la web oficial",paid:true};
    }
    return {txt:"Puede tener entrada: mira la web oficial"};
  }
  if(cat==="merienda"&&curated&&typeof priceLabel==="function")return {txt:priceLabel("€","desayuno",key)};
  if(curated&&typeof priceLabel==="function"){const base=(LOCALINFO[cat]||{}).price||"€€";const lv=(VENUEX[a.nm]&&VENUEX[a.nm].price)||base;return {txt:priceLabel(lv,cat,key)};}
  return {txt:"",unknown:true};
}
// consejos según el tipo de sitio (no el mismo "reserva online" para un parque y para un museo)
const KINDINFO={
  museo:{busy:"A primera hora o en la última hora y media hay mucha menos gente.",bring:"Mochila pequeña: en muchos te hacen dejar la grande en consigna.",tip:"Mira si hay días u horas de entrada gratis y qué día cierra (muchos museos cierran un día a la semana)."},
  palacio:{busy:"Las primeras franjas de la mañana son las más tranquilas.",bring:"Calzado cómodo: son visitas largas, con escaleras.",tip:"Compra online la entrada con hora: la cola de taquilla puede ser larga."},
  iglesia:{busy:"Evita las horas de misa, sobre todo el domingo por la mañana.",bring:"Hombros y rodillas cubiertos: en muchas no te dejan pasar en tirantes o pantalón corto.",tip:"Si se puede subir a la torre o a la cúpula, merece la pena por las vistas."},
  mercado:{busy:"Mejor por la mañana: por la tarde muchos puestos ya han cerrado.",bring:"Efectivo para los puestos pequeños.",tip:"Come algo de pie en las barras de dentro: es lo más auténtico y lo más barato."},
  parque:{busy:"Entre semana y por la mañana está tranquilo; el fin de semana, lleno de familias.",bring:"Agua y algo de picar.",tip:"Buen sitio para descansar las piernas entre visita y visita."},
  playa:{busy:"A primera hora o a última de la tarde hay sitio de sobra.",bring:"Toalla, protector solar y agua.",tip:"No dejes nada de valor en la toalla mientras te bañas."},
  mirador:{busy:"Al atardecer se llena: llega 30 minutos antes.",bring:"Una chaqueta fina: arriba corre aire.",tip:"Mira la hora exacta de la puesta de sol ese día."},
  barrio:{busy:"Por la mañana se pasea mejor; por la noche cambia de ambiente.",bring:"Calzado cómodo.",tip:"Métete por las calles laterales: lo mejor no suele estar en la calle principal."},
  plaza:{busy:"De día, turistas; a última hora, gente del barrio.",bring:"Nada especial.",tip:"Las terrazas de la plaza son las más caras: aléjate una calle para tomar algo."},
  termas:{busy:"A primera hora o al final de la tarde hay menos gente; los fines de semana, a tope.",bring:"Bañador, chanclas, toalla y un candado para la taquilla (o alquílalo).",tip:"Compra online la entrada con taquilla incluida y evita la cola."},
  torre:{busy:"Las vistas son mejores a primera hora o al atardecer.",bring:"Ganas de subir escaleras: no siempre hay ascensor.",tip:"Si tiene entrada con hora, resérvala."},
  crucero:{busy:"Al atardecer es cuando más se llena.",bring:"Una chaqueta: en el agua refresca.",tip:"Los barcos de línea pública son mucho más baratos que los turísticos y la vista es la misma."},
  excursion:{busy:"Sal temprano: los grupos organizados llegan a media mañana.",bring:"Agua, algo de comida y la batería del móvil cargada.",tip:"Antes de ir, mira la hora del último tren o bus de vuelta."},
  zoo:{busy:"Por la mañana los animales están más activos.",bring:"Agua, gorra y calzado cómodo.",tip:"Compra la entrada online: suele ser más barata."},
  espectaculo:{busy:"Las mejores sesiones se agotan.",bring:"La entrada en el móvil.",tip:"Reserva con unos días de margen."},
  cueva:{busy:"Las visitas van por turnos.",bring:"Una chaqueta: dentro hace fresco todo el año.",tip:"Mira los horarios de las visitas guiadas."},
  puente:{busy:"Al atardecer es cuando más bonito está.",bring:"La cámara.",tip:"Crúzalo andando: se ve mejor que desde el coche o el bus."},
  transporte:{busy:"A primera hora o a última hay menos cola.",bring:"El billete o la tarjeta de transporte.",tip:"Suele entrar en el billete normal de transporte: no pagues el tour turístico."},
  ruinas:{busy:"Ve a primera hora: a mediodía hay colas, grupos y mucho sol.",bring:"Agua, gorra y calzado cómodo: se anda mucho y hay poca sombra.",tip:"Una audioguía o una visita guiada cambia la experiencia: sin contexto son piedras."},
  fuente:{busy:"A primera hora de la mañana o de noche hay muchísima menos gente.",bring:"Ojo con la cartera: es zona de carteristas.",tip:"Ve temprano para la foto sin multitudes."},
  monumento:{busy:"A primera o última hora evitas los grupos.",bring:"Agua y calzado cómodo.",tip:"Lee un par de líneas de su historia antes de ir: se disfruta el doble."},
};

// ---------- utilidades de tiempo ----------
function hm(m){m=Math.round(m);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}
function tmin(s){const p=String(s).split(":");return (+p[0])*60+(+p[1]||0);}
const up5=m=>Math.ceil(m/5)*5;
// minutos de un tramo. Andando: las calles no van en línea recta (×1,3) y cada 10 m de subida es un minuto más
// (regla de Naismith). Si andando sale largo, en transporte: ir a la parada, esperar y el viaje.
const STREET=1.3;
function legT(a,b){if(!a||!b||!a.c||!b.c)return 10;return travelMin(hav(a.c,b.c),...climb(a.el,b.el));}
function walkMin(km,up,down){return km*STREET/4.6*60+(up||0)/10+(down||0)/40;}
function rideMin(km,up){return 12+km*2.6+((up||0)>=40?4:0);}
function travelMin(km,up,down,maxWalk){if(km==null)return 10;up=up||0;down=down||0;if(km<0.12&&up<15)return 0;maxWalk=maxWalk||22;
  if(km>60)return Math.ceil(km/70*60+30); // excursión lejana: autovía o tren
  if(km>12)return Math.ceil(km/45*60+20);
  const w=walkMin(km,up,down),r=rideMin(km,up);return Math.ceil(w<=maxWalk||w<=r?w:r);}
const KIDS_RX=/ciencia|science|cosmocaixa|oceanogr|acuario|aquarium|ocean[aá]rio|\bzoo\b|bioparc|tibidabo|atracciones|acclimatation|tivoli|legoland|teamlab|planetario|historia natural|natural history|gulliver|m[eé]nagerie|evoluci[oó]n|nemo\b|miniatur|madurodam/i;
const HARD_RX=/senderismo|caminito del rey|vesubio|gaztelugatxe|arthur|bukhansan|bunkers|san miguel alto/i;
function shortNm(n){return String(n).replace(/\s*\([^)]*\)\s*/g," ").replace(/^excursi[oó]n (a |al |por )?(las |los |la |el )?/i,"").replace(/\s+/g," ").trim();}
function median(L){const s=[...L].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:0;}
function cent(L){const c=L.filter(Boolean);if(!c.length)return null;return [c.reduce((t,x)=>t+x[0],0)/c.length,c.reduce((t,x)=>t+x[1],0)/c.length];}
function mapsNear(q,c,city){return c?`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${c[0]},${c[1]},16z`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q+" en "+city)}`;}
// fecha del día d del viaje (si se conoce) y su día de la semana
function dayDate(inDate,d){if(!inDate)return null;const x=new Date(inDate+"T12:00:00");if(isNaN(x))return null;x.setDate(x.getDate()+d);return x;}
// hora local de la puesta de sol (algoritmo de la NOAA) — solo si sabemos la fecha y la zona horaria del país
function lastSunday(y,m){const d=new Date(Date.UTC(y,m+1,0,1));d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d;}
function sunsetMin(c,date,cc){
  const L=LOCALES[cc];if(!c||!date||!L||L.tz==null)return null;
  const y=date.getFullYear(),start=Date.UTC(y,0,0),now=Date.UTC(y,date.getMonth(),date.getDate(),12);
  const doy=Math.floor((now-start)/864e5),g=2*Math.PI/365*(doy-1);
  const eqt=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  const lat=c[0]*Math.PI/180,cosH=Math.cos(90.833*Math.PI/180)/(Math.cos(lat)*Math.cos(dec))-Math.tan(lat)*Math.tan(dec);
  if(cosH<-1||cosH>1)return null;
  const ha=Math.acos(cosH)*180/Math.PI,utc=720-4*(c[1]-ha)-eqt;
  let off=L.tz;if(L.dst){const t=new Date(now);if(t>=lastSunday(y,2)&&t<lastSunday(y,9))off+=1;}
  return Math.round(utc+off*60);
}

// ---------- preparar los sitios del destino ----------
const ADULT_RX=/\bsod\b|\berot|\bsex|porn|strip ?club|striptease|hostess|fetish|burlesque|love hotel|brothel/i;
const KIDNO_RX=/terror|auschwitz|tortur|holocaust|\bsex|erot|ruin.?bar|pub crawl|\bbar\b|cocteler|rooftop|club\b/i;
const SNACK_RX=/gelat|helad|ice cream|pastel|pasteis|churr|crepe|gofre|waffle|donut|kurtos|kürt|chocolate con/;
const COMPLEX=[/alhambra|generalife|nazari|partal|carlos v|alcazaba de la alh|mirador de ismail/,/coliseo|colosseo|foro (romano|de cesar|de nerva|de trajano|de augusto)|templo de (vesta|la concordia|antonino|saturno|venus y roma|vespasiano|castor|cesar|romulo)|lapis niger|curia julia|basilica (emilia|julia|de majencio)|via sacra|casa de las vestales|palatino|arco de (tito|constantino|septimio)|mercados de trajano/,/vaticano|sixtina|apostolico/,/castillo de praga|catedral de san vito|callejon de oro/];
function prepPool(key,o){
  const raw=poolDe(key)||[];
  const seen=new Set(),items=[],foodBase=new Set();
  raw.forEach(a=>{
    const k=a.cat+"|"+norm(a.nm);if(seen.has(k))return;seen.add(k);
    if(ADULT_RX.test(a.nm))return;
    // el mismo restaurante dos veces ("Figlmüller (cena)" y "Figlmüller (schnitzel)"): solo una
    if(["desayuno","comida","cena"].includes(a.cat)){const b=norm(a.nm.replace(/\s*\(.*\)/,""));if(foodBase.has(b))return;foodBase.add(b);}
    if(a.auto&&a.cat==="sight"&&typeof NOTSIGHT!=="undefined"&&NOTSIGHT.test(a.nm))return;
    // Wikidata a veces mete municipios enteros (Boulogne-Billancourt, Neuilly…) como si fueran un sitio que visitar
    if(a.auto&&["sight","foto","atardecer"].includes(a.cat)&&/^(comuna|municipio|ciudad|localidad|pueblo|aldea|capital|villa|departamento|provincia|regi[oó]n|distrito municipal|commune|municipality|city|town|village)\b/i.test(a.d||""))return;
    if(a.auto&&a.cat==="sight"&&(a.kind==="sala"||/\bhall\b|auditor|gimnasio|gymnas|estadio|stadium|arena\b|pabell[oó]n|pavilion|kaikan/i.test(a.nm))&&(a.fame||0)<40)return;
    let cat=a.cat;
    if(cat==="comida"&&SNACK_RX.test(norm(a.nm)))cat="merienda";
    if(o.familia&&(cat==="copas"||cat==="disco"))return;
    if(o.mayores&&cat==="disco")return;
    // fuera de temporada (teleféricos de montaña, islas en invierno…): con fecha, no entra en el plan
    if(o.month){const z=seasonOf(a.nm);if(z&&!z.months.includes(o.month))return;}
    // con los padres: nada de rutas de montaña ni de cientos de escalones
    if(o.mayores&&(cat==="sight"||cat==="atardecer")&&HARD_RX.test(a.nm))return;
    if(o.familia&&KIDNO_RX.test(norm(a.nm+" "+(a.d||"")))&&cat!=="cena"&&cat!=="comida")return;
    if(a.lux&&o.presup!=="high"&&(cat==="comida"||cat==="cena"))return; // estrella Michelin con presupuesto normal: no
    const it={...a,cat,c:COORDS[a.nm]||a.c||null};
    it.kind=kindOf(it);
    it.el=elevOf(it);
    items.push(it);
  });
  // montaña: un mirador famoso muy por encima del pueblo (Aiguille du Midi, Brévent…) es LA visita del día, no solo un atardecer
  items.filter(a=>a.auto&&a.cat==="atardecer"&&(a.el||0)>=300&&(a.fame||0)>=10).forEach(a=>{
    if(!items.some(x=>x.cat==="sight"&&x.nm===a.nm))items.push({...a,cat:"sight",kind:"mirador",m:[...new Set([...(a.m||[]),"aventura","foto"])],durX:180,
      d:(a.d?a.d+". ":"")+`Está unos ${Math.round(a.el/10)*10} m por encima del pueblo: se sube en teleférico o tren de montaña. Mira el parte y la hora de la última bajada.`});});
  const cs=items.filter(a=>a.c&&a.cat==="sight").map(a=>a.c);
  const center=(typeof AUTO!=="undefined"&&AUTO[key]&&AUTO[key].c)||(cs.length?[median(cs.map(c=>c[0])),median(cs.map(c=>c[1]))]:null);
  // importancia dentro de su tipo: en las guías curadas manda el orden de la lista; en la automática, la fama
  const byCat={};items.forEach(a=>(byCat[a.cat]=byCat[a.cat]||[]).push(a));
  for(const c in byCat){const L=byCat[c];const mf=Math.max(1,...L.map(a=>a.fame||0));
    L.forEach((a,j)=>{a.imp=a.auto?Math.log(1+(a.fame||0))/Math.log(1+mf):1-j/Math.max(1,L.length);});}
  items.forEach(a=>{
    a.dist=a.c&&center?hav(a.c,center):null;
    a.excursion=a.cat==="sight"&&(a.kind==="excursion"||(a.dist!=null&&a.dist>10));
    if(a.excursion&&a.kind!=="excursion")a.kindIn=a.kind;
    if(a.excursion)a.kind="excursion";
    a.dur=durOf(a);
  });
  // guía automática: lo que queda lejos solo vale como excursión si es MUY conocido (no un barrio cualquiera de las afueras)
  for(let i=items.length-1;i>=0;i--){const a=items[i];if(a.auto&&a.excursion&&((a.fame||0)<30||a.dist>90||!["palacio","iglesia","museo","ruinas","monumento","parque","mirador"].includes(a.kindIn)))items.splice(i,1);}
  // varias partes de una misma visita (la Alhambra y el Generalife van con la misma entrada): una sola parada
  for(const rx of COMPLEX){
    const L=items.filter(a=>a.cat==="sight"&&rx.test(norm(a.nm)));if(L.length<2)continue;
    const curL=L.filter(a=>!a.auto);
    const host=curL.length?curL[0]:L.reduce((b,a)=>((a.fame||0)>(b.fame||0)?a:b),L[0]);
    host.near=[...new Set([...(host.near||[]),...L.filter(a=>a!==host&&norm(a.nm)!==norm(host.nm)).map(a=>a.nm)])];
    L.forEach(a=>{if(a!==host)items.splice(items.indexOf(a),1);});
  }
  return {items,center,maxFame:Math.max(1,...items.map(a=>a.fame||0))};
}
function popOf(T,a){const mf=T.maxFame||1;return (a.auto?Math.log(1+(a.fame||0))/Math.log(1+mf)*.9:(a.imp||0)+.3)+(bookOf(a.nm)?.5:0);}
/* ===================== MOTOR DE MOODS: ¿encaja lo que has elegido? =====================
   Mira lo que hay DE VERDAD en la guía de esa ciudad (no una lista genérica), con quién viajas, cuántos días,
   en qué mes y con qué presupuesto. Da una puntuación orientativa (no es una verdad, es una recomendación)
   y sugiere moods que podrías estar perdiéndote, con los sitios concretos que desbloquean. Nunca cambia nada solo. */
const MOODNM={cultural:"Cultura",relax:"Relax",aventura:"Naturaleza y aventura",gastro:"Gastronomía",fiesta:"Vida nocturna",romantico:"Romántico",compras:"Compras",souvenir:"Recuerdos",foto:"Fotografía"};
// cuántos sitios hacen falta para llenar ese mood en un viaje normal, y de qué tipo
const MOODNEED={cultural:{cats:["sight"],n:8},gastro:{cats:["comida","cena","desayuno"],n:7},fiesta:{cats:["copas","disco"],n:5},romantico:{cats:["sight","atardecer","cena","copas"],n:7},
  relax:{cats:["sight","atardecer","desayuno","copas"],n:5},aventura:{cats:["sight"],n:4},foto:{cats:["sight","atardecer","foto"],n:6},compras:{cats:["compras","sight"],n:3},souvenir:{cats:["souvenir","compras"],n:2}};
// encaje de cada mood con cada compañía (0-1): una guía, no un estereotipo; los gustos mandan
const COMPFIT={
  solo:{cultural:1,relax:.8,aventura:.9,gastro:.9,fiesta:.8,romantico:.35,compras:.8,souvenir:.7,foto:1},
  pareja:{cultural:.9,relax:.9,aventura:.8,gastro:1,fiesta:.7,romantico:1,compras:.7,souvenir:.6,foto:.9},
  amigos:{cultural:.75,relax:.6,aventura:.9,gastro:1,fiesta:1,romantico:.4,compras:.7,souvenir:.6,foto:.8},
  familia:{cultural:.8,relax:.8,aventura:1,gastro:.8,fiesta:0,romantico:.3,compras:.7,souvenir:.8,foto:.8},
  mayores:{cultural:1,relax:1,aventura:.45,gastro:1,fiesta:.2,romantico:.8,compras:.7,souvenir:.8,foto:.9}};
const COMPWHY={
  familia:{fiesta:"Con niños no se planifican discotecas: las noches serán tranquilas.",romantico:"Con peques, los planes «para dos» encajan poco: mejor atardeceres y paseos para todos.",aventura:"Parques, playas y excursiones suelen ser lo que más disfrutan los niños."},
  mayores:{fiesta:"Con tus padres no se planifican discotecas; sí una copa tranquila después de cenar.",aventura:"Ojo con las rutas a pie y las cuestas: elegimos excursiones suaves y subimos en transporte.",cultural:"Museos y monumentos con visitas de duración razonable y descansos entre medias."},
  solo:{romantico:"Viajando solo, «romántico» se traduce en miradores, atardeceres y cafés con encanto; si no es lo que buscas, quítalo.",fiesta:"De noche, mejor zonas con mucho ambiente y bien comunicadas para volver."},
  amigos:{romantico:"En grupo, lo romántico suele sobrar; los atardeceres y miradores salen igual con «Fotografía» o «Relax».",fiesta:"Previa, bares y discoteca en las noches en que abren."},
  pareja:{romantico:"Cenas para dos, atardeceres y paseos: sin convertir todo el viaje en eso.",fiesta:"Noches de fiesta alternas, para no dejar el día siguiente en blanco."}};
function moodPool(key,o){if(!key||!DB[key])return null;return prepPool(key,{moods:o.moods||[],familia:o.compania==="familia",presup:o.presup||"mid",month:o.date?new Date(o.date+"T12:00:00").getMonth()+1:null});}
function moodAdvice(key,o){
  const P=moodPool(key,o);if(!P)return null;
  const month=o.date?new Date(o.date+"T12:00:00").getMonth()+1:null;
  const lat=P.center?P.center[0]:45;
  const dias=o.dias||3,comp=o.compania||"amigos";
  const all=Object.keys(MOODNM);
  const res={};
  for(const m of all){
    const need=MOODNEED[m];
    let L=P.items.filter(a=>(a.m||[]).includes(m)&&need.cats.includes(a.cat));
    if(m==="aventura")L=L.concat(P.items.filter(a=>a.excursion&&!(a.m||[]).includes(m)&&["parque","playa","mirador"].includes(a.kindIn||"")));
    if(m==="fiesta"&&month)L=L.filter(a=>a.cat!=="disco"||clubOpen(a,null,new Date(o.date+"T12:00:00")));
    const w=L.reduce((t,a)=>t+(a.auto?.45:1),0);
    const avail=Math.min(1,w/need.n);
    const cf=(COMPFIT[comp]||COMPFIT.amigos)[m];
    const why=[];let season=1,dur=1;
    if(m==="fiesta"&&month){const clubs=P.items.filter(a=>a.cat==="disco");const shut=clubs.filter(a=>!clubOpen(a,null,new Date(o.date+"T12:00:00"))).length;if(shut&&shut===clubs.length)why.push("En ese mes las discotecas que conocemos están cerradas (abren en temporada).");}
    if((m==="aventura"||m==="relax")&&month&&lat>44&&[11,12,1,2].includes(month)){season=.7;why.push("En invierno, allí los planes al aire libre son más cortos y fríos.");}
    if(m==="aventura"&&dias<=2){dur=.6;why.push("Con 2 días no cabe una excursión de día completo.");}
    if(m==="fiesta"&&dias<=1){dur=.6;}
    if(COMPWHY[comp]&&COMPWHY[comp][m])why.push(COMPWHY[comp][m]);
    if(avail<.5)why.push(L.length?`En esta guía hay pocos sitios de este tipo (${L.length}).`:"En esta guía no tenemos sitios de este tipo.");
    const top=[...L].filter(a=>!a.auto||((a.fame||0)>=8)).sort((x,y)=>(y.auto?0:1)-(x.auto?0:1)||(y.imp||0)-(x.imp||0)).map(a=>shortNm(a.nm)).filter((n,i,A)=>A.indexOf(n)===i).slice(0,3);
    const score=Math.round(100*(.45*avail+.35*cf+.1*season+.1*dur));
    res[m]={id:m,nm:MOODNM[m],score,avail,n:L.length,why,top};
  }
  const sel=(o.moods||[]).map(m=>res[m]).filter(Boolean);
  // combinaciones que conviene matizar
  const notes=[];
  const has=m=>(o.moods||[]).includes(m);
  if(has("fiesta")&&has("relax"))notes.push("Fiesta y relax se llevan bien si se reparten: noches de salida y mañanas que empiezan tarde, con brunch.");
  if(has("fiesta")&&(o.ritmo==="chill"))notes.push("Con ritmo tranquilo, la fiesta irá en noches alternas para que descanses.");
  if(sel.length>=3&&dias<=2)notes.push("Tres moods en dos días es mucho: cada día se centrará en uno o dos.");
  // sugerencias: moods que no has elegido, con buen encaje y sitios de verdad que desbloquean
  const affin={romantico:["gastro","foto","relax"],cultural:["foto","gastro"],fiesta:["gastro"],gastro:["cultural","romantico"],relax:["romantico","gastro"],aventura:["foto","relax"],foto:["cultural","aventura"],compras:["gastro"],souvenir:["compras"]};
  const sugg=all.filter(m=>!has(m)&&m!=="souvenir").map(m=>{const r=res[m];let s=r.score+((o.moods||[]).some(x=>(affin[x]||[]).includes(m))?8:0);return {...r,rank:s};})
    .filter(r=>r.rank>=72&&r.avail>=.7&&r.top.length>=2).sort((a,b)=>b.rank-a.rank).slice(0,2);
  sugg.forEach(r=>{const rel=(o.moods||[]).find(x=>(affin[x]||[]).includes(r.id));
    r.reason=(rel?`Va de la mano de «${MOODNM[rel]}», que ya has elegido, `:"")+`y aquí hay buenos sitios para ello`+(COMPFIT[comp]&&COMPFIT[comp][r.id]>=.9?` que encajan viajando ${({solo:"solo",pareja:"en pareja",amigos:"con amigos",familia:"en familia",mayores:"con tus padres"})[comp]}`:"")+".";
    r.when=dias>=3?"Lo repartiríamos en uno o dos días, sin quitar lo tuyo.":"Entraría en alguna parada suelta.";});
  return {sel,sugg,notes,all:res};
}
function fitOf(a,moods,pref){let s=0;(a.m||[]).forEach(x=>{if(moods.includes(x))s+=2;else if(pref&&pref.includes(x))s+=.7;});return s;}
const INDOOR=new Set(["museo","palacio","iglesia","mercado","termas","zoo","espectaculo","cueva"]);
const OUTDOOR=new Set(["parque","playa","mirador","barrio","plaza","puente","crucero"]);

// ---------- el viaje entero ----------
function planTrip(destino,dias,moods,ritmo,compania,opts){
  opts=opts||{};
  const key=resolveKey(destino),cc=ccOf(key),LC=LOCALES[cc]||LOCALES._;
  const o={moods:moods||[],ritmo:ritmo||"equi",compania:compania||"amigos",presup:opts.presup||"mid",familia:compania==="familia",mayores:compania==="mayores",month:opts.inDate?new Date(opts.inDate+"T12:00:00").getMonth()+1:null};
  const P=prepPool(key,o);
  const city=cap(destino);
  const T={key,cc,LC,P,o,city,opts,used:new Set(),dias,maxFame:P.maxFame};
  // 1 · tipo de cada día
  const types=Array(dias).fill("barrio");
  if(dias===1)types[0]="unico";else{types[0]="llegada";types[dias-1]="salida";}
  const exc=P.items.filter(a=>a.excursion&&a.c).map(a=>({a,v:fitOf(a,o.moods)+a.imp*2})).sort((x,y)=>y.v-x.v);
  let nExc=dias>=7?2:(dias>=4||(dias===3&&o.moods.includes("aventura")))?1:0;
  if(o.ritmo==="chill"&&dias<6)nExc=Math.min(nExc,dias>=5?1:0);
  nExc=Math.min(nExc,exc.length);
  const excDays=nExc===1?[Math.floor(dias/2)]:nExc===2?[Math.round(dias/3),Math.round(2*dias/3)]:[];
  const excItem={};excDays.forEach((d,i)=>{if(types[d]==="barrio"){types[d]="excursion";excItem[d]=exc[i].a;T.used.add(exc[i].a.nm);}});
  // 2 · noches: fiesta en días alternos (o todas si el ritmo es intenso), nunca la última; tras la discoteca se empieza tarde
  const party=o.moods.includes("fiesta")&&!o.familia&&!o.mayores;
  let night=types.map((t,d)=>{if(!party)return "calma";if(d===dias-1&&dias>1)return "none";return (o.ritmo==="intenso"||d%2===0)?"disco":"copas";});
  // con fecha: cada discoteca solo va en una noche en que abra (casi todas abren de jueves a sábado); las demás noches, copas
  const nightWhy=types.map(()=>null);
  if(party&&opts.inDate){
    const clubs=P.items.filter(a=>a.cat==="disco");
    const last=d=>d===dias-1&&dias>1,dtOf=d=>dayDate(opts.inDate,d);
    const openOn=d=>{const dt=dtOf(d);return clubs.some(a=>clubOpen(a,dt.getDay(),dt));};
    const want=night.filter(n=>n==="disco").length;
    night=types.map((t,d)=>last(d)?"none":"copas");
    types.forEach((t,d)=>{if(!last(d)&&!openOn(d))nightWhy[d]="closed";});
    const pri=d=>({6:4,5:3,4:2}[dtOf(d).getDay()]||1);
    const cand=types.map((t,d)=>d).filter(d=>!last(d)&&openOn(d)).sort((a,b)=>pri(b)-pri(a)||a-b);
    let n=0;for(const d of cand){if(n>=want)break;if(o.ritmo!=="intenso"&&(night[d-1]==="disco"||night[d+1]==="disco"))continue;night[d]="disco";n++;}
  }
  T.types=types;T.night=night;T.nightWhy=nightWhy;T.excItem=excItem;
  // 3 · reparto de sitios por zonas
  let groups=allocSights(T);
  // si por hacer la excursión se quedan fuera visitas LARGAS (3 h o más) claramente más importantes que ella
  // (los teleféricos de Chamonix frente a Annecy), ese día se queda en la ciudad. Montserrat no se toca: en
  // Barcelona lo que queda fuera son visitas cortas.
  for(const d of Object.keys(excItem).map(Number)){
    const ex=excItem[d];
    const left=P.items.filter(a=>a.cat==="sight"&&!a.auto&&!a.excursion&&a.c&&!T.used.has(a.nm)&&(a.dur||0)>=180&&(a.imp||0)>=(ex.imp||0)+.3);
    if(left.reduce((t,a)=>t+a.dur,0)>=360){
      types[d]="barrio";delete excItem[d];
      T.used=new Set(Object.values(excItem).map(a=>a.nm));T.types=types;
      groups=allocSights(T);
    }
  }
  // 4 · cada día
  T.days=types.map((t,d)=>planDay(T,d,groups[d]||[]));
  T.days.forEach(D=>repairDay(T,D));
  return T;
}
// minutos de visitas que le tocan a cada tipo de día (peso relativo)
function dayWeight(t,late){if(t==="llegada")return .45;if(t==="salida")return .4;if(t==="excursion")return 0;return late?.7:1;}
function allocSights(T){
  const {P,o,types}=T;
  const sights=P.items.filter(a=>a.cat==="sight"&&!a.excursion&&a.c&&!T.used.has(a.nm)).map(a=>({a,v:fitOf(a,o.moods)+a.imp*3-(o.mayores&&(a.el||0)>=60&&!hillHow(a.nm)?2.5:0)+(a.auto?0:1.2)}));
  // un sitio con el mismo nombre que otro (p. ej. la Alhambra como parque y como palacio) es el mismo sitio
  const byName=new Map();sights.forEach(s=>{const k=norm(s.a.nm);if(!byName.has(k)||byName.get(k).v<s.v)byName.set(k,s);});
  const S=[...byName.values()].sort((x,y)=>y.v-x.v);
  const base=({chill:200,equi:300,intenso:390}[o.ritmo]||300)*(o.mayores?.8:1);
  const lateOf=d=>d>0&&T.night[d-1]==="disco";
  const units=types.reduce((t,ty,d)=>t+dayWeight(ty,lateOf(d)),0)||1;
  const taken=new Set(),res=types.map(()=>[]);
  const idx=f=>types.map((t,d)=>d).filter(f);
  // la llegada primero (centro, sin entradas a hora fija), luego los días de barrio y por último el de vuelta
  const order=[...idx(d=>types[d]==="llegada"),...idx(d=>types[d]==="barrio"||types[d]==="unico"),...idx(d=>types[d]==="salida")];
  const isEasy=d=>types[d]==="llegada"||types[d]==="salida";
  // con fecha: nada en su día de cierre (el Orsay un lunes, el Topkapı un martes…)
  const wdOf=d=>{const dt=dayDate(T.opts.inDate,d);return dt?dt.getDay():null;};
  const shut=(a,d)=>{const w=wdOf(d);if(w==null)return false;const c=closedOf(a.nm);return !!c&&c.wds.includes(w);};
  const okEasy=s=>!bookOf(s.a.nm)&&s.a.dur<=150;
  // hace crecer el grupo de un día con lo que encaje y pille cerca (con variedad: no seis iglesias seguidas)
  function grow(grp,pool,target,easy,radii,d){
    let tot=grp.reduce((t,a)=>t+a.dur,0);
    for(const R of radii){
      while(tot<target){
        const c0=cent(grp.map(a=>a.c));const kc={};grp.forEach(a=>kc[a.kind]=(kc[a.kind]||0)+1);
        let best=null,bv=-1e9;
        for(const s of pool){if(taken.has(s.a))continue;if(easy&&!okEasy(s))continue;if(shut(s.a,d))continue;
          const dk=hav(s.a.c,c0);if(dk>R)continue;
          const rep=(kc[s.a.kind]||0)*(["iglesia","museo","parque"].includes(s.a.kind)?1.6:.6);
          const sc=s.v-dk*1.3-rep;if(sc>bv){bv=sc;best=s;}}
        if(!best||tot+best.a.dur>target*1.35)break;grp.push(best.a);taken.add(best.a);tot+=best.a.dur;
      }
      if(tot>=target*.8)break;
    }
    return tot;
  }
  function seedFor(d,pool){
    const easy=isEasy(d);let cand=pool.filter(s=>!taken.has(s.a)&&!shut(s.a,d));if(!cand.length)return null;
    if(easy){const nb=cand.filter(okEasy);if(nb.length)cand=nb;}
    let seed=null,bs=-1e9;
    for(const s of cand){const sc=s.v-(easy&&P.center?hav(s.a.c,P.center)*1.2:0);if(sc>bs){bs=sc;seed=s;}}
    taken.add(seed.a);return seed.a;
  }
  // fase 1: los imprescindibles de la guía hecha a mano, repartidos a partes iguales entre los días
  const cur=S.filter(s=>!s.a.auto),aux=S.filter(s=>s.a.auto);
  const two=cur.length>0&&aux.length>0;
  const P1=two?cur:S;
  const per1=Math.min(base,P1.reduce((t,s)=>t+s.a.dur,0)/units*.95);
  for(const d of order){
    const target=Math.max(45,dayWeight(types[d],lateOf(d))*per1);
    const sd=seedFor(d,P1);if(!sd)break;res[d]=[sd];
    grow(res[d],P1,target,isEasy(d),[1.4,2.2,3],d);
  }
  // fase 2: cada día se completa con sitios de Wikipedia que estén cerca de lo que ya tiene
  if(two){
    const per2=Math.min(base,S.reduce((t,s)=>t+s.a.dur,0)/units*.95);
    for(const d of order){
      const target=Math.max(45,dayWeight(types[d],lateOf(d))*per2);
      if(!res[d].length){const sd=seedFor(d,aux);if(!sd)continue;res[d]=[sd];}
      grow(res[d],aux,target,isEasy(d),[1,1.6],d);
    }
  }
  // con fechas: que ningún sitio caiga en su día de cierre (se intercambian días de barrio entre sí)
  if(T.opts.inDate){
    const bd=idx(d=>types[d]==="barrio");
    const bad=(d,g)=>{const dt=dayDate(T.opts.inDate,d);return dt&&g.some(a=>{const c=closedOf(a.nm);return c&&c.wds.includes(dt.getDay());});};
    for(const d of bd){if(!bad(d,res[d]))continue;
      const sw=bd.find(e=>e!==d&&!bad(d,res[e])&&!bad(e,res[d]));if(sw!=null){const t=res[d];res[d]=res[sw];res[sw]=t;}}
  }
  // lo repartido queda reservado desde ya (si no, otro día podría cogerlo para rellenar un hueco)
  res.forEach(g=>g.forEach(a=>T.used.add(a.nm)));
  T.sightV=new Map(S.map(s=>[s.a.nm,s.v]));
  return res;
}
// elige el sitio de un tipo que mejor encaja y pilla más cerca de un punto (sin repetir en todo el viaje)
function pickNear(T,cat,anchor,opt){
  opt=opt||{};const wd=opt.wd;
  let best=null,bs=-1e9;
  for(const a of T.P.items){
    if(a.cat!==cat||T.used.has(a.nm))continue;
    if(wd!=null){const c=closedOf(a.nm);if(c&&c.wds.includes(wd))continue;}
    if(cat==="disco"&&wd!=null&&!clubOpen(a,wd,opt.date||T.curDate))continue;
    if(opt.filter&&!opt.filter(a))continue;
    // el mismo sitio con otro nombre no se repite en el día (subir al Harder Kulm y volver a subir a cenar)
    if(T.curSlots&&["atardecer","cena","comida","copas"].includes(cat)&&T.curSlots.some(q=>q.item&&q.item!==a&&sameSpot(q.item,a)))continue;
    const dk=a.c&&anchor?hav(a.c,anchor):null;
    if(dk!=null&&dk>(opt.maxKm||2.5))continue;
    if(dk==null&&a.c&&!anchor){} // sin ancla: vale cualquiera
    const sc=fitOf(a,T.o.moods,opt.pref)+a.imp*1.2-(dk==null?(a.c?1:1.8):dk)*(opt.w==null?1:opt.w)+(T.o.presup==="high"&&a.lux?2:0)-(opt.cost?opt.cost(a):0);
    if(sc>bs){bs=sc;best=a;}
  }
  if(best&&!opt.peek)T.used.add(best.nm);
  return best;
}
// lo que "cuesta" ir a ver el atardecer a un sitio: el trayecto desde donde estás (con la cuesta) y, si arriba no hay
// dónde cenar, la bajada después. El día de llegada se castiga más cruzar la ciudad: vienes del avión.
function sunCost(T,from,type){
  return a=>{
    if(!a.c)return 0;
    const tr=from&&from.c?legT(from,a):15;
    const dinner=T.P.items.some(x=>x.cat==="cena"&&!T.used.has(x.nm)&&x.c&&hav(x.c,a.c)<1.6);
    return tr/(type==="llegada"?6:15)+(dinner?0:.9)+(type==="llegada"&&(a.el||0)>=60?.8:0);
  };
}
function genSlot(cat,label,txt,d,gm,at){return {cat,label,gen:{t:txt,d,gm},at:at||null,dur:CDUR[cat]||60};}
const GMQ2={desayuno:"cafeterías",comida:"restaurantes",merienda:"pastelerías",cena:"restaurantes",copas:"bares",disco:"discotecas",atardecer:"miradores",compras:"tiendas",souvenir:"tiendas de recuerdos",familia:"parques infantiles",foto:"miradores"};
function mealSlot(T,cat,label,anchor,near,wd,pref,alt){
  const mk={desayuno:1.2,comida:1.3,cena:1.6,merienda:1.2,copas:1.6,disco:3}[cat]||2;
  const anchor0=anchor;
  let a=pickNear(T,cat,anchor,{wd,pref,maxKm:mk,w:1.3});
  if(!a&&alt&&alt.c){a=pickNear(T,cat,alt.c,{wd,pref,maxKm:mk,w:1.3});if(!a){anchor=alt.c;near=alt.nm;}}
  // cenar o tomar algo tras un mirador en lo alto: mejor bajar un poco (en bus o taxi) a un sitio bueno que una cena «por la zona»
  if(!a&&(cat==="cena"||cat==="copas"||cat==="comida")&&(anchor0||anchor))a=pickNear(T,cat,anchor0||anchor,{wd,pref,maxKm:mk*1.8,w:1.6});
  if(a)return {cat,label,item:a,dur:durOf(a)};
  const where=near?shortNm(near):"el centro";
  const zz=near?`la zona de ${where}`:where;
  const cerca=where==="el centro"?"cerca del centro":`cerca de ${where}`;
  const txt={desayuno:`Desayuna ${cerca}`,comida:`Come por ${zz}`,merienda:`Merienda por ${zz}`,cena:`Cena por ${zz}`,copas:`Copas por ${zz}`,disco:`Discoteca ${cerca}`}[cat]||`Plan cerca de ${where}`;
  return genSlot(cat,label,txt,"No tenemos un sitio fiable aquí y no te lo vamos a inventar: abre el mapa de la zona y elige entre los que tengan buenas reseñas.",mapsNear(GMQ2[cat]||"restaurantes",anchor,T.city),anchor);
}
// quita visitas de la tarde que no caben antes de 'limit' (quedan libres para otro día o para el plan B)
const REMOVABLE=new Set(["sight","foto","compras","souvenir","merienda","familia"]);
function trimDay(T,slots,start,limit){
  for(let k=0;k<14;k++){
    const ci=slots.findIndex(s=>s.cat==="cena");
    const day=ci<0?slots:slots.slice(0,ci);
    const sch=runSchedule({slots:day,start,end:null},T);
    const lastEnd=sch.length?sch[sch.length-1].end:start;
    if(lastEnd<=limit)return;
    const li=slots.findIndex(s=>s.cat==="comida");
    let j=-1,bw=1e9;
    for(let i=day.length-1;i>li;i--){const x=day[i];if(!REMOVABLE.has(x.cat)||x.label==="Excursión")continue;
      const w=x.cat==="sight"?10+(x.item?popOf(T,x.item):0):(x.item?popOf(T,x.item)*.1:0);
      if(w<bw){bw=w;j=i;}}
    if(j<0)return;
    const x=slots[j];if(x.item){T.used.delete(x.item.nm);}
    slots.splice(j,1);
  }
}
function planDay(T,d,grp){
  const {o,LC,types,night}=T,t=types[d];
  const date=dayDate(T.opts.inDate,d),wd=date?date.getDay():null;
  const late=d>0&&night[d-1]==="disco";
  T.curDate=date;
  const lunch=tmin(LC.lunch),dinner=tmin(LC.dinner);
  let start=tmin(late?"11:00":LC.bk),end=null;
  if(t==="llegada"){start=T.opts.arr?up5(toMin(T.opts.arr)+ARR_TRANSFER):lunch;}
  if(t==="salida"){end=T.opts.dep?toMin(T.opts.dep)-DEP_MARGIN:tmin("17:30");}
  // excursiones que no piden madrugar (la Albufera: paella en El Palmar a mediodía y barca hasta el atardecer)
  const exAt=t==="excursion"&&T.excItem[d]&&T.excItem[d].exAt?tmin(T.excItem[d].exAt):null;
  if(t==="excursion")start=exAt!=null?exAt-90:tmin("08:00");
  // orden de las visitas: lo más visitado a primera hora (antes de que se llene) y luego, lo más cercano
  const left=[...grp].sort((a,b)=>popOf(T,b)-popOf(T,a));
  const ord=[];let cur=left.length?left.shift():null;
  while(cur){ord.push(cur);if(!left.length)break;let bi=0,bd=1e9;left.forEach((a,i)=>{const k=legT(cur,a);if(k<bd){bd=k;bi=i;}});cur=left.splice(bi,1)[0];}
  ord.forEach(a=>T.used.add(a.nm));
  const slots=[];T.curSlots=slots;
  const zoneC=cent(ord.map(a=>a.c))||T.P.center;
  // --- mañana ---
  let tcur=start,prevC=null,prevA=null;
  const first=ord[0];
  if(t==="excursion"){
    slots.push(mealSlot(T,"desayuno","Desayuno",T.P.center,null,wd));
    const ex=T.excItem[d];
    slots.push({cat:"sight",label:"Excursión",item:ex,dur:ex.dur,fixedAt:exAt!=null?exAt:tmin("08:45")});
  }else{
    const withBk=t!=="llegada"||start<=tmin("10:45");
    if(withBk){const s=mealSlot(T,"desayuno",late?"Brunch":"Desayuno",first?first.c:zoneC,first&&first.nm,wd);if(late)s.dur=60;slots.push(s);tcur+=s.dur+5;}
  }
  const morning=[],afternoon=[];
  if(t==="llegada"&&!T.opts.arr){afternoon.push(...ord);}
  else if(t!=="excursion"){
    for(const a of ord){
      const tr=prevA?legT(prevA,a):10;
      if(!morning.length||tcur+tr+a.dur<=lunch+45){if(tcur+tr+a.dur>lunch+120&&morning.length)break;morning.push(a);tcur+=tr+a.dur;prevC=a.c;prevA=a;}
      else break;
    }
    afternoon.push(...ord.slice(morning.length));
  }
  morning.forEach(a=>slots.push({cat:"sight",label:"Mañana",item:a,dur:a.dur}));
  // --- comida ---
  const lastM=morning[morning.length-1]||null,nextA=afternoon[0]||null;
  if(t!=="excursion"){
    const lunchC=lastM&&nextA?cent([lastM.c,nextA.c]):(lastM?lastM.c:(nextA?nextA.c:zoneC));
    const ls=mealSlot(T,"comida","Comida",lunchC,(lastM||nextA||{}).nm,wd,["gastro"]);ls.fixedAt=lunch;if(o.mayores)ls.dur+=30;slots.push(ls);
  }
  // --- tarde ---
  afternoon.forEach((a,i)=>{slots.push({cat:"sight",label:"Tarde",item:a,dur:a.dur});
    if(i===0)addExtras(T,slots,a.c,a.nm,wd);});
  if(!afternoon.length&&t!=="excursion")addExtras(T,slots,(lastM||{}).c||zoneC,(lastM||{}).nm,wd);
  // --- tarde-noche: atardecer, cena y salida ---
  if(t!=="salida"){
    const ss=sunsetMin(T.P.center,date,T.cc);
    const ss0=sunsetMin(T.P.center,date,T.cc);
    const wantSun=t!=="excursion"&&(o.ritmo!=="chill"||o.moods.includes("romantico"))&&!(o.familia&&(ss0==null?tmin(LC.dinner)>tmin("20:30"):ss0>tmin(LC.dinner)-20));
    const sunStart0=ss!=null?ss-40:tmin(T.cc==="ES"?"19:30":"19:00");
    const early=wantSun&&ss!=null&&ss<dinner-100; // invierno: el sol se pone mucho antes de la cena
    // la tarde no se come la noche: lo que no quepa antes del atardecer (o de la cena) vuelve a la bolsa
    if(t!=="excursion")trimDay(T,slots,start,(wantSun&&!early?sunStart0:dinner)-15);
    let sun=null;
    if(wantSun&&early){
      // invierno: el atardecer cae a media tarde. Lo que necesita luz (parques, miradores, playas) va antes;
      // el mirador se busca cerca de donde estés a esa hora, y lo de interior (museos, iglesias) va después
      const li=slots.findIndex(s=>s.cat==="comida");
      const aft=slots.splice(li+1);
      const day=s=>s.item&&["parque","mirador","playa"].includes(s.item.kind)?1:0;
      aft.sort((a,b)=>day(b)-day(a));slots.push(...aft);
      const st0=ss-50;
      const s1=runSchedule({slots,start,end:null},T);
      const x=s1.find(x=>slots.indexOf(x.slot)>li&&x.end>st0+15);
      const pos=x?slots.indexOf(x.slot):slots.length;
      const before=slots.slice(0,pos).reverse().find(s=>s.item&&s.item.c);
      const a=pickNear(T,"atardecer",before?before.item.c:zoneC,{maxKm:2.5,w:.5,pref:["romantico","relax","foto"],cost:sunCost(T,before&&before.item,t),filter:x=>!slots.some(q=>q.item&&sameSpot(q.item,x))});
      if(a){sun={cat:"atardecer",label:"Atardecer",item:a,dur:a.dur,fixedAt:ss-a.dur+10,sunset:ss};slots.splice(pos,0,sun);}
    }
    const lastStop=[...slots].reverse().find(s=>s.item&&s.item.c);
    const lc=t==="excursion"?T.P.center:(lastStop?lastStop.item.c:zoneC);
    if(wantSun&&!early){
      const a=pickNear(T,"atardecer",lc,{maxKm:3,w:.3,pref:["romantico","relax","foto"],cost:sunCost(T,t==="excursion"?null:lastStop&&lastStop.item,t),filter:x=>!slots.some(q=>q.item&&sameSpot(q.item,x))});
      if(a){const st=ss!=null?ss-a.dur+10:sunStart0;sun={cat:"atardecer",label:"Atardecer",item:a,dur:a.dur,fixedAt:st,sunset:ss};}
    }
    // la cena, cerca de lo último que hayas hecho (el mirador en verano; la última visita en invierno)
    const lateSun=sun&&!early;
    const dAnchor=lateSun?sun.item.c:lc;
    const din=mealSlot(T,"cena","Cena",dAnchor,lateSun?sun.item.nm:(t==="excursion"?null:(lastStop?lastStop.item.nm:null)),wd,["gastro","romantico"],
      lateSun&&lastStop?{c:lastStop.item.c,nm:lastStop.item.nm}:{c:T.P.center,nm:null});
    din.fixedAt=dinner;
    if(lateSun){
      // si la puesta de sol cae a la hora de cenar, primero el atardecer y la cena justo después
      if(sun.fixedAt+sun.dur>dinner-30)din.fixedAt=sun.fixedAt+sun.dur+15;
      slots.push(sun,din);
    }else{slots.push(din);if(early)trimDay(T,slots,start,dinner-15);}
    const n=night[d];
    const dc=(din.item&&din.item.c)||din.at||dAnchor;
    if(n==="disco"||n==="copas"){
      const refN=din.item?din.item.nm:(sun?sun.item.nm:(lastStop&&t!=="excursion"?lastStop.item.nm:null));
      const cs=mealSlot(T,"copas",n==="disco"?"Previa":"Copas",dc,refN,null,["fiesta"],{c:T.P.center,nm:null});
      cs.fixedAt=tmin(LC.night);if(cs.item)cs.dur=n==="disco"?100:120;slots.push(cs);
      if(n==="disco"){const cc2=(cs.item&&cs.item.c)||dc;let ds=mealSlot(T,"disco","Discoteca",cc2,cs.item?cs.item.nm:refN,wd,["fiesta"],{c:T.P.center,nm:null});
        // con fecha sabemos que esa noche abre alguna: si no hay ninguna cerca, la que abra aunque haya que coger un taxi
        if(!ds.item&&wd!=null){const a=pickNear(T,"disco",cc2,{wd,maxKm:60,pref:["fiesta"]});if(a)ds={cat:"disco",label:"Discoteca",item:a,dur:durOf(a)};}
        let ft=tmin(LC.club);if(ft<360)ft+=1440;ds.fixedAt=ft;slots.push(ds);}
    }else if(n==="calma"&&o.ritmo!=="chill"&&!o.familia&&(o.compania==="solo"||o.moods.some(m=>["romantico","relax","gastro"].includes(m)))){
      const solo=o.compania==="solo";
      const a=pickNear(T,"copas",dc,{maxKm:solo?1.8:1.3,w:1.4,pref:solo?["fiesta","cultural","relax"]:["romantico","relax","gastro"],filter:x=>(x.m||[]).some(m=>(solo?["fiesta","cultural","relax","gastro"]:["romantico","relax","gastro"]).includes(m))});
      if(a)slots.push({cat:"copas",label:"Después de cenar",item:a,dur:75,noGap:true});
    }
  }
  const D={d,type:t,slots,start,end,late,date,wd,zoneC,ss:sunsetMin(T.P.center,date,T.cc)};
  // horarios: nada antes de que abra ni después de que cierre (se reordena el día y, si no cabe, sale)
  if(t!=="excursion")fixHours(T,D);
  // si queda un hueco grande antes de la tarde-noche, se rellena con un sitio cercano que no se haya usado
  fillGap(T,D);
  return D;
}
// cuánto "duele" un orden del día: llegar a un sitio cerrado, esperar a que abra, retrasar la comida o el ocaso, caminar de más
function hoursPen(T,D){
  const sch=runSchedule(D,T);let p=0;
  for(const x of sch){const s=x.slot;
    p+=(x.tr||0)*.3;
    if(x.H)p+=x.over*4+x.wait*.8;
    if(s.fixedAt!=null&&x.start>s.fixedAt+20)p+=(x.start-s.fixedAt-20)*(s.cat==="atardecer"?5:2);
    if(D.ss!=null&&s.cat==="sight"&&s.item&&["parque","mirador","playa"].includes(s.item.kind)&&x.end>D.ss)p+=(x.end-D.ss)*1.5;
  }
  return p+(D.slots.length-sch.length)*200;
}
function fixHours(T,D){
  D.hoursNotes=[];
  const isMov=s=>s.cat==="sight"&&s.label!=="Excursión"&&s.item;
  const bad=()=>runSchedule(D,T).some(x=>x.over>0||x.wait>20);
  const orig=D.slots.filter(isMov).map(s=>s.item.nm).join("|");
  if(bad()){
    // se prueba a intercambiar visitas entre sí hasta que el día no choque con ningún horario
    let base=hoursPen(T,D);
    for(let it=0;it<25;it++){
      const M=D.slots.map((s,i)=>i).filter(i=>isMov(D.slots[i]));let best=null,bv=base-.5;
      for(let x=0;x<M.length;x++)for(let y=x+1;y<M.length;y++){const i=M[x],j=M[y];
        [D.slots[i],D.slots[j]]=[D.slots[j],D.slots[i]];const v=hoursPen(T,D);if(v<bv){bv=v;best=[i,j];}[D.slots[i],D.slots[j]]=[D.slots[j],D.slots[i]];}
      if(!best)break;const [i,j]=best;[D.slots[i],D.slots[j]]=[D.slots[j],D.slots[i]];base=bv;
    }
    // lo que aun así no cabe antes del cierre: si da para casi toda la visita se acorta; si no, sale del día
    for(let k=0;k<6;k++){
      const x=runSchedule(D,T).find(x=>x.over>0);if(!x)break;
      const s=x.slot,left=x.H.c-x.start;
      if(left>=Math.max(30,s.dur*.6)){s.dur=Math.floor(left/5)*5;s.cut=true;continue;}
      D.slots.splice(D.slots.indexOf(s),1);T.used.delete(s.item.nm);D.hoursNotes.push({nm:s.item.nm,c:x.H.c,drop:true});
    }
    const li=D.slots.findIndex(s=>s.cat==="comida");
    if(li>=0)D.slots.forEach((s,i)=>{if(isMov(s))s.label=i<li?"Mañana":"Tarde";});
  }
  const moved=D.slots.filter(isMov).map(s=>s.item.nm).join("|")!==orig;
  const tight=runSchedule(D,T).filter(x=>x.H&&x.H.c<1200&&x.H.c-x.end<=45).sort((a,b)=>(a.H.c-a.end)-(b.H.c-b.end))[0];
  if(tight&&(moved||tight.H.c<=1080))D.hoursNotes.push({nm:tight.slot.item.nm,c:tight.H.c,moved});
}
// extras de la tarde según el mood: foto, compras, merienda, plan con niños
function addExtras(T,slots,c,nm,wd){
  const {o}=T;
  if(o.moods.includes("foto")){const a=pickNear(T,"foto",c,{maxKm:2.5,w:1});if(a)slots.push({cat:"foto",label:"Spot para fotos",item:a,dur:a.dur});}
  if(o.moods.includes("compras")||o.moods.includes("souvenir")){
    const cat=o.moods.includes("compras")?"compras":"souvenir";
    const a=pickNear(T,cat,c,{maxKm:3,w:.8,wd})||pickNear(T,cat==="compras"?"souvenir":"compras",c,{maxKm:3,w:.8,wd});
    if(a)slots.push({cat:a.cat,label:a.cat==="compras"?"Compras":"Recuerdos",item:a,dur:a.dur});
  }
  if(o.familia){
    const a=pickNear(T,"sight",c,{maxKm:3,w:.8,filter:x=>["parque","zoo","playa"].includes(x.kind)||KIDS_RX.test(x.nm)})||pickNear(T,"sight",c,{maxKm:5,w:.6,filter:x=>KIDS_RX.test(x.nm)&&!x.excursion});
    if(a)slots.push({cat:"familia",label:"Plan para peques",item:a,dur:Math.min(a.dur,100)});
    else if(c)slots.push(genSlot("familia","Plan para peques",`Parque infantil cerca de ${nm?shortNm(nm):"tu zona"}`,"Un rato de columpios para que los peques corran: abre el mapa y mira el más cercano.",mapsNear("parque infantil",c,T.city),c));
  }
  if(o.moods.includes("gastro")||o.familia){const a=pickNear(T,"merienda",c,{maxKm:2,w:1});if(a)slots.push({cat:"merienda",label:"Merienda",item:a,dur:a.dur});}
}
function fillGap(T,D){
  for(let k=0;k<2;k++){
    const sch=runSchedule(D,T);
    const i=sch.findIndex(x=>x.gapBefore>=90&&(x.slot.cat==="atardecer"||x.slot.cat==="cena"||x.slot.cat==="comida"));
    if(i<0)return;
    const prev=sch.slice(0,i).reverse().find(x=>x.c);const pc=prev?prev.c:D.zoneC;
    const room=sch[i].gapBefore-20,t0=sch[i].start-sch[i].gapBefore+15;
    const okDay=x=>!x.excursion&&(D.wd==null||!(closedOf(x.nm)&&closedOf(x.nm).wds.includes(D.wd)))&&openAt(x,D.date,t0,x.dur);
    let a=pickNear(T,"sight",pc,{maxKm:2,w:1.5,filter:x=>okDay(x)&&x.dur<=room});
    // si cerca no hay nada, un imprescindible de la guía algo más lejos (un teleférico, un mirador) si cabe con el trayecto
    if(!a&&pc)a=pickNear(T,"sight",pc,{maxKm:7,w:.4,filter:x=>okDay(x)&&!x.auto&&(x.imp||0)>=.5&&x.c&&x.dur+2*legT({c:pc,el:prev&&prev.slot.item?prev.slot.item.el:0},x)<=room});
    if(!a)return;
    const si=D.slots.indexOf(sch[i].slot);const before=dayProblems(T,D).length;
    const ns={cat:"sight",label:sch[i].slot.cat==="comida"?"Mañana":"Tarde",item:a,dur:a.dur,extra:true};
    D.slots.splice(si,0,ns);
    if(dayProblems(T,D).length>before){D.slots.splice(D.slots.indexOf(ns),1);return;}
    T.used.add(a.nm);
  }
}
// pone hora a cada parada: lo que dura cada una + el trayecto; respeta las horas fijas (comida, cena, ocaso, noche)
function runSchedule(D,T){
  let cur=D.start,prev=null,prevE=null;const out=[];
  for(const s of D.slots){
    if(s.off)continue;
    const c=(s.item&&s.item.c)||s.at||null;
    const km=prev&&c?hav(prev,c):null;
    const e=s.item?s.item.el:null;const [up,down]=climb(prevE,e);
    const ov=T&&T.legOv&&prev&&c?T.legOv[legKey(prev,c)]:null;
    const tr=out.length&&s.cat!=="pausa"?(ov!=null?ov:travelMin(km,up,down,T&&T.o&&T.o.mayores?12:22)):0;
    let st=cur+tr,gap=0,wait=0;
    if(s.fixedAt!=null&&s.fixedAt>st){gap=s.fixedAt-st;st=s.fixedAt;}
    const H=s.item&&s.label!=="Excursión"&&(s.cat==="sight"||s.cat==="familia")?hoursOf(s.item,D.date):null;
    if(H&&H.o>st){wait=H.o-st;gap+=wait;st=H.o;}
    st=up5(st);
    if(D.end!=null&&st+s.dur>D.end&&s.label!=="Excursión")continue;
    out.push({slot:s,start:st,end:st+s.dur,km,tr,up,real:ov!=null,gapBefore:gap,c,H,wait,over:H?Math.max(0,st+s.dur-H.c):0});
    cur=st+s.dur;if(c){prev=c;if(s.item)prevE=e;}
  }
  return out;
}
// convierte el día planificado en las paradas que pinta la app (mismo formato de siempre + datos nuevos)
function materialize(T,D){
  const sch=runSchedule(D,T);const row=[];
  sch.forEach((x,i)=>{
    // hueco largo antes de la tarde-noche: se dice claro que es tiempo libre (y para qué sirve)
    if(x.gapBefore>=100&&i>0){
      const p=sch[i-1];const nm=p.slot.item?shortNm(p.slot.item.nm):"la zona";
      const g=x.gapBefore;const h=g>=120?(Math.round(g/30)/2+" h").replace(".",","):(g+" min");
      const pc=p.c||D.zoneC;
      const ideas=pc?T.P.items.filter(a=>a.c&&!T.used.has(a.nm)&&!a.excursion&&["sight","compras","souvenir","foto"].includes(a.cat)&&hav(a.c,pc)<1.5&&(D.wd==null||!(closedOf(a.nm)&&closedOf(a.nm).wds.includes(D.wd)))&&openAt(a,D.date,p.end+10,Math.min(a.dur||60,60)))
        .sort((a,b)=>hav(a.c,pc)-hav(b.c,pc)).slice(0,3):[];
      const exc=p.slot.label==="Excursión";
      const txt=exc?`Vuelta a ${T.city} (${travelMin(x.km)} min aprox.) y rato para descansar en el hotel antes de cenar.`
        :`Tienes ${h} sin plan, a propósito: vuelve al hotel a descansar o date una vuelta sin prisa por ${nm}.`+(ideas.length?` Si te apetece algo más, aquí al lado: ${ideas.map(a=>shortNm(a.nm)).join(", ")}.`:"");
      row.push({time:hm(p.end),end:hm(x.start-(x.tr||0)),ic:"",lb:exc?"Vuelta":"Rato libre",cat:"libre",a:{t:exc?"Vuelta y descanso":"Rato libre",real:false,m:[],vcat:"libre",libre:true,d:txt,ideas:ideas.map(a=>a.nm)}});
    }
    const s=x.slot,cat=s.cat;
    if(s.item){
      const a=s.item;const vcat=cat==="familia"?"sight":(cat==="merienda"?"comida":cat);
      const cl=closedOf(a.nm),bk=["sight","foto","atardecer","familia"].includes(cat)?bookOf(a.nm):null;
      row.push({time:hm(x.start),end:hm(x.end),ic:"",lb:s.label,cat,slot:s,a:{t:a.nm,d:a.d||"",q:a.q||a.nm,real:true,m:a.m||[],vcat,kind:a.kind,dur:s.dur,
        price:priceOf(a,vcat,T.key),el:a.el,own:!!a.own,book:bk,closed:cl?{...cl,today:D.wd!=null&&cl.wds.includes(D.wd)}:null,near:a.near||null,auto:!!a.auto,sunset:s.sunset!=null?hm(s.sunset):null,
        hours:x.H?{o:hm(x.H.o),c:hm(x.H.c).replace(/^00:00$/,"24:00"),known:x.H.known,txt:hoursTxt(x.H),late:x.over>0,cut:!!s.cut}:null,
        season:(()=>{const z=seasonOf(a.nm);return z&&z.months.length<12?z.txt:null;})(),
        club:cat==="disco"?clubInfo(a,D.wd,D.date):null}});
    }else if(s.gen&&s.cat==="pausa"){
      row.push({time:hm(x.start),end:hm(x.end),ic:"",lb:s.label,cat:"libre",slot:s,a:{t:s.gen.t,d:s.gen.d,real:false,m:[],vcat:"libre",libre:true,dur:s.dur}});
    }else if(s.gen){
      row.push({time:hm(x.start),end:hm(x.end),ic:"",lb:s.label,cat,slot:s,a:{t:s.gen.t,d:s.gen.d,q:T.city,real:false,m:[],vcat:cat==="merienda"?"comida":cat,gm:s.gen.gm,dur:s.dur}});
    }
  });
  return {row,sch};
}
// título, subtítulo, por qué y plan B de cada día (sale del contenido real del día)
function dayMeta(T,D,row,sch){
  const {city}=T,t=D.type;
  const sights=row.filter(r=>r.a&&r.a.real&&(r.cat==="sight"));
  const real=row.filter(r=>r.a&&r.a.real);
  let km=0,walk=0,legs=0,longest=null;
  for(let i=1;i<sch.length;i++){if(sch[i].km!=null){km+=sch[i].km;legs++;if(sch[i].km<=1.6)walk++;if(!longest||sch[i].km>longest.km)longest={km:sch[i].km,to:sch[i].slot.item?sch[i].slot.item.nm:""};}}
  const walkPct=legs?Math.round(walk/legs*100):100;
  const names=sights.filter(r=>r.lb!=="Excursión").map(r=>shortNm(r.a.t));
  // zona: en la guía automática viene el barrio de cada sitio
  let zona="";const zc={};sights.forEach(r=>{const it=r.slot&&r.slot.item;if(it&&it.zona){zc[it.zona]=(zc[it.zona]||0)+1;}});
  const zb=Object.entries(zc).filter(([z])=>{const nz=norm(z),nc=norm(city);return nz!==nc&&!nz.startsWith(nc+" ")&&!/^(municipio|distrito|comarca|provincia)/.test(nz);}).sort((a,b)=>b[1]-a[1])[0];if(zb&&zb[1]>=2)zona=zb[0];
  const nm2=names.filter(n=>n.length<=34);
  const pair=nm2.length>=2?(/ y /.test(nm2[0]+nm2[1])?`${nm2[0]} · ${nm2[1]}`:`${nm2[0]} y ${nm2[1]}`):(nm2[0]||names[0]||"");
  let title,kicker;
  if(t==="llegada"){title=`Llegada a ${city}`;kicker="Día de llegada";}
  else if(t==="salida"){title=`Último día en ${city}`;kicker="Día de vuelta";}
  else if(t==="excursion"){const ex=sights.find(r=>r.lb==="Excursión");title=`Excursión a ${ex?shortNm(ex.a.t):"las afueras"}`;kicker="Excursión de día completo";}
  else{title=zona&&zona.length<=28?zona:(pair||`Día libre por ${city}`);kicker=D.late?"Día de empezar tarde":"Día de barrio";}
  if(t==="unico")kicker="Un día completo";
  const focus=pair&&title!==pair?`Hoy: ${pair}`:"";
  const firstT=row.find(r=>r.cat!=="libre"),lastT=[...row].reverse().find(r=>r.cat!=="libre");
  const sub=`${real.length} ${real.length===1?"parada":"paradas"}`;
  const short={llegada:"Llegada",salida:"Vuelta",excursion:"Excursión",unico:"Día completo"}[t]||(D.late?"Empieza tarde":"Barrio");
  // por qué el día es así
  const why=[];
  if(t==="llegada")why.push(T.opts.arr?`Aterrizas a las ${T.opts.arr}: el plan empieza hora y media después (maletas y traslado) y no incluye nada con entrada a hora fija, por si el vuelo se retrasa.`:`Día corto para aterrizar: empieza a la hora de comer y no lleva nada con entrada a hora fija, por si el vuelo se retrasa. Si llegas por la mañana, adelanta la primera visita.`);
  if(t==="salida")why.push(T.opts.dep?`Tu vuelo sale a las ${T.opts.dep}: el plan termina 3,5 h antes para ir al aeropuerto sin prisas.`:`Día ligero y cerca del centro: termina a media tarde para que vayas al aeropuerto sin prisas. Si te vas por la noche, alarga la última parada.`);
  if(t==="excursion"){const ex=sights.find(r=>r.lb==="Excursión");const it=ex&&ex.slot.item;if(it){const k=it.dist||0;why.push(`${shortNm(it.nm)} está a unos ${Math.round(k)} km: ${it.exAt?"no hace falta madrugar: sales a media mañana, comes allí y vuelves con el atardecer":"sales temprano y vuelves para cenar"}. Calcula ${k>60?"bastante más de una hora":"cerca de una hora"} de trayecto por sentido; mira antes la hora del último tren o bus de vuelta.`);}}
  if(T.o.mayores&&D.d===0)why.push("Ritmo pensado para tus padres: menos visitas al día, sobremesa larga y, en los tramos largos o con cuesta, transporte o taxi en vez de andar. Sin rutas de montaña ni escalinatas.");
  if(D.late)why.push("Anoche saliste de fiesta: hoy se empieza tarde, con un brunch, y el día es más corto.");
  const clubR=row.find(r=>r.cat==="disco"&&r.a.real&&r.a.club);
  if(clubR){const c=clubR.a.club,n=shortNm(clubR.a.t);
    if(D.wd==null){if(c.txt!=="todas las noches")why.push(`Sin fecha no sabemos qué noche es: ${n} suele abrir ${c.txt}${c.months?` y solo ${c.months}`:""}. Pon la fecha del viaje y colocamos la discoteca en una noche en que abra.`);}
    else if(c.open===false)why.push(`Ojo: ${n} no suele abrir los ${WDN[D.wd].replace(/([^s])$/,"$1s")}${c.months?` (y solo abre ${c.months})`:""}. Cámbiala con el botón «Cambiar».`);
    else why.push(`${n} suele abrir ${c.txt}${c.known?"":" (lo normal en las discotecas)"}: este ${WDN[D.wd]} abre. Aun así, mira su agenda antes de ir: hay noches privadas y cierres por vacaciones.`);
    if(c.note)why.push(c.note);}
  if(T.nightWhy&&T.nightWhy[D.d]==="closed"){const nx=T.night.findIndex((n,i)=>n==="disco"&&i>D.d),pv=T.night.findIndex(n=>n==="disco");const k=nx>=0?nx:pv;
    why.push(`Este ${WDN[D.wd]} no abre ninguna discoteca de la guía (la mayoría abren de jueves a sábado): hoy la noche es de copas.${k>=0&&T.days[k]&&T.days[k].wd!=null?` La discoteca va el ${WDN[T.days[k].wd]} (día ${k+1}).`:""}`);}
  (D.hoursNotes||[]).forEach(hn=>{
    if(hn.drop){const k=T.days.findIndex(D2=>D2!==D&&D2.slots.some(s=>s.item&&s.item.nm===hn.nm));
      why.push(`${shortNm(hn.nm)} cierra a las ${hm(hn.c)} y hoy no daba tiempo${k>=0?`: lo tienes el día ${k+1}.`:": lo hemos dejado fuera. Si quieres verlo, ponlo otro día por la mañana."}`);}
    else if(row.some(r=>r.a&&r.a.t===hn.nm))why.push(`${shortNm(hn.nm)} cierra a las ${hm(hn.c)}${T.opts.inDate?"":" (en invierno; en verano, más tarde)"}: ${hn.moved?"por eso el día va en este orden":"el plan te lleva con tiempo para verlo"}.`);
  });
  row.forEach(r=>{if(r.a&&r.a.hours&&r.a.hours.late)why.push(`Ojo: ${shortNm(r.a.t)} cierra a las ${r.a.hours.c} y con este orden llegas tarde. Cámbialo con «Cambiar» o quítalo.`);});
  if((t==="barrio"||t==="unico")&&sights.length){
    if(walkPct>=70)why.push(`Todo está cerca: hoy casi no usas transporte (${walkPct}% de los trayectos son a pie).`);
    else if(longest)why.push(`Hoy hay un trayecto largo (${longest.km.toFixed(1).replace(".",",")} km hasta ${shortNm(longest.to)}); el resto se hace andando.`);
    const f=sights[0];const fi=f&&f.slot&&f.slot.item;
    if(f&&f.time<"11:30"&&fi&&(popOf(T,fi)>=.75||bookOf(fi.nm)))why.push(`${shortNm(f.a.t)} va a primera hora: es de lo más visitado y a media mañana se llena.`);
  }
  const sunR=row.find(r=>r.a&&r.a.sunset);
  if(!sunR&&row.some(r=>r.cat==="atardecer"&&r.a.real)&&!T.opts.inDate&&D.d===T.types.findIndex(t=>t!=="excursion"&&t!=="salida"))why.push("Sin fecha de viaje, el atardecer va a una hora orientativa: pon la fecha y lo ajustamos a la puesta de sol real.");
  if(sunR)why.push(`Ese día el sol se pone a las ${sunR.a.sunset}: el plan te deja en ${shortNm(sunR.a.t)} con margen para pillar sitio.`);
  const nb=row.filter(r=>r.a&&r.a.book&&r.a.book[0]!=="opcional").length;
  if(nb)why.push(`${nb===1?"Hay 1 visita":"Hay "+nb+" visitas"} con entrada a hora fija: resérvala${nb===1?"":"s"} antes (lo tienes en «Antes de ir»).`);
  row.forEach(r=>{if(r.a&&r.a.closed&&r.a.closed.today)why.push(`Ojo: ${shortNm(r.a.t)} cierra ${r.a.closed.txt} y este día lo es. Cámbialo con el botón «Cambiar».`);});
  if(d1(T,D)&&T.LC.lunch)why.push(`Las comidas siguen el horario de aquí: comer sobre las ${T.LC.lunch} y cenar sobre las ${T.LC.dinner}.`);
  // plan B
  const planB=[];
  const out=sights.find(r=>OUTDOOR.has(r.a.kind));
  if(out){const oc=out.slot.item.c;const alt=pickNear(T,"sight",oc,{maxKm:3,peek:true,w:1,filter:x=>INDOOR.has(x.kind)&&!x.excursion});
    if(alt)planB.push({ic:"cloud",t:`Si llueve: cambia ${shortNm(out.a.t)} por ${shortNm(alt.nm)} (${(hav(oc,alt.c)).toFixed(1).replace(".",",")} km).`});}
  if(sights.length>=2){const low=[...sights].filter(r=>r.lb!=="Excursión"&&r.slot&&r.slot.item).sort((a,b)=>popOf(T,a.slot.item)-popOf(T,b.slot.item))[0];
    const meal=row.find(r=>r.cat==="comida"&&r.a.real);
    if(low)planB.push({ic:"feather",t:`Si vas cansado: sáltate ${shortNm(low.a.t)} y${meal?` alarga la comida en ${shortNm(meal.a.t)}`:" tómatelo con calma"}.`});}
  const spare=t==="excursion"?[]:(T.P.items.filter(a=>a.cat==="sight"&&!T.used.has(a.nm)&&!a.excursion&&a.c&&D.zoneC&&hav(a.c,D.zoneC)<1.2)).slice(0,2);
  if(spare.length)planB.push({ic:"plus",t:`Si te sobra tiempo, aquí al lado: ${spare.map(a=>shortNm(a.nm)).join(" y ")}.`});
  // moods del día: qué se vive HOY según las paradas reales (los días no son todos iguales)
  const mw={};real.forEach(r=>{const w=r.cat==="sight"||r.cat==="atardecer"?2:1;(r.a.m||[]).forEach(m=>{mw[m]=(mw[m]||0)+w;});});
  const dmoods=Object.entries(mw).filter(([m])=>MOODNM[m]&&m!=="souvenir"&&!(T.o.familia&&m==="romantico")).sort((a,b)=>(T.o.moods.includes(b[0])?1.5:1)*b[1]-(T.o.moods.includes(a[0])?1.5:1)*a[1]).slice(0,2).map(([m])=>m);
  (D.fixNotes||[]).forEach(n=>why.push(n));
  const left=dayProblems(T,D).map(p=>p.t);left.forEach(n=>why.unshift("Ojo: "+n+"."));
  const checks={ok:!left.length,left};
  return {type:t,kicker,short,title,focus,sub,why,planB,km,walkPct,dmoods,checks,from:firstT?firstT.time:"",to:lastT?(lastT.end||lastT.time):""};
}
function d1(T,D){return D.type==="barrio"&&T.types.indexOf("barrio")===D.d;}
// genera (o rehace) las paradas y la ficha de un día
function renderPlanDay(T,D){
  const {row,sch}=materialize(T,D);
  if(D.d===0&&T.opts.arr)row.unshift(arrivalMarker(T.opts.arr,T.city,T.opts.flightIn));
  if(D.d===T.dias-1&&T.opts.dep)row.push(departureMarker(T.opts.dep,T.city,T.opts.flightOut));
  return {row,meta:dayMeta(T,D,row,sch)};
}
// API pública: mismo formato de siempre ({key, plan}) + la ficha de cada día y el estado para poder cambiar paradas
function generar(destino,dias,moods,ritmo,compania,opts){
  const T=planTrip(destino,dias,moods,ritmo,compania,opts);
  const plan=[],meta=[];
  T.days.forEach(D=>{const r=renderPlanDay(T,D);plan.push(r.row);meta.push(r.meta);});
  return {key:T.key,plan,meta,trip:T};
}
// cambiar una parada por otra del mismo tipo, cerca de las de al lado
function swapSlot(T,d,slot){
  const D=T.days[d];const i=D.slots.indexOf(slot);if(i<0)return false;
  const cat=slot.cat==="familia"?"sight":slot.cat;
  const nb=[D.slots[i-1],D.slots[i+1]].map(s=>s&&((s.item&&s.item.c)||s.at)).filter(Boolean);
  const anchor=cent(nb)||(slot.item&&slot.item.c)||D.zoneC;
  T.curDate=D.date;
  const xs=runSchedule(D,T).find(x=>x.slot===slot);
  const f0=slot.cat==="familia"?(x=>["parque","zoo","playa"].includes(x.kind)):(cat==="sight"?(x=>!x.excursion):null);
  const filt=xs&&(cat==="sight")?(x=>(!f0||f0(x))&&openAt(x,D.date,xs.start,slot.label==="Excursión"?x.dur:durOf(x))):f0;
  const a=pickNear(T,cat,anchor,{maxKm:4,w:1,wd:D.wd,filter:filt,pref:slot.cat==="cena"?["gastro","romantico"]:null});
  if(!a)return false;
  if(slot.item)T.used.delete(slot.item.nm);
  slot.item=a;slot.gen=null;slot.dur=slot.label==="Excursión"?a.dur:(slot.cat==="familia"?Math.min(a.dur,100):durOf(a));
  return true;
}
function removeSlot(T,d,slot){const D=T.days[d];const i=D.slots.indexOf(slot);if(i<0)return false;D.slots.splice(i,1);return true;}

/* ===================== EDICIÓN AVANZADA DEL DÍA =====================
   Mover paradas, fijar su hora y su duración, añadir un sitio (sugerido o propio) o tiempo libre.
   Cada cambio pasa por el VALIDADOR: si deja el día imposible (llegar a un sitio cerrado, una parada que ya
   no cabe, una hora a la que no llegas, la comida desplazada más de una hora…), se deshace y se explica por qué.
   Las ediciones se guardan como una lista de operaciones que se vuelve a aplicar al reabrir el viaje
   (el motor es determinista: el mismo viaje da siempre el mismo plan de partida). */
const EDIT_MOVABLE=new Set(["sight","foto","compras","souvenir","familia","merienda","pausa"]);
function slotName(s){return s.item?shortNm(s.item.nm):(s.gen?s.gen.t:"Esta parada");}
// lo que está mal en un día tal y como está ahora (frases para el usuario)
function dayProblems(T,D){
  T.curDate=D.date;
  const sch=runSchedule(D,T),placed=new Set(sch.map(x=>x.slot)),P=[];
  D.slots.forEach(s=>{if(!s.off&&!placed.has(s))P.push({t:`${slotName(s)} ya no cabe ${D.end!=null?"antes de irte al aeropuerto":"en el día"}`,s});});
  sch.forEach((x,k)=>{const s=x.slot,n=slotName(s);
    if(x.over>0)P.push({t:x.start>=x.H.c?`${n} cierra a las ${hm(x.H.c)} y llegarías a las ${hm(x.start)}`:`${n} cierra a las ${hm(x.H.c)}: llegarías a las ${hm(x.start)} y no da tiempo a la visita (${fmtDur(s.dur)})`,s});
    if(s.userAt!=null&&x.start>s.userAt+10){const pe=k?sch[k-1].end:D.start;P.push({t:`No llegas a ${n} a las ${hm(s.userAt)}: lo de antes acaba a las ${hm(pe)}${x.tr?` y hay ${x.tr} min de trayecto`:""}`,s});}
    if(s.userAt==null&&(s.cat==="comida"||s.cat==="cena")&&s.fixedAt!=null&&x.start>s.fixedAt+60)P.push({t:`La ${s.cat} se iría hasta las ${hm(x.start)}`,s});
    if(s.userAt==null&&s.cat==="atardecer"&&(s.sunset!=null?x.start>s.sunset-10:(s.fixedAt!=null&&x.start>s.fixedAt+25)))P.push({t:`Llegarías a ${n} con el sol ya puesto`,s});
    if(s.label==="Excursión"&&s.fixedAt!=null&&x.start-(x.tr||0)>s.fixedAt+20)P.push({t:`Saldrías hacia la excursión a las ${hm(x.start-(x.tr||0))}: se queda sin tiempo`,s});
    if(s.item&&D.wd!=null&&s.cat!=="disco"){const c=closedOf(s.item.nm);if(c&&c.wds.includes(D.wd))P.push({t:`${n} cierra ${c.txt}`,s});}
    if(s.item&&s.cat==="disco"&&D.wd!=null&&!clubOpen(s.item,D.wd,D.date))P.push({t:`${n} no suele abrir esa noche`,s});
  });
  return P;
}
function dayProblemTexts(T,D){return dayProblems(T,D).map(p=>p.t);}

// revisión final de un día recién generado: si una visita retrasa la comida o la cena más de una hora, pasa a después;
// si ni así cabe (o no cabe antes del vuelo), sale del día y queda libre para el plan B. Se explica en «Por qué hoy es así».
function repairDay(T,D){
  D.fixNotes=[];
  for(let k=0;k<6;k++){
    const P=dayProblems(T,D);if(!P.length)break;
    const p=P.find(x=>x.s&&(x.s.cat==="comida"||x.s.cat==="cena"||/ya no cabe/.test(x.t)))||P[0];
    const before=P.length,S=snapDay(D);let ok=false;
    if(/ya no cabe/.test(p.t)&&p.s&&REMOVABLE.has(p.s.cat)&&p.s.label!=="Excursión"){
      D.slots.splice(D.slots.indexOf(p.s),1);if(p.s.item)T.used.delete(p.s.item.nm);
      D.fixNotes.push(`${slotName(p.s)} no cabía antes de ${D.end!=null?"irte al aeropuerto":"acabar el día"}: lo hemos dejado fuera (lo tienes en el plan B si te sobra tiempo).`);ok=true;
    }else if(p.s&&(p.s.cat==="comida"||p.s.cat==="cena")){
      // opciones: pasar la última visita de antes a después de comer/cenar (no se pierde nada), o eso mismo
      // quitando otra visita, o quitar una visita. Gana la que arregla el problema perdiendo lo MENOS importante.
      const meal=p.s,mi=D.slots.indexOf(meal);let j=-1;
      for(let q=mi-1;q>=0;q--){const x=D.slots[q];if(REMOVABLE.has(x.cat)&&x.label!=="Excursión"&&!x.user){j=q;break;}}
      const rem=D.slots.filter(x=>REMOVABLE.has(x.cat)&&x.label!=="Excursión"&&!x.user);
      const imp=x=>x.item?popOf(T,x.item):0;
      const opts=[];
      // empezar el día un poco antes (no se pierde nada y lo largo va por la mañana, cuando mejor se ve)
      if(meal.cat==="comida"&&D.type!=="llegada"&&!D.late&&D.start>tmin("08:15"))[30,45].forEach(dm=>opts.push({loss:-.01+dm/1e4,run:()=>{D.start-=dm;return {note:`Hoy se empieza ${dm===30?"media hora":"tres cuartos de hora"} antes para que todo quepa antes de comer.`};}}));
      const moveX=()=>{const x=D.slots[j];D.slots.splice(j,1);D.slots.splice(D.slots.indexOf(meal)+1,0,x);if(x.label==="Mañana")x.label="Tarde";return x;};
      if(j>=0)opts.push({loss:0,run:()=>{const x=moveX();return {note:`${slotName(x)} pasa a después de ${meal.cat==="comida"?"comer":"cenar"} para que la ${meal.cat} no se retrase.`};}});
      rem.forEach(y=>{
        if(j>=0&&y!==D.slots[j])opts.push({loss:imp(y),run:()=>{const x=moveX();D.slots.splice(D.slots.indexOf(y),1);return {drop:y,note:`${slotName(x)} pasa a después de ${meal.cat==="comida"?"comer":"cenar"} y ${slotName(y)} queda fuera (está en el plan B) para que todo quepa.`};}});
        opts.push({loss:imp(y)+.01,run:()=>{D.slots.splice(D.slots.indexOf(y),1);return {drop:y,note:`${slotName(y)} no cabía sin retrasar la ${meal.cat}: lo hemos dejado fuera (está en el plan B).`};}});
      });
      opts.sort((a,b)=>a.loss-b.loss);
      const st0=D.start;
      for(const o of opts){
        const lbs=D.slots.map(x=>x.label);const r=o.run();
        if(dayProblems(T,D).length<before){ok=true;if(r.drop&&r.drop.item)T.used.delete(r.drop.item.nm);D.fixNotes.push(r.note);break;}
        restoreDay(D,S);D.slots.forEach((x,k)=>{x.label=lbs[k];});D.start=st0;
      }
    }
    if(!ok&&p.s&&p.s.cat==="cena"&&D.type==="excursion"){
      // día de excursión: se acorta la estancia allí (mínimo 4 h) para volver a cenar a una hora normal
      const ex=D.slots.find(x=>x.label==="Excursión");const xs=ex&&runSchedule(D,T).find(x=>x.slot===p.s);
      if(ex&&xs&&p.s.fixedAt!=null){const late=xs.start-(p.s.fixedAt+45),nd=Math.max(240,ex.dur-late);
        if(nd<ex.dur){const d0=ex.dur;ex.dur=nd;
          if(dayProblems(T,D).length<before){ok=true;D.fixNotes.push(`Allí tienes unas ${fmtDur(nd)} en lugar de ${fmtDur(d0)}: lo justo para volver a cenar a una hora normal.`);}
          else ex.dur=d0;}}
    }
    if(ok)continue;
    if(p.s&&REMOVABLE.has(p.s.cat)&&p.s.label!=="Excursión"&&!p.s.user&&!(p.s.cat==="comida"||p.s.cat==="cena")){
      D.slots.splice(D.slots.indexOf(p.s),1);
      if(dayProblems(T,D).length<before){ok=true;if(p.s.item)T.used.delete(p.s.item.nm);D.fixNotes.push(`${slotName(p.s)}: ${p.t.replace(/^[^:]*: ?/,"")}. Lo hemos dejado fuera.`);}
      else restoreDay(D,S);
    }
    if(!ok)break;
  }
}
function snapDay(D){return {slots:D.slots.slice(),props:D.slots.map(s=>[s,{fixedAt:s.fixedAt,userAt:s.userAt,dur:s.dur,item:s.item,gen:s.gen}])};}
function restoreDay(D,S){D.slots.length=0;D.slots.push(...S.slots);S.props.forEach(([s,p])=>Object.assign(s,p));}
// aplica un cambio; si crea un problema que antes no estaba, lo deshace y devuelve el motivo
function tryEdit(T,d,fn,keep,mode){
  const D=T.days[d];if(!D)return {ok:false,why:"Ese día no existe."};
  const S=snapDay(D),usedB=new Set(T.used),before=new Set(dayProblemTexts(T,D));
  const undo=()=>{restoreDay(D,S);T.used.clear();usedB.forEach(x=>T.used.add(x));};
  const r=fn(D);
  if(r===false||typeof r==="string"){undo();return {ok:false,why:typeof r==="string"?r:"No se puede hacer ese cambio."};}
  const fresh=()=>dayProblems(T,D).filter(p=>!before.has(p.t));
  let nu=fresh();
  const pre=mode==="add"?"No cabe ese día: ":"";
  if(!nu.length){const res={ok:true,...(r||{})};if(mode==="dry")undo();return res;}
  if(mode==="strict"){undo();return {ok:false,why:nu[0].t+". Si quieres hacerlo igualmente, quita antes alguna parada."};}
  // reparar: si el día está lleno, se quita una visita ANTERIOR a la que llega tarde (es la que la retrasa) y que importe poco;
  // nunca la que estás tocando ni las que añadiste tú
  const first=nu[0].t,drops=[];
  for(let k=0;k<3&&nu.length;k++){
    const pi=D.slots.indexOf(nu[0].s);
    const ok=s=>s!==keep&&!s.user&&REMOVABLE.has(s.cat)&&s.label!=="Excursión";
    let cand=D.slots.filter((s,q)=>ok(s)&&(pi<0||q<pi));if(!cand.length)cand=D.slots.filter(ok);
    if(!cand.length)break;
    let best=null,bv=1e9;cand.forEach(s=>{const v=s.item?popOf(T,s.item):0;if(v<bv){bv=v;best=s;}});
    D.slots.splice(D.slots.indexOf(best),1);drops.push(best);nu=fresh();
  }
  if(!nu.length){drops.forEach(s=>{if(s.item)T.used.delete(s.item.nm);});const res={ok:true,dropped:drops.map(slotName),...(r||{})};if(mode==="dry")undo();return res;}
  undo();return {ok:false,why:pre+first};
}
function moveSlot(T,d,i,dir){
  return tryEdit(T,d,D=>{const s=D.slots[i],j=i+dir;
    if(!s)return false;
    if(!EDIT_MOVABLE.has(s.cat)||s.label==="Excursión")return "Las comidas, el atardecer y la noche van a su hora: cambia su hora en lugar de moverlas.";
    if(j<0||j>=D.slots.length)return "Ya está en el extremo del día.";
    if(D.slots[j].label==="Excursión")return "No se puede pasar por encima de la excursión.";
    [D.slots[i],D.slots[j]]=[D.slots[j],D.slots[i]];},D0slot(T,d,i),"strict");
}
// hora fija (at, en minutos) y/o duración; at===null devuelve la parada a su hora automática
function setSlotTime(T,d,i,at,dur){
  return tryEdit(T,d,D=>{const s=D.slots[i];if(!s)return false;
    if(s.label==="Excursión"&&at!==undefined)return "La excursión ocupa el día entero: su hora no se cambia.";
    if(!("fixedAt0" in s))s.fixedAt0=s.fixedAt;
    if(at===null){s.userAt=undefined;s.fixedAt=s.fixedAt0;}
    else if(at!=null){
      s.userAt=at;s.fixedAt=at;
      // se recoloca en el orden del día según su nueva hora
      const rest=D.slots.filter(x=>x!==s),sch=runSchedule({...D,slots:rest},T);
      D.slots.splice(D.slots.indexOf(s),1);
      let k=D.slots.length;for(const x of sch){if(x.end>at){k=D.slots.indexOf(x.slot);break;}}
      D.slots.splice(k,0,s);
    }
    if(dur)s.dur=Math.max(15,Math.min(600,dur));},D0slot(T,d,i));
}
function D0slot(T,d,i){const D=T.days[d];return D&&D.slots[i];}
// añade una parada donde menos cuesta (menos trayecto, sin chocar con horarios); si no cabe en ningún hueco, no se añade
function addSlot(T,d,slot,afterIdx,dry){
  return tryEdit(T,d,D=>{
    if(afterIdx!=null){D.slots.splice(afterIdx+1,0,slot);}
    else{let best=-1,bp=1e18;
      const ci=D.slots.findIndex(x=>x.cat==="cena"),maxK=slot.cat==="sight"&&ci>=0?ci:D.slots.length;
      for(let k=Math.min(1,D.slots.length);k<=maxK;k++){
        D.slots.splice(k,0,slot);const p=dayProblems(T,D).length*1e4+hoursPen(T,D);D.slots.splice(k,1);
        if(p<bp){bp=p;best=k;}}
      if(best<0)return false;D.slots.splice(best,0,slot);}
    if(slot.item)T.used.add(slot.item.nm);
    return {added:slot.item&&slot.item.nm};},slot,dry?"dry":"add");
}
// sitios sin usar cerca de lo que ya hay ese día (y abiertos ese día), para añadir con un toque
function addCandidates(T,d,n){
  const D=T.days[d];const cs=D.slots.map(s=>(s.item&&s.item.c)||s.at).filter(Boolean);const c0=cent(cs)||D.zoneC||T.P.center;if(!c0)return [];
  return T.P.items.filter(a=>["sight","foto","compras","souvenir"].includes(a.cat)&&a.c&&!a.excursion&&!T.used.has(a.nm)&&!(D.wd!=null&&closedOf(a.nm)&&closedOf(a.nm).wds.includes(D.wd)))
    .map(a=>({a,km:hav(a.c,c0)})).filter(x=>x.km<=2.5)
    .sort((x,y)=>(fitOf(y.a,T.o.moods)+(y.a.imp||0)*2-y.km)-(fitOf(x.a,T.o.moods)+(x.a.imp||0)*2-x.km)).slice(0,14)
    .map(x=>{const r=addSlot(T,d,{cat:x.a.cat,label:"Añadido",item:x.a,dur:x.a.dur||durOf(x.a),user:true},null,true);return {...x,fits:r.ok,dropped:r.dropped||[]};})
    .filter(x=>x.fits).sort((x,y)=>x.dropped.length-y.dropped.length).slice(0,n||6);
}
// un sitio propio (buscado por nombre) convertido en parada
function ownItem(T,nm,c,dur){
  let name=nm.trim().replace(/[<>"`]/g,"").slice(0,80);if(!name)return null;
  if(COORDS[name]&&hav(COORDS[name],c)>0.3)name+=` (${T.city})`;
  COORDS[name]=c;
  const it={cat:"sight",nm:name,c,d:"Lo has añadido tú.",q:name+" "+T.city,m:[],own:true,imp:0,el:null};
  it.kind=kindOf(it);it.dur=dur||durOf(it);
  return it;
}
// aplica una operación guardada (la misma que hizo el usuario) — sirve para editar y para reabrir el viaje
function slotRef(D,s){if(!s)return null;if(s.item)return "i:"+s.item.nm;const same=D.slots.filter(x=>!x.item&&x.cat===s.cat);return "c:"+s.cat+":"+same.indexOf(s);}
function refIdx(D,ref,fallback){if(!ref)return fallback;return D.slots.findIndex(s=>slotRef(D,s)===ref);}
function applyEdit(T,e){
  const D0=T.days[e.d];if(!D0)return {ok:false,why:"Ese día ya no existe."};
  // las ediciones apuntan a su parada por nombre (no por posición): así sobreviven si el plan de base cambia un poco
  if(e.ref!==undefined||e.afterRef!==undefined){e={...e};if(e.ref!==undefined){e.i=refIdx(D0,e.ref,e.i);if(e.i<0)return {ok:false,why:"Esa parada ya no está en el plan."};}
    if(e.afterRef!==undefined){e.after=refIdx(D0,e.afterRef,e.after);if(e.after<0)e.after=undefined;}}
  const D=D0;
  if(e.op==="swap"||e.op==="del"){const s=D.slots[e.i];if(!s)return {ok:false};
    if(e.op==="del"){const ok=removeSlot(T,e.d,s);if(ok&&s.item)T.used.delete(s.item.nm);return {ok};}
    return {ok:swapSlot(T,e.d,s)};}
  if(e.op==="move")return moveSlot(T,e.d,e.i,e.dir);
  if(e.op==="repl")return replaceSlot(T,e.d,e.i,e.nm);
  if(e.op==="time")return setSlotTime(T,e.d,e.i,e.at,e.dur);
  if(e.op==="add"){const a=T.P.items.find(x=>x.nm===e.nm);if(!a||T.used.has(a.nm))return {ok:false,why:"Ese sitio ya está en tu viaje."};
    return addSlot(T,e.d,{cat:a.cat==="sight"?"sight":a.cat,label:"Añadido",item:a,dur:a.dur||durOf(a),user:true},e.after);}
  if(e.op==="own"){const it=ownItem(T,e.nm,e.c,e.dur);if(!it)return {ok:false};return addSlot(T,e.d,{cat:"sight",label:"Añadido",item:it,dur:it.dur,user:true},e.after);}
  if(e.op==="pause")return addSlot(T,e.d,{cat:"pausa",label:"Tiempo libre",gen:{t:"Tiempo libre",d:"Un rato sin plan que has añadido tú: para descansar, volver al hotel o improvisar."},dur:e.dur||60,user:true},e.after);
  return {ok:false};
}
/* ===================== PRESUPUESTO DEL PLAN =====================
   Suma lo que cuesta de verdad el itinerario que tienes delante: cada parada con su rango de precio (el de la ficha),
   el transporte de los tramos que no se hacen andando, el alojamiento por habitaciones y noches y, si no hay datos de
   tus billetes, una estimación de vuelos. Cada partida dice de dónde sale: «gratis», «precio de la guía» (rango
   orientativo del sitio), «por tipo de sitio» (no tenemos su precio: se estima por lo que suele costar algo así) o
   «estimado» (alojamiento y vuelos). Nada se presenta como confirmado: MoodTrip no reserva. */
const LODGE={low:[30,60],mid:[70,130],high:[150,300]};   // € por habitación doble y noche, antes del ajuste por ciudad
// vuelo ida y vuelta por persona desde España según la distancia (turista; «Premium» cuenta con mejores horarios y equipaje)
const FLIGHTKM=[[1500,[40,150]],[3000,[80,260]],[5500,[200,520]],[1e9,[550,1250]]];
const FLIGHTMULT={low:.8,mid:1,high:1.6};
function flightRange(T,presup){const c=T.P.center||[40.42,-3.7];const km=hav([40.42,-3.7],c);const r=(FLIGHTKM.find(x=>km<=x[0])||FLIGHTKM[3])[1],f=FLIGHTMULT[presup]||1;return {lo:Math.round(r[0]*f),hi:Math.round(r[1]*f),km:Math.round(km)};}
const BUDGET_CATS={visitas:"Entradas y visitas",desayunos:"Desayunos",comidas:"Comidas",cenas:"Cenas",noche:"Copas y noche",transporte:"Transporte en la ciudad",alojamiento:"Alojamiento",vuelos:"Viaje de ida y vuelta"};
function eurParse(x){x=String(x).trim();if(/^\d{1,3}(\.\d{3})+$/.test(x))x=x.replace(/\./g,"");return +x.replace(",",".");}
// rango en euros escrito en un texto: "(~6-14 €)", "8-42 €", "hasta 8 €", "Unos 10 €", "2 € (gratis los domingos)"
function eurRange(t){
  if(!t)return null;t=String(t);
  let m=t.match(/~\s*([\d.,]+)\s*[-–]\s*([\d.,]+)\s*€/)||t.match(/([\d.,]+)\s*[-–]\s*([\d.,]+)\s*€/);
  if(m)return [eurParse(m[1]),eurParse(m[2])];
  m=t.match(/hasta\s+([\d.,]+)\s*€/i);if(m)return [0,eurParse(m[1])];
  m=t.match(/~?\s*([\d.,]+)\s*€/);if(m){const v=eurParse(m[1]);return [v,v];}
  return null;
}
function cityMult(key){return ((typeof CURR!=="undefined"&&CURR[key])||{}).mult||1;}
// precio por persona de una parada: {lo, hi, src}
function stopRange(a,cat,key){
  if(!a||cat==="libre"||cat==="pausa")return null;
  const vcat=cat==="familia"?"sight":(cat==="merienda"?"comida":cat);
  const p=priceOf(a,vcat,key),m=cityMult(key);
  if(p.free)return {lo:0,hi:0,src:"gratis"};
  const vx=typeof VENUEX!=="undefined"&&VENUEX[a.nm]&&VENUEX[a.nm].price;
  const r=eurRange(vx&&/\d/.test(vx)?vx:p.txt);
  if(r)return {lo:r[0],hi:r[1],src:"guia"};
  if(vcat==="foto")return {lo:0,hi:0,src:"gratis"};
  // sin precio conocido: lo que suele costar algo así (y se dice)
  const base=(PRICEBASE[vcat]||PRICEBASE.sight)[2];
  if(/gratis o con entrada|puede tener entrada/i.test(p.txt||""))return {lo:0,hi:Math.round(base[1]*m*.6),src:"tipo"};
  return {lo:Math.round(base[0]*m),hi:Math.round(base[1]*m),src:"tipo"};
}
function budgetCat(cat){return {sight:"visitas",familia:"visitas",foto:"visitas",atardecer:"visitas",compras:"visitas",souvenir:"visitas",desayuno:"desayunos",merienda:"comidas",comida:"comidas",cena:"cenas",copas:"noche",disco:"noche"}[cat]||"visitas";}
function fareEUR(key){const f=typeof FARES!=="undefined"&&FARES[key];const r=f&&eurRange(f);return r?(r[0]+r[1])/2:2*cityMult(key);}
// el presupuesto entero: por partida, por día, por persona y para el grupo
function tripBudget(T,plan,people,opts){
  opts=opts||{};people=Math.max(1,Math.min(20,people||1));
  const key=T.key,m=cityMult(key),presup=T.o.presup||"mid",nights=Math.max(0,T.dias-1);
  const cats={};Object.keys(BUDGET_CATS).forEach(k=>cats[k]={lo:0,hi:0,src:new Set(),n:0});
  const add=(k,lo,hi,src)=>{cats[k].lo+=lo;cats[k].hi+=hi;cats[k].src.add(src);cats[k].n++;};
  const days=[],book=[],noPrice=[];
  T.days.forEach((D,d)=>{
    const row=(plan[d]||[]).filter(s=>s.a&&!s.a.marker);const items=[];let lo=0,hi=0;
    row.forEach(s=>{
      if(!s.a.real&&s.cat!=="libre"&&!s.a.libre){ // parada genérica («Cena por la zona»): se estima por tipo
        if(["desayuno","comida","cena","copas","disco","merienda"].includes(s.cat)){const b=(PRICEBASE[s.cat==="merienda"?"comida":s.cat]||PRICEBASE.sight)[2];
          const x={nm:s.a.t,cat:s.cat,lo:Math.round(b[0]*m),hi:Math.round(b[1]*m),src:"tipo",gen:true};items.push(x);add(budgetCat(s.cat),x.lo,x.hi,"tipo");lo+=x.lo;hi+=x.hi;}
        return;}
      const r=stopRange(s.slot&&s.slot.item?s.slot.item:{nm:s.a.t,kind:s.a.kind,auto:s.a.auto,own:s.a.own},s.cat,key);if(!r)return;
      const ex=s.lb==="Excursión";
      const x={nm:s.a.t,cat:s.cat,lo:r.lo,hi:r.hi,src:r.src,book:!!(s.a.book&&s.a.book[0]!=="opcional"),own:!!s.a.own,auto:!!s.a.auto,ref:s.slot?slotRef(D,s.slot):null,d};
      items.push(x);add(budgetCat(s.cat),r.lo,r.hi,r.src);lo+=r.lo;hi+=r.hi;
      if(x.book)book.push(x);if(r.src==="tipo")noPrice.push(x);
      if(ex){const t=[Math.round(8*m),Math.round(25*m)];add("transporte",t[0],t[1],"tipo");lo+=t[0];hi+=t[1];items.push({nm:"Tren o bus de la excursión (ida y vuelta)",cat:"transporte",lo:t[0],hi:t[1],src:"tipo"});}
    });
    // tramos en transporte público: los que el plan no hace andando
    const sch=runSchedule(D,T);let rides=0;
    for(let k=1;k<sch.length;k++){const x=sch[k];if(x.km==null||x.km>12||x.slot.cat==="pausa")continue;
      const w=walkMin(x.km,x.up||0,0),r=rideMin(x.km,x.up||0),mw=T.o.mayores?12:22;if(!(w<=mw||w<=r))rides++;}
    if(rides){const f=fareEUR(key),c=Math.round(rides*f*10)/10;add("transporte",c,c,"guia");lo+=c;hi+=c;items.push({nm:`${rides} ${rides===1?"trayecto":"trayectos"} en transporte público`,cat:"transporte",lo:c,hi:c,src:"guia"});}
    days.push({d,items,lo:Math.round(lo),hi:Math.round(hi)});
  });
  // alojamiento: habitaciones dobles para el grupo, repartido por persona
  const rooms=Math.ceil(people/2),L=LODGE[presup]||LODGE.mid;
  const alo=[Math.round(L[0]*m*nights*rooms/people),Math.round(L[1]*m*nights*rooms/people)];
  // lo que el usuario ya sabe (su hotel, su billete) manda sobre la estimación y cuenta como confirmado
  if(nights){if(opts.lodgeNight!=null){const v=Math.round(opts.lodgeNight*nights/people);add("alojamiento",v,v,"tuyo");}else add("alojamiento",alo[0],alo[1],"estimado");}
  const F=flightRange(T,presup);
  if(!opts.noFlights){if(opts.flightPP!=null)add("vuelos",opts.flightPP,opts.flightPP,"tuyo");else add("vuelos",F.lo,F.hi,"estimado");}
  Object.values(cats).forEach(c=>{c.lo=Math.round(c.lo);c.hi=Math.round(c.hi);c.src=[...c.src];});
  const pp=[0,0];Object.values(cats).forEach(c=>{pp[0]+=c.lo;pp[1]+=c.hi;});
  const onTrip=Object.entries(cats).filter(([k])=>!["alojamiento","vuelos"].includes(k)).reduce((t,[,c])=>[t[0]+c.lo,t[1]+c.hi],[0,0]);
  return {people,nights,rooms,flightKm:F.km,cats,days,pp,group:[pp[0]*people,pp[1]*people],onTrip,perDay:[Math.round(onTrip[0]/T.dias),Math.round(onTrip[1]/T.dias)],book,noPrice};
}
// alternativas más baratas y equivalentes (mismo tipo de parada, cerca, con algo en común con tus moods) que caben en el día
// «lo mismo pero más barato»: un castillo se cambia por otro monumento, no por una plaza
const KINDFAM={palacio:"monumental",iglesia:"monumental",ruinas:"monumental",museo:"monumental",torre:"monumental",monumento:"monumental",cueva:"monumental",espectaculo:"monumental",parque:"aire",mirador:"aire",playa:"aire",barrio:"aire",plaza:"aire",puente:"aire",fuente:"aire",crucero:"agua",termas:"termas",zoo:"zoo"};
function cheaperAlternatives(T,plan,max){
  const B=tripBudget(T,plan,1,{noFlights:true});const out=[];
  const paid=B.days.flatMap(x=>x.items.map(it=>({...it,d:x.d}))).filter(it=>it.ref&&it.hi>0&&it.src==="guia"&&["sight","atardecer","comida","cena","copas","familia"].includes(it.cat)).sort((a,b)=>b.hi-a.hi);
  for(const it of paid){
    if(out.length>=(max||5))break;
    const D=T.days[it.d],i=refIdx(D,it.ref,-1);if(i<0)continue;const s=D.slots[i];if(!s||!s.item||s.label==="Excursión")continue;
    const cur=s.item,mids=(cur.m||[]);
    const fam=x=>KINDFAM[x.kind]||x.kind||"otro";
    const cand=T.P.items.filter(a=>a.cat===(cur.cat==="familia"?"sight":cur.cat)&&a.c&&cur.c&&!T.used.has(a.nm)&&!a.excursion&&hav(a.c,cur.c)<=2&&(cur.cat!=="sight"||fam(a)===fam(cur))&&((a.m||[]).some(x=>mids.includes(x)||T.o.moods.includes(x))))
      .map(a=>({a,r:stopRange(a,it.cat,T.key)})).filter(x=>x.r&&x.r.src!=="tipo"&&x.r.hi<it.lo+.01&&x.r.hi<it.hi)
      .sort((x,y)=>(x.r.hi-y.r.hi)||(hav(x.a.c,cur.c)-hav(y.a.c,cur.c)));
    for(const c of cand){
      const r=replaceSlot(T,it.d,i,c.a.nm,true);
      if(r.ok&&!(r.dropped&&r.dropped.length)){out.push({d:it.d,ref:it.ref,from:it.nm,to:c.a.nm,km:hav(c.a.c,cur.c),save:[Math.max(0,it.lo-c.r.hi),Math.max(0,it.hi-c.r.lo)],toRange:c.r});break;}
    }
  }
  return out;
}
function replaceSlot(T,d,i,nm,dry){
  return tryEdit(T,d,D=>{const s=D.slots[i];const a=T.P.items.find(x=>x.nm===nm);
    if(!s||!a)return false;if(T.used.has(a.nm))return "Ese sitio ya está en tu viaje.";
    if(s.item)T.used.delete(s.item.nm);s.item=a;s.gen=null;s.dur=s.label==="Excursión"?a.dur:(s.cat==="familia"?Math.min(a.dur,100):durOf(a));T.used.add(a.nm);},D0slot(T,d,i),dry?"dry":"strict");
}
// guía práctica del viaje: qué reservar ya, cómo moverse y las costumbres del sitio
function tripGuide(T,plan){
  const books=[],seen=new Set();
  plan.forEach((day,d)=>day.forEach(s=>{if(s.a&&s.a.book&&!seen.has(s.a.t)){seen.add(s.a.t);books.push({n:s.a.t,adv:s.a.book[0],note:s.a.book[1],d});}
    else if(s.a&&s.a.real&&(s.cat==="cena"||s.cat==="comida")&&/reserva/i.test(s.a.d||"")&&!seen.has(s.a.t)){seen.add(s.a.t);books.push({n:s.a.t,adv:"1-2 días",note:"Restaurante con mucha demanda.",d});}}));
  const closures=[];plan.forEach((day,d)=>day.forEach(s=>{if(s.a&&s.a.closed)closures.push({n:s.a.t,txt:s.a.closed.txt,d,today:s.a.closed.today});}));
  const hours=[],clubs=[];plan.forEach((day,d)=>day.forEach(s=>{
    if(s.a&&s.a.hours&&s.a.hours.known&&tmin(s.a.hours.c)<=20*60)hours.push({n:s.a.t,o:s.a.hours.o,c:s.a.hours.c,d,time:s.time,late:s.a.hours.late});
    if(s.a&&s.a.club&&s.a.real)clubs.push({n:s.a.t,...s.a.club,d});}));
  const cnt={};T.types.forEach(t=>cnt[t]=(cnt[t]||0)+1);
  const parts=[];if(cnt.llegada)parts.push("1 de llegada");if(cnt.barrio)parts.push(`${cnt.barrio} de barrio`);if(cnt.excursion)parts.push(`${cnt.excursion} de excursión`);if(cnt.salida)parts.push("1 de vuelta");if(cnt.unico)parts.push("1 completo");
  const nights=T.night.filter(n=>n==="disco").length;
  return {books,closures,hours,clubs,transit:TRANSIT[T.key]||null,fare:(typeof FARES!=="undefined"&&FARES[T.key])||null,meal:T.LC.meal,tip:T.LC.tip,country:T.LC.n,
    ritmo:`${T.dias} ${T.dias===1?"día":"días"}: ${parts.join(", ")}.`+(nights?` ${nights} ${nights===1?"noche":"noches"} de discoteca, y la mañana siguiente empieza tarde.`:""),
    dated:!!T.opts.inDate,auto:typeof isAuto==="function"&&isAuto(T.key),empty:!T.P.items.some(a=>a.cat==="sight")};
}

