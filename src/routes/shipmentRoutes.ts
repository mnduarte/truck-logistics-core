import express from 'express';
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
} from '../controllers/shipmentController';

const router = express.Router();

router.route('/')
  .get(getShipments)
  .post(createShipment);

router.route('/:id')
  .get(getShipment)
  .put(updateShipment)
  .delete(deleteShipment);

// Ruta para actualizar estado
router.route('/:id/status')
  .patch(updateShipmentStatus);

export default router;