# Calculadora Comercial

Versão preparada para hospedagem estática no GitHub + Vercel.

## Executar localmente

```bash
npm install
npm run dev
```

## Publicar na Vercel

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: deixe vazio se estes arquivos estiverem na raiz do repositório.

O arquivo `vercel.json` já contém a regra necessária para abrir `/login` e `/calculator` diretamente sem erro 404.
