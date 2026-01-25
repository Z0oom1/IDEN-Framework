// ===================================================================================
//  ARQUIVO DE COMPATIBILIDADE - APONTA PARA modules/main.js
//  Este arquivo existe apenas para compatibilidade com código legado
//  O código real está em: modules/main.js
// ===================================================================================

console.warn("⚠️ AVISO: Você está carregando main.js da raiz.");
console.warn("⚠️ Use: <script src='js/modules/main.js'></script>");
console.warn("⚠️ Este arquivo será removido em versões futuras.");

// Redireciona para o módulo correto
document.write('<script src="modules/main.js"></script>');
