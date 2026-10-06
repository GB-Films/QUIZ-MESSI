# Messi · El quiz albiceleste

125 preguntas sobre Lionel Messi con la Selección Argentina, ordenadas de muy fácil a experto. Incluye Mundiales, Copa América, Eliminatorias, amistosos, Sub-20 y Juegos Olímpicos.

Cada pregunta tiene cuatro opciones y una explicación. El juego calcula el puntaje y conserva el avance en el navegador del jugador. Funciona en celulares y computadoras.

## GitHub Pages

El contenido de `dist/` se publica con el flujo `.github/workflows/pages.yml` al subir cambios a `main`.

En **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**.

## Uso local

Se requiere Node.js. No hace falta instalar dependencias.

```sh
npm run check
npm start
```

Abrir `http://127.0.0.1:4173/`.

## Preguntas

El banco está en `dist/questions.js`. La cifra de 125 preguntas usa los goles de la Selección mayor informados por la AFA, verificados el 6 de octubre de 2026. Es una edición fija, sin actualizaciones automáticas.

Quiz independiente, sin afiliación oficial con Lionel Messi, la AFA o la FIFA.
