(() => {
  const routes = {
    '/spa/series.html': {
      title: 'SPA Series',
      body: `
        <header><h1>SPA Series</h1></header>
        <main>
          <a href="/spa/reader-0.html">Capitulo 0</a>
          <a href="/spa/reader-1.html">Capitulo 1</a>
          <a href="/spa/reader-2.html">Capitulo 2</a>
        </main>
      `
    },
    '/spa/reader-0.html': {
      title: 'SPA Reader 0',
      body: `
        <header>Header de prueba SPA</header>
        <aside>Sidebar de prueba SPA</aside>
        <main>
          <div class="nav">
            <a id="prev-link" href="/spa/reader-0.html">Anterior</a>
            <a id="main-link" href="/spa/series.html">Serie</a>
            <a id="next-link" href="/spa/reader-1.html">Siguiente</a>
          </div>
          <div class="page">Pagina larga SPA 0A</div>
          <div class="page">Pagina larga SPA 0B</div>
        </main>
        <footer>Footer de prueba SPA</footer>
      `
    },
    '/spa/reader-1.html': {
      title: 'SPA Reader 1',
      body: `
        <header>Header de prueba SPA</header>
        <aside>Sidebar de prueba SPA</aside>
        <main>
          <div class="nav">
            <a id="prev-link" href="/spa/reader-0.html">Anterior</a>
            <a id="main-link" href="/spa/series.html">Serie</a>
            <a id="next-link" href="/spa/reader-2.html">Siguiente</a>
          </div>
          <div class="page">Pagina larga SPA 1A</div>
          <div class="page">Pagina larga SPA 1B</div>
          <div class="page">Pagina larga SPA 1C</div>
        </main>
        <footer>Footer de prueba SPA</footer>
      `
    },
    '/spa/reader-2.html': {
      title: 'SPA Reader 2',
      body: `
        <header>Header de prueba SPA</header>
        <aside>Sidebar de prueba SPA</aside>
        <main>
          <div class="nav">
            <a id="prev-link" href="/spa/reader-1.html">Anterior</a>
            <a id="main-link" href="/spa/series.html">Serie</a>
            <a id="next-link" href="/spa/reader-2.html">Siguiente</a>
          </div>
          <div class="page">Pagina larga SPA 2A</div>
          <div class="page">Pagina larga SPA 2B</div>
        </main>
        <footer>Footer de prueba SPA</footer>
      `
    }
  };

  function render() {
    const route = routes[window.location.pathname] || routes['/spa/series.html'];
    document.title = route.title;
    document.body.innerHTML = route.body;
  }

  function navigate(href) {
    history.pushState({}, '', href);
    render();
  }

  document.addEventListener('click', event => {
    const target = event.target;
    const anchor = target instanceof Element ? target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!anchor.pathname.startsWith('/spa/')) return;

    event.preventDefault();
    navigate(anchor.pathname);
  });

  window.addEventListener('popstate', render);
  render();
})();
