import { retrieveRelevantChunks } from '@/utils/retrieval';

export default async function handler(req, res) {
  try {
    // ✅ Consente solo richieste POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const { documentId, question, topK } = req.body;

    // ❗ Verifica parametri
    if (!documentId || !question) {
      return res.status(400).json({ error: 'documentId e question sono obbligatori' });
    }

    // 🔍 Recupera i chunk più rilevanti
    const chunks = await retrieveRelevantChunks(documentId, question, topK || 5);

    // 📤 Risponde con i chunk ordinati per rilevanza
    return res.status(200).json({ chunks });

  } catch (err) {
    console.error('❌ Errore in /api/retrieve:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
