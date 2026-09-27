Projeto EnDescrip - Criptografia por árvore
Sprint 2 - Backend reescrito em Python (Flask)

Como rodar:
    1. pip install -r requirements.txt
    2. python app.py
    3. Abrir http://127.0.0.1:5000 no navegador

Login de administrador de demonstração: admin / admin123

Principais mudanças desta versão (Sprint 2):
    - Toda a lógica de árvore binária e de codificação/decodificação, que
      antes ficava em JavaScript (common.js), foi reescrita em Python
      (tree_crypto.py) e é executada pelo servidor Flask (app.py).
    - As páginas HTML agora são templates Jinja2 renderizados pelo Flask
      (pasta templates/), em vez de HTML estático com JS manipulando o DOM.
    - O campo de escolha de chave foi removido das telas de Criptografar e
      Descriptografar; o sistema agora usa sempre a chave fixa 44.
    - Nova aba "Histórico", que lista as mensagens já criptografadas e
      descriptografadas por cada usuário (o administrador vê o histórico
      de todos). Fica salvo em data/historico.json.
    - Cadastro de usuários e login também passaram a ser tratados pelo
      backend (data/users.json), com senha armazenada com hash
      (werkzeug.security), em vez de localStorage no navegador.

Estrutura:
    app.py              -> rotas Flask (login, cadastro, criptografar,
                            descriptografar, histórico, administração)
    tree_crypto.py       -> árvore binária, percurso pós-ordem, codificação
                            e decodificação (equivalente ao antigo common.js)
    templates/           -> páginas HTML (Jinja2)
    static/               -> style.css e common.js (agora só toast + desenho
                            da árvore no canvas)
    data/users.json       -> "banco" de usuários cadastrados
    data/historico.json   -> histórico de mensagens criptografadas/descriptografadas


Integrantes:
    Ana Carolina Siqueira Machado - 202515089
    Carlos Eduardo Oliveira de Melo - 202516024
    Carlos Victor Rodrigues da Silva - 202515051
    Ylana da Silva Costa - 202515620
    Thiago Rodrigues Carvalho - 202515028


Discente:
    Márcio Garrido

Atualização adicional:
    - Na Administração, cadastros com status "Aprovado" agora têm um
      botão "Remover", que apaga o cadastro do sistema (pede confirmação
      antes). Não é permitido remover o próprio usuário logado nem o
      único administrador cadastrado.
