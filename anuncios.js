import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Estado global para filtros
let todosAnuncios = [];
let filtroTexto = "";
let filtroCategoria = "Todos";

/**
 * ESTILIZAÇÃO E INJEÇÃO DA UI DE BUSCA/FILTROS
 */
function injetarInterfaceFiltros() {
    const header = document.querySelector('header');
    
    // CSS dinâmico para garantir o comportamento sticky e o visual
    const style = document.createElement('style');
    style.textContent = `
        .search-sticky-container {
            position: sticky;
            top: 60px; /* Logo abaixo do header (aprox 60px) */
            z-index: 999;
            background: #0077ff;
            padding: 10px 16px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .search-wrapper {
            background: white;
            display: flex;
            align-items: center;
            padding: 8px 14px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .search-wrapper input {
            border: none;
            outline: none;
            width: 100%;
            margin-left: 10px;
            font-size: 14px;
        }
        .categories-wrapper {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 4px;
        }
        .categories-wrapper::-webkit-scrollbar { display: none; }
        .cat-chip {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.3);
            transition: 0.2s;
        }
        .cat-chip.active {
            background: white;
            color: #0077ff;
        }
        /* Ajuste no container para não ficar colado nos filtros fixos */
        #listaAnuncios { margin-top: 10px; }
    `;
    document.head.appendChild(style);

    // Criar Elementos
    const stickyContainer = document.createElement('div');
    stickyContainer.className = 'search-sticky-container';

    stickyContainer.innerHTML = `
        <div class="search-wrapper">
            <i class="fas fa-search" style="color: #0077ff;"></i>
            <input type="text" id="inputBuscaAnuncios" placeholder="Buscar em anúncios..." enterkeyhint="search">
        </div>
        <div class="categories-wrapper" id="catContainer">
            <div class="cat-chip active" data-cat="Todos">Todos</div>
            <div class="cat-chip" data-cat="Emprego">Emprego</div>
            <div class="cat-chip" data-cat="Imóvel">Imóvel</div>
            <div class="cat-chip" data-cat="Usado">Produto Usado</div>
            <div class="cat-chip" data-cat="Serviço">Serviço / Trabalho</div>
        </div>
    `;

    header.after(stickyContainer);

    // Eventos de Busca
    document.getElementById('inputBuscaAnuncios').addEventListener('input', (e) => {
        filtroTexto = e.target.value.toLowerCase();
        renderizarAnunciosFiltrados();
    });

    // Eventos de Categoria
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filtroCategoria = this.getAttribute('data-cat');
            renderizarAnunciosFiltrados();
        });
    });
}

/**
 * LÓGICA DE FILTRAGEM INTELIGENTE
 */
function renderizarAnunciosFiltrados() {
    const container = document.getElementById('listaAnuncios');
    
    // 1. Filtrar por Categoria
    let filtrados = todosAnuncios.filter(anuncio => {
        const matchCategoria = filtroCategoria === "Todos" || anuncio.tipo === filtroCategoria;
        
        // 2. Filtrar por Texto (Busca Inteligente)
        const titulo = (anuncio.titulo || "").toLowerCase();
        const tipo = (anuncio.tipo || "").toLowerCase();
        
        // Normalização simples para ajudar com erros leves de digitação (ex: "emprgo" em "emprego")
        // Aqui usamos includes para garantir que partes da palavra funcionem
        const matchTexto = titulo.includes(filtroTexto) || tipo.includes(filtroTexto);
        
        return matchCategoria && matchTexto;
    });

    if (filtrados.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">Nenhum anúncio encontrado com esses termos.</p>';
        return;
    }

    let htmlFinal = '';
    filtrados.forEach(data => {
        htmlFinal += criarTemplateAnuncio(data);
    });
    
    container.innerHTML = htmlFinal;
}

function criarTemplateAnuncio(data) {
    const telefoneLimpo = (data.whatsapp || '').replace(/\D/g, '');
    const linkZap = `https://wa.me/55${telefoneLimpo}?text=Vi seu anúncio no Pede Aí: ${encodeURIComponent(data.titulo || '')}`;
    
    return `
        <div class="card-anuncio">
            ${data.foto ? `<img src="${data.foto}" alt="${data.titulo}">` : ''}
            <div class="card-body">
                <span class="badge">${data.tipo || 'Geral'}</span>
                <h3 style="margin: 10px 0 5px 0; font-size: 18px;">${data.titulo || 'Sem título'}</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">${data.descricao || ''}</p>
                <span class="price">${data.preco ? 'R$ ' + data.preco : 'A combinar'}</span>
                <a href="${linkZap}" class="btn-whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> CONTATO VIA WHATSAPP
                </a>
            </div>
        </div>`;
}

function carregarAnuncios() {
    const container = document.getElementById('listaAnuncios');
    const colRef = collection(db, "anuncios");

    onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum anúncio encontrado no banco de dados.</p>';
            return;
        }

        const tempAnuncios = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.status || data.status.toLowerCase() === "ativo") {
                tempAnuncios.push(data);
            }
        });

        // Ordenação por data decrescente
        tempAnuncios.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        // Atualiza a memória global
        todosAnuncios = tempAnuncios;
        
        // Renderiza aplicando os filtros atuais
        renderizarAnunciosFiltrados();

    }, (error) => {
        console.error("Erro detalhado do Firebase:", error);
        container.innerHTML = `<p style="text-align:center; color:red; padding:20px;">Erro ao carregar: ${error.message}</p>`;
    });
}

// Inicialização
injetarInterfaceFiltros();
carregarAnuncios();