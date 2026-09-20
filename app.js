(function initApp() {
    let user = requireAuth();
    if (!user) return;

    document.querySelector('#sideUser').textContent =
        user.nome + ' (@' + user.username + ')';
    document.querySelector('#navAdmin').classList.toggle('hidden', !user.isAdmin);

    // marca link ativo conforme a página atual
    let path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(a => {
        if (a.getAttribute('href') === path) a.classList.add('active');
    });

    // conteúdo da home (só se existir na página)
    let homePage = document.querySelector('#homePage');
    if (homePage) {
        homePage.innerHTML = `
            <h1>Bem-vindo(a), ${user.nome}!</h1>
            <p class="muted">Use o menu ao lado para criptografar uma mensagem em árvore binária
            ou para descriptografar um arquivo JSON recebido de um colega.</p>
        `;
    }

    // botão sair
    document.querySelectorAll('.logout').forEach(b => {
        b.addEventListener('click', logout);
    });
})();