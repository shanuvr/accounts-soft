# Accounts Soft

## RUN

### Backend

```
cd backend
venv\Scripts\activate
python manage.py runserver
```

### Frontend

```
cd frontend
npm run dev
```

# INSTALLATION

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```
cd frontend
npm install
npm run dev
```