/* ============================================================
   MISE EN PAGE — trois controles visuels qui se mesurent, plutot que
   de se juger a l'oeil :

   1. aucun emoji ne recouvre un voisin, sur les huit ecrans ;
   2. aucune touche ne porte de relief (ombre portee ou incrustee) ;
   3. l'ecart entre un emoji et son libelle, en pixels.

   Le controle 1 compare les DEUX axes : deux elements cote a cote se
   croisent verticalement sans se recouvrir. Un test qui ne regarde que
   la verticale crie au loup a chaque rangee.

   node mise-en-page.mjs
   ============================================================ */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const JEU = 'file://' + fileURLToPath(new URL('../index.html', import.meta.url));
const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await navigateur.newPage({ viewport: { width: 1000, height: 960 } });
const plantages = [];
page.on('pageerror', (e) => plantages.push(e.message));
await page.goto(JEU);
await page.waitForTimeout(250);

const EMOJI = '.geant,.avatar-xl,.re-emoji,.tv-avatars,.jeton .e,.grid8 .btn .e,.carte-eq .e,.ch-qui .e,#bandeau .av';
const EQUIPE = "E.choix=['mousserot','brumaille','tibiane','grognemousse'];";

const ECRANS = {
  grille:    "E.choix=['mousserot','brumaille'];dessineMiseEnPlace();",
  confirm:   EQUIPE + "E.reprise=false;dessineConfirmation();",
  tirage:    EQUIPE + "commence();",
  tampon:    EQUIPE + "commence();ouvreLeTour();",
  choix:     EQUIPE + "commence();ouvreLeTour();confirmeTampon();",
  contre:    EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();",
  arbitre:   EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(false,0);",
  resultat:  EQUIPE + "commence();ouvreLeTour();confirmeTampon();E.motChoisi=0;annoncePari(3);confirmeTampon();trancheLeContre(false,0);conclut('trouvé',E.t.preneur);",
  fin:       EQUIPE + "commence();E.score.lichen=100;dessineFin();",
};

let ko = 0;

console.log('— chevauchements');
for (const [nom, script] of Object.entries(ECRANS)) {
  await page.evaluate(new Function(script));
  await page.waitForTimeout(120);
  const mauvais = await page.evaluate((sel) => {
    const out = [];
    const croise = (a, b) =>
      a.right > b.left + 1 && b.right > a.left + 1 &&
      a.bottom > b.top + 1 && b.bottom > a.top + 1;
    document.querySelectorAll(sel).forEach((e) => {
      if (!e.offsetParent) return;
      const r = e.getBoundingClientRect();
      [e.nextElementSibling, e.previousElementSibling,
       e.parentElement && e.parentElement.previousElementSibling,
       e.parentElement && e.parentElement.nextElementSibling].forEach((v) => {
        if (!v || !v.offsetParent || v.contains(e) || e.contains(v)) return;
        if (croise(r, v.getBoundingClientRect())) out.push(`${e.className || e.id} X ${v.className || v.id || v.tagName}`);
      });
    });
    return out;
  }, EMOJI);
  if (mauvais.length) { ko++; console.log(`  ${nom.padEnd(10)} CHEVAUCHE : ${mauvais.join(' | ')}`); }
  else console.log(`  ${nom.padEnd(10)} ok`);
}

console.log('— reliefs');
const reliefs = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.btn,.k').forEach((b) => {
    const s = getComputedStyle(b).boxShadow;
    if (s && s !== 'none') out.push(`${b.id || b.className} -> ${s}`);
  });
  return out;
});
if (reliefs.length) { ko++; console.log('  RELIEF SUR UNE TOUCHE :\n   - ' + reliefs.join('\n   - ')); }
else console.log('  aucune touche ne porte d\'ombre');

console.log('— ecart emoji / libelle');
for (const nom of ['grille', 'confirm', 'tampon', 'choix', 'resultat']) {
  await page.evaluate(new Function(ECRANS[nom]));
  await page.waitForTimeout(120);
  const lignes = await page.evaluate((sel) => {
    const vus = new Set(), out = [];
    document.querySelectorAll(sel).forEach((e) => {
      if (!e.offsetParent) return;
      const n = e.nextElementSibling;
      if (!n || !n.offsetParent) return;
      const r = e.getBoundingClientRect(), q = n.getBoundingClientRect();
      const dessous = q.top >= r.bottom - 2;
      const cle = (e.className || e.id) + dessous;
      if (vus.has(cle)) return;
      vus.add(cle);
      out.push(`${Math.round(parseFloat(getComputedStyle(e).fontSize))}px ${dessous ? 'dessous' : 'a cote'} ${Math.round(dessous ? q.top - r.bottom : q.left - r.right)}px`);
    });
    return out;
  }, EMOJI);
  console.log(`  ${nom.padEnd(10)} ${lignes.join(' · ')}`);
}

if (plantages.length) { ko++; console.log('erreurs page :', plantages.join('\n')); }
await navigateur.close();
process.exit(ko ? 1 : 0);
