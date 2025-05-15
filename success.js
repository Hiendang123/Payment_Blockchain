document.addEventListener("DOMContentLoaded", () => {
  // Lấy charge ID từ URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const chargeId = urlParams.get("charge_id");

  if (chargeId) {
    // Kiểm tra trạng thái charge
    checkChargeStatus(chargeId);
  }

  async function checkChargeStatus(chargeId) {
    try {
      const response = await fetch(`/api/coinbase/check-charge/${chargeId}`);
      const statusData = await response.json();

      const statusElement = document.getElementById("payment-status");
      if (statusElement) {
        if (statusData.status === "COMPLETED") {
          statusElement.textContent = "Thanh toán đã hoàn tất!";
          statusElement.className = "success";
        } else {
          statusElement.textContent = `Trạng thái thanh toán: ${statusData.status}`;
          statusElement.className = "pending";

          // Kiểm tra lại sau 10 giây
          setTimeout(() => checkChargeStatus(chargeId), 10000);
        }
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái:", error);
    }
  }
});
