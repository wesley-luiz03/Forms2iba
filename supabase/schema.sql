-- =========================================================
-- Esquema do banco de dados: Cadastro de Membresia 2IBA
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query
-- =========================================================

create extension if not exists "pgcrypto";

-- Tabela principal de membros cadastrados pelo formulário público
create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sexo text,
  data_nascimento date,
  estado_civil text,
  cpf text,
  celular text,
  email text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  nome_conjuge text,
  observacao text,
  campos_extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Campos customizados criados pelo admin ("+ Adicionar campo")
create table if not exists public.campos_customizados (
  id uuid primary key default gen_random_uuid(),
  chave text unique not null,
  rotulo text not null,
  tipo text not null check (tipo in ('texto','multipla','data','numero')),
  opcoes text[] default '{}',
  obrigatorio boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

-- Configurações usadas na exportação (não perguntadas ao membro)
create table if not exists public.configuracoes (
  id int primary key default 1,
  igreja text not null default '2ª Igreja Batista de Areias',
  arrolamento text not null default 'ADMISSÃO',
  motivo text not null default 'RECADASTRAMENTO',
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);
insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.membros enable row level security;
alter table public.campos_customizados enable row level security;
alter table public.configuracoes enable row level security;

-- Membros: qualquer visitante pode ENVIAR o formulário (insert),
-- mas só usuários autenticados (o login do admin) podem ver e excluir.
drop policy if exists "membros_insert_publico" on public.membros;
create policy "membros_insert_publico"
  on public.membros for insert
  to anon, authenticated
  with check (true);

drop policy if exists "membros_select_admin" on public.membros;
create policy "membros_select_admin"
  on public.membros for select
  to authenticated
  using (true);

drop policy if exists "membros_delete_admin" on public.membros;
create policy "membros_delete_admin"
  on public.membros for delete
  to authenticated
  using (true);

-- Campos customizados: leitura pública (o formulário precisa deles),
-- escrita só para o admin autenticado.
drop policy if exists "campos_select_publico" on public.campos_customizados;
create policy "campos_select_publico"
  on public.campos_customizados for select
  to anon, authenticated
  using (true);

drop policy if exists "campos_write_admin" on public.campos_customizados;
create policy "campos_write_admin"
  on public.campos_customizados for all
  to authenticated
  using (true)
  with check (true);

-- Configurações: leitura pública, escrita só para o admin.
drop policy if exists "config_select_publico" on public.configuracoes;
create policy "config_select_publico"
  on public.configuracoes for select
  to anon, authenticated
  using (true);

drop policy if exists "config_write_admin" on public.configuracoes;
create policy "config_write_admin"
  on public.configuracoes for all
  to authenticated
  using (true)
  with check (true);
