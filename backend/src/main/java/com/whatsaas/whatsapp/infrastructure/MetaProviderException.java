package com.whatsaas.whatsapp.infrastructure;

public class MetaProviderException extends RuntimeException {

    public MetaProviderException(String message, Throwable cause) {
        super(message, cause);
    }

    public MetaProviderException(String message) {
        super(message);
    }
}
