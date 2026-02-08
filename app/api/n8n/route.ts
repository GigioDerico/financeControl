import { NextResponse } from "next/server"

/**
 * N8N Integration endpoint
 *
 * Accepts a POST with a JSON body containing a "mensagem" field.
 * Parses the message to extract transaction details.
 *
 * Example payload:
 *   { "mensagem": "R$ 120,00 Restaurante Cartão Nubank Pessoal 3x" }
 *
 * Expected response:
 *   {
 *     "parsed": {
 *       "valor": 120,
 *       "categoria": "Alimentacao",
 *       "cartao": "Nubank",
 *       "origem": "pessoal",
 *       "parcelas": 3
 *     },
 *     "status": "processed"
 *   }
 *
 * Note: Since this demo uses localStorage on the client side,
 * the parsed result is returned to n8n for the client to handle.
 * In a production app with Supabase, this would write directly to the database.
 */

const CATEGORIA_MAP: Record<string, string> = {
  restaurante: "Alimentacao",
  supermercado: "Alimentacao",
  mercado: "Alimentacao",
  comida: "Alimentacao",
  uber: "Transporte",
  gasolina: "Transporte",
  combustivel: "Transporte",
  transporte: "Transporte",
  aluguel: "Moradia",
  moradia: "Moradia",
  condominio: "Moradia",
  farmacia: "Saude",
  medico: "Saude",
  hospital: "Saude",
  escola: "Educacao",
  curso: "Educacao",
  faculdade: "Educacao",
  cinema: "Lazer",
  teatro: "Lazer",
  viagem: "Lazer",
  compras: "Compras",
  loja: "Compras",
  shopping: "Compras",
  netflix: "Assinaturas",
  spotify: "Assinaturas",
  assinatura: "Assinaturas",
  imposto: "Impostos",
  salario: "Salario",
  freelance: "Freelance",
  venda: "Vendas",
  servico: "Servicos",
}

function parseMessage(mensagem: string) {
  const lower = mensagem.toLowerCase().trim()

  // Extract value: R$ 120,00 or 120.00 or 120
  const valorMatch = lower.match(
    /r\$\s?([\d.,]+)|(\d+[.,]\d{2})|(\d+)/
  )
  let valor = 0
  if (valorMatch) {
    const raw = (valorMatch[1] || valorMatch[2] || valorMatch[3])
      .replace(/\./g, "")
      .replace(",", ".")
    valor = Number.parseFloat(raw) || 0
  }

  // Extract parcelas: 3x, 6x, etc
  const parcelasMatch = lower.match(/(\d+)\s*x/)
  const parcelas = parcelasMatch
    ? Number.parseInt(parcelasMatch[1])
    : 1

  // Extract origem
  const origem = lower.includes("empresa") || lower.includes("empresarial")
    ? "empresa"
    : "pessoal"

  // Extract category
  let categoria = "Outros"
  for (const [keyword, cat] of Object.entries(CATEGORIA_MAP)) {
    if (lower.includes(keyword)) {
      categoria = cat
      break
    }
  }

  // Extract card name
  const cardNames = [
    "nubank",
    "itau",
    "bradesco",
    "santander",
    "inter",
    "c6",
    "bb",
    "caixa",
  ]
  let cartao: string | null = null
  for (const card of cardNames) {
    if (lower.includes(card)) {
      cartao = card.charAt(0).toUpperCase() + card.slice(1)
      break
    }
  }

  // Determine tipo
  const tipo =
    categoria === "Salario" ||
    categoria === "Freelance" ||
    categoria === "Vendas" ||
    categoria === "Servicos"
      ? "receita"
      : "despesa"

  return {
    valor,
    categoria,
    cartao,
    origem,
    parcelas,
    tipo,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mensagem } = body

    if (!mensagem || typeof mensagem !== "string") {
      return NextResponse.json(
        { error: "Campo 'mensagem' e obrigatorio" },
        { status: 400 }
      )
    }

    const parsed = parseMessage(mensagem)

    return NextResponse.json({
      parsed,
      status: "processed",
      originalMessage: mensagem,
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar a requisicao" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/n8n",
    method: "POST",
    description:
      "Envie uma mensagem de texto para cadastrar uma transacao automaticamente.",
    example: {
      mensagem: "R$ 120,00 Restaurante Cartao Nubank Pessoal 3x",
    },
  })
}
