import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.getDashboard();
  }

  @Get('settings')
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.admin.updateSettings(dto);
  }

  @Get('vendors')
  listVendors(@Query('status') status?: string) {
    return this.admin.listVendors(status);
  }

  @Post('vendors/:id/approve')
  approveVendor(@Param('id') id: string) {
    return this.admin.approveVendor(id);
  }

  @Post('vendors/:id/suspend')
  suspendVendor(@Param('id') id: string) {
    return this.admin.suspendVendor(id);
  }

  @Post('vendors/:id/reactivate')
  reactivateVendor(@Param('id') id: string) {
    return this.admin.reactivateVendor(id);
  }
}
