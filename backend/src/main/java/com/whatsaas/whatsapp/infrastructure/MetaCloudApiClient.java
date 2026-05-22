package com.whatsaas.whatsapp.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsaas.whatsapp.domain.MessageType;
import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class MetaCloudApiClient {

    private final MetaCloudProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public MetaCloudApiClient(MetaCloudProperties properties, ObjectMapper objectMapper, RestClient.Builder builder) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = builder.baseUrl(properties.graphBaseUrl()).build();
    }

    public MetaSendResult send(WhatsAppMessage message) {
        requireAccessToken();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");
        payload.put("to", digits(message.getRecipient()));
        payload.put("type", message.getType().name().toLowerCase());
        if (message.getType() == MessageType.TEXT) {
            payload.put("text", Map.of("preview_url", false, "body", message.getBody()));
        } else {
            payload.put(message.getType().name().toLowerCase(), mediaPayload(message));
        }
        try {
            String response = restClient.post()
                    .uri("/{version}/{phoneNumberId}/messages", properties.graphVersion(), message.getPhoneNumberId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .body(payload)
                    .retrieve()
                    .body(String.class);
            JsonNode result = objectMapper.readTree(response);
            String messageId = result.path("messages").path(0).path("id").asText(null);
            if (messageId == null || messageId.isBlank()) {
                throw new MetaProviderException("Meta send response did not include a message id.");
            }
            return new MetaSendResult(messageId);
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta send failed with HTTP " + ex.getStatusCode() + ": "
                    + summarize(ex.getResponseBodyAsString()), ex);
        } catch (Exception ex) {
            if (ex instanceof MetaProviderException providerException) {
                throw providerException;
            }
            throw new MetaProviderException("Meta send response could not be processed.", ex);
        }
    }

    public JsonNode createTemplate(String wabaId, String name, String language, String category, JsonNode components) {
        requireAccessToken();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", name);
        payload.put("language", language);
        payload.put("category", category);
        payload.put("components", components);
        return graphPost("/{version}/{wabaId}/message_templates", payload, properties.graphVersion(), wabaId);
    }

    public JsonNode listTemplates(String wabaId) {
        requireAccessToken();
        return graphGet("/{version}/{wabaId}/message_templates?fields=id,name,language,category,status,components",
                properties.graphVersion(), wabaId);
    }

    public void deleteTemplate(String wabaId, String name) {
        requireAccessToken();
        try {
            restClient.delete()
                    .uri("/{version}/{wabaId}/message_templates?name={name}", properties.graphVersion(), wabaId, name)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta template delete failed with HTTP " + ex.getStatusCode() + ".", ex);
        }
    }

    public JsonNode templateAnalytics(String wabaId, List<String> templateIds, long startEpoch, long endEpoch) {
        requireAccessToken();
        return graphGet("/{version}/{wabaId}/template_analytics?granularity=DAILY&metric_types=cost,clicked,delivered,read,sent&template_ids={ids}&start={start}&end={end}",
                properties.graphVersion(), wabaId, String.join(",", templateIds), startEpoch, endEpoch);
    }

    public MetaSendResult sendTemplate(String phoneNumberId, String recipient, String name, String language,
                                       JsonNode components) {
        requireAccessToken();
        Map<String, Object> template = new LinkedHashMap<>();
        template.put("name", name);
        template.put("language", Map.of("code", language));
        if (components != null && !components.isEmpty()) template.put("components", components);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("to", digits(recipient));
        payload.put("type", "template");
        payload.put("template", template);
        JsonNode result = graphPost("/{version}/{phoneNumberId}/messages", payload, properties.graphVersion(),
                phoneNumberId);
        String id = result.path("messages").path(0).path("id").asText(null);
        if (id == null || id.isBlank()) throw new MetaProviderException("Meta template send returned no message id.");
        return new MetaSendResult(id);
    }

    public MetaMediaMetadata mediaMetadata(String mediaId) {
        requireAccessToken();
        try {
            String response = restClient.get()
                    .uri("/{version}/{mediaId}", properties.graphVersion(), mediaId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .retrieve()
                    .body(String.class);
            JsonNode result = objectMapper.readTree(response);
            return new MetaMediaMetadata(result.path("id").asText(mediaId), result.path("url").asText(),
                    result.path("mime_type").asText(MediaType.APPLICATION_OCTET_STREAM_VALUE));
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta media metadata failed with HTTP " + ex.getStatusCode() + ".", ex);
        } catch (Exception ex) {
            throw new MetaProviderException("Meta media metadata response could not be processed.", ex);
        }
    }

    public byte[] download(String mediaUrl) {
        requireAccessToken();
        try {
            return restClient.get()
                    .uri(mediaUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .retrieve()
                    .body(byte[].class);
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta media download failed with HTTP " + ex.getStatusCode() + ".", ex);
        }
    }

    private Map<String, Object> mediaPayload(WhatsAppMessage message) {
        try {
            JsonNode json = objectMapper.readTree(message.getProviderPayload());
            Map<String, Object> payload = new LinkedHashMap<>();
            copy(json, payload, "id");
            copy(json, payload, "link");
            copy(json, payload, "caption");
            if (message.getType() == MessageType.DOCUMENT) {
                copy(json, payload, "filename");
            }
            return payload;
        } catch (Exception ex) {
            throw new MetaProviderException("Stored media payload is invalid.", ex);
        }
    }

    private void copy(JsonNode source, Map<String, Object> target, String field) {
        if (source.hasNonNull(field) && !source.path(field).asText().isBlank()) {
            target.put(field, source.path(field).asText());
        }
    }

    private String digits(String e164) {
        return e164.startsWith("+") ? e164.substring(1) : e164;
    }

    private String summarize(String value) {
        return value == null ? "" : value.substring(0, Math.min(512, value.length()));
    }

    private void requireAccessToken() {
        if (properties.accessToken() == null || properties.accessToken().isBlank()) {
            throw new MetaProviderException("META_WHATSAPP_ACCESS_TOKEN is not configured.");
        }
    }

    private JsonNode graphGet(String uri, Object... values) {
        try {
            String response = restClient.get().uri(uri, values)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .retrieve().body(String.class);
            return objectMapper.readTree(response);
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta Graph GET failed with HTTP " + ex.getStatusCode() + ": "
                    + summarize(ex.getResponseBodyAsString()), ex);
        } catch (Exception ex) {
            throw new MetaProviderException("Meta Graph GET response could not be processed.", ex);
        }
    }

    private JsonNode graphPost(String uri, Object body, Object... values) {
        try {
            String response = restClient.post().uri(uri, values).contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .body(body).retrieve().body(String.class);
            return objectMapper.readTree(response);
        } catch (RestClientResponseException ex) {
            throw new MetaProviderException("Meta Graph POST failed with HTTP " + ex.getStatusCode() + ": "
                    + summarize(ex.getResponseBodyAsString()), ex);
        } catch (Exception ex) {
            throw new MetaProviderException("Meta Graph POST response could not be processed.", ex);
        }
    }
}
