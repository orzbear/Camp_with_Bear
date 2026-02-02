# ECS Cluster Module
# Creates ECS cluster and CloudWatch log groups

resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    var.tags,
    {
      Name = var.cluster_name
    }
  )
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "services" {
  for_each = var.log_groups

  name              = each.value
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = each.value
    }
  )
}
