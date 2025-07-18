-- Table: chat
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- Table: documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL, -- ogni documento è associato a una chat
  filename TEXT NOT NULL,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  pages INTEGER,
  file_blob BLOB,
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);


-- Table: chunks
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL,
  page INTEGER,
  content TEXT,
  embedding TEXT, -- JSON.stringify(array)
  FOREIGN KEY (document_id) REFERENCES documents(id)
);


-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,          -- 'user' o 'bot'
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id)  -- se esiste anche la tabella chats
);
