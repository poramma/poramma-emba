// src/lib/campaignHtml.ts
//
// « Moteur de mise en forme » du contenu des campagnes.
//
// Les agents rédigent dans un éditeur visuel (gras, listes, liens…) ou importent
// un document Word : ils ne voient jamais de balises. En coulisses, ce module :
//   1. transforme ce qu'on lui donne (Word, texte brut, Markdown historique, collage)
//      en un HTML propre et cohérent ;
//   2. NETTOIE ce HTML avec une liste blanche stricte (aucun script, style, gestionnaire
//      d'évènement ni lien javascript: ne survit) — c'est ce HTML, et lui seul, qui est enregistré ;
//   3. offre les utilitaires d'affichage (extrait texte, titre en tête de document…).
//
// Le portail citoyen et le serveur re-nettoient ce HTML : trois barrières successives.

import DOMPurify from 'dompurify';
import { marked } from 'marked';

// ── Liste blanche ────────────────────────────────────────────────────────

const ALLOWED_TAGS = ['p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];
const ALLOWED_ATTR = ['href', 'title', 'colspan', 'rowspan'];
const SAFE_URI = /^(?:https?:|mailto:|tel:)/i;

const looksLikeHtml = (text: string) => /<\/?[a-z][\s\S]*?>/i.test(text);

function parse(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
}

// ── Nettoyage (liste blanche) ────────────────────────────────────────────

/** HTML sûr et normalisé : liste blanche stricte, liens externes ouverts dans un nouvel onglet. */
export function sanitizeCampaignHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: SAFE_URI,
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'img', 'svg', 'math'],
  });
  const doc = parse(clean);
  doc.querySelectorAll('a').forEach((a) => {
    if (!a.getAttribute('href')) {
      a.replaceWith(...Array.from(a.childNodes)); // lien vide ou refusé : on garde le texte
      return;
    }
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer nofollow');
  });
  // <li><p>texte</p></li> et <td><p>texte</p></td> → sans paragraphe interne (sinon marges doublées à l'affichage)
  doc.querySelectorAll('li, td, th').forEach((cell) => {
    const only = cell.children.length === 1 && cell.firstElementChild?.tagName === 'P' ? cell.firstElementChild : null;
    if (only && !Array.from(cell.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) only.replaceWith(...Array.from(only.childNodes));
  });
  // Paragraphes vides / espaces insécables résiduels
  doc.querySelectorAll('p').forEach((p) => {
    if (!p.textContent?.replace(/[\s ]/g, '') && !p.querySelector('br,img')) p.remove();
  });
  return doc.body.innerHTML.replace(/ /g, ' ').trim();
}

/** Contenu déjà enregistré (HTML, ou Markdown/texte brut hérité d'anciennes saisies) → HTML propre pour l'éditeur. */
export function toEditorHtml(stored: string | null | undefined): string {
  const text = (stored ?? '').trim();
  if (!text) return '';
  if (looksLikeHtml(text)) return sanitizeCampaignHtml(text);
  return sanitizeCampaignHtml(marked.parse(text, { async: false, breaks: true }) as string);
}

// ── Mise en forme « intelligente » (import Word, collage, texte brut) ────

const BULLET = /^\s*[•●▪■◦○·–—*-]\s+/;
const NUMBER = /^\s*\d{1,2}[.)]\s+/; // chiffres seulement : « M. Diallo » ou « A. » ne sont pas des puces

/** Le paragraphe est-il intégralement en gras (un seul <strong>/<b> qui couvre tout son texte) ? */
function isAllBold(p: Element): boolean {
  const text = (p.textContent ?? '').replace(/[\s ]/g, '');
  if (!text) return false;
  const bold = Array.from(p.querySelectorAll('strong,b')).map((b) => (b.textContent ?? '').replace(/[\s ]/g, '')).join('');
  return bold.length >= text.length;
}

const isShortTitle = (text: string) => text.length >= 3 && text.length <= 90 && !/[.;,:!?]$/.test(text);
const isAllCaps = (text: string) => /[A-ZÀ-Ý]{3}/.test(text) && text === text.toUpperCase() && text.length <= 80;

/**
 * Remet en forme un HTML « sale » (souvent issu de Word) :
 *  - puces et numéros tapés à la main (« • », « - », « 1. ») → vraies listes ;
 *  - lignes courtes toutes en gras ou en MAJUSCULES → intertitres ;
 *  - h1 → h2, h4 et + → h3 (le titre de la campagne est saisi à part) ;
 *  - paragraphes vides et sauts de ligne multiples supprimés.
 */
export function smartClean(html: string): string {
  const doc = parse(html);
  const body = doc.body;

  // 1) niveaux de titres
  body.querySelectorAll('h1').forEach((h) => h.replaceWith(rename(doc, h, 'h2')));
  body.querySelectorAll('h4,h5,h6').forEach((h) => h.replaceWith(rename(doc, h, 'h3')));

  // 2) paragraphes → listes / intertitres
  const children = Array.from(body.children);
  let i = 0;
  while (i < children.length) {
    const el = children[i];
    if (el.tagName === 'P') {
      const text = (el.textContent ?? '').trim();
      if (BULLET.test(text) || NUMBER.test(text)) {
        const ordered = !BULLET.test(text);
        const matcher = ordered ? NUMBER : BULLET;
        const list = doc.createElement(ordered ? 'ol' : 'ul');
        let j = i;
        while (j < children.length && children[j].tagName === 'P' && matcher.test((children[j].textContent ?? '').trim())) {
          const li = doc.createElement('li');
          li.innerHTML = stripMarker(children[j].innerHTML, matcher);
          list.appendChild(li);
          j++;
        }
        if (list.children.length >= 1) {
          children[i].replaceWith(list);
          for (let k = i + 1; k < j; k++) children[k].remove();
          i = j;
          continue;
        }
      } else if (text && (isAllBold(el) || isAllCaps(text)) && isShortTitle(text)) {
        const h = doc.createElement('h3');
        h.textContent = text;
        el.replaceWith(h);
      }
    }
    i++;
  }

  // 3) sauts de ligne multiples et paragraphes vides
  body.querySelectorAll('br + br').forEach((br) => br.remove());
  body.querySelectorAll('p').forEach((p) => {
    if (!p.textContent?.replace(/[\s ]/g, '') && !p.querySelector('br')) p.remove();
  });

  return sanitizeCampaignHtml(body.innerHTML);
}

