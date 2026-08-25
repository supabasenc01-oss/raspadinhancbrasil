import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileUrl } from "@/hooks/useFileUrl";
import type { PlatformBucket } from "@/lib/storage";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 4 * 1024 * 1024;

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bucket?: PlatformBucket;
  prefix?: string;
  hint?: string;
  id: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  bucket = "scratch-cards",
  prefix = "",
  hint,
  id,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useFileUrl(value);

  const upload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo de 4MB.");
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          resolve(typeof result === "string" ? result.split(",")[1] ?? "" : "");
        };
        reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
        reader.readAsDataURL(file);
      });

      const { callEdgeFunction } = await import("@/lib/edge-functions");
      const result = await callEdgeFunction<{ path: string | null; error: string | null }>(
        "upload-platform-file",
        { bucket, fileName: file.name, fileType: file.type, base64Data, prefix },
      );

      if (result.error) throw new Error(result.error);
      if (!result.path) throw new Error("Upload não retornou o caminho do arquivo.");

      onChange(result.path);
      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro no upload: " + (error instanceof Error ? error.message : "desconhecido"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`flex items-center gap-4 rounded-xl border border-dashed p-3 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-background/40"
        }`}
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-surface flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground/50" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {hint ?? "Arraste uma imagem aqui ou selecione um arquivo (PNG, JPG, WebP, SVG — até 4MB)."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
              {isUploading ? "Enviando..." : "Selecionar imagem"}
            </Button>
            {value ? (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
                <Trash2 className="mr-2 size-4" /> Remover
              </Button>
            ) : null}
          </div>
          <Input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="URL ou caminho do arquivo (opcional)"
            className="h-8 text-xs"
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
