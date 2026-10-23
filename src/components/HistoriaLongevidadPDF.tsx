import React from 'react';
import { Document, StyleSheet, Text, View } from '@react-pdf/renderer';
import { PDF, FirmaMedico, MetaRow, PdfPage, PdfHeader, pdfStyles as base, textoMedico } from './pdf/pdfBase';
import { SECCIONES_LONGEVIDAD, limpiarLongevidad, textoValor, type DatosLongevidad, type SeccionLongevidad } from '../data/longevidad';

const s = StyleSheet.create({
  fila: { flexDirection: 'row', marginBottom: 1.5 },
  etiqueta: { width: 215, paddingRight: 8, fontFamily: 'Helvetica-Bold', color: PDF.etiqueta, fontSize: 9 },
  valor: { flex: 1, fontSize: 9 },
  muted: { fontSize: 9, color: PDF.suave },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  chip: { fontSize: 8, color: PDF.oscuro, backgroundColor: PDF.fondo, borderWidth: 1, borderColor: PDF.borde, borderRadius: 8, paddingVertical: 1, paddingHorizontal: 6, marginRight: 4, marginBottom: 3 },
  alerta: { fontSize: 8, color: PDF.alerta },
  seccion: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: PDF.etiqueta, marginTop: 10, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: PDF.borde, paddingBottom: 3 },
});

export interface HistoriaLongevidadPDFProps {
  paciente: {
    nombre: string; cedula?: string | null; fechaNacimiento?: string | null; edad?: number | null; sexo?: string | null;
    telefono?: string | null; email?: string | null; expediente?: string | null;
    patologias: string[]; alergias?: string | null; antecedentes?: string | null; estaturaCm?: number | null;
    motivo?: string | null;
  };
  /** Fecha de la evaluación ya formateada */
  fechaEvaluacion: string;
  origen: 'consulta' | 'ficha';
  datos: DatosLongevidad;
  fechaEmision: string;
  doctorNombre: string;
  doctorEspecialidad?: string | null;
  doctorMpps?: string | null;
  doctorCol?: string | null;
  doctorTelefono?: string | null;
  firma?: string | null;
  sello?: string | null;
}

const MOTIVO_PROGRAMA =
  'Optimización de la salud metabólica, prevención del envejecimiento celular, mejora del rendimiento físico y cognitivo, y extensión de la etapa de salud activa (healthspan).';

/** Orden y numeración del documento (sigue el modelo de historia clínica de la Dra.). */
const ORDEN: { id: string; titulo: string }[] = [
  { id: 'familiares', titulo: '2. Antecedentes heredofamiliares' },
  { id: 'nutricion', titulo: '3. Antecedentes personales no patológicos · A. Nutrición y salud digestiva' },
  { id: 'actividad', titulo: '3. B. Actividad física y masa corporal' },
  { id: 'sueno_estres', titulo: '3. C. Cronobiología, sueño y estrés' },
  { id: 'exposoma', titulo: '3. D. Exposoma y tóxicos' },
  { id: 'patologicos', titulo: '4. Antecedentes personales patológicos' },
];

const Seccion: React.FC<{ titulo: string; def: SeccionLongevidad | undefined; datos: DatosLongevidad[string] | undefined; extra?: React.ReactNode }> = ({ titulo, def, datos, extra }) => {
  const lineas = (def?.campos ?? [])
    .filter((c) => datos && datos[c.id] != null && datos[c.id] !== '' && !(Array.isArray(datos[c.id]) && (datos[c.id] as unknown[]).length === 0))
    .map((c) => ({ label: c.label, valor: textoValor(c, datos![c.id]) }));
  return (
    <View wrap={false}>
      <Text style={s.seccion}>{titulo}</Text>
      {extra}
      {lineas.length === 0 && !extra ? <Text style={s.muted}>Sin información registrada</Text> : null}
      {lineas.map((l, i) => (
        <View key={i} style={s.fila} wrap={false}>
          <Text style={s.etiqueta}>{l.label}</Text>
          <Text style={s.valor}>{l.valor}</Text>
        </View>
      ))}
    </View>
  );
};

