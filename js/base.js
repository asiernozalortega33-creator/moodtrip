// MoodTrip · opciones, iconos y lista de destinos
// (archivo de la app: scripts clásicos que comparten el ámbito global, en el orden de index.html)
/* ============ OPCIONES ============ */
const MOODS=[{id:"cultural",svg:"landmark",nm:"Cultural",sub:"Historia y arte"},{id:"relax",svg:"leaf",nm:"Relax",sub:"Calma total"},{id:"aventura",svg:"mountain",nm:"Aventura",sub:"Naturaleza"},{id:"gastro",svg:"utensils",nm:"Gastro",sub:"Comer rico"},{id:"fiesta",svg:"music",nm:"Fiesta",sub:"Previa + disco"},{id:"romantico",svg:"heart",nm:"Romántico",sub:"Para dos"},{id:"compras",svg:"bag",nm:"Compras",sub:"Tiendas famosas"},{id:"souvenir",svg:"gift",nm:"Souvenirs",sub:"Recuerdos típicos"},{id:"foto",svg:"camera",nm:"Fotos",sub:"Spots fotogénicos"}];
const COMPANIA=[{id:"solo",svg:"user",nm:"Solo/a",sub:"A mi aire"},{id:"pareja",svg:"couple",nm:"Pareja",sub:"Los dos"},{id:"amigos",svg:"users",nm:"Amigos",sub:"En grupo"},{id:"familia",svg:"family",nm:"Familia",sub:"Con peques"},{id:"mayores",svg:"heart",nm:"Con mis padres",sub:"Sin prisas ni cuestas"}];
const PRESUP=[{id:"low",svg:"backpack",nm:"Mochilero",sub:"€ ajustado"},{id:"mid",svg:"card",nm:"Medio",sub:"€€ equilibrado"},{id:"high",svg:"gem",nm:"Premium",sub:"€€€ sin límite"}];
const RITMO=[{id:"chill",svg:"feather",nm:"Tranquilo",sub:"Menos paradas"},{id:"equi",svg:"scale",nm:"Equilibrado",sub:"Día completo"},{id:"intenso",svg:"flame",nm:"Intenso",sub:"A tope"}];
const COMIDA=[{id:"ninguna",nm:"Sin restricción"},{id:"veg",nm:"🥗 Vegetariano"},{id:"vegan",nm:"🌱 Vegano"},{id:"celiac",nm:"🌾 Sin gluten"},{id:"halal",nm:"☪️ Halal"}];
const FISICO=[{id:"bajo",nm:"🪑 Cómodo"},{id:"medio",nm:"🚶 Normal"},{id:"alto",nm:"🥾 Mucho andar"}];

