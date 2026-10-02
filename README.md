# Restaurant World

Restaurace s plně ovládanou postavou: objednávky u stolů, nákup surovin, vaření, obsluha, placení a mytí nádobí. Čtyři kuchyně, 12 rozšíření, 9 poboček.

Offline 3D hra pro prohlížeč a mobil (PWA), 20 jazyků, bez reklam a nákupů. Závisí na: RestaurantCommon, CommonAdvanced.

## Spuštění

```bash
npm run dev      # http://localhost:4176
npm run build    # výstup v dist/
npm run preview
npm test         # prohlížečové testy
```

Podrobný popis hry: [docs/DETAILS.md](docs/DETAILS.md)

## Rodina repozitářů

Hry sdílí kód přes relativní cesty, proto se všechny repozitáře klonují **vedle sebe do jedné složky** (názvy složek musí zůstat stejné):

```bash
for r in RestaurantCommon CommonAdvanced BurgerRush PizzaPiazza GasStation RestaurantWorld; do git clone https://github.com/zcloudcz/$r.git; done
cd RestaurantCommon && npm ci
```

| Repo | Obsah |
|---|---|
| [RestaurantCommon](https://github.com/zcloudcz/RestaurantCommon) | sdílený engine, UI, build a testy |
| [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) | provozní simulace pro RestaurantWorld |
| [BurgerRush](https://github.com/zcloudcz/BurgerRush) · [PizzaPiazza](https://github.com/zcloudcz/PizzaPiazza) · [GasStation](https://github.com/zcloudcz/GasStation) · [RestaurantWorld](https://github.com/zcloudcz/RestaurantWorld) | hry |

Stack: TypeScript, Three.js, Vite, Vitest, Playwright. Node.js 22.12+, prohlížeč s WebGL 2.
