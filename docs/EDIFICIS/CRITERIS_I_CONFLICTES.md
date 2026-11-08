# Criteris per als edificis i les èpoques

L’arxiu de reconstrucció s’organitza per identitat de l’edifici o del lloc. Una carpeta conté la descripció, les fonts i tots els testimonis temporals; els cossos residencials sense identitat històrica individual tenen carpeta d’assaig pròpia vinculada a la tipologia. No es presenta un número tècnic del model com si fos una finca documentada.

## Contingut de cada carpeta

- `README.md`: document editable de descripció, col·locació, fases, fonts, aplicació al model i incògnites.
- `index.html`: versió llegible al navegador, amb les imatges de referència i enllaços locals.
- `fases.json`: testimonis temporals, dates, tipus de dada, fonts i límits per preparar el selector.
- `ubicacio.json`: relació territorial documentada, coordenades històriques desconegudes i posició d’assaig separada.
- `fonts.json`: referències completes, localitzador de pàgina o imatge i procedència dels fitxers.
- `model-actual.json`: còpia dels paràmetres del prototip actual, sense transformar-los en mesures històriques.

Els originals de la carpeta nova es conserven sense alterar i, a més, s’arxiva una còpia exacta al projecte sota `fonts-20261031/originals/`. L’inventari manté el nom, ruta de procedència, mida i SHA256. Les imatges no es publiquen a `public/` ni s’afegeixen al paquet de l’aplicació.

## Dates que no s’han de confondre

Una fase conserva la **data del testimoni**. La data de l’obra o canvi exacte resta desconeguda quan no és explícita. Una casa present el 1794 no s’ha de fer aparèixer com acabada exactament el 20 demaig. Una fotografia de 1916 no demostra que aquella fàbrica fos igual el 1800. Una anotació feta el 1961 sobre un mapa de 1913 no pertany a 1913.

`automatic Timeline Activation` és `false` a tots els registres d’aquesta revisió. Això conserva la recerca preparada per fases, sense programar canvis de geometria basats en dates insegures. La visualització activa continua a 1778–1800 i l’horitzó és 1778–1950. Els testimonis anteriors o posteriors queden identificats com a comparació.

No s’interpola una construcció entre testimonis ni s’inventa un any de trasllat. Quan una identificació sigui contrastada es podrà definir una variant, un interval de vigència i els canvis de geometria corresponents. Una ordre, concessió o projecte s’ha de distingir d’una obra acabada o d’un ús efectiu.

## Conflictes i correccions que cal conservar

| Assumpte | Dades en conflicte o incompletes | Regla de treball |
|---|---|---|
| Cases porticades | Article 3:14; comentari p.210:10 rodones i 4 rectes probablement juntes a l’oest; resum p.225 simplifica el grup a 10 | Fer servir la distinció completa i mantenir la col·locació dels 4 pendents. No repartir-les dues i dues per simetria sense suport |
| Cases de Talavera | Quatre afrontacions de finca irregular | No convertir-les en dimensions de cadascuna de les dues cases ni en rectangle resolt |
| Duana nova i White | P.217 i 226 varien dreta/esquerra; venda descrita amb referències 1868/1869 | Orientar amb carrer, plaça i confrontants; no resoldre-ho amb una paraula sense punt de vista |
| Mançana | Aproximació 80×40 m, superfície de subhasta 2.904,09 m²,24 unitats 1794 i 29 habitacions 1865 | Conservar data i abast de cada mesura i recompte. No substituir una dada per l’altra sense explicar recinte i fase |
| Pòrtic domèstic, plaça coberta i tinglado | La lectura de l’article distingeix usos, annexos i possible incorporació d’arcs | No fer-los un únic edifici perquè tots tinguin arcades. Eltinglado té programa de 12 i 9 pilastres i fases de dany/desmuntatge per aclarir |
| Temporal deltinglado | L’article descriu sostre malmès i desmuntatge sense fixar al passatge una data exacta | No assimilar-lo automàticament al temporal del moll de 1795 |
| Fort i port | Projectes de 1748,1780 i 1782; obra parcial 1794; relat optimista i danys 1795 | Separar projecte i execució, i no representar tots els molls com acabats o tots enderrocats |
| Sanitat | Casa antiga prop del convent i oficina al cap de dàrsena el 1794 | Registrar identitat o trasllat com a pendent abans de duplicar edificis |
| Ferreria i fusteria | Cases dels assentistes, tallers inicials i serveis posteriors | No sumar cada nom d’ús com un edifici independent; les variants delprototip són hipòtesis |
| Fonts | Dues piles i torres però un únic rellotge instal·lat | No afegir un segon rellotge; l’assignació a una torre concreta continua sentC |
| Garrofers |60 a la població; plantació i reposicions al passeig de l’Església Nova;64 al relat 1863 | No confondre alineacions, reposicions i censos de dates diferents |
| Glorieta | Absència alinventari 1794, menció retrospectiva de Jaubert i foto 1916 | No fer servir el silenci com prova d’inexistència, ni la fotografia com data de construcció |
| Escloses |1780:propostes;1794:parts fetes, altres començades;XIX:nou complex | No modelar rescloses i mecanismes del XIX al XVIII |
| Unitat delpeu | Article nota 91 usa 0,3048 m; altres límits especifiquen castellanes | Conservar vares, peus i polzades originals i identificar el patró abans de convertir; no fixar datum d’aigua amb aquests nombres |
| Església parroquial després de la guerra | Catàleg previ amb discrepància 1941/1945 | Conservar el conflicte fins consultar expedient d’obra, no programar una variant acabada al primer any |
| Plànol 1852 | Projecte amb existents i demolicions proposades | Rosa i groc no proven construcció o enderroc. Es distingirà cada intenció del seu eventual resultat |
| Full 1913 |Afegits 1921,1942 i 1961 | Digitalitzar per capes temporals; les línies vermelles no són totes contemporànies |
| Fotografies acolorides | Versions color/B/N i retalls del mateix negatiu | No certifiquen color original ni constitueixen testimonis independents |
| Imatge Chat GPT N074 | Recreació generada | Exclosa com a prova d’arquitectura, material o mètrica |
| Paredó N110 |Ter i Girona 1743 | Exclòs delparedó rapitenc |
| PDF N009 |Reg valencià a Catral | Exclòs de l’arquitectura del poble |
| ANC1-57-N-576–578 |Monges en una arcada, lloc no identificat | Reserva sense atribució automàtica als porxos rapitencs |

## Arxiu de fonts i ús de les imatges

Els 113 fitxers s’han inventariat i classificat. La lectura inclou l’article complet de 44 pàgines, textos i imatges incrustades dels 4DOCX i l’ODT, les pàgines escanejades, llegendes manuscrites i plànols. Les fotografies s’han revisat en contactes i els peus de les reproduccions de llibre s’han llegit separadament; les dates no visibles queden desconegudes. No s’afirma haver identificat tots els negatius o llegit llibres complets a partir de retalls.

Duplicats binaris comprovats: **N078=N079** i **N081=N082**. També hi ha versions visuals o retalls d’una mateixa vista amb hashes diferents. La fotografia de les pàgines d’un llibre feta el 2021 no és una fotografia històrica del 2021. Les fotos de 1958 i els afegits 1961 es conserven fora de l’horitzó 1950. La fotografia familiar N098 no s’assigna a cap edifici.

Les referències modernes i reproduccions sense llicència documentada s’arxiven per al treball local. La incorporació de qualsevol imatge a la web pública requerirà comprovar autor, drets, crèdit i registre. Aquesta fase només crea l’arxiu de recerca del projecte.

## Prioritats per a la següent construcció

1. Georeferenciar capes existents de 1852 i contrastar-les amb 1748,1782, topografia posterior i afrontacions. Publicar punts de control i error d’ajust abans de donar ubicacions per validades.
2. Corregir, si el contrast ho confirma, les quatre cases porxades rectes i el recinte de Talavera. Resoldre també Casa Laureano versus tinglado i l’orientació dels dos edificis del Cóc.
3. Reprendre el detall d’habitatges amb cossos, patis, pous compartits, comunes, estables i façanes individualitzades quan estigui clara cada identitat.
4. Completar per fases molí, rajolar, forn/molí deguix, Casa dels Bous i barraques sense ubicacions arbitràries.
5. Ampliar el selector fins al 1950 només quan cada variant tingui interval, geometria i fonts contrastades. Conservar per separat reformes, ruïnes, canvis d’ús i demolicions.
