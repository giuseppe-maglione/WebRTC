import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";
import "./style/Rooms.css"; 

export default function Rooms() {
    const nav = useNavigate();

    // STATI SEPARATI PER DATA E ORA
    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    async function loadRooms() {
        setError("");
        setSearched(true); // Imposta che abbiamo provato a cercare

        // 1. Validazione Campi Vuoti
        if (!selectedDate || !startTime || !endTime) {
            setError("Inserisci la data e gli orari di inizio e fine.");
            return;
        }

        // 2. NUOVA VALIDAZIONE: Controllo coerenza orari
        // Essendo stringhe "HH:MM", possiamo confrontarle direttamente
        if (startTime >= endTime) {
            setError("L'orario di inizio deve essere precedente all'orario di fine.");
            setRooms([]); // Pulisce eventuali risultati precedenti per evitare confusione
            return;
        }

        // Combinazione stringhe per creare il formato datetime-local (YYYY-MM-DDTHH:MM)
        const startFull = `${selectedDate}T${startTime}`;
        const endFull = `${selectedDate}T${endTime}`;

        try {
            const res = await apiGet(
                `/api/aule-disponibili?start=${encodeURIComponent(startFull)}&end=${encodeURIComponent(endFull)}`
            );
            
            const fetchedRooms = res.rooms || [];
            // Ordina array in base all'ID
            fetchedRooms.sort((a, b) => a.id - b.id);
            
            setRooms(fetchedRooms);
        } catch (err) {
            console.error(err);
            setError("Errore nel caricamento delle aule.");
        }
    }

    const handleBookClick = (roomId) => {
        const startFull = `${selectedDate}T${startTime}`;
        const endFull = `${selectedDate}T${endTime}`;

        nav("/create-booking", {
            state: {
                preSelectedRoom: roomId,
                preSelectedStart: startFull,
                preSelectedEnd: endFull
            }
        });
    };

    // Helper per i colori
    const getCardGradient = (index) => {
        const gradients = [
            "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue
            "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // Purple
            "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // Green
            "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" // Pink
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="rooms-page">
            
            {/* --- HEADER BANNER --- */}
            <div className="rooms-banner">
                <h1>🔍 Trova la tua Aula Studio</h1>
            </div>

            {/* --- SEARCH SECTION --- */}
            <div className="search-container">
                <h3 className="search-title">Cerca disponibilità</h3>
                
                <div className="search-form">
                    
                    {/* 1. INPUT DATA */}
                    <div className="input-group">
                        <label>📅 Seleziona Data</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* 2. INPUT ORA INIZIO */}
                    <div className="input-group">
                        <label>🕒 Ora Inizio</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* 3. INPUT ORA FINE */}
                    <div className="input-group">
                        <label>🕒 Ora Fine</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* Bottone Cerca */}
                    <button onClick={loadRooms} className="search-button">
                        Cerca Aule
                    </button>
                </div>

                {/* Messaggio di Errore (Rosso) */}
                {error && <p className="error-msg">{error}</p>}
            </div>

            {/* --- RESULTS SECTION --- */}
            <div className="results-container">
                <h3 className="results-title">✨ Aule Disponibili</h3>

                {searched && rooms.length === 0 && !error && (
                    <p className="no-result">Nessuna aula trovata per questo orario.</p>
                )}

                <div className="rooms-grid">
                    {rooms.map((r, index) => (
                        <div key={r.id} className="room-card">
                            <div className="card-header" style={{ background: getCardGradient(index) }}>
                                <div className="badge-container">
                                    {r.available ? (
                                        <span className="badge success">✔ Disponibile</span>
                                    ) : (
                                        <span className="badge error">✖ Occupata</span>
                                    )}
                                </div>
                                <h4 className="card-room-code">ID: {r.id}</h4>
                            </div>

                            <div className="card-body">
                                <h3 className="card-title">{r.name}</h3>
                                <p className="card-detail">📍 {r.location}</p>
                                <p className="card-detail">👥 Capienza: {r.capacity} persone</p>

                                {r.available ? (
                                    <button 
                                        onClick={() => handleBookClick(r.id)} 
                                        className="book-button"
                                    >
                                        Prenota Ora
                                    </button>
                                ) : (
                                    <button disabled className="book-button">
                                        Non Disponibile
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}