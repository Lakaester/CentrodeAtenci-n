# adapters/restafact

## Responsabilidad
Cliente HTTP para Restafact, el sistema de facturación electrónica de Restaurant.pe. Implementa `IRestafactClient` del contrato.

## Qué implementará
- `RestafactClient implements IRestafactClient`
- Consulta de CDT (estado, vencimiento)
- Consulta de certificado digital
- Consulta de comprobantes emitidos y en cola
- Reversión de comprobantes
- Consulta de estado SUNAT

## Dependencias
- `contracts/servicios/IRestafactClient`
- Restafact REST API

## Relación con el dominio
- Proporciona datos para los widgets de `Workspace` de FE
- Soporta las herramientas del workspace adaptativo

## Estado actual
🧭 Por implementar — estructura de carpeta creada
