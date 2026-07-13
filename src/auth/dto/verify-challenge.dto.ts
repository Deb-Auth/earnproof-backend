import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class VerifyChallengeDto {
  @ApiProperty()
  @IsString()
  challengeId!: string;

  @ApiProperty({
    example: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  })
  @IsString()
  @Length(56, 56)
  walletAddress!: string;

  @ApiProperty({
    description: "Base64 or hex-encoded signature of the challenge message.",
  })
  @IsString()
  signature!: string;
}
