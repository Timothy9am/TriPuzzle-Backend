import express from "express";
import { searchPlaces } from "../controllers/placesController.js";
import { getRoute, calculateDistances } from "../controllers/mapController.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); 
const router = express.Router();

router.get("/search", searchPlaces);
router.post("/directions", getRoute);
router.post("/distances", calculateDistances);

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.places.findMany();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('/:place_id', async (req, res) => {
  try{
    const place = await prisma.places.findUnique({
      where: { place_id: req.params.place_id },
    });
    if (!place) {
      return res.status(404).json({ error: '找不到景點' });
    }
    res.json(place);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  const { place_id, name, address } = req.body;
  if (!place_id || !name || !address) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  const placeData = req.body;
  try {
    // 使用 upsert，避免place_id重複
    const place = await prisma.places.upsert({
      where: { place_id: placeData.place_id },
      update: placeData,
      create: placeData,
    });
    res.status(200).json({ message: '已新增景點', place });
  } catch (error) {
    res.status(500).json({ error: '新增景點出現錯誤', details: error.message });
  }
});

export { router };
