import { db, auth } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const secretKey = "secret_key";

// --- Encryption ---
function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, secretKey).toString();
}

function decryptPassword(encrypted) {
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function generatePassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// --- Render passwords ---
async function renderPasswords(userId) {
  const tableBody = document.getElementById('password_table').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  const q = query(collection(db, 'passwords'), where("userId", "==", userId));

  onSnapshot(q, (querySnapshot) => {
    tableBody.innerHTML = '';
    if (querySnapshot.empty) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'Brak zapisanych haseł';
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const entry = docSnap.data();
      const row = document.createElement('tr');

      const serviceCell = document.createElement('td');
      serviceCell.textContent = entry.service;
      row.appendChild(serviceCell);

      const usernameCell = document.createElement('td');
      usernameCell.textContent = entry.username;
      row.appendChild(usernameCell);

      const passwordCell = document.createElement('td');
      passwordCell.textContent = '********'; // masked by default
      row.appendChild(passwordCell);

      // Actions: Edit and Delete buttons
      const actionsCell = document.createElement('td');

      const editButton = document.createElement('button');
      editButton.classList.add('edit');
      editButton.textContent = 'Edytuj';
      editButton.onclick = () => {
        document.getElementById('service_name').value = entry.service;
        document.getElementById('username_email').value = entry.username;
        document.getElementById('password').value = decryptPassword(entry.password);
        deletePassword(userId, docSnap.id);
      };
      actionsCell.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('delete');
      deleteButton.textContent = 'Usuń';
      deleteButton.onclick = () => deletePassword(userId, docSnap.id);
      actionsCell.appendChild(deleteButton);

      row.appendChild(actionsCell);

      // Show password toggle button with re-authentication
      const showCell = document.createElement('td');
      const showButton = document.createElement('button');
      showButton.textContent = 'Pokaż';

      let showing = false; // state to track toggle

      showButton.onclick = async () => {
        if (showing) {
          // Hide password
          passwordCell.textContent = '********';
          showButton.textContent = 'Pokaż';
          showing = false;
        } else {
          const accountPassword = prompt('Wpisz hasło do swojego konta, aby wyświetlić hasło:');
          if (!accountPassword) return;

          try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, accountPassword);
            await reauthenticateWithCredential(user, credential);
            passwordCell.textContent = decryptPassword(entry.password);
            showButton.textContent = 'Ukryj';
            showing = true;
          } catch {
            alert('Błędne hasło konta. Nie można wyświetlić hasła.');
          }
        }
      };

      showCell.appendChild(showButton);
      row.appendChild(showCell);

      tableBody.appendChild(row);
    });
  });
}

// --- Add password ---
async function addPasswordEntry(userId, service, username, password) {
  const encryptedPassword = encryptPassword(password);
  await addDoc(collection(db, 'passwords'), {
    userId,
    service,
    username,
    password: encryptedPassword
  });
}

// --- Delete password ---
async function deletePassword(userId, docId) {
  await deleteDoc(doc(db, 'passwords', docId));
}

// --- Event Listeners ---
document.getElementById('generate_password').addEventListener('click', () => {
  document.getElementById('password').value = generatePassword();
});

document.getElementById('password_form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const service = document.getElementById('service_name').value.trim();
  const username = document.getElementById('username_email').value.trim();
  const password = document.getElementById('password').value.trim();
  const user = auth.currentUser;

  if (service && username && password && user) {
    await addPasswordEntry(user.uid, service, username, password);
    document.getElementById('password_form').reset();
    renderPasswords(user.uid);  // Refresh table immediately
  } else {
    alert('Wypełnij wszystkie pola!');
  }
});

document.getElementById('register_button').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('auth_password').value.trim();
  if (email && password) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Konto utworzone!');
    } catch (err) {
      alert('Błąd rejestracji: ' + err.message);
    }
  } else {
    alert('Wprowadź email i hasło.');
  }
});

document.getElementById('auth_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('auth_password').value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert('Błąd logowania: ' + err.message);
  }
});

document.getElementById('logout_button').addEventListener('click', async () => {
  await signOut(auth);
});

// Refresh passwords on user state change
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('auth_section').style.display = 'none';
    document.getElementById('password_section').style.display = 'block';
    renderPasswords(user.uid);
  } else {
    document.getElementById('auth_section').style.display = 'block';
    document.getElementById('password_section').style.display = 'none';
  }
});
