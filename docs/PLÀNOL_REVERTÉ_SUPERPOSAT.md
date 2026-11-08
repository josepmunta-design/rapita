# Croquis de Pilar Reverté projectat al terreny

Revisió: **01/11/2026**. A **Capes → Croquis de Pilar Reverté · població i port**, activar **Projecta el mapa de Pilar Reverté sobre el terreny**.

La capa projecta la imatge original `N112-il4.jpg` sobre el relleu. En activar-la centra el mapa en planta. Inclou opacitat, paper blanc opcional, gir, escala, desplaçament est/nord i restabliment de l’ajust inicial. El dibuix complet amb llegenda s’obre des del mateix panell; la projecció retalla només la llegenda inferior (límit de 590 px), mantenint les coordenades originals dels píxels del mapa.

La configuració es genera a `public/data/plan-reverte.json` a partir de `data/layout-reference-1800.json` i el marc dels habitatges. És exactament la mateixa transformació que fan servir els cossos traçats de Talavera, Fonda, horts, canal i port; es conserva també el petit desplaçament d’assaig de 4 m dels dos conjunts residencials. La capa permet veure aquestes diferències. Els controls només mouen la imatge i no canvien la geometria ni desen un nou georeferenciat.

La imatge segueix el terreny seleccionat i queda per sobre de la làmina d’aigua perquè la part de la dàrsena sigui visible. La projecció s’actualitza en canviar d’any o de base de terreny. Els edificis continuen al davant del dibuix; es poden ocultar amb les seves capes per llegir totes les línies. El plànol de 1748 del Roquer manté els seus controls independents.

És un croquis interpretatiu publicat el 2024 sobre l’estat de 1794, no un aixecament original de 1800. L’ajust continua sent C, sense punts de control mètrics independents. Regeneració: `npm.cmd run data:overlay`.

Verificació: equivalència de les transformacions en punts del croquis, orientació dels UV, projecció sobre terreny, transparència del paper, controls en navegador, canvi de base i any, i compatibilitat amb la capa del Roquer.
