# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Diez vidas totales por navegador, diez segundos por pregunta. Cada error o tiempo agotado consume una vida y muestra la respuesta correcta con su explicación. Luego se avanza a la siguiente pregunta, sin sumar un acierto por la que se falló. El reloj de la siguiente comienza al abrirla. El progreso y las vidas se guardan en el servidor: recargar, cambiar el nombre o repetir un inicio conserva la misma partida. Al perder las diez vidas, el juego queda bloqueado para esa identidad.

La pregunta 125 es «¿Quién es el mejor jugador de la historia?»: Lionel, Andrés, Messi y Cuccittini son respuestas correctas. Este cierre no tiene reloj, suma un acierto con cualquiera de las cuatro opciones y termina el recorrido. Completar el quiz también cierra la partida.

El navegador conserva un identificador privado. No es una verificación del dispositivo físico: cambiar de navegador, usar una sesión privada o borrar sus datos puede crear otra identidad. Un límite estricto entre navegadores requiere identificación adicional.

Antes de empezar se elige el nombre. Al terminar, los aciertos de esa partida determinan qué Messi sos, con una foto real de su historia. El ranking muestra la foto ganada por el mejor récord de cada jugador, además de su posición global. Compartir incluye el Messi ganado y el puntaje.

| Aciertos | Resultado |
| --- | --- |
| 0–5 | Messi en el banco · ALEMANIA 2006 |
| 6–11 | Messi de los 43 segundos · EL DEBUT ANTE HUNGRÍA · 2005 |
| 12–17 | Messirve · EL MEME DE LOS LENTES |
| 18–23 | Messi debutante · PRIMER GOL MUNDIALISTA · 2006 |
| 24–29 | Messi olímpico · ORO EN BEIJING · 2008 |
| 30–35 | Messi con el Diego · EL ABRAZO · MUNDIAL 2010 |
| 36–41 | Messi del último minuto · EL ZURDAZO ANTE IRÁN · BRASIL 2014 |
| 42–47 | Messi finalista · BRASIL 2014 |
| 48–53 | Messi del tiro libre · EL GOLAZO ANTE ESTADOS UNIDOS · 2016 |
| 54–59 | Messi capitán · LA CONFERENCIA CON EL PLANTEL · 2016 |
| 60–65 | Messi salvador · EL HAT-TRICK DE QUITO · 2017 |
| 66–71 | Messi del control imposible · EL GOL ANTE NIGERIA · RUSIA 2018 |
| 72–83 | Messi de América · COPA AMÉRICA 2021 |
| 84–89 | Messi de Wembley · FINALISSIMA 2022 |
| 90–95 | Messi del desahogo · EL GOL ANTE MÉXICO · QATAR 2022 |
| 96–100 | Messi Topo Gigio · EL FESTEJO ANTE PAÍSES BAJOS · QATAR 2022 |
| 101–104 | Messi «andá pa’ allá, bobo» · LA ENTREVISTA CON GASTÓN EDUL · QATAR 2022 |
| 105–110 | Messi de la remontada · GOL ANTE EGIPTO · MUNDIAL 2026 |
| 111–114 | Messi de rodillas · EL FESTEJO ANTE INGLATERRA · MUNDIAL 2026 |
| 115–123 | Messi campeón del mundo · QATAR 2022 |
| 124 | Messi de la última final · MEDALLA DE PLATA · MUNDIAL 2026 |
| 125 | Messi Grido · EL NIVEL DEFINITIVO |

Los veintidós niveles se definen en `dist/tiers.js`, con sus fotos en `dist/assets/levels/`. El dato usado es el puntaje validado por el servidor. El campo antiguo de avatar se conserva sólo por compatibilidad con la API; ya no determina ninguna foto. La categoría de 2010 usa exactamente la foto elegida y aportada por el usuario: Maradona abraza y besa a Messi, de espaldas con la camiseta 10. Su enlace abre esa imagen.

