let produtos = {};
let produtoEmEdicao = null; 

function showMessage(msg, isError = false) {
  const messageElement = document.getElementById("message");
  if (messageElement) {
    messageElement.textContent = msg;
    messageElement.style.color = isError ? "red" : "green";
    setTimeout(() => (messageElement.textContent = ""), 3000);
  }
}

function exibirMensagemBaixa(mensagem) {
  const msgDiv = document.getElementById('mensagemBaixa');
  if (msgDiv) {
    msgDiv.innerText = mensagem;
    msgDiv.style.display = 'block';
    msgDiv.style.opacity = '1';
    setTimeout(() => {
      msgDiv.style.opacity = '0';
      setTimeout(() => { msgDiv.style.display = 'none'; }, 300);
    }, 3000);
  }
}

function updateLowStockList() {
  const lowStockList = document.getElementById("low-stock-list");
  if (!lowStockList) return;
  lowStockList.innerHTML = "";
  const lowStockProducts = Object.values(produtos).filter(p => p.quantidade <= 5 && p.quantidade > 0);

  if (lowStockProducts.length === 0) {
    lowStockList.innerHTML = "<p>Nenhum produto com estoque baixo.</p>";
    return;
  }
  lowStockProducts.forEach(p => {
    const pElement = document.createElement("p");
    pElement.textContent = `${p.nome}: ${p.quantidade} unidades restantes`;
    lowStockList.appendChild(pElement);
  });
}

function abrirModalVerificarQuantidade() {
    document.getElementById('modalEditarProduto').style.display = 'flex';
    document.getElementById('editProdutoCodigo').value = '';
    document.getElementById('editProdutoNome').value = '';
    document.getElementById('editProdutoQuantidade').value = '';
    document.getElementById('editProdutoPreco').value = '';
    document.getElementById('editProdutoCodigo').removeAttribute('readonly'); 
    document.getElementById('editProdutoNome').setAttribute('readonly', 'true');
    document.getElementById('editProdutoQuantidade').setAttribute('readonly', 'true');
    document.getElementById('editProdutoPreco').setAttribute('readonly', 'true');
    document.getElementById('editProdutoCodigo').focus();
    
    document.getElementById('editProdutoCodigo').onkeypress = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const barcode = this.value.trim();
            if (produtos[barcode]) {
                const produto = produtos[barcode];
                document.getElementById('editProdutoNome').value = produto.nome;
                document.getElementById('editProdutoQuantidade').value = produto.quantidade;
                document.getElementById('editProdutoPreco').value = produto.valor;
                produtoEmEdicao = barcode; 
                document.getElementById('editProdutoCodigo').setAttribute('readonly', 'true');
            } else {
                alert("Produto não encontrado.");
                this.value = '';
                produtoEmEdicao = null;
                this.focus();
            }
        }
    };
}

function fecharModalEditarProduto() {
    document.getElementById('modalEditarProduto').style.display = 'none';
    document.getElementById('editProdutoCodigo').onkeypress = null; 
    produtoEmEdicao = null;
}

function abrirModalRegistrarProduto() {
    document.getElementById('modalRegistrarProduto').style.display = 'flex';
    document.getElementById('newBarcodeModal').value = '';
    document.getElementById('newNameModal').value = '';
    document.getElementById('newStockModal').value = '1';
    document.getElementById('newPriceModal').value = '';
    document.getElementById('newBarcodeModal').focus();
}

function fecharModalRegistrarProduto() {
    document.getElementById('modalRegistrarProduto').style.display = 'none';
}

function registerProductModal() {
  const newBarcode = document.getElementById("newBarcodeModal").value.trim();
  const newName = document.getElementById("newNameModal").value.trim();
  const newStock = parseInt(document.getElementById("newStockModal").value.trim());
  const newPrice = parseFloat(document.getElementById("newPriceModal").value.trim());

  if (!newBarcode || !newName || isNaN(newStock) || newStock <= 0 || isNaN(newPrice) || newPrice <= 0) {
    showMessage("Preencha todos os campos corretamente.", true);
    return;
  }
  if (produtos[newBarcode]) {
    showMessage("Código de barras já existe.", true);
    return;
  }
  produtos[newBarcode] = { nome: newName, quantidade: newStock, valor: newPrice };
  salvarDados("produtos", produtos);
  showMessage(`Produto "${newName}" registrado com sucesso!`);
  fecharModalRegistrarProduto();
  updateLowStockList();
}

