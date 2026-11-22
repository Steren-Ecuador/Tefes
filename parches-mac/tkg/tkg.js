/* tkg: Inicio tipo TikTok genérico (celular): cada grupo de tarjetas ocupa una pantalla y se desliza hacia arriba */
  function tkgArmar(cont, grupos, clave){
    window.__tkgPos = window.__tkgPos || {};
    if (!cont || !matchMedia('(max-width:700px)').matches) return;
    grupos = grupos.map(g => g.filter(Boolean)).filter(g => g.length);
    if (grupos.length < 2) return;
    const fe = document.createElement('div'); fe.className = 'tkg-feed';
    grupos[0][0].before(fe);
    grupos.forEach((g, i) => {
      const s = document.createElement('section'); s.className = 'tkg-s tkg-c' + (i % 4);
      const w = document.createElement('div'); w.className = 'tkg-in';
      g.forEach(e => { if (!e.classList.contains('card')) e.classList.add('tkg-hoja'); w.appendChild(e); });
      const p = document.createElement('div'); p.className = 'tkg-pos'; p.innerHTML = grupos.map((_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join('');
      s.appendChild(p); s.appendChild(w); fe.appendChild(s);
    });
    const medir = () => {
      const r = fe.getBoundingClientRect(), nb = [...document.querySelectorAll('nav')].find(n => { const q = n.getBoundingClientRect(); return q.height && q.top > innerHeight / 2; });
      const tope = nb ? nb.getBoundingClientRect().top : innerHeight, y = r.top + (fe.parentElement ? 0 : 0);
      fe.style.height = Math.max(300, Math.floor(tope - y)) + 'px';
      fe.style.width = document.documentElement.clientWidth + 'px'; fe.style.marginLeft = (-(r.left - parseFloat(fe.style.marginLeft || 0))) + 'px';
      fe.querySelectorAll('.tkg-s').forEach(s => s.classList.toggle('tkg-alto', s.offsetHeight > fe.clientHeight + 2));   /* pantallas más altas: se pueden recorrer completas */
    };
    medir(); setTimeout(medir, 350); fe.scrollTop = window.__tkgPos[clave] || 0;
    fe.addEventListener('scroll', () => { window.__tkgPos[clave] = fe.scrollTop; }, {passive: true});
    if (!window.__tkgR) { window.__tkgR = 1; addEventListener('resize', () => document.querySelectorAll('.tkg-feed').forEach(f => f.__m && f.__m())); }
    fe.__m = medir;
    document.body.classList.add('tkg-body');
  }
/* /tkg */
