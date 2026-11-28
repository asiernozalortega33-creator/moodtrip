# MoodTrip — Explora mood

Planificador de viajes por *mood*. Eliges destino (o tu número de vuelo), días, con quién viajas y lo que quieres
sentir, y te monta el viaje hora a hora con sitios reales con nombre propio: desayuno, visitas, comida, atardecer,
cena, copas y discoteca. Cada día tiene sentido geográfico, respeta horarios y cierres, y explica por qué es así.

**Demo:** https://explora-mood.vercel.app

## Qué hace

- **38 destinos hechos a mano** (Barcelona, Valencia, Granada, Málaga, Bilbao, Madrid, Sevilla, Roma, Nápoles, París,
  Budapest, Tokio…, y de montaña y playa: Chamonix, Interlaken, Palma de Mallorca y Santorini, con sus temporadas). Tienen coordenadas comprobadas en OpenStreetMap, horarios, días de cierre, reservas, noches de
  apertura de las discotecas y cómo subir a cada cerro. Cualquier otra ciudad usa una **guía automática** con Wikidata.
- **Motor de viaje** propio y determinista. Hace cuatro cosas:
  - días con tipo (llegada, barrio, excursión, vuelta) y zona;
  - horas reales (duración + trayecto con calles y cuestas);
  - comidas a la hora del país y atardecer a la hora real del ocaso;
  - fiesta solo las noches en que abre la discoteca.
- **Edición del itinerario**: mover paradas, fijar horas y duraciones, añadir sitios sugeridos o tuyos y tiempo libre,
  con un validador que no deja un día imposible (si no cabe, te dice por qué) y deshacer.
- **Motor de moods**: valora cómo encajan tus moods con lo que hay en esa ciudad, con quién viajas, los días y el mes,
  y te sugiere otros con los sitios concretos que desbloquean. Siempre decides tú.
- **Compañía**:
  - pareja, amigos y solo;
  - familia: planes para niños y sin bares;
  - con tus padres: sin cuestas ni caminatas largas y con sobremesa.
- **Transporte público con líneas reales** (línea, dirección, paradas, transbordos) vía [Transitous](https://transitous.org).
- **Vuelos en vivo** (AeroDataBox), **hotel** geolocalizado, **mapas** (MapLibre + OpenFreeMap), **PDF**, cuentas con
  **Supabase** y enlaces para compartir.

Todo lo que no es un dato verificado se presenta como estimado («aprox.», «suele»), y si no hay un sitio fiable, la
app lo dice y abre el mapa de la zona: no se inventa nada. Auditoría y arquitectura en
[`docs/AUDITORIA-Y-ARQUITECTURA.md`](docs/AUDITORIA-Y-ARQUITECTURA.md).

## Stack

Sin build ni frameworks: `index.html` + `css/app.css` + scripts clásicos en `js/` (comparten el ámbito global y se
cargan en este orden): `base.js` (opciones, iconos, destinos) → `guias.js` (27 guías y motor genérico) → `fichas.js`
(interfaz común, imágenes, ficha, cuentas) → `motor.js` (motor de viaje, moods, edición, presupuesto; tipos documentados
al principio) → `guias-mas.js` (guías añadidas después) → `app.js` (pantallas). Funciones serverless en `api/`:

| Función | Qué hace | Variables de entorno |
|---|---|---|
| `api/flight.js` | Estado del vuelo (AeroDataBox vía RapidAPI) | `AERODATABOX_KEY` |
| `api/places.js` | Guía automática: Wikidata + Nominatim + altitudes de Open-Meteo | — |
| `api/route.js` | Rutas en transporte público (Transitous) | `TRANSIT_ROUTING=transitous`, `TRANSIT_CONTACT` (opcional) |
| `api/events.js` | Conciertos (Ticketmaster); sin clave, la sección no aparece | `TICKETMASTER_KEY` |

## Ejecutar y probar

Para trabajar en local, sirve la carpeta con `node tests/dev-server.js 8766`, que imita Vercel y ejecuta `api/`.
Después abre `http://127.0.0.1:8766`. Para desplegar: `sh deploy.sh`.

Pruebas del motor (en Chrome sin ventana, dentro de la app real):

```
cd tests && npm install && node run.js
```

En el repositorio público se ejecutan solas en cada cambio (GitHub Actions, `.github/workflows/pruebas.yml`).

Atajo para ir directo a una pantalla: `#demo=Destino/días/moods/pantalla[/AAAA-MM-DD]`, por ejemplo
`https://explora-mood.vercel.app/#demo=Granada/3/romantico,cultural/itin/2027-05-14`.

## Datos y atribución

- Rutas de transporte: [Transitous](https://transitous.org) y [sus fuentes](https://transitous.org/sources/).
- Mapas y geocodificación: © [colaboradores de OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL), teselas de [OpenFreeMap](https://openfreemap.org).
- Sitios de la guía automática: [Wikidata](https://www.wikidata.org) (CC0); fotos de [Wikimedia Commons](https://commons.wikimedia.org) (cada una con su licencia).
- Altitudes: [Open-Meteo](https://open-meteo.com) (CC BY 4.0).

## Licencia

[MIT](LICENSE). Es un proyecto no comercial: el transporte de Transitous solo se puede usar así.
