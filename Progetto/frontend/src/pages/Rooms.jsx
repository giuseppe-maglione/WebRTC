import { useState } from "react";
import { apiGet } from "../api";

export default function Rooms() {
const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [rooms, setRooms] = useState([]);     // array che conterrà l'elenco delle aule restituite dal server
    const [error, setError] = useState(""); 

    async function loadRooms() {
        setError("");

        // validazione frontend
        if (!start || !end) {
            setError("Inserisci sia l'orario di inizio che di fine.");
            return;
        }

        try {
            const res = await apiGet(
                `/api/aule-disponibili?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
            );

            setRooms(res.rooms || []);      // aggiorna lo stato di rooms con l'elenco delle aule restituite dal server
        } catch (err) {
            console.error(err);
            setError("Errore nel caricamento delle aule.");
        }
    }

    return (
        <div>
            <h2>Verifica disponibilità aule</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "300px" }}>
                
                <label>Data / Ora inizio</label>
                <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />

                <label>Data / Ora fine</label>
                <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                />

                <button onClick={loadRooms}>Cerca Aule</button>

                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>

            <hr />

            <h3>Risultati</h3>

            {rooms.length === 0 && <p>Nessuna aula trovata...</p>}

            <ul>
                {rooms.map((r) => (
                    <li key={r.id}>
                        <strong>{r.name}</strong> – {r.location} – cap: {r.capacity}  
                        <br />
                        {r.available ? (
                            <span style={{ color: "green" }}>Disponibile</span>
                        ) : (
                            <span style={{ color: "red" }}>Occupata</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
