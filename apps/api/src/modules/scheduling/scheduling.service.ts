import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Activate scheduled orders whose delivery window is approaching */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledOrders() {
    const now = new Date();
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.SCHEDULED,
        scheduledFor: { lte: now },
      },
      include: { shop: true },
    });

    for (const order of orders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PLACED },
      });
      await this.notifications.notifyVendorNewOrder(order.shop.ownerId, order.id);
    }

    if (orders.length > 0) {
      this.logger.log(`Activated ${orders.length} scheduled order(s)`);
    }
  }
}
