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

  @Get('reports')
  reports() {
    return this.admin.getReports();
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

  @Get('vendors/:id')
  getVendor(@Param('id') id: string) {
    return this.admin.getVendor(id);
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

  @Get('orders')
  listOrders(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.admin.listOrders(status, limit ? +limit : 100);
  }

  @Get('customers')
  listCustomers() {
    return this.admin.listCustomers();
  }

  @Get('payouts')
  listPayouts(@Query('status') status?: string) {
    return this.admin.listPayouts(status);
  }

  @Post('payouts/:id/approve')
  approvePayout(@Param('id') id: string) {
    return this.admin.approvePayout(id);
  }

  @Post('payouts/:id/settle')
  settlePayout(@Param('id') id: string) {
    return this.admin.settlePayout(id);
  }

  @Get('disputes')
  listDisputes() {
    return this.admin.listDisputes();
  }
}
