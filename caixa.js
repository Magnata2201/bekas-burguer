let vendaAtual = [];
let totalVenda = 0;
let resumoFormas = { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 };
let itemParaCancelar = null;
let vendaPendenteInfo = null; // Guarda os dados do pagamento temporariamente

function inicializarCaixaCompleto() {
    resumoFormas = obterDados("resumoFormas") || resumoFormas;
    
    var operadorLogado = localStorage.getItem("usuarioLogado") || "N/A";
    var txtOperador = document.getElementById("display-operador");
    if (txtOperador) txtOperador.innerText = operadorLogado;

    var userRole = localStorage.getItem("userRole");
    var btnConfig = document.getElementById("btn-config-caixa");
    if (btnConfig) {
        btnConfig.style.display = (userRole === "admin") ? "inline-block" : "none";
    }

    var configSalva = obterDados("configLoja") || { nome: "Nome da Loja", cnpj: "00.000.000/0000-00" };
    var txtNomeLoja = document.getElementById("display-nome-loja");
    if (txtNomeLoja) txtNomeLoja.innerText = configSalva.nome || "Nome da Loja";

    atualizarTopBar();
    relogioCaixa();
}

if (window.isBancoPronto) {
    inicializarCaixaCompleto();
} else {
    document.addEventListener('bancoPronto', inicializarCaixaCompleto);
}

