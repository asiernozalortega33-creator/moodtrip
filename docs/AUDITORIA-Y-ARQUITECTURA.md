# MoodTrip — auditoría, arquitectura y estado real (24-11-2026)

Documento de trabajo para la «transformación completa» de MoodTrip. Dice qué funciona de verdad, qué es
estimado o simulado, qué se ha construido en esta fase y qué falta. Nada de lo que aparece como hecho está
sin probar: las pruebas están en `tests/` y sus resultados, más abajo.

## 0. Restricción que manda en la arquitectura

**Todo gratis.** El dueño del producto descartó la IA de pago y también Gemini gratis. Google Maps,
Routes y Places son de pago. Por eso los «motores» de este documento **no usan un modelo de lenguaje**:
son reglas y cálculos sobre datos reales y verificables (guías hechas a mano, Wikidata, OpenStreetMap,
Open-Meteo, AeroDataBox, Transitous). Esto encaja con el principio del encargo: no delegar en un LLM
cálculos geográficos, horarios ni transporte que una fuente puede dar con más fiabilidad. Si algún día
se añade un LLM, debería ocupar solo la capa de explicar y personalizar textos, encima de estos motores.

## 1. Inventario: qué hay de verdad

| Pieza | Estado | Detalle |
|---|---|---|
| Frontend | Real | `index.html` + `css/` + `js/` (sin framework ni build): flujo editorial oscuro de 12 pantallas, MapLibre + OpenFreeMap, PDF por impresión. |
| Backend | Real, mínimo | Funciones de Vercel: `api/flight.js`, `api/places.js`, `api/events.js` y `api/route.js` (nueva). |
| Base de datos | Real | Supabase (`user_data`: viajes y favoritos en JSON, RLS solo-dueño). Copia local en `localStorage`. |
| Autenticación | Real | Supabase email + contraseña; modo local de respaldo (SHA-256 + sal; hash débil en `file://`). |
| Vuelos | Real | AeroDataBox (clave en Vercel). Número y fecha obligatorios: los números de vuelo se repiten a diario. |
| Hotel | Parcial | Se geocodifica con Nominatim para medir distancias. **No hay reserva real**: «Reservar ahora» abre Booking.com. |
| Destinos curados | Real | **38 destinos** (incluidos montaña y playa: Chamonix, Interlaken, Palma, Santorini) con sitios de nombre propio, coordenadas, horarios, cierres, reservas, noches de discoteca y **temporadas** (lo cerrado ese mes no entra en el plan). |
| Guía automática | Real, calidad variable | Cualquier ciudad vía Wikidata + Nominatim, con caché de 30 días en la CDN. Fuerte en monumentos; débil en restaurantes, bares y naturaleza de pueblos pequeños (ver test F). |
| Generación de itinerarios | Real (motor propio, determinista) | Tipos de día, zonas, horas reales, ocaso NOAA, cierres, discotecas, cuestas, plan B. |
| Mapas | Real | Pines numerados por día y rutas en línea; mapa del viaje por días. |
| Transporte | Real | Cálculo propio (calles y cuestas) + enlace a Google Maps y, en los tramos largos, línea, dirección, paradas y transbordos reales con Transitous (sección 4). |
| Eventos | Preparado | Ticketmaster sin clave → la sección se oculta, no se inventa. |
| Presupuesto | **Estimado** | `estBudget` da rangos por partida (vuelos, hotel, actividades) con multiplicador por ciudad. No consulta precios reales. |
| Precios de entradas | Estimado | Rango orientativo por nivel (€-€€€); «Gratis» solo cuando lo es. No hay precio oficial por sitio. |
| Ajustes: modo claro | No existe | El interruptor solo muestra un aviso. |
| Notificaciones | No existe | Los interruptores se guardan, pero no hay nada detrás que avise. |
| Planificador antiguo | Código heredado | El formulario azul anterior sigue en el archivo; no se usa en el flujo actual. |

## 2. Diagnóstico

**Críticos (arreglados en esta fase)**
- **XSS:** nombres y descripciones de Wikidata y OpenStreetMap se pintaban con `innerHTML` sin escapar. Ahora `cleanItem()` los limpia al entrar y solo acepta fotos de Wikimedia.
- **Cierres de varios días:** un sitio solo podía cerrar un día a la semana. Los Jardines del Palacio Imperial de Tokio cierran lunes y viernes, y el plan los ponía un viernes. Ahora se admiten varios días.
- **Nombres repetidos entre ciudades:** el «Paradiso» de Barcelona pisaba las coordenadas y la foto del de Ámsterdam. Arreglado, con una prueba que lo vigila (`tests/nombres-duplicados.js`).
- **Municipios de Wikidata como sitios** («Boulogne-Billancourt»). Ahora se filtran por su descripción.

