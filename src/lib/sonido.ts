/* =========================================================
   SONIDOS SINTETIZADOS (Web Audio API, sin archivos de audio)
========================================================= */

export type Sonido = "ficha" | "victoria" | "empate";

let ctx: AudioContext | null = null;

/** Debe llamarse tras una interacción del usuario (política de autoplay) */
export function iniciarAudio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

export function reproducir(tipo: Sonido) {
  const audio = iniciarAudio();
  if (!audio) return;
  const ahora = audio.currentTime;

  if (tipo === "victoria") {
    // Acorde triunfal: C5, E5, G5, C6
    [523.25, 659.25, 783.99, 1046.5].forEach((frecuencia, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      const inicio = ahora + i * 0.08;
      osc.type = "sine";
      osc.frequency.setValueAtTime(frecuencia, inicio);
      gain.gain.setValueAtTime(0, ahora);
      gain.gain.setValueAtTime(0.2, inicio);
      gain.gain.exponentialRampToValueAtTime(0.001, inicio + 0.4);
      osc.start(inicio);
      osc.stop(inicio + 0.45);
    });
    return;
  }

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);

  if (tipo === "ficha") {
    // Pop resonante de ficha cayendo
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, ahora);
    osc.frequency.exponentialRampToValueAtTime(140, ahora + 0.16);
    gain.gain.setValueAtTime(0.3, ahora);
    gain.gain.linearRampToValueAtTime(0.01, ahora + 0.16);
    osc.start(ahora);
    osc.stop(ahora + 0.16);
  } else {
    // Empate: tono descendente
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ahora);
    osc.frequency.linearRampToValueAtTime(200, ahora + 0.3);
    gain.gain.setValueAtTime(0.15, ahora);
    gain.gain.linearRampToValueAtTime(0.01, ahora + 0.3);
    osc.start(ahora);
    osc.stop(ahora + 0.3);
  }
}
