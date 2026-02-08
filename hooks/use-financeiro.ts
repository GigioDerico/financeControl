"use client"

import useSWR, { mutate } from "swr"
import {
  getContas,
  getCartoes,
  getTransacoes,
  getFaturas,
  getCategorias,
  getConfig,
  addConta,
  addCartao,
  addTransacao,
  addCategoria,
  deleteConta,
  deleteCartao,
  deleteTransacao,
  deleteCategoria,
  updateCategoria,
  updateFaturaStatus,
  updateConfig,
  seedDemoData,
} from "@/lib/store"
import type {
  ContaBancaria,
  CartaoCredito,
  Transacao,
  FaturaCartao,
  Categoria,
  ConfigUsuario,
  Perfil,
  TipoTransacao,
} from "@/lib/types"
import { useCallback, useEffect, useState } from "react"

const SWR_KEYS = {
  contas: "local:contas",
  cartoes: "local:cartoes",
  transacoes: "local:transacoes",
  faturas: "local:faturas",
  categorias: "local:categorias",
  config: "local:config",
}

export function useContas() {
  const { data = [] } = useSWR<ContaBancaria[]>(SWR_KEYS.contas, getContas)

  const criar = useCallback(
    (conta: Omit<ContaBancaria, "id">) => {
      addConta(conta)
      mutate(SWR_KEYS.contas)
      mutate(SWR_KEYS.transacoes)
    },
    []
  )

  const remover = useCallback((id: string) => {
    deleteConta(id)
    mutate(SWR_KEYS.contas)
  }, [])

  return { contas: data, criar, remover }
}

export function useCartoes() {
  const { data = [] } = useSWR<CartaoCredito[]>(SWR_KEYS.cartoes, getCartoes)

  const criar = useCallback(
    (cartao: Omit<CartaoCredito, "id">) => {
      addCartao(cartao)
      mutate(SWR_KEYS.cartoes)
    },
    []
  )

  const remover = useCallback((id: string) => {
    deleteCartao(id)
    mutate(SWR_KEYS.cartoes)
  }, [])

  return { cartoes: data, criar, remover }
}

export function useTransacoes(filtroOrigem?: Perfil | "todas") {
  const { data = [] } = useSWR<Transacao[]>(SWR_KEYS.transacoes, getTransacoes)

  const filtradas =
    !filtroOrigem || filtroOrigem === "todas"
      ? data
      : data.filter((t) => t.origem === filtroOrigem)

  const criar = useCallback(
    (transacao: Omit<Transacao, "id">) => {
      addTransacao(transacao)
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.contas)
    },
    []
  )

  const remover = useCallback((id: string) => {
    deleteTransacao(id)
    mutate(SWR_KEYS.transacoes)
    mutate(SWR_KEYS.contas)
  }, [])

  return { transacoes: filtradas, todas: data, criar, remover }
}

export function useFaturas() {
  const { data = [] } = useSWR<FaturaCartao[]>(SWR_KEYS.faturas, getFaturas)

  const atualizarStatus = useCallback(
    (id: string, status: "pendente" | "pago") => {
      updateFaturaStatus(id, status)
      mutate(SWR_KEYS.faturas)
    },
    []
  )

  return { faturas: data, atualizarStatus }
}

export function useCategorias() {
  const { data = [] } = useSWR<Categoria[]>(SWR_KEYS.categorias, getCategorias)

  const receita = data.filter((c) => c.tipo === "receita").map((c) => c.nome)
  const despesa = data.filter((c) => c.tipo === "despesa").map((c) => c.nome)

  const criar = useCallback(
    (cat: { nome: string; tipo: TipoTransacao }) => {
      addCategoria(cat)
      mutate(SWR_KEYS.categorias)
    },
    []
  )

  const atualizar = useCallback(
    (id: string, updates: Partial<Categoria>) => {
      updateCategoria(id, updates)
      mutate(SWR_KEYS.categorias)
    },
    []
  )

  const remover = useCallback((id: string) => {
    deleteCategoria(id)
    mutate(SWR_KEYS.categorias)
  }, [])

  return { categorias: data, receita, despesa, criar, atualizar, remover }
}

export function useConfigUsuario() {
  const { data = { nomeUsuario: "", moeda: "BRL", formatoData: "dd/mm/yyyy" as const } } =
    useSWR<ConfigUsuario>(SWR_KEYS.config, getConfig)

  const salvar = useCallback((updates: Partial<ConfigUsuario>) => {
    updateConfig(updates)
    mutate(SWR_KEYS.config)
  }, [])

  return { config: data, salvar }
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | "todas">("todas")
  return { perfil, setPerfil }
}

export function useSeedData() {
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!seeded) {
      seedDemoData()
      setSeeded(true)
      mutate(SWR_KEYS.contas)
      mutate(SWR_KEYS.cartoes)
      mutate(SWR_KEYS.transacoes)
      mutate(SWR_KEYS.faturas)
    }
  }, [seeded])
}
