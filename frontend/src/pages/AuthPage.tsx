import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const [sessionToken, setSessionToken] = useState("");
  const referralCode = params.get("ref") || undefined;

  const startLogin = useMutation({
    mutationFn: () => authApi.startTelegramLogin(referralCode),
    onSuccess(data) {
      setSessionToken(data.sessionToken);
      window.open(data.botUrl, "_blank", "noopener,noreferrer");
    }
  });

  const completeLogin = useMutation({
    mutationFn: () => authApi.completeTelegramLogin(sessionToken),
    onSuccess(data) {
      setSession(data.token, data.user);
      navigate("/dashboard", { replace: true });
    }
  });

  return (
    <main className="grid min-h-screen place-items-center bg-aurum-black bg-aurumGlow px-4 text-white">
      <Card className="w-full max-w-xl p-8">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-aurum-gold text-3xl font-black text-black">A</div>
        <h1 className="text-3xl font-black">Entrar a AurumX</h1>
        <p className="mt-3 text-zinc-400">La verificación se realiza por Telegram. Debes compartir tu número desde el botón oficial del bot.</p>

        <div className="mt-8 grid gap-3">
          <Button onClick={() => startLogin.mutate()} disabled={startLogin.isPending}>
            {startLogin.isPending ? "Creando sesión..." : "Verificar con Telegram"}
          </Button>
          <Button variant="secondary" onClick={() => completeLogin.mutate()} disabled={!sessionToken || completeLogin.isPending}>
            {completeLogin.isPending ? "Validando..." : "Ya compartí mi número, completar login"}
          </Button>
        </div>

        {sessionToken ? <p className="mt-4 text-sm text-aurum-gold">Sesión creada. Abre el bot, comparte tu teléfono y vuelve para completar.</p> : null}
        {startLogin.error || completeLogin.error ? <p className="mt-4 text-sm text-red-300">No se pudo completar la autenticación.</p> : null}
      </Card>
    </main>
  );
}
