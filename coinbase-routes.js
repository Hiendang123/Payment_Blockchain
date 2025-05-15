const express = require("express");
const router = express.Router();
const coinbaseService = require("./coinbase-service");

// Tạo charge mới
router.post("/create-charge", async (req, res) => {
  try {
    const { orderId, amount, customerEmail, items } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: "Thiếu thông tin đơn hàng" });
    }

    const chargeData = await coinbaseService.createCharge({
      orderId,
      amount,
      customerEmail,
      items,
    });

    res.json(chargeData);
  } catch (error) {
    console.error("Lỗi API tạo charge:", error);
    res.status(500).json({ error: error.message });
  }
});

// Kiểm tra trạng thái charge
router.get("/check-charge/:chargeId", async (req, res) => {
  try {
    const { chargeId } = req.params;

    if (!chargeId) {
      return res.status(400).json({ error: "Thiếu charge ID" });
    }

    const statusData = await coinbaseService.checkChargeStatus(chargeId);
    res.json(statusData);
  } catch (error) {
    console.error("Lỗi API kiểm tra charge:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook để nhận thông báo từ Coinbase
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      // Lấy signature từ header
      const signature = req.headers["x-cc-webhook-signature"];

      if (!signature) {
        return res.status(400).json({ error: "Thiếu webhook signature" });
      }

      // Xử lý webhook
      const result = coinbaseService.handleWebhook(req.body, signature);
      res.json(result);
    } catch (error) {
      console.error("Lỗi xử lý webhook:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
