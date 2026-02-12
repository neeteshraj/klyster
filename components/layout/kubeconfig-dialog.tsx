"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, ClipboardPaste, Server } from "lucide-react";

export function KubeconfigDialog() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const kubeconfigSource = useStore((s) => s.kubeconfigSource);
  const setCustomKubeconfig = useStore((s) => s.setCustomKubeconfig);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [open, setOpen] = useState(false);

  const handleUseDefault = () => {
    setCustomKubeconfig(null, "default");
    setPasteValue("");
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (text.trim()) setCustomKubeconfig(text.trim(), "file");
      setOpen(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePasteApply = () => {
    const trimmed = pasteValue.trim();
    if (trimmed) setCustomKubeconfig(trimmed, "paste");
    setOpen(false);
  };

  useEffect(() => {
    if (open && kubeconfigSource === "paste" && customKubeconfig) {
      setPasteValue(customKubeconfig);
    }
    if (!open) setPasteValue("");
  }, [open, kubeconfigSource, customKubeconfig]);

  const sourceLabel =
    kubeconfigSource === "default"
      ? "Default (server)"
      : kubeconfigSource === "file"
        ? "From file"
        : "Pasted";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full min-w-0 justify-start gap-2 font-mono text-xs px-2">
          <Server className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate min-w-0">Kubeconfig: {sourceLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kubeconfig source</DialogTitle>
          <DialogDescription>
            Use the server&apos;s default config, load a file, or paste config. When set, it is sent with each API request.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={kubeconfigSource === "default" ? "default" : "outline"}
              size="sm"
              onClick={handleUseDefault}
              className="flex-1"
            >
              <Server className="mr-2 h-4 w-4" />
              Use default (server)
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml,*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant={kubeconfigSource === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Load from file
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kubeconfig-paste">Paste config</Label>
            <textarea
              id="kubeconfig-paste"
              placeholder="Paste kubeconfig YAML here…"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
            />
            <Button
              type="button"
              variant={kubeconfigSource === "paste" ? "default" : "outline"}
              size="sm"
              onClick={handlePasteApply}
              disabled={!pasteValue.trim()}
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Apply pasted config
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
