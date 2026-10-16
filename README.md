# Sayaka JSON Editor ⚡

> Editor e processador de alta performance para grandes arquivos JSON de coleções de cartas e variantes, com busca indexada em tempo real, virtualização de DOM, edição em lote e exportação otimizada.

Inspirado na aplicação desktop em Python (PyQt6 + MongoDB), o **Sayaka JSON Editor** foi projetado para rodar 100% no navegador (Client-Side), permitindo carregar, inspecionar, filtrar e editar coleções com dezenas de milhares de registros sem travamento ou estouro de memória, exportando os resultados em um novo arquivo JSON para download.

---

## 🚀 Principais Funcionalidades

- **Processamento Otimizado para Grandes Volumes de Dados**:
  - Leitor de arquivos em chunks com barra de progresso em tempo real.
  - Suporta arquivos nos formatos `.json` (array ou objetos agrupados), `.ndjson` e `.jsonl` (linhas de JSON exportadas do MongoDB).
  - Capacidade de manipular dezenas de milhares de cartas com baixo consumo de memória.

- **Busca Indexada Ultrarrápida (Sub-10ms)**:
  - Índice pré-tokenizado em memória que pesquisa instantaneamente por `ID`, `code`, `name`, `_id`, `tcgplayerId`, `printing` e dados de `set`.
  - Medição de tempo de resposta da busca na interface em milissegundos.

- **Lista Virtualizada de 60 FPS (`VirtualCardList`)**:
  - Renderiza apenas os elementos visíveis na janela de rolagem com buffer de segurança (overscan).
  - Permite navegar com as setas do teclado (`↑` e `↓`) por milhares de itens sem gargalos no DOM.

- **Filtros Rápidos de Integridade (TCG Vazio e TCG Repetido)**:
  - **TCGPlayer ID vazio**: Localiza rapidamente cartas com variantes sem identificador externo cadastrado.
  - **TCGPlayer ID repetido**: Filtra cartas que possuem códigos duplicados em outros documentos da coleção com contador em tempo real e destaque visual em vermelho/rosa.

- **Editor Completo de Cartas e Variantes**:
  - Edição de campos centrais: `ID`, `Code`, `Name` e URLs de imagens (`small` e `large`).
  - Pré-visualização da imagem da carta com fallback visual inteligente.
  - Edição individual de cada variante:
    - **Set**: `Group ID`, `Set Code` e `Set Name`.
    - **Variant**: `TCGPlayer ID` (com alerta visual se estiver pendente ou repetido), título da variante (preservando chaves `justname` ou `juSTname`) e `Printing`.
    - **Preço**: `Market Price` e `Price` de venda.

- **Editor de JSON Completo (Raw JSON)**:
  - Inspecione ou edite o JSON estruturado diretamente em um modal com validação sintática em tempo real e botão de autoformatação (Prettify).

- **Ferramentas em Massa e Diagnóstico**:
  - **Estatísticas da Coleção**: Total de cartas, total de variantes, média de variantes por carta e distribuição de sets mais frequentes.
  - **Preenchimento em Massa de TCGPlayer ID**: Preenche automaticamente identificadores vazios usando prefixo configurável e código da carta.
  - **Substituição Global de Set Code**: Renomeia códigos de coleções em todas as variantes de uma só vez.
  - **Reajuste Percentual de Preços**: Aplica acréscimo ou desconto percentual em massa nos preços.

- **Exportação Eficiente (Download Chunked Blob)**:
  - Serialização em blocos para evitar o limite de string do V8 e vazamento de memória.
  - **Formatos de Exportação**:
    1. *JSON Completo Formatado*: Indentado para legibilidade e controle de versão.
    2. *JSON Completo Minificado*: Arquivo compacto para APIs e bancos de produção.
    3. *Apenas Modificados (Delta)*: Baixa somente as cartas editadas ou criadas nesta sessão.
    4. *MongoDB Lines (NDJSON)*: 1 documento por linha, pronto para importação direta com `mongoimport`.

---

## 📦 Estrutura do Documento JSON

O aplicativo preserva a integridade de qualquer campo personalizado do seu arquivo, garantindo compatibilidade com o formato do MongoDB:

```json
[
  {
    "_id": "654a1f11a8b1c2d3e4f50001",
    "id": "base1-4",
    "code": "BS-004",
    "name": "Charizard",
    "images": {
      "small": "https://images.pokemontcg.io/base1/4.png",
      "large": "https://images.pokemontcg.io/base1/4_hires.png"
    },
    "variants": [
      {
        "set": {
          "groupId": 101,
          "set_code": "BS1",
          "name": "Base Set"
        },
        "tcgplayerId": "42382",
        "justname": "Charizard - 1st Edition Shadowless Holo",
        "printing": "1st Edition Holo",
        "marketPrice": 6250.0,
        "price": 6500.0
      }
    ]
  }
]
```

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Performance**: Virtualização nativa de janela de rolagem e indexação de busca por tokenização.

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ (recomendado Node.js 20 ou superior)
- npm ou yarn / pnpm

### Passos:

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd sayaka-json-editor
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador: `http://localhost:3000`

5. Para gerar a build de produção local:
```bash
npm run build
npm run preview
```

---

## ☁️ Deploy no Vercel

O projeto está configurado com o arquivo `vercel.json` e o `package.json` prontos para deploy no Vercel com **zero-configuração**:

### Opção 1: Via Vercel Dashboard (Recomendado)
1. Suba o código para o GitHub / GitLab / Bitbucket.
2. Acesse [vercel.com](https://vercel.com/) e clique em **"Add New Project"**.
3. Importe o repositório do projeto.
4. As configurações padrão já serão detectadas automaticamente:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Clique em **Deploy**.

### Opção 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Por que funciona perfeitamente no Vercel?
- Possui o arquivo `vercel.json` na raiz configurando o framework `vite` e os rewrites de SPA (`rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`).
- O processamento é **100% Client-Side** (roda no navegador do usuário via Web APIs, Blobs e FileReader), dispensando custos ou limites de timeout de Serverless Functions ao manipular arquivos grandes.

---

## 📄 Licença

Distribuído sob a licença Apache 2.0.