**Arquitectura**
- **Hecho (24-11-2026):** el HTML único de ~6.500 líneas se ha separado en `css/app.css` y seis scripts en `js/` sin
  cambiar la lógica (mismo orden, ámbito global compartido). Los tipos del motor están documentados con JSDoc al principio
  de `js/motor.js`. Pendiente: pasar a módulos ES con imports explícitos y comprobar los tipos con TypeScript (`checkJs`).
- Pruebas en `tests/` (sección 6), que se ejecutan solas en cada cambio del repositorio público (GitHub Actions).

**Experiencia de usuario**
- **Edición avanzada (hecha, 24-11-2026, ver sección 3 bis).**
- «Cambiar» no actualiza los textos de alrededor («Desayuna cerca de…»).

## 3. Arquitectura de motores (lo que existe y dónde)

| Componente del encargo | Implementación en MoodTrip | Estado |
|---|---|---|
| User Profile Analyzer | `planTrip` → objeto `o` (moods, ritmo, compañía, presupuesto, `familia`, `mayores`) | Hecho |
| **Mood Intelligence Engine** | `moodAdvice()`: encaje 0-100 por mood según lo que hay en esa guía, la compañía (`COMPFIT`), los días, el mes y la temporada de las discotecas; notas de combinación; sugerencias con los sitios que desbloquean. Pantalla «Afinemos tu viaje». | **Nuevo** |
| Moods dinámicos | `dayMeta().dmoods`: cada día muestra «Hoy: Cultura + Gastronomía» según sus paradas reales | **Nuevo** |
| **Companion Context Engine** | `familia`: sin bares ni discotecas, plan infantil real (museos de ciencia, acuarios, zoos: `KIDS_RX`) y sin cenas tras un ocaso tardío. **`mayores` (nuevo)**: sin rutas duras (`HARD_RX`), penaliza sitios en alto sin transporte, tramos a pie de 12 min como máximo, 20 % menos de visitas, sobremesa larga y sin discotecas. **`solo` (nuevo)**: plan social nocturno. | Hecho / nuevo |
| Intensidad | `allocSights`: minutos de visita por día (200/300/390) × peso del tipo de día (llegada 0,45, vuelta 0,4, tras fiesta 0,7). La capacidad se calcula, no es un número fijo de paradas. | Hecho |
| Destination Research / Places Discovery | Guías curadas + `api/places.js` (Wikidata SPARQL, fama por sitelinks, fotos de Commons) | Hecho |
| Geographic Clustering | `allocSights` reparte por zonas en dos fases; `pickNear` agrupa comidas y cenas por cercanía | Hecho |
| **Transport Routing** | Calles (×1,3) + cuestas reales (Open-Meteo, regla de Naismith) + `HILLHOW` (cómo subir a cada cerro). **Nuevo:** `api/route.js` → Transitous (línea, dirección, paradas, transbordos, programado o en tiempo real). | Hecho |
| Itinerary Optimization | Orden por popularidad y vecino más cercano con coste en minutos (`legT`); `fixHours` reordena por horarios | Hecho |
| Schedule Validation | `runSchedule`, `fixHours`, `hoursPen`: nada antes de abrir ni después de cerrar, nada en día de cierre, discoteca solo la noche que abre | Hecho |
| Budget Optimization | `estBudget` (rangos) | **Pendiente**: desglose por actividad del plan y alternativas baratas |
| Weather Adaptation | Plan B «si llueve» con un sitio cubierto cercano; sin previsión real | Parcial |
| Final Quality Validator | Las pruebas de `tests/` (duplicados, solapes, cierres, horarios, cuestas) | Hecho como pruebas; falta correrlo en el navegador antes de enseñar el plan |

Modelo de datos de cada parada (en el código, `row.a`): nombre, categoría, tipo, coordenadas (`COORDS`),
altitud (`el`), duración, precio honesto (`priceOf`: gratis / rango aproximado / «mira la web»), horario
(conocido o «suele», con su texto), cierre (y si es hoy), reserva (antelación y motivo), discoteca (noches y
meses), origen (curado o automático), fotos y motivo («Por qué hoy es así»). Los trayectos se calculan
entre paradas (`connector`). **Pendiente:** convertir los trayectos en entidades propias, guardadas con su
ruta, y tipar el esquema.

