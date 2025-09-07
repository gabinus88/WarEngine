document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const appContainer = document.getElementById('app-container');

    // Fonction pour mettre à jour l'interface
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
        attachLoginListeners();
    }

    function showGameView(username) {
        appContainer.innerHTML = `
            <div class="game-container">
                <h1>Bienvenue, ${username} !</h1>
                <p>Le jeu va commencer...</p>
                <button id="logoutButton">Déconnexion</button>
            </div>
        `;
        document.getElementById('logoutButton').addEventListener('click', () => {
            location.reload();
        });
    }

    // Fonction pour attacher les écouteurs d'événements du formulaire
    function attachLoginListeners() {
        const formTitle = document.getElementById('formTitle');
        const authForm = document.getElementById('authForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const emailInput = document.getElementById('email');
        const actionButton = document.getElementById('actionButton');
        const toggleModeContainer = document.getElementById('toggleMode');
        const messageArea = document.getElementById('messageArea');

        let isRegisterMode = false;

        authForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;
            if (isRegisterMode) {
                const email = emailInput.value;
                socket.emit('register', { username, password, email });
            } else {
                socket.emit('login', { username, password });
            }
        });

        toggleModeContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                isRegisterMode = !isRegisterMode;
                updateFormMode();
            }
        });

        function updateFormMode() {
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

        function displayMessage(message, type) {
            messageArea.textContent = message;
            messageArea.className = `message ${type}`;
        }

        socket.on('login_fail', (message) => { displayMessage(message, 'error'); });
        socket.on('register_success', (message) => { displayMessage(message, 'success'); });
        socket.on('register_fail', (message) => { displayMessage(message, 'error'); });
    }

    // Événement principal de succès de connexion
    socket.on('login_success', (data) => {
        showGameView(data.username);
    });

    // Affiche la vue de connexion au chargement de la page
    showLoginView();
});
