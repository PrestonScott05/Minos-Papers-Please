(function () {
  const $ = (id) => document.getElementById(id);

  const elements = {
    hudTime: $('hud-time'), hudScore: $('hud-score'), hudStreak: $('hud-streak'),
    stats: {
      virtue: $('stat-virtue'), wisdom: $('stat-wisdom'),
      courage: $('stat-courage'), compassion: $('stat-compassion'),
      humility: $('stat-humility')
    },
    fxlog: $('effects-log'),
    name: $('soul-name'), clues: $('soul-clues'),
    bins: $('bins'),
    art: document.querySelector('.side--art .art'),
    coilCounter: $('coil-counter'),
    coilHint: $('coil-hint'),
    consult: $('btn-consult'), pity: $('btn-pity'),
    reveal: $('reveal'),
    end: $('end-screen')
  };

  let coil = {
    value: 0,
    idleTimer: null,
    idleMs: 2500,
    wrapMax: 9
  };

  // helpers --------------------------------------------------------------
  function formatTime(milliseconds) {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
  }

  function numeral(n) {
    const map = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    return map[n] || String(n);
  }

  function diffStats(before, after) {
    return ['virtue','wisdom','courage','compassion','humility']
      .map(k => {
        const d = (after[k] ?? 0) - (before[k] ?? 0);
        return d ? `${k}:${d > 0 ? '+' : ''}${d}` : null;
      })
      .filter(Boolean).join('  ');
  }

  function dialogIsOpen() {
    return Array.from(document.querySelectorAll('dialog')).some(d => d.open);
  }

  function isInteractive(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (!tag) return false;
    return /^(INPUT|BUTTON|SELECT|TEXTAREA|A)$/.test(tag);
  }

  // ui rendering -------------------------------------------
  function renderHUD(diff=null) {
    const state = GameState.State;
    elements.hudTime.textContent = formatTime(state.timerMs);
    elements.hudScore.textContent = state.score;
    elements.hudStreak.textContent = state.streak;

    for (const k in elements.stats) {
      elements.stats[k].textContent = state.stats[k];
    }

    if (elements.fxlog) elements.fxlog.textContent = diff || '';
    elements.consult.textContent = `Appeal to Virgil (${state.power.consults})`;
    elements.pity.textContent = `Mercy Stay (${state.power.pities})`;
  }

  function renderSoulCard() {
    const currentSoul = GameState.State.current;
    elements.reveal.textContent = '';
    if (!currentSoul) {
      elements.name.textContent = '';
      elements.clues.innerHTML = '';
      return;
    }

    elements.name.textContent = currentSoul.name;
    elements.clues.innerHTML = currentSoul.clues.map(clue => `<li>${clue}</li>`).join('');
  }

  function setCoil(value) {
    coil.value = value;
    if (elements.coilCounter){
      elements.coilCounter.textContent = value ? `Circle ${numeral(value)} selected` : '';
    }
  }

  function clearCoil() {
    setCoil(0);
    if (coil.idleTimer){
      clearTimeout(coil.idleTimer);
      coil.idleTimer = null;
    }
  }

  function scheduleAutoCommit() {
    if (coil.idleTimer) clearTimeout(coil.idleTimer);
    coil.idleTimer = setTimeout(commitCoil, coil.idleMs);
  }

  function commitCoil() {
    if (!coil.value) return;

    const target = CIRCLES.find(c => c.n === coil.value);
    if (!target) {
      clearCoil();
      return;
    }

    const before = {...GameState.State.stats};
    GameState.assign(target.id);
    const after = GameState.State.stats;

    renderHUD(diffStats(before, after));

    clearCoil();
    elements.art?.classList.remove('curling');

    if (GameState.isOver()) return showEnd();

    renderSoulCard();
  }

  function renderBins() {
    elements.bins.innerHTML = '';

    const ante = document.createElement('button');
    ante.className = 'btn';
    ante.textContent = 'Send to Ante-Inferno';
    ante.title = 'Those who refused to choose (hotkey A)';

    ante.addEventListener('click', () => {
      const before = {...GameState.State.stats};
      GameState.assign('indifferent');
      const after = GameState.State.stats;
      renderHUD(diffStats(before, after));

      if (GameState.isOver()) {
        showEnd();
        return;
      }
      renderSoulCard();
    });

    elements.bins.appendChild(ante);

    if (elements.coilHint) elements.coilHint.classList.remove('hidden');
  }

  function showEnd() {
    const ending = GameState.pickEnding();
    const endDialog = document.getElementById('end-screen');
    const endMessage = document.getElementById('end-message');

    endMessage.textContent = `Outcome: ${ending} - Score ${GameState.State.score}`;
    endDialog.showModal();
  }

  function resetForNewGame() {
    if (elements.fxlog) elements.fxlog.textContent = '';
    if (elements.reveal) elements.reveal.textContent = '';
    clearCoil();
    elements.art?.classList.remove('curling');

    try { document.activeElement?.blur(); } catch (_) {}
  }

  function wireCoilKeys() {
    if (wireCoilKeys._wired) return;
    wireCoilKeys._wired = true;

    window.addEventListener('keydown', (e) => {
      if (dialogIsOpen()) return;

      const active = document.activeElement;
      const interactive = isInteractive(active);

      if ((e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();

        if (interactive) {
          try { active.blur(); } catch (_) {}
        }

        elements.art?.classList.add('curling');
        setCoil(coil.value >= coil.wrapMax ? 1 : coil.value + 1);
        scheduleAutoCommit();
        return;
      }

      if (e.repeat) return;

      switch (e.key) {
        case 'Enter':
          commitCoil();
          break;

        case 'A': case 'a':
          if (!interactive) elements.bins.querySelector('button')?.click();
          break;

        case 'Backspace':
        case 'Escape':
          clearCoil();
          elements.art?.classList.remove('curling');
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (!coil.value) elements.art?.classList.remove('curling');
      }
    });
  }

  function wireControls() {
    if (wireControls._wired) return;
    wireControls._wired = true;

    const hideHintOnce = () => {
      const h = document.getElementById('coil-hint');
      if (h && !hideHintOnce.done) {
        h.classList.add('hidden');
        hideHintOnce.done = true;
      }
    };

    elements.consult?.addEventListener('click', () => {
      const before = {...GameState.State.stats};
      const answer = GameState.useConsult();
      const after = GameState.State.stats;

      if (answer) {
        elements.reveal.textContent = `Test points to: ${answer.toUpperCase()}`;
      } else {
        elements.reveal.textContent = `No appeals left.`;
      }

      renderHUD(diffStats(before, after));
    });

    elements.pity?.addEventListener('click', () => {
      const before = { ...GameState.State.stats };
      GameState.usePity();
      const after = GameState.State.stats;

      elements.reveal.textContent = '';
      renderHUD(diffStats(before, after));

      if (GameState.isOver()) {
        showEnd();
        return;
      }

      renderSoulCard();
      hideHintOnce();
    });

    wireCoilKeys();
  }

  window.UI = Object.assign(window.UI || {}, {
    renderHUD, renderSoulCard, renderBins, wireControls, showEnd, diffStats, resetForNewGame
  });
})();
