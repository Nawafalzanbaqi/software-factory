"use client";

import { useEffect, useState } from "react";
import { restaurantCheckoutApi } from "../api/restaurantCheckoutApi";
import type { BranchDto } from "../types";

interface BranchesState {
  branches: BranchDto[];
  isLoading: boolean;
  isError: boolean;
}

/**
 * Loads the branch list (GET /api/v1/branches) client-side to populate the branch
 * <select>. Kept as a tiny hook (no external data lib) to match the feature's
 * lightweight, self-contained pattern — the component is mounted by the integrator
 * on /checkout, so it fetches its own data rather than receiving props.
 */
export function useBranches(): BranchesState {
  const [state, setState] = useState<BranchesState>({
    branches: [],
    isLoading: true,
    isError: false,
  });

  useEffect(() => {
    let active = true;
    restaurantCheckoutApi
      .listBranches()
      .then((branches) => {
        if (active) setState({ branches, isLoading: false, isError: false });
      })
      .catch(() => {
        if (active) setState({ branches: [], isLoading: false, isError: true });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
