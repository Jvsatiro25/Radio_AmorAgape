/* ==============================================================
   CONFIGURAÇÃO DO CARROSSEL DE FOTOS (ADICIONE SUAS IMAGENS AQUI)
   Basta colocar o link da imagem ou o caminho local (ex: "imagens/foto1.jpg")
   ============================================================== */

const IMAGENS_CARROSSEL = [
    "img/crsl_1.PNG",
    "img/crsl_2.PNG",
    "img/crsl_3.PNG",
    "img/crsl_4.PNG"
];


/* ==============================================================
   CONFIGURAÇÃO DA RÁDIO
   ============================================================== */

const STREAM_URL = "https://SEU-SERVIDOR-AQUI:PORTA/SEU-STREAM";
const API_STATUS_URL = "https://SEU-SERVIDOR-AQUI:PORTA/status-json.xsl";

const LOGO_IGREJA =
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=500&q=80";


/* ==============================================================
   INICIALIZAR CARROSSEL AUTOMATICAMENTE
   ============================================================== */

function inicializarCarrossel() {
    const track = document.getElementById("carouselTrack");
    if (!track) return;

    track.innerHTML = "";

    IMAGENS_CARROSSEL.forEach((url, index) => {
        const slide = document.createElement("div");
        slide.className = `carousel-slide ${index === 0 ? "active" : ""}`;
        slide.style.backgroundImage = `url('${url}')`;
        track.appendChild(slide);
    });

    const slides = track.querySelectorAll(".carousel-slide");
    let currentSlide = 0;

    if (slides.length > 1) {
        setInterval(() => {
            slides[currentSlide].classList.remove("active");
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add("active");
        }, 4500); // Troca a cada 4.5 segundos
    }
}

document.addEventListener("DOMContentLoaded", inicializarCarrossel);


/* ==============================================================
   MÚSICA INICIAL DE TESTE
   ============================================================== */

const CURRENT_SONG = {
    title: "Tua Presença",
    artist: "Paulo Neto",
    cover: null
};


/* ==============================================================
   ELEMENTOS DO DOM
   ============================================================== */

const audio = document.getElementById("radioAudio");
const playButton = document.getElementById("playButton");
const playerStatus = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const albumCover = document.getElementById("albumCover");
const volume = document.getElementById("volume");


/* ==============================================================
   VOLUME
   ============================================================== */

if (audio && volume) {
    audio.volume = volume.value;
}


/* ==============================================================
   NORMALIZA TEXTO
   ============================================================== */

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* ==============================================================
   BUSCAR CAPA NA INTERNET (iTunes Search API)
   ============================================================== */

async function buscarCapaNaInternet(titulo, artista) {
    try {
        const termoBusca = encodeURIComponent(`${titulo} ${artista}`);
        const url = `https://itunes.apple.com/search?term=${termoBusca}&media=music&entity=song&limit=10`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const tituloNormalizado = normalizarTexto(titulo);
        const artistaNormalizado = normalizarTexto(artista);

        let melhorResultado = null;
        let melhorPontuacao = 0;

        data.results.forEach(resultado => {
            const tituloApi = normalizarTexto(resultado.trackName);
            const artistaApi = normalizarTexto(resultado.artistName);
            let pontuacao = 0;

            if (tituloApi === tituloNormalizado) pontuacao += 5;
            if (tituloApi.includes(tituloNormalizado) || tituloNormalizado.includes(tituloApi)) pontuacao += 3;
            if (artistaApi === artistaNormalizado) pontuacao += 5;
            if (artistaApi.includes(artistaNormalizado) || artistaNormalizado.includes(artistaApi)) pontuacao += 3;

            if (pontuacao > melhorPontuacao) {
                melhorPontuacao = pontuacao;
                melhorResultado = resultado;
            }
        });

        if (!melhorResultado) melhorResultado = data.results[0];
        if (!melhorResultado.artworkUrl100) return null;

        return melhorResultado.artworkUrl100.replace("100x100", "600x600");
    } catch (error) {
        return null;
    }
}


/* ==============================================================
   ATUALIZAR PLAYER
   ============================================================== */

async function atualizarDadosPlayer(tituloTexto, artistaTexto) {
    if (!tituloTexto) return;

    playerStatus.textContent = tituloTexto;
    artistName.textContent = artistaTexto || "Igreja Vida Plena";
    albumCover.src = LOGO_IGREJA;

    if (CURRENT_SONG.cover) {
        albumCover.src = CURRENT_SONG.cover;
        return;
    }

    const capa = await buscarCapaNaInternet(tituloTexto, artistaTexto);
    albumCover.src = capa ? capa : LOGO_IGREJA;
}


/* ==============================================================
   TESTE INICIAL
   ============================================================== */

atualizarDadosPlayer(CURRENT_SONG.title, CURRENT_SONG.artist);


/* ==============================================================
   BUSCAR METADADOS AO VIVO
   ============================================================== */

function buscarMetadadosAoVivo() {
    if (!API_STATUS_URL || API_STATUS_URL.includes("SEU-SERVIDOR-AQUI")) return;

    fetch(API_STATUS_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            let currentTrack = "";
            try {
                currentTrack = data.icestats.source.title || "";
            } catch (e) {
                return;
            }

            if (!currentTrack) return;

            const partes = currentTrack.split(" - ");
            const artista = partes[0] ? partes.shift().trim() : "Igreja Vida Plena";
            const titulo = partes.length > 0 ? partes.join(" - ").trim() : currentTrack;

            const musicaAtual = normalizarTexto(`${artista} ${titulo}`);
            const musicaExibida = normalizarTexto(`${artistName.textContent} ${playerStatus.textContent}`);

            if (musicaAtual !== musicaExibida) {
                atualizarDadosPlayer(titulo, artista);
            }
        })
        .catch(error => {});
}


/* ==============================================================
   ATUALIZA A CADA 15 SEGUNDOS
   ============================================================== */

if (API_STATUS_URL && !API_STATUS_URL.includes("SEU-SERVIDOR-AQUI")) {
    buscarMetadadosAoVivo();
    setInterval(buscarMetadadosAoVivo, 15000);
}


/* ==============================================================
   PLAY / PAUSE
   ============================================================== */

playButton.addEventListener("click", function () {
    if (STREAM_URL.includes("SEU-SERVIDOR-AQUI")) {
        alert("Configure a URL do streaming no JavaScript para tocar o áudio real.");
        return;
    }

    if (audio.paused) {
        if (!audio.src || !audio.src.includes(STREAM_URL)) {
            audio.src = STREAM_URL;
        }

        playButton.textContent = "❚❚";
        playButton.classList.add("playing");

        audio.play().catch(function (error) {
            playButton.textContent = "▶";
            playButton.classList.remove("playing");
        });
    } else {
        audio.pause();
        playButton.textContent = "▶";
        playButton.classList.remove("playing");
    }
});


/* ==============================================================
   VOLUME
   ============================================================== */

volume.addEventListener("input", function () {
    audio.volume = this.value;
});


/* ==============================================================
   ESTADOS DO ÁUDIO
   ============================================================== */

audio.addEventListener("pause", function () {
    playButton.textContent = "▶";
    playButton.classList.remove("playing");
});

audio.addEventListener("playing", function () {
    playButton.textContent = "❚❚";
    playButton.classList.add("playing");
});