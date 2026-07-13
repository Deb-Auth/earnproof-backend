import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { ListPaymentsDto } from "./dto/list-payments.dto";
import { PaymentsService } from "./payments.service";

@ApiBearerAuth()
@ApiTags("payments")
@UseGuards(AuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("sync")
  syncPayments(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.syncPayments(user);
  }

  @Get()
  listPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPaymentsDto,
  ) {
    return this.paymentsService.listPayments(user.id, query);
  }

  @Get(":id")
  getPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") paymentId: string,
  ) {
    return this.paymentsService.getPayment(user.id, paymentId);
  }
}
