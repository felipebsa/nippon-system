# Nippon Detail & Custom — Management System

A management system built for an automotive detailing business, covering client and vehicle management, service tracking, inventory control, and financial overview.

---

## About

Nippon Detail & Custom is a system built to manage the day-to-day operations of an automotive detailing shop. It allows registering clients and their vehicles, tracking services performed, managing materials and purchases, and monitoring the shop's financial overview through automatic cost calculations.

---

## Project Structure

```
nippon-system/
├── backend/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── vehicle.py
│   │   ├── service.py
│   │   └── material.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── vehicle.py
│   │   ├── service.py
│   │   └── material.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── vehicle.py
│   │   ├── service.py
│   │   └── material.py
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── css/
│   │   └── global.css
│   ├── js/
│   │   └── script.js
│   ├── index.html
│   └── central.html
├── .gitignore
└── README.md
```

---

## Installation

**Requirements:** Python 3.8+, PostgreSQL

```bash
# Clone the repository
git clone https://github.com/felipebsa/nippon-system.git
cd nippon-system/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn main:app --reload
```

Access the API at: **http://localhost:8000**  
Interactive docs at: **http://localhost:8000/docs**  
Frontend: open `frontend/index.html` with Live Server on port **5500**

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register a new admin user |
| POST | `/auth/login` | Authenticate and receive JWT token |

### Clients
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/client/register` | Register a new client |
| GET | `/client/get/all` | List all clients |
| GET | `/client/get/id/{id}` | Get client by ID |
| GET | `/client/get/expired/{bool}` | List active or expired clients |
| GET | `/client/get/incomplete` | List clients with missing contact/address info |
| PUT | `/client/update/{id}` | Full update of a client |
| PATCH | `/client/update/address/{id}` | Update client address |
| PATCH | `/client/update/contact/{id}` | Update client contact info |
| PATCH | `/client/update/expired/{id}` | Toggle client expired status |
| DELETE | `/client/delete/{id}` | Delete a client |

### Vehicles
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/vehicle/register` | Register a new vehicle linked to a client |
| GET | `/vehicle/get/all` | List all vehicles |
| GET | `/vehicle/get/id/{id}` | Get vehicle by ID |
| GET | `/vehicle/get/active/{bool}` | List active or inactive vehicles |
| PUT | `/vehicle/update/{id}` | Full update of a vehicle |
| PATCH | `/vehicle/update/active/{id}` | Toggle vehicle active status |
| DELETE | `/vehicle/delete/{id}` | Delete a vehicle |

### Services
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/service/register` | Register a new service linked to a client and vehicle |
| GET | `/services/get/all` | List all services |
| GET | `/service/get/{id}` | Get service by ID |
| GET | `/services/get/{finish}` | List finished or pending services |
| PUT | `/service/update/{id}` | Full update of a service |
| PATCH | `/service/update/finish/{id}` | Toggle service finish status |
| DELETE | `/service/delete/{id}` | Delete a service |

### Materials
| Method | Route | Description |
|--------|-------|-------------|
| | | *Coming soon* |

---

## Data Models

### User
| Field | Type | Description |
|-------|------|-------------|
| user_id | Integer | Primary key |
| username | String | Unique username |
| pass_hash | String | Hashed password (bcrypt) |
| role | String | User role (e.g. admin) |

### Client
| Field | Type | Description |
|-------|------|-------------|
| client_id | Integer | Primary key |
| name | String | Client full name |
| cpf | String | Unique Brazilian tax ID |
| cep | String (optional) | Postal code |
| address | String (optional) | Full address |
| email | String (optional) | Client email |
| tel | String (optional) | Phone number |
| expired | Boolean | Whether the client is inactive |
| created | DateTime | Registration timestamp |

### Vehicle
| Field | Type | Description |
|-------|------|-------------|
| vehicle_id | Integer | Primary key |
| client_id | Integer | Foreign key → clients |
| model | String | Vehicle model |
| plate | String | Unique license plate |
| kind | String (optional) | Vehicle type (car, motorcycle, etc.) |
| active | Boolean | Whether the vehicle is active |
| created | DateTime | Registration timestamp |

### Service
| Field | Type | Description |
|-------|------|-------------|
| service_id | Integer | Primary key |
| vehicle_id | Integer | Foreign key → vehicles |
| client_id | Integer | Foreign key → clients |
| title | String | Service title |
| desc | String | Service description |
| kind | String | Service type |
| date_release | DateTime (optional) | Expected delivery date |
| labor_value | Float (optional) | Labor cost |
| finish | Boolean | Whether the service is completed |
| created | DateTime | Registration timestamp |

### Material
| Field | Type | Description |
|-------|------|-------------|
| | | *Coming soon* |

---

## Tech Stack

**Backend**
- [Python 3](https://python.org)
- [FastAPI](https://fastapi.tiangolo.com)
- [SQLAlchemy 2.0](https://sqlalchemy.org)
- [Pydantic](https://docs.pydantic.dev)
- [PostgreSQL](https://postgresql.org)
- [Uvicorn](https://www.uvicorn.org)

**Frontend**
- HTML5 / CSS3
- Vanilla JavaScript (Fetch API)

---

## Status

🚧 In development