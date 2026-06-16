import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAF65a1KdFot8i_1ODWzOH3XQl_ZH231V0",
    authDomain: "sistema-de-caixa-banco.firebaseapp.com",
    projectId: "sistema-de-caixa-banco",
    storageBucket: "sistema-de-caixa-banco.firebasestorage.app",
    messagingSenderId: "113163439585",
    appId: "1:113163439585:web:d97071ac616d6bbe5996a0",
    databaseURL: "https://sistema-de-caixa-banco-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let bancoLocal = {};
let primeiroCarregamento = true;

window.sincronizarComFirebase = function(callback) {
    const dbRef = ref(db, '/');
    onValue(dbRef, (snapshot) => {
        bancoLocal = snapshot.exists() ? snapshot.val() : {};
        
        if (primeiroCarregamento) {
            primeiroCarregamento = false;
            if (callback) callback();
            document.dispatchEvent(new Event('bancoPronto'));
        }
        document.dispatchEvent(new Event('dadosAtualizados'));
    });
};

window.obterDados = function(chave) {
    return bancoLocal[chave] || null;
};

window.salvarDados = function(chave, dados) {
    bancoLocal[chave] = dados;
    set(ref(db, '/' + chave), dados);
};

// Inicia a escuta automática dos dados imediatamente
window.sincronizarComFirebase();