// import { firestore } from '../models/firebase.js'; 
import { preapproval } from '../utils/mercadopago.js';

// Crear un ID único para Firestore
function createIdDoc() {
  return firestore.collection('dummyCollection').doc().id; // Usamos un doc temporal para generar el ID
}

// Crear suscripción
export const createSubscription = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { email, userId } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'El campo email es obligatorio.',
    });
  }

  try {
    // Configuración del cuerpo de la solicitud de suscripción
    const body = {
      reason: 'Suscripción estándar', // Razón o descripción de la suscripción
      external_reference: userId, // Referencia externa (ID del usuario)
      auto_recurring: {
        frequency: 1, // Frecuencia de la recurrencia
        frequency_type: 'months', // Tipo de frecuencia
        transaction_amount: 100.0, // Monto de la transacción
        currency_id: 'ARS', // Moneda
      },
      payer_email: email, // Email del pagador
      back_url: 'https://puntoencuentro1-3.vercel.app/perfil/subastas', // URL de redirección
      notification_url: 'https://58d3-2803-9800-b8ca-80a8-88e-3ca8-969-9e57.ngrok-free.app/sub_success', // URL de notificación
      status: 'pending',
    };

    // Crear la suscripción a través de Mercado Pago
    const response = await preapproval.create({ body });

    // Generar un ID único para la suscripción en Firestore
    const subId = createIdDoc();

    // Datos de la suscripción a guardar
    const subData = {
      email, // Correo del suscriptor
      subscriptionId: response.id, // ID de la suscripción creada en Mercado Pago
      subId, // ID generado en Firestore
      createdAt: new Date().toISOString(), // Fecha de creación
      userId, // ID del usuario
    };

    // Guardar los datos de la suscripción en Firestore
    const subscriptionRef = firestore.collection('subscriptions').doc(subId);
    await subscriptionRef.set(subData);

    // Respuesta exitosa con el punto de inicio de la suscripción
    return res.status(200).json({ init_point: response.init_point });
  } catch (error) {
    console.error('Error al crear la suscripción:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Ocurrió un error al intentar crear la suscripción.',
    });
  }
};

// Webhook para procesar notificaciones de suscripciones
export const handleSubscriptionWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // Validación básica del payload
    if (!data || !data.id) {
      console.error("Payload del webhook inválido: falta 'data.id'");
      return res.status(400).json({ error: "Payload del webhook inválido: falta 'data.id'" });
    }

    const subscriptionId = data.id;

    // Verifica si el tipo de evento es relevante para suscripciones
    if (type !== "subscription_preapproval") {
      console.warn(`Tipo de evento no manejado: ${type}`);
      return res.status(400).json({ error: `Tipo de evento no manejado: ${type}` });
    }

    // Obtener los detalles de la suscripción desde Mercado Pago
    let subscriptionDetails;
    try {
      subscriptionDetails = await preapproval.get({ id: subscriptionId });
    } catch (error) {
      console.error("Error obteniendo detalles de la suscripción: ", error);
      return res.status(500).json({ error: "Error obteniendo detalles de la suscripción" });
    }

    // Verifica el estado de la suscripción
    const { external_reference, status } = subscriptionDetails;
    if (status !== "authorized") {
      console.warn(`Estado de la suscripción no es 'authorized': ${status}`);
      return res.status(400).json({ error: `Estado de la suscripción inválido: ${status}` });
    }

    // Verifica que `external_reference` exista
    if (!external_reference) {
      console.error("No se encontró 'external_reference' en los detalles de la suscripción");
      return res.status(400).json({ error: "No se encontró 'external_reference' en los detalles de la suscripción" });
    }

    // Busca en la colección de Firestore usando `external_reference` como userId
    const subscriptionSnapshot = await firestore
      .collection('subscriptions')
      .where('userId', '==', external_reference)
      .get();

    if (subscriptionSnapshot.empty) {
      console.error(`No se encontró una suscripción en Firestore con external_reference: ${external_reference}`);
      return res.status(404).json({ error: 'No se encontró la suscripción' });
    }

    // Toma el primer documento encontrado (suponiendo que `external_reference` es único)
    const subscriptionDoc = subscriptionSnapshot.docs[0];
    const subscriptionRef = subscriptionDoc.ref;

    // Actualiza Firestore con el nuevo estado de la suscripción
    await subscriptionRef.update({
      status: status,
      lastUpdated: new Date().toISOString(),
    });

    console.log(`Suscripción actualizada exitosamente en Firestore: ${subscriptionRef.id}`);
    return res.status(200).json({ message: 'Suscripción procesada exitosamente' });
  } catch (error) {
    console.error("Error procesando el webhook de suscripción: ", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
