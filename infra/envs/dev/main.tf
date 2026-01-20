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

# Network Module
module "network" {
  source = "../../modules/network"

  vpc_cidr = "10.10.0.0/16"
  project  = var.project
  env      = var.env

  tags = {
    Project = var.project
    Env     = var.env
  }
}
