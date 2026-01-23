output "repository_urls" {
  description = "Map of repository names to their URLs"
  value = {
    for k, repo in aws_ecr_repository.repos : k => repo.repository_url
  }
}

output "repository_arns" {
  description = "Map of repository names to their ARNs"
  value = {
    for k, repo in aws_ecr_repository.repos : k => repo.arn
  }
}
