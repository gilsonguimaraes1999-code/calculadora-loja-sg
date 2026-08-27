# Calculadora Comercial

Calculadora HUB/TEBEX com autenticação, cidades, permissões e cotações integradas ao Supabase.

## Backend

O fluxo principal usa:

- Supabase Auth para login, cadastro público e redefinição de senha;
- Postgres com RLS para perfis, cidades, cotações e auditoria;
- Edge Functions `admin-users` e `awesome-rates` para operações privilegiadas;
- AwesomeAPI com a chave armazenada somente nos segredos da Edge Function.

As migrations versionadas estão em `supabase/migrations`. O site usa exclusivamente o Supabase,
sem qualquer backend alternativo no frontend ou no build de produção.

## Desenvolvimento local

Requer Node.js e pnpm.

```sh
pnpm install
pnpm dev
```

O arquivo `.env.local` não deve ser enviado ao GitHub. Copie `.env.example` quando precisar usar
outro projeto Supabase. `.env.production` contém somente a URL e a chave publicável deste projeto;
nenhuma chave secreta é incluída no frontend.

## Publicação

1. Envie os arquivos do projeto para o GitHub, sem `node_modules`, `.output`, `.wrangler` ou
   `.env.local`.
2. Configure o host para executar `pnpm install` e `pnpm build`.
3. Adicione a URL pública em **Supabase → Authentication → URL Configuration**, tanto em
   **Site URL** quanto em **Redirect URLs**.
4. Não coloque `AWESOME_API_KEY` no GitHub; ela já deve permanecer nos segredos das Edge Functions.

## Verificação

```sh
node --test tests/*.test.mjs
pnpm lint
pnpm build
```
