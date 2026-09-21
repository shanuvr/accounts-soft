import SimpleMaster from '../components/SimpleMaster';
import { usePaymentTerms, addPaymentTerm, updatePaymentTerm, deletePaymentTerm } from '../store/paymentTermStore';

export default function PaymentTerms() {
  const items = usePaymentTerms();
  return (
    <SimpleMaster
      title="Payment Terms"
      subtitle="Terms that define how and when payments are collected on orders."
      counterLabel="Terms"
      namePlaceholder="e.g. Full Advance, 30 Days Credit"
      items={items}
      addItem={addPaymentTerm}
      updateItem={updatePaymentTerm}
      deleteItem={deletePaymentTerm}
      fields={[{ key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the term...' }]}
    />
  );
}