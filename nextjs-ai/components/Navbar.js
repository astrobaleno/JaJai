'use client';

import Link from "next/link";

import { useState, useEffect } from "react";
import Image from "next/image";

import 'bootstrap/dist/css/bootstrap.min.css';
import { useModel } from "@/app/context/ModelContext";


export default function Navbar() {
  const [theme, setTheme] = useState("dark");   //crea theme e lo setta dark di default
  useEffect(() => {     //se presente nel sessionStorage carica il tema che aveva scelto l'utente
    const savedTheme = sessionStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  const [models, setModels] = useState([])
  const {selectedModel, setSelectedModel} = useModel()    //parentesi graffe perche faccio destructuring da oggetto anziché da array 

  //importa bootstrap js solo lato client (questo fa in modo che il codice venga eseguito solo nel browser, non nel server, evitando l'errore)
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  //cambia il tema
  useEffect(() => {
    document.documentElement.className = theme;
    sessionStorage.setItem("theme", theme);   //salva tema nel sessionStorage
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  //ottiene i modelli all'avvio
  useEffect(() => {
    async function fetchModels() {
      try{
        const res = await fetch("/api/models")
        const data = await res.json()
        setModels(data.models ||[])
      } catch(err) {
        console.error("Errore nel caricamento dei modelli", err)
      }
    }
    fetchModels()
  }, [])

  return (
    <header className="navbar-custom">
      <div className="container-fluid position-relative px-4 py-2 d-flex justify-content-between align-items-center">
        
        {/* SINISTRA: Dropdown selezione modello */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-fixed-gray">Modello AI: </span>
          <div className="dropdown">
            <button
              className="btn btn-sm btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {selectedModel || "Seleziona"}
            </button>
            <ul className="dropdown-menu">
              {models.length === 0 && (
                <li><span className="dropdown-item text-muted">Caricamento...</span></li>
              )}
              {models.map((model, index) => (
                <li key={index}>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={() => setSelectedModel(model.name)}
                  >
                    {model.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CENTRO: Logo centrato assolutamente */}
        <div className="position-absolute start-50 translate-middle-x">
        <Link href="/" passHref>
          <Image
            src="/images/JaJai-LOGO.png"
            alt="AstroAI logo"
            width={89}
            height={40}
            style={{ objectFit: "contain", cursor: "pointer" }}
            priority
          />
        </Link>
        </div>

        {/* DESTRA: Tema e versione */}
        <div className="d-flex align-items-center gap-3">
          <span className="text-fixed-gray">v2.0</span>

          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="themeSwitch"
              checked={theme === "dark"}
              onChange={toggleTheme}
              style={{ cursor: "pointer" }}
            />
            <label className="form-check-label text-fixed-gray" htmlFor="themeSwitch">
              {theme === "dark" ? <i className="bi bi-moon-fill" style={{ color: '#ffe700' }}></i> : <i className="bi bi-sun-fill" style={{ color: '#ffe700' }}></i>}
            </label>
          </div>
        </div>

      </div>
    </header>

  );
}
