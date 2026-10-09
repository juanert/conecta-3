/* =========================================================
   LÓGICA PURA DE CONECTA 3 (sin React ni DOM: fácil de probar)
========================================================= */

export type Jugador = 1 | 2;
export type Celda = 0 | Jugador; // 0 = vacía, 1 = Jugador 1 (rojo), 2 = Jugador 2 / CPU (amarillo)
export type Tablero = Celda[][]; // [fila][columna], la fila 0 es la de arriba
export type Posicion = readonly [fila: number, columna: number];

export type Modo = "cpu-easy" | "cpu-medium" | "cpu-hard" | "pvp";
export type Fisica = "gravity" | "free";
export type Tamano = "5x4" | "4x4" | "3x3" | "6x5";

export const FICHAS_PARA_GANAR = 3;

export const MODOS: { valor: Modo; etiqueta: string }[] = [
  { valor: "cpu-easy", etiqueta: "🤖 vs CPU (Fácil)" },
  { valor: "cpu-medium", etiqueta: "🤖 vs CPU (Medio)" },
  { valor: "cpu-hard", etiqueta: "🤖 vs CPU (Difícil)" },
  { valor: "pvp", etiqueta: "👥 2 Jugadores (Local)" },
];

export const FISICAS: { valor: Fisica; etiqueta: string }[] = [
  { valor: "gravity", etiqueta: "⬇️ Con Gravedad" },
  { valor: "free", etiqueta: "🎯 Casilla Libre" },
];

export const TAMANOS: { valor: Tamano; etiqueta: string }[] = [
  { valor: "5x4", etiqueta: "Tablero 5x4" },
  { valor: "4x4", etiqueta: "Tablero 4x4" },
  { valor: "3x3", etiqueta: "Tablero 3x3" },
  { valor: "6x5", etiqueta: "Tablero 6x5" },
];

/** "5x4" => 5 columnas y 4 filas */
export function dimensiones(tamano: Tamano) {
  const [columnas, filas] = tamano.split("x").map(Number);
  return { filas, columnas };
}

export function crearTablero(filas: number, columnas: number): Tablero {
  return Array.from({ length: filas }, () => Array<Celda>(columnas).fill(0));
}

/** Copia con una ficha colocada (no modifica el original) */
export function colocar(tablero: Tablero, fila: number, columna: number, jugador: Jugador): Tablero {
  return tablero.map((f, r) => (r === fila ? f.map((c, col) => (col === columna ? jugador : c)) : f));
}

/** Fila más baja libre de una columna, o -1 si está llena */
export function filaLibre(tablero: Tablero, columna: number): number {
  for (let r = tablero.length - 1; r >= 0; r--) {
    if (tablero[r][columna] === 0) return r;
  }
  return -1;
}

const DIRECCIONES: Posicion[] = [
  [0, 1], // Horizontal (→)
  [1, 0], // Vertical (↓)
  [1, 1], // Diagonal descendente (↘)
  [1, -1], // Diagonal ascendente (↙)
];

/** Devuelve las casillas de la línea ganadora que pasa por la última jugada, o null */
export function comprobarVictoria(tablero: Tablero, fila: number, columna: number, jugador: Jugador): Posicion[] | null {
  const filas = tablero.length;
  const columnas = tablero[0]?.length ?? 0;
  const dentro = (r: number, c: number) => r >= 0 && r < filas && c >= 0 && c < columnas;

  for (const [dr, dc] of DIRECCIONES) {
    const linea: Posicion[] = [[fila, columna]];
    for (const signo of [1, -1]) {
      let r = fila + dr * signo;
      let c = columna + dc * signo;
      while (dentro(r, c) && tablero[r][c] === jugador) {
        linea.push([r, c]);
        r += dr * signo;
        c += dc * signo;
      }
    }
    if (linea.length >= FICHAS_PARA_GANAR) return linea;
  }
  return null;
}

export function tableroLleno(tablero: Tablero): boolean {
  return tablero.every((fila) => fila.every((c) => c !== 0));
}

/* =========================================================
   INTELIGENCIA ARTIFICIAL (CPU = jugador 2)
========================================================= */

type Azar = () => number;

function columnasValidas(tablero: Tablero): number[] {
  return tablero[0].map((_, c) => c).filter((c) => tablero[0][c] === 0);
}

function columnaMasCentrada(columnas: number[], totalColumnas: number): number {
  const centro = (totalColumnas - 1) / 2;
  return [...columnas].sort((a, b) => Math.abs(a - centro) - Math.abs(b - centro))[0];
}

/** ¿Hay una columna en la que `jugador` gane de inmediato? */
function columnaGanadora(tablero: Tablero, columnas: number[], jugador: Jugador): number | null {
  for (const c of columnas) {
    const r = filaLibre(tablero, c);
    if (comprobarVictoria(colocar(tablero, r, c, jugador), r, c, jugador)) return c;
  }
  return null;
}

/** Jugada de la CPU con gravedad: devuelve la columna */
export function jugadaCpuGravedad(tablero: Tablero, modo: Modo, azar: Azar = Math.random): number | null {
  const validas = columnasValidas(tablero);
  if (validas.length === 0) return null;
  const totalColumnas = tablero[0].length;

  // Fácil: 50 % de las veces juega al azar
  if (modo === "cpu-easy" && azar() < 0.5) {
    return validas[Math.floor(azar() * validas.length)];
  }

  // 1. Ganar si puede, 2. bloquear al rival
  const ganar = columnaGanadora(tablero, validas, 2);
  if (ganar !== null) return ganar;
  const bloquear = columnaGanadora(tablero, validas, 1);
  if (bloquear !== null) return bloquear;

  // Difícil: evitar columnas que le dejan al rival ganar justo encima
  if (modo === "cpu-hard") {
    const seguras = validas.filter((c) => {
      const r = filaLibre(tablero, c);
      if (r <= 0) return true;
      const conCpu = colocar(tablero, r, c, 2);
      return !comprobarVictoria(colocar(conCpu, r - 1, c, 1), r - 1, c, 1);
    });
    if (seguras.length > 0) return columnaMasCentrada(seguras, totalColumnas);
  }

  return columnaMasCentrada(validas, totalColumnas);
}

/** Jugada de la CPU en casilla libre: devuelve la posición */
export function jugadaCpuLibre(tablero: Tablero, azar: Azar = Math.random): Posicion | null {
  const libres: Posicion[] = [];
  tablero.forEach((fila, r) => fila.forEach((c, col) => c === 0 && libres.push([r, col])));
  if (libres.length === 0) return null;

  for (const jugador of [2, 1] as const) {
    const clave = libres.find(([r, c]) => comprobarVictoria(colocar(tablero, r, c, jugador), r, c, jugador));
    if (clave) return clave; // ganar o bloquear
  }

  const centroR = Math.floor(tablero.length / 2);
  const centroC = Math.floor(tablero[0].length / 2);
  const centro = libres.find(([r, c]) => r === centroR && c === centroC);
  if (centro && azar() < 0.75) return centro;

  return libres[Math.floor(azar() * libres.length)];
}
