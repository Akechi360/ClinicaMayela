import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#3A434D', // Slate Dark
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#9C6348', // Satin Copper Accessible
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#9C6348',
  },
  subtitle: {
    fontSize: 8,
    color: '#5F6C7A', // Slate Light Accessible
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  metaInfo: {
    alignItems: 'flex-end',
    fontSize: 8,
    color: '#5F6C7A',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F5', // Rose Champagne Light
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2E7E2',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    width: '45%',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#5F6C7A',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#3A434D',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#9C6348',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E7E2',
    paddingBottom: 3,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F2E7E2',
    paddingVertical: 5,
    fontFamily: 'Helvetica-Bold',
    color: '#4B5663',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#FBF8F6',
    paddingVertical: 6,
    alignItems: 'center',
  },
  colPatient: {
    width: '35%',
    paddingLeft: 5,
  },
  colDate: {
    width: '20%',
    textAlign: 'center',
  },
  colMethod: {
    width: '15%',
    textAlign: 'center',
  },
  colStatus: {
    width: '15%',
    textAlign: 'center',
  },
  colAmount: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#F2E7E2',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#5F6C7A',
  }
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
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Clínica Mayela</Text>
            <Text style={styles.subtitle}>Reporte Financiero Clínico</Text>
          </View>
          <View style={styles.metaInfo}>
            <Text>Fecha de Generación: {fechaGeneracion}</Text>
            <Text>Total Transacciones: {transacciones.length}</Text>
          </View>
        </View>

        {/* Resumen de Caja */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Ingresado (Caja)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCaja)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#F2E7E2' }} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Pendiente</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPendiente)}</Text>
          </View>
        </View>

        {/* Sección Tabla */}
        <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
        <View style={styles.table}>
          {/* Cabecera de Tabla */}
          <View style={styles.tableHeader}>
            <Text style={styles.colPatient}>Paciente</Text>
            <Text style={styles.colDate}>Fecha</Text>
            <Text style={styles.colMethod}>Método</Text>
            <Text style={styles.colStatus}>Estado</Text>
            <Text style={styles.colAmount}>Monto</Text>
          </View>
          {/* Filas */}
          {transacciones.map((tr) => (
            <View key={tr.id} style={styles.tableRow}>
              <Text style={styles.colPatient}>{tr.paciente?.nombre || 'Paciente Desconocido'}</Text>
              <Text style={styles.colDate}>{tr.fecha}</Text>
              <Text style={styles.colMethod}>{tr.metodo_pago ? tr.metodo_pago.toUpperCase() : 'N/A'}</Text>
              <Text style={styles.colStatus}>{tr.estado === 'completado' ? 'PAGADO' : 'PENDIENTE'}</Text>
              <Text style={styles.colAmount}>{formatCurrency(tr.monto)}</Text>
            </View>
          ))}
        </View>

        {/* Pie de Página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Clínica Mayela Estética Premium • Calle de la Salud 123 • Tel: +34 600 999 888 • www.clinicamayela.com</Text>
        </View>
      </Page>
    </Document>
  );
};
