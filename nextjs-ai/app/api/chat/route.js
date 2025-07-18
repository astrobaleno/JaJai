//route che fa da ponte tra il mio programma e l'AI per chattare

// 📦 importa la funzione che esegue il recupero dei chunk rilevanti dal DB in base a una domanda
import { retrieveRelevantChunks } from '@/utils/retrieval';

//funzione che intercetta ogni richiesta HTTP di tipo POST fatta dal frontend (page.js) all'indirizzo 'api/chat'
export async function POST(req) {       //req rappresenta tutto il pacchetto-richiesta fatto dal front
  const { model, messages, documentId } = await req.json();        //estraggo anche il documentId (se esiste)

  const userMessage = messages[messages.length - 1];    //estraggo l’ultimo messaggio dell’utente (la nuova domanda)

  let contextText = '';    //testo da usare come contesto, se esiste un documento associato

  // 🧠 Se è stato caricato un documento, cerca i chunk più simili alla domanda
  if (documentId) {
    try {
      const chunks = await retrieveRelevantChunks(documentId, userMessage.content);   //recupera dal DB i chunk più rilevanti
      contextText = chunks
        .map((chunk) => `- (p.${chunk.page}) ${chunk.content}`)    //aggiunge numero pagina a ogni pezzo
        .join('\n');    //unisce tutti i chunk in un unico blocco testuale
    } catch (err) {
      console.error("❌ Errore durante il retrieval dei chunk:", err);   //log se retrieval fallisce
    }
  }

  // 🧾 Costruisce l’array di messaggi per l’AI: aggiunge un messaggio di sistema col contesto (se presente)
  const messagesWithContext = [
    ...(contextText
      ? [
          {
            role: 'system',
            content: `Questi sono degli estratti rilevanti dal documento caricato:\n\n${contextText}\n\nRispondi tenendo conto di queste informazioni se pertinenti.`,   // << messaggio che guida l’AI
          },
        ]
      : []),
    ...messages   //mantiene tutti i messaggi precedenti della conversazione
  ];

  //--------  comunicazione API  --------
  console.log("📚 Context da inviare all'AI:", contextText);   // << AGGIUNTA PER DEBUG

  const response = await fetch("http://localhost:11434/api/chat", {       //richiesta al server del'AI
    method: "POST",     //specifico il tipo di richiesta
    headers: {"Content-Type":"application/json"},      //specifico che sto mandando i dati in formato json
    body: JSON.stringify(       //per convertire il mio body in una stringa unica di formato json
    {
        "model": model,        //il modello di AI
        "messages": messagesWithContext,        //uso la versione arricchita con il contesto (se c’è)
        "stream":false      //per ricevere tutta la risposta in un solo json
    })
  }) 

  const data = await response.json()     //ottengo la risposta dall'AI in json e la estraggo in 'data', importante non scordare await!

  return Response.json({ response: data.message.content });       //mando la risposta in formato json al front
}
