import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface StockDecrementItem {
  productId: string;
  qty: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atomically decrement stock within an existing transaction.
   * Uses SELECT ... FOR UPDATE via Prisma interactive transaction.
   */
  async decrementStock(
    tx: Prisma.TransactionClient,
    items: StockDecrementItem[],
  ): Promise<void> {
    for (const item of items) {
      const rows = await tx.$queryRaw<{ stock_qty: number; is_available: boolean }[]>`
        SELECT stock_qty, is_available FROM products
        WHERE id = ${item.productId}::uuid
        FOR UPDATE
      `;

      const row = rows[0];
      if (!row || !row.is_available) {
        throw new BadRequestException(`Product ${item.productId} is unavailable`);
      }
      if (row.stock_qty < item.qty) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.qty } },
      });
    }
  }
}