function solicitarSenha() {
  if (produtoEmEdicao) {
    const senhaModal = document.getElementById("senhaModal");
    if (senhaModal) {
      senhaModal.style.display = "flex";
      document.getElementById("senhaInput").value = "";
      setTimeout(() => document.getElementById("senhaInput").focus(), 100);
    }
  } else {
    alert("Carregue um produto no modal para editar.");
  }
}

function verificarSenha(event) {
  if (event.key === "Enter") {
    const senha = document.getElementById("senhaInput").value;
    if (senha === "1996") { 
      closeSenhaModal();
      document.getElementById('editProdutoCodigo').removeAttribute('readonly'); 
      document.getElementById('editProdutoNome').removeAttribute('readonly');
      document.getElementById('editProdutoQuantidade').removeAttribute('readonly');
      document.getElementById('editProdutoPreco').removeAttribute('readonly');
      document.getElementById('editProdutoNome').focus(); 
    } else {
      alert("Senha incorreta!");
      document.getElementById("senhaInput").value = "";
    }
  }
}

function closeSenhaModal() {
  const senhaModal = document.getElementById("senhaModal");
  if (senhaModal) senhaModal.style.display = "none";
}

function salvarEdicaoProduto() {
    const codigo = document.getElementById('editProdutoCodigo').value.trim();
    const nome = document.getElementById('editProdutoNome').value.trim();
    const quantidade = parseInt(document.getElementById('editProdutoQuantidade').value);
    const preco = parseFloat(document.getElementById('editProdutoPreco').value);

    if (!codigo || !nome || isNaN(quantidade) || quantidade < 0 || isNaN(preco) || preco <= 0) {
        alert("Preencha todos os campos corretamente.");
        return;
    }
    if (codigo !== produtoEmEdicao && produtos[codigo]) {
        alert(`O código "${codigo}" já está em uso.`);
        return;
    }
    if (produtoEmEdicao && codigo !== produtoEmEdicao) { 
        delete produtos[produtoEmEdicao];
    }
    produtos[codigo] = { nome: nome, quantidade: quantidade, valor: preco };
    salvarDados("produtos", produtos);
    showMessage(`Produto updated com sucesso!`);
    fecharModalEditarProduto();
    updateLowStockList();
}

