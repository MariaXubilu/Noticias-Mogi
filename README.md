# NoticiasMogi

Portal de Notícias de Mogi Guaçu e Mogi Mirim
Projeto aplicação web com Node.js, Express e TypeScript.

## 📖 Índice

- [✨ Features](#-features)
- [🚀 Começando](#-começando)
- [⚙️ Scripts NPM](#️-scripts-npm)
- [💡 Funcionalidades Principais](#-funcionalidades-principais)
- [🗂️ Estrutura do Projeto](#️-estrutura-do-projeto)
- [💾 Banco de Dados](#-banco-de-dados)
- [🔑 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [📄 Licença](#-licença)

## ✨ Features

*   **Framework**: [Express.js](https://expressjs.com/pt-br/) para um servidor web robusto e minimalista.
*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) para um desenvolvimento seguro e escalável.
*   **Banco de Dados**: [Sequelize](https://sequelize.org/) ORM, com suporte para PostgreSQL, MySQL, MariaDB, SQLite e MSSQL. Configurado para usar SQLite por padrão em desenvolvimento.
*   **Templates**: [EJS](https://ejs.co/) (Embedded JavaScript templates) para renderização de views no servidor.
*   **Autenticação**: Sistema básico de usuário com hash de senhas usando `bcrypt`.
*   **Sessões**: Gerenciamento de sessões de usuário com express-session.
*   **Variáveis de Ambiente**: Gerenciamento de configuração com arquivos `.env` através do `dotenv`.
*   **Envio de E-mails**: Configurado com `nodemailer` para envio de e-mails transacionais.
*   **Upload de Arquivos**: Suporte para upload de arquivos com `multer`.
*   **Desenvolvimento**: `nodemon` para recarregamento automático do servidor e `ts-node` para execução direta de TypeScript.

## 🚀 Começando

Siga os passos abaixo para ter uma cópia do projeto rodando em sua máquina local.

### 1. Pré-requisitos

*   Node.js (versão 12 ou superior)
*   Yarn ou npm

### 2. Instalação

```bash
# Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>

# Entre na pasta do projeto
cd NoticiasMogi

# Instale as dependências
npm install
```

### 3. Configuração do Ambiente

Copie o arquivo de exemplo de variáveis de ambiente e preencha com suas informações.

```bash
# Crie o arquivo .env a partir do exemplo
cp .env.example .env
```

Agora, abra o arquivo `.env` e altere os valores, principalmente `ADMIN_EMAIL` e `ADMIN_EMAIL_PASSWORD`.

### 4. Banco de Dados e Admin

Execute os seguintes comandos para criar o banco de dados e o usuário administrador inicial.

```bash
# Cria o arquivo database.sqlite e as tabelas
npm run init-db

# Cria o usuário administrador (siga as instruções no terminal)
npm run create-admin
```

### 5. Rodando a Aplicação

```bash
# Inicia o servidor em modo de desenvolvimento
npm run dev
```

Pronto! O servidor estará disponível em `http://localhost:4000` (ou na porta que você definiu no arquivo `.env`).

## ⚙️ Scripts NPM

O projeto vem com alguns scripts úteis:
```json
"scripts": {
  "start": "ts-node src/index.ts",
  "dev": "nodemon src/index.ts",
  "create-admin": "ts-node src/createAdmin.ts",
  "init-db": "ts-node src/initDB.ts",
  "build": "tsc",
  "serve": "node dist/index.js"
}
```

### Modo de Desenvolvimento
Para iniciar o servidor em modo de desenvolvimento com recarregamento automático:

```bash
npm run dev
```
O servidor estará disponível em `http://localhost:4000` 


### Modo de Produção
Para construir e iniciar a aplicação em modo de produção:

1.  **Compile o código TypeScript:**
    ```bash
    npm run build
    ```
    Isso compilará os arquivos de `src/` para a pasta `dist/`.

2.  **Inicie o servidor:**
    ```bash
    npm run serve
    ```

### Scripts Utilitários

*   **Inicializar o Banco de Dados**: Este comando cria o arquivo do banco de dados (`database.sqlite`) e as tabelas com base nos modelos do Sequelize. Execute-o na primeira vez que configurar o projeto.
    ```bash
    npm run init-db
    ```
*   **Criar Usuário Administrador**: Este script é usado para criar um usuário administrador inicial no sistema.
    ```bash
    npm run create-admin
    ```

## 💾 Banco de Dados

O projeto utiliza o **Sequelize** com **SQLite**. É importante notar como a configuração está dividida:

*   `src/config/config.json`: Este arquivo é o padrão utilizado pela ferramenta `sequelize-cli`. Ele contém as configurações para os ambientes de `development`, `test` e `production`, sendo útil principalmente para executar *migrations* e *seeders*.
*   `src/config/database.ts`: **Este é o arquivo que a aplicação utiliza em tempo de execução para se conectar ao banco de dados.**

> ⚠️ **Atenção:** A conexão com o banco de dados em tempo de execução está definida diretamente no arquivo `src/config/database.ts` (apontando para `database.sqlite`) e **não utiliza** as configurações do `config.json` ou do `.env`. Para alterar o banco de dados da aplicação, você precisa editar o arquivo `database.ts`.

## ✨ Funcionalidades Principais

O portal possui um conjunto de funcionalidades para usuários e administradores.

### Para Todos os Visitantes
*   **Visualização de Conteúdo**: A página inicial exibe um carrossel com notícias em destaque e uma grade de cards informativos.
*   **Leitura de Notícias**: Os usuários podem clicar em uma notícia no carrossel para abrir um modal com o conteúdo completo, sem precisar sair da página inicial.
*   **Contato**: Um formulário de contato (em um modal) com validação de CPF no lado do cliente está disponível.

### Para Usuários Cadastrados
*   **Cadastro e Login**: Usuários podem criar uma conta e fazer login no sistema. As sessões são gerenciadas para manter o usuário conectado.
*   **Perfil**: Acesso a uma página de perfil básica após o login.

### Para Administradores
O sistema oferece uma experiência de gerenciamento de conteúdo visual e integrada para administradores.

*   **Identificação Visual**: Quando um administrador faz login, o sistema adiciona uma classe CSS `.admin-logged` ao `<body>` da página. Isso ativa visualmente as funcionalidades de edição no frontend.
*   **Edição "In-place"**:
    *   Na página inicial, um ícone "✏️ Editar" aparece sobre os cards e notícias quando o administrador passa o mouse.
    *   Clicar em um card ou notícia abre um modal de edição pré-preenchido com os dados atuais (título, conteúdo, imagem), permitindo uma atualização rápida e intuitiva.
*   **Gerenciamento Completo**: Acesso a rotas e painéis específicos em `/admin` para um gerenciamento mais detalhado de todo o conteúdo do site.

### Fluxo de Notícias
1.  Um **usuário cadastrado** acessa sua página de `/perfil`.
2.  Ele preenche o formulário para submeter uma nova notícia, incluindo um arquivo de imagem.
3.  O sistema salva a notícia com o status "pendente" e envia um **e-mail de notificação** para o administrador.
4.  O **administrador**, através do seu perfil ou de links no e-mail, pode **aprovar** ou **rejeitar** a notícia.
5.  Se aprovada, a notícia fica visível para todos os visitantes no carrossel da página inicial. O autor é notificado por e-mail sobre o status.

## 🗂️ Estrutura do Projeto

NoticiasMogi/
├── src/                         # Código fonte principal (TypeScript)
│   ├── config/                  # Configurações do projeto
│   │   ├── database.ts          # Configuração da conexão com o banco de dados
│   │   └── config.json          # Configurações adicionais (se necessário)
│   ├── controllers/             # Lógica das rotas/endpoints
│   │   └── userController.ts    # Controlador para operações de usuário
│   ├── middleware/              # Middlewares do Express
│   │   └── authMiddleware.ts    # Middlewares de autenticação/autorização
│   ├── models/                  # Modelos de dados (Sequelize)
│   │   ├── index.ts             # Centraliza e associa os modelos
│   │   ├── Card.ts              # Modelo para cards da página inicial
│   │   ├── Contato.ts           # Modelo para mensagens de contato
│   │   ├── Noticia.ts           # Modelo para notícias
│   │   └── userModel.ts         # Modelo para usuários
│   ├── createAdmin.ts           # Script para criar usuário admin
│   ├── initDB.ts                # Script para inicializar o banco de dados
│   └── index.ts                 # Ponto de entrada da aplicação (servidor)
├── public/                      # Arquivos estáticos
│   ├── js/                      # JavaScript do cliente
│   │   └── main.js              # Script principal do front-end
│   ├── images/                  # Imagens do site
│   │   └── [todas as imagens]   # Imagens padrão do sistema
│   ├── css/                     # Folhas de estilo
│   │   └── style.css            # CSS principal
│   └── uploads/                 # Arquivos enviados pelos usuários
│       └── [arquivos enviados]  # Imagens de perfil/notícias
├── views/                       # Templates EJS
│   ├── partials/                # Componentes reutilizáveis
│   │   ├── header.ejs           # Cabeçalho das páginas
│   │   ├── navbar.ejs           # Barra de navegação
│   │   └── footer.ejs           # Rodapé
│   ├── admin/                   # Painel administrativo
│   │   └── editCards.ejs        # Edição de cards da página inicial
│   ├── perfil.ejs               # Página de perfil do usuário
│   ├── login.ejs                # Página de login
│   ├── cadastro.ejs             # Página de cadastro
│   ├── 404.ejs                  # Página de erro 404
│   └── index.ejs                # Página inicial
├── dist/                        # Código compilado (JavaScript)
│   └── [arquivos .js]           # Gerado automaticamente pelo TypeScript
├── package.json                 # Configuração do projeto e dependências
├── tsconfig.json                # Configuração do TypeScript
└── .env                         # Variáveis de ambiente
└── README.md

### Detalhes da Estrutura
*   **`src/index.ts`**: É o coração da aplicação. Ele inicializa o Express, configura todos os middlewares, define os modelos do Sequelize e, crucialmente, **contém todas as rotas da aplicação**.
+    > **Nota**: Idealmente, as rotas seriam separadas em um diretório `src/routes` para melhor organização. No entanto, para simplificar o desenvolvimento inicial, elas foram mantidas no `index.ts`.
*   **`src/models`**: Define a estrutura das tabelas do banco de dados usando o Sequelize. Contém os modelos: `User`, `Noticia`, `Card` e `Contato`.
*   **`src/middleware/authMiddleware.ts`**: Contém as funções de middleware para proteger rotas:
+    *   `requireLogin`: Garante que o usuário esteja logado para acessar certas páginas (como `/perfil`).
+    *   `isAdmin`: Verifica se o usuário logado tem permissões de administrador, protegendo as rotas de gerenciamento (como `/admin/*` e as ações de aprovação/rejeição de notícias).


## 🔑 Variáveis de Ambiente

*   `ADMIN_EMAIL`: E-mail usado para enviar mensagens pelo sistema (ex: e-mails de boas-vindas, recuperação de senha).
*   `ADMIN_EMAIL_PASSWORD`: Senha do e-mail acima. **Use uma senha de aplicativo se o provedor (ex: Gmail) exigir.**
*   `ADMIN_NAME`: Nome que aparecerá como remetente dos e-mails.
*   `SITE_URL`: URL base da aplicação, usada para gerar links absolutos.
*   `PORT`: Porta em que o servidor irá rodar.
*   `NODE_ENV`: Ambiente da aplicação (`development`, `production`, `test`).

