'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, SaveStatus } from '@/lib/types';
import { getDefaultState } from '@/lib/defaultState';
import { supabase, STATE_ROW_ID } from '@/lib/supabase';

interface AppStore {
  state: AppState;
  setState: (updater: AppState | ((prev: AppState) => AppState)) => void;
  saveStatus: SaveStatus;
  isLoaded: boolean;
}

const AppStoreContext = createContext<AppStore | null>(null);

const SAVE_DEBOUNCE_MS = 1200;

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(getDefaultState());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  // Carga inicial desde Supabase
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        setIsLoaded(true);
        setSaveStatus('error');
        return;
      }
      setSaveStatus('saving');
      try {
        const { data, error } = await supabase
          .from('app_state')
          .select('data')
          .eq('id', STATE_ROW_ID)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('Error cargando de Supabase:', error);
          setSaveStatus('error');
        } else if (data && data.data) {
          isLoadingRef.current = true;
          // Fusiona sobre el default para tolerar campos nuevos añadidos en el futuro
          setStateRaw((prev) => ({ ...prev, ...data.data }));
          setSaveStatus('ok');
          isLoadingRef.current = false;
        } else {
          setSaveStatus('ok');
        }
      } catch (err) {
        console.error('Error de red con Supabase:', err);
        if (!cancelled) setSaveStatus('error');
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
          hasLoadedOnceRef.current = true;
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveToCloud = useCallback(async (snapshot: AppState) => {
    if (!supabase) {
      setSaveStatus('error');
      return;
    }
    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({ id: STATE_ROW_ID, data: snapshot, updated_at: new Date().toISOString() });
      if (error) {
        console.error('Error guardando en Supabase:', error);
        setSaveStatus('error');
      } else {
        setSaveStatus('ok');
      }
    } catch (err) {
      console.error('Error de red al guardar:', err);
      setSaveStatus('error');
    }
  }, []);

  const setState = useCallback(
    (updater: AppState | ((prev: AppState) => AppState)) => {
      setStateRaw((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: AppState) => AppState)(prev) : updater;

        // Programa guardado con debounce, solo si ya cargamos el estado inicial
        if (hasLoadedOnceRef.current && !isLoadingRef.current) {
          setSaveStatus('saving');
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            saveToCloud(next);
          }, SAVE_DEBOUNCE_MS);
        }

        return next;
      });
    },
    [saveToCloud]
  );

  return (
    <AppStoreContext.Provider value={{ state, setState, saveStatus, isLoaded }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore debe usarse dentro de AppStoreProvider');
  return ctx;
}
