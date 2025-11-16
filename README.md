# BNR Play Timeline

Een lichte webapp om BNR-programma's als podcast-timeline te bekijken en af te spelen. Geoptimaliseerd om op iOS als webapp aan je beginscherm toe te voegen.

## Installeren en starten
1. Start een simpele server vanuit de projectmap:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in Safari (of een andere browser).

## Homescreen / PWA
- Tik in Safari op de deel-knop en kies **Zet op beginscherm**.
- De webapp heeft een manifest en service worker voor offline caching van de UI en gidsdata.

## Features
- Timeline per dag met chips voor vandaag/gisteren en zoekfilter.
- Tik op een kaart of de **Play**-knop om direct af te spelen in de ingebouwde speler.
- BNR-look & feel met gele accenten en sticky bediening onderin.

## Data aanpassen
De timeline leest `data/episodes.json`. Voeg of wijzig items met velden `title`, `host`, `publishedAt`, `duration`, `description`, `image` en `audioUrl`.
