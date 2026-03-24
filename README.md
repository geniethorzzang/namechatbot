This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open **[http://localhost:3000](http://localhost:3000)** (또는 `http://127.0.0.1:3000`) — **Network 주소(예: 172.x.x.x)로 열면** HMR WebSocket 오류가 날 수 있습니다.

WebSocket 오류가 계속되면: `npm run dev:webpack` 으로 실행해 보세요.

## Vercel 배포

1. GitHub에 **전체 프로젝트**( `package.json`, `package-lock.json`, `app/`, `next.config.ts` 등)가 푸시되어 있어야 합니다.
2. Vercel 프로젝트 **Settings → Environment Variables**에 `OPENAI_API_KEY` 를 등록하세요.
3. Node 버전은 `.nvmrc` / `package.json` 의 `engines` 로 20.x 를 사용합니다.
4. 프로덕션 빌드는 `next build --webpack` 으로 실행됩니다 (Turbopack 대신 Webpack — Vercel 호환).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
