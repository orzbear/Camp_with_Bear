output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the load balancer (to be used in a Route 53 Alias record)"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_sg_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "tg_frontend_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

output "tg_api_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "tg_frontend_id" {
  description = "ID of the frontend target group"
  value       = aws_lb_target_group.frontend.id
}

output "tg_api_id" {
  description = "ID of the API target group"
  value       = aws_lb_target_group.api.id
}
