import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Profile, Tenant } from "@/types";

// Variable de módulo: persiste aunque el componente se re-monte
let _isLoggedOut = false;

export function useAuth() {
  const {
    user,
    tenant,
    setUser,
    setTenant,
    logout: clearAuth,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const processSession = useCallback(async (session: any) => {
    let mounted = true;

    try {
      console.log("👤 Procesando sesión para:", session.user.email);

      // Obtener perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (profileError || !profile) {
        console.error("❌ Error obteniendo perfil:", profileError);
        throw new Error("Perfil no encontrado");
      }
      // Obtener tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile.tenant_id!)
        .single();
      if (tenantError || !tenantData) {
        console.error("❌ Error obteniendo tenant:", tenantError);
        throw new Error("Tenant no encontrado");
      }
      if (mounted) {
        setUser(profile as Profile);
        setTenant(tenantData as Tenant);
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log("✅ Autenticación completada");
      }
    } catch (error) {
      console.error("❌ Error procesando sesión:", error);
      if (mounted) {
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }
  }, [setUser, setTenant]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (_isLoggedOut) return;
      try {
        console.log("🔄 Inicializando autenticación...");

        // MODO DESARROLLO - Si falla Supabase, usar mock
        if (import.meta.env.DEV && !import.meta.env.VITE_DISABLE_MOCK) {
          console.log("🔧 Modo desarrollo detectado");

          // Intentar conexión con timeout corto
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout desarrollo")), 3000);
          });

          try {
            const authPromise = supabase.auth.getSession();
            const {
              data: { session },
              error,
            } = (await Promise.race([authPromise, timeoutPromise])) as any;

            if (session && !error && !_isLoggedOut) {
              console.log("✅ Sesión encontrada:", session.user.email);
              // Continuar con flujo normal...
              await processSession(session);
              return;
            }
          } catch (devError) {
            console.log("⚠️ Falló conexión Supabase, usando modo mock");
          }

          // MODO MOCK PARA DESARROLLO
          if (mounted && !_isLoggedOut) {
            const mockUser = {
              id: "dev-user-123",
              email: "dev@localhost",
              full_name: "Developer User",
              role: "admin",
              tenant_id: "dev-tenant-456",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const mockTenant = {
              id: "dev-tenant-456",
              name: "Tienda Demo Desarrollo",
              slug: "dev-store",
              subdomain: null,
              logo_url: null,
              settings: {
                currency: "CLP",
                timezone: "America/Santiago",
                tax_rate: 0.19,
              },
              plan: "pro",
              is_active: true,
              is_demo: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            setUser(mockUser as Profile);
            setTenant(mockTenant as Tenant);
            setIsAuthenticated(true);
            setIsLoading(false);

            console.log(
              "✅ Modo desarrollo activado - Usuario:",
              mockUser.email,
            );
          }
          return;
        }

        // MODO PRODUCCIÓN
        console.log("🌐 Modo producción - Conectando a Supabase");

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout producción")), 15000);
        });

        const authPromise = supabase.auth.getSession();
        const {
          data: { session },
          error,
        } = (await Promise.race([authPromise, timeoutPromise])) as any;

        if (!mounted) return;

        if (!session || error || _isLoggedOut) {
          console.log("❌ No hay sesión activa");
          setIsLoading(false);
          setIsAuthenticated(false);
          return;
        }

        await processSession(session);
      } catch (error) {
        console.error("❌ Error en autenticación:", error);

        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      }
    };
    initAuth();
    // Cleanup
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    _isLoggedOut = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        await processSession(data.session);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error("Login error:", error);
      return { data: null, error: error.message };
    }
  };

  const logout = async () => {
    _isLoggedOut = true;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      localStorage.removeItem('pos-auth-storage');
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  return {
    user,
    tenant,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
