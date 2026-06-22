import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateVendorShopDto {
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(25)
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsString()
  openUntil?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
