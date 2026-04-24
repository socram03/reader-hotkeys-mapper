# ChapterPilot

**Extension de navegador** para mantener fluida la lectura de manga, manhwa y capitulos web entre distintos sitios.
Combina navegacion por teclado, mapeos locales, progreso de lectura, reparacion de URLs, backups, sync opcional y controles de lectura enfocada.

Desarrollada en **TypeScript**, bundleada con **Bun**. La UI del popup y de opciones esta hecha con **Preact**, y las dependencias se gestionan con **Bun**.

## Funciones

- Navegacion por capitulo: `ArrowLeft` y `ArrowRight`
- Volver a la serie o ficha: `M`
- Scroll rapido: `J` y `K`
- Saltos rapidos al 10%-90% del capitulo: `1` al `9`
- Retomar el ultimo capitulo leido y la posicion de lectura: `L`
- Reparar lecturas cuando cambia el slug o la URL de una obra
- Restaurar la posicion guardada del capitulo actual: `R`
- Modo zen: `Z` (persistente)
- Auto-scroll y auto-next al final del capitulo: `A` (persistente)
- Pausar o reanudar auto-scroll: `Espacio`
- Ajustar velocidad del auto-scroll: `+` y `-`
- Mapa de capitulos: `C`
- Ayuda contextual: `?` o `H`
- Mapeo visual rapido de sitios: `U`
- Backup/importacion JSON, exportacion de ultimos leidos, UI en ingles/espanol y Chrome Sync opcional para mapeos/settings

## Interfaz de la Extension

- `popup.html`: Controles rapidos para la ultima pestana compatible, lista de seguir leyendo, reparacion de lecturas, retomar, modo zen, auto-scroll y ayuda.
- `options.html`: Editor avanzado de mapeos con multiples mapeos por dominio, activacion de sitios, alias de host, prefijos soportados, overrides de atajos, ajustes de modo lectura, backup/importacion JSON, exportacion de ultimos leidos, sync opcional y soporte para picker visual.

## Sitios con Soporte Nativo

- `zonatmo.com`
- `olympusbiblioteca.com`
- `leerolymp.com`
- `manhwaweb.com`

## Como Mapear un Sitio Nuevo

Metodo recomendado:

1. Abre la pagina de `Opciones` de la extension.
2. Haz click en `Picker en pestana`.
3. Ve a la web que quieres mapear y selecciona los botones correspondientes.
4. Activa el mapeo cuando termines.

En sitios no reconocidos, los atajos quedan desactivados hasta que actives manualmente un mapeo personalizado.

Los mapeos y el progreso de lectura se guardan en `chrome.storage.local` por defecto. El sync opcional puede copiar mapeos y settings a Chrome Sync.

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
- `continue.js`
- `options.js`
- `popup.js`

## Distribucion en Chrome Web Store

Para instalar ChapterPilot normalmente sin activar Developer Mode, publicala como extension no listada en Chrome Web Store.

Genera el ZIP de subida:

```bash
bun install
bun run package:chrome
```

El ZIP se crea en `dist/`. Usa [docs/chrome-web-store.md](./docs/chrome-web-store.md) como checklist de publicacion y [docs/privacy-policy.md](./docs/privacy-policy.md) como base de politica de privacidad.

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

Los tests validan el flujo completo: mapeo visual, activacion de sitios, navegacion por capitulos, retomado del ultimo capitulo, reparacion de URLs, persistencia de velocidad de auto-scroll, sync, backups, modo zen y edicion manual.

## Estructura del Proyecto

- `src/entries/`: Entradas para los bundles
- `src/content/app.ts`: Logica principal del content script
- `src/options/`: UI de opciones con Preact
- `src/popup/`: UI del popup con Preact
- `src/shared/`: Tipos, storage, mensajeria, i18n, resume y utilidades compartidas

## Antes de Publicar

1. Revisa `manifest.json`: nombre, descripcion y version.
2. Manten `"<all_urls>"` en `content_scripts` solo si necesitas que los atajos funcionen sin abrir primero el popup. La extension no conserva `host_permissions` amplios; la inyeccion manual usa `activeTab` + `scripting`.
3. Agrega capturas del popup y la pagina de opciones.

## Licencia

[MIT](./LICENSE)
