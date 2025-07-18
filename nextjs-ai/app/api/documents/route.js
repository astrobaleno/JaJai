import db from '@/db/init'   // importa l'istanza del database SQLite

// ---------  API GET /api/documents  ---------
// questa route viene chiamata dalla homepage per ottenere la lista dei documenti salvati
export async function GET() {
  try {
    // 🔍 query: seleziona anche 'chat_id' oltre a 'id' e 'filename'
    // così potremo aprire direttamente la chat collegata
    const rows = db.prepare(`
      SELECT id, filename, chat_id
      FROM documents 
      ORDER BY uploaded_at DESC
    `).all();

    // 📤 risponde con array JSON es: [{id: "...", filename: "...", chat_id: "..."}, ...]
    return Response.json(rows);

  } catch (err) {
    console.error("❌ Errore DB:", err);    // log in caso di problemi
    return new Response('Internal Server Error', { status: 500 });   // risposta generica di errore
  }
}
