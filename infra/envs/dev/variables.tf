variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "campmate"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "api_mongo_uri_secret_arn" {
  description = "ARN of Secrets Manager secret or SSM parameter for API MONGO_URI (no plaintext in Terraform state)."
  type        = string
  sensitive   = true
}

variable "api_jwt_secret_arn" {
  description = "ARN of Secrets Manager secret or SSM parameter for API JWT_SECRET (no plaintext in Terraform state)."
  type        = string
  sensitive   = true
}

variable "api_openweather_api_key_arn" {
  description = "ARN of Secrets Manager secret or SSM parameter for API OPENWEATHER_API_KEY (no plaintext in Terraform state)."
  type        = string
  sensitive   = true
}
