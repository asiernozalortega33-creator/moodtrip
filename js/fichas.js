// MoodTrip · utilidades de interfaz, imágenes, ficha de cada sitio y cuentas
// (archivo de la app: scripts clásicos que comparten el ámbito global, en el orden de index.html)
/* ============ UI ============ */
const sel={moods:[],compania:null,presupuesto:null,ritmo:null,comida:"ninguna",fisico:"medio"};
function buildSeg(id,data,key,multi){const c=document.getElementById(id);data.forEach(o=>{const el=document.createElement("div");el.className="opt";el.innerHTML=`<span class="ic">${o.svg?ico(o.svg):o.ic||""}</span><span class="nm">${o.nm}</span><span class="sub">${o.sub}</span>`;el.onclick=()=>{if(multi){if(sel.moods.includes(o.id)){sel.moods=sel.moods.filter(x=>x!==o.id);el.classList.remove("on");}else{if(sel.moods.length>=3){flash("Máximo 3 moods 😊");return;}sel.moods.push(o.id);el.classList.add("on");}}else{[...c.children].forEach(x=>x.classList.remove("on"));el.classList.add("on");sel[key]=o.id;}};c.appendChild(el);});}
buildSeg("moods",MOODS,"moods",true);buildSeg("compania",COMPANIA,"compania",false);buildSeg("presupuesto",PRESUP,"presupuesto",false);buildSeg("ritmo",RITMO,"ritmo",false);
hydrateIcons();
function buildMini(id,data,key){const c=document.getElementById(id);data.forEach(o=>{const el=document.createElement("div");el.className="m"+((key==="comida"&&o.id==="ninguna")||(key==="fisico"&&o.id==="medio")?" on":"");el.textContent=o.nm;el.onclick=()=>{[...c.children].forEach(x=>x.classList.remove("on"));el.classList.add("on");sel[key]=o.id;};c.appendChild(el);});}
buildMini("comida",COMIDA,"comida");buildMini("fisico",FISICO,"fisico");
const inDias=document.getElementById("dias");
document.getElementById("minus").onclick=()=>{inDias.value=Math.max(1,(+inDias.value||1)-1);markQuick();};
document.getElementById("plus").onclick=()=>{inDias.value=Math.min(21,(+inDias.value||1)+1);markQuick();};
const cQuick=document.getElementById("quickDays");[2,3,5,7].forEach(n=>{const b=document.createElement("div");b.className="c";b.textContent=n+" días";b.dataset.n=n;b.onclick=()=>{inDias.value=n;markQuick();};cQuick.appendChild(b);});
function markQuick(){[...cQuick.children].forEach(x=>x.classList.toggle("on",+x.dataset.n===+inDias.value));}markQuick();

/* ============ AUTOCOMPLETE ============ */
const inDest=document.getElementById("destino");const acBox=document.getElementById("ac");let acIdx=-1,acList=[];
function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();}
function renderAC(q){const nq=norm(q);if(!nq){acBox.classList.remove("show");return;}const seen=new Set();acList=DESTINOS.filter(d=>{const k=norm(d.n);if(seen.has(k))return false;if(norm(d.n).includes(nq)||norm(d.c).includes(nq)){seen.add(k);return true;}return false;}).slice(0,8);if(!acList.length){acBox.innerHTML=`<div class="ac-empty">Sin coincidencias — escribe "${q}" igualmente y crea tu plan ✈️</div>`;acBox.classList.add("show");acIdx=-1;return;}acBox.innerHTML=acList.map((d,i)=>`<div class="ac-item${i===acIdx?' active':''}" data-i="${i}"><span class="fl">${d.fl}</span><span class="tx"><b>${d.n}</b><span>${d.c}</span></span>${d.key?'<span class="star">⭐ guía</span>':''}</div>`).join("");acBox.classList.add("show");[...acBox.children].forEach(el=>el.onclick=()=>chooseAC(+el.dataset.i));}
function chooseAC(i){const d=acList[i];if(!d)return;inDest.value=d.n;inDest.dataset.key=d.key||"";acBox.classList.remove("show");}
inDest.addEventListener("input",()=>{inDest.dataset.key="";acIdx=-1;renderAC(inDest.value);});
inDest.addEventListener("keydown",e=>{if(!acBox.classList.contains("show"))return;if(e.key==="ArrowDown"){e.preventDefault();acIdx=Math.min(acList.length-1,acIdx+1);renderAC(inDest.value);}else if(e.key==="ArrowUp"){e.preventDefault();acIdx=Math.max(0,acIdx-1);renderAC(inDest.value);}else if(e.key==="Enter"){if(acIdx>=0){e.preventDefault();chooseAC(acIdx);}}else if(e.key==="Escape")acBox.classList.remove("show");});
document.addEventListener("click",e=>{if(!e.target.closest(".field"))acBox.classList.remove("show");});

