import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbTransacciones } from '../services/db';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Search,
  Check
} from 'lucide-react';

export const Finances: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Consultar transacciones
  const { data: transacciones = [], isLoading } = useQuery({
    queryKey: ['transacciones'],
    queryFn: dbTransacciones.listar
  });

  // Mutación para cobrar/conciliar transacción pendiente
  const cobrarMutation = useMutation({
    mutationFn: ({ id, metodo }: { id: string; metodo: 'tarjeta' | 'efectivo' | 'transferencia' }) => 
      dbTransacciones.actualizarEstado(id, 'completado', metodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }
  });

  // Estadísticas financieras
  const totalCaja = transacciones
    .filter(t => t.estado === 'completado')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalPendiente = transacciones
    .filter(t => t.estado === 'pendiente')
    .reduce((sum, t) => sum + t.monto, 0);

  // Datos para el gráfico de Recharts (agrupado por mes)
  const chartData = [
    { name: 'Ene', Ingresos: 12500 },
    { name: 'Feb', Ingresos: 18200 },
    { name: 'Mar', Ingresos: 24500 },
    { name: 'Abr', Ingresos: 31000 },
    { name: 'May', Ingresos: totalCaja }
  ];

  // Filtrar transacciones
  const transaccionesFiltradas = transacciones.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.paciente?.nombre.toLowerCase().includes(query) ||
      t.monto.toString().includes(query) ||
      t.estado.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-8 px-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Finanzas</h2>
          <p className="text-sm text-slate-medium">Control de facturación, caja diaria e ingresos de tratamientos.</p>
        </div>
        <button
          onClick={() => alert('Descargando reporte financiero (formato excel)...')}
          className="bg-pure-white border border-rose-champagne hover:bg-rose-champagne-light text-slate-dark text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
        >
          <FileText size={15} className="text-satin-copper" /> Descargar Reporte
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos completados */}
        <div className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury luxury-hover flex flex-col justify-between h-40 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-110 duration-700"></div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.25em] text-slate-light font-bold mb-1">Ingresos del Mes (Efectivos)</p>
            <h3 className="text-4xl font-display font-normal text-slate-dark mt-1">{formatCurrency(totalCaja)}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-muted-olive text-xs font-semibold mt-2">
            <TrendingUp size={13} className="text-muted-olive" />
            <span className="text-[10px] uppercase tracking-wider">+12.5% vs mes anterior</span>
          </div>
        </div>

        {/* Margen / Más Rentable (Glass Panel Dark) */}
        <div className="glass-panel-dark p-6 rounded-3xl border border-satin-copper/35 shadow-luxury flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border border-satin-copper/10 pointer-events-none"></div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.25em] text-satin-copper-light font-bold mb-1">Tratamiento Estrella</p>
            <h3 className="text-lg font-display font-medium text-pure-white line-clamp-1">Marcación Mandibular</h3>
            <p className="text-[10px] text-rose-champagne/75 leading-relaxed mt-1 line-clamp-2 italic font-light">"Bioestimuladores de colágeno lideran el margen neto trimestral."</p>
          </div>
          <span className="text-[8px] uppercase tracking-widest text-satin-copper-light font-bold">Desglose de Margen Activo</span>
        </div>

        {/* Pendiente de Pago */}
        <div className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury luxury-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[8px] uppercase tracking-[0.25em] text-slate-light font-bold mb-1">Pendiente de Cobro</p>
              <h3 className="text-4xl font-display font-normal text-slate-dark mt-1">{formatCurrency(totalPendiente)}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center border border-satin-copper/15">
              <AlertCircle size={14} />
            </div>
          </div>
          <p className="text-[9px] text-slate-light tracking-wide uppercase font-bold">Citas pendientes de conciliación</p>
        </div>
      </div>

      {/* Chart & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40 flex flex-col">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-dark mb-6">Evolución de Ingresos</h3>
          
          <div className="w-full h-56 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A66E53" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#A66E53" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#8E9AA6" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#8E9AA6" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#3A434D', border: 'none', borderRadius: '12px', color: '#FFFFFF', fontSize: '11px', fontFamily: 'sans-serif' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Ingresos" stroke="#A66E53" strokeWidth={1.8} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions list (Floating Rows) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-sm font-display font-medium tracking-wide text-slate-dark">Transacciones Recientes</h3>
            
            {/* Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar transacción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-pure-white/30 border border-satin-copper/15 focus:ring-1 focus:ring-satin-copper/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-dark focus:outline-none placeholder-slate-light font-sans tracking-wide"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-satin-copper-light" size={12} />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-light">Cargando transacciones...</div>
          ) : transaccionesFiltradas.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-light glass-panel rounded-3xl border border-pure-white/40">No hay transacciones registradas.</div>
          ) : (
            <div className="space-y-3">
              {transaccionesFiltradas.map((tr) => (
                <div key={tr.id} className="floating-row rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group border border-pure-white/40">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pure-white to-rose-champagne/60 border border-satin-copper/20 flex items-center justify-center text-xs text-satin-copper font-bold shadow-sm">
                      {tr.paciente?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h4 className="font-display font-medium text-sm text-slate-dark">{tr.paciente?.nombre}</h4>
                      <p className="text-[9px] text-slate-light mt-0.5 font-bold tracking-wider uppercase">
                        {new Date(tr.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-xs font-semibold text-slate-medium capitalize tracking-wide font-sans">
                      {tr.metodo_pago ? `Vía ${tr.metodo_pago}` : 'Pendiente de cobro'}
                    </div>
                    <div>
                      {tr.estado === 'completado' ? (
                        <span className="flex items-center gap-1.5 text-muted-olive text-[10px] font-bold uppercase tracking-wider bg-muted-olive/10 px-2.5 py-1 rounded-full border border-muted-olive/15">
                          <CheckCircle size={10} /> Pagado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/15 animate-pulse">
                          <AlertCircle size={10} /> Pendiente
                        </span>
                      )}
                    </div>
                    <div className="text-right w-20">
                      <span className="font-display font-semibold text-slate-dark text-base">{formatCurrency(tr.monto)}</span>
                    </div>
                    <div className="text-right">
                      {tr.estado === 'pendiente' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => cobrarMutation.mutate({ id: tr.id, metodo: 'tarjeta' })}
                            className="text-[9px] font-bold text-satin-copper hover:text-pure-white hover:bg-satin-copper border border-satin-copper/25 px-2 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-pure-white/40 cursor-pointer"
                          >
                            Tarjeta
                          </button>
                          <button
                            onClick={() => cobrarMutation.mutate({ id: tr.id, metodo: 'efectivo' })}
                            className="text-[9px] font-bold text-muted-olive hover:text-pure-white hover:bg-muted-olive border border-muted-olive/25 px-2 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-pure-white/40 cursor-pointer"
                          >
                            Efectivo
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-light font-bold uppercase tracking-wider flex items-center justify-end gap-1"><Check size={12} className="text-muted-olive" /> Conciliado</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
