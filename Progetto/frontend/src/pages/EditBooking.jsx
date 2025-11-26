import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";    // useParams è un hook utilizzato per estrarre i parametri dinamici dall'URL

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [booking, setBooking] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [msg, setMsg] = useState("");

  // questo codice prende i dati della prenotazione originale (non quelli modificati)
  useEffect(() => {
    // IN FUTURO usare apiGet invece di fetch
    fetch(`/api/prenotazioni/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setBooking(data);
        setStartTime(data.start_time);
        setEndTime(data.end_time);
      });
  }, []);

  // funzione che gestisce l'invio delle modifiche al server
  const handleUpdate = async (e) => {
    e.preventDefault();

    const res = apiPut("/api/prenotazioni/${id}", { startTime, endTime });
    /* COME FACEVAMO PRIMA
    const res = await fetch(`/api/prenotazioni/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ startTime, endTime }),
    });
    */

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error);
      return;
    }

    nav("/dashboard");
  };

  // poiché il caricamento dei dati è asincrono, è necessario mostrare un messaggio di caricamento finché lo stato booking non viene popolato
  if (!booking) return <p>Caricamento...</p>;

  return (
    <div>
      <h1>Modifica Prenotazione #{id}</h1>

      <form onSubmit={handleUpdate}>
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

        <button type="submit">Salva modifiche</button>
      </form>

      {msg && <p style={{ color: "red" }}>{msg}</p>}
    </div>
  );
}
