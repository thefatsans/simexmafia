# Fix generateId() calls

Alle `generateId()`-Aufrufe müssen mit Parametern aufgerufen werden:
- `generateId(productName, category, platform)`

Die Datei ist zu groß, um alle manuell zu korrigieren. Bitte führe folgende Ersetzungen durch:

1. Für DLCs: `generateId(dlc.name, 'dlc', dlc.platform)`
2. Für Gift Cards: `generateId(name, 'gift-cards', platform)`
3. Für Subscriptions: `generateId(option.name, 'subscriptions', platform)`
4. Für Games: `generateId(game.name, 'games', game.platform)`
5. Für Currency: `generateId(item.name, 'in-game-currency', item.platform)`

