# Dev Environment - Network Module
# Creates VPC and networking infrastructure for Campmate dev environment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Common tags
locals {
  common_tags = {
    Project = var.project
    Env     = var.env
  }
}

# Network Module
module "network" {
  source = "../../modules/network"

  vpc_cidr = "10.10.0.0/16"
  project  = var.project
  env      = var.env

  tags = local.common_tags
}

# ECR Module
module "ecr" {
  source = "../../modules/ecr"

  repositories = {
    api      = "${var.project}-api"
    frontend = "${var.project}-frontend"
    rag      = "${var.project}-rag"
  }

  tags = local.common_tags
}

# ECS Cluster Module
module "ecs_cluster" {
  source = "../../modules/ecs_cluster"

  cluster_name = "${var.project}-${var.env}-cluster"
  log_groups = {
    api      = "/ecs/${var.project}-${var.env}-api"
    frontend = "/ecs/${var.project}-${var.env}-frontend"
    rag      = "/ecs/${var.project}-${var.env}-rag"
  }
  log_retention_days = 14

  tags = local.common_tags
}

# IAM Module
module "iam" {
  source = "../../modules/iam"

  project = var.project
  env     = var.env

  tags = local.common_tags
}

# ALB Module
module "alb" {
  source = "../../modules/alb"

  project           = var.project
  env               = var.env
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids

  tags            = local.common_tags
  certificate_arn = aws_acm_certificate.cert.arn
}

