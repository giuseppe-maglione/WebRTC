import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Aggiunto Link per la registrazione
import "./style/Auth.css"; // Importa il CSS

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    const [error, setError] = useState(""); 
    
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const res = await login(username, password);
        
        if (res.error) {
            setError(res.error);
        } else {
            navigate("/");
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                
                <h2 className="auth-title">Benvenuto 👋</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* Campo Username */}
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            id="username"
                            className="auth-input"
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Inserisci il tuo username" 
                            required
                        />
                    </div>
                    
                    {/* Campo Password */}
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password"
                            type="password" 
                            className="auth-input"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Inserisci la tua password" 
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-button">Accedi</button>

                    {/* Messaggio Errore */}
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}
                </form>

                {/* Footer con link alla registrazione */}
                <div className="auth-footer">
                    Non hai un account? <Link to="/register" className="auth-link">Registrati qui</Link>
                </div>

            </div>
        </div>
    );
}