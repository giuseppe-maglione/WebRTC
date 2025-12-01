import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost } from "../api";

export default function CreateBooking() {
  const nav = useNavigate();
  const location = useLocation(); // hook per leggere i dati passati eventualmente da room (state)

  const { preSelectedRoom, preSelectedStart, preSelectedEnd } = location.state || {};
  // usa i dati precompilati come valori iniziali, altrimenti stringa vuota
  const [roomId, setRoomId] = useState(preSelectedRoom || "");
  const [startTime, setStartTime] = useState(preSelectedStart || "");
  const [endTime, setEndTime] = useState(preSelectedEnd || "");

  const [errorMsg, setErrorMsg] = useState("");   // messaggio rosso (errore)
  const [successMsg, setSuccessMsg] = useState(""); // messaggio verde (successo)

  // funzione asincrona che gestisce l'invio dei dati del form al backend per creare la nuova prenotazione
  const handleCreate = async (e) => {
    e.preventDefault();

    // resettiamo i messaggi precedenti
    setErrorMsg("");
    setSuccessMsg("");

    try {

      const data = await apiPost("/api/crea-prenotazione", { roomId, startTime, endTime });
      // const data = await res.json();

      if (data.error) {
        setErrorMsg(data.error || "Errore sconosciuto");
        return;
      }

      // successo
      setSuccessMsg("Prenotazione creata con successo! Reindirizzamento...");
      // attesa di 2 secondi e reindirizzamento
      setTimeout(() => {
        nav("/my-bookings"); 
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Errore di connessione al server.");
    }
  };

return (
    <div>
      <h1>Crea nuova prenotazione</h1>

      <form onSubmit={handleCreate}>
        <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block" }}>ID Stanza:</label>
            <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
            />
        </div>

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

        <button type="submit" disabled={!!successMsg}>
            {successMsg ? "Attendi..." : "Crea"}
        </button>
      </form>

      {/* messaggio di errore (rosso) */}
      {errorMsg && <p style={{ color: "red", marginTop: "10px" }}>{errorMsg}</p>}

      {/* messaggio di successo (verde) */}
      {successMsg && (
        <p style={{ color: "green", fontWeight: "bold", marginTop: "10px" }}>
            {successMsg}
        </p>
      )}
    </div>
  );
}
