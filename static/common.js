document.addEventListener('DOMContentLoaded', function () {
    let toast = document.querySelector('#toast');
    if (toast && toast.textContent.trim() !== '') {
        setTimeout(() => toast.classList.add('hidden'), 2500);
    }
});

function desenharArvore(canvas, raiz) {
    let ctx = canvas.getContext('2d');

    function contarLargura(no) {
        if (no === null) return 0;
        return contarLargura(no.esquerda) + 1 + contarLargura(no.direita);
    }
    function contarProfundidade(no) {
        if (no === null) return 0;
        return 1 + Math.max(contarProfundidade(no.esquerda), contarProfundidade(no.direita));
    }
    let largura = Math.max(contarLargura(raiz), 1);
    let niveis = Math.max(contarProfundidade(raiz), 1);

    // Espaçamento horizontal: usa o espaço disponível no painel, sem deixar os nós
    // (raio 28) se sobreporem. Se mesmo assim não couber, o CSS reduz o canvas
    // proporcionalmente, então a árvore aparece sempre inteira.
    let disponivel = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    let passoX = Math.max(60, Math.min(90, (disponivel - 80) / largura));
    let passoY = 70;

    canvas.width = Math.max(300, largura * passoX + 60);
    canvas.height = 40 + (niveis - 1) * passoY + 50;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!raiz) return;

    let contador = { i: 0 };
    function posicionar(no, profundidade) {
        if (no === null) return;
        posicionar(no.esquerda, profundidade + 1);
        no._x = 40 + contador.i * passoX;
        no._y = 40 + profundidade * passoY;
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
