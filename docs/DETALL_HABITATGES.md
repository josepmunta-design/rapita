# Detall domèstic i porxos transitables · 0.11.0

Revisió: **31/10/2026**. La fase manté l’inventari i les plantes d’assaig anteriors. No identifica parcel·les noves ni dona per mesurats els detalls.

## Lectura de les fonts

- **H02, Reverté, pp. 208–210 i 230, articles 1–3:** tipologia de façana amb porta, finestra, balcons, cornises i pedra als brancals; pati posterior i terrat. El registre diferencia cases acabades, set cobertes encara sense acabats ni fusteries però amb reixes, i catorze amb pòrtics i primeres bigues. La relació entre deu d’aquestes cases i la capçalera semicircular és una interpretació, no una planta recuperada.
- **H01, tesi de Noèlia Borràs Matamoros, pp. impreses 251–253 / PDF 255–257:** tipologia del conjunt de dotze cases de 1788–1789, murs de maó amb morter i guix, emblanquinat, bigues, teula a dues aigües, balcó, reixes, llar, corral, estable i pous compartits. Aquest testimoni no acredita que tots els edificis tinguessin els mateixos detalls.
- **H01, p. impresa 226 / PDF 230:** text i fotografia de la columnata del sector sud, amb quatre grans columnes a Casa Laureano. La fotografia és posterior al 1800: no permet traslladar automàticament ornaments i reformes tardanes a la reconstrucció.

