# Stage 2C (Dev): ECS/Fargate services wired to existing ALB target groups
# - Runs tasks in public subnets with public IPs (NO NAT)
# - Uses existing ALB + target groups from Stage 2B module outputs
# - Pulls sensitive config via Secrets Manager/SSM ARNs (no plaintext in TF state)

locals {
  api_image      = "149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-api:latest"
  frontend_image = "149536499524.dkr.ecr.ap-southeast-2.amazonaws.com/campmate-frontend:latest"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.env}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = module.iam.task_execution_role_arn
  task_role_arn      = module.iam.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = local.api_image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "8080" },
        { name = "FRONTEND_URL", value = "http://${module.alb.alb_dns_name}" },
        { name = "ALLOWED_ORIGINS", value = "http://${module.alb.alb_dns_name}" }
      ]

      # Secrets must use full ARNs (not just names or parameter names)
      # For Secrets Manager: arn:aws:secretsmanager:region:account-id:secret:secret-name-random-string
      #   Example: arn:aws:secretsmanager:ap-southeast-2:149536499524:secret:campmate/dev/api/MONGO_URI-CXSPFf
      # For SSM Parameter Store: arn:aws:ssm:region:account-id:parameter/parameter-name
      #   Example: arn:aws:ssm:ap-southeast-2:149536499524:parameter/campmate/dev/api/MONGO_URI
      # IMPORTANT: The ARN must be complete and valid. ECS will fail with ClientException if the ARN format is incorrect.
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

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${var.project}-${var.env}-api"
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project}-${var.env}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = module.iam.task_execution_role_arn
  task_role_arn      = module.iam.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = local.frontend_image
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${var.project}-${var.env}-frontend"
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "api" {
  name            = "${var.project}-${var.env}-api"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets          = module.network.public_subnet_ids
    security_groups  = [module.alb.ecs_sg_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = module.alb.tg_api_arn
    container_name   = "api"
    container_port   = 8080
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [module.alb]

  tags = local.common_tags
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.project}-${var.env}-frontend"
  cluster         = module.ecs_cluster.cluster_id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets          = module.network.public_subnet_ids
    security_groups  = [module.alb.ecs_sg_id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = module.alb.tg_frontend_arn
    container_name   = "frontend"
    container_port   = 3000
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [module.alb]

  tags = local.common_tags
}

