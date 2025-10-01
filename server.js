const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const users = [];
const products = [
  {
    id: 1,
    name: 'Anel de Prata',
    price: 250,
    image: '/images/anel-prata.jpg',
    description: 'Anel elegante em prata 925.',
  },
  {
    id: 2,
    name: 'Colar de Ouro',
    price: 1200,
    image: '/images/colar-ouro.jpg',
    description: 'Colar sofisticado em ouro 18k.',
  },
  {
    id: 3,
    name: 'Pulseira com Banho Dourado',
    price: 450,
    image: '/images/pulseira-banho.jpg',
    description: 'Pulseira com banho dourado de alta qualidade.',
  },
];

const reviews = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'silva_silveira_secret',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  next();
});

app.get('/', (req, res) => {
  res.render('home', { title: 'Silva & Silveira - Joias Luxuosas' });
});

app.get('/catalog', (req, res) => {
  res.render('catalog', { products, title: 'Catálogo - Silva & Silveira' });
});

app.post('/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) return res.status(404).send('Produto não encontrado');

  if (!req.session.cart) req.session.cart = [];

  const cartItemIndex = req.session.cart.findIndex(item => item.product.id === product.id);
  if (cartItemIndex > -1) {
    req.session.cart[cartItemIndex].quantity += parseInt(quantity);
  } else {
    req.session.cart.push({ product, quantity: parseInt(quantity) });
  }
  res.redirect('/cart');
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('cart', { cart, title: 'Carrinho - Silva & Silveira' });
});

app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  req.session.cart = req.session.cart.filter(item => item.product.id !== parseInt(productId));
  res.redirect('/cart');
});

function calcularFrete(km) {
  const valorPorKm = 5;
  return km * valorPorKm;
}

app.get('/payment', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/catalog');
  res.render('payment', { cart, title: 'Pagamento - Silva & Silveira', frete: null, total: null });
});

app.post('/payment/calculate-frete', (req, res) => {
  const { km } = req.body;
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/catalog');

  const frete = calcularFrete(parseFloat(km));
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = subtotal + frete;

  res.render('payment', { cart, frete, total, title: 'Pagamento - Silva & Silveira' });
});

app.post('/payment/process', (req, res) => {
  const { paymentMethod } = req.body;
  req.session.cart = [];
  res.render('payment-success', { title: 'Pagamento Realizado - Silva & Silveira', paymentMethod });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login / Cadastro - Silva & Silveira', error: null });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.render('login', { title: 'Login / Cadastro - Silva & Silveira', error: 'Email ou senha inválidos' });
  }
  req.session.user = user;
  res.redirect('/');
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.render('login', { title: 'Login / Cadastro - Silva & Silveira', error: 'Email já cadastrado' });
  }
  const newUser  = { id: users.length + 1, name, email, password };
  users.push(newUser );
  req.session.user = newUser ;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/reviews', (req, res) => {
  res.render('reviews', { reviews, title: 'Avaliações - Silva & Silveira' });
});

app.post('/reviews', (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }
  reviews.push({ name, rating: parseInt(rating), comment, date: new Date() });
  res.redirect('/reviews');
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contato - Silva & Silveira' });
});

app.get('/sac', (req, res) => {
  res.redirect('https://wa.me/5519991417120');
});

app.use((req, res, next) => {
  res.setHeader('X-UA-Compatible', 'IE=edge');
  res.setHeader('Content-Language', 'pt-BR');
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
