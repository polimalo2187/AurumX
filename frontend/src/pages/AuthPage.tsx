import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Phone, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const REGISTRATION_VERIFICATION_TOKEN_KEY = "aurumx_registration_verification_token";

type CountryOption = {
  flag: string;
  name: string;
  code: string;
};

const countries: CountryOption[] = [
  { flag: "🇺🇸", name: "Estados Unidos", code: "+1" },
  { flag: "🇨🇺", name: "Cuba", code: "+53" },
  { flag: "🇲🇽", name: "México", code: "+52" },
  { flag: "🇨🇴", name: "Colombia", code: "+57" },
  { flag: "🇪🇸", name: "España", code: "+34" },
  { flag: "🇩🇴", name: "Rep. Dominicana", code: "+1" },
  { flag: "🇦🇷", name: "Argentina", code: "+54" },
  { flag: "🇨🇱", name: "Chile", code: "+56" },
  { flag: "🇵🇪", name: "Perú", code: "+51" },
  { flag: "🇻🇪", name: "Venezuela", code: "+58" },
  { flag: "🇪🇨", name: "Ecuador", code: "+593" },
  { flag: "🇧🇷", name: "Brasil", code: "+55" },
  { flag: "🇺🇾", name: "Uruguay", code: "+598" },
  { flag: "🇵🇦", name: "Panamá", code: "+507" },
  { flag: "🇨🇷", name: "Costa Rica", code: "+506" },
  { flag: "🇬🇹", name: "Guatemala", code: "+502" },
  { flag: "🇸🇻", name: "El Salvador", code: "+503" },
  { flag: "🇭🇳", name: "Honduras", code: "+504" },
  { flag: "🇳🇮", name: "Nicaragua", code: "+505" },
  { flag: "🇵🇾", name: "Paraguay", code: "+595" }
];

