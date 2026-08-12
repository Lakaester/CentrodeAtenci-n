import type { TipoTareaIA } from "./AITask";

export interface AIPromptData {
  tarea: TipoTareaIA;
  systemPrompt: string;
  userPrompt: string;
  ejemplos?: string[];
}

export class AIPrompt {
  readonly tarea: TipoTareaIA;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly ejemplos?: string[];

  constructor(data: AIPromptData) {
    this.tarea = data.tarea;
    this.systemPrompt = data.systemPrompt;
    this.userPrompt = data.userPrompt;
    this.ejemplos = data.ejemplos;
  }

  static crearPromptDiagnostico(contexto: string): AIPrompt {
    return new AIPrompt({
      tarea: "diagnosticar_caso",
      systemPrompt: "Eres un asistente experto en soporte técnico especializado en Restaurant.pe. Tu rol es analizar casos y generar diagnósticos operativos. Responde siempre en español.",
      userPrompt: `Analiza el siguiente caso y genera un diagnóstico:\n\n${contexto}\n\nIndica: categoría probable, subcategoría, nivel de confianza, causas posibles, pasos a seguir y tiempo estimado de resolución.`,
    });
  }

  static crearPromptResumen(conversacion: string): AIPrompt {
    return new AIPrompt({
      tarea: "resumir_conversacion",
      systemPrompt: "Eres un asistente que resume conversaciones de soporte técnico. Sé conciso y factual. Responde en español.",
      userPrompt: `Resume la siguiente conversación en máximo 3 párrafos:\n\n${conversacion}`,
    });
  }

  static crearPromptGenerarRespuesta(contexto: string): AIPrompt {
    return new AIPrompt({
      tarea: "generar_respuesta",
      systemPrompt: "Eres un asesor de soporte técnico de Restaurant.pe. Genera respuestas profesionales, empáticas y resolutivas. Responde en español.",
      userPrompt: `Genera una respuesta para el cliente basada en el siguiente contexto:\n\n${contexto}`,
    });
  }

  toJSON(): AIPromptData {
    return {
      tarea: this.tarea,
      systemPrompt: this.systemPrompt,
      userPrompt: this.userPrompt,
      ejemplos: this.ejemplos,
    };
  }
}
