# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Diez vidas totales por navegador, diez segundos por pregunta. Al responder, la pregunta y las opciones permanecen en la misma pantalla: la elegida se marca verde o roja, y ante un error o tiempo agotado se revela la respuesta correcta. La explicación se puede desplegar ahí mismo. El botón «Siguiente pregunta» permite avanzar cuando el jugador quiera: la pausa no consume tiempo ni vidas, y el próximo reloj comienza al abrir la nueva pregunta. No se suma un acierto por la que se falló. El progreso y las vidas se guardan en el servidor: recargar, cambiar el nombre o repetir un inicio conserva la misma partida; el navegador también conserva las opciones y la selección de la respuesta en pausa. Al perder las diez vidas, el juego queda bloqueado para esa identidad. La última corrección ofrece «Ver mi resultado» y el récord ya queda guardado aunque el jugador no toque ese botón.

La pregunta 125 es «¿Quién es el mejor jugador de la historia?»: Lionel, Andrés, Messi y Cuccittini son respuestas correctas. Este cierre no tiene reloj, suma un acierto con cualquiera de las cuatro opciones y termina el recorrido. Completar el quiz también cierra la partida.

Al completar la última pregunta con vidas restantes aparece un cartel centrado: «COMPLETASTE EL QUIZ. ¡GANASTE!», con tres estrellas, una copa, los aciertos reales y las vidas restantes. «Ver mi resultado» cierra el festejo y deja acceder al Messi ganado, al ranking y al menú. También se gana habiendo cometido errores: no exige 125 aciertos. El cartel se muestra una vez por partida; actualizar el puesto conserva el cartel abierto y volver al resultado no lo repite. El modo de prueba permite verlo al empezar desde la pregunta 125, identificado como «Festejo de prueba», sin guardar un récord público.

En el ranking, los récords de 125 aciertos llevan una copa, el distintivo «PARTIDA PERFECTA · 10/10 VIDAS» y una fila dorada. El mismo distintivo aparece en la posición personal. Se usa el puntaje validado por el servidor: cada una de las 125 preguntas suma como máximo un punto y cada error o tiempo agotado resta una vida, por lo que 125 aciertos implica terminar con las diez vidas intactas. También se reconocen los récords ya guardados; se conserva el orden del ranking y sus desempates.

El navegador conserva un identificador privado. No es una verificación del dispositivo físico: cambiar de navegador, usar una sesión privada o borrar sus datos puede crear otra identidad. Un límite estricto entre navegadores requiere identificación adicional.

Los nombres pueden repetirse: cada récord pertenece a un ID público asociado a la identidad privada, nunca al nombre ni a la IP. Reabrir la misma identidad conserva su única partida y su mayor puntaje. Borrar la caché o los datos de un navegador no elimina los resultados guardados en Firebase; borrar toda la identidad local permite jugar con una identidad nueva y conserva el récord anterior en el histórico. Esto está permitido: no se agrega registro ni recuperación de identidad. Los resultados no tienen caducidad ni una operación pública de borrado.

Antes de empezar se elige el nombre. Al terminar, los aciertos de esa partida determinan qué Messi sos, con una foto real de su historia. El ranking muestra la foto ganada por el mejor récord de cada jugador, además de su posición global. El resultado final muestra sólo el Messi ganado, su foto y descripción, los aciertos de esa partida, el puesto global y el acceso al ranking. No incluye vidas, la última respuesta ni un listado de jugadores.

| Aciertos | Resultado |
| --- | --- |
| 0–5 | Messi de los 43 segundos · EL DEBUT ANTE HUNGRÍA · 2005 |
| 6–11 | Messi debutante · PRIMER GOL MUNDIALISTA · 2006 |
| 12–17 | Messi en el banco · ALEMANIA 2006 |
| 18–23 | Messirve · EL MEME DE LOS LENTES |
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
| 105–110 | Messi campeón del mundo · QATAR 2022 |
| 111–114 | Messi de la remontada · GOL ANTE EGIPTO · MUNDIAL 2026 |
| 115–123 | Messi de rodillas · EL FESTEJO ANTE INGLATERRA · MUNDIAL 2026 |
| 124 | Messi de la última final · MEDALLA DE PLATA · MUNDIAL 2026 |
| 125 | Messi 2012 · EL NIVEL DEFINITIVO |

