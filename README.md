# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Una vida por partida, diez segundos por pregunta. El primer error o el tiempo agotado termina el juego. Al acertar se habilita la siguiente pregunta; el nuevo reloj comienza al abrirla. La pantalla de juego mantiene las cuatro opciones y el botón siguiente visibles en el celular.

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

## Servicio del ranking

`backend/index.js` contiene la API y `drizzle/` la migración de SQLite para D1. El servicio se aloja en el sitio de Messi previamente creado, mientras el enlace de juego continúa en GitHub Pages. `dist/` contiene únicamente la web pública de Pages; el archivo compilado del servidor se prepara en el checkout del servicio, separado del despliegue de Pages.

Para generar nuevas migraciones se instalan las herramientas con `npm install` y se ejecuta `npm run db:generate`. Las migraciones aplicadas se conservan sin modificar. El manifiesto de alojamiento y los secretos no se publican en este repositorio.

### Firebase

`backend/firestore.js` guarda los mejores resultados en `quizRankings/argentina-survival-1/players/{public_id}` mediante la API de Firestore. Con Firebase activo, el top 5, el total de jugadores y la posición individual se consultan en esa base. `FIREBASE_GAMES_ENABLED=true` activa también `backend/firebase-games.js`: partidas, identidades privadas y récords se guardan en Firebase, sin depender de D1. El cierre y el mejor récord se escriben atómicamente; si falla una lectura del ranking, se muestra el resultado ya guardado y se permite actualizar la posición. Sin esa opción se conserva el motor anterior de D1.

Configuración en un proyecto de Firebase dedicado:

1. Crear una base **Cloud Firestore, Standard, modo producción**. El proyecto `quiz-messi-8674d` ya tiene una base gratuita en `southamerica-east1`, con protección contra eliminación. Las reglas de `firestore.rules` admiten sólo la identidad dedicada `quiz-ranking-server`; los jugadores usan la API del cuestionario.
2. Configurar en el servidor `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` y el secreto `FIREBASE_REFRESH_TOKEN` de esa identidad. La organización impide crear claves de cuentas de servicio: no se modifica esa política. Firebase Authentication renueva el acceso limitado a las colecciones del cuestionario; el secreto queda fuera del repositorio y de `dist/`. El módulo también admite cuentas de servicio por IAM en entornos que las permitan, mediante `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` con `roles/datastore.user`.
3. Antes de activar el nuevo servidor, exportar `quiz_players` y, si se activa el motor completo, `quiz_games` en un archivo privado y ejecutar `node backend/migrate-firestore.mjs <datos-exportados.json> <credenciales-del-servidor.json>`. La importación conserva IDs, nombres, puntajes, tiempos y fechas; admite `{players, games}`, recupera identidades y partidas y nunca reemplaza un resultado mejor. Mantener esa exportación fuera del repositorio. El archivo de credenciales admite `project_id`, `api_key` y `refresh_token`, o una cuenta de servicio de Google.
4. Publicar el servidor y comprobar el ranking. El enlace de GitHub Pages sigue usando la misma API.

Cada escritura usa una precondición de Firestore para evitar que dos partidas simultáneas sobrescriban un récord mejor. `orderKey` mantiene el orden por puntaje, tiempo y fecha; el ID público resuelve empates exactos. `firestore.indexes.json` evita indexar campos innecesarios. No se requieren Cloud Functions para esta integración. El cambio a Blaze fue autorizado, pero Google bloqueó la vinculación a Gran Berta Films por su cuota de proyectos; el plan sigue en Spark hasta resolver ese bloqueo. El objetivo, los límites y las verificaciones pendientes están en [backend/SCALING.md](backend/SCALING.md).

`npm test` comprueba también la autenticación del servidor, persistencia, desempates, escrituras simultáneas, recuperación después de un corte y ausencia de datos privados en el ranking. Incluye 100 jugadores simultáneos contra una API simulada; esa prueba verifica los datos, no demuestra la capacidad de la nube. El 6 de octubre de 2026 se verificó además una partida real en el servidor publicado: tres respuestas simultáneas sumaron una sola vez, un reintento conservó el reloj y el resultado se leyó directamente en Firestore. Los datos de esa prueba se retiraron. Los cuatro récords y las nueve partidas anteriores se conservaron durante la migración.

## Fotografías

Se usan veintidós imágenes existentes. Cada resultado enlaza la fuente de su foto; el inicio reúne las veintidós referencias. Se agregaron diez momentos a partir de las referencias del usuario: Hungría, Messirve, Irán, el tiro libre a Estados Unidos, la conferencia del capitán, el control ante Nigeria, México, Topo Gigio, la entrevista con Edul y el festejo de rodillas ante Inglaterra. Las imágenes del control ante Nigeria y del festejo de rodillas conservan exactamente los archivos aportados por el usuario; se verificó el momento y se enlazó una publicación del mismo. Fuentes: ESPN, Plantillas de Memes, RPP, Globo/AP, Notimérica, MDZ/EFE, Todo Jujuy, Futbolargentino, TyC Sports, TNT Sports, UOL (Koji Watanabe/Getty Images), La Capital, Meridiano/AS, O Globo, AS, El Destape, TN/Reuters, beIN Sports, Infobae e iProfesional. Créditos fotográficos en las páginas enlazadas. La imagen final es la foto de Messi joven en Grido, no la de un parecido a Messi. Las fotografías no fueron generadas ni se afirma propiedad o licencia comercial sobre ellas.

## Preguntas

El banco está en `dist/questions.js`. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.