El ranking y las partidas se guardan en Cloud Firestore (Firebase), separado de GitHub Pages, en el proyecto `quiz-messi-8674d`. El servidor valida respuestas y tiempos; el navegador conserva preferencias y los identificadores privados del jugador y de su partida. Una fila por navegador, conservando su mejor resultado. Desempate por menor tiempo acumulado y luego por la fecha del récord. No hay verificación de identidad entre dispositivos.

## GitHub Pages

El contenido de `dist/` se publica con el flujo `.github/workflows/pages.yml` al subir cambios a `main`.

En **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**.

## Uso local

Se requiere Node.js 24. La vista previa usa una base de datos en memoria, independiente de los resultados públicos. No hace falta instalar dependencias para jugar o verificar.

```sh
npm run check
npm test
npm start
```

Abrir `http://127.0.0.1:4173/`.

`/layout-check.html` está disponible sólo en la vista previa: renderiza las 125 preguntas para comprobar que el texto y el botón siguiente no se superponen ni requieren scroll. `/results-check.html?score=125` permite revisar los niveles y las fotos con resultados ficticios identificados como «Vista de prueba», sin escribir en el ranking.

Verificado en 320×568, 375×667 y 390×844. También se comprobaron un acierto, un error, el tiempo agotado, reintentos de respuestas, recuperación de partidas y conservación del mejor récord.

## Retomar desde otra computadora

