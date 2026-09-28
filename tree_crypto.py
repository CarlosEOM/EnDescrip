# -*- coding: utf-8 -*-
def calcular_valor(palavra):
    """Soma os códigos Unicode dos caracteres da palavra (equivalente ao
    charCodeAt somado no protótipo em JS)."""
    return sum(ord(c) for c in palavra)


def criar_no(valor, palavra, posicao):
    return {
        'valor': valor,
        'palavra': palavra,
        'posicao': posicao,
        'esquerda': None,
        'direita': None,
    }


def inserir(raiz, novo_no):
    """Valores menores vão para a esquerda, maiores (ou iguais) para a direita."""
    if novo_no['valor'] < raiz['valor']:
        if raiz['esquerda'] is None:
            raiz['esquerda'] = novo_no
        else:
            inserir(raiz['esquerda'], novo_no)
    else:
        if raiz['direita'] is None:
            raiz['direita'] = novo_no
        else:
            inserir(raiz['direita'], novo_no)


def criar_arvore(texto):
    """Separa o texto em palavras e monta a árvore binária de busca pelos valores."""
    palavras = texto.strip().split()
    raiz = None
    for i, palavra in enumerate(palavras):
        novo_no = criar_no(calcular_valor(palavra), palavra, i)
        if raiz is None:
            raiz = novo_no
        else:
            inserir(raiz, novo_no)
    return raiz


def pos_ordem(raiz, resultado=None):
    """Percurso pós-ordem: esquerda -> direita -> raiz."""
    if resultado is None:
        resultado = []
    if raiz is None:
        return resultado
    pos_ordem(raiz['esquerda'], resultado)
    pos_ordem(raiz['direita'], resultado)
    resultado.append(raiz)
    return resultado


def codificar_palavra(palavra, chave):
    return [ord(c) + chave for c in palavra]


def decodificar_palavra(codigos, chave):
    return ''.join(chr(codigo - chave) for codigo in codigos)


def codificar_arvore(raiz, chave):
    """Codifica cada palavra da árvore (na ordem do percurso pós-ordem) somando
    a chave a cada caractere. Retorna a lista pronta para exportação em JSON."""
    return [
        {
            'valor': no['valor'],
            'palavra': codificar_palavra(no['palavra'], chave),
            'posicao': no['posicao'],
        }
        for no in pos_ordem(raiz)
    ]


def descriptografar(dados, chave):
    """Recebe a lista importada do JSON, decodifica cada palavra e remonta
    a mensagem original respeitando a posição original de cada palavra."""
    palavras = [
        {'palavra': decodificar_palavra(item['palavra'], chave), 'posicao': item['posicao']}
        for item in dados
    ]
    palavras.sort(key=lambda p: p['posicao'])
    return ' '.join(p['palavra'] for p in palavras)


def arvore_para_dict(raiz):
    """Serializa a árvore (com os nós filhos) para ser desenhada no canvas
    pelo JavaScript de exibição, no mesmo formato usado pelo protótipo original."""
    if raiz is None:
        return None
    return {
        'valor': raiz['valor'],
        'palavra': raiz['palavra'],
        'posicao': raiz['posicao'],
        'esquerda': arvore_para_dict(raiz['esquerda']),
        'direita': arvore_para_dict(raiz['direita']),
    }
