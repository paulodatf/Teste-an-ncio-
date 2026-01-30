import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQ8rwkKUpbiZ6zII2Pd62q-8sAK_CDLs0",
    authDomain: "ofcpedeai.firebaseapp.com",
    projectId: "ofcpedeai",
    storageBucket: "ofcpedeai.firebasestorage.app",
    messagingSenderId: "1013404177752",
    appId: "1:1013404177752:web:a3b175b55939e3ad47812d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/de0cvvii9/image/upload";
const UPLOAD_PRESET = "pedeairapido";

document.getElementById('btnPublicar').addEventListener('click', async () => {
    const btn = document.getElementById('btnPublicar');
    const load = document.getElementById('loading');
    
    const titulo = document.getElementById('titulo').value;
    const tipo = document.getElementById('tipo').value;
    const descricao = document.getElementById('descricao').value;
    const preco = document.getElementById('preco').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const file = document.getElementById('foto').files[0];

    if (!titulo || !whatsapp) return alert("Preencha título e WhatsApp!");

    btn.style.display = 'none';
    load.style.display = 'block';

    let fotoUrl = "";

    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const json = await res.json();
        fotoUrl = json.secure_url;
    }

    try {
        await addDoc(collection(db, "anuncios"), {
            titulo, tipo, descricao, preco, whatsapp,
            foto: fotoUrl,
            status: "ativo",
            createdAt: Date.now()
        });
        alert("Publicado com sucesso!");
        window.location.href = "anuncios.html";
    } catch (e) {
        alert("Erro ao salvar.");
        btn.style.display = 'block';
        load.style.display = 'none';
    }
});