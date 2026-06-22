import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyVendorNewOrder(vendorId: string, orderId: string) {
    // Phase 1 stub — wire FCM + sound alert in production
    this.logger.log(`[PUSH] New order ${orderId} → vendor ${vendorId}`);
  }

  async notifyCustomerOrderUpdate(customerId: string, orderId: string, status: string) {
    this.logger.log(`[PUSH] Order ${orderId} → ${status} for customer ${customerId}`);
  }

  async sendOccasionReminder(phone: string, occasion: string, daysUntil: number) {
    this.logger.log(`[SMS] Reminder: ${occasion} in ${daysUntil} days → ${phone}`);
  }
}
