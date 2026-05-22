import { SessionGate } from "@/components/session-gate";
import { WorkflowBuilder } from "@/components/workflow-builder";
export default function FlowsPage(){return <SessionGate><WorkflowBuilder/></SessionGate>;}
