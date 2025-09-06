document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton'); // On récupère aussi le bouton de login
    const registerButton = document.getElementById('registerButton');
    const guestButton = document.getElementById('guestButton');
    const messageArea = document.getElementById('messageArea');

    // --- ÉVÉNEMENTS D'ENVOI (CLIENT -> SERVEUR) ---

    // Gère la connexion normale (quand on appuie sur Entrée ou le bouton)
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Empêche le rechargement
        const username = usernameInput.value;
        const password = passwordInput.value;
        socket.emit('login', { username, password });
    });

    // Gère l'inscription
    registerButton.addEventListener('click', () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        if (username && password) {
            socket.emit('register', { username, password });
        } else {
            displayMessage('Veuillez remplir le pseudo et le mot de passe pour vous inscrire.', 'error');
        }
    });

    // Gère la connexion invité
    guestButton.addEventListener('click', () => {
        socket.emit('guest_login');
    });


    // --- ÉVÉNEMENTS DE RÉCEPTION (SERVEUR -> CLIENT) ---

    socket.on('login_success', (data) => {
        document.body.innerHTML = `<h1>Bienvenue, ${data.username} !</h1><p>Le jeu va commencer...</p>`;
    });

    socket.on('login_fail', (message) => {
        displayMessage(message, 'error');
    });

    socket.on('register_success', (message) => {
        displayMessage(message, 'success');
    });

    socket.on('register_fail', (message) => {
        displayMessage(message, 'error');
    });

    // --- FONCTIONS UTILITAIRES ---
    function displayMessage(message, type) {
        messageArea.textContent = message;
        messageArea.className = `message ${type}`;
    }
});
