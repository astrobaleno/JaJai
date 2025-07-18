import db from '@/db/init';

export async function POST(req) {
  try {
    const { chatId } = await req.json();

    // Trova tutti i documenti associati alla chat
    const documents = db.prepare(`SELECT id FROM documents WHERE chat_id = ?`).all(chatId);

    // Elimina i chunks associati a ciascun documento
    for (const doc of documents) {
      db.prepare(`DELETE FROM chunks WHERE document_id = ?`).run(doc.id);
    }

    // Elimina i documenti legati alla chat
    db.prepare(`DELETE FROM documents WHERE chat_id = ?`).run(chatId);

    // Elimina i messaggi della chat
    db.prepare(`DELETE FROM messages WHERE chat_id = ?`).run(chatId);

    // Elimina la chat
    db.prepare(`DELETE FROM chats WHERE id = ?`).run(chatId);

    return new Response('Chat eliminata con successo', { status: 200 });

  } catch (err) {
    console.error("❌ Errore eliminazione chat:", err);
    return new Response('Errore interno', { status: 500 });
  }
}
