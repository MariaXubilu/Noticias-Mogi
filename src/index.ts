import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import nodemailer from 'nodemailer';
import multer, { FileFilterCallback } from 'multer';
import bcrypt from 'bcrypt';
import { sequelize, Op } from './config/database';
import { DataTypes, Model } from 'sequelize';
import { register, login, logout, updateProfile } from './controllers/userController';
// Modelos com tipagem
interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  biografia?: string;
  foto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoticiaAttributes {
  id?: number;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  imagem: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContatoAttributes {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  mensagem: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CardAttributes {
  id?: number;
  titulo: string;
  imagem: string;
  conteudo: string;
  posicao: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaces de modelo com métodos do Sequelize
interface UserInstance extends Model<UserAttributes>, UserAttributes {}
interface NoticiaInstance extends Model<NoticiaAttributes>, NoticiaAttributes {
  User?: UserInstance;
}
interface ContatoInstance extends Model<ContatoAttributes>, ContatoAttributes {}
interface CardInstance extends Model<CardAttributes>, CardAttributes {}

// Importar modelos
import UserModel from './models/userModel';
import ContatoModel from './models/Contato';
import NoticiaModel from './models/Noticia';
import CardModel from './models/Card';

// Inicializar modelos com DataTypes
const User = UserModel(sequelize, DataTypes) as unknown as typeof Model & {
  new (): UserInstance;
  associate(models: { Noticia: typeof Noticia }): void;
};
const Contato = ContatoModel(sequelize, DataTypes) as unknown as typeof Model & {
  new (): ContatoInstance;
};
const Noticia = NoticiaModel(sequelize, DataTypes) as unknown as typeof Model & {
  new (): NoticiaInstance;
  associate(models: { User: typeof User }): void;
};
const Card = CardModel(sequelize, DataTypes) as unknown as typeof Model & {
  new (): CardInstance;
};

// Extender a interface Session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

// Configurar associações com verificação
if (typeof User.associate === 'function') {
  User.associate({ Noticia });
}
if (typeof Noticia.associate === 'function') {
  Noticia.associate({ User });
}

// Middlewares
import { requireLogin, isAdmin } from './middleware/authMiddleware';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'seusegredoaqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
    }
}));

// Configuração do Nodemailer
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_EMAIL as string,
        pass: process.env.ADMIN_EMAIL_PASSWORD as string
    }
});

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Middleware de usuário logado com tipagem
app.use(async (req: Request, res: Response, next: NextFunction) => {
    res.locals.user = null;
    if (req.session.userId) {
        try {
            const user = await User.findByPk(req.session.userId) as UserInstance;
            if (user) {
                res.locals.user = user;
            }
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
        }
    }
    next();
});

// Função de validação de CPF
function validarCPF(cpfDigits: string): boolean {
    if (cpfDigits.length !== 11) return false;
    const allEqual = cpfDigits.split('').every(d => d === cpfDigits[0]);
    if (allEqual) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpfDigits[i]) * (10 - i);
    }
    let dig1 = (soma * 10) % 11;
    if (dig1 === 10) dig1 = 0;
    if (dig1 !== parseInt(cpfDigits[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpfDigits[i]) * (11 - i);
    }
    let dig2 = (soma * 10) % 11;
    if (dig2 === 10) dig2 = 0;

    return dig2 === parseInt(cpfDigits[10]);
}
// Função para criar notícias padrão se o banco estiver vazio
async function criarNoticiasPadrao() {
    try {
        // Garante que o usuário "Sistema" exista para ser o autor
        let sistemaUser = await User.findOne({ where: { username: 'Sistema' } }) as UserInstance | null;
        if (!sistemaUser) {
            const systemPassword = process.env.SYSTEM_USER_PASSWORD || Math.random().toString(36).slice(-8);
            const hashedSystemPassword = await bcrypt.hash(systemPassword, 10);
            sistemaUser = await User.create({
                username: 'Sistema',
                email: 'sistema@boot.com.br',
                password: hashedSystemPassword,
                isAdmin: true
            }) as UserInstance;
        }

        const noticiasPadrao = [
            {
                titulo: 'Bem-vindo ao Nosso Portal!',
                subtitulo: 'Fique por dentro das últimas novidades.',
                conteudo: 'Este é o nosso novo portal de notícias. Explore o conteúdo, cadastre-se e participe enviando suas próprias matérias para aprovação!',
                imagem: '/images/portal.jpg', 
                status: 'aprovada' as const,
                userId: sistemaUser.id as number
            },
            {
                titulo: 'Como Enviar sua Notícia',
                subtitulo: 'É fácil e rápido!',
                conteudo: 'Para enviar sua notícia, basta fazer o login e acessar a sua página de perfil. Lá você encontrará um formulário simples para submeter seu conteúdo e imagem.',
                imagem: '/images/jornal.jpg',
                status: 'aprovada' as const,
                userId: sistemaUser.id as number
            }
        ];

        await Noticia.bulkCreate(noticiasPadrao);
        console.log('Notícias padrão criadas com sucesso!');
    } catch (error) {
        console.error('Erro ao criar notícias padrão:', error);
    }
}

