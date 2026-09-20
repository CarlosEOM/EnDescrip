// ================================================================
// EnDescrip — protótipo: mensagem -> árvore binária (pós-ordem) ->
// criptografia -> JSON, e o caminho inverso (JSON -> descriptografia).
// Sem camada de persistência: nada é salvo entre uma visita e outra.
// ================================================================

let mensagem = document.querySelector('#mensagem');
let chaveCrypt = document.querySelector('#chaveCrypt');
let chaveDecrypt = document.querySelector('#chaveDecrypt');
let arquivoMensagem = document.querySelector('#arquivoMensagem');

let botaoCriarArvore = document.querySelector('#criarArvore');
let botaoEncriptar = document.querySelector('#botaoEncriptar');
let botaoBaixarJSON = document.querySelector('#baixarJSON');
let botaoDescriptografar = document.querySelector('#descriptografar');

let resultadoCrypt = document.querySelector('#resultadoCrypt');
let resultadoDecrypt = document.querySelector('#resultadoDecrypt');
let canvas = document.querySelector('#canvasArvore');

let arvore = null;             // árvore atual (não criptografada)
let arvoreCodificada = null;   // JSON pronto para exportar
let jsonAtual = null;          // JSON importado para descriptografar

// ---------- Criação dos nós ----------
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

// ---------- Percurso pós-ordem ----------
function posOrdem(raiz, resultado = []) {
    if (raiz === null) return resultado;
    posOrdem(raiz.esquerda, resultado);
    posOrdem(raiz.direita, resultado);
    resultado.push(raiz);
    return resultado;
}

// ---------- Codificação / decodificação ----------
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
function desenharArvore(raiz) {
    let ctx = canvas.getContext('2d');

    function contarLargura(no) {
        if (no === null) return 0;
        return contarLargura(no.esquerda) + 1 + contarLargura(no.direita);
    }
    let largura = Math.max(contarLargura(raiz), 1);
    let passoX = 80;
    canvas.width = Math.max(440, largura * passoX + 60);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!raiz) return;

    let contador = { i: 0 };
    function posicionar(no, profundidade) {
        if (no === null) return;
        posicionar(no.esquerda, profundidade + 1);
        no._x = 35 + contador.i * passoX;
        no._y = 35 + profundidade * 65;
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
        ctx.arc(no._x, no._y, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#37965c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '11px Segoe UI';
        ctx.textAlign = 'center';
        let rotulo = no.palavra.length > 7 ? no.palavra.slice(0, 6) + '…' : no.palavra;
        ctx.fillText(rotulo, no._x, no._y - 2);
        ctx.font = '9px Segoe UI';
        ctx.fillText('v:' + no.valor, no._x, no._y + 10);
        desenharNos(no.direita);
    }
    desenharNos(raiz);
}

// ---------- Botão "Criar árvore" ----------
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

    desenharArvore(arvore);
    resultadoCrypt.textContent =
        'Árvore criada! Percurso pós-ordem (ordem de envio): ' +
        posOrdem(arvore).map(n => n.palavra).join(', ');
});

// ---------- Botão "Criptografar palavras" ----------
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

// ---------- Botão "Baixar JSON" ----------
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

// ---------- Ler arquivo JSON ----------
arquivoMensagem.addEventListener('change', function (evento) {
    let arquivo = evento.target.files[0];
    if (!arquivo) return;

    let leitor = new FileReader();
    leitor.onload = function (e) {
        try {
            jsonAtual = JSON.parse(e.target.result);
            resultadoDecrypt.textContent = 'Arquivo JSON carregado.';
        } catch (erro) {
            jsonAtual = null;
            resultadoDecrypt.textContent = 'Erro: arquivo JSON inválido.';
        }
    };
    leitor.readAsText(arquivo);
});

// ---------- Botão "Descriptografar" ----------
botaoDescriptografar.addEventListener('click', function () {
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
