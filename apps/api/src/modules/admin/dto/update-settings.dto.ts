import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  globalDiscoveryRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFeePaise?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValuePaise?: number;
}
