import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";

export default function Rooms() {
    const nav = useNavigate();
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

    // funzione per gestire il click su "Prenota"
    const handleBookClick = (roomId) => {
        // naviga verso la pagina di creazione passando i dati nello 'state'
        nav("/create-booking", {
            state: {
                preSelectedRoom: roomId,
                preSelectedStart: start,
                preSelectedEnd: end
            }
        });
    };

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

            {rooms.length === 0 && <p>Nessuna aula trovata (o nessuna ricerca effettuata).</p>}

            <ul>
                {rooms.map((r) => (
                    <li key={r.id} style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                        <strong>{r.name}</strong> (ID: {r.id}) – {r.location} – capienza: {r.capacity}  
                        <br />
                        
                        {r.available ? (
                            <div style={{ marginTop: "5px" }}>
                                <span style={{ color: "green", fontWeight: "bold", marginRight: "10px" }}>
                                    Disponibile
                                </span>
                                {/* pulsante che appare solo se disponibile */}
                                <button onClick={() => handleBookClick(r.id)}>
                                    Prenota questa aula
                                </button>
                            </div>
                        ) : (
                            <span style={{ color: "red" }}>Occupata</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
