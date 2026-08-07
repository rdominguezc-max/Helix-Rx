"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import {
  firebaseConfigured,
  login,
  logout,
  observeAuth,
} from "../lib/firebase-client";
import {
  liveApiConfigured,
  loadTodayDashboard,
  recordDoseTaken,
  type DashboardData,
} from "../lib/helix-api";
import {
  listPasswordRecoveryRequests,
  requestPasswordRecovery,
  resolvePasswordRecoveryRequest,
  type PasswordRecoveryRequest,
} from "../lib/password-recovery-api";
import { PwaInstallButton } from "./pwa-install-button";

type View = "Hoy" | "Tratamiento" | "Progreso" | "Alertas";

const nav: { label: View; glyph: string }[] = [
  { label: "Hoy", glyph: "⌂" },
  { label: "Tratamiento", glyph: "✚" },
  { label: "Progreso", glyph: "↗" },
  { label: "Alertas", glyph: "!" },
];

export default function Home() {
  const [view, setView] = useState<View>("Hoy");
  const [doseTaken, setDoseTaken] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [savingDose, setSavingDose] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [recoveryRequests, setRecoveryRequests] = useState<PasswordRecoveryRequest[]>([]);
  const [adminExperience, setAdminExperience] = useState(false);

  useEffect(
    () =>
      observeAuth((nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
      }),
    [],
  );

  useEffect(() => {
    if (!user || !liveApiConfigured) {
      setDashboard(null);
      return;
    }
    setLoadingLive(true);
    void loadTodayDashboard(user)
      .then(setDashboard)
      .catch((error) =>
        setAuthError(
          error instanceof Error ? error.message : "No se pudo cargar el panel",
        ),
      )
      .finally(() => setLoadingLive(false));
  }, [user]);


  useEffect(() => {
    if (!user) {
      setRecoveryRequests([]);
      setAdminExperience(false);
      return;
    }
    void listPasswordRecoveryRequests(user)
      .then((requests) => {
        setRecoveryRequests(requests);
        setAdminExperience(true);
      })
      .catch(() => {
        setRecoveryRequests([]);
        setAdminExperience(false);
      });
  }, [user]);

  async function resolveRecovery(id: string) {
    if (!user) return;
    await resolvePasswordRecoveryRequest(user, id);
    setRecoveryRequests((current) => current.filter((item) => item.id !== id));
  }
  const nextDose = dashboard?.doses.find((dose) => dose.status === "scheduled");
  const medicationName = dashboard?.medicationName ?? "Levetiracetam";
  const doseLabel = dashboard?.doseLabel ?? "500 mg · 1 tableta";
  const adherence = Math.round((dashboard?.adherenceRate ?? 0.92) * 100);
  const inventoryDays = Math.max(
    0,
    Math.round(dashboard?.estimatedDaysRemaining ?? 6),
  );

  async function markDoseTaken() {
    setAuthError("");
    if (!user || !liveApiConfigured) {
      setDoseTaken(true);
      return;
    }
    setSavingDose(true);
    try {
      const scheduledFor = nextDose?.scheduledFor ?? (() => {
        const scheduled = new Date();
        scheduled.setHours(9, 0, 0, 0);
        return scheduled.toISOString();
      })();
      await recordDoseTaken(user, scheduledFor);
      setDoseTaken(true);
      setDashboard((current) =>
        current
          ? {
              ...current,
              doses: current.doses.map((dose) =>
                dose.scheduledFor === scheduledFor
                  ? { ...dose, status: "fulfilled" }
                  : dose,
              ),
            }
          : current,
      );
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "No se pudo registrar la dosis",
      );
    } finally {
      setSavingDose(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">h</span> helix</div>
        <nav aria-label="Navegación principal">
          {nav.map((item) => (
            <button
              key={item.label}
              className={view === item.label ? "navItem active" : "navItem"}
              onClick={() => setView(item.label)}
            >
              <span>{item.glyph}</span>{item.label}
              {item.label === "Alertas" && <i>{2 + recoveryRequests.length}</i>}
            </button>
          ))}
        </nav>
        <div className="careCard">
          <span>Equipo de cuidado</span>
          <strong>Dra. Ana Martínez</strong>
          <small>Clínica Santa Elena</small>
          <button>Ver contactos</button>
        </div>
        <div className="profile">
          <div className="avatar">RM</div>
          <div>
            <strong>{user?.displayName ?? user?.email ?? "Roberto M."}</strong>
            <small>{user ? "Sesión conectada" : "Modo demostración"}</small>
          </div>
          <button
            aria-label={user ? "Cerrar sesión" : "Iniciar sesión"}
            onClick={() => user ? void logout() : setShowLogin(true)}
          >
            {user ? "↪" : "•••"}
          </button>
        </div>
      </aside>

      <section className="content">
        <div className={user && liveApiConfigured ? "modeBanner live" : "modeBanner"}>
          <span>
            {user && liveApiConfigured
              ? loadingLive ? "● Sincronizando con Helix…" : "● Conectado a Helix"
              : "Vista demostrativa · datos simulados"}
          </span>
          <div className="modeActions">
            <PwaInstallButton />
            {firebaseConfigured && !user && (
              <button onClick={() => setShowLogin(true)}>Iniciar sesión</button>
            )}
          </div>
        </div>
        <header>
          <div>
            <p className="eyebrow">JUEVES, 30 DE JULIO</p>
            <h1>{view === "Hoy" ? "Buenos días, Roberto" : view}</h1>
            <p>{subtitle(view)}</p>
          </div>
          <button className="bell" aria-label="Notificaciones">♢<b>2</b></button>
        </header>

        {view === "Hoy" && (
          <>
            <section className="heroCard">
              <div className="heroCopy">
                <p className="eyebrow light">SIGUIENTE DOSIS</p>
                <h2>{doseTaken ? "Dosis registrada" : "En 24 minutos"}</h2>
                <div className="medicineLine">
                  <span className="pillIcon">●</span>
                  <div><strong>{medicationName}</strong><small>{doseLabel}</small></div>
                </div>
                <div className="heroActions">
                  <button
                    className="primary"
                    onClick={() => void markDoseTaken()}
                    disabled={savingDose}
                  >
                    {doseTaken
                      ? "✓ Tomada a las 9:00"
                      : savingDose
                        ? "Registrando…"
                        : "Marcar como tomada"}
                  </button>
                  {!doseTaken && <button className="ghost">Recordar en 10 min</button>}
                </div>
              </div>
              <div className="timeOrb">
                <span>09:00</span><small>HOY</small>
                <div className={doseTaken ? "orbProgress done" : "orbProgress"} />
              </div>
            </section>

            <section className="stats">
              <article>
                <div className="statTop"><span>Adherencia</span><b className="good">↗ 4%</b></div>
                <strong>{adherence}%</strong>
                <div className="bar"><i style={{ width: `${adherence}%` }} /></div>
                <small>Últimos 30 días</small>
              </article>
              <article>
                <div className="statTop"><span>Inventario</span><b className="warn">Bajo</b></div>
                <strong>{inventoryDays} días</strong>
                <div className="bar amber"><i style={{ width: `${Math.min(100, inventoryDays / 21 * 100)}%` }} /></div>
                <small>Solicita resurtido esta semana</small>
              </article>
              <article>
                <div className="statTop"><span>Racha actual</span><b className="good">Mejor marca</b></div>
                <strong>12 días</strong>
                <div className="dots">{[1,2,3,4,5,6,7].map(n => <i key={n}>{n < 7 ? "✓" : "·"}</i>)}</div>
                <small>Sin dosis omitidas</small>
              </article>
            </section>

            <div className="columns">
              <section className="panel schedule">
                <div className="panelHead"><div><p className="eyebrow">PLAN DE HOY</p><h3>Tus dosis</h3></div><button>Ver calendario</button></div>
                <Dose time="07:00" title="Lamotrigina" detail="100 mg · 1 tableta" status="Tomada" done />
                <Dose time={doseTime(nextDose?.scheduledFor, "09:00")} title={medicationName} detail={doseLabel} status={doseTaken ? "Tomada" : "Próxima"} active={!doseTaken} done={doseTaken} />
                <Dose time={doseTime(dashboard?.doses.filter((dose) => dose.status === "scheduled")[1]?.scheduledFor, "21:00")} title={medicationName} detail={doseLabel} status="Esta noche" />
              </section>
              <section className="panel alertPanel">
                <div className="panelHead"><div><p className="eyebrow">ATENCIÓN</p><h3>Para cuidar tu continuidad</h3></div><span className="alertIcon">!</span></div>
                <div className="alertBody">
                  <span className="bottle">▥</span>
                  <div><strong>{medicationName} por agotarse</strong><p>Te quedan aproximadamente {inventoryDays} días de tratamiento.</p></div>
                </div>
                <button className="outline">Solicitar resurtido</button>
              </section>
            </div>
          </>
        )}

        {view === "Tratamiento" && <Treatment />}
        {view === "Progreso" && <Progress />}
        {view === "Alertas" && (
          <Alerts
            recoveryRequests={recoveryRequests}
            adminExperience={adminExperience}
            onResolve={(id) => void resolveRecovery(id)}
          />
        )}
      </section>
      {showLogin && (
        <LoginDialog
          onClose={() => setShowLogin(false)}
          onError={setAuthError}
        />
      )}
      {authReady && authError && (
        <div className="toast" role="alert">
          {authError}
          <button onClick={() => setAuthError("")}>×</button>
        </div>
      )}
    </main>
  );
}

function LoginDialog({
  onClose,
  onError,
}: {
  onClose: () => void;
  onError: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    onError("");
    try {
      await login(String(data.get("email")), String(data.get("password")));
      onClose();
    } catch {
      onError(
        "No fue posible iniciar sesión. Verifica el correo y la contraseña.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialogBackdrop" role="presentation">
      <section
        className="loginDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button className="dialogClose" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="brand dark"><span className="brandMark">h</span> helix</div>
        <p className="eyebrow">ACCESO SEGURO</p>
        <h2 id="login-title">Entra a tu tratamiento</h2>
        <p>Usa la cuenta registrada por tu equipo de cuidado.</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
          <button
            className="forgotLink"
            type="button"
            disabled={recoveryBusy}
            onClick={() => {
              setRecoveryBusy(true);
              setRecoveryMessage("");
              void requestPasswordRecovery(email)
                .then(setRecoveryMessage)
                .catch((error) => setRecoveryMessage(
                  error instanceof Error
                    ? error.message
                    : "Ingresa un correo electrónico válido",
                ))
                .finally(() => setRecoveryBusy(false));
            }}
          >
            {recoveryBusy ? "Enviando solicitud…" : "¿Olvidaste tu contraseña?"}
          </button>
        {recoveryMessage && <p className="recoveryMessage" role="status">{recoveryMessage}</p>}
        <p className="recoveryNote">Por ahora, el administrador dará seguimiento personalmente. Helix no solicita ni envía contraseñas.</p>
        <small>Tu sesión se valida directamente con Firebase.</small>
      </section>
    </div>
  );
}

function subtitle(view: View) {
  if (view === "Hoy") return "Tu tratamiento va bien. Tienes una dosis próxima.";
  if (view === "Tratamiento") return "Medicamentos activos, horarios e inventario.";
  if (view === "Progreso") return "Una vista clara de tu constancia durante el último mes.";
  return "Revisa lo que necesita tu atención.";
}

function doseTime(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function Dose({ time, title, detail, status, done, active }: { time: string; title: string; detail: string; status: string; done?: boolean; active?: boolean }) {
  return <div className={`dose ${active ? "current" : ""}`}>
    <time>{time}</time><span className={`doseDot ${done ? "done" : ""}`}>{done ? "✓" : ""}</span>
    <div><strong>{title}</strong><small>{detail}</small></div><b>{status}</b>
  </div>;
}

function Treatment() {
  return <div className="viewGrid">
    <article className="medCard featured"><span className="medVisual">●</span><div><small>ACTIVO</small><h2>Levetiracetam</h2><p>500 mg · 1 tableta · Cada 12 horas</p><div className="tagRow"><i>09:00</i><i>21:00</i><i className="warningTag">6 días restantes</i></div></div></article>
    <article className="medCard"><span className="medVisual violet">◆</span><div><small>ACTIVO</small><h2>Lamotrigina</h2><p>100 mg · 1 tableta · Una vez al día</p><div className="tagRow"><i>07:00</i><i>18 días restantes</i></div></div></article>
    <section className="panel full"><div className="panelHead"><div><p className="eyebrow">INDICACIONES</p><h3>Plan coordinado por tu médica</h3></div></div><p className="largeCopy">Toma tus medicamentos a la misma hora cada día. No suspendas el tratamiento sin comunicarte con tu equipo de cuidado.</p></section>
  </div>;
}

function Progress() {
  const bars = [78,88,100,92,100,84,96];
  return <div className="progressLayout">
    <section className="panel chartPanel"><div className="panelHead"><div><p className="eyebrow">ÚLTIMAS 4 SEMANAS</p><h3>Adherencia al tratamiento</h3></div><strong className="bigGood">92%</strong></div>
      <div className="chart">{bars.map((v,i)=><div key={i}><i style={{height:`${v}%`}}/><small>{["L","M","M","J","V","S","D"][i]}</small></div>)}</div>
    </section>
    <section className="panel milestones"><p className="eyebrow">LOGROS</p><h3>Tu constancia cuenta</h3><div className="badgeBig">12</div><strong>días seguidos</strong><p>Tu mejor racha hasta ahora. Sigue así.</p></section>
  </div>;
}

function Alerts({
  recoveryRequests,
  adminExperience,
  onResolve,
}: {
  recoveryRequests: PasswordRecoveryRequest[];
  adminExperience: boolean;
  onResolve: (id: string) => void;
}) {
  return <section className="panel alertsList">
    {adminExperience && (
      <div className="adminRecoveryGroup">
        <div className="panelHead">
          <div>
            <p className="eyebrow">ADMINISTRACIÓN</p>
            <h3>Solicitudes de recuperación</h3>
          </div>
          <b className="warn">{recoveryRequests.length} pendientes</b>
        </div>
        {recoveryRequests.length === 0 && (
          <p className="emptyRecovery">No hay solicitudes pendientes.</p>
        )}
        {recoveryRequests.map((request) => (
          <div className="alertRow recoveryAlert" key={request.id}>
            <span>↺</span>
            <div>
              <strong>{request.email}</strong>
              <p>{new Intl.DateTimeFormat("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(request.createdAt))}</p>
            </div>
            <button onClick={() => onResolve(request.id)}>Marcar resuelta</button>
          </div>
        ))}
      </div>
    )}
    <div className="alertRow urgent"><span>!</span><div><strong>Inventario bajo</strong><p>Levetiracetam podría agotarse en 6 días.</p></div><button>Resolver</button></div>
    <div className="alertRow"><span>↗</span><div><strong>Tu adherencia mejoró</strong><p>Subiste 4% respecto al periodo anterior.</p></div><button>Ver progreso</button></div>
  </section>;
}
