import db from '@/db/init';
import ChatClient from '@/components/ChatClient';

export default function ChatPage({ params }) {
  const chatId = params.chatId;

  // 📩 Recupera tutti i messaggi associati alla chat
  const messages = db.prepare(`
    SELECT role, content FROM messages
    WHERE chat_id = ?
    ORDER BY id ASC
  `).all(chatId);

  // 📄 Recupera il documento associato alla chat (se esiste)
  const document = db.prepare(`
    SELECT id AS documentId, filename
    FROM documents
    WHERE chat_id = ?
  `).get(chatId);

  return (
    <ChatClient
      initialMessages={messages}
      chatId={chatId}
      initialDocument={document}   // 👈 passa direttamente il documento
    />
  );
}
