// src/components/ui/rich-text/RichTextEditor.tsx
//
// Éditeur visuel pour les agents : on met en forme comme dans Word (gras, italique,
// listes, liens, intertitres, tableaux) sans jamais voir de balises. On peut aussi
// coller un texte copié depuis Word, ou importer/glisser un document (.docx, .txt,
// .md, .html) : il est remis en forme et nettoyé automatiquement (voir lib/campaignHtml.ts).
// La valeur échangée avec le parent est un HTML déjà nettoyé (liste blanche stricte).

import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Minus,
  Table as TableIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  FileUp,
  Loader2,
} from 'lucide-react';
import { importDocument, extractLeadingTitle, sanitizeCampaignHtml, smartClean, toEditorHtml } from '../../../lib/campaignHtml';
import './rich-content.css';

interface RichTextEditorProps {
  /** HTML enregistré (ou Markdown / texte hérité d'anciennes campagnes : converti à l'ouverture). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Si le titre de la campagne est vide, le titre en tête d'un document importé peut le remplacer. */
  titleIsEmpty?: boolean;
  onTitleFromDocument?: (title: string) => void;
}

const IMPORT_ACCEPT = '.docx,.txt,.md,.markdown,.html,.htm';
const IMPORTABLE = /\.(docx|doc|txt|md|markdown|html?)$/i;

function ToolButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // onMouseDown : évite de faire perdre la sélection à l'éditeur au clic
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700 ${
        active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : ''
      }`}
    >
      {children}
    </button>
  );
}

const Separator = () => <span className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'Rédigez votre message…', titleIsEmpty = false, onTitleFromDocument }) => {
  const lastEmitted = useRef<string>(toEditorHtml(value));
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const importRef = useRef<(file: File) => Promise<void>>(async () => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['mailto', 'tel'] },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: lastEmitted.current,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: 'rich-content text-gray-800 dark:text-gray-100' },
      // Texte copié depuis Word / le web : remis en forme et nettoyé avant insertion.
      transformPastedHTML: (html) => smartClean(html),
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (file && IMPORTABLE.test(file.name)) {
          event.preventDefault();
          void importRef.current(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : sanitizeCampaignHtml(ed.getHTML());
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Contenu modifié depuis l'extérieur (chargement d'une campagne existante…) : on resynchronise l'éditeur.
  useEffect(() => {
    if (!editor) return;
    const incoming = toEditorHtml(value);
    if (incoming !== lastEmitted.current) {
      lastEmitted.current = incoming;
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleImport = async (file: File) => {
    if (!editor) return;
    setNotice(null);
    setImporting(true);
    try {
      const doc = await importDocument(file);
      let html = doc.html;
      if (titleIsEmpty && onTitleFromDocument) {
        const { title, body } = extractLeadingTitle(html);
        if (title) {
          onTitleFromDocument(title);
          html = body;
        }
      }
      if (!html.trim()) {
        setNotice({ tone: 'error', text: 'Aucun texte n’a pu être lu dans ce document.' });
        return;
      }
      if (!editor.isEmpty && !window.confirm('Le contenu actuel sera remplacé par celui du document. Continuer ?')) return;
      editor.commands.setContent(html, { emitUpdate: true });
      const extras: string[] = [];
      if (doc.imagesSkipped > 0) extras.push(`${doc.imagesSkipped} image${doc.imagesSkipped > 1 ? 's' : ''} non reprise${doc.imagesSkipped > 1 ? 's' : ''} : ajoutez-les à l'étape « Médias »`);
      extras.push(...doc.warnings);
      setNotice({ tone: 'info', text: `« ${file.name} » importé et mis en forme.${extras.length ? ` ${extras.join(' · ')}.` : ''} Relisez le résultat avant de continuer.` });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : "Le document n'a pas pu être importé." });
    } finally {
      setImporting(false);
    }
  };
  importRef.current = handleImport;

  if (!editor) return null;

  const applyLink = () => {
    let url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      if (!/^(https?:|mailto:|tel:)/i.test(url)) url = url.includes('@') && !url.includes('/') ? `mailto:${url}` : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  };

  const openLink = () => {
    setLinkUrl((editor.getAttributes('link').href as string | undefined) ?? '');
    setLinkOpen(true);
  };

  const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rich-editor overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-300 bg-gray-50 p-1.5 dark:border-gray-600 dark:bg-gray-800">
        <ToolButton label="Annuler" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Rétablir" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <Separator />
        <ToolButton label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Barré" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        <Separator />
        <ToolButton label="Titre de section" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Sous-titre" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <Separator />
        <ToolButton label="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Ligne de séparation" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolButton>
        <Separator />
        <ToolButton label="Lien" active={editor.isActive('link')} onClick={openLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Retirer le lien" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}>
          <Unlink className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Insérer un tableau" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Effacer la mise en forme" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolButton>

        <div className="ml-auto flex items-center">
          <input
            ref={fileInput}
            type="file"
            accept={IMPORT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void handleImport(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Importer un document Word (.docx), un texte (.txt), Markdown (.md) ou HTML"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Importer un document
          </button>
        </div>
      </div>

      {editor.isActive('table') && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800/60">
          <span className="font-medium text-gray-500">Tableau :</span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()} className="rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700">+ ligne</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()} className="rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700">+ colonne</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} className="rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700">− ligne</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} className="rounded px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700">− colonne</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} className="rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Supprimer le tableau</button>
        </div>
      )}

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-brand-50/50 px-3 py-2 dark:border-gray-700 dark:bg-brand-900/10">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Adresse du lien</span>
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
            placeholder="https://www.exemple.ml ou adresse email"
            className="min-w-[14rem] flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          <button type="button" onClick={applyLink} className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700">
            Appliquer
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700">
            Annuler
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <span>
          {words} mot{words > 1 ? 's' : ''}
        </span>
        <span>Astuce : collez un texte depuis Word ou glissez un document ici — la mise en forme est reprise automatiquement.</span>
      </div>

      {notice && (
        <div className={`border-t px-3 py-2 text-xs ${notice.tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}>{notice.text}</div>
      )}
    </div>
  );
};

export default RichTextEditor;
