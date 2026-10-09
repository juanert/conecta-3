"use client";

import { useEffect, useRef } from "react";

/** Modal de reglas con <dialog> nativo: Esc lo cierra y el foco queda atrapado dentro */
export function ModalReglas({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (abierto && !dialog.open) dialog.showModal();
    if (!abierto && dialog.open) dialog.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="titulo-reglas"
      onClose={onCerrar}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) => cerrar
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="modal-content">
        <div className="modal-title">
          <span id="titulo-reglas">📖 Cómo jugar a Conecta 3</span>
          <button type="button" className="modal-close-btn" onClick={onCerrar} aria-label="Cerrar reglas">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <Regla>
            <strong>Objetivo:</strong> Sé el primero en conectar <strong>3 fichas de tu color</strong> consecutivas en
            línea recta (horizontal, vertical o diagonal).
          </Regla>
          <Regla>
            <strong>Modo con Gravedad (Recomendado):</strong> Al hacer clic en una columna, la ficha caerá hasta la
            posición más baja disponible, como en el clásico Conecta 4.
          </Regla>
          <Regla>
            <strong>Modo Casilla Libre:</strong> Puedes pulsar directamente en cualquier celda vacía para colocar la ficha
            allí (estilo Tres en raya expandido).
          </Regla>
          <Regla>
            <strong>Modos de juego:</strong> Puedes jugar en solitario contra la Inteligencia Artificial (con 3 niveles de
            dificultad) o en el mismo teclado/pantalla contra un amigo.
          </Regla>
          <Regla>
            <strong>Teclado:</strong> en modo gravedad, pulsa los números <kbd>1</kbd>–<kbd>6</kbd> para soltar la ficha en
            esa columna. <kbd>R</kbd> reinicia la partida.
          </Regla>
        </div>
      </div>
    </dialog>
  );
}

function Regla({ children }: { children: React.ReactNode }) {
  return (
    <div className="rule-item">
      <span className="rule-dot" aria-hidden>
        ●
      </span>
      <span>{children}</span>
    </div>
  );
}
