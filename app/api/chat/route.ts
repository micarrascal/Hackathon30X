import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { calcularSimulacion } from "@/lib/credit-calculator";
import { logEvent } from "@/lib/track-server";

const anthropic = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// El loop de tool-use puede hacer varias llamadas a Claude en un mismo request;
// se extiende el timeout default de la funcion serverless en Vercel.
export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres el asistente virtual de simulacion de creditos de Colsubsidio (este es un demo de hackathon interno: la marca es real, pero los datos de usuarios y empleados son sinteticos).

Tu unico objetivo es ayudar al usuario a simular un credito de forma conversacional:
1. Pregunta de forma natural y en el orden que tenga mas sentido segun lo que el usuario ya te haya dicho: el monto deseado del credito, el plazo en meses, y (opcional) el ingreso mensual del usuario.
2. No avances a la siguiente pregunta si el usuario ya dio esa informacion en un mensaje anterior.
3. En cuanto tengas monto y plazo (el ingreso es opcional), DEBES llamar a la herramienta "calcular_simulacion" para obtener la cuota. Nunca calcules ni inventes la cuota vos mismo, ni des un numero aproximado de memoria: siempre usa la herramienta.
4. Cuando la herramienta te devuelva el resultado, presentaselo al usuario de forma clara (monto, plazo, cuota mensual estimada) e incluye SIEMPRE la frase: "Esto es una simulacion informativa y no constituye una preaprobacion ni una oferta vinculante de credito."
5. Mantene un tono breve, cercano y profesional. No pidas datos personales sensibles (cedula, direccion, etc.).`;

const SIMULATION_TOOL: Anthropic.Tool = {
  name: "calcular_simulacion",
  description:
    "Calcula la cuota mensual estimada de un credito mediante amortizacion francesa. Llamala en cuanto tengas el monto deseado y el plazo en meses (el ingreso mensual es opcional pero mejora la simulacion). Nunca inventes este calculo vos mismo.",
  input_schema: {
    type: "object",
    properties: {
      monto: { type: "number", description: "Monto deseado del credito, en pesos" },
      plazoMeses: { type: "number", description: "Plazo del credito en numero de meses" },
      ingresoMensual: {
        type: "number",
        description: "Ingreso mensual del usuario, opcional",
      },
    },
    required: ["monto", "plazoMeses"],
  },
};

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, userId, sessionId } = body as {
    messages: ChatTurn[];
    userId: string;
    sessionId: string;
  };

  if (!Array.isArray(messages) || !userId || !sessionId) {
    return NextResponse.json(
      { error: "messages, userId y sessionId son requeridos" },
      { status: 400 }
    );
  }

  let apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let simulationResult: ReturnType<typeof calcularSimulacion> | null = null;

  try {
  for (let iteration = 0; iteration < 4; iteration++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [SIMULATION_TOOL],
      messages: apiMessages,
    });

    if (response.stop_reason !== "tool_use") {
      return NextResponse.json({
        reply: extractText(response.content),
        simulation: simulationResult,
      });
    }

    apiMessages = [...apiMessages, { role: "assistant", content: response.content }];

    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUseBlock) break;

    const input = toolUseBlock.input as {
      monto: number;
      plazoMeses: number;
      ingresoMensual?: number;
    };

    let toolResultContent: string;
    try {
      simulationResult = calcularSimulacion({
        monto: Number(input.monto),
        plazoMeses: Number(input.plazoMeses),
        ingresoMensual: input.ingresoMensual ? Number(input.ingresoMensual) : undefined,
      });
      toolResultContent = JSON.stringify(simulationResult);

      await logEvent({
        userId,
        sessionId,
        eventType: "chatbot_simulacion",
        metadata: { input, result: simulationResult },
      });
    } catch (err) {
      toolResultContent = JSON.stringify({
        error: err instanceof Error ? err.message : "Error al calcular la simulacion",
      });
    }

    apiMessages = [
      ...apiMessages,
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResultContent,
          },
        ],
      },
    ];
  }

  return NextResponse.json({
    reply:
      "Se me complico procesar la simulacion. Contame de nuevo el monto y el plazo que te interesan.",
    simulation: simulationResult,
  });
  } catch (err) {
    console.error("Error en /api/chat:", err);
    return NextResponse.json(
      {
        reply:
          "El asistente no esta disponible en este momento (verifica que ANTHROPIC_API_KEY este configurada). Podes usar el simulador tradicional mientras tanto.",
        simulation: simulationResult,
      },
      { status: 200 }
    );
  }
}
