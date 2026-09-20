const LS_USERS = 'endescrip_users';
const LS_SESSION = 'endescrip_session';

// ---------- Persistência (usuários) ----------
function loadUsers() {
    try {
        return JSON.parse(localStorage.getItem(LS_USERS)) || [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function seedAdmin() {
    let users = loadUsers();
    if (!users.find(u => u.username === 'admin')) {
        users.push({
            id: 'u_admin',
            nome: 'Administrador',
            email: 'admin@empresa.com',
            username: 'admin',
            senha: 'admin123',
            status: 'aprovado',
            isAdmin: true
        });
        saveUsers(users);
    }
}

function getSession() {
    return localStorage.getItem(LS_SESSION);
}
function setSession(username) {
    localStorage.setItem(LS_SESSION, username);
}
function clearSession() {
    localStorage.removeItem(LS_SESSION);
}

function currentUser() {
    let username = getSession();
    if (!username) return null;
    return loadUsers().find(u => u.username === username) || null;
}

// ---------- Utilidades de UI ----------
function showToast(msg) {
    let toast = document.querySelector('#toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.querySelector('#app').classList.add('hidden');
    if (id === 'app') {
        document.querySelector('#app').classList.remove('hidden');
    } else {
        document.querySelector('#' + id).classList.remove('hidden');
    }
}

function showLogin() {
    document.querySelector('#loginMsg').classList.add('hidden');
    showScreen('loginScreen');
}

function showRegister() {
    document.querySelector('#regMsg').classList.add('hidden');
    showScreen('registerScreen');
}

// ---------- Login / Cadastro ----------
function login() {
    let username = document.querySelector('#loginUser').value.trim();
    let senha = document.querySelector('#loginPass').value;
    let msg = document.querySelector('#loginMsg');

    if (!username || !senha) {
        msg.textContent = 'Preencha usuário e senha.';
        msg.classList.remove('hidden');
        return;
    }

    let user = loadUsers().find(u => u.username === username && u.senha === senha);

    if (!user) {
        msg.textContent = 'Usuário ou senha inválidos.';
        msg.classList.remove('hidden');
        return;
    }

    if (user.status === 'pendente') {
        msg.textContent = 'Seu cadastro ainda está aguardando aprovação do administrador.';
        msg.classList.remove('hidden');
        return;
    }

    if (user.status === 'recusado') {
        msg.textContent = 'Seu cadastro foi recusado pelo administrador.';
        msg.classList.remove('hidden');
        return;
    }

    setSession(user.username);
    document.querySelector('#loginUser').value = '';
    document.querySelector('#loginPass').value = '';
    openApp();
}

function register() {
    let nome = document.querySelector('#regName').value.trim();
    let email = document.querySelector('#regEmail').value.trim();
    let username = document.querySelector('#regUser').value.trim();
    let senha = document.querySelector('#regPass').value;
    let msg = document.querySelector('#regMsg');

    if (!nome || !email || !username || !senha) {
        msg.textContent = 'Preencha todos os campos.';
        msg.classList.remove('hidden');
        return;
    }

    let users = loadUsers();
    if (users.find(u => u.username === username)) {
        msg.textContent = 'Esse nome de usuário já existe.';
        msg.classList.remove('hidden');
        return;
    }

    users.push({
        id: 'u_' + Date.now(),
        nome, email, username, senha,
        status: 'pendente',
        isAdmin: false
    });
    saveUsers(users);

    document.querySelector('#regName').value = '';
    document.querySelector('#regEmail').value = '';
    document.querySelector('#regUser').value = '';
    document.querySelector('#regPass').value = '';

    showLogin();
    showToast('Cadastro enviado! Aguarde a aprovação do administrador.');
}

function logout() {
    clearSession();
    showLogin();
}

function openApp() {
    let user = currentUser();
    if (!user) { showLogin(); return; }

    showScreen('app');
    document.querySelector('#sideUser').textContent = user.nome + ' (@' + user.username + ')';
    document.querySelector('#navAdmin').classList.toggle('hidden', !user.isAdmin);
    page('home');
}

// ---------- Navegação interna ----------
function page(nome) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    if (nome === 'home') {
        document.querySelector('#homePage').classList.remove('hidden');
        document.querySelector('#navHome').classList.add('active');
        renderHome();
    }
    if (nome === 'encrypt') {
        document.querySelector('#encryptPage').classList.remove('hidden');
        document.querySelector('#navEncrypt').classList.add('active');
        renderEncryptPage();
    }
    if (nome === 'decrypt') {
        document.querySelector('#decryptPage').classList.remove('hidden');
        document.querySelector('#navDecrypt').classList.add('active');
        renderDecryptPage();
    }
    if (nome === 'admin') {
        document.querySelector('#adminPage').classList.remove('hidden');
        document.querySelector('#navAdmin').classList.add('active');
        renderAdminPage();
    }
}

function renderHome() {
    let user = currentUser();
    document.querySelector('#homePage').innerHTML = `
        <h1>Bem-vindo(a), ${user.nome}!</h1>
        <p class="muted">Use o menu ao lado para criptografar uma mensagem em árvore binária
        ou para descriptografar um arquivo JSON recebido de um colega.</p>
    `;
}

// ================================================================
// ÁRVORE BINÁRIA DE BUSCA + CRIPTOGRAFIA
// ================================================================

let arvore = null;
let arvoreCodificada = null;

function criarNo(valor, palavra, posicao) {
    return { valor, palavra, posicao, esquerda: null, direita: null };
}

function calcularValor(palavra) {
    let soma = 0;
    for (let i = 0; i < palavra.length; i++) soma += palavra.charCodeAt(i);
    return soma;
}

function inserir(raiz, novoNo) {
    if (novoNo.valor < raiz.valor) {
        if (raiz.esquerda === null) raiz.esquerda = novoNo;
        else inserir(raiz.esquerda, novoNo);
    } else {
        if (raiz.direita === null) raiz.direita = novoNo;
        else inserir(raiz.direita, novoNo);
    }
}

function criarArvore(texto) {
    let palavras = texto.trim().split(/\s+/);
    let raiz = null;
    for (let i = 0; i < palavras.length; i++) {
        let novoNo = criarNo(calcularValor(palavras[i]), palavras[i], i);
        if (raiz === null) raiz = novoNo;
        else inserir(raiz, novoNo);
    }
    return raiz;
}

function posOrdem(raiz, resultado = []) {
    if (raiz === null) return resultado;
    posOrdem(raiz.esquerda, resultado);
    posOrdem(raiz.direita, resultado);
    resultado.push(raiz);
    return resultado;
}

function codificarPalavra(palavra, chave) {
    let resultado = [];
    for (let c of palavra) resultado.push(c.codePointAt(0) + chave);
    return resultado;
}

function decodificarPalavra(codigos, chave) {
    let palavra = '';
    for (let codigo of codigos) palavra += String.fromCodePoint(codigo - chave);
    return palavra;
}

function codificarArvore(raiz, chave) {
    let ordem = posOrdem(raiz);
    return ordem.map(no => ({
        valor: no.valor,
        palavra: codificarPalavra(no.palavra, chave),
        posicao: no.posicao
    }));
}

function descriptografar(dados, chave) {
    let palavras = dados.map(item => ({
        palavra: decodificarPalavra(item.palavra, chave),
        posicao: item.posicao
    }));
    palavras.sort((a, b) => a.posicao - b.posicao);
    return palavras.map(p => p.palavra).join(' ');
}

// ---------- Desenho da árvore no canvas ----------
function desenharArvore(canvas, raiz) {
    let ctx = canvas.getContext('2d');

    function contarLargura(no) {
        if (no === null) return 0;
        return contarLargura(no.esquerda) + 1 + contarLargura(no.direita);
    }
    let largura = Math.max(contarLargura(raiz), 1);
    let passoX = 90;
    canvas.width = Math.max(600, largura * passoX + 60);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!raiz) return;

    let contador = { i: 0 };
    function posicionar(no, profundidade) {
        if (no === null) return;
        posicionar(no.esquerda, profundidade + 1);
        no._x = 40 + contador.i * passoX;
        no._y = 40 + profundidade * 70;
        contador.i++;
        posicionar(no.direita, profundidade + 1);
    }
    posicionar(raiz, 0);

    function desenharLinhas(no) {
        if (no === null) return;
        ctx.strokeStyle = '#45b36f';
        ctx.lineWidth = 2;
        if (no.esquerda) {
            ctx.beginPath();
            ctx.moveTo(no._x, no._y);
            ctx.lineTo(no.esquerda._x, no.esquerda._y);
            ctx.stroke();
            desenharLinhas(no.esquerda);
        }
        if (no.direita) {
            ctx.beginPath();
            ctx.moveTo(no._x, no._y);
            ctx.lineTo(no.direita._x, no.direita._y);
            ctx.stroke();
            desenharLinhas(no.direita);
        }
    }
    desenharLinhas(raiz);

    function desenharNos(no) {
        if (no === null) return;
        desenharNos(no.esquerda);
        ctx.beginPath();
        ctx.arc(no._x, no._y, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#37965c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        let rotulo = no.palavra.length > 8 ? no.palavra.slice(0, 7) + '…' : no.palavra;
        ctx.fillText(rotulo, no._x, no._y - 2);
        ctx.font = '10px Segoe UI';
        ctx.fillText('v:' + no.valor, no._x, no._y + 11);
        desenharNos(no.direita);
    }
    desenharNos(raiz);
}

// ---------- Página: Criptografar ----------
function renderEncryptPage() {
    document.querySelector('#encryptPage').innerHTML = `
        <h2>Criptografar mensagem</h2>
        <div class="panel">
            <label>Mensagem</label>
            <input type="text" id="mensagem" placeholder="Digite uma mensagem...">
            <label>Chave</label>
            <input type="number" class="chave" id="chaveCrypt" placeholder="Selecione uma chave">
            <div class="btn-row">
                <button id="criarArvore">Criar árvore</button>
                <button id="botaoEncriptar" disabled>Criptografar palavras</button>
                <button id="baixarJSON" disabled>Baixar JSON</button>
            </div>
            <div class="canvas-wrap"><canvas id="canvasArvore" width="600" height="300"></canvas></div>
            <div id="resultadoCrypt" class="result">A árvore da mensagem aparecerá aqui.</div>
        </div>
    `;

    let mensagem = document.querySelector('#mensagem');
    let chaveCrypt = document.querySelector('#chaveCrypt');
    let canvas = document.querySelector('#canvasArvore');
    let resultadoCrypt = document.querySelector('#resultadoCrypt');
    let botaoCriarArvore = document.querySelector('#criarArvore');
    let botaoEncriptar = document.querySelector('#botaoEncriptar');
    let botaoBaixarJSON = document.querySelector('#baixarJSON');

    arvore = null;
    arvoreCodificada = null;

    botaoCriarArvore.addEventListener('click', function () {
        let texto = mensagem.value;
        if (texto.trim() === '') {
            resultadoCrypt.textContent = 'Digite uma mensagem.';
            return;
        }

        arvore = criarArvore(texto);
        arvoreCodificada = null;
        botaoBaixarJSON.disabled = true;
        botaoEncriptar.disabled = false;

        desenharArvore(canvas, arvore);
        resultadoCrypt.textContent =
            'Árvore criada! Percurso pós-ordem (ordem de envio): ' +
            posOrdem(arvore).map(n => n.palavra).join(', ');
    });

    botaoEncriptar.addEventListener('click', function () {
        if (arvore === null) {
            resultadoCrypt.textContent = 'Primeiro crie a árvore.';
            return;
        }
        if (chaveCrypt.value === '') {
            resultadoCrypt.textContent = 'Digite uma chave.';
            return;
        }

        let chave = Number(chaveCrypt.value);
        arvoreCodificada = codificarArvore(arvore, chave);
        botaoBaixarJSON.disabled = false;
        resultadoCrypt.textContent =
            'Palavras criptografadas com a chave ' + chave + '. Pronto para exportar o JSON.';
    });

    botaoBaixarJSON.addEventListener('click', function () {
        if (arvoreCodificada === null) {
            resultadoCrypt.textContent = 'Primeiro criptografe a árvore.';
            return;
        }
        let json = JSON.stringify(arvoreCodificada, null, 2);
        let arquivo = new Blob([json], { type: 'application/json' });
        let link = document.createElement('a');
        link.href = URL.createObjectURL(arquivo);
        link.download = 'mensagem.json';
        link.click();
        URL.revokeObjectURL(link.href);
    });
}

// ---------- Página: Descriptografar ----------
function renderDecryptPage() {
    document.querySelector('#decryptPage').innerHTML = `
        <h2>Descriptografar mensagem</h2>
        <div class="panel">
            <label>Arquivo JSON</label>
            <input type="file" id="arquivoMensagem" accept=".json">
            <label>Chave</label>
            <input type="number" class="chave" id="chaveDecrypt" placeholder="Selecione uma chave">
            <div class="btn-row">
                <button id="descriptografar">Descriptografar</button>
            </div>
            <div id="resultadoDecrypt" class="result">O resultado aparecerá aqui.</div>
        </div>
    `;

    let jsonAtual = null;
    let arquivoMensagem = document.querySelector('#arquivoMensagem');
    let chaveDecrypt = document.querySelector('#chaveDecrypt');
    let resultadoDecrypt = document.querySelector('#resultadoDecrypt');

    arquivoMensagem.addEventListener('change', function (evento) {
        let arquivo = evento.target.files[0];
        if (!arquivo) return;
        let leitor = new FileReader();
        leitor.onload = function (e) {
            try {
                jsonAtual = JSON.parse(e.target.result);
                resultadoDecrypt.textContent = 'Arquivo JSON carregado. Digite a chave e clique em Descriptografar.';
            } catch (erro) {
                jsonAtual = null;
                resultadoDecrypt.textContent = 'Erro: arquivo JSON inválido.';
            }
        };
        leitor.readAsText(arquivo);
    });

    document.querySelector('#descriptografar').addEventListener('click', function () {
        if (jsonAtual === null) {
            resultadoDecrypt.textContent = 'Selecione um arquivo JSON.';
            return;
        }
        if (chaveDecrypt.value === '') {
            resultadoDecrypt.textContent = 'Digite a chave.';
            return;
        }
        let chave = Number(chaveDecrypt.value);
        try {
            resultadoDecrypt.textContent = descriptografar(jsonAtual, chave);
        } catch (erro) {
            resultadoDecrypt.textContent = 'Erro ao descriptografar. Verifique a chave e o arquivo.';
        }
    });
}

// ================================================================
// ADMINISTRAÇÃO DE CADASTROS
// ================================================================

function renderAdminPage() {
    let user = currentUser();
    if (!user || !user.isAdmin) { page('home'); return; }

    let users = loadUsers();
    let pendentes = users.filter(u => u.status === 'pendente');
    let aprovados = users.filter(u => u.status === 'aprovado');
    let recusados = users.filter(u => u.status === 'recusado');

    document.querySelector('#adminPage').innerHTML = `
        <h2>Administração de cadastros</h2>
        <h3>Pendentes (${pendentes.length})</h3>
        <div class="user-list" id="listaPendentes"></div>
        <h3>Aprovados (${aprovados.length})</h3>
        <div class="user-list" id="listaAprovados"></div>
        <h3>Recusados (${recusados.length})</h3>
        <div class="user-list" id="listaRecusados"></div>
    `;

    let listaPendentes = document.querySelector('#listaPendentes');
    let listaAprovados = document.querySelector('#listaAprovados');
    let listaRecusados = document.querySelector('#listaRecusados');

    if (pendentes.length === 0) listaPendentes.innerHTML = '<p class="muted">Nenhum cadastro pendente.</p>';
    pendentes.forEach(u => {
        let div = document.createElement('div');
        div.className = 'user-card';
        div.innerHTML = `
            <div><b>${u.nome}</b> — @${u.username}<br><span class="muted">${u.email}</span></div>
            <div class="user-actions">
                <button class="btn ok">Aceitar</button>
                <button class="btn danger">Recusar</button>
            </div>
        `;
        div.querySelector('.ok').addEventListener('click', () => mudarStatus(u.id, 'aprovado'));
        div.querySelector('.danger').addEventListener('click', () => mudarStatus(u.id, 'recusado'));
        listaPendentes.appendChild(div);
    });

    if (aprovados.length === 0) listaAprovados.innerHTML = '<p class="muted">Nenhum usuário aprovado ainda.</p>';
    aprovados.forEach(u => {
        let div = document.createElement('div');
        div.className = 'user-card';
        div.innerHTML = `<div><b>${u.nome}</b> — @${u.username} ${u.isAdmin ? '<span class="tag">admin</span>' : ''}<br><span class="muted">${u.email}</span></div>`;
        listaAprovados.appendChild(div);
    });

    if (recusados.length === 0) listaRecusados.innerHTML = '<p class="muted">Nenhum cadastro recusado.</p>';
    recusados.forEach(u => {
        let div = document.createElement('div');
        div.className = 'user-card';
        div.innerHTML = `
            <div><b>${u.nome}</b> — @${u.username}<br><span class="muted">${u.email}</span></div>
            <div class="user-actions"><button class="btn ok">Reconsiderar</button></div>
        `;
        div.querySelector('.ok').addEventListener('click', () => mudarStatus(u.id, 'aprovado'));
        listaRecusados.appendChild(div);
    });
}

function mudarStatus(id, novoStatus) {
    let users = loadUsers();
    let u = users.find(x => x.id === id);
    if (!u) return;
    u.status = novoStatus;
    saveUsers(users);
    showToast('Cadastro atualizado.');
    renderAdminPage();
}

// ================================================================
// INICIALIZAÇÃO
// ================================================================
(function init() {
    seedAdmin();
    if (getSession() && currentUser()) {
        openApp();
    } else {
        showLogin();
    }
})();
