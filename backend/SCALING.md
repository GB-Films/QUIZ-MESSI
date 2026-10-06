# Capacidad y paso de Spark a Blaze

Proyecto: `quiz-messi-8674d`. Objetivo acordado: un millón de jugadores acumulados. El 6 de octubre de 2026 el usuario autorizó activar Blaze con la cuenta de facturación Gran Berta Films. Google rechazó la vinculación con `FAILED_PRECONDITION` y `QuotaFailure`: esa cuenta alcanzó su cuota de proyectos con facturación. El proyecto sigue en Spark, pendiente de que Google amplíe esa cuota o el usuario elija otra cuenta. Firestore Standard está creado en `southamerica-east1` con cuota gratuita y protección contra eliminación. Authentication y el servidor están activos; partidas y ranking ya se guardan en Firestore. No se ha demostrado capacidad de un millón de jugadores en producción.

## Guardado

`FIREBASE_GAMES_ENABLED=true` activa el motor de `firebase-games.js`. Partidas, identidades privadas y récords pasan a Firestore; ese modo no necesita D1. Cada partida y jugador usa un documento independiente con un identificador aleatorio. El cierre de la partida, la actualización del mejor resultado y la fila del ranking se guardan en un solo commit con precondiciones: todas las escrituras se aplican juntas o ninguna se aplica.

Los inicios usan un `requestId` y un token de jugador que el navegador guarda antes de enviar la solicitud. Si se pierde la respuesta, puede recuperar la misma partida. Las respuestas simultáneas cuentan una sola vez y los reintentos de «siguiente» no reinician el reloj. Una consulta de ranking fallida no oculta un resultado que ya quedó guardado.

Las reglas bloquean a los jugadores y admiten sólo la identidad dedicada `quiz-ranking-server`, cuya credencial de renovación se guarda como secreto del servidor. Esta identidad sólo accede a las colecciones del cuestionario; no tiene permisos de administración de Google Cloud. Los jugadores no requieren cuentas de Firebase Authentication. No se desactiva la política que impide crear claves de cuentas de servicio. Los campos que no se consultan quedan fuera de los índices, incluidos los tiempos crecientes de las partidas. El ranking usa un índice de `orderKey`, limita el top a cinco filas y agrupa consultas repetidas durante 15 segundos por instancia. No hay un contador único que todos los jugadores tengan que actualizar.

## Cuotas del arranque

Firestore Standard incluye 20.000 escrituras, 50.000 lecturas diarias y 1 GiB de almacenamiento gratuito. Estas cifras son operaciones y espacio, no jugadores. Una primera partida con cinco aciertos y un error usa aproximadamente 16 escrituras en el motor completo; las repeticiones y las consultas agregadas cambian el consumo. Un millón de jugadores no cabe en un único día de cuota gratuita.

Spark no se convierte automáticamente en Blaze. Al exceder cuotas, nuevas operaciones pueden fallar aunque los datos ya guardados se conserven. El seguimiento debe revisar lecturas, escrituras y almacenamiento del proyecto y avisar al 70% de la cuota o ante una tendencia que pronostique agotamiento antes de la siguiente revisión. El cambio a Blaze ya está autorizado para Gran Berta Films, pero la cuota de vinculación lo bloquea. No usar otra cuenta ni desvincular proyectos existentes sin autorización. Si Google pide aceptar condiciones o introducir datos de pago, debe intervenir el usuario.

La caché local de las instancias es una optimización: no reemplaza cuotas, control de abuso ni una caché distribuida. La posición exacta usa `count()` sobre un índice y aumenta su trabajo y costo al crecer el ranking. Antes de difusión masiva, medir esa consulta con datos representativos y pasar a un ranking calculado periódicamente o a un índice dedicado si se vuelve lento. Los valores del top y el total pueden tardar 15 segundos en actualizarse por la caché.

El límite actual de inicios por jugador no reemplaza App Check o una protección equivalente contra bots. Antes de una campaña masiva, configurar protección de abuso, alertas, pruebas de carga reales y cuotas del proveedor del servidor. La web en GitHub Pages tiene un límite flexible de 100 GB por mes; revisar el consumo de imágenes y trasladar los archivos a un CDN dimensionado si hace falta.

## Activación y verificación

1. Renovar la sesión de administración y crear Firestore Standard en modo producción; elegir ubicación cercana al servidor y la audiencia.
2. Publicar `firestore.rules` y `firestore.indexes.json`. Guardar las credenciales sólo en los secretos del servidor.
3. Exportar `quiz_players` y `quiz_games` en una lista o un objeto `{players, games}` privado. Migrar identidades, récords y partidas antes de activar el motor nuevo. Evitar que se escriban nuevas partidas en el servidor anterior durante el corte.
4. Activar `FIREBASE_GAMES_ENABLED=true`, publicar el servidor y la web y comprobar un resultado real, su lectura desde otro dispositivo y la recuperación de una partida. Mantener la copia anterior para revertir si falla la verificación.
5. Configurar seguimiento de cuota y pruebas progresivas sin agotar Spark. Un aumento del plan no valida por sí solo la capacidad del servidor.

`npm test` incluye una API de Firestore simulada: 100 jugadores independientes al mismo tiempo, 20 reintentos de una misma respuesta, pérdida de respuesta después de un commit y 100 lecturas de ranking agrupadas en una consulta por instancia. Verifica coherencia e idempotencia; no mide la capacidad real de Firebase, Sites o GitHub Pages.

La verificación real del 6 de octubre de 2026 guardó una partida en producción, confirmó el récord en Firestore, recuperó la misma partida y comprobó tres respuestas simultáneas y un reintento de «siguiente». Los documentos de prueba se retiraron. Se migraron los cuatro jugadores y las nueve partidas existentes durante una pausa de escrituras; la copia privada quedó fuera del repositorio. Esto demuestra persistencia y recuperación, no carga de un millón de jugadores.

Fuentes: [cuotas de Firestore](https://firebase.google.com/docs/firestore/quotas), [buenas prácticas de escalado](https://firebase.google.com/docs/firestore/best-practices), [costo de agregaciones](https://firebase.google.com/docs/firestore/pricing), [rankings y sus límites](https://firebase.google.com/codelabs/build-leaderboards-with-firestore), [planes de Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) y [límites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
