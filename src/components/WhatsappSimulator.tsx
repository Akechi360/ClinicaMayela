import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send, X, MessageCircle, Calendar } from 'lucide-react';
import { dbCitas, dbPacientes } from '../services/db';

interface Mensaje {
  sender: 'bot' | 'paciente';
  text: string;
  time: string;
}

export const WhatsappSimulator: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { sender: 'bot', text: 'Hola, soy el asistente virtual de Rejuvenece. ¿En qué puedo ayudarte hoy?', time: '17:40' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados del flujo del bot
  const [step, setStep] = useState<'inicio' | 'tratamiento' | 'fecha' | 'confirmacion'>('inicio');
  const [selectedTratamientoId, setSelectedTratamientoId] = useState('');
  const [selectedHora, setSelectedHora] = useState('');

  // Auto-scroll al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isOpen]);

  const addMensaje = (sender: 'bot' | 'paciente', text: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setMensajes(prev => [...prev, { sender, text, time }]);
  };

  const procesarRespuestaBot = async (pacienteMsg: string) => {
    const msg = pacienteMsg.toLowerCase();
    
    // Simular retraso de escritura del bot
    await new Promise(resolve => setTimeout(resolve, 800));

    if (step === 'inicio') {
      if (msg.includes('cita') || msg.includes('agendar') || msg.includes('botox') || msg.includes('labios')) {
        addMensaje('bot', '¡Claro! Con gusto te ayudo a agendar una cita. ¿Qué tratamiento te gustaría realizarte?\n\n1. Toxina Botulínica (Botox)\n2. Ácido Hialurónico Labios\n3. Marcación Mandibular');
        setStep('tratamiento');
      } else {
        addMensaje('bot', 'Hola. Puedo ayudarte a "Agendar una cita" o resolver dudas generales de la clínica. Escribe "agendar cita" para iniciar.');
      }
    } else if (step === 'tratamiento') {
      if (msg.includes('1') || msg.includes('botox') || msg.includes('toxina')) {
        setSelectedTratamientoId('t-1'); // Botox
        addMensaje('bot', 'Has seleccionado: Toxina Botulínica (Botox) (€ 450). Tengo los siguientes horarios libres para mañana:\n\n1. 10:00 AM\n2. 12:30 PM\n3. 4:00 PM\n\nPor favor, responde con el número de la opción que prefieras.');
        setStep('fecha');
      } else if (msg.includes('2') || msg.includes('labios') || msg.includes('ácido') || msg.includes('hialur')) {
        setSelectedTratamientoId('t-2'); // Labios
        addMensaje('bot', 'Has seleccionado: Ácido Hialurónico Labios (€ 380). Tengo los siguientes horarios libres para mañana:\n\n1. 11:30 AM\n2. 1:00 PM\n3. 5:30 PM\n\nPor favor, responde con el número de la opción.');
        setStep('fecha');
      } else {
        addMensaje('bot', 'Por favor selecciona una opción válida:\n1. Botox\n2. Labios\n3. Marcación Mandibular');
      }
    } else if (step === 'fecha') {
      let horaElegida = '';
      if (selectedTratamientoId === 't-1') {
        if (msg.includes('1')) horaElegida = '10:00:00';
        else if (msg.includes('2')) horaElegida = '12:30:00';
        else if (msg.includes('3')) horaElegida = '16:00:00';
      } else {
        if (msg.includes('1')) horaElegida = '11:30:00';
        else if (msg.includes('2')) horaElegida = '13:00:00';
        else if (msg.includes('3')) horaElegida = '17:30:00';
      }

      if (horaElegida) {
        setSelectedHora(horaElegida);
        addMensaje('bot', 'Perfecto. Para finalizar la reserva, por favor escribe tu nombre completo.');
        setStep('confirmacion');
      } else {
        addMensaje('bot', 'Opción de horario no válida. Selecciona 1, 2 o 3.');
      }
    } else if (step === 'confirmacion') {
      const nombrePaciente = pacienteMsg.trim();
      addMensaje('bot', `¡Gracias, ${nombrePaciente}! Procesando tu cita en nuestro sistema...`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // 1. Buscar o crear paciente
        const pacientes = await dbPacientes.listar();
        let paciente = pacientes.find(p => p.nombre.toLowerCase() === nombrePaciente.toLowerCase());
        
        if (!paciente) {
          paciente = await dbPacientes.insertar({
            nombre: nombrePaciente,
            telefono: '+34 600 000 000',
            email: `${nombrePaciente.toLowerCase().replace(/\s+/g, '')}@example.com`,
            fecha_nacimiento: '1990-01-01',
            genero: 'Femenino',
            antecedentes: 'Paciente registrado por bot de WhatsApp.',
            alergias: 'Ninguna conocida.',
            es_vip: false
          });
        }

        // 2. Insertar cita en el día de mañana
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const mañanaStr = mañana.toISOString().split('T')[0];
        const fechaHoraCita = `${mañanaStr}T${selectedHora}`;

        await dbCitas.insertar({
          paciente_id: paciente.id,
          tratamiento_id: selectedTratamientoId,
          fecha_hora: fechaHoraCita,
          estado: 'pendiente',
          notas: 'Cita agendada por bot de WhatsApp de forma autónoma.'
        });

        // 3. Confirmación final
        addMensaje('bot', `✅ ¡Listo, ${nombrePaciente}! Tu cita para mañana a las ${selectedHora.substring(0, 5)} ha sido confirmada y bloqueada en la agenda de la clínica de forma automática. ¡Nos vemos pronto!`);
        
        // Invalidar consultas para que la agenda de la SPA se actualice en tiempo real
        queryClient.invalidateQueries({ queryKey: ['citas'] });
        queryClient.invalidateQueries({ queryKey: ['pacientes'] });
        queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      } catch (err) {
        addMensaje('bot', 'Hubo un problema al registrar la cita. Por favor intenta de nuevo.');
      }
      
      setStep('inicio');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const texto = inputText;
    addMensaje('paciente', texto);
    setInputText('');

    procesarRespuestaBot(texto);
  };

  // Simular flujo rápido de recordatorio clínico automatizado
  const handleSimulateRecordatorio = async () => {
    setIsOpen(true);
    setUnreadCount(0);
    addMensaje('bot', '🔔 [AUTOMATIZACIÓN RECORDATORIO 24H]\nHola Elena Rostova, te recordamos tu cita de Marcación Mandibular mañana a las 11:00 AM. Por favor confirma tu asistencia respondiendo CONFIRMAR o CANCELAR.');
    
    // Simular botón rápido de respuesta
    await new Promise(resolve => setTimeout(resolve, 1000));
    addMensaje('paciente', 'CONFIRMAR');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Buscar la cita de Elena (c-1 o de mañana) y marcarla como confirmada en la DB
    const citas = await dbCitas.listar();
    const citaElena = citas.find(c => c.paciente?.nombre === 'Elena Rostova' && c.estado === 'pendiente');
    if (citaElena) {
      await dbCitas.actualizarEstado(citaElena.id, 'confirmado');
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }

    addMensaje('bot', '¡Muchas gracias por confirmar! Tu estado de cita ha sido actualizado en la agenda de la clínica a: CONFIRMADO ✅.');
  };

  return (
    <>
      {/* Botón flotante circular (WhatsApp Badge) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#5D7D65] hover:bg-[#4E6B55] text-pure-white rounded-full flex items-center justify-center shadow-2xl z-50 transition-all duration-300 hover:scale-110 active:scale-95 group border border-pure-white/25 cursor-pointer"
          title="Simulador de Bot de WhatsApp"
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-satin-copper text-pure-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[480px] glass-panel rounded-2xl shadow-2xl border border-pure-white/45 flex flex-col overflow-hidden z-50 font-sans">
          
          {/* Header del chat */}
          <div className="bg-[#5D7D65]/90 backdrop-blur-md text-pure-white px-4 py-3.5 flex justify-between items-center border-b border-pure-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pure-white/15 flex items-center justify-center text-pure-white font-bold border border-pure-white/20">
                W
              </div>
              <div>
                <p className="text-sm font-semibold">WhatsApp Bot Rejuvenece</p>
                <p className="text-[9px] opacity-75">Asistente Virtual Clínico</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSimulateRecordatorio}
                className="hover:bg-pure-white/10 p-1.5 rounded-xl transition-colors text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-pure-white/25 cursor-pointer px-2"
                title="Simular envío de recordatorio automático"
              >
                <Calendar size={11} /> Test
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-pure-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-pure-white/5">
            {mensajes.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div
                  key={idx}
                  className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed border ${
                    isBot
                      ? 'bg-pure-white/45 text-slate-dark border-pure-white/50 self-start rounded-tl-none backdrop-blur-sm'
                      : 'bg-satin-copper/15 text-slate-dark border-satin-copper/25 self-end rounded-tr-none backdrop-blur-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className="text-[8px] text-slate-medium text-right mt-1 opacity-70 font-semibold">{m.time}</p>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Accesos rápidos sugeridos */}
          <div className="bg-pure-white/20 border-t border-satin-copper/10 p-2.5 flex gap-1.5 overflow-x-auto shrink-0 select-none">
            <button
              onClick={() => {
                addMensaje('paciente', 'Agendar una cita');
                procesarRespuestaBot('Agendar una cita');
              }}
              className="bg-pure-white/50 hover:bg-pure-white/80 text-slate-dark text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl border border-satin-copper/15 shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              Agendar Cita
            </button>
            <button
              onClick={() => {
                addMensaje('paciente', '¿Qué tratamientos ofrecen?');
                addMensaje('bot', 'Ofrecemos tratamientos de vanguardia como:\n- Botox\n- Relleno de Labios\n- Marcación Mandibular\n- Radiesse\n- Peeling Químico\n\n¿Quieres agendar cita para alguno?');
              }}
              className="bg-pure-white/50 hover:bg-pure-white/80 text-slate-dark text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl border border-satin-copper/15 shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              Ver Catálogo
            </button>
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={handleSend} className="bg-pure-white/20 p-2.5 flex gap-2 items-center border-t border-satin-copper/10 shrink-0">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-pure-white/30 border border-satin-copper/15 focus:outline-none focus:ring-1 focus:ring-satin-copper rounded-xl px-4 py-2.5 text-xs text-slate-dark placeholder-slate-light/60 font-sans"
            />
            <button
              type="submit"
              className="bg-[#5D7D65] hover:bg-[#4E6B55] text-pure-white p-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-[#5D7D65]/10"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
