"use client";

import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Code, Quote, Undo2, Redo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  editable: boolean;
  onSelection?: (line: number) => void;
}

export function Editor({ content, onChange, editable, onSelection }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: (content && Object.keys(content).length > 0) ? content : '',
    editable,
    onUpdate: ({ editor }: { editor: TiptapEditor }) => {
      onChange(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelection && editor.isFocused) {
        const line = editor.state.doc.resolve(editor.state.selection.$anchor.pos).index(0) + 1;
        onSelection(line);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] px-1 py-3 text-sm leading-relaxed text-foreground',
      },
    },
  });

  // Keep editor content in sync if changed externally (e.g. from version restore or db load)
  useEffect(() => {
    if (editor && content) {
      // Avoid setting content if both the incoming content and editor are empty to prevent cursor jump on load
      const isEmptyContent = Object.keys(content).length === 0;
      const isEditorEmpty = editor.isEmpty;
      if (isEmptyContent && isEditorEmpty) return;

      const isSame = JSON.stringify(editor.getJSON()) === JSON.stringify(content);
      if (!isSame) {
        // Capture active selection indexes
        const { from, to } = editor.state.selection;
        
        // Pass empty string if content is an empty object
        const contentToSet = Object.keys(content).length > 0 ? content : '';
        editor.commands.setContent(contentToSet, false);
        
        // Restore selection safely after rewrite
        try {
          editor.commands.setTextSelection({ from, to });
        } catch (_) {
          // Ignores errors if selection index is out of bounds (doc shrunk)
        }
      }
    }
  }, [content, editor]);

  // Handle editable prop change
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className="w-full border rounded-lg bg-card overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold')}
            aria-label="Toggle Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic')}
            aria-label="Toggle Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            data-active={editor.isActive('underline')}
            aria-label="Toggle Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor.isActive('heading', { level: 1 })}
            aria-label="Toggle Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor.isActive('heading', { level: 2 })}
            aria-label="Toggle Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            data-active={editor.isActive('heading', { level: 3 })}
            aria-label="Toggle Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive('bulletList')}
            aria-label="Toggle Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive('orderedList')}
            aria-label="Toggle Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            data-active={editor.isActive('codeBlock')}
            aria-label="Toggle Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            data-active={editor.isActive('blockquote')}
            aria-label="Toggle Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-4 bg-background max-h-[600px] overflow-y-auto scrollbar-thin">
        <EditorContent editor={editor} />
      </div>
      
      {/* Dynamic styling for active toolbar buttons */}
      <style jsx global>{`
        button[data-active="true"] {
          background-color: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
        }
      `}</style>
    </div>
  );
}
