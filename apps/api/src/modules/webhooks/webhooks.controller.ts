import { Controller, Headers, Post, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/roles.decorator';
import { PaymentsService } from '../payments/payments.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private paymentsService: PaymentsService) {}

  @Public()
  @Post('razorpay')
  razorpay(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? (req.body as Buffer);
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing webhook body or signature');
    }

    if (!this.paymentsService.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    return this.paymentsService.handleWebhookEvent(event);
  }
}
