/* ============================================================
   RENDU — capture chaque ecran en PLEIN CADRE 390x844, la taille reelle
   d'un telephone. Pas la vue de bureau avec le cadre d'appareil autour :
   elle est illisible quand on relit les captures depuis un mobile.

   node rendu.mjs              tous les ecrans
   node rendu.mjs arbitre      un seul
   ============================================================ */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const JEU = 'file://' + fileURLToPath(new URL('../index.html', import.meta.url));
const SORTIE = fileURLToPath(new URL('./captures/', import.meta.url));
mkdirSync(SORTIE, { recursive: true });

const EQUIPE = "E.choix=['mousserot','brumaille','tibiane','grognemousse'];";
const ECRANS = {
  grille:    "E.choix=['mousserot','brumaille'];dessineMiseEnPlace();",
  confirm:   EQUIPE + "E.reprise=false;dessineConfirmation();",
  tirage:    EQUIPE + "commence();",
  tampon:    EQUIPE + "commence();ouvreLeTour();",
  choix:     EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;majChoix();",
  contre:    EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();",
  tamponVol: EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(true,1);",
  arbitreVol:EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(true,1);confirmeTampon();",
  arbitre:   EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(false,0);dessineArbitrage();",
  banni:     EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(false,0);dessineBanni();",
  resultat:  EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(false,0);conclut('trouvé',E.t.preneur);",
  fin:       EQUIPE + "commence();E.score.lichen=100;E.score.braise=70;dessineFin();",
};

const voulu = process.argv[2];
const liste = voulu ? { [voulu]: ECRANS[voulu] } : ECRANS;
if (voulu && !ECRANS[voulu]) {
  console.error(`ecran inconnu : ${voulu}\nconnus : ${Object.keys(ECRANS).join(', ')}`);
  process.exit(1);
}

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
/* 390x844 : sous les seuils du media query, donc plein ecran sans cadre. */
const page = await navigateur.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const plantages = [];
page.on('pageerror', (e) => plantages.push(e.message));
await page.goto(JEU);
await page.waitForTimeout(250);

for (const [nom, script] of Object.entries(liste)) {
  await page.evaluate(new Function(script));
  await page.waitForTimeout(150);
  const chemin = SORTIE + nom + '.png';
  await page.screenshot({ path: chemin });
  console.log(chemin);
}
if (plantages.length) console.log('erreurs page :', plantages.join('\n'));
await navigateur.close();