## 3 bis. Edición avanzada del itinerario

Cada parada tiene ↑ ↓ (mover), «Hora» (hora de inicio y duración), «Cambiar» y ✕, y al final de cada día hay un bloque
«Añadir al día»: sitios cercanos que **caben de verdad** (se prueban antes de ofrecerlos), un sitio tuyo (se busca en
OpenStreetMap dentro de la ciudad) y tiempo libre. En la barra lateral, «Ajustar el viaje» cambia ritmo y moods y rehace
el viaje (si hay cambios a mano, pide confirmar porque se perderían).

- **Validador (`dayProblems`)**: detecta visitas fuera de horario o en día de cierre, una parada que ya no cabe (antes del
  vuelo o del final del día), una hora fijada a la que no llegas, la comida o la cena desplazadas más de una hora, el
  atardecer con el sol ya puesto, una excursión que empieza tarde y una discoteca en una noche en que no abre.
- **`tryEdit`**: aplica el cambio; si crea un problema nuevo, intenta **reparar** quitando la visita anterior que menos
  importa (nunca la que tocas ni las que añadiste tú) y lo dice («Para que todo quepa he quitado…»); si no hay arreglo,
  lo deshace y explica el motivo. **Mover** nunca quita nada: si no cabe, se rechaza con el motivo.
- Todo se puede **deshacer** (se rehace el plan y se vuelven a aplicar los cambios anteriores).
- Los cambios se guardan como lista de operaciones que apuntan a su parada **por nombre**, no por posición. Al reabrir
  un viaje guardado se reaplican; si alguno ya no cabe, se avisa. Los viajes guardados conservan también compañía,
  ritmo y presupuesto (antes se perdían y al reabrir podía salir otro plan).
- Un sitio añadido por ti no lleva precio inventado: la ficha dice que no lo sabemos.
- Pruebas: `tests/edicion.js` (12 casos: lo que debe salir bien y lo que debe rechazarse con motivo, más la reapertura idéntica).

## 4. Transporte con líneas reales (Transitous)

- `api/route.js` consulta Transitous (MOTIS, con los horarios GTFS oficiales de cada operador) y devuelve, por
  ejemplo, «L4 dirección Trinitat Nova: sube en Jaume I, baja en Passeig de Gràcia (2 paradas), transbordo a la L2
  dirección Badalona Pompeu Fabra…».
  Probado en Barcelona (TMB), Budapest (BKK), Tokio (Tokyo Metro, Toei, Tsukuba Express) y Nápoles (ANM).
- Distingue horario programado de tiempo real y nunca simula datos en directo.
- Se pide bajo demanda, con el botón «Ver líneas y paradas», solo en los tramos que no son un paseo corto.
  Hay caché de 7 días en la CDN y la hora se redondea.
