import express from "express";
import { prisma } from "../configs/db.js";

import { authenticator as authenticate } from "../middlewares/authenticator.js";


const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const { schedule_id } = req.query;
  try {
    const schedulePlaces = await prisma.schedule_places.findMany({
      where: {
        schedule_id: parseInt(schedule_id),
      },
      include: {
        places: true,
        schedules: true,
      },
    });
    res.status(200).json(schedulePlaces);
  } catch (err) {
    res.status(500).json({ error: "無法取得資料" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // 確保 id 是數字
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const deleted = await prisma.schedule_places.delete({
      where: { id },
    });
    res.status(200).json({ message: "刪除成功", deleted });
  } catch (err) {
    res.status(500).json({ error: "刪除失敗", details: err.message });
  }
});

// 獲取特定日期的景點
router.get("/byDate/:scheduleId/:date", authenticate, async (req, res) => {
  const { scheduleId, date } = req.params;

  try {
    const places = await prisma.schedule_places.findMany({
      where: {
        schedule_id: parseInt(scheduleId),
        which_date: new Date(date),
      },
      include: {
        places: true,
        schedules: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    res.status(200).json(places);
  } catch (error) {
    console.error("Error fetching places by date:", error);
    res.status(500).json({
      error: "獲取景點資料失敗",
      details: error.message,
    });
  }
});

router.post("/", authenticate, async (req, res) => {
  const {
    id,
    place_id,
    schedule_id,
    which_date,
    arrival_time,
    stay_time,
    transportation_way,
    order
  } = req.body;
  try {
    //修改order邏輯
    await prisma.$transaction(async (prisma) => {
      const existingPlaces = await prisma.schedule_places.findMany({
        where: {
          schedule_id,
          which_date: new Date(which_date),
        },
        orderBy: {
          order: "asc",
        },
      });
      // 更新受影響景點的 order--只在新增時調整其他景點的位置
      if (!id) {
        await Promise.all(
          existingPlaces
            .filter((place) => place.order >= order)
            .map((place) =>
              prisma.schedule_places.update({
                where: { id: place.id },
                data: {
                  order: {
                    increment: 1,
                  },
                },
              })
            )
        );
      }

      const upsertedSchedulePlace = await prisma.schedule_places.upsert({
        where: {
          id: id ?? -1, // 使用 -1，確定 id 不存在時應直接進行 create
        },
        update: {
          ...(place_id && { place_id }),
          ...(schedule_id && { schedule_id }),
          ...(which_date && { which_date: new Date(which_date) }),
          ...(arrival_time && {
            arrival_time: new Date(`${which_date}T${arrival_time}Z`),
          }),
          ...(stay_time && { stay_time: new Date(`1970-01-01T${stay_time}Z`) }),
          ...(transportation_way && { transportation_way }),
          ...(order !== undefined && { order }),
        },
        create: {
          place_id,
          schedule_id,
          which_date: new Date(which_date),
          arrival_time: arrival_time
            ? new Date(`${which_date}T${arrival_time}Z`)
            : null,
          stay_time: stay_time ? new Date(`1970-01-01T${stay_time}Z`) : null,
          transportation_way: transportation_way || "Customize",
          order: order || 0,
        },
        include: {
          places: true,
          schedules: true,
        },
      });

      return upsertedSchedulePlace;
    });

    res.status(200).json({ message: "操作成功" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      error: "更新或新增資料時發生錯誤",
      details: err.message,
    });
  }
});



export { router };

