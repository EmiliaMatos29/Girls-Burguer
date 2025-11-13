// =============================================
// FUNÇÕES AUXILIARES (COMUNS)
// =============================================

/**
 * Pega o carrinho atual do localStorage.
 * @returns {Array} Um array de objetos, cada um representando um item no carrinho.
 */
function getCart() {
    // CORREÇÃO: Usando a mesma chave de armazenamento em todas as funções.
    const STORAGE_KEY = 'cart'; 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

/**
 * Salva o estado atual do carrinho no localStorage.
 * @param {Array} cart - O array de itens do carrinho a ser salvo.
 */
function saveCart(cart) {
    const STORAGE_KEY = 'cart';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

/**
 * Converte uma string de preço (ex: "R$ 34,90") para um número (ex: 34.90).
 * @param {string} priceString - A string do preço.
 * @returns {number} O preço como um número.
 */
function parsePrice(priceString) {
    return parseFloat(priceString.replace('R$ ', '').replace(',', '.'));
}

// =============================================
// LÓGICA DA PÁGINA DE CARDÁPIO (MANTIDA)
// =============================================
function initMenuPage() {
    const comboItems = document.querySelectorAll('.combo-item-cardapio');

    comboItems.forEach(item => {
        const qtySpan = item.querySelector('.quantidade-atual-cardapio');
        const btnAdd = item.querySelector('.botao-adicionar-carrinho');
        const btnIncrease = item.querySelector('.botao-qtd-maior-cardapio');
        const btnDecrease = item.querySelector('.botao-qtd-menor-cardapio');

        // Aumentar quantidade
        btnIncrease.addEventListener('click', () => {
            let currentQty = parseInt(qtySpan.textContent);
            qtySpan.textContent = currentQty + 1;
        });

        // Diminuir quantidade
        btnDecrease.addEventListener('click', () => {
            let currentQty = parseInt(qtySpan.textContent);
            if (currentQty > 1) { 
                qtySpan.textContent = currentQty - 1;
            }
        });

        // Adicionar ao carrinho
        btnAdd.addEventListener('click', () => {
            // 1. Coletar dados do item
            const name = item.querySelector('.combo-titulo-cardapio').textContent;
            const priceString = item.querySelector('.combo-preco-cardapio').textContent;
            const price = parsePrice(priceString);
            const imageSrc = item.querySelector('.combo-imagem-cardapio').src;
            const quantity = parseInt(qtySpan.textContent);

            // 2. Carregar carrinho atual
            let cart = getCart();

            // 3. Verificar se o item já existe
            let existingItem = cart.find(cartItem => cartItem.name === name);

            if (existingItem) {
                // Se existe, apenas soma a quantidade
                existingItem.quantity += quantity;
            } else {
                // Se não existe, adiciona o novo item
                cart.push({ name, price, imageSrc, quantity });
            }

            // 4. Salvar o carrinho atualizado
            saveCart(cart);

            // 5. Resetar a quantidade no cardápio e dar feedback
            qtySpan.textContent = '1';
            alert(`${quantity}x ${name} adicionado(s) ao carrinho!`);
        });
    });
}

// =============================================
// LÓGICA DA PÁGINA DO CARRINHO (AJUSTADA)
// =============================================
function initCartPage() {
    // Chama a renderização assim que a página do carrinho carregar
    renderCart();
}

/**
 * Renderiza os itens do carrinho e calcula o total.
 * A lógica do WhatsApp foi movida para enviarViaWhatsApp().
 */
function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const totalSpan = document.getElementById('cart-total');
    const whatsappButton = document.querySelector('.botao-finalizar-whatsapp'); // Mantido para estilização
    const siteButton = document.querySelector('.botao-finalizar-site'); // Se existir

    // Limpa o container antes de renderizar
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalSpan.textContent = 'R$ 0,00';
        // Desabilita botões se o carrinho estiver vazio
        if (siteButton) siteButton.style.opacity = '0.5';
        if (whatsappButton) whatsappButton.style.opacity = '0.5';
        return;
    }

    let total = 0;

    // Loop por cada item do carrinho para criar o HTML
    cart.forEach(item => {
        total += item.price * item.quantity;

        const itemHTML = `
            <div class="item-carrinho">
                <img src="${item.imageSrc}" alt="${item.name}" class="imagem-item-carrinho">
                <div class="info-item-carrinho">
                    <h3>${item.name.toUpperCase()}</h3>
                    <p class="preco">Preço: R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="qtd-item-carrinho">
                    <button class="cart-qty-btn" data-name="${item.name}" data-change="1">+</button>
                    <span>${item.quantity}</span>
                    <button class="cart-qty-btn" data-name="${item.name}" data-change="-1">-</button>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });

    // Atualiza o total na tela
    totalSpan.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // A lógica de montagem do link do WhatsApp foi REMOVIDA daqui.

    // Re-adiciona os event listeners para os botões +/- do carrinho
    addCartButtonListeners();
}

/**
 * Adiciona listeners aos botões de + e - dentro do carrinho.
 */
function addCartButtonListeners() {
    const qtyButtons = document.querySelectorAll('.cart-qty-btn');
    
    qtyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const name = button.dataset.name;
            const change = parseInt(button.dataset.change);
            updateCartQuantity(name, change);
        });
    });
}

/**
 * Atualiza a quantidade de um item específico no carrinho.
 * @param {string} name - O nome do item a ser atualizado.
 * @param {number} change - A mudança na quantidade (ex: 1 ou -1).
 */
function updateCartQuantity(name, change) {
    let cart = getCart();
    let item = cart.find(i => i.name === name);

    if (item) {
        item.quantity += change;
        
        // Se a quantidade chegar a 0 ou menos, remove o item do carrinho
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.name !== name);
        }
    }

    // Salva o carrinho modificado
    saveCart(cart);
    
    // Re-renderiza o carrinho inteiro para refletir as mudanças
    renderCart();
}

// =========================
// 📲 ENVIAR PEDIDO VIA WHATSAPP (A FUNÇÃO CORRIGIDA)
// =========================
function enviarViaWhatsApp() {
    const carrinho = getCart(); 
    
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
  
    // 1. Número do WhatsApp da Girls Burguer (com 55 + DDD)
    const numero = "5531985324880";
  
    // 2. Monta a mensagem usando "\n" (quebra de linha do JS)
    let mensagem = "Olá! Obrigado por pedir com a Girls Burguer!\n\n";
    mensagem += "Antes de confirmarmos seu pedido, por favor, nos envie as seguintes informações:\n";
    mensagem += "Nome:\n";
    mensagem += "Turma (opcional):\n\n";
    mensagem += "--- SEU PEDIDO ---\n";
    
    let total = 0;
  
    carrinho.forEach(item => {
      total += item.price * item.quantity;
      // Adiciona \n no final de cada item
      mensagem += `${item.name} — ${item.quantity}x = R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });
  
    mensagem += `\n*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n`; // Formata R$ 00,00
    mensagem += "*Forma de pagamento: ( ) Pix ( ) Cartão*\n\n";
    mensagem += "Assim que recebermos esses dados, confirmaremos seu pedido (Caso pix enviar o comprovante)!!\n\n";
    mensagem += "Agradecemos por escolher a Girls Burguer!!";
  
    // 3. Codifica a mensagem INTEIRA para a URL
    const mensagemCodificada = encodeURIComponent(mensagem);
  
    // 4. Abre o link do WhatsApp
    window.open(`https://wa.me/${numero}?text=${mensagemCodificada}`, "_blank");
}

// =============================================
// 🚀 INICIALIZAÇÃO
// =============================================

// Espera o DOM carregar completamente antes de executar qualquer script
document.addEventListener('DOMContentLoaded', () => {

    // Roteador: Verifica em qual página estamos e inicia a função correta
    if (document.querySelector('.secao-cardapio-principal')) {
        initMenuPage();
    }
    
    if (document.querySelector('.secao-carrinho')) {
        initCartPage();
    }
});