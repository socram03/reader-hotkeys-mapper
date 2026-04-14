# Reader Hotkeys Mapper

**Extension de navegador** para leer manga y manhwa usando solo el teclado.
Incluye soporte nativo para varios sitios populares y un sistema de mapeo local para agregar otras webs sin tocar el codigo.

Desarrollada en **TypeScript**, bundleada con **Bun**. La UI del popup y de opciones esta hecha con **Preact**, y las dependencias se gestionan con **Bun**.

## Funciones

- Navegacion por capitulo: `ArrowLeft` y `ArrowRight`
- Volver a la serie o ficha: `M`
- Scroll rapido: `J` y `K`
- Saltos rapidos al 10%-90% del capitulo: `1` al `9`
- Retomar el ultimo capitulo leido y la posicion de lectura: `L`
- Restaurar la posicion guardada del capitulo actual: `R`
- Modo zen: `Z` (persistente)
- Auto-scroll y auto-next al final del capitulo: `A` (persistente)
- Pausar o reanudar auto-scroll: `Espacio`
- Ajustar velocidad del auto-scroll: `+` y `-`
- Ayuda contextual: `?` o `H`
- Mapeo visual rapido: `U`

## Interfaz de la Extension

- `popup.html`: Control rapido sobre la ultima pestana compatible abierta en la ventana actual.
- `options.html`: Editor avanzado de mapeos con multiples mapeos por dominio, activacion y desactivacion de sitios personalizados, alias de host, prefijos de ruta soportados, edicion manual de selectores CSS, edicion de `readingPrefix` y enlaces fallback, importacion y exportacion JSON, exportacion de ultimos leidos por obra, selector visual para pestanas abiertas, reinyeccion automatica del content script y un boton para retomar el ultimo capitulo leido desde el popup.

## Sitios con Soporte Nativo

- `zonatmo.com`
- `olympusbiblioteca.com`
- `leerolymp.com`
- `manhwaweb.com`

## Como Mapear un Sitio Nuevo

Metodo recomendado:

1. Abre la pagina de `Opciones` de la extension.
2. Haz click en `Picker in another tab`.
3. Ve a la web que quieres mapear y selecciona los botones correspondientes.
4. Activa el mapeo cuando termines.

En sitios no reconocidos, los atajos quedan desactivados hasta que actives manualmente un mapeo personalizado.

Los mapeos se guardan en `chrome.storage.local`.

## Desarrollo Local

Instalacion y build:

```bash
bun install
bun run build
```

Los bundles JS generados no se versionan. Ejecuta el build antes de cargar la extension sin empaquetar.

Esto genera:

- `background.js`
- `content.js`
- `options.js`
- `popup.js`

Cargar la extension en Chrome:

1. Abre `chrome://extensions`
2. Activa `Developer Mode`
3. Haz click en `Load unpacked`
4. Selecciona la carpeta raiz del proyecto

Tests E2E con Playwright:

```bash
bun install
bun run build
bunx playwright install chromium
bun run test:e2e
```

Los tests validan el flujo completo: mapeo visual, activacion de sitios, navegacion por capitulos, retomado del ultimo capitulo, modo zen y edicion manual.

## Estructura del Proyecto

- `src/entries/`: Entradas para los bundles
- `src/content/app.ts`: Logica principal del content script
- `src/options/`: UI de opciones con Preact
- `src/popup/`: UI del popup con Preact
- `src/shared/`: Tipos, storage, mensajeria y utilidades compartidas

## Antes de Publicar

1. Revisa `manifest.json`: nombre, descripcion y version.
2. Documenta el uso de `"<all_urls>"` si hace falta.
3. Agrega iconos PNG en varios tamanos, idealmente `16`, `48` y `128`.
4. Agrega capturas del popup y la pagina de opciones.

## Licencia

[MIT](./LICENSE)
