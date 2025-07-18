// 📦 Importa l'istanza del database SQLite inizializzato
import db from '@/db/init';

// 🔐 Importa la funzione per generare ID univoci
import { randomUUID } from 'crypto';

// ✉️ Handler per gestire richieste POST a /api/createChat
export async function POST(req) {
  try {
    // 🆔 Genera un ID univoco per la nuova chat
    const chatId = randomUUID();

    // 💾 Inserisce una nuova riga nella tabella "chats"
    // Ora la tabella "chats" contiene solo l'ID e il timestamp, non più i messaggi
    db.prepare(`
      INSERT INTO chats (id)
      VALUES (?)
    `).run(chatId);

    // 📤 Risponde al client con l'ID della nuova chat creata
    return new Response(JSON.stringify({ chatId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    // ❌ In caso di errore, logga il problema e risponde con errore generico
    console.error("❌ Errore nella creazione chat:", err);
    return new Response("Errore interno", { status: 500 });
  }
}
