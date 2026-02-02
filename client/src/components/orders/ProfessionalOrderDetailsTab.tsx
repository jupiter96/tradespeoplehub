import { Order } from "./types";
import OrderDetailsTab from "./OrderDetailsTab";

interface ProfessionalOrderDetailsTabProps {
  order: Order;
}

export default function ProfessionalOrderDetailsTab({
  order,
}: ProfessionalOrderDetailsTabProps) {
  return <OrderDetailsTab order={order} />;
}
