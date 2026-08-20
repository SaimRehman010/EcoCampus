output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = aws_vpc.ecocampus_vpc.id
}

output "eks_cluster_name" {
  description = "EKS Cluster Name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS Cluster API Server Endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "ecr_backend_url" {
  description = "ECR Repository URL for Backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR Repository URL for Frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_python_service_url" {
  description = "ECR Repository URL for Python Resource Analyzer"
  value       = aws_ecr_repository.python_service.repository_url
}

output "ecr_ai_service_url" {
  description = "ECR Repository URL for AI Microservice"
  value       = aws_ecr_repository.ai_service.repository_url
}
