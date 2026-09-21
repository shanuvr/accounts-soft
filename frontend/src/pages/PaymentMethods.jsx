import MasterCrud from '../components/MasterCrud';
import {
  usePaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../store/paymentMethodStore';

export default function PaymentMethods() {
  const items = usePaymentMethods();
  return (
    <MasterCrud
      active="masters"
      title="Payment Methods"
      subtitle="Payment methods available when recording payments."
      counterLabel="Methods"
      namePlaceholder="e.g. UPI, Bank Transfer, Cheque"
      items={items}
      addItem={addPaymentMethod}
      updateItem={updatePaymentMethod}
      deleteItem={deletePaymentMethod}
    />
  );
}