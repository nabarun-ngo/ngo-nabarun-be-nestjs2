import { SetMetadata, Type } from '@nestjs/common';

export const REPORT_PROVIDER_METADATA_KEY = 'REPORT_PROVIDER_METADATA_KEY';

export function ReportProvider(): <T extends Type<IReportProvider<any>>>(target: T) => void {
  return (target: Type<IReportProvider<any>>) => {
    SetMetadata(REPORT_PROVIDER_METADATA_KEY, true)(target);
  };
}

export interface ReportGeneratedData {
  buffer: Buffer;
  fileName: string;
  fileExtension: string;
  contentType: string;
}

export interface ReportFieldDef<TKey extends string = string> {
  key: TKey;
  defKey: string;
  label: string;
  mandatory?: boolean;
}

export interface ReportDefinition {
  reportCode: string;
  displayName: string;
  description: string;
  requiresApproval: boolean;
  approverRoles: string[] | undefined;
  visibleToRoles: string[];
  isActive: boolean;
}

export interface IReportProvider<TParams extends Record<string, unknown> = Record<string, unknown>> {
  readonly reportCode: string;
  readonly reportParams: ReportFieldDef<Extract<keyof TParams, string>>[];
  generate(params: TParams): Promise<ReportGeneratedData>;
}
