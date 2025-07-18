'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ModelContext = createContext();

export function useModel() {
  return useContext(ModelContext);
}

export function ModelProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState(null); // inizialmente null

  // Al primo caricamento controlla se c'è un modello salvato nella sessionStorage
  useEffect(() => {
    const savedModel = sessionStorage.getItem("selectedModel");

    if (savedModel) {
      setSelectedModel(savedModel);   // Se trovato, lo usa
    } else {
      // Altrimenti recupera i modelli disponibili dall'API
      fetch("/api/models")
        .then((res) => res.json())
        .then((data) => {
          const firstModel = data.models?.[0]?.name;
          if (firstModel) {
            setSelectedModel(firstModel);
            sessionStorage.setItem("selectedModel", firstModel);
          }
        })
        .catch((err) => console.error("Errore nel caricamento dei modelli:", err));
    }
  }, []);

  // Ogni volta che cambia, salva nella sessionStorage
  useEffect(() => {
    if (selectedModel) {
      sessionStorage.setItem("selectedModel", selectedModel);
    }
  }, [selectedModel]);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}
