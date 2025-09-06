const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose(); // Importation de SQLite

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// --- Initialisation de la base de données SQLite ---
// La base de données sera stockée dans le fichier 'warengine.db'
const db = new sqlite3.Database('./warengine.db', (err) => {
    if (err) {
        console.error("Erreur à l'ouverture de la base de données", err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        // On crée la table des utilisateurs si elle n'existe pas
        db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)', (err) => {
            if (err) {
                console.error("Erreur à la création de la table", err.message);
            }
        });
    }
});

// Servir les fichiers statiques du dossier 'public'
app.use(express.static('public'));

// Gère les connexions des joueurs
io.on('connection', (socket) => {
    console.log(`Un joueur s'est connecté : ${socket.id}`);

    // --- GESTION DE L'INSCRIPTION (avec async/await) ---
    socket.on('register', async (data) => {
        const { username, password } = data;

        try {
            // On cherche si l'utilisateur existe déjà
            const row = await db_get("SELECT * FROM users WHERE username = ?", [username]);

            if (row) {
                // Le pseudo existe déjà
                socket.emit('register_fail', 'Ce pseudo est déjà utilisé.');
            } else {
                // On insère le nouvel utilisateur
                await db_run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
                console.log('Nouvel utilisateur enregistré :', username);
                socket.emit('register_success', 'Compte créé ! Vous pouvez vous connecter.');
            }
        } catch (err) {
            console.error(err.message);
            socket.emit('register_fail', 'Erreur du serveur.');
        }
    });

    // --- GESTION DE LA CONNEXION (avec async/await) ---
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

    // --- GESTION DE LA CONNEXION INVITÉ (avec async/await) ---
    socket.on('guest_login', async () => {
        let guestUsername;
        let isUnique = false;

        try {
            // Boucle pour garantir un pseudo unique
            while (!isUnique) {
                guestUsername = generateRandomPseudo();
                const row = await db_get("SELECT * FROM users WHERE username = ?", [guestUsername]);
                if (!row) {
                    isUnique = true;
                }
            }

            const guestPassword = generateRandomPassword();
            await db_run("INSERT INTO users (username, password) VALUES (?, ?)", [guestUsername, guestPassword]);

            console.log(`Connexion d'un invité avec le pseudo : ${guestUsername}`);
            socket.emit('login_success', { username: guestUsername });
        } catch (err) {
            console.error(err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Le joueur ${socket.id} s'est déconnecté.`);
    });
});

// Démarrer le serveur
server.listen(PORT, () => {
    console.log(`Le serveur WarEngine est démarré et écoute sur le port ${PORT}`);
});

// --- Fonctions utilitaires pour la base de données (Promises) ---
// On "enveloppe" les fonctions de la DB pour pouvoir utiliser async/await
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
        db.run(query, params, function(err) { // Ne pas utiliser de fonction fléchée ici pour garder 'this'
            if (err) reject(err);
            resolve(this);
        });
    });
}

// Fonctions de génération aléatoire (inchangées)
function generateRandomPseudo() { /* ... code inchangé ... */ }
function generateRandomPassword() { /* ... code inchangé ... */ }


// --- Fonctions utilitaires (côté serveur) ---
function generateRandomPseudo() {
    const adjectives = ['Rapide', 'Furtif', 'Noble', 'Ancien', 'Sombre', 'Brillant'];
    const nouns = ['Loup', 'Lion', 'Aigle', 'Dragon', 'Corbeau', 'Spectre'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);
    return `${adjective}${noun}${number}`;
}

function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
