# Plugin System

## Objetivo

Transformar COPE en una plataforma extensible donde todas las nuevas capacidades se incorporen mediante Plugins registrados sobre interfaces públicas.

## Principios

- El Core nunca conoce implementaciones concretas.
- Los Plugins consumen únicamente el SDK oficial.
- Todo Plugin es versionable, auditable y desacoplado.
- Los Plugins declaran capacidades y permisos.
- Preparado para Marketplace futuro.

## Componentes

| Componente | Responsabilidad |
|---|---|
| PluginManager | Orquesta registro, ciclo de vida y health de plugins |
| PluginRegistry | Registro central de plugins |
| CapabilityResolver | Resuelve capacidades sin conocer implementaciones |
| LifecycleManager | Install, Enable, Disable, Update, Rollback, Uninstall |
| PluginSDK | Interfaces públicas para todos los módulos del core |
