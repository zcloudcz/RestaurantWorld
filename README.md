# Restaurant World

Restaurant game with a directly controlled avatar: take table orders, buy ingredients, cook, serve, collect payment and wash dishes. Four cuisines, 12 expansions, 9 branches.

Offline 3D game for browser and mobile (PWA), 20 languages, no ads or in-app purchases. Depends on: RestaurantCommon, CommonAdvanced.

## Running

```bash
npm run dev      # http://localhost:4176
npm run build    # output in dist/
npm run preview
npm test         # browser tests
```

Detailed game description: [docs/DETAILS.md](docs/DETAILS.md)

## Repository family

The games share code through relative paths, so all repositories must be cloned **side by side into one folder** (keep the folder names unchanged):

```bash
for r in RestaurantCommon CommonAdvanced BurgerRush PizzaPiazza GasStation RestaurantWorld; do git clone https://github.com/zcloudcz/$r.git; done
cd RestaurantCommon && npm ci
```

| Repo | Contents |
|---|---|
| [RestaurantCommon](https://github.com/zcloudcz/RestaurantCommon) | shared engine, UI, build tooling and tests |
| [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) | operations simulation used by Restaurant World |
| [BurgerRush](https://github.com/zcloudcz/BurgerRush) · [PizzaPiazza](https://github.com/zcloudcz/PizzaPiazza) · [GasStation](https://github.com/zcloudcz/GasStation) · [RestaurantWorld](https://github.com/zcloudcz/RestaurantWorld) | games |

Stack: TypeScript, Three.js, Vite, Vitest, Playwright. Requires Node.js 22.12+ and a browser with WebGL 2.

## License

[MIT](LICENSE) © 2026 Martin Zahálka
