# Restaurant World — herní a technický návrh

**Původní návrh a další směr, 1. října 2026.** Nyní existuje hratelná implementace; aktuální rozsah uvádí [README](../README.md). Dodáno: čtyři kuchyně, dvacet receptů, ruční objednávkový a nádobový cyklus, pět profesí, dvanáct fyzických rozšíření a devět poboček. Cílových osmnáct rozšíření a další návrhy níže zůstávají plánem. Offline simulace je omezena na 120 sekund a spotřebovává skutečné zásoby; překlady nového obsahu mimo češtinu a angličtinu mají anglický fallback. Balanc není konečný. Východiska uvádí [RESEARCH.md](RESEARCH.md).

## Záměr a potvrzené zadání

Jednohráčová 3D provozní arkáda s řízením restaurace pro prohlížeč a mobil. Hráč ovládá postavu, připravuje konkrétní objednávky a postupně deleguje práci. Řídí zásoby, menu, zaměstnance a pobočky. Každá provozní činnost musí zůstat vykonatelná ručně i po propuštění celého týmu.

Uživatel potvrdil **průběžný provoz s avatarem**, blízký Burger Rush, a **samostatný projekt CommonAdvanced** pro pokročilé systémy využitelné i v dalších hrách. Název, recepty, ceny a číselné limity zůstávají pracovní návrh.

Aktivní nabídka obsahuje 3–5 hlavních jídel a 2 nápoje. Větší katalog receptů může existovat jako výběr pro menu. Úkolem je zvládat několik srozumitelných výrobních postupů, nikoli sledovat desítky současných receptů.

## Základní provozní smyčka

1. Host přijde a dostane volný, čistý stůl.
2. Hráč nebo číšník převezme objednávku. Vznikne lístek s ID stolu, hosta a jednotlivých položek.
3. Systém atomicky rezervuje dostupné suroviny. Jiné objednávky nemohou použít stejnou zásobu.
4. Vzniknou navazující úkoly: například oloupat brambory, péct kuře a připravit limonádu. Nezávislé kroky běží souběžně.
5. Hotové složky se sestaví na čistý talíř; nápoj zůstává samostatnou položkou objednávky.
6. Hráč nebo obsluha dopraví správné jídlo a nápoj ke správnému stolu. Lístek ukazuje zbývající položky.
7. Host jí a pije, potom požádá o účet. Úhrada má jedinečné ID a může se zaúčtovat právě jednou.
8. Po odchodu zůstane použité nádobí. Jeho odnesení a úklid uvolní stůl.
9. Špinavé nádobí projde dřezem a vrátí se mezi čisté talíře pro další objednávky.

Navržené stavy lístku: čeká na převzetí → přijatý → připravuje se → částečně/hotově vydaný → konzumace → účet → zaplaceno → uzavřený. Zrušení je samostatná operace s vypořádáním rezervací, nikoli prosté smazání záznamu.

### Příklad jednoho talíře

Porce pečeného kuřete s bramborami rezervuje 1 porci kuřete a 2 jednotky brambor. Přípravný stůl změní brambory na oloupanou dávku; trouba upeče maso a přílohu podle definice receptu. Kompletace potřebuje oba hotové výstupy a 1 čistý talíř. Hráč přinese talíř i limonádu na jednom tácu. Po konzumaci odnese talíř ke dřezu. Množství a délky kroků jsou ukázková data pro prototyp.

## Ovládání a čitelnost

WASD/šipky, virtuální joystick a klepnutí na stanici, stůl nebo lístek určují pohyb a úkol. Dosah interakce se měří od celého přístupného půdorysu stanice, nikoli od jediného bodu před ní. Při více možných akcích dostane přednost zvolený lístek; krátká kontextová volba řeší zbytek bez dlouhého přepínání menu.

Tác může nést jídlo i nápoj se společnou kapacitou. Špinavé nádobí se veze odděleně od jídla a nápojů. UI před cestou ukáže kapacitu, cíl a blokující důvod: chybí surovina, čistý talíř, volná stanice nebo hotová součást. Barva doplňuje ikonu a text, nenese informaci sama.

