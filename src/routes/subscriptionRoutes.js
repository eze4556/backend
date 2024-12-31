import express from 'express';
import { 
    createSubscription, 
    handleSubscriptionWebhook 
  } from '../controllers/subscriptionController.js';
  
const router = express.Router();

// Rutas para la creación y manejo de suscripciones
router.post('/create_subscription', createSubscription);
router.post('/sub_success', handleSubscriptionWebhook);

export default router;
