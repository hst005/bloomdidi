import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth';
import { validateEnv } from './config/env.validation';
import { auth } from './lib/better-auth';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopsModule } from './modules/shops/shops.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { GeoModule } from './modules/geo/geo.module';
import { AdminModule } from './modules/admin/admin.module';
import { CartModule } from './modules/cart/cart.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { VendorModule } from './modules/vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    BetterAuthNestModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { enabled: true, extended: true, limit: '2mb' },
        rawBody: true,
      },
    }),
    SettingsModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    SchedulingModule,
    PaymentsModule,
    NotificationsModule,
    HealthModule,
    GeoModule,
    AdminModule,
    CartModule,
    WebhooksModule,
    VendorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