El repositorio completo es [GB-Films/QUIZ-MESSI](https://github.com/GB-Films/QUIZ-MESSI), rama `main`. Incluye la web, las veintidós fotos, las preguntas, el código del servidor, las pruebas, las migraciones y las reglas e índices de Firebase.

```sh
git clone https://github.com/GB-Films/QUIZ-MESSI.git
cd QUIZ-MESSI
npm run check
npm test
npm start
```

Usar Node.js 24. La vista local no necesita claves de Firebase y usa resultados de prueba. Los jugadores y las partidas públicas siguen en la nube al cambiar de computadora.

Estado del trabajo al 6 de octubre de 2026:

- La web está publicada en https://gb-films.github.io/QUIZ-MESSI/ y usa la API https://messi-quiz-albiceleste.guidoboetsch.chatgpt.site.
- Firestore y Firebase Authentication están activos en el proyecto `quiz-messi-8674d`; la base está en `southamerica-east1`. El servidor valida y guarda las partidas y los mejores resultados. Se conservaron los cuatro jugadores y las nueve partidas del almacenamiento anterior, y se verificó una partida real con reintentos y respuestas simultáneas.
- **Blaze está activo con la cuenta de facturación «Pago de Firebase»**, según la consola que el usuario compartió el 6 de octubre de 2026. El usuario autorizó usar esa cuenta después del rechazo de Gran Berta Films por su cuota de proyectos vinculados y completó la vinculación. Se configuró un presupuesto de alertas de USD 25; no es un cargo fijo ni un límite automático de gasto. La solicitud de ampliación de Gran Berta Films quedó preparada, sin enviar; ya no es necesaria para activar Blaze en este proyecto. No cambiar la cuenta de facturación ni desvincular otros proyectos sin autorización.
- El objetivo es un millón de jugadores **acumulados**. Las pruebas simuladas de 100 jugadores y la verificación real confirman coherencia del guardado; todavía hacen falta protección contra abuso, seguimiento de consumo y pruebas de carga reales antes de una difusión masiva. Ver [backend/SCALING.md](backend/SCALING.md).

Para seguir con Codex en otra computadora, abrir este repositorio y pedirle que lea este README y `backend/SCALING.md`. Iniciar sesión con la misma cuenta de Codex/Sites y la cuenta de Google del proyecto para administrar los recursos existentes. No crear otro proyecto de Firebase, otro Site ni volver a importar la copia anterior de los resultados.

El servidor se publica por **Sites**, separado de GitHub Pages. Su ID es `appgprj_6ac470987bf081918291e55728c8818a`. La versión publicada del servidor es la 4, con fuente `dd4162202268312b7401cf7fa885f250e7a1428d` en el repositorio administrado por Sites. La edición con diez vidas usa `RULES_VERSION=2`. Abrir primero esa fuente mediante el flujo de Sites antes de editar o publicar el servidor. Sincronizar desde este repositorio los archivos de `backend/` y `dist/questions.js` que se hayan modificado; construir con `npm run build` en el checkout del servicio. Las fotos y la interfaz actual están en este repositorio de GitHub Pages.

`backend/hosting.sites.json` conserva el manifiesto de referencia del servicio, sin credenciales. El checkout de Sites utiliza ese manifiesto como `.openai/hosting.json`; la compilación del servidor se realiza allí para mantener los archivos del servidor fuera de la web de Pages.

La configuración activa del servidor está guardada en Sites: `FIREBASE_PROJECT_ID=quiz-messi-8674d`, `FIREBASE_GAMES_ENABLED=true` y los secretos `FIREBASE_API_KEY` y `FIREBASE_REFRESH_TOKEN`. No hay una pausa de mantenimiento activa. Se usa la identidad dedicada de Authentication `quiz-ranking-server`; las altas públicas de usuarios están bloqueadas. La organización impide crear claves de cuentas de servicio y esa protección sigue vigente. Los secretos ya configurados siguen funcionando en la nube; no hace falta copiarlos a la nueva computadora ni publicarlos en GitHub. Para trabajo administrativo local, renovar el acceso de Firebase en esa computadora.

## Servicio del ranking

`backend/index.js` contiene la API y `drizzle/` la migración de SQLite para D1. El servicio se aloja en el sitio de Messi previamente creado, mientras el enlace de juego continúa en GitHub Pages. `dist/` contiene únicamente la web pública de Pages; el archivo compilado del servidor se prepara en el checkout del servicio, separado del despliegue de Pages.

Para generar nuevas migraciones se instalan las herramientas con `npm install` y se ejecuta `npm run db:generate`. Las migraciones aplicadas se conservan sin modificar. El manifiesto activo de alojamiento permanece en el checkout del servicio; este repositorio incluye su referencia en `backend/hosting.sites.json`. Los secretos no se publican.

### Firebase

`backend/firestore.js` guarda los mejores resultados en `quizRankings/argentina-survival-1/players/{public_id}` mediante la API de Firestore. Con Firebase activo, el top 5, el total de jugadores y la posición individual se consultan en esa base. `FIREBASE_GAMES_ENABLED=true` activa también `backend/firebase-games.js`: partidas, identidades privadas y récords se guardan en Firebase, sin depender de D1. El cierre y el mejor récord se escriben atómicamente; si falla una lectura del ranking, se muestra el resultado ya guardado y se permite actualizar la posición. Sin esa opción se conserva el motor anterior de D1.

Configuración en un proyecto de Firebase dedicado:

1. Crear una base **Cloud Firestore, Standard, modo producción**. El proyecto `quiz-messi-8674d` ya tiene una base en `southamerica-east1`, con protección contra eliminación y plan Blaze, que conserva una cuota sin costo y factura el uso adicional. Las reglas de `firestore.rules` admiten sólo la identidad dedicada `quiz-ranking-server`; los jugadores usan la API del cuestionario.
2. Configurar en el servidor `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` y el secreto `FIREBASE_REFRESH_TOKEN` de esa identidad. La organización impide crear claves de cuentas de servicio: no se modifica esa política. Firebase Authentication renueva el acceso limitado a las colecciones del cuestionario; el secreto queda fuera del repositorio y de `dist/`. El módulo también admite cuentas de servicio por IAM en entornos que las permitan, mediante `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` con `roles/datastore.user`.
3. Antes de activar el nuevo servidor, exportar `quiz_players` y, si se activa el motor completo, `quiz_games` en un archivo privado y ejecutar `node backend/migrate-firestore.mjs <datos-exportados.json> <credenciales-del-servidor.json>`. La importación conserva IDs, nombres, puntajes, tiempos y fechas; admite `{players, games}`, recupera identidades y partidas y nunca reemplaza un resultado mejor. Mantener esa exportación fuera del repositorio. El archivo de credenciales admite `project_id`, `api_key` y `refresh_token`, o una cuenta de servicio de Google.
4. Publicar el servidor y comprobar el ranking. El enlace de GitHub Pages sigue usando la misma API.

Cada escritura usa una precondición de Firestore para evitar que dos partidas simultáneas sobrescriban un récord mejor. `orderKey` mantiene el orden por puntaje, tiempo y fecha; el ID público resuelve empates exactos. `firestore.indexes.json` evita indexar campos innecesarios. No se requieren Cloud Functions para esta integración. Blaze está activo con «Pago de Firebase»; el cambio de plan no requiere volver a publicar el quiz ni migrar datos. El objetivo, los límites y las verificaciones pendientes están en [backend/SCALING.md](backend/SCALING.md).

`npm test` comprueba también la autenticación del servidor, persistencia, desempates, escrituras simultáneas, recuperación después de un corte y ausencia de datos privados en el ranking. Incluye 100 jugadores simultáneos contra una API simulada; esa prueba verifica los datos, no demuestra la capacidad de la nube. El 6 de octubre de 2026 se verificó además una partida real en el servidor publicado: tres respuestas simultáneas sumaron una sola vez, un reintento conservó el reloj y el resultado se leyó directamente en Firestore. Los datos de esa prueba se retiraron. Los cuatro récords y las nueve partidas anteriores se conservaron durante la migración.

## Fotografías

Se usan veintidós imágenes existentes. Cada resultado enlaza la fuente de su foto; el inicio reúne las veintidós referencias. Se agregaron diez momentos a partir de las referencias del usuario: Hungría, Messirve, Irán, el tiro libre a Estados Unidos, la conferencia del capitán, el control ante Nigeria, México, Topo Gigio, la entrevista con Edul y el festejo de rodillas ante Inglaterra. Las imágenes del control ante Nigeria y del festejo de rodillas conservan exactamente los archivos aportados por el usuario; se verificó el momento y se enlazó una publicación del mismo. Fuentes: ESPN, Plantillas de Memes, RPP, Globo/AP, Notimérica, MDZ/EFE, Todo Jujuy, Futbolargentino, TyC Sports, TNT Sports, UOL (Koji Watanabe/Getty Images), La Capital, Meridiano/AS, O Globo, AS, El Destape, TN/Reuters, beIN Sports, Infobae e iProfesional. Créditos fotográficos en las páginas enlazadas. La imagen final es la foto de Messi joven en Grido, no la de un parecido a Messi. Las fotografías no fueron generadas ni se afirma propiedad o licencia comercial sobre ellas.

## Preguntas

El banco está en `dist/questions.js`. El Excel revisado está en `outputs/quiz-messi-20261006/Quiz-Messi-preguntas.xlsx`: conserva las modificaciones del usuario, completa cuatro preguntas vacías, reemplaza un duplicado sobre Sudáfrica 2010 y corrige respuestas, redacción y explicaciones. La columna «Fuente de revisión» enlaza las referencias de los cambios. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.

## Edición de diez vidas

`RULES_VERSION=2` separa las partidas del banco nuevo de las anteriores. El ranking y sus récords existentes se conservan. La identidad recibe una única partida de esta edición, cuyo ID se deriva de su token privado y de la versión de reglas; variar `requestId` no genera otra partida. No se exponen el token ni ese vínculo en el ranking. El servidor valida los aciertos y las vidas, y las respuestas repetidas devuelven la misma explicación.

Para el motor alternativo SQLite/D1, aplicar `drizzle/0001_ten_lives.sql`, una migración aditiva que conserva las tablas y datos anteriores. La vista previa y las pruebas la aplican automáticamente. Firestore no necesita una migración de esquema ni cambios de permisos. Las reglas actuales siguen admitiendo las mismas colecciones.

Las pruebas recorren el banco completo y comprueban las cuatro opciones finales, el fin con errores previos, el bloqueo a cero vidas, los tiempos agotados, la recuperación de la explicación y las solicitudes simultáneas tanto en SQLite como en Firestore simulado.
