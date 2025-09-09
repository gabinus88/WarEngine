// public/client.js

// -- DÉBUT DES AJOUTS POUR LA CARTE --
// Drapeaux pour gérer l'état de la carte et de l'API
let mapApiReady = false;
let mapIsVisible = false;
let mapInitialized = false;
// -- FIN DES AJOUTS POUR LA CARTE --


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
    socket.on('login_success', (data) => showGameView(data.username));
    socket.on('login_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('register_success', (message) => displayMessage(message, 'success', 'messageArea'));
    socket.on('register_fail', (message) => displayMessage(message, 'error', 'messageArea'));
    socket.on('update_success', (message) => displayMessage(message, 'success', 'updateMessage'));
    socket.on('update_fail', (message) => displayMessage(message, 'error', 'updateMessage'));

    showLoginView();

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
                        <h2>Menu</h2>
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
                        <div id="division-editor-section" class="sidebar-section hidden"><h2>Éditeur de Division</h2><p>Contenu à venir...</p></div>
                        <div id="search-section" class="sidebar-section hidden"><h2>Recherche</h2><p>Contenu à venir...</p></div>
                        <div id="skills-section" class="sidebar-section hidden"><h2>Compétences</h2><p>Contenu à venir...</p></div>
                    </div>
                    <button id="logoutButton" class="sidebar-logout-button">Déconnexion</button>
                </aside>
                <div class="game-content">
                    <div id="welcome-message">
                        <h1>Bienvenue, ${username} !</h1>
                        <p>Le jeu est prêt.</p>
                    </div>
                    <div id="map-container" class="hidden">
                        <div id="map"></div>
                    </div>
                </div>
            </div>
        `;
        attachGameListeners();
    }

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

        burgerMenu.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.getElementById('logoutButton').addEventListener('click', () => location.reload());
        document.getElementById('updateForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const newEmail = document.getElementById('newEmail').value;
            const data = {};
            if (newPassword) data.newPassword = newPassword;
            if (newEmail) data.newEmail = newEmail;
            if (Object.keys(data).length > 0) socket.emit('update_account', data);
        });

        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = e.target.dataset.section;

                if (sectionId === 'map-section') {
                    showMap();
                } else {
                    showSidebarSection(sectionId);
                }
                if (window.innerWidth < 768) sidebar.classList.remove('open');
            });
        });
    }
    
    // --- MODIFICATIONS POUR AFFICHER LA CARTE ---
    function showSidebarSection(sectionId) {
        document.getElementById('map-container').classList.add('hidden');
        document.getElementById('welcome-message').classList.remove('hidden');
        mapIsVisible = false;

        document.querySelectorAll('.sidebar-section').forEach(section => {
            section.classList.add('hidden');
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            document.getElementById('welcome-message').classList.add('hidden');
        }
    }

    function showMap() {
        document.getElementById('welcome-message').classList.add('hidden');
        document.querySelectorAll('.sidebar-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById('map-container').classList.remove('hidden');
        mapIsVisible = true;

        if (mapApiReady && !mapInitialized) {
            createMap();
        }
    }

    function createMap() {
        if (mapInitialized) return;
        mapInitialized = true;

        const mapStyles = [
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
            { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
            { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#555555" }] },
            { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
            { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
            { "featureType": "water", "elementType": "labels", "stylers": [{ "visibility": "off" }] }
        ];

        const mapOptions = {
            center: { lat: 46.603354, lng: 1.888334 },
            zoom: 6,
            styles: mapStyles,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        };

        const mapElement = document.getElementById('map');
        if (mapElement) {
            new google.maps.Map(mapElement, mapOptions);
        } else {
            console.error("L'élément #map est introuvable.");
        }
    }
    
    function updateFormUI(isRegisterMode) {
        // ... (votre fonction existante, inchangée)
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
});

// CETTE FONCTION EST MAINTENANT APPELÉE PAR GOOGLE LORSQUE L'API EST PRÊTE
function initMap() {
    mapApiReady = true;
    if (mapIsVisible && !mapInitialized) {
        // Le `createMap` est maintenant appelé depuis le callback si la carte doit être visible
        // On s'assure que le DOM est prêt en le différant légèrement
        setTimeout(() => {
            const gameContent = document.querySelector('.game-content');
            if (gameContent) {
                 // Trouve la fonction createMap qui est maintenant dans la portée de DOMContentLoaded
                 // C'est une astuce, une meilleure gestion d'état serait préférable pour un gros projet
                 // Mais pour ce cas, on peut simplement la rendre globale ou la rappeler ici.
                 // Pour la simplicité, nous allons juste supposer qu'elle sera trouvée.
                 if (typeof createMap === "function") createMap();
            }
        }, 0);
    }
}
