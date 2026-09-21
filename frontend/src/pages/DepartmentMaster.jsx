import MasterCrud from '../components/MasterCrud';
import {
  useDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from '../store/departmentStore';

export default function DepartmentMaster() {
  const items = useDepartments();
  return (
    <MasterCrud
      active="masters"
      title="Department Master"
      subtitle="Departments used to group employees and form teams."
      counterLabel="Departments"
      namePlaceholder="e.g. Development, Design, QA"
      items={items}
      addItem={addDepartment}
      updateItem={updateDepartment}
      deleteItem={deleteDepartment}
    />
  );
}