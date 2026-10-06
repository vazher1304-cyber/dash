/* Classic entry keeps file://, unsupported WebGL and no3d free of module requests. */
(() => {
  let started = false;
  window.TemplerScene = {
    init() {
      if (started) return;
      started = true;
      const host = document.getElementById('isometric-scene');
      const wide = matchMedia('(min-width:768px)');
      let instance = null, loading = false, stopped = false, failed = false;
      const disabled = new URLSearchParams(location.search).get('no3d') === '1' || location.protocol === 'file:';
      async function reconcile() {
        if (stopped || failed || disabled || !wide.matches) {
          instance?.dispose(); instance = null;
          host.dataset.state = disabled ? 'disabled' : failed ? 'unavailable' : 'mobile';
          return;
        }
        if (instance || loading) return;
        loading = true;
        const canvas = document.createElement('canvas');
        let context;
        try { context = canvas.getContext('webgl2', { antialias: true, alpha: false }); } catch { /* static fallback */ }
        if (!context) { failed = true; loading = false; host.dataset.state = 'unavailable'; return; }
        try {
          const { createScene } = await import('./scene.js');
          if (stopped || !wide.matches) { context.getExtension('WEBGL_lose_context')?.loseContext(); return; }
          instance = createScene(host, canvas, context);
          host.dataset.state = 'ready';
        } catch {
          failed = true;
          context.getExtension('WEBGL_lose_context')?.loseContext();
          host.replaceChildren(); host.dataset.state = 'unavailable';
          document.documentElement.classList.remove('scene-ready');
        } finally { loading = false; }
      }
      wide.addEventListener('change', reconcile);
      const leave = () => { stopped = true; instance?.dispose(); instance = null; };
      const restore = () => { stopped = false; reconcile(); };
      window.addEventListener('pagehide', leave);
      window.addEventListener('pageshow', restore);
      this.dispose = () => {
        leave(); wide.removeEventListener('change', reconcile);
        window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', restore);
        host.dataset.state = 'disposed'; started = false;
      };
      reconcile();
    }
  };
})();