// Rotas Públicas
app.get("/", async (req: Request, res: Response) => {
    try {
        const noticiasAprovadas = await Noticia.findAll({ 
            where: { status: 'aprovada' },
            include: [{ model: User, as: 'User', attributes: ['username', 'foto'] }],
            order: [['createdAt', 'DESC']],
            limit: 3
        }) as NoticiaInstance[];

        // Carrega os cards do banco de dados ordenados por posição
        const cards = await Card.findAll({ 
            order: [['posicao', 'ASC']],
            limit: 7 // Limita a 7 cards (1 principal + 6 secundários)
        });

        // Se não houver cards, cria os padrão
        if (cards.length === 0) {
            await criarCardsPadrao();
            return res.redirect('/');
        }
// Se não houver notícias aprovadas, cria as padrão e recarrega a página
        if (noticiasAprovadas.length === 0) {
            await criarNoticiasPadrao();
            return res.redirect('/');
        }
        res.render("index", {
            noticiasCarrossel: noticiasAprovadas.map(n => n.get({ plain: true })),
            cards: cards.map(card => card.get({ plain: true })),
            success: req.query.success
        });
    } catch (error) {
        console.error(error);
        res.render("index", { 
            noticiasCarrossel: [],
            cards: [] 
        });
    }
});

// Função para criar os cards padrão se o banco estiver vazio
async function criarCardsPadrao() {
    try {
        const cardsPadrao = [
            {
                titulo: 'Governo envia ao Congresso projeto do IR',
                imagem: '/images/ir.jpeg',
                conteudo: JSON.stringify([
                    'Isenção do Imposto de Renda é para quem ganha até R$ 5.000 por mês.',
                    'Proposta é uma das prioridades do governo em 2025.',
                    'Impacto no orçamento da União é de R$ 27 bilhões por ano.'
                ]),
                posicao: 1
            },
            { titulo: 'Quem é quem no remake de Vale Tudo que estreia dia 31 na Globo', imagem: '/images/vale.jpg', conteudo: '[]', posicao: 2 },
            { titulo: 'Ed Motta comenta briga de Maria Bethânia com equipe durante show', imagem: '/images/ed-motta.jfif', conteudo: '[]', posicao: 3 },
            { titulo: "Astronautas 'presos' no espaço começam volta à Terra; processo leva 17 horas", imagem: '/images/astro.jpg', conteudo: '[]', posicao: 4 },
            { titulo: 'Trump e Putin devem discutir proposta de cessar-fogo', imagem: '/images/trump.jpg', conteudo: '[]', posicao: 5 },
            { titulo: 'Bolsa Família 2025: pagamentos de março começam nesta terça', imagem: '/images/bolsa.jpg', conteudo: '[]', posicao: 6 },
            { titulo: 'Biólogo lança livro que desdobra a conexão entre flores e beija-flores', imagem: '/images/beija-flor.jpg', conteudo: '[]', posicao: 7 }
        ];

        await Card.bulkCreate(cardsPadrao);
        console.log('Cards padrão criados com sucesso!');
    } catch (error) {
        console.error('Erro ao criar cards padrão:', error);
    }
}


app.get("/cadastro", (req: Request, res: Response) => {
    res.render("cadastro");
});

app.post("/cadastro", async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    try {
        const exists = await User.findOne({
            where: { [Op.or]: [{ username }, { email }] }
        }) as UserInstance | null;

        if (exists) {
            return res.render("cadastro", { error: "Usuário ou e-mail já cadastrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ 
            username, 
            email, 
            password: hashedPassword 
        });

        res.redirect("/login?success=cadastro");
    } catch (error) {
        res.render("cadastro", { error: "Erro ao cadastrar usuário." });
    }
});

app.get('/login', (req: Request, res: Response) => {
    res.render('login');
});

