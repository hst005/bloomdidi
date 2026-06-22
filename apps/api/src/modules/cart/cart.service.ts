import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
        shop: true,
      },
    });
    if (!cart) {
      return { shopId: null, shopName: null, items: [], subtotal: 0, deliveryFee: 0, total: 0 };
    }

    const deliveryFee = cart.shop.deliveryFeePaise;
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const customizations = item.customizations as { priceDelta: number }[];
      const customTotal = customizations.reduce((s, c) => s + (c.priceDelta ?? 0), 0);
      const unitPrice = item.product.basePrice + customTotal;
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        imageUrl: item.product.imageUrl,
        qty: item.qty,
        unitPrice,
        customizations: item.customizations,
        lineTotal,
      };
    });

    return {
      shopId: cart.shopId,
      shopName: cart.shop.name,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { shop: true },
    });
    if (!product?.isAvailable || product.stockQty < dto.qty) {
      throw new BadRequestException('Product unavailable or insufficient stock');
    }

    const existingCart = await this.prisma.cart.findUnique({ where: { userId } });
    if (existingCart && existingCart.shopId !== product.shopId) {
      throw new ConflictException({
        message: 'Your cart has items from another florist. Start a new cart?',
        code: 'DIFFERENT_VENDOR',
        currentShopId: existingCart.shopId,
      });
    }

    const cart = existingCart
      ? existingCart
      : await this.prisma.cart.create({
          data: { userId, shopId: product.shopId },
        });

    const customizations = (dto.customizations ?? []) as unknown as Prisma.InputJsonValue;

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        qty: dto.qty,
        customizations,
      },
      update: {
        qty: { increment: dto.qty },
        customizations,
      },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.getUserCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.qty <= 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { qty: dto.qty },
      });
    }

    await this.cleanupEmptyCart(userId);
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getUserCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    await this.cleanupEmptyCart(userId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
    return { message: 'Cart cleared' };
  }

  /** Replace local cart entirely (used after "start new cart" confirmation) */
  async replaceCart(userId: string, dto: AddCartItemDto) {
    await this.prisma.cart.deleteMany({ where: { userId } });
    return this.addItem(userId, dto);
  }

  async getCartForCheckout(userId: string) {
    const cart = await this.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');
    return cart;
  }

  private async getUserCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) throw new NotFoundException('Cart is empty');
    return cart;
  }

  private async cleanupEmptyCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { _count: { select: { items: true } } },
    });
    if (cart && cart._count.items === 0) {
      await this.prisma.cart.delete({ where: { id: cart.id } });
    }
  }
}
