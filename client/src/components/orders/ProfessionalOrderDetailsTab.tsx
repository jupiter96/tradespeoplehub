import { Order } from "./types";
import OrderDetailsTab from "./OrderDetailsTab";
import { useCurrency } from "../CurrencyContext";

interface ProfessionalOrderDetailsTabProps {
  order: Order;
}

export default function ProfessionalOrderDetailsTab({
  order,
}: ProfessionalOrderDetailsTabProps) {
  const { formatPrice } = useCurrency();
  return (
    <OrderDetailsTab
      order={order}
      hideServiceFee
      formatMoneyFn={(v) => formatPrice(Number(v) ?? 0)}
    />
  );
}
