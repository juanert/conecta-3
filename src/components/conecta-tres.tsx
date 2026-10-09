"use client";

import { useEffect, useEffectEvent, useReducer, useState } from "react";

import { FISICAS, MODOS, TAMANOS, dimensiones, jugadaCpuGravedad, jugadaCpuLibre, type Fisica, type Modo, type Tamano } from "@/lib/juego";
import { esTurnoCpu, estadoInicial, nombreJugador2, reducer, type Config } from "@/lib/partida";
import { iniciarAudio, reproducir } from "@/lib/sonido";

import { Confeti } from "./confeti";
import { ModalReglas } from "./modal-reglas";

const RETARDO_CPU_MS = 420;

export function ConectaTres() {
  const [partida, dispatch] = useReducer(reducer, undefined, () => estadoInicial());
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [columnaHover, setColumnaHover] = useState<number | null>(null);
  const [reglasAbiertas, setReglasAbiertas] = useState(false);

  const { config, marcador } = partida;
  const { filas, columnas } = dimensiones(config.tamano);
  const gravedad = config.fisica === "gravity";
  const cpuPensando = esTurnoCpu(partida);
  const bloqueado = partida.fin || cpuPensando;

  function pulsarCelda(fila: number, columna: number) {
    if (bloqueado) return;
    iniciarAudio();
    if (gravedad) dispatch({ tipo: "soltar", columna, jugador: partida.turno });
    else dispatch({ tipo: "jugar", fila, columna, jugador: partida.turno });
  }

  function reiniciar(nuevaConfig?: Config) {
    iniciarAudio();
    dispatch({ tipo: "reiniciar", config: nuevaConfig });
    setColumnaHover(null);
  }

  // Sonidos de cada jugada (el efecto solo reacciona a un evento nuevo)
  const sonarEvento = useEffectEvent(() => {
    const evento = partida.evento;
    if (!evento || !sonidoActivo) return;
    reproducir("ficha");
    if (evento.tipo === "victoria") reproducir("victoria");
    if (evento.tipo === "empate") reproducir("empate");
  });
  useEffect(() => {
    sonarEvento();
  }, [partida.evento]);

  // Turno de la CPU (con retardo para que se sienta natural)
  const turnoCpu = useEffectEvent(() => {
    if (!esTurnoCpu(partida)) return;
    if (gravedad) {
      const columna = jugadaCpuGravedad(partida.tablero, config.modo);
      if (columna !== null) dispatch({ tipo: "soltar", columna, jugador: 2 });
    } else {
      const posicion = jugadaCpuLibre(partida.tablero);
      if (posicion) dispatch({ tipo: "jugar", fila: posicion[0], columna: posicion[1], jugador: 2 });
    }
  });
  useEffect(() => {
    if (!cpuPensando) return;
    const t = setTimeout(turnoCpu, RETARDO_CPU_MS);
    return () => clearTimeout(t);
  }, [cpuPensando, partida.partidaId, partida.tablero]);

  // Atajos de teclado: 1–9 sueltan ficha en esa columna (gravedad), R reinicia
  const teclaPulsada = useEffectEvent((e: KeyboardEvent) => {
    if (reglasAbiertas || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement | null)?.closest("select, input, textarea")) return;
    if (e.key === "r" || e.key === "R") return reiniciar();
    const numero = Number(e.key);
    if (gravedad && Number.isInteger(numero) && numero >= 1 && numero <= columnas) {
      pulsarCelda(0, numero - 1);
    }
  });
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => teclaPulsada(e);
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, []);

  const esGanadora = (r: number, c: number) => partida.lineaGanadora.some(([fr, fc]) => fr === r && fc === c);
  const nombreTurno = partida.turno === 1 ? "Jugador 1" : nombreJugador2(config.modo);
  const describirCelda = (valor: number) => (valor === 0 ? "vacía" : valor === 1 ? "Jugador 1" : nombreJugador2(config.modo));

  return (
    <>
      <Confeti disparo={marcador.p1 + marcador.p2} />

      {/* Marcador de jugadores */}
      <section className="status-panel" aria-label="Marcador">
        <div className={`player-card p1 ${partida.turno === 1 && !partida.fin ? "active" : ""}`}>
          <div className="player-token-indicator token-p1" aria-hidden />
          <div className="player-info">
            <span className="player-name">Jugador 1</span>
            <span className="player-score" aria-label={`Jugador 1: ${marcador.p1} victorias`}>
              {marcador.p1}
            </span>
          </div>
        </div>

        <div className="versus-badge">
          <span className="turn-label">{partida.fin ? "Fin" : "Turno"}</span>
          <span
            className="turn-detail"
            style={{ color: partida.turno === 1 ? "var(--player1-color)" : "var(--player2-color)" }}
          >
            {partida.fin ? `Empates: ${marcador.empates}` : nombreTurno}
          </span>
        </div>

        <div className={`player-card p2 ${partida.turno === 2 && !partida.fin ? "active" : ""}`}>
          <div className="player-token-indicator token-p2" aria-hidden />
          <div className="player-info">
            <span className="player-name">{nombreJugador2(config.modo)}</span>
            <span className="player-score" aria-label={`${nombreJugador2(config.modo)}: ${marcador.p2} victorias`}>
              {marcador.p2}
            </span>
          </div>
        </div>
      </section>

      {/* Configuración rápida */}
      <div className="controls-panel">
        <div className="controls-group">
          <label className="sr-only" htmlFor="modo">
            Modo de rival
          </label>
          <select
            id="modo"
            className="btn-select"
            value={config.modo}
            onChange={(e) => reiniciar({ ...config, modo: e.target.value as Modo })}
          >
            {MODOS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="fisica">
            Modo de colocación
          </label>
          <select
            id="fisica"
            className="btn-select"
            value={config.fisica}
            onChange={(e) => reiniciar({ ...config, fisica: e.target.value as Fisica })}
          >
            {FISICAS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.etiqueta}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="tamano">
            Tamaño del tablero
          </label>
          <select
            id="tamano"
            className="btn-select"
            value={config.tamano}
            onChange={(e) => reiniciar({ ...config, tamano: e.target.value as Tamano })}
          >
            {TAMANOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="controls-group">
          <button
            type="button"
            className="btn-action"
            onClick={() => setSonidoActivo((s) => !s)}
            aria-pressed={sonidoActivo}
            aria-label={sonidoActivo ? "Silenciar sonido" : "Activar sonido"}
            title={sonidoActivo ? "Silenciar sonido" : "Activar sonido"}
          >
            {sonidoActivo ? "🔊" : "🔇"}
          </button>
          <button type="button" className="btn-action" onClick={() => setReglasAbiertas(true)} title="Cómo jugar">
            ❓ Reglas
          </button>
          <button
            type="button"
            className="btn-action primary"
            onClick={() => reiniciar()}
            title="Reiniciar partida actual (R)"
          >
            🔄 Reiniciar
          </button>
        </div>
      </div>

      {/* Tablero */}
      <div className="game-area">
        {gravedad && (
          <div className="drop-indicators" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }} aria-hidden>
            {Array.from({ length: columnas }, (_, c) => (
              <div
                key={c}
                className={`drop-indicator ${columnaHover === c && !bloqueado ? "hover" : ""}`}
                onClick={() => pulsarCelda(0, c)}
              >
                <div className={`drop-preview-token token-p${partida.turno}`} />
              </div>
            ))}
          </div>
        )}

        <div className="board-frame">
          <div
            className="board-grid"
            role="grid"
            aria-label={`Tablero de ${columnas} columnas y ${filas} filas`}
            style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}
          >
            {partida.tablero.map((fila, r) =>
              fila.map((valor, c) => (
                <button
                  key={`${partida.partidaId}-${r}-${c}`}
                  type="button"
                  className="cell"
                  onClick={() => pulsarCelda(r, c)}
                  onMouseEnter={() => gravedad && setColumnaHover(c)}
                  onMouseLeave={() => gravedad && setColumnaHover(null)}
                  disabled={bloqueado}
                  aria-label={
                    gravedad
                      ? `Columna ${c + 1}, fila ${r + 1}: ${describirCelda(valor)}. Soltar ficha en la columna ${c + 1}`
                      : `Fila ${r + 1}, columna ${c + 1}: ${describirCelda(valor)}`
                  }
                >
                  {valor !== 0 && (
                    <span
                      className={`chip token-p${valor} ${gravedad ? "" : "placed"} ${esGanadora(r, c) ? "winner" : ""}`}
                    />
                  )}
                </button>
              )),
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de estado / resultado */}
      <div className={`message-banner ${partida.mensaje.tipo}`} role="status" aria-live="polite">
        {partida.mensaje.texto}
      </div>

      <ModalReglas abierto={reglasAbiertas} onCerrar={() => setReglasAbiertas(false)} />
    </>
  );
}
