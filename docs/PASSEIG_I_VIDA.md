# Passeig a peu i vida quotidiana · 0.9–0.11

El botó **Camina** entra en primera persona dins de la mateixa escena del poble. Accés directe: `#camina`; admet l’any a `?any=1794#camina`. L’alçada dels ulls és d’1,65 m sobre la superfície activa. No calen models externs ni Blender.

## Controls

- **WASD o fletxes:** caminar; **Majúscules:** duplicar la velocitat. El regulador permet 2–12 m/s, amb 6 m/s inicials.
- **Arrossegar sobre la vista:** mirar al voltant amb ratolí o pantalla tàctil.
- **Captura ratolí:** mirada contínua opcional; si el navegador no ho permet, continua disponible l’arrossegament.
- **Fletxes a la pantalla:** moviment tàctil mentre es manté premut un botó.
- **Punt de sortida:** plaça i carrers, moll del Roquer, davant de l’Església Nova, porxos, columnata, façana i pati d’un habitatge. Les opcions posteriors a l’any escollit es desactiven.
- **Esc / Surt:** tornar a la càmera orbital anterior. **Pausa ambient:** aturar barques, persones i animals sense impedir caminar.

En entrar es conserven posició, objectiu, perspectiva i enquadrament de la càmera anterior. Els diàlegs, la pèrdua de focus i l’ocultació de la pestanya alliberen les tecles; un diàleg obert suspèn el moviment. La recàrrega recupera el mode i l’any, però reinicia la posició al punt de sortida.

## Superfície i límits

`walk-plan.mjs` reutilitza les mostres locals de 2/10 m, el litoral interpretat, el barranc i els taulers del pont i dels dos molls. Respecta el canvi de paisatge, les capes i la cronologia. El mostreig no altera els binaris originals.

El desplaçament es subdivideix en passos de com a màxim 12 cm; es comproven una petjada circular de 32 cm, la planta dels edificis visibles i els canvis bruscos d’altura. Es permet lliscar al llarg d’una façana. Aigua i NoData frenen el pas. Els interiors domèstics continuen bloquejats. Des de 0.11, les galeries dels porxos, la columnata, els patis posteriors amb portell i l’accés al pati de la Fonda tenen obstacles separats segons els murs i suports; ja no es bloqueja tota l’envolupant. Vegeu `DETALL_HABITATGES.md`.

Aquest primer passeig és exterior i dins del terreny local. El Montsià de context a 50 m no té encara detall per caminar-hi. Arbres, tanques, persones i animals no tenen col·lisió pròpia. Cal millorar accessos, rampes i seccions quan es validin les geometries històriques C.

## Ambient procedural

`life.ts` afegeix **21 figures humanes**: 10 vianants, 4 figures d’oficis (horts, fusteria i ferreria), 2 pescadors als molls i 5 tripulants. També hi ha **un cavall amb carro i dos rucs amb càrrega**. Les articulacions mouen braços, cames, eines i rodes. Models simplificats, indumentària i accions són una recreació genèrica **C**; no documenten habitants concrets, vestuari verificat, quantitats històriques ni un cens d’ocupacions.

Els desplaçaments segueixen els corredors ja representats, amb velocitat per distància i retorn als extrems. Les figures segueixen el sòl i respecten la primera data representada del camí o servei: la ferreria antiga des de 1780, alguns recorreguts des de 1782 i l’escena principal des de 1794. Aquests llindars són decisions visuals reversibles, no dates d’inici històric dels oficis.

Les cinc barques naveguen lentament amb balanceig suau en circuits de demostració, fora de terra i dels molls. La petjada completa del casc es comprova durant el cicle. Els circuits no són rutes històriques documentades ni navegació física, i encara no eviten altres embarcacions. Posicions inicials, rutes i moviments són C.

**Capes** permet ocultar persones o animals i pausar l’ambient. La preferència del sistema de reduir moviment inicia l’ambient en pausa; es pot activar manualment. Canviar de pestanya no acumula salts temporals. La simulació usa temps transcorregut, no velocitat per fotograma, i no exigeix descarregar recursos externs.

## Verificació i següents passos

- Proves automàtiques: antitravessament de parets, lliscament, aigua/NoData/desnivells, suport real de pont i molls, carrer principal practicable, pausa de totes les figures i barques, visibilitat reversible, rutes fora de plantes construïdes i cascos fora de costa/molls durant tot el circuit.
- Comprovació al navegador: entrada, caminar amb teclat, girar arrossegant, canviar de punt, pausa i sortida amb Esc. Captures `caminar-0.10.0.jpg` i `vida-moll-0.10.0.jpg`.
- Pendents: itineraris més continus als accessos del port, interiors accessibles quan hi hagi una distribució contrastada, col·lisions amb elements petits i actors, animacions i vestuari amb fonts específiques, maniobres i amarratges de les barques.
- La prioritat històrica continua sent contrastar les cases, els carrers i els edificis del 1800. El catàleg fins al 1950 es conserva a `HORITZO_1950.md`; aquesta fase no amplia el selector actiu més enllà del 1800.


En 0.12, seleccionar una arcada durant el passeig obre la fitxa [dels porxos](PORXOS.md), amb descripcions i fonts. El desplaçament queda aturat mentre es llegeix; tancar-la permet continuar des del mateix punt.
