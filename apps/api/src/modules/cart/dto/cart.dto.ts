import { IsArray, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CartCustomizationDto {
  customizationId!: string;
  name!: string;
  priceDelta!: number;
}

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  qty!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartCustomizationDto)
  customizations?: CartCustomizationDto[];
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  @Max(99)
  qty!: number;
}
