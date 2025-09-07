document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const appContainer = document.getElementById('app-container');

    // --- GESTION DES ÉVÉNEMENTS DU SERVEUR ---
    socket.on('login_success', (data) => showGameView(data.username));
    socket.on('login_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('register_success', (message) => displayMessage(message, 'success', 'messageArea'));
    socket.on('register_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('update_success', (message) => displayMessage(message, 'success', 'updateMessage'));
    socket.on('update_fail', (message) => displayMessage(message, 'error', 'updateMessage'));

    // --- FONCTIONS QUI GÈRENT L'INTERFACE ---

    function showLoginView() {
        appContainer.innerHTML = `
            <div class="login-container">
                <h1 id="formTitle">Connexion</h1>
                <form id="authForm">
                    <input type="text" id="username" placeholder="Votre pseudo" required>
                    <input type="password" id="password" placeholder="Mot de passe" required>
                    <input type="email" id="email" placeholder="Votre e-mail" class="hidden">
                    <p id="messageArea" class="message"></p>
                    <button type="submit" id="actionButton">Se Connecter</button>
                </form>
                <p id="toggleMode">Pas encore de compte ? <a href="#">S'inscrire</a></p>
            </div>
        `;

        // On attache les écouteurs DANS la fonction, APRÈS la création du HTML
        let isRegisterMode = false;
        const authForm = document.getElementById('authForm');
        const toggleModeContainer = document.getElementById('toggleMode');

        authForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (isRegisterMode) {
                const email = document.getElementById('email').value;
                socket.emit('register', { username, password, email });
            } else {
                socket.emit('login', { username, password });
            }
        });

        toggleModeContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                isRegisterMode = !isRegisterMode;
                updateFormUI(isRegisterMode);
            }
        });
    }

    function showGameView(username) {
        appContainer.innerHTML = `
            <div class="game-container">
                <h1>Bienvenue, ${username} !</h1>
                <div class="account-form">
                    <h2>Modifier mon compte</h2>
                    <form id="updateForm">
                        <input type="password" id="newPassword" placeholder="Nouveau mot de passe">
                        <input type="email" id="newEmail" placeholder="Nouvel e-mail">
                        <button type="submit">Mettre à jour</button>
                    </form>
                    <p id="updateMessage" class="message"></p>
                </div>
                <button id="logoutButton">Déconnexion</button>
            </div>
        `;

        document.getElementById('logoutButton').addEventListener('click', () => {
            location.reload();
        });

        document.getElementById('updateForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const newEmail = document.getElementById('newEmail').value;
            const data = {};
            if (newPassword) data.newPassword = newPassword;
            if (newEmail) data.newEmail = newEmail;
            if (Object.keys(data).length > 0) {
                socket.emit('update_account', data);
            }
        });
    }

    // --- Fonctions utilitaires ---
    function updateFormUI(isRegisterMode) {
        const formTitle = document.getElementById('formTitle');
        const emailInput = document.getElementById('email');
        const actionButton = document.getElementById('actionButton');
        const toggleModeContainer = document.getElementById('toggleMode');

        if (isRegisterMode) {
            formTitle.textContent = 'Inscription';
            emailInput.classList.remove('hidden');
            emailInput.required = true;
            actionButton.textContent = "S'inscrire";
            toggleModeContainer.innerHTML = 'Déjà un compte ? <a href="#">Se connecter</a>';
        } else {
            formTitle.textContent = 'Connexion';
            emailInput.classList.add('hidden');
            emailInput.required = false;
            actionButton.textContent = 'Se Connecter';
            toggleModeContainer.innerHTML = "Pas encore de compte ? <a href=\"#\">S'inscrire</a>";
        }
    }

    function displayMessage(message, type, elementId) {
        const messageArea = document.getElementById(elementId);
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.className = `message ${type}`;
        }
    }

    // --- Démarrage ---
    showLoginView();
});
