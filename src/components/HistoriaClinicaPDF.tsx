import React from 'react';
import { Document, StyleSheet, Text, View } from '@react-pdf/renderer';
import { calcularImc, categoriaImc, progresoHaciaMeta } from '../lib/imc';
import { PDF, FirmaMedico, MetaRow, PdfPage, PdfHeader, pdfStyles as base, textoMedico } from './pdf/pdfBase';

const s = StyleSheet.create({
  entry: { marginBottom: 7, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: PDF.fondo },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontFamily: 'Helvetica-Bold', color: PDF.etiqueta },
  small: { fontSize: 9, color: PDF.etiqueta, lineHeight: 1.45 },
  muted: { fontSize: 9, color: PDF.suave },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { fontSize: 8, color: PDF.oscuro, backgroundColor: PDF.fondo, borderWidth: 1, borderColor: PDF.borde, borderRadius: 8, paddingVertical: 1, paddingHorizontal: 6, marginRight: 4, marginBottom: 3 },
  stats: { flexDirection: 'row', marginBottom: 6 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 6, backgroundColor: PDF.fondo, borderWidth: 1, borderColor: PDF.borde, marginRight: 4, borderRadius: 4 },
  statLabel: { fontSize: 7, color: PDF.etiqueta, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  statValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: PDF.texto },
});

export interface HistoriaClinicaPDFProps {
  paciente: {
    nombre: string; cedula?: string | null; fechaNacimiento?: string | null; edad?: number | null; genero?: string | null;
    telefono?: string | null; email?: string | null; expediente?: string | null;
    antecedentes?: string | null; alergias?: string | null; patologias?: string[]; notas?: string | null;
    estaturaCm?: number | null; pesoMetaKg?: number | null;
  };
  /** Mediciones de peso en orden cronológico (la primera es el peso inicial). */
  mediciones: { fecha: string; pesoKg: number; grasaPct?: number | null }[];
  procedimientos: { fecha: string; tratamiento: string; producto?: string | null; cantidad?: string | null; lote?: string | null; tecnica?: string | null; notas?: string | null }[];
  peptidos: { fechaInicio: string; estado: string; duracionSemanas: number; nombres: string[]; notas?: string | null }[];
  eventos: { fecha: string; tipo: string; severidad: string; estado: string; conducta?: string | null }[];
  examenes: { fecha: string; titulo: string; notas?: string | null }[];
  ordenes: { fecha: string; perfil: string; estudios: string[] }[];
  consentimientos: { fecha: string; tratamiento: string; firmadoEn?: string | null }[];
  fechaEmision: string;
  doctorNombre: string;
  doctorEspecialidad?: string | null;
  doctorMpps?: string | null;
  doctorCol?: string | null;
  doctorTelefono?: string | null;
  firma?: string | null;
  sello?: string | null;
}

const Vacio: React.FC<{ texto: string }> = ({ texto }) => <Text style={s.muted}>{texto}</Text>;

