const state = {
  decks: [],
  themes: {},
  showAdult: readStoredAdultPreference(),
  activeDeckId: null,
  activeCard: null,
  initFailed: false,
};

let adultToggle;
let deckList;
let deckTitle;
let deckDescription;
let themePill;
let countPill;
let cardType;
let cardPrompt;
let cardBadge;
let nextCardButton;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  adultToggle = document.querySelector('#adult-toggle');
  deckList = document.querySelector('#deck-list');
  deckTitle = document.querySelector('#deck-title');
  deckDescription = document.querySelector('#deck-description');
  themePill = document.querySelector('#theme-pill');
  countPill = document.querySelector('#count-pill');
  cardType = document.querySelector('#card-type');
  cardPrompt = document.querySelector('#card-prompt');
  cardBadge = document.querySelector('#card-badge');
  nextCardButton = document.querySelector('#next-card');

  if (
    !adultToggle ||
    !deckList ||
    !deckTitle ||
    !deckDescription ||
    !themePill ||
    !countPill ||
    !cardType ||
    !cardPrompt ||
    !cardBadge ||
    !nextCardButton
  ) {
    return;
  }

  adultToggle.checked = state.showAdult;

  adultToggle.addEventListener('change', () => {
    if (state.initFailed) {
      adultToggle.checked = false;
      return;
    }

    state.showAdult = adultToggle.checked;
    writeStoredAdultPreference(state.showAdult);
    ensureActiveDeck();
    render();
  });

  nextCardButton.addEventListener('click', () => {
    state.activeCard = pickCard(getActiveDeck());
    renderCard();
  });

  init().catch(() => {
    state.initFailed = true;
    adultToggle.checked = false;
    adultToggle.disabled = true;
    deckList.innerHTML = '';
    deckTitle.textContent = 'Unable to load decks';
    deckDescription.textContent = 'Check that the JSON files are available and valid.';
    cardType.textContent = 'Error';
    cardPrompt.textContent = 'Cardie could not load its deck data.';
    cardBadge.textContent = 'Load failed';
    nextCardButton.disabled = true;
  });
}

async function init() {
  const [deckResponse, themeResponse] = await Promise.all([
    fetch('./data/decks.json'),
    fetch('./data/themes.json'),
  ]);

  if (!deckResponse.ok || !themeResponse.ok) {
    throw new Error('Unable to load deck data.');
  }

  const deckData = await deckResponse.json();
  const themeData = await themeResponse.json();

  state.decks = deckData.decks;
  state.themes = Object.fromEntries(themeData.themes.map((theme) => [theme.id, theme]));

  ensureActiveDeck();
  render();
}

function getVisibleDecks() {
  return state.decks
    .map((deck) => ({
      ...deck,
      visibleCards: deck.cards.filter((card) => state.showAdult || !card.adult),
    }))
    .filter((deck) => deck.visibleCards.length > 0);
}

function ensureActiveDeck() {
  const visibleDecks = getVisibleDecks();
  const activeStillVisible = visibleDecks.some((deck) => deck.id === state.activeDeckId);

  if (!activeStillVisible) {
    state.activeDeckId = visibleDecks[0]?.id ?? null;
  }

  state.activeCard = pickCard(getActiveDeck());
}

function getActiveDeck() {
  return getVisibleDecks().find((deck) => deck.id === state.activeDeckId) ?? null;
}

function pickCard(deck) {
  if (!deck?.visibleCards?.length) {
    return null;
  }

  const index = Math.floor(Math.random() * deck.visibleCards.length);
  return deck.visibleCards[index];
}

function render() {
  const visibleDecks = getVisibleDecks();

  deckList.innerHTML = '';

  visibleDecks.forEach((deck) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const title = document.createElement('span');
    const count = document.createElement('small');

    button.type = 'button';
    button.className = `deck-button${deck.id === state.activeDeckId ? ' active' : ''}`;
    title.textContent = deck.title;
    count.textContent = `${deck.visibleCards.length} cards`;
    button.append(title, count);
    button.addEventListener('click', () => {
      state.activeDeckId = deck.id;
      state.activeCard = pickCard(getActiveDeck());
      render();
    });
    item.appendChild(button);
    deckList.appendChild(item);
  });

  const activeDeck = getActiveDeck();
  applyTheme(activeDeck ? state.themes[activeDeck.theme] : null);

  if (!activeDeck) {
    deckTitle.textContent = 'No decks available';
    deckDescription.textContent = 'Turn on adult cards or add new prompts in data/decks.json.';
    themePill.textContent = 'Theme unavailable';
    countPill.textContent = '0 cards';
    cardType.textContent = 'Waiting';
    cardPrompt.textContent = 'There are no prompts to show right now.';
    cardBadge.textContent = 'Hidden by filter';
    nextCardButton.disabled = true;
    return;
  }

  deckTitle.textContent = activeDeck.title;
  deckDescription.textContent = activeDeck.description;
  themePill.textContent = state.themes[activeDeck.theme]?.name ?? activeDeck.theme;
  countPill.textContent = `${activeDeck.visibleCards.length} cards`;
  nextCardButton.disabled = false;
  renderCard();
}

function renderCard() {
  const activeDeck = getActiveDeck();
  const card =
    activeDeck?.visibleCards?.some((visibleCard) => visibleCard.id === state.activeCard?.id)
      ? state.activeCard
      : pickCard(activeDeck);

  if (!card) {
    cardType.textContent = 'Waiting';
    cardPrompt.textContent = 'Pick a deck to start playing.';
    cardBadge.textContent = 'No card selected';
    return;
  }

  state.activeCard = card;
  cardType.textContent = formatCardType(card.type);
  cardPrompt.textContent = card.prompt;
  cardBadge.textContent = card.adult ? 'Adult couples only' : 'All audiences';
}

function applyTheme(theme) {
  const root = document.documentElement;
  const palette = theme?.colors ?? {
    bg: '#120912',
    glow: 'rgba(255, 94, 182, 0.28)',
    panel: 'rgba(35, 16, 33, 0.84)',
    strong: 'rgba(51, 23, 46, 0.96)',
    text: '#fff6fb',
    muted: '#d8bed0',
    accent: '#ff62bd',
    accentSoft: '#ffb2da',
  };

  root.style.setProperty('--bg', palette.bg);
  root.style.setProperty('--bg-glow', palette.glow);
  root.style.setProperty('--panel', palette.panel);
  root.style.setProperty('--panel-strong', palette.strong);
  root.style.setProperty('--text', palette.text);
  root.style.setProperty('--muted', palette.muted);
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--accent-soft', palette.accentSoft);
}

function formatCardType(type) {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function readStoredAdultPreference() {
  try {
    return localStorage.getItem('cardie-show-adult') === 'true';
  } catch {
    return false;
  }
}

function writeStoredAdultPreference(value) {
  try {
    localStorage.setItem('cardie-show-adult', String(value));
  } catch {
    return;
  }
}
