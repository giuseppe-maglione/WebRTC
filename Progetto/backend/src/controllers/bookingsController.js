import { bookingModel } from "../models/bookingModel.js";
import { roomModel } from "../models/roomModel.js";

// LISTA AULE -  da rivedere l'overlap
export const listRooms = async (req, res) => {
  try {
    // Accetta query params: start, end (ISO 8601)
    // Esempio: /api/aule-disponibili?start=2025-11-25T10:00:00&end=2025-11-25T12:00:00
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Parametri mancanti: start ed end sono obbligatori (ISO 8601)." });
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Formato data/ora non valido. Usa ISO 8601." });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: "start deve essere precedente a end." });
    }

    // Recupera tutte le stanze
    const rooms = await roomModel.getAllRooms();

    // Per ogni stanza verifica sovrapposizione
    // NB: bookingModel.hasOverlap restituisce true se esiste almeno una prenotazione active che si sovrappone
    const result = [];
    for (const r of rooms) {
      const overlap = await bookingModel.hasOverlap(r.id, startTime, endTime);
      result.push({
        id: r.id,
        name: r.name,
        location: r.location,
        capacity: r.capacity,
        available: !overlap
      });
    }

    return res.json({ start: startTime.toISOString(), end: endTime.toISOString(), rooms: result });

  } catch (err) {
    console.error("Errore in listRooms:", err);
    return res.status(500).json({ error: "Errore interno server" });
  }
};


// PRENOTAZIONE DELL'UTENTE
// TO BE DONE:
export const getUserBookingById = async (req, res) => {
    try {
        const userId = req.session.userId;

        const bookings = await bookingModel.getBookingsByUser(userId);

        res.json({ bookings });

    } catch (err) {
        console.error("Errore in getUserBookings:", err);
        res.status(500).json({ error: "Errore nel recupero delle prenotazioni" });
    }
};


// LISTA PRENOTAZIONI UTENTE
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.session.userId;

        const bookings = await bookingModel.getBookingsByUser(userId);

        res.json({ bookings });

    } catch (err) {
        console.error("Errore in getUserBookings:", err);
        res.status(500).json({ error: "Errore nel recupero delle prenotazioni" });
    }
};


// CREA PRENOTAZIONE
export const createBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { roomId, startTime, endTime } = req.body;

        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ error: "Dati mancanti" });
        }

        // Check che la stanza esista
        const room = await bookingModel.getRoomById(roomId);
        if (!room) {
            return res.status(404).json({ error: "Stanza inesistente" });
        }

        // Check sovrapposizione orari
        const overlap = await bookingModel.hasOverlap(roomId, startTime, endTime);
        if (overlap) {
            return res.status(400).json({
                error: "La stanza è già occupata in quell'orario"
            });
        }

        const booking = await bookingModel.createBooking(
            userId,
            roomId,
            startTime,
            endTime
        );

        res.json({
            message: "Prenotazione creata con successo",
            bookingId: booking.id
        });

    } catch (err) {
        console.error("Errore in createBooking:", err);
        res.status(500).json({ error: "Errore durante la creazione della prenotazione" });
    }
};



// MODIFICA PRENOTAZIONE (solo orario)
// body: { startTime, endTime }
export const updateBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const bookingId = req.params.id;
        const { startTime, endTime } = req.body;

        // Check parametri
        if (!startTime || !endTime) {
            return res.status(400).json({ error: "Dati mancanti" });
        }

        // Check esistenza prenotazione
        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        // Check ownership
        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non puoi modificare questa prenotazione" });
        }

        // Check sovrapposizione
        const overlap = await bookingModel.hasOverlap(
            booking.room_id,
            startTime,
            endTime
        );

        // Se c’è sovrapposizione ma riguarda la stessa prenotazione → ok
        if (overlap && !(booking.start_time === startTime && booking.end_time === endTime)) {
            return res.status(400).json({
                error: "Nuovo orario non disponibile, stanza occupata"
            });
        }

        await bookingModel.updateBooking(bookingId, startTime, endTime);

        res.json({ message: "Prenotazione aggiornata correttamente" });

    } catch (err) {
        console.error("Errore in updateBooking:", err);
        res.status(500).json({ error: "Errore nell'aggiornamento della prenotazione" });
    }
};


// ELIMINA PRENOTAZIONE (soft delete → status='cancelled')
export const deleteBooking = async (req, res) => {
    try {
        const userId = req.session.userId;
        const bookingId = req.params.id;

        const booking = await bookingModel.getBookingById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Prenotazione non trovata" });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ error: "Non hai permesso per eliminarla" });
        }

        await bookingModel.deleteBooking(bookingId);

        res.json({ message: "Prenotazione cancellata" });

    } catch (err) {
        console.error("Errore in deleteBooking:", err);
        res.status(500).json({ error: "Errore nella cancellazione della prenotazione" });
    }
};
