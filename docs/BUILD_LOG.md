# Build Log

This document lists all generated commands and files.

## Stage 2B: ECS + ALB + ECR Base Infrastructure (Public Subnets, No NAT)

### Goal
Create base infrastructure for ECS Fargate deployment on AWS (ap-southeast-2) using Terraform. This includes ECR repositories, ECS cluster, Application Load Balancer, security groups, IAM roles, and CloudWatch log groups. All resources deploy to public subnets with public IPs (no NAT Gateway required).

### Files Created

#### ECR Module (`infra/modules/ecr/`)
- `main.tf` - ECR repositories with image scanning and lifecycle policies:
  - 3 repositories: `campmate-api`, `campmate-frontend`, `campmate-rag`
  - Image scanning enabled on push
  - Lifecycle policy: keep latest 10 images
- `variables.tf` - Module inputs (repositories map, tags)
- `outputs.tf` - Repository URLs and ARNs

#### ECS Cluster Module (`infra/modules/ecs_cluster/`)
- `main.tf` - ECS cluster and CloudWatch log groups:
  - ECS cluster: `campmate-dev-cluster` with Container Insights enabled
  - 3 log groups: `/ecs/campmate-dev-api`, `/ecs/campmate-dev-frontend`, `/ecs/campmate-dev-rag`
  - Log retention: 14 days
- `variables.tf` - Module inputs (cluster_name, log_groups, log_retention_days, tags)
- `outputs.tf` - Cluster ID, name, ARN, and log group names

#### IAM Module (`infra/modules/iam/`)
- `main.tf` - IAM roles for ECS:
  - Task execution role: `campmate-dev-ecs-task-execution-role`
    - Attached AWS managed policy: `AmazonECSTaskExecutionRolePolicy`
    - Minimal permissions for CloudWatch logs (included in managed policy)
  - Task role: `campmate-dev-ecs-task-role` (empty policy, ready for secrets attachment)
- `variables.tf` - Module inputs (project, env, tags)
- `outputs.tf` - Role ARNs and names

#### ALB Module (`infra/modules/alb/`)
- `main.tf` - Application Load Balancer with security groups and routing:
  - ALB security group (`alb_sg`):
    - Inbound: TCP 80 from 0.0.0.0/0
    - Outbound: All traffic
  - ECS security group (`ecs_sg`):
    - Inbound: TCP 80 from ALB (frontend), TCP 8080 from ALB (api)
    - Outbound: All traffic
  - Application Load Balancer: `campmate-dev-alb` in public subnets
  - Listener: Port 80 (HTTP)
  - Target groups:
    - `tg-frontend`: HTTP port 80, target type IP, health check on `/`
    - `tg-api`: HTTP port 8080, target type IP, health check on `/health`
  - Listener rules:
    - Path `/api/*` → forwards to `tg-api`
    - Default → forwards to `tg-frontend`
- `variables.tf` - Module inputs (project, env, vpc_id, public_subnet_ids, tags)
- `outputs.tf` - ALB DNS name, security group IDs, target group ARNs

#### Dev Environment Updates (`infra/envs/dev/`)
- `main.tf` - Added modules:
  - ECR module with 3 repositories
  - ECS cluster module with cluster and log groups
  - IAM module with task execution and task roles
  - ALB module with security groups, target groups, and listener
- `outputs.tf` - Added outputs:
  - `ecr_repo_urls` - Map of repository URLs
  - `ecs_cluster_name` - Cluster name
  - `alb_dns_name` - ALB DNS name
  - `alb_sg_id`, `ecs_sg_id` - Security group IDs
  - `tg_frontend_arn`, `tg_api_arn` - Target group ARNs

### Infrastructure Resources Created

1. **ECR Repositories** (3 repos)
   - `campmate-api` - API container images
   - `campmate-frontend` - Frontend container images
   - `campmate-rag` - RAG service container images
   - Image scanning: Enabled on push
   - Lifecycle: Keep latest 10 images

2. **ECS Cluster** (`campmate-dev-cluster`)
   - Container Insights: Enabled
   - Ready for Fargate task deployment

3. **CloudWatch Log Groups** (3 groups)
   - `/ecs/campmate-dev-api` - API service logs
   - `/ecs/campmate-dev-frontend` - Frontend service logs
   - `/ecs/campmate-dev-rag` - RAG service logs
   - Retention: 14 days

4. **IAM Roles**
   - Task execution role: `campmate-dev-ecs-task-execution-role`
     - Policy: `AmazonECSTaskExecutionRolePolicy` (includes CloudWatch logs permissions)
   - Task role: `campmate-dev-ecs-task-role` (empty, ready for secrets)

5. **Security Groups**
   - `alb_sg` (`campmate-dev-alb-sg`):
     - Inbound: TCP 80 from 0.0.0.0/0
     - Outbound: All
   - `ecs_sg` (`campmate-dev-ecs-sg`):
     - Inbound: TCP 80 from ALB (frontend), TCP 8080 from ALB (api)
     - Outbound: All

6. **Application Load Balancer** (`campmate-dev-alb`)
   - Type: Application Load Balancer (internet-facing)
   - Subnets: Public subnets (2 AZs)
   - Listener: Port 80 (HTTP)
   - Target groups:
     - `tg-frontend`: Port 80, health check `/`
     - `tg-api`: Port 8080, health check `/health`
   - Routing:
     - `/api/*` → `tg-api`
     - Default → `tg-frontend`

### Tagging Strategy
All resources tagged with:
- `Project = "campmate"`
- `Env = "dev"`
- `Name = "campmate-dev-<resource-type>"`

### Commands

#### Initial Setup
```bash
cd infra/envs/dev
terraform init
```

#### Validation
```bash
terraform fmt -recursive
terraform validate
```

#### Planning
```bash
terraform plan
```

#### Apply
```bash
terraform apply
```

### Technical Details

- **Deployment Model**: Public subnets with public IPs (no NAT Gateway)
- **Target Type**: IP (for Fargate tasks)
- **Health Checks**: 
  - Frontend: `/` (port 80)
  - API: `/health` (port 8080)
- **Log Retention**: 14 days (cost optimization)
- **Image Lifecycle**: Keep latest 10 images per repository
- **Container Insights**: Enabled for cluster monitoring

### Architecture

```
Internet
   ↓
ALB (public subnets, port 80)
   ├─ /api/* → tg-api (port 8080) → ECS tasks (public IPs)
   └─ default → tg-frontend (port 80) → ECS tasks (public IPs)
```

### Next Steps (Not Implemented)
- ECS task definitions
- ECS services
- NAT Gateway (if needed for private subnets)
- SSL/TLS certificates for HTTPS
- Route53 DNS configuration

### Notes
- **No NAT Gateway**: All ECS tasks use public subnets with public IPs
- **Security**: ECS tasks only accept traffic from ALB security group
- **Cost Optimization**: 14-day log retention, lifecycle policies for ECR
- **Module Structure**: Reusable modules for multi-environment support
- **Ready for Services**: Infrastructure ready, but no ECS services created yet

## Stage 2C: ECS/Fargate Services (Dev) — Frontend + API behind existing ALB (Public Subnets, No NAT)

### Goal
Deploy the first running workloads to ECS Fargate in **public subnets** (with `assign_public_ip = true`, **no NAT**) and attach them to the **existing ALB target groups** so:
- ALB default serves the **frontend**
- `/api/*` routes to the **API** target group (note on pathing below)

### Files Added / Modified
- **Added**: `infra/envs/dev/ecs_services.tf`
  - `aws_ecs_task_definition.api` (port 8080, awslogs)
  - `aws_ecs_task_definition.frontend` (port 80, awslogs)
  - `aws_ecs_service.api` attached to existing `tg-api`
  - `aws_ecs_service.frontend` attached to existing `tg-frontend`
- **Modified**: `infra/envs/dev/variables.tf`
  - Added required secret/parameter ARN inputs (no plaintext secrets in TF state):
    - `api_mongo_uri_secret_arn`
    - `api_jwt_secret_arn`
    - `api_openweather_api_key_arn`
- **Modified**: `infra/envs/dev/outputs.tf`
  - Added: `api_service_name`, `frontend_service_name`, `task_def_arns`

