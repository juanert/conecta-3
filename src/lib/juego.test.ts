import { describe, expect, it } from "vitest";

import {
  colocar,
  comprobarVictoria,
  crearTablero,
  dimensiones,
  filaLibre,
  jugadaCpuGravedad,
  jugadaCpuLibre,
  tableroLleno,
  type Tablero,
} from "./juego";

/** Crea un tablero desde texto: "." vacía, "R" jugador 1, "A" jugador 2 (fila 0 arriba) */
function desde(...filas: string[]): Tablero {
  return filas.map((f) => [...f].map((ch) => (ch === "R" ? 1 : ch === "A" ? 2 : 0)));
}

describe("tablero", () => {
  it("interpreta el tamaño como columnas x filas", () => {
    expect(dimensiones("5x4")).toEqual({ filas: 4, columnas: 5 });
    expect(dimensiones("6x5")).toEqual({ filas: 5, columnas: 6 });
  });

  it("crea un tablero vacío", () => {
    const t = crearTablero(4, 5);
    expect(t).toHaveLength(4);
    expect(t[0]).toHaveLength(5);
    expect(t.flat().every((c) => c === 0)).toBe(true);
  });

  it("colocar no modifica el tablero original", () => {
    const t = crearTablero(3, 3);
    const t2 = colocar(t, 2, 1, 1);
    expect(t[2][1]).toBe(0);
    expect(t2[2][1]).toBe(1);
  });

  it("encuentra la fila libre más baja con gravedad", () => {
    const t = desde("...", "...", "R..");
    expect(filaLibre(t, 0)).toBe(1);
    expect(filaLibre(t, 1)).toBe(2);
    expect(filaLibre(desde("R", "A", "R"), 0)).toBe(-1);
  });

  it("detecta tablero lleno", () => {
    expect(tableroLleno(desde("RA", "AR"))).toBe(true);
    expect(tableroLleno(desde("R.", "AR"))).toBe(false);
  });
});

describe("comprobarVictoria (3 en línea)", () => {
  it("horizontal", () => {
    const t = desde(".....", ".....", ".....", ".RRR.");
    expect(comprobarVictoria(t, 3, 2, 1)).toHaveLength(3);
  });

  it("vertical", () => {
    const t = desde("....", ".A..", ".A..", ".A..");
    expect(comprobarVictoria(t, 1, 1, 2)).toHaveLength(3);
  });

  it("diagonal ascendente y descendente", () => {
    expect(comprobarVictoria(desde("..R", ".R.", "R.."), 1, 1, 1)).toHaveLength(3);
    expect(comprobarVictoria(desde("A..", ".A.", "..A"), 0, 0, 2)).toHaveLength(3);
  });

  it("no gana con 2 en línea ni con fichas del rival", () => {
    expect(comprobarVictoria(desde("...", "...", "RR."), 2, 1, 1)).toBeNull();
    expect(comprobarVictoria(desde("...", "...", "RAR"), 2, 2, 1)).toBeNull();
  });

  it("devuelve todas las fichas de una línea de 4", () => {
    const t = desde(".....", "RRRR.");
    expect(comprobarVictoria(t, 1, 3, 1)).toHaveLength(4);
  });
});

describe("CPU con gravedad", () => {
  const nuncaAlAzar = () => 0.99;

  it("gana si puede", () => {
    // La CPU (A) tiene 2 en la fila de abajo: col 2 completa la línea
    const t = desde(".....", ".....", "R....", "RAA..");
    expect(jugadaCpuGravedad(t, "cpu-medium", nuncaAlAzar)).toBe(3);
  });

  it("bloquea al rival", () => {
    const t = desde(".....", ".....", ".....", ".RR.A");
    expect(jugadaCpuGravedad(t, "cpu-medium", nuncaAlAzar)).toBe(0);
  });

  it("prefiere ganar antes que bloquear", () => {
    const t = desde(".....", "A....", "A....", "RR...");
    expect(jugadaCpuGravedad(t, "cpu-hard", nuncaAlAzar)).toBe(0);
  });

  it("en difícil evita regalarle la victoria al rival justo encima", () => {
    // Si la CPU juega en la columna central (2), el rival responde encima y
    // completa la diagonal (1,2)-(2,3)-(3,4). En medio sí cae en la trampa.
    const t = desde(".....", ".....", "...R.", "A.RAR");
    expect(jugadaCpuGravedad(t, "cpu-medium", nuncaAlAzar)).toBe(2);
    expect(jugadaCpuGravedad(t, "cpu-hard", nuncaAlAzar)).not.toBe(2);
  });

  it("sin amenazas, elige la columna central", () => {
    expect(jugadaCpuGravedad(crearTablero(4, 5), "cpu-medium", nuncaAlAzar)).toBe(2);
  });

  it("nunca juega en una columna llena", () => {
    const t = desde("RAR..", "ARA..", "RAR..", "ARA..");
    const col = jugadaCpuGravedad(t, "cpu-easy", () => 0.1);
    expect([3, 4]).toContain(col);
  });

  it("devuelve null si no quedan columnas", () => {
    expect(jugadaCpuGravedad(desde("RA", "AR"), "cpu-medium")).toBeNull();
  });
});

describe("CPU en casilla libre", () => {
  it("gana, bloquea o toma el centro", () => {
    expect(jugadaCpuLibre(desde("AA.", "...", "..."))).toEqual([0, 2]);
    expect(jugadaCpuLibre(desde("RR.", "...", "..."))).toEqual([0, 2]);
    expect(jugadaCpuLibre(crearTablero(3, 3), () => 0)).toEqual([1, 1]);
  });

  it("devuelve null con el tablero lleno", () => {
    expect(jugadaCpuLibre(desde("RA", "AR"))).toBeNull();
  });
});
