# Sistema de Control de Juicios

Aplicación de una sola página (`index.html`) para el control de expedientes
judiciales (juicios de nulidad, agrarios, laborales), con backend en Supabase.

## Versionado

La versión vive en `const APP_VERSION` (buscar `VERSIÓN DE LA APP` en
`index.html`) y se muestra en la barra superior de la app (`file-bar`).

Esquema `MAYOR.MENOR.CAMBIO`:

- Cada cambio que se haga al archivo sube el **tercer número** en 1
  (`1.2.0` → `1.2.1` → `1.2.2` … hasta `1.2.9`).
- Al llegar a `1.2.9`, el siguiente cambio **reinicia el tercer número a 0
  y sube el MENOR** (`1.2.9` → `1.3.0`).
- El número MAYOR se sube manualmente sólo cuando el usuario lo indique
  explícitamente (cambio grande / release mayor).

Cuando se haga cualquier cambio a `index.html`, `app.js` o `styles.css`,
actualizar `APP_VERSION` siguiendo esta regla como parte del mismo commit.

`index.html` carga `app.js` y `styles.css` con un query string
`?v=<APP_VERSION>` (cache-busting) — al subir `APP_VERSION` hay que
actualizar también esos dos `?v=` en `index.html` para que el navegador
del usuario no siga sirviendo una versión vieja desde caché.
