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
        sessionStorage.setItem('username', data.username);
        showGameView(data.username);
    });
    socket.on('login_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('register_success', (message) => displayMessage(message, 'success', 'messageArea'));
    socket.on('register_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('update_success', (message) => displayMessage(message, 'success', 'updateMessage'));
    socket.on('update_fail', (message) => displayMessage(message, 'error', 'updateMessage'));

    // Affiche la vue de connexion au démarrage
    const savedUsername = sessionStorage.getItem('username');
    if (savedUsername) {
        socket.emit('reconnect', { username: savedUsername });
    } else {
        showLoginView();
    }

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
                <button id="burger-menu"></button>
                <aside id="sidebar" class="sidebar">
                    <div class="sidebar-header">
                        <h2>${username}</h2>
                    </div>
                    <nav class="sidebar-nav">
                        <ul>
                            <li><a href="#" data-section="account-section">Compte</a></li>
                            <li><a href="#" data-section="division-editor-section">Éditeur de Division</a></li>
                            <li><a href="#" data-section="map-section">Carte</a></li>
                            <li><a href="#" data-section="search-section">Recherche</a></li>
                            <li><a href="#" data-section="skills-section">Compétences</a></li>
                        </ul>
                    </nav>
                    <div class="sidebar-content">
                        <div id="account-section" class="sidebar-section">
                            <div class="account-form">
                                <h2>Modifier mon compte</h2>
                                <form id="updateForm">
                                    <input type="password" id="newPassword" placeholder="Nouveau mot de passe">
                                    <input type="email" id="newEmail" placeholder="Nouvel e-mail">
                                    <button type="submit">Mettre à jour</button>
                                </form>
                                <p id="updateMessage" class="message"></p>
                            </div>
                        </div>
                        <div id="division-editor-section" class="sidebar-section hidden">
                            <h2>Éditeur de Division</h2><p>Contenu à venir...</p>
                        </div>
                        <div id="map-section" class="sidebar-section hidden">
                            <h2>Carte</h2>
                            <button id="start-checkers">Jeu de Dames</button>
                        </div>
                        <div id="search-section" class="sidebar-section hidden">
                            <h2>Recherche</h2><p>Contenu à venir...</p>
                        </div>
                        <div id="skills-section" class="sidebar-section hidden">
                            <h2>Compétences</h2><p>Contenu à venir...</p>
                        </div>
                    </div>
                    <button id="logoutButton" class="sidebar-logout-button">Déconnexion</button>
                </aside>
                <div class="game-content">
                    <p>Le jeu est prêt.</p>
                    <div id="checkers-game" class="hidden"></div>
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
        const sidebar = document.getElementById('sidebar');
        const burgerMenu = document.getElementById('burger-menu');

        burgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        document.getElementById('logoutButton').addEventListener('click', () => {
            sessionStorage.removeItem('username');
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

        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showSidebarSection(e.target.dataset.section);
            });
        });

        document.getElementById('start-checkers').addEventListener('click', () => {
            document.querySelector('.game-content p').classList.add('hidden');
            document.getElementById('checkers-game').classList.remove('hidden');
            socket.emit('checkers_start');
        });

        socket.on('checkers_update', (game) => {
            drawCheckersBoard(game.board);
        });

        socket.on('checkers_error', (message) => {
            displayMessage(message, 'error', 'updateMessage');
        });
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

    function drawCheckersBoard(board) {
        const gameContainer = document.getElementById('checkers-game');
        gameContainer.innerHTML = '';
        const boardElement = document.createElement('div');
        boardElement.className = 'checkers-board';
        let selectedPiece = null;

        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const square = document.createElement('div');
                square.className = `checkers-square ${((i + j) % 2 === 0) ? 'white' : 'black'}`;
                square.dataset.row = i;
                square.dataset.col = j;

                const piece = board[i][j];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `checkers-piece ${piece === 'r' ? 'red' : 'black'}`;
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', () => {
                    if (selectedPiece) {
                        socket.emit('checkers_move', { from: selectedPiece, to: { row: i, col: j } });
                        selectedPiece = null;
                    } else if (piece) {
                        selectedPiece = { row: i, col: j };
                    }
                });

                boardElement.appendChild(square);
            }
        }
        gameContainer.appendChild(boardElement);
    }
    
    function displayMessage(message, type, elementId) {
        const messageArea = document.getElementById(elementId);
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.className = `message ${type}`;
        }
    }
});
