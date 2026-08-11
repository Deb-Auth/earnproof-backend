import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { execFile } from "child_process";
import { promisify } from "util";
import { sha256 } from "../common/crypto/hash";

const execFileAsync = promisify(execFile);

export type AnchorProofInput = {
  proofId: string;
  commitment: string;
  expiresAt: Date;
};

export type AnchorProofResult =
  | {
      anchored: true;
      transactionHash: string;
    }
  | {
      anchored: false;
      reason: "disabled" | "failed";
      error?: string;
    };

@Injectable()
export class ContractAnchoringService {
  private readonly logger = new Logger(ContractAnchoringService.name);
  private readonly enabled: boolean;
  private readonly required: boolean;
  private readonly stellarCliPath: string;
  private readonly source: string | undefined;
  private readonly network: string;
  private readonly proofRegistryContractId: string | undefined;
  private readonly issuerAddress: string | undefined;
  private readonly schemaVersion: number;

  constructor(configService: ConfigService) {
    this.enabled = configService.get<boolean>("contractAnchoring.enabled") ?? false;
    this.required = configService.get<boolean>("contractAnchoring.required") ?? false;
    this.stellarCliPath =
      configService.get<string>("contractAnchoring.stellarCliPath") ?? "stellar";
    this.source = configService.get<string>("contractAnchoring.source");
    this.network = configService.get<string>("stellar.network") ?? "testnet";
    this.proofRegistryContractId = configService.get<string>(
      "contractAnchoring.proofRegistryContractId",
    );
    this.issuerAddress = configService.get<string>(
      "contractAnchoring.issuerAddress",
    );
    this.schemaVersion =
      configService.get<number>("contractAnchoring.schemaVersion") ?? 1;
  }

  async anchorProof(input: AnchorProofInput): Promise<AnchorProofResult> {
    if (!this.enabled || !this.hasRequiredConfig()) {
      return {
        anchored: false,
        reason: "disabled",
      };
    }

    const args = [
      "contract",
      "invoke",
      "--source",
      this.source!,
      "--network",
      this.network,
      "--id",
      this.proofRegistryContractId!,
      "--",
      "register_proof",
      "--proof_id_hash",
      sha256(input.proofId),
      "--commitment_hash",
      this.hexFromSha256(input.commitment),
      "--issuer_address",
      this.issuerAddress!,
      "--schema_version",
      String(this.schemaVersion),
      "--expires_at",
      String(Math.floor(input.expiresAt.getTime() / 1000)),
    ];

    try {
      const { stdout } = await execFileAsync(this.stellarCliPath, args, {
        windowsHide: true,
        timeout: 120_000,
      });
      return {
        anchored: true,
        transactionHash: this.lastOutputLine(stdout),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (this.required) {
        throw error;
      }

      this.logger.warn(`Contract anchoring failed: ${message}`);
      return {
        anchored: false,
        reason: "failed",
        error: message,
      };
    }
  }

  private hasRequiredConfig() {
    return Boolean(
      this.source && this.proofRegistryContractId && this.issuerAddress,
    );
  }

  private hexFromSha256(value: string) {
    const normalized = value.startsWith("sha256:") ? value.slice(7) : value;
    if (!/^[a-fA-F0-9]{64}$/.test(normalized)) {
      return sha256(value);
    }

    return normalized.toLowerCase();
  }

  private lastOutputLine(stdout: string) {
    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.at(-1) ?? "";
  }
}
