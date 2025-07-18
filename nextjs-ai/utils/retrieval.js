// RETRIEVAL
// Scopo: recuperare i chunk più rilevanti rispetto a una domanda dell'utente

// 1. Funzione che calcola l'embedding della domanda
import { getEmbedding } from '@/utils/embedding';
import db from '@/db/init';

// Calcola la distanza coseno tra due vettori
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 🔍 Nuova funzione di ricerca: recupera chunk per numero di pagina
function retrieveChunksByPage(documentId, pageNumber) {
  return db.prepare('SELECT * FROM chunks WHERE document_id = ? AND page = ?')
           .all(documentId, pageNumber);
}

// Recupera chunk rilevanti per una data domanda
export async function retrieveRelevantChunks(documentId, userQuery, topK = 5) {
  // 🧠 Controlla se la domanda contiene "pagina N"
  const match = userQuery.match(/pagina\s+(\d+)/i);   // cerca es. "pagina 3"
  if (match) {
    const pageNumber = parseInt(match[1]);
    const pageChunks = retrieveChunksByPage(documentId, pageNumber);
    console.log(`📄 Rilevati chunk per pagina ${pageNumber}: ${pageChunks.length}`);
    return pageChunks;   // 🔁 restituisce direttamente i chunk di quella pagina
  }

  // 🔁 Altrimenti, procedi con la ricerca semantica classica
  const queryEmbedding = await getEmbedding(userQuery);

  // Recupera tutti i chunk del documento
  const chunks = db.prepare('SELECT * FROM chunks WHERE document_id = ?').all(documentId);

  // Calcola la similarità coseno tra la domanda e ogni chunk
  const scoredChunks = chunks.map(chunk => {
    const chunkEmbedding = JSON.parse(chunk.embedding);   // l'embedding è memorizzato come stringa JSON
    const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
    return { ...chunk, score };   // mantiene i dati originali del chunk (id, page, content, ecc.) e aggiunge il punteggio di rilevanza
  });

  // Ordina per similarità (score) decrescente e restituisce i primi topK
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);    // restituisce solo i chunk più rilevanti
}
