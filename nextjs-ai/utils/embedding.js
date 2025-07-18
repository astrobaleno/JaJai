/**
 * Funzione per calcolare un embedding vettoriale da un testo, usando Ollama.
 * ⚠️ Richiede che Ollama sia in esecuzione localmente sulla porta 11434,
 *     e che un modello di embedding (es. "nomic-embed-text") sia disponibile.
 */

export async function getEmbedding(text) {
    // Esegue una chiamata HTTP POST all'API locale di Ollama (endpoint degli embedding)
    const response = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",  // 📄 Specifica che il body è JSON
      },
      body: JSON.stringify({
        model: "nomic-embed-text", // 🧠 Modello di embedding usato (puoi sostituirlo con un altro se disponibile)
        prompt: text,              // Il testo per cui vogliamo ottenere l'embedding
      }),
    });
  
    // ❌ Se la risposta NON è ok (es. errore 500 o 400), leggiamo il messaggio di errore
    if (!response.ok) {
      const err = await response.text(); // 📜 Legge il messaggio di errore grezzo come testo
      throw new Error("Errore embedding: " + err); // 🧨 Lancia un errore visibile in console
    }
  
    // ✅ Se tutto è andato bene, parse la risposta JSON
    const data = await response.json();
  
    // Ritorna il campo `embedding`, che è un array di numeri (es. 384 valori float)
    return data.embedding;
  }
  