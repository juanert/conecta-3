# Conecta 3

Juego de alinear **3 fichas** en vertical, horizontal o diagonal, hecho con **Next.js 16** y **React 19**.
Es la versión en Next.js del juego original en un solo `index.html` (HTML, CSS y JavaScript).

**▶ Jugar en línea: https://conecta-3-iota.vercel.app**

## Características

- 🤖 Contra la CPU en 3 niveles (Fácil, Medio, Difícil) o 👥 2 jugadores en la misma pantalla
- ⬇️ Modo **con gravedad** (estilo Conecta 4) o 🎯 **casilla libre** (estilo tres en raya ampliado)
- Tableros de 3x3, 4x4, 5x4 y 6x5
- Marcador de victorias y empates, sonidos sintetizados (Web Audio API) y confeti al ganar
- Responsive (móvil, tablet y escritorio) y accesible: celdas como botones con etiquetas,
  modal de reglas con `<dialog>`, foco visible y respeto a `prefers-reduced-motion`
- Atajos de teclado: <kbd>1</kbd>–<kbd>6</kbd> sueltan la ficha en esa columna (modo gravedad) y <kbd>R</kbd> reinicia

## Despliegue

Publicado en **Vercel**, conectado a este repositorio: cada `push` a `main` despliega a producción
y cada pull request genera una URL de vista previa.

## Cómo ejecutarlo

Requiere Node.js 24+ y **pnpm** (el proyecto bloquea npm a propósito).

```bash
pnpm install
pnpm dev
```

Abre http://localhost:3000.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Compilación y servidor de producción (la página es estática) |
| `pnpm test` | Pruebas de la lógica del juego y de la IA (Vitest) |
| `pnpm lint` / `pnpm typecheck` | ESLint y TypeScript |

## Estructura

```
src/
├── app/
│   ├── layout.tsx        Fuente Outfit (autoalojada con next/font) y metadatos
│   ├── page.tsx          Página (componente de servidor)
│   └── globals.css       Estilos portados del juego original
├── components/
│   ├── conecta-tres.tsx  Interfaz del juego (componente de cliente)
│   ├── confeti.tsx       Animación de confeti en <canvas>
│   └── modal-reglas.tsx  Reglas en un <dialog> nativo
└── lib/
    ├── juego.ts          Lógica pura: tablero, victoria y la IA de la CPU
    ├── partida.ts        Reducer de la partida (turnos, marcador, mensajes)
    └── sonido.ts         Sonidos con Web Audio API
```

La lógica del juego no depende de React: `juego.ts` y `partida.ts` son funciones puras con pruebas
en `*.test.ts`. El estado se maneja con `useReducer`, así que varios clics seguidos nunca producen
jugadas dobles.

## Seguridad de dependencias

`pnpm-workspace.yaml` aplica políticas contra ataques a la cadena de suministro: espera 3 días antes
de instalar versiones nuevas (`minimumReleaseAge`), bloquea dependencias de fuentes no estándar y
rechaza paquetes que pierden su nivel de confianza.

> `pnpm audit` reporta `braces` (GHSA-vfj7-8cjw-p6xm), una dependencia **solo de desarrollo** que
> llega a través de `eslint-config-next`. No se incluye en el juego que se publica y todavía no hay
> versión corregida.
