import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api";

export default function CreateBooking() {
  const nav = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [msg, setMsg] = useState("");   // stato per memorizzare eventuali messaggi di errore restituiti dal server

  // funzione asincrona che gestisce l'invio dei dati del form al backend per creare la nuova prenotazione
  const handleCreate = async (e) => {
    e.preventDefault();

    const res = apiPost("/api/crea-prenotazione", { roomId, startTime, endTime });
    /* COME FACEVAMO PRIMA
    const res = await fetch("/api/crea-prenotazione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roomId, startTime, endTime }),
    });
    */

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error);
      return;
    }

    nav("/dashboard");
  };

  return (
    <div>
      <h1>Crea nuova prenotazione</h1>

      <form onSubmit={handleCreate}>
        <label>
          ID Stanza:
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </label>

        <label>
          Inizio:
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>

        <label>
          Fine:
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>

        <button type="submit">Crea</button>
      </form>

      {msg && <p style={{ color: "red" }}>{msg}</p>}
    </div>
  );
}
