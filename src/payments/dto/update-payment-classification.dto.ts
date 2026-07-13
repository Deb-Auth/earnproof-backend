import { ApiProperty } from "@nestjs/swagger";
import { PaymentClassification } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdatePaymentClassificationDto {
  @ApiProperty({ enum: PaymentClassification })
  @IsEnum(PaymentClassification)
  classification!: PaymentClassification;
}
