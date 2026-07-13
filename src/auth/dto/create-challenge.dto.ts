import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateChallengeDto {
  @ApiProperty({
    example: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  })
  @IsString()
  @Length(56, 56)
  walletAddress!: string;
}
