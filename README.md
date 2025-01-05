# TriPuzzle 旅圖

**TriPuzzle 旅圖** 是一個讓家人朋友能夠輕鬆協作、共同打造個人化旅遊的旅遊規劃平台，致力於讓每次的旅行都能充滿共享的樂趣，讓每個瞬間都值得被珍藏！

> 此為後端專案，前端專案請參考： **[TriPuzzle](https://github.com/fontend-team4/TriPuzzle)**

## 歡迎來到 TripPuzzle！以下是您使用 TripPuzzle 的重要資訊和步驟指南。

## Git Clone

```sh
git clone https://github.com/fontend-team4/TriPuzzle_Backend.git
```

## Project Setup

1. 透過 MySQL 建立一個空的 Database
2. 安裝套件

```sh
npm install
```

3. Database 資料遷移

```sh
npx prisma migrate dev --name update-schema
```

4. 環境變數可參考 `.env.sample` 建立 `.env` 檔

```
HOST_URL=
DATABASE_URL=
GOOGLE_MAPS_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_REDIRECT_URI=
JWT_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
LINEPAY_CHANNELID=
LINEPAY_SECRET=
LINEPAY_VERSION=
LINEPAY_SITE=
LINEPAY_RETURN_HOST=
LINEPAY_RETURN_CONFIRM_URL=
LINEPAY_RETURN_CANCEL_URL=
```

5. 執行環境

```sh
npm run dev
```

## 網站技術與工具

- 專案規劃

  - Figma
  - GitHub
  - Notion
  - Miro
  - Excalidraw

- 前端開發

  - Vue.js
  - Vite
  - Pinia
  - Tailwind CSS
  - daisyUI

- 後端開發

  - Node.js
  - Express
  - MySQL
  - Prisma
  - AWS S3

- 金流工具

  - LinePay

- 網站部署
  - Railway

## 團隊成員

**宋柏叡**

- Line、Google 第三方登入串接
- 前端地圖定位功能
- 後端「加入景點至行程」API 開發

https://gitHub.com/bo-ruei

**楊子翬**

- 前後端「登入註冊」API 開發與串接
- JWT 認證、Railway 後端部署
- 前端「加入景點至行程」功能串接

https://github.com/jack8512

**張綺恩**

- Google Map、瀑布流景點渲染
- 前後端「行程共同編輯」API 開發與串接
- 前端「景點詳細資料」渲染

https://gitHub.com/kmexin

**陳旻賢**

- 首頁製作
- Google Map API 串接
- 前後端「景點搜尋」API 開發與串接

https://gitHub.com/Timothy9am

**黃慧汶**

- AWS S3 後端圖片上傳、Railway 前端部署
- 會員、行程前後端 API 開發與串接
- 專案、後端資料庫規劃管理

https://gitHub.com/Huiwen-Huang

**張銘原**

- 拖曳物件、分類搜尋功能
- 前後端「景點收藏」API 開發與串接
- 分享景點 QRcode 功能

https://gitHub.com/rodchang12

**李亭潔**

- 加入行程切版
- 後端「收藏及刪除景點」API 開發
- 簡報製作與報告

https://gitHub.com/LindseyL222
