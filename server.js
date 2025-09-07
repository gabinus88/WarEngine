const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// --- Initialisation de la base de données SQLite ---
const db = new sqlite3.Database('./warengine.db', (err) => {
    if (err) {
        console.error("Erreur à l'ouverture de la base de données", err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        // On s'assure que la table a bien la colonne email
        db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, email TEXT UNIQUE)', (err) => {
            if (err) {
                console.error("Erreur à la création de la table", err.message);
            }
        });
    }
});

// Servir les fichiers statiques
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Un joueur s'est connecté : ${socket.id}`);

    // --- GESTION DE L'INSCRIPTION ---
    socket.on('register', async (data) => {
        const { username, password, email } = data;

        try {
            // Vérifier si le pseudo est déjà pris
            const userExists = await db_get("SELECT * FROM users WHERE username = ?", [username]);
            if (userExists) {
                return socket.emit('register_fail', 'Ce pseudo est déjà utilisé.');
            }

            // Vérifier si l'email est déjà pris
            const emailExists = await db_get("SELECT * FROM users WHERE email = ?", [email]);
            if (emailExists) {
                return socket.emit('register_fail', 'Cet e-mail est déjà utilisé.');
            }

            // On insère le nouvel utilisateur
            await db_run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email]);
            console.log('Nouvel utilisateur enregistré :', username);
            socket.emit('register_success', 'Compte créé ! Vous pouvez vous connecter.');

        } catch (err) {
            console.error(err.message);
            socket.emit('register_fail', 'Erreur du serveur.');
        }
    });

    // --- GESTION DE LA CONNEXION ---
    socket.on('login', async (data) => {
        const { username, password } = data;

        try {
            const row = await db_get("SELECT * FROM users WHERE username = ?", [username]);

            if (row && row.password === password) {
                socket.emit('login_success', { username: username });
            } else {
                socket.emit('login_fail', 'Pseudo ou mot de passe incorrect.');
            }
        } catch (err) {
            console.error(err.message);
            socket.emit('login_fail', 'Erreur du serveur.');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Le joueur ${socket.id} s'est déconnecté.`);
    });
});

server.listen(PORT, () => {
    console.log(`Le serveur WarEngine est démarré et écoute sur le port ${PORT}`);
});

// Fonctions utilitaires pour la base de données (Promises)
function db_get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

function db_run(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            resolve(this);
        });
    });
}
