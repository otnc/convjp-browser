# convjp-browser

ブラウザ(Web)向けの日本語用の文字化けエンコード・デコードライブラリ

> [!NOTE]
> Node.js 環境の軽量版はこちら: [convjp](https://www.npmjs.com/package/convjp)

## 使い方

### 推奨: UMD

URL:
```
https://unpkg.com/convjp-browser@latest/dist/main.umd.js
```

> [!WARNING]
> UMD では default と named が併存するため、ブラウザからは `convjp.encode` のような **named エクスポート** を使うことを推奨します。

```html
<script src="https://unpkg.com/convjp-browser@latest/dist/main.umd.js"></script>
<script>
  const input = "もぺもぺ";
  const encoded = convjp.encode(input);
  const decoded = mojibake.decode(encoded);
  console.log(encoded); // '繧ゅ⊆繧ゅ⊆'
  console.log(decoded); // 'もぺもぺ'
</script>
```

バージョン指定の例: `https://unpkg.com/convjp-browser@1.0.0/dist/main.umd.js`

### 推奨: ESM

```html
<script type="module">
  import { encode, decode } from "/dist/main.es.js";
  const input = "もぺもぺ";
  const encoded = convjp.encode(input);
  const decoded = mojibake.decode(encoded);
  console.log(encoded); // '繧ゅ⊆繧ゅ⊆'
  console.log(decoded); // 'もぺもぺ'
</script>
```
