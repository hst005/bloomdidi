import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PatchStoreStatusDto {
  @IsBoolean()
  isOpen!: boolean;
}

export class PatchStoreRadiusDto {
  @IsNumber()
  @Min(1)
  @Max(25)
  serviceRadiusKm!: number;
}

export class PatchStoreBankDto {
  @IsString()
  @MinLength(2)
  accountName!: string;

  @IsString()
  @MinLength(9)
  accountNumber!: string;

  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' })
  ifsc!: string;
}

export class PatchStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  shopName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  hours?: Record<string, { open: string; close: string; closed: boolean }>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatchStoreBankDto)
  bank?: PatchStoreBankDto;
}
