import React from 'react';
import { Document, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PDF, PdfPage, PdfHeader, pdfStyles as base } from './pdf/pdfBase';

const styles = StyleSheet.create({
  summaryBox: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: PDF.fondo, padding: 15,
    borderRadius: 6, borderWidth: 1, borderColor: PDF.borde, marginBottom: 20,
  },
  summaryItem: { alignItems: 'center', width: '45%' },
  summaryLabel: { fontSize: 8, color: PDF.etiqueta, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  summaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: PDF.texto },
  table: { width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: PDF.fondo, borderBottomWidth: 1, borderBottomColor: PDF.borde, paddingVertical: 5, fontFamily: 'Helvetica-Bold', color: PDF.etiqueta },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PDF.fondo, paddingVertical: 6, alignItems: 'center', fontSize: 9 },
  colPatient: { width: '35%', paddingLeft: 5 },
  colDate: { width: '20%', textAlign: 'center' },
  colMethod: { width: '15%', textAlign: 'center' },
  colStatus: { width: '15%', textAlign: 'center' },
  colAmount: { width: '15%', textAlign: 'right', paddingRight: 5 },
});

interface TransactionItem {
  id: string;
  paciente?: {
    nombre: string;
  };
  fecha: string;
  metodo_pago?: string;
  estado: string;
  monto: number;
}

interface ReporteFinancieroPDFProps {
  transacciones: TransactionItem[];
  totalCaja: number;
  totalPendiente: number;
}

export const ReporteFinancieroPDF: React.FC<ReporteFinancieroPDFProps> = ({
  transacciones,
  totalCaja,
  totalPendiente
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Document>
      <PdfPage texto="Informe generado electrónicamente">
        <PdfHeader titulo="INFORME FINANCIERO" lineas={[`Fecha: ${fechaGeneracion}`, `Total transacciones: ${transacciones.length}`]} />

        {/* Resumen de Caja */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Ingresado (Caja)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCaja)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: PDF.borde }} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Pendiente</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPendiente)}</Text>
          </View>
        </View>

        <Text style={base.section}>Transacciones Recientes</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colPatient}>Paciente</Text>
            <Text style={styles.colDate}>Fecha</Text>
            <Text style={styles.colMethod}>Método</Text>
            <Text style={styles.colStatus}>Estado</Text>
            <Text style={styles.colAmount}>Monto</Text>
          </View>
          {transacciones.map((tr) => (
            <View key={tr.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colPatient}>{tr.paciente?.nombre || 'Paciente Desconocido'}</Text>
              <Text style={styles.colDate}>{tr.fecha}</Text>
              <Text style={styles.colMethod}>{tr.metodo_pago ? (tr.metodo_pago === 'pago_movil' ? 'PAGO MÓVIL' : tr.metodo_pago.toUpperCase()) : 'N/A'}</Text>
              <Text style={styles.colStatus}>{tr.estado === 'completado' ? 'PAGADO' : 'PENDIENTE'}</Text>
              <Text style={styles.colAmount}>{formatCurrency(tr.monto)}</Text>
            </View>
          ))}
        </View>
      </PdfPage>
    </Document>
  );
};
