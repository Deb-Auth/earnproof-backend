import { ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentClassification } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListPaymentsDto {
  @ApiPropertyOptional({ enum: PaymentClassification })
  @IsOptional()
  @IsEnum(PaymentClassification)
  classification?: PaymentClassification;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetCode?: string;
}
