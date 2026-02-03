# ALB Module - Application Load Balancer
# Creates ALB with security groups, target groups, and listener rules

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.env}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere (redirects to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-alb-sg"
    }
  )
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs" {
  name        = "${var.project}-${var.env}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB (frontend)"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTP from ALB (api)"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-ecs-sg"
    }
  )
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project}-${var.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false
  enable_http2              = true
  idle_timeout              = 60

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-alb"
    }
  )
}

# Target Group for Frontend
resource "aws_lb_target_group" "frontend" {
  name_prefix = "fe-"
  port         = 3000
  protocol     = "HTTP"
  vpc_id       = var.vpc_id
  target_type  = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  deregistration_delay = 30

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-tg-frontend"
    }
  )
}

# Target Group for API
# Note: Health check path is /health (not /api/health) because the API application
# serves health endpoint at /health directly. The ALB listener rule routes /api/* 
# to this target group, but health checks bypass the ALB and hit the container directly.
resource "aws_lb_target_group" "api" {
  name        = "${var.project}-${var.env}-tg-api"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"  # Direct container path, not /api/health
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.env}-tg-api"
    }
  )
}

# ALB Listener for HTTP (Port 80) - Redirects to HTTPS
# Note: This replaces the old aws_lb_listener.main resource
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener for HTTPS (Port 443) - Forwards to frontend by default
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# Listener Rule: /api/* -> API target group (on HTTPS listener)
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}