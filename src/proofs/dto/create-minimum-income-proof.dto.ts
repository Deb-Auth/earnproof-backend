import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateMinimumIncomeProofDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  selectedPaymentIds!: string[];

  @IsString()
  @Matches(/^\d+(\.\d{1,7})?$/)
  thresholdAmount!: string;

  @IsString()
  assetCode!: string;

  @IsOptional()
  @IsString()
  assetIssuer?: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
