const adultToggle = document.querySelector('#adult-toggle');
const deckList = document.querySelector('#deck-list');
const deckTitle = document.querySelector('#deck-title');
const deckDescription = document.querySelector('#deck-description');
const themePill = document.querySelector('#theme-pill');
const countPill = document.querySelector('#count-pill');
const cardType = document.querySelector('#card-type');
const cardPrompt = document.querySelector('#card-prompt');
const cardBadge = document.querySelector('#card-badge');
const nextCardButton = document.querySelector('#next-card');

const state = {
  decks: [],
  themes: {},
  showAdult: localStorage.getItem('cardie-show-adult') === 'true',
  activeDeckId: null,
  activeCard: null,
};

adultToggle.checked = state.showAdult;

adultToggle.addEventListener('change', () => {
  state.showAdult = adultToggle.checked;
  localStorage.setItem('cardie-show-adult', String(state.showAdult));
  ensureActiveDeck();
  render();
});

nextCardButton.addEventListener('click', () => {
  state.activeCard = pickCard(getActiveDeck());
  renderCard();
});

init().catch(() => {
  deckTitle.textContent = 'Unable to load decks';
  deckDescription.textContent = 'Check that the JSON files are available and valid.';
  nextCardButton.disabled = true;
});

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
  const card = state.activeCard ?? pickCard(activeDeck);

  if (!card) {
    cardType.textContent = 'Waiting';
    cardPrompt.textContent = 'Pick a deck to start playing.';
    cardBadge.textContent = 'No card selected';
    return;
  }

  state.activeCard = card;
  cardType.textContent = card.type.replace(/-/g, ' ');
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
