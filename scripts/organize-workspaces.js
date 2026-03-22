const fs = require('fs');
const path = require('path');

const HOME_DIR = process.env.HOME || '/home/enio';
const KERNEL_DIR = path.join(HOME_DIR, 'egos');

if (!fs.existsSync(KERNEL_DIR)) {
  console.error(`Kernel EGOS não encontrado em ${KERNEL_DIR}`);
  process.exit(1);
}

// Procura por repositórios na raiz do HOME
const items = fs.readdirSync(HOME_DIR);
const validRepos = [];

for (const item of items) {
  const fullPath = path.join(HOME_DIR, item);
  try {
    const isDir = fs.statSync(fullPath).isDirectory();
    // Verifica se possui .git ou se é o próprio egos (ignoramos egos nesse caso pois ele é a base)
    if (isDir && item !== 'egos' && item !== 'EGOSv3' && !item.startsWith('.')) {
      if (fs.existsSync(path.join(fullPath, '.git')) || fs.existsSync(path.join(fullPath, 'package.json'))) {
        validRepos.push(item);
      }
    }
  } catch(e) {}
}

console.log(`Encontrados repositórios folha (leafs): ${validRepos.join(', ')}`);

// Define o template do workspace
const generateWorkspaceJson = (repoName, repoPath) => ({
  folders: [
    {
      path: repoPath,
      name: `🔥 ${repoName} (Leaf)`
    },
    {
      path: KERNEL_DIR,
      name: `🧠 EGOS Kernel (SSOT)`
    }
  ],
  settings: {
    "files.exclude": {
      "**/.git": true,
      "**/.DS_Store": true,
      "**/node_modules": false
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/.next": true
    },
    "workbench.editor.labelFormat": "short",
    "editor.formatOnSave": true
  }
});

for (const repo of validRepos) {
  const repoPath = path.join(HOME_DIR, repo);
  const workspaceFile = path.join(repoPath, `${repo}-EGOS.code-workspace`);
  
  const content = JSON.stringify(generateWorkspaceJson(repo, repoPath), null, 2);
  fs.writeFileSync(workspaceFile, content);
  console.log(`✅ O Workspace "${workspaceFile}" foi criado com sucesso!`);
}

// Também criamos um Global no Kernel
const kernelWorkspaceFile = path.join(KERNEL_DIR, 'EGOS-Global.code-workspace');
const kernelContent = {
  folders: [
    { path: KERNEL_DIR, name: "🧠 EGOS Kernel (SSOT)" },
    ...validRepos.map(repo => ({
      path: path.join(HOME_DIR, repo),
      name: `🔥 ${repo} (Leaf)`
    }))
  ],
  settings: {
    "search.exclude": { "**/node_modules": true }
  }
};
fs.writeFileSync(kernelWorkspaceFile, JSON.stringify(kernelContent, null, 2));
console.log(`✅ O Workspace Global "${kernelWorkspaceFile}" foi criado com sucesso!`);

console.log(`\n🎉 Organização de Workspaces concluída!`);
