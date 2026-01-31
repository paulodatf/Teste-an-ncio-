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

let todosAnuncios = [];
let filtroTexto = "";
let filtroCategoria = "Todos";
const banners = [
    'banner-cabeçalho1.png',
    'banner-cabeçalho2.png',
    'banner-cabeçalho3.png',
    'banner-cabeçalho4.png'
];

/**
 * REESTRUTURAÇÃO VISUAL PREMIUM COM FILTRO FIXO
 */
function configurarInterfaceUnica() {
    const header = document.querySelector('header');
    const containerPrincipal = document.querySelector('.container');
    if (!header || !containerPrincipal) return;

    const style = document.createElement('style');
    style.textContent = `
        :root { --header-blue: #0077ff; }

        header {
            height: auto !important;
            background: var(--header-blue) !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 0 !important;
            position: sticky !important;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .header-top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            width: 100%;
            box-sizing: border-box;
        }

        /* VIEWPORT DO BANNER */
        .banner-viewport {
            width: 100%;
            height: 180px;
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            background-color: #f0f0f0;
            position: relative;
            transition: all 0.3s ease;
            overflow: hidden;
        }

        /* SEÇÃO DE BUSCA E FILTROS AGORA DENTRO DO HEADER */
        .search-filter-area {
            background: white;
            padding: 12px 16px;
            width: 100%;
            box-sizing: border-box;
            border-bottom: 1px solid #eee;
        }

        .search-wrapper {
            background: #f1f3f5;
            display: flex;
            align-items: center;
            padding: 8px 14px;
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid #e9ecef;
        }

        .search-wrapper input {
            border: none;
            outline: none;
            background: transparent;
            width: 100%;
            margin-left: 10px;
            font-size: 15px;
            color: #333;
        }

        .categories-wrapper {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            padding: 2px 0;
        }
        .categories-wrapper::-webkit-scrollbar { display: none; }

        .cat-chip {
            background: #f8f9fa;
            color: #666;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            border: 1.5px solid #eee;
            transition: all 0.2s;
        }

        .cat-chip.active {
            background: var(--header-blue);
            color: white;
            border-color: var(--header-blue);
        }

        /* ESTADO SCROLLED: BANNER SOME, FILTRO SOBE */
        header.scrolled .banner-viewport {
            height: 0;
            opacity: 0;
            pointer-events: none;
        }

        #listaAnuncios { margin-top: 10px; }
    `;
    document.head.appendChild(style);

    const logoHtml = header.querySelector('.logo-container').innerHTML;
    const btnAnunciar = header.querySelector('.btn-anunciar').outerHTML;

    // Reconstrói o Header contendo Top Bar, Banner E os Filtros
    header.innerHTML = `
        <div class="header-top-bar">
            <span class="logo-container">${logoHtml}</span>
            ${btnAnunciar}
        </div>
        <div class="banner-viewport" id="bannerSlider"></div>
        <div class="search-filter-area">
            <div class="search-wrapper">
                <i class="fas fa-search" style="color: #adb5bd;"></i>
                <input type="text" id="inputBuscaAnuncios" placeholder="Buscar nos classificados..." enterkeyhint="search">
            </div>
            <div class="categories-wrapper" id="catContainer">
                <div class="cat-chip active" data-cat="Todos">Todos</div>
                <div class="cat-chip" data-cat="Emprego">Empregos</div>
                <div class="cat-chip" data-cat="Imóvel">Imóveis</div>
                <div class="cat-chip" data-cat="Usado">Produtos</div>
                <div class="cat-chip" data-cat="Serviço">Serviços</div>
            </div>
        </div>
    `;

    // Lógica de Rotação de Banners
    let bannerIdx = 0;
    const bannerSlider = document.getElementById('bannerSlider');
    const rotateBanner = () => {
        bannerSlider.style.backgroundImage = `url('${banners[bannerIdx]}')`;
        bannerIdx = (bannerIdx + 1) % banners.length;
    };
    rotateBanner();
    setInterval(rotateBanner, 5000);

    // Controle de Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Listeners de Busca e Filtro
    document.getElementById('inputBuscaAnuncios').addEventListener('input', (e) => {
        filtroTexto = e.target.value.toLowerCase();
        renderizarAnunciosFiltrados();
    });

    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filtroCategoria = this.getAttribute('data-cat');
            renderizarAnunciosFiltrados();
        });
    });
}

function renderizarAnunciosFiltrados() {
    const container = document.getElementById('listaAnuncios');
    if (!container) return;
    
    let filtrados = todosAnuncios.filter(anuncio => {
        const matchCategoria = filtroCategoria === "Todos" || anuncio.tipo === filtroCategoria;
        const titulo = (anuncio.titulo || "").toLowerCase();
        const descricao = (anuncio.descricao || "").toLowerCase();
        const matchTexto = titulo.includes(filtroTexto) || descricao.includes(filtroTexto);
        return matchCategoria && matchTexto;
    });

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#999;">
                <i class="fas fa-search" style="font-size:40px; margin-bottom:15px; opacity:0.3;"></i>
                <p>Nenhum anúncio encontrado.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtrados.map(data => criarTemplateAnuncio(data)).join('');
}

function criarTemplateAnuncio(data) {
    const telefoneLimpo = (data.whatsapp || '').replace(/\D/g, '');
    const linkZap = `https://wa.me/55${telefoneLimpo}?text=Olá! Vi seu anúncio no Pede Aí: *${encodeURIComponent(data.titulo || '')}*`;
    
    return `
        <div class="card-anuncio">
            ${data.foto ? `<img src="${data.foto}" alt="${data.titulo}" loading="lazy">` : ''}
            <div class="card-body">
                <span class="badge">${data.tipo || 'Geral'}</span>
                <h3 style="margin: 10px 0 5px 0; font-size: 16px; font-weight: 700;">${data.titulo || 'Sem título'}</h3>
                <p style="font-size: 13px; color: #666; line-height: 1.4; margin-bottom: 12px;">${data.descricao || ''}</p>
                <span class="price">${data.preco ? 'R$ ' + data.preco : 'A combinar'}</span>
                <a href="${linkZap}" class="btn-whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> CONVERSAR AGORA
                </a>
            </div>
        </div>`;
}

function carregarAnuncios() {
    const colRef = collection(db, "anuncios");

    onSnapshot(colRef, (snapshot) => {
        const tempAnuncios = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.status || data.status.toLowerCase() === "ativo") {
                tempAnuncios.push(data);
            }
        });

        tempAnuncios.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        todosAnuncios = tempAnuncios;
        renderizarAnunciosFiltrados();

    }, (error) => {
        console.error("Erro Firebase:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarInterfaceUnica();
    carregarAnuncios();
});