/* ============ ICONOS SVG (trazo, estilo Lucide) ============ */
const SVGP={
  dot:'<circle cx="12" cy="12" r="3"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  pin:'<path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/>',
  calendar:'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
  sparkles:'<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18.4 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3.2 3.2 0 0 1 0 6.2"/><path d="M20.5 19a5.5 5.5 0 0 0-3-4.9"/>',
  wallet:'<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14" r="1.1"/>',
  zap:'<path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"/>',
  sliders:'<path d="M4 8h9M19 8h1M4 16h1M11 16h9"/><circle cx="16" cy="8" r="2.4"/><circle cx="8" cy="16" r="2.4"/>',
  building:'<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10 20.5v-3.5h4v3.5"/>',
  bed:'<path d="M3 8.5v11M3 13h13.5a3.5 3.5 0 0 1 3.5 3.5v3M21 19.5v-3"/><circle cx="7.5" cy="11" r="1.7"/>',
  plane:'<path d="M17.8 19.2 16 11l3.4-3.4c1.5-1.5 2-3.4 1.5-3.9s-2.4 0-3.9 1.5L13 8.6 4.9 6.8a.9.9 0 0 0-.9.3l-.3.4a.9.9 0 0 0 .2 1.2L9 12l-2 3H4l-1 1 3 1.8L7.8 21l1-1v-3l3-2 3.4 5.2a.9.9 0 0 0 1.2.2l.4-.3a.9.9 0 0 0 .3-.9Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v4h-4"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  share:'<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13M8 7l4-4 4 4"/>',
  dots:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  download:'<path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  landmark:'<path d="M3 21h18M5.5 21v-8M9.5 21v-8M14.5 21v-8M18.5 21v-8M4 12.5h16M12 3 19.5 8H4.5L12 3Z"/>',
  leaf:'<path d="M11 20.5A7.5 7.5 0 0 1 9.8 6C15.5 5 17.5 4.4 20 2c1 2.3 1.5 4.5 1.5 8 0 6-4.7 10.5-10.5 10.5Z"/><path d="M2.5 21.5c0-3.2 2-5.7 5.3-6.4"/>',
  mountain:'<path d="M3 20 9.5 7l3.4 6.2L15.5 11 21 20H3Z"/>',
  utensils:'<path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10M15.5 3C14 3 13 4.8 13 7s1 4 2.5 4M15.5 3v18"/>',
  music:'<circle cx="7" cy="18" r="2.6"/><circle cx="18" cy="16" r="2.6"/><path d="M9.6 18V6l11-2v10"/>',
  heart:'<path d="M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8c0 5.7-8 10.7-8 10.7Z"/>',
  bag:'<path d="M6.5 8h11l1 12.5h-13L6.5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  gift:'<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V21h14v-8.5M12 8.5V21"/><path d="M12 8.5C10.5 8.5 8 8 8 6a2 2 0 0 1 4-.5 2 2 0 0 1 4 .5c0 2-2.5 2.5-4 2.5Z"/>',
  camera:'<path d="M4 8h3l1.5-2h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13.5" r="3.4"/>',
  user:'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  couple:'<circle cx="8.5" cy="8" r="3"/><circle cx="15.5" cy="8" r="3"/><path d="M3 20a5.5 5.5 0 0 1 9-1.8A5.5 5.5 0 0 1 21 20"/>',
  family:'<circle cx="8.5" cy="8" r="2.8"/><circle cx="16" cy="9" r="2.2"/><path d="M3 20a5.5 5.5 0 0 1 11 0"/><path d="M14.5 20a4.5 4.5 0 0 1 6.5-4"/>',
  backpack:'<path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9M9 13.5h6"/>',
  card:'<rect x="3" y="6" width="18" height="12.5" rx="2.2"/><path d="M3 10h18"/>',
  gem:'<path d="M6 4h12l3 5-9 11L3 9 6 4Z"/><path d="M3 9h18M9 4 7.5 9 12 20M15 4l1.5 5L12 20"/>',
  feather:'<path d="M20 5a5 5 0 0 0-7 0l-8 8v6h6l8-8a5 5 0 0 0 1-6Z"/><path d="M5 19 14 10M16 8h-2v2"/>',
  scale:'<path d="M12 4v16M7 20h10M5 9h14"/><path d="M5 9 2.5 14a3 3 0 0 0 5 0L5 9Z"/><path d="M19 9l-2.5 5a3 3 0 0 0 5 0L19 9Z"/>',
  flame:'<path d="M12 21a6 6 0 0 0 6-6c0-3.6-3-5.5-3.5-9-1.5 1.5-2.5 3-2.5 5-1-.5-1.5-1.8-1.5-3C8.5 10 6 12 6 15a6 6 0 0 0 6 6Z"/>',
  coffee:'<path d="M5 8.5h12v4a5 5 0 0 1-10 0v-4Z"/><path d="M17 9.5h1.8a2.2 2.2 0 0 1 0 4.4H17"/><path d="M7 3v2M11 3v2M15 3v2M4 21h15"/>',
  sunset:'<path d="M12 10V3M5.5 7 4 5.5M18.5 7 20 5.5M2.5 14h19M5.5 18h13"/><path d="M8 14a4 4 0 0 1 8 0"/>',
  wine:'<path d="M8 21h8M12 15v6M6 4h12l-1 4a5 5 0 0 1-10 0L6 4Z"/>',
  disc:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>',
  moon:'<path d="M21 13.5A8.5 8.5 0 1 1 10.5 3a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  icecream:'<path d="M8 11 12 21l4-10M8 11a4 4 0 0 1 8 0Z"/>',
  smile:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14a4 4 0 0 0 7 0"/><circle cx="9.2" cy="10" r="1"/><circle cx="14.8" cy="10" r="1"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z"/>',
  walk:'<circle cx="13" cy="4.3" r="1.7"/><path d="M11 21l1.5-6L10 12l1-5 3 1 2 2M9 12.5 7 13M14 14.5l2.5 1.5"/>',
  bike:'<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l5-7h3l3 7M10.5 7H13l1.5 3"/>',
  bus:'<rect x="4" y="5" width="16" height="12" rx="2.2"/><path d="M4 11.5h16M8 17v2M16 17v2"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  taxi:'<path d="M6 11l1.4-3.5A2 2 0 0 1 9.3 6h5.4a2 2 0 0 1 1.9 1.5L18 11"/><rect x="3" y="11" width="18" height="5" rx="1.6"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/><path d="M10 6V4.5h4V6"/>',
  expand:'<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  nav:'<path d="M3 11 21 3l-8 18-2-8-8-2Z"/>',
  train:'<rect x="6" y="4" width="12" height="11" rx="2.2"/><path d="M6 10h12M9.5 19l-2 2.5M14.5 19l2 2.5M9 15v.01M15 15v.01"/>',
  cloud:'<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  list:'<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>'
};
function ico(name,extra){return `<svg class="ico ${extra||""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SVGP[name]||SVGP.dot}</svg>`;}
function hydrateIcons(root){(root||document).querySelectorAll("[data-ico]").forEach(e=>{e.innerHTML=ico(e.dataset.ico,e.dataset.rot?("rot-"+e.dataset.rot):"");});}

