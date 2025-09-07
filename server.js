const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const dbPath = path.resolve(__dirname, 'warengine.db');

// --- Initialisation de la base de données SQLite ---
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("ERREUR FATALE: Impossible d'ouvrir la base de données", err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        db.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, email TEXT UNIQUE)', (err) => {
            if (err) {
                console.error("Erreur à la création de la table", err.message);
            }
        });
    }
});

// Servir les fichiers statiques du dossier 'public'
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Un joueur s'est connecté : ${socket.id}`);

    // --- GESTION DE L'INSCRIPTION ---
    socket.on('register', async (data) => {
        console.log(`Événement 'register' reçu pour : ${data.username}`);
        const { username, password, email } = data;
        try {
            const userExists = await db_get("SELECT username FROM users WHERE username = ?", [username]);
            if (userExists) {
                console.log(`-> Échec inscription : pseudo déjà pris.`);
                return socket.emit('register_fail', 'Ce pseudo est déjà utilisé.');
            }

            const emailExists = await db_get("SELECT email FROM users WHERE email = ?", [email]);
            if (emailExists) {
                console.log(`-> Échec inscription : email déjà pris.`);
                return socket.emit('register_fail', 'Cet e-mail est déjà utilisé.');
            }

            await db_run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email]);
            console.log(`-> SUCCÈS : Nouvel utilisateur enregistré : ${username}`);
            socket.emit('register_success', 'Compte créé ! Vous pouvez vous connecter.');
        } catch (err) {
            console.error("ERREUR lors de l'inscription dans la DB:", err.message);
            socket.emit('register_fail', 'Erreur du serveur.');
        }
    });
    
    // --- GESTION DE LA CONNEXION ---
    socket.on('login', async (data) => {
        console.log(`Événement 'login' reçu pour : ${data.username}`);
        const { username, password } = data;
        try {
            const user = await db_get("SELECT * FROM users WHERE username = ?", [username]);
            if (user && user.password === password) {
                console.log(`-> SUCCÈS : Connexion de ${username}`);
                socket.username = user.username;
                socket.emit('login_success', { username: user.username });
            } else {
                console.log(`-> Échec connexion : Pseudo ou mot de passe incorrect pour ${username}`);
                socket.emit('login_fail', 'Pseudo ou mot de passe incorrect.');
            }
        } catch (err) {
            console.error("ERREUR lors de la connexion:", err.message);
            socket.emit('login_fail', 'Erreur du serveur.');
        }
    });

    // --- GESTION DE LA MISE À JOUR DU COMPTE ---
    socket.on('update_account', async (data) => {
        console.log(`Événement 'update_account' reçu pour l'utilisateur connecté : ${socket.username}`);
        if (!socket.username) {
            return socket.emit('update_fail', 'Erreur : Utilisateur non connecté.');
        }

        const { newPassword, newEmail } = data;
        const updates = [];
        const params = [];

        if (newPassword) {
            updates.push("password = ?");
            params.push(newPassword);
        }
        if (newEmail) {
            updates.push("email = ?");
            params.push(newEmail);
        }

        if (updates.length === 0) {
            return socket.emit('update_fail', 'Aucune information à mettre à jour.');
        }

        params.push(socket.username);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE username = ?`;

        try {
            if (newEmail) {
                const emailExists = await db_get("SELECT * FROM users WHERE email = ? AND username != ?", [newEmail, socket.username]);
                if (emailExists) {
                    return socket.emit('update_fail', 'Cet e-mail est déjà utilisé par un autre compte.');
                }
            }
            
            await db_run(query, params);
            console.log(`-> SUCCÈS : Compte de ${socket.username} mis à jour.`);
            socket.emit('update_success', 'Votre compte a été mis à jour avec succès.');
        } catch (err) {
            console.error("ERREUR lors de la mise à jour:", err.message);
            socket.emit('update_fail', 'Erreur du serveur lors de la mise à jour.');
        }
    });

    socket.on('disconnect', () => {
        console.log(`Le joueur ${socket.username || socket.id} s'est déconnecté.`);
    });
});

server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// --- Fonctions utilitaires pour la base de données (Promises) ---
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
