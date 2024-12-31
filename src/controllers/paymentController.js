// import { firestore } from '../models/firebase.js'; 
import { PreferenceConfig, payment } from '../utils/mercadopago.js';

export const createPreference = async (req, res) => {
  const { auctionId, winningUserId, currentWinningPrice } = req.body;

  try {
    const auctionRef = firestore.collection('subastas').doc(auctionId);
    const auctionDoc = await auctionRef.get();

    if (!auctionDoc.exists || auctionDoc.data()?.isPaid) {
      return res.status(400).json({ error: 'La subasta ya fue pagada o no existe.' });
    }

    const preference = new PreferenceConfig(client);
    const result = await preference.create({
      body: {
        items: [{ id: auctionId, title: 'Ganador de la subasta', quantity: 1, unit_price: currentWinningPrice }],
        back_urls: { 
          success: 'https://puntoencuentro1-3.vercel.app/perfil/subastas', 
          failure: 'https://puntoencuentro1-3.vercel.app/perfil/' 
        },
        auto_return: 'approved',
        notification_url: 'https://backnodemp.onrender.com/payment_success',
        external_reference: winningUserId,
        metadata: { userId: winningUserId }
      },
    });

    return res.json(result);
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error creando preferencia.' });
  }
};

export const paymentWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!data || !data.id) {
      console.error("Invalid webhook payload: Missing 'data.id'");
      return res.status(400).json({ error: "Invalid webhook payload: Missing 'data.id'" });
    }

    const paymentId = data.id;

    console.log("Payment ID received from webhook: ", paymentId);
    console.log("Notification type: ", type);

    if (type !== "payment") {
      console.warn(`Unhandled notification type: ${type}`);
      return res.status(400).json({ error: `Unhandled notification type: ${type}` });
    }

    if (!payment) {
      console.error("MercadoPago SDK not initialized");
      return res.status(500).json({ error: "Internal server error: MercadoPago SDK not initialized" });
    }

    let paymentInfo;
    try {
      paymentInfo = await payment.get({ id: paymentId });
      console.log("Payment Info: ", JSON.stringify(paymentInfo, null, 2));
    } catch (error) {
      console.error("Error fetching payment info: ", error);
      return res.status(500).json({ error: "Error fetching payment info" });
    }

    if (!paymentInfo || paymentInfo.status !== "approved") {
      console.error("Payment not approved or not found");
      return res.status(400).json({ error: "Payment not approved or not found" });
    }

    const { external_reference, transaction_amount, payer } = paymentInfo;

    if (!external_reference) {
      console.error("No external reference found in payment info");
      return res.status(400).json({ error: "No external reference found in payment info" });
    }

    console.log("External reference (winningUserId): ", external_reference);

    const auctionQuery = await firestore
      .collection("subastas")
      .where("winningUserId", "==", external_reference)
      .where("isPaid", "==", false)
      .get();

    if (auctionQuery.empty) {
      console.error(`No pending auction found for winningUserId: ${external_reference}`);
      return res.status(404).json({ error: "No pending auction found" });
    }

    const auctionDoc = auctionQuery.docs[0];
    const auctionData = auctionDoc.data();
    const { serviceId } = auctionData;
    const auctionRef = auctionDoc.ref;

    console.log(`Auction ID: ${auctionDoc.id}, Service ID: ${serviceId}`);

    await auctionRef.update({
      isPaid: true,
      paymentDate: new Date(),
      status: "completed",
      paidAmount: transaction_amount,
      payerEmail: payer?.email || null,
    });

    const serviceRef = firestore.collection("services").doc(serviceId);
    await serviceRef.update({ subastaWinner: true });

    console.log(`Service successfully updated in Firestore: ${serviceRef.id}`);

    return res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error handling payment webhook: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
