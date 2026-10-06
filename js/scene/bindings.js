/* Read-only adapter over the existing model and SVG. No parallel data rules. */
export function createBindings(onChange) {
  let dirty = true, fingerprint = '';
  const map = document.getElementById('m-canvas');
  const observer = new MutationObserver(() => { dirty = true; });
  observer.observe(map, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'data-i'] });
  observer.observe(document.getElementById('overviewProjects'), { childList: true, subtree: true, characterData: true });
  return {
    update() {
      if (!dirty) return;
      dirty = false;
      const project = selectDisplayedMapProject();
      const nodes = [...map.querySelectorAll('.mlot')];
      const lots = nodes.map(element => {
        const lot = mapState.lots[Number(element.dataset.i)];
        return lot && { lot, element, id: lot.r._id, selector: `#m-canvas .mlot[data-i="${element.dataset.i}"]`,
          filtered: element.classList.contains('dim'), selected: element.getAttribute('aria-pressed') === 'true' };
      }).filter(Boolean);
      const next = JSON.stringify(lots.map(e => [e.id, e.lot, e.filtered, e.selected]));
      // DOM replacement still requires fresh targets, even with identical data.
      const changed = next !== fingerprint;
      fingerprint = next;
      const layout = project?.lots.length ? layoutMapa(project, { schematic: true }) : null;
      onChange({ project, layout, lots, changed });
    },
    dispose() { observer.disconnect(); }
  };
}

export function tooltipContent(entry, container) {
  container.innerHTML = mapTipHtml(entry.lot); // Existing escaped formatter and missing-field rules.
  const project = document.createElement('p');
  project.className = 'scene-tooltip-project';
  project.textContent = proyectoDe(entry.lot.r);
  container.prepend(project);
}

export function entityId(target) {
  const element = target.closest?.('.mlot,[data-rid],[data-open-rid],[data-show-map-rid]');
  if (!element) return null;
  if (element.matches('.mlot')) return mapState.lots[Number(element.dataset.i)]?.r._id ?? null;
  return Number(element.dataset.rid ?? element.dataset.openRid ?? element.dataset.showMapRid);
}
