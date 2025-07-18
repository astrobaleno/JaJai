'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './page.module.css'   // 👈 importa il CSS Module

export default function HomePage() {
  const router = useRouter()    //hook di Next.js per navigare tra le pagine
  const [documents, setDocuments] = useState([])   //state che conterrà la lista dei documenti caricati

  // ---------  FETCH DOCUMENTI DAL BACKEND ---------
  //al caricamento della pagina, fa una richiesta all'API che restituisce la lista dei documenti salvati nel DB
  useEffect(() => {
    fetch('/api/documents')    //API che restituirà [{id, filename}, ...]
      .then(res => res.json())   //trasforma la risposta in oggetto js
      .then(setDocuments)       //salva l’array dei documenti nello state
      .catch(err => console.error('❌ Errore caricamento documenti:', err))   //log errore in caso di problemi
  }, [])

  // ---------  NAVIGAZIONE VERSO LA CHAT ---------
  //quando l'utente clicca su una card, naviga verso la pagina chat passando l'id della chat nella query string
  const openChat = (chatId) => {
    router.push(`/chat/${chatId}`);
  }

  return (
    <main className="container py-5">
      {/* TITOLO CENTRALE */}
      <h1 className={`text-center mb-5 fw-bold ${styles.title}`}>
        Le tue chat:
      </h1>

      {/* GRIGLIA DELLE CARD */}
      <div className={styles.grid}>
        {/* CARD per ogni documento */}
{documents.map(doc => (
  <div key={doc.id} className={styles.card}>
    {/* ❌ BOTTONE ELIMINA */}
    <button
      className={styles.deleteBtn}
      onClick={async (e) => {
        e.stopPropagation();  // Impedisce il click di propagarsi alla card
      
        const confirmed = window.confirm("Sei sicuro di voler eliminare questa chat?");
      
        if (!confirmed) return; // Utente ha annullato
      
        try {
          const res = await fetch(`/api/deleteChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: doc.chat_id })
          });
      
          if (!res.ok) throw new Error('Errore eliminazione');
      
          // Aggiorna lo stato rimuovendo la chat eliminata
          setDocuments(prev => prev.filter(d => d.chat_id !== doc.chat_id));
        } catch (err) {
          console.error('❌ Errore eliminazione chat:', err);
        }
      }}
      
    >
      ×
    </button>

    {/* ✅ CONTENUTO CLICCABILE */}
    <div
      className={styles.cardContent}
      onClick={() => openChat(doc.chat_id)}
    >
      <div className={styles.filenameWrapper}>
        <span className={styles.filename}>{doc.filename}</span>
      </div>
      <i className="bi bi-file-earmark-text mt-2 fs-3"></i>
    </div>
  </div>
))}


        {/* CARD "AGGIUNGI NUOVA" */}
        <div
          className={`${styles.card} ${styles.addCard}`}   //riutilizza stile base + aggiunge variante per "+" card
          onClick={async () => {
            try {
              const res = await fetch('/api/createChat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [] })   // puoi anche passare null o un messaggio iniziale
              });

              if (!res.ok) throw new Error('Errore creazione chat');

              const data = await res.json();
              router.push(`/chat/${data.chatId}`);   // reindirizza alla nuova chat
            } catch (err) {
              console.error("❌ Errore creazione nuova chat:", err);
            }
          }}
        >
          <i className="bi bi-plus-lg fs-1"></i>
        </div>
      </div>
    </main>
  )
}
