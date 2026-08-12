# ADR-004: Environment Agent

**Fecha:** 2026-07-18

**Contexto:** COPE necesita ejecutar acciones en el entorno del cliente (dispositivos, impresoras, servidores).

**Decisión:** Se utilizará un gateway centralizado (https://printer.restaurant.pe/ngrok) que redirige al túnel ngrok del cliente.

**Consecuencias:** COPE no necesita conectividad directa con el cliente. El gateway abstrae la complejidad de la red.
