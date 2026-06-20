import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const TELEGRAM_VERIFICATION_TOKEN_KEY = "aurumx_telegram_verification_token";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "TELEGRAM_LOGIN_NOT_VERIFIED") {
      return "Todavía no recibimos tu verificación desde Telegram. Abre el bot, toca /start si hace falta y comparte tu número con el botón oficial.";
    }

    if (error.code === "TELEGRAM_LOGIN_SESSION_EXPIRED") {
      return "La sesión de Telegram expiró. Crea una nueva verificación.";
    }

    if (error.code === "TELEGRAM_LOGIN_SESSION_NOT_FOUND") {
      return "No encontramos la sesión de Telegram. Crea una nueva verificación.";
    }

    if (error.code === "VALIDATION_ERROR") {
      return "La sesión local no es válida. Crea una nueva verificación.";
    }

    return `${error.message}${error.code ? ` (${error.code})` : ""}`;
  }

  if (error instanceof Error) return error.message;
  return "No se pudo completar la autenticación.";
}

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSession } = useAuth();
  const [verificationToken, setVerificationToken] = useState(() => sessionStorage.getItem(TELEGRAM_VERIFICATION_TOKEN_KEY) || "");
  const referralCode = params.get("ref") || undefined;

  const startLogin = useMutation({
    mutationFn: () => authApi.startTelegramLogin(referralCode),
    onSuccess(data) {
      setVerificationToken(data.verificationToken);
      sessionStorage.setItem(TELEGRAM_VERIFICATION_TOKEN_KEY, data.verificationToken);
      window.location.href = data.botUrl;
    }
  });

  const completeLogin = useMutation({
    mutationFn: () => authApi.completeTelegramLogin(verificationToken),
    onSuccess(data) {
      sessionStorage.removeItem(TELEGRAM_VERIFICATION_TOKEN_KEY);
      setSession(data.token, data.user);
      navigate("/dashboard", { replace: true });
    }
  });

  const error = startLogin.error || completeLogin.error;

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
          <Button variant="secondary" onClick={() => completeLogin.mutate()} disabled={!verificationToken || completeLogin.isPending}>
            {completeLogin.isPending ? "Validando..." : "Ya compartí mi número, completar login"}
          </Button>
        </div>

        {verificationToken ? <p className="mt-4 text-sm text-aurum-gold">Sesión creada. Abre el bot, comparte tu teléfono y vuelve para completar.</p> : null}
        {error ? <p className="mt-4 text-sm text-red-300">{getErrorMessage(error)}</p> : null}
      </Card>
    </main>
  );
}
