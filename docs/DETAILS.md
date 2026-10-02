# Restaurant World

**Stav: hratelná první verze.** Průběžná 3D restaurace s ovládanou postavou pro desktop i mobil. Samostatná hra používá obecnou simulaci [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) a základní nástroje RestaurantCommon.

Hráč přijímá objednávky stolů, rezervuje a nakupuje suroviny, připravuje jídlo i nápoj, obsluhuje hosty, vybírá účet a myje použité nádobí. Úkol v dolní části obrazovky pomáhá s ručním postupem. Pohyb: WASD/šipky, mobilní joystick nebo klepnutí na označený cíl. Mobilní značky spojují linky se skutečnou polohou vybavení.

Inkasování a sběr nádobí proběhnou současně při jedné návštěvě stolu, pokud je na tácu místo. Plný tác neblokuje platbu: účet se zaplatí právě jednou a nádobí počká na pozdější sběr. Přijatou částku ukazuje oznámení. Navádění upřednostňuje účty a úklid před čekáním na dojedání jiného hosta; hotové jídlo na výdejní polici vede hráče k výdeji.

- Čtyři kuchyně: evropské bistro, americký diner, wok a indické bistro; každá má tři jídla a dva nápoje.
- Dvanáct fyzických rozšíření, nabídka dvou možností; při posledním rozšíření doplňuje nabídku placený trénink pohybu.
- Pět ručně najímaných a propouštěných profesí, náborový poplatek a mzdy. Propuštění neodstraňuje dluh.
- Devět poboček od nuly se společnou peněženkou, výběrem kuchyně a možností návratu. Otevírací investice zahrnuje základní vybavení a zásoby.
- Dodávky a sklad mají skutečnou kapacitu; nouzové suroviny na dluh hráč výslovně objednává. Nejde o bezplatný doplněk zásob.
- Ukládání, import/export a instalovatelná PWA. Neaktivní pobočky používají skutečné zásoby a zaměstnance. Výpočet po návratu je omezen na 120 sekund, příjem není neomezený násobič.

## Spuštění

Z této složky: `npm run dev` (port 4176), `npm run build`, `npm run preview` (port 4186). Sdílené vývojové závislosti jsou v RestaurantCommon. `npm test` spouští prohlížečové testy.

Jazyk se vybírá automaticky podle prohlížeče a lze ho změnit v nastavení. Nabízí se všech 20 jazyků rodiny her. Nové texty jsou kompletní česky a anglicky; dalších 18 jazyků má přeložené hlavní provozní a finanční ovládání, zbývající popisy, recepty a nápověda používají anglický fallback. Arabské rozhraní má RTL.

[RESEARCH.md](RESEARCH.md) zachycuje původní rešerši k 1. říjnu 2026. [DESIGN.md](DESIGN.md) uchovává širší návrh: cílových 18 rozšíření, další profese a propracovanější onboarding nejsou tvrzením o aktuálně dodaném rozsahu. Ekonomické hodnoty vyžadují další herní ladění.

Ověření k 1. říjnu 2026: sdílená navigace respektuje fyzické překážky definované v `Content.layout`; prošlo 196 tras mezi cíli i regrese odchodu od stěny. CommonAdvanced má 30 úspěšných testů a RestaurantWorld sedm prohlížečových scénářů včetně ruční obsluhy, plného tácu a offline načtení produkční PWA. Produkční sestavení a společná kontrola TypeScriptu prošly. Testy na fyzických telefonech a Safari zůstávají neověřené.
