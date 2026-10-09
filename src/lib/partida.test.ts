import { describe, expect, it } from "vitest";

import { esTurnoCpu, estadoInicial, reducer, type Accion, type Estado } from "./partida";

const jugarTodo = (estado: Estado, acciones: Accion[]) => acciones.reduce(reducer, estado);

describe("reducer de la partida", () => {
  it("con gravedad la ficha cae a la fila más baja y cambia el turno", () => {
    const e = reducer(estadoInicial(), { tipo: "soltar", columna: 2, jugador: 1 });
    expect(e.tablero[3][2]).toBe(1);
    expect(e.turno).toBe(2);
    expect(esTurnoCpu(e)).toBe(true);
    expect(e.mensaje.texto).toContain("CPU está pensando");
  });

  it("ignora clics repetidos del mismo jugador (no hay jugadas dobles)", () => {
    const e = jugarTodo(estadoInicial(), [
      { tipo: "soltar", columna: 2, jugador: 1 },
      { tipo: "soltar", columna: 3, jugador: 1 },
    ]);
    expect(e.tablero.flat().filter((c) => c !== 0)).toHaveLength(1);
  });

  it("con gravedad no permite colocar en una fila flotante", () => {
    const e = reducer(estadoInicial(), { tipo: "jugar", fila: 0, columna: 0, jugador: 1 });
    expect(e.tablero[0][0]).toBe(0);
  });

  it("no hace nada en una columna llena", () => {
    const config = { modo: "pvp", fisica: "gravity", tamano: "3x3" } as const;
    let e = estadoInicial(config);
    e = jugarTodo(e, [
      { tipo: "soltar", columna: 0, jugador: 1 },
      { tipo: "soltar", columna: 0, jugador: 2 },
      { tipo: "soltar", columna: 0, jugador: 1 },
    ]);
    const lleno = reducer(e, { tipo: "soltar", columna: 0, jugador: 2 });
    expect(lleno).toBe(e);
  });

  it("detecta la victoria, suma al marcador y bloquea más jugadas", () => {
    const config = { modo: "pvp", fisica: "free", tamano: "3x3" } as const;
    const e = jugarTodo(estadoInicial(config), [
      { tipo: "jugar", fila: 0, columna: 0, jugador: 1 },
      { tipo: "jugar", fila: 1, columna: 0, jugador: 2 },
      { tipo: "jugar", fila: 0, columna: 1, jugador: 1 },
      { tipo: "jugar", fila: 1, columna: 1, jugador: 2 },
      { tipo: "jugar", fila: 0, columna: 2, jugador: 1 },
    ]);
    expect(e.fin).toBe(true);
    expect(e.marcador.p1).toBe(1);
    expect(e.lineaGanadora).toHaveLength(3);
    expect(e.mensaje.tipo).toBe("win-p1");
    expect(e.evento?.tipo).toBe("victoria");
    expect(reducer(e, { tipo: "jugar", fila: 2, columna: 2, jugador: 2 })).toBe(e);
  });

  it("detecta empate con el tablero lleno", () => {
    const config = { modo: "pvp", fisica: "free", tamano: "3x3" } as const;
    // R A R / R A A / A R R  -> sin 3 en línea
    const orden: [number, number][] = [
      [0, 0], [0, 1], [0, 2], [1, 1], [1, 0], [1, 2], [2, 1], [2, 0], [2, 2],
    ];
    const e = jugarTodo(
      estadoInicial(config),
      orden.map(([fila, columna], i) => ({ tipo: "jugar", fila, columna, jugador: i % 2 === 0 ? 1 : 2 }) as Accion),
    );
    expect(e.fin).toBe(true);
    expect(e.mensaje.tipo).toBe("draw");
    expect(e.marcador.empates).toBe(1);
  });

  it("reiniciar conserva el marcador y aplica la nueva configuración", () => {
    const config = { modo: "pvp", fisica: "free", tamano: "3x3" } as const;
    let e = jugarTodo(estadoInicial(config), [
      { tipo: "jugar", fila: 0, columna: 0, jugador: 1 },
      { tipo: "jugar", fila: 1, columna: 0, jugador: 2 },
      { tipo: "jugar", fila: 0, columna: 1, jugador: 1 },
      { tipo: "jugar", fila: 1, columna: 1, jugador: 2 },
      { tipo: "jugar", fila: 0, columna: 2, jugador: 1 },
    ]);
    e = reducer(e, { tipo: "reiniciar", config: { modo: "cpu-hard", fisica: "gravity", tamano: "6x5" } });
    expect(e.marcador.p1).toBe(1);
    expect(e.fin).toBe(false);
    expect(e.tablero).toHaveLength(5);
    expect(e.tablero[0]).toHaveLength(6);
    expect(e.config.modo).toBe("cpu-hard");
    expect(e.partidaId).toBe(1);
  });
});