export const HistoriaClinicaPDF: React.FC<HistoriaClinicaPDFProps> = (p) => {
  const pac = p.paciente;
  const inicial = p.mediciones[0];
  const actual = p.mediciones[p.mediciones.length - 1];
  const imc = calcularImc(actual?.pesoKg, pac.estaturaCm);
  const cat = categoriaImc(imc);
  const progreso = progresoHaciaMeta(inicial?.pesoKg, actual?.pesoKg, pac.pesoMetaKg);
  const kg = (n?: number | null) => (n == null ? '—' : `${n} kg`);

  return (
    <Document>
      <PdfPage texto="Historia clínica generada electrónicamente · Documento confidencial" telefono={p.doctorTelefono}>
        <PdfHeader titulo="HISTORIA CLÍNICA" lineas={[`Emitida: ${p.fechaEmision}`, pac.expediente ? `Expediente: ${pac.expediente}` : null]} />

        {/* 1. Filiación */}
        <View style={base.meta}>
          <MetaRow label="Paciente:">{pac.nombre}</MetaRow>
          <MetaRow label="Identificación/DNI:">{pac.cedula || '—'}</MetaRow>
          <MetaRow label="Nacimiento / Edad:">{pac.fechaNacimiento ? `${pac.fechaNacimiento}${pac.edad != null ? ` · ${pac.edad} años` : ''}` : '—'}</MetaRow>
          <MetaRow label="Género:">{pac.genero || '—'}</MetaRow>
          <MetaRow label="Contacto:">{[pac.telefono, pac.email].filter(Boolean).join(' · ') || '—'}</MetaRow>
          <MetaRow label="Médico Tratante:">{textoMedico(p.doctorNombre, p.doctorMpps, p.doctorCol)}</MetaRow>
        </View>

        {/* 2. Antecedentes, alergias y patologías */}
        <Text style={base.section}>Antecedentes, alergias y patologías</Text>
        <View style={{ marginBottom: 4 }}>
          <Text style={s.bold}>Alergias</Text>
          <Text style={[s.small, pac.alergias ? { color: PDF.alerta } : {}]}>{pac.alergias || 'Ninguna conocida'}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={s.bold}>Patologías previas</Text>
          {pac.patologias?.length
            ? <View style={s.chips}>{pac.patologias.map((x) => <Text key={x} style={s.chip}>{x}</Text>)}</View>
            : <Vacio texto="Sin patologías registradas" />}
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={s.bold}>Antecedentes médicos</Text>
          <Text style={s.small}>{pac.antecedentes || 'Sin registrar'}</Text>
        </View>
        {pac.notas ? (
          <View>
            <Text style={s.bold}>Notas generales</Text>
            <Text style={s.small}>{pac.notas}</Text>
          </View>
        ) : null}

        {/* 3. IMC y peso */}
        <Text style={base.section}>Peso e IMC</Text>
        {actual ? (
          <>
            <View style={s.stats} wrap={false}>
              <View style={s.stat}><Text style={s.statLabel}>Peso inicial</Text><Text style={s.statValue}>{kg(inicial.pesoKg)}</Text></View>
              <View style={s.stat}><Text style={s.statLabel}>Peso actual</Text><Text style={s.statValue}>{kg(actual.pesoKg)}</Text></View>
              <View style={s.stat}><Text style={s.statLabel}>Peso meta</Text><Text style={s.statValue}>{kg(pac.pesoMetaKg)}</Text></View>
              <View style={s.stat}><Text style={s.statLabel}>IMC</Text><Text style={s.statValue}>{imc ?? '—'}</Text></View>
            </View>
            <Text style={s.small}>
              {cat ? `Clasificación OMS: ${cat.label}. ` : ''}
              {pac.estaturaCm ? `Estatura: ${pac.estaturaCm} cm. ` : 'Estatura no registrada. '}
              {progreso != null ? `Progreso hacia la meta: ${progreso}%. ` : ''}
              {actual.grasaPct != null ? `Grasa corporal: ${actual.grasaPct}%. ` : ''}
              Última medición: {actual.fecha}.
            </Text>
          </>
        ) : <Vacio texto="Sin mediciones de peso registradas" />}

        {/* 4. Procedimientos */}
        <Text style={base.section}>Evolución por procedimientos ({p.procedimientos.length})</Text>
        {p.procedimientos.length === 0 ? <Vacio texto="Sin procedimientos registrados" /> : p.procedimientos.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryHead}><Text style={s.bold}>{x.tratamiento}</Text><Text style={s.muted}>{x.fecha}</Text></View>
            <Text style={s.small}>
              {[x.producto && `Producto: ${x.producto}`, x.cantidad && `Cantidad: ${x.cantidad}`, x.lote && `Lote: ${x.lote}`, x.tecnica && `Técnica: ${x.tecnica}`].filter(Boolean).join(' · ')}
            </Text>
            {x.notas ? <Text style={s.small}>Notas: {x.notas}</Text> : null}
          </View>
        ))}

        {/* 5. Péptidos */}
        <Text style={base.section}>Protocolos de péptidos ({p.peptidos.length})</Text>
        {p.peptidos.length === 0 ? <Vacio texto="Sin protocolos de péptidos" /> : p.peptidos.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryHead}><Text style={s.bold}>{x.nombres.join(' + ') || 'Protocolo'}</Text><Text style={s.muted}>Inicio: {x.fechaInicio}</Text></View>
            <Text style={s.small}>Estado: {x.estado} · Duración: {x.duracionSemanas} semanas</Text>
            {x.notas ? <Text style={s.small}>Notas: {x.notas}</Text> : null}
          </View>
        ))}

        {/* 6. Efectos adversos */}
        <Text style={base.section}>Efectos adversos ({p.eventos.length})</Text>
        {p.eventos.length === 0 ? <Vacio texto="Sin efectos adversos registrados" /> : p.eventos.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryHead}>
              <Text style={s.bold}>{x.tipo}</Text>
              <Text style={s.muted}>{x.fecha}</Text>
            </View>
            <Text style={s.small}>Severidad: {x.severidad} · Estado: {x.estado.replace('_', ' ')}</Text>
            {x.conducta ? <Text style={s.small}>Conducta médica: {x.conducta}</Text> : null}
          </View>
        ))}

        {/* 7. Exámenes y órdenes */}
        <Text style={base.section}>Exámenes y órdenes de laboratorio</Text>
        {p.ordenes.length === 0 && p.examenes.length === 0 ? <Vacio texto="Sin exámenes ni órdenes registrados" /> : null}
        {p.ordenes.map((x, i) => (
          <View key={`o${i}`} style={s.entry} wrap={false}>
            <View style={s.entryHead}><Text style={s.bold}>Orden de laboratorio · perfil {x.perfil}</Text><Text style={s.muted}>{x.fecha}</Text></View>
            <Text style={s.small}>{x.estudios.join(' · ')}</Text>
          </View>
        ))}
        {p.examenes.map((x, i) => (
          <View key={`e${i}`} style={s.entry} wrap={false}>
            <View style={s.entryHead}><Text style={s.bold}>Resultado: {x.titulo}</Text><Text style={s.muted}>{x.fecha}</Text></View>
            {x.notas ? <Text style={s.small}>{x.notas}</Text> : null}
          </View>
        ))}

        {/* Consentimientos */}
        <Text style={base.section}>Consentimientos informados ({p.consentimientos.length})</Text>
        {p.consentimientos.length === 0 ? <Vacio texto="Sin consentimientos registrados" /> : p.consentimientos.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryHead}><Text style={s.bold}>{x.tratamiento}</Text><Text style={s.muted}>{x.fecha}</Text></View>
            <Text style={s.small}>{x.firmadoEn ? `Firmado el ${x.firmadoEn}` : 'Pendiente de firma'}</Text>
          </View>
        ))}

        {/* 8. Firma y sello */}
        <View style={{ marginTop: 36, flexDirection: 'row', justifyContent: 'flex-end' }} wrap={false}>
          <FirmaMedico nombre={p.doctorNombre} mpps={p.doctorMpps} col={p.doctorCol} firma={p.firma} sello={p.sello} ancho="45%" />
        </View>
      </PdfPage>
    </Document>
  );
};
