import express from "express";
import session from "express-session";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { initDbPool } from "./src/services/db.js";
import cors from "cors";
// per https
import https from "https";
import fs from "fs";

// Serve a far funzionare __dirname con import ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Inizializza il DB
await initDbPool();

const app = express();
const sessionSecret = process.env.SESSION_SECRET || "super-secret-key";
const port = process.env.BACKEND_PORT || 3000;

app.use(cors({
    origin: "https://localhost:5173",
    credentials: true
}));

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessioni
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,           // metti true quando sarai in HTTPS reale
        sameSite: 'none',       // Spesso necessario con secure: true in locale
        maxAge: 1000 * 60 * 60  // 1h
    }
}));

// Serve i file statici del frontend React
const buildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(buildPath));

// Rotte API
import bookingsRoutes from "./src/routes/bookingsRoutes.js";
//import readerRoutes from "./src/routes/readerRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

bookingsRoutes(app);
//readerRoutes(app);
authRoutes(app);

// Catch-all: React gestisce il routing
app.get("/", (req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));
});

// crea il server https
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.cert'))
};

https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server HTTPS in ascolto su https://localhost:${port}`); 
});
