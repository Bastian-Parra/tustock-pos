import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Product, ProductBatch } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ProductWithBatches extends Product {
  batches?: ProductBatch[];
  nearest_expiry?: string | null;
  days_until_expiry?: number | null;
}

export function useProducts() {
  const { tenant } = useAuthStore();
  const [allProducts, setAllProducts] = useState<ProductWithBatches[]>([]);
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const enrich = (data: ProductWithBatches[]): ProductWithBatches[] =>
    (data || []).map((product) => {
      if (
        product.is_perishable &&
        product.batches &&
        product.batches.length > 0
      ) {
        const activeBatches = product.batches
          .filter(
            (b) =>
              b.status === "active" && new Date(b.expiry_date) >= new Date(),
          )
          .sort(
            (a, b) =>
              new Date(a.expiry_date).getTime() -
              new Date(b.expiry_date).getTime(),
          );
        const nearestBatch = activeBatches[0];
        const daysUntil = nearestBatch
          ? Math.ceil(
              (new Date(nearestBatch.expiry_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
        return {
          ...product,
          nearest_expiry: nearestBatch?.expiry_date || null,
          days_until_expiry: daysUntil,
        };
      }
      return { ...product, nearest_expiry: null, days_until_expiry: null };
    });

  // Nueva función unificada que maneja carga inicial y búsqueda
  const fetchProducts = useCallback(
    async (query: string = "") => {
      if (!tenant?.id) return;
      setLoading(true);

      try {
        let queryBuilder = supabase
          .from("products")
          .select(
            `
          *,
          batches:product_batches(
            id, batch_code, quantity, expiry_date,
            initial_quantity, cost_per_unit, status,
            tenant_id, product_id, created_at, updated_at
          )
        `,
          )
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .limit(100); // 👈 CRÍTICO: Limitamos la respuesta

        // Si hay término de búsqueda, lo aplicamos en la BD
        if (query.trim()) {
          const q = query.toLowerCase();
          queryBuilder = queryBuilder.or(
            `name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`,
          );
        } else {
          queryBuilder = queryBuilder.order("name");
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        const enriched = enrich(data as ProductWithBatches[]);
        setAllProducts(enriched);
        setProducts(enriched);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [tenant?.id],
  );

  // Carga inicial
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Búsqueda en el servidor (con Debounce para no saturar la BD mientras escribes)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300); // Espera 300ms después de que dejas de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchProducts]);

  // Fetch products on mount and when tenant changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtrar localmente sin llamar a Supabase
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProducts(allProducts);
      return;
    }
    const q = searchQuery.toLowerCase();
    setProducts(
      allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)),
      ),
    );
  }, [searchQuery, allProducts]);

  // Supabase Realtime subscription for web-POS sync
  useEffect(() => {
    if (!tenant?.id) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`products-sync-${tenant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          setAllProducts((current) => {
            if (payload.eventType === "UPDATE") {
              return current.map((p) =>
                p.id === payload.new.id ? { ...p, ...payload.new } : p,
              );
            }
            if (payload.eventType === "INSERT") {
              return [
                ...current,
                {
                  ...(payload.new as ProductWithBatches),
                  batches: [],
                  nearest_expiry: null,
                  days_until_expiry: null,
                },
              ];
            }
            if (payload.eventType === "DELETE") {
              return current.filter((p) => p.id !== payload.old.id);
            }
            return current;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_batches",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          setAllProducts((current) =>
            current.map((p) => {
              // Si el lote modificado pertenece a este producto, actualizamos su array de batches
              if (p.id === payload.new.product_id && p.batches) {
                const updatedBatches = p.batches.map((b) =>
                  b.id === payload.new.id ? { ...b, ...payload.new } : b,
                );
                return { ...p, batches: updatedBatches };
              }
              return p;
            }),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [tenant?.id, fetchProducts]);

  // Local stock-updated event listener (for same-app updates)
  useEffect(() => {
    const handleStockUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent<{ productIds: string[] }>;
      const productIds = customEvent.detail?.productIds;

      if (!productIds || productIds.length === 0 || !tenant?.id) return;

      try {
        // Obtenemos SOLO los productos que cambiaron
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            *,
            batches:product_batches(
              id, batch_code, quantity, expiry_date,
              initial_quantity, cost_per_unit, status,
              tenant_id, product_id, created_at, updated_at
            )
          `,
          )
          .eq("tenant_id", tenant.id)
          .in("id", productIds);

        if (error) throw error;

        const enrichedUpdatedProducts = enrich(data as ProductWithBatches[]);

        // Actualizamos solo esos productos en el estado
        setAllProducts((current) => {
          const updatedState = [...current];
          enrichedUpdatedProducts.forEach((updatedProduct) => {
            const index = updatedState.findIndex(
              (p) => p.id === updatedProduct.id,
            );
            if (index !== -1) {
              updatedState[index] = updatedProduct;
            }
          });
          return updatedState;
        });
      } catch (error) {
        console.error("Error actualizando stock local:", error);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("stock-updated", handleStockUpdate);
      return () => {
        window.removeEventListener("stock-updated", handleStockUpdate);
      };
    }
  }, [tenant?.id]); // Quitamos fetchProducts de las dependencias

  const searchByBarcode = async (barcode: string): Promise<Product | null> => {
    if (!tenant?.id) return null;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("barcode", barcode)
        .eq("is_active", true)
        .maybeSingle(); // 👈 Usamos maybeSingle para evitar errores si no hay coincidencias

      if (error || !data) return null;
      return data as Product;
    } catch (error) {
      console.error("Error searching by barcode:", error);
      return null;
    }
  };

  return {
    products,
    loading,
    searchQuery,
    setSearchQuery,
    searchByBarcode,
    refetch: fetchProducts,
  };
}
