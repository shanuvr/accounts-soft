import MasterCrud from '../components/MasterCrud';
import {
  useServiceCategories,
  addServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '../store/serviceCategoryStore';

export default function ServiceCategory() {
  const items = useServiceCategories();
  return (
    <MasterCrud
      active="masters"
      title="Service Category"
      subtitle="Categories used to group services in the master catalogue."
      counterLabel="Categories"
      namePlaceholder="e.g. Design, Marketing, QA"
      items={items}
      addItem={addServiceCategory}
      updateItem={updateServiceCategory}
      deleteItem={deleteServiceCategory}
    />
  );
}