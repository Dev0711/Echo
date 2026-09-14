'use client';
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useState, useMemo } from "react";
import "./blocknote-dark.css";

export interface BlockEditorHandle {
  appendMarkdown: (text: string) => Promise<void>;
  replaceMarkdown: (text: string) => Promise<void>;
}

interface BlockEditorProps {
  structuredContent?: string | null;
  markdownContent?: string | null;
  onChange: (structuredContent: string, markdownOutput: string) => void;
  editorRef?: React.MutableRefObject<BlockEditorHandle | null>;
}

export default function BlockEditor({ structuredContent, markdownContent, onChange, editorRef }: BlockEditorProps) {
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined | "loading">("loading");

  useEffect(() => {
    async function loadBlocks() {
      if (structuredContent) {
        try {
          const parsed = JSON.parse(structuredContent);
          setInitialBlocks(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse structuredContent", e);
        }
      }
      
      // One-way migration: If no structuredContent, but we have markdown, parse it!
      if (markdownContent && markdownContent.trim() !== '') {
        try {
          const tempEditor = BlockNoteEditor.create();
          const blocks = await tempEditor.tryParseMarkdownToBlocks(markdownContent);
          setInitialBlocks(blocks);
          return;
        } catch (e) {
          console.error("Failed to parse markdown", e);
        }
      }

      // Default empty
      setInitialBlocks(undefined);
    }
    
    loadBlocks();
  }, [structuredContent, markdownContent]);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks === "loading" ? undefined : initialBlocks,
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
        }
      };
    }
  }, [editor, editorRef, onChange]);

  if (initialBlocks === "loading") {
    return <div className="h-full flex items-center justify-center text-[#a1a1aa]">Loading editor...</div>;
  }

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
