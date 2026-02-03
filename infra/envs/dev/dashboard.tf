resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "Campmate-Dev-Observability"

  dashboard_body = jsonencode({
    widgets = [
      # Widget 1: CPU Utilization for API and Frontend
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "campmate-dev-api", "ClusterName", "campmate-dev-cluster"],
            ["...", "campmate-dev-frontend", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "ap-southeast-2"
          title  = "Service CPU Utilization (%)"
        }
      },
      # Widget 2: Memory Utilization
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "campmate-dev-api", "ClusterName", "campmate-dev-cluster"],
            ["...", "campmate-dev-frontend", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "ap-southeast-2"
          title  = "Service Memory Utilization (%)"
        }
      },
      # Widget 3: Live API Logs
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          region = "ap-southeast-2"
          title  = "API Application Logs"
          query  = "SOURCE '/ecs/campmate-dev-api' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          view   = "table"
        }
      }
    ]
  })
}