Každé rozšíření musí být viditelné a použitelné: nová plocha, stoly, přípravná místa, trouba, nápojový pult, sklad či dřez. Pozdější personální kapacita se projeví například šatnou. Samotný procentní bonus bez viditelné změny nestačí. Osmnáct fyzických rozšíření na pobočku je cíl plné verze, nikoli validovaný seznam nákupů.

## Zásoby, nákup a nádobí

Sklad eviduje jednotlivé suroviny, dostupné a rezervované množství, rozpracované dávky, hotové položky a objednané dodávky. Prototyp používá jednotky porcí místo nepřehledných gramů. Každý recept má přesný kusovník a jednotlivé kroky určují převod vstupů na výstupy.

Nákup nejprve zobrazí nabídku s množstvím, cenou a dobou dodání. Potvrzení odečte cenu jednou a vytvoří jedinečnou objednávku dodávky. Po doručení skladník nebo hráč přenese bedny do skladu; dodávka se nesmí připsat podruhé po obnovení hry. Sklad má kapacitu a dodávka se při zaplnění bezpečně drží ve vykládací zóně. Zdroje nejsou nekonečné bezplatné generátory surovin.

Chybějící suroviny vypnou nové objednávky příslušného jídla. Již přijaté lístky nabídnou doplnění zásob nebo řízené zrušení s vysvětlením. Uvolnění rezervace, případná refundace a změna lístku proběhnou atomicky. Nezpracované suroviny lze vrátit do dostupných zásob; již spotřebované maso se zrušením objednávky neobnoví. Hotová nepoužitá porce se eviduje jako zbytek nebo odpad podle zvoleného pravidla.

Talíře mají skutečný omezený fond. Každý je právě v jednom stavu: čistý ve skladu, rezervovaný pro kompletaci, s jídlem, u hosta, špinavý na stole/tácu nebo ve dřezu. Mytí nevytváří nové talíře. Prototyp může abstrahovat sklenice; není nutné současně zavádět druhý celý systém nádobí.

### Obnova provozu bez slepé uličky

Nulový počet čistých talířů je řešitelný ručním mytím. Propuštění zaměstnance nezamkne jeho stanici. Vyprodané menu zastaví přijímání nedosažitelných objednávek. Pro případ kombinace prázdné pokladny a skladu musí prototyp obsahovat omezenou, viditelně evidovanou nouzovou dodávku na úvěr; její cenu odečítá z budoucích příjmů. Nejde o bezplatné suroviny ani opakovatelný zdroj peněz. Mez a splácení jsou předmětem ladění.

## Personál: rozhodnutí hráče

Rozšíření odemyká místo pro zaměstnance; nikoho automaticky nenajímá. Obrazovka týmu ukazuje roli, mzdu za minutu práce, počet volných míst a dopad na rozpočet. Hráč výslovně najme či propustí konkrétního člověka se stabilním ID.

| Role | Odpovědnost |
| --- | --- |
| Přípravář | Loupání, krájení a příprava dávek. |
| Kuchař | Tepelná úprava a kompletace jídel. |
| Číšník | Převzetí objednávky, roznos, účty a odnos nádobí. |
| Barman | Příprava a výdej nápojů. |
| Myč nádobí | Dřez a doplňování čistých talířů. |
| Skladník | Vyložení dodávky a doplňování pracovních zásob. |
| Vedoucí, později | Prioritizace provozu a řízené automatické zásobování. |

Prototyp používá kuchaře, číšníka, barmana a myče. Přípravu a zásobování v něm zastane hráč nebo širší kompetence kuchaře; samostatné role přijdou až s ověřeným provozem.

Mzdy nabíhají za skutečně odpracovaný simulační čas z jedné společné pokladny. Když hotovost nestačí, eviduje se dluh; pracovníci mohou pokračovat na úvěr, aby se provoz nezablokoval. Všechny peněžní operace respektují splatné závazky. Propuštění zastaví další nabíhání mzdy, ale **nesmaže dlužnou mzdu**.

