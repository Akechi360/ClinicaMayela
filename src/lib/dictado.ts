import { useCallback, useEffect, useRef, useState } from 'react';

const NUM: Record<string, string> = { una: '1', un: '1', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6', siete: '7', ocho: '8', diez: '10', quince: '15', veinte: '20', treinta: '30' };
const n = (w: string) => NUM[w.toLowerCase()] ?? w;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DOSIS = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|microgramos|miligramos|ml|mililitros|ui|unidades|g|gramos|gotas|tabletas?|c[aá]psulas?|ampollas?|sobres?)\b/i;
const FREC = /cada\s+(\d+|ocho|seis|doce|cuatro)\s*horas?|(\d+|una|dos|tres|cuatro)\s+veces?\s+(?:al|por)\s+d[ií]a|una\s+vez\s+al\s+d[ií]a|en\s+ayunas|(?:en|por)\s+la\s+(?:noche|ma[ñn]ana)|diari[oa]s?|semanal(?:es)?/i;
const DURA = /(?:por|durante)\s+(\d+|una|dos|tres|cuatro|siete|diez|quince|veinte|treinta)\s+(d[ií]as?|semanas?|meses|mes)/i;

/** Convierte el texto dictado ("amoxicilina 500 mg cada 8 horas por 7 días y luego ...") en renglones
 *  estructurados: Medicamento — dosis — frecuencia — duración. Heurístico (sin modelo de lenguaje). */
export function estructurarDictado(texto: string): string {
  const trozos = texto
    .split(/\b(?:luego|despu[eé]s|adem[aá]s|tambi[eé]n|otro medicamento|siguiente)\b|[.;]/i)
    .map((t) => t.replace(/^\s*(y|e|recetar|receta|indicar|prescribir|tomar)\s+/i, '').trim())
    .filter(Boolean);
  return trozos
    .map((t, i) => {
      const d = DOSIS.exec(t);
      if (!d) return `${i + 1}. ${cap(t)}`;
      const nombre = t.slice(0, d.index).trim() || 'Medicamento';
      const f = FREC.exec(t);
      const du = DURA.exec(t);
      const partes = [cap(nombre), `${d[1].replace(',', '.')} ${d[2].toLowerCase()}`];
      if (f) partes.push(f[0].toLowerCase().replace(/^(una|dos|tres|cuatro)(\s+veces)/, (_, a, b) => n(a) + b));
      if (du) partes.push(`por ${n(du[1])} ${du[2].toLowerCase()}`);
      return `${i + 1}. ${partes.join(' — ')}`;
    })
    .join('\n');
}

/* Reconocimiento de voz del navegador (Web Speech API). Chrome/Edge/Safari; en Firefox no existe. */
interface SpeechEv { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface SpeechRec { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: SpeechEv) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start(): void; stop(): void }
type W = { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
const Ctor = (): (new () => SpeechRec) | undefined =>
  typeof window === 'undefined' ? undefined : (window as unknown as W).SpeechRecognition ?? (window as unknown as W).webkitSpeechRecognition;

export function useDictado(onTexto: (textoCrudo: string) => void) {
  const [escuchando, setEscuchando] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  const buf = useRef('');
  const cb = useRef(onTexto);
  useEffect(() => { cb.current = onTexto; }, [onTexto]);
  useEffect(() => () => rec.current?.stop(), []);

  const alternar = useCallback(() => {
    if (rec.current) { rec.current.stop(); return; }
    const R = Ctor();
    if (!R) return;
    const r = new R();
    r.lang = 'es-VE'; r.continuous = true; r.interimResults = false;
    buf.current = '';
    r.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) buf.current += e.results[i][0].transcript + ' '; };
    r.onend = () => { rec.current = null; setEscuchando(false); if (buf.current.trim()) cb.current(buf.current.trim()); };
    r.onerror = () => { rec.current = null; setEscuchando(false); };
    rec.current = r; setEscuchando(true); r.start();
  }, []);

  return { escuchando, soportado: !!Ctor(), alternar };
}
