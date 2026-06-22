import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PlatformSettingsDto {
  globalDiscoveryRadiusKm: number;
  commissionPct: number;
  deliveryFeePaise: number;
  minOrderValuePaise: number;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        globalDiscoveryRadiusKm: 6,
        commissionPct: 0,
        deliveryFeePaise: 4000,
        minOrderValuePaise: 0,
      },
    });
  }

  async get(): Promise<PlatformSettingsDto> {
    const s = await this.prisma.platformSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    return {
      globalDiscoveryRadiusKm: s.globalDiscoveryRadiusKm,
      commissionPct: s.commissionPct,
      deliveryFeePaise: s.deliveryFeePaise,
      minOrderValuePaise: s.minOrderValuePaise,
    };
  }

  async update(data: Partial<PlatformSettingsDto>): Promise<PlatformSettingsDto> {
    const s = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data,
    });
    return {
      globalDiscoveryRadiusKm: s.globalDiscoveryRadiusKm,
      commissionPct: s.commissionPct,
      deliveryFeePaise: s.deliveryFeePaise,
      minOrderValuePaise: s.minOrderValuePaise,
    };
  }
}