function rename(doc: Document, el: Element, tag: string): Element {
  const next = doc.createElement(tag);
  next.innerHTML = el.innerHTML;
  return next;
}

/** Retire la puce ou le numéro tapé au début du premier nœud texte de l'élément. */
function stripMarker(innerHtml: string, marker: RegExp): string {
  const holder = new DOMParser().parseFromString(`<body>${innerHtml}</body>`, 'text/html').body;
  const walker = holder.ownerDocument.createTreeWalker(holder, NodeFilter.SHOW_TEXT);
  const first = walker.nextNode();
  if (first) first.textContent = (first.textContent ?? '').replace(marker, '');
  return holder.innerHTML;
}

/** Texte brut (fichier .txt, collage sans mise en forme) → paragraphes et sauts de ligne. */
export function plainTextToHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const isListLine = (line: string) => BULLET.test(line) || NUMBER.test(line);
  const html = text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // Une ligne de liste = son propre paragraphe (smartClean les regroupe ensuite en vraie liste) ;
      // les autres lignes consécutives restent dans un même paragraphe, séparées par des sauts de ligne.
      const parts: string[] = [];
      let run: string[] = [];
      const flush = () => {
        if (run.length) parts.push(`<p>${run.map(escape).join('<br>')}</p>`);
        run = [];
      };
      for (const line of block.split('\n')) {
        if (isListLine(line)) {
          flush();
          parts.push(`<p>${escape(line.trim())}</p>`);
        } else run.push(line.trim());
      }
      flush();
      return parts.join('');
    })
    .join('');
  return smartClean(html);
}

// ── Titre en tête de document ────────────────────────────────────────────

/** Si le document commence par un titre, le sépare du corps (sert à pré-remplir le titre de la campagne). */
export function extractLeadingTitle(html: string): { title: string | null; body: string } {
  const doc = parse(html);
  const first = doc.body.firstElementChild;
  if (first && ['H2', 'H3'].includes(first.tagName)) {
    const title = (first.textContent ?? '').trim();
    if (title && title.length <= 120) {
      first.remove();
      return { title, body: doc.body.innerHTML };
    }
  }
  return { title: null, body: html };
}

// ── Affichage ────────────────────────────────────────────────────────────

/** Texte brut d'un contenu (extrait des listes, aperçus, compteur de mots). */
export function htmlToText(html: string): string {
  const doc = parse(toEditorHtml(html));
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p,h2,h3,li,blockquote,tr').forEach((el) => el.append('\n'));
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Import de documents ─────────────────────────────────────────────────

export interface ImportedDocument {
  html: string;
  /** Images présentes dans le document et non reprises (elles se joignent à l'étape « Médias »). */
  imagesSkipped: number;
  warnings: string[];
}

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

/**
 * Importe un fichier rédigé hors de la plateforme : Word (.docx), texte (.txt), Markdown (.md) ou HTML.
 * Le résultat est déjà remis en forme et nettoyé.
 */
export async function importDocument(file: File): Promise<ImportedDocument> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Ce fichier est trop volumineux (10 Mo maximum).');
  const name = file.name.toLowerCase();

  if (name.endsWith('.doc')) {
    throw new Error("Le format Word ancien (.doc) n'est pas pris en charge. Ouvrez le document dans Word puis enregistrez-le au format .docx.");
  }

  if (name.endsWith('.docx')) {
    // Chargement à la demande : la librairie n'est téléchargée que si on importe un document.
    const mammoth = (await import('mammoth/mammoth.browser')).default;
    const result = await mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      {
        styleMap: ["p[style-name='Title'] => h2:fresh", "p[style-name='Titre'] => h2:fresh", "p[style-name='Subtitle'] => h3:fresh", "p[style-name='Sous-titre'] => h3:fresh"],
        // Les images Word (en base64) alourdiraient l'annonce : on les écarte et on le signale.
        convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })),
      }
    );
    const imagesSkipped = (result.value.match(/<img\b/gi) ?? []).length;
    const warnings = result.messages.filter((m) => m.type === 'warning').map((m) => m.message);
    return { html: smartClean(result.value), imagesSkipped, warnings: [...new Set(warnings)].slice(0, 3) };
  }

  const text = await file.text();
  if (name.endsWith('.html') || name.endsWith('.htm')) return { html: smartClean(text), imagesSkipped: (text.match(/<img\b/gi) ?? []).length, warnings: [] };
  if (name.endsWith('.md') || name.endsWith('.markdown')) return { html: smartClean(marked.parse(text, { async: false, breaks: true }) as string), imagesSkipped: 0, warnings: [] };
  if (name.endsWith('.txt')) return { html: plainTextToHtml(text), imagesSkipped: 0, warnings: [] };

  throw new Error('Format non pris en charge. Importez un document Word (.docx), un texte (.txt), un fichier Markdown (.md) ou HTML.');
}
