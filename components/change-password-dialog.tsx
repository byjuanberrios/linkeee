"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChangePasswordDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ChangePasswordDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!current || !next || !confirm) {
      setError("Completa los tres campos");
      return;
    }
    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (next !== confirm) {
      setError("La nueva contraseña y su confirmación no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo cambiar la contraseña");
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Usa la nueva contraseña la próxima vez que inicies sesión.",
      });
      reset();
      setOpen(false);
    } catch {
      setError("No se pudo contactar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle className="font-mono text-base">
          cambiar contraseña
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="current-pw"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Contraseña actual
          </Label>
          <Input
            id="current-pw"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="new-pw"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Nueva contraseña
          </Label>
          <Input
            id="new-pw"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="mínimo 8 caracteres"
            autoComplete="new-password"
            required
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirm-pw"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
          >
            Confirmar nueva
          </Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="repite la nueva contraseña"
            autoComplete="new-password"
            required
            className="font-mono text-sm"
          />
        </div>

        {error && (
          <p className="font-mono text-[11px] text-destructive border-l-2 border-destructive pl-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-xs font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              guardando…
            </>
          ) : (
            "actualizar contraseña"
          )}
        </Button>
      </form>
    </DialogContent>
  );

  // Controlado: el padre abre/cierra. No renderizamos trigger.
  if (isControlled) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        {dialogContent}
      </Dialog>
    );
  }

  // No controlado: usa trigger propio.
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      {trigger}
      {dialogContent}
    </Dialog>
  );
}