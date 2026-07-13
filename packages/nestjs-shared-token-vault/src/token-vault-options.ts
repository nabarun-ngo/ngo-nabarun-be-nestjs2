import { TokenVault2OptionsSchema } from './token-vault.schema';

export const TOKEN_VAULT2_OPTIONS = Symbol('TOKEN_VAULT2_OPTIONS');

/**
 * Single source of truth for module options — inferred from the Zod schema
 * so the TypeScript type and runtime validation can never drift apart.
 */
export type TokenVault2ModuleOptions = import('zod').infer<typeof TokenVault2OptionsSchema>;
