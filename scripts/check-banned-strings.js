#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Padrões banidos na UI
const bannedPatterns = [
  /\bProbz\b/gi,
  /\bProbz Coin\b/gi,
];

// Função recursiva para buscar arquivos
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.md']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pular diretórios excluídos
        if (['node_modules', 'dist', 'build', '.git', 'migrations'].includes(item)) {
          continue;
        }
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignorar erros de permissão
  }
  
  return files;
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const violations = [];

    lines.forEach((line, index) => {
      bannedPatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          violations.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            match: matches[0],
          });
        }
      });
    });

    return violations;
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  console.log('🔍 Verificando strings banidas na UI...\n');
  
  let allViolations = [];
  
  // Verificar pasta src/
  const srcFiles = findFiles('./src');
  srcFiles.forEach(file => {
    const violations = checkFile(file);
    allViolations.push(...violations);
  });

  // Verificar arquivos na raiz
  const rootFiles = [
    './index.html',
    './README.md',
    './tailwind.config.ts',
    './vite.config.ts'
  ].filter(f => fs.existsSync(f));
  
  rootFiles.forEach(file => {
    const violations = checkFile(file);
    allViolations.push(...violations);
  });

  if (allViolations.length > 0) {
    console.error('❌ FALHA: Strings banidas encontradas!\n');
    
    allViolations.forEach(violation => {
      console.error(`📍 ${violation.file}:${violation.line}`);
      console.error(`   Match: "${violation.match}"`);
      console.error(`   Linha: ${violation.content}`);
      console.error('');
    });
    
    console.error(`Total: ${allViolations.length} violação(ões) encontrada(s)`);
    process.exit(1);
  } else {
    console.log('✅ SUCESSO: Nenhuma string banida encontrada!');
    console.log('🎉 Aplicação pronta para produção!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}