### Images Used (ECR)
- `149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-api:latest`
- `149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:latest`

### Secrets Handling (Important)
API secrets are **not** stored in Terraform state. Task definitions reference **AWS Secrets Manager** or **SSM Parameter Store** via ARN:
- `MONGO_URI` → `var.api_mongo_uri_secret_arn`
- `JWT_SECRET` → `var.api_jwt_secret_arn`
- `OPENWEATHER_API_KEY` → `var.api_openweather_api_key_arn`

### Commands (Deploy)
From repo root:

```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars
```

### Verification
After `terraform apply`, confirm outputs:
- `alb_dns_name`
- `api_service_name`, `frontend_service_name`

Then verify:

```bash
aws ecs list-services --cluster campmate-dev-cluster
aws ecs list-task-definitions
```

HTTP checks (replace with the real output):
- Frontend (should return HTML):
  - `curl http://<alb_dns_name>/`
- API health (current API image serves health at **`/health`**, not `/api/health`):
  - `curl http://<alb_dns_name>/health`

CloudWatch logs:
- `/ecs/campmate-dev-api`
- `/ecs/campmate-dev-frontend`

### Notes / Tradeoffs
- **No NAT**: tasks run in public subnets with public IPs by design for this stage.
- **Path prefix**: ALB routes `/api/*` to the API target group, but the API container routes are mounted at `/health`, `/auth`, etc. (no `/api` prefix). If you need `curl http://<alb>/api/health` to return JSON, we’ll need a follow-up change (either add an `/api` prefix in the API app, or change ALB routing rules to forward the API paths without the `/api` prefix).

## Fix: Frontend Port Mismatch (Port 80 → 3000)

### Issue
Frontend Dockerfile configures nginx to listen on port 3000, but ECS task definition and target group were configured for port 80, causing health check failures and preventing the frontend from receiving traffic.

### Files Modified
- **`infra/envs/dev/ecs_services.tf`**:
  - Updated `aws_ecs_task_definition.frontend`: Changed `containerPort` from 80 to 3000
  - Updated `aws_ecs_service.frontend`: Changed `container_port` in load balancer configuration from 80 to 3000
- **`infra/modules/alb/main.tf`**:
  - Updated `aws_lb_target_group.frontend`: Changed `port` from 80 to 3000
  - Updated `aws_security_group.ecs`: Changed frontend ingress rule from port 80 to 3000

### Changes Made
1. **Frontend Task Definition**: `containerPort = 3000` (matches Dockerfile)
2. **Frontend ECS Service**: `container_port = 3000` (matches task definition)
3. **Frontend Target Group**: `port = 3000` (matches container port)
4. **ECS Security Group**: Ingress rule updated to allow TCP 3000 from ALB (matches target group port)

### Verification
After applying the changes:
- Target group health checks should pass (frontend container now listening on correct port)
- Frontend should be accessible via ALB DNS name
- CloudWatch logs should show nginx starting successfully on port 3000

### Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars
```

## Fix: Target Group ResourceInUse and Secrets ARN Validation

### Issues
1. **ResourceInUse Error**: Frontend target group was causing conflicts during updates due to hardcoded name
2. **ClientException on Secrets**: Need to ensure secret ARNs are properly formatted for ECS task definitions

### Files Modified
- **`infra/modules/alb/main.tf`**:
  - Changed frontend target group from `name = "${var.project}-${var.env}-tg-frontend"` to `name_prefix = "fe-"`
  - Added `lifecycle { create_before_destroy = true }` block to prevent resource conflicts

- **`infra/envs/dev/ecs_services.tf`**:
  - Added documentation comments clarifying secret ARN format requirements:
    - Secrets Manager: `arn:aws:secretsmanager:region:account-id:secret:secret-name-random-string`
    - SSM Parameter Store: `arn:aws:ssm:region:account-id:parameter/parameter-name`

### Changes Made
1. **Target Group Name**: Using `name_prefix` instead of hardcoded `name` ensures unique resource names
2. **Lifecycle Management**: `create_before_destroy = true` ensures new target group is created before old one is destroyed, preventing ResourceInUse errors
3. **Secrets Documentation**: Added comments to clarify ARN format requirements for troubleshooting

### Verification
After applying changes:
- Target group updates should complete without ResourceInUse errors
- ECS tasks should start successfully with proper secret ARN format
- Check CloudWatch logs for any secret access errors

### Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars
```

## Fix: ECS Task Definition Secrets ARN Format Validation

### Issue
ClientException errors when ECS tries to start API tasks because the secret ARN format in the task definition is invalid or incomplete.

### Root Cause
The `valueFrom` field in ECS task definition secrets must contain the complete ARN of the secret (either from Secrets Manager or SSM Parameter Store). Using an incomplete ARN, just the secret name, or an incorrectly formatted ARN will cause ECS to fail with a ClientException.

### Files Modified
- **`infra/envs/dev/ecs_services.tf`**:
  - Enhanced documentation comments for secret ARN format requirements
  - Reformatted secrets array with explicit `name` and `valueFrom` fields for clarity
  - Added examples of correct ARN formats for both Secrets Manager and SSM Parameter Store
  - Added warning about ClientException errors if ARN format is incorrect

### Changes Made
1. **Documentation**: Added detailed comments explaining:
   - Secrets Manager ARN format: `arn:aws:secretsmanager:region:account-id:secret:secret-name-random-string`
   - SSM Parameter Store ARN format: `arn:aws:ssm:region:account-id:parameter/parameter-name`
   - Examples for both formats
   - Warning about ClientException if ARN is incorrect

2. **Code Formatting**: Reformatted secrets array for better readability:
   ```terraform
   secrets = [
     {
       name      = "MONGO_URI"
       valueFrom = var.api_mongo_uri_secret_arn
     },
     {
       name      = "JWT_SECRET"
       valueFrom = var.api_jwt_secret_arn
     },
     {
       name      = "OPENWEATHER_API_KEY"
       valueFrom = var.api_openweather_api_key_arn
     }
   ]
   ```

### Verification
To verify your secret ARNs are correct:
1. Check `dev.secrets.tfvars` contains full ARNs (not just names)
2. For Secrets Manager: ARN should include the random suffix (e.g., `-CXSPFf`)
3. For SSM Parameter Store: ARN should include `/parameter/` prefix
4. Ensure ARNs match the region and account ID where secrets are stored
5. Verify the ECS task execution role has permissions to access these secrets

### Troubleshooting
If you still get ClientException errors:
- Verify the secret exists in AWS Secrets Manager or SSM Parameter Store
- Check the ARN format matches the examples in the code comments
- Ensure the ECS task execution role has `secretsmanager:GetSecretValue` or `ssm:GetParameter` permissions
- Verify the region in the ARN matches where the secret is stored

### Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars
```

## Fix: API Target Group Health Check Path

### Issue
API target group health checks were failing or showing as unhealthy because the health check path didn't match the application's internal route structure.

### Root Cause
The API application serves the health endpoint at `/health` directly (not `/api/health`). Health checks from the target group hit the container directly, bypassing the ALB listener routing rules. Therefore, the health check path must match the application's internal route, not the ALB routing path.

### Files Modified
- **`infra/modules/alb/main.tf`**:
  - Verified health check path is set to `/health` (correct)
  - Added documentation comment explaining why `/health` is used instead of `/api/health`
  - Clarified that health checks bypass ALB listener rules

### Changes Made
1. **Documentation**: Added comment to API target group explaining:
   - Health check path is `/health` (not `/api/health`)
   - Health checks hit the container directly, bypassing ALB routing
   - The ALB listener rule `/api/*` only affects user traffic, not health checks

### Technical Details
- **Target Group Location**: `infra/modules/alb/main.tf` (resource `aws_lb_target_group.api`)
- **Health Check Path**: `/health` (matches application's internal route)
- **ALB Listener Rule**: Routes `/api/*` to API target group (for user traffic only)
- **Health Check Behavior**: Health checks go directly to container on port 8080 at path `/health`

### Verification
After applying changes:
- API target group should show targets as "Healthy" in AWS Console
- Health checks should return 200 status code
- API container must be running and responding to `/health` endpoint

### Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars
```

## Fix: API Container CORS Configuration Crash

### Issue
API container was crashing immediately on startup and showing as "Draining" or stopping in ECS. CloudWatch logs showed the container was throwing an error during initialization before it could start listening on port 8080.

### Root Cause
The API application's CORS configuration requires either `ALLOWED_ORIGINS` or `FRONTEND_URL` environment variable to be set when running in production mode (`NODE_ENV=production`). Since neither variable was set in the ECS task definition, the application threw an error during startup:

```
Error: CORS configuration error: In production, at least one of ALLOWED_ORIGINS or FRONTEND_URL must be set. Localhost origins are not allowed in production.
```

The error occurred in the `getAllowedOrigins()` function before the application could start listening on port 8080, causing the container to exit immediately.

### Files Modified
- **`infra/envs/dev/ecs_services.tf`**:
  - Added `FRONTEND_URL` environment variable to API task definition
  - Added `ALLOWED_ORIGINS` environment variable to API task definition
  - Both variables use dynamic reference: `http://${module.alb.alb_dns_name}`

### Changes Made
1. **Environment Variables**: Added to the `environment` array in API container definition:
   ```terraform
   { name = "FRONTEND_URL", value = "http://${module.alb.alb_dns_name}" },
   { name = "ALLOWED_ORIGINS", value = "http://${module.alb.alb_dns_name}" }
   ```

2. **Dynamic Reference**: Uses `module.alb.alb_dns_name` to automatically get the ALB DNS name at deployment time, ensuring the value is always correct even if the ALB is recreated.

### Technical Details
- **Error Location**: `api/src/index.ts` - `getAllowedOrigins()` function
- **Production Mode**: `NODE_ENV=production` is set in the task definition
- **CORS Requirement**: In production, the code explicitly requires `ALLOWED_ORIGINS` or `FRONTEND_URL` to be set
- **Container Behavior**: Application throws error during module initialization, causing Node.js process to exit with error code

### Verification
After applying changes:
- API container should start successfully without crashing
- CloudWatch logs should show: "CampMate API server running on port 8080"
- Target group health checks should pass
- API should be accessible via ALB DNS name

### Troubleshooting
If the container still crashes:
- Verify ALB DNS name is correctly resolved: `terraform output alb_dns_name`
- Check CloudWatch logs for any other errors after CORS configuration
- Ensure the ALB module output `alb_dns_name` is available

### Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan -var-file=dev.secrets.tfvars
terraform apply -var-file=dev.secrets.tfvars

# Verify ALB DNS name
terraform output alb_dns_name

# Check CloudWatch logs after deployment
aws logs tail /ecs/campmate-dev-api --region ap-southeast-2 --follow
```

## Fix: Frontend API URL Configuration for ALB

### Issue
Frontend was trying to call the API at `http://localhost:8080` instead of using the ALB URL. This caused API calls to fail in production because the frontend container couldn't reach localhost:8080.

### Root Cause
The frontend code used `VITE_API_BASE` environment variable with a default fallback to `http://localhost:8080`. Since Vite embeds environment variables at build time, the Docker image was built with `localhost:8080` hardcoded, which doesn't work in the ECS container environment.

### Solution
Changed the frontend to use a relative path `/api` as the default, which works with ALB routing:
- ALB routes `/api/*` to the API target group
- Frontend can use relative paths like `/api/auth/login` which will be resolved by the browser to the ALB URL
- No need to know the ALB DNS name at build time

### Files Modified
- **`frontend/src/api/client.ts`**:
  - Changed `API_BASE` default from `http://localhost:8080` to `/api`
  - Added comment explaining ALB routing and local dev override
- **`docker/frontend/Dockerfile`**:
  - Changed default `VITE_API_BASE` build argument from `http://localhost:8080` to `/api`
  - Updated comments to document ALB routing

### Changes Made
1. **Frontend Code**: Updated API client to use `/api` as default:
   ```typescript
   const API_BASE = import.meta.env.VITE_API_BASE || '/api';
   ```

2. **Dockerfile**: Changed default build arg:
   ```dockerfile
   ARG VITE_API_BASE=/api
   ```

### Technical Details
- **ALB Routing**: The ALB listener rule routes `/api/*` to the API target group
- **Relative Paths**: Browser resolves `/api/auth/login` relative to the current origin (ALB DNS name)
- **Vite Variables**: `VITE_API_BASE` can still be overridden at build time if needed
- **Local Development**: Developers can set `VITE_API_BASE=http://localhost:8080` in `.env.local` for local dev

### Next Steps
1. **Rebuild Frontend Docker Image**:
   ```bash
   cd docker/frontend
   docker build -t campmate-frontend:latest .
   # Or with explicit API base (optional):
   # docker build --build-arg VITE_API_BASE=/api -t campmate-frontend:latest .
   ```

2. **Push to ECR**:
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com
   docker tag campmate-frontend:latest 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:latest
   docker push 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:latest
   ```

3. **Force ECS Service Update** (to pull new image):
   ```bash
   aws ecs update-service --cluster campmate-dev-cluster --service campmate-dev-frontend --force-new-deployment --region ap-southeast-2
   ```

### Verification
After rebuilding and deploying:
- Frontend should make API calls to `/api/*` paths
- Browser Network tab should show requests going to ALB DNS name with `/api/*` paths
- API calls should succeed (no CORS errors, responses from API)

### Notes
- **No ECS Task Definition Changes**: The frontend code change means it will work once the image is rebuilt
- **Backward Compatible**: Still respects `VITE_API_BASE` if set, so local development works
- **ALB Routing**: Works because ALB routes `/api/*` to API service automatically

## Fix: Frontend Dockerfile Build Context Paths

### Issue
Docker build failed with error about not finding the 'build' script. The build was failing because the COPY commands in the Dockerfile were not correctly pointing to the frontend directory.

### Root Cause
The Docker Compose configuration uses the project root as the build context (`context: ..`), but the Dockerfile was trying to copy files from the current directory without the `frontend/` prefix. This meant:
- `COPY package*.json ./` was looking for package.json in the root (doesn't exist)
- `COPY . .` was copying everything from root instead of just frontend files

### Files Modified
- **`docker/frontend/Dockerfile`**:
  - Changed `COPY package*.json ./` to `COPY frontend/package*.json ./`
  - Changed `COPY . .` to `COPY frontend/ .`

### Changes Made
1. **Package Files**: Updated to copy from `frontend/` directory:
   ```dockerfile
   COPY frontend/package*.json ./
   ```

2. **Source Code**: Updated to copy frontend directory contents:
   ```dockerfile
   COPY frontend/ .
   ```

### Technical Details
- **Build Context**: Docker Compose sets `context: ..` (project root)
- **Dockerfile Location**: `docker/frontend/Dockerfile`
- **Path Resolution**: Since context is root, all paths must include `frontend/` prefix
- **Build Script**: Package.json correctly has `"build": "tsc && vite build"` script

### Verification
After fix, Docker build should:
- Successfully find and copy `frontend/package.json`
- Successfully copy all frontend source files
- Run `npm ci` to install dependencies
- Run `npm run build` to build the application
- Copy built files to nginx stage

### Build Command
```bash
# From project root
docker build -f docker/frontend/Dockerfile --build-arg VITE_API_BASE=/api -t campmate-frontend:latest .

# Or using Docker Compose (from project root)
docker-compose -f docker/docker-compose.yml build frontend
```

## Fix: API Routes Mounted Under /api Prefix for ALB Routing

### Issue
API was returning 404 errors because requests were coming in with `/api` prefix (from ALB routing), but the API application had routes mounted at root level (e.g., `/health`, `/auth`, `/footprints`).

### Root Cause
The ALB listener rule routes `/api/*` to the API target group, so requests arrive at the API container with the `/api` prefix. However, the API application was mounting routes at root level:
- ALB sends: `/api/health`, `/api/auth`, `/api/footprints`
- API expected: `/health`, `/auth`, `/footprints`
- Result: 404 Not Found

### Solution
Updated the API to mount all routes under `/api` prefix to match ALB routing. Also kept root-level `/health` route for target group health checks (which bypass ALB and hit container directly).

### Files Modified
- **`api/src/index.ts`**:
  - Changed all route mounts from root level to `/api` prefix:
    - `/health` → `/api/health` (and kept `/health` for health checks)
    - `/auth` → `/api/auth`
    - `/me` → `/api/me`
    - `/footprints` → `/api/footprints`
    - etc.

### Changes Made
1. **API Routes**: All routes now mounted under `/api`:
   ```typescript
   app.use('/api/health', healthRouter);
   app.use('/api/auth', authRouter);
   app.use('/api/me', meRouter);
   app.use('/api/footprints', authMiddleware, footprintsRouter);
   // ... etc
   ```

2. **Health Check Route**: Kept root-level route for target group:
   ```typescript
   app.use('/health', healthRouter); // For target group health checks
   ```

### Technical Details
- **ALB Routing**: Listener rule routes `/api/*` to API target group
- **Health Checks**: Target group health checks use `/health` (direct container access, bypasses ALB routing)
- **Frontend**: Frontend already uses `/api/*` paths, so no changes needed
- **Backward Compatibility**: Root-level `/health` still works for direct container access

### Verification
After rebuilding and deploying API:
- Frontend calls to `/api/health` should return 200 OK
- Frontend calls to `/api/auth/login` should work
- Frontend calls to `/api/footprints` should work
- Target group health checks to `/health` should still work

### Next Steps
1. **Rebuild API Docker Image**:
   ```bash
   cd docker/api
   docker build -t campmate-api:latest .
   ```

2. **Push to ECR**:
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com
   docker tag campmate-api:latest 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-api:latest
   docker push 149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-api:latest
   ```

3. **Force ECS Service Update**:
   ```bash
   aws ecs update-service --cluster campmate-dev-cluster --service campmate-dev-api --force-new-deployment --region ap-southeast-2
   ```

### Notes
- **No Terraform Changes**: ALB routing configuration is correct, only API code needed updating
- **No Frontend Changes**: Frontend already uses `/api/*` paths
- **Health Checks**: Still work because they bypass ALB and use direct container access

## Fix: API Dockerfile Build Context Paths

### Issue
Docker build failed with error "Missing script: 'build'". The build was failing because the COPY commands in the Dockerfile were not correctly pointing to the api directory.

### Root Cause
The Docker Compose configuration uses the project root as the build context (`context: ..`), but the Dockerfile was trying to copy files from the current directory without the `api/` prefix. This meant:
- `COPY package*.json ./` was looking for package.json in the root (doesn't exist)
- `COPY . .` was copying everything from root instead of just api files

### Files Modified
- **`docker/api/Dockerfile`**:
  - Changed `COPY package*.json ./` to `COPY api/package*.json ./`
  - Changed `COPY . .` to `COPY api/ .`

### Changes Made
1. **Package Files**: Updated to copy from `api/` directory:
   ```dockerfile
   COPY api/package*.json ./
   ```

2. **Source Code**: Updated to copy api directory contents:
   ```dockerfile
   COPY api/ .
   ```

### Technical Details
- **Build Context**: Docker Compose sets `context: ..` (project root)
- **Dockerfile Location**: `docker/api/Dockerfile`
- **Path Resolution**: Since context is root, all paths must include `api/` prefix
- **Build Script**: Package.json correctly has `"build": "tsc"` script
- **Start Command**: Package.json has `"start": "node dist/index.js"` (matches CMD in Dockerfile)

### Verification
After fix, Docker build should:
- Successfully find and copy `api/package.json`
- Successfully copy all api source files
- Run `npm ci` to install dependencies
- Run `npm run build` to compile TypeScript (runs `tsc`)
- Start with `node dist/index.js`

### Build Command
```bash
# From project root
docker build -f docker/api/Dockerfile -t campmate-api:latest .

# Or using Docker Compose (from project root)
docker-compose -f docker/docker-compose.yml build api
```

## Fix: ECR Repositories - Enable force_delete for Automation

### Issue
Terraform destroy operations can fail when ECR repositories contain images pushed by GitHub Actions or other CI/CD pipelines. AWS requires repositories to be empty before deletion, which blocks automation workflows.

### Solution
Added `force_delete = true` to all ECR repositories to allow Terraform to delete repositories even when they contain images.

### Files Modified
- **`infra/modules/ecr/main.tf`**:
  - Added `force_delete = true` to `aws_ecr_repository` resource

### Changes Made
```terraform
resource "aws_ecr_repository" "repos" {
  for_each = var.repositories

  name                 = each.value
  image_tag_mutability = "MUTABLE"
  force_delete         = true  # Added for automation-friendly destroy

  image_scanning_configuration {
    scan_on_push = true
  }
  # ... rest of config
}
```

### Technical Details
- **Repositories Affected**: All ECR repositories (api, frontend, rag)
- **Behavior**: When `terraform destroy` runs, ECR repositories will be deleted even if they contain images
- **Data Loss Warning**: All images in the repository will be permanently deleted when the repository is destroyed
- **Use Case**: Prevents `terraform destroy` failures when GitHub Actions have pushed new images after Terraform was last applied

### Benefits
- **Automation-Friendly**: CI/CD pipelines can push images without blocking Terraform operations
- **Clean Destroy**: `terraform destroy` will always succeed, even with images in repositories
- **No Manual Cleanup**: No need to manually delete images before destroying infrastructure

### Verification
After applying this change:
- `terraform plan` should show no changes (if repositories already exist)
- `terraform apply` will update existing repositories with `force_delete = true`
- `terraform destroy` will now succeed even if repositories contain images

### Terraform Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
```

### Notes
- **Reversible**: This change only affects destroy operations; normal operations are unchanged
- **Safe for Production**: `force_delete` only applies during Terraform destroy, not during normal usage
- **GitHub Actions**: CI/CD pipelines can now push images without worrying about blocking Terraform destroy operations

## Fix: ECS Services - Migrate to Fargate Spot for Cost Optimization

### Goal
Reduce compute costs by migrating ECS services from regular Fargate to Fargate Spot, which provides up to 70% cost savings.

### Changes Made
Updated both API and frontend ECS services to use Fargate Spot capacity provider instead of regular Fargate.

### Files Modified
- **`infra/envs/dev/ecs_services.tf`**:
  - Removed `launch_type = "FARGATE"` from both services
  - Added `capacity_provider_strategy` block with `FARGATE_SPOT` to both services

### Code Changes

**Before:**
```terraform
resource "aws_ecs_service" "api" {
  name            = "${var.project}-${var.env}-api"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"  # ← Removed
  # ... rest of config
}
```

**After:**
```terraform
resource "aws_ecs_service" "api" {
  name            = "${var.project}-${var.env}-api"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1

  capacity_provider_strategy {  # ← Added
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
  # ... rest of config
}
```

### Technical Details
- **Capacity Provider**: `FARGATE_SPOT` is a built-in AWS capacity provider (no need to create it)
- **Weight**: Set to 1 means 100% of tasks will use Fargate Spot
- **Task Definitions**: No changes needed - task definitions remain compatible
- **Network Configuration**: Unchanged - still uses public subnets with public IPs
- **Load Balancer**: Unchanged - services still attached to ALB target groups

### Benefits
- **Cost Savings**: Up to 70% discount compared to regular Fargate pricing
- **Same Features**: Fargate Spot provides the same container runtime as regular Fargate
- **Automatic Recovery**: ECS automatically restarts tasks if interrupted by Spot capacity changes
- **No Code Changes**: Application code remains unchanged

### Important Considerations
- **Spot Interruptions**: Fargate Spot tasks can be interrupted with 2 minutes notice when AWS needs capacity
- **Suitable for Dev**: Perfect for development environments where cost savings outweigh occasional interruptions
- **Production Strategy**: For production, consider a mixed strategy:
  ```terraform
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
    base              = 0  # Minimum on-demand tasks
  }
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1  # At least 1 on-demand task
  }
  ```

### Verification
After applying this change:
- `terraform plan` should show updates to both ECS services
- `terraform apply` will update services to use Fargate Spot
- Services will continue running normally with cost savings
- Check AWS Console → ECS → Services → Capacity provider tab to verify Fargate Spot usage

### Terraform Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
```

### Cost Impact
- **Regular Fargate**: ~$0.04 per vCPU-hour, ~$0.004 per GB-hour
- **Fargate Spot**: ~$0.012 per vCPU-hour, ~$0.0012 per GB-hour (70% discount)
- **Example**: For 2 services (256 CPU, 512 MB each) running 24/7:
  - Regular Fargate: ~$58/month
  - Fargate Spot: ~$17/month
  - **Savings: ~$41/month (~70%)**

### Notes
- **No Downtime**: Terraform will perform a rolling update, maintaining service availability
- **Task Restarts**: If Spot capacity is interrupted, ECS automatically starts new tasks
- **Monitoring**: Monitor CloudWatch metrics for task interruptions and restarts
- **Dev Environment**: This configuration is ideal for dev/test environments

## Fix: ECS Task Definitions - Migrate to ARM64 Architecture

### Goal
Optimize cost and performance by migrating ECS task definitions to use ARM64 (Graviton2) architecture, which provides better price/performance compared to x86_64.

### Changes Made
Added `runtime_platform` block to both API and frontend task definitions to specify ARM64 architecture.

### Files Modified
- **`infra/envs/dev/ecs_services.tf`**:
  - Added `runtime_platform` block to both `aws_ecs_task_definition` resources (api and frontend)

### Code Changes

**Before:**
```terraform
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.env}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  # No runtime_platform block (defaults to x86_64)
  # ... rest of config
}
```

**After:**
```terraform
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.env}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  runtime_platform {  # ← Added
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  # ... rest of config
}
```

### Technical Details
- **CPU Architecture**: `ARM64` uses AWS Graviton2 processors
- **Operating System**: `LINUX` is required for ARM64 on Fargate
- **Compatibility**: Works with Fargate Spot for maximum cost savings
- **Task Definitions**: Both API and frontend task definitions updated

### Benefits
- **Cost Savings**: Up to 20% better price/performance compared to x86_64
- **Performance**: Better performance per dollar, especially for containerized workloads
- **Combined Savings**: When combined with Fargate Spot, total savings can exceed 80% compared to regular Fargate x86_64
- **Energy Efficiency**: ARM64 processors are more energy-efficient

### Important Requirements
- **Docker Images**: Docker images must be built for ARM64 architecture
  - Option 1: Build ARM64-only images
  - Option 2: Build multi-arch images (ARM64 + x86_64)
- **Build Process**: Update Docker build commands to target ARM64:
  ```bash
  # Build for ARM64
  docker build --platform linux/arm64 -f docker/api/Dockerfile -t campmate-api:arm64 .
  
  # Or build multi-arch
  docker buildx build --platform linux/arm64,linux/amd64 -f docker/api/Dockerfile -t campmate-api:latest .
  ```
- **Base Images**: Ensure base images (e.g., `node:20-alpine`) support ARM64
- **Native Dependencies**: Some native Node.js modules may need ARM64-compatible builds

### Verification
After applying this change:
- `terraform plan` should show updates to both task definitions
- `terraform apply` will create new task definition revisions with ARM64
- ECS services will automatically use new task definitions on next deployment
- Check AWS Console → ECS → Task Definitions → Runtime platform to verify ARM64

### Terraform Commands
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
```

### Cost Impact
- **x86_64 Fargate Spot**: ~$0.012 per vCPU-hour, ~$0.0012 per GB-hour
- **ARM64 Fargate Spot**: ~$0.0096 per vCPU-hour, ~$0.00096 per GB-hour (20% discount)
- **Example**: For 2 services (256 CPU, 512 MB each) running 24/7:
  - x86_64 Fargate Spot: ~$17/month
  - ARM64 Fargate Spot: ~$14/month
  - **Additional Savings: ~$3/month (~18%)**
  - **Total Savings vs Regular Fargate x86_64: ~$44/month (~76%)**

### Next Steps
1. **Update Docker Builds**: Ensure Docker images are built for ARM64
2. **Test Locally**: Test ARM64 images locally using Docker buildx or QEMU emulation
3. **Update CI/CD**: Update GitHub Actions or CI/CD pipelines to build ARM64 images
4. **Deploy**: Apply Terraform changes and rebuild/redeploy Docker images

### Notes
- **Compatibility**: Most Node.js applications work on ARM64 without code changes
- **Native Modules**: Some native Node.js modules may need to be rebuilt for ARM64
- **Testing**: Test thoroughly before deploying to production
- **Rollback**: Can revert to x86_64 by removing `runtime_platform` block if needed

## Fix: CI/CD - Build ARM64 Docker Images in GitHub Actions

### Goal
Update GitHub Actions workflow to build ARM64 Docker images that match the ARM64 ECS task definitions, enabling cost optimization with ARM64 Fargate Spot.

### Changes Made
Updated the deployment workflow to set up QEMU and Docker Buildx, and modified build commands to target ARM64 architecture.

### Files Modified
- **`.github/workflows/deploy.yml`**:
  - Added QEMU setup step for ARM64 emulation
  - Added Docker Buildx setup step for multi-platform builds
  - Updated frontend and API build commands to use `docker buildx build --platform linux/arm64`

### Code Changes

**Before:**
```yaml
- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2

- name: Build and Push Frontend
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker build -t $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:$IMAGE_TAG -f docker/frontend/Dockerfile .
    docker push $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:$IMAGE_TAG
```

**After:**
```yaml
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2

- name: Build and Push Frontend
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker buildx build --platform linux/arm64 -t $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:$IMAGE_TAG -f docker/frontend/Dockerfile --push .
```

### Technical Details
- **QEMU Setup**: `docker/setup-qemu-action@v3` enables ARM64 emulation on x86_64 GitHub Actions runners
- **Docker Buildx**: `docker/setup-buildx-action@v3` provides advanced build features including multi-platform support
- **Platform Flag**: `--platform linux/arm64` ensures images are built specifically for ARM64 architecture
- **Build and Push**: Using `docker buildx build --push` combines build and push in a single command for efficiency
- **Immutable Versioning**: Still using `IMAGE_TAG: ${{ github.sha }}` for versioning

### Benefits
- **ARM64 Compatibility**: Docker images are now built for ARM64 to match ECS task definitions
- **Cost Optimization**: ARM64 images work with ARM64 Fargate Spot for maximum cost savings
- **Build Efficiency**: `docker buildx build --push` is more efficient than separate build and push steps
- **Automation**: CI/CD automatically builds ARM64 images on every deployment

### Verification
After this change:
- GitHub Actions workflow will build ARM64 images on push to main branch
- Images will be pushed to ECR with ARM64 architecture
- ECS services will use ARM64 images matching the task definition runtime platform
- Check ECR console → Images → Architecture to verify ARM64

### Workflow Steps
1. **Checkout Code**: Gets the latest code
2. **Configure AWS Credentials**: Sets up AWS authentication
3. **Set up QEMU**: Enables ARM64 emulation
4. **Set up Docker Buildx**: Enables multi-platform builds
5. **Login to ECR**: Authenticates with Amazon ECR
6. **Build and Push**: Builds ARM64 images and pushes to ECR
7. **Update ECS Services**: Forces new deployment with updated images

### Notes
- **Build Time**: ARM64 emulation may slightly increase build time compared to native x86_64 builds
- **Base Images**: Ensure base images (e.g., `node:20-alpine`) support ARM64 (most official images do)
- **Native Dependencies**: Some native Node.js modules may need ARM64-compatible builds
- **Testing**: Test the workflow on a branch before merging to main

## Fix: CI/CD - Dual Tagging for ECS Image Discovery

### Goal
Update GitHub Actions workflow to tag and push images with both `github.sha` (immutable versioning) and `latest` (for ECS service discovery), ensuring ECS services can always find the most recent image.

### Changes Made
Updated both frontend and API build commands to tag images with two tags: the commit SHA and `latest`, then push both tags to ECR.

### Files Modified
- **`.github/workflows/deploy.yml`**:
  - Updated frontend build to tag with both `$IMAGE_TAG` (github.sha) and `latest`
  - Updated API build to tag with both `$IMAGE_TAG` (github.sha) and `latest`

### Code Changes

**Before:**
```yaml
- name: Build and Push Frontend
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker buildx build --platform linux/arm64 -t $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:$IMAGE_TAG -f docker/frontend/Dockerfile --push .
```

**After:**
```yaml
- name: Build and Push Frontend
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker buildx build --platform linux/arm64 \
      -t $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:$IMAGE_TAG \
      -t $ECR_REGISTRY/${{ env.ECR_FRONTEND_REPO }}:latest \
      -f docker/frontend/Dockerfile --push .
```

### Technical Details
- **Multiple Tags**: Using multiple `-t` flags in `docker buildx build` to tag the same image with different tags
- **Single Build**: The same image is built once and tagged with both `github.sha` and `latest`
- **Single Push**: The `--push` flag pushes all tags to ECR in one operation
- **Tag Format**:
  - Immutable: `$ECR_REGISTRY/$REPO:${{ github.sha }}` (e.g., `149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:abc123def456`)
  - Latest: `$ECR_REGISTRY/$REPO:latest` (e.g., `149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:latest`)

### Benefits
- **ECS Service Discovery**: ECS services can always find the most recent image using the `latest` tag
- **Immutable Versioning**: Still maintains `github.sha` tag for precise version tracking and rollback
- **Dual Tagging**: Single build operation creates both tags, no additional build time
- **Flexibility**: Can reference images by commit SHA for deployments or `latest` for convenience
- **Rollback Support**: Can easily rollback to a specific commit SHA if needed

### Use Cases
- **ECS Task Definitions**: Can use `latest` tag for automatic updates or specific SHA for pinned versions
- **Manual Deployments**: Can reference `latest` for quick deployments or SHA for reproducible deployments
- **Rollback**: Can rollback to a specific commit SHA by updating the task definition image tag
- **Debugging**: Can identify which commit SHA an image was built from

### Verification
After this change:
- GitHub Actions workflow will build and tag images with both `github.sha` and `latest`
- Both tags will be pushed to ECR
- Check ECR console → Images → Tags to verify both tags exist
- ECS services can reference either tag in task definitions

### Notes
- **Tag Overwrite**: The `latest` tag will be overwritten on each deployment (this is expected behavior)
- **Immutable SHA Tags**: The `github.sha` tags are immutable and will accumulate in ECR (ECR lifecycle policy will clean up old images)
- **ECS Task Definitions**: Can be configured to use either `latest` or a specific SHA tag
- **Best Practice**: For production, consider using SHA tags for reproducibility, but `latest` is useful for dev environments

## Stage 2A: AWS Networking Infrastructure (Terraform)

### Goal
Create base network infrastructure for Campmate on AWS (ap-southeast-2) using Terraform. This provides the foundation for future ECS deployment with best practices and clean module structure.

### Files Created

#### Network Module (`infra/modules/network/`)
- `main.tf` - Core networking resources:
  - VPC (CIDR: 10.10.0.0/16) with DNS support enabled
  - Internet Gateway
  - 2 public subnets across 2 availability zones
  - 2 private subnets across 2 availability zones
  - Public route table with route to Internet Gateway
  - Route table associations for public subnets
- `variables.tf` - Module inputs:
  - `vpc_cidr` - VPC CIDR block
  - `project` - Project name for naming
  - `env` - Environment name
  - `tags` - Common tags map
- `outputs.tf` - Module outputs:
  - `vpc_id` - VPC ID
  - `public_subnet_ids` - List of public subnet IDs
  - `private_subnet_ids` - List of private subnet IDs
  - `public_route_table_id` - Public route table ID
  - `internet_gateway_id` - Internet Gateway ID

#### Dev Environment (`infra/envs/dev/`)
- `main.tf` - Environment configuration:
  - AWS provider configuration (ap-southeast-2)
  - Network module instantiation
  - Data source for availability zones
- `variables.tf` - Environment variables:
  - `region` - AWS region (default: ap-southeast-2)
  - `project` - Project name (default: campmate)
  - `env` - Environment name (default: dev)
- `outputs.tf` - Environment outputs (passes through module outputs)
- `backend.tf` - S3 backend configuration (already existed)

### Infrastructure Resources Created

1. **VPC** (`campmate-dev-vpc`)
   - CIDR: 10.10.0.0/16
   - DNS hostnames: enabled
   - DNS support: enabled

2. **Internet Gateway** (`campmate-dev-igw`)
   - Attached to VPC
   - Provides internet access for public subnets

3. **Public Subnets** (2 subnets)
   - `campmate-dev-public-subnet-1` - AZ 1
   - `campmate-dev-public-subnet-2` - AZ 2
   - CIDR blocks: 10.10.0.0/24, 10.10.1.0/24
   - Auto-assign public IP: enabled

4. **Private Subnets** (2 subnets)
   - `campmate-dev-private-subnet-1` - AZ 1
   - `campmate-dev-private-subnet-2` - AZ 2
   - CIDR blocks: 10.10.2.0/24, 10.10.3.0/24
   - No internet access (isolated, NAT Gateway to be added in next stage)

5. **Public Route Table** (`campmate-dev-public-rt`)
   - Route: 0.0.0.0/0 → Internet Gateway
   - Associated with both public subnets

### Tagging Strategy
All resources tagged with:
- `Project = "campmate"`
- `Env = "dev"`
- `Name = "campmate-dev-<resource-type>"`

### Commands

#### Initial Setup
```bash
cd infra/envs/dev
terraform init
```
**Note:** This should already be done, but run it if starting fresh or after module changes.

#### Validation
```bash
terraform fmt -recursive
terraform validate
```

#### Planning
```bash
terraform plan
```
**Expected Output:** Should show creation of:
- 1 VPC resource
- 1 Internet Gateway resource
- 2 public subnet resources
- 2 private subnet resources
- 1 public route table resource
- 2 route table association resources
- Total: ~7 resources to be created

#### Apply
```bash
terraform apply
```
**Expected Output:** Creates all networking resources. Review the plan and type `yes` to confirm.

### Acceptance Checks

#### 1. Terraform Validation
```bash
cd infra/envs/dev
terraform fmt -recursive
terraform validate
```
**Expected:** Both commands should succeed with no errors.

#### 2. Terraform Plan
```bash
cd infra/envs/dev
terraform plan
```
**Expected:** Plan should show only VPC/subnets/IGW/route table changes (no NAT Gateway, no ECS resources).

**Sample Output:**
```
Plan: 7 to add, 0 to change, 0 to destroy.

  # module.network.aws_internet_gateway.main will be created
  # module.network.aws_route_table.public will be created
  # module.network.aws_route_table_association.public[0] will be created
  # module.network.aws_route_table_association.public[1] will be created
  # module.network.aws_subnet.private[0] will be created
  # module.network.aws_subnet.private[1] will be created
  # module.network.aws_subnet.public[0] will be created
  # module.network.aws_subnet.public[1] will be created
  # module.network.aws_vpc.main will be created
```

#### 3. Terraform Apply
```bash
cd infra/envs/dev
terraform apply
```
**Expected:** Resources created successfully. Review the plan and confirm with `yes`.

#### 4. AWS Console Verification
After `terraform apply` completes, verify in AWS Console (ap-southeast-2):

1. **VPC Dashboard**:
   - Navigate to: VPC → Your VPCs
   - Verify: `campmate-dev-vpc` exists with CIDR `10.10.0.0/16`
   - Verify: DNS hostnames and DNS resolution are enabled

2. **Subnets**:
   - Navigate to: VPC → Subnets
   - Verify: 4 subnets exist:
     - `campmate-dev-public-subnet-1` (10.10.0.0/24) - Public
     - `campmate-dev-public-subnet-2` (10.10.1.0/24) - Public
     - `campmate-dev-private-subnet-1` (10.10.2.0/24) - Private
     - `campmate-dev-private-subnet-2` (10.10.3.0/24) - Private
   - Verify: Public subnets are in different AZs
   - Verify: Private subnets are in different AZs

3. **Internet Gateway**:
   - Navigate to: VPC → Internet Gateways
   - Verify: `campmate-dev-igw` exists and is attached to `campmate-dev-vpc`

4. **Route Tables**:
   - Navigate to: VPC → Route Tables
   - Verify: `campmate-dev-public-rt` exists
   - Click on route table → Routes tab
   - Verify: Route `0.0.0.0/0` → Internet Gateway exists
   - Click on Subnet associations tab
   - Verify: Both public subnets are associated

5. **Tags**:
   - Verify all resources have tags:
     - `Project = campmate`
     - `Env = dev`
     - `Name = campmate-dev-<resource-type>`

#### 5. Terraform Outputs
```bash
cd infra/envs/dev
terraform output
```
**Expected:** Should show:
- `vpc_id` - VPC ID (e.g., `vpc-xxxxxxxxx`)
- `public_subnet_ids` - List of 2 public subnet IDs
- `private_subnet_ids` - List of 2 private subnet IDs
- `public_route_table_id` - Public route table ID
- `internet_gateway_id` - Internet Gateway ID

### Technical Details

- **Availability Zones**: Dynamically selected using `data.aws_availability_zones` (first 2 available AZs)
- **CIDR Allocation**:
  - Public subnets: 10.10.0.0/24, 10.10.1.0/24
  - Private subnets: 10.10.2.0/24, 10.10.3.0/24
- **Module Structure**: Reusable module in `infra/modules/network` for multi-environment support
- **Backend**: S3 backend configured in `backend.tf` (state stored in `campmate-chohan-tfstate`)

### Next Steps (Not Implemented)
- NAT Gateway for private subnet internet access (Stage 2B)
- Security Groups for ECS tasks
- Application Load Balancer
- ECS Cluster and Service definitions

### Notes
- Private subnets are currently isolated (no internet access)
- No NAT Gateway created yet (will be added in next stage)
- Module is reusable for staging/prod environments
- All resources follow AWS best practices for naming and tagging

## Stage E: Merge Explore + Footprints into Unified Experience

### Goal
Create one unified Footprints experience that adapts based on authentication state:
- Not logged in → Demo mode (explore demo footprints)
- Logged in → Authenticated mode (manage real footprints)

### Files Modified
- `frontend/src/pages/Footprints.tsx` - Unified demo and authenticated modes
  - Added demo footprint loading when not authenticated
  - Added demo mode banner
  - Conditionally show/hide CRUD actions based on auth state
  - Same UI layout for both modes, only actions differ
- `frontend/src/App.tsx` - Routing changes
  - Default route (`/`) now points to Footprints
  - `/footprints` also points to Footprints
  - Explore moved to `/legacy/explore` (not linked)
- `frontend/src/components/NavBar.tsx` - Navigation changes
  - Removed "Explore" link from navbar
  - Kept "Footprints" as main tab
  - Planning and Recipes links unchanged

### Routes
- `/` → Footprints (default)
- `/footprints` → Footprints
- `/plan` → Plan (unchanged)
- `/recipes` → Recipes (unchanged)
- `/legacy/explore` → Explore (legacy, not linked)

### Behavior

#### Demo Mode (Not Logged In)
- Loads demo footprints from `demoFootprints.ts`
- Shows banner: "You're exploring demo footprints. Sign in to save your own camping memories."
- Header: "Camping Footprints (Demo)"
- Actions enabled: Map browsing, marker selection, view details
- Actions disabled: Add, Edit, Delete
- Sign-in CTAs: Banner button, header button, footprint card buttons

#### Authenticated Mode (Logged In)
- Loads real footprints from API (`GET /footprints`)
- No demo banner
- Header: "My Camping Footprints"
- Actions enabled: Full CRUD (Add, Edit, Delete)
- Standard authenticated experience

### Migration
- Explore functionality merged into Footprints as demo mode
- No features deleted, only reorganized
- Old Explore page preserved at `/legacy/explore` for backward compatibility

## Fix: TypeScript Build Error (NodeJS Namespace)

### Issue
- Docker build failing with: `error TS2503: Cannot find namespace 'NodeJS'`
- Occurred in `FootprintForm.tsx` at line 50 when using `NodeJS.Timeout` type

### Fix
- Changed `NodeJS.Timeout` to `ReturnType<typeof setTimeout>` 
- Browser-compatible type that works in both Node.js and browser environments
- No functional changes, only type definition update

### Files Modified
- `frontend/src/components/FootprintForm.tsx` - Fixed timeout ref type

## Stage D: Free Campsite Search (Nominatim) + Map-First UX

### Files Created
- `api/src/routes/geocode.ts` - Geocoding proxy route using OpenStreetMap Nominatim

### Files Modified
- `api/src/index.ts` - Added `/geocode` route (public, no auth required)
- `frontend/src/api/client.ts` - Added `geocode()` function and `GeocodeResult` interface
- `frontend/src/components/FootprintForm.tsx` - Complete rewrite with search-first UX

### Commands
- `npm run dev` - Start API (unchanged, no new env vars required)
- `npm run dev` - Start frontend (unchanged)

### Environment Variables Required
- None (Nominatim is free, no API key needed)

### API Endpoints

#### GET /geocode?q=<search text>
**Query Parameters:**
- `q` (required): Search query string (e.g., "Royal National Park")

**Response (200):**
```json
[
  {
    "name": "Euroka Campground, Blue Mountains, NSW, Australia",
    "lat": -33.7167,
    "lon": 150.5833
  }
]
```

**Error Responses:**
- `400`: Invalid query parameter (missing `q`)
- `502`: Geocoding service unavailable (Nominatim error)

**Headers:**
- User-Agent: `Campmate/0.1 (contact: dev@campmate.app)` (required by Nominatim)

### Features Implemented
- **Geocoding Proxy**:
  - Proxies requests to Nominatim OpenStreetMap API
  - Limits results to 5
  - Returns simplified format (name, lat, lon)
  - Proper error handling and logging

- **Frontend Search UX**:
  - Search input with placeholder: "Search campsite or place (e.g. Royal National Park)"
  - Debounced search (300ms delay)
  - Dropdown suggestions with location name and coordinates
  - Loading indicator during search
  - Auto-fills lat/lon when location selected

- **Map Preview**:
  - Interactive map (250px height) in form
  - Auto-centers and shows marker when location selected
  - Click map to fine-tune location
  - Helper text: "Tip: Click the map to fine-tune location"
  - Map flies to location on selection (zoom 13)

- **Form Improvements**:
  - Removed manual lat/lon input fields
  - Coordinates stored internally (never shown to user)
  - Validation ensures location is selected before submission
  - Error message: "Location is required. Please search for a campsite or place."

### Technical Details
- **Geocoding Service**: OpenStreetMap Nominatim (free, no API key)
- **Rate Limiting**: Nominatim usage policy (1 request per second recommended)
- **Backend Logging**: All geocode requests logged with query and result count
- **Frontend Debouncing**: 300ms delay prevents excessive API calls
- **Error Handling**: Graceful fallback with user-friendly messages

### UX Flow
1. User types place name in search input
2. After 300ms, dropdown shows up to 5 suggestions
3. User selects a location → map auto-centers and shows marker
4. User can click map to fine-tune location
5. Coordinates stored internally, form validates location is set
6. Submit creates/updates footprint with selected location

### Tradeoffs
- **Free Service**: Using Nominatim instead of paid services (Mapbox, Google Maps)
- **No Autocomplete Billing**: Simple search with dropdown, no autocomplete API costs
- **MVP-Friendly**: Easy to replace with Mapbox later if needed
- **Human-First UX**: Users never see coordinates, only place names

## Stage 4 Changes

### Files Created
- `api/src/models/Trip.ts` - Trip Mongoose model with location, dates, group size, experience, activities
- `api/src/routes/trips.ts` - Trip CRUD routes with Zod validation and JWT auth
- `api/src/routes/weather.ts` - Weather route integrating OpenWeather One Call API 3.0

### Files Modified
- `api/src/config/env.ts` - Added OPENWEATHER_API_KEY (required, fail-fast)
- `api/src/index.ts` - Mounted `/trips` and `/weather` routes with authMiddleware
- `docs/openapi/api.yaml` - Added GET /trips, DELETE /trips/{id}, securitySchemes (bearerAuth)
- `frontend/src/api/client.ts` - Added createTrip, listTrips, deleteTrip, getWeather functions
- `frontend/src/pages/Dashboard.tsx` - Complete trip management UI with form, table, weather preview

### Commands
- `npm run dev` - Start API (requires MONGO_URI, JWT_SECRET, OPENWEATHER_API_KEY)
- `npm run dev` - Start frontend (unchanged)

### Environment Variables Required
- `OPENWEATHER_API_KEY` - OpenWeather API key (required, fail-fast if missing)

### API Endpoints

#### POST /trips
**Request:**
```json
{
  "location": { "lat": 37.8651, "lon": -119.5383, "name": "Yosemite" },
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-05T00:00:00Z",
  "groupSize": 4,
  "experience": "intermediate",
  "activities": ["hiking", "camping"]
}
```

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

#### GET /trips
**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "location": { "lat": 37.8651, "lon": -119.5383, "name": "Yosemite" },
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-05T00:00:00Z",
    "groupSize": 4,
    "experience": "intermediate",
    "activities": ["hiking", "camping"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### GET /trips/:id
**Response (200):** Single trip object (same structure as above)

#### DELETE /trips/:id
**Response (204):** No content

#### GET /weather?lat=37.8651&lon=-119.5383&from=2024-06-01T00:00:00Z&to=2024-06-05T00:00:00Z
**Response (200):**
```json
{
  "daily": [...],
  "alerts": [...]
}
```

### Features Implemented
- **Trip CRUD:**
  - Create: POST /trips with full trip data
  - Read: GET /trips (list all for user), GET /trips/:id (single trip)
  - Delete: DELETE /trips/:id (with ownership check)
  - All routes protected with JWT authentication
  - Zod validation for all inputs

- **Weather Integration:**
  - GET /weather with lat, lon, from, to query parameters
  - Calls OpenWeather One Call API 3.0
  - Returns normalized JSON with daily forecast and alerts
  - Error handling: 400 (bad params), 502 (API error)

- **Frontend UI:**
  - Create trip form with all fields
  - Trips table showing location, dates, group size, experience
  - Weather button to fetch and preview weather data
  - Delete button with confirmation
  - Responsive Tailwind CSS styling

## Stage 3 Changes

### Files Created
- `frontend/.env.local` - Environment variable: `VITE_API_BASE=http://localhost:8080`
- `frontend/src/api/client.ts` - API client with `login()`, `register()`, and `me()` functions
- `frontend/src/auth/AuthContext.tsx` - React context provider for authentication state
- `frontend/src/auth/ProtectedRoute.tsx` - Component to protect routes requiring authentication
- `frontend/src/pages/Login.tsx` - Login page with email/password form
- `frontend/src/pages/Register.tsx` - Registration page with email/password form
- `frontend/src/pages/Dashboard.tsx` - Dashboard showing user email and logout button

### Files Modified
- `frontend/package.json` - Added `react-router-dom@^6.21.1` dependency
- `frontend/src/App.tsx` - Replaced static content with React Router setup and AuthProvider
- `api/src/index.ts` - Updated CORS to allow `http://localhost:5173` origin

### Commands
- `npm run dev` - Start frontend dev server (Vite on port 5173)
- `npm run build` - Build frontend for production (unchanged)
- `npm run typecheck` - Type check frontend (unchanged)

### Environment Variables
- `VITE_API_BASE` - API base URL (default: http://localhost:8080)

### Features Implemented
- **Authentication Flow:**
  1. User registers → token stored in localStorage
  2. User logs in → token stored in localStorage
  3. On app mount → if token exists, fetch user info
  4. Protected routes → redirect to /login if no token
  5. Logout → clear token and redirect to /login

- **UI Components:**
  - Centered card layout with Tailwind CSS
  - Form inputs with focus rings
  - Loading states during API calls
  - Inline error messages for API failures
  - Navigation links between login/register

### Testing
1. Start API: `cd api && npm run dev` (requires MongoDB)
2. Start Frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:5173
4. Register a new user or login
5. Access dashboard (protected route)
6. Test logout functionality

## Stage 2 Changes

### Files Created
- `api/src/config/env.ts` - Environment variable configuration with validation
- `api/src/config/db.ts` - MongoDB connection with retry/backoff
- `api/src/models/User.ts` - User Mongoose schema and model
- `api/src/routes/auth.ts` - Registration and login routes with Zod validation
- `api/src/middleware/auth.ts` - JWT authentication middleware
- `api/src/routes/me.ts` - Protected route to get current user
- `docs/ADRs/0003-auth-jwt-vs-session.md` - Authentication decision record
- `.env.example` - Environment variable template

### Files Modified
- `api/package.json` - Added dependencies (mongoose, zod, bcryptjs, jsonwebtoken, cors, helmet, morgan, dotenv) and devDependencies (@types/bcryptjs, @types/jsonwebtoken, @types/morgan)
- `api/src/index.ts` - Integrated MongoDB connection, security middleware, and auth routes
- `docker/docker-compose.yml` - Added MongoDB service (mongo:6) with named volume
- `docs/API.md` - Added request/response examples for auth endpoints
- `docs/CHANGELOG.md` - Added Stage 2 entry

### Commands
- `npm run dev` - Start API with MongoDB connection (requires MONGO_URI and JWT_SECRET)
- `npm run build` - Build TypeScript (unchanged)
- `npm run start` - Start production server (unchanged)

### Environment Variables Required
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Secret for JWT signing (required)
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (default: development)

### Docker Compose
- MongoDB service added: `mongo:6` on port 27017
- Named volume: `mongo_data` for data persistence
- API service updated with MongoDB connection string and JWT secret

### Manual Testing
See curl examples in `api/src/routes/auth.ts` comments for testing register, login, and /me endpoints.

## Stage 1 Changes

### Files Created
- `docs/API.md` - API endpoint documentation table
- `docs/openapi/api.yaml` - OpenAPI 3.0.3 specification for API service
- `docs/openapi/rag.yaml` - OpenAPI 3.0.3 specification for RAG service
- `frontend/src/types/example-usage.ts` - Type compilation verification

### Files Modified
- `frontend/package.json` - Added `openapi-typescript` devDependency and type generation scripts
- `.github/workflows/ci.yml` - Added type generation and validation steps

### Commands Added (Frontend)
- `npm run gen:types:api` - Generate TypeScript types from API OpenAPI spec
- `npm run gen:types:rag` - Generate TypeScript types from RAG OpenAPI spec
- `npm run gen:types` - Generate all types

### CI Changes
- Frontend job now includes:
  1. Install dependencies
  2. Generate types (`npm run gen:types`)
  3. Type check (`tsc --noEmit`)
  4. Build

## Stage 0 Files

## Generated Files

### Frontend (`frontend/`)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tsconfig.node.json` - Node-specific TypeScript config
- `vite.config.ts` - Vite configuration
- `index.html` - HTML entry point
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main App component
- `src/index.css` - Global styles with Tailwind

### API (`api/`)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Express server entry point
- `src/routes/health.ts` - Health check route
- `.eslintrc.cjs` - ESLint configuration

### RAG (`rag/`)
- `pyproject.toml` - Python project configuration
- `requirements.txt` - Python dependencies
- `app.py` - FastAPI application
- `__init__.py` - Python package marker

### Docker (`docker/`)
- `frontend/Dockerfile` - Frontend container definition
- `api/Dockerfile` - API container definition
- `rag/Dockerfile` - RAG container definition
- `docker-compose.yml` - Multi-service orchestration

### Documentation (`docs/`)
- `CHANGELOG.md` - Version history
- `BUILD_LOG.md` - This file
- `RUNBOOK.md` - Operations guide
- `ADRs/0001-monorepo.md` - Architecture decision record

### CI (`.github/workflows/`)
- `ci.yml` - Continuous integration workflow

## Commands Generated

### Frontend
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

### API
- `npm run dev` - Start development server with hot reload (port 8080)
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting
- `npm test` - Placeholder test command

### RAG
- `uvicorn app:app --host 0.0.0.0 --port 8000` - Start FastAPI server

