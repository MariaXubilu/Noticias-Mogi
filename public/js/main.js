// Adicionei verificação se o elemento existe
const contactForm = document.getElementById('contactFormModal');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const cpfInput = document.getElementById('cpfModal');
        const cpf = cpfInput.value.replace(/[^\d]/g, '');
        
        if (validarCPF(cpf)) {
            cpfInput.classList.remove('is-invalid');
            this.reset();
            
            // Fechar modal (verificando se Bootstrap está disponível)
            if (typeof bootstrap !== 'undefined') {
                const modalElement = document.getElementById('contatoModal');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
            }
        } else {
            cpfInput.classList.add('is-invalid');
        }
    });
}

// Máscara de CPF (com verificação de elemento)
const cpfInput = document.getElementById('cpfModal');
if (cpfInput) {
    cpfInput.addEventListener('input', function(e) {
        const target = e.target;
        let value = target.value.replace(/\D/g, '');
        
        if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
        if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        if (value.length > 14) value = value.substring(0, 14);
        
        target.value = value;
    });
}

// Função de validação
function validarCPF(cpfDigits) {
    if (cpfDigits.length !== 11) return false;

    const allEqual = cpfDigits.split('').every(d => d === cpfDigits[0]);
    if (allEqual) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpfDigits[i]) * (10 - i);
    }
    let dig1 = (soma * 10) % 11;
    if (dig1 === 10) dig1 = 0;
    if (dig1 !== parseInt(cpfDigits[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpfDigits[i]) * (11 - i);
    }
    let dig2 = (soma * 10) % 11;
    if (dig2 === 10) dig2 = 0;

    return dig2 === parseInt(cpfDigits[10]);
}

// Modal de notícia do carrossel
document.addEventListener('DOMContentLoaded', function() {
    // Configura o modal para exibir a notícia completa
    const noticiaModal = document.getElementById('noticiaModal');
    if (noticiaModal) {
        noticiaModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            
            if (button) {
                const titulo = button.getAttribute('data-titulo');
                const subtitulo = button.getAttribute('data-subtitulo');
                const imagem = button.getAttribute('data-imagem');
                const conteudo = button.getAttribute('data-conteudo');
                const autor = button.getAttribute('data-autor');

                // Atualiza o conteúdo do modal
                const titleElement = document.getElementById('noticiaModalTitle');
                const subtitleElement = document.getElementById('noticiaModalSubtitle');
                const imageElement = document.getElementById('noticiaModalImage');
                const contentElement = document.getElementById('noticiaModalContent');
                const authorElement = document.getElementById('noticiaModalAuthor');

                if (titleElement && titulo) titleElement.textContent = titulo;
                if (subtitleElement && subtitulo) subtitleElement.textContent = subtitulo;
                if (imageElement && imagem) imageElement.src = imagem;
                if (contentElement && conteudo) contentElement.textContent = conteudo;
                if (authorElement && autor) authorElement.textContent = 'Por: ' + autor;
            }
        });
    }

    // Edição de notícias (apenas para admin)
document.addEventListener('DOMContentLoaded', function() {
  // Configura o modal de edição
  const editarModal = document.getElementById('editarNoticiaModal');
  if (editarModal) {
    editarModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const noticiaId = button.getAttribute('data-id');
      
      // Busca os dados da notícia via AJAX
      fetch(`/api/noticias/${noticiaId}`)
        .then(response => response.json())
        .then(noticia => {
          document.querySelector('#editarNoticiaForm input[name="titulo"]').value = noticia.titulo;
          document.querySelector('#editarNoticiaForm select[name="categoria"]').value = noticia.categoria;
          document.querySelector('#editarNoticiaForm input[name="noticiaId"]').value = noticia.id;
          document.querySelector('#editarNoticiaForm').action = `/noticia/editar/${noticia.id}`;
        });
    });
  }
  
  // Configura os links da navbar para filtragem
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

    // Adiciona estilos dinâmicos para as imagens do carrossel
    const carouselImages = document.querySelectorAll('.carousel-img');
    carouselImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.02)';
            img.style.transition = 'transform 0.3s ease';
        });
        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
        });
    });
});

// Edição de cards (apenas para admin)
if (document.body.classList.contains('admin-logged')) {
    document.querySelectorAll('.editable-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.style.position = 'relative';
        
        const editIcon = document.createElement('span');

        editIcon.style.position = 'absolute';
        editIcon.style.top = '10px';
        editIcon.style.right = '10px';
        editIcon.style.background = 'rgba(0,0,0,0.7)';
        editIcon.style.color = 'white';
        editIcon.style.padding = '2px 8px';
        editIcon.style.borderRadius = '4px';
        editIcon.style.fontSize = '12px';
        card.appendChild(editIcon);

        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target === editIcon) return;
            
            const cardId = this.dataset.cardId;
            const cardTitle = this.querySelector('.card-title').textContent;
            
            // Coleta todos os parágrafos de conteúdo
            const paragraphs = Array.from(this.querySelectorAll('.card-text'));
            const cardContent = paragraphs.map(p => p.textContent).join('\n');
            
            const cardImage = this.querySelector('img')?.src || '';

            // Preenche o modal de edição
            document.getElementById('editCardId').value = cardId;
            document.getElementById('editCardTitle').value = cardTitle;
            document.getElementById('editCardContent').value = cardContent;
            document.getElementById('currentCardImage').src = cardImage;
            
            // Atualiza o action do form com o ID correto
            document.getElementById('editCardForm').action = `/admin/cards/update/${cardId}`;
            
            // Abre o modal
            const modal = new bootstrap.Modal(document.getElementById('editCardModal'));
            modal.show();
        });
    });

    // Configura o modal de edição de cards
    const editCardModal = document.getElementById('editCardModal');
    if (editCardModal) {
        editCardModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            if (button) {
                const cardId = button.getAttribute('data-card-id');
                const cardTitle = button.getAttribute('data-card-title');
                const cardContent = button.getAttribute('data-card-content');
                const cardImage = button.getAttribute('data-card-image');

                document.getElementById('editCardId').value = cardId;
                document.getElementById('editCardTitle').value = cardTitle;
                document.getElementById('editCardContent').value = cardContent;
                document.getElementById('currentCardImage').src = cardImage;
                document.getElementById('editCardForm').action = `/admin/cards/update/${cardId}`;
            }
        });
    }
}