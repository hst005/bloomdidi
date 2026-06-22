import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async listByShop(shopId: string, includeHidden = false) {
    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        ...(includeHidden ? {} : { isAvailable: true }),
      },
      include: { customizations: true },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => this.mapProduct(p));
  }

  async findById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { customizations: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.mapProduct(product);
  }

  async create(shopId: string, ownerId: string, dto: CreateProductDto) {
    await this.assertShopOwner(shopId, ownerId);
    const product = await this.prisma.product.create({
      data: {
        shopId,
        name: dto.name,
        description: dto.description,
        basePrice: dto.basePrice,
        category: dto.category,
        stockQty: dto.stockQty,
        imageUrl: dto.imageUrl ?? null,
      },
      include: { customizations: true },
    });
    return this.mapProduct(product);
  }

  async update(productId: string, ownerId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.assertShopOwner(product.shopId, ownerId);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: { customizations: true },
    });
    return this.mapProduct(updated);
  }

  async delete(productId: string, ownerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: true,
        _count: { select: { orderItems: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.assertShopOwner(product.shopId, ownerId);

    if (product._count.orderItems > 0) {
      throw new BadRequestException(
        'This item has past orders and cannot be deleted. Mark it as unavailable instead.',
      );
    }

    await this.prisma.cartItem.deleteMany({ where: { productId } });
    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted' };
  }

  private async assertShopOwner(shopId: string, ownerId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this shop');
    }
  }

  private mapProduct(p: {
    id: string;
    shopId: string;
    name: string;
    description: string | null;
    basePrice: number;
    category: string;
    stockQty: number;
    isAvailable: boolean;
    imageUrl: string | null;
    customizations?: { id: string; productId: string; type: string; name: string; priceDelta: number }[];
  }) {
    return {
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      category: p.category,
      stockQty: p.stockQty,
      isAvailable: p.isAvailable,
      imageUrl: p.imageUrl,
      customizations: p.customizations?.map((c) => ({
        id: c.id,
        productId: c.productId,
        type: c.type,
        name: c.name,
        priceDelta: c.priceDelta,
      })),
    };
  }
}
