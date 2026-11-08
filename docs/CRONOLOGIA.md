# Selector d'any i testimonis del nucli

> Actualització 8/11/2026: el selector implementat arriba a 1993. Arxiu XIX amplia la recerca 1800–1900; [estat vigent i límits](1800-1900/REVISION.md). El text següent conserva l’abast i les decisions de la fase original.

Versió 0.5.0 · 30/10/2026. El selector cobreix **1778–1800**, funciona amb ratolí i teclat i conserva l'any a `?any=1789`. Les càmeres `#roquer`, `#canal`, `#amposta`, `#centre`, `#habitatges` i `#esglesia` comparteixen una mateixa escena.

## Regla de lectura

El lliscador és anual, però els models canvien només en fites documentades. Entre fites es manté l'últim testimoni i s'indica **continuïtat C**. No es crea una interpolació d'obres. Primer testimoni revisat, data de construcció, estat d'obra i identitat parcel·lària són camps diferents.

| Fita | Canvi representat | Límit |
|---|---|---|
| 1778 | Torre anterior a la reparació i àmbit antic. Bateria encara oculta com a obra executada. | El projecte de Llobet de 1778 apareix a H01; el T-6/8 del catàleg és indeterminat dins del XVIII. Volum anterior de torre C. |
| 1779 | Bateria amb murs baixos d'assaig. | Inici el maig; no hi ha avanç mensual mesurat. |
| 1780 | Torre reparada, muralla parcial del conjunt, dependències, forn i cisterna; duana antiga. | H01 pp. 113–114 i 159–162. Els testimonis dins del mateix any descriuen moments diferents; s'assaja una fase tardana, no una instantània exacta de gener. |
| 1781 | Es conserva la bateria inacabada. | Suspensió, H01 p. 115. Cap pis superior complet. |
| 1782 | Dues Cases de Talavera i ús de fonda dels Lanti. | Registres del 14/03 i 20/05 de 1782, H01 p. 322, i context pp. 168 i 268. Dates de testimoni, no d'acabament. Correspondència fonda–Fonda Vella C. |
| 1788 | Testimoni alternatiu de dotze cases amb obra vista i sense coberta d'assaig. | Cinc informes des de desembre de 1788; H01 pp. 251–252. No prova que totes estiguessin en aquest mateix estat. |
| 1789 | Dotze cases, amb vuit acabats d'assaig i quatre sense acabar. | La font només diu **la majoria acabades a l'abril**. `documentedCompletedCount: null`; l'assignació de vuit és C. |
| 1794 | Inventari general del nucli, sis canons, canal, dàrsenes i serveis. El testimoni alternatiu de dotze cases s'oculta. | El canvi de testimoni no significa enderroc. Identitat individual amb 1794 desconeguda. No se sumen dotze unitats a les 81 reials. |
| 1795–1800 | Es manté l'escenari parcial de 1794 amb avís del temporal. | Danys coneguts però sense extensió espacial validada. No es simula destrucció arbitrària. |

## Següent fase iniciada i implementada en aquesta sessió

Després del Roquer s'ha ampliat la revisió al nucli, per indicació de l'usuari:

- H01 pp. 159–162: estat inicial de 1780, duana i serveis. No es col·loquen totes les cases de guardes, barracons o ferreria sense planta validada.
- H01 pp. 167–168, 268 i 322: fonda dels Lanti i dues cases de Talavera, amb referències de 1782.
- H01 pp. 251–252: dotze cases numerades de tres plantes, superfícies de 50–60 m², informes de desembre de 1788–abril de 1789 i majoria acabada a l'abril. Nova escena alternativa amb dues fileres de sis, posició i alçats C.
- H01 pp. 189–191: projecte eclesial de 1785–1786 i trasllat cap a Codonyol. **No s'ha convertit una previsió de primera pedra en una data comprovada d'acabament de Sant Elm o de l'Església Nova.** Es mantenen sense avançar-ne els models a una data no acreditada.

La ubicació exacta, la numeració d'habitatges i l'enllaç amb el parcel·lari de 1794 continuen desconeguts. Les dotze cases són una representació d'un altre testimoni, amb `identityWith1794: null`, mai una dotzena addicional simultània.

## Com ampliar-ho

1. Ajustar `range` i `defaultYear` si s’amplia el període; el lliscador adopta aquests límits. `minorTick` només controla la densitat visual de les etiquetes. Afegir testimonis i intervals ordenats a `data/chronology.json`, camp `entities`. Cada estat té `fromYear`, `variant`, `visible`, `sourceRefs`, `certainty` i `dateMeaning`.
2. Vincular una variant de geometria a l'entitat. `entityAt()` resol el testimoni vigent; no cal canviar la interfície de dates.
3. Separar recomptes documentals i assignacions C. Els paràmetres de les dotze cases són a `data/urban-chronology.json`.
4. Executar `npm.cmd run data:littoral`, proves i compilació. Comprovar anada i tornada entre anys, càrrega amb URL i absència de duplicacions entre testimonis.

## Pendents

- [ ] Cronologia individual dels altres vuit registres del centre, i de cada cos residencial de 1794.
- [ ] Reconciliar les dotze cases de 1788–1789 amb l'inventari i les propietats privades, abans de mostrar-ne una continuïtat individual.
- [ ] Cronologia mesurada de Sant Elm i Església Nova; distinció projecte/execució i identitat del temple.
- [ ] Ocupació, reformes, canvis de propietat i danys entre 1794 i 1800.
- [ ] Ampliació a anys posteriors només amb fonts datades, sense aplicar l'eixample de 1867 a escenes anteriors.

## Monuments incorporats en 0.6–0.7

Guardiola és una preexistència, amb menció el 1780 i antecedents municipals anteriors; el model s'assaja durant tot l'interval. No s'inventen canvis anuals del coronament. La Glorieta només s'assaja el 1800, com a hipòtesi retrospectiva C: H01 descriu la visita de Jaubert el 1816 i H02 no l'esmenta el 1794. **1800 no és una data de construcció**. Les mesures i l'estat històrics continuen desconeguts. Vegeu `docs/GLORIETA_GUARDIOLA.md`.

## Trama del poble (0.8.0)

`data/urban-fabric.json` associa cada carrer/servei al primer testimoni revisat. `urbanVisible()` selecciona la ferreria de 1780 o el testimoni de Fonda Vella de 1794 sense afirmar el dia del trasllat. Guardes: 1780; Rambla/Rampar: 1782; pont, horts, jardí i resta de corredors: 1794. La plantació de les Alamedes té entitat pròpia des del testimoni de 1792.

L'objectiu ampliat és 1950; `data/history-catalog.json` conserva la recerca posterior i les dates en conflicte. La prioritat actual manté el selector actiu en 1778–1800. No es representa el projecte de 1852 ni el de 1867 com a obra del 1800.
