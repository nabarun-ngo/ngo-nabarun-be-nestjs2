import { Injectable } from '@nestjs/common';
import { evaluateCondition } from '@ce/nestjs-shared-core';
import type { SequenceFlow, WorkflowDefinition, WorkflowElement } from '../dsl/workflow-definition.schema';
import { WorkflowNoOutgoingFlowError } from '../domain/errors/workflow.errors';

export interface WorkflowGraphIndex {
  elementsById: Map<string, WorkflowElement>;
  outgoingBySource: Map<string, SequenceFlow[]>;
  incomingByTarget: Map<string, SequenceFlow[]>;
}

@Injectable()
export class TransitionRouter {
  buildIndex(definition: WorkflowDefinition): WorkflowGraphIndex {
    const elementsById = new Map(definition.elements.map((e) => [e.id, e]));
    const outgoingBySource = new Map<string, SequenceFlow[]>();
    const incomingByTarget = new Map<string, SequenceFlow[]>();

    for (const flow of definition.flows) {
      const outgoing = outgoingBySource.get(flow.sourceRef) ?? [];
      outgoing.push(flow);
      outgoingBySource.set(flow.sourceRef, outgoing);

      const incoming = incomingByTarget.get(flow.targetRef) ?? [];
      incoming.push(flow);
      incomingByTarget.set(flow.targetRef, incoming);
    }

    return { elementsById, outgoingBySource, incomingByTarget };
  }

  getOutgoingFlows(index: WorkflowGraphIndex, sourceRef: string): SequenceFlow[] {
    return index.outgoingBySource.get(sourceRef) ?? [];
  }

  getIncomingFlows(index: WorkflowGraphIndex, targetRef: string): SequenceFlow[] {
    return index.incomingByTarget.get(targetRef) ?? [];
  }

  selectExclusiveFlow(
    flows: SequenceFlow[],
    context: Record<string, unknown>,
  ): SequenceFlow {
    const conditional = flows.filter((f) => f.condition);
    for (const flow of conditional) {
      if (evaluateCondition(flow.condition!, context)) {
        return flow;
      }
    }

    const defaultFlow = flows.find((f) => f.isDefault);
    if (defaultFlow) {
      return defaultFlow;
    }

    const unconditional = flows.find((f) => !f.condition);
    if (unconditional) {
      return unconditional;
    }

    throw new WorkflowNoOutgoingFlowError(flows[0]?.sourceRef ?? 'unknown');
  }

  selectInclusiveFlows(
    flows: SequenceFlow[],
    context: Record<string, unknown>,
  ): SequenceFlow[] {
    const matched = flows.filter(
      (f) => !f.condition || evaluateCondition(f.condition, context),
    );
    if (matched.length > 0) {
      return matched;
    }

    const defaultFlow = flows.find((f) => f.isDefault);
    if (defaultFlow) {
      return [defaultFlow];
    }

    throw new WorkflowNoOutgoingFlowError(flows[0]?.sourceRef ?? 'unknown');
  }

  selectParallelFlows(flows: SequenceFlow[]): SequenceFlow[] {
    if (flows.length === 0) {
      throw new WorkflowNoOutgoingFlowError('unknown');
    }
    return flows;
  }
}
