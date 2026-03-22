const fs = require('fs');
const path = require('path');

const homeDir = process.env.HOME || '/home/enio';
const clinePath = path.join(homeDir, '.cline', 'data', 'settings', 'cline_mcp_settings.json');

console.log('Iniciando SecOps - Mitigação de MCP Keys vazadas no disco...');

try {
  if (fs.existsSync(clinePath)) {
    const content = fs.readFileSync(clinePath, 'utf8');
    const obj = JSON.parse(content);
    
    let foundKeys = false;
    let extractedEnv = '# Cline MCP Extracted Secure Keys\n\n';
    
    // Varredura de segurança
    for (const server in obj.mcpServers) {
      if (obj.mcpServers[server].env) {
        for (const envKey in obj.mcpServers[server].env) {
           const val = obj.mcpServers[server].env[envKey];
           if (val && val.length > 0 && val !== '""' && val !== "''") {
               extractedEnv += `export ${envKey}="${val}"\n`;
               // Reduct the key
               obj.mcpServers[server].env[envKey] = ""; 
               foundKeys = true;
           }
        }
      }
    }
    
    if (foundKeys) {
        fs.writeFileSync(clinePath + '.secops.backup', content);
        fs.writeFileSync(clinePath, JSON.stringify(obj, null, 2));
        
        const envPath = path.join(homeDir, 'egos', '.env');
        fs.appendFileSync(envPath, '\n' + extractedEnv);
        
        console.log(`✅ Chaves de API de ${Object.keys(obj.mcpServers).length} servidores extraídas e securizadas com sucesso em ~/egos/.env!`);
        console.log(`✅ O arquivo ${clinePath} agora está limpo.`);
    } else {
        console.log("Nenhuma chave plaintext vulnerável encontrada. Sistema já está seguro.");
    }
  } else {
    console.log("Arquivo cline_mcp_settings.json não encontrado. Possivelmente caminho diferente.");
  }
} catch (e) {
  console.log("Erro ao processar (SecOps Aborted):", e.message);
}
