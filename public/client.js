document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const appContainer = document.getElementById('app-container');
    const disclaimerOverlay = document.getElementById('disclaimer-overlay');
    const acceptButton = document.getElementById('accept-disclaimer');

    // --- GESTION DU DISCLAIMER ---
    if (!sessionStorage.getItem('disclaimerAccepted')) {
        disclaimerOverlay.classList.add('visible');
    }

    acceptButton.addEventListener('click', () => {
        disclaimerOverlay.classList.remove('visible');
        sessionStorage.setItem('disclaimerAccepted', 'true');
    });

    // --- GESTION DES ÉVÉNEMENTS DU SERVEUR ---
    socket.on('login_success', (data) => {
        socket.username = data.username;
        showGameView(data.username);
    });
    socket.on('login_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('register_success', (message) => displayMessage(message, 'success', 'messageArea'));
    socket.on('register_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('update_success', (message) => displayMessage(message, 'success', 'updateMessage'));
    socket.on('update_fail', (message) => displayMessage(message, 'error', 'updateMessage'));

    // Affiche la vue de connexion au démarrage
    showLoginView();

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
        attachLoginListeners();
    }

    function showGameView(username) {
        appContainer.innerHTML = `
            <div class="game-page">
                <div class="team-selection">
                    <h2>Choisissez votre équipe</h2>
                    <div class="team-buttons">
                        <button class="team-btn blue" data-team="blue">Équipe Bleue</button>
                        <button class="team-btn red" data-team="red">Équipe Rouge</button>
                        <button class="team-btn green" data-team="green">Équipe Verte</button>
                    </div>
                </div>
            </div>
        `;
        attachGameListeners();
    }

    // --- FONCTIONS QUI ATTACHENT LES ÉVÉNEMENTS ---
    function attachLoginListeners() {
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

    function attachGameListeners() {
        // Gestion de la sélection d'équipe
        document.querySelectorAll('.team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const team = e.target.dataset.team;
                startGame(team);
            });
        });
    }

    function startGame(team) {
        // Charger le script du jeu
        const gameScript = document.createElement('script');
        gameScript.src = 'game/GameClient.js';
        gameScript.onload = () => {
            // Initialiser le client de jeu
            const gameClient = new GameClient(socket);
            gameClient.joinGame(socket.username, team);
            
            // Masquer la sélection d'équipe
            document.querySelector('.team-selection').style.display = 'none';
        };
        document.head.appendChild(gameScript);
    }

    // --- FONCTIONS UTILITAIRES ---
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

    function showSidebarSection(sectionId) {
        document.querySelectorAll('.sidebar-section').forEach(section => {
            section.classList.add('hidden');
        });
        const activeSection = document.getElementById(sectionId);
        if(activeSection) {
            activeSection.classList.remove('hidden');
        }
    }
    
    function displayMessage(message, type, elementId) {
        const messageArea = document.getElementById(elementId);
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.className = `message ${type}`;
        }
    }
});
