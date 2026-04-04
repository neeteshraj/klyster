"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store/use-store";
import type { EditorProps } from "@monaco-editor/react";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

export function ThemedEditor(props: EditorProps) {
  const theme = useStore((s) => s.theme);

  return (
    <MonacoEditor
      {...props}
      theme={theme === "dark" ? "vs-dark" : "light"}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        fontSize: 13,
        lineHeight: 20,
        padding: { top: 12 },
        ...props.options,
      }}
    />
  );
}
