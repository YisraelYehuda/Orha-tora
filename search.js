// Search Functionality - OrHaTorá
function search() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if(!query) {
        alert('Por favor, digite algo para pesquisar.');
        return;
    }

    // Índice de conteúdo do site com palavras-chave
    const searchIndex = {
        'parasha': '#parasha',
        'parashat': '#parasha',
        'tetzaveh': '#estudos-parasha',
        'torah': '#parasha',
        'torá': '#parasha',
        'halacha': '#estudos-halacha',
        'halachá': '#estudos-halacha',
        'mishna': '#estudos-halacha',
        'mishná': '#estudos-halacha',
        'tehilim': '#estudos-tehilim',
        'tefilah': '#estudos-tehilim',
        'tefila': '#estudos-tehilim',
        'tefilá': '#estudos-tehilim',
        'oracao': '#estudos-tehilim',
        'oração': '#estudos-tehilim',
        'historia': '#estudos-historia',
        'história': '#estudos-historia',
        'israel': '#estudos-historia',
        'purim': '#purim',
        'filosofia': '#estudos-filosofia',
        'kabbalah': '#estudos-filosofia',
        'kabbalá': '#estudos-filosofia',
        'midrash': '#midrash',
        'bnei': '#bnei-noach',
        'noach': '#bnei-noach',
        'beit': '#beit-midrash',
        'menora': '#estudos-parasha',
        'menorá': '#estudos-parasha',
        'azeite': '#estudos-halacha',
        'kohen': '#estudos-parasha',
        'kohanim': '#estudos-parasha',
        'moshé': '#estudos-parasha',
        'aharon': '#estudos-parasha',
        'hashem': '#inicio',
        'criador': '#inicio',
        'divino': '#inicio',
        'sagrado': '#inicio',
        'estudos': '#beit-midrash',
        'sheva': '#bnei-noach',
        'mitzvot': '#bnei-noach',
        'mandamentos': '#bnei-noach'
    };

    const target = searchIndex[query];
    if(target) {
        const element = document.querySelector(target);
        if(element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.getElementById('searchInput').value = '';
            // Destaque visual temporário
            element.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 3000);
        } else {
            alert('Seção não encontrada.');
        }
    } else {
        alert('Desculpe, não encontramos "' + query + '" em nosso acervo.\n\nTente pesquisar por:\n• Parashá\n• Torá\n• Halachá\n• Tehilim\n• História\n• Filosofia\n• Kabbalá\n• Purim\n• Bnei Noach');
    }
}

// Permitir busca com Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if(e.key === 'Enter') {
                search();
            }
        });
    }
});
