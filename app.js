// ══════════════════════════════════════════════════════════════
//  MOVIFIT — app.js v1.0 (Fase 1)
//  Firebase Auth + Firestore + Navegação
// ══════════════════════════════════════════════════════════════

// ── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCMfqfmiS1wG7uzvGAQC9zKjiQGHZ-EHz0",
  authDomain: "movifit-c19ec.firebaseapp.com",
  projectId: "movifit-c19ec",
  storageBucket: "movifit-c19ec.firebasestorage.app",
  messagingSenderId: "1034109961193",
  appId: "1:1034109961193:web:e17ad3d8fd7ba9c31c0178"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ── Estado Global ────────────────────────────────────────────
var currentUser = null;
var userData = null;
var unsubscribeProfile = null;

// ══════════════════════════════════════════════════════════════
//  INICIALIZAÇÃO — Escuta mudanças de autenticação
// ══════════════════════════════════════════════════════════════
auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    carregarPerfil(user.uid);
  } else {
    currentUser = null;
    userData = null;
    if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }
    mostrarAuth();
  }
});

// ══════════════════════════════════════════════════════════════
//  TELAS — Mostrar/Esconder
// ══════════════════════════════════════════════════════════════
function mostrarAuth() {
  document.getElementById('ldScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

function mostrarApp() {
  document.getElementById('ldScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  atualizarUI();
}

function mostrarLoading(texto) {
  document.getElementById('ldText').textContent = texto || 'Carregando...';
  document.getElementById('ldScreen').classList.remove('hidden');
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Login com Email/Senha
// ══════════════════════════════════════════════════════════════
function fazerLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var senha = document.getElementById('loginPass').value.trim();
  var err = document.getElementById('authError');
  var btn = document.getElementById('loginBtn');

  err.textContent = '';

  if (!email || !senha) {
    err.textContent = 'Preencha e-mail e senha';
    shakeAuth();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

  auth.signInWithEmailAndPassword(email, senha)
    .then(function() {
      // onAuthStateChanged cuida do resto
    })
    .catch(function(error) {
      var msg = traduzirErro(error.code);
      err.textContent = msg;
      shakeAuth();
    })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    });
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Login com Google
// ══════════════════════════════════════════════════════════════
function loginGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  var err = document.getElementById('authError');
  err.textContent = '';

  mostrarLoading('Conectando com Google...');

  auth.signInWithPopup(provider)
    .then(function(result) {
      var user = result.user;
      var isNew = result.additionalUserInfo && result.additionalUserInfo.isNewUser;

      if (isNew) {
        // Criar perfil no Firestore para novo usuário Google
        return db.collection('users').doc(user.uid).set({
          nome: user.displayName || '',
          email: user.email,
          tipo: 'aluno',
          objetivo: '',
          idade: null,
          peso: null,
          altura: null,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    })
    .catch(function(error) {
      document.getElementById('ldScreen').classList.add('hidden');
      if (error.code !== 'auth/popup-closed-by-user') {
        err.textContent = traduzirErro(error.code);
        shakeAuth();
      }
    });
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Cadastro
// ══════════════════════════════════════════════════════════════
var tipoSelecionado = 'aluno';

function selecionarTipo(btn, tipo) {
  tipoSelecionado = tipo;
  document.querySelectorAll('.tipo-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

function fazerCadastro() {
  var lgpd = document.getElementById('lgpdCheck');
if (lgpd && !lgpd.checked) { err.textContent = 'Aceite os termos da LGPD para criar sua conta'; shakeAuth(); return; }
  var nome = document.getElementById('cadNome').value.trim();
  var email = document.getElementById('cadEmail').value.trim();
  var senha = document.getElementById('cadPass').value.trim();
  var senha2 = document.getElementById('cadPass2').value.trim();
  var err = document.getElementById('authError');
  var btn = document.getElementById('cadBtn');

  err.textContent = '';
  
var lgpd = document.getElementById('lgpdCheck');
if (lgpd && !lgpd.checked) { err.textContent = 'Aceite os termos da LGPD para criar sua conta'; shakeAuth(); return; }

  if (!nome) { err.textContent = 'Informe seu nome'; shakeAuth(); return; }
  if (!email) { err.textContent = 'Informe seu e-mail'; shakeAuth(); return; }
  if (senha.length < 6) { err.textContent = 'Senha deve ter no mínimo 6 caracteres'; shakeAuth(); return; }
  if (senha !== senha2) { err.textContent = 'As senhas não conferem'; shakeAuth(); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';

  auth.createUserWithEmailAndPassword(email, senha)
    .then(function(result) {
      var user = result.user;

      // Atualizar nome no Auth
      user.updateProfile({ displayName: nome });

      // Criar perfil no Firestore
      return db.collection('users').doc(user.uid).set({
        nome: nome,
        email: email,
        tipo: tipoSelecionado,
        objetivo: '',
        idade: null,
        peso: null,
        altura: null,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(function() {
      // onAuthStateChanged cuida do resto
    })
    .catch(function(error) {
      var msg = traduzirErro(error.code);
      err.textContent = msg;
      shakeAuth();
    })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
    });
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Alternar Login/Cadastro
// ══════════════════════════════════════════════════════════════
function mostrarCadastro() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('cadastroForm').classList.remove('hidden');
  document.getElementById('authError').textContent = '';
}

function mostrarLogin() {
  document.getElementById('cadastroForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('authError').textContent = '';
}

function toggleSenha(inputId, eyeId) {
  var inp = document.getElementById(inputId);
  var eye = document.getElementById(eyeId);
  if (inp.type === 'password') { inp.type = 'text'; eye.textContent = '🙈'; }
  else { inp.type = 'password'; eye.textContent = '👁️'; }
}

function shakeAuth() {
  var c = document.querySelector('.auth-card');
  c.classList.add('shake');
  setTimeout(function() { c.classList.remove('shake'); }, 500);
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Logout
// ══════════════════════════════════════════════════════════════
function fazerLogout() {
  if (!confirm('Deseja sair da sua conta?')) return;
  mostrarLoading('Saindo...');
  auth.signOut().then(function() {
    // onAuthStateChanged cuida do resto
  });
}

// ══════════════════════════════════════════════════════════════
//  AUTH — Traduzir Erros do Firebase
// ══════════════════════════════════════════════════════════════
function traduzirErro(code) {
  var erros = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado',
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos',
    'auth/network-request-failed': 'Sem conexão com a internet',
    'auth/popup-closed-by-user': 'Login cancelado',
    'auth/invalid-credential': 'E-mail ou senha incorretos',
    'auth/missing-password': 'Informe a senha'
  };
  return erros[code] || 'Erro: ' + code;
}

// ══════════════════════════════════════════════════════════════
//  PERFIL — Carregar dados do Firestore
// ══════════════════════════════════════════════════════════════
function carregarPerfil(uid) {
  mostrarLoading('Carregando seu perfil...');

  // Listener em tempo real — atualiza automaticamente
  unsubscribeProfile = db.collection('users').doc(uid).onSnapshot(function(doc) {
    if (doc.exists) {
      userData = doc.data();
      userData.uid = uid;
      mostrarApp();
    } else {
      // Usuário autenticado mas sem perfil (possível erro)
      // Criar perfil básico
      var user = auth.currentUser;
      db.collection('users').doc(uid).set({
        nome: user.displayName || user.email.split('@')[0],
        email: user.email,
        tipo: 'aluno',
        objetivo: '',
        idade: null,
        peso: null,
        altura: null,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        // onSnapshot vai disparar novamente com os dados
      });
    }
  }, function(error) {
    console.error('Erro ao carregar perfil:', error);
    toast('Erro ao carregar perfil');
    document.getElementById('ldScreen').classList.add('hidden');
  });
}

// ══════════════════════════════════════════════════════════════
//  PERFIL — Salvar alterações
// ══════════════════════════════════════════════════════════════
function salvarPerfil() {
  if (!currentUser) return;

  var nome = document.getElementById('perfilNome').value.trim();
  var idade = document.getElementById('perfilIdade').value;
  var peso = document.getElementById('perfilPeso').value;
  var altura = document.getElementById('perfilAltura').value;
  var objetivo = document.getElementById('perfilObjetivo').value;

  if (!nome) { toast('Informe seu nome'); return; }

  var btn = document.querySelector('#perfilModal .submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  var dados = {
    nome: nome,
    idade: idade ? parseInt(idade) : null,
    peso: peso ? parseFloat(peso) : null,
    altura: altura ? parseInt(altura) : null,
    objetivo: objetivo,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection('users').doc(currentUser.uid).update(dados)
    .then(function() {
      // Atualizar nome no Auth também
      currentUser.updateProfile({ displayName: nome });
      showSuccess('✅', 'Perfil atualizado!', '');
      fecharPerfil();
    })
    .catch(function(error) {
      toast('Erro ao salvar: ' + error.message);
    })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Salvar Perfil';
    });
}

// ══════════════════════════════════════════════════════════════
//  PERFIL — Abrir/Fechar Modal
// ══════════════════════════════════════════════════════════════
function abrirPerfil() {
  if (!userData) return;

  document.getElementById('perfilNome').value = userData.nome || '';
  document.getElementById('perfilEmail').value = userData.email || '';
  document.getElementById('perfilTipo').value = userData.tipo === 'personal' ? 'Personal Trainer' : 'Aluno';
  document.getElementById('perfilIdade').value = userData.idade || '';
  document.getElementById('perfilPeso').value = userData.peso || '';
  document.getElementById('perfilAltura').value = userData.altura || '';
  document.getElementById('perfilObjetivo').value = userData.objetivo || '';

  document.getElementById('perfilModal').classList.add('show');
}

function fecharPerfil() {
  document.getElementById('perfilModal').classList.remove('show');
}

// ══════════════════════════════════════════════════════════════
//  UI — Atualizar interface com dados do usuário
// ══════════════════════════════════════════════════════════════
function atualizarUI() {
  if (!userData) return;

  var primeiroNome = (userData.nome || 'Usuário').split(' ')[0];

  // Top bar
  document.getElementById('userBadge').textContent = primeiroNome;
  document.getElementById('topBarSub').textContent = userData.tipo === 'personal' ? 'Personal Trainer' : 'Aluno';
  document.getElementById('badgeTipo').textContent = userData.tipo === 'personal' ? 'Personal' : 'Aluno';

  // Home
  var isPersonal = userData.tipo === 'personal';
  document.getElementById('homeAluno').classList.toggle('hidden', isPersonal);
  document.getElementById('homePersonal').classList.toggle('hidden', !isPersonal);

  if (isPersonal) {
    carregarDashPersonal();
  } else {
    document.getElementById('homeNome').textContent = primeiroNome;
    carregarDashAluno();
  }
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD — Aluno
// ══════════════════════════════════════════════════════════════
function carregarDashAluno() {
  if (!currentUser) return;

  // Buscar treinos realizados
  db.collection('users').doc(currentUser.uid).collection('treinos')
    .orderBy('data', 'desc')
    .limit(30)
    .get()
    .then(function(snapshot) {
      var treinos = [];
      snapshot.forEach(function(doc) {
        treinos.push(doc.data());
      });

      // Stats
      var total = treinos.length;
      var tempoTotal = 0;
      var hoje = new Date();
      var inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      var estaSemana = 0;
      var sequencia = calcularSequencia(treinos);

      treinos.forEach(function(t) {
        tempoTotal += t.duracao || 0;
        var dataTreino = t.data ? t.data.toDate() : new Date(0);
        if (dataTreino >= inicioSemana) estaSemana++;
      });

      document.getElementById('statTotal').textContent = total;
      document.getElementById('statSemana').textContent = estaSemana;
      document.getElementById('statSequencia').textContent = sequencia;
      document.getElementById('statTempo').textContent = formatarTempo(tempoTotal);

      // Último treino
      renderUltimoTreino(treinos[0] || null);
    })
    .catch(function(error) {
      console.error('Erro ao carregar treinos:', error);
    });

  // Buscar ficha ativa para "Treino de Hoje"
  db.collection('users').doc(currentUser.uid).collection('fichas')
    .where('ativa', '==', true)
    .limit(1)
    .get()
    .then(function(snapshot) {
      if (!snapshot.empty) {
        var ficha = snapshot.docs[0].data();
        ficha.id = snapshot.docs[0].id;
        renderTreinoHoje(ficha);
      }
    })
    .catch(function(error) {
      console.error('Erro ao carregar ficha:', error);
    });
}

function calcularSequencia(treinos) {
  if (treinos.length === 0) return 0;

  var seq = 0;
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (var i = 0; i < treinos.length; i++) {
    var dataTreino = treinos[i].data ? treinos[i].data.toDate() : null;
    if (!dataTreino) break;

    var dTreino = new Date(dataTreino);
    dTreino.setHours(0, 0, 0, 0);

    var diffDias = Math.round((hoje - dTreino) / (1000 * 60 * 60 * 24));

    if (diffDias === seq || diffDias === seq + 1) {
      seq++;
    } else {
      break;
    }
  }

  return seq;
}

function renderTreinoHoje(ficha) {
  var el = document.getElementById('treinoHoje');
  if (!ficha) return;

  // Determinar qual divisão treinar hoje (rotação simples)
  var divisoes = ficha.divisoes || [];
  if (divisoes.length === 0) return;

  var diaSemana = new Date().getDay();
  var indice = diaSemana % divisoes.length;
  var divisao = divisoes[indice];

  var exerciciosTexto = '';
  if (divisao.exercicios && divisao.exercicios.length > 0) {
    var nomes = divisao.exercicios.map(function(ex) { return ex.nome; });
    exerciciosTexto = nomes.slice(0, 4).join(' • ');
    if (nomes.length > 4) exerciciosTexto += ' +' + (nomes.length - 4);
  }

  el.innerHTML =
    '<div class="treino-hoje-info">' +
      '<div class="treino-hoje-badge">' + (divisao.letra || 'A') + '</div>' +
      '<div class="treino-hoje-text">' +
        '<h3>' + escapeHtml(divisao.nome || 'Treino ' + divisao.letra) + '</h3>' +
        '<p>' + (divisao.exercicios ? divisao.exercicios.length : 0) + ' exercícios</p>' +
      '</div>' +
    '</div>' +
    (exerciciosTexto ? '<div class="treino-hoje-exercicios">' + escapeHtml(exerciciosTexto) + '</div>' : '') +
    '<button class="treino-hoje-btn" onclick="iniciarTreino(\'' + ficha.id + '\',' + indice + ')">' +
      '<i class="fas fa-play"></i> Iniciar Treino' +
    '</button>';
}

function renderUltimoTreino(treino) {
  var el = document.getElementById('ultimoTreino');
  if (!treino) return;

  var data = treino.data ? treino.data.toDate() : new Date();
  var dataStr = data.toLocaleDateString('pt-BR');
  var duracao = formatarTempo(treino.duracao || 0);

  el.innerHTML =
    '<div class="aluno-card" style="cursor:default;">' +
      '<div class="aluno-avatar" style="background:var(--green-soft); color:var(--green);">✅</div>' +
      '<div class="aluno-info">' +
        '<div class="aluno-nome">' + escapeHtml(treino.divisaoNome || 'Treino') + '</div>' +
        '<div class="aluno-meta">' + dataStr + ' • ' + duracao + ' • ' + (treino.exerciciosFeitos || 0) + ' exercícios</div>' +
      '</div>' +
    '</div>';
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD — Personal
// ══════════════════════════════════════════════════════════════
function carregarDashPersonal() {
  if (!currentUser) return;

  db.collection('users').doc(currentUser.uid).collection('alunos')
    .get()
    .then(function(snapshot) {
      var totalAlunos = snapshot.size;
      document.getElementById('statAlunos').textContent = totalAlunos;

      if (totalAlunos === 0) return;

      var alunoIds = [];
      snapshot.forEach(function(doc) { alunoIds.push(doc.data()); });

      renderListaAlunos(alunoIds);
      contarEstatisticasPersonal(alunoIds);
    })
    .catch(function(error) {
      console.error('Erro ao carregar alunos:', error);
    });
}

function renderListaAlunos(alunos) {
  var el = document.getElementById('listaAlunosPersonal');
  if (alunos.length === 0) return;

  var html = '';
  alunos.forEach(function(a) {
    var iniciais = (a.nome || '??').substring(0, 2).toUpperCase();
    var statusCls = 'ativo';
    var statusTxt = 'Ativo';

    if (a.ultimoTreino) {
      var diff = Math.round((new Date() - a.ultimoTreino.toDate()) / (1000 * 60 * 60 * 24));
      if (diff > 3) { statusCls = 'inativo'; statusTxt = diff + 'd sem treinar'; }
    } else {
      statusCls = 'inativo'; statusTxt = 'Sem treinos';
    }

    html +=
      '<div class="aluno-card" onclick="abrirAluno(\'' + (a.alunoId || '') + '\')">' +
        '<div class="aluno-avatar">' + iniciais + '</div>' +
        '<div class="aluno-info">' +
          '<div class="aluno-nome">' + escapeHtml(a.nome || 'Aluno') + '</div>' +
          '<div class="aluno-meta">' + escapeHtml(a.objetivo || 'Sem objetivo definido') + '</div>' +
        '</div>' +
        '<span class="aluno-status ' + statusCls + '">' + statusTxt + '</span>' +
      '</div>';
  });

  el.innerHTML = html;
}

function contarEstatisticasPersonal(alunos) {
  // Simplificado — conta fichas e inativos
  var inativos = 0;
  var treinaHoje = 0;
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  alunos.forEach(function(a) {
    if (a.ultimoTreino) {
      var dataTreino = a.ultimoTreino.toDate();
      var dTreino = new Date(dataTreino);
      dTreino.setHours(0, 0, 0, 0);

      var diff = Math.round((hoje - dTreino) / (1000 * 60 * 60 * 24));
      if (diff > 3) inativos++;
      if (diff === 0) treinaHoje++;
    } else {
      inativos++;
    }
  });

  document.getElementById('statInativos').textContent = inativos;
  document.getElementById('statTreinaHoje').textContent = treinaHoje;
}


// ══════════════════════════════════════════════════════════════
//  HELPERS — Utilitários
// ══════════════════════════════════════════════════════════════
function formatarTempo(minutos) {
  if (!minutos || minutos === 0) return '0h';
  var h = Math.floor(minutos / 60);
  var m = minutos % 60;
  if (h === 0) return m + 'min';
  if (m === 0) return h + 'h';
  return h + 'h' + m + 'min';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showSuccess(icon, msg, detail) {
  document.getElementById('successIcon').textContent = icon;
  document.getElementById('successMsg').textContent = msg;
  document.getElementById('successDetail').textContent = detail || '';
  var ov = document.getElementById('successOverlay');
  ov.classList.add('show');
  setTimeout(function() { ov.classList.remove('show'); }, 3000);
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3500);
}

// ══════════════════════════════════════════════════════════════
//  FASE 2 — SISTEMA DE TREINOS
// ══════════════════════════════════════════════════════════════

// ── Biblioteca de Exercícios ─────────────────────────────────
var EXERCICIOS_DB = [
  // PEITO
  { nome: 'Supino Reto', grupo: 'peito', icon: '🏋️' },
  { nome: 'Supino Inclinado', grupo: 'peito', icon: '🏋️' },
  { nome: 'Supino Declinado', grupo: 'peito', icon: '🏋️' },
  { nome: 'Supino com Halteres', grupo: 'peito', icon: '🏋️' },
  { nome: 'Crucifixo Reto', grupo: 'peito', icon: '🦋' },
  { nome: 'Crucifixo Inclinado', grupo: 'peito', icon: '🦋' },
  { nome: 'Peck Deck', grupo: 'peito', icon: '🦾' },
  { nome: 'Crossover', grupo: 'peito', icon: '🔀' },
  { nome: 'Flexão de Braço', grupo: 'peito', icon: '💪' },
  { nome: 'Pullover', grupo: 'peito', icon: '🏋️' },

  // COSTAS
  { nome: 'Puxada Frontal', grupo: 'costas', icon: '🔽' },
  { nome: 'Puxada Atrás', grupo: 'costas', icon: '🔽' },
  { nome: 'Puxada Triângulo', grupo: 'costas', icon: '🔽' },
  { nome: 'Remada Curvada', grupo: 'costas', icon: '🚣' },
  { nome: 'Remada Unilateral', grupo: 'costas', icon: '🚣' },
  { nome: 'Remada Cavalinho', grupo: 'costas', icon: '🚣' },
  { nome: 'Remada Baixa', grupo: 'costas', icon: '🚣' },
  { nome: 'Barra Fixa', grupo: 'costas', icon: '🔝' },
  { nome: 'Pulldown', grupo: 'costas', icon: '🔽' },
  { nome: 'Levantamento Terra', grupo: 'costas', icon: '⬆️' },

  // OMBROS
  { nome: 'Desenvolvimento Militar', grupo: 'ombros', icon: '🎖️' },
  { nome: 'Desenvolvimento com Halteres', grupo: 'ombros', icon: '🎖️' },
  { nome: 'Elevação Lateral', grupo: 'ombros', icon: '🔄' },
  { nome: 'Elevação Frontal', grupo: 'ombros', icon: '⬆️' },
  { nome: 'Crucifixo Inverso', grupo: 'ombros', icon: '🦋' },
  { nome: 'Encolhimento', grupo: 'ombros', icon: '🔼' },
  { nome: 'Face Pull', grupo: 'ombros', icon: '🎯' },
  { nome: 'Arnold Press', grupo: 'ombros', icon: '💪' },

  // BÍCEPS
  { nome: 'Rosca Direta', grupo: 'biceps', icon: '💪' },
  { nome: 'Rosca Alternada', grupo: 'biceps', icon: '💪' },
  { nome: 'Rosca Martelo', grupo: 'biceps', icon: '🔨' },
  { nome: 'Rosca Concentrada', grupo: 'biceps', icon: '🎯' },
  { nome: 'Rosca Scott', grupo: 'biceps', icon: '💪' },
  { nome: 'Rosca no Cabo', grupo: 'biceps', icon: '🔄' },
  { nome: 'Rosca 21', grupo: 'biceps', icon: '🔥' },

  // TRÍCEPS
  { nome: 'Tríceps Pulley', grupo: 'triceps', icon: '🔽' },
  { nome: 'Tríceps Corda', grupo: 'triceps', icon: '🪢' },
  { nome: 'Tríceps Testa', grupo: 'triceps', icon: '🏋️' },
  { nome: 'Tríceps Francês', grupo: 'triceps', icon: '🏋️' },
  { nome: 'Mergulho', grupo: 'triceps', icon: '⬇️' },
  { nome: 'Tríceps Coice', grupo: 'triceps', icon: '🦵' },
  { nome: 'Supino Fechado', grupo: 'triceps', icon: '🏋️' },

  // PERNAS
  { nome: 'Agachamento Livre', grupo: 'pernas', icon: '🦵' },
  { nome: 'Agachamento Smith', grupo: 'pernas', icon: '🦵' },
  { nome: 'Agachamento Sumô', grupo: 'pernas', icon: '🦵' },
  { nome: 'Leg Press', grupo: 'pernas', icon: '🦿' },
  { nome: 'Leg Press 45°', grupo: 'pernas', icon: '🦿' },
  { nome: 'Cadeira Extensora', grupo: 'pernas', icon: '🦵' },
  { nome: 'Mesa Flexora', grupo: 'pernas', icon: '🦵' },
  { nome: 'Cadeira Flexora', grupo: 'pernas', icon: '🦵' },
  { nome: 'Cadeira Adutora', grupo: 'pernas', icon: '🦵' },
  { nome: 'Cadeira Abdutora', grupo: 'pernas', icon: '🦵' },
  { nome: 'Panturrilha em Pé', grupo: 'pernas', icon: '🦶' },
  { nome: 'Panturrilha Sentado', grupo: 'pernas', icon: '🦶' },
  { nome: 'Stiff', grupo: 'pernas', icon: '🏋️' },
  { nome: 'Passada', grupo: 'pernas', icon: '🚶' },
  { nome: 'Avanço', grupo: 'pernas', icon: '🚶' },
  { nome: 'Hack Squat', grupo: 'pernas', icon: '🦵' },

  // GLÚTEOS
  { nome: 'Hip Thrust', grupo: 'gluteos', icon: '🍑' },
  { nome: 'Elevação Pélvica', grupo: 'gluteos', icon: '🍑' },
  { nome: 'Glúteo na Polia', grupo: 'gluteos', icon: '🍑' },
  { nome: 'Coice na Máquina', grupo: 'gluteos', icon: '🍑' },
  { nome: 'Agachamento Búlgaro', grupo: 'gluteos', icon: '🦵' },
  { nome: 'Abdução no Cabo', grupo: 'gluteos', icon: '🍑' },

  // ABDÔMEN
  { nome: 'Abdominal Crunch', grupo: 'abdomen', icon: '🔥' },
  { nome: 'Abdominal Infra', grupo: 'abdomen', icon: '🔥' },
  { nome: 'Prancha', grupo: 'abdomen', icon: '🧘' },
  { nome: 'Prancha Lateral', grupo: 'abdomen', icon: '🧘' },
  { nome: 'Russian Twist', grupo: 'abdomen', icon: '🔄' },
  { nome: 'Abdominal na Máquina', grupo: 'abdomen', icon: '🔥' },
  { nome: 'Elevação de Pernas', grupo: 'abdomen', icon: '⬆️' },
  { nome: 'Roda Abdominal', grupo: 'abdomen', icon: '🛞' },

  // CARDIO
  { nome: 'Esteira', grupo: 'cardio', icon: '🏃' },
  { nome: 'Bicicleta Ergométrica', grupo: 'cardio', icon: '🚴' },
  { nome: 'Elíptico', grupo: 'cardio', icon: '🏃' },
  { nome: 'Escada', grupo: 'cardio', icon: '🪜' },
  { nome: 'Pular Corda', grupo: 'cardio', icon: '⏭️' },
  { nome: 'HIIT', grupo: 'cardio', icon: '🔥' },
  { nome: 'Remo', grupo: 'cardio', icon: '🚣' }
];

var GRUPO_ICONS = {
  peito: '🏋️', costas: '🔽', ombros: '🎖️', biceps: '💪',
  triceps: '🔽', pernas: '🦵', gluteos: '🍑', abdomen: '🔥', cardio: '🏃'
};

var GRUPO_NOMES = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps',
  triceps: 'Tríceps', pernas: 'Pernas', gluteos: 'Glúteos', abdomen: 'Abdômen', cardio: 'Cardio'
};

// ── Estado da Fase 2 ─────────────────────────────────────────
var fichaAtual = { divisoes: [] };
var divisaoAlvoIndex = -1;
var exercicioSelecionado = null;
var grupoFiltro = 'todos';

var treinoEmAndamento = null;
var cronometroInterval = null;
var cronometroSegundos = 0;
var timerInterval = null;
var timerSegundos = 0;

// ══════════════════════════════════════════════════════════════
//  NAVEGAÇÃO ATUALIZADA
// ══════════════════════════════════════════════════════════════
function navegarPara(tela) {
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  var navBtn = document.getElementById('nav' + tela.charAt(0).toUpperCase() + tela.slice(1));
  if (navBtn) navBtn.classList.add('active');

  // Esconder todas as telas
  document.getElementById('homeAluno').classList.add('hidden');
  document.getElementById('homePersonal').classList.add('hidden');
  document.getElementById('telaFichas').classList.add('hidden');
  document.getElementById('telaHistorico').classList.add('hidden');

  switch(tela) {
    case 'home':
      var isPersonal = userData && userData.tipo === 'personal';
      if (isPersonal) {
        document.getElementById('homePersonal').classList.remove('hidden');
        carregarDashPersonal();
      } else {
        document.getElementById('homeAluno').classList.remove('hidden');
        carregarDashAluno();
      }
      break;
    case 'fichas':
      document.getElementById('telaFichas').classList.remove('hidden');
      carregarFichas();
      break;
    case 'historico':
      document.getElementById('telaHistorico').classList.remove('hidden');
      carregarHistorico();
      break;
    case 'perfil':
      abrirPerfil();
      // Mostrar home por baixo
      var isP = userData && userData.tipo === 'personal';
      if (isP) document.getElementById('homePersonal').classList.remove('hidden');
      else document.getElementById('homeAluno').classList.remove('hidden');
      break;
  }
}

// ══════════════════════════════════════════════════════════════
//  FICHAS — CRUD
// ══════════════════════════════════════════════════════════════
function carregarFichas() {
  if (!currentUser) return;

  var el = document.getElementById('listaFichas');
  el.innerHTML = '<div style="text-align:center;padding:20px;"><div class="ld-spinner" style="margin:0 auto;border-top-color:var(--orange);"></div></div>';

  db.collection('users').doc(currentUser.uid).collection('fichas')
    .orderBy('criadaEm', 'desc')
    .get()
    .then(function(snapshot) {
      if (snapshot.empty) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Nenhuma ficha criada ainda</div></div>';
        return;
      }

      var html = '';
      snapshot.forEach(function(doc) {
        var f = doc.data();
        f.id = doc.id;
        html += renderFichaCard(f);
      });
      el.innerHTML = html;
    })
    .catch(function(error) {
      el.innerHTML = '<div class="empty-state"><div class="empty-text" style="color:var(--red);">Erro ao carregar fichas</div></div>';
    });
}

function renderFichaCard(f) {
  var divisoesChips = '';
  if (f.divisoes && f.divisoes.length > 0) {
    f.divisoes.forEach(function(d, i) {
      divisoesChips += '<span class="ficha-divisao-chip" onclick="event.stopPropagation(); iniciarTreinoDivisao(\'' + f.id + '\',' + i + ')">' + (d.letra || String.fromCharCode(65 + i)) + ' — ' + escapeHtml(d.nome || 'Sem nome') + ' (' + (d.exercicios ? d.exercicios.length : 0) + ' ex)</span>';
    });
  }

  var totalEx = 0;
  if (f.divisoes) f.divisoes.forEach(function(d) { totalEx += (d.exercicios ? d.exercicios.length : 0); });

  return '<div class="ficha-card">' +
    '<div class="ficha-card-header">' +
      '<div class="ficha-card-info">' +
        '<div class="ficha-card-badge">' + (f.divisoes ? f.divisoes.length : 0) + '</div>' +
        '<div>' +
          '<div class="ficha-card-nome">' + escapeHtml(f.nome || 'Sem nome') + '</div>' +
          '<div class="ficha-card-meta">' + totalEx + ' exercícios • ' + (f.objetivo || 'Geral') + (f.ativa ? ' • ' : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ficha-card-actions">' +
        (f.ativa ? '<span class="ficha-ativa-badge">✓ Ativa</span>' : '<button class="ficha-action-btn" onclick="event.stopPropagation(); ativarFicha(\'' + f.id + '\')" title="Ativar"><i class="fas fa-check"></i></button>') +
        '<button class="ficha-action-btn" onclick="event.stopPropagation(); editarFicha(\'' + f.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="ficha-action-btn delete" onclick="event.stopPropagation(); excluirFicha(\'' + f.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>' +
    '</div>' +
    '<div class="ficha-card-divisoes">' + divisoesChips + '</div>' +
    '<button class="ficha-iniciar-btn" onclick="selecionarDivisaoParaTreino(\'' + f.id + '\')">' +
      '<i class="fas fa-play"></i> Iniciar Treino' +
    '</button>' +
  '</div>';
}

function abrirCriarFicha() {
  fichaAtual = { divisoes: [] };
  document.getElementById('fichaEditId').value = '';
  document.getElementById('fichaNome').value = '';
  document.getElementById('fichaObjetivo').value = 'hipertrofia';
  document.getElementById('fichaModalTitulo').textContent = 'Nova Ficha';
  renderDivisoes();
  document.getElementById('fichaModal').classList.add('show');
}

function editarFicha(fichaId) {
  if (!currentUser) return;

  db.collection('users').doc(currentUser.uid).collection('fichas').doc(fichaId).get()
    .then(function(doc) {
      if (!doc.exists) { toast('Ficha não encontrada'); return; }
      var f = doc.data();
      fichaAtual = { divisoes: f.divisoes || [] };
      document.getElementById('fichaEditId').value = fichaId;
      document.getElementById('fichaNome').value = f.nome || '';
      document.getElementById('fichaObjetivo').value = f.objetivo || 'hipertrofia';
      document.getElementById('fichaModalTitulo').textContent = 'Editar Ficha';
      renderDivisoes();
      document.getElementById('fichaModal').classList.add('show');
    });
}

function fecharFichaModal() {
  document.getElementById('fichaModal').classList.remove('show');
}

function salvarFicha() {
  if (!currentUser) return;
  var nome = document.getElementById('fichaNome').value.trim();
  var objetivo = document.getElementById('fichaObjetivo').value;
  var editId = document.getElementById('fichaEditId').value;

  if (!nome) { toast('Informe o nome da ficha'); return; }
  if (fichaAtual.divisoes.length === 0) { toast('Adicione pelo menos uma divisão'); return; }

  // Coletar nomes das divisões dos inputs
  fichaAtual.divisoes.forEach(function(d, i) {
    var input = document.getElementById('divNome_' + i);
    if (input) d.nome = input.value.trim() || ('Treino ' + d.letra);
  });

  var btn = document.getElementById('btnSalvarFicha');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  var dados = {
    nome: nome,
    objetivo: objetivo,
    divisoes: fichaAtual.divisoes,
    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  var ref = db.collection('users').doc(currentUser.uid).collection('fichas');

  var promise;
  if (editId) {
    promise = ref.doc(editId).update(dados);
  } else {
    dados.criadaEm = firebase.firestore.FieldValue.serverTimestamp();
    dados.ativa = false;
    promise = ref.add(dados);
  }

  promise
    .then(function() {
      showSuccess('📋', editId ? 'Ficha atualizada!' : 'Ficha criada!', nome);
      fecharFichaModal();
      carregarFichas();
      carregarDashAluno();
    })
    .catch(function(error) { toast('Erro ao salvar: ' + error.message); })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Salvar Ficha';
    });
}

function ativarFicha(fichaId) {
  if (!currentUser) return;

  var ref = db.collection('users').doc(currentUser.uid).collection('fichas');

  // Desativar todas primeiro
  ref.where('ativa', '==', true).get().then(function(snapshot) {
    var batch = db.batch();
    snapshot.forEach(function(doc) { batch.update(doc.ref, { ativa: false }); });
    batch.update(ref.doc(fichaId), { ativa: true });
    return batch.commit();
  }).then(function() {
    toast('✅ Ficha ativada!');
    carregarFichas();
    carregarDashAluno();
  });
}

function excluirFicha(fichaId) {
  if (!confirm('Excluir esta ficha? Essa ação não pode ser desfeita.')) return;

  db.collection('users').doc(currentUser.uid).collection('fichas').doc(fichaId).delete()
    .then(function() {
      toast('🗑️ Ficha excluída');
      carregarFichas();
    });
}
// ══════════════════════════════════════════════════════════════
//  DIVISÕES — Gerenciar dentro da ficha
// ══════════════════════════════════════════════════════════════
function adicionarDivisao() {
  var letra = String.fromCharCode(65 + fichaAtual.divisoes.length);
  fichaAtual.divisoes.push({
    letra: letra,
    nome: '',
    exercicios: []
  });
  renderDivisoes();
}

function removerDivisao(index) {
  fichaAtual.divisoes.splice(index, 1);
  // Reatribuir letras
  fichaAtual.divisoes.forEach(function(d, i) {
    d.letra = String.fromCharCode(65 + i);
  });
  renderDivisoes();
}

function renderDivisoes() {
  var el = document.getElementById('divisoesList');
  if (fichaAtual.divisoes.length === 0) {
    el.innerHTML = '<div class="empty-state small"><div class="empty-text" style="font-size:.8rem; color:var(--text-tertiary);">Clique abaixo para adicionar divisões (A, B, C...)</div></div>';
    return;
  }

  var html = '';
  fichaAtual.divisoes.forEach(function(d, i) {
    html += '<div class="divisao-card">';
    html += '<div class="divisao-header">';
    html += '<div class="divisao-letra">' + d.letra + '</div>';
    html += '<input type="text" class="divisao-nome-input" id="divNome_' + i + '" value="' + escapeHtml(d.nome || '') + '" placeholder="Ex: Peito e Tríceps">';
    html += '<button class="divisao-remove" onclick="removerDivisao(' + i + ')"><i class="fas fa-times"></i></button>';
    html += '</div>';

    // Exercícios da divisão
    html += '<div class="divisao-exercicios">';
    if (d.exercicios && d.exercicios.length > 0) {
      d.exercicios.forEach(function(ex, j) {
        html += '<div class="divisao-ex-item">';
        html += '<div class="ex-item-icon ' + ex.grupo + '">' + (GRUPO_ICONS[ex.grupo] || '🏋️') + '</div>';
        html += '<div class="ex-item-info">';
        html += '<div class="ex-item-nome">' + escapeHtml(ex.nome) + '</div>';
        html += '<div class="ex-item-config">' + ex.series + 'x' + ex.reps + (ex.carga > 0 ? ' • ' + ex.carga + 'kg' : '') + (ex.descanso ? ' • ' + ex.descanso + 's' : '') + '</div>';
        html += '</div>';
        html += '<button class="ex-item-remove" onclick="removerExercicio(' + i + ',' + j + ')"><i class="fas fa-times"></i></button>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<button class="divisao-add-ex" onclick="abrirAdicionarExercicio(' + i + ')">';
    html += '<i class="fas fa-plus"></i> Adicionar Exercício';
    html += '</button>';
    html += '</div>';
  });

  el.innerHTML = html;
}

function removerExercicio(divIndex, exIndex) {
  fichaAtual.divisoes[divIndex].exercicios.splice(exIndex, 1);
  renderDivisoes();
}

// ══════════════════════════════════════════════════════════════
//  BIBLIOTECA DE EXERCÍCIOS — Modal
// ══════════════════════════════════════════════════════════════
function abrirAdicionarExercicio(divIndex) {
  divisaoAlvoIndex = divIndex;
  grupoFiltro = 'todos';
  document.getElementById('buscaExercicio').value = '';
  renderBiblioteca(EXERCICIOS_DB);

  // Reset filtro buttons
  document.querySelectorAll('#filtroGrupo .filtro-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#filtroGrupo .filtro-btn').classList.add('active');

  document.getElementById('exercicioModal').classList.add('show');
}

function fecharExercicioModal() {
  document.getElementById('exercicioModal').classList.remove('show');
}

function filtrarGrupo(grupo, btn) {
  grupoFiltro = grupo;
  document.querySelectorAll('#filtroGrupo .filtro-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  filtrarExercicios();
}

function filtrarExercicios() {
  var termo = document.getElementById('buscaExercicio').value.toLowerCase().trim();
  var filtrados = EXERCICIOS_DB.filter(function(ex) {
    var matchGrupo = grupoFiltro === 'todos' || ex.grupo === grupoFiltro;
    var matchTermo = !termo || ex.nome.toLowerCase().indexOf(termo) > -1;
    return matchGrupo && matchTermo;
  });
  renderBiblioteca(filtrados);
}

function renderBiblioteca(lista) {
  var el = document.getElementById('listaExerciciosBiblioteca');
  if (lista.length === 0) {
    el.innerHTML = '<div class="empty-state small"><div class="empty-text">Nenhum exercício encontrado</div></div>';
    return;
  }

  var html = '';
  lista.forEach(function(ex, i) {
    html += '<div class="ex-bib-card" onclick="selecionarExercicioBib(\'' + escapeHtml(ex.nome) + '\',\'' + ex.grupo + '\',\'' + ex.icon + '\')">';
    html += '<div class="ex-bib-icon ' + ex.grupo + '">' + ex.icon + '</div>';
    html += '<div class="ex-bib-info">';
    html += '<div class="ex-bib-nome">' + escapeHtml(ex.nome) + '</div>';
    html += '<div class="ex-bib-grupo">' + (GRUPO_NOMES[ex.grupo] || ex.grupo) + '</div>';
    html += '</div>';
    html += '<div class="ex-bib-add"><i class="fas fa-plus"></i></div>';
    html += '</div>';
  });
  el.innerHTML = html;
}

function selecionarExercicioBib(nome, grupo, icon) {
  exercicioSelecionado = { nome: nome, grupo: grupo, icon: icon };
  document.getElementById('configExIcon').textContent = icon;
  document.getElementById('configExNome').textContent = nome;
  document.getElementById('configExGrupo').textContent = GRUPO_NOMES[grupo] || grupo;
  document.getElementById('cfgSeries').value = 3;
  document.getElementById('cfgReps').value = 12;
  document.getElementById('cfgCarga').value = 0;
  document.getElementById('cfgDescanso').value = 60;
  document.getElementById('cfgObs').value = '';
  document.getElementById('configExModal').classList.add('show');
}

function adicionarExCustom() {
  var nome = document.getElementById('exCustomNome').value.trim();
  var grupo = document.getElementById('exCustomGrupo').value;
  if (!nome) { toast('Informe o nome do exercício'); return; }

  var icon = GRUPO_ICONS[grupo] || '🏋️';
  // Adicionar à biblioteca local
  EXERCICIOS_DB.push({ nome: nome, grupo: grupo, icon: icon });
  document.getElementById('exCustomNome').value = '';

  selecionarExercicioBib(nome, grupo, icon);
}

function fecharConfigEx() {
  document.getElementById('configExModal').classList.remove('show');
}

function stepperChange(inputId, delta) {
  var input = document.getElementById(inputId);
  var val = parseFloat(input.value) || 0;
  var min = parseFloat(input.min) || 0;
  var max = parseFloat(input.max) || 999;
  val += delta;
  if (val < min) val = min;
  if (val > max) val = max;
  input.value = val;
}

function confirmarExercicio() {
  if (!exercicioSelecionado || divisaoAlvoIndex < 0) return;

  var ex = {
    nome: exercicioSelecionado.nome,
    grupo: exercicioSelecionado.grupo,
    icon: exercicioSelecionado.icon,
    series: parseInt(document.getElementById('cfgSeries').value) || 3,
    reps: parseInt(document.getElementById('cfgReps').value) || 12,
    carga: parseFloat(document.getElementById('cfgCarga').value) || 0,
    descanso: parseInt(document.getElementById('cfgDescanso').value) || 60,
    obs: document.getElementById('cfgObs').value.trim()
  };

  fichaAtual.divisoes[divisaoAlvoIndex].exercicios.push(ex);

  fecharConfigEx();
  fecharExercicioModal();
  renderDivisoes();
  toast('✅ ' + ex.nome + ' adicionado!');
}

// ══════════════════════════════════════════════════════════════
//  EXECUÇÃO DO TREINO
// ══════════════════════════════════════════════════════════════
function selecionarDivisaoParaTreino(fichaId) {
  if (!currentUser) return;

  db.collection('users').doc(currentUser.uid).collection('fichas').doc(fichaId).get()
    .then(function(doc) {
      if (!doc.exists) { toast('Ficha não encontrada'); return; }
      var f = doc.data();
      f.id = doc.id;

      if (!f.divisoes || f.divisoes.length === 0) { toast('Ficha sem divisões'); return; }

      if (f.divisoes.length === 1) {
        iniciarTreinoDivisao(fichaId, 0);
        return;
      }

      // Montar seleção de divisão
      var html = '';
      f.divisoes.forEach(function(d, i) {
        html += '<button class="ficha-iniciar-btn" style="margin-bottom:8px;" onclick="iniciarTreinoDivisao(\'' + fichaId + '\',' + i + ')">';
        html += '<span style="font-weight:900; margin-right:8px;">' + d.letra + '</span> ' + escapeHtml(d.nome || 'Treino ' + d.letra);
        html += ' (' + (d.exercicios ? d.exercicios.length : 0) + ' ex)';
        html += '</button>';
      });

      document.getElementById('treinoExercicios').innerHTML =
        '<div style="text-align:center; margin-bottom:20px;">' +
          '<h3 style="color:var(--text-white); margin-bottom:4px;">' + escapeHtml(f.nome) + '</h3>' +
          '<p style="color:var(--text-tertiary); font-size:.82rem;">Selecione a divisão</p>' +
        '</div>' + html;

      document.getElementById('treinoModalTitulo').textContent = 'Selecionar Divisão';
      document.getElementById('timerBar').classList.add('hidden');
      document.querySelector('.treino-crono').style.display = 'none';
      document.querySelector('.treino-footer').style.display = 'none';
      document.getElementById('treinoModal').classList.add('show');
    });
}

function iniciarTreinoDivisao(fichaId, divIndex) {
  if (!currentUser) return;

  db.collection('users').doc(currentUser.uid).collection('fichas').doc(fichaId).get()
    .then(function(doc) {
      if (!doc.exists) return;
      var f = doc.data();
      var divisao = f.divisoes[divIndex];

      if (!divisao || !divisao.exercicios || divisao.exercicios.length === 0) {
        toast('Divisão sem exercícios');
        return;
      }

      treinoEmAndamento = {
        fichaId: fichaId,
        fichaNome: f.nome,
        divIndex: divIndex,
        divisao: divisao,
        inicio: new Date(),
        exercicios: divisao.exercicios.map(function(ex) {
          var series = [];
          for (var s = 0; s < ex.series; s++) {
            series.push({ reps: ex.reps, carga: ex.carga, feita: false });
          }
          return {
            nome: ex.nome,
            grupo: ex.grupo,
            icon: ex.icon,
            descanso: ex.descanso,
            obs: ex.obs,
            series: series,
            concluido: false
          };
        })
      };

      document.getElementById('treinoModalTitulo').textContent = divisao.letra + ' — ' + (divisao.nome || 'Treino');
      document.querySelector('.treino-crono').style.display = '';
      document.querySelector('.treino-footer').style.display = '';
      document.getElementById('timerBar').classList.add('hidden');

      renderTreinoExercicios();
      iniciarCronometro();
      atualizarProgressoTreino();
      document.getElementById('treinoModal').classList.add('show');
    });
}

function renderTreinoExercicios() {
  if (!treinoEmAndamento) return;
  var el = document.getElementById('treinoExercicios');
  var html = '';

  treinoEmAndamento.exercicios.forEach(function(ex, i) {
    var concluidoCls = ex.concluido ? ' concluido' : '';
    html += '<div class="treino-ex-card' + concluidoCls + '" id="treinoEx_' + i + '">';
    html += '<div class="treino-ex-header">';
    html += '<div class="treino-ex-num">' + (ex.concluido ? '✓' : (i + 1)) + '</div>';
    html += '<div>';
    html += '<div class="treino-ex-nome">' + escapeHtml(ex.nome) + '</div>';
    if (ex.obs) html += '<div class="treino-ex-obs">' + escapeHtml(ex.obs) + '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="treino-series-grid">';
    // Header
    html += '<div class="treino-serie-row" style="background:transparent; padding:4px 12px;">';
    html += '<div class="serie-num" style="color:var(--text-tertiary);">Série</div>';
    html += '<div class="serie-info">';
    html += '<div style="width:52px; text-align:center;"><span class="serie-label">Reps</span></div>';
    html += '<div style="width:52px; text-align:center;"><span class="serie-label">Kg</span></div>';
    html += '</div>';
    html += '<div style="width:36px;"></div>';
    html += '</div>';

    ex.series.forEach(function(s, j) {
      var feitaCls = s.feita ? ' feita' : '';
      html += '<div class="treino-serie-row' + feitaCls + '" id="serie_' + i + '_' + j + '">';
      html += '<div class="serie-num">' + (j + 1) + '</div>';
      html += '<div class="serie-info">';
      html += '<input type="number" class="serie-input" value="' + s.reps + '" id="serieReps_' + i + '_' + j + '" ' + (s.feita ? 'disabled' : '') + '>';
      html += '<input type="number" class="serie-input" value="' + s.carga + '" step="0.5" id="serieCarga_' + i + '_' + j + '" ' + (s.feita ? 'disabled' : '') + '>';
      html += '</div>';
      html += '<button class="serie-check' + (s.feita ? ' checked' : '') + '" onclick="marcarSerie(' + i + ',' + j + ')">' + (s.feita ? '✓' : '') + '</button>';
      html += '</div>';
    });
    html += '</div></div>';
  });

  el.innerHTML = html;
}

function marcarSerie(exIndex, serieIndex) {
  if (!treinoEmAndamento) return;

  var ex = treinoEmAndamento.exercicios[exIndex];
  var serie = ex.series[serieIndex];

  // Salvar valores atuais dos inputs
  var repsInput = document.getElementById('serieReps_' + exIndex + '_' + serieIndex);
  var cargaInput = document.getElementById('serieCarga_' + exIndex + '_' + serieIndex);
  if (repsInput) serie.reps = parseInt(repsInput.value) || 0;
  if (cargaInput) serie.carga = parseFloat(cargaInput.value) || 0;

  serie.feita = !serie.feita;

  // Verificar se todas as séries do exercício estão feitas
  ex.concluido = ex.series.every(function(s) { return s.feita; });

  renderTreinoExercicios();
  atualizarProgressoTreino();

  // Iniciar timer de descanso se marcou como feita
  if (serie.feita && ex.descanso > 0) {
    iniciarTimer(ex.descanso);
  }
}

function atualizarProgressoTreino() {
  if (!treinoEmAndamento) return;

  var totalEx = treinoEmAndamento.exercicios.length;
  var feitosEx = treinoEmAndamento.exercicios.filter(function(ex) { return ex.concluido; }).length;
  var pct = totalEx > 0 ? (feitosEx / totalEx * 100) : 0;

  document.getElementById('treinoProgressBar').style.width = pct + '%';
  document.getElementById('treinoProgressText').textContent = feitosEx + '/' + totalEx + ' exercícios';
}

// ══════════════════════════════════════════════════════════════
//  CRONÔMETRO DO TREINO
// ══════════════════════════════════════════════════════════════
function iniciarCronometro() {
  cronometroSegundos = 0;
  if (cronometroInterval) clearInterval(cronometroInterval);
  cronometroInterval = setInterval(function() {
    cronometroSegundos++;
    var min = Math.floor(cronometroSegundos / 60);
    var seg = cronometroSegundos % 60;
    document.getElementById('cronoTempo').textContent =
      String(min).padStart(2, '0') + ':' + String(seg).padStart(2, '0');
  }, 1000);
}

function pararCronometro() {
  if (cronometroInterval) { clearInterval(cronometroInterval); cronometroInterval = null; }
}

// ══════════════════════════════════════════════════════════════
//  TIMER DE DESCANSO
// ══════════════════════════════════════════════════════════════
function iniciarTimer(segundos) {
  if (timerInterval) clearInterval(timerInterval);
  timerSegundos = segundos;

  var bar = document.getElementById('timerBar');
  var val = document.getElementById('timerValue');
  bar.classList.remove('hidden');
  val.textContent = timerSegundos;

  timerInterval = setInterval(function() {
    timerSegundos--;
    val.textContent = timerSegundos;

    if (timerSegundos <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      bar.classList.add('hidden');

      // Vibrar se suportado
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      toast('⏱️ Descanso finalizado! Próxima série!');
    }
  }, 1000);
}

function pularTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('timerBar').classList.add('hidden');
}

// ══════════════════════════════════════════════════════════════
//  FINALIZAR TREINO
// ══════════════════════════════════════════════════════════════
function confirmarSairTreino() {
  if (treinoEmAndamento) {
    if (!confirm('Deseja sair? O progresso do treino será perdido.')) return;
  }
  fecharTreino();
}

function fecharTreino() {
  pararCronometro();
  pularTimer();
  treinoEmAndamento = null;
  document.getElementById('treinoModal').classList.remove('show');
}

function finalizarTreino() {
  if (!treinoEmAndamento || !currentUser) return;

  var exerciciosFeitos = treinoEmAndamento.exercicios.filter(function(ex) { return ex.concluido; }).length;
  var totalSeries = 0;
  var seriesFeitas = 0;
  var volumeTotal = 0;

  treinoEmAndamento.exercicios.forEach(function(ex) {
    ex.series.forEach(function(s) {
      totalSeries++;
      if (s.feita) {
        seriesFeitas++;
        volumeTotal += s.reps * s.carga;
      }
    });
  });

  if (seriesFeitas === 0) {
    toast('Complete pelo menos uma série para salvar');
    return;
  }

  pararCronometro();
  pularTimer();
  var duracaoMin = Math.round(cronometroSegundos / 60);

  var treino = {
    fichaId: treinoEmAndamento.fichaId,
    fichaNome: treinoEmAndamento.fichaNome,
    divisaoLetra: treinoEmAndamento.divisao.letra,
    divisaoNome: treinoEmAndamento.divisao.nome || ('Treino ' + treinoEmAndamento.divisao.letra),
    data: firebase.firestore.FieldValue.serverTimestamp(),
    duracao: duracaoMin,
    exerciciosFeitos: exerciciosFeitos,
    totalExercicios: treinoEmAndamento.exercicios.length,
    seriesFeitas: seriesFeitas,
    totalSeries: totalSeries,
    volumeTotal: Math.round(volumeTotal),
    exercicios: treinoEmAndamento.exercicios.map(function(ex) {
      return {
        nome: ex.nome,
        grupo: ex.grupo,
        concluido: ex.concluido,
        series: ex.series.filter(function(s) { return s.feita; }).map(function(s) {
          return { reps: s.reps, carga: s.carga };
        })
      };
    })
  };

  var btn = document.getElementById('btnFinalizarTreino');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

  db.collection('users').doc(currentUser.uid).collection('treinos').add(treino)
    .then(function() {
      document.getElementById('treinoModal').classList.remove('show');
      treinoEmAndamento = null;

      // Mostrar resumo
      document.getElementById('resumoGrid').innerHTML =
        '<div class="resumo-stat"><div class="resumo-stat-val orange">' + formatarTempo(duracaoMin) + '</div><div class="resumo-stat-lbl">Duração</div></div>' +
        '<div class="resumo-stat"><div class="resumo-stat-val green">' + exerciciosFeitos + '/' + treino.totalExercicios + '</div><div class="resumo-stat-lbl">Exercícios</div></div>' +
        '<div class="resumo-stat"><div class="resumo-stat-val blue">' + seriesFeitas + '</div><div class="resumo-stat-lbl">Séries</div></div>' +
        '<div class="resumo-stat"><div class="resumo-stat-val purple">' + treino.volumeTotal + 'kg</div><div class="resumo-stat-lbl">Volume Total</div></div>';

      document.getElementById('resumoModal').classList.add('show');
    })
    .catch(function(error) { toast('Erro ao salvar treino: ' + error.message); })
    .finally(function() {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finalizar';
    });
}

function fecharResumo() {
  document.getElementById('resumoModal').classList.remove('show');
  navegarPara('home');
}

// ══════════════════════════════════════════════════════════════
//  HISTÓRICO DE TREINOS
// ══════════════════════════════════════════════════════════════
var historicoFiltro = 'todos';

function carregarHistorico() {
  if (!currentUser) return;

  var el = document.getElementById('listaHistorico');
  el.innerHTML = '<div style="text-align:center;padding:20px;"><div class="ld-spinner" style="margin:0 auto;border-top-color:var(--orange);"></div></div>';

  var query = db.collection('users').doc(currentUser.uid).collection('treinos')
    .orderBy('data', 'desc');

  if (historicoFiltro === 'semana') {
    var inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    query = query.where('data', '>=', inicioSemana);
  } else if (historicoFiltro === 'mes') {
    var inicioMes = new Date();
    inicioMes.setDate(inicioMes.getDate() - 30);
    query = query.where('data', '>=', inicioMes);
  }

  query.limit(50).get()
    .then(function(snapshot) {
      if (snapshot.empty) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">Nenhum treino encontrado</div></div>';
        return;
      }

      var html = '';
      snapshot.forEach(function(doc) {
        var t = doc.data();
        var data = t.data ? t.data.toDate() : new Date();
        var dataStr = data.toLocaleDateString('pt-BR');
        var horaStr = String(data.getHours()).padStart(2, '0') + ':' + String(data.getMinutes()).padStart(2, '0');

        html += '<div class="historico-card">';
        html += '<div class="historico-badge">' + (t.divisaoLetra || '?') + '</div>';
        html += '<div class="historico-info">';
        html += '<div class="historico-nome">' + escapeHtml(t.divisaoNome || 'Treino') + '</div>';
        html += '<div class="historico-meta">' + dataStr + ' às ' + horaStr + ' • ' + (t.exerciciosFeitos || 0) + '/' + (t.totalExercicios || 0) + ' ex • ' + (t.seriesFeitas || 0) + ' séries • ' + (t.volumeTotal || 0) + 'kg</div>';
        html += '</div>';
        html += '<div class="historico-tempo">' + formatarTempo(t.duracao || 0) + '</div>';
        html += '</div>';
      });

      el.innerHTML = html;
    })
    .catch(function(error) {
      el.innerHTML = '<div class="empty-state"><div class="empty-text" style="color:var(--red);">Erro ao carregar histórico</div></div>';
    });
}

function filtrarHistorico(filtro, btn) {
  historicoFiltro = filtro;
  document.querySelectorAll('#filtroHistorico .filtro-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  carregarHistorico();
}


// ══════════════════════════════════════════════════════════════
//  SERVICE WORKER
// ══════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function() {});
}

// ══════════════════════════════════════════════════════════════
//  ATALHOS DE TECLADO
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  // Enter no login
  var loginPass = document.getElementById('loginPass');
  if (loginPass) {
    loginPass.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') fazerLogin();
    });
  }

  // Enter no cadastro
  var cadPass2 = document.getElementById('cadPass2');
  if (cadPass2) {
    cadPass2.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') fazerCadastro();
    });
  }
});