/* ============ DESTINOS (autocomplete). key solo en ciudades curadas ============ */
const DESTINOS=[
  {n:"Budapest",c:"Hungría",fl:"🇭🇺",key:"budapest"},
  {n:"Croacia",c:"Croacia (Split)",fl:"🇭🇷",key:"split"},{n:"Split",c:"Croacia",fl:"🇭🇷",key:"split"},
  {n:"Corea del Sur",c:"Seúl",fl:"🇰🇷",key:"seoul"},{n:"Seúl",c:"Corea del Sur",fl:"🇰🇷",key:"seoul"},
  {n:"Dubrovnik",c:"Croacia",fl:"🇭🇷"},{n:"Hvar",c:"Croacia",fl:"🇭🇷"},{n:"Zagreb",c:"Croacia",fl:"🇭🇷"},
  {n:"Roma",c:"Italia",fl:"🇮🇹",key:"roma"},{n:"Venecia",c:"Italia",fl:"🇮🇹",key:"venecia"},{n:"Florencia",c:"Italia",fl:"🇮🇹",key:"florencia"},{n:"Milán",c:"Italia",fl:"🇮🇹",key:"milan"},
  {n:"París",c:"Francia",fl:"🇫🇷",key:"paris"},{n:"Niza",c:"Francia",fl:"🇫🇷",key:"niza"},
  {n:"Barcelona",c:"España",fl:"🇪🇸"},{n:"Madrid",c:"España",fl:"🇪🇸",key:"madrid"},{n:"Sevilla",c:"España",fl:"🇪🇸",key:"sevilla"},{n:"Granada",c:"España",fl:"🇪🇸"},{n:"Valencia",c:"España",fl:"🇪🇸"},
  {n:"Lisboa",c:"Portugal",fl:"🇵🇹",key:"lisboa"},{n:"Oporto",c:"Portugal",fl:"🇵🇹",key:"oporto"},
  {n:"Londres",c:"Reino Unido",fl:"🇬🇧",key:"londres"},{n:"Edimburgo",c:"Reino Unido",fl:"🇬🇧",key:"edimburgo"},
  {n:"Ámsterdam",c:"Países Bajos",fl:"🇳🇱",key:"amsterdam"},{n:"Berlín",c:"Alemania",fl:"🇩🇪",key:"berlin"},{n:"Múnich",c:"Alemania",fl:"🇩🇪",key:"munich"},{n:"Bruselas",c:"Bélgica",fl:"🇧🇪",key:"bruselas"},
  {n:"Praga",c:"Chequia",fl:"🇨🇿",key:"praga"},{n:"Viena",c:"Austria",fl:"🇦🇹",key:"viena"},{n:"Atenas",c:"Grecia",fl:"🇬🇷",key:"atenas"},{n:"Santorini",c:"Grecia",fl:"🇬🇷"},
  {n:"Reikiavik",c:"Islandia",fl:"🇮🇸"},{n:"Copenhague",c:"Dinamarca",fl:"🇩🇰",key:"copenhague"},{n:"Estocolmo",c:"Suecia",fl:"🇸🇪",key:"estocolmo"},{n:"Oslo",c:"Noruega",fl:"🇳🇴"},
  {n:"Dublín",c:"Irlanda",fl:"🇮🇪",key:"dublin"},{n:"Estambul",c:"Turquía",fl:"🇹🇷",key:"estambul"},{n:"Cracovia",c:"Polonia",fl:"🇵🇱",key:"cracovia"},{n:"Varsovia",c:"Polonia",fl:"🇵🇱"},
  {n:"Tokio",c:"Japón",fl:"🇯🇵"},{n:"Kioto",c:"Japón",fl:"🇯🇵"},{n:"Osaka",c:"Japón",fl:"🇯🇵"},
  {n:"Bangkok",c:"Tailandia",fl:"🇹🇭"},{n:"Bali",c:"Indonesia",fl:"🇮🇩"},{n:"Singapur",c:"Singapur",fl:"🇸🇬"},{n:"Seúl",c:"Corea del Sur",fl:"🇰🇷",key:"seoul"},
  {n:"Dubái",c:"E.A.U.",fl:"🇦🇪"},{n:"Marrakech",c:"Marruecos",fl:"🇲🇦"},{n:"El Cairo",c:"Egipto",fl:"🇪🇬"},
  {n:"Nueva York",c:"EE.UU.",fl:"🇺🇸"},{n:"Los Ángeles",c:"EE.UU.",fl:"🇺🇸"},{n:"Miami",c:"EE.UU.",fl:"🇺🇸"},
  {n:"Ciudad de México",c:"México",fl:"🇲🇽"},{n:"Buenos Aires",c:"Argentina",fl:"🇦🇷"},{n:"Río de Janeiro",c:"Brasil",fl:"🇧🇷"},
];
const ALIAS={croacia:"split",split:"split",dubrovnik:"split",hvar:"split",seul:"seoul",seoul:"seoul",corea:"seoul","corea del sur":"seoul",budapest:"budapest",lisboa:"lisboa",lisbon:"lisboa",praga:"praga",prague:"praga",roma:"roma",rome:"roma",amsterdam:"amsterdam","ámsterdam":"amsterdam",berlin:"berlin","berlín":"berlin",paris:"paris","parís":"paris",madrid:"madrid",londres:"londres",london:"londres",atenas:"atenas",athens:"atenas",viena:"viena",vienna:"viena",dublin:"dublin","dublín":"dublin",copenhague:"copenhague",copenhagen:"copenhague",kobenhavn:"copenhague",estambul:"estambul",istanbul:"estambul",edimburgo:"edimburgo",edinburgh:"edimburgo",florencia:"florencia",florence:"florencia",firenze:"florencia",venecia:"venecia",venice:"venecia",venezia:"venecia",oporto:"oporto",porto:"oporto",cracovia:"cracovia",krakow:"cracovia",cracow:"cracovia",estocolmo:"estocolmo",stockholm:"estocolmo",bruselas:"bruselas",brussels:"bruselas",bruxelles:"bruselas",sevilla:"sevilla",seville:"sevilla",munich:"munich",munchen:"munich",muenchen:"munich",niza:"niza",nice:"niza",milan:"milan",milano:"milan"};

