const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'convert.txt');
const outputFile = path.join(__dirname, 'readme.md');

const content = fs.readFileSync(inputFile, 'utf8');

const linhas = content
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0);

const objetos = linhas.map(linha => {
  const [codigo, ...produtoParts] = linha.split(/\s+/);
  const produto = produtoParts.join(' ');
  return `{ codigo: '${codigo}', produto: '${produto}' }`;
});

const resultado = objetos.join(', \n');

fs.writeFileSync(outputFile, resultado, 'utf8');

console.log('readme.md gerado com sucesso!');
