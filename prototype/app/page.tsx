"use client";

import { useState } from "react";

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
              {item.label === "Alertas" && <i>2</i>}
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
          <div><strong>Roberto M.</strong><small>Paciente</small></div>
          <button aria-label="Más opciones">•••</button>
        </div>
      </aside>

      <section className="content">
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
                  <div><strong>Levetiracetam</strong><small>500 mg · 1 tableta</small></div>
                </div>
                <div className="heroActions">
                  <button className="primary" onClick={() => setDoseTaken(true)}>
                    {doseTaken ? "✓ Tomada a las 9:00" : "Marcar como tomada"}
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
                <strong>92%</strong>
                <div className="bar"><i style={{ width: "92%" }} /></div>
                <small>Últimos 30 días</small>
              </article>
              <article>
                <div className="statTop"><span>Inventario</span><b className="warn">Bajo</b></div>
                <strong>6 días</strong>
                <div className="bar amber"><i style={{ width: "28%" }} /></div>
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
                <Dose time="09:00" title="Levetiracetam" detail="500 mg · 1 tableta" status={doseTaken ? "Tomada" : "Próxima"} active={!doseTaken} done={doseTaken} />
                <Dose time="21:00" title="Levetiracetam" detail="500 mg · 1 tableta" status="Esta noche" />
              </section>
              <section className="panel alertPanel">
                <div className="panelHead"><div><p className="eyebrow">ATENCIÓN</p><h3>Para cuidar tu continuidad</h3></div><span className="alertIcon">!</span></div>
                <div className="alertBody">
                  <span className="bottle">▥</span>
                  <div><strong>Levetiracetam por agotarse</strong><p>Te quedan aproximadamente 6 días de tratamiento.</p></div>
                </div>
                <button className="outline">Solicitar resurtido</button>
              </section>
            </div>
          </>
        )}

        {view === "Tratamiento" && <Treatment />}
        {view === "Progreso" && <Progress />}
        {view === "Alertas" && <Alerts />}
      </section>
    </main>
  );
}

function subtitle(view: View) {
  if (view === "Hoy") return "Tu tratamiento va bien. Tienes una dosis próxima.";
  if (view === "Tratamiento") return "Medicamentos activos, horarios e inventario.";
  if (view === "Progreso") return "Una vista clara de tu constancia durante el último mes.";
  return "Revisa lo que necesita tu atención.";
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

function Alerts() {
  return <section className="panel alertsList">
    <div className="alertRow urgent"><span>!</span><div><strong>Inventario bajo</strong><p>Levetiracetam podría agotarse en 6 días.</p></div><button>Resolver</button></div>
    <div className="alertRow"><span>↗</span><div><strong>Tu adherencia mejoró</strong><p>Subiste 4% respecto al periodo anterior.</p></div><button>Ver progreso</button></div>
  </section>;
}
