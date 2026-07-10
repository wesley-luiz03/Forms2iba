# Cadastro de Membresia — 2ª Igreja Batista de Areias

Aplicação web para coletar os dados de ~500 membros de forma distribuída (cada pessoa preenche
o próprio cadastro pelo celular ou computador) e depois exportar tudo no formato exigido pelo
Eklesia (XLSX), além de um backup em SQL e um relatório em PDF.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth) · Deploy: Vercel

---

## 1. Estrutura de pastas

```
2iba-cadastro/
├── app/
│   ├── layout.tsx                    # layout raiz (fonte, título da aba)
│   ├── globals.css                   # Tailwind + estilos base
│   ├── page.tsx                      # formulário público (rota "/")
│   ├── sucesso/
│   │   └── page.tsx                  # tela de confirmação após enviar
│   └── admin/
│       ├── login/page.tsx            # login do admin (Supabase Auth)
│       ├── page.tsx                  # painel: lista, filtros, exportações
│       ├── campos/page.tsx           # gerenciar campos extras do formulário
│       └── configuracoes/page.tsx    # Igreja / Arrolamento / Motivo padrão
├── components/
│   ├── MemberForm.tsx                # formulário (client component)
│   ├── AdminNav.tsx                  # menu do painel admin
│   ├── AdminDashboardClient.tsx      # tabela + filtros + exportações
│   ├── CamposManagerClient.tsx       # criar/remover campos customizados
│   └── SettingsFormClient.tsx        # editar configurações de exportação
├── lib/
│   ├── fields.ts                     # definição dos campos fixos do formulário
│   ├── eklesiaColumns.ts             # ordem das colunas do modelo Eklesia
│   └── supabase/
│       ├── client.ts                 # cliente Supabase (browser)
│       └── server.ts                 # cliente Supabase (server components)
├── middleware.ts                     # protege /admin/* exigindo login
├── supabase/
│   └── schema.sql                    # tabelas + políticas de segurança (RLS)
├── .env.example                      # modelo das variáveis de ambiente
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 2. Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou superior
- [VS Code](https://code.visualstudio.com)
- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (gratuita)
- O domínio que vocês já possuem (para apontar no passo 7)

---

## 3. Criar o projeto no Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) → **New project**.
2. Dê um nome (ex: `2iba-cadastro`), escolha uma senha forte para o banco e a região mais
   próxima (ex: São Paulo/`sa-east-1`).
3. Aguarde o projeto ser criado. Vá em **SQL Editor** → **New query**.
4. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no editor
   e clique em **Run**. Isso cria as 3 tabelas (`membros`, `campos_customizados`,
   `configuracoes`) e as regras de segurança (RLS).
5. Vá em **Authentication → Users → Add user** e crie o usuário administrador que vai acessar
   a "Área do desenvolvedor" (ex: e-mail `admin@2iba.org.br`, defina uma senha forte). É esse
   e-mail/senha que substitui o login fixo do protótipo — muito mais seguro, porque não fica
   exposto no código.
6. Vá em **Project Settings → API** e anote dois valores que vamos usar no passo 5:
   - **Project URL**
   - **anon public key**

---

## 4. Baixar o projeto e abrir no VS Code

1. Extraia o `.zip` deste projeto em uma pasta no seu computador.
2. Abra a pasta no VS Code (`File → Open Folder…`).
3. Abra o terminal integrado (`` Ctrl+` ``) e instale as dependências:

```bash
npm install
```

---

## 5. Configurar as variáveis de ambiente

1. Copie o arquivo `.env.example` e renomeie a cópia para `.env.local`.
2. Preencha com os valores que você anotou no passo 3.6:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

`.env.local` já está no `.gitignore` — ele nunca vai parar no GitHub.

---

## 6. Rodar localmente

```bash
npm run dev
```

Acesse:
- `http://localhost:3000` → formulário público
- `http://localhost:3000/admin` → painel (vai pedir login; use o usuário criado no passo 3.5)

Teste um cadastro de exemplo, confirme que ele aparece no painel, teste os três botões de
exportação (XLSX, PDF, SQL) e teste adicionar um campo customizado em
**Campos do formulário**.

---

## 7. Subir para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão do cadastro de membresia"
```

No GitHub, crie um repositório novo e vazio (sem README/gitignore, para não conflitar), depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/2iba-cadastro.git
git branch -M main
git push -u origin main
```

---

## 8. Deploy na Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o
   repositório que você acabou de subir.
2. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Clique em **Deploy**. Em cerca de 1 minuto o site estará no ar em um endereço
   `algo.vercel.app`.

---

## 9. Apontar o domínio próprio

1. No projeto da Vercel, vá em **Settings → Domains** e adicione o domínio de vocês
   (ex: `cadastro.2iba.org.br` ou o domínio principal).
2. A Vercel mostra os registros DNS (`CNAME` ou `A`) que você precisa criar no painel onde o
   domínio foi registrado (Registro.br, GoDaddy, etc).
3. Após a propagação (minutos a poucas horas), o site estará acessível pelo domínio próprio
   com HTTPS automático.

---

## 10. Como funciona no dia a dia

- **Divulgar o link** (`https://seu-dominio` ou o `.vercel.app`) para os membros preencherem.
- Cada envio vira uma linha nova no banco — não há risco de um cadastro sobrescrever outro,
  mesmo com muita gente preenchendo ao mesmo tempo.
- Em **Configurações**, definam uma vez só o nome exato da igreja, o arrolamento e o motivo
  padrão como estão cadastrados no Gestão do Eklesia (siga o PDF de importação que vocês
  receberam do suporte — os nomes precisam ser **idênticos**).
- Quando quiserem importar, abram **Cadastros** e cliquem em **Baixar XLSX (Eklesia)** — o
  arquivo já sai com as 52 colunas na ordem certa, pronto para o suporte do Eklesia.

---

## O que fica de fora desta primeira versão (ideias para depois)

- Cadastro automático de filhos (colunas `Filho1Nome`...`Filho6Arrolamento` do modelo Eklesia).
- Checagem automática de "cônjuge encontrado" (o PDF descreve essa lógica com uma fórmula de
  planilha; dá para replicar comparando nomes entre os registros).
- Upload de foto do membro (coluna `Foto` do modelo).
- Edição do próprio cadastro pelo membro depois de enviado (hoje só o admin pode excluir).

---

## Segurança / LGPD

O formulário coleta CPF e outros dados pessoais. A tabela `membros` só pode ser **lida** por
quem estiver autenticado como admin (RLS do Supabase) — visitantes só conseguem inserir, nunca
listar os cadastros de outras pessoas. Ainda assim, vale:

- Usar uma senha forte para o usuário admin no Supabase.
- Revisar periodicamente quem tem acesso à Área do desenvolvedor.
- Definir com a liderança da igreja por quanto tempo os dados ficam armazenados e apagar
  cadastros de teste antes de divulgar o link oficial.
