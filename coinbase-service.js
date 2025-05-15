const { Client, resources, Webhook } = require("coinbase-commerce-node");
const config = require("./coinbase-config");

// Khởi tạo client
const client = Client.init(config.API_KEY);
const { Charge } = resources;

class CoinbasePaymentService {
  // Tạo một charge (yêu cầu thanh toán) mới
  async createCharge(orderData) {
    try {
      const chargeData = {
        name: `Đơn hàng #${orderData.orderId}`,
        description: `Thanh toán cho đơn hàng #${orderData.orderId}`,
        local_price: {
          amount: orderData.amount.toString(),
          currency: "USD", // hoặc 'VND' nếu Coinbase hỗ trợ
        },
        pricing_type: "fixed_price",
        metadata: {
          orderId: orderData.orderId,
          customer: orderData.customerEmail || "guest",
          items: JSON.stringify(orderData.items || []),
        },
        redirect_url: config.SUCCESS_URL,
        cancel_url: config.CANCEL_URL,
      };

      // Gọi API để tạo charge
      const charge = await Charge.create(chargeData);

      // Lưu charge ID vào database để đối chiếu sau này
      await this.saveChargeToDatabase(orderData.orderId, charge.id);

      return {
        chargeId: charge.id,
        hostedUrl: charge.hosted_url, // URL thanh toán của Coinbase
        code: charge.code,
        createdAt: charge.created_at,
        expiresAt: charge.expires_at,
        status: charge.timeline[0].status,
      };
    } catch (error) {
      console.error("Lỗi khi tạo charge:", error);
      throw new Error(`Không thể tạo yêu cầu thanh toán: ${error.message}`);
    }
  }

  // Kiểm tra trạng thái của một charge
  async checkChargeStatus(chargeId) {
    try {
      const charge = await Charge.retrieve(chargeId);
      const latestStatus = charge.timeline[charge.timeline.length - 1].status;

      return {
        chargeId: charge.id,
        status: latestStatus,
        paidAt: latestStatus === "COMPLETED" ? new Date().toISOString() : null,
        payments: charge.payments || [],
      };
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái charge:", error);
      throw new Error(
        `Không thể kiểm tra trạng thái thanh toán: ${error.message}`
      );
    }
  }

  // Xử lý webhook từ Coinbase
  handleWebhook(rawBody, signature) {
    try {
      // Xác thực webhook
      const event = Webhook.verifyEventBody(
        rawBody,
        signature,
        config.WEBHOOK_SECRET
      );

      const { type } = event;
      const chargeId = event.data.id;

      // Xử lý theo loại sự kiện
      switch (type) {
        case "charge:created":
          console.log(`Charge ${chargeId} đã được tạo`);
          break;
        case "charge:confirmed":
          // Thanh toán đã được xác nhận trên blockchain
          console.log(`Charge ${chargeId} đã được xác nhận`);
          this.updateOrderStatus(chargeId, "confirmed");
          break;
        case "charge:failed":
          // Thanh toán thất bại
          console.log(`Charge ${chargeId} thất bại`);
          this.updateOrderStatus(chargeId, "failed");
          break;
        case "charge:delayed":
          // Thanh toán bị trì hoãn
          console.log(`Charge ${chargeId} bị trì hoãn`);
          this.updateOrderStatus(chargeId, "delayed");
          break;
        case "charge:pending":
          // Thanh toán đang chờ xử lý
          console.log(`Charge ${chargeId} đang chờ xử lý`);
          this.updateOrderStatus(chargeId, "pending");
          break;
        case "charge:resolved":
          // Thanh toán đã được giải quyết sau khi bị trì hoãn
          console.log(`Charge ${chargeId} đã được giải quyết`);
          this.updateOrderStatus(chargeId, "resolved");
          break;
        default:
          console.log(`Nhận được sự kiện không xử lý: ${type}`);
      }

      return { status: "success", type };
    } catch (error) {
      console.error("Lỗi khi xử lý webhook:", error);
      throw new Error(`Không thể xử lý webhook: ${error.message}`);
    }
  }

  // Lưu charge vào database
  async saveChargeToDatabase(orderId, chargeId) {
    // Thực hiện lưu vào database (MongoDB, MySQL, v.v.)
    // Đây là code giả định:
    console.log(`Đã lưu charge ID ${chargeId} cho đơn hàng ${orderId}`);
    /*
    await db.collection('orders').updateOne(
      { orderId },
      { $set: { chargeId, paymentStatus: 'pending' } }
    );
    */
  }

  // Cập nhật trạng thái đơn hàng
  async updateOrderStatus(chargeId, status) {
    // Tìm orderId dựa trên chargeId từ database
    // Cập nhật trạng thái đơn hàng
    // Đây là code giả định:
    console.log(
      `Cập nhật đơn hàng với charge ${chargeId} sang trạng thái ${status}`
    );
    /*
    const order = await db.collection('orders').findOne({ chargeId });
    if (order) {
      await db.collection('orders').updateOne(
        { chargeId },
        { $set: { paymentStatus: status, updatedAt: new Date() } }
      );
      
      // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
      if (status === 'confirmed' || status === 'resolved') {
        await orderService.updateOrderStatus(order.orderId, 'paid');
      }
    }
    */
  }
}

module.exports = new CoinbasePaymentService();
