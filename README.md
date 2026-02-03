# FINANCEPRO v3.0

Uma aplicação completa de gestão financeira pessoal (PWA) desenvolvida com React, Tailwind CSS e Supabase. O app gerencia fluxo de caixa, carteira de investimentos e metas financeiras.

---

FUNCIONALIDADES

1. Caixa: Controle de receitas e despesas com leitura automática de comprovantes (OCR).
2. Investimentos: Gestão de ativos (Ações, Cripto, FIIs) com cálculo automático de ROI.
3. Metas: Definição de objetivos financeiros com barra de progresso visual.
4. Extras: Modo Escuro (Dark Mode), Exportação para Excel (CSV) e Login com Google.

---

COMO RODAR O PROJETO

1. Clone o projeto:
   git clone https://github.com/SEU_USUARIO/finance-control.git
   cd finance-control

2. Instale as dependências:
   npm install

3. Configure as chaves:
   Crie um arquivo chamado ".env" na raiz e coloque suas credenciais do Supabase:
   REACT_APP_SUPABASE_URL=sua_url
   REACT_APP_SUPABASE_ANON_KEY=sua_chave

4. Inicie o projeto:
   npm start

---

CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)

Copie e cole os comandos SQL abaixo no "SQL Editor" do seu painel Supabase para criar o banco de dados:

-- 1. Tabela de Transações (Caixa)
create table transactions (
id uuid default uuid_generate_v4() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
description text not null, amount numeric not null, type text not null, category text not null, date date not null,
user_id uuid references auth.users not null
);

-- 2. Tabela de Investimentos
create table investments (
id uuid default uuid_generate_v4() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
name text not null, type text not null, invested_amount numeric not null, current_value numeric not null,
user_id uuid references auth.users not null
);

-- 3. Tabela de Metas
create table goals (
id uuid default uuid_generate_v4() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
title text not null, target_amount numeric not null, current_amount numeric not null, deadline date,
user_id uuid references auth.users not null
);

-- 4. Segurança (RLS) - Garante que cada usuário veja apenas seus dados
alter table transactions enable row level security;
alter table investments enable row level security;
alter table goals enable row level security;

create policy "User data" on transactions for all using (auth.uid() = user_id);
create policy "User investments" on investments for all using (auth.uid() = user_id);
create policy "User goals" on goals for all using (auth.uid() = user_id);

---

Desenvolvido com React 18 e Supabase.
