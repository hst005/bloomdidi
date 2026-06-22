import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [SchedulingService],
})
export class SchedulingModule {}