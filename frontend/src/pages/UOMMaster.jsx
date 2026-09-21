import SimpleMaster from '../components/SimpleMaster';
import { useUoms, addUom, updateUom, deleteUom } from '../store/uomStore';

export default function UOMMaster() {
  const items = useUoms();
  return (
    <SimpleMaster
      title="UOM Master"
      subtitle="Units of measurement used across products and services."
      counterLabel="Units"
      namePlaceholder="e.g. Unit, Day, Month, Year"
      items={items}
      addItem={addUom}
      updateItem={updateUom}
      deleteItem={deleteUom}
      fields={[{ key: 'code', label: 'Short Code', placeholder: 'e.g. UNT, DAY' }]}
    />
  );
}