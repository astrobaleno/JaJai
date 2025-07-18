//route che fa da ponte tra il mio programma e l'AI per ottenere i modelli disponibili

export async function GET(req) {
    const res = await fetch("http://localhost:11434/api/tags", {
      method: "GET"
    });
  
    if (!res.ok) {
      return Response.json({ error: 'Impossibile recuperare i modelli.' }, { status: 500 });
    }
  
    const data = await res.json();
  
    // ❌ Filtra i modelli non adatti alla conversazione
    const filteredModels = data.models.filter(
      model => model.name !== "nomic-embed-text:latest"     //escludo il modello che serve per l'embedding
    );
  
    return Response.json({ models: filteredModels });
  }
  