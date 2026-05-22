package com.whatsaas.automation.engine;
import com.fasterxml.jackson.databind.JsonNode; import com.whatsaas.automation.domain.WorkflowExecution; import java.time.Instant; import org.springframework.stereotype.Component;
@Component public class DelayNodeProcessor implements WorkflowNodeProcessor{public String type(){return "delay";} public NodeResult process(WorkflowExecution e,JsonNode n,JsonNode c){long seconds=Math.max(1,n.path("data").path("seconds").asLong(60));return NodeResult.waitUntil(Instant.now().plusSeconds(seconds));}}
