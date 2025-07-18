import db from '@/db/init';

export async function POST(req) {
  try {
    const { chatId, role, content } = await req.json();

    if (!chatId || !role || !content) {
      return new Response("Missing fields", { status: 400 });
    }

    db.prepare(`
      INSERT INTO messages (chat_id, role, content)
      VALUES (?, ?, ?)
    `).run(chatId, role, content);

    return new Response("Message saved", { status: 200 });

  } catch (err) {
    console.error("❌ Errore salvataggio messaggio:", err);
    return new Response("Errore interno", { status: 500 });
  }
}