/* ============ IMÁGENES (Wikimedia Commons, sin clave) ============ */
const imgCache={};
async function commonsImg(q){if(imgCache[q]!==undefined)return imgCache[q];try{const u="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=5&gsrsearch="+encodeURIComponent(q)+"&prop=imageinfo&iiprop=url|mime&iiurlwidth=440";const r=await fetch(u);const j=await r.json();const pages=j&&j.query&&j.query.pages;if(pages){const arr=Object.values(pages).sort((a,b)=>(a.index||0)-(b.index||0));for(const p of arr){const ii=p.imageinfo&&p.imageinfo[0];if(ii&&/jpeg|jpg|png/i.test(ii.mime||"")){imgCache[q]=ii.thumburl||ii.url;return imgCache[q];}}}}catch(e){}imgCache[q]=null;return null;}
const usedImgs=new Set();
function applyImg(el,s,id){const im=new Image();im.onload=()=>{el.style.backgroundImage=`url('${s}')`;el.classList.add("on");if(id&&stopData[id])stopData[id].img=s;};im.src=s;}
const wikiCache={};
async function wikiImg(title){if(wikiCache[title]!==undefined)return wikiCache[title];try{const r=await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(title));if(r.ok){const j=await r.json();const u=(j.thumbnail&&j.thumbnail.source)||(j.originalimage&&j.originalimage.source);if(u&&!/\.svg/i.test(u)){wikiCache[title]=u;return u;}}}catch(e){}wikiCache[title]=null;return null;}
function titleCands(a,destino){const base=(a.q||"").replace(/\(.*?\)/g,"").trim();const out=[];if(base)out.push(base);let s=base;["Budapest","Split","Seoul","Croatia","Korea",destino].forEach(w=>{s=s.replace(new RegExp("\\s*"+w+"\\s*$","i"),"").trim();});if(s&&s!==base)out.push(s);return out;}
function themedQ(cat,destino){return {desayuno:[destino+" cafe","coffee shop interior"],sight:[destino+" landmark",destino],comida:[destino+" food dish","restaurant food"],atardecer:[destino+" sunset skyline","sunset skyline"],cena:[destino+" restaurant interior","restaurant table"],copas:[destino+" bar","cocktail bar interior"],disco:[destino+" nightclub","nightclub dance floor"],compras:[destino+" shopping street","shopping district"],souvenir:[destino+" market souvenirs","souvenir shop"],foto:[destino+" viewpoint panorama",destino+" skyline"],cultural:[destino+" old town",destino+" landmark"],relax:[destino+" park",destino+" garden"],aventura:[destino+" nature landscape",destino+" hiking"],gastro:[destino+" food market","local food"],fiesta:[destino+" nightlife",destino+" bar"],romantico:[destino+" sunset view",destino],familia:[destino+" park",destino+" family"],familianoche:[destino+" night city lights",destino+" night"]}[cat]||[destino];}
/* Fotos reales fijadas a mano (verificadas en Wikimedia Commons) */
const U="https://upload.wikimedia.org/wikipedia/commons/thumb/";
const CLUB1=U+"d/de/88mph_high_res_illuminated_dance_floor_20260411.jpg/960px-88mph_high_res_illuminated_dance_floor_20260411.jpg";
const CLUB2=U+"3/3d/Amnesia_Ibiza_Crowd_10.jpg/960px-Amnesia_Ibiza_Crowd_10.jpg";
const CLUB3=U+"9/9f/Crowd_HM1_Nightclub_Dresden.jpg/960px-Crowd_HM1_Nightclub_Dresden.jpg";
const CLUB4=U+"f/fc/Deejay_and_house_music_producer_DJ_Vibe_%28Antonio_Pereira%29_in_Portugal_1994_01.jpg/960px-Deejay_and_house_music_producer_DJ_Vibe_%28Antonio_Pereira%29_in_Portugal_1994_01.jpg";
const IMG={
  // Budapest
  "New York Café":U+"0/01/Clocks_in_New_York_Caf%C3%A9_Budapest_%281%29.jpg/960px-Clocks_in_New_York_Caf%C3%A9_Budapest_%281%29.jpg",
  "Gerlóczy Kávéház":U+"3/37/Cafe_Brunch_Budapest_-_Bazilika.jpg/960px-Cafe_Brunch_Budapest_-_Bazilika.jpg",
  "Parlamento de Budapest":U+"9/99/Hungarian_Parliament_Building_from_across_the_Danube%2C_2025-01-11.jpg/960px-Hungarian_Parliament_Building_from_across_the_Danube%2C_2025-01-11.jpg",
  "Bastión de los Pescadores":U+"6/6a/Hal%C3%A1szb%C3%A1stya_2017.jpg/960px-Hal%C3%A1szb%C3%A1stya_2017.jpg",
  "Iglesia de Matías":U+"d/d9/MatyasTemplomFotoThalerTamas20162.JPG/960px-MatyasTemplomFotoThalerTamas20162.JPG",
  "Basílica de San Esteban (cúpula)":U+"a/a9/Dome_of_St._Stephen%27s_Basilica_%28Budapest%29.jpg/960px-Dome_of_St._Stephen%27s_Basilica_%28Budapest%29.jpg",
  "Gran Sinagoga de Dohány":U+"6/6a/Synagogue-Budapest.jpg/960px-Synagogue-Budapest.jpg",
  "Castillo de Buda":U+"5/5c/Budav%C3%A1ri_Palota%2C_ABCDEF_%C3%A9p%C3%BClet.jpg/960px-Budav%C3%A1ri_Palota%2C_ABCDEF_%C3%A9p%C3%BClet.jpg",
  "Casa del Terror":U+"4/45/House_of_Terror_Museum_in_Budapest_%2810890338584%29.jpg/960px-House_of_Terror_Museum_in_Budapest_%2810890338584%29.jpg",
  "Balneario Széchenyi":U+"f/fa/Budapest_Sz%C3%A9chenyi_Baths_R02.jpg/960px-Budapest_Sz%C3%A9chenyi_Baths_R02.jpg",
  "Baños Rudas (terma turca)":U+"1/1a/Rudas_gyogyfurdo_P7290076-1000.jpg/960px-Rudas_gyogyfurdo_P7290076-1000.jpg",
  "Isla Margarita":U+"a/ab/Budapest_Donauinsel_2.jpg/960px-Budapest_Donauinsel_2.jpg",
  "Mercado Central (lángos)":U+"2/25/Budapest_great_market_hall.jpg/960px-Budapest_great_market_hall.jpg",
  "Gettó Gulyás":U+"2/2f/Goulash_hungarian.jpg/960px-Goulash_hungarian.jpg",
  "Karaván Street Food":U+"3/3c/Christmas_market_in_2015_De%C3%A1k_Street._L%C3%A1ngos._-_Budapest.JPG/960px-Christmas_market_in_2015_De%C3%A1k_Street._L%C3%A1ngos._-_Budapest.JPG",
  "Hold utcai Piac":U+"a/ad/Budapest_-_Hold_utcai_V%C3%A1s%C3%A1rcsarnok.jpg/960px-Budapest_-_Hold_utcai_V%C3%A1s%C3%A1rcsarnok.jpg",
  "Colina Gellért y Citadella":U+"4/43/Budapest_-_Citadella_%2824593091628%29.jpg/960px-Budapest_-_Citadella_%2824593091628%29.jpg",
  "Crucero al atardecer por el Danubio":U+"1/18/Budapest_Parlament_by_night_WUXGA.jpg/960px-Budapest_Parlament_by_night_WUXGA.jpg",
  "Menza (Liszt Ferenc tér)":U+"3/35/Bohemia_Bistro_Budapest_Liszt_Ferenc_ter_late_in_the_evening._Budapest%2C_Hungary%2C_Eastern_Europe%2C_22_October_2012.jpg/960px-Bohemia_Bistro_Budapest_Liszt_Ferenc_ter_late_in_the_evening._Budapest%2C_Hungary%2C_Eastern_Europe%2C_22_October_2012.jpg",
  "VakVarjú":U+"a/a7/Budapest%2C_Hummusbar%2C_hummus_plate.jpg/960px-Budapest%2C_Hummusbar%2C_hummus_plate.jpg",
  "Szimpla Kert (previa)":U+"f/f7/Romkocsma_Szimpla_Kert_Budapest.jpg/960px-Romkocsma_Szimpla_Kert_Budapest.jpg",
  "Mika Tivadar Mulató":U+"a/ab/Ruin_bar_typewriter_and_books_Budapest_2025.jpeg/960px-Ruin_bar_typewriter_and_books_Budapest_2025.jpeg",
  "Akvárium Klub":U+"c/cc/-_Erzs%C3%A9bet_Square%2C_Budapest.jpg/960px--_Erzs%C3%A9bet_Square%2C_Budapest.jpg",
  "Corvintető (rooftop club)":U+"e/e3/Budapest_at_Night_from_the_Hotel_Papillon_-_panoramio.jpg/960px-Budapest_at_Night_from_the_Hotel_Papillon_-_panoramio.jpg",
  "Ötkert":CLUB3,"Doboz":CLUB2,"Instant-Fogas Complex":CLUB1,
  // Split
  "D16 Coffee":U+"d/d6/Cappuccino_with_latte_art_on_Coffee_Right_in_Brno%2C_Brno-City_District.jpg/960px-Cappuccino_with_latte_art_on_Coffee_Right_in_Brno%2C_Brno-City_District.jpg",
  "Bokeria Kitchen & Wine":U+"8/84/Brunch_at_Brennan%27s%2C_New_Orleans%2C_March_2010_01.jpg/960px-Brunch_at_Brennan%27s%2C_New_Orleans%2C_March_2010_01.jpg",
  "Palacio de Diocleciano":U+"d/dc/Diocletian%27s_Palace_Split_Croatia.jpg/960px-Diocletian%27s_Palace_Split_Croatia.jpg",
  "Catedral de San Domnio":U+"e/eb/Bell_Tower_From_Bottom_-_Cathedral_of_Saint_Domnius_-_Split.jpg/960px-Bell_Tower_From_Bottom_-_Cathedral_of_Saint_Domnius_-_Split.jpg",
  "Sótanos del Palacio":U+"d/dd/Croatia-01177_-_The_Peristil.jpg/960px-Croatia-01177_-_The_Peristil.jpg",
  "Colina Marjan":U+"8/8a/Cross_on_Marjan_hill%2C_Split.jpg/960px-Cross_on_Marjan_hill%2C_Split.jpg",
  "Paseo Riva":U+"f/fa/Ba%C5%A1ka_Voda_-_riva.jpg/960px-Ba%C5%A1ka_Voda_-_riva.jpg",
  "Playa de Bačvice":U+"2/29/Aerial_view_of_Bacvice_Beach_in_Split%2C_Croatia_%2848608745867%29.jpg/960px-Aerial_view_of_Bacvice_Beach_in_Split%2C_Croatia_%2848608745867%29.jpg",
  "Excursión a las cascadas de Krka":U+"e/ee/Krka_national_park_-_2021-07-28_-_Waterfalls_-_2528.jpg/960px-Krka_national_park_-_2021-07-28_-_Waterfalls_-_2528.jpg",
  "Barco a Hvar y la Cueva Azul":U+"8/8a/Blue_Cave_on_Bisevo_island_in_Croatia_%2848693932812%29.jpg/960px-Blue_Cave_on_Bisevo_island_in_Croatia_%2848693932812%29.jpg",
  "Konoba Matejuška":U+"d/d5/Skampi_Na_Zaru_-_Konoba_Ivan_%2814929244641%29.jpg/960px-Skampi_Na_Zaru_-_Konoba_Ivan_%2814929244641%29.jpg",
  "Fife":U+"5/58/A_specialty_of_Baranja%2C_Croatia_cuisine%2C_fish_paprikash.jpg/960px-A_specialty_of_Baranja%2C_Croatia_cuisine%2C_fish_paprikash.jpg",
  "Mirador Vidilica":U+"a/a6/Harbour%2C_Split_%28P1080940-Pano%29.jpg/960px-Harbour%2C_Split_%28P1080940-Pano%29.jpg",
  "Sustipan":U+"3/3a/Sustipan%2C_Split_20250101_01.jpg/960px-Sustipan%2C_Split_20250101_01.jpg",
  "Konoba Fetivi":U+"2/28/Crni_Rizoto_-_Pizzeria_Desetka_%2814848569142%29.jpg/960px-Crni_Rizoto_-_Pizzeria_Desetka_%2814848569142%29.jpg",
  "Dvor":U+"7/73/Ostuni_-_Borgo_Antico_Bistrot_-_1.jpg/960px-Ostuni_-_Borgo_Antico_Bistrot_-_1.jpg",
  "Bajamonti":U+"8/8a/Prokurative%2C_Split.jpg/960px-Prokurative%2C_Split.jpg",
  "Academia Ghetto Club":U+"9/91/20250926_Colorplus-003_Split_%28kulturno-povijesna_cjelina%29.jpg/960px-20250926_Colorplus-003_Split_%28kulturno-povijesna_cjelina%29.jpg",
  "Charlie's Bar":U+"7/74/Bar_at_The_Fox_pub.jpg/960px-Bar_at_The_Fox_pub.jpg",
  "To je tinTo (vinos)":U+"1/18/Dana_with_wine_glass_-_French_Quarter_bar%2C_June_2010.jpg/960px-Dana_with_wine_glass_-_French_Quarter_bar%2C_June_2010.jpg",
  "Carpe Diem (Hvar)":U+"8/84/Aerial_image_of_Hvar_%28view_from_the_south%29.jpg/960px-Aerial_image_of_Hvar_%28view_from_the_south%29.jpg",
  "Central The Club":CLUB1,"Vanilla Club":CLUB2,
  // Seúl
  "Café Onion Anguk":U+"c/c5/Almond_Danish_-_Jacob%27s_Bakery_%2B_Cafe_2025-09-10.jpg/960px-Almond_Danish_-_Jacob%27s_Bakery_%2B_Cafe_2025-09-10.jpg",
  "Isaac Toast":U+"6/63/Bacon_egg_roll_toast.jpg/960px-Bacon_egg_roll_toast.jpg",
  "Palacio Gyeongbokgung":U+"6/63/%EA%B4%91%ED%99%94%EB%AC%B8_%EC%9B%94%EB%8C%80.jpg/960px-%EA%B4%91%ED%99%94%EB%AC%B8_%EC%9B%94%EB%8C%80.jpg",
  "Bukchon Hanok Village":U+"4/41/Bukchon-ro_11-gil_street_with_hanok_houses_at_blue_hour_in_Bukchon_Hanok_Village_Seoul.jpg/960px-Bukchon-ro_11-gil_street_with_hanok_houses_at_blue_hour_in_Bukchon_Hanok_Village_Seoul.jpg",
  "Changdeokgung y Jardín Secreto":U+"c/cd/Changdeokgung_Huwon.jpg/960px-Changdeokgung_Huwon.jpg",
  "Templo Jogyesa":U+"6/6c/Korea-Seoul-Jogyesa_lanterns_2183-06.JPG/960px-Korea-Seoul-Jogyesa_lanterns_2183-06.JPG",
  "Torre N de Seúl (Namsan)":U+"6/61/N-Seoul_tower_from_Itaewon_bridge_pinhole.jpg/960px-N-Seoul_tower_from_Itaewon_bridge_pinhole.jpg",
  "Insadong":U+"4/45/Korea-Seoul-Insadong-tea_set.jpg/960px-Korea-Seoul-Insadong-tea_set.jpg",
  "Dongdaemun DDP":U+"c/c9/20240601_144028_Dongdaemun_Design_Plaza%2C_Seoul_08.jpg/960px-20240601_144028_Dongdaemun_Design_Plaza%2C_Seoul_08.jpg",
  "Senderismo en Bukhansan":U+"3/34/Bukansan_Area_%281%29.jpg/960px-Bukansan_Area_%281%29.jpg",
  "Mercado Gwangjang":U+"9/94/Gwangjang_Market%2C_Seoul_01.jpg/960px-Gwangjang_Market%2C_Seoul_01.jpg",
  "Tosokchon Samgyetang":U+"1/11/KOCIS_Korea_Malbok_Samgyetang_03_%289493375058%29.jpg/960px-KOCIS_Korea_Malbok_Samgyetang_03_%289493375058%29.jpg",
  "Río Han en Banpo":U+"b/b6/Banpo_Bridge-1.jpg/960px-Banpo_Bridge-1.jpg",
  "Muralla de Naksan":U+"f/f9/20240601_144028_Naksan_Park_sign_-_Seoul_03.jpg/960px-20240601_144028_Naksan_Park_sign_-_Seoul_03.jpg",
  "Myeongdong Kyoja":U+"e/e3/Bajirak-kal-guksu_1.jpg/960px-Bajirak-kal-guksu_1.jpg",
  "Bares de Hongdae":U+"e/e5/Seoul_Nightview%282009%29.jpg/960px-Seoul_Nightview%282009%29.jpg",
  "Bar de makgeolli (Insadong)":U+"5/50/Geumjeongsanseong_Makgeolli_03.jpg/960px-Geumjeongsanseong_Makgeolli_03.jpg",
  "Octagon (Gangnam)":CLUB1,"Cakeshop (Itaewon)":CLUB4,"NB2 (Hongdae)":CLUB3,"Soap Seoul (Gangnam)":CLUB2,
  // Lisboa
  "Manteigaria":U+"4/41/%22Pastel_de_Nata%22_coffeshop_%2847995593217%29.jpg/960px-%22Pastel_de_Nata%22_coffeshop_%2847995593217%29.jpg",
  "Fábrica Coffee Roasters":U+"e/eb/Aeropress_brew_at_Copenhagen_Coffee_Lab_%2821745775654%29.jpg/960px-Aeropress_brew_at_Copenhagen_Coffee_Lab_%2821745775654%29.jpg",
  "Tranvía 28 por Alfama":U+"2/29/Interlaced_tram_tracks_in_Alfama%2C_Lisbon.jpg/960px-Interlaced_tram_tracks_in_Alfama%2C_Lisbon.jpg",
  "LX Factory":"https://upload.wikimedia.org/wikipedia/commons/6/6e/LX_Factory_Lisbon_%2843450748850%29.jpg",
  "Elevador de Santa Justa":"https://upload.wikimedia.org/wikipedia/commons/c/c0/Elevador_de_Santa_Justa_from_Rua_de_Santa_Justa.jpg",
  "Oceanário de Lisboa":U+"1/17/Lisboa_June_2014-8a.jpg/960px-Lisboa_June_2014-8a.jpg",
  "Excursión a Sintra":"https://upload.wikimedia.org/wikipedia/commons/7/74/Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg",
  "Time Out Market":U+"5/5a/Deya_at_Time_Out_Market_Lisbon_%2827952142297%29.jpg/960px-Deya_at_Time_Out_Market_Lisbon_%2827952142297%29.jpg",
  "Cervejaria Ramiro":U+"2/2e/Cervejaria_Ramiro_%2828112895727%29.jpg/960px-Cervejaria_Ramiro_%2828112895727%29.jpg",
  "Cena con fado en Alfama":U+"5/5f/Fado%2C_no_O_Baiuca_%282615634375%29.jpg/960px-Fado%2C_no_O_Baiuca_%282615634375%29.jpg",
  "Miradouro da Senhora do Monte":U+"a/a3/BAR000273_-_Miradouro_da_Senhora_do_Monte.jpg/960px-BAR000273_-_Miradouro_da_Senhora_do_Monte.jpg",
  "Miradouro de Santa Catarina":U+"9/9b/2026-01-16_A_view_from_Miradouro_de_Santa_Catarina%2C_Lisbon.jpg/960px-2026-01-16_A_view_from_Miradouro_de_Santa_Catarina%2C_Lisbon.jpg",
  "Miradouro de São Pedro de Alcântara":U+"5/59/2026-01-16_View_from_Miradouro_de_S%C3%A3o_Pedro_de_Alc%C3%A2ntara.jpg/960px-2026-01-16_View_from_Miradouro_de_S%C3%A3o_Pedro_de_Alc%C3%A2ntara.jpg",
  "Pink Street (Cais do Sodré)":U+"8/8b/Lisbon_-_Cais_de_Sodre_%2852909498382%29.jpg/960px-Lisbon_-_Cais_de_Sodre_%2852909498382%29.jpg",
  "Pensão Amor":U+"7/77/Gu%C3%A9ridon_D_Amour_Table_Of_Love_%2847472186%29.jpeg/960px-Gu%C3%A9ridon_D_Amour_Table_Of_Love_%2847472186%29.jpeg",
  "Bairro Alto de bares":U+"5/53/Back_to_Bairro_Alto_at_night_-_panoramio.jpg/960px-Back_to_Bairro_Alto_at_night_-_panoramio.jpg",
  "Lux Frágil":"https://upload.wikimedia.org/wikipedia/commons/3/3b/03.LuxFragil.jpg",
  "Musicbox (Cais do Sodré)":CLUB1,"Ministerium Club":CLUB2,
  // Praga
  "Café Louvre":U+"9/9c/Caf%C3%A9_Louvre_interi%C3%A9r2.jpg/960px-Caf%C3%A9_Louvre_interi%C3%A9r2.jpg",
  "Puente de Carlos al amanecer":U+"1/10/Charles_Bridge_Covid.jpg/960px-Charles_Bridge_Covid.jpg",
  "Castillo de Praga y San Vito":U+"4/42/Castillo_de_Praga%2C_Praga%2C_Rep%C3%BAblica_Checa%2C_2022-07-01%2C_DD_23-25_HDR.jpg/960px-Castillo_de_Praga%2C_Praga%2C_Rep%C3%BAblica_Checa%2C_2022-07-01%2C_DD_23-25_HDR.jpg",
  "Reloj astronómico":U+"7/71/2015_Zegar_astronomiczny_w_Pradze_01.jpg/960px-2015_Zegar_astronomiczny_w_Pradze_01.jpg",
  "Barrio judío (Josefov)":U+"0/07/Old_Jewish_Cemetery_in_Josefov%2C_Prague_-_8363.jpg/960px-Old_Jewish_Cemetery_in_Josefov%2C_Prague_-_8363.jpg",
  "Colina y torre de Petřín":U+"3/3b/20190817_View_of_Prague_Castle_from_Pet%C5%99%C3%ADn_1345_5542.jpg/960px-20190817_View_of_Prague_Castle_from_Pet%C5%99%C3%ADn_1345_5542.jpg",
  "Casa Danzante":U+"f/f7/Casa_Danzante%2C_Praga%2C_Rep%C3%BAblica_Checa%2C_2022-07-01%2C_DD_01.jpg/960px-Casa_Danzante%2C_Praga%2C_Rep%C3%BAblica_Checa%2C_2022-07-01%2C_DD_01.jpg",
  "Muro de John Lennon":U+"2/27/John_Lennon_Wall_Prague_005.jpg/960px-John_Lennon_Wall_Prague_005.jpg",
  "Cervecería U Fleků":U+"7/7a/CZE_Prague%2C_U_Fleku_001.jpg/960px-CZE_Prague%2C_U_Fleku_001.jpg",
  "Hemingway Bar":U+"8/89/2016-04-06_18-22-55_ILCE-6000_DSC06933_DxO_Redo_PL4_%2850679464978%29.jpg/960px-2016-04-06_18-22-55_ILCE-6000_DSC06933_DxO_Redo_PL4_%2850679464978%29.jpg",
  "Karlovy Lázně":CLUB1,"Roxy":CLUB3,"Lucerna Music Bar":CLUB4,
  // Roma
  "Pasticcería Regoli (maritozzo)":U+"8/8a/Maritozzi_Gelateria_Mam%C3%B2_1.jpg/960px-Maritozzi_Gelateria_Mam%C3%B2_1.jpg",
  "Coliseo y Foro Romano":U+"e/ee/Colosseum_and_Via_Sacra_%28Rome%29.jpg/960px-Colosseum_and_Via_Sacra_%28Rome%29.jpg",
  "Museos Vaticanos y Capilla Sixtina":U+"9/9e/%27Sistine_Chapel_ceiling%27_by_Michelangelo_JBU21.JPG/960px-%27Sistine_Chapel_ceiling%27_by_Michelangelo_JBU21.JPG",
  "Basílica de San Pedro":U+"5/51/IT2_11_12_St_Peters_Basilica_Rome_small.jpg/960px-IT2_11_12_St_Peters_Basilica_Rome_small.jpg",
  "Panteón de Agripa":U+"6/60/Above_main_altar%2C_Pantheon%2C_Rome%2C_Italy.jpg/960px-Above_main_altar%2C_Pantheon%2C_Rome%2C_Italy.jpg",
  "Fontana di Trevi":U+"d/db/Fontana_di_Trevi_di_notte.JPG/960px-Fontana_di_Trevi_di_notte.JPG",
  "Piazza di Spagna":U+"2/22/Spanish_Steps%2C_Rome%2C_September_1965.jpg/960px-Spanish_Steps%2C_Rome%2C_September_1965.jpg",
  "Galería Borghese":U+"5/5d/Ceiling_%22Council_of_the_Gods%22_in_Galleria_Borghese_%28Rome%29.jpg/960px-Ceiling_%22Council_of_the_Gods%22_in_Galleria_Borghese_%28Rome%29.jpg",
  "Castel Sant'Angelo":U+"b/b0/Castel_Sant%27Angelo%2C_Rome_-_panoramio.jpg/960px-Castel_Sant%27Angelo%2C_Rome_-_panoramio.jpg",
  "Trastevere (callejear)":U+"c/c5/Basilica-Santa-Maria-in-Trastevere-Rome-May-2009.jpg/960px-Basilica-Santa-Maria-in-Trastevere-Rome-May-2009.jpg",
  "Da Enzo al 29":U+"8/83/Pasta_alla_carbonara_Rome.jpg/960px-Pasta_alla_carbonara_Rome.jpg",
  "Pizza al taglio en Bonci":U+"5/53/La_Renella_Pizza_%2815116570249%29.jpg/960px-La_Renella_Pizza_%2815116570249%29.jpg",
  "Gelato en Giolitti":U+"2/26/Enjoying_some_gelato.jpeg/960px-Enjoying_some_gelato.jpeg",
  "Jardín de los Naranjos":U+"8/8f/Dal_giardino_degli_aranci_-_tutta_roma.JPG/960px-Dal_giardino_degli_aranci_-_tutta_roma.JPG",
  "Atardecer en el Gianicolo":U+"4/41/20140803_Rome_View_from_Janiculum_0286.jpg/960px-20140803_Rome_View_from_Janiculum_0286.jpg",
  "Drink Kong":U+"5/53/Cocktails_Dreams_%2887408861%29.jpeg/960px-Cocktails_Dreams_%2887408861%29.jpeg",
  "Shari Vari Playhouse":CLUB2,"Goa Club":CLUB1,
  // Ámsterdam
  "Bakers & Roasters":U+"f/f4/Brunch_-_The_Wicked_Spoon.jpg/960px-Brunch_-_The_Wicked_Spoon.jpg",
  "Winkel 43 (apple pie)":U+"a/a6/Apple_cake_with_vanilla_ice_cream_2.jpg/960px-Apple_cake_with_vanilla_ice_cream_2.jpg",
  "Casa de Ana Frank":U+"3/31/Amsterdam_%28NL%29%2C_Anne-Frank-Huis%2C_2022_%281%29.jpg/960px-Amsterdam_%28NL%29%2C_Anne-Frank-Huis%2C_2022_%281%29.jpg",
  "Rijksmuseum":U+"f/f6/Amsterdam_Rijksmuseum_briques_041.JPG/960px-Amsterdam_Rijksmuseum_briques_041.JPG",
  "Museo Van Gogh":U+"8/80/Amandelbloesem_-_s0176V1962_-_Van_Gogh_Museum.jpg/960px-Amandelbloesem_-_s0176V1962_-_Van_Gogh_Museum.jpg",
  "Crucero por los canales de Ámsterdam":U+"a/a2/Amsterdam_20050827_%2843%29_canal_cruise.jpg/960px-Amsterdam_20050827_%2843%29_canal_cruise.jpg",
  "Vondelpark":U+"3/3b/Amsterdam%2C_Vondelpark%2C_at_the_pond-2.jpg/960px-Amsterdam%2C_Vondelpark%2C_at_the_pond-2.jpg",
  "Barrio Jordaan":U+"c/c1/Canal_%40_Jordaan_%40_Amsterdam_%2816634357530%29.jpg/960px-Canal_%40_Jordaan_%40_Amsterdam_%2816634357530%29.jpg",
  "Begijnhof":U+"5/54/Amsterdam_%28NL%29%2C_Begijnensteeg_--_2015_--_7207.jpg/960px-Amsterdam_%28NL%29%2C_Begijnensteeg_--_2015_--_7207.jpg",
  "Mercado de las flores":U+"f/f3/Amsterdam_Bloemenmarkt_2.JPG/960px-Amsterdam_Bloemenmarkt_2.JPG",
  "Excursión a Zaanse Schans":U+"9/96/2024_Windmills_in_Zaanse_Schans_gf31.jpg/960px-2024_Windmills_in_Zaanse_Schans_gf31.jpg",
  "Foodhallen":U+"d/d3/Foodhallen_in_Oud-West_%28Amsterdam%2C_The_Netherlands_2017%29_%2833534526834%29.jpg/960px-Foodhallen_in_Oud-West_%28Amsterdam%2C_The_Netherlands_2017%29_%2833534526834%29.jpg",
  "Cata de quesos Reypenaer":U+"9/90/Gatenkaas_%26_Zo_cheese_shop_during_nautical_twilight_%28DSC_3252%29.jpg/960px-Gatenkaas_%26_Zo_cheese_shop_during_nautical_twilight_%28DSC_3252%29.jpg",
  "A'DAM Lookout":U+"f/f4/A%27DAM_Lookout-01-Entry.jpg/960px-A%27DAM_Lookout-01-Entry.jpg",
  "Moeders":"https://upload.wikimedia.org/wikipedia/commons/7/73/Andijviestamppot.jpg",
  "Brouwerij 't IJ":U+"b/b4/Amsterdam_-_Molen_De_Gooijer.jpg/960px-Amsterdam_-_Molen_De_Gooijer.jpg",
  "Paradiso":U+"d/de/Amsterdam_Paradiso.jpg/960px-Amsterdam_Paradiso.jpg",
  "Melkweg":CLUB1,"Escape (Rembrandtplein)":CLUB2,
  // Berlín
  "Five Elephant":U+"7/79/Berries_cheese_cake_with_coffee.jpg/960px-Berries_cheese_cake_with_coffee.jpg",
  "Distrikt Coffee":U+"2/22/Brunch_Berlin.jpg/960px-Brunch_Berlin.jpg",
  "Markthalle Neun":U+"6/67/Berlin_Markthalle_IX_Schnitt.jpg/960px-Berlin_Markthalle_IX_Schnitt.jpg",
  "Puerta de Brandeburgo":U+"3/39/Brandenburg_Gate_-_Brandenburger_Tor_-_Berlin_-_Germany_-_01.jpg/960px-Brandenburg_Gate_-_Brandenburger_Tor_-_Berlin_-_Germany_-_01.jpg",
  "East Side Gallery":U+"6/61/Berlin_Wall_near_East_Side_Gallery.JPG/960px-Berlin_Wall_near_East_Side_Gallery.JPG",
  "Isla de los Museos":U+"9/9c/Berlin_-_Pergamonmuseum_-_Altar_01.jpg/960px-Berlin_-_Pergamonmuseum_-_Altar_01.jpg",
  "Memorial del Holocausto":U+"f/f0/Berlin%2C_Denkmal_f%C3%BCr_die_ermordeten_Juden_Europas_--_2011_--_2415.jpg/960px-Berlin%2C_Denkmal_f%C3%BCr_die_ermordeten_Juden_Europas_--_2011_--_2415.jpg",
  "Cúpula del Reichstag":U+"f/f5/Berlin_Reichstag_Building_%28Ank_Kumar%29_01.jpg/960px-Berlin_Reichstag_Building_%28Ank_Kumar%29_01.jpg",
  "Checkpoint Charlie":U+"5/54/Checkpoint_Charlie%2C_Berlin%2C_Germany_%28Ank_Kumar%29_03.jpg/960px-Checkpoint_Charlie%2C_Berlin%2C_Germany_%28Ank_Kumar%29_03.jpg",
  "Tempelhofer Feld":U+"8/8a/Aerial_view_of_Tempelhofer_Feld.jpg/960px-Aerial_view_of_Tempelhofer_Feld.jpg",
  "Catedral de Berlín":U+"8/84/141227_Berliner_Dom.jpg/960px-141227_Berliner_Dom.jpg",
  "Curry 36 (currywurst)":U+"c/c2/2023-01-23_Currywurst_in_Berlin.jpg/960px-2023-01-23_Currywurst_in_Berlin.jpg",
  "Burgermeister":"https://upload.wikimedia.org/wikipedia/commons/3/3a/Berlin_-_Vegan_Burger_%285016835955%29.jpg",
  "Crucero por el Spree":U+"5/54/River_cruise_on_the_Spree.jpg/960px-River_cruise_on_the_Spree.jpg",
  "Oberbaumbrücke":U+"2/21/Berlin%2C_Oberbaumbr%C3%BCcke_--_2011_--_2282.jpg/960px-Berlin%2C_Oberbaumbr%C3%BCcke_--_2011_--_2282.jpg",
  "Prater Garten":U+"4/4b/PRATERGARTEN_BIER_GARTEN_NEAR_TO_ELBERWALDER_STRASSE_U_BAHN_STATION_BERLIN_GERMANY_JUNE_2013_%289058790131%29.jpg/960px-PRATERGARTEN_BIER_GARTEN_NEAR_TO_ELBERWALDER_STRASSE_U_BAHN_STATION_BERLIN_GERMANY_JUNE_2013_%289058790131%29.jpg",
  "Monkey Bar":"https://upload.wikimedia.org/wikipedia/commons/5/51/Monkey_Bar%2C_the_rooftop_bar_at_25hours_Hotel_Bikini_Berlin.jpg",
  "Berghain / Panorama Bar":U+"6/6f/1_Berlin_Berghain_NYE_01.jpg/960px-1_Berlin_Berghain_NYE_01.jpg",
  "Tresor":CLUB1,"Jamboree":CLUB3,"Marula Café":CLUB2,"Opium Barcelona":CLUB4,"Granada 10":CLUB1,"Sisyphos":CLUB3,
  // París
  "Café de Flore":U+"f/ff/Cafe_de_Flore%2C_Boulevard_Saint_Germain%2C_Paris_%282%29.jpg/960px-Cafe_de_Flore%2C_Boulevard_Saint_Germain%2C_Paris_%282%29.jpg",
  "Pierre Hermé (macarons)":"https://upload.wikimedia.org/wikipedia/commons/5/52/A_selection_of_Pierre_Herm%C3%A9_pastry_creations.jpg",
  "Museo del Louvre":U+"2/28/Cour_Napol%C3%A9on_at_night_-_Louvre.jpg/960px-Cour_Napol%C3%A9on_at_night_-_Louvre.jpg",
  "Notre-Dame e Île de la Cité":U+"7/7f/Cath%C3%A9drale_Notre_Dame%2C_Paris_30_September_2015.jpg/960px-Cath%C3%A9drale_Notre_Dame%2C_Paris_30_September_2015.jpg",
  "Montmartre y Sacré-Cœur":U+"3/3f/Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg/960px-Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre_-_Paris_-_GT-01_-_2024.jpg",
  "Arco del Triunfo":U+"c/c4/Arc_Triomphe.jpg/960px-Arc_Triomphe.jpg",
  "Sainte-Chapelle":U+"0/02/Interior_of_Sainte-Chapelle%2C_Paris_28_April_2018.jpg/960px-Interior_of_Sainte-Chapelle%2C_Paris_28_April_2018.jpg",
  "Jardín de Luxemburgo":U+"1/16/Jardin_du_Luxembourg.JPG/960px-Jardin_du_Luxembourg.JPG",
  "L'As du Fallafel":U+"7/75/As_du_falafel_Paris_Le_Marais.jpg/960px-As_du_falafel_Paris_Le_Marais.jpg",
  "Bouillon Chartier":U+"2/25/Bouillon_Chartier_-2.JPG/960px-Bouillon_Chartier_-2.JPG",
  "Marché des Enfants Rouges":U+"b/b5/March%C3%A9_des_Enfants-Rouges%2C_Paris_July_2014.jpg/960px-March%C3%A9_des_Enfants-Rouges%2C_Paris_July_2014.jpg",
  "Chez Janou (Marais)":U+"1/17/Bistro_Burger%2C_53_Boulevard_du_Montparnasse%2C_75006_Paris%2C_France_002.jpg/960px-Bistro_Burger%2C_53_Boulevard_du_Montparnasse%2C_75006_Paris%2C_France_002.jpg",
  "Canal Saint-Martin":U+"7/7f/2022-04-14-Passerelle_de_la_Grange-aux-Belles-8583.jpg/960px-2022-04-14-Passerelle_de_la_Grange-aux-Belles-8583.jpg",
  "Rex Club":CLUB1,"La Machine du Moulin Rouge":CLUB2,"Badaboum":CLUB3,
  // Madrid
  "Chocolatería San Ginés":"https://upload.wikimedia.org/wikipedia/commons/7/79/At_San_Gines_again._One_of_the_oldest_chocolate_con_churros_in_Madrid_%2818761909709%29.jpg",
  "La Mallorquina":U+"0/0a/Napolitanas_de_Jam%C3%B3n_y_queso.JPG/960px-Napolitanas_de_Jam%C3%B3n_y_queso.JPG",
  "Museo del Prado":U+"6/66/Ampliaci%C3%B3n_del_Museo_del_Prado_%28Madrid%29_03.jpg/960px-Ampliaci%C3%B3n_del_Museo_del_Prado_%28Madrid%29_03.jpg",
  "Museo Reina Sofía":"https://upload.wikimedia.org/wikipedia/commons/1/1c/Guernica%21_-vacaciones_-naosabendoqueeraproibido_-fuilaefotografei_%2816710025638%29.jpg",
  "Parque del Retiro":U+"8/89/Palacio_de_Cristal%2C_Parque_del_Retiro%2C_Madrid%2C_Espa%C3%B1a%2C_2017-05-18%2C_DD_21.jpg/960px-Palacio_de_Cristal%2C_Parque_del_Retiro%2C_Madrid%2C_Espa%C3%B1a%2C_2017-05-18%2C_DD_21.jpg",
  "Plaza Mayor":U+"e/e6/Casa_de_la_Panader%C3%ADa%2C_Plaza_Mayor%2C_Madrid%2C_Spain.jpg/960px-Casa_de_la_Panader%C3%ADa%2C_Plaza_Mayor%2C_Madrid%2C_Spain.jpg",
  "Mercado de San Miguel":U+"a/a1/Mercado_de_San_Miguel%2C_Madrid_-_001.jpg/960px-Mercado_de_San_Miguel%2C_Madrid_-_001.jpg",
  "Estadio Santiago Bernabéu":U+"3/3c/Estadio_Santiago_Bernab%C3%A9u_-_01.jpg/960px-Estadio_Santiago_Bernab%C3%A9u_-_01.jpg",
  "Bocadillo de calamares":U+"9/99/BocadilloCalamaresAtocha.JPG/960px-BocadilloCalamaresAtocha.JPG",
  "Tapas en la Cava Baja":U+"1/1a/%28_Heineken%2C_a_glass_of_Heineken%2C_at_a_Tapas_bar_in_Madrid._behind_the_glass_of_Heineken_is_a_plate_of_tapas._%29.jpg/960px-%28_Heineken%2C_a_glass_of_Heineken%2C_at_a_Tapas_bar_in_Madrid._behind_the_glass_of_Heineken_is_a_plate_of_tapas._%29.jpg",
  "Casa Botín":U+"e/ec/2014_-_Sobrino_de_Bot%C3%ADn_%28Casa_Bot%C3%ADn%29_Restaurant%2C_Madrid%2C_Spain_%28_Ank_Kumar_%29_01.jpg/960px-2014_-_Sobrino_de_Bot%C3%ADn_%28Casa_Bot%C3%ADn%29_Restaurant%2C_Madrid%2C_Spain_%28_Ank_Kumar_%29_01.jpg",
  "Templo de Debod":U+"0/0c/Templo_de_Debod%2C_Madrid%2C_Espa%C3%B1a%2C_2014-12-27%2C_DD_01.JPG/960px-Templo_de_Debod%2C_Madrid%2C_Espa%C3%B1a%2C_2014-12-27%2C_DD_01.JPG",
  "Azotea del Círculo de Bellas Artes":U+"5/5e/Azotea_del_Circulo_de_Bellas_Artes%2C_Madrid.jpg/960px-Azotea_del_Circulo_de_Bellas_Artes%2C_Madrid.jpg",
  "Joy Eslava":U+"4/45/Joy_Eslava_%28Madrid%29_%28269195720%29.jpg/960px-Joy_Eslava_%28Madrid%29_%28269195720%29.jpg",
  "Teatro Kapital":CLUB1,"Fabrik":CLUB2,
  // Londres
  "The Breakfast Club":U+"f/f4/Full-English-North-Wales.jpg/960px-Full-English-North-Wales.jpg",
  "Dishoom":U+"0/0e/Naan_for_breakfast.jpg/960px-Naan_for_breakfast.jpg",
  "Big Ben y Westminster":U+"f/f7/Big_Ben_Elizabeth_Tower_London_2023_01.jpg/960px-Big_Ben_Elizabeth_Tower_London_2023_01.jpg",
  "British Museum":U+"e/e7/At_the_British_Museum_2024_005.jpg/960px-At_the_British_Museum_2024_005.jpg",
  "Torre de Londres":U+"d/df/Aerial_Tower_of_London.jpg/960px-Aerial_Tower_of_London.jpg",
  "London Eye":U+"1/1f/London%2C_London_Eye_--_2016_--_1445.jpg/960px-London%2C_London_Eye_--_2016_--_1445.jpg",
  "Tate Modern":U+"b/b8/London_-_Peter%27s_Hill_-_View_South_towards_Tate_Modern_%26_Millennium_Bridge.jpg/960px-London_-_Peter%27s_Hill_-_View_South_towards_Tate_Modern_%26_Millennium_Bridge.jpg",
  "Buckingham Palace":U+"b/b4/Buckingham_Palace%2C_London_-_April_2009.jpg/960px-Buckingham_Palace%2C_London_-_April_2009.jpg",
  "Notting Hill y Portobello":"https://upload.wikimedia.org/wikipedia/commons/3/36/Arundel_Gardens%2C_Notting_Hill_-_geograph.org.uk_-_1493963.jpg",
  "Tower Bridge":U+"9/93/HMS_Belfast_and_Tower_Bridge_before_sunrise.jpg/960px-HMS_Belfast_and_Tower_Bridge_before_sunrise.jpg",
  "Borough Market":"https://upload.wikimedia.org/wikipedia/commons/1/1f/Borough_Market%2C_London_-_geograph.org.uk_-_5472954.jpg",
  "Camden Market":"https://upload.wikimedia.org/wikipedia/commons/7/77/Camden_Lock_Market%2C_Camden_High_Street_-_geograph.org.uk_-_6555507.jpg",
  "Sky Garden":U+"3/3b/Sky_Garden%2C_London_-_2015-01-13_%283%29.jpg/960px-Sky_Garden%2C_London_-_2015-01-13_%283%29.jpg",
  "Primrose Hill":"https://upload.wikimedia.org/wikipedia/commons/a/a6/High_above_London_at_Primrose_Hill_NW1_-_geograph.org.uk_-_3600633.jpg",
  "Sunday roast en un pub histórico":U+"2/25/A_roast_beef_dinner_at_The_Queen%27s_Head%2C_Boreham%2C_Essex%2C_England_-_lighter.jpg/960px-A_roast_beef_dinner_at_The_Queen%27s_Head%2C_Boreham%2C_Essex%2C_England_-_lighter.jpg",
  "Pubs del Soho":U+"f/f8/Dog_and_Duck%2C_Soho%2C_London_%283860401078%29.jpg/960px-Dog_and_Duck%2C_Soho%2C_London_%283860401078%29.jpg",
  "Nightjar":CLUB4,"Fabric":CLUB1,"Ministry of Sound":CLUB2,"XOYO":CLUB3,
  // Atenas
  "Acrópolis y Partenón":U+"2/25/Acropolis_Parthenon_Athens_Greece.jpg/960px-Acropolis_Parthenon_Athens_Greece.jpg",
  "Museo de la Acrópolis":U+"a/a9/Acropolis_-_Museum_Interior.JPG/960px-Acropolis_-_Museum_Interior.JPG",
  "Ágora antigua":U+"d/db/Archaeological_site_of_the_Ancient_Agora_of_Athens._Ancient_gravestones_on_the_back_side_of_the_Temple_of_Hephaestus.jpg/960px-Archaeological_site_of_the_Ancient_Agora_of_Athens._Ancient_gravestones_on_the_back_side_of_the_Temple_of_Hephaestus.jpg",
  "Plaka":U+"d/d6/2016-08-03_Greece%2C_Athens%2C_Plaka_DSC_9733_DxO_1.jpg/960px-2016-08-03_Greece%2C_Athens%2C_Plaka_DSC_9733_DxO_1.jpg",
  "Monastiraki":U+"4/42/2018-07-25_Monastiraki_Square%2C_Athens.jpg/960px-2018-07-25_Monastiraki_Square%2C_Athens.jpg",
  "Colina Licabeto":U+"d/d1/Lycabettus_hill_from_Acropolis_Athens_Greece.jpg/960px-Lycabettus_hill_from_Acropolis_Athens_Greece.jpg",
  "Templo de Zeus Olímpico":U+"b/b0/Attica_06-13_Athens_25_Olympian_Zeus_Temple.jpg/960px-Attica_06-13_Athens_25_Olympian_Zeus_Temple.jpg",
  "Cambio de guardia (Syntagma)":U+"6/6a/Change_of_guards_by_the_Evzones_in_Syntagma%2C_Athens.jpg/960px-Change_of_guards_by_the_Evzones_in_Syntagma%2C_Athens.jpg",
  "Excursión a Cabo Sunión":U+"3/3e/Attica_06-13_Sounion_19_Temple_of_Poseidon.jpg/960px-Attica_06-13_Sounion_19_Temple_of_Poseidon.jpg",
  "Souvlaki en Monastiraki":U+"2/27/Chicken_souvlaki_pita_with_french_fries.jpg/960px-Chicken_souvlaki_pita_with_french_fries.jpg",
  "Rooftop con vistas a la Acrópolis":U+"a/a3/Atenas%2C_Anafiotika_01.jpg/960px-Atenas%2C_Anafiotika_01.jpg",
  "Six d.o.g.s":CLUB1,"Lohan Nightclub":CLUB2,"Bolivar Beach Bar":CLUB3,
  // Viena
  "Café Central":"https://upload.wikimedia.org/wikipedia/commons/9/94/Cafe_Central%2C_Vienna%2C_Austria_-_Sarah_Stierch.jpg",
  "Café Sacher (Sachertorte)":U+"f/f7/Birthday_cake_-_sachertorte_and_coloured_candies.jpg/960px-Birthday_cake_-_sachertorte_and_coloured_candies.jpg",
  "Palacio de Schönbrunn":U+"6/60/Palacio_de_Sch%C3%B6nbrunn%2C_Viena%2C_Austria%2C_2020-02-02%2C_DD_07-09_HDR.jpg/960px-Palacio_de_Sch%C3%B6nbrunn%2C_Viena%2C_Austria%2C_2020-02-02%2C_DD_07-09_HDR.jpg",
  "Catedral de San Esteban":U+"e/ed/St._Stephen%27s_Cathedral-pulpit.jpg/960px-St._Stephen%27s_Cathedral-pulpit.jpg",
  "Palacio de Hofburg":U+"2/2a/Michaelertrakt%2C_Hofburg%2C_Viena%2C_Austria%2C_2020-01-31%2C_DD_08-10_PAN.jpg/960px-Michaelertrakt%2C_Hofburg%2C_Viena%2C_Austria%2C_2020-01-31%2C_DD_08-10_PAN.jpg",
  "Belvedere (El Beso de Klimt)":U+"3/31/Belvedere%2C_Vienna_September_2016.jpg/960px-Belvedere%2C_Vienna_September_2016.jpg",
  "Ópera de Viena":U+"b/b3/20171231_Vienna_state_opera_by_night_D20_5869.jpg/960px-20171231_Vienna_state_opera_by_night_D20_5869.jpg",
  "Hundertwasserhaus":U+"4/4b/Wien%2C_Hundertwasserhaus_--_2018_--_3166.jpg/960px-Wien%2C_Hundertwasserhaus_--_2018_--_3166.jpg",
  "Figlmüller (schnitzel)":U+"f/f1/Authentic_Wiener_Schnitzel%2C_Vienna%2C_Austria_%2822463648757%29.jpg/960px-Authentic_Wiener_Schnitzel%2C_Vienna%2C_Austria_%2822463648757%29.jpg",
  "Würstelstand":U+"6/68/Authentic_Wiener_W%C3%BCrstelstand_-_next_to_Spittelau_Subway.jpg/960px-Authentic_Wiener_W%C3%BCrstelstand_-_next_to_Spittelau_Subway.jpg",
  "Noria del Prater":U+"7/7b/Prater_Turm_Riesenrad_Wien_Vienna.jpg/960px-Prater_Turm_Riesenrad_Wien_Vienna.jpg",
  "Heuriger en Grinzing":U+"d/d6/Hietzinger_Heuriger.jpg/960px-Hietzinger_Heuriger.jpg",
  "Flex":U+"e/e7/Flex_nacht_DRI.jpg/960px-Flex_nacht_DRI.jpg",
  "Pratersauna":CLUB1,"Volksgarten":CLUB2,
  // Dublín
  "Full Irish breakfast":U+"b/b1/Breakfast_Roll.jpg/960px-Breakfast_Roll.jpg",
  "Trinity College y Book of Kells":U+"3/32/Biblioth%C3%A8que_de_Trinity_College.jpg/960px-Biblioth%C3%A8que_de_Trinity_College.jpg",
  "Castillo de Dublín":U+"0/05/Chapel_Royal_360x180%2C_Dublin_Castle%2C_Dublin%2C_Ireland_-_Diliff.jpg/960px-Chapel_Royal_360x180%2C_Dublin_Castle%2C_Dublin%2C_Ireland_-_Diliff.jpg",
  "Catedral de San Patricio":U+"8/86/Ireland_Dublin_St._Patrick%27s_Cathedral_BW_2025-09-15_16-37-33.jpg/960px-Ireland_Dublin_St._Patrick%27s_Cathedral_BW_2025-09-15_16-37-33.jpg",
  "Guinness Storehouse":U+"2/26/Dublin_-_Guinness_Storehouse_-_20160507154359.jpg/960px-Dublin_-_Guinness_Storehouse_-_20160507154359.jpg",
  "Temple Bar":U+"1/1c/2008-05-23_The_Temple_Bar%2C_Dublin%2C_Ireland.jpg/960px-2008-05-23_The_Temple_Bar%2C_Dublin%2C_Ireland.jpg",
  "Cárcel de Kilmainham":U+"4/48/Dublin_kilmainham_gaol_cells_hall.JPG/960px-Dublin_kilmainham_gaol_cells_hall.JPG",
  "Excursión a los acantilados de Moher":U+"6/6a/Cliffs_of_Moher_20160818-1.jpg/960px-Cliffs_of_Moher_20160818-1.jpg",
  "Irish stew en un gastropub":U+"d/d8/Irish_Beef_Stew_%2834046928633%29.jpg/960px-Irish_Beef_Stew_%2834046928633%29.jpg",
  "Leo Burdock (fish and chips)":U+"d/dc/Egg_and_chips_or_fish_and_chips_-_geograph.org.uk_-_4060739.jpg/960px-Egg_and_chips_or_fish_and_chips_-_geograph.org.uk_-_4060739.jpg",
  "Ha'penny Bridge":U+"d/d4/Dublin_-_Ha%27penny_Bridge_-_20141216112726.jpg/960px-Dublin_-_Ha%27penny_Bridge_-_20141216112726.jpg",
  "Howth (paseo costero)":"https://upload.wikimedia.org/wikipedia/commons/6/66/Cliffs_on_Howth_-_geograph.org.uk_-_520849.jpg",
  "The Long Hall":U+"7/79/Doheny_%5E_Nesbitt_-_geograph.org.uk_-_6414967.jpg/960px-Doheny_%5E_Nesbitt_-_geograph.org.uk_-_6414967.jpg",
  "Copper Face Jacks":U+"4/40/Club_Nassau%2C_Dublin%2C_October_2010.JPG/960px-Club_Nassau%2C_Dublin%2C_October_2010.JPG",
  "The Academy":CLUB1,"Whelan's":CLUB4,
  // Copenhague
  "Nyhavn":U+"8/84/2018_-_Nyhavn_on_sunset.jpg/960px-2018_-_Nyhavn_on_sunset.jpg",
  "La Sirenita":U+"7/74/Expo_2010_Denmark_Pavilion-_Little_Mermaid_Statue_from_Copenhagen_Harbor_01.jpg/960px-Expo_2010_Denmark_Pavilion-_Little_Mermaid_Statue_from_Copenhagen_Harbor_01.jpg",
  "Palacio de Amalienborg":U+"e/ea/Amalienborg%2C_Copenhagen%2C_20220616_1917_6593.jpg/960px-Amalienborg%2C_Copenhagen%2C_20220616_1917_6593.jpg",
  "Jardines de Tivoli":U+"5/50/Fountain_in_Tivoli_Gardens%2C_Copenhagen%2C_20220618_1307_7156.jpg/960px-Fountain_in_Tivoli_Gardens%2C_Copenhagen%2C_20220618_1307_7156.jpg",
  "Castillo de Rosenborg":U+"8/88/Copenhagen%2C_view_from_Rundet%C3%A5rn_with_Rosenborg_Castle%2C_20220617_1004_6716.jpg/960px-Copenhagen%2C_view_from_Rundet%C3%A5rn_with_Rosenborg_Castle%2C_20220617_1004_6716.jpg",
  "Christiania":U+"8/8a/Christiania_exit.jpg/960px-Christiania_exit.jpg",
  "Torre Redonda (Rundetaarn)":U+"0/07/Art_exhibit_in_The_Round_Tower%2C_Copenhagen%2C_Denmark_%289280356975%29.jpg/960px-Art_exhibit_in_The_Round_Tower%2C_Copenhagen%2C_Denmark_%289280356975%29.jpg",
  "Iglesia de Nuestro Salvador":U+"0/09/Church_of_Our_Saviour%2C_Copenhagen_%284238352129%29.jpg/960px-Church_of_Our_Saviour%2C_Copenhagen_%284238352129%29.jpg",
  "Torvehallerne (mercado)":U+"6/6c/Blick_auf_die_Markthallen.jpg/960px-Blick_auf_die_Markthallen.jpg",
  "Smørrebrød tradicional":U+"9/90/Sm%C3%B8rrebr%C3%B8d_1.jpg/960px-Sm%C3%B8rrebr%C3%B8d_1.jpg",
  "Reffen street food":U+"6/63/Reffen_Copenhagen_360%C2%B0.jpg/960px-Reffen_Copenhagen_360%C2%B0.jpg",
  "Crucero por los canales (Nyhavn)":U+"1/1e/Canal_Tours_in_Nyhavn_08.jpg/960px-Canal_Tours_in_Nyhavn_08.jpg",
  "CopenHill":U+"9/9b/Amager_Bakke.jpg/960px-Amager_Bakke.jpg",
  "Bares de Meatpacking (Kødbyen)":U+"4/4a/Antiguo_matadero_de_K%C3%B8dbyen_05.jpg/960px-Antiguo_matadero_de_K%C3%B8dbyen_05.jpg",
  "Mikkeller":U+"1/19/Billy_Franks_Craft_Beer_and_Snack_Shack%2C_Bermondsey_2025-08-30.jpg/960px-Billy_Franks_Craft_Beer_and_Snack_Shack%2C_Bermondsey_2025-08-30.jpg",
  "Culture Box":CLUB1,"Vega":CLUB2,"Rust":CLUB3,
  // Estambul
  "Palacio de Topkapi":U+"b/b6/Chamber_of_the_Holy_Mantle_in_Topkap%C4%B1_Palace%2C_Istanbul%2C_Turkey_001.jpg/960px-Chamber_of_the_Holy_Mantle_in_Topkap%C4%B1_Palace%2C_Istanbul%2C_Turkey_001.jpg",
  "Cisterna Basílica":U+"8/87/Basilica_Cistern%2C_Istanbul%2C_20260606_1539_1631.jpg/960px-Basilica_Cistern%2C_Istanbul%2C_20260606_1539_1631.jpg",
  "Bazar de las Especias":U+"e/e1/Spices_on_Spice_Bazaar_in_Istanbul_02.jpg/960px-Spices_on_Spice_Bazaar_in_Istanbul_02.jpg",
  "Torre de Gálata":U+"2/21/20101106_Galata_Tower_Istanbul_Turkey_Panorama.jpg/960px-20101106_Galata_Tower_Istanbul_Turkey_Panorama.jpg",
  "Barrio de Balat":U+"1/15/Balat_houses.jpg/960px-Balat_houses.jpg",
  "Gran Bazar":U+"8/88/Grand_Bazaar%2C_Istanbul%2C_Turkey_%28Ank_Kumar%29_01.jpg/960px-Grand_Bazaar%2C_Istanbul%2C_Turkey_%28Ank_Kumar%29_01.jpg",
  "Kebab / döner":U+"d/d9/Doner_Kebab%2C_sols_carn_i_lletuga..jpg/960px-Doner_Kebab%2C_sols_carn_i_lletuga..jpg",
  "Balık ekmek (Eminönü)":U+"3/3f/Balik_ekmek_Galata_Bridge.JPG/960px-Balik_ekmek_Galata_Bridge.JPG",
  "Torre de Gálata al atardecer":U+"8/85/Bozdo%C4%9Fan_Kemeri_y%C3%B6n%C3%BCnden_%C3%A7ekilmi%C5%9F_Galata_Kulesi_manzaras%C4%B1.jpg/960px-Bozdo%C4%9Fan_Kemeri_y%C3%B6n%C3%BCnden_%C3%A7ekilmi%C5%9F_Galata_Kulesi_manzaras%C4%B1.jpg",
  "Crucero por el Bósforo":U+"5/50/Cruise_ship_Celestyal_Journey_entering_Istanbul_through_the_Bosphorus_from_the_south%2C_March_2024_01.jpg/960px-Cruise_ship_Celestyal_Journey_entering_Istanbul_through_the_Bosphorus_from_the_south%2C_March_2024_01.jpg",
  "Klein Phonotheque":CLUB1,"Sortie (Bósforo)":CLUB2,"Babylon":CLUB3,
  // Edimburgo
  "Scottish breakfast":U+"f/fc/A_Full_Day_Breakfast_from_Milk_Cafe.jpg/960px-A_Full_Day_Breakfast_from_Milk_Cafe.jpg",
  "Castillo de Edimburgo":U+"6/6c/Edinburgh_Castle_-_A_-_Sarah_Stierch.jpg/960px-Edinburgh_Castle_-_A_-_Sarah_Stierch.jpg",
  "Palacio de Holyrood":U+"e/ed/Edinburgh_Holyrood_Palace-20110904-RM-130303.jpg/960px-Edinburgh_Holyrood_Palace-20110904-RM-130303.jpg",
  "Dean Village":U+"6/6e/Buildings_in_Dean_Village%2C_Edinburgh_03.jpg/960px-Buildings_in_Dean_Village%2C_Edinburgh_03.jpg",
  "Victoria Street (Harry Potter)":U+"0/07/City_of_Edinburgh_-_34-38_Victoria_Street%2C_Edinburgh_-_20240928114118.jpg/960px-City_of_Edinburgh_-_34-38_Victoria_Street%2C_Edinburgh_-_20240928114118.jpg",
  "Excursión a las Highlands":"https://upload.wikimedia.org/wikipedia/commons/5/5c/A_view_of_Glencoe_-_geograph.org.uk_-_5022669.jpg",
  "Haggis, neeps & tatties":U+"b/bb/Haggis%2C_Neeps_and_Tatties.JPG/960px-Haggis%2C_Neeps_and_Tatties.JPG",
  "Fish and chips":U+"0/0d/Beachcomber_Fish_%5E_Chips_-_geograph.org.uk_-_7262503.jpg/960px-Beachcomber_Fish_%5E_Chips_-_geograph.org.uk_-_7262503.jpg",
  "Calton Hill":U+"a/aa/%2200_1426_Calton_Hill_-_Edinburgh%2C_Schottland.jpg/960px-%2200_1426_Calton_Hill_-_Edinburgh%2C_Schottland.jpg",
  "Arthur's Seat":U+"1/15/Arthur%27s_Seat_2023.jpg/960px-Arthur%27s_Seat_2023.jpg",
  "The Bow Bar (whisky)":U+"3/35/BON_ACCORD_REAL_ALE_AND_WHISKEY_PUB_NORTH_STREET_GLSGOW_SCOTLAND_SEP_2013_%289686512587%29.jpg/960px-BON_ACCORD_REAL_ALE_AND_WHISKEY_PUB_NORTH_STREET_GLSGOW_SCOTLAND_SEP_2013_%289686512587%29.jpg",
  "Pubs de Grassmarket":"https://upload.wikimedia.org/wikipedia/commons/d/da/Biddy_Mulligans_pub%2C_Grassmarket_-_geograph.org.uk_-_973375.jpg",
  "The Liquid Room":CLUB1,"Cabaret Voltaire":CLUB2,"Bongo Club":CLUB3,
  // Florencia
  "Cappuccino y cornetto (Ditta Artigianale)":U+"0/0c/Cornetto_e_cappuccino.jpg/960px-Cornetto_e_cappuccino.jpg",
  "Catedral (Duomo) y cúpula":U+"3/31/Cupola_Santa_Maria_del_Fiore.JPG/960px-Cupola_Santa_Maria_del_Fiore.JPG",
  "Galería de los Uffizi":U+"5/55/Ceiling_of_Uffizi_Gallery.jpg/960px-Ceiling_of_Uffizi_Gallery.jpg",
  "Ponte Vecchio":U+"1/1d/Fireworks_over_Ponte_Vecchio.JPG/960px-Fireworks_over_Ponte_Vecchio.JPG",
  "Galería de la Academia (David)":U+"f/fe/Bronze_replica_of_Michelangelo%27s_David_in_Florence.jpg/960px-Bronze_replica_of_Michelangelo%27s_David_in_Florence.jpg",
  "Palazzo Vecchio":U+"5/50/CoA_Fa%C3%A7ade_Palazzo_Vecchio_Florence.jpg/960px-CoA_Fa%C3%A7ade_Palazzo_Vecchio_Florence.jpg",
  "Jardines de Bóboli":U+"b/b2/Boboli_Gardens_Obelisk.jpg/960px-Boboli_Gardens_Obelisk.jpg",
  "Mercado de San Lorenzo":U+"b/ba/Florence_mercato_san_Lorenzo.jpg/960px-Florence_mercato_san_Lorenzo.jpg",
  "Bistecca alla fiorentina":U+"b/b4/Bistecca_alla_Fiorentina_%40_Firenze_01.jpg/960px-Bistecca_alla_Fiorentina_%40_Firenze_01.jpg",
  "Piazzale Michelangelo":U+"f/f9/Florence_Cathedral_seen_from_Piazzale_Michelangelo_dllu.jpg/960px-Florence_Cathedral_seen_from_Piazzale_Michelangelo_dllu.jpg",
  "Aperitivo en Santo Spirito":U+"0/0a/Exterior_view_of_Santo_Spirito_%28Florence%29_03.jpg/960px-Exterior_view_of_Santo_Spirito_%28Florence%29_03.jpg",
  "Space Club":CLUB1,"Tenax":CLUB2,"YAB":CLUB3,
  // Venecia
  "Caffè Florian":U+"d/d6/9624_-_Venezia_-_Caff%C3%A8_Florian_-_Foto_Giovanni_Dall%27Orto%2C_12-Aug-2007.jpg/960px-9624_-_Venezia_-_Caff%C3%A8_Florian_-_Foto_Giovanni_Dall%27Orto%2C_12-Aug-2007.jpg",
  "Puente de Rialto":U+"e/ed/Palazzo_dei_Camerlenghi_e_Ponte_Rialto_a_Venezia.jpg/960px-Palazzo_dei_Camerlenghi_e_Ponte_Rialto_a_Venezia.jpg",
  "Gran Canal en vaporetto":U+"9/91/0_Venise%2C_Vaporetto_naviguant_sur_le_Grand_Canal_.JPG/960px-0_Venise%2C_Vaporetto_naviguant_sur_le_Grand_Canal_.JPG",
  "Murano y Burano":U+"d/d7/Burano%2C_the_colorful_houses_on_the_Island_of_Venice%2C_Italy.jpg/960px-Burano%2C_the_colorful_houses_on_the_Island_of_Venice%2C_Italy.jpg",
  "Cicchetti en un bacaro":U+"4/42/%22_05_-_ITALY_-_un_bacaro_a_Venezia_Osteria_appetizers_restaurant_in_Venice_wine_enoteca.jpg/960px-%22_05_-_ITALY_-_un_bacaro_a_Venezia_Osteria_appetizers_restaurant_in_Venice_wine_enoteca.jpg",
  "Mercado de Rialto":U+"e/ef/Cuttlefish_eggs_at_the_Rialto_fish_market_%286295247114%29.jpg/960px-Cuttlefish_eggs_at_the_Rialto_fish_market_%286295247114%29.jpg",
  "Spritz en Campo Santa Margherita":U+"4/4f/Acqua_alta_in_Venice%2C_Campo_Santa_Margherita%2C_2019.jpg/960px-Acqua_alta_in_Venice%2C_Campo_Santa_Margherita%2C_2019.jpg",
  "Piccolo Mondo":CLUB1,"Il Muretto (Jesolo)":CLUB2,"Molocinque (Mestre)":CLUB3,
  // Oporto
  "Majestic Café":U+"2/29/Cafe_Majestic_in_Porto_%282%29.jpg/960px-Cafe_Majestic_in_Porto_%282%29.jpg",
  "Librería Lello":U+"6/6e/Exterior_view_of_Livraria_Lello_01.jpg/960px-Exterior_view_of_Livraria_Lello_01.jpg",
  "Torre dos Clérigos":U+"f/f0/2025-08-07_Porto%2C_Igreja_dos_Cl%C3%A9rigos.jpg/960px-2025-08-07_Porto%2C_Igreja_dos_Cl%C3%A9rigos.jpg",
  "Estación de São Bento":U+"d/d5/Azulejos_in_S%C3%A3o_Bento_train_station_01.jpg/960px-Azulejos_in_S%C3%A3o_Bento_train_station_01.jpg",
  "Ribeira":U+"1/16/Cais_da_Ribeira%2C_Porto%2C_Portugal.jpg/960px-Cais_da_Ribeira%2C_Porto%2C_Portugal.jpg",
  "Puente Don Luís I":U+"9/9e/Dom_Luis_I_bridge_from_Jardim_do_Morro_%281%29.jpg/960px-Dom_Luis_I_bridge_from_Jardim_do_Morro_%281%29.jpg",
  "Bodegas de Oporto (Gaia)":U+"c/c6/Port_casks_-_Vila_Nova_de_Gaia_banner.jpg/960px-Port_casks_-_Vila_Nova_de_Gaia_banner.jpg",
  "Palacio de la Bolsa":U+"8/8e/2025-08-07_Porto%2C_Pal%C3%A1cio_da_Bolsa.jpg/960px-2025-08-07_Porto%2C_Pal%C3%A1cio_da_Bolsa.jpg",
  "Francesinha":U+"3/33/FrancesinhaNoPorto.jpg/960px-FrancesinhaNoPorto.jpg",
  "Mercado do Bolhão":U+"3/3f/1_Mercado_do_Bolh%C3%A3o.jpg/960px-1_Mercado_do_Bolh%C3%A3o.jpg",
  "Jardim do Morro":U+"8/87/Jardim_do_Morro%2C_Vila_Nova_de_Gaia%2C_Portugal%2C_2012-05-09%2C_DD_02.JPG/960px-Jardim_do_Morro%2C_Vila_Nova_de_Gaia%2C_Portugal%2C_2012-05-09%2C_DD_02.JPG",
  "Crucero por el Duero":U+"c/c0/2014-P164_Douro_River_Cruise_%2815523971598%29.jpg/960px-2014-P164_Douro_River_Cruise_%2815523971598%29.jpg",
  "Maus Hábitos":CLUB1,"Plano B":CLUB2,"Gare Porto":CLUB3,
  // Cracovia
  "Café Bunkier":U+"c/cc/Bunkier_Cafe%2C_Krak%C3%B3w%2C_2024%2C_01.jpg/960px-Bunkier_Cafe%2C_Krak%C3%B3w%2C_2024%2C_01.jpg",
  "Castillo de Wawel":U+"f/f7/20200826_Wawel_i_Wis%C5%82a_w_Krakowie_1752_1334.jpg/960px-20200826_Wawel_i_Wis%C5%82a_w_Krakowie_1752_1334.jpg",
  "Barrio judío de Kazimierz":U+"3/3d/Alleyway_Used_as_Location_for_Schindler%27s_List_-_With_Stills_from_the_Film_-_Jewish_Quarter_of_Kazimierz_-_Krakow_-_Poland_%289195902716%29.jpg/960px-Alleyway_Used_as_Location_for_Schindler%27s_List_-_With_Stills_from_the_Film_-_Jewish_Quarter_of_Kazimierz_-_Krakow_-_Poland_%289195902716%29.jpg",
  "Excursión a Auschwitz-Birkenau":U+"a/a2/AuschwitzCampEntrance.jpg/960px-AuschwitzCampEntrance.jpg",
  "Minas de sal de Wieliczka":U+"7/73/Kopalnia_soli_Wieliczka_001.JPG/960px-Kopalnia_soli_Wieliczka_001.JPG",
  "Puerta de San Florián":U+"b/bb/20200516_Brama_Floria%C5%84ska_w_Krakowie_0911_9966.jpg/960px-20200516_Brama_Floria%C5%84ska_w_Krakowie_0911_9966.jpg",
  "Pierogi":"https://upload.wikimedia.org/wikipedia/commons/e/e9/Pierogi_01.jpg",
  "Zapiekanka (Plac Nowy)":U+"0/0c/Krak%C3%B3w_-_Endzior_%28Zapiekanki%29.jpg/960px-Krak%C3%B3w_-_Endzior_%28Zapiekanki%29.jpg",
  "Milk bar (bar mleczny)":U+"9/94/Bar_Mleczny_Przy_Rynku%2C_Jagiellonska_2%2C_80-371_Gdansk%2C_Polska_-_1.jpg/960px-Bar_Mleczny_Przy_Rynku%2C_Jagiellonska_2%2C_80-371_Gdansk%2C_Polska_-_1.jpg",
  "Montículo de Kościuszko":U+"5/58/Bust_of_Tadeusz_Ko%C5%9Bciuszko%2C_Ko%C5%9Bciuszko_Mound%2C_Krak%C3%B3w%2C_Poland%2C_2019.jpg/960px-Bust_of_Tadeusz_Ko%C5%9Bciuszko%2C_Ko%C5%9Bciuszko_Mound%2C_Krak%C3%B3w%2C_Poland%2C_2019.jpg",
  "Prozak 2.0":CLUB1,"Szpitalna 1":CLUB2,"Coco Music Club":CLUB3,
  // Estocolmo
  "Fika (kanelbulle)":"https://upload.wikimedia.org/wikipedia/commons/3/3f/Bread_Ahead_Bakery_Cinnamon_Buns.jpg",
  "Gamla Stan":U+"1/17/Alley_in_Gamla_Stan%2C_Stockholm.jpg/960px-Alley_in_Gamla_Stan%2C_Stockholm.jpg",
  "Palacio Real de Estocolmo":U+"8/8a/Culture_crawl_Stockholm_Royal_Castle.jpg/960px-Culture_crawl_Stockholm_Royal_Castle.jpg",
  "Museo Vasa":U+"d/d7/Lateral_view_of_the_Vasa_ship%2C_Vasa_Museum%2C_Stockholm%2C_Sweden_julesvernex2-3.jpg/960px-Lateral_view_of_the_Vasa_ship%2C_Vasa_Museum%2C_Stockholm%2C_Sweden_julesvernex2-3.jpg",
  "Ayuntamiento (Stadshuset)":U+"0/0b/Stockholm_City_Hall_February_2014_02.jpg/960px-Stockholm_City_Hall_February_2014_02.jpg",
  "Museo ABBA":U+"9/92/ABBA_Museum%2C_Djurg%C3%A5rdsv%C3%A4gen%2C_Stockholm%2C_Sweden.jpg/960px-ABBA_Museum%2C_Djurg%C3%A5rdsv%C3%A4gen%2C_Stockholm%2C_Sweden.jpg",
  "Fotografiska":U+"8/8e/Fotografiska%2C_seen_from_Str%C3%B6mmen.jpg/960px-Fotografiska%2C_seen_from_Str%C3%B6mmen.jpg",
  "Excursión por el archipiélago":U+"0/02/2009-07-16_Boat_trip_in_Stockholms_archipelago_05.jpg/960px-2009-07-16_Boat_trip_in_Stockholms_archipelago_05.jpg",
  "Albóndigas suecas (köttbullar)":U+"1/17/Holiday_Swedish_Meatballs.jpg/960px-Holiday_Swedish_Meatballs.jpg",
  "Östermalms Saluhall":U+"1/15/Stockholm_-_Ostermalms_saluhall_%283%29.JPG/960px-Stockholm_-_Ostermalms_saluhall_%283%29.JPG",
  "Monteliusvägen":U+"f/f6/Blick_vom_Monteliusv%C3%A4gen.jpg/960px-Blick_vom_Monteliusv%C3%A4gen.jpg",
  "Cena en Södermalm":U+"3/33/By_Nytorget_S%C3%B6dermalm_Stockholm_-_Flickr_-_chas679.jpg/960px-By_Nytorget_S%C3%B6dermalm_Stockholm_-_Flickr_-_chas679.jpg",
  "Trädgården":CLUB1,"Berns":CLUB2,"Under Bron":CLUB3,
  // Bruselas
  "Gofres de Maison Dandoy":"https://upload.wikimedia.org/wikipedia/commons/d/d5/Belgian_Waffle_Van.jpg",
  "Grand Place":U+"9/96/2018_flower_carpet_at_Grand_Place%2C_Brussels_%28DSCF6849%29.jpg/960px-2018_flower_carpet_at_Grand_Place%2C_Brussels_%28DSCF6849%29.jpg",
  "Manneken Pis":U+"6/64/Bruxelles_Manneken_Pis.jpg/960px-Bruxelles_Manneken_Pis.jpg",
  "Atomium":U+"4/4b/Atomium%2C_Bruselas%2C_B%C3%A9lgica%2C_2021-12-15%2C_DD_142-144_HDR.jpg/960px-Atomium%2C_Bruselas%2C_B%C3%A9lgica%2C_2021-12-15%2C_DD_142-144_HDR.jpg",
  "Museo Magritte":U+"b/bd/Art_Nouveau_interior_of_the_Magritte_Museum.jpg/960px-Art_Nouveau_interior_of_the_Magritte_Museum.jpg",
  "Galerías Saint-Hubert":U+"7/70/Galerie-_Royales-Saint-Hubert.jpg/960px-Galerie-_Royales-Saint-Hubert.jpg",
  "Parque del Cincuentenario":U+"d/de/Arch_in_Parc_du_cinquantenaire_%40_Brussels_%288177725784%29.jpg/960px-Arch_in_Parc_du_cinquantenaire_%40_Brussels_%288177725784%29.jpg",
  "Mont des Arts al atardecer":U+"d/dc/Brussels%2C_Jardin_du_Mont_des_Arts_foto5_2015-06-07_14.01.jpg/960px-Brussels%2C_Jardin_du_Mont_des_Arts_foto5_2015-06-07_14.01.jpg",
  "Moules-frites":U+"6/62/Belgo%2C_Clapham%2C_SW4_%283757788140%29.jpg/960px-Belgo%2C_Clapham%2C_SW4_%283757788140%29.jpg",
  "Frites (Maison Antoine)":U+"6/6a/Fretin_960_rue_du_chemin_vert_friterie.jpg/960px-Fretin_960_rue_du_chemin_vert_friterie.jpg",
  "Place du Grand Sablon":U+"1/13/49_place_du_Grand_Sablon_Bruxelles.jpg/960px-49_place_du_Grand_Sablon_Bruxelles.jpg",
  "Delirium Café":U+"2/2c/Belgium_beers_%28D%C3%A9lirium_Caf%C3%A9%29.002_-_Brussel.JPG/960px-Belgium_beers_%28D%C3%A9lirium_Caf%C3%A9%29.002_-_Brussel.JPG",
  "Fuse":CLUB1,"C12":CLUB2,"Bloody Louis":CLUB3,
  // Sevilla
  "Tostada con tomate y jamón":U+"5/51/Desayuno_con_jamon.jpg/960px-Desayuno_con_jamon.jpg",
  "Catedral y Giralda":U+"9/9f/Giralda_cath%C3%A9drale_tour_Seville_Espagne.jpg/960px-Giralda_cath%C3%A9drale_tour_Seville_Espagne.jpg",
  "Real Alcázar":U+"1/1b/Alc%C3%A1zar_Seville_April_2019-11.jpg/960px-Alc%C3%A1zar_Seville_April_2019-11.jpg",
  "Metropol Parasol (Setas)":U+"6/68/Metropol_Parasol%2C_Seville%2C_Spain_%2816502038801%29.jpg/960px-Metropol_Parasol%2C_Seville%2C_Spain_%2816502038801%29.jpg",
  "Torre del Oro":U+"3/3e/Canal_de_Alfonso_XIII_Torre_del_Oro_Sevilla.jpg/960px-Canal_de_Alfonso_XIII_Torre_del_Oro_Sevilla.jpg",
  "Triana":U+"8/8c/Puente_de_Triana%2C_Sevilla%2C_Espa%C3%B1a%2C_2015-12-06%2C_DD_67.JPG/960px-Puente_de_Triana%2C_Sevilla%2C_Espa%C3%B1a%2C_2015-12-06%2C_DD_67.JPG",
  "Parque de María Luisa":U+"f/f7/Lamp-Parque-de-Maria-Luisa-Seville.jpg/960px-Lamp-Parque-de-Maria-Luisa-Seville.jpg",
  "Tapas en Eslava":U+"1/1a/%28_Heineken%2C_a_glass_of_Heineken%2C_at_a_Tapas_bar_in_Madrid._behind_the_glass_of_Heineken_is_a_plate_of_tapas._%29.jpg/960px-%28_Heineken%2C_a_glass_of_Heineken%2C_at_a_Tapas_bar_in_Madrid._behind_the_glass_of_Heineken_is_a_plate_of_tapas._%29.jpg",
  "Paseo por el Guadalquivir":U+"4/40/Sevilla_R%C3%ADo_Guadalquivir_%2812173476815%29.jpg/960px-Sevilla_R%C3%ADo_Guadalquivir_%2812173476815%29.jpg",
  "Tablao flamenco con cena":U+"2/2f/El_Patio_Sevillano.jpg/960px-El_Patio_Sevillano.jpg",
  "Terrazas de la Alameda de Hércules":U+"b/b0/20110422_0917_alameda_hercules.jpg/960px-20110422_0917_alameda_hercules.jpg",
  "Bahía / Antique (Isla Cartuja)":CLUB1,"Boss":CLUB2,"Lo Nuestro":CLUB3,
  // Múnich
  "Weisswurst en Schneider Bräuhaus":U+"7/71/Wei%C3%9Fwurst-1.jpg/960px-Wei%C3%9Fwurst-1.jpg",
  "Marienplatz y el Glockenspiel":U+"7/73/Rathaus_and_Marienplatz_from_Peterskirche_-_August_2006.jpg/960px-Rathaus_and_Marienplatz_from_Peterskirche_-_August_2006.jpg",
  "Frauenkirche":U+"d/da/Frauenkirche_Munich_-_View_from_Peterskirche_Tower2.jpg/960px-Frauenkirche_Munich_-_View_from_Peterskirche_Tower2.jpg",
  "Residenz y el Antiquarium":U+"d/de/Antiquarium%2C_M%C3%BCnchner_Residenz.jpg/960px-Antiquarium%2C_M%C3%BCnchner_Residenz.jpg",
  "Jardín Inglés":U+"b/bc/Aerial_image_of_Englischer_Garten_in_Munich_%28view_from_the_southwest%29.jpg/960px-Aerial_image_of_Englischer_Garten_in_Munich_%28view_from_the_southwest%29.jpg",
  "Surfistas del Eisbach":U+"a/a3/Eisbach_Surfer2.JPG/960px-Eisbach_Surfer2.JPG",
  "Alte Pinakothek":U+"0/0d/Alte_Pinakothek_2009.jpg/960px-Alte_Pinakothek_2009.jpg",
  "Olympiapark y su torre":U+"d/d1/M%C3%BCnchen_-_Olympische_Bauten.jpg/960px-M%C3%BCnchen_-_Olympische_Bauten.jpg",
  "BMW Welt y Museo BMW":U+"c/ce/BMW_Welt%2C_M%C3%BAnich%2C_Alemania16.jpg/960px-BMW_Welt%2C_M%C3%BAnich%2C_Alemania16.jpg",
  "Palacio de Nymphenburg":U+"0/0b/Image-Schloss_Nymphenburg_Munich_CC_edit3.jpg/960px-Image-Schloss_Nymphenburg_Munich_CC_edit3.jpg",
  "Excursión a Neuschwanstein":U+"f/f8/Schloss_Neuschwanstein_2013.jpg/960px-Schloss_Neuschwanstein_2013.jpg",
  "Viktualienmarkt (puestos)":U+"6/64/Viktualienmarkt_-_Maibaum_%28Viktualienmarkt_Maypole%29_-_geograph.org.uk_-_7713.jpg/960px-Viktualienmarkt_-_Maibaum_%28Viktualienmarkt_Maypole%29_-_geograph.org.uk_-_7713.jpg",
  "Hofbräuhaus":U+"6/60/Hofbrauhaus.JPG/960px-Hofbrauhaus.JPG",
  "Augustiner Bräustuben":U+"a/ac/Munich_--_Augustiner_Braustuben_02.jpg/960px-Munich_--_Augustiner_Braustuben_02.jpg",
  "Torre de San Pedro (Alter Peter)":U+"b/b2/Alter_Peter_%26_Christkindlmarkt.jpg/960px-Alter_Peter_%26_Christkindlmarkt.jpg",
  "Biergarten de la Torre China":U+"c/cd/Munich_English_Gardens_-_Chinese_Tower_Beer_Garden_-_August_2006.jpg/960px-Munich_English_Gardens_-_Chinese_Tower_Beer_Garden_-_August_2006.jpg",
  "Monopteros al atardecer":U+"4/44/Monopteros%2C_Englischer_Garten%2C_Munich%2C_20251110_0835_6028.jpg/960px-Monopteros%2C_Englischer_Garten%2C_Munich%2C_20251110_0835_6028.jpg",
  "Kaufingerstraße y Sendlinger Straße":U+"8/86/Kaufingerstra%C3%9Fe_2014-08-02.JPG/960px-Kaufingerstra%C3%9Fe_2014-08-02.JPG",
  "Neues Rathaus desde Marienplatz":U+"c/c9/Neues_Rathaus_M%C3%BCnchen_2018.jpg/960px-Neues_Rathaus_M%C3%BCnchen_2018.jpg",
  "Blitz Club (electrónica)":CLUB1,"P1":CLUB2,"Pacha München":CLUB3,
  // Niza
  "Café con vistas en el Cours Saleya":U+"7/72/Cours_Saleya_-_Nice.jpg/960px-Cours_Saleya_-_Nice.jpg",
  "Paseo de los Ingleses":U+"b/ba/Promenade_des_Anglais_Nice_IMG_1255.jpg/960px-Promenade_des_Anglais_Nice_IMG_1255.jpg",
  "Colina del Castillo":U+"6/62/Nice_from_Castle_Hill_01.jpg/960px-Nice_from_Castle_Hill_01.jpg",
  "Museo Matisse":U+"3/3e/Mus%C3%A9e_Matisse_Nice.JPG/960px-Mus%C3%A9e_Matisse_Nice.JPG",
  "Museo Marc Chagall":U+"0/08/Mus%C3%A9e_Marc_Chagall.jpg/960px-Mus%C3%A9e_Marc_Chagall.jpg",
  "Plaza Masséna":U+"8/8b/Place-Mass%C3%A9na_01.jpg/960px-Place-Mass%C3%A9na_01.jpg",
  "Catedral rusa de San Nicolás":U+"d/d0/St_Nicholas_Cathedral_.Russian_Orthodox_Church_in_Nice.jpg/960px-St_Nicholas_Cathedral_.Russian_Orthodox_Church_in_Nice.jpg",
  "Èze y su jardín exótico":U+"c/ce/%C3%88ze_Alpes_Maritimes_France_%28261171069%29.jpeg/960px-%C3%88ze_Alpes_Maritimes_France_%28261171069%29.jpeg",
  "Villefranche-sur-Mer":U+"e/e4/Villefranche-s-Mer-VueSurLeVillage-20071102.jpg/960px-Villefranche-s-Mer-VueSurLeVillage-20071102.jpg",
  "Socca en Chez Pipo":U+"f/f0/Socca_a_Nice.jpg/960px-Socca_a_Nice.jpg",
  "Mercado del Cours Saleya":U+"7/72/Cours_Saleya_-_Nice.jpg/960px-Cours_Saleya_-_Nice.jpg",
  "Pan bagnat junto al puerto":U+"2/2b/Pan-bagnat002.jpg/960px-Pan-bagnat002.jpg",
  "Puerto Lympia al caer el sol":U+"0/0e/Nice_port.jpg/960px-Nice_port.jpg",
  "Avenue Jean Médecin":U+"0/0f/Avenue_Jean_Medecin.jpg/960px-Avenue_Jean_Medecin.jpg",
  "El damero de la Place Masséna":U+"8/8b/Place-Mass%C3%A9na_01.jpg/960px-Place-Mass%C3%A9na_01.jpg",
  "High Club":CLUB2,"Le Glam":CLUB1,
  // Milán
  "Duomo de Milán":U+"7/70/Milan_Cathedral_from_Piazza_del_Duomo.jpg/960px-Milan_Cathedral_from_Piazza_del_Duomo.jpg",
  "Terrazas del Duomo":U+"0/0e/Terrazze_del_Duomo_di_Milano_%2830521238480%29.jpg/960px-Terrazze_del_Duomo_di_Milano_%2830521238480%29.jpg",
  "Galleria Vittorio Emanuele II":U+"b/b6/Galleria_Milano_%28179532365%29.jpeg/960px-Galleria_Milano_%28179532365%29.jpeg",
  "La Última Cena":U+"8/83/Santa_Maria_delle_Grazie_Milan_2013.jpg/960px-Santa_Maria_delle_Grazie_Milan_2013.jpg",
  "Castillo Sforzesco y Parque Sempione":U+"6/66/Castello_Sforzesco_%28Milano%29_-_Torrione_di_Santo_Spirito.jpg/960px-Castello_Sforzesco_%28Milano%29_-_Torrione_di_Santo_Spirito.jpg",
  "Teatro alla Scala":U+"3/3f/Teatro_alla_Scala_interior_Milan.jpg/960px-Teatro_alla_Scala_interior_Milan.jpg",
  "Brera":U+"0/0c/Bar_Brera_-_panoramio.jpg/960px-Bar_Brera_-_panoramio.jpg",
  "Bosco Verticale y Porta Nuova":U+"c/c6/Il_Bosco_Verticale_Milano_Px_%28137734459%29.jpeg/960px-Il_Bosco_Verticale_Milano_Px_%28137734459%29.jpeg",
  "Fondazione Prada":U+"4/46/Fondazione_Prada%2C_Milan.jpg/960px-Fondazione_Prada%2C_Milan.jpg",
  "Cimitero Monumentale":U+"d/d5/Cimitero_Monumentale_di_Milano_nella_sua_vista_esterna_frontale.jpg/960px-Cimitero_Monumentale_di_Milano_nella_sua_vista_esterna_frontale.jpg",
  "Panzerotti de Luini":U+"4/4b/Panzerotti_chez_PanzerotTiamo_%28Lyon%29_-_2.jpg/960px-Panzerotti_chez_PanzerotTiamo_%28Lyon%29_-_2.jpg",
  "Aperitivo en los Navigli":U+"8/87/Naviglio_Grande%2C_Milano.jpg/960px-Naviglio_Grande%2C_Milano.jpg",
  "Cotoletta en una trattoria":U+"a/a7/Cotoletta_e_patate_al_forno.jpg/960px-Cotoletta_e_patate_al_forno.jpg",
  "Quadrilatero della Moda":U+"4/4f/Via_Monte_Napoleone_%28Milan%29.jpg/960px-Via_Monte_Napoleone_%28Milan%29.jpg",
  "Armani Privé":CLUB2,"Alcatraz":CLUB1,"Magazzini Generali":CLUB3,
};
async function loadThumb(el,a,cat,destino,id){
  if(IMG[a.t]){applyImg(el,IMG[a.t],id);return;}
  if(a.real){for(const t of titleCands(a,destino)){const s=await wikiImg(t);if(s&&!usedImgs.has(s)){usedImgs.add(s);applyImg(el,s,id);return;}}}
  if(a.real){const s=await commonsImg(a.q);if(s&&!usedImgs.has(s)){usedImgs.add(s);applyImg(el,s,id);return;}}
  for(const q of themedQ(cat,destino)){const s=await commonsImg(q);if(s&&!usedImgs.has(s)){usedImgs.add(s);applyImg(el,s,id);return;}}
  const last=await commonsImg(a.q||destino);if(last)applyImg(el,last,id);
}

