import jwt, { decode } from "jsonwebtoken";
import { config } from "../../config.js";
import { prisma } from "../configs/db.js";
// JWT 認證中間件 - 包含資料庫 token 檢查
const authenticator = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: 401, message: "未提供授權憑證" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 驗證 token 是否有效
    const decoded = jwt.verify(token, config.jwtSecretKey);

    const blacklisted = await prisma.tokenblacklist.findUnique({
      where: { token },
    });

    if (blacklisted) {
      return res.status(401).json({ status: 401, message: "此帳號已經登出" });
    }

    // 根據解碼後的使用者 ID 查詢使用者
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    // 檢查使用者是否存在，以及資料庫中的 token 與目前提供的是否一致
    if (!user || user.token !== token) {
      return res.status(401).json({ status: 401, message: "Token 已失效或無效" });
    }

    // 若檢查通過，將解碼後的使用者資訊附加到 req 上
    req.user = decoded;
    req.params.id = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: "無效的 Token" });
  }
};

export { authenticator };
