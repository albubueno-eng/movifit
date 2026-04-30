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
//  NAVEGAÇÃO — Bottom Nav
// ══════════════════════════════════════════════════════════════
function navegarPara(tela) {
  // Atualizar nav buttons
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  var navBtn = document.getElementById('nav' + tela.charAt(0).toUpperCase() + tela.slice(1));
  if (navBtn) navBtn.classList.add('active');

  // Por enquanto, só Home está implementado
  switch(tela) {
    case 'home':
      atualizarUI();
      break;
    case 'fichas':
      toast('📋 Fichas — Em breve na Fase 2!');
      break;
    case 'historico':
      toast('📊 Histórico — Em breve na Fase 2!');
      break;
    case 'perfil':
      abrirPerfil();
      break;
  }
}

// ══════════════════════════════════════════════════════════════
//  PLACEHOLDER — Funções que serão implementadas na Fase 2
// ══════════════════════════════════════════════════════════════
function iniciarTreino(fichaId, indice) {
  toast('🏋️ Execução de treino — Em breve na Fase 2!');
}

function abrirVincularAluno() {
  toast('👥 Vincular aluno — Em breve na Fase 3!');
}

function abrirAluno(alunoId) {
  toast('👤 Detalhe do aluno — Em breve na Fase 3!');
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