Fonts consultades: `tesi doctoral.pdf`, extractes locals `tmp/pdfs/tesis-viviendas.txt` i `tmp/pdfs/tesis-221-233.txt`, imatge `tmp/pdfs/centro-referencia-230.jpg`, i [article H02](https://www.academia.edu/170882307/1794_Estat_de_les_obres_reials_de_San_Carlos_Una_descripci%C3%B3_detallada_de_les_intervencions_realitzades_a_la_R%C3%A0pita_entre_1780_i_1794).

## Canvis visibles

| Element | Model d’aquesta fase | Límit |
|---|---|---|
| Portes i tancaments | Taulons separats, travessers, frontisses i tirador; fusteries frontals i posteriors de les cases acabades | Repartiment, mesures i ferratges C; sense números històrics individuals |
| Finestres i balcons | Reixes, tancaments de fusta, baranes i cornises; finestres cap al pati | Tipologia documentada, posicions i proporcions C |
| Set cases cobertes inacabades | Coberta i reixes, murs d’obra vista, sense afegir portes, finestres de fusta ni emblanquinat | Estat procedent de 1794; continuïtat individual el 1800 desconeguda |
| Cobertes de cases acabades | Teula amb relleu de material, carener, vores de fusta, franja posterior de terrat i xemeneia | Geometria i posicions C; no se’n coneix la secció exacta |
| Cases porticades inacabades | Murs, arcs i bigues, sense completar la teulada; galeria lateral oberta | Profunditat de galeria i forma dels arcs C |
| Patis posteriors | Terra seguint el relleu, tanca baixa i pas amb portell obert | Dimensions i accessos C; no s’afegeix un pou individual inventat a cada casa |
| Materials | Textures locals deterministes d’emblanquinat, obra vista, fusta i teula; relleu suau amb bump map | Materials genèrics, no fotografies ni identificacions d’una fàbrica conservada |

Les textures es calculen al navegador, sense recursos externs. Els mapes de color i relleu utilitzen espais de color diferents; la coberta té coordenades UV pròpies. No s’afegeixen plans coplanaris a l’interior dels buits.

## Correcció dels passos coberts

Hi havia dues causes diferents del bloqueig: la navegació impedia entrar a tota la planta de cada edifici, i les cases porticades tenien murs laterals de planta baixa fins a la línia de façana. També hi havia una plataforma tècnica plana sota tota la planta, que podia crear un graó artificial.

Ara **geometria i navegació comparteixen un pla de sòlids** (`domestic-plan.mjs`). En els pòrtics es bloquegen el cos domèstic posterior i les bases dels pilars; la galeria queda oberta entre cases. El terra de pas segueix el MDT a +3 cm, de manera contínua, sense modificar les dades originals. Les bases dels pilars baixen al terreny i el suport tècnic queda restringit al cos posterior. En la corba cal seguir el gir del porxo i envoltar els pilars físics.

A la plaça coberta s’assagen quatre columnes i arquitrau, separant aquest conjunt dels arcs de les cases. Es retira la restitució anterior de tres arcs d’aquest front. La planta baixa té entrada entre suports i pas lateral; els murs posteriors continuen bloquejant. L’obertura lateral, la profunditat i la cota són C. No s’hi restitueix la balustrada o el frontó tardans.

La Fonda conserva els dos cossos construïts com a obstacles, però el pati i l’accés de carros existent deixen de quedar bloquejats per un rectangle massís. Els interiors domèstics continuen sense itinerari de visita. No es considera validat cap dret de pas històric a través d’un edifici.

## Controls i velocitat

**Camina** ofereix punts de sortida als porxos, a la columnata, davant d’una casa i dins d’un pati, a més de plaça, moll i església. Els nous punts només s’activen des del testimoni representat de 1794. A Habitatges hi ha un accés directe **Camina pels porxos**.

La velocitat inicial passa d’1,4 a **6 m/s**, amb regulador de **2–12 m/s**; **Majúscules duplica** el valor. És una velocitat pràctica de navegació, no una simulació estricta de la marxa humana. Es corregeix el límit anterior de 60 ms perquè la càmera no vagi més lenta quan baixa la taxa de fotogrames. Es limita un interval a 250 ms per evitar un salt enorme després d’una pausa; les col·lisions continuen usant passos de fins a 12 cm.

## Verificació i pendents

- Les proves comproven el pas entre les deu galeries corbes amb col·lisions i interseccions de les malles reals, el bloqueig dels pilars i el cos posterior, l’entrada i sortida lateral de la columnata, el pas dels portells i la conservació d’estats, inventari i mostres del terreny.
- La velocitat es comprova a taxes de 5 i 60 fotogrames/s, amb regulador i mode ràpid. Al navegador, mantenir avançar durant dos segons recorre aproximadament 12,2 m, incloent el petit pas inicial del botó.
- Captures de comprovació: `porxos-0.11.0.jpg`, `columnata-0.11.0.jpg`, `habitatge-0.11.0.jpg` i `pati-0.11.0.jpg`.
- Pendents: mesures reals d’alçats i buits, secció i profunditat històrica dels porxos, cotes de carrer, datació dels detalls, pous compartits i estables individualitzats, interiors accessibles i conciliació de les propietats privades.

La validació tècnica del pas i dels materials no converteix la geometria C en una restitució històrica validada.


## Ampliació visual de terreny i entorn

La petició següent prioritza el detall dels edificis, el terreny i l’entorn. Aquesta mateixa fase incorpora:

- Textura de color en coordenades del món per al sòl, amb variacions àmplies, gra fi i atenuació segons la mida del píxel per reduir centelleigs a distància. No desplaça els vèrtexs ni crea relleu nou.
- Vegetació baixa de recreació i petites pedres fora de les plantes, patis i recorreguts principals; pedres menudes a les vores dels camins i del litoral. No es pressuposa una espècie vegetal, densitat o distribució històrica concreta.
- Recipients de terrissa als patis, i bótes, caixes, cordes enrotllades i una xarxa al moll. Són utillatge genèric C, no una restitució d’un inventari ni d’una indústria local demostrada.
- Materials d’acabat, fusta, teula i obra vista també als edificis del centre, amb relleu suau de material.
- Ombres estàtiques d’edificis, arbres i elements d’entorn. El mapa d’ombres es renova quan canvien les capes, la cronologia o la geometria, per evitar repetir-lo a cada fotograma. No es projecten ombres estàtiques de persones i vaixells en moviment.
- Els marcadors 3D de referència i els eixos tècnics s’oculten durant el passeig perquè no travessin visualment les façanes. Continuen disponibles a la vista orbital.

**Capes → Detall de l’entorn** permet comparar amb la superfície sense aquest gra i sense els objectes. Els elements d’aquesta recreació es mostren des del testimoni de 1794 i no daten l’aparició històrica de cada planta o objecte. Els ornaments dels patis segueixen la visibilitat dels habitatges, i l’utillatge del moll la dels serveis del litoral.

Les instàncies comparteixen malles per limitar el cost de pedres, plantes i recipients. Dues proves addicionals comproven repetibilitat, sòl sec amb dades, passos i plaça lliures de matolls, geometria finita i conservació dels originals. Total de la fase: **59 proves correctes**. La textura no substitueix detall topogràfic mesurat: el Montsià continua sent el context a 50 m.

Les captures conservades d’aquesta fase són les quatre indicades a l’apartat de verificació.


## Revisió posterior dels porxos · 0.12.0

La recerca fotogràfica específica substitueix el primer volum porticat d’aquesta fase: arcs de carpanell detallats, estructura exempta al front, retirada dels pisos especulatius, arcs transversals i fusta. La fitxa s’obre seleccionant una arcada i conté descripcions amb referències. Vegeu [PORXOS.md](PORXOS.md); les captures 0.11 conserven el model anterior i no representen la versió actual.
