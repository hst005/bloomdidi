import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Public()
  @Get('shops/:shopId/products')
  listByShop(@Param('shopId') shopId: string) {
    return this.catalogService.listByShop(shopId, false);
  }

  @Get('shops/:shopId/products/manage')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  listByShopManage(@Param('shopId') shopId: string) {
    return this.catalogService.listByShop(shopId, true);
  }

  @Public()
  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findById(id);
  }

  @Post('shops/:shopId/products')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  create(
    @Param('shopId') shopId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalogService.create(shopId, user.sub, dto);
  }

  @Patch('products/:id')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.update(id, user.sub, dto);
  }
}
