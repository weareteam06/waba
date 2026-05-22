package com.whatsaas.automation.engine;
import java.time.Instant;
public record NodeResult(String branch, Instant waitUntil, String outputJson){public static NodeResult next(String output){return new NodeResult(null,null,output);}public static NodeResult branch(String branch,String output){return new NodeResult(branch,null,output);}public static NodeResult waitUntil(Instant time){return new NodeResult(null,time,"{}");}}
