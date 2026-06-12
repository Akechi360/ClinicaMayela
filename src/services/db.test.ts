// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { dbPacientes, dbTratamientos, inicializarDB } from './db';

describe('Servicio de Base de Datos LocalStorage (db.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    inicializarDB();
  });

  it('debería inicializar las tablas semilla correctamente', async () => {
    const pacientes = await dbPacientes.listar();
    const tratamientos = await dbTratamientos.listar();
    expect(pacientes.length).toBeGreaterThan(0);
    expect(tratamientos.length).toBeGreaterThan(0);
  });

  it('debería insertar un paciente nuevo con un ID autogenerado', async () => {
    const nuevo = await dbPacientes.insertar({
      nombre: 'Prueba Paciente',
      telefono: '123456789',
      email: 'prueba@paciente.com',
      fecha_nacimiento: '1990-01-01',
      genero: 'Femenino',
      antecedentes: 'Ninguno',
      alergias: 'Ninguna',
      es_vip: false,
    });

    expect(nuevo.id).toBeDefined();
    expect(nuevo.nombre).toBe('Prueba Paciente');

    const lista = await dbPacientes.listar();
    expect(lista.find(p => p.id === nuevo.id)).toBeDefined();
  });

  it('debería eliminar un paciente de la lista', async () => {
    const listaOriginal = await dbPacientes.listar();
    const primerPacienteId = listaOriginal[0].id;

    await dbPacientes.eliminar(primerPacienteId);

    const listaNueva = await dbPacientes.listar();
    expect(listaNueva.find(p => p.id === primerPacienteId)).toBeUndefined();
  });
});
