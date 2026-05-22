package com.whatsaas.whatsapp.infrastructure;

import com.whatsaas.whatsapp.domain.WhatsAppMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppMediaDownloadService {

    private final MetaCloudApiClient metaCloudApiClient;
    private final MetaCloudProperties properties;

    public WhatsAppMediaDownloadService(MetaCloudApiClient metaCloudApiClient, MetaCloudProperties properties) {
        this.metaCloudApiClient = metaCloudApiClient;
        this.properties = properties;
    }

    public void downloadInboundMedia(WhatsAppMessage message) {
        if (message.getMediaId() == null || message.getMediaId().isBlank()) {
            return;
        }
        MetaMediaMetadata metadata = metaCloudApiClient.mediaMetadata(message.getMediaId());
        byte[] bytes = metaCloudApiClient.download(metadata.url());
        try {
            Path directory = Path.of(properties.mediaDownloadDirectory()).normalize();
            Files.createDirectories(directory);
            Path output = directory.resolve(safeName(message.getTenantId() + "-" + message.getMediaId())).normalize();
            if (!output.startsWith(directory)) {
                throw new MetaProviderException("Media output path escaped storage directory.");
            }
            Files.write(output, bytes);
            message.storeDownloadedMedia(output.toString(), metadata.mimeType());
        } catch (IOException ex) {
            throw new MetaProviderException("Inbound media could not be stored.", ex);
        }
    }

    private String safeName(String value) {
        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