/* ============ FICHA DETALLADA (modo "local contigo") ============ */
const stopData={};
const LOCALINFO={
  desayuno:{busy:"Mejor antes de las 9:30; a media mañana se llena.",bring:"Poco; algunos sitios solo aceptan efectivo.",price:"€",tip:"Pide la especialidad de la casa."},
  sight:{busy:"A primera o última hora evitas colas y grupos de turistas.",bring:"Agua, calzado cómodo y la entrada en el móvil.",price:"€€",tip:"Reserva online para saltarte la cola."},
  comida:{busy:"De 14:00 a 15:00 es la hora punta; ve a las 13:00 o reserva.",bring:"Efectivo por si no aceptan tarjeta.",price:"€€",tip:"Pregunta por el plato del día."},
  atardecer:{busy:"Llega 30-40 min antes del ocaso para pillar buen sitio.",bring:"Una chaqueta fina y la cámara.",price:"€-€€",tip:"Mira la hora exacta del atardecer ese día."},
  cena:{busy:"De 21:00 a 22:00 está lleno; mejor con reserva.",bring:"Reserva hecha y tarjeta.",price:"€€-€€€",tip:"Reserva con 1-2 días de antelación."},
  copas:{busy:"Se anima a partir de las 23:00.",bring:"DNI/pasaporte y algo de efectivo.",price:"€€",tip:"Empieza aquí y muévete hacia la disco."},
  disco:{busy:"Se llena de 01:00 a 03:00; antes está medio vacía.",bring:"DNI/pasaporte (lo piden en la puerta), efectivo para el guardarropa y zapatillas cómodas. Nada de chanclas.",price:"€€-€€€",tip:"Mira si hay lista o entrada anticipada online para no pagar de más."},
};
const VENUEX={
  "Balneario Széchenyi":{busy:"Mañana temprano o después de las 19:00 (de noche con luces tiene menos gente y es mágico). Fin de semana a tope.",bring:"Bañador, chanclas, toalla y un candado para la taquilla (o alquílalo). Agua, que el calor deshidrata.",price:"€€",tip:"Compra la entrada con taquilla incluida online y evita la cola."},
  "Szimpla Kert":{busy:"De día es tranquilo y curioso; de noche se peta de gente (mucho guiri). Ve sobre las 22:00.",bring:"Efectivo para la barra y DNI.",price:"€€",tip:"Pásate también de día para verlo sin agobios y hacer fotos."},
  "Mercado Central (lángos)":{busy:"Sábado por la mañana a reventar; entre semana mucho mejor. Cierra pronto la tarde.",bring:"Efectivo en forintos y hambre.",price:"€",tip:"El lángos está en la planta de arriba; pídelo con queso y nata agria."},
  "Palacio de Diocleciano":{busy:"A media mañana llegan los cruceros y se llena; ve a primera hora o de noche.",bring:"Calzado cómodo (el mármol resbala) y agua.",price:"Gratis callejear · criptas €",tip:"Recórrelo de noche casi vacío y entra a los sótanos."},
  "Barco a Hvar y la Cueva Azul":{busy:"En julio-agosto se reserva con días de antelación; vuela.",bring:"Bañador, toalla, crema solar, gorra y agua. Pastilla si te mareas.",price:"€€€",tip:"Coge el tour que entra a la Cueva Azul temprano: mejor luz y menos cola."},
  "Octagon (Gangnam)":{busy:"Se llena de 01:00 a 04:00; antes está vacío.",bring:"Pasaporte (imprescindible), efectivo y nada de chanclas.",price:"€€€",tip:"Mira el DJ y la lista en su Instagram; a veces hay entrada reducida antes de cierta hora."},
  "Mercado Gwangjang":{busy:"Mediodía y noche a reventar (es parte del encanto).",bring:"Efectivo en wones; siéntate en una barra y señala lo que comen al lado.",price:"€",tip:"Prueba el bindaetteok recién hecho y el mayak gimbap."},
  "Torre N de Seúl (Namsan)":{busy:"El atardecer es la hora punta; sube unos 45 min antes.",bring:"Chaqueta (arriba sopla viento), cámara y un candado si vas en pareja.",price:"€€",tip:"Sube en teleférico y baja andando por el parque de Namsan."},
  "Carpe Diem (Hvar)":{busy:"De día beach club relajado; de noche (en la isla de Stipanska) se convierte en fiestón.",bring:"Bañador de día; de noche, efectivo y ganas. Mira el último barco de vuelta.",price:"€€€",tip:"La fiesta de noche es en una isla aparte: confirma horarios de los barcos."},
};
/* Precio orientativo: importes reales en moneda local + euros entre paréntesis.
   CURR: rate = unidades por 1 €, step = redondeo bonito, mult = índice de coste de la ciudad. */
