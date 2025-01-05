import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middlewares/auth.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
const HOST_URL = process.env.HOST_URL;

const generateShareToken = (scheduleId) => {
  const payload = { scheduleId };
  const secret = process.env.JWT_SECRET;
  return jwt.sign(payload, secret);
};

const verifyShareToken = (token) => {
  const secret = process.env.JWT_SECRET;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("token無效");
  }
};

const router = express.Router();
const prisma = new PrismaClient();

// 取得共編行程
router.get("/", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const coEditSchedules = await prisma.users_schedules.findMany({
      where: { user_id: userId },
      include: { schedules: true },
    });

    const formattedCoEditSchedules = coEditSchedules.map((item) => ({
      ...item.schedules,
    }));

    res.json(formattedCoEditSchedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得即將加入的行程資訊
router.get("/join/:shareToken", authenticate, async (req, res) => {
  const { shareToken } = req.params;
  const userId = req.user.id;

  try {
    const { scheduleId } = verifyShareToken(shareToken);

    const schedule = await prisma.schedules.findUnique({
      where: { id: Number(scheduleId) },
    });

    if (!schedule) {
      console.error("No schedule found for ID:", scheduleId);
      return res.status(404).json({ error: "行程不存在" });
    }

    if (String(schedule.create_by) === String(userId)) {
      return res.status(400).json({ error: "行程主創者無法加入共編喔" });
    }

    const existingRelation = await prisma.users_schedules.findUnique({
      where: {
        schedule_id_user_id: {
          schedule_id: schedule.id,
          user_id: userId,
        },
      },
    });

    if (existingRelation) {
      return res.status(400).json({ error: "您已加入此共編" });
    }

    res.json({ schedule });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ error: "登入憑證過期，請重新登入" });
    } else {
      console.error("Unexpected error:", error);
      res.status(500).json({ error: "伺服器錯誤，請稍後再試" });
    }
  }
});

// 加入行程
router.post("/join/:shareToken", authenticate, async (req, res) => {
  const { shareToken } = req.params;
  const userId = req.user.id;

  try {
    const { scheduleId } = verifyShareToken(shareToken);

    const schedule = await prisma.schedules.findUnique({
      where: { id: Number(scheduleId) },
    });

    if (!schedule) {
      return res.status(404).json({ error: "查無此行程" });
    }

    if (schedule.create_by === userId) {
      return res.status(400).json({ error: "行程主創者無法加入共編喔" });
    }

    const existingRelation = await prisma.users_schedules.findUnique({
      where: {
        schedule_id_user_id: {
          schedule_id: schedule.id,
          user_id: userId,
        },
      },
    });

    if (existingRelation) {
      return res.status(400).json({ error: "您已加入此行程" });
    }

    // 建立新的關聯
    await prisma.users_schedules.create({
      data: {
        schedule_id: schedule.id,
        user_id: userId,
        access: true,
      },
    });

    // 更新 total_users
    await prisma.schedules.update({
      where: { id: scheduleId },
      data: {
        total_users: {
          increment: 1,
        },
      },
    });

    res.json({ message: "成功加入行程！" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 查詢行程的所有使用者（建立者和共編者）
router.get("/:id/users", authenticate, async (req, res) => {
  const scheduleId = parseInt(req.params.id, 10);

  if (isNaN(scheduleId)) {
    return res.status(400).json({ message: "行程 ID 無效" });
  }

  try {
    const schedule = await prisma.schedules.findUnique({
      where: { id: scheduleId },
      select: {
        id: true,
        title: true,
        create_by: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: "此行程不存在" });
    }

    const creator = await prisma.users.findUnique({
      where: { id: schedule.create_by },
      select: {
        id: true,
        name: true,
        email: true,
        profile_pic_url: true,
      },
    });

    const sharedUsers = await prisma.users_schedules.findMany({
      where: { schedule_id: scheduleId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_pic_url: true,
          },
        },
      },
    });

    const result = {
      schedule_id: schedule.id,
      title: schedule.title,
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        ...(creator.profile_pic_url
          ? { profile_pic_url: creator.profile_pic_url }
          : {}),
      },
      sharedUsers: sharedUsers.map((item) => ({
        id: item.users.id,
        name: item.users.name,
        email: item.users.email,
        ...(item.users.profile_pic_url
          ? { profile_pic_url: item.users.profile_pic_url }
          : {}),
      })),
      totalUsers: 1 + sharedUsers.length,
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 生成網址
router.post("/share/:scheduleId", authenticate, async (req, res) => {
  const { scheduleId } = req.params;

  try {
    const schedule = await prisma.schedules.findUnique({
      where: { id: Number(scheduleId) },
    });
    if (!schedule) {
      return res.status(404).json({ error: "行程不存在" });
    }

    const shareToken = generateShareToken(schedule.id);

    await prisma.schedules.update({
      where: { id: schedule.id },
      data: { share_token: shareToken },
    });

    const shareUrl = `${HOST_URL}/planner/join/${shareToken}`;
    res.json({ shareUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 退出共編
router.delete("/:scheduleId", authenticate, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    const userId = req.user.id;

    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: "行程 ID 無效" });
    }

    const schedule = await prisma.schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return res.status(404).json({ message: "行程不存在" });
    }

    const isOwner = schedule.create_by === userId;

    if (isOwner) {
      return res.status(403).json({ message: "主創者無法退出共編" });
    }

    const userSchedule = await prisma.users_schedules.findUnique({
      where: {
        schedule_id_user_id: { schedule_id: scheduleId, user_id: userId },
      },
    });

    if (!userSchedule) {
      return res.status(404).json({ message: "共編記錄不存在" });
    }

    await prisma.users_schedules.delete({
      where: {
        schedule_id_user_id: { schedule_id: scheduleId, user_id: userId },
      },
    });

    await prisma.schedules.update({
      where: { id: scheduleId },
      data: {
        total_users: {
          decrement: 1,
        },
      },
    });

    res.status(200).json({ message: "成功退出共編" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 踢出共編
router.delete("/:scheduleId/:userId", authenticate, async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const userId = req.user.id;

    if (isNaN(scheduleId) || isNaN(targetUserId)) {
      return res.status(400).json({ message: "行程 ID 或用戶 ID 無效" });
    }

    const schedule = await prisma.schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return res.status(404).json({ message: "行程不存在" });
    }

    if (schedule.create_by !== userId) {
      return res.status(403).json({ message: "只有主創者可以踢出共編成員喔" });
    }

    const userSchedule = await prisma.users_schedules.findUnique({
      where: {
        schedule_id_user_id: { schedule_id: scheduleId, user_id: targetUserId },
      },
    });

    if (!userSchedule) {
      return res.status(404).json({ message: "共編記錄不存在" });
    }

    await prisma.users_schedules.delete({
      where: {
        schedule_id_user_id: { schedule_id: scheduleId, user_id: targetUserId },
      },
    });

    await prisma.schedules.update({
      where: { id: scheduleId },
      data: {
        total_users: {
          decrement: 1,
        },
      },
    });

    res.status(200).json({ message: "成功移除共編成員" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router };
