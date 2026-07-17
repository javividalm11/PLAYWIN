"use client";

import { useRef, useState } from "react";

/** Recorta al centro y redimensiona en el navegador → webp 256px. */
async function resizeToSquareWebp(file: File, size = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
  bmp.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("no-blob"))),
      "image/webp",
      0.85,
    );
  });
}

/** Foto de perfil con subida/cambio. */
export function AvatarUploader({
  initialUrl,
  fallbackInitial,
}: {
  initialUrl: string | null;
  fallbackInitial: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no soportado (usa JPG, PNG o WebP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen supera 8MB");
      return;
    }

    setBusy(true);
    try {
      const blob = await resizeToSquareWebp(file);
      const form = new FormData();
      form.append("file", new File([blob], "avatar.webp", { type: "image/webp" }));
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const body = (await res.json()) as { avatarUrl?: string; error?: string };
      if (!res.ok || !body.avatarUrl) {
        setError(body.error ?? "No se pudo subir la imagen");
        return;
      }
      setUrl(body.avatarUrl);
      // Notificar al header para que refresque el avatar
      window.dispatchEvent(new CustomEvent("pw:avatar-updated", { detail: body.avatarUrl }));
    } catch {
      setError("No se pudo procesar la imagen. Prueba con otra.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL con cache-busting dinámico
          <img
            src={url}
            alt="Foto de perfil"
            width={88}
            height={88}
            className="h-22 w-22 rounded-full border-2 border-pitch-500 object-cover"
          />
        ) : (
          <span className="flex h-22 w-22 items-center justify-center rounded-full border-2 border-pitch-500 bg-pitch-600 text-3xl font-bold text-silver-300">
            {fallbackInitial.toUpperCase()}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-pitch-950/70">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
          </span>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          className="hidden"
          id="avatar-input"
        />
        <label
          htmlFor="avatar-input"
          className="inline-block cursor-pointer rounded-xl border border-pitch-500 px-4 py-2 text-sm font-semibold text-silver-300 transition-colors hover:border-brand-500/60 hover:text-white"
        >
          {url ? "Cambiar foto" : "Subir foto"}
        </label>
        <p className="mt-1.5 text-[11px] text-silver-600">JPG, PNG o WebP</p>
        {error && <p className="mt-1 text-xs text-risk-500">{error}</p>}
      </div>
    </div>
  );
}