Při propuštění se držené předměty přesunou do určené dostupné odkládací zóny nebo skladu, rezervace úkolů se uvolní a rozpracovaná výroba zůstane na stanici. Pokud není bezpečné místo, propuštění doběhne po bezpečném odložení. Žádný předmět ani objednávka nesmějí zmizet nebo se zdvojit.

## Kuchyňské koncepty

Jde o konkrétní pracovní koncepty restaurací, nikoli úplné reprezentace kontinentů. Jídla mají odlišné výrobní postupy, nádobí, zařízení a vizuální podobu. Dekor samotný nestačí.

| Koncept | Příklady nabídky | Nápoje | Provozní rozdíl |
| --- | --- | --- | --- |
| Americký diner | Steak z grilu s bramborami; kuřecí talíř; zeleninový talíř | Limonáda, milkshake | Gril, příprava brambor, mixér; talíře a vysoké sklenice. |
| Evropské bistro | Pečené kuře s bramborami; zeleninová polévka; salát | Káva, limonáda | Trouba, přípravný stůl, hrnec, kávovar; pečení a studená kuchyně. |
| Východoasijské wok bistro | Kuřecí nebo zeleninový wok s rýží či nudlemi | Čaj, studený čaj | Wok, krájení, vařič rýže a nudlí; misky a rychlá kompletace. |
| Indické regionální bistro | Kuřecí či zeleninové kari, dal, rýže a naan | Chai, lassi | Kari hrnec, rýže, pečení placky, mixér; konkrétní regionální zaměření upřesnit při tvorbě obsahu. |

Varianta přílohy je součást definice objednávky, nikoli důvod vyrábět každou kombinaci jako samostatný globální stav hry. Každá pobočka vybírá několik jídel z odemčeného katalogu svého konceptu.

## Síť a ekonomika

Cílem je devět poboček: tři městské, tři v rámci země a tři světové. Nová pobočka začíná od úrovně 0 s minimálním počátečním vybavením, zásobou a bez najatého týmu. Tento startovní balíček je započtený do investice na otevření; nejde o bezplatnou hotovost ani opakovatelnou odměnu za návštěvu. Zůstatek společné pokladny po zaplacení otevření zůstává hráči. Již vybudované pobočky lze znovu navštívit.

**Lokace není kuchyně.** Styl je samostatná datová volba nebo odemčení. Pobočka v určitém městě nemá automaticky předepsanou jedinou kuchyni. Náklady otevření a podmínky postupu se naladí pro tuto ekonomiku; ceny současného Burger Rush se nemají převzít bez ověření.

Neaktivní podnik poskytuje konzervativně omezený odhad čistého příjmu. Musí respektovat najaté pracovníky, kapacitu zařízení a skladu, dostupné suroviny a náklady na jejich skutečně účtované doplňování. Bez surovin nebo schváleného rozpočtu automatického nákupu provoz zpomalí či skončí. Nelze prostě násobit hrubé tržby úrovní pobočky. Návštěva pobočky nesmí znovu vyplatit již započtenou dobu.

Offline výpočet má časový i zásobový limit, nesmí účtovat neomezené mzdy za dlouhou nepřítomnost a nemá trestat hráče záporným offline výsledkem. Jakmile by simulovaný provoz přestal být krytý, pobočka pozastaví další práci. Přesný model vyžaduje prototyp a testy; nejde o slib garantovaného zisku.

### Příklad pro ladění, ne finální ceny

Za stejné účetní období: **1 000 $ tržby − 300 $ spotřebované suroviny − 220 $ mzdy − 80 $ provoz = 400 $ zisk**. Čísla jsou pouze cílovým příkladem struktury, nikoli naměřeným výkonem.

Hotovost a výsledek hospodaření se liší. Při potvrzení dodávky se peníze strhnou jednou. Náklad spotřebovaných surovin (COGS) se při vaření použije jen do analytického přehledu; **nesmí se znovu odečíst z pokladny**. Nákup zásoby do budoucna tak může způsobit nižší hotovostní tok než vykázaný zisk. Zrušení a refundace mají vlastní ID a atomicky vypořádají peníze i rezervace.

## Technický základ a hranice Common

Návrh vychází z aktuálních souborů RestaurantCommon, nikoli z předpokladu, že stačí přidat další definici hry:

| Soubor / současný stav | Důsledek |
| --- | --- |
| `src/game/types.ts`: `GameId` je pizza/burger; `Item` je raw/prep/meal/fries/trash | Objednaná jídla, nápoje, suroviny a talíře potřebují vlastní doménu. |
| `StationState` obsahuje počty input/output/fries | Chybí identita dávky, receptový postup a rezervace konkrétního lístku. |
| `GameState.recipe` je globální volba receptu | Nestačí pro souběžné různé objednávky. |
| `src/game/customers.ts` účtuje před přechodem k jídlu | Nová hra má jiný cyklus usazení, objednávky, obsluhy a placení. |
| `src/game/staff.ts`: `staffPlan(level)` automaticky vytváří role | Nové najímání musí pracovat s rozhodnutím hráče a smlouvami. |
| `src/career.ts` a `src/save.ts` používají existující `GameState` | Síť a ukládání nelze bez úpravy zaměnit za obecný restaurační model. |

RestaurantCommon poskytne úzká veřejná rozhraní pro vstupy, lokalizaci, ikony, zvuk, základní renderovací/UI pomocníky a vzor sestavení/PWA. Navigaci lze postupně oddělit od konkrétních stolů a stanic na obecné průchozí plochy a kolize. Původní fastfoodové hry zachovají své typy, automatické personální plány a pravidla. Případné vytažení společné utility je malé, samostatně testované a kompatibilní; nejde o plošný přepis.

Nový **samostatný projekt CommonAdvanced** bude vlastnit obecné objednávky, typované zásoby, datově definované receptové postupy, úkoly, stanice, volitelný oběh vratných předmětů/nádobí, zaměstnávání, mzdy, ekonomiku a adaptér kariéry. Jeho doména nebude záviset na DOM ani Three.js. Z RestaurantCommon smí použít jen úzké veřejné utility a obecné typy; nesmí importovat BurgerRush, PizzaPiazza, GasStation ani RestaurantWorld.

**RestaurantWorld** importuje obě vrstvy a vlastní obsah, menu, styly kuchyní, mapy, grafiku, vstupní bod a specifické UI. CommonAdvanced neobsahuje americké/evropské přepínače ani konkrétní jídla: kroky a vstupy určují data. Oběh nádobí hra zapne jako schopnost; jiná budoucí hra jej může vynechat. Nové zaměstnávání je výslovné rozhodnutí hráče a nemění automatické najímání původních her. Detaily rozhraní a závislostí: [CommonAdvanced — architektura](../../CommonAdvanced/docs/ARCHITECTURE.md).

### Data a ukládání

Každý lístek, výrobní dávka, dodávka, zaměstnanec a peněžní operace potřebují stabilní ID. Úkol obsahuje požadované vstupy, závislosti, stav a případného řešitele. Volba řešitele a rezervace zdrojů proběhne atomicky, aby hráč a pracovník nepřevzali stejnou práci.

Nový samostatný klíč bude `restaurant.world.v1`. Tato hra nemigruje pozice Burger/Pizza do svých jiných pravidel. Celá síť, společná hotovost, závazky, inventář a rozpracované objednávky se uloží do jednoho validovaného snapshotu s verzí a časem. Import musí zachovat vazby mezi ID; neznámý nebo poškozený formát nesmí přepsat původní data.

## Prvních 15 minut

Jde o cíl pro první hraní, nikoli naměřené časy. Tři jídla představují konečný rozsah prototypu, ne nabídku od prvního snímku.

| Přibližně | Nová činnost | Co hráč zvládne |
| --- | --- | --- |
| 0–3 min | Jeden hlavní pokrm, jeden stůl | Převzít lístek, připravit porci, podat ji a jednou vyúčtovat. |
| 3–5 min | První nápoj | Dovézt jídlo i pití podle stejného lístku. |
| 5–8 min | Špinavé talíře a dřez | Uzavřít celý fyzický oběh nádobí. |
| 8–11 min | Druhé jídlo a nákup | Rozlišit pracovní postupy, zásobu a rezervaci surovin. |
| 11–15 min | První výslovné najmutí | Porovnat mzdu s přínosem a delegovat jednu činnost. |

