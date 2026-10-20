# Documento de projeto técnico

## 1. Escopo

Implementar um jogo web de adivinhação de palavras em estilo Wordle, com foco em:
- mobile-first
- temas diários
- feedback visual por letra
- streak diário e estatísticas locais
- responsividade, acessibilidade e velocidade

## 2. Decisão de arquitetura

O MVP será implementado como uma aplicação web estática com HTML, CSS e JavaScript vanilla.

Motivos:
- velocidade de desenvolvimento
- sem dependências de build
- fácil deploy em qualquer host estático
- boa adequação ao MVP e à necessidade de baixa complexidade

## 3. Estrutura de arquivos

```text
/
├── index.html
├── mockups.html
├── styles.css
├── app.js
├── README.md (opcional)
├── docs/
│   └── plans/
│       └── 2026-10-20-jogo-adivinhacao-palavras-prd.md
├── PRD.md
├── SPECS.md
└── AGENTS.md
```

## 4. Fluxo de funcionamento

### 4.1 Inicialização
- Aplicativo carrega estado salvo em localStorage
- Calcula a palavra do dia a partir da data atual
- Seleciona a categoria correspondente
- Exibe a tela inicial com regra do jogo

### 4.2 Entrada do usuário
- Usuário digita uma palavra válida
- Verifica se palavra está no conjunto permitido
- Verifica se palavra já foi usada
- Atualiza grade de tentativas

### 4.3 Feedback
- Para cada posição, compara letra da tentativa com a palavra secreta
- Atribui status:
  - verde = correta na posição
  - amarelo = existe na palavra, em outra posição
  - cinza = não existe
- Atualiza teclado virtual e visual da grade

### 4.4 Resultado
- Se acerto, marca vitória e atualiza streak
- Se erro após 6 tentativas, marca derrota
- Revela resposta final
- Permite compartilhar o resultado sem mostrar a solução

## 5. Modelo de dados

### 5.1 Banco de palavras
```js
const WORD_BANK = {
  animais: ["cachorro", "gato", "panda", "leao", "peixe"],
  comida: ["pizza", "bolo", "sopa", "cafe", "fruta"],
  ciencia: ["atomo", "celula", "planeta", "vento", "luz"],
  esportes: ["futebol", "tenis", "basquete", "natacao", "golfe"]
};
```

### 5.2 Palavra do dia
A palavra do dia será derivada por uma função determinística baseada em data, de modo que:
- a mesma data sempre gerará a mesma palavra
- o sistema permanece sem backend no MVP
- o jogo mantém consistência entre sessões e dispositivos

Exemplo:
```js
const dayKey = new Date().toISOString().slice(0, 10);
const hash = [...dayKey].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
```

### 5.3 Estatísticas locais
```js
{
  streak: 0,
  bestStreak: 0,
  totalWins: 0,
  totalGames: 0,
  lastSolvedWord: "",
  winRate: 0,
  lastPlayedDate: ""
}
```

## 6. UI e UX

### 6.1 Layout
- painel principal centralizado
- topo com categoria, contagem de letras e botão de ajuda
- grade central para as tentativas
- teclado virtual na parte inferior
- painel de status com streak e total de jogos

### 6.2 Design visual
- visual leve e colorido, adequado a crianças e jovens
- uso de contraste forte para fácil leitura
- feedback visível em letras e teclado
- componentes com área de clique larga para mobile

## 7. Acessibilidade

- contraste mínimo de 4.5:1 para texto e controles principais
- botões com tamanho mínimo de 44x44 px
- foco visível em todos os controles
- suporte a teclado (Tab, Enter, Backspace)
- texto alternativo e aria-label em elementos interativos
- mensagens de erro e resultado legíveis e objetivos

## 8. Implementação técnica

### HTML
- página única com estrutura de app e modal de resultado
- teclado virtual renderizado via JS

### CSS
- design mobile-first com breakpoints para tablet e desktop
- uso de sistema de cores para status das letras
- arredondamento, espaçamento e componentes consistentes

### JavaScript
- seleção da categoria e palavra do dia
- gestão do estado da partida
- comparação de letras
- renderização da grade
- armazenamento em localStorage
- ações de compartilhamento e cópia de resultado

## 9. Lógica de validação

A validação deve considerar:
- palavra em minúsculas
- comprimento igual ao da solução
- presença na lista permitida
- não permitir repetição de tentativa
- mensagens amigáveis de erro

## 10. Estratégia de testes

### Testes de lógica
- geração determinística da palavra do dia
- cálculo do feedback por letra
- validação de tentativas repetidas
- status de vitória e derrota

### Testes de UX
- fluxo de partida completo em mobile
- interação com teclado virtual
- estados de erro e resultado
- responsividade em telas pequenas

## 11. Riscos e mitigação

### Risco: palavras válidas insuficientes
Mitigação: dicionário controlado por categoria, com palavras simples e adequadas à faixa etária.

### Risco: confusão na lógica de amarelo/verde
Mitigação: usar algoritmo robusto e testes automatizados para casos de letras duplicadas.

### Risco: baixa retenção
Mitigação: foco em streak, temas diários, feedback instantâneo e ritual simples.

## 12. Critérios de conclusão do MVP

- jogo funcional em navegadores modernos
- estruturas de tema e palavra do dia funcionando
- estatísticas salvas localmente
- fluxo de vitória/derrota completo
- protótipo de interface validado em navegador
- revisão de requisitos e qualidade concluída
