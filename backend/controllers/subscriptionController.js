import { Notification, SubscriptionPayment, db } from '../db/models.js';
import { normalizeEmail } from '../utils/auth.js';

// Store a new payment
export const createPayment = async (req, res) => {
  try {
    const { userEmail, amount, paymentMethod, transactionId, status, details } = req.body;
    if (!userEmail || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await db.sequelize.transaction();
    try {
      const email = normalizeEmail(userEmail);
      const payment = await SubscriptionPayment.create(
        {
          UserEmail: email,
          Amount: Number(amount),
          PaymentMethod: paymentMethod,
          TransactionId: transactionId || null,
          Status: status || 'pending',
          Details: details || null,
        },
        { transaction },
      );

      await Notification.create(
        {
          UserEmail: email,
          Title: 'Subscription Payment Update',
          Message: `Payment status is ${payment.Status}.`,
          Type: payment.Status === 'completed' ? 'success' : payment.Status === 'failed' ? 'danger' : 'info',
        },
        { transaction },
      );

      await transaction.commit();

      res.status(201).json({
        _id: payment.SubscriptionPaymentId,
        userEmail: payment.UserEmail,
        amount: Number(payment.Amount),
        paymentMethod: payment.PaymentMethod,
        transactionId: payment.TransactionId,
        status: payment.Status,
        paidAt: payment.PaidAt,
        details: payment.Details,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all payments for a user
export const getPayments = async (req, res) => {
  try {
    const { userEmail } = req.query;
    const where = userEmail ? { UserEmail: normalizeEmail(userEmail) } : {};
    const payments = await SubscriptionPayment.findAll({ where, order: [['PaidAt', 'DESC']] });

    res.json(
      payments.map((payment) => ({
        _id: payment.SubscriptionPaymentId,
        userEmail: payment.UserEmail,
        amount: Number(payment.Amount),
        paymentMethod: payment.PaymentMethod,
        transactionId: payment.TransactionId,
        status: payment.Status,
        paidAt: payment.PaidAt,
        details: payment.Details,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
