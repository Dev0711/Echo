'use client';
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState, useMemo } from "react";
import "./blocknote-dark.css";

export interface EditorSelection {
  from: number;
  to: number;
  text: string;
}

export interface BlockEditorHandle {
  appendMarkdown: (text: string) => Promise<void>;
  replaceMarkdown: (text: string) => Promise<void>;
  getSelection: () => EditorSelection | null;
  replaceRange: (from: number, to: number, text: string) => Promise<void>;
}

interface BlockEditorProps {
  structuredContent?: string | null;
  markdownContent?: string | null;
  onChange: (structuredContent: string, markdownOutput: string) => void;
  editorRef?: React.MutableRefObject<BlockEditorHandle | null>;
}

/**
 * Resolves the initial blocks once, then mounts the real editor. BlockNote creates its editor
 * instance a single time, so it must not be created before the initial content is known
 * (otherwise opening an existing post shows an empty editor).
 */
export default function BlockEditor(props: BlockEditorProps) {
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    async function loadBlocks() {
      const { structuredContent, markdownContent } = props;
      if (structuredContent) {
        try {
          const parsed = JSON.parse(structuredContent);
          if (!cancelled) setInitialBlocks(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse structuredContent", e);
        }
      }
      // One-way migration: no structured content yet, but we have markdown.
      if (markdownContent && markdownContent.trim() !== '') {
        try {
          const tempEditor = BlockNoteEditor.create();
          const blocks = await tempEditor.tryParseMarkdownToBlocks(markdownContent);
          if (!cancelled) setInitialBlocks(blocks);
          return;
        } catch (e) {
          console.error("Failed to parse markdown", e);
        }
      }
      if (!cancelled) setInitialBlocks(undefined);
    }
    void loadBlocks();
    return () => { cancelled = true; };
    // Intentionally once per mount: the parent remounts this component (key) for each post.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initialBlocks === "loading") {
    return <div className="h-32 flex items-center justify-center text-[#71717a] text-[13px]">Loading editor…</div>;
  }
  return <BlockEditorInner {...props} initialBlocks={initialBlocks} />;
}

function BlockEditorInner({ onChange, editorRef, initialBlocks }: BlockEditorProps & { initialBlocks: PartialBlock[] | undefined }) {
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
  });

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = {
        appendMarkdown: async (text: string) => {
          const blocks = await editor.tryParseMarkdownToBlocks(text);
          if (editor.document.length > 0) {
            editor.insertBlocks(blocks, editor.document[editor.document.length - 1], "after");
          } else {
            editor.replaceBlocks(editor.document, blocks);
          }
          const astJson = JSON.stringify(editor.document);
          const mdOut = await editor.blocksToMarkdownLossy(editor.document);
          onChange(astJson, mdOut);
        },
        replaceMarkdown: async (text: string) => {
          const blocks = await editor.tryParseMarkdownToBlocks(text);
          editor.replaceBlocks(editor.document, blocks);
          const astJson = JSON.stringify(editor.document);
          const mdOut = await editor.blocksToMarkdownLossy(editor.document);
          onChange(astJson, mdOut);
        },
        getSelection: () => {
          const state = editor.prosemirrorState;
          const { from, to } = state.selection;
          if (from === to) return null;
          // Use explicit block separators so multi-paragraph selections don't
          // arrive at the AI with words glued together.
          const text = state.doc.textBetween(from, to, "\n\n", " ");
          return text.trim() ? { from, to, text } : null;
        },
        replaceRange: async (from: number, to: number, text: string) => {
          editor.transact((tr) => {
            tr.insertText(text, from, to);
          });
          const astJson = JSON.stringify(editor.document);
          const mdOut = await editor.blocksToMarkdownLossy(editor.document);
          onChange(astJson, mdOut);
        }
      };
    }
  }, [editor, editorRef, onChange]);

  return (
    <div className="flex flex-col blocknote-custom-wrapper relative">
      <BlockNoteView 
        editor={editor} 
        theme="dark"
        className="w-full"
        onChange={async () => {
          const blocks = editor.document;
          const astJson = JSON.stringify(blocks);
          const markdownOut = await editor.blocksToMarkdownLossy(blocks);
          onChange(astJson, markdownOut);
        }}
      />
    </div>
  );
}
