import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  boutiqueProducts,
  type BoutiqueProduct,
} from '../data/products'

export type BoutiqueCartItem = {
  key: string
  productId: string
  color: string
  size: string
  quantity: number
}

type BoutiqueCartContextValue = {
  items: BoutiqueCartItem[]
  itemCount: number
  subtotal: number
  amountDueNow: number
  remainingAmount: number
  addItem: (
    product: BoutiqueProduct,
    color: string,
    size: string,
    quantity: number
  ) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
}

const STORAGE_KEY = 'teo_boutique_cart_v1'

const BoutiqueCartContext =
  createContext<BoutiqueCartContextValue | null>(null)

function getProduct(productId: string) {
  return boutiqueProducts.find(
    (product) => product.id === productId
  )
}

function createItemKey(
  productId: string,
  color: string,
  size: string
) {
  return JSON.stringify([productId, color, size])
}

function readSavedCart(): BoutiqueCartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((item): BoutiqueCartItem[] => {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof item.productId !== 'string' ||
        typeof item.color !== 'string' ||
        typeof item.size !== 'string' ||
        typeof item.quantity !== 'number'
      ) {
        return []
      }

      const product = getProduct(item.productId)

      if (!product) return []

      if (
        !product.colors.includes(item.color) ||
        !product.sizes.includes(item.size)
      ) {
        return []
      }

      const maxQuantity =
        product.type === 'stock'
          ? product.stock ?? 0
          : 10

      const quantity = Math.min(
        Math.max(0, Math.floor(item.quantity)),
        maxQuantity
      )

      if (!Number.isFinite(quantity) || quantity < 1) {
        return []
      }

      return [{
        key: createItemKey(
          product.id,
          item.color,
          item.size
        ),
        productId: product.id,
        color: item.color,
        size: item.size,
        quantity,
      }]
    })
  } catch {
    return []
  }
}

export function BoutiqueCartProvider({
  children,
}: {
  children: ReactNode
}) {
  const [items, setItems] = useState<BoutiqueCartItem[]>(
    readSavedCart
  )

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      )
    } catch {
      // Storage may be unavailable or full.
    }
  }, [items])

  const addItem = (
    product: BoutiqueProduct,
    color: string,
    size: string,
    quantity: number
  ) => {
    if (
      !boutiqueProducts.some(
        (item) => item.id === product.id
      ) ||
      !product.colors.includes(color) ||
      !product.sizes.includes(size)
    ) {
      return
    }

    const maxQuantity =
      product.type === 'stock'
        ? product.stock ?? 0
        : 10

    const requestedQuantity = Math.floor(quantity)

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity < 1 ||
      maxQuantity < 1
    ) {
      return
    }

    const key = createItemKey(product.id, color, size)

    setItems((current) => {
      const existing = current.find(
        (item) => item.key === key
      )

      if (existing) {
        return current.map((item) =>
          item.key === key
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + requestedQuantity,
                  maxQuantity
                ),
              }
            : item
        )
      }

      return [
        ...current,
        {
          key,
          productId: product.id,
          color,
          size,
          quantity: Math.min(
            requestedQuantity,
            maxQuantity
          ),
        },
      ]
    })
  }

  const removeItem = (key: string) => {
    setItems((current) =>
      current.filter((item) => item.key !== key)
    )
  }

  const updateQuantity = (
    key: string,
    quantity: number
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) return item

        const product = getProduct(item.productId)

        if (!product) return item

        const maxQuantity =
          product.type === 'stock'
            ? product.stock ?? 0
            : 10

        const nextQuantity = Math.floor(quantity)

        if (!Number.isFinite(nextQuantity)) {
          return item
        }

        return {
          ...item,
          quantity: Math.min(
            Math.max(1, nextQuantity),
            Math.max(1, maxQuantity)
          ),
        }
      })
    )
  }

  const clearCart = () => setItems([])

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = items.reduce((total, item) => {
    const product = getProduct(item.productId)

    return total + (
      product
        ? product.price * item.quantity
        : 0
    )
  }, 0)

  const amountDueNow = items.reduce((total, item) => {
    const product = getProduct(item.productId)

    if (!product) return total

    const lineTotal =
      product.price * item.quantity

    return total + (
      product.type === 'preorder'
        ? lineTotal * 0.5
        : lineTotal
    )
  }, 0)

  const remainingAmount =
    subtotal - amountDueNow

  return (
    <BoutiqueCartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        amountDueNow,
        remainingAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </BoutiqueCartContext.Provider>
  )
}

export function useBoutiqueCart() {
  const context = useContext(BoutiqueCartContext)

  if (!context) {
    throw new Error(
      'useBoutiqueCart must be used inside BoutiqueCartProvider'
    )
  }

  return context
}