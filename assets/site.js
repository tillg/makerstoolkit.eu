// Hell/dunkel umschalten und Mermaid-Diagramme passend zum Farbschema zeichnen.
(function () {
  const root = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  const blocks = [...document.querySelectorAll('.mermaid')];
  blocks.forEach(b => { const pre = b.querySelector('.mermaid-src'); if (pre) b.dataset.src = pre.textContent; });
  let n = 0;

  async function drawMermaid() {
    if (!blocks.length || !window.mermaid) return;
    // Farben aus den CSS-Variablen (design/tokens.css + site/style.css)
    const css = getComputedStyle(root), v = n => css.getPropertyValue(n).trim();
    window.mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        darkMode: root.dataset.theme === 'dark', background: v('--bg'),
        primaryColor: v('--surface'), primaryTextColor: v('--text'), primaryBorderColor: v('--cyan'),
        secondaryColor: v('--surface-2'), tertiaryColor: v('--band'),
        lineColor: v('--faint'), textColor: v('--text'),
        clusterBkg: v('--band'), clusterBorder: v('--rule-2'), edgeLabelBackground: v('--bg'),
        git0: v('--cyan'), git1: v('--violet'), git2: v('--amber'), git3: v('--green'),
        gitBranchLabel0: v('--on-accent'), gitBranchLabel1: v('--on-accent'), gitBranchLabel2: v('--on-accent'), gitBranchLabel3: v('--on-accent'),
        commitLabelColor: v('--text'), commitLabelBackground: v('--surface'),
      },
    });
    for (const b of blocks) {
      try {
        const { svg } = await window.mermaid.render(`mmd-${++n}`, b.dataset.src);
        b.innerHTML = svg;
      } catch (e) { console.warn('Mermaid', e); }
    }
  }

  btn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('mmt-theme', next); } catch (e) {}
    drawMermaid();
  });
  // Systemeinstellung folgen, solange nichts gewählt ist
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', e => {
    let saved = null;
    try { saved = localStorage.getItem('mmt-theme'); } catch (err) {}
    if (saved) return;
    root.dataset.theme = e.matches ? 'light' : 'dark';
    drawMermaid();
  });
  drawMermaid();
})();
