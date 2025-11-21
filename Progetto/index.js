import express from "express";
import { initDbPool } from "./src/services/db.js";
import dotenv from "dotenv";
dotenv.config();

await initDbPool(); // inizializza la pool

const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");

const sessionSecret = process.env.SESSION_SECRET || "super-secret-key";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessioni
app.use(session({
    secret: sessionSecret,           // utilizzato per firmare il cookie di sessione
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,             // impedisce accesso tramite JS
        secure: false,              // metti true su HTTPS reale
        maxAge: 1000 * 60 * 60     // 1h
    }
}));

// File statici
app.use(express.static(path.join(__dirname, "public")));

// Rotte
require("./routes/mainRoutes")(app);
require("./routes/roomsRoutes")(app);
require("./routes/bookingsRoutes")(app);
require("./routes/apiRoutes")(app);
require("./routes/authRoutes")(app);

app.listen(3000, () => {
    console.log("Server in ascolto su http://localhost:3000");
});
