# field-watch

FIELDWATCH（現場管理システム デモ版）。`index.html` のみで完結する静的サイトで、ビルド不要。天気・積算温度は open-meteo.com の公開APIをブラウザから直接呼び出す。

## Cloudflareへのデプロイ

### 方法A: Cloudflare Pages（Git連携・推奨）

1. Cloudflareダッシュボード → Workers & Pages → Create → Pages → **Connect to Git**
2. このリポジトリ（`8901ky2359-alt/field-watch`）を選択
3. ビルド設定:
   - Framework preset: `None`
   - Build command: 空欄のまま
   - Build output directory: `/`
4. Save and Deploy

以後、対象ブランチへのpushで自動デプロイされる。

### 方法B: Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=field-watch
```

`wrangler.toml` に `pages_build_output_dir = "."` を設定済みなので追加設定は不要。
