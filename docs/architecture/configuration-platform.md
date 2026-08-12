# Configuration Platform

## Objetivo

Centralizar toda la configuración del sistema en un único punto. Ningún módulo debe acceder directamente a variables de entorno o archivos .env.

## Principios

- Configuración centralizada.
- Validación obligatoria.
- Versionado.
- Auditoría.
- Preparado para Secret Managers externos.

## Componentes

| Componente | Responsabilidad |
|---|---|
| ConfigurationRegistry | Punto único de acceso a configuraciones |
| ConfigurationProvider | Fuente de configuración (env, archivo, vault) |
| SchemaValidator | Valida tipo, obligatoriedad, rango, formato |
| EncryptionService | Abstracción para cifrado de secretos |
| VersionManager | Versionado de cambios de configuración |
