# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = module.network.public_route_table_id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.network.internet_gateway_id
}

# ECR Outputs
output "ecr_repo_urls" {
  description = "Map of ECR repository URLs"
  value       = module.ecr.repository_urls
}

# ECS Cluster Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs_cluster.cluster_name
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = module.alb.alb_sg_id
}

output "ecs_sg_id" {
  description = "ID of the ECS security group"
  value       = module.alb.ecs_sg_id
}

output "tg_frontend_arn" {
  description = "ARN of the frontend target group"
  value       = module.alb.tg_frontend_arn
}

output "tg_api_arn" {
  description = "ARN of the API target group"
  value       = module.alb.tg_api_arn
}

# ECS Service Outputs
output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "task_def_arns" {
  description = "Task definition ARNs for API and frontend"
  value = {
    api      = aws_ecs_task_definition.api.arn
    frontend = aws_ecs_task_definition.frontend.arn
  }
}
