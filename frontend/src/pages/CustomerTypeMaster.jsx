import SimpleMaster from '../components/SimpleMaster';
import { useCustomerTypes, addCustomerType, updateCustomerType, deleteCustomerType } from '../store/customerTypeStore';

export default function CustomerTypeMaster() {
  const items = useCustomerTypes();
  return (
    <SimpleMaster
      title="Customer Type Master"
      subtitle="Types used to classify customers in the system."
      counterLabel="Types"
      namePlaceholder="e.g. Individual, Business, Corporate"
      items={items}
      addItem={addCustomerType}
      updateItem={updateCustomerType}
      deleteItem={deleteCustomerType}
      fields={[{ key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the customer type...' }]}
    />
  );
}