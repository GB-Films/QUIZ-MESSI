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

El ranking admite persistencia en Cloud Firestore (Firebase), separada de GitHub Pages. Se activa al configurar las credenciales de Firebase en el servidor; hasta entonces se mantiene el almacenamiento actual. El servidor valida respuestas y tiempos; el navegador conserva preferencias y los identificadores privados del jugador y de su partida. Una fila por navegador, conservando su mejor resultado. Desempate por menor tiempo acumulado y luego por la fecha del récord. No hay verificación de identidad entre dispositivos.

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

`backend/firestore.js` guarda los mejores resultados en `quizRankings/argentina-survival-1/players/{public_id}` mediante la API de Firestore. Con Firebase activo, el top 5, el total de jugadores y la posición individual se consultan en esa base. D1 conserva las partidas y una copia del mejor récord para recuperar escrituras fallidas. Si Firestore falla, la API pide reconectar; no muestra otro ranking ni pierde el resultado de la partida terminada.

Configuración en un proyecto de Firebase dedicado:

1. Crear una base **Cloud Firestore, Standard, modo producción**. Las reglas de `firestore.rules` bloquean el acceso directo desde navegadores; la cuenta del servidor accede mediante IAM.
2. Configurar en el servidor `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`. La clave privada debe guardarse como secreto, fuera del repositorio y de `dist/`. La cuenta necesita permiso de lectura y escritura de Firestore (`roles/datastore.user`).
3. Antes de activar el nuevo servidor, exportar los récords de `quiz_players` y ejecutar `node backend/migrate-firestore.mjs <jugadores-exportados.json> <cuenta-de-servicio.json>`. La importación conserva IDs, nombres, puntajes, tiempos y fechas; puede repetirse y nunca reemplaza un resultado mejor. No exportar partidas ni tokens privados.
4. Publicar el servidor y comprobar el ranking. El enlace de GitHub Pages sigue usando la misma API.

Cada escritura usa una precondición de Firestore para evitar que dos partidas simultáneas sobrescriban un récord mejor. `orderKey` mantiene el orden por puntaje, tiempo y fecha con un índice automático de un solo campo; el ID público resuelve empates exactos. No se requieren Cloud Functions ni un cambio de plan para esta integración.

`npm test` comprueba también la autenticación del servidor, persistencia, desempates, escrituras simultáneas, recuperación después de un corte y ausencia de datos privados en el ranking. Estas pruebas simulan la API de Firebase; la conexión real requiere el proyecto y sus credenciales.

## Fotografías

Se usan veintidós imágenes existentes. Cada resultado enlaza la fuente de su foto; el inicio reúne las veintidós referencias. Se agregaron diez momentos a partir de las referencias del usuario: Hungría, Messirve, Irán, el tiro libre a Estados Unidos, la conferencia del capitán, el control ante Nigeria, México, Topo Gigio, la entrevista con Edul y el festejo de rodillas ante Inglaterra. Las imágenes del control ante Nigeria y del festejo de rodillas conservan exactamente los archivos aportados por el usuario; se verificó el momento y se enlazó una publicación del mismo. Fuentes: ESPN, Plantillas de Memes, RPP, Globo/AP, Notimérica, MDZ/EFE, Todo Jujuy, Futbolargentino, TyC Sports, TNT Sports, UOL (Koji Watanabe/Getty Images), La Capital, Meridiano/AS, O Globo, AS, El Destape, TN/Reuters, beIN Sports, Infobae e iProfesional. Créditos fotográficos en las páginas enlazadas. La imagen final es la foto de Messi joven en Grido, no la de un parecido a Messi. Las fotografías no fueron generadas ni se afirma propiedad o licencia comercial sobre ellas.

## Preguntas

El banco está en `dist/questions.js`. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.
