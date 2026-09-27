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
