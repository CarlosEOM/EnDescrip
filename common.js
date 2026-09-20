const LS_USERS = 'endescrip_users';
const LS_SESSION = 'endescrip_session';

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

function getSession() { return localStorage.getItem(LS_SESSION); }
function setSession(username) { localStorage.setItem(LS_SESSION, username); }
function clearSession() { localStorage.removeItem(LS_SESSION); }

function currentUser() {
    let username = getSession();
    if (!username) return null;
    return loadUsers().find(u => u.username === username) || null;
}

function requireAuth() {
    let user = currentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function requireAdmin() {
    let user = requireAuth();
    if (!user) return null;
    if (!user.isAdmin) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

function showToast(msg) {
    let toast = document.querySelector('#toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast hidden';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ---------- Algoritmos de árvore / criptografia ----------
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
    return posOrdem(raiz).map(no => ({
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

// ---------- Desenho da árvore ----------
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