import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api"; 

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [booking, setBooking] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [msg, setMsg] = useState("");
  
  // questo codice prende i dati della prenotazione originale (non quelli modificati) 
  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiGet(`/api/prenotazioni/${id}`);
        const data = res.booking; 

        if (data) {
          setBooking(data);

          // conversione formato data per compatibilità backend 
          if (data.start_time) {
             setStartTime(data.start_time.substring(0, 16).replace(' ', 'T'));
          }
          if (data.end_time) {
             setEndTime(data.end_time.substring(0, 16).replace(' ', 'T'));
          }
        }
      } catch (err) {
        console.error("Errore caricamento:", err);
        setMsg("Impossibile caricare la prenotazione.");
      }
    }

    loadData();
  }, [id]); // si riattiva solo se cambia l'ID

    // funzione che gestisce l'invio delle modifiche al server
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg(""); // resetta errori precedenti

    const res = await apiPut(`/api/prenotazioni/${id}`, { startTime, endTime });

    if (res.error) {
      setMsg(res.error);
    } else {
      nav("/my-bookings");
    }
  };

  // poiché il caricamento dei dati è asincrono, è necessario mostrare un messaggio di caricamento finché lo stato booking non viene popolato
  if (!booking) return <p>Caricamento in corso...</p>;

  return (
    <div>
      <h1>Modifica Prenotazione #{id}</h1>

      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block" }}>Inizio:</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block" }}>Fine:</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <button type="submit">Salva modifiche</button>
        
        <button 
            type="button" 
            onClick={() => nav("/my-bookings")} 
            style={{ marginLeft: "10px", backgroundColor: "#ccc" }}
        >
            Annulla
        </button>
      </form>

      {msg && <p style={{ color: "red", marginTop: "10px" }}>{msg}</p>}
    </div>
  );
}
