(() => {
  // src/content/app.ts
  var STORAGE_KEYS = {
    settings: "readerHotkeysSettings",
    resume: "readerHotkeysResume",
    chapterCache: "readerHotkeysChapterCache",
    userMappings: "readerHotkeysUserMappings"
  };
  var HELP_OVERLAY_ID = "reader-hotkeys-help";
  var CHAPTER_MAP_OVERLAY_ID = "reader-hotkeys-chapter-map";
  var MAPPER_OVERLAY_ID = "reader-hotkeys-mapper";
  var TOAST_CONTAINER_ID = "reader-hotkeys-toasts";
  var FOCUS_STYLE_ID = "reader-hotkeys-focus-style";
  var FOCUS_CLASS = "reader-hotkeys-focus";
  var RESUME_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
  var RESUME_MAX_ENTRIES = 200;
  var AUTO_NEXT_DELAY_MS = 3000;
  var CHAPTER_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 6;
  var AUTO_SCROLL_PX_PER_SECOND = 120;
  var AUTO_SCROLL_INTERVAL_MS = 16;
  var globalShortcuts = [
    { key: "? / h", description: "Mostrar u ocultar ayuda" },
    { key: "j", description: "Bajar casi una pantalla" },
    { key: "k", description: "Subir casi una pantalla" },
    { key: "l", description: "Retomar ultimo capitulo guardado" },
    { key: "z", description: "Alternar modo zen" },
    { key: "a", description: "Auto-scroll (scroll + next al final)" },
    { key: "Espacio", description: "Pausar / reanudar auto-scroll" },
    { key: "+ / -", description: "Ajustar velocidad de auto-scroll" },
    { key: "r", description: "Restaurar posicion guardada" },
    { key: "c", description: "Abrir mapa de capitulos" },
    { key: "u", description: "Mapear esta web localmente" },
    { key: "1-9", description: "Saltar al 10%-90% del capitulo" },
    { key: "Escape", description: "Cerrar overlays" }
  ];
  var sites = {
    tmo: {
      id: "tmo",
      label: "TMO",
      hosts: ["zonatmo.com"],
      paths: ["/viewer/", "/news/"],
      shortcuts: [
        { key: "ArrowRight", description: "Siguiente capitulo" },
        { key: "ArrowLeft", description: "Capitulo anterior" },
        { key: "m", description: "Ir a la pagina de la obra" }
      ],
      getNextHref: () => getTMOChapterHref("col-6 col-sm-2 order-2 order-sm-3 chapter-arrow chapter-next") || getTMOMainHref(),
      getPrevHref: () => getTMOChapterHref("col-6 col-sm-2 order-1 order-sm-1 chapter-arrow chapter-prev"),
      getMainHref: () => getTMOMainHref(),
      getFocusCss: () => `
			body.${FOCUS_CLASS} .navbar,
			body.${FOCUS_CLASS} .navigation,
			body.${FOCUS_CLASS} .sidebar,
			body.${FOCUS_CLASS} .social,
			body.${FOCUS_CLASS} .card,
			body.${FOCUS_CLASS} .comments,
			body.${FOCUS_CLASS} .comment,
			body.${FOCUS_CLASS} .adsbygoogle {
				display: none !important;
			}
		`
    },
    olympus: {
      id: "olympus",
      label: "Olympus",
      hosts: ["leerolymp.com", "olympusbiblioteca.com", "www.olympusbiblioteca.com"],
      paths: ["/capitulo/"],
      shortcuts: [
        { key: "ArrowRight", description: "Siguiente capitulo o pagina de la serie" },
        { key: "ArrowLeft", description: "Capitulo anterior" },
        { key: "m", description: "Ir a la serie" }
      ],
      getNextHref: () => getNamedHref("capitulo siguiente"),
      getPrevHref: () => getNamedHref("capitulo anterior"),
      getMainHref: () => {
        const match = window.location.pathname.match(/^\/capitulo\/[^/]+\/(.+)$/);
        if (match?.[1])
          return `/series/${match[1]}`;
        return findLink((link) => getLinkPath(link).startsWith("/series/"))?.getAttribute("href") || "";
      },
      getFocusCss: () => `
			body.${FOCUS_CLASS} .snap-x,
			body.${FOCUS_CLASS} [title="Configuracion de lectura"],
			body.${FOCUS_CLASS} [title="pantalla completa"] {
				display: none !important;
			}

			body.${FOCUS_CLASS} .container,
			body.${FOCUS_CLASS} main {
				max-width: 100% !important;
				width: 100% !important;
				margin-left: auto !important;
				margin-right: auto !important;
			}
		`
    },
    manhwaweb: {
      id: "manhwaweb",
      label: "ManhwaWeb",
      hosts: ["manhwaweb.com", "www.manhwaweb.com"],
      paths: ["/leer/", "/leer_18/"],
      shortcuts: [
        { key: "ArrowRight", description: "Siguiente capitulo" },
        { key: "ArrowLeft", description: "Capitulo anterior" },
        { key: "m", description: "Ir a la pagina de la obra" }
      ],
      getNextHref: () => getManhwaWebChapterHref("siguiente") || getManhwaWebMainHref(),
      getPrevHref: () => getManhwaWebChapterHref("anterior"),
      getMainHref: () => getManhwaWebMainHref(),
      getFocusCss: () => `
			body.${FOCUS_CLASS} #disqus_thread,
			body.${FOCUS_CLASS} .ver_todo,
			body.${FOCUS_CLASS} [class*="banner"],
			body.${FOCUS_CLASS} [class*="coment"],
			body.${FOCUS_CLASS} [class*="coment"] * {
				display: none !important;
			}
		`
    }
  };
  var runtime = {
    site: null,
    persisted: {
      settings: {},
      resume: {},
      chapterCache: {},
      userMappings: {}
    },
    settings: {
      focusMode: false,
      autoNext: false
    },
    nextHref: "",
    prefetchedHref: "",
    autoNextTimer: 0,
    autoScrollTimer: 0,
    autoScrollSpeed: AUTO_SCROLL_PX_PER_SECOND,
    autoScrollPaused: false,
    saveTimer: 0,
    autoNextNotifiedHref: "",
    restoreToastShown: false,
    resumeGuardUntil: 0,
    featuresReady: false,
    mapper: null
  };
  document.addEventListener("keydown", handleKeydown);
  setupRuntimeMessaging();
  queueMicrotask(bootstrap);
  function setupRuntimeMessaging() {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage)
      return;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message?.type?.startsWith("reader:"))
        return false;
      handleRuntimeMessage(message).then(sendResponse);
      return true;
    });
  }
  async function handleRuntimeMessage(message) {
    switch (message.type) {
      case "reader:get-status":
        return getReaderStatus();
      case "reader:start-mapper":
        toggleMapper();
        return getReaderStatus();
      case "reader:toggle-current-mapping":
        await toggleCurrentMappingEnabled();
        return getReaderStatus();
      case "reader:toggle-focus":
        if (!runtime.site)
          return getReaderStatus();
        toggleFocusMode();
        return getReaderStatus();
      case "reader:toggle-auto-next":
        if (!runtime.site)
          return getReaderStatus();
        toggleAutoNext();
        return getReaderStatus();
      case "reader:open-help":
        toggleShortcutHelp();
        return getReaderStatus();
      case "reader:resume-last-read":
        resumeLastRead(true);
        return getReaderStatus();
      case "reader:open-chapter-map":
        if (runtime.site)
          toggleChapterMap();
        return getReaderStatus();
      default:
        return { ok: false };
    }
  }
  function getReaderStatus() {
    const matchedMapping = getMatchingUserMapping(window.location, { includeDisabled: true });
    const activeMapping = runtime.site?.id?.startsWith("mapped:") ? matchedMapping : null;
    const resumeTarget = getResumeTarget(window.location);
    const currentChapterHref = getCurrentChapterHref();
    return {
      ok: true,
      readyState: document.documentElement.dataset.readerHotkeysReady || "",
      host: window.location.host,
      pathname: window.location.pathname,
      siteDetected: Boolean(runtime.site),
      siteLabel: runtime.site?.label || "",
      isBuiltInSite: Boolean(runtime.site && !runtime.site.id?.startsWith("mapped:")),
      isMappedSite: Boolean(matchedMapping),
      activeMappingId: activeMapping?.id || "",
      activeMappingLabel: activeMapping?.label || "",
      matchedMappingId: matchedMapping?.id || "",
      matchedMappingLabel: matchedMapping?.label || "",
      matchedMappingEnabled: matchedMapping ? matchedMapping.enabled !== false : null,
      canToggleActivation: Boolean(matchedMapping),
      hostMappingCount: getHostUserMappings(window.location.host).length,
      currentChapterHref,
      currentWorkHref: getCurrentMainHref(),
      lastReadAvailable: Boolean(resumeTarget?.entry?.chapterHref),
      lastReadTitle: resumeTarget?.entry?.title || "",
      lastReadHref: resumeTarget?.entry?.chapterHref || "",
      lastReadUpdatedAt: resumeTarget?.entry?.updatedAt || 0,
      lastReadScope: resumeTarget?.scope || "",
      lastReadIsCurrentChapter: Boolean(resumeTarget?.entry?.chapterHref && currentChapterHref && areComparableHrefsEqual(resumeTarget.entry.chapterHref, currentChapterHref)),
      settings: {
        focusMode: runtime.settings.focusMode,
        autoNext: runtime.settings.autoNext
      },
      overlays: {
        help: Boolean(document.getElementById(HELP_OVERLAY_ID)),
        mapper: Boolean(document.getElementById(MAPPER_OVERLAY_ID)),
        chapterMap: Boolean(document.getElementById(CHAPTER_MAP_OVERLAY_ID))
      }
    };
  }
  function bootstrap() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initRuntime, { once: true });
      return;
    }
    initRuntime();
  }
  async function initRuntime() {
    await loadPersistedState();
    setRuntimeSite(getActiveSite(window.location));
  }
  function activateSiteFeatures() {
    if (!runtime.site)
      return;
    applyStoredSettings();
    ensureFocusStyle();
    setFocusMode(runtime.settings.focusMode, false);
    refreshNavigationState();
    scheduleNavigationRefresh([600, 1500, 3000, 5000]);
    if (!runtime.featuresReady) {
      setupScrollPersistence();
      runtime.featuresReady = true;
    }
    if (shouldRestoreResume()) {
      runtime.resumeGuardUntil = Date.now() + 5000;
    }
    scheduleResumeRestore();
    document.documentElement.dataset.readerHotkeysReady = "true";
  }
  function deactivateSiteFeatures() {
    stopAutoScroll();
    cancelAutoNext();
    closeChapterMap();
    closeShortcutHelp();
    document.body?.classList.remove(FOCUS_CLASS);
    runtime.settings.focusMode = false;
    runtime.settings.autoNext = false;
    runtime.nextHref = "";
    runtime.prefetchedHref = "";
    runtime.autoNextNotifiedHref = "";
    document.documentElement.dataset.readerHotkeysReady = "idle";
  }
  function setRuntimeSite(nextSite) {
    runtime.site = nextSite || null;
    if (!runtime.site) {
      deactivateSiteFeatures();
      return;
    }
    activateSiteFeatures();
  }
  async function loadPersistedState() {
    const data = await storage.get([STORAGE_KEYS.settings, STORAGE_KEYS.resume, STORAGE_KEYS.chapterCache, STORAGE_KEYS.userMappings]);
    runtime.persisted.settings = data[STORAGE_KEYS.settings] || {};
    runtime.persisted.resume = pruneResumeEntries(data[STORAGE_KEYS.resume] || {});
    runtime.persisted.chapterCache = data[STORAGE_KEYS.chapterCache] || {};
    runtime.persisted.userMappings = normalizeUserMappings(data[STORAGE_KEYS.userMappings]);
  }
  function applyStoredSettings() {
    const siteSettings = runtime.persisted.settings[runtime.site.id] || {};
    runtime.settings.focusMode = Boolean(siteSettings.focusMode);
    runtime.settings.autoNext = Boolean(siteSettings.autoNext);
  }
  function handleKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey)
      return;
    if (isEditableTarget(event.target))
      return;
    const key = normalizeKey(event.key);
    if (handleGlobalShortcut(key)) {
      event.preventDefault();
      return;
    }
    if (!runtime.site)
      return;
    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      jumpToPercent(Number(key) / 10);
      return;
    }
    const action = getSiteShortcutAction(key);
    if (!action)
      return;
    event.preventDefault();
    action();
  }
  function handleGlobalShortcut(key) {
    const hasOverlay = Boolean(document.getElementById(MAPPER_OVERLAY_ID) || document.getElementById(HELP_OVERLAY_ID));
    if (!runtime.site && !hasOverlay)
      return false;
    switch (key) {
      case "?":
      case "h":
        if (!runtime.site)
          return false;
        toggleShortcutHelp();
        return true;
      case "Escape":
        return closeMapper() || closeChapterMap() || closeShortcutHelp();
      case "j":
        if (!runtime.site)
          return false;
        scrollByViewport(0.85);
        return true;
      case "k":
        if (!runtime.site)
          return false;
        scrollByViewport(-0.85);
        return true;
      case "l":
        if (!runtime.site)
          return notifyNoActiveReader();
        return resumeLastRead(true);
      case "z":
        if (!runtime.site)
          return notifyNoActiveReader();
        toggleFocusMode();
        return true;
      case "a":
        if (!runtime.site)
          return notifyNoActiveReader();
        toggleAutoNext();
        return true;
      case " ":
        return pauseAutoScroll();
      case "+":
      case "=":
        if (!runtime.settings.autoNext)
          return false;
        adjustAutoScrollSpeed(20);
        return true;
      case "-":
        if (!runtime.settings.autoNext)
          return false;
        adjustAutoScrollSpeed(-20);
        return true;
      case "r":
        if (!runtime.site)
          return notifyNoActiveReader();
        restoreResumePosition(true);
        return true;
      case "c":
        if (!runtime.site) {
          showToast("No hay un lector activo en esta pagina");
          return true;
        }
        toggleChapterMap();
        return true;
      case "u":
        if (!runtime.site)
          return false;
        toggleMapper();
        return true;
      default:
        return false;
    }
  }
  function getSiteShortcutAction(key) {
    switch (key) {
      case "ArrowRight":
        return () => navigateToHref(runtime.site.getNextHref?.());
      case "ArrowLeft":
        return () => navigateToHref(runtime.site.getPrevHref?.());
      case "m":
        return () => navigateToHref(runtime.site.getMainHref?.());
      default:
        return null;
    }
  }
  function getActiveSite(location) {
    const mappedSite = getMappedSite(location);
    if (mappedSite)
      return mappedSite;
    return Object.values(sites).find((site) => {
      return site.hosts.includes(location.host) && matchesPath(location.pathname, site.paths);
    });
  }
  function getMappedSite(location) {
    const mapping = getMatchingUserMapping(location);
    if (!mapping?.readingPrefix)
      return null;
    return {
      id: `mapped:${mapping.id}`,
      label: mapping.label || `Custom: ${location.host}`,
      hosts: getAllMappingHosts(mapping),
      paths: getAllReadingPrefixes(mapping),
      shortcuts: [
        { key: "ArrowRight", description: "Siguiente capitulo" },
        { key: "ArrowLeft", description: "Capitulo anterior" },
        { key: "m", description: "Ir a la pagina principal" }
      ],
      getNextHref: () => resolveMappedHref(mapping.actions?.next),
      getPrevHref: () => resolveMappedHref(mapping.actions?.prev),
      getMainHref: () => resolveMappedHref(mapping.actions?.main),
      getFocusCss: () => ""
    };
  }
  function matchesPath(pathname, paths) {
    return Array.isArray(paths) && paths.some((path) => pathname.startsWith(path));
  }
  function normalizeKey(key) {
    return key.length === 1 ? key.toLowerCase() : key;
  }
  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement))
      return false;
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  }
  function scrollByViewport(multiplier) {
    window.scrollBy({
      top: Math.round(window.innerHeight * multiplier),
      behavior: "smooth"
    });
  }
  function jumpToPercent(percent) {
    const maxScroll = getMaxScroll();
    const target = Math.max(0, Math.round(maxScroll * percent));
    window.scrollTo({
      top: target,
      behavior: "smooth"
    });
    showToast(`Salto al ${Math.round(percent * 100)}%`);
  }
  function toggleFocusMode() {
    setFocusMode(!runtime.settings.focusMode, true);
  }
  function setFocusMode(enabled, persist) {
    runtime.settings.focusMode = enabled;
    document.body.classList.toggle(FOCUS_CLASS, enabled);
    if (persist) {
      saveSiteSetting("focusMode", enabled);
      showToast(enabled ? "Modo zen activado" : "Modo zen desactivado");
    }
  }
  function ensureFocusStyle() {
    let style = document.getElementById(FOCUS_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = FOCUS_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
		body.${FOCUS_CLASS} header,
		body.${FOCUS_CLASS} footer,
		body.${FOCUS_CLASS} aside,
		body.${FOCUS_CLASS} nav,
		body.${FOCUS_CLASS} iframe,
		body.${FOCUS_CLASS} [ad-placement],
		body.${FOCUS_CLASS} [class*="banner"],
		body.${FOCUS_CLASS} [id*="banner"],
		body.${FOCUS_CLASS} [class*="ads"],
		body.${FOCUS_CLASS} [id*="ads"],
		body.${FOCUS_CLASS} [class*="comment"],
		body.${FOCUS_CLASS} [id*="comment"],
		body.${FOCUS_CLASS} [class*="recommend"],
		body.${FOCUS_CLASS} [id*="recommend"],
		body.${FOCUS_CLASS} #disqus_thread {
			display: none !important;
		}

		body.${FOCUS_CLASS} .container,
		body.${FOCUS_CLASS} main,
		body.${FOCUS_CLASS} [chapter] {
			max-width: 100% !important;
			width: 100% !important;
		}

		body.${FOCUS_CLASS} {
			background: #000 !important;
		}

		${runtime.site.getFocusCss?.() || ""}
	`;
  }
  function toggleAutoNext() {
    const nextValue = !runtime.settings.autoNext;
    runtime.settings.autoNext = nextValue;
    saveSiteSetting("autoNext", nextValue);
    if (!nextValue) {
      stopAutoScroll();
      cancelAutoNext();
      showToast("Auto-scroll desactivado");
      return;
    }
    showToast(`Auto-scroll activado (${runtime.autoScrollSpeed} px/s). Usa +/- para ajustar velocidad.`);
    startAutoScroll();
  }
  function startAutoScroll() {
    if (runtime.autoScrollTimer)
      return;
    runtime.autoScrollPaused = false;
    const pxPerTick = runtime.autoScrollSpeed * AUTO_SCROLL_INTERVAL_MS / 1000;
    runtime.autoScrollTimer = window.setInterval(() => {
      if (runtime.autoScrollPaused)
        return;
      const maxScroll = getMaxScroll();
      if (maxScroll <= 0)
        return;
      const currentY = window.scrollY || 0;
      if (currentY >= maxScroll - 2) {
        stopAutoScroll();
        checkAutoNext();
        return;
      }
      window.scrollBy(0, pxPerTick);
    }, AUTO_SCROLL_INTERVAL_MS);
  }
  function stopAutoScroll() {
    if (!runtime.autoScrollTimer)
      return;
    window.clearInterval(runtime.autoScrollTimer);
    runtime.autoScrollTimer = 0;
    runtime.autoScrollPaused = false;
  }
  function restartAutoScroll() {
    stopAutoScroll();
    if (runtime.settings.autoNext) {
      startAutoScroll();
    }
  }
  function adjustAutoScrollSpeed(delta) {
    const newSpeed = Math.max(20, Math.min(600, runtime.autoScrollSpeed + delta));
    if (newSpeed === runtime.autoScrollSpeed)
      return;
    runtime.autoScrollSpeed = newSpeed;
    showToast(`Velocidad: ${newSpeed} px/s`);
    if (runtime.autoScrollTimer) {
      restartAutoScroll();
    }
  }
  function pauseAutoScroll() {
    if (!runtime.autoScrollTimer || !runtime.settings.autoNext)
      return false;
    runtime.autoScrollPaused = !runtime.autoScrollPaused;
    showToast(runtime.autoScrollPaused ? "Auto-scroll pausado" : "Auto-scroll reanudado");
    return true;
  }
  function scheduleNavigationRefresh(delays) {
    delays.forEach((delay) => {
      window.setTimeout(refreshNavigationState, delay);
    });
  }
  function refreshNavigationState() {
    const nextHref = getAbsoluteHref(runtime.site.getNextHref?.());
    if (!nextHref || nextHref === runtime.nextHref)
      return;
    runtime.nextHref = nextHref;
    runtime.autoNextNotifiedHref = "";
    prefetchHref(nextHref);
  }
  function prefetchHref(href) {
    if (!href || href === runtime.prefetchedHref)
      return;
    runtime.prefetchedHref = href;
    if (!document.querySelector(`link[data-reader-hotkeys-prefetch="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";
      link.href = href;
      link.dataset.readerHotkeysPrefetch = href;
      document.head.appendChild(link);
    }
    const runPrefetch = () => {
      fetch(href, { credentials: "include" }).catch(() => {
        return;
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(runPrefetch, { timeout: 1500 });
      return;
    }
    window.setTimeout(runPrefetch, 500);
  }
  function setupScrollPersistence() {
    window.addEventListener("scroll", handleReaderScroll, { passive: true });
    window.addEventListener("pagehide", flushResumeSave);
    window.addEventListener("beforeunload", flushResumeSave);
  }
  function handleReaderScroll() {
    scheduleResumeSave();
  }
  function scheduleResumeSave() {
    window.clearTimeout(runtime.saveTimer);
    runtime.saveTimer = window.setTimeout(flushResumeSave, 250);
  }
  function flushResumeSave() {
    window.clearTimeout(runtime.saveTimer);
    runtime.saveTimer = 0;
    if (Date.now() < runtime.resumeGuardUntil && getReadProgress() < 0.08) {
      return;
    }
    const entry = buildResumeEntry();
    if (!entry)
      return;
    runtime.persisted.resume[getResumeKey()] = entry;
    runtime.persisted.resume = pruneResumeEntries(runtime.persisted.resume);
    storage.set({ [STORAGE_KEYS.resume]: runtime.persisted.resume });
  }
  function buildResumeEntry() {
    const maxScroll = getMaxScroll();
    const scrollY = Math.max(0, Math.round(window.scrollY || 0));
    const percent = maxScroll > 0 ? Number((scrollY / maxScroll).toFixed(4)) : 0;
    const chapterHref = getCurrentChapterHref();
    const mainHref = getCurrentMainHref();
    return {
      scrollY,
      percent,
      updatedAt: Date.now(),
      title: document.title,
      host: window.location.host,
      siteId: runtime.site?.id || "",
      mainHref,
      chapterHref
    };
  }
  function scheduleResumeRestore() {
    if (!shouldRestoreResume())
      return;
    [180, 900, 2200, 4500].forEach((delay) => {
      window.setTimeout(() => {
        restoreResumePosition(false);
      }, delay);
    });
  }
  function shouldRestoreResume() {
    const entry = runtime.persisted.resume[getResumeKey()];
    if (!entry)
      return false;
    if (Date.now() - entry.updatedAt > RESUME_MAX_AGE_MS)
      return false;
    if (entry.scrollY < 180 && entry.percent < 0.05)
      return false;
    return true;
  }
  function restoreResumePosition(manual) {
    const entry = runtime.persisted.resume[getResumeKey()];
    if (!entry) {
      if (manual)
        showToast("No hay posicion guardada");
      return false;
    }
    const maxScroll = getMaxScroll();
    if (maxScroll <= 0)
      return false;
    const target = entry.percent > 0 ? Math.round(maxScroll * entry.percent) : entry.scrollY;
    if (target <= 0)
      return false;
    window.scrollTo({
      top: Math.min(target, maxScroll),
      behavior: manual ? "smooth" : "auto"
    });
    if (manual || !runtime.restoreToastShown) {
      runtime.restoreToastShown = true;
      const percentLabel = Math.max(1, Math.round((entry.percent || 0) * 100));
      showToast(`Posicion restaurada (${percentLabel}%)`);
    }
    return true;
  }
  function resumeLastRead(manual) {
    const target = getResumeTarget(window.location);
    if (!target?.entry?.chapterHref) {
      if (manual)
        showToast("No hay un ultimo capitulo guardado");
      return false;
    }
    if (areComparableHrefsEqual(target.entry.chapterHref, getCurrentChapterHref())) {
      return restoreResumePosition(manual);
    }
    if (manual) {
      showToast(`Retomando ${target.entry.title || "ultimo capitulo"}`, 1200);
    }
    return navigateToHref(target.entry.chapterHref);
  }
  function getResumeTarget(location) {
    const entries = getMeaningfulResumeEntries();
    if (!entries.length)
      return null;
    const currentPageHref = getComparableHref(location.href);
    const currentMainMatch = entries.find((entry) => areComparableHrefsEqual(entry.mainHref, currentPageHref));
    if (currentMainMatch) {
      return { entry: currentMainMatch, scope: "work" };
    }
    const currentWorkHref = getCurrentMainHref();
    if (currentWorkHref) {
      const currentWorkMatch = entries.find((entry) => areComparableHrefsEqual(entry.mainHref, currentWorkHref));
      if (currentWorkMatch) {
        return { entry: currentWorkMatch, scope: "work" };
      }
    }
    const hostMatch = entries.find((entry) => normalizeHost(entry.host) === normalizeHost(location.host));
    if (hostMatch) {
      return { entry: hostMatch, scope: "host" };
    }
    return { entry: entries[0], scope: "global" };
  }
  function getMeaningfulResumeEntries() {
    const now = Date.now();
    return Object.values(runtime.persisted.resume || {}).filter((entry) => {
      if (!entry || typeof entry !== "object")
        return false;
      if (typeof entry.updatedAt !== "number" || now - entry.updatedAt > RESUME_MAX_AGE_MS)
        return false;
      if (!entry.mainHref || !entry.chapterHref)
        return false;
      return isMeaningfulResumeEntry(entry);
    }).sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
  }
  function isMeaningfulResumeEntry(entry) {
    return Number(entry.scrollY || 0) >= 180 || Number(entry.percent || 0) >= 0.05;
  }
  function checkAutoNext() {
    refreshNavigationState();
    if (!runtime.settings.autoNext || !runtime.nextHref || runtime.autoNextTimer)
      return;
    if (runtime.nextHref === runtime.autoNextNotifiedHref)
      return;
    runtime.autoNextNotifiedHref = runtime.nextHref;
    showToast("Auto-next en 2s. Pulsa a para cancelarlo.", AUTO_NEXT_DELAY_MS + 300);
    runtime.autoNextTimer = window.setTimeout(() => {
      runtime.autoNextTimer = 0;
      navigateToHref(runtime.nextHref);
    }, AUTO_NEXT_DELAY_MS);
  }
  function cancelAutoNext() {
    if (!runtime.autoNextTimer)
      return;
    window.clearTimeout(runtime.autoNextTimer);
    runtime.autoNextTimer = 0;
    runtime.autoNextNotifiedHref = "";
    showToast("Auto-next cancelado");
  }
  function toggleShortcutHelp() {
    if (closeShortcutHelp())
      return;
    const overlay = document.createElement("div");
    overlay.id = HELP_OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.background = "rgba(0, 0, 0, 0.45)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.webkitBackdropFilter = "blur(4px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "flex-end";
    overlay.style.justifyContent = "flex-start";
    overlay.style.padding = "24px";
    const siteShortcuts = runtime.site ? [
      ...runtime.site.shortcuts,
      { key: "l", description: "Retomar ultimo capitulo guardado" },
      { key: "z", description: `Modo zen ${runtime.settings.focusMode ? "(activo)" : "(apagado)"}` },
      { key: "a", description: `Auto-scroll ${runtime.settings.autoNext ? "(activo " + runtime.autoScrollSpeed + " px/s)" : "(apagado)"}` },
      { key: "Espacio", description: "Pausar / reanudar auto-scroll" },
      { key: "+ / -", description: "Ajustar velocidad" },
      { key: "r", description: "Restaurar posicion guardada" },
      { key: "1-9", description: "Saltar al progreso del capitulo" }
    ] : [{ key: "u", description: "Mapear esta web localmente" }];
    overlay.innerHTML = `
		<div style="width:min(440px,100%); max-height:70vh; overflow:auto; background:rgba(12,12,16,0.88); color:#e8e6e1; border:1px solid rgba(255,255,255,0.06); border-left:3px solid #FFBA08; border-radius:6px; padding:18px 20px; box-shadow:0 20px 50px rgba(0,0,0,.5); font-family:'IBM Plex Mono',Consolas,monospace;">
			<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.06);">
				<div>
					<div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#FFBA08; font-family:'Chakra Petch',sans-serif;">Atajos</div>
					<div style="font-size:17px; font-weight:700; font-family:'Chakra Petch',sans-serif; margin-top:3px;">${runtime.site?.label || window.location.host}</div>
				</div>
				<button type="button" data-close-help="true" style="appearance:none; background:rgba(255,255,255,0.06); color:#7a787f; border:1px solid rgba(255,255,255,0.06); border-radius:4px; width:30px; height:30px; cursor:pointer; font-size:14px; line-height:1; transition:color .15s;">×</button>
			</div>
			<div style="display:grid; gap:12px;">
				${renderShortcutSection("Generales", globalShortcuts)}
				${renderShortcutSection(runtime.site ? "En esta web" : "Mapeo local", siteShortcuts)}
			</div>
		</div>
	`;
    overlay.addEventListener("click", (event) => {
      const closeButton = event.target.closest?.('[data-close-help="true"]');
      if (event.target === overlay || closeButton)
        closeShortcutHelp();
    });
    document.body.appendChild(overlay);
  }
  function closeShortcutHelp() {
    const overlay = document.getElementById(HELP_OVERLAY_ID);
    if (!overlay)
      return false;
    overlay.remove();
    return true;
  }
  function toggleMapper() {
    if (closeMapper())
      return;
    openMapper();
  }
  function openMapper() {
    if (runtime.mapper)
      return;
    const existing = getHostUserMappings(window.location.host);
    const steps = [
      { key: "next", label: "Haz click en el boton o enlace de siguiente capitulo", required: true },
      { key: "prev", label: "Haz click en el boton o enlace de capitulo anterior", required: false },
      { key: "main", label: "Haz click en el enlace de la obra o lista de capitulos", required: true }
    ];
    runtime.mapper = {
      stepIndex: 0,
      steps,
      selections: {},
      existing
    };
    const overlay = document.createElement("div");
    overlay.id = MAPPER_OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.pointerEvents = "none";
    const panel = document.createElement("div");
    panel.style.cssText = `position:fixed; bottom:16px; left:16px; width:min(380px, calc(100vw - 32px)); background:rgba(12,12,16,0.82); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); color:#e8e6e1; border:1px solid rgba(255,255,255,0.06); border-left:3px solid #FFBA08; border-radius:6px; padding:0; box-shadow:0 20px 50px rgba(0,0,0,.5); font-family:'IBM Plex Mono',Consolas,monospace; pointer-events:auto; cursor:default; user-select:none;`;
    panel.innerHTML = `
		<div data-mapper-drag="true" style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.06); cursor:grab;">
			<div style="display:flex; align-items:center; gap:10px;">
				<div style="width:6px; height:20px; display:grid; grid-template-columns:2px 2px; gap:2px; opacity:0.3;">
					<span style="background:#e8e6e1; border-radius:1px;"></span><span style="background:#e8e6e1; border-radius:1px;"></span>
					<span style="background:#e8e6e1; border-radius:1px;"></span><span style="background:#e8e6e1; border-radius:1px;"></span>
					<span style="background:#e8e6e1; border-radius:1px;"></span><span style="background:#e8e6e1; border-radius:1px;"></span>
				</div>
				<div>
					<div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#FFBA08; font-family:'Chakra Petch',sans-serif;">Mapper</div>
					<div style="font-size:14px; font-weight:700; font-family:'Chakra Petch',sans-serif; margin-top:2px;">${window.location.host}</div>
				</div>
			</div>
			<button type="button" data-mapper-cancel="true" style="appearance:none; background:rgba(255,255,255,0.06); color:#7a787f; border:1px solid rgba(255,255,255,0.06); border-radius:4px; width:28px; height:28px; cursor:pointer; font-size:13px; line-height:1;">×</button>
		</div>
		<div style="padding:14px 16px;">
			<div data-mapper-status="true" style="font-size:12px; color:#e8e6e1; line-height:1.55;"></div>
			<div style="display:flex; gap:8px; margin-top:12px;">
				<button type="button" data-mapper-skip="true" style="appearance:none; background:rgba(255,255,255,0.06); color:#e8e6e1; border:1px solid rgba(255,255,255,0.06); border-bottom-width:2px; border-bottom-color:rgba(0,0,0,0.3); border-radius:4px; padding:8px 12px; cursor:pointer; font:500 12px/1 'IBM Plex Mono',monospace;">Saltar paso</button>
				<button type="button" data-mapper-save="true" style="appearance:none; background:linear-gradient(180deg,#d49b00,#b8860b); color:#0c0c10; border:1px solid rgba(0,0,0,0.2); border-bottom-width:2px; border-bottom-color:rgba(0,0,0,0.5); border-radius:4px; padding:8px 12px; cursor:pointer; font:700 12px/1 'IBM Plex Mono',monospace;">Guardar ahora</button>
			</div>
			${existing.length ? `<div style="margin-top:10px; font-size:11px; color:#7a787f;">Ya existen ${existing.length} mapeos para este host.</div>` : ""}
		</div>
	`;
    overlay.appendChild(panel);
    const dragHandle = panel.querySelector('[data-mapper-drag="true"]');
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    dragHandle?.addEventListener("mousedown", (event) => {
      isDragging = true;
      dragOffsetX = event.clientX - panel.getBoundingClientRect().left;
      dragOffsetY = event.clientY - panel.getBoundingClientRect().top;
      dragHandle.style.cursor = "grabbing";
      event.preventDefault();
    });
    document.addEventListener("mousemove", (event) => {
      if (!isDragging)
        return;
      const x = Math.max(0, Math.min(event.clientX - dragOffsetX, window.innerWidth - panel.offsetWidth));
      const y = Math.max(0, Math.min(event.clientY - dragOffsetY, window.innerHeight - panel.offsetHeight));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.bottom = "auto";
      panel.style.right = "auto";
    });
    document.addEventListener("mouseup", () => {
      if (!isDragging)
        return;
      isDragging = false;
      if (dragHandle)
        dragHandle.style.cursor = "grab";
    });
    panel.addEventListener("click", (event) => {
      const cancel = event.target.closest?.('[data-mapper-cancel="true"]');
      const skip = event.target.closest?.('[data-mapper-skip="true"]');
      const save = event.target.closest?.('[data-mapper-save="true"]');
      if (cancel) {
        closeMapper();
        return;
      }
      if (skip) {
        advanceMapperStep();
        return;
      }
      if (save) {
        finishMapper();
      }
    });
    document.body.appendChild(overlay);
    document.addEventListener("click", handleMapperDocumentClick, true);
    renderMapperStatus();
  }
  function handleMapperDocumentClick(event) {
    if (!runtime.mapper)
      return;
    const overlay = document.getElementById(MAPPER_OVERLAY_ID);
    if (!overlay)
      return;
    if (overlay.contains(event.target))
      return;
    const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"], [onclick]') || event.target : null;
    if (!target)
      return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const step = runtime.mapper.steps[runtime.mapper.stepIndex];
    if (!step)
      return;
    const descriptor = buildMappedActionDescriptor(target);
    if (!descriptor) {
      showToast("No pude generar un selector estable para ese elemento");
      return;
    }
    runtime.mapper.selections[step.key] = descriptor;
    showToast(`Mapeado: ${step.key}`);
    advanceMapperStep();
  }
  function advanceMapperStep() {
    if (!runtime.mapper)
      return;
    runtime.mapper.stepIndex += 1;
    renderMapperStatus();
  }
  function renderMapperStatus() {
    const status = document.querySelector('[data-mapper-status="true"]');
    if (!status || !runtime.mapper)
      return;
    const currentStep = runtime.mapper.steps[runtime.mapper.stepIndex];
    if (!currentStep) {
      status.innerHTML = '<span style="color:#FFBA08;">Pasos completados.</span> Pulsa <strong>Guardar ahora</strong> para activar el mapeo.';
      return;
    }
    const completed = runtime.mapper.steps.slice(0, runtime.mapper.stepIndex).map((step) => `- ${step.key}`).join("<br>");
    status.innerHTML = `
		<div style="font-weight:500;">${currentStep.label}</div>
		<div style="margin-top:6px; font-size:11px; color:#7a787f;">Click sobre la pagina para capturar. Usa "Saltar paso" si no aplica.</div>
		${completed ? `<div style="margin-top:8px; font-size:11px; color:#7a787f;">Capturados:<br>${completed}</div>` : ""}
	`;
  }
  async function finishMapper() {
    if (!runtime.mapper)
      return;
    const actions = runtime.mapper.selections;
    if (!actions.next || !actions.main) {
      showToast("Necesito al menos siguiente capitulo y pagina principal");
      return;
    }
    const readingPrefix = inferReadingPrefix(actions);
    const label = prompt("Nombre corto para este mapeo:", window.location.host) || window.location.host;
    const mappingEntry = {
      id: buildMappingId(window.location.host, readingPrefix),
      host: window.location.host,
      label: label.trim() || window.location.host,
      enabled: true,
      hostAliases: [],
      readingPrefix,
      readingPrefixes: [],
      actions,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await upsertUserMapping(mappingEntry);
    closeMapper();
    setRuntimeSite(getActiveSite(window.location));
    showToast(`Web mapeada con prefijo ${readingPrefix}`);
  }
  function closeMapper() {
    document.removeEventListener("click", handleMapperDocumentClick, true);
    runtime.mapper = null;
    const overlay = document.getElementById(MAPPER_OVERLAY_ID);
    if (!overlay)
      return false;
    overlay.remove();
    return true;
  }
  function notifyNoActiveReader() {
    showToast("No hay un lector activo en esta pagina");
    return true;
  }
  async function toggleCurrentMappingEnabled() {
    const mapping = getMatchingUserMapping(window.location, { includeDisabled: true });
    if (!mapping)
      return false;
    const nextEnabled = mapping.enabled === false;
    await upsertUserMapping({
      ...mapping,
      enabled: nextEnabled
    });
    setRuntimeSite(getActiveSite(window.location));
    showToast(nextEnabled ? "Sitio activado" : "Sitio desactivado");
    return true;
  }
  function normalizeUserMappings(rawMappings) {
    if (rawMappings?.version === 3 && Array.isArray(rawMappings.entries)) {
      return {
        version: 3,
        entries: rawMappings.entries.map(normalizeUserMappingEntry).filter(Boolean)
      };
    }
    if (rawMappings?.version === 2 && Array.isArray(rawMappings.entries)) {
      return {
        version: 3,
        entries: rawMappings.entries.map(normalizeUserMappingEntry).filter(Boolean)
      };
    }
    const entries = [];
    if (rawMappings && typeof rawMappings === "object") {
      Object.entries(rawMappings).forEach(([host, value]) => {
        const mappings = Array.isArray(value) ? value : [value];
        mappings.forEach((mapping, index) => {
          const normalized = normalizeUserMappingEntry({
            ...mapping,
            host: mapping?.host || host,
            id: mapping?.id || `${host}::legacy-${index + 1}`
          });
          if (normalized)
            entries.push(normalized);
        });
      });
    }
    return {
      version: 3,
      entries
    };
  }
  function normalizeUserMappingEntry(entry) {
    if (!entry?.host || !entry?.readingPrefix || !entry?.actions?.next || !entry?.actions?.main) {
      return null;
    }
    const host = normalizeHost(entry.host);
    const readingPrefix = normalizePrefix(entry.readingPrefix);
    return {
      id: entry.id || buildMappingId(host, readingPrefix),
      host,
      label: String(entry.label || host).trim(),
      enabled: entry.enabled !== false,
      hostAliases: normalizeHostList(entry.hostAliases || entry.hosts || [], host),
      readingPrefix,
      readingPrefixes: normalizePrefixList(entry.readingPrefixes || entry.paths || [], readingPrefix),
      actions: normalizeMappingActions(entry.actions),
      createdAt: entry.createdAt || Date.now(),
      updatedAt: entry.updatedAt || entry.createdAt || Date.now()
    };
  }
  function normalizeMappingActions(actions) {
    return {
      next: normalizeMappingAction(actions.next),
      prev: normalizeMappingAction(actions.prev),
      main: normalizeMappingAction(actions.main)
    };
  }
  function normalizeMappingAction(action) {
    if (!action)
      return null;
    return {
      selectors: Array.isArray(action.selectors) ? action.selectors.map((value) => String(value).trim()).filter(Boolean) : [],
      text: String(action.text || "").trim(),
      tagName: String(action.tagName || "").trim(),
      sampleHref: String(action.sampleHref || "").trim()
    };
  }
  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase();
  }
  function normalizePrefix(value) {
    const prefix = String(value || "/").trim();
    if (!prefix.startsWith("/"))
      return `/${prefix}`;
    return prefix;
  }
  function normalizeStringList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    return String(value || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  function normalizeHostList(values, primaryHost) {
    return uniqueList(normalizeStringList(values).map(normalizeHost)).filter((host) => host && host !== primaryHost);
  }
  function normalizePrefixList(values, primaryPrefix) {
    return uniqueList(normalizeStringList(values).map(normalizePrefix)).filter((prefix) => prefix && prefix !== primaryPrefix);
  }
  function uniqueList(values) {
    return [...new Set(values.filter(Boolean))];
  }
  function getAllMappingHosts(mapping) {
    return uniqueList([normalizeHost(mapping?.host), ...(mapping?.hostAliases || []).map(normalizeHost)]).filter(Boolean);
  }
  function getAllReadingPrefixes(mapping) {
    return uniqueList([normalizePrefix(mapping?.readingPrefix), ...(mapping?.readingPrefixes || []).map(normalizePrefix)]).filter(Boolean);
  }
  function getUserMappingEntries() {
    return Array.isArray(runtime.persisted.userMappings?.entries) ? runtime.persisted.userMappings.entries : [];
  }
  function getHostUserMappings(host) {
    const normalizedHost = normalizeHost(host);
    return getUserMappingEntries().filter((mapping) => getAllMappingHosts(mapping).includes(normalizedHost));
  }
  function getMatchingUserMapping(location, options = {}) {
    const includeDisabled = Boolean(options.includeDisabled);
    return getHostUserMappings(location.host).filter((mapping) => includeDisabled || mapping.enabled !== false).filter((mapping) => matchesPath(location.pathname, getAllReadingPrefixes(mapping))).sort((left, right) => {
      const prefixDelta = getLongestMatchingPrefixLength(location.pathname, right) - getLongestMatchingPrefixLength(location.pathname, left);
      if (prefixDelta !== 0)
        return prefixDelta;
      return (right.updatedAt || 0) - (left.updatedAt || 0);
    })[0] || null;
  }
  async function upsertUserMapping(mappingEntry) {
    const nextEntry = normalizeUserMappingEntry(mappingEntry);
    if (!nextEntry)
      return;
    const entries = getUserMappingEntries().filter((entry) => {
      return entry.id !== nextEntry.id && !(entry.host === nextEntry.host && entry.readingPrefix === nextEntry.readingPrefix);
    });
    entries.push(nextEntry);
    runtime.persisted.userMappings = {
      version: 3,
      entries
    };
    await storage.set({ [STORAGE_KEYS.userMappings]: runtime.persisted.userMappings });
  }
  function buildMappingId(host, readingPrefix) {
    return `${normalizeHost(host)}::${normalizePrefix(readingPrefix)}`;
  }
  function getLongestMatchingPrefixLength(pathname, mapping) {
    return getAllReadingPrefixes(mapping).filter((prefix) => pathname.startsWith(prefix)).sort((left, right) => right.length - left.length)[0]?.length || 0;
  }
  function inferReadingPrefix(actions) {
    const chapterPaths = [window.location.pathname];
    ["next", "prev"].forEach((key) => {
      const href = actions[key]?.sampleHref;
      if (href) {
        const path = getHrefPath(href);
        if (path)
          chapterPaths.push(path);
      }
    });
    const prefix = getCommonPathPrefix(chapterPaths);
    return prefix || inferSimplePathPrefix(window.location.pathname);
  }
  function getCommonPathPrefix(paths) {
    if (!paths.length)
      return "";
    let prefix = paths[0];
    for (let index = 1;index < paths.length; index += 1) {
      while (paths[index] && !paths[index].startsWith(prefix) && prefix) {
        prefix = prefix.slice(0, -1);
      }
    }
    const slashIndex = prefix.lastIndexOf("/");
    if (slashIndex <= 0)
      return "";
    return `${prefix.slice(0, slashIndex + 1)}`;
  }
  function inferSimplePathPrefix(pathname) {
    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length)
      return "/";
    return `/${segments[0]}/`;
  }
  function buildMappedActionDescriptor(element) {
    const clickable = element.closest?.('a, button, [role="button"], [onclick]') || element;
    if (!(clickable instanceof Element))
      return null;
    const selectorCandidates = buildSelectorCandidates(clickable);
    if (!selectorCandidates.length)
      return null;
    return {
      selectors: selectorCandidates,
      text: getElementText(clickable),
      tagName: clickable.tagName.toLowerCase(),
      sampleHref: getAbsoluteHref(clickable.getAttribute?.("href") || "")
    };
  }
  function buildSelectorCandidates(element) {
    const candidates = [];
    if (element.id)
      candidates.push(`#${escapeCssToken(element.id)}`);
    const name = element.getAttribute("name");
    if (name)
      candidates.push(`${element.tagName.toLowerCase()}[name="${escapeAttribute(name)}"]`);
    const title = element.getAttribute("title");
    if (title)
      candidates.push(`${element.tagName.toLowerCase()}[title="${escapeAttribute(title)}"]`);
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel)
      candidates.push(`${element.tagName.toLowerCase()}[aria-label="${escapeAttribute(ariaLabel)}"]`);
    const classes = [...element.classList].filter(Boolean).slice(0, 3);
    if (classes.length) {
      candidates.push(`${element.tagName.toLowerCase()}.${classes.map(escapeCssToken).join(".")}`);
    }
    const pathSelector = buildNthSelector(element);
    if (pathSelector)
      candidates.push(pathSelector);
    return [...new Set(candidates)].filter((selector) => {
      try {
        return document.querySelector(selector);
      } catch {
        return false;
      }
    });
  }
  function buildNthSelector(element) {
    const parts = [];
    let current = element;
    while (current && current instanceof Element && current.tagName.toLowerCase() !== "body") {
      const tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent)
        break;
      const siblings = [...parent.children].filter((child) => child.tagName === current.tagName);
      const position = siblings.indexOf(current) + 1;
      parts.unshift(`${tagName}:nth-of-type(${position})`);
      current = parent;
    }
    if (!parts.length)
      return "";
    return parts.join(" > ");
  }
  function resolveMappedHref(action) {
    if (!action?.selectors?.length)
      return "";
    for (const selector of action.selectors) {
      try {
        const element = document.querySelector(selector);
        if (!element)
          continue;
        const href = element.getAttribute?.("href");
        if (href)
          return href;
      } catch {
        continue;
      }
    }
    const fallback = findLink((link) => {
      const text = getElementText(link);
      return action.text && text.includes(action.text);
    });
    return fallback?.getAttribute("href") || action.sampleHref || "";
  }
  function escapeCssToken(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
  function escapeAttribute(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', "\\\"");
  }
  function toggleChapterMap() {
    if (closeChapterMap())
      return;
    openChapterMap();
  }
  function openChapterMap() {
    const mainHref = getAbsoluteHref(runtime.site.getMainHref?.());
    if (!mainHref) {
      showToast("Todavia no encuentro la pagina de la obra");
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = CHAPTER_MAP_OVERLAY_ID;
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.background = "rgba(0, 0, 0, 0.35)";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.webkitBackdropFilter = "blur(4px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "stretch";
    overlay.style.justifyContent = "flex-end";
    overlay.innerHTML = `
		<div style="width:min(420px,100%); height:100vh; overflow:hidden; background:rgba(12,12,16,0.92); color:#e8e6e1; border-left:3px solid #FFBA08; box-shadow:-20px 0 50px rgba(0,0,0,.5); font-family:'IBM Plex Mono',Consolas,monospace; display:grid; grid-template-rows:auto auto minmax(0,1fr); gap:0;">
			<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:18px 20px; border-bottom:1px solid rgba(255,255,255,0.06);">
				<div>
					<div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.16em; color:#FFBA08; font-family:'Chakra Petch',sans-serif;">Capitulos</div>
					<div style="font-size:16px; font-weight:700; font-family:'Chakra Petch',sans-serif; margin-top:3px;">${runtime.site.label}</div>
				</div>
				<button type="button" data-close-chapter-map="true" style="appearance:none; background:rgba(255,255,255,0.06); color:#7a787f; border:1px solid rgba(255,255,255,0.06); border-radius:4px; width:30px; height:30px; cursor:pointer; font-size:14px; line-height:1;">×</button>
			</div>
			<div style="padding:12px 20px;">
				<input type="text" data-chapter-search="true" placeholder="Buscar capitulo..." style="width:100%; background:rgba(255,255,255,0.04); color:#e8e6e1; border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:10px 12px; outline:none; font:13px/1.4 'IBM Plex Mono',monospace; transition:border-color .15s;">
			</div>
			<div data-chapter-results="true" style="overflow:auto; display:grid; gap:6px; align-content:start; padding:4px 20px 20px;">
				<div style="font-size:12px; color:#7a787f;">Cargando capitulos...</div>
			</div>
		</div>
	`;
    overlay.addEventListener("click", (event) => {
      const closeButton = event.target.closest?.('[data-close-chapter-map="true"]');
      if (event.target === overlay || closeButton)
        closeChapterMap();
    });
    document.body.appendChild(overlay);
    const searchInput = overlay.querySelector('[data-chapter-search="true"]');
    searchInput?.focus();
    loadChapterMap(mainHref, overlay);
  }
  function closeChapterMap() {
    const overlay = document.getElementById(CHAPTER_MAP_OVERLAY_ID);
    if (!overlay)
      return false;
    overlay.remove();
    return true;
  }
  async function loadChapterMap(mainHref, overlay) {
    const cached = getCachedChapterMap(mainHref);
    if (cached.length) {
      renderChapterResults(overlay, cached);
    }
    const chapters = cached.length ? cached : await fetchChapterMap(mainHref);
    renderChapterResults(overlay, chapters);
    const searchInput = overlay.querySelector('[data-chapter-search="true"]');
    searchInput?.addEventListener("input", (event) => {
      const query = String(event.target.value || "").trim().toLowerCase();
      const filtered = !query ? chapters : chapters.filter((chapter) => chapter.label.toLowerCase().includes(query) || chapter.href.toLowerCase().includes(query));
      renderChapterResults(overlay, filtered);
    });
  }
  function getCachedChapterMap(mainHref) {
    const cacheEntry = runtime.persisted.chapterCache[mainHref];
    if (!cacheEntry)
      return [];
    if (Date.now() - cacheEntry.updatedAt > CHAPTER_CACHE_MAX_AGE_MS)
      return [];
    return Array.isArray(cacheEntry.chapters) ? cacheEntry.chapters : [];
  }
  async function fetchChapterMap(mainHref) {
    try {
      const response = await fetch(mainHref, { credentials: "include" });
      const html = await response.text();
      const documentParser = new DOMParser().parseFromString(html, "text/html");
      const chapters = extractChapterLinks(documentParser, mainHref);
      runtime.persisted.chapterCache[mainHref] = {
        updatedAt: Date.now(),
        chapters
      };
      storage.set({ [STORAGE_KEYS.chapterCache]: runtime.persisted.chapterCache });
      return chapters;
    } catch {
      showToast("No pude cargar la lista de capitulos");
      return [];
    }
  }
  function extractChapterLinks(documentParser, mainHref) {
    const seen = new Set;
    const chapters = [];
    [...documentParser.querySelectorAll("a[href]")].forEach((link) => {
      const absoluteHref = getAbsoluteHrefFromBase(mainHref, link.getAttribute("href"));
      if (!absoluteHref)
        return;
      const path = getHrefPath(absoluteHref);
      if (!matchesPath(path, runtime.site.paths))
        return;
      if (seen.has(absoluteHref))
        return;
      seen.add(absoluteHref);
      const label = link.textContent?.replace(/\s+/g, " ").trim() || path.split("/").filter(Boolean).pop() || absoluteHref;
      chapters.push({
        href: absoluteHref,
        label
      });
    });
    return chapters;
  }
  function renderChapterResults(overlay, chapters) {
    const results = overlay.querySelector('[data-chapter-results="true"]');
    if (!results)
      return;
    if (!chapters.length) {
      results.innerHTML = '<div style="font-size:12px; color:#7a787f;">No encontre capitulos para mostrar.</div>';
      return;
    }
    results.innerHTML = chapters.map((chapter) => {
      const isCurrent = chapter.href === window.location.href;
      const bg = isCurrent ? "rgba(255,186,8,0.12)" : "rgba(255,255,255,0.03)";
      const border = isCurrent ? "rgba(255,186,8,0.3)" : "rgba(255,255,255,0.06)";
      const color = isCurrent ? "#FFBA08" : "#e8e6e1";
      return `
			<button type="button" data-chapter-href="${escapeHtml(chapter.href)}" style="appearance:none; text-align:left; width:100%; background:${bg}; color:${color}; border:1px solid ${border}; border-radius:4px; padding:10px 12px; cursor:pointer; font:12px/1.4 'IBM Plex Mono',monospace; transition:background .12s,border-color .12s;">
				${isCurrent ? "▸ " : ""}${escapeHtml(chapter.label)}
			</button>
		`;
    }).join("");
    [...results.querySelectorAll("[data-chapter-href]")].forEach((button) => {
      button.addEventListener("click", () => {
        navigateToHref(button.dataset.chapterHref);
      });
    });
  }
  function renderShortcutSection(title, shortcuts) {
    return `
		<div style="border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:12px 14px;">
			<div style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; color:#FFBA08; margin-bottom:10px; font-family:'Chakra Petch',sans-serif;">${title}</div>
			<div style="display:grid; gap:7px;">
				${shortcuts.map((shortcut) => {
      return `
						<div style="display:flex; justify-content:space-between; gap:12px; align-items:center;">
							<kbd style="background:#0c0c10; border:1px solid rgba(255,255,255,0.06); border-bottom-width:2px; border-bottom-color:rgba(0,0,0,0.3); border-radius:4px; padding:4px 8px; font:600 11px/1.3 'IBM Plex Mono',monospace; min-width:80px; text-align:center; color:#e8e6e1;">${shortcut.key}</kbd>
							<span style="font-size:12px; color:#7a787f; text-align:right;">${shortcut.description}</span>
						</div>
					`;
    }).join("")}
			</div>
		</div>
	`;
  }
  function showToast(message, duration) {
    const timeout = duration || 1600;
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.background = "rgba(12, 12, 16, 0.88)";
    toast.style.backdropFilter = "blur(12px)";
    toast.style.webkitBackdropFilter = "blur(12px)";
    toast.style.color = "#e8e6e1";
    toast.style.border = "1px solid rgba(255, 255, 255, 0.06)";
    toast.style.borderLeft = "3px solid #FFBA08";
    toast.style.borderRadius = "4px";
    toast.style.padding = "10px 14px";
    toast.style.fontFamily = "'IBM Plex Mono', Consolas, monospace";
    toast.style.fontSize = "12px";
    toast.style.boxShadow = "0 14px 30px rgba(0, 0, 0, 0.45)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity .18s ease, transform .18s ease";
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      window.setTimeout(() => toast.remove(), 180);
    }, timeout);
  }
  function getToastContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (container)
      return container;
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.style.position = "fixed";
    container.style.right = "16px";
    container.style.bottom = "16px";
    container.style.zIndex = "2147483647";
    container.style.display = "grid";
    container.style.gap = "10px";
    container.style.maxWidth = "min(360px, calc(100vw - 32px))";
    document.body.appendChild(container);
    return container;
  }
  function saveSiteSetting(key, value) {
    const siteSettings = runtime.persisted.settings[runtime.site.id] || {};
    runtime.persisted.settings[runtime.site.id] = {
      ...siteSettings,
      [key]: value
    };
    storage.set({ [STORAGE_KEYS.settings]: runtime.persisted.settings });
  }
  function getResumeKey() {
    return `${runtime.site.id}:${window.location.pathname}${window.location.search}`;
  }
  function getCurrentMainHref() {
    return getComparableHref(getAbsoluteHref(runtime.site?.getMainHref?.()));
  }
  function getCurrentChapterHref() {
    return getComparableHref(window.location.href);
  }
  function getComparableHref(href) {
    if (!href)
      return "";
    try {
      const url = new URL(href, window.location.href);
      url.hash = "";
      return url.href;
    } catch {
      return "";
    }
  }
  function areComparableHrefsEqual(left, right) {
    if (!left || !right)
      return false;
    return getComparableHref(left) === getComparableHref(right);
  }
  function getReadProgress() {
    const maxScroll = getMaxScroll();
    if (maxScroll <= 0)
      return 1;
    return Math.min(1, (window.scrollY || 0) / maxScroll);
  }
  function getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function pruneResumeEntries(entries) {
    const now = Date.now();
    const freshEntries = Object.entries(entries).filter(([, entry]) => {
      return entry && typeof entry.updatedAt === "number" && now - entry.updatedAt <= RESUME_MAX_AGE_MS;
    });
    freshEntries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    return Object.fromEntries(freshEntries.slice(0, RESUME_MAX_ENTRIES));
  }
  function getNamedHref(name) {
    return document.getElementsByName(name)[0]?.getAttribute("href") || "";
  }
  function getTMOChapterHref(className) {
    return document.getElementsByClassName(className)[0]?.querySelector("a[href]")?.getAttribute("href") || "";
  }
  function getTMOMainHref() {
    const items = [...document.getElementsByClassName("d-inline px-1")];
    let mainHref = items[0]?.querySelector("a[href]")?.getAttribute("href") || "";
    if (mainHref === "#") {
      mainHref = items[1]?.querySelector("a[href]")?.getAttribute("href") || "";
    }
    return mainHref;
  }
  function getManhwaWebChapterHref(direction) {
    const chapterLink = findLink((link) => {
      const path = getLinkPath(link);
      const text = getElementText(link);
      if (!matchesPath(path, sites.manhwaweb.paths))
        return false;
      return direction === "siguiente" ? text.includes("cap. siguiente") || text.includes("siguiente") : text.includes("cap. anterior") || text.includes("anterior");
    });
    return chapterLink?.getAttribute("href") || "";
  }
  function getManhwaWebMainHref() {
    return findLink((link) => {
      const path = getLinkPath(link);
      return path.startsWith("/manhwa/") || path.startsWith("/manga/");
    })?.getAttribute("href") || "";
  }
  function findLink(predicate) {
    return [...document.querySelectorAll("a[href]")].find(predicate);
  }
  function getElementText(element) {
    return element?.textContent?.toLowerCase() || "";
  }
  function getLinkPath(link) {
    return getHrefPath(link?.getAttribute("href"));
  }
  function getHrefPath(href) {
    if (!href)
      return "";
    try {
      return new URL(href, window.location.origin).pathname;
    } catch {
      return "";
    }
  }
  function getAbsoluteHref(href) {
    if (!href)
      return "";
    try {
      return new URL(href, window.location.origin).href;
    } catch {
      return "";
    }
  }
  function navigateToHref(href) {
    const absoluteHref = getAbsoluteHref(href);
    if (!absoluteHref)
      return false;
    window.location.href = absoluteHref;
    return true;
  }
  var storage = createStorage();
  function createStorage() {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return {
        get(keys) {
          return new Promise((resolve) => {
            chrome.storage.local.get(keys, (value) => {
              resolve(value || {});
            });
          });
        },
        set(values) {
          return new Promise((resolve) => {
            chrome.storage.local.set(values, () => resolve());
          });
        }
      };
    }
    return {
      async get(keys) {
        const keyList = Array.isArray(keys) ? keys : [keys];
        const values = {};
        keyList.forEach((key) => {
          try {
            values[key] = JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            values[key] = null;
          }
        });
        return values;
      },
      async set(entries) {
        Object.entries(entries).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }
    };
  }
})();
