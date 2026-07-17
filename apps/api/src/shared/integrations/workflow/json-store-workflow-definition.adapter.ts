import { Injectable, Logger } from '@nestjs/common';
import { JsonStoreFacade } from '@ce/nestjs-shared-json-store';
import {
  IWorkflowDefinitionPort,
  parseStoredWorkflowDefinition,
  WORKFLOW_DEFINITION_PORT,
  WorkflowDefinition,
  WorkflowDefinitionSchema,
} from '@ce/nestjs-shared-workflow';

const NAMESPACE = 'workflow';

function isDraftStoreKey(key: string): boolean {
  return key.endsWith('@draft');
}

function definitionToPayload(definition: WorkflowDefinition): Record<string, unknown> {
  return JSON.parse(JSON.stringify(definition)) as Record<string, unknown>;
}

@Injectable()
export class JsonStoreWorkflowDefinitionAdapter implements IWorkflowDefinitionPort {
  private readonly logger = new Logger(JsonStoreWorkflowDefinitionAdapter.name);

  constructor(private readonly jsonStore: JsonStoreFacade) {}

  async getDefinition(
    definitionId: string,
    version?: number,
  ): Promise<WorkflowDefinition | null> {
    if (isDraftStoreKey(definitionId)) {
      return null;
    }

    if (version != null) {
      const versionedKey = `${definitionId}@v${version}`;
      const payload =
        (await this.jsonStore.get(versionedKey, NAMESPACE)) ??
        (await this.jsonStore.get(definitionId, NAMESPACE));

      if (!payload) return null;

      const parsed = this.parsePayload(payload, versionedKey);
      if (!parsed || parsed.id !== definitionId || parsed.version !== version) {
        return null;
      }
      return parsed;
    }

    const direct = await this.jsonStore.get(definitionId, NAMESPACE);
    if (direct) {
      const parsed = this.parsePayload(direct, definitionId);
      if (parsed?.id === definitionId) return parsed;
    }

    const versions = await this.loadDefinitions(definitionId);
    return versions[0] ?? null;
  }

  validateDefinition(input: unknown): WorkflowDefinition {
    return parseStoredWorkflowDefinition(input);
  }

  async publishDefinition(input: unknown): Promise<WorkflowDefinition> {
    const definition = this.validateDefinition(input);
    const payload = definitionToPayload(definition);

    await this.jsonStore.upsert(definition.id, NAMESPACE, payload);
    await this.jsonStore.upsert(
      `${definition.id}@v${definition.version}`,
      NAMESPACE,
      payload,
    );

    this.logger.log(
      `Published workflow definition ${definition.id} v${definition.version}`,
    );

    return definition;
  }

  async listVersions(definitionId: string): Promise<number[]> {
    const versions = await this.loadDefinitions(definitionId);
    return versions.map((def) => def.version);
  }

  private async loadDefinitions(definitionId: string): Promise<WorkflowDefinition[]> {
    const docs = await this.jsonStore.list(NAMESPACE);
    const definitions: WorkflowDefinition[] = [];

    for (const doc of docs) {
      if (isDraftStoreKey(doc.key)) {
        continue;
      }

      const parsed = this.parsePayload(doc.payload, `${NAMESPACE}/${doc.key}`);
      if (parsed?.id === definitionId) {
        definitions.push(parsed);
      }
    }

    return definitions.sort((a, b) => b.version - a.version);
  }

  private parsePayload(
    payload: Record<string, unknown>,
    sourceKey: string,
  ): WorkflowDefinition | null {
    const parsed = WorkflowDefinitionSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.warn(`Invalid workflow definition payload for ${sourceKey}`);
      return null;
    }
    return parsed.data;
  }
}

export const WORKFLOW_DEFINITION_PROVIDER = {
  provide: WORKFLOW_DEFINITION_PORT,
  useClass: JsonStoreWorkflowDefinitionAdapter,
};
