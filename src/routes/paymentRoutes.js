import express from 'express';
import { 
  createPreference, 
  paymentWebhook 
} from '../controllers/paymentController.js';

const router = express.Router();

// Rutas para el manejo de preferencias de pago
router.post('/create_preference', createPreference);
router.post('/payment_success', paymentWebhook);

export default router;