- **Decisión (24-11-2026): se abre el código con licencia MIT** en un repositorio público nuevo sin historial (https://github.com/asiernozalortega33-creator/moodtrip), MoodTrip queda como proyecto no comercial y se activa `TRANSIT_ROUTING=transitous` en producción. Si MoodTrip pasa a ser comercial, hay que apagarlo y cambiar de proveedor.
- En el código sigue **apagado por defecto**. Las condiciones de Transitous (<https://transitous.org/api/>) exigen:
  - proyecto de **código abierto** y **no comercial**;
  - poco tráfico (unas 720 rutas al día);
  - User-Agent con contacto;
  - enlace visible a sus fuentes y a OpenStreetMap (ya incluido).

  Con el repositorio privado solo vale para pruebas ligeras de prototipo.
- **Para activarlo:** publicar el código con una licencia libre, poner `TRANSIT_ROUTING=transitous` (y
  opcionalmente `TRANSIT_CONTACT=<web o email>`) en Vercel y volver a desplegar.
- **Alternativas** si no se quiere abrir el código: Google Routes (de pago) o un OpenTripPlanner propio con los
  GTFS de cada ciudad (gratis, pero hay que mantener un servidor y los datos de cada ciudad).

## 5. Fuentes y fiabilidad

| Dato | Fuente | Fiabilidad |
|---|---|---|
| Sitios de las 34 guías | Curados a mano; coordenadas de Nominatim (OpenStreetMap) | Verificado al curar |
| Horarios, cierres, noches de discoteca | Webs oficiales y guías, revisados en nov. 2026 | Verificado con fecha; la ficha siempre dice «confírmalo» |
| Sitios de la guía automática | Wikidata + Wikimedia Commons | Real, sin verificar uno a uno |
| Altitud | Open-Meteo (modelo de terreno de 90 m) | Estimado (±10-20 m) |
| Ocaso | Cálculo NOAA | Calculado |
| Trayecto a pie | Línea recta ×1,3 + cuestas | Estimado |
| Transporte público | Transitous (GTFS oficiales) | Programado; tiempo real solo donde el operador lo publica |
| Vuelos | AeroDataBox | Real |
| Presupuesto | Rangos propios | Estimado |

Pendiente: guardar en cada dato la fuente, la fecha de consulta y el nivel de confianza, y enseñarlo en la ficha.

## 6. Pruebas

```
cd tests && npm install && node run.js     # todas
node run.js perfiles-af.js                  # solo los perfiles A-F del encargo
```

Resultados reales de `perfiles-af.js` del 24-11-2026, con fecha en todos los viajes:

| Test | Perfil | Con nombre propio | Encaje con sus moods | Duplicados / solapes / cerrados / fuera de hora | Notas |
|---|---|---|---|---|---|
| A | Budapest 4 d, pareja, Romántico + Cultura + Gastro, equilibrado | 91 % | 86 % | 0 / 0 / 0 / 0 | Buda en 2 días y Pest en 4; ningún día solo en Buda. Sugiere Fotografía y Relax. |
| B | Barcelona 3 d, amigos, Fiesta + Gastro + Aventura, intenso | 100 % | 88 % | 0 / 0 / 0 / 0 | Jamboree y Razzmatazz en noches en que abren; excursión a Montserrat. Con 3 días, llegada y vuelta, el día es corto aunque sea intenso. |
| C | Roma 5 d, padres, Cultura + Gastro + Relax, tranquilo | 77 % | 100 % | 0 / 0 / 0 / 0 | Tramo a pie más largo: 12 min; ninguna subida fuerte andando; sin noches de fiesta. |
| D | Ámsterdam 3 d, solo, Cultura + Fotografía, equilibrado | 100 % | 43 %* | 0 / 0 / 0 / 0 | Plan social las dos noches (Wynand Fockink, Leidseplein). |
| E | París 4 d, familia, Cultura + Aventura, equilibrado | 70 % | 64 % | 0 / 0 / 0 / 0 | Cité des Sciences; sin bares; sin cenas tardías. Aún hay comidas «por la zona». |
| F | Chamonix 3 d, pareja, Naturaleza + Relax, tranquilo | 30 % | 33 % | 0 / 0 / 0 / 0 | **Insuficiente:** la guía automática casi no tiene naturaleza ni restaurantes en pueblos de montaña. El Aiguille du Midi ya entra como visita del día. |

\* El encaje cuenta también desayunos, comidas y copas, que rara vez llevan la etiqueta Cultura o Fotografía.

Otras: `humo-ciudades.js` (68 viajes en 34 ciudades, 0 errores), `horarios-discotecas.js` (8/8 sin problemas),
`cuestas.js`, `nombres-duplicados.js` (0 duplicados).

## 7. Lo que falta, por prioridad

1. Vigilar el volumen de rutas (Transitous pide hablar con ellos por encima de ~720 al día) y, si crece, cachear por tramo más tiempo o montar un OpenTripPlanner propio.
2. Edición: arrastrar paradas entre días y que «Cambiar» reescriba los textos vecinos.
3. **Presupuesto real por plan:** sumar las paradas del itinerario (entradas y comidas), separar lo confirmado, lo estimado y lo pendiente, y proponer alternativas baratas equivalentes.
4. Más destinos de montaña y playa (hechos: Chamonix, Interlaken, Palma, Santorini). La guía automática sigue floja en naturaleza: OpenStreetMap vía Overpass está bloqueado (406).
5. **Validador antes de enseñar el plan** (las comprobaciones de `tests/` dentro de la app) y fiabilidad por dato en la ficha.
6. Moods nuevos del encargo (Wellness, Beach, Architecture, Hidden gems…): solo cuando haya datos que los respalden. Muchos se pueden derivar del tipo de sitio (termas → Wellness, playa → Beach, palacio o iglesia → Architecture).
7. Previsión del tiempo (Open-Meteo, gratis) para el plan B con fechas cercanas.
8. Extraer el motor a un módulo tipado.
