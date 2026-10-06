# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Una vida por partida, diez segundos por pregunta. El primer error o el tiempo agotado termina el juego. Al acertar se habilita la siguiente pregunta; el nuevo reloj comienza al abrirla. La pantalla de juego mantiene las cuatro opciones y el botón siguiente visibles en el celular.

Antes de empezar se elige el nombre. Al terminar, los aciertos de esa partida determinan qué Messi sos, con una foto real de su historia. El ranking muestra la foto ganada por el mejor récord de cada jugador, además de su posición global. Compartir incluye el Messi ganado y el puntaje.

| Aciertos | Resultado |
| --- | --- |
| 0–13 | Messi en el banco · Alemania 2006 |
| 14–27 | Messi debutante · primer gol mundialista 2006 |
| 28–41 | Messi olímpico · con Agüero y las medallas de oro de Beijing 2008 |
| 42–55 | Messi con el Diego · abrazo tras la eliminación en Sudáfrica 2010 |
| 56–69 | Messi finalista · Brasil 2014 |
| 70–83 | Messi salvador · Quito 2017 |
| 84–97 | Messi de América · 2021 |
| 98–104 | Messi de Wembley · Finalissima 2022 |
| 105–110 | Messi de la remontada · festejo del gol ante Egipto en 2026 |
| 111–123 | Messi campeón del mundo · besando la Copa en Qatar 2022 |
| 124 | Messi de la última final · foto con lágrimas y medalla de plata que publicó en Instagram tras el Mundial 2026 |
| 125 | Messi Grido · nivel exclusivo para un pleno |

Los doce niveles se definen en `dist/tiers.js`, con sus fotos en `dist/assets/levels/`. El dato usado es el puntaje validado por el servidor. El campo antiguo de avatar se conserva sólo por compatibilidad con la API; ya no determina ninguna foto. La categoría de 2010 usa el abrazo de Messi y Maradona sin los demás integrantes del cuerpo técnico.

El ranking usa almacenamiento compartido en el servidor, separado de GitHub Pages. El servidor valida respuestas y tiempos; el navegador conserva preferencias y los identificadores privados del jugador y de su partida. Una fila por navegador, conservando su mejor resultado. Desempate por menor tiempo acumulado y luego por la fecha del récord. No hay verificación de identidad entre dispositivos.

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

## Fotografías

Se usan doce fotografías existentes. Cada resultado enlaza la fuente de su foto; el inicio reúne las doce referencias. Fuentes: TyC Sports, TNT Sports, UOL (Koji Watanabe/Getty Images), La Capital, Meridiano/AS, O Globo, AS, El Destape, TN/Reuters, beIN Sports, Infobae e iProfesional. Créditos fotográficos en las páginas enlazadas. La imagen final es la foto de Messi joven en Grido, no la de un parecido a Messi. Las fotografías no fueron generadas ni se afirma propiedad o licencia comercial sobre ellas.

## Preguntas

El banco está en `dist/questions.js`. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.