Los veintidós niveles se definen en `dist/tiers.js`, con sus fotos en `dist/assets/levels/`. Siguen la propuesta cronológica aprobada: debut de 2005, debut con gol de 2006 y banco ante Alemania, luego los momentos hasta 2026. Messirve queda después de 2006 de forma provisoria, porque no está confirmada la fecha de la foto. Messi 2012 es la excepción final, exclusiva de 125 aciertos. Los intervalos de puntaje se conservan y se reasignan las fotos; los resultados anteriores y el ranking también muestran este orden según sus aciertos guardados. El dato usado es el puntaje validado por el servidor. El campo antiguo de avatar se conserva sólo por compatibilidad con la API; ya no determina ninguna foto. La categoría de 2010 usa exactamente la foto elegida y aportada por el usuario: Maradona abraza y besa a Messi, de espaldas con la camiseta 10. Su enlace abre esa imagen.

El ranking y las partidas se guardan en Cloud Firestore (Firebase), separado de GitHub Pages, en el proyecto `quiz-messi-8674d`. Al agotar las diez vidas o completar el quiz, la partida y el nuevo récord se guardan juntos antes de mostrar el resultado. También se registra un primer resultado de cero aciertos. Cualquier visitante puede abrir el ranking global sin jugar ni iniciar sesión y recorrer todos los récords en páginas de hasta cien jugadores iguales en todos los dispositivos, con scroll vertical; el resultado muestra el puesto personal y ofrece acceso al listado completo en otra pantalla. El ranking visible consulta los datos actuales al abrirlo, actualizarlo o volver a la pestaña; la primera página se refresca cada quince segundos mientras está visible. Las consultas de compatibilidad conservan una caché de quince segundos. El servidor valida respuestas y tiempos; el navegador conserva preferencias y los identificadores privados del jugador y de su partida. Una fila por navegador, conservando su mejor resultado. Desempate por menor tiempo acumulado y luego por la fecha del récord. No hay verificación de identidad entre dispositivos.

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

`/victory-check.html` comprueba el festejo con errores, la partida perfecta, el foco, el cierre y su conservación durante una actualización del resultado. `/results-check.html?score=124&complete=1` permite ver una victoria con una respuesta incorrecta. Estas vistas sólo existen en la vista previa local.

`/screen-check.html` está disponible sólo en la vista previa: comprueba que el inicio, las 125 preguntas, sus respuestas y todos los resultados entren en la pantalla; recorre el ranking con 137 jugadores ficticios en memoria y verifica el regreso al resultado. No modifica datos públicos. `/layout-check.html` también está disponible sólo en la vista previa: renderiza las 125 preguntas para comprobar que el texto y el botón siguiente no se superponen ni requieren scroll. `/results-check.html?score=125` permite revisar los niveles y las fotos con resultados ficticios identificados como «Vista de prueba», sin escribir en el ranking.

Pantallas verificadas sin scroll en 320×480, 320×568, 375×667, 390×844, 568×320 y 1440×1080, con preguntas, respuestas, resultados; ranking con scroll vertical y navegación completa. También se comprobaron un acierto, un error, el tiempo agotado, reintentos de respuestas, recuperación de partidas y conservación del mejor récord.

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

El servidor se publica por **Sites**, separado de GitHub Pages. Su ID es `appgprj_6ac470987bf081918291e55728c8818a`. La versión publicada del servidor es la 9, con fuente `d71fa7680e4f9267b72584230db1f1f3bf15d073` en el repositorio administrado por Sites. La edición con diez vidas usa `RULES_VERSION=2`. Abrir primero esa fuente mediante el flujo de Sites antes de editar o publicar el servidor. Sincronizar desde este repositorio los archivos de `backend/` y `dist/questions.js` que se hayan modificado; construir con `npm run build` en el checkout del servicio. Las fotos y la interfaz actual están en este repositorio de GitHub Pages.

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

