document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.querySelector('.card-container');
    const inputBusca = document.getElementById('input-busca');
    const botaoBusca = document.getElementById('botao-busca');
    const generoFiltrosContainer = document.getElementById('genero-filtros');
    const toggleFiltrosBtn = document.getElementById('toggle-filtros-btn');

    let filmes = [];

    // Função para buscar os dados do JSON
    async function carregarFilmes() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            filmes = await response.json();
            exibirFilmes(filmes);
            criarFiltrosDeGenero(filmes);
        } catch (error) {
            console.error("Não foi possível carregar os dados dos filmes:", error);
            cardContainer.innerHTML = "<p>Erro ao carregar filmes. Tente novamente mais tarde.</p>";
        }
    }

    // Função para exibir os filmes na tela
    function exibirFilmes(listaDeFilmes) {
        cardContainer.innerHTML = ''; // Limpa o container antes de adicionar novos cards
        if (listaDeFilmes.length === 0) {
            cardContainer.innerHTML = "<p>Nenhum filme encontrado.</p>";
            return;
        }

        listaDeFilmes.forEach((filme, index) => {
            const movieId = `movie-${index}`; // ID único para cada filme
            const card = document.createElement('article'); // Alterado de 'div' para 'article'
            card.innerHTML = `
                <div class="card-body">
                    <img src="mídia/${filme.imagem}" alt="Pôster do filme ${filme.nome}" class="card-image">
                    <div class="card-content"> 
                        <div>
                            <h3>${filme.nome} (${filme.ano})</h3>
                            <p><strong>Diretor:</strong> ${filme.diretor}</p>
                            <p><strong>Gêneros:</strong> ${filme.genero.join(', ')}</p>
                            <p class="sinopse">${filme.sinopse}</p> 
                        </div>
                        <div class="card-footer">
                             <a href="${filme.link}" target="_blank" class="watch-button">Assistir Agora</a>
                        </div>
                    </div>
                </div>
                <div class="comments-section">
                    <h3>Comentários</h3>
                    <div class="comments-list" data-movie-id="${movieId}">
                        <!-- Comentários serão carregados aqui -->
                    </div>
                    <form class="comment-form" data-movie-id="${movieId}">
                        <input type="text" name="author" placeholder="Seu nome" required>
                        <textarea name="comment" placeholder="Deixe seu comentário..." required></textarea>
                        <button type="submit">Comentar</button>
                    </form>
                </div>
            `;
            cardContainer.appendChild(card);
            carregarComentarios(movieId, card.querySelector('.comments-list'));
        });
    }

    function carregarComentarios(movieId, commentsListElement) {
        const comentarios = JSON.parse(localStorage.getItem(movieId)) || [];
        commentsListElement.innerHTML = '';
        if (comentarios.length === 0) {
            commentsListElement.innerHTML = '<p class="no-comments">Ainda não há comentários. Seja o primeiro!</p>';
        } else {
            comentarios.forEach(comentario => {
                adicionarComentarioNaTela(comentario, commentsListElement);
            });
        }
    }

    function adicionarComentarioNaTela(comentario, commentsListElement) {
        // Remove a mensagem "sem comentários" se ela existir
        const noComments = commentsListElement.querySelector('.no-comments');
        if (noComments) {
            noComments.remove();
        }

        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `<p><strong>${comentario.autor}:</strong> ${comentario.texto}</p>`;
        commentsListElement.appendChild(commentElement);
    }

    // Delegação de evento para os formulários de comentário
    cardContainer.addEventListener('submit', function(event) {
        if (event.target.classList.contains('comment-form')) {
            event.preventDefault();
            const form = event.target;
            const movieId = form.dataset.movieId;
            const autor = form.elements.author.value;
            const texto = form.elements.comment.value;

            const novoComentario = { autor, texto };
            const comentarios = JSON.parse(localStorage.getItem(movieId)) || [];
            comentarios.push(novoComentario);
            localStorage.setItem(movieId, JSON.stringify(comentarios));

            adicionarComentarioNaTela(novoComentario, form.previousElementSibling);
            form.reset();
        }
    });

    // Função para criar os checkboxes de filtro de gênero dinamicamente
    function criarFiltrosDeGenero(listaDeFilmes) {
        const todosOsGeneros = new Set();
        listaDeFilmes.forEach(filme => {
            filme.genero.forEach(g => todosOsGeneros.add(g));
        });

        const generosOrdenados = Array.from(todosOsGeneros).sort();

        generosOrdenados.forEach(genero => {
            const div = document.createElement('div');
            div.className = 'filtro-checkbox';
            const id = `filtro-${genero.replace(/\s+/g, '-')}`;
            div.innerHTML = `
                <input type="checkbox" id="${id}" name="genero" value="${genero}">
                <label for="${id}">${genero}</label>
            `;
            generoFiltrosContainer.appendChild(div);
        });

        // Adiciona o evento de clique para os filtros de gênero
        generoFiltrosContainer.addEventListener('change', aplicarFiltros);
    }

    // Função unificada para aplicar busca e filtros
    function aplicarFiltros() {
        const termoBusca = inputBusca.value.toLowerCase();
        const generosSelecionados = Array.from(generoFiltrosContainer.querySelectorAll('input:checked')).map(input => input.value);

        let filmesFiltrados = filmes;

        // 1. Filtra por gênero
        if (generosSelecionados.length > 0) {
            filmesFiltrados = filmesFiltrados.filter(filme => 
                generosSelecionados.every(genero => filme.genero.includes(genero))
            );
        }

        // 2. Filtra pelo termo de busca
        if (termoBusca) {
            filmesFiltrados = filmesFiltrados.filter(filme => 
                filme.nome.toLowerCase().includes(termoBusca) ||
                filme.diretor.toLowerCase().includes(termoBusca) ||
                filme.sinopse.toLowerCase().includes(termoBusca)
            );
        }

        exibirFilmes(filmesFiltrados);
    }

    // Adiciona o evento de clique no botão de busca
    botaoBusca.addEventListener('click', aplicarFiltros);

    // Adiciona o evento de digitação no input de busca para filtrar em tempo real
    inputBusca.addEventListener('keyup', aplicarFiltros);

    // Adiciona evento para mostrar/esconder filtros
    toggleFiltrosBtn.addEventListener('click', () => {
        const estaVisivel = generoFiltrosContainer.style.maxHeight && generoFiltrosContainer.style.maxHeight !== '0px';
        generoFiltrosContainer.style.maxHeight = estaVisivel ? '0px' : `${generoFiltrosContainer.scrollHeight}px`;
    });

    // Carrega os filmes ao iniciar a página
    carregarFilmes();

});