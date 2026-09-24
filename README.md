# 女友翻譯器

基於 [TypeSafe AI](https://typesafe.ai/) 的 **Jev System One 模型** 建立的實驗專案。它根據你提供的訊息與脈絡，輸出對方 **可能的心情狀態**。

## 安裝

需要 Node.js 22 或更新版本。

```sh
npm install
chmod +x girlfriend
cp .env.example .env
```

然後在 `.env` 設定 `TYPESAFE_API_KEY` (在 https://console.typesafe.ai/keys 中建立新的 API Key)。

## 使用方式

```sh
./girlfriend "女友的訊息"
```
