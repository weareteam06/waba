package com.whatsaas;

import com.whatsaas.common.config.MessagingProperties;
import com.whatsaas.common.security.SecurityProperties;
import com.whatsaas.whatsapp.infrastructure.MetaCloudProperties;
import com.whatsaas.inbox.infrastructure.InboxProperties;
import com.whatsaas.notifications.infrastructure.PushNotificationProperties;
import com.whatsaas.templates.infrastructure.TemplateCampaignProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableJpaAuditing
@EnableScheduling
@EnableConfigurationProperties({SecurityProperties.class, MessagingProperties.class, MetaCloudProperties.class,
        InboxProperties.class, TemplateCampaignProperties.class, PushNotificationProperties.class})
public class WaCommandApplication {

    public static void main(String[] args) {
        SpringApplication.run(WaCommandApplication.class, args);
    }
}
