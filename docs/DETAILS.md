# Restaurant World

**Status: playable first version.** A continuous 3D restaurant with a controllable character for desktop and mobile. The standalone game uses the general simulation [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) and the basic tools of RestaurantCommon.

The player takes table orders, reserves and buys ingredients, prepares food and drinks, serves guests, collects the bill, and washes the used dishes. The task at the bottom of the screen helps with the manual workflow. Movement: WASD/arrow keys, a mobile joystick, or a tap on a marked target. Mobile markers link the lines to the actual location of the equipment.

Collecting payment and clearing dishes happen together in a single visit to a table, if there is room on the tray. A full tray does not block payment: the bill is paid exactly once and the dishes wait for a later pickup. A notification shows the amount received. Guidance prioritizes bills and cleanup over waiting for another guest to finish eating; finished food on the pickup shelf leads the player to the counter.

- Four cuisines: European bistro, American diner, wok, and Indian bistro; each has three dishes and two drinks.
- Twelve physical expansions, an offer of two options; at the last expansion, paid movement training completes the offer.
- Five professions that are hired and fired manually, a hiring fee, and wages. Firing does not remove debt.
- Nine branches built from scratch with a shared wallet, a choice of cuisine, and the option to return. The opening investment includes basic equipment and stock.
- Deliveries and storage have real capacity; the player explicitly orders emergency ingredients on credit. It is not a free stock top-up.
- Saving, import/export, and an installable PWA. Inactive branches use real stock and employees. The catch-up calculation after returning is limited to 120 seconds; income is not an unlimited multiplier.

## Running

From this folder: `npm run dev` (port 4176), `npm run build`, `npm run preview` (port 4186). Shared development dependencies are in RestaurantCommon. `npm test` runs the browser tests.

The language is selected automatically based on the browser and can be changed in the settings. All 20 languages of the game family are offered. The new texts are complete in Czech and English; another 18 languages have the main operational and financial controls translated, and the remaining descriptions, recipes, and help use an English fallback. The Arabic interface is RTL.

[RESEARCH.md](RESEARCH.md) records the original research as of 1 October 2026. [DESIGN.md](DESIGN.md) keeps the broader design: the target of 18 expansions, additional professions, and a more elaborate onboarding are not claims about the currently delivered scope. The economic values require further game tuning.

Validation as of 1 October 2026: the shared navigation respects the physical obstacles defined in `Content.layout`; 196 routes between targets passed, as did the regression for walking away from a wall. CommonAdvanced has 30 passing tests and RestaurantWorld has seven browser scenarios, including manual service, a full tray, and offline loading of the production PWA. The production build and the shared TypeScript check passed. Tests on physical phones and Safari remain unverified.
