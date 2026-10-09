/* =========================================================
   ESTADO DE LA PARTIDA (reducer puro: siempre trabaja sobre el
   estado más reciente, aunque lleguen varios clics seguidos)
========================================================= */

import {
  colocar,
  comprobarVictoria,
  crearTablero,
  dimensiones,
  filaLibre,
  tableroLleno,
  type Fisica,
  type Jugador,
  type Modo,
  type Posicion,
  type Tablero,
  type Tamano,
} from "./juego";

export type Config = { modo: Modo; fisica: Fisica; tamano: Tamano };
export type TipoMensaje = "" | "win-p1" | "win-p2" | "draw";
export type Evento = { tipo: "ficha" | "victoria" | "empate"; numero: number } | null;

export type Estado = {
  config: Config;
  /** Cambia en cada partida nueva (para reiniciar animaciones) */
  partidaId: number;
  tablero: Tablero;
  turno: Jugador;
  fin: boolean;
  lineaGanadora: Posicion[];
  mensaje: { texto: string; tipo: TipoMensaje };
  marcador: { p1: number; p2: number; empates: number };
  /** Último suceso, para sonidos y efectos (numero crece en cada jugada) */
  evento: Evento;
};

export type Accion =
  | { tipo: "jugar"; fila: number; columna: number; jugador: Jugador }
  | { tipo: "soltar"; columna: number; jugador: Jugador }
  | { tipo: "reiniciar"; config?: Config };

export const CONFIG_INICIAL: Config = { modo: "cpu-medium", fisica: "gravity", tamano: "5x4" };

export const nombreJugador2 = (modo: Modo) => (modo === "pvp" ? "Jugador 2" : "CPU");

export function esTurnoCpu(e: Estado) {
  return !e.fin && e.turno === 2 && e.config.modo !== "pvp";
}

export function estadoInicial(config: Config = CONFIG_INICIAL): Estado {
  const { filas, columnas } = dimensiones(config.tamano);
  return {
    config,
    partidaId: 0,
    tablero: crearTablero(filas, columnas),
    turno: 1,
    fin: false,
    lineaGanadora: [],
    mensaje: { texto: "¡Comienza la partida! Turno de Jugador 1", tipo: "" },
    marcador: { p1: 0, p2: 0, empates: 0 },
    evento: null,
  };
}

function aplicarJugada(e: Estado, fila: number, columna: number, jugador: Jugador): Estado {
  // Jugada inválida: partida terminada, turno ajeno, fuera del tablero o casilla ocupada
  if (e.fin || jugador !== e.turno) return e;
  if (e.tablero[fila]?.[columna] !== 0) return e;
  // Con gravedad, la ficha solo puede ir a la fila libre más baja
  if (e.config.fisica === "gravity" && filaLibre(e.tablero, columna) !== fila) return e;

  const tablero = colocar(e.tablero, fila, columna, jugador);
  const numero = (e.evento?.numero ?? 0) + 1;
  const { modo } = e.config;

  const linea = comprobarVictoria(tablero, fila, columna, jugador);
  if (linea) {
    const ganador = jugador === 1 ? "del Jugador 1" : modo === "pvp" ? "del Jugador 2" : "de la CPU";
    return {
      ...e,
      tablero,
      fin: true,
      lineaGanadora: linea,
      marcador: jugador === 1 ? { ...e.marcador, p1: e.marcador.p1 + 1 } : { ...e.marcador, p2: e.marcador.p2 + 1 },
      mensaje: { texto: `🎉 ¡Victoria ${ganador}!`, tipo: jugador === 1 ? "win-p1" : "win-p2" },
      evento: { tipo: "victoria", numero },
    };
  }

  if (tableroLleno(tablero)) {
    return {
      ...e,
      tablero,
      fin: true,
      marcador: { ...e.marcador, empates: e.marcador.empates + 1 },
      mensaje: { texto: "🤝 ¡Partida en Empate! Tablero completo", tipo: "draw" },
      evento: { tipo: "empate", numero },
    };
  }

  const siguiente: Jugador = jugador === 1 ? 2 : 1;
  const texto =
    siguiente === 2 && modo !== "pvp"
      ? "🤖 CPU está pensando..."
      : `Turno de ${siguiente === 1 ? "Jugador 1" : nombreJugador2(modo)}`;
  return { ...e, tablero, turno: siguiente, mensaje: { texto, tipo: "" }, evento: { tipo: "ficha", numero } };
}

export function reducer(e: Estado, a: Accion): Estado {
  switch (a.tipo) {
    case "jugar":
      return aplicarJugada(e, a.fila, a.columna, a.jugador);
    case "soltar": {
      const fila = filaLibre(e.tablero, a.columna);
      return fila === -1 ? e : aplicarJugada(e, fila, a.columna, a.jugador);
    }
    case "reiniciar": {
      // Cambiar opciones o reiniciar conserva el marcador
      const nueva = estadoInicial(a.config ?? e.config);
      return { ...nueva, partidaId: e.partidaId + 1, marcador: e.marcador, evento: e.evento };
    }
  }
}
