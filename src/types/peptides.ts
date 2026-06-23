export type PeptideCategory = 'regenerative' | 'nootropic' | 'anti-aging' | 'hormonal' | 'prostate';

export interface Peptide {
  id: string;
  name: string;
  category: PeptideCategory;
  indication: string;
  doses: {
    standard: string;
    range: string;
    unit: 'mcg' | 'mg' | 'IU';
  };
  administration: {
    route: 'subcutaneous' | 'intramuscular' | 'oral' | 'intranasal';
    frequency: string;
    cycleDuration: string;
    preparation?: string;
  };
  contraindications: string[];
  recommendedStudies: string[];
  evidence: string;
  sideEffects: string[];
}

export interface SelectedPeptide {
  peptide: Peptide;
  customDose?: string;
  customNotes?: string;
}

export interface PeptideProtocol {
  id: string;
  paciente_id: string;
  doctor_id: string;
  created_at: string;
  fecha_inicio: string;
  peptidos_seleccionados: SelectedPeptide[];
  intervalo_seguimiento: number;
  notas_medico: string;
  estado: 'borrador' | 'activo' | 'completado' | 'cancelado';
  consentimiento_firmado: boolean;
  fecha_consentimiento?: string;
  duracion_semanas: number;
}

export interface PeptideContraindication {
  condition: string;
  severity: 'absolute' | 'relative';
  affectedPeptides: string[];
}

export const CATEGORY_LABELS: Record<PeptideCategory, string> = {
  regenerative: 'Regenerativo',
  nootropic: 'Nootrópico',
  'anti-aging': 'Anti-aging',
  hormonal: 'Hormonal',
  prostate: 'Salud Prostática',
};

export const CATEGORY_COLORS: Record<PeptideCategory, string> = {
  regenerative: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  nootropic: 'bg-violet-50 text-violet-700 border-violet-200',
  'anti-aging': 'bg-amber-50 text-amber-700 border-amber-200',
  hormonal: 'bg-blue-50 text-blue-700 border-blue-200',
  prostate: 'bg-teal-50 text-teal-700 border-teal-200',
};

export const ROUTE_LABELS: Record<Peptide['administration']['route'], string> = {
  subcutaneous: 'Subcutánea',
  intramuscular: 'Intramuscular',
  oral: 'Oral',
  intranasal: 'Intranasal',
};