const CURR={
  budapest:{sym:"Ft",rate:400,step:500,mult:.7},
  seoul:{sym:"₩",rate:1400,step:1000,mult:.8},
  praga:{sym:"Kč",rate:25,step:10,mult:.7},
  londres:{sym:"£",rate:.85,step:1,mult:1.3},
  edimburgo:{sym:"£",rate:.85,step:1,mult:1.15},
  copenhague:{sym:"kr",rate:7.5,step:10,mult:1.3},
  estocolmo:{sym:"kr",rate:11,step:10,mult:1.25},
  estambul:{sym:"TL",rate:40,step:50,mult:.6},
  cracovia:{sym:"zł",rate:4.3,step:5,mult:.65},
  split:{eur:1,mult:.85},lisboa:{eur:1,mult:.85},roma:{eur:1,mult:1},amsterdam:{eur:1,mult:1.15},
  berlin:{eur:1,mult:1},paris:{eur:1,mult:1.15},madrid:{eur:1,mult:.9},atenas:{eur:1,mult:.8},
  viena:{eur:1,mult:1.05},dublin:{eur:1,mult:1.2},florencia:{eur:1,mult:1},venecia:{eur:1,mult:1.1},
  oporto:{eur:1,mult:.8},bruselas:{eur:1,mult:1.05},sevilla:{eur:1,mult:.85},
  munich:{eur:1,mult:1.1},niza:{eur:1,mult:1.1},milan:{eur:1,mult:1.1},
};
/* Rango en € por persona según categoría y nº de "€" (1-3) */
const PRICEBASE={
  desayuno:{1:[3,8],2:[8,15],3:[15,25]},
  sight:{1:[2,8],2:[8,20],3:[20,40]},
  comida:{1:[8,15],2:[12,25],3:[25,50]},
  atardecer:{1:[0,8],2:[8,18],3:[18,35]},
  cena:{1:[10,18],2:[15,30],3:[30,60]},
  copas:{1:[5,9],2:[8,14],3:[14,22]},
  disco:{1:[8,15],2:[15,25],3:[25,40]},
};
function fmtMoney(n){return n.toLocaleString("es-ES");}
function priceLabel(level,cat,key){
  if(!level||!key||!CURR[key])return level;
  if(/[^€\s\-–·]/.test(level))return level; // texto libre (p.ej. "Gratis callejear · criptas €") se respeta
  const counts=(level.match(/€+/g)||[]).map(s=>s.length);
  if(!counts.length)return level;
  const base=PRICEBASE[cat]||PRICEBASE.sight,c=CURR[key];
  const lo=Math.round((base[Math.min(...counts)]||base[2])[0]*c.mult);
  const hi=Math.round((base[Math.max(...counts)]||base[2])[1]*c.mult);
  const eurTxt=(lo<=0?"hasta "+hi:lo+"-"+hi)+" €";
  if(c.eur)return eurTxt;
  const L=Math.round(lo*c.rate/c.step)*c.step,H=Math.round(hi*c.rate/c.step)*c.step;
  const locTxt=(L<=0?"hasta "+fmtMoney(H):fmtMoney(L)+"-"+fmtMoney(H))+" "+c.sym;
  return locTxt+" (~"+eurTxt+")";
}
function getInfo(d){const kb=d.kind&&typeof KINDINFO!=="undefined"&&KINDINFO[d.kind]&&["sight","atardecer","foto","familia"].includes(d.cat);const base=kb?{...LOCALINFO.sight,...KINDINFO[d.kind]}:(LOCALINFO[d.cat]||LOCALINFO.sight);const ov=VENUEX[d.name]||{};const o={...base,...ov};const k=(typeof resolveKey==="function"&&d.destino)?resolveKey(d.destino):null;o.price=priceLabel(o.price,d.cat,k);return o;}
/* ===== Supabase (cuentas entre dispositivos) — rellenar al conectar el proyecto ===== */
const SUPA={url:"https://lbxcdnbvxzakfiuvjayk.supabase.co",key:"sb_publishable_F3bas0gojM3ki3RixfaiLA_Oz28_-wY"};
let _supaClient=null;window._cloudUser=null;
function supa(){if(_supaClient)return _supaClient;if(SUPA.url&&SUPA.key&&window.supabase){_supaClient=window.supabase.createClient(SUPA.url,SUPA.key);}return _supaClient;}
/* ===== cuentas (login local por dispositivo, hash SHA-256+salt) ===== */
async function pwHash(pass,salt){
  const str=salt+"::"+pass;
  if(window.crypto&&crypto.subtle){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(str));return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,"0")).join("");}
  let h=5381;for(let i=0;i<str.length;i++)h=((h*33)^str.charCodeAt(i))>>>0;return"x"+h.toString(16); // fallback fuera de https
}
function loadUsers(){try{return JSON.parse(localStorage.getItem("em_users")||"{}");}catch(e){return{};}}
function sessionUser(){
  if(window._cloudUser){const u=window._cloudUser;return{name:(u.user_metadata&&u.user_metadata.name)||(u.email||"viajero").split("@")[0],email:u.email,cloud:true};}
  const e=localStorage.getItem("em_session");if(!e)return null;const u=loadUsers()[e];return u?Object.assign({},u,{email:e}):null;
}
function userSuffix(){
  if(window._cloudUser)return"_c"+String(window._cloudUser.id).replace(/-/g,"").slice(0,12);
  const e=localStorage.getItem("em_session");if(!e)return"";try{return"_"+btoa(unescape(encodeURIComponent(e))).replace(/[^a-zA-Z0-9]/g,"").slice(0,16);}catch(x){return"_u";}
}
/* favoritos (persistentes, por usuario si hay sesión) */
function loadFavs(){try{return JSON.parse(localStorage.getItem("em_favs"+userSuffix())||"[]");}catch(e){return[];}}
function toggleFav(name){const a=loadFavs();const i=a.indexOf(name);if(i>=0)a.splice(i,1);else a.unshift(name);localStorage.setItem("em_favs"+userSuffix(),JSON.stringify(a));if(window.cloudPush)window.cloudPush();return i<0;}
const CATLBL={desayuno:"Desayuno",sight:"Cultura y sitios",comida:"Dónde comer",atardecer:"Atardecer",cena:"Cena",copas:"Copas",disco:"Vida nocturna",compras:"Compras",souvenir:"Recuerdos",foto:"Foto spot",cultural:"Cultura e historia",relax:"Relax",aventura:"Naturaleza",gastro:"Gastro",fiesta:"Vida nocturna",romantico:"Para dos",familia:"En familia",familianoche:"Noche en familia"};
const DUR={desayuno:"45 min – 1 h",sight:"1,5 – 2,5 horas",comida:"1 – 1,5 h",atardecer:"1 – 2 h",cena:"1,5 – 2 h",copas:"1 – 2 h",disco:"2 – 4 h",compras:"1 – 2 h",souvenir:"30 – 60 min",foto:"30 – 45 min"};
function openModal(id){
  const d=stopData[id];if(!d)return;
  document.getElementById("mImg").style.backgroundImage=d.img?`url('${d.img}')`:"";
  document.getElementById("mTime").textContent="🕐 "+d.timeLabel;
  const mc=document.getElementById("mCat");if(mc)mc.textContent=CATLBL[d.cat]||cap(d.cat||"Plan");
  document.getElementById("mName").textContent=d.name;
  document.getElementById("mDesc").textContent=d.desc||("Plan sugerido para tu mood en "+d.destino+".");
  const info=getInfo(d);
  const price=d.price&&d.price.txt?d.price.txt:(d.own?"Lo has añadido tú: no tenemos su precio. Míralo en su web o en Google Maps.":d.auto?"Sin datos fiables de precio: mira la carta y las reseñas en Google Maps.":info.price);
  const rows=[["clock","Duración",d.dur?fmtDur(d.dur):(DUR[d.cat]||"1 – 2 h")],["calendar","Cuándo ir / ambiente",info.busy],["backpack","Qué llevar",info.bring],["wallet",d.price&&d.price.free?"Precio":"Precio orientativo",price]];
  if(d.book&&d.book[0]!=="opcional")rows.push(["ticket","Reserva",`Con ${d.book[0]} de antelación. ${d.book[1]}`]);
  else if(d.book)rows.push(["ticket","Reserva","No hace falta, pero online te ahorras la cola."]);
  if(d.closed)rows.push(["alert","Cierre semanal",`Cierra ${d.closed.txt}.`+(d.closed.today?" Ese día de tu viaje está cerrado: cámbialo.":"")]);
  if(d.hours)rows.push(["calendar","Horario",d.hours.txt+(d.hours.late?" Con el orden de hoy llegas cuando ya ha cerrado: cámbialo.":"")+(d.hours.cut?" El plan acorta un poco la visita para salir a la hora de cierre.":"")]);
  if(d.season)rows.push(["calendar","Temporada",`Solo abre ${d.season}. Con la fecha del viaje, el plan solo lo incluye si está abierto.`]);
  if(d.club)rows.push(["calendar","Qué noches abre",`Suele abrir ${d.club.txt}${d.club.months?`, y solo ${d.club.months}`:""}${d.club.known?"":" (lo habitual en las discotecas; no tenemos su horario exacto)"}.`+(d.club.open===false?" Esa noche de tu viaje no suele abrir: cámbiala.":"")+" Mira su agenda en su web o Instagram antes de ir: hay noches privadas y cierres por vacaciones."]);
  if(d.near&&d.near.length)rows.push(["pin","Al lado, de paso",d.near.join(", ")]);
  rows.push(["bulb","Truco local",info.tip]);
  document.getElementById("mInfo").innerHTML=rows.map(r=>`<div class="row"><span class="ic">${ico(r[0])}</span><div class="tx"><b>${r[1]}</b><span>${r[2]}</span></div></div>`).join("")+provenanceHtml(d);
  const fb=document.getElementById("mFav");
  if(fb){const paint=on=>{fb.classList.toggle("faved",on);fb.innerHTML=ico("heart")+(on?" Guardado en favoritos":" Añadir a mis favoritos");};
    paint(loadFavs().includes(d.name));
    fb.onclick=e=>{e.stopPropagation();paint(toggleFav(d.name));};}
  document.getElementById("modal").classList.add("show");
}
// de dónde sale cada dato de la ficha y cómo de fiable es (verificado / estimado / no disponible)
const GUIDE_REV={barcelona:"nov. 2026",granada:"nov. 2026",valencia:"nov. 2026",malaga:"nov. 2026",bilbao:"nov. 2026",napoles:"nov. 2026",tokio:"nov. 2026",palma:"nov. 2026",chamonix:"nov. 2026",interlaken:"nov. 2026",santorini:"nov. 2026"};
const DATA_REV="nov. 2026"; // horarios, cierres, reservas y noches de discoteca revisados
function fmtDay(t){if(!t)return "";const d=new Date(t);return `${d.getDate()} ${["ene.","feb.","mar.","abr.","may.","jun.","jul.","ago.","sept.","oct.","nov.","dic."][d.getMonth()]} ${d.getFullYear()}`;}
function provenanceHtml(d){
  if(!d||!d.real)return "";
  const V=["ok","Verificado"],E=["est","Estimado"],N=["na","No disponible"];
  const R=[];const rev=GUIDE_REV[d.key]||"jul. 2026";
  const autoT=fmtDay((typeof AUTO!=="undefined"&&AUTO[d.key]&&AUTO[d.key].fetched)||(typeof AUXT!=="undefined"&&AUXT[d.key])||0);
  if(d.own)R.push(["Sitio y ubicación",V,"lo has añadido tú; ubicación buscada en OpenStreetMap"]);
  else if(d.auto)R.push(["Sitio y ubicación",V,`Wikidata (enciclopedia libre), consultado${autoT?" el "+autoT:""}; no lo ha revisado una persona`]);
  else R.push(["Sitio y ubicación",V,`guía de MoodTrip hecha a mano (revisada en ${rev}); coordenadas de OpenStreetMap`]);
  const pt=d.price&&d.price.txt||"";
  if(d.price&&d.price.free)R.push(["Precio",d.auto?E:V,d.auto?"gratis por el tipo de sitio (parques, plazas, miradores…)":"gratis"]);
  else if(d.own||(!pt&&d.auto)||(d.price&&d.price.unknown))R.push(["Precio",N,"no tenemos su precio: míralo en su web"]);
  else if(/mira (el precio en )?la web|puede tener entrada|gratis o con entrada/i.test(pt))R.push(["Precio",N,"depende de la zona o de la entrada: míralo en su web"]);
  else R.push(["Precio",E,"rango orientativo por el nivel de precio del sitio en la guía, no la tarifa oficial"]);
  if(d.hours)R.push(["Horario",d.hours.known?V:E,d.hours.known?`horario de la guía (revisado en ${DATA_REV}); puede cambiar en festivos`:"horario típico de este tipo de sitio"]);
  if(d.closed)R.push(["Día de cierre",V,`de la guía (revisado en ${DATA_REV})`]);
  if(d.club)R.push(["Noches que abre",d.club.known?V:E,d.club.known?`de su agenda y guías de ocio (revisado en ${DATA_REV})`:"lo habitual en las discotecas (jueves a sábado)"]);
  R.push(["Duración",E,"lo que suele durar una visita así"]);
  return `<div class="prov"><b>De dónde sale cada dato</b>${R.map(([k,[c,l],t])=>`<div class="pv"><span class="pvk">${k}</span><span class="pvb ${c}">${l}</span><span class="pvt">${t}</span></div>`).join("")}</div>`;
}
document.getElementById("mClose").onclick=()=>document.getElementById("modal").classList.remove("show");
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")document.getElementById("modal").classList.remove("show");});

