# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Una vida por partida, diez segundos por pregunta. El primer error o el tiempo agotado termina el juego. Al acertar se habilita la siguiente pregunta; el nuevo reloj comienza al abrirla. La pantalla de juego mantiene las cuatro opciones y el botón siguiente visibles en el celular.

Antes de empezar se elige nombre y uno de cuatro personajes. El Messi joven está seleccionado de entrada. Al terminar aparece el personaje, el resultado de la partida, el mejor récord, la posición global y los cinco primeros.

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

`/layout-check.html` está disponible sólo en la vista previa: renderiza las 125 preguntas para comprobar que el texto y el botón siguiente no se superponen ni requieren scroll.

Verificado en 320×568, 375×667 y 390×844. También se comprobaron un acierto, un error, el tiempo agotado, reintentos de respuestas, recuperación de partidas y conservación del mejor récord.

## Servicio del ranking

`backend/index.js` contiene la API y `drizzle/` la migración de SQLite para D1. El servicio se aloja en el sitio de Messi previamente creado, mientras el enlace de juego continúa en GitHub Pages. `dist/` contiene únicamente la web pública de Pages; el archivo compilado del servidor se prepara en el checkout del servicio, separado del despliegue de Pages.

Para generar nuevas migraciones se instalan las herramientas con `npm install` y se ejecuta `npm run db:generate`. Las migraciones aplicadas se conservan sin modificar. El manifiesto de alojamiento y los secretos no se publican en este repositorio.

## Ilustraciones

Se usan las cuatro referencias existentes elegidas durante el diseño. Créditos y enlaces originales en el inicio: Dibujando.net, TyC Sports, PNGFind y Pinterest. Los derechos de las ilustraciones pertenecen a sus autores. PNGFind indica uso personal para el Messi joven; no se afirma una licencia comercial ni propiedad sobre estas imágenes.

## Preguntas

El banco está en `dist/questions.js`. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.
