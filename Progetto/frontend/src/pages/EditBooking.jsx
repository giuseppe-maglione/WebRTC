import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api";
import "./style/CreateBooking.css"; // Riutilizziamo lo stile di creazione

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [booking, setBooking] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [errorMsg, setErrorMsg] = useState("");   
  const [successMsg, setSuccessMsg] = useState(""); 
   
  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiGet(`/api/prenotazioni/${id}`);
        const data = res.booking || res; 

        if (data) {
          setBooking(data);
          
          if (data.start_time) {
             setStartTime(data.start_time.substring(0, 16).replace(' ', 'T'));
          }
          if (data.end_time) {
             setEndTime(data.end_time.substring(0, 16).replace(' ', 'T'));
          }
        }
      } catch (err) {
        console.error("Errore caricamento:", err);
        setErrorMsg("Impossibile caricare la prenotazione.");
      }
    }
    loadData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    setErrorMsg("");
    setSuccessMsg("");

    const res = await apiPut(`/api/prenotazioni/${id}`, { startTime, endTime });

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Modifica salvata con successo! Reindirizzamento...");      
      setTimeout(() => {
        nav("/my-bookings");
      }, 2000);
    }
  };

  if (!booking && !errorMsg) {
      return (
        <div className="create-page">
            <p style={{color: "#666", fontSize: "1.2rem"}}>Caricamento in corso...</p>
        </div>
      );
  }

  return (
    <div className="create-page">
      <div className="create-card">
        
        <h2 className="form-title">
            Modifica <span>Prenotazione #{id}</span>
        </h2>

        <form onSubmit={handleUpdate} className="booking-form">
          
          <div className="form-group">
            <label>Inizio</label>
            <input
              type="datetime-local"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Fine</label>
            <input
              type="datetime-local"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="btn-container">
            <button type="submit" className="submit-btn" disabled={!!successMsg}>
                {successMsg ? "Salvato!" : "Salva modifiche"}
            </button>
            
            <button 
                type="button" 
                onClick={() => nav("/my-bookings")} 
                className="btn-secondary"
                disabled={!!successMsg}
            >
                Annulla
            </button>
          </div>

        </form>

        {/* Box Messaggi */}
        {errorMsg && (
            <div className="msg-box error">
                ⚠️ {errorMsg}
            </div>
        )}

        {successMsg && (
            <div className="msg-box success">
                ✅ {successMsg}
            </div>
        )}

      </div>
    </div>
  );
}