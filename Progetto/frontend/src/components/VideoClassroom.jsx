import React, { useEffect, useRef, useState } from 'react';
import Janus from '../utils/janus'; 
import adapter from 'webrtc-adapter';

const SERVER_URL = "wss://localhost:8989"; 

const VideoClassroom = ({ role = "student", roomId }) => {
    // Gestione ID Stanza: usa quello passato dalle props o un fallback
    const activeRoomId = roomId ? parseInt(roomId) : 200; 
    
    const [janusInstance, setJanusInstance] = useState(null);
    const [status, setStatus] = useState("Disconnesso");
    const [isSharing, setIsSharing] = useState(false); // Stato per sapere se stiamo trasmettendo
    
    const videoRef = useRef(null); 
    // Ref fondamentale per accedere al plugin senza aspettare i render di React
    const pluginRef = useRef(null);  

    useEffect(() => {
        // Inizializzazione Janus alla creazione del componente
        Janus.init({
            debug: "all",
            callback: () => {
                if (!Janus.isWebrtcSupported()) {
                    alert("Il tuo browser non supporta WebRTC!");
                    return;
                }
                connectToJanus();
            }
        });

        // Cleanup quando chiudi il componente
        return () => {
            if (janusInstance) {
                janusInstance.destroy();
            }
        };
    }, []);

    const connectToJanus = () => {
        const janus = new Janus({
            server: SERVER_URL,
            success: () => {
                setJanusInstance(janus);
                attachToVideoRoom(janus);
            },
            error: (error) => {
                console.error("Errore Janus:", error);
                setStatus("Errore connessione server");
            },
            destroyed: () => {
                setStatus("Distrutto");
            }
        });
    };

    const attachToVideoRoom = (janus) => {
        janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: "videoroom-" + Janus.randomString(12),
            success: (plugin) => {
                // Salviamo il plugin nella Ref immediatamente
                pluginRef.current = plugin; 
                setStatus("Plugin collegato! Entro nella stanza...");
                
                if (role === 'teacher') {
                    registerAsPublisher(plugin);
                } else {
                    registerAsSubscriber(plugin);
                }
            },
            error: (error) => {
                console.error("Errore attach:", error);
                setStatus("Errore plugin");
            },
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                
                if (event) {
                    if (event === "joined") {
                        setStatus(`Entrato nella stanza ${activeRoomId} come ${role}`);
                        // NOTA: Non avviamo più publishScreen qui automaticamente
                        // per evitare il blocco del browser. Aspettiamo il click.
                    } 
                    else if (event === "event") {
                        // Logica futura per gestire studenti che entrano
                        if (msg["publishers"]) {
                            console.log("Publisher attivi:", msg["publishers"]);
                        }
                    }
                }

                // Gestione handshake SDP (necessaria sempre)
                if (jsep) {
                    if (pluginRef.current) {
                        pluginRef.current.handleRemoteJsep({ jsep: jsep });
                    }
                }
            },
            onlocalstream: (stream) => {
                // Visualizza il MIO schermo (Docente)
                if (role === 'teacher' && videoRef.current) {
                    Janus.attachMediaStream(videoRef.current, stream);
                }
            },
            onremotestream: (stream) => {
                // Visualizza lo schermo del DOCENTE (Studente)
                if (role === 'student' && videoRef.current) {
                    Janus.attachMediaStream(videoRef.current, stream);
                }
            }
        });
    };

    // --- AZIONI ---

    const registerAsPublisher = (plugin) => {
        const register = {
            request: "join",
            room: activeRoomId,
            ptype: "publisher",
            display: "Docente"
        };
        plugin.send({ message: register });
    };

    const registerAsSubscriber = (plugin) => {
        const register = {
            request: "join",
            room: activeRoomId,
            ptype: "publisher", // Join generico
            display: "Studente"
        };
        plugin.send({ message: register });
    };

    // Funzione chiamata dal bottone manuale
    const handleStartSharing = () => {
        if (pluginRef.current) {
            publishScreen(pluginRef.current);
        } else {
            alert("Connessione in corso... riprova tra un secondo.");
        }
    };

    const publishScreen = (plugin) => {
        plugin.createOffer({
            // Richiede condivisione schermo
            media: { video: "screen", audioSend: true, videoRecv: false },
            success: (jsep) => {
                const publish = {
                    request: "configure",
                    audio: true,
                    video: true
                };
                plugin.send({ message: publish, jsep: jsep });
                setIsSharing(true); // Aggiorniamo l'interfaccia
            },
            error: (error) => {
                console.error("Errore WebRTC:", error);
                // Gestione caso utente annulla condivisione
                if (error.name === "NotAllowedError") {
                    alert("Hai annullato la condivisione.");
                } else {
                    alert("Errore cattura schermo: " + error.message);
                }
            }
        });
    };

    // --- RENDER ---

    return (
        <div style={{ 
            padding: 10, 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            background: '#000', 
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 5}}>
                <h4 style={{margin: 0}}>
                    {role === 'teacher' ? "🎥 Tuo Schermo (In onda)" : "📺 Diretta Aula"}
                </h4>
                <small style={{color: '#aaa'}}>
                    {status} | Room: {activeRoomId}
                </small>
            </div>
            
            <div className="video-container" style={{
                marginTop: 10, 
                position: 'relative', 
                minHeight: '300px', 
                background: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted={role === 'teacher'} // Importante: mutati se sei tu a parlare
                    style={{ width: '100%', maxHeight: '500px', display: 'block' }}
                />

                {/* BOTTONE OVERLAY PER IL DOCENTE */}
                {role === 'teacher' && !isSharing && (
                    <div style={{
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 10
                    }}>
                        <button 
                            onClick={handleStartSharing}
                            style={{
                                padding: '15px 30px', 
                                fontSize: '16px', 
                                cursor: 'pointer',
                                background: '#2ecc71',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            🚀 Clicca per Condividere Schermo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoClassroom;