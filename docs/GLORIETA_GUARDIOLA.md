# Glorieta i Guardiola · 0.6.0

Revisió del 30/10/2026. S'afegeixen els dos monuments del catàleg inicial que encara només tenien un punt de referència. Comparteixen escena, coordenades i selector d'any amb el nucli; no són pantalles separades. Les dimensions i els alçats són **models d'estudi C**.

## La Glorieta

S'han llegit H01, pp. 222–223 i 229–231, i s'ha inspeccionat visualment la fotografia reproduïda a la pàgina 230 (PDF 234). La tesi descriu una rotonda amb tres arcs de maó al sud, columnes, un cos rectangular al costat oposat i una cúpula prevista que no s'arribà a construir. El model manté el centre i l'annex oberts, sense cúpula ni coberta.

La referència a Jaubert correspon a una **visita de 1816**, posterior al període del visor. H02 no esmenta expressament la Glorieta en l'inventari de 1794. Per això el model només apareix en l'escenari de 1800 com a **hipòtesi retrospectiva**, mai com una construcció datada aquell any. Ocultar-lo en anys anteriors significa desconeixement de la fase, no absència física demostrada.

Posició: referència actual del dossier, E 295.915,7 / N 4.499.527,6. Radi de treball 4,2 m, alçària 4,2 m, annex 5,4 × 4 m, gruix 0,55 m. **Cap d'aquestes dimensions és una mesura històrica**. El gir sud fa servir la descripció, però encara no és una orientació aixecada topogràficament. El model és una aproximació poligonal de la rotonda, no una planta mesurada.

Cada arc és una única extrusió amb obertura real fins a terra. No s'han tapat els buits amb textures ni superposat capses per formar els brancals.

## Torre de la Guardiola

H01, pp. 161–162 (PDF 165–166), esmenta la Guardiola entre els elements existents a finals de 1780. La [fitxa municipal de Turisme La Ràpita](https://turismelarapita.cat/es/interes/mirador-de-la-guardiola/) documenta antecedents de 1483 i 1575 i descriu planta quadrada, base atalussada i paredat. Els 113 m publicats corresponen al turó, **no** a l'alçària de la torre.

S'assaja una base atalussada de 6,8 m, cos de 5,8 m de costat i alçària total de 6,8 m. Mesures, obertures i aspecte del període C; el coronament històric no està restituït. No s'incorporen el mirador, les escales, la imatge religiosa, merlets moderns ni altres reformes posteriors. Es mostra com a preexistència al llarg de l'interval del visor, sense inventar-hi canvis anuals.

## Suport, cronologia i reproducció

Els dos models es recolzen en el MDT local de 10 m. Les faldilles segueixen el terreny mesurat; la plataforma horitzontal és tècnica i no prova una explanació històrica. Les cotes originals no canvien. `historicalHeight`, `historicalFootprint`, `constructionYear` i `state1800` continuen en `null`.

- Paràmetres i fonts: `data/landmarks.json`.
- Cronologia: entitats `glorieta` i `guardiola` de `data/chronology.json`.
- Generació de dades: `npm.cmd run data:landmarks`.
- Models: `src/landmarks.ts`; accés des d'Edificis, Llocs, `#glorieta` i `#guardiola`.

Pendents: aixecament de planta i alçats; datació de les fàbriques i del coronament de Guardiola; cronologia de Glorieta anterior a 1816; revisió de la posició sobre cartografia georeferenciada. El conjunt de propietats privades i altres dependències sense planta identificada continua pendent de conciliació, no es considera complet per aquests dos models.
