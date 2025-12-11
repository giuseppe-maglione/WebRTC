import React, { useEffect, useRef, useState } from 'react';
import Janus from '../utils/janus';

const VideoClassroom = ({ role, roomId }) => {
    const janusRef = useRef(null);
    const roomHandleRef = useRef(null);
    const subHandleRef = useRef(null);
    
    const audioRef = useRef(null); // per audio
    const videoRef = useRef(null); // per condivisione schermo
    
    // Stato
    const [hasJoined, setHasJoined] = useState(false);
    const [status, setStatus] = useState("In attesa...");
    const [error, setError] = useState(null);
    const [isAudioActive, setIsAudioActive] = useState(false);      // stato condivisione audio
    const [isScreenSharing, setIsScreenSharing] = useState(false);  // stato condivisione schermo
    
    // ✨ NUOVO: Stato per il mute
    const [isMuted, setIsMuted] = useState(false);

    const MY_ROOM_ID = parseInt(roomId);

    // questa funzione apre websocket verso la porta 8989 e crea una sessione
    const startJanus = () => {
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported()) {
                    setError("Browser non supportato");
                    return;
                }
                
                // sessione
                const janusInstance = new Janus({
                    server: "wss://localhost:8989",
                    success: () => {
                        janusRef.current = janusInstance;
                        setStatus("Connesso. Entro nella stanza...");
                        
                        if (role === 'host') {
                            startHostLogic(janusInstance);
                        } else {
                            startGuestLogic(janusInstance);
                        }
                    },
                    error: (err) => setError("Errore Sessione: " + err),
                    destroyed: () => setStatus("Sessione terminata")
                });
            }
        });
    };

    useEffect(() => {
        return () => {
            if (janusRef.current) {
                janusRef.current.destroy();
                janusRef.current = null;
            }
        };
    }, []);

    const handleJoin = () => {
        setHasJoined(true);
        setStatus("Connessione in corso...");
        startJanus();
    };

    // --- LOGICA HOST
    const startHostLogic = (janus) => {
        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "host-" + Janus.randomString(12),
            success: (pluginHandle) => {
                roomHandleRef.current = pluginHandle;
                pluginHandle.send({ 
                    message: { request: "join", room: MY_ROOM_ID, ptype: "publisher", display: "Host" } 
                });
            },
            error: (err) => setError("Errore plugin: " + err),
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event === "joined") {
                    setStatus("Host entrato. Configuro Audio...");
                    // offerta iniziale solo audio (no screen)
                    roomHandleRef.current.createOffer({
                        tracks: [{ type: 'audio', capture: true, recv: false }],
                        success: (jsep) => {
                            const publish = { request: "configure", audio: true, video: false };
                            roomHandleRef.current.send({ message: publish, jsep: jsep });
                        },
                        error: (err) => setError("Errore offerta: " + err)
                    });
                }
                if (jsep) {
                    roomHandleRef.current.handleRemoteJsep({ jsep: jsep });
                }
            },
            onlocalstream: (stream) => {
                // l'host non ha bisogno di vedere/sentire se stesso qui per ora
                setIsAudioActive(true);

                // ✨ NUOVO: Se c'è una traccia video (screen share), mostriamo l'anteprima all'host
                if (stream.getVideoTracks().length > 0) {
                    if (videoRef.current) {
                        Janus.attachMediaStream(videoRef.current, stream);
                        videoRef.current.play().catch(e => console.warn("Preview video:", e));
                    }
                }
            }
        });
    };

    // funzione per attivare la condivisione schermo
    const handleShareScreen = () => {
        if (!roomHandleRef.current) return;

        // creiamo una nuova offerta per rinegoziare la connessione aggiungendo il video
        roomHandleRef.current.createOffer({
            media: { video: "screen", audioSend: true, videoSend: true }, 
            success: (jsep) => {
                console.log("🖥️ Offerta Screen Share creata");
                // aggiornamento configurazione su Janus
                const publish = { request: "configure", audio: true, video: true };
                roomHandleRef.current.send({ message: publish, jsep: jsep });
                setIsScreenSharing(true);
            },
            error: (err) => {
                console.error("Errore screen share:", err);
                // se l'utente annulla la finestra di dialogo del browser
                if (err.name === "NotReadableError" || err.message.includes("cancelled")) {
                     setIsScreenSharing(false);
                }
            }
        });
    };

    // ✨ NUOVO: Funzione per stoppare SOLO la condivisione schermo
    const handleStopScreen = () => {
        if (!roomHandleRef.current) return;

        // Rinegoziamo rimuovendo il video (removeVideo: true)
        roomHandleRef.current.createOffer({
            media: { removeVideo: true }, 
            success: (jsep) => {
                console.log("🛑 Stop Screen Share");
                const publish = { request: "configure", audio: true, video: false };
                roomHandleRef.current.send({ message: publish, jsep: jsep });
                setIsScreenSharing(false);
                
                // Puliamo il tag video locale
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            },
            error: (err) => console.error("Errore stop screen:", err)
        });
    };

    // ✨ NUOVO: Funzione per Mute/Unmute Mic Host
    const toggleMute = () => {
        if (!roomHandleRef.current) return;
        
        if (isMuted) {
            // Era muto, ora attiviamo
            roomHandleRef.current.unmuteAudio();
            setIsMuted(false);
        } else {
            // Era attivo, ora mutiamo
            roomHandleRef.current.muteAudio();
            setIsMuted(true);
        }
    };

    // --- LOGICA GUEST
    const startGuestLogic = (janus) => {
        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "guest-" + Janus.randomString(12),
            // il guest entra anche lui prima come publisher
            // perché solo in questo modo può scoprire l'host (il vero publisher)
            success: (pluginHandle) => {
                roomHandleRef.current = pluginHandle;
                pluginHandle.send({ 
                    message: { request: "join", room: MY_ROOM_ID, ptype: "publisher", display: "Guest" } 
                });
            },
            error: (err) => setError("Errore guest: " + err),
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event === "joined" || event === "event") {
                    if (msg["publishers"] && msg["publishers"].length > 0) {
                        const hostId = msg["publishers"][0].id;
                        subscribeToHost(janus, hostId);
                    }
                }
            }
        });
    };

    // funzione per iscriversi allo stream dell'host
    const subscribeToHost = (janus, feedId) => {
        if (subHandleRef.current) return;

        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "sub-" + Janus.randomString(12),
            success: (handle) => {
                subHandleRef.current = handle;
                handle.send({ 
                    message: { request: "join", room: MY_ROOM_ID, ptype: "subscriber", feed: feedId } 
                });
            },
            onmessage: (msg, jsep) => {
                if (jsep) {
                    // handler se arriva una nuova offerta di negoziazione 
                    // es. host passa da solo audio a audio + schermo
                    console.log("📨 Ricevuta offerta (Audio o Screen)...");
                    subHandleRef.current.createAnswer({
                        jsep: jsep,
                        media: { audioSend: false, videoSend: false }, 
                        success: (jsepAnswer) => {
                            const body = { request: "start", room: MY_ROOM_ID };
                            subHandleRef.current.send({ message: body, jsep: jsepAnswer });
                        },
                        error: (err) => console.error("Errore Answer:", err)
                    });
                }
            },
            onremotetrack: (track, mid, on) => {
                if (!on) return; // se la traccia è stata rimossa, ignoriamo

                // creiamo un MediaStream e lo attacchiamo al tag <audio>
                if (track.kind === 'audio') {
                    console.log("🔊 Traccia Audio rilevata");
                    const stream = new MediaStream([track]);
                    attachAudioStream(stream);
                } 
                // creiamo un MediaStream e lo attacchiamo al tag <video>
                else if (track.kind === 'video') {
                    console.log("🖥️ Traccia Video (Schermo) rilevata");
                    const stream = new MediaStream([track]);
                    attachVideoStream(stream);
                }
            }
        });
    };

    // funzione per attaccare l'audio
    const attachAudioStream = (stream) => {
        if (audioRef.current && audioRef.current.srcObject !== stream) {
            Janus.attachMediaStream(audioRef.current, stream);
            audioRef.current.play().catch(e => console.warn("Autoplay audio:", e));
            setIsAudioActive(true);
        }
    };

    // funzione per attaccare il video
    const attachVideoStream = (stream) => {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
            Janus.attachMediaStream(videoRef.current, stream);
            videoRef.current.play().catch(e => console.warn("Autoplay video:", e));
            // video muto nel tag per evitare eco
        }
    };

    // --- RENDER UI    
    if (!hasJoined) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1>🎓 Aula Virtuale</h1>
                    <p>Stai per entrare nella riunione <b>#{roomId}</b>.</p>
                    <button onClick={handleJoin} style={styles.button}>
                        {role === 'host' ? '🎙️ Avvia riunione' : '🎧 Partecipa alla riunione'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>{role === 'host' ? 'Trasmissione' : 'Aula Studente'}</h2>
                <span style={{ 
                    color: error ? 'red' : 'green', 
                    fontWeight: 'bold', 
                    marginLeft: '10px' 
                }}>
                    ● {error || status}
                </span>
            </div>
            
            {/* ✨ NUOVO: AREA VIDEO PER GUEST E ANTEPRIMA HOST */}
            <div style={styles.videoContainer}>
                {/* Il Guest vede il video qui. ORA ANCHE L'HOST per l'anteprima */}
                {(role === 'guest' || (role === 'host' && isScreenSharing)) && (
                    <video 
                        ref={videoRef} 
                        width="100%" 
                        height="auto" 
                        autoPlay 
                        playsInline 
                        muted={true} // Importante: l'audio arriva dal tag <audio> separato (o è locale)
                        style={{ maxWidth: '800px', borderRadius: '8px', background: 'black', marginBottom: '10px' }}
                    />
                )}
                
                {/* L'audio è invisibile ma sempre presente */}
                <audio ref={audioRef} autoPlay playsInline controls={role==='guest'} style={{display: role==='guest' ? 'block' : 'none', marginTop: '10px'}} />
            </div>

            {/* PULSANTI CONTROLLO HOST */}
            {role === 'host' && (
                <div style={styles.controls}>
                    
                    {/* Pulsante Mute/Unmute */}
                    <div style={{ marginBottom: '15px' }}>
                         <button 
                            onClick={toggleMute} 
                            style={{
                                ...styles.button, 
                                background: isMuted ? '#dc3545' : '#28a745', 
                                marginRight: '10px'
                            }}
                        >
                            {isMuted ? '🔇 Audio DISATTIVATO' : '🎤 Audio ATTIVO'}
                        </button>
                    </div>

                    {!isScreenSharing ? (
                        <button onClick={handleShareScreen} style={{...styles.button, background: '#6610f2'}}>
                            🖥️ Condividi Schermo
                        </button>
                    ) : (
                        // ✨ NUOVO: Pulsante Stop Condivisione
                        <button onClick={handleStopScreen} style={{...styles.button, background: '#dc3545'}}>
                            ⏹ Interrompi Condivisione
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px', 
        fontFamily: 'Segoe UI, sans-serif', 
        textAlign: 'center', 
        color: '#333', 
        background: '#f4f6f8', 
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    card: {
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        maxWidth: '500px',
        width: '100%',
        marginTop: '10vh'
    },
    header: {
        marginBottom: '20px',
        padding: '10px 20px',
        background: 'white',
        borderRadius: '50px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    button: {
        background: '#007bff',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'transform 0.1s',
    },
    videoContainer: {
        width: '90%',
        maxWidth: '1000px',
        margin: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    controls: {
        marginTop: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    },
    pulse: {
        fontSize: '1.2rem', 
        marginBottom: '15px', 
        fontWeight: 'bold',
        color: '#28a745',
        animation: 'pulse 2s infinite'
    }
};

export default VideoClassroom;