# IAM Module - ECS Task Roles
# Creates task execution role and task role for ECS

# ECS Task Execution Role
resource "aws_iam_role" "task_execution" {
  name = "${var.project}-${var.env}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-ecs-task-execution-role"
    }
  )
}

# Attach AWS managed policy
resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (empty policy for now, will attach secrets later)
resource "aws_iam_role" "task" {
  name = "${var.project}-${var.env}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-ecs-task-role"
    }
  )
}

resource "aws_iam_role_policy" "ecs_secrets_policy" {
  name = "campmate-dev-secrets-access"
  role = aws_iam_role.task_execution.id # Ensure this matches your role resource name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "secretsmanager:GetSecretValue"
        Resource = [
          "arn:aws:secretsmanager:ap-southeast-2:149536499524:secret:campmate/dev/api/MONGO_URI-CXSPFf",
          "arn:aws:secretsmanager:ap-southeast-2:149536499524:secret:campmate/dev/api/JWT_SECRET-*",
          "arn:aws:secretsmanager:ap-southeast-2:149536499524:secret:campmate/dev/api/OPENWEATHER_API_KEY-*"
        ]
      }
    ]
  })
}