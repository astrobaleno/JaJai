// 📦 Importa la connessione al database SQLite
import db from '@/db/init';

// 📥 Route API (Next.js) per scaricare un file PDF associato a un documento
export async function GET(req) {
  try {
    // 🌐 Estrae i parametri dalla query string dell'URL (es: ?documentId=abc123)
    const { searchParams } = new URL(req.url);   // crea un oggetto URL basato sulla richiesta
    const documentId = searchParams.get('documentId');   // prende il valore del parametro 'documentId'

    // 🔍 Se manca il parametro documentId: errore 400 (bad request)
    if (!documentId) {
      return new Response('Missing documentId', { status: 400 });
    }

    // 🔎 Recupera dal database il nome del file e il file binario associato al documentId
    const row = db.prepare(`
      SELECT filename, file_blob FROM documents WHERE id = ?
    `).get(documentId);

    // ❌ Se non viene trovato nessun documento o manca il file blob: errore 404
    if (!row || !row.file_blob) {
      return new Response('File not found', { status: 404 });
    }

    // 📤 Restituisce il file come risposta HTTP (con intestazioni per scaricamento)
    return new Response(row.file_blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',   // tipo MIME corretto per file PDF
        'Content-Disposition': `attachment; filename="${row.filename}"`,   // forza il download con nome file originale
      }
    });

  } catch (err) {
    // ❌ In caso di errore inatteso sul server: errore 500
    console.error("❌ Download route error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
