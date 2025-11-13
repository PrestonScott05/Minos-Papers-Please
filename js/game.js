// js/game.js
(function () {
  let tickId = null;
  const startMenu = document.getElementById('start-menu');
  const btnStart  = document.getElementById('btn-start');
  const btnRestart= document.getElementById('btn-restart');

  const optDifficulty = document.getElementById('opt-difficulty');
  const optSound = document.getElementById('opt-sound');
  const optTips = document.getElementById('opt-tips');

  const creditsDialog = document.getElementById('credits-dialog');
  const endDialog = document.getElementById('end-screen');
  const btnEndCredits = document.getElementById('btn-credits');
  const btnEndClose = document.getElementById('btn-close-end');

  const btnStartCredits = startMenu?.querySelector('footer .ghost');

  const DIFF = {
    easy:   { timeMs: 4*60_000, deck: 20, consults:2, pities:2, penaltyMs:0 },
    normal: { timeMs: 3*60_000, deck: 25, consults:1, pities:1, penaltyMs:5000 },
    hard:   { timeMs: 150_000,  deck: 30, consults:0, pities:1, penaltyMs:7000 }
  };

  function closeAllDialogs() {
    document.querySelectorAll('dialog').forEach(d => {
      try { d.close(); } catch (_) {}
    });
  }

  function applyDifficulty(d) {
    const cfg = DIFF[d] || DIFF.normal;
    GameState.initiateGame(cfg.deck);

    const S = GameState.State;
    S.timerMs    = cfg.timeMs;
    S.power      = { consults: cfg.consults, pities: cfg.pities };
    S.penaltyMs  = cfg.penaltyMs;

    S.opts = { sound: optSound.value === 'on', tips: optTips.value === 'on', difficulty: d };
  }

  function focusPlayfield() {
    if (document.activeElement && document.activeElement !== document.body) {
      try { document.activeElement.blur(); } catch (_) {}
    }

    try { document.body.focus(); } catch (_) {}
  }

  function startLoop() {
    clearInterval(tickId);
    tickId = setInterval(() => {
      const S = GameState.State;
      S.timerMs = Math.max(0, S.timerMs - 1000);
      UI.renderHUD();
      if (GameState.isOver()) {
        clearInterval(tickId);
        UI.showEnd();
      }
    }, 1000);
  }

  function startGameFromMenu() {
    const diff = optDifficulty.value;
    applyDifficulty(diff);

    UI.resetForNewGame();
    closeAllDialogs();

    UI.wireControls();
    UI.renderHUD();
    UI.renderSoulCard();
    UI.renderBins();

    focusPlayfield();

    startLoop();
  }

  function restartGame() {
    clearInterval(tickId);
    closeAllDialogs();
    startMenu.showModal();
  }

  window.addEventListener('load', () => {
    startMenu.showModal();

    btnStart.addEventListener('click', (e) => {
      e.preventDefault();
      startGameFromMenu();
    });


    btnRestart?.addEventListener('click', (e) => {
      restartGame();
      try { e.currentTarget?.blur(); } catch (_) {}
    });

    startMenu.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); startGameFromMenu(); }
    });

    
    btnStartCredits?.addEventListener('click', (e) => {
      e.preventDefault(); 
      creditsDialog.showModal();
    });


    btnEndCredits?.addEventListener('click', (e) => {
      e.preventDefault(); 
      creditsDialog.showModal();
    });


    btnEndClose?.addEventListener('click', () => {
      clearInterval(tickId);
    });

    creditsDialog?.addEventListener('click', (e) => {
      if (e.target === creditsDialog) creditsDialog.close();
    });
  });
})();
