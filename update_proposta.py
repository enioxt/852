import re

with open('/home/enio/852/docs/proposta/PROPOSTA_NUCLEO_IA_PCMG_PATOS_DE_MINAS.md', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update executive summary
content = content.replace(
    "- Prestar servico de tecnologia para todo o estado de Minas Gerais\n- Formar multiplicadores em IA aplicada a seguranca publica",
    "- Prestar servico de tecnologia para o estado e para a cidade de Patos de Minas\n- Estabelecer parcerias com empresas privadas, prefeitura e setores municipais\n- Formar multiplicadores em IA aplicada a seguranca publica\n- Treinar modelos proprios e criar solucoes integradas para o ecossistema local"
)
content = content.replace(
    "O investimento total estimado e de **R$ 140.000 a R$ 215.000** em equipamentos e implantacao inicial",
    "O investimento total estimado e de **R$ 126.000 a R$ 183.000**, focado estritamente em equipamentos computacionais de ponta"
)

# 2. Update Objectives
content = content.replace(
    "3. **Estabelecer infraestrutura fisica** adequada (espaco, rede, energia)\n4. **Expandir o Tira-Voz",
    "3. **Expandir o Tira-Voz"
)
content = content.replace(
    "5. **Desenvolver novas ferramentas** de automacao documental (OCR, extracao de dados, geracao de relatorios)",
    "4. **Desenvolver novas ferramentas** de automacao documental (OCR, extracao de dados, geracao de relatorios)"
)
content = content.replace(
    "2. **Estabelecer parcerias** com universidades (UFU, UFMG, PUC Minas, UNIPAM) e centros de pesquisa\n3. **Contribuir com o ecossistema nacional**",
    "2. **Estabelecer parcerias estrategicas** com a Prefeitura Municipal, autarquias e empresas privadas para prestacao de servicos em IA\n3. **Treinar modelos proprios** adaptados a realidade do municipio e demandas parceiras\n4. **Contribuir com o ecossistema nacional**"
)
content = content.replace(
    "4. **Tornar Patos de Minas referencia** em inovacao policial no Brasil",
    "5. **Tornar Patos de Minas a referencia maxima** em inovacao de IA no interior do Brasil"
)

# 3. Update Section 7.4
content = content.replace(
    "### 7.4 Disponibilidade para o Estado",
    "### 7.4 Disponibilidade para a Sociedade, Municipio e Estado"
)
content = content.replace(
    "O NDIA se coloca **a disposicao de todo o estado de Minas Gerais** para:\n\n1. **Treinamentos**",
    "O NDIA tera capacidade computacional de sobra, colocando-se **a disposicao da cidade de Patos de Minas e de todo o estado** para:\n\n1. **Parcerias de Desenvolvimento:** Criar solucoes conjuntas com a Prefeitura, autarquias e iniciativa privada\n2. **Processamento de Dados Locais:** Treinamento de modelos customizados para demandas externas\n3. **Treinamentos**"
)
content = content.replace(
    "2. **Desenvolvimento de sistemas**", "4. **Desenvolvimento de sistemas**"
)
content = content.replace(
    "3. **Manutencao e suporte**", "5. **Manutencao e suporte**"
)
content = content.replace(
    "4. **Consultoria tecnica**", "6. **Consultoria tecnica**"
)
content = content.replace(
    "5. **Formacao de multiplicadores**", "7. **Formacao de multiplicadores**"
)

# 4. Remove Section 5
idx5 = content.find("## 5. INFRAESTRUTURA FISICA")
idx6 = content.find("## 6. FERRAMENTAS E TECNOLOGIAS")

if idx5 != -1 and idx6 != -1:
    content = content[:idx5] + content[idx6:]

# 5. Renumber headings 6 to 12
for i in range(6, 13):
    content = content.replace(f"## {i}.", f"## {i-1}.")
    for j in range(1, 10):
        content = content.replace(f"### {i}.{j}", f"### {i-1}.{j}")
        
# 6. Fix references in the text
content = content.replace("Equipamentos (Secao 3)", "Equipamentos (Secao 3)")
content = content.replace(
    "**R$ 140.000-215.000 (unico) + R$ 2.500-3.600/mes**",
    "**R$ 126.000-183.000 (unico) + R$ 2.500-3.600/mes**"
)

# 7. Update investment table
invest_block_old = """| Equipamentos (Secao 3) | R$ 126.600 — R$ 183.200 |
| Infraestrutura fisica — reforma (Secao 5) | R$ 15.000 — R$ 30.000 |
| **TOTAL INICIAL** | **R$ 141.600 — R$ 213.200** |"""
invest_block_new = """| Equipamentos (Secao 3) | R$ 126.600 — R$ 183.200 |
| **TOTAL INICIAL** | **R$ 126.600 — R$ 183.200** |"""
content = content.replace(invest_block_old, invest_block_new)
content = content.replace("R$ 141.600 — R$ 213.200", "R$ 126.600 — R$ 183.200") # catch any remaining

# Replace phase 2
content = content.replace(
    "| **Fase 2** | Mes 2-3 | Preparacao da infraestrutura fisica (reforma, rede, energia) |\n",
    ""
)

# 8. Conclusion update
content = content.replace(
    "O que falta e **infraestrutura, formalizacao e apoio institucional.**",
    "O que falta sao **os equipamentos de ponta para processamento local.**"
)
content = content.replace(
    "Com um investimento inicial de **R$ 140.000 a R$ 215.000** — ainda compativel",
    "Com um investimento inicial de **R$ 126.000 a R$ 183.000** — focado puramente em poder computacional e ainda compativel"
)

with open('/home/enio/852/docs/proposta/PROPOSTA_NUCLEO_IA_PCMG_PATOS_DE_MINAS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated successfully")
