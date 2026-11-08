# Ajust al croquis de la població i port de 1800

Revisió: **01/11/2026**. Referència aportada per Josep, coincident amb `N112 il·l.4` (572 × 736 px). És un croquis interpretatiu de Reverté, no un plànol original georeferenciat de 1800.

La transformació compartida queda a `data/layout-reference-1800.json`: 0,86 m/px, eix del dibuix de 18°, origen píxel (201,269) → coordenades locals (3,−9,8). S’ajusta relacionalment a la Mançana, la plaça i la torre existents. No hi ha punts de control mètrics independents ni RMSE històric. Les dimensions i posicions continuen en certesa C.

- Talavera i Fonda Nova adopten cadascuna un edifici continu en U, amb patis oberts en costats oposats. Comparteixen juntes, nivell de cornisa i coberta entre les ales, sense murs interiors als encontres. Una correcció relativa de 4 m cap a llevant deixa lliure la filera residencial existent. Les col·lisions segueixen el perímetre còncau, sense omplir el pati.
- Fonda Vella, la duana antiga i els dos edificis de pedra s’ajusten respecte del braç del canal i les rampes. Es preserven les seves estructures, així com les de Sant Elm, Casa Laureano, torre i bateria. No es modifica cap alçat emblemàtic.
- Jardí botànic i dos horts del Rei passen a la franja occidental que mostra el croquis. Els Horts de les Monges tenen un recinte irregular propi entre Roquer, Fonda Vella i port. Es retira el volum duplicat de la nova illa occidental, ja representada pels habitatges.
- El tram terminal del canal segueix el braç 19 i acaba al nord de la dàrsena gran. Dues vores baixes el fan llegible al sector litoral. Es conserva el corredor llarg cap a Amposta.
- La dàrsena gran es reconstrueix amb dos braços oblics i una boca lateral oberta, segons el traçat del croquis. Aigua, excavació, molls, objectes de treball i superfície del passeig comparteixen aquestes línies. Les fases del port del segle XX continuen separades.
- La costa interpretada d’aquest escenari segueix el croquis. La traça anterior de 1748 queda arxivada a `coast1748Trace`; els edificis i projectes detallats d’aquell dibuix es preserven.
- Les tres coves conserven la posició marcada per Josep. La roca comparteix color amb el terreny, la coberta connecta amb la ladera i els laterals tenen una transició de deu metres. S’evita superposar la malla del terreny sobre la coberta de les galeries. El sòlid manté boques laterals obertes i fons cecs.

## Regeneració i comprovació

El mur de contenció 24 segueix dos trams del croquis: a llevant de Talavera/Fonda i al límit dels Horts de les Monges. La maçoneria s'adapta al pendent i s'enrasa als passos de rampa. La secció i les cotes són d'estudi, sense atribuir-los mesures històriques.

La pestanya **Capes** permet superposar independentment el croquis de Reverté i l'ortofoto del port de 1945–1946, sense canviar l'any de l'escena. La segona capa parteix de `PORT/1945-1946.png`, amb el registre afí arxivat a `data/harbour-registration.json` (2.712 correspondències; residu de registre de 0,84 m). Aquest residu no és una garantia de precisió absoluta. Es retallen les barres de la captura original. Totes dues capes permeten ajustar opacitat, escala, rotació i desplaçament E/N, i restablir el registre inicial.

`node scripts/align-reference-1800.mjs`, seguit de `prepare-housing.mjs`, `prepare-center.mjs`, `prepare-littoral.mjs` i `prepare-urban.mjs`. Les fitxes es sincronitzen amb `python scripts/sync-reference-dossiers.py`.

Proves de separació entre edificis, camins transitables, patis buits, continuïtat de l’aigua, superfícies dels molls, normals i tancament del sòlid de roca. MDT original i màscares de validesa preservats. Captures de comprovació a `tmp/reference-qa/`.
