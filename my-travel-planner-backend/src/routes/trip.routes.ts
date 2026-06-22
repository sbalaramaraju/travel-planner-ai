import { Router } from "express";
import { TripController } from "../controllers/trip.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware as any);

router.post("/generate", TripController.generate);
router.get("/", TripController.getAll);
router.get("/:id", TripController.getById);
router.get("/:id/packing", TripController.getPackingList);
router.put("/:id", TripController.update);
router.delete("/:id", TripController.delete);
router.post("/:id/modify", TripController.modify);

export default router;
