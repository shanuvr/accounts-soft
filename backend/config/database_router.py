from customers.models import Customer, Employee, Department

SHARED_MODELS = (Customer, Employee, Department)


class AccountSoftRouter:
    """Routes the shared masters (Customer, Employee, Department) to the
    SystemSoft / Lead Soft database ('shared') and everything else to
    Account Soft's dedicated database ('default')."""

    def _is_shared(self, model):
        return model in SHARED_MODELS

    def db_for_read(self, model, **hints):
        return 'shared' if self._is_shared(model) else 'default'

    def db_for_write(self, model, **hints):
        return 'shared' if self._is_shared(model) else 'default'

    def allow_relation(self, obj1, obj2, **hints):
        db1 = self.db_for_read(type(obj1))
        db2 = self.db_for_read(type(obj2))
        return db1 == db2

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'shared':
            return False
        return True