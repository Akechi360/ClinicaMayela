import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.hytrretjngjlbkkcoeoi:Mayela36048*@aws-1-us-west-2.pooler.supabase.com:6543/postgres';

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
