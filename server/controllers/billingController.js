const pool = require('../config/db');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

exports.getSubscription = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Subscription WHERE OrganizationID = ?',
      [req.user.organizationId]
    );
    if (!rows.length) return res.json({ status: 'none' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCheckout = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const { priceId } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing/success`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.portal = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const [rows] = await pool.query(
      'SELECT StripeCustomerID FROM Subscription WHERE OrganizationID = ?',
      [req.user.organizationId]
    );
    if (!rows.length) return res.status(404).json({ error: 'No subscription found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].StripeCustomerID,
      return_url: `${process.env.CLIENT_URL}/admin/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.webhook = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await pool.query(
          `INSERT INTO Subscription (StripeCustomerID, StripeSubscriptionID, Plan, Status, CurrentPeriodEnd)
           VALUES (?, ?, 'Starter', 'active', NOW() + INTERVAL 1 MONTH)
           ON DUPLICATE KEY UPDATE StripeSubscriptionID = VALUES(StripeSubscriptionID), Status = 'active'`,
          [session.customer, session.subscription]
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await pool.query(
          "UPDATE Subscription SET Status = 'past_due' WHERE StripeCustomerID = ?",
          [invoice.customer]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await pool.query(
          "UPDATE Subscription SET Status = 'cancelled' WHERE StripeCustomerID = ?",
          [sub.customer]
        );
        break;
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  res.json({ received: true });
};
