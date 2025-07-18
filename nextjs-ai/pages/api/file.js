// 📄 Importa tutta la libreria PDF.js (versione compatibile con Node) da una build legacy
// Questa versione (`legacy/build/pdf.js`) è pensata per funzionare anche in ambienti server (come Next.js API routes),
// e ti permette di usare funzioni come `getDocument`, `getPage`, `getTextContent` per leggere i PDF.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// 🚫 Disattiva l'uso dei Web Worker per PDF.js
// Normalmente PDF.js tenta di caricare un "worker" per eseguire in background operazioni complesse (utile nei browser),
// ma in ambiente Node non serve e spesso causa errori. Impostando `workerSrc = false`, lo disabiliti completamente.
pdfjsLib.GlobalWorkerOptions.workerSrc = false;


// 🧠 Funzione di embedding tramite Ollama o altro provider
import { getEmbedding } from '@/utils/embedding';

// 🗃️ Importazione database SQLite e generatore di UUID
import db from '@/db/init';
import { randomUUID } from 'crypto';

// 🚫 Disabilita il parser del body per accettare file binari tramite stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✂️ Suddivide un testo lungo in piccoli blocchi ("chunk") sovrapposti, per gestire meglio il processamento
function chunkText(text, maxLength = 500, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxLength, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());
    start += maxLength - overlap;  // si muove in avanti con sovrapposizione
  }
  return chunks;
}

// 📩 Handler dell'API per ricezione e processamento di PDF
export default async function handler(req, res) {
  try {
    // 🔒 Accetta solo richieste POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodo non consentito' });
    }

    // 📦 Inizializza Busboy per parsing multipart/form-data (file upload)
    const busboy = (await import('busboy')).default;
    const bb = busboy({ headers: req.headers });

    let fileBuffer = Buffer.alloc(0);  // buffer dove accumulare il PDF
    let originalFileName = 'uploaded.pdf';  // nome di default
    let chatId = null;  // nuovo campo per collegare il documento alla chat

    // 📂 Gestione dell'upload file
    bb.on('file', (_name, file, info) => {
      console.log("📥 File ricevuto da frontend");
      originalFileName = info.filename || 'uploaded.pdf';

      file.on('data', (data) => {
        console.log(`📄 Ricevuti ${data.length} byte`);
        fileBuffer = Buffer.concat([fileBuffer, data]);
      });

      file.on('end', () => {
        console.log("✅ Ricezione file completata");
      });
    });

    // 🧾 Parsing dei campi extra (es. chatId)
    bb.on('field', (name, value) => {
      if (name === 'chatId') {
        chatId = value;
        console.log("🧷 Campo chatId ricevuto:", chatId);
      }
    });

    // 🏁 Quando Busboy ha finito l'intero parsing
    bb.on('finish', async () => {
      console.log("🏁 Busboy ha finito, avvio parsing PDF per pagine");

      try {
        // 📦 Carica il PDF con pdfjs
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(fileBuffer),
          disableWorker: true
        });
        const pdf = await loadingTask.promise;
        console.log(`📄 Numero totale pagine: ${pdf.numPages}`);

        let allChunks = [];
        let chunkId = 0;

        // 🔁 Estrai testo da ogni pagina
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');

          console.log(`📃 Estratto pagina ${pageNum}: ${pageText.length} caratteri`);

          const pageChunks = chunkText(pageText, 500, 100).map(chunk => ({
            id: chunkId++,
            page: pageNum,
            content: chunk,
          }));
          allChunks.push(...pageChunks);
        }

        console.log(`✂️ Generati ${allChunks.length} chunk totali, inizio embedding...`);

        // 🧠 Calcolo embedding per ciascun chunk
        const embeddedChunks = [];
        for (const chunk of allChunks) {
          try {
            const vector = await getEmbedding(chunk.content);
            embeddedChunks.push({
              ...chunk,
              embedding: vector,
            });
            console.log(`🔢 Embedding per chunk ${chunk.id} (pagina ${chunk.page}): ${vector[0].toFixed(4)}...`);
          } catch (err) {
            console.error(`❌ Errore embedding per chunk ${chunk.id}:`, err);
          }
        }

        console.log(`✅ Embedding completato: ${embeddedChunks.length} chunk vettorializzati`);

        // 💾 Salvataggio nel DB
        const documentId = randomUUID();
        const uploadTime = new Date().toISOString();

        const insertDocument = db.prepare(`
          INSERT INTO documents (id, chat_id, filename, uploaded_at, pages, file_blob)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        insertDocument.run(documentId, chatId, originalFileName, uploadTime, pdf.numPages, fileBuffer);

        const insertChunk = db.prepare(`
          INSERT INTO chunks (document_id, page, content, embedding)
          VALUES (?, ?, ?, ?)
        `);
        for (const chunk of embeddedChunks) {
          insertChunk.run(
            documentId,
            chunk.page,
            chunk.content,
            JSON.stringify(chunk.embedding)
          );
        }

        console.log(`📥 Salvato documento ${documentId} (collegato alla chat ${chatId}) nel DB`);

        // 📤 Risposta al frontend
        return res.status(200).json({ chunks: embeddedChunks, documentId, filename: originalFileName });
      } catch (err) {
        console.error("❌ Errore durante parsing PDF:", err);
        return res.status(500).json({ error: "Errore nella lettura del PDF" });
      }
    });

    // 🚰 Collega lo stream in arrivo al parser Busboy
    req.pipe(bb);

  } catch (err) {
    console.error("❌ Errore generale API file:", err);
    return res.status(500).json({ error: err.message });
  }
}
