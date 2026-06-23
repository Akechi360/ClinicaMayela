import fs from 'fs';
import pkg from 'pg';
import 'dotenv/config';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida en las variables de entorno (.env)');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function run() {
  try {
    console.log('Conectando a Supabase...');
    await client.connect();
    console.log('Conexión establecida. Ejecutando schema.sql...');
    
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Tablas y Políticas creadas exitosamente.');
  } catch (err) {
    console.error('❌ Error al crear esquema:', err);
  } finally {
    await client.end();
  }
}

run();
