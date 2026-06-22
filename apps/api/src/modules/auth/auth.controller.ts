import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, AdminLoginDto, ChangePasswordDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('otp/send')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      dto.phone,
      dto.otp,
      dto.name,
      dto.role as UserRole | undefined,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: { sub: string }) {
    return this.authService.logout(user.sub);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Post('admin/change-password')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changeAdminPassword(user.sub, dto.currentPassword, dto.newPassword);
  }
}