La foto de «Messi del tiro libre» usa `dist/assets/levels/14-tiro-libre-2016-limpia.png`: un encuadre de la fotografía original que excluye el dibujo BMS, el marcador con los países y la marca de la transmisión. Conserva los píxeles originales de Messi, sin generación ni reconstrucción. La imagen fuente se conserva en `14-tiro-libre-2016.jpg`.

El logo del inicio está en `dist/assets/logo-saludo-10.png`: una silueta original de un futbolista genérico de espaldas, celebrando con el 10 en la camiseta. Se generó con la herramienta integrada de imágenes, en celeste y azul oscuro con fondo transparente. El prompt está en `outputs/branding/logo-prompt.txt`.

Se usan veintidós imágenes existentes. Cada resultado enlaza la fuente de su foto. Se agregaron diez momentos a partir de las referencias del usuario: Hungría, Messirve, Irán, el tiro libre a Estados Unidos, la conferencia del capitán, el control ante Nigeria, México, Topo Gigio, la entrevista con Edul y el festejo de rodillas ante Inglaterra. Las imágenes del control ante Nigeria y del festejo de rodillas conservan exactamente los archivos aportados por el usuario; se verificó el momento y se enlazó una publicación del mismo. Fuentes: ESPN, Plantillas de Memes, RPP, Globo/AP, Notimérica, MDZ/EFE, Todo Jujuy, Futbolargentino, TyC Sports, TNT Sports, UOL (Koji Watanabe/Getty Images), La Capital, Meridiano/AS, O Globo, AS, El Destape, TN/Reuters, beIN Sports, Infobae e iProfesional. Créditos fotográficos en las páginas enlazadas. La imagen final es la foto de Messi joven en Grido, no la de un parecido a Messi. Las fotografías no fueron generadas ni se afirma propiedad o licencia comercial sobre ellas.

## Preguntas

El banco está en `dist/questions.js`. El Excel revisado está en `outputs/quiz-messi-20261006/Quiz-Messi-preguntas.xlsx`: conserva las modificaciones del usuario, completa cuatro preguntas vacías, reemplaza un duplicado sobre Sudáfrica 2010 y corrige respuestas, redacción y explicaciones. La primera pregunta trata del número 17 que Messi usó en su debut con Argentina Sub-20 ante Paraguay el 29 de junio de 2004; la web, el servidor y el Excel comparten esa pregunta. La columna «Fuente de revisión» enlaza las referencias de los cambios. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.

## Edición de diez vidas

`RULES_VERSION=2` separa las partidas del banco nuevo de las anteriores. El ranking y sus récords existentes se conservan. La identidad recibe una única partida de esta edición, cuyo ID se deriva de su token privado y de la versión de reglas; variar `requestId` no genera otra partida. No se exponen el token ni ese vínculo en el ranking. El servidor valida los aciertos y las vidas, y las respuestas repetidas devuelven la misma explicación.

Para el motor alternativo SQLite/D1, aplicar `drizzle/0001_ten_lives.sql`, una migración aditiva que conserva las tablas y datos anteriores. La vista previa y las pruebas la aplican automáticamente. Firestore no necesita una migración de esquema ni cambios de permisos. Las reglas actuales siguen admitiendo las mismas colecciones.

La migración aditiva `drizzle/0002_accepted_answer.sql` incorpora la elección aceptada y la versión del banco en SQLite. Firestore incorpora esos campos al guardar la partida, sin cambiar reglas ni permisos.

Las pruebas recorren el banco completo y comprueban las cuatro opciones finales, el fin con errores previos, el bloqueo a cero vidas, los tiempos agotados, la recuperación de la explicación y las solicitudes simultáneas tanto en SQLite como en Firestore simulado.

## Navegación del menú

El ranking histórico muestra hasta 100 jugadores por página, con los mismos puestos en todos los tamaños de pantalla. La lista usa el scroll vertical de la página y «Anterior»/«Siguiente» para grupos posteriores; esos botones se ocultan si todos los participantes entran en una sola página. El refresco automático y el regreso a la pestaña conservan la página y la posición de scroll. La API admite bloques de 50 y la interfaz reúne hasta dos bloques sin modificar el servidor publicado.

Después de jugar, «Tu posición global» permanece arriba de la lista al desplazarse: muestra el puesto total del jugador y los aciertos y la foto de su mejor récord, aunque su fila esté fuera de los primeros 100. La posición se consulta nuevamente mediante la partida terminada al abrir o refrescar el ranking. Si esa consulta falla, se conserva el acceso al listado y se ofrece actualizar la posición; no se inventa un puesto a partir de la página visible. Los visitantes que todavía no jugaron ven únicamente el ranking global.

El inicio incluye un botón visible «Ver ranking histórico». El ranking y el resultado final permiten volver al menú principal. Volver al menú conserva la partida terminada y sus vidas: muestra «Ver mi resultado» y permite consultar el ranking, sin habilitar una partida nueva. El servidor mantiene el bloqueo de la edición al agotar diez vidas o completar el quiz.

## Preguntas nuevas, prueba y reconexión

Se reemplazaron ocho preguntas básicas por las pedidas por el usuario: rival del partido 200, conferencia contra la prensa de 2016, Wout Weghorst, primer tiro libre ante Paraguay, remate bajo la barrera ante Uruguay, asistencias, nacimiento y cantidad de dorsales en la mayor. Se mantiene el total de 125 y la primera pregunta de la Sub-20. La de Julián Álvarez se reemplazó por Daniele Orsato; el distractor de la frase de 2016 ahora usa «No te largués, estamos viendo el partido». Las fuentes y el orden actualizado están en el Excel. La pregunta de asistencias especifica el balance de la AFA de octubre de 2026, que publica 66; otras fuentes emplean recuentos distintos.

Las partidas nuevas usan `BANK_VERSION=20261006-2`. Las que ya habían comenzado conservan el banco anterior de `backend/legacy-questions.js`, las diez vidas y su progreso. La API entrega la pregunta y la opción realmente registrada con la corrección; el navegador usa esa información para evitar atribuir un acierto guardado a una selección posterior o a otro orden de opciones.

`/prueba.html` permite elegir cualquier pregunta de 1 a 125, continuar desde ella y volver al selector tocando «PRUEBA». Tiene almacenamiento separado y no hace escrituras en la API real ni consume vidas de la partida pública. El puntaje empieza en cero y cuenta sólo los aciertos de la prueba; recargar vuelve al selector.

La opción elegida se conserva antes del envío. Ante fallas de red o respuestas 5xx, se reenvía el mismo contenido hasta dos veces automáticamente; si sigue fallando, se puede confirmar esa elección o recargar para recuperarla. Los reintentos son idempotentes. El servidor acepta una tolerancia de entrega de hasta dos segundos únicamente para una opción marcada antes de los diez segundos, acotada por el reloj del servidor; no concede tiempo indefinido por estar sin conexión. El cierre muestra la corrección tras el guardado atómico y obtiene la posición del ranking después, sin bloquear la corrección por esa consulta.

El ranking público de la interfaz usa `fresh=1` y `cache: no-store`, para saltar tanto la caché de páginas como la del total. Se refresca al abrirlo, al tocar «Actualizar ranking», al volver a una pestaña y cada quince segundos en la primera página visible; no consulta en segundo plano ni cambia automáticamente las páginas posteriores. Las partidas que siguen en curso aparecen cuando terminan y se guarda su récord.

Se incorporaron metadatos Open Graph y Twitter con la foto existente de Messi besando la Copa de Qatar 2022. La foto tiene 1086×753 píxeles y se sirve desde GitHub Pages, con URL absoluta. WhatsApp administra su propia caché de vistas previas; para probar una vista nueva se puede compartir https://gb-films.github.io/QUIZ-MESSI/?v=20261006. Los recursos de la interfaz usan una versión en la URL para renovar los archivos en teléfonos que conservaban una copia vieja.

Las verificaciones incluyen los 125 ítems sin repetidos, Excel sincronizado, SQLite y Firestore simulado, compatibilidad de partidas previas, tolerancia de entrega acotada, reintentos tras un commit, ranking fresco antes de que venza la caché y modo de prueba. Una pantalla local simuló dos respuestas perdidas después del guardado y recuperó la misma opción descontando una sola vida.
