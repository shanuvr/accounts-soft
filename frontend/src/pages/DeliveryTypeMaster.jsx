import SimpleMaster from '../components/SimpleMaster';
import { useDeliveryTypes, addDeliveryType, updateDeliveryType, deleteDeliveryType } from '../store/deliveryTypeStore';

export default function DeliveryTypeMaster() {
  const items = useDeliveryTypes();
  return (
    <SimpleMaster
      title="Delivery Type Master"
      subtitle="Types used to classify how each service is delivered on orders."
      counterLabel="Types"
      namePlaceholder="e.g. One-Time, Recurring, Milestone"
      items={items}
      addItem={addDeliveryType}
      updateItem={updateDeliveryType}
      deleteItem={deleteDeliveryType}
      fields={[{ key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the delivery type...' }]}
    />
  );
}