app.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({
            where: { [Op.or]: [{ username }, { email: username }] }
        }) as UserInstance | null;

        if (!user) {
            res.render('login', { error: 'Usuário não encontrado.' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.render('login', { error: 'Senha incorreta.' });
            return;
        }

        req.session.userId = user.id as number;
        req.session.isAdmin = Boolean(user.isAdmin);
        res.redirect("/?success=login");
    } catch (error) {
        console.error('Erro no login:', error);
        res.render('login', { error: 'Erro durante o login.' });
    }
});

// Rotas de Contato
app.post("/salvarcadastro", async (req: Request, res: Response, next: NextFunction) => {
    const { nameModal, cpfModal, emailModal, messageModal } = req.body;

    if (!validarCPF(cpfModal.replace(/\D/g, ''))) {
        res.status(400).json({ error: "CPF inválido" });
        return;
    }

    try {
        await Contato.create({
            nome: nameModal,
            cpf: cpfModal,
            email: emailModal,
            mensagem: messageModal
        });

        res.redirect("/?success=true");
    } catch (error) {
        res.status(500).render("index", { success: false, error: "Erro ao salvar cadastro" });
    }
});

// Rotas Protegidas
app.get('/perfil', requireLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findByPk(req.session.userId) as UserInstance | null;
        
        let noticiasPendentes: NoticiaInstance[] = [];
        if (user?.isAdmin) {
            noticiasPendentes = await Noticia.findAll({ 
                where: { status: 'pendente' },
                include: [{ 
                    model: User,
                    as: 'User',
                    attributes: ['username']
                }],
                order: [['createdAt', 'DESC']]
            }) as NoticiaInstance[];
        }
        
        res.render('perfil', { 
            user, 
            noticiasPendentes: user?.isAdmin ? noticiasPendentes : null 
        });
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        res.redirect('/?error=perfil');
    }
});

// Rota do painel de admin
app.get('/admin/cards/:id', requireLogin, isAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const card = await Card.findByPk(req.params.id);
        if (!card) {
            res.status(404).json({ error: 'Card não encontrado' });
            return;
        }
        res.json({
            ...card.get(),
            conteudo: JSON.parse(card.get('conteudo'))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar card' });
    }
});

// Rota para atualizar um card
app.post('/admin/cards/update/:id', requireLogin, isAdmin, upload.single('imagem'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { titulo, conteudo } = req.body;
        
        // Processa o conteúdo - divide por linhas e remove vazias
        const conteudoArray = conteudo.split('\n')
            .filter((p: string) => p.trim() !== '')
            .map((p: string) => p.trim());

        let updateData: Partial<CardAttributes> = {
            titulo,
            conteudo: conteudoArray // O setter do modelo vai converter para JSON
        };

        if (req.file) {
            updateData.imagem = '/uploads/' + req.file.filename;
        }

        await Card.update(updateData, {
            where: { id }
        });

        res.redirect('/?success=card-updated');
    } catch (error) {
        console.error('Erro ao atualizar card:', error);
        res.redirect('/?error=card-update');
    }
});
app.get('/admin/noticias', requireLogin, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const noticias = await Noticia.findAll({
            include: [{ 
                model: User,
                as: 'User',
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']]
        }) as NoticiaInstance[];
        
        res.render('admin/noticias', { noticias });
    } catch (error) {
        console.error(error);
        res.redirect('/perfil?error=admin');

    }
});

app.post('/perfil/atualizar', requireLogin, upload.single('foto'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateData: Partial<UserAttributes> = {
            username: req.body.username,
            biografia: req.body.biografia
        };

        if (req.file) {
            updateData.foto = '/uploads/' + req.file.filename;
        }

        if (req.body.password && req.body.password.trim() !== '') {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        await User.update(updateData, {
            where: { id: req.session.userId as number }
        });

        res.redirect('/perfil?success=perfil');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.redirect('/perfil?error=perfil');
    }
});

