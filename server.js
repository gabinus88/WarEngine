const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // On ajoute le module path

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const dbPath = path.resolve(__dirname, 'warengine.db'); // Chemin absolu vers la DB

// --- Initialisation de la base de données SQLite ---
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("ERREUR FATALE: Impossible d'ouvrir la base de données", err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, email TEXT UNIQUE)');
    }
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Un joueur s'est connecté : ${socket.id}`);

    // --- GESTION DE L'INSCRIPTION ---
    socket.on('register', async (data) => {
        const { username, password, email } = data;
        console.log(`Tentative d'inscription pour : ${username}`); // LOG DE DÉBOGAGE

        try {
            const userExists = await db_get("SELECT username FROM users WHERE username = ?", [username]);
            if (userExists) {
                console.log(`Échec inscription : pseudo ${username} déjà pris.`);
                return socket.emit('register_fail', 'Ce pseudo est déjà utilisé.');
            }

            const emailExists = await db_get("SELECT email FROM users WHERE email = ?", [email]);
            if (emailExists) {
                console.log(`Échec inscription : email ${email} déjà pris.`);
                return socket.emit('register_fail', 'Cet e-mail est déjà utilisé.');
            }

            await db_run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email]);
            console.log(`SUCCÈS : Nouvel utilisateur enregistré : ${username}`); // LOG DE DÉBOGAGE
            socket.emit('register_success', 'Compte créé ! Vous pouvez vous connecter.');

        } catch (err) {
            console.error("ERREUR lors de l'inscription dans la DB:", err.message);
            socket.emit('register_fail', 'Erreur du serveur.');
        }
    });

    // --- GESTION DE LA CONNEXION ---
    socket.on('login', async (data) => {
        // ... (logique de connexion inchangée)
    });

    // ... (autre code inchangé)
});

server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// --- Fonctions utilitaires pour la base de données (Promises) ---
function db_get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                console.error("Erreur DB GET:", err.message);
                reject(err);
            }
            resolve(row);
        });
    });
}

function db_run(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error("Erreur DB RUN:", err.message);
                reject(err);
            } else {
                console.log(`Requête RUN réussie, lignes modifiées : ${this.changes}`); // LOG DE DÉBOGAGE
                resolve(this);
            }
        });
    });
}
