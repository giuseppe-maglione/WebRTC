import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// navbar è un componente standard in un'applicazione web che rappresenta la barra di nagivazione

export default function Navbar() {
    const { user, logout } = useAuth();     // prende i valori user e logout dal context

    return (
        <nav>
            <Link to="/">Home</Link>
            <Link to="/rooms">Aule</Link>

            {user && (
                <>
                    <Link to="/my-bookings">Le mie prenotazioni</Link>
                    <Link to="/create-booking">Crea prenotazione</Link>
                </>
            )}

            {user ? (
                <button onClick={logout}>Logout ({user.username})</button>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Registrati</Link>
                </>
            )}
        </nav>
    );
}
