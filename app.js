const state = {
  dailyWord: '',
  theme: 'animais',
  guesses: [],
  currentGuess: '',
  currentRow: 0,
  maxGuesses: 6,
  wordLength: 5,
  gameOver: false,
  completedToday: false,
  todayKey: getTodayKey(),
  stats: loadStats(),
  allowedWords: new Set([
    'cachorro', 'gato', 'panda', 'leao', 'peixe', 'urso', 'zebra', 'foca', 'tigre', 'lobo',
    'pizza', 'bolo', 'sopa', 'cafe', 'fruta', 'pao', 'maca', 'pasta', 'torta', 'salada',
    'atomo', 'celula', 'planeta', 'vento', 'luz', 'rocha', 'terra', 'fogo', 'estrela', 'energia',
    'futebol', 'tenis', 'basquete', 'nado', 'golfe', 'vitoria', 'passe', 'treino', 'rede', 'ponto'
  ])
};

const themes = {
  animais: {
    label: 'Animais',
    emoji: '🐾',
    words: ['cachorro', 'gato', 'panda', 'leao', 'peixe', 'urso', 'zebra', 'tigre', 'lobo', 'foca']
  },
  comida: {
    label: 'Comida',
    emoji: '🍽️',
    words: ['pizza', 'bolo', 'sopa', 'cafe', 'fruta', 'pao', 'maca', 'pasta', 'torta', 'salada']
  },
  ciencia: {
    label: 'Ciência',
    emoji: '🔬',
    words: ['atomo', 'celula', 'planeta', 'vento', 'luz', 'rocha', 'terra', 'fogo', 'estrela', 'energia']
  },
  esportes: {
    label: 'Esportes',
    emoji: '🏀',
    words: ['futebol', 'tenis', 'basquete', 'nado', 'golfe', 'passe', 'treino', 'rede', 'ponto', 'vitoria']
  }
};

const boardEl = document.getElementById('board');
const keyboardEl = document.getElementById('keyboard');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultModal = document.getElementById('resultModal');
const themeLabel = document.getElementById('themeLabel');
const wordLengthEl = document.getElementById('wordLength');
const attemptCounterEl = document.getElementById('attemptCounter');
const messageEl = document.getElementById('message');
const resultTitleEl = document.getElementById('resultTitle');
const resultTextEl = document.getElementById('resultText');
const streakValueEl = document.getElementById('streakValue');
const bestStreakValueEl = document.getElementById('bestStreakValue');
const winsValueEl = document.getElementById('winsValue');
const gamesValueEl = document.getElementById('gamesValue');
const lastWordValueEl = document.getElementById('lastWordValue');
const winRateValueEl = document.getElementById('winRateValue');
const themePreviewEl = document.getElementById('themePreview');
const statsPanel = document.getElementById('statsPanel');

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function init() {
  const key = state.todayKey;
  const dayNumber = Math.abs(hashCode(key));
  const categoryKeys = Object.keys(themes);
  const themeKey = categoryKeys[dayNumber % categoryKeys.length];
  state.theme = themeKey;
  state.dailyWord = pickWordForDay(themeKey, key);
  state.wordLength = state.dailyWord.length;

  themePreviewEl.textContent = themes[themeKey].label;
  themeLabel.textContent = themes[themeKey].label;
  wordLengthEl.textContent = String(state.wordLength);
  updateStats();
  bindEvents();
  restoreSessionForToday();
  renderBoard();
  renderKeyboard();
  showScreen('start');
}

function hashCode(value) {
  return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function pickWordForDay(themeKey, dateKey) {
  const words = themes[themeKey].words;
  const slice = Array.from(dateKey).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return words[slice % words.length];
}

function bindEvents() {
  document.getElementById('startButton').addEventListener('click', () => {
    showScreen('game');
  });

  document.getElementById('homeButton').addEventListener('click', () => {
    showScreen('start');
  });

  document.getElementById('statusButton').addEventListener('click', () => {
    statsPanel.classList.toggle('hidden');
  });

  document.getElementById('playAgainButton').addEventListener('click', () => {
    if (state.completedToday) {
      showScreen('start');
    } else {
      resetGame();
      showScreen('game');
    }
    resultModal.classList.add('hidden');
  });

  document.getElementById('shareButton').addEventListener('click', async () => {
    const used = Math.max(state.currentRow, 1);
    const summary = `Palavra do Dia • ${themes[state.theme].label}\n\n` +
      `Usei ${used} tentativa(s) e ${state.gameOver && state.dailyWord ? 'consegui!' : 'continuei tentando!'}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Palavra do Dia', text: summary });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        messageEl.textContent = 'Resultado copiado!';
      }
    } catch (error) {
      messageEl.textContent = 'Não foi possível compartilhar agora.';
    }
  });

  document.addEventListener('keydown', handleKeydown);
}

function showScreen(name) {
  startScreen.classList.toggle('active', name === 'start');
  gameScreen.classList.toggle('active', name === 'game');
}

function resetGame() {
  const saved = readDailySession();
  state.guesses = saved.guesses || [];
  state.currentGuess = '';
  state.currentRow = saved.guesses ? saved.guesses.filter(Boolean).length : 0;
  state.gameOver = saved.completed;
  state.completedToday = saved.completed;
  messageEl.textContent = saved.completed
    ? 'Você já concluiu o desafio de hoje.'
    : 'Faça sua primeira tentativa.';
  renderBoard();
  renderKeyboard();
}

function restoreSessionForToday() {
  const saved = readDailySession();
  if (!saved || !saved.date || saved.date !== state.todayKey) {
    state.guesses = [];
    state.currentGuess = '';
    state.currentRow = 0;
    state.gameOver = false;
    state.completedToday = false;
    saveDailySession();
    return;
  }

  state.guesses = saved.guesses || [];
  state.currentGuess = '';
  state.currentRow = saved.guesses ? saved.guesses.filter(Boolean).length : 0;
  state.gameOver = Boolean(saved.completed);
  state.completedToday = Boolean(saved.completed);

  if (state.gameOver) {
    messageEl.textContent = 'Você já concluiu o desafio de hoje.';
  }
}

function readDailySession() {
  const raw = localStorage.getItem(`palavra-do-dia-session-${state.todayKey}`);
  if (!raw) return { date: state.todayKey, guesses: [], completed: false };

  try {
    return JSON.parse(raw);
  } catch (error) {
    return { date: state.todayKey, guesses: [], completed: false };
  }
}

function saveDailySession() {
  const payload = {
    date: state.todayKey,
    guesses: state.guesses,
    completed: state.completedToday
  };
  localStorage.setItem(`palavra-do-dia-session-${state.todayKey}`, JSON.stringify(payload));
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < state.maxGuesses; row += 1) {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';

    for (let col = 0; col < state.wordLength; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const guess = state.guesses[row];
      const letter = guess ? guess[col] : '';

      if (letter) {
        cell.textContent = letter;
        cell.classList.add('filled');
      }

      if (guess) {
        const result = evaluateGuess(guess, state.dailyWord);
        cell.classList.add(result[col]);
      }

      rowEl.appendChild(cell);
    }

    boardEl.appendChild(rowEl);
  }

  attemptCounterEl.textContent = `${state.currentRow}/${state.maxGuesses}`;
}

function renderKeyboard() {
  keyboardEl.innerHTML = '';
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  rows.forEach((row) => {
    for (const char of row) {
      const button = document.createElement('button');
      button.className = 'key';
      button.textContent = char;
      button.type = 'button';
      button.setAttribute('aria-label', `Letra ${char}`);
      const status = getKeyStatus(char);
      if (status) button.classList.add(status);
      button.addEventListener('click', () => handleInput(char));
      keyboardEl.appendChild(button);
    }
  });

  const deleteButton = document.createElement('button');
  deleteButton.className = 'key';
  deleteButton.textContent = '⌫';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', 'Apagar letra');
  deleteButton.addEventListener('click', () => handleInput('Backspace'));
  keyboardEl.appendChild(deleteButton);

  const enterButton = document.createElement('button');
  enterButton.className = 'key';
  enterButton.textContent = 'Enter';
  enterButton.type = 'button';
  enterButton.setAttribute('aria-label', 'Enviar tentativa');
  enterButton.addEventListener('click', () => handleInput('Enter'));
  keyboardEl.appendChild(enterButton);
}

function handleKeydown(event) {
  if (state.gameOver) return;
  const { key } = event;
  if (/^[a-z]$/i.test(key)) {
    handleInput(key.toLowerCase());
  } else if (key === 'Backspace') {
    handleInput('Backspace');
  } else if (key === 'Enter') {
    handleInput('Enter');
  }
}

function handleInput(value) {
  if (state.gameOver) return;

  if (value === 'Backspace') {
    state.currentGuess = state.currentGuess.slice(0, -1);
    renderBoard();
    return;
  }

  if (value === 'Enter') {
    submitGuess();
    return;
  }

  if (state.currentGuess.length >= state.wordLength) return;
  state.currentGuess += value.toLowerCase();
  renderBoard();
}

function submitGuess() {
  if (state.currentGuess.length !== state.wordLength) {
    messageEl.textContent = `Digite exatamente ${state.wordLength} letras.`;
    return;
  }

  if (state.guesses.includes(state.currentGuess)) {
    messageEl.textContent = 'Você já tentou essa palavra hoje.';
    return;
  }

  if (!state.allowedWords.has(state.currentGuess)) {
    messageEl.textContent = 'Essa palavra não está na lista permitida.';
    return;
  }

  state.guesses[state.currentRow] = state.currentGuess;
  const outcome = evaluateGuess(state.currentGuess, state.dailyWord);
  const isWin = outcome.every((flag) => flag === 'correct');

  state.currentGuess = '';
  state.currentRow += 1;
  state.completedToday = isWin || state.currentRow >= state.maxGuesses;
  saveDailySession();
  renderBoard();
  renderKeyboard();

  if (isWin) {
    finishGame(true);
    return;
  }

  if (state.currentRow >= state.maxGuesses) {
    finishGame(false);
    return;
  }

  messageEl.textContent = `Boa tentativa! Faltam ${state.maxGuesses - state.currentRow} chances.`;
}

function finishGame(isWin) {
  state.gameOver = true;
  state.completedToday = true;
  saveDailySession();

  const totalGames = state.stats.totalGames + 1;
  const wins = isWin ? state.stats.totalWins + 1 : state.stats.totalWins;

  state.stats.totalGames = totalGames;
  state.stats.totalWins = wins;
  state.stats.lastSolvedWord = isWin ? state.dailyWord : state.stats.lastSolvedWord;
  state.stats.winRate = Math.round((wins / totalGames) * 100);
  state.stats.streak = isWin ? state.stats.streak + 1 : 0;
  state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
  state.stats.lastPlayedDate = state.todayKey;
  saveStats(state.stats);
  updateStats();

  resultTitleEl.textContent = isWin ? 'Você venceu!' : 'Não foi dessa vez!';
  const attemptsUsed = isWin ? state.currentRow : state.maxGuesses;
  resultTextEl.innerHTML = `A palavra era <strong>${state.dailyWord}</strong>.<br>Você usou ${attemptsUsed} tentativa(s).`;
  resultModal.classList.remove('hidden');
  messageEl.textContent = isWin ? 'Excelente! Você resolveu a palavra do dia.' : 'A palavra foi revelada. Tente de novo amanhã.';
}

function evaluateGuess(guess, answer) {
  const result = Array(guess.length).fill('absent');
  const remaining = {};

  for (let i = 0; i < answer.length; i += 1) {
    const ch = answer[i];
    remaining[ch] = (remaining[ch] || 0) + 1;
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
      remaining[guess[i]] -= 1;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      result[i] = 'present';
      remaining[ch] -= 1;
    }
  }

  return result;
}

function getKeyStatus(letter) {
  let bestStatus = null;
  for (const guess of state.guesses) {
    const result = evaluateGuess(guess, state.dailyWord);
    for (let i = 0; i < guess.length; i += 1) {
      if (guess[i] !== letter) continue;
      const score = result[i];
      if (score === 'correct') return 'correct';
      if (score === 'present') bestStatus = 'present';
      if (score === 'absent' && !bestStatus) bestStatus = 'absent';
    }
  }
  return bestStatus;
}

function loadStats() {
  const raw = localStorage.getItem('palavra-do-dia-stats');
  if (!raw) {
    return {
      streak: 0,
      bestStreak: 0,
      totalWins: 0,
      totalGames: 0,
      lastSolvedWord: '',
      winRate: 0,
      lastPlayedDate: ''
    };
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      streak: 0,
      bestStreak: 0,
      totalWins: 0,
      totalGames: 0,
      lastSolvedWord: '',
      winRate: 0,
      lastPlayedDate: ''
    };
  }
}

function saveStats(stats) {
  localStorage.setItem('palavra-do-dia-stats', JSON.stringify(stats));
}

function updateStats() {
  const stats = state.stats;
  streakValueEl.textContent = String(stats.streak || 0);
  bestStreakValueEl.textContent = String(stats.bestStreak || 0);
  winsValueEl.textContent = String(stats.totalWins || 0);
  gamesValueEl.textContent = String(stats.totalGames || 0);
  lastWordValueEl.textContent = stats.lastSolvedWord || '—';
  winRateValueEl.textContent = `${stats.winRate || 0}%`;
}

init();