function exportarBackup() {
  const data = {
    produtos: obterDados("produtos"),
    usuarios: obterDados("usuarios"),
    movimentacoes: obterDados("movimentacoes"),
    resumoFormas: obterDados("resumoFormas"),
    movimentosCaixa: obterDados("movimentosCaixa")
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `backup_estoque_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

function importarBackup(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const importedData = JSON.parse(e.target.result);
      if (confirm("Importar apagará dados atuais. Continuar?")) {
        for (const key in importedData) { salvarDados(key, importedData[key]); }
        alert("Importado! A página será recarregada.");
        location.reload();
      }
    };
    reader.readAsText(file);
  }
}

function confirmarApagarDados() {
  if (confirm("Isto apagará a nuvem e o computador! Tem certeza?")) {
    const senha = prompt("Senha de administrador:");
    if (senha === "1996") { 
      let usuarios = [{ usuario: "admin", senha: "1996" }];
      salvarDados("produtos", {});
      salvarDados("movimentacoes", {});
      salvarDados("resumoFormas", {});
      salvarDados("movimentosCaixa", []);
      salvarDados("usuarios", usuarios);
      alert("Tudo foi apagado.");
      location.reload();
    } else {
      alert("Senha incorreta.");
    }
  }
}

function verificarAdmin() {
  const userRole = localStorage.getItem('userRole'); 
  document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = (userRole === 'admin') ? '' : 'none';
  });
}

// ==========================================
// GESTÃO DE USUÁRIOS
// ==========================================
function abrirModalCriarUsuario() {
    if (localStorage.getItem('userRole') !== 'admin') return alert("Acesso Negado.");
    document.getElementById('modalCriarUsuario').style.display = 'flex';
}
function fecharModalCriarUsuario() { document.getElementById('modalCriarUsuario').style.display = 'none'; }

function criarUsuario() {
    const nome = document.getElementById('nomeUsuario').value.trim();
    const senha = document.getElementById('senhaUsuario').value.trim();
    if (!nome || !senha) return alert('Preencha os campos!');

    let usuarios = obterDados('usuarios') || [];
    if (usuarios.some(u => u.usuario === nome)) return alert('Usuário já existe!');

    usuarios.push({ usuario: nome, senha: senha });
    salvarDados('usuarios', usuarios);
    alert('Criado com sucesso!');
    document.getElementById('nomeUsuario').value = '';
    document.getElementById('senhaUsuario').value = '';
    fecharModalCriarUsuario();
}

function abrirModalEditarUsuario() {
    if (localStorage.getItem('userRole') !== 'admin') return alert("Acesso Negado.");
    const select = document.getElementById('selectUsuarioEditar');
    let usuarios = obterDados('usuarios') || [];
    select.innerHTML = '<option value="">Selecione...</option>';
    usuarios.forEach(u => select.innerHTML += `<option value="${u.usuario}">${u.usuario}</option>`);
    document.getElementById('modalEditarUsuario').style.display = 'flex';
}
function fecharModalEditarUsuario() { document.getElementById('modalEditarUsuario').style.display = 'none'; }

function editarUsuario() {
    const nome = document.getElementById('selectUsuarioEditar').value;
    const senha = document.getElementById('senhaUsuarioEditar').value.trim();
    if (!nome || !senha) return alert('Preencha os campos.');

    let usuarios = obterDados('usuarios') || [];
    const index = usuarios.findIndex(u => u.usuario === nome);
    if (index !== -1) {
        usuarios[index].senha = senha;
        salvarDados('usuarios', usuarios);
        alert('Atualizado com sucesso!');
        fecharModalEditarUsuario();
    }
}

function abrirModalExcluirUsuario() {
    if (localStorage.getItem('userRole') !== 'admin') return alert("Acesso Negado.");
    const select = document.getElementById('selectUsuarioExcluir');
    let usuarios = obterDados('usuarios') || [];
    select.innerHTML = '<option value="">Selecione...</option>';
    usuarios.forEach(u => { if (u.usuario !== 'admin') select.innerHTML += `<option value="${u.usuario}">${u.usuario}</option>`; });
    document.getElementById('modalExcluirUsuario').style.display = 'flex';
}
function fecharModalExcluirUsuario() { document.getElementById('modalExcluirUsuario').style.display = 'none'; }

function excluirUsuario() {
    const nome = document.getElementById('selectUsuarioExcluir').value;
    if (!nome || nome === 'admin') return alert('Inválido.');
    let usuarios = obterDados('usuarios') || [];
    const novosUsuarios = usuarios.filter(u => u.usuario !== nome);
    salvarDados('usuarios', novosUsuarios);
    alert('Excluído!');
    fecharModalExcluirUsuario();
}

function abrirModalListarUsuarios() {
    if (localStorage.getItem('userRole') !== 'admin') return alert("Acesso Negado.");
    const container = document.getElementById('user-list');
    container.innerHTML = '';
    let usuarios = obterDados('usuarios') || [];

    usuarios.forEach(u => {
        const div = document.createElement('div');
        div.style.padding = "12px";
        div.style.borderBottom = "1px solid #ddd";
        div.style.color = "#333";
        div.innerHTML = `👤 <strong>${u.usuario}</strong>`;
        container.appendChild(div);
    });
    document.getElementById('modalListarUsuarios').style.display = 'flex';
}
function fecharModalListarUsuarios() { document.getElementById('modalListarUsuarios').style.display = 'none'; }
function fecharModal(idModal) { document.getElementById(idModal).style.display = 'none'; }
function abrirModalConfiguracoesIndex() { document.getElementById('modal-configuracoes-index').style.display = 'flex'; }
function fecharModalConfiguracoesIndex() { document.getElementById('modal-configuracoes-index').style.display = 'none'; }

document.addEventListener("bancoPronto", () => {
    produtos = obterDados("produtos") || {};
    let usuarios = obterDados("usuarios") || [];
    if (!usuarios.some(u => u.usuario === "admin")) {
        usuarios.push({ usuario: "admin", senha: "1996" });
        salvarDados("usuarios", usuarios);
    }
    updateLowStockList(); 
    verificarAdmin(); 

    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.addEventListener('click', function(event) {
            const submenu = document.getElementById('userMenuOptions');
            if (submenu) submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            event.stopPropagation();
        });
        document.addEventListener('click', function(event) {
            const submenu = document.getElementById('userMenuOptions');
            if (submenu && submenu.style.display === 'block' && !userMenu.contains(event.target)) {
                submenu.style.display = 'none';
            }
        });
    }

    const inputBackup = document.getElementById('inputBackup');
    if (inputBackup) inputBackup.addEventListener('change', importarBackup);
});

// ==========================================
// FUNÇÕES DE PERSONALIZAÇÃO DE TEMA (CORES E FUNDO)
// ==========================================

function abrirModalConfigTema() {
    document.getElementById("modal-configuracoes-tema").style.display = "flex";
    
    // Puxa as cores salvas anteriormente para os campos de cor
    document.getElementById("cor-fundo-header").value = localStorage.getItem("temaCorFundoHeader") || "#2c3e50";
    document.getElementById("cor-texto-header").value = localStorage.getItem("temaCorTextoHeader") || "#ffffff";
}

function fecharModalConfigTema() {
    document.getElementById("modal-configuracoes-tema").style.display = "none";
}

function salvarCoresTema() {
    var corFundo = document.getElementById("cor-fundo-header").value;
    var corTexto = document.getElementById("cor-texto-header").value;
    
    // Salva na memória do computador do usuário
    localStorage.setItem("temaCorFundoHeader", corFundo);
    localStorage.setItem("temaCorTextoHeader", corTexto);
    
    aplicarTemaVisual(); // Muda na hora!
    fecharModalConfigTema();
}

function aplicarTemaVisual() {
    // 1. Aplica Cores do Cabeçalho e Rodapé
    var corFundo = localStorage.getItem("temaCorFundoHeader");
    var corTexto = localStorage.getItem("temaCorTextoHeader");
    
    var header = document.getElementById("main-header-bar");
    var footer = document.getElementById("main-footer-bar");
    
    if (header) {
        if (corFundo) header.style.backgroundColor = corFundo;
        if (corTexto) header.style.color = corTexto;
    }
    if (footer) {
        if (corFundo) footer.style.backgroundColor = corFundo;
        if (corTexto) footer.style.color = corTexto;
    }

    // 2. Aplica a Imagem de Fundo (Wallpaper)
    var fundoSalvo = localStorage.getItem("fundoTelaSistema");
    var bodyPainel = document.getElementById("painel-body");
    
    if (bodyPainel) {
        if (fundoSalvo) {
            bodyPainel.style.backgroundImage = "url('" + fundoSalvo + "')";
        } else {
            bodyPainel.style.backgroundImage = "none";
        }
    }
    
    // 3. Coloca o nome real do Operador Logado no canto
    var nomeSpan = document.getElementById("nome-usuario-logado");
    if (nomeSpan) {
        nomeSpan.innerText = localStorage.getItem("usuarioLogado") || "Operador";
    }
}

function salvarImagemFundo() {
    var fileInput = document.getElementById('input-fundo-tela');
    var file = fileInput.files[0];
    
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var imagemBase64 = e.target.result;
            localStorage.setItem("fundoTelaSistema", imagemBase64);
            aplicarTemaVisual();
            alert("Imagem de fundo aplicada com sucesso!");
        };
        reader.readAsDataURL(file);
    } else {
        alert("Por favor, selecione uma imagem do seu computador primeiro.");
    }
}

function removerImagemFundo() {
    localStorage.removeItem("fundoTelaSistema");
    document.getElementById("input-fundo-tela").value = "";
    aplicarTemaVisual();
}