# Cardie

Cardie is a static GitHub Pages site for couples card games driven by JSON decks and JSON themes.

## JSON format

Add decks in `data/decks.json` using this shape:

```json
{
  "version": 1,
  "decks": [
    {
      "id": "unique-id",
      "title": "Deck title",
      "description": "Short summary",
      "theme": "theme-id",
      "cards": [
        {
          "id": "card-id",
          "type": "truth",
          "prompt": "Card text",
          "adult": false
        }
      ]
    }
  ]
}
```

Themes live in `data/themes.json` and map the deck `theme` value to a color palette.

## Features

- Sleek single-page couples card experience
- Truth-or-dare and would-you-rather style prompts
- Adult-content toggle with local preference saving
- GitHub Actions workflow for GitHub Pages deployment
