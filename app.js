// --- Encryption and Decryption Functions ---
const secretKey = "secret_key";

// Encrypts a password using AES
function encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, secretKey).toString();
}

// Decrypts an AES-encrypted password
function decryptPassword(encrypted) {
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// --- Password Generation ---
function generatePassword(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// --- Local Storage Helpers ---
// Loads passwords for a user from localStorage
function loadPasswords(userId) {
    const saved = localStorage.getItem(userId + '_passwordEntries');
    return saved ? JSON.parse(saved) : [];
}

// Saves passwords for a user to localStorage
function savePasswords(userId, passwords) {
    localStorage.setItem(userId + '_passwordEntries', JSON.stringify(passwords));
}

// --- UI Rendering ---
// Renders the password table for the logged-in user
function renderPasswords(userId) {
    const tableBody = document.getElementById('password_table').getElementsByTagName('tbody')[0];
    const passwords = loadPasswords(userId);
    tableBody.innerHTML = ''; // Clear previous entries

    if (passwords.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Brak zapisanych haseł';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    passwords.forEach((entry, idx) => {
        const row = document.createElement('tr');

        // Service
        const serviceCell = document.createElement('td');
        serviceCell.textContent = entry.service;
        serviceCell.setAttribute('data-label', 'Serwis');
        row.appendChild(serviceCell);

        // Username/Email
        const usernameCell = document.createElement('td');
        usernameCell.textContent = entry.username;
        usernameCell.setAttribute('data-label', 'Użytkownik/Email');
        row.appendChild(usernameCell);

        // Password (decrypted)
        const passwordCell = document.createElement('td');
        passwordCell.textContent = decryptPassword(entry.password);
        passwordCell.setAttribute('data-label', 'Hasło');
        row.appendChild(passwordCell);

        // Actions (Edit & Delete)
        const actionsCell = document.createElement('td');
        actionsCell.setAttribute('data-label', 'Akcje');

        // Edit button
        const editButton = document.createElement('button');
        editButton.classList.add('edit');
        editButton.textContent = 'Edytuj';
        editButton.onclick = () => editPassword(userId, idx);
        actionsCell.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete');
        deleteButton.textContent = 'Usuń';
        deleteButton.onclick = () => deletePassword(userId, idx);
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });
}

// --- CRUD Operations ---
// Adds a new password entry
function addPasswordEntry(userId, service, username, password) {
    const passwords = loadPasswords(userId);
    const encryptedPassword = encryptPassword(password);
    passwords.push({ service, username, password: encryptedPassword });
    savePasswords(userId, passwords);
    renderPasswords(userId);
}

// Deletes a password entry by index
function deletePassword(userId, idx) {
    const passwords = loadPasswords(userId);
    passwords.splice(idx, 1);
    savePasswords(userId, passwords);
    renderPasswords(userId);
}

// Edits a password entry by index (fills form, removes old entry)
function editPassword(userId, idx) {
    const passwords = loadPasswords(userId);
    const entry = passwords[idx];
    document.getElementById('service_name').value = entry.service;
    document.getElementById('username_email').value = entry.username;
    document.getElementById('password').value = decryptPassword(entry.password);
    deletePassword(userId, idx);
}

// --- Event Listeners ---

// Generate password button
document.getElementById('generate_password').addEventListener('click', () => {
    document.getElementById('password').value = generatePassword();
});

// Add new password entry
document.getElementById('password_form').addEventListener('submit', (event) => {
    event.preventDefault();
    const service = document.getElementById('service_name').value.trim();
    const username = document.getElementById('username_email').value.trim();
    const password = document.getElementById('password').value.trim();
    const userId = localStorage.getItem('loggedInUser');
    if (service && username && password) {
        addPasswordEntry(userId, service, username, password);
        document.getElementById('password_form').reset();
    } else {
        alert('Wypełnij wszystkie pola!');
    }
});

// Login
document.getElementById('login_form').addEventListener('submit', (event) => {
    event.preventDefault();
    const userId = document.getElementById('user_id').value.trim();
    if (userId) {
        localStorage.setItem('loggedInUser', userId);
        renderPasswords(userId);
        window.location.reload();
    } else {
        alert("Wpisz identyfikator użytkownika!");
    }
});

// Logout
document.getElementById('logout_button').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.reload();
});

// --- Initial UI State ---
// Show/hide sections based on login status
window.addEventListener('load', () => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        renderPasswords(loggedInUser);
        document.getElementById('login_section').style.display = 'none';
        document.getElementById('password_section').style.display = 'block';
    } else {
        document.getElementById('login_section').style.display = 'block';
        document.getElementById('password_section').style.display = 'none';
        // Clear password table
        const tableBody = document.getElementById('password_table').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
    }
});
