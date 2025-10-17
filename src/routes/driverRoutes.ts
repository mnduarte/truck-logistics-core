import express from "express";
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  toggleDriverStatus,
} from "../controllers/driverController";

const router = express.Router();

router.route("/").get(getDrivers).post(createDriver);

router.route("/:id").get(getDriver).put(updateDriver).delete(deleteDriver);

router.patch("/:id/toggle-status", toggleDriverStatus);

export default router;
