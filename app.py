# -*- coding: utf-8 -*-
import io
import json
import os
from datetime import datetime
from functools import wraps

from flask import (Flask, flash, get_flashed_messages, redirect, render_template,
                    request, send_file, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

from tree_crypto import (arvore_para_dict, codificar_arvore, criar_arvore,
                          descriptografar as descriptografar_dados, pos_ordem)

CHAVE_PADRAO = 44
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(BASE_DIR, 'data', 'users.json')
HIST_FILE = os.path.join(BASE_DIR, 'data', 'historico.json')

app = Flask(__name__)
app.secret_key = 'endescrip-prototipo-secret-key'  # protótipo: ok ficar fixo


# ---------- Persistência (arquivos JSON, mesma ideia do protótipo original) ----------

def carregar_usuarios():
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def salvar_usuarios(usuarios):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(usuarios, f, ensure_ascii=False, indent=2)


def carregar_historico():
    if not os.path.exists(HIST_FILE):
        return []
    with open(HIST_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def salvar_historico(historico):
    with open(HIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(historico, f, ensure_ascii=False, indent=2)


def registrar_historico(username, tipo, resumo):
    """Grava uma entrada no histórico de mensagens criptografadas/descriptografadas."""
    historico = carregar_historico()
    historico.insert(0, {
        'id': 'h_' + datetime.now().strftime('%Y%m%d%H%M%S%f'),
        'usuario': username,
        'tipo': tipo,  # 'criptografado' ou 'descriptografado'
        'resumo': resumo,
        'data': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
    })
    salvar_historico(historico)


# ---------- Autenticação ----------

def usuario_atual():
    username = session.get('username')
    if not username:
        return None
    return next((u for u in carregar_usuarios() if u['username'] == username), None)


def login_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not usuario_atual():
            return redirect(url_for('login'))
        return func(*args, **kwargs)
    return wrapper


def admin_obrigatorio(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        user = usuario_atual()
        if not user:
            return redirect(url_for('login'))
        if not user.get('isAdmin'):
            return redirect(url_for('index'))
        return func(*args, **kwargs)
    return wrapper


@app.context_processor
def injetar_toast():
    mensagens = get_flashed_messages(with_categories=True)
    toast = mensagens[0][1] if mensagens else None
    return {'toast_msg': toast}


# ---------- Rotas: login / cadastro ----------

@app.route('/login', methods=['GET', 'POST'])
def login():
    if usuario_atual():
        return redirect(url_for('index'))

    erro = None
    tela = request.args.get('tela', 'login')

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        senha = request.form.get('senha', '')
        usuarios = carregar_usuarios()
        user = next((u for u in usuarios if u['username'] == username), None)

        if not username or not senha:
            erro = 'Preencha usuário e senha.'
        elif not user or not check_password_hash(user['senha_hash'], senha):
            erro = 'Usuário ou senha inválidos.'
        elif user['status'] == 'pendente':
            erro = 'Seu cadastro ainda está aguardando aprovação do administrador.'
        elif user['status'] == 'recusado':
            erro = 'Seu cadastro foi recusado pelo administrador.'
        else:
            session['username'] = user['username']
            return redirect(url_for('index'))

    return render_template('login.html', erro=erro, tela=tela)


@app.route('/cadastro', methods=['POST'])
def cadastro():
    nome = request.form.get('nome', '').strip()
    email = request.form.get('email', '').strip()
    username = request.form.get('username', '').strip()
    senha = request.form.get('senha', '')

    usuarios = carregar_usuarios()

    if not nome or not email or not username or not senha:
        return render_template('login.html', erro_cadastro='Preencha todos os campos.', tela='cadastro')

    if any(u['username'] == username for u in usuarios):
        return render_template('login.html', erro_cadastro='Esse nome de usuário já existe.', tela='cadastro')

    usuarios.append({
        'id': 'u_' + datetime.now().strftime('%Y%m%d%H%M%S%f'),
        'nome': nome,
        'email': email,
        'username': username,
        'senha_hash': generate_password_hash(senha),
        'status': 'pendente',
        'isAdmin': False,
    })
    salvar_usuarios(usuarios)

    flash('Cadastro enviado! Aguarde a aprovação do administrador.', 'ok')
    return redirect(url_for('login'))


@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))


# ---------- Rotas: área logada ----------

@app.route('/')
@login_obrigatorio
def index():
    return render_template('index.html', user=usuario_atual())


@app.route('/criptografar', methods=['GET', 'POST'])
@login_obrigatorio
def criptografar():
    arvore_json = None
    resultado = None
    mensagem = ''
    pronto_download = False

    if request.method == 'POST':
        mensagem = request.form.get('mensagem', '').strip()
        if not mensagem:
            resultado = 'Digite uma mensagem.'
        else:
            raiz = criar_arvore(mensagem)
            ordem = pos_ordem(raiz)
            ordem_pos = ', '.join(no['palavra'] for no in ordem)

            codificado = codificar_arvore(raiz, CHAVE_PADRAO)
            arvore_json = json.dumps(arvore_para_dict(raiz))

            session['ultima_arvore'] = codificado
            pronto_download = True

            registrar_historico(usuario_atual()['username'], 'criptografado', mensagem[:120])

            resultado = (
                'Árvore criada e criptografada com a chave padrão do sistema. '
            )

    return render_template(
        'criptografar.html',
        user=usuario_atual(),
        arvore_json=arvore_json,
        resultado=resultado,
        mensagem=mensagem,
        chave=CHAVE_PADRAO,
        pronto_download=pronto_download,
    )


@app.route('/baixar-json')
@login_obrigatorio
def baixar_json():
    dados = session.get('ultima_arvore')
    if not dados:
        return redirect(url_for('criptografar'))
    conteudo = json.dumps(dados, ensure_ascii=False, indent=2).encode('utf-8')
    buffer = io.BytesIO(conteudo)
    return send_file(buffer, as_attachment=True, download_name='mensagem.json', mimetype='application/json')


@app.route('/descriptografar', methods=['GET', 'POST'])
@login_obrigatorio
def descriptografar_view():
    resultado = None

    if request.method == 'POST':
        arquivo = request.files.get('arquivo')
        if not arquivo or arquivo.filename == '':
            resultado = 'Selecione um arquivo JSON.'
        else:
            try:
                dados = json.load(arquivo.stream)
                mensagem = descriptografar_dados(dados, CHAVE_PADRAO)
                resultado = mensagem
                registrar_historico(usuario_atual()['username'], 'descriptografado', mensagem[:120])
            except Exception:
                resultado = 'Erro ao descriptografar. Verifique o arquivo e tente novamente.'

    return render_template(
        'descriptografar.html',
        user=usuario_atual(),
        resultado=resultado,
        chave=CHAVE_PADRAO,
    )


@app.route('/historico')
@login_obrigatorio
def historico():
    user = usuario_atual()
    todos = carregar_historico()
    if user.get('isAdmin'):
        registros = todos
    else:
        registros = [h for h in todos if h['usuario'] == user['username']]
    return render_template('historico.html', user=user, registros=registros)


# ---------- Rotas: administração ----------

@app.route('/administrar')
@admin_obrigatorio
def administrar():
    usuarios = carregar_usuarios()
    pendentes = [u for u in usuarios if u['status'] == 'pendente']
    aprovados = [u for u in usuarios if u['status'] == 'aprovado']
    recusados = [u for u in usuarios if u['status'] == 'recusado']
    return render_template(
        'administrar.html',
        user=usuario_atual(),
        pendentes=pendentes,
        aprovados=aprovados,
        recusados=recusados,
    )


@app.route('/administrar/status', methods=['POST'])
@admin_obrigatorio
def administrar_status():
    user_id = request.form.get('id')
    novo_status = request.form.get('status')
    usuarios = carregar_usuarios()
    for u in usuarios:
        if u['id'] == user_id:
            u['status'] = novo_status
    salvar_usuarios(usuarios)
    flash('Cadastro atualizado.', 'ok')
    return redirect(url_for('administrar'))


@app.route('/administrar/remover', methods=['POST'])
@admin_obrigatorio
def administrar_remover():
    user_id = request.form.get('id')
    usuarios = carregar_usuarios()
    alvo = next((u for u in usuarios if u['id'] == user_id), None)

    if alvo is None:
        flash('Cadastro não encontrado.', 'erro')
        return redirect(url_for('administrar'))

    if alvo['username'] == usuario_atual()['username']:
        flash('Você não pode remover o seu próprio cadastro.', 'erro')
        return redirect(url_for('administrar'))

    if alvo.get('isAdmin') and sum(1 for u in usuarios if u.get('isAdmin')) <= 1:
        flash('Não é possível remover o único administrador do sistema.', 'erro')
        return redirect(url_for('administrar'))

    usuarios = [u for u in usuarios if u['id'] != user_id]
    salvar_usuarios(usuarios)
    flash('Cadastro removido.', 'ok')
    return redirect(url_for('administrar'))


if __name__ == '__main__':
    app.run(debug=True)
