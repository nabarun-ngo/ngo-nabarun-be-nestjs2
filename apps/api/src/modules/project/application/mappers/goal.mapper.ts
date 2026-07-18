import { Goal } from '../../domain/aggregates/goal/goal.aggregate';
import { GoalDetailDto } from '../dtos/goal.dto';
export class GoalMapper { static toDto(g: Goal): GoalDetailDto { return { id: g.id, projectId: g.projectId, title: g.title, priority: g.priority, status: g.status, currentValue: g.currentValue, targetValue: g.targetValue, description: g.description }; } }