function relogioCaixa() {
    var display = document.getElementById("display-horario");
    if (!display) return;
    setInterval(function() {
        var agora = new Date();
        display.innerText = agora.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

function atualizarResumoVenda() {
    document.getElementById("total-geral").innerText = totalVenda.toFixed(2);
    document.getElementById("total-geral-lado").innerText = totalVenda.toFixed(2);
    var descontoTotalElement = document.getElementById('desconto-valor-total-venda');
    if (descontoTotalElement) descontoTotalElement.innerText = totalVenda.toFixed(2);
}

function adicionarItemVenda() {
  var codigo = document.getElementById("codigo-barra").value.trim();
  var quantidade = parseInt(document.getElementById("quantidade-produto").value.trim()) || 1;
  var produtosNaNuvem = obterDados("produtos") || {};

  if (!produtosNaNuvem || !produtosNaNuvem[codigo]) {
    alert("Produto não encontrado!");
    return;
  }
  if (produtosNaNuvem[codigo].quantidade < quantidade) {
    alert("Estoque insuficiente!");
    return;
  }

  produtosNaNuvem[codigo].quantidade -= quantidade;
  salvarDados("produtos", produtosNaNuvem); 

  var produto = produtosNaNuvem[codigo];
  vendaAtual.push({ codigo: codigo, nome: produto.nome, valor: produto.valor, quantidade: quantidade });

  atualizarTabela(); 
  document.getElementById("codigo-barra").value = "";
  document.getElementById("quantidade-produto").value = "1";
  document.getElementById("codigo-barra").focus();
}

function atualizarTabela() {
  var tbody = document.getElementById("itens-venda");
  if (!tbody) return;
  tbody.innerHTML = "";
  totalVenda = 0; 
  vendaAtual.forEach(function(item, index) {
    var subtotal = item.valor * item.quantidade;
    totalVenda += subtotal;
    var tr = document.createElement("tr");
    tr.innerHTML = "<td style='width: 30%;'>" + item.nome + "</td>" +
                   "<td style='width: 20%;'>" + item.codigo + "</td>" +
                   "<td style='width: 10%;'>" + item.quantidade + "</td>" +
                   "<td style='width: 20%;'>R$ " + item.valor.toFixed(2) + "</td>" +
                   "<td style='width: 20%;'>R$ " + subtotal.toFixed(2) + "</td>";
    tr.style.cursor = "pointer";
    tr.onclick = function() { solicitarSenha(index); };
    tbody.appendChild(tr);
  });
  atualizarResumoVenda(); 
}

function solicitarSenha(index) {
  itemParaCancelar = index;
  document.getElementById('modal-senha-cancelar').style.display = 'flex';
  document.getElementById('senha-cancelar-input').focus();
}

function confirmarCancelamento() {
  var senha = document.getElementById("senha-cancelar-input").value;
  if (senha === "2201") { 
    if (itemParaCancelar !== null) {
      var itemCancelado = vendaAtual.splice(itemParaCancelar, 1)[0];
      var prods = obterDados("produtos");
      if (prods && prods[itemCancelado.codigo]) {
        prods[itemCancelado.codigo].quantidade += itemCancelado.quantidade;
        salvarDados("produtos", prods);
      }
      atualizarTabela(); 
      itemParaCancelar = null;
    }
    document.getElementById("modal-senha-cancelar").style.display = "none";
  } else {
    alert("Senha incorreta!");
  }
}

function fecharModalSenhaCancelar() { document.getElementById("modal-senha-cancelar").style.display = "none"; }
function abrirOpcoesPagamento() {
  if (vendaAtual.length === 0) return alert("Nenhum item adicionado.");
  document.getElementById("modal-pagamento").style.display = "flex";
}
function fecharModalPagamento() {
  document.getElementById("modal-pagamento").style.display = "none";
  document.getElementById("codigo-barra").focus();
}

function abrirModalConfiguracoes() {
  if (localStorage.getItem("userRole") !== "admin") return;
  var config = obterDados("configLoja") || { nome: "Nome da Loja", cnpj: "00.000.000/0000-00" };
  document.getElementById("nome-loja-input").value = config.nome || "";
  document.getElementById("cnpj-loja-input").value = config.cnpj || "";
  document.getElementById("modal-configuracoes").style.display = "flex";
}
function fecharModalConfiguracoes() { document.getElementById("modal-configuracoes").style.display = "none"; }

function salvarConfiguracoesLoja() {
  var nomeDigitado = document.getElementById("nome-loja-input").value.trim();
  var cnpjDigitado = document.getElementById("cnpj-loja-input").value.trim();
  if (!nomeDigitado || !cnpjDigitado) return alert("Preencha Nome e CNPJ!");

  salvarDados("configLoja", { nome: nomeDigitado, cnpj: cnpjDigitado });
  document.getElementById("display-nome-loja").innerText = nomeDigitado;
  alert("Configurações updated!");
  fecharModalConfiguracoes();
}

function abrirModalSangria() { document.getElementById("modal-sangria").style.display = "flex"; document.getElementById("valor-sangria").focus(); }
function fecharModalSangria() { document.getElementById("modal-sangria").style.display = "none"; }

function confirmarSangria() {
    var valor = parseFloat(document.getElementById("valor-sangria").value);
    var motivo = document.getElementById("motivo-sangria").value.trim();
    if (isNaN(valor) || valor <= 0 || !motivo) return alert("Preencha os dados da sangria corretamente.");

    var data = new Date();
    var offset = data.getTimezoneOffset() * 60000;
    var dataAtual = (new Date(data.getTime() - offset)).toISOString().split('T')[0];
    
    var movimentacoes = obterDados("movimentacoes") || {};
    if (!movimentacoes[dataAtual]) movimentacoes[dataAtual] = [];

    movimentacoes[dataAtual].push({
        tipoMovimento: 'sangria',
        produto: 'SANGRIA: ' + motivo,
        valor: valor,
        quantidade: 1,
        hora: data.toLocaleTimeString(),
        formaPagamento: 'Dinheiro', 
        usuario: localStorage.getItem("usuarioLogado") || "desconhecido",
        data: dataAtual
    });

    salvarDados("movimentacoes", movimentacoes);
    alert("Sangria de R$ " + valor.toFixed(2) + " realizada e registrada com sucesso!");
    fecharModalSangria();
}

function abrirModalDesconto() {
    if(vendaAtual.length === 0) return alert("Caixa vazio!");
    document.getElementById("modal-desconto").style.display = "flex";
    document.getElementById("senha-desconto").value = "";
    document.getElementById("valor-desconto").value = "";
}
function fecharModalDesconto() { document.getElementById("modal-desconto").style.display = "none"; }
function confirmarDesconto() {
    var senha = document.getElementById("senha-desconto").value;
    var desc = parseFloat(document.getElementById("valor-desconto").value);
    if (senha === "1996" && !isNaN(desc) && desc > 0) {
        totalVenda = Math.max(0, totalVenda - desc);
        atualizarResumoVenda();
        alert("Desconto aplicado!");
        fecharModalDesconto();
    } else {
        alert("Dados incorretos!");
    }
}

function fecharModalMisto() { document.getElementById("modal-pagamento-misto").style.display = "none"; }

function reimprimirUltimoCupom() {
    var ultima = obterDados("ultimaVenda");
    if (!ultima) return alert("Nenhuma venda realizada nesta sessão.");
    imprimirCupom(
        ultima.itens, 
        ultima.total, 
        ultima.formaPagamento, 
        ultima.valorRecebido !== undefined ? ultima.valorRecebido : null, 
        ultima.pagamentosDetalhados !== undefined ? ultima.pagamentosDetalhados : null, 
        ultima.idCupom,
        ultima.numeroPedido,
        ultima.nomeCliente, 
        ultima.obsVenda
    );
}

function finalizarVenda(formaPagamento, valorRecebido, pagamentosDetalhados) {
    vendaPendenteInfo = { formaPagamento, valorRecebido, pagamentosDetalhados };
    document.getElementById('modal-cliente-obs').style.display = 'flex';
    document.getElementById('nome-cliente-venda').value = '';
    document.getElementById('obs-venda').value = '';
    document.getElementById('nome-cliente-venda').focus();
}

function fecharModalClienteObs() {
    document.getElementById('modal-cliente-obs').style.display = 'none';
}

function confirmarDadosCliente() {
    var nomeCliente = document.getElementById('nome-cliente-venda').value.trim();
    var obsVenda = document.getElementById('obs-venda').value.trim();
    fecharModalClienteObs();
    concluirVendaComDados(
        vendaPendenteInfo.formaPagamento, 
        vendaPendenteInfo.valorRecebido, 
        vendaPendenteInfo.pagamentosDetalhados, 
        nomeCliente, 
        obsVenda
    );
}

function concluirVendaComDados(formaPagamento, valorRecebido, pagamentosDetalhados, nomeCliente, obsVenda) {
  var data = new Date();
  var offset = data.getTimezoneOffset() * 60000;
  var dataAtual = (new Date(data.getTime() - offset)).toISOString().split('T')[0];
  var horaAtual = data.toLocaleTimeString();
  var usuario = localStorage.getItem("usuarioLogado") || "desconhecido";
  
  var movimentacoes = obterDados("movimentacoes") || {};
  if (!movimentacoes[dataAtual]) movimentacoes[dataAtual] = [];

  let numPedido = parseInt(obterDados("numeroPedidoAtual"));
  if (isNaN(numPedido) || numPedido <= 0) {
      numPedido = 1;
  }

  var idCupom = "CUPOM-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

  vendaAtual.forEach(function(item) {
    movimentacoes[dataAtual].push({ 
      produto: item.nome, 
      codigo: item.codigo, 
      quantidade: item.quantidade, 
      valor: item.valor, 
      usuario: usuario, 
      hora: horaAtual, 
      formaPagamento: formaPagamento, 
      idCupom: idCupom, 
      tipoMovimento: 'venda', 
      data: dataAtual,
      numeroPedido: numPedido,
      cliente: nomeCliente, 
      observacao: obsVenda  
    });
  });

  if (pagamentosDetalhados) {
    Object.keys(pagamentosDetalhados).forEach(function(f) { resumoFormas[f] += pagamentosDetalhados[f]; });
  } else {
    resumoFormas[formaPagamento] += totalVenda;
  }
  
  salvarDados("resumoFormas", resumoFormas);
  salvarDados("movimentacoes", movimentacoes);
  
  imprimirCupom(vendaAtual, totalVenda, formaPagamento, valorRecebido, pagamentosDetalhados, idCupom, numPedido, nomeCliente, obsVenda);

  salvarDados("numeroPedidoAtual", numPedido + 1);

  vendaAtual = [];
  atualizarTabela(); 
  fecharModalPagamento();
}

function imprimirCupom(itens, total, formaPagamento, valorRecebido, pagamentosDetalhados, idCupom, numeroPedido, nomeCliente, obsVenda) {
  var iframe = document.getElementById("iframe-impressao");
  var doc = iframe.contentDocument || iframe.contentWindow.document;
  
  var vRecebidoSalvar = valorRecebido !== undefined && valorRecebido !== null ? valorRecebido : null;
  var pDetalhadosSalvar = pagamentosDetalhados !== undefined && pagamentosDetalhados !== null ? pagamentosDetalhados : null;

  salvarDados("ultimaVenda", { itens: itens, total: total, formaPagamento: formaPagamento, valorRecebido: vRecebidoSalvar, pagamentosDetalhados: pDetalhadosSalvar, idCupom: idCupom, numeroPedido: numeroPedido, nomeCliente: nomeCliente, obsVenda: obsVenda });

  var configLoja = obterDados("configLoja") || { nome: "Nome da Loja", cnpj: "00.000.000/0000-00" };
  var dataHora = new Date().toLocaleString("pt-BR");
  var operador = localStorage.getItem("usuarioLogado") || "Operador";
  var cupomIdText = idCupom ? idCupom.split('-')[1] : "000000";

  let numPedidoFormatado = "00";
  if (numeroPedido) {
      numPedidoFormatado = numeroPedido < 10 ? "0" + numeroPedido : numeroPedido;
  }

  var troco = 0;
  if (valorRecebido !== null && parseFloat(valorRecebido) > total) troco = parseFloat(valorRecebido) - total;

  var cupomHTML = "<!DOCTYPE html><html><head><style>" +
          "* { box-sizing: border-box; } " +
          "@page { size: 48mm auto; margin: 0; } " +
          "body { font-family: 'Courier New', Courier, monospace; font-weight: 900; font-size: 9.5px; width: 44mm; margin: 0 auto; padding: 4px 0; color: #000; position: relative; -webkit-print-color-adjust: exact; } " +
          ".header-container { display: block; min-height: 42px; position: relative; margin-bottom: 4px; } " +
          ".loja-info { width: calc(100% - 48px); text-align: left; } " +
          ".loja-info h2 { margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase; line-height: 1.1; word-wrap: break-word; } " +
          ".loja-info p { margin: 1px 0 0 0; font-size: 8.5px; font-weight: 900; text-align: left; } " +
          ".pedido-box { position: absolute; top: 0; right: 0; border: 2px solid #000; padding: 1px 2px; text-align: center; background: #fff; min-width: 44px; } " +
          ".pedido-box-label { font-size: 8px; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: -2px; } " +
          ".pedido-box-numero { font-size: 18px; font-weight: 900; display: block; line-height: 1; } " +
          ".divider { border-top: 1px dashed #000; margin: 3px 0; } " +
          "p.titulo-cupom { margin: 2px 0; text-align: center; font-size: 10px; font-weight: 900; } " +
          "table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin: 3px 0; font-weight: 900; } " +
          "th { border-bottom: 1px dashed #000; padding-bottom: 2px; text-align: left; font-size: 9.5px; font-weight: 900; } " +
          "td { padding: 2px 0; vertical-align: top; word-wrap: break-word; } " +
          ".right { text-align: right; } .center { text-align: center; } .bold { font-weight: 900; } " +
          ".info-line { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 900; margin: 1px 0; }" +
          "</style></head><body>" +
          "<div class='header-container'>" +
            "<div class='loja-info'>" +
              "<h2>" + configLoja.nome + "</h2>" +
              "<p>CNPJ: " + configLoja.cnpj + "</p>" +
              "<p>IE: ISENTO</p>" +
            "</div>" +
            "<div class='pedido-box'>" +
              "<span class='pedido-box-label'>PEDIDO</span>" +
              "<span class='pedido-box-numero'>" + numPedidoFormatado + "</span>" +
            "</div>" +
          "</div>" +
          "<div class='divider'></div>" +
          "<p class='bold titulo-cupom'>CUPOM NÃO FISCAL</p><div class='divider'></div>" +
          "<div class='info-line'><span>Data: " + dataHora + "</span></div>" +
          "<div class='info-line'><span>Op: " + operador + "</span><span>Cupom: " + cupomIdText + "</span></div>";

  if (nomeCliente || obsVenda) {
      cupomHTML += "<div class='divider'></div>";
      if (nomeCliente) {
          cupomHTML += "<div class='info-line'><span>CLIENTE:</span><span style='text-align: right;'>" + nomeCliente.toUpperCase() + "</span></div>";
      }
      if (obsVenda) {
          cupomHTML += "<div style='font-size: 9.5px; font-weight: 900; margin: 3px 0; text-align: left;'>OBS: " + obsVenda.toUpperCase() + "</div>";
      }
  }

  cupomHTML += "<div class='divider'></div><table><thead><tr><th>QTD</th><th>DESCRIÇÃO</th><th class='right'>TOTAL</th></tr></thead><tbody>";

  itens.forEach(function(item) {
      cupomHTML += "<tr><td class='center'>" + item.quantidade + "</td><td>" + item.nome.substring(0, 11) + "</td><td class='right'>" + (item.valor * item.quantidade).toFixed(2) + "</td></tr>";
  });

  cupomHTML += "</tbody></table><div class='divider'></div>" +
          "<div class='info-line bold' style='font-size: 10.5px;'><span>TOTAL A PAGAR:</span><span>R$ " + total.toFixed(2) + "</span></div><div class='divider'></div>";

  if (pagamentosDetalhados) {
       cupomHTML += "<p class='bold' style='text-align:left;'>PAGAMENTO MISTO:</p>";
       Object.keys(pagamentosDetalhados).forEach(function(f) {
           if (pagamentosDetalhados[f] > 0) cupomHTML += "<div class='info-line'><span>" + f + ":</span><span>R$ " + pagamentosDetalhados[f].toFixed(2) + "</span></div>";
       });
  } else {
       cupomHTML += "<div class='info-line'><span>FORMA PAG:</span><span>" + formaPagamento.toUpperCase() + "</span></div>";
       if (valorRecebido !== null) {
          cupomHTML += "<div class='info-line'><span>VALOR REC:</span><span>R$ " + parseFloat(valorRecebido).toFixed(2) + "</span></div>" +
                       "<div class='info-line bold'><span>TROCO:</span><span>R$ " + troco.toFixed(2) + "</span></div>";
      }
  }

  cupomHTML += "<div class='divider'></div><p style='margin-top: 6px; font-weight: 900; text-align: center;'>Obrigado pela preferência!</p><p style='text-align: center; font-weight: 900;'>Volte Sempre!</p></body></html>";

  doc.open(); doc.write(cupomHTML); doc.close();
  setTimeout(function() { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 500);
}

function confirmarFechamentoCaixa() {
  var senha = document.getElementById('input-senha-fechar').value;
  if (senha !== "2201") return alert("Senha incorreta!");

  var dataAtualObj = new Date();
  var offset = dataAtualObj.getTimezoneOffset() * 60000;
  var dataFormatada = (new Date(dataAtualObj.getTime() - offset)).toISOString().split('T')[0];
  var horaFechamento = dataAtualObj.toLocaleTimeString();
  var operador = localStorage.getItem("usuarioLogado") || "Operador";

  var suprimento = parseFloat(obterDados("valorAberturaCaixa")) || 0;
  var sangriasTotal = 0;
  var movimentacoes = obterDados("movimentacoes") || {};
  var movHoje = movimentacoes[dataFormatada] || [];

  movHoje.forEach(function(mov) {
      if (mov.tipoMovimento === 'sangria' || mov.tipoMovimento === 'gasto' || mov.tipoMovimento === 'despesa') {
          sangriasTotal += (parseFloat(mov.valor) || 0);
      }
  });

  var formasVenda = obterDados("resumoFormas") || { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 };
  var totalBrutoVendas = 0;
  Object.keys(formasVenda).forEach(function(k) { totalBrutoVendas += formasVenda[k]; });

  var valorLiquido = totalBrutoVendas - sangriasTotal;
  var dinheiroEsperadoGaveta = suprimento + (formasVenda.Dinheiro || 0) - sangriasTotal;
  var configLoja = obterDados("configLoja") || { nome: "Nome da Loja", cnpj: "00.000.000/0000-00" };

  var htmlFechamento = "<!DOCTYPE html><html><head><style>" +
      "* { box-sizing: border-box; } " +
      "@page { size: 48mm auto; margin: 0; } " +
      "body { font-family: 'Courier New', Courier, monospace; font-weight: 900; font-size: 9.5px; width: 44mm; margin: 0 auto; padding: 4px 0; color: #000; -webkit-print-color-adjust: exact; } " +
      "h2, h3 { margin: 2px 0; text-align: center; font-size: 11px; font-weight: 900; text-transform: uppercase; } " +
      "p { margin: 1px 0; text-align: center; font-size: 9.5px; font-weight: 900; } " +
      ".divider { border-top: 1px dashed #000; margin: 3px 0; } " +
      ".right { text-align: right; } .bold { font-weight: 900; } " +
      ".info-line { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 900; margin: 1px 0; }" +
      "</style></head><body>" +
      "<h2>" + configLoja.nome + "</h2><p>CNPJ: " + configLoja.cnpj + "</p>" +
      "<div class='divider'></div><h3>FECHAMENTO DE CAIXA</h3><div class='divider'></div>" +
      "<div class='info-line'><span>Data:</span><span>" + dataAtualObj.toLocaleDateString('pt-BR') + "</span></div>" +
      "<div class='info-line'><span>Hora Fech:</span><span>" + horaFechamento + "</span></div>" +
      "<div class='info-line'><span>Operador:</span><span>" + operador + "</span></div>" +
      "<div class='divider'></div><h3>VENDAS POR TIPO</h3>";

  Object.keys(formasVenda).forEach(function(k) {
      if (formasVenda[k] > 0) htmlFechamento += "<div class='info-line'><span>" + k + ":</span><span>R$ " + formasVenda[k].toFixed(2) + "</span></div>";
  });

  htmlFechamento += "<div class='divider'></div><h3>RESUMO FINANCEIRO</h3>" +
      "<div class='info-line'><span>Suprimento:</span><span>R$ " + suprimento.toFixed(2) + "</span></div>" +
      "<div class='info-line'><span>Sangrias:</span><span>R$ " + sangriasTotal.toFixed(2) + "</span></div>" +
      "<div class='info-line bold'><span>Total Bruto:</span><span>R$ " + totalBrutoVendas.toFixed(2) + "</span></div><div class='divider'></div>" +
      "<div class='info-line bold' style='font-size:10px;'><span>VALOR LÍQUIDO:</span><span>R$ " + valorLiquido.toFixed(2) + "</span></div><div class='divider'></div>" +
      "<div class='info-line bold'><span>GAVETA:</span><span>R$ " + dinheiroEsperadoGaveta.toFixed(2) + "</span></div>" +
      "<p style='font-size: 8.5px;'>(Abertura + Dinheiro - Sangrias)</p>" +
      "<div class='divider'></div><p style='margin-top:6px; font-weight: 900;'>*** FIM DO RESUMO ***</p></body></html>";

  var iframe = document.getElementById("iframe-impressao");
  var doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(htmlFechamento); doc.close();

  resumoFormas = { Pix: 0, Crédito: 0, Débito: 0, Dinheiro: 0, Cheque: 0, VR: 0, Misto: 0 };
  salvarDados("resumoFormas", resumoFormas); 
  salvarDados("caixaAbertoData", null);
  salvarDados("valorAberturaCaixa", 0); 
  
  salvarDados("numeroPedidoAtual", 0);

  fecharModalSenhaFechamento();
  alert("Imprimindo Resumo e Finalizando Sessão...");

  setTimeout(function() {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(function() {
          window.location.replace("index.html");
      }, 1500); 
  }, 500);
}

function abrirModalAbertura() { document.getElementById('modal-abertura').style.display = 'flex'; }
function confirmarAbertura() {
  var valor = parseFloat(document.getElementById('valor-abertura').value);
  if (isNaN(valor) || valor < 0) return alert("Valor inválido");
  salvarDados("valorAberturaCaixa", valor.toFixed(2));
  salvarDados("caixaAbertoData", new Date().toLocaleDateString());
  
  salvarDados("numeroPedidoAtual", 1);

  document.getElementById('modal-abertura').style.display = 'none';
  document.getElementById('bloqueio-tela').style.display = 'none';
  inicializarCaixaCompleto();
}

function atualizarTopBar() {
    var dataHoje = new Date().toLocaleDateString();
    var caixaAbertoHoje = obterDados("caixaAbertoData") === dataHoje;
    if (caixaAbertoHoje) {
        document.getElementById('display-status-caixa').innerText = "Aberto";
        document.getElementById('bloqueio-tela').style.display = 'none';
    } else {
        document.getElementById('display-status-caixa').innerText = "Fechado";
        document.getElementById('bloqueio-tela').style.display = 'flex';
    }
}

function abrirModalEstoque() {
  var tabelaCorpo = document.getElementById("lista-estoque-corpo");
  if (!tabelaCorpo) return;
  
  tabelaCorpo.innerHTML = "";
  var produtos = obterDados("produtos") || {};
  var codigos = Object.keys(produtos);

  if (codigos.length === 0) {
    tabelaCorpo.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Nenhum produto em estoque.</td></tr>";
  } else {
    codigos.forEach(function(cod) {
      var prod = produtos[cod];
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + cod + "</td>" +
                     "<td>" + prod.nome + "</td>" +
                     "<td>R$ " + parseFloat(prod.valor).toFixed(2) + "</td>" +
                     "<td>" + prod.quantidade + "</td>";
      tabelaCorpo.appendChild(tr);
    });
  }
  document.getElementById("modal-estoque").style.display = "flex";
}

function fecharModalEstoque() {
  document.getElementById("modal-estoque").style.display = "none";
  document.getElementById("codigo-barra").focus();
}

document.addEventListener("keydown", function(event) {
  var modalPagamento = document.getElementById("modal-pagamento");
  if (modalPagamento && modalPagamento.style.display === "flex") {
    if (["Digit1","Numpad1","Digit2","Numpad2","Digit3","Numpad3","Digit4","Numpad4","Digit5","Numpad5","Digit6","Numpad6","Digit7","Numpad7"].indexOf(event.code) !== -1) {
        event.preventDefault(); 
    }
    switch (event.code) {
      case "Digit1": case "Numpad1": finalizarVenda("Pix", null, null); break;
      case "Digit2": case "Numpad2": finalizarVenda("Crédito", null, null); break;
      case "Digit3": case "Numpad3": finalizarVenda("Débito", null, null); break;
      case "Digit4": case "Numpad4": 
          fecharModalPagamento();
          document.getElementById("modal-troco").style.display = "flex";
          document.getElementById("total-em-dinheiro").innerText = "R$ " + totalVenda.toFixed(2);
          document.getElementById("valor-recebido").value = "";
          setTimeout(function() { document.getElementById("valor-recebido").focus(); }, 200);
          break; 
      case "Digit5": case "Numpad5": finalizarVenda("Cheque", null, null); break;
      case "Digit6": case "Numpad6": finalizarVenda("VR", null, null); break;
      case "Digit7": case "Numpad7": 
          fecharModalPagamento(); 
          document.getElementById('modal-pagamento-misto').style.display = 'flex'; 
          document.getElementById("total-misto").innerText = "R$ " + totalVenda.toFixed(2);
          break;
    }
    return;
  }
  switch (event.code) {
      case "F2": event.preventDefault(); abrirOpcoesPagamento(); break;
      case "F3": event.preventDefault(); abrirModalDesconto(); break;
      case "F4": event.preventDefault(); abrirModalSangria(); break;
      case "F8": event.preventDefault(); abrirOpcoesPagamento(); setTimeout(() => { reimprimirUltimoCupom(); fecharModalPagamento(); }, 50); break;
      case "F9": event.preventDefault(); fecharCaixa(); break;
      case "Escape": event.preventDefault(); window.location.href = 'sistema.html'; break;
  }
});

function fecharModalTroco() { document.getElementById("modal-troco").style.display = "none"; }
var inputRecebido = document.getElementById("valor-recebido");
if (inputRecebido) {
    inputRecebido.addEventListener("input", function() {
        var rec = parseFloat(this.value) || 0;
        var troco = Math.max(0, rec - totalVenda);
        document.getElementById("valor-troco").innerText = "R$ " + troco.toFixed(2);
    });
}
function confirmarTroco() {
    var rec = parseFloat(document.getElementById("valor-recebido").value) || 0;
    if (rec < totalVenda) return alert("Valor recebido é menor que o total!");
    fecharModalTroco();
    finalizarVenda("Dinheiro", rec, null);
}

function fecharCaixa() {
  var modal = document.getElementById('modal-senha-fechamento');
  if (modal) {
    modal.style.display = 'flex';
    var inputSenha = document.getElementById('input-senha-fechar');
    if (inputSenha) {
      inputSenha.value = '';
      inputSenha.focus();
    }
  } else {
    confirmarFechamentoCaixa();
  }
}

function fecharModalSenhaFechamento() {
  var modal = document.getElementById('modal-senha-fechamento');
  if (modal) {
    modal.style.display = 'none';
  }
}
