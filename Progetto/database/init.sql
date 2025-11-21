-- ============================================================
--   DATABASE INIT SCRIPT – Aule, Utenti, Prenotazioni, Badge
-- ============================================================

-- Usa il DB (assicurati che esista)
USE webrtc_db;

-- ===============================
--  USERS
-- ===============================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- USERS: dati di esempio (password = "password123" hashata)
INSERT INTO users (username, password_hash, role)
VALUES
('annarita', '$2b$10$5TycR.ZPG/xrVQWv3EbVSeiIvLjVLMrjSeG6cTpdnFBCiho/247HG', 'user'),
('giuseppe', '$2b$10$5TycR.ZPG/xrVQWv3EbVSeiIvLjVLMrjSeG6cTpdnFBCiho/247HG', 'user'),
('admin', '$2b$10$5TycR.ZPG/xrVQWv3EbVSeiIvLjVLMrjSeG6cTpdnFBCiho/247HG', 'admin');



-- ===============================
--  ROOMS (aule)
-- ===============================
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255),
    capacity INT DEFAULT 0
);

-- ROOMS: dati di esempio
INSERT INTO rooms (name, location, capacity)
VALUES
('Aula Gaming 1', 'Piano 1', 10),
('Aula Gaming 2', 'Piano 1', 8),
('Stanza segreta', 'Piano -1', 2),
('Sala Riunioni', 'Piano 2', 20);



-- ===============================
--  READERS (lettori fisici)
-- ===============================
DROP TABLE IF EXISTS readers;
CREATE TABLE readers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    reader_uid VARCHAR(100) NOT NULL UNIQUE,
    public_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- READERS: dati di esempio
INSERT INTO readers (room_id, reader_uid, public_key)
VALUES
(1, 'READER001', 'FAKE_PUBLIC_KEY_ABC'),
(2, 'READER002', 'FAKE_PUBLIC_KEY_DEF'),
(3, 'READER003', 'FAKE_PUBLIC_KEY_GHI');



-- ===============================
--  CARDS (badge utenti)
-- ===============================
DROP TABLE IF EXISTS cards;
CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_uid VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CARDS: dati di esempio
INSERT INTO cards (user_id, card_uid)
VALUES
(1, 'CARD-ANNARITA-001'),
(2, 'CARD-GIUSEPPE-001'),
(3, 'CARD-ADMIN-001');



-- ===============================
--  BOOKINGS (prenotazioni)
-- ===============================
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('active','cancelled') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX idx_booking_room_time
    ON bookings (room_id, start_time, end_time);

-- BOOKINGS: dati di esempio
INSERT INTO bookings (user_id, room_id, start_time, end_time)
VALUES
(1, 1, '2026-01-20 14:00:00', '2026-01-20 16:00:00'),
(2, 2, '2026-01-21 10:00:00', '2026-01-21 12:00:00'),
(1, 3, '2026-01-22 09:00:00', '2026-01-22 11:00:00');



-- ===============================
--  ACCESS LOGS (registri accessi)
-- ===============================
DROP TABLE IF EXISTS access_logs;
CREATE TABLE access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    reader_id INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_granted BOOLEAN,
    message TEXT,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE SET NULL
);

-- ACCESS_LOGS: dati di esempio
INSERT INTO access_logs (card_id, reader_id, access_granted, message)
VALUES
(1, 1, TRUE, 'Accesso consentito: prenotazione valida'),
(2, 2, FALSE, 'Accesso negato: nessuna prenotazione'),
(3, 3, TRUE, 'Accesso admin – override');