const DEFAULT_COUNTRY: CountryOption = {
  flag: "🇺🇸",
  name: "Estados Unidos",
  code: "+1"
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "PHONE_NOT_VERIFIED") {
      return "Esta cuenta todavía no está verificada. Entra en Crear cuenta con el mismo teléfono para reenviar la verificación de Telegram.";
    }

    if (error.code === "INVALID_CREDENTIALS") {
      return "Usuario/teléfono o contraseña incorrectos.";
    }

    if (error.code === "TELEGRAM_LOGIN_NOT_VERIFIED") {
      return "Todavía no recibimos tu verificación desde Telegram. Comparte tu número con el botón oficial del bot.";
    }

    if (error.code === "TELEGRAM_LOGIN_SESSION_EXPIRED") {
      return "La sesión de verificación expiró. Crea una nueva cuenta o vuelve a solicitar verificación.";
    }

    if (error.code === "TELEGRAM_LOGIN_SESSION_NOT_FOUND") {
      return "No encontramos la sesión de verificación. Crea una nueva verificación.";
    }

    if (error.code === "PHONE_ALREADY_USED") {
      return "Este teléfono ya está registrado. Usa Iniciar sesión.";
    }

    if (error.code === "USERNAME_ALREADY_USED") {
      return "Este nombre de usuario ya existe. Elige otro.";
    }

    if (error.code === "WEAK_PASSWORD") {
      return "La contraseña debe tener al menos 8 caracteres.";
    }

    if (error.code === "NETWORK_ERROR") {
      return error.message;
    }

    if (error.code === "INTERNAL_ERROR") {
      return "El backend devolvió un error interno. Revisa los logs del backend en Railway.";
    }

    return `${error.message}${error.code ? ` (${error.code})` : ""}`;
  }

  if (error instanceof Error) return error.message;
  return "No se pudo completar la operación.";
}

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSession } = useAuth();

  const referralCode = params.get("ref") || undefined;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(countries[0] ?? DEFAULT_COUNTRY);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState(() => sessionStorage.getItem(REGISTRATION_VERIFICATION_TOKEN_KEY) || "");

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCode || ""
  });

  const fullPhonePreview = useMemo(() => {
    const phone = registerForm.phoneNumber.replace(/\D+/g, "");
    return phone ? `${selectedCountry.code}${phone}` : selectedCountry.code;
  }, [registerForm.phoneNumber, selectedCountry.code]);

  const register = useMutation({
    mutationFn: () => authApi.register({
      username: registerForm.username,
      countryCode: selectedCountry.code,
      phoneNumber: registerForm.phoneNumber,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      referralCode: registerForm.referralCode || undefined
    }),
    onSuccess(data) {
      setVerificationToken(data.verificationToken);
      sessionStorage.setItem(REGISTRATION_VERIFICATION_TOKEN_KEY, data.verificationToken);
      window.location.href = data.botUrl;
    }
  });

  const completeRegistration = useMutation({
    mutationFn: () => authApi.completeRegistration(verificationToken),
    onSuccess(data) {
      sessionStorage.removeItem(REGISTRATION_VERIFICATION_TOKEN_KEY);
      setSession(data.token, data.user);
      navigate("/dashboard", { replace: true });
    }
  });

  const login = useMutation({
    mutationFn: () => authApi.login(loginForm),
    onSuccess(data) {
      setSession(data.token, data.user);
      navigate("/dashboard", { replace: true });
    }
  });

  const error = register.error || completeRegistration.error || login.error;

  return (
    <main className="grid min-h-screen place-items-center bg-aurum-black bg-aurumGlow px-4 py-10 text-white">
      <Card className="w-full max-w-2xl p-6 md:p-8">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-aurum-gold text-3xl font-black text-black">A</div>
        <h1 className="text-3xl font-black md:text-5xl">AurumX Mining</h1>
        <p className="mt-3 text-zinc-400">Crea tu cuenta una sola vez y luego entra con usuario o teléfono y contraseña.</p>

        <div className="mt-7 grid grid-cols-2 rounded-2xl bg-black/30 p-1">
          <button onClick={() => setMode("login")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "login" ? "bg-aurum-gold text-black" : "text-zinc-400"}`}>Iniciar sesión</button>
          <button onClick={() => setMode("register")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "register" ? "bg-aurum-gold text-black" : "text-zinc-400"}`}>Crear cuenta</button>
        </div>

        {mode === "login" ? (
          <div className="mt-7 space-y-4">
            <FieldIcon icon={<UserRound size={18} />}>
              <input
                value={loginForm.identifier}
                onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                placeholder="Usuario o teléfono"
                className="w-full bg-transparent outline-none"
                autoComplete="username"
              />
            </FieldIcon>

            <PasswordField
              value={loginForm.password}
              onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              placeholder="Contraseña"
            />

            <Button className="w-full" onClick={() => login.mutate()} disabled={login.isPending || !loginForm.identifier || !loginForm.password}>
              {login.isPending ? "Entrando..." : "Iniciar sesión"}
            </Button>

            <button className="text-sm font-bold text-aurum-gold" onClick={() => setMode("register")}>
              ¿No tienes cuenta? Crear cuenta
            </button>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            <FieldIcon icon={<UserRound size={18} />}>
              <input
                value={registerForm.username}
                onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="Nombre de usuario"
                className="w-full bg-transparent outline-none"
                autoComplete="username"
              />
            </FieldIcon>

            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <select
                value={`${selectedCountry.code}|${selectedCountry.name}`}
                onChange={(event) => {
                  const [code, name] = event.target.value.split("|");
                  const next = countries.find((country) => country.code === code && country.name === name) ?? DEFAULT_COUNTRY;
                  setSelectedCountry(next);
                }}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 font-bold text-white outline-none"
              >
                {countries.map((country) => (
                  <option key={`${country.code}-${country.name}`} value={`${country.code}|${country.name}`}>
                    {country.flag} {country.code} {country.name}
                  </option>
                ))}
              </select>

              <FieldIcon icon={<Phone size={18} />}>
                <input
                  value={registerForm.phoneNumber}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  placeholder="Número de teléfono"
                  className="w-full bg-transparent outline-none"
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </FieldIcon>
            </div>

            <p className="rounded-2xl bg-black/30 px-4 py-3 text-sm text-zinc-400">
              Número que se verificará: <strong className="text-aurum-gold">{fullPhonePreview}</strong>
            </p>

            <PasswordField
              value={registerForm.password}
              onChange={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
              show={showRegisterPassword}
              onToggle={() => setShowRegisterPassword((value) => !value)}
              placeholder="Contraseña"
            />

            <PasswordField
              value={registerForm.confirmPassword}
              onChange={(value) => setRegisterForm((current) => ({ ...current, confirmPassword: value }))}
              show={showRegisterPassword}
              onToggle={() => setShowRegisterPassword((value) => !value)}
              placeholder="Confirmar contraseña"
            />

            <FieldIcon icon={<UserRound size={18} />}>
              <input
                value={registerForm.referralCode}
                onChange={(event) => setRegisterForm((current) => ({ ...current, referralCode: event.target.value.toUpperCase() }))}
                placeholder="Código de referido (opcional)"
                className="w-full bg-transparent uppercase outline-none"
              />
            </FieldIcon>

            <Button
              className="w-full"
              onClick={() => register.mutate()}
              disabled={register.isPending || !registerForm.username || !registerForm.phoneNumber || !registerForm.password || !registerForm.confirmPassword}
            >
              {register.isPending ? "Creando cuenta..." : "Crear cuenta y verificar Telegram"}
            </Button>

            <Button
              className="w-full"
              variant="secondary"
              onClick={() => completeRegistration.mutate()}
              disabled={!verificationToken || completeRegistration.isPending}
            >
              {completeRegistration.isPending ? "Validando..." : "Ya compartí mi número, completar registro"}
            </Button>

            {verificationToken ? (
              <p className="rounded-2xl bg-aurum-gold/10 px-4 py-3 text-sm text-aurum-gold">
                Verificación creada. Comparte en Telegram el mismo número que escribiste en el registro y vuelve para completar.
              </p>
            ) : null}

            <button className="text-sm font-bold text-aurum-gold" onClick={() => setMode("login")}>
              Ya tengo cuenta, iniciar sesión
            </button>
          </div>
        )}

        {error ? <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{getErrorMessage(error)}</p> : null}
      </Card>
    </main>
  );
}

function FieldIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-zinc-300">
      <span className="text-aurum-gold">{icon}</span>
      {children}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-zinc-300">
      <Lock size={18} className="text-aurum-gold" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
        type={show ? "text" : "password"}
        autoComplete="new-password"
      />
      <button type="button" onClick={onToggle} className="text-zinc-400 hover:text-aurum-gold" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
