// Validação do formulário de contato
const formularioContato = document.getElementById('contactFormModal');
if (formularioContato) {
    formularioContato.addEventListener('submit', function(e) {
        e.preventDefault();
        const campoCPF = document.getElementById('cpfModal');
        const cpf = campoCPF.value.replace(/[^\d]/g, '');
        
        if (validarCPF(cpf)) {
            campoCPF.classList.remove('is-invalid');
            this.submit(); // Envia o formulário se a validação passar
            
            // Fecha o modal
            if (typeof bootstrap !== 'undefined') {
                const modal = document.getElementById('contatoModal');
                if (modal) {
                    const instanciaModal = bootstrap.Modal.getInstance(modal);
                    if (instanciaModal) {
                        instanciaModal.hide();
                    }
                }
            }
        } else {
            campoCPF.classList.add('is-invalid');
        }
    });
}

// Máscara para o campo de CPF
const campoCPF = document.getElementById('cpfModal');
if (campoCPF) {
    campoCPF.addEventListener('input', function(e) {
        const alvo = e.target;
        let valor = alvo.value.replace(/\D/g, '');
        
        if (valor.length > 3) valor = valor.replace(/^(\d{3})/, '$1.');
        if (valor.length > 6) valor = valor.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        if (valor.length > 9) valor = valor.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        if (valor.length > 14) valor = valor.substring(0, 14);
        
        alvo.value = valor;
    });
}

// Função para validar CPF
function validarCPF(cpf) {
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    const todosIguais = cpf.split('').every(digito => digito === cpf[0]);
    if (todosIguais) return false;

    // Cálculo do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let digito1 = (soma * 10) % 11;
    if (digito1 === 10) digito1 = 0;
    if (digito1 !== parseInt(cpf[9])) return false;

    // Cálculo do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    let digito2 = (soma * 10) % 11;
    if (digito2 === 10) digito2 = 0;

    return digito2 === parseInt(cpf[10]);
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Modal de notícia do carrossel
    const modalNoticia = document.getElementById('noticiaModal');
    if (modalNoticia) {
        modalNoticia.addEventListener('show.bs.modal', function(event) {
            const botao = event.relatedTarget;
            
            if (botao) {
                // Obtém os dados da notícia
                const titulo = botao.getAttribute('data-titulo');
                const subtitulo = botao.getAttribute('data-subtitulo');
                const imagem = botao.getAttribute('data-imagem');
                const conteudo = botao.getAttribute('data-conteudo');
                const autor = botao.getAttribute('data-autor');

                // Atualiza o conteúdo do modal
                const elementoTitulo = document.getElementById('noticiaModalTitle');
                const elementoSubtitulo = document.getElementById('noticiaModalSubtitle');
                const elementoImagem = document.getElementById('noticiaModalImage');
                const elementoConteudo = document.getElementById('noticiaModalContent');
                const elementoAutor = document.getElementById('noticiaModalAuthor');

                if (elementoTitulo && titulo) elementoTitulo.textContent = titulo;
                if (elementoSubtitulo && subtitulo) elementoSubtitulo.textContent = subtitulo;
                if (elementoImagem && imagem) elementoImagem.src = imagem;
                if (elementoConteudo && conteudo) elementoConteudo.textContent = conteudo;
                if (elementoAutor && autor) elementoAutor.textContent = 'Por: ' + autor;
            }
        });
    }

    // Estado ativo dos links da navbar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Efeitos hover nas imagens do carrossel
    const imagensCarrossel = document.querySelectorAll('.carousel-img');
    imagensCarrossel.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.02)';
            img.style.transition = 'transform 0.3s ease';
        });
        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });
    });

    // Funcionalidade de edição de cards para admin
    if (document.body.classList.contains('admin-logged')) {
        configurarEdicaoDeCards();
    }
});

// Funções para edição de cards
function configurarEdicaoDeCards() {
    document.querySelectorAll('.edit-card-btn').forEach(botao => {
        botao.addEventListener('click', function() {
            const idCard = this.getAttribute('data-card-id');
            const posicao = this.getAttribute('data-card-position');
            const categoria = this.getAttribute('data-card-category');
            
            // Configura o formulário antes de abrir o modal
            const form = document.getElementById('editCardForm');
            form.action = `/admin/cards/update/${idCard}`;
            
            // Adiciona campo hidden para posição se não existir
            if (!document.getElementById('editCardPosicao')) {
                const posicaoInput = document.createElement('input');
                posicaoInput.type = 'hidden';
                posicaoInput.name = 'posicao';
                posicaoInput.id = 'editCardPosicao';
                posicaoInput.value = posicao;
                form.appendChild(posicaoInput);
            } else {
                document.getElementById('editCardPosicao').value = posicao;
            }

            abrirModalEditarCard(idCard, posicao, categoria);
        });
    });
}

function abrirModalEditarCard(idCard, posicao, categoria) {
    const form = document.getElementById('editCardForm');
    
    if (idCard.startsWith('blank')) {
        // Novo card
        form.reset();
        document.getElementById('editCardId').value = `blank-${posicao}`;
        document.getElementById('editCardCategoria').value = categoria;
        document.getElementById('currentCardImage').src = '';
    } else {
        // Card existente
        fetch(`/admin/cards/${idCard}`)
            .then(resposta => {
                if (!resposta.ok) throw new Error('Card não encontrado');
                return resposta.json();
            })
            .then(card => {
                document.getElementById('editCardId').value = card.id;
                document.getElementById('editCardTitle').value = card.titulo || '';
                document.getElementById('editCardSubtitle').value = card.subtitulo || '';
                document.getElementById('editCardCategoria').value = card.categoria || '';
                document.getElementById('editCardContent').value = 
                    Array.isArray(card.conteudo) ? card.conteudo.join('\n') : card.conteudo || '';
                document.getElementById('currentCardImage').src = card.imagem || '';
            })
            .catch(erro => {
                console.error('Erro ao buscar card:', erro);
                alert('Erro ao carregar card');
            });
    }
    
    // Configura categoria
    const categoriaSelect = document.getElementById('editCardCategoria');
    categoriaSelect.disabled = !idCard.startsWith('blank');
    if (idCard.startsWith('blank')) {
        categoriaSelect.value = categoria;
    }
    
    // Mostra o modal
    const modal = new bootstrap.Modal(document.getElementById('editCardModal'));
    modal.show();
}

// Função para abrir modal de novo card
function abrirModalNovoCard(categoria, posicao = 1) {
    document.getElementById('editCardId').value = `blank-${posicao}`;
    document.getElementById('editCardTitle').value = '';
    document.getElementById('editCardSubtitle').value = '';
    document.getElementById('editCardContent').value = '';
    document.getElementById('currentCardImage').src = '';
    document.getElementById('editCardCategoria').value = categoria;
    document.getElementById('editCardPosicao').value = posicao;
    document.getElementById('editCardCategoria').disabled = false;
    
    const modal = new bootstrap.Modal(document.getElementById('editCardModal'));
    modal.show();
}