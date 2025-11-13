(function () {
  const DEFAULT_TIME_MS = 3 * 60 * 1000; // 3 minutes
  const Stats = { virtue: 0, wisdom: 0, courage: 0, compassion: 0, humility: 0 };

  const State = {
    timerMs: DEFAULT_TIME_MS,
    score: 0,
    streak: 0,
    deck: [],
    current: null,
    stats: { ...Stats },
    power: { consults: 1, pities: 1 },
    penaltyMs: 5000,
    opts: { sound: true, tips: true, difficulty: 'normal' }
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildDeck(deckSize) {
    const result = [];
    while (result.length < deckSize) {
      result.push(...shuffle(SOULS.slice()));
    }
    return result.slice(0, deckSize);
  }

  function initiateGame(deckSize = 25) {
    State.timerMs = DEFAULT_TIME_MS;
    State.score = 0;
    State.streak = 0;
    State.stats = { ...Stats };
    State.power = { consults: 1, pities: 1 };

    State.deck = buildDeck(deckSize);
    State.current = State.deck.shift() || null;
  }

  function drawSoul() {
    State.current = State.deck.shift() || null;
  }

  function assign(circleId) {
    if (!State.current) return;
    const correct = (State.current.circle === circleId);

    if (correct) {
      State.score += 100 + 10 * State.streak;
      State.streak += 1;
      State.stats.wisdom += 3;
      State.stats.virtue += 3;

      if (State.streak % 5 === 0) {
        State.stats.courage += 3;
      }
    } else {
      State.streak = 0;
      State.stats.wisdom -= 3;
      State.timerMs = Math.max(0, State.timerMs - State.penaltyMs);
    }
    drawSoul();
  }

  function useConsult() {
    if (State.power.consults <= 0 || !State.current) return null;

    State.power.consults -= 1;
    State.timerMs = Math.max(0, State.timerMs - 10_000);
    State.stats.humility += 1;
    State.stats.wisdom += 1;

    return State.current.circle;
  }

  function usePity() {
    if (State.power.pities <= 0 || !State.current) return null;

    State.power.pities -= 1;
    State.stats.compassion += 1;
    State.stats.wisdom -= 1;
    drawSoul();
  }

  function isOver() {
    return State.timerMs <= 0 || !State.current;
  }

  function pickEnding(arg) {
    const stat = (arg && arg.stats) ? arg.stats : State.stats;

    const { virtue = 0, wisdom = 0, courage = 0, compassion = 0, humility = 0 } = stat;
    const total = virtue + wisdom + courage + compassion + humility;

    if (total < 5) return 'Failure';
    if (compassion + humility >= Math.max(virtue, wisdom, courage)) return 'Merciful';
    if (virtue + courage >= Math.max(compassion, wisdom, humility)) return 'Judicial';
    return 'Success';
  }

  window.GameState = { State, initiateGame, assign, useConsult, usePity, isOver, pickEnding };
})();
