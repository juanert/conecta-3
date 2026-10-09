import { ConectaTres } from "@/components/conecta-tres";

export default function Inicio() {
  return (
    <main className="container">
      <header>
        <h1>CONECTA 3</h1>
        <p className="subtitle">¡Alinea 3 fichas en vertical, horizontal o diagonal para ganar!</p>
      </header>

      <ConectaTres />

      <footer>
        <span>Conecta 3 en Next.js y React</span>
        <span>Presiona sobre una columna para soltar tu ficha · Teclas 1–6 y R</span>
      </footer>
    </main>
  );
}