export const HistoriaLongevidadPDF: React.FC<HistoriaLongevidadPDFProps> = (p) => {
  const datos = limpiarLongevidad(p.datos);
  const pac = p.paciente;
  const perfil = datos.perfil ?? {};
  const defPerfil = SECCIONES_LONGEVIDAD.find((x) => x.id === 'perfil');
  const campoPerfil = (id: string) => defPerfil?.campos.find((c) => c.id === id);
  const ocupacion = campoPerfil('ocupacion') && perfil.ocupacion ? textoValor(campoPerfil('ocupacion')!, perfil.ocupacion) : '';
  const estilo = campoPerfil('estilo_vida') && perfil.estilo_vida ? textoValor(campoPerfil('estilo_vida')!, perfil.estilo_vida) : '';
  const estiloTxt = [ocupacion, estilo].filter(Boolean).join(' · ') || '—';

  return (
    <Document>
      <PdfPage texto="Historia clínica de longevidad · Documento confidencial" telefono={p.doctorTelefono}>
        <PdfHeader
          titulo="HISTORIA CLÍNICA · LONGEVIDAD Y SALUD METABÓLICA"
          lineas={[`Evaluación: ${p.fechaEvaluacion}`, `Emitida: ${p.fechaEmision}`, pac.expediente ? `Expediente: ${pac.expediente}` : null]}
        />

        {/* 1. Datos generales */}
        <Text style={[s.seccion, { marginTop: 0 }]}>1. Datos generales del paciente</Text>
        <View style={base.meta}>
          <MetaRow label="Nombre completo:">{pac.nombre}</MetaRow>
          <MetaRow label="Edad / Nacimiento:">{pac.fechaNacimiento ? `${pac.edad != null ? `${pac.edad} años · ` : ''}${pac.fechaNacimiento}` : '—'}</MetaRow>
          <MetaRow label="Sexo:">{pac.sexo || '—'}</MetaRow>
          <MetaRow label="Ocupación / estilo de vida:">{estiloTxt}</MetaRow>
          <MetaRow label="Teléfono / correo:">{[pac.telefono, pac.email].filter(Boolean).join(' · ') || '—'}</MetaRow>
          <MetaRow label="Identificación:">{pac.cedula || '—'}</MetaRow>
          <MetaRow label="Estatura:">{pac.estaturaCm ? `${pac.estaturaCm} cm` : '—'}</MetaRow>
          <MetaRow label="Motivo de consulta:">{pac.motivo?.trim() || MOTIVO_PROGRAMA}</MetaRow>
          <MetaRow label="Médico tratante:">{textoMedico(p.doctorNombre, p.doctorMpps, p.doctorCol)}</MetaRow>
        </View>
        <Text style={s.muted}>
          {p.origen === 'ficha' ? 'Información declarada por el paciente y revisada por el médico tratante.' : 'Información registrada en consulta por el médico tratante.'}
        </Text>

        {ORDEN.map((o) => {
          const def = SECCIONES_LONGEVIDAD.find((x) => x.id === o.id);
          if (o.id === 'patologicos') {
            // Las patologías y alergias viven en el expediente: se muestran aquí como parte de los antecedentes patológicos
            const extra = (
              <View>
                {pac.patologias.length > 0 ? (
                  <View wrap={false} style={{ marginBottom: 4 }}>
                    <Text style={s.etiqueta}>Patologías previas / factores de riesgo</Text>
                    <View style={s.chips}>{pac.patologias.map((t, i) => <Text key={i} style={s.chip}>{t}</Text>)}</View>
                  </View>
                ) : null}
                {pac.alergias?.trim() ? (
                  <View style={s.fila} wrap={false}>
                    <Text style={s.etiqueta}>Alergias / sensibilidades</Text>
                    <Text style={s.valor}>{pac.alergias.trim()}</Text>
                  </View>
                ) : null}
                {pac.antecedentes?.trim() ? (
                  <View style={s.fila} wrap={false}>
                    <Text style={s.etiqueta}>Otros antecedentes (expediente)</Text>
                    <Text style={s.valor}>{pac.antecedentes.trim()}</Text>
                  </View>
                ) : null}
              </View>
            );
            const hayExtra = pac.patologias.length > 0 || !!pac.alergias?.trim() || !!pac.antecedentes?.trim();
            return <Seccion key={o.id} titulo={o.titulo} def={def} datos={datos[o.id]} extra={hayExtra ? extra : undefined} />;
          }
          return <Seccion key={o.id} titulo={o.titulo} def={def} datos={datos[o.id]} />;
        })}

        <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' }} wrap={false}>
          <FirmaMedico nombre={p.doctorNombre} mpps={p.doctorMpps} col={p.doctorCol} firma={p.firma} sello={p.sello} ancho="45%" />
        </View>
      </PdfPage>
    </Document>
  );
};
