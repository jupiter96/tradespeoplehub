import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

/** Single pending custom offer for checkout. Not stored in cart. */
export interface PendingCustomOffer {
  offerId: string;
  orderId?: string;
  serviceId: string;
  title: string;
  seller: string;
  price: number;
  image: string;
  quantity: number;
  deliveryDays?: number;
  packageType?: string;
  priceUnit?: string;
  addons?: { id: number; title: string; price: number }[];
}

interface PendingCustomOfferContextType {
  pendingOffer: PendingCustomOffer | null;
  setPendingOffer: (offer: PendingCustomOffer | null) => void;
  clearPendingOffer: () => void;
}

const PendingCustomOfferContext = createContext<PendingCustomOfferContextType | undefined>(undefined);

export function PendingCustomOfferProvider({ children }: { children: ReactNode }) {
  const [pendingOffer, setPendingOfferState] = useState<PendingCustomOffer | null>(null);
  const setPendingOffer = useCallback((offer: PendingCustomOffer | null) => {
    setPendingOfferState(offer);
  }, []);
  const clearPendingOffer = useCallback(() => {
    setPendingOfferState(null);
  }, []);
  return (
    <PendingCustomOfferContext.Provider value={{ pendingOffer, setPendingOffer, clearPendingOffer }}>
      {children}
    </PendingCustomOfferContext.Provider>
  );
}

export function usePendingCustomOffer() {
  const ctx = useContext(PendingCustomOfferContext);
  if (ctx === undefined) {
    throw new Error("usePendingCustomOffer must be used within PendingCustomOfferProvider");
  }
  return ctx;
}
