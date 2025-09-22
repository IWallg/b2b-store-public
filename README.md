# B2B Store

A wholesale storefront application where clients can have different stock amounts and prices for items.

**Technologies used:**
- **Frontend:** Next.js
- **Backend:** Azure Functions
- **Infrastructure:** Terraform

**Project structure:**
```
backend/
frontend/
infra/
```

## Architecture Overview

```
+-------------------+       HTTPS       +-------------------+       +----------------+
|    Frontend       |  <------------>   |  Azure Functions  | <---> | Azure Storage  |
| (Next.js / Vercel)|                   |  (Node.js / TS)   |       |  (Blob & Table)|
+-------------------+                   +-------------------+       +----------------+
```

- Frontend calls Azure Functions API endpoints (`/api/login`, `/api/products`)
- Azure Functions interacts with Azure Storage for client and product data
- JWTs are used for authentication

## Run Locally

### Backend

1. Create `backend/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "JWT_SECRET": "super-secret-jwt-for-dev",
    "JWT_EXPIRES_IN": "1h",
    "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1",
    "BLOB_CONTAINER_NAME": "clientdata",
    "NODE_ENV": "development"
  },
  "Host": {
    "CORS": "http://localhost:3000",
    "CORSCredentials": true
  }
}
```

2. Install dependencies and start:

```bash
cd backend
npm install
npm run dev
```

3. You can log in with **Client A** or **Client B** using the codes from `scripts/clients-to-data-tables.js`.
   To change login codes:

```bash
node scripts/upload-to-azurite.js
```

Example JSON:

```json
[
  {"clientId":"A","name":"Client A","code":"1234","isActive":true},
  {"clientId":"B","name":"Client B","code":"5678","isActive":true},
  {"clientId":"C","name":"Client C","code":"9999","isActive":false}
]
```

### Frontend

1. Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:7071
```

2. Install dependencies and start:

```bash
cd frontend
npm install
npm run dev
```

3. Access the frontend at [http://localhost:3000](http://localhost:3000)

## Deployment

### Frontend

- Deploy to **Vercel** by linking the GitHub project
- Add environment variable:

```
NEXT_PUBLIC_API_URL=https://<your-functions-url>
```

### Azure Functions (Terraform + Deployment)

1. Log in to Azure:

```bash
az login
```

2. Create `infra/b2b-demo/vars.tf` with your variables:

```hcl
variable "subscription_id" {
  description = "The Azure Subscription ID."
  type        = string
  default     = "your-subscription-id"
}

variable "environment" {
  description = "The environment for the resources."
  type        = string
  default     = "demo"
}

variable "frontend_urls" {
  description = "The URL of the frontend application."
  type        = list(string)
  default     = ["https://your-url.com"]
}

variable "container_name" {
  description = "The name of the Blob Storage container."
  type        = string
  default     = "clientdata"
}
```
3. Deploy insfrastructure with Terraform:

```bash
cd infra/b2b-demo
terraform init
terraform plan
terraform apply
```

4. Deploy to Azure Functions:

```bash
cd backend

npm run build
npm install --omit=dev

FUNCTION_APP_NAME=$(terraform -chdir=../infra/b2b-demo output -raw function_app_name)
func azure functionapp publish $FUNCTION_APP_NAME
```

5. Get the API URL for the frontend:

```bash
FUNCTION_APP_NAME=$(terraform -chdir=infra/b2b-demo output -raw function_app_name)
RESOURCE_GROUP=$(terraform -chdir=infra/b2b-demo output -raw resource_group_name)

az functionapp show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv
```

6. Seed scripts:

```bash
export AZURE_STORAGE_CONNECTION_STRING=$(terraform -chdir=../infra/b2b-demo output -raw azure_storage_connection_string)

node scripts/clients-to-data-tables.js
node scripts/upload-to-azurite.js
```

## Getting Started

1. **Clone the repository**
2. **Set up the backend** following the local development instructions
3. **Set up the frontend** with the appropriate environment variables
4. **Run both services** locally for development
5. **Deploy to Azure** when ready for production

The application will be ready for use.

## Production Considerations

***Note:*** This is a demo application. For production use, consider these improvements:

- **Database**: Replace Excel/CSV data storage with a proper database (Azure SQL, CosmosDB, etc.)
- **Image Storage**: Use a CDN (Azure CDN, Cloudflare) with URL references instead of base64 encoding