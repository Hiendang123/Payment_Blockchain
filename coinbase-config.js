const coinbaseConfig = {
  // Lưu API key trong biến môi trường, không hard-code trong code
  API_KEY:
    process.env.COINBASE_API_KEY || "49740148-6809-4e3d-a3ec-9e9660cfd2b4",

  // Webhook secret để xác thực các webhook từ Coinbase
  WEBHOOK_SECRET:
    process.env.COINBASE_WEBHOOK_SECRET ||
    "623996be-b56f-4c00-91aa-0509635e2c49",

  // URL để chuyển hướng sau khi thanh toán thành công
  SUCCESS_URL: "https://yourwebsite.com/thanh-toan-thanh-cong",

  // URL để chuyển hướng khi hủy thanh toán
  CANCEL_URL: "https://yourwebsite.com/huy-thanh-toan",
};

module.exports = coinbaseConfig;
