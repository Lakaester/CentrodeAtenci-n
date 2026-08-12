import type { ConfigurationSchema } from "../types";

export class SchemaValidator {
  validate(schema: ConfigurationSchema, value: unknown): string | null {
    if (value === undefined || value === null) {
      return schema.required ? `El campo ${schema.key} es obligatorio` : null;
    }

    switch (schema.type) {
      case "string":
        if (typeof value !== "string") return `${schema.key} debe ser texto`;
        if (schema.min && value.length < schema.min) return `${schema.key} debe tener al menos ${schema.min} caracteres`;
        if (schema.max && value.length > schema.max) return `${schema.key} debe tener máximo ${schema.max} caracteres`;
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) return `${schema.key} no cumple el formato requerido`;
        if (schema.options && !schema.options.includes(value)) return `${schema.key} debe ser uno de: ${schema.options.join(", ")}`;
        break;

      case "number":
        if (typeof value !== "number") return `${schema.key} debe ser numérico`;
        if (schema.min !== undefined && (value as number) < schema.min) return `${schema.key} debe ser >= ${schema.min}`;
        if (schema.max !== undefined && (value as number) > schema.max) return `${schema.key} debe ser <= ${schema.max}`;
        break;

      case "boolean":
        if (typeof value !== "boolean") return `${schema.key} debe ser booleano`;
        break;

      case "json":
        try { JSON.parse(JSON.stringify(value)); } catch { return `${schema.key} debe ser JSON válido`; }
        break;

      case "secret":
        if (typeof value !== "string" || value.length < 6) return `${schema.key} debe tener al menos 6 caracteres`;
        break;
    }

    return null;
  }
}
