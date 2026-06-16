function executarLogin(event) {
  event.preventDefault();
  const txtUsuario = document.getElementById("login-usuario").value.trim();
  const txtSenha = document.getElementById("login-senha").value;

  if (typeof window.obterDados !== "function") {
    alert("Conectando à nuvem... Tente novamente em instantes.");
    return;
  }

  let listaUsuarios = window.obterDados("usuarios") || [];
  const contaEncontrada = listaUsuarios.find(u => u.usuario.toLowerCase() === txtUsuario.toLowerCase());

  if (contaEncontrada && contaEncontrada.senha === txtSenha) {
    localStorage.setItem("usuarioLogado", contaEncontrada.usuario);
    localStorage.setItem("userRole", contaEncontrada.usuario.toLowerCase() === "admin" ? "admin" : "operador");
    window.location.replace("sistema.html");
  } else {
    const elementoErro = document.getElementById("msg-erro");
    if (elementoErro) {
      elementoErro.innerText = "❌ Usuário ou senha incorretos!";
      elementoErro.style.display = "block";
    }
  }
}

function verificarECriarAdminInicial() {
  if (typeof window.obterDados !== "function") return;
  let usuariosAtuais = window.obterDados("usuarios") || [];
  if (!usuariosAtuais.some(u => u.usuario.toLowerCase() === "admin")) {
    usuariosAtuais.push({ usuario: "admin", senha: "1996" });
    window.salvarDados("usuarios", usuariosAtuais);
  }
}
document.addEventListener("bancoPronto", verificarECriarAdminInicial);
if (window.isBancoPronto) verificarECriarAdminInicial();