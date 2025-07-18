'use client'

import { useRef, useState, useEffect } from "react";
import { useModel } from "@/app/context/ModelContext";

import { useRouter } from "next/navigation";  


export default function ChatClient({ initialMessages, chatId: initialChatId, initialDocument }) {

  const router = useRouter(); // fuori da handleNewChat

  const textareaRef = useRef(null);

  const [documentId, setDocumentId] = useState(initialDocument?.documentId ?? null);   //memorizza l'ID del documento PDF caricato

  const [filename, setFilename] = useState(initialDocument?.filename ?? null);   //salva il nome del file caricato (serve per il bottone di download)

  const [chatId, setChatId] = useState(initialChatId ?? null); //inizializza lo stato 'chatId' con 'initialChatId' se è definito; altrimenti, con null

  const [isUploadingFile, setIsUploadingFile] = useState(false);   // 👈 stato che indica se un file è in fase di caricamento

  
// Se ricevi messaggi da props li usi, altrimenti imposti il messaggio di sistema
const [messages, setMessages] = useState(() => {
  if (initialMessages && initialMessages.length > 0) {
    return initialMessages;
  } else {
    return [
      {
        role: "system",
        content: `IMPORTANT:
        You will always receive the full conversation history.
        You must treat previous messages as context only.
        Respond ONLY to the user's latest message.
        Do not repeat previous answers unless the user clearly refers to them.
        
        REMEMBER THESE IMPORTANT INFORMATIONS ABOUT YOURSELF:
        you're an AI-bot called JaJai. If you have to speak in Italian, use "eiciao" instead of "Ciao" to say hello. You've been created by Dr. Astro. Here's some informations about Dr. Astro (to say only if requested): he's a fascinating young man, he's a brilliant informatic engineeer and also an artist, he likes manga and videogames (his favorite videogame is EarthBound) and he's a Dragon Ball and also Pokémon expert. Your favorite Pokémon is Porygon (the informatic Pokémon) while Dr. Astro's favorite one is Aipom. Your favorite Dragon Ball character is Android 17 while Dr. Astro's favorite one is Gohan`
      }
    ];
  }
});


  const bottomRef = useRef(null);   //riferimento alla fine della chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });   //scrolla in basso ogni volta che cambiano i messaggi
  }, [messages]);

  const [isLoading, setIsLoading] = useState(false);    //state per impedire che l'utente possa inviare più di una domanda alla volta
  const {selectedModel} = useModel()    //estrae direttamente la proprietà selectedModel dal value di ModelContext

  // ---------  SESSION STORAGE ---------
  //carica i messaggi dalla sessionStorage al caricamento della pagina (eseguito una sola volta)
  useEffect(() => {
    const saved = sessionStorage.getItem("chatMessages");   //cerca nella sessionStorage del browser un valore salvato sotto il nome "chatMessages"
    if (saved) {    //controlla se lo trova
      setMessages(JSON.parse(saved));   //lo inserisce nello state 'messages'
    }
  }, []);
  //salva i messaggi nella sessionStorage ogni volta che cambiano
  useEffect(() => {   //questa funzione si attiva AUTOMATICAMENTE ogni volta che lo state 'messages' cambia
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));   //li salva in formato stringa json perché sessionStorage può salvare solo stringhe
  }, [messages]);   //è ciò che la fa attivare automaticamente: ogni volta che il valore di messages cambia, esegui il codice dentro useEffect


  //appena la pagina si carica, viene selezionata in automatico la textarea per iniziare subito a scrivere
  useEffect(() => {
    textareaRef.current?.focus();   //seleziona la textarea e grazie al '?' evita errore in caso non sia stata ancora caricata
  }, []);   //uso '[]' per dire di eseguirlo una volta sola, al caricamento


  function handleInput() {
    const textarea = textareaRef.current
    if(textarea) {    //controlla che textarea esista davvero
      textarea.style.height = 'auto'    //prima di calcolare la nuova altezza, resetta l’altezza esistente
      
      const maxHeight = 200   //impostiamo un limite massimo di altezza
      if(textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = 'auto';    //fa comparire scrollbar se necessario
      } else {
        textarea.style.height = `${textarea.scrollHeight}px`    //imposta l’altezza esattamente a quella necessaria per contenere tutto il testo
        textarea.style.overflowY = 'hidden';    //resetta lo scroll se non serve
      }
    }
  }


  async function handleSend() {
    const textarea = textareaRef.current;
    if (textarea && !isLoading) {   //controlla che la textarea esista e che l'ai non stia già caricando una risposta
      const value = textarea.value.trim();    //trimma (rimuove spazi) la stringa
      if (value !== '') {   //controlla che la stringa non sia vuota
        const userMessage = { content: value, role: 'user' };  //messaggio dell'utente
        const newMessages = [...messages, userMessage];    //nuovo array completo aggiornato da usare sia per il setState che per l'invio all'AI
  
        setMessages(newMessages);   //aggiorna lo stato con tutta la cronologia più l'ultimo messaggio
        textarea.value = '';
        handleInput();    //resetta l'altezza della textarea
  
        setIsLoading(true);   //blocca il tasto d'invio
  
        setMessages((prev) => [   //aggiunge un messaggio temporaneo (il loading) come risposta da mostrare a schermo
          ...prev,
          { role: 'bot', content: '|', loading: true }
        ]);
  
        console.log(documentId)
  
        // ⚠️ Se questa è la PRIMA volta che viene scritto qualcosa dall'utente,
        // crea la chat nel DB (serve per la home)
        if (!chatId) {
          try {
            const resChat = await fetch('/api/createChat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: newMessages })
            });
  
            if (!resChat.ok) {
              throw new Error('Errore nella creazione della chat');
            }
  
            const chatData = await resChat.json();
            setChatId(chatData.chatId);   // 💾 memorizza localmente l'ID della chat per aggiornamenti futuri
  
          } catch (error) {
            console.error('❌ Errore durante la creazione della chat:', error);
          }
        }
  
        // 💾 Salva il messaggio dell’utente nel DB
        if (chatId) {
          await fetch('/api/saveMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId,
              role: 'user',
              content: value
            })
          });
        }
  
        //--------  comunicazione API  --------
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: newMessages,
            documentId: documentId || null,    // 👈 invia anche l’ID del documento corrente (se esiste)
            chatId: chatId || null             // 👈 invia anche l’ID della chat
          })
        });
  
        if (!res.ok) {
          console.error("ERRORE DEL SERVER:", res.status);
          setMessages((prev) => [
            ...prev,
            { content: "[  SERVER ERROR OCCURED: Please try again later.  ]", role: 'bot', isError: true }
          ]);
          setIsLoading(false);
          return;
        }
  
        const data = await res.json();   //memorizzo il contenuto della response nel json in data
        const cleanResponse = data.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();    //per rimuovere il thinking di deepseek
  
        // 💾 Salva anche la risposta dell’AI nel DB
        if (chatId) {
          await fetch('/api/saveMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId,
              role: 'bot',
              content: cleanResponse
            })
          });
        }
  
        setMessages((prev) => [
          ...prev.slice(0, -1),   //rimuove il messaggio temporaneo "|"
          { content: cleanResponse, role: 'bot' }   //aggiunge la risposta vera
        ]);
      }
    }
    setIsLoading(false);   //sblocca il tasto d'invio
  }
  

  


