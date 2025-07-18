import Database from 'better-sqlite3';         // Importa il driver SQLite
import fs from 'fs';                           // Serve per leggere file dal disco

const db = new Database('./db/database.sqlite');  // Apre o crea il file .sqlite

// Carica lo schema da schema.sql
const schema = fs.readFileSync('./db/schema.sql', 'utf8'); // Legge il file schema.sql come testo
db.exec(schema);                                // Esegue tutto lo schema SQL dentro il DB

export default db;                              // Esporta l’oggetto db per usarlo altrove