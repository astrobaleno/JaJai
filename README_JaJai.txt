# 🧠 JaJai – AI con RAG su PDF 📄💬

Un assistente AI che permette all’utente di caricare file PDF, porre domande, e ottenere risposte basate sul contenuto del documento. Utilizza un sistema RAG (Retrieval Augmented Generation) con embedding semantico, salvataggio chat/documenti e frontend reattivo.

---

## 📁 Funzionalità principali

- Upload di PDF e parsing automatico.
- Embedding dei chunk tramite Ollama.
- Retrieval semantico + risposte contestuali via AI.
- Salvataggio persistente di chat, messaggi e documenti.
- Download del file PDF caricato.
- Routing dinamico per ogni conversazione.
- Dashboard homepage con lista delle chat.

---

## 🚀 Requisiti

### ✅ Software necessari

- Node.js (v18 o superiore)
- SQLite
- Ollama (installato e in esecuzione, con modello tipo `llama3` o simile)

### ✅ Modelli AI richiesti su Ollama

    ollama pull llama3
    ollama pull nomic-embed-text

---

## 🛠️ Installazione

### 1. Clona il repository

    git clone https://github.com/tuo-username/jajai-chat.git
    cd jajai-chat

### 2. Installa le dipendenze

    npm install

### 3. Inizializza il database

Verifica che esista la cartella `/db` con lo script SQL.

Esegui manualmente lo script `init.sql` per creare le tabelle:

    sqlite3 ./db/database.sqlite < ./db/init.sql

Oppure avvia direttamente l'app: le tabelle verranno create alla prima esecuzione, se lo script lo prevede.

---

## ▶️ Avvio

    npm run dev

L'app sarà disponibile su:  
👉 http://localhost:3000

---

## 📦 Struttura progetto

    app/
      ├── page.js                // Homepage (dashboard delle chat)
      ├── chat/[chatId]/         // Chat dinamica
      ├── api/
           ├── file/             // API upload file
           ├── chat/             // API conversazione AI
           ├── retrieve/         // Retrieval semantico
           ├── download/         // Download PDF caricato
           ├── createChat/       // Nuova chat
           ├── saveMessage/      // Salvataggio messaggi
           ├── deleteChat/       // Eliminazione chat
    components/
      ├── ChatClient.js          // Componente client della chat
    db/
      ├── init.js                // Connessione SQLite
      ├── init.sql               // Schema DB
    utils/
      ├── embedding.js           // Calcolo embedding
      ├── retrieval.js           // Retrieval semantico e pagine

---

## 💡 Consigli

- Se usi **modelli locali**, assicurati che **Ollama** sia avviato prima dell’app.
- Il sistema supporta più chat, ognuna associata al proprio documento.
- Puoi adattare facilmente il sistema a nuovi formati (es. .txt) estendendo il parser in `/api/file`.

---

## 🧽 Troubleshooting

- ❗ *Errore `Unexpected token <`*: il backend ha restituito HTML (errore server). Controlla i log console.
- ❗ *Messaggio “No such table”*: assicurati che il DB sia inizializzato correttamente (`init.sql`).
- ❗ *Errore embedding*: verifica che `nomic-embed-text` sia disponibile su Ollama.

---

## 👤 Autore

👨‍💻 Creato da **Dr. Astro** (aka Astro/Astrobaleno/JaJi).

---

## 📜 Licenza

MIT – puoi usarlo liberamente per scopi personali, educativi o di sviluppo.