// ---------  NUOVA CHAT  ---------
// Quando l'utente clicca su "+ Nuova Chat", questa funzione crea una nuova chat nel DB
// e naviga automaticamente verso la pagina della nuova chat appena creata
async function handleNewChat() {
    try {
      // 🚀 Invia richiesta al backend per creare una nuova chat
      const res = await fetch('/api/createChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })   // puoi anche passare un messaggio iniziale
      });
  
      if (!res.ok) {
        throw new Error("Errore nella creazione della chat");
      }
  
      const data = await res.json();             // 🔄 Riceve l'ID della nuova chat creata
      const newChatId = data.chatId;
  
      // 🔁 Reindirizza alla pagina della nuova chat appena creata
      // In questo modo il componente ChatClient riceverà i nuovi parametri via props
      router.push(`/chat/${newChatId}`);
  
    } catch (err) {
      // ❌ In caso di errore nella creazione o nel redirect
      console.error("❌ Errore durante la creazione di una nuova chat:", err);
    }
  }
  
  


  async function handleFileUpload(event) {    //il parametro 'event' sarebbe l'oggetto restituito da HTML quando selezioni un file
    const file = event.target.files[0];   //event.target è l’elemento HTML che ha scatenato l’evento (in questo caso l’<input type="file")
                                          //questo elemento contiene un array files e files[0] indica il primo selezionato (che nel nostro caso è anche l'unico poiché l'utente non può selezionare più file alla volta)
                                         
    setFilename(file.name);   //salva il nome originale del file
                                      
    if (!file) {
      console.warn("📭 Nessun file selezionato");    // gestisce il caso in cui l’utente premi 'annulla' durante la selezione
      return;
    }
  
    // 👇 NUOVO: attiva loading e messaggio temporaneo
    setIsUploadingFile(true);   // 👈 imposta stato "upload in corso"
    setMessages(prev => [...prev, { role: 'bot', content: '⏳ Caricamento del file in corso...', loading: true }]);
  
    //comunicazione API per inviare file al backend
    const formData = new FormData()
    formData.append("file", file)   //'file' è il nome con cui lo riceverà il backend
    formData.append("chatId", chatId);     // collega anche la chat
  
    try {
        const res = await fetch("/api/file", {
            method: "POST",
            body: formData
          });
          
          if (!res.ok) {
            const errorText = await res.text(); // prova a leggere il corpo come testo (anche se è HTML)
            console.error("❌ Errore server durante upload PDF:", errorText);
            return;
          }
          
          let data;
          try {
            data = await res.json(); // ✅ ora siamo sicuri che è JSON valido
          } catch (err) {
            console.error("❌ Errore parsing JSON:", err);
            return;
          }
  
      console.log("✅ Risposta ricevuta dal backend:", data);  
  
      if (!data.documentId) {
        console.error("❌ ID documento non ricevuto:", data);
        return;
      }
  
      // 📌 Salva il documentId nello state locale del frontend per i messaggi futuri
      setDocumentId(data.documentId);
      setFilename(data.filename);   // 👈 aggiunto ora
  
      // ✅ Messaggio di conferma visivo nella chat
      const confirmationMessage = { content: `✅ Documento caricato con successo!`, role: 'bot' };
  
      // ⬇️ Lo aggiunge subito all'interfaccia utente (stato dei messaggi)
      setMessages((prev) => [
        ...prev.slice(0, -1),   // 👈 rimuove il messaggio temporaneo di loading
        confirmationMessage
      ]);
  
      // 💾 Lo salva anche nel database se la chat esiste già
      if (chatId) {
          try {
              await fetch('/api/saveMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  chatId,                          // ID della chat esistente
                  role: 'bot',                     // ruolo del messaggio
                  content: confirmationMessage.content  // contenuto testuale
              })
              });
              console.log("🧠 Messaggio di conferma salvato nel DB");
          } catch (err) {
              console.error("❌ Errore nel salvataggio del messaggio nel DB:", err);
          }
      }
  
    } catch (error) {
      console.error("❌ Errore durante l'upload o la ricezione:", error);  // log in caso di errore totale nella fetch
    } finally {
      setIsUploadingFile(false);   // ✅ disattiva loading
    }
  }
  
  
  
  const hasUserMessages = messages.some((m) => m.role !== 'system');   //controlla se la chat contiene messaggi visibili


  
  

  return (
    <>
      {/* bottone NUOVA CHAT */}
      <div className="d-flex justify-content-end mb-2 me-2" style={{position: 'fixed',
      top: '4rem',
      right: '1rem',
      zIndex: 1050}}>
        <button className="btn btn-primary btn-sm" onClick={handleNewChat} style={{color: "Background"}}>
          + Nuova Chat
        </button>
      </div>
      

      <main style={{ padding: '2rem' }}>
        {/* Se non ci sono messaggi, mostra il messaggio iniziale al centro */}
        {!hasUserMessages && (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{
            height: '75vh',
            textAlign: 'center'
          }}>
            <h1 className="display-5 fw-bold mb-5" style={{ color: '#6e757c' }}>
              <span
                onClick={() => document.getElementById('fileInput')?.click()}   // click simulato
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                Carica un documento
              </span>
              <br />o scrivi qualcosa...
            </h1>
          </div>
        )}
        {/* MESSAGGI */}
        <div className="px-3" style={{ maxWidth: '700px', margin: '0 auto', marginBottom: '120px' }}>
          {messages.filter((msg) => msg.role !== "system").map((msg, index) => (   //mappa uno ad uno i messaggi contenuti nell'array in base al campo "role" di ognuno
            <div key={index}>
              {msg.loading ? (    //se messaggio di loading risposta: lampeggio
                <div className="text-secondary fs-6">
                  <span className="blinking-cursor">|</span>
                </div>
              ) : (   //altrimenti..
                <span
                  className={
                    msg.isError
                      ? 'text-danger fw-semibold'  //se errore: testo rosso + grassetto
                      : msg.content?.startsWith('✅ Documento caricato')  // controllo per la stampa di questo messaggio specifico
                      ? 'text-success fw-semibold'  // verde e grassetto
                      : msg.role === 'user'
                      ? 'text-primary fs-5 fw-semibold'
                      : 'text-secondary fs-6'
                  }
                  style={{ wordBreak: 'break-word', marginBottom: '0.5rem' }}
                >
                  {typeof msg.content === 'string' &&
                    msg.content
                      .split(/(\d+\.\s?\*\*.*?\*\*:?|\*\*.*?\*\*:?)/)   // divide il testo ogni volta che trova "**titoletto**" oppure "1. **titoletto**"
                      .map((part, idx) => {
                  
                    // caso: titoletto numerato (es. "2. **Cuoci l'acqua:**")
                    if (/\d+\.\s?\*\*/.test(part)) {
                      const clean = part.replace(/\d+\.\s?\*\*(.*?)\*\*:?/, '$1');  // estrae solo il testo tra gli asterischi
                      const number = part.match(/^(\d+\.)/)?.[1] || '';             // prende il numero (es. "2.")
                      return (
                        // stampa il numero + titolo in grassetto su una riga a sé
                        <div key={idx} style={{ fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
                          {number} {clean}
                        </div>
                      );
                    }
                    // caso: titoletto normale (es. "**Ingredienti:**")
                    if (/^\*\*/.test(part)) {
                      const clean = part.replace(/\*\*/g, '');   // rimuove gli asterischi
                      return (
                        <div key={idx} style={{ fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
                          {clean}
                        </div>
                      );
                    }
                    // caso normale: testo semplice
                    return (
                      <div key={idx} style={{ marginBottom: '0.5rem' }}>
                        {part}
                      </div>
                    );
                  })}
                </span>
              )}
              {msg.role === 'bot' && (<hr className="hr-divider" />)}
            </div> 

          ))}
          <div ref={bottomRef} />
        </div>


        {/* WRAPPER A TUTTA LARGHEZZA
        posizione dinamica: se chat vuota -> centra verticalmente la textarea; altrimenti -> fissata in basso come sempre*/}
        <div
          className={`start-0 w-100 ${!hasUserMessages ? 'position-absolute top-50 translate-middle-y' : 'position-fixed bottom-0'}`}
          style={{
            backgroundColor: 'var(--background)', 
            padding: '1rem 0',
            zIndex: 1050,
            marginTop: !hasUserMessages ? '9rem' : 0   // 👈 solo se chat vuota
          }}
        >

            {/* div della textarea */}
            <div className="position-fixed bottom-0 start-50 translate-middle-x w-100 d-flex justify-content-center px-3 mb-2"
            style={{
                maxWidth: '700px',
                backgroundColor: 'var(--background)',   //background personalizzato
                padding: '1rem',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem'
            }}
            >
            {/* wrapper completo: bottone file + textarea + invio */}
            <div className="d-flex gap-2 w-100 align-items-end">
                
                {/* BOTTONE FILE */}
                {!documentId ? (
                <>
                    {/* bottone ALLEGA FILE */}
                    <input
                    type="file"
                    accept=".pdf"
                    id="fileInput"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={isUploadingFile}   // disabilita durante il loading
                    />
                    <label
                    htmlFor="fileInput"
                    className="btn btn-secondary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                    >
                    <i className="bi bi-paperclip fs-5"></i>
                    </label>
                </>
                ) : (
                <>
                    {/* bottone DOWNLOAD FILE */}
                    <a
                    href={`/api/download?documentId=${documentId}`}   //link diretto alla route API
                    className="btn btn-secondary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                    download
                    >
                    <i className="bi bi-file-earmark-arrow-down fs-5"></i>
                    </a>
                </>
                )}

                {/* TEXTAREA */}
                <textarea
                className="form-control rounded-pill shadow-sm"
                ref={textareaRef}
                onInput={handleInput}
                onKeyDown={(e) => {
                    if(isLoading) {
                    return;
                    }
                    if(isUploadingFile) {
                    return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    }
                }}
                placeholder="Scrivi qualcosa..."
                rows={1}
                style={{
                    width: '100%',
                    resize: 'none',
                    overflow: 'hidden'
                }}
                />

                {/* BOTTONE INVIO */}
                <button
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center btn-send"
                style={{color: "Background", width: '40px', height: '40px' }}
                onClick={handleSend}
                disabled={isLoading||isUploadingFile}    //disabilita bottone se sta caricando
                >
                ➤
                </button>

            </div>
            </div>

        </div>
        
        
      </main>
    </>
  );

}