Další nápoj, třetí jídlo a zbývající stoly přijdou podle zvládnutí smyčky. Hráč nemusí nakupovat všechno najednou.

## První prototyp a další etapy

1. **Provoz jedné evropské pobočky:** 3 jídla (kuře s bramborami, polévka, salát), 2 nápoje (káva, limonáda), 4 stoly. Ručně proveditelná celá cesta objednávka → zásoby → příprava → podání → účet → nádobí → mytí.
2. **Personál a finance:** 4 role, výslovné najímání a propuštění, mzdy, dluh, skladové objednávky a bezpečná obnova provozu. Ověřit ekonomiku bez testovací hotovosti a všechny manuální náhradní postupy.
3. **Růst jedné pobočky:** viditelné rozšiřování a další zařízení. Teprve z hraní odvodit smysluplné pořadí a ceny plánovaných 18 rozšíření.
4. **Obsah a síť:** čtyři kuchyňské koncepty, všechny role, devět poboček, návraty, společná pokladna a omezený čistý pasivní příjem.
5. **Dokončení produktu:** mobilní a krajní stavy, výkon, celých 20 jazyků včetně RTL, zálohy, instalace a offline chování. Přenos do PWA nepředstírá hotovou aplikaci pro obchody.

Toto je posloupnost budoucí implementace. V tomto adresáři nyní vznikají pouze dokumenty.

## Výkon, mobil a akceptační podmínky

Výchozí rozpočet prototypu: deterministický krok simulace 30 Hz, nejvýše 24 hostů, 12 pracovníků a 32 současných lístků na aktivní pobočce. Jsou to ochranné limity pro měření, ne tvrzení o dosaženém výkonu. Vyhledání cesty nesmí vznikat zbytečně každý vykreslený snímek; úkoly a rezervace mají omezené fronty. Neaktivní pobočky neprovozují plnou simulaci lidí.

Ověření musí zahrnout mobil šířky 390 px, orientaci na šířku, dotykové cíle alespoň 44 px, přehled mapy i běžnou kameru, delší překlady a arabské RTL. Všechny aktivní pracovní cíle musí být dosažitelné bez zakrytého či překrývajícího se tlačítka.

| Oblast | Nutný důkaz |
| --- | --- |
| Zachování zásob | Surovina se rezervuje a spotřebuje jen jednou; souběh hráče a personálu nevytvoří záporný sklad. |
| Lístky a účty | Správný recept dojde ke správnému stolu; částečné dodání funguje; účet a dodávka se zaúčtují právě jednou i po reloadu. |
| Nádobí | Součet talířů ve všech stavech zůstává konstantní; mytí vrací existující talíře. |
| Najímání/propuštění | Počet odpovídá smlouvám a kapacitě; mzda končí správným okamžikem; dluh zůstane; držené předměty a úkoly se bezpečně předají. |
| Bez zablokování | Ruční provoz funguje bez personálu; vyprodání, prázdná pokladna, plný sklad a nedostatek talířů mají dostupné řešení. |
| Síť a pokladna | Otevření se platí jednou, nová pobočka má úroveň 0, návštěvy nepřidají kapitál a původní vybavení se obnoví. |
| Pasivní/offline provoz | Výpočet respektuje mzdy, zásoby, kapacitu a časový limit; návrat ani změna času nezdvojí příjem. |
| Uložení/import | Obnova libovolného rozpracovaného kroku zachová závazky a rezervace; neplatná data se odmítnou bez ztráty původní pozice. |
| Grafika a ovládání | Zakoupená plocha či zařízení jsou viditelné, přístupné a použitelné; důležité cíle nejsou schované za dekorací. |
| Regrese a jazyky | Původní Common hry stále projdou svými testy; nové UI má úplné slovníky, bez horizontálního přetékání a nefunkčních cílů. |
