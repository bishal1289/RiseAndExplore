import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import type { L } from '../lib/types';
import { LangTabs } from './ui';
import { cn } from '../../lib/utils';

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    cn('grid h-9 w-9 place-items-center rounded-lg transition-colors', active ? 'bg-navy text-white' : 'text-navy hover:bg-card');
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (leave empty to remove)', prev ?? 'https://');
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const items = [
    { icon: Bold, label: 'Bold', run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, label: 'Italic', run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: Heading2, label: 'Heading', run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading') },
    { icon: List, label: 'Bulleted list', run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Quote, label: 'Quote', run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { icon: LinkIcon, label: 'Link', run: setLink, active: editor.isActive('link') },
    { icon: Undo, label: 'Undo', run: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo, label: 'Redo', run: () => editor.chain().focus().redo().run(), active: false },
  ];
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-1 border-b border-navy/10 p-1.5">
      {items.map(({ icon: Icon, label, run, active }) => (
        <button key={label} type="button" onClick={run} aria-label={label} aria-pressed={active} title={label} className={btn(active)}>
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function SingleEditor({ html, onChange, lang }: { html: string; onChange: (html: string) => void; lang: string }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), LinkExt.configure({ openOnClick: false })],
    content: html,
    editorProps: {
      attributes: {
        class: 'prose-rise min-h-[180px] px-4 py-3 focus:outline-none',
        lang,
        'aria-label': `Description (${lang === 'en' ? 'English' : 'Spanish'})`,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.isEmpty ? '' : e.getHTML()),
  });

  // Sync external changes (e.g. form reset) without clobbering typing.
  useEffect(() => {
    if (editor && html !== editor.getHTML() && !(html === '' && editor.isEmpty)) {
      editor.commands.setContent(html, false);
    }
  }, [html, editor]);

  if (!editor) return <div className="min-h-[220px]" />;
  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

/** TipTap rich-text editor with English / Spanish tabs. */
export function RichText({ label, value, onChange, hint }: { label: string; value: L; onChange: (v: L) => void; hint?: string }) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const valueRef = useRef(value);
  valueRef.current = value;
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-navy">{label}</span>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <LangTabs lang={lang} setLang={setLang} value={value} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-navy/15 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        {/* Separate editor per language keeps undo history independent. */}
        <div hidden={lang !== 'en'}>
          <SingleEditor html={value.en} lang="en" onChange={(en) => onChange({ ...valueRef.current, en })} />
        </div>
        <div hidden={lang !== 'es'}>
          <SingleEditor html={value.es} lang="es" onChange={(es) => onChange({ ...valueRef.current, es })} />
        </div>
      </div>
    </div>
  );
}