app.post('/perfil/noticia', requireLogin, upload.single('imagem'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.redirect('/perfil?error=imagem');
            return;
        }

        if (!req.session.userId) { // Verificar se userId existe
            res.redirect('/perfil?error=usuario-nao-autenticado');
            return;
        }

        const { titulo, subtitulo, conteudo } = req.body;
        const imagemPath = '/uploads/' + req.file.filename;

        const noticia = await Noticia.create({
            titulo,
            subtitulo,
            imagem: imagemPath,
            conteudo,
            userId: req.session.userId, // Agora garantido que não é undefined
            status: 'pendente'
        });

        // Envia email para aprovação
        const mailOptions: MailOptions = {
            from: `"${process.env.ADMIN_NAME || 'Admin'}" <${process.env.ADMIN_EMAIL || 'admin@example.com'}>`,
            to: process.env.ADMIN_EMAIL || 'admin@example.com',
            subject: 'Nova notícia para aprovação',
            html: `
                <h1>Nova notícia submetida</h1>
                <p><strong>Título:</strong> ${titulo}</p>
                <p><strong>Subtítulo:</strong> ${subtitulo}</p>
                <p><strong>Conteúdo:</strong> ${conteudo}</p>
                <img src="cid:noticia" style="max-width: 300px;">
                <div style="margin-top: 20px;">
                    <a href="${process.env.SITE_URL || 'http://localhost:4000'}/noticia/aprovar/${noticia.get('id')}" 
                       style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                        Aprovar
                    </a>
                    <a href="${process.env.SITE_URL || 'http://localhost:4000'}/noticia/rejeitar/${noticia.get('id')}" 
                       style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Rejeitar
                    </a>
                </div>
            `,
            attachments: [{
                filename: req.file.originalname,
                path: path.join(__dirname, '../public', imagemPath),
                cid: 'noticia'
            }]
        };

        await transporter.sendMail(mailOptions);
        res.redirect('/perfil?success=noticia');
    } catch (error) {
        console.error(error);
        res.redirect('/perfil?error=noticia');
    }
});

// Rotas de aprovação/rejeição
app.post('/noticia/aprovar/:id', requireLogin, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id, {
            include: [{ model: User, as: 'User' }]
        }) as NoticiaInstance | null;
        
        if (!noticia || !noticia.User) {
            res.redirect('/perfil?error=noticia-nao-encontrada');
            return;
        }

        await noticia.update({ status: 'aprovada' });

        await transporter.sendMail({
            from: `"${process.env.ADMIN_NAME || 'Admin'}" <${process.env.ADMIN_EMAIL || 'admin@example.com'}>`,
            to: noticia.User.email,
            subject: 'Sua notícia foi aprovada!',
            html: `
                <h1>Sua notícia foi aprovada!</h1>
                <p><strong>Título:</strong> ${noticia.get('titulo')}</p>
                <p>Agora ela está visível no carrossel principal do site.</p>
                <a href="${process.env.SITE_URL || 'http://localhost:4000'}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Ver no site
                </a>
            `
        });

        res.redirect('/perfil?success=noticia-aprovada');
    } catch (error) {
        console.error(error);
        res.redirect('/perfil?error=aprovar-noticia');
    }
});
app.post('/noticia/rejeitar/:id', requireLogin, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id, {
            include: [{ model: User, as: 'User' }]
        }) as NoticiaInstance | null;
        
        if (!noticia || !noticia.User) {
            res.redirect('/perfil?error=noticia-nao-encontrada');
            return;
        }

        await noticia.update({ status: 'rejeitada' });

        // Notifica o autor
        await transporter.sendMail({
            from: `"${process.env.ADMIN_NAME || 'Admin'}" <${process.env.ADMIN_EMAIL || 'admin@example.com'}>`,
            to: noticia.User.email,
            subject: 'Sua notícia precisa de ajustes',
            html: `
                <h1>Sua notícia foi revisada</h1>
                <p><strong>Título:</strong> ${noticia.get('titulo')}</p>
                <p>Infelizmente sua notícia não pôde ser aprovada no momento. Por favor, revise o conteúdo e envie novamente.</p>
                <a href="${process.env.SITE_URL || 'http://localhost:4000'}/perfil" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Enviar nova notícia
                </a>
            `
        });

        res.redirect('/perfil?success=noticia-rejeitada');
    
    } catch (error) {
        console.error(error);
        res.redirect('/perfil?error=rejeitar-noticia');
    
    }
});

app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Rota para página não encontrada (404)
app.use((req: Request, res: Response) => {
    res.status(404).render("404");
});

// Inicialização do servidor
sequelize.sync().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });

    const gracefulShutdown = (signal: string) => {
        console.log(`${signal} recebido, encerrando o servidor...`);
        server.close(() => {
            console.log('Conexões restantes fechadas.');
            process.exit(0);
        });

        // Força o encerramento após 10 segundos
        setTimeout(() => {
            console.error('Não foi possível fechar as conexões a tempo, forçando o encerramento.');
            process.exit(1);
        }, 10000);
    };

    // Ouve o sinal de encerramento do nodemon/docker
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // Ouve o sinal de interrupção (Ctrl+C)
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

}).catch((err: Error) => {
    console.error('Erro ao conectar ao banco de dados:', err);
});