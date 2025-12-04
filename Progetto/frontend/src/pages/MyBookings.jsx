import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../api";
import "../style/MyBookings.css";
import VideoClassroom from "../components/VideoClassroom";

export default function MyBookings() {
    const [list, setList] = useState([]);
    const [streamingId, setStreamingId] = useState(null);   // id della prenotazione che sta trasmettendo
    
    // messaggi di feedback (verdi -> successo / rosso -> fallimento)
    const [feedback, setFeedback] = useState({ msg: "", type: "" });

    // funzione per prelevare tutte le prenotazioni dell'utente
    async function load() {
        try {
            const res = await apiGet("/api/prenotazioni");
            // le prenotazioni sono ordinate dalla più recente alla più vecchia
            const bookings = res.bookings || [];
            bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            
            setList(bookings);
        } catch (err) {
            console.error(err);
            setList([]);        // in caso di errore, reset della lista
        }
    }

    async function del(id) {
        if (!confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;

        try {
            const res = await apiDelete(`/api/prenotazioni/${id}`);
            
            if (res.error) {
                 setFeedback({ msg: res.error, type: "error" });
            } else {
                 load(); 
                 setFeedback({ msg: "Prenotazione eliminata con successo!", type: "success" });
                 
                 // rimuovi messaggio dopo 3 secondi
                 setTimeout(() => setFeedback({ msg: "", type: "" }), 3000);
            }
        } catch (err) {
            console.error(err);
            setFeedback({ msg: "Errore durante l'eliminazione.", type: "error" });
        }
    }

    useEffect(() => { load(); }, []);

    // helper per colori gradienti (Uguale a Rooms, ma per coerenza visiva)
    const getCardGradient = (index) => {
        const gradients = [
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Deep Purple
            "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)", // Blue Indigo
            "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Pink
            "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"  // Orange
        ];
        return gradients[index % gradients.length];
    };

    // helper per formattare la data in modo carino per il frontend
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bookings-page">
            
            <div className="bookings-banner">
                <h1>📅 Le mie Prenotazioni</h1>
            </div>

            <div className="bookings-container">

                {/* feedback Message */}
                {feedback.msg && (
                    <div className={`feedback-msg ${feedback.type}`}>
                        {feedback.msg}
                    </div>
                )}

                {list.length === 0 && !feedback.msg && (
                    <div className="no-bookings">
                        <p>Non hai ancora effettuato prenotazioni.</p>
                        <Link to="/rooms" style={{color: "#a18cd1", fontWeight: "bold"}}>Prenota un'aula ora</Link>
                    </div>
                )}

                <div className="bookings-grid">
                    {list.map((b, index) => (
                        <div key={b.id} className="booking-card">
                            
                            {/* header Colorato */}
                            <div className="booking-header" style={{ background: getCardGradient(index) }}>
                                <div>
                                    <h3 className="booking-room-title">Aula {b.room_id}</h3> {/* Qui potresti mettere il nome stanza se il backend lo manda */}
                                </div>
                                <span className="booking-id">#{b.id}</span>
                            </div>

                            {/* body con dettagli sulla prenotazione */}
                            <div className="booking-body">
                                
                                {/* se stream è attiva, mostra il video (per debug), altrimenti i dettagli */}
                                {streamingId === b.id ? (
                                    <div className="streaming-active-area" style={{marginBottom: '15px'}}>
                                        {/* passiamo id e ruolo al componente */}
                                        <VideoClassroom role="teacher" roomId={b.id} />
                                        
                                        <button 
                                            onClick={() => setStreamingId(null)} 
                                            className="btn-action" 
                                            style={{marginTop: '10px', backgroundColor: '#e74c3c', color: 'white', width: '100%'}}
                                        >
                                            ⏹ Termina Lezione
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="info-row">
                                            <span className="icon">🗓️</span>
                                            <span>{formatDate(b.start_time)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="icon">⏰</span>
                                            <span>
                                                {formatTime(b.start_time)} ➔ {formatTime(b.end_time)}
                                            </span>
                                        </div>

                                        {/* bottone per avviare lo streaming (visibile solo se non attivo) */}
                                        <div style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                                            <button 
                                                onClick={() => setStreamingId(b.id)}
                                                className="btn-action"
                                                style={{backgroundColor: '#2ecc71', color: 'white', width: '100%', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px'}}
                                            >
                                                🎥 Avvia Lezione
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* azioni (modifica, elimina) - nascondiamo se in streaming */}
                            {streamingId !== b.id && (
                                <div className="booking-actions">
                                    <Link to={`/edit-booking/${b.id}`} className="btn-action btn-edit">
                                        ✏️ Modifica
                                    </Link>
                                    <button onClick={() => del(b.id)} className="btn-action btn-delete">
                                        🗑️ Elimina
                                    </button>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}