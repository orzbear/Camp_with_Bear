# 1. Get the existing Hosted Zone data
data "aws_route53_zone" "main" {
  name         = "bearmate.link"
  private_zone = false
}

# 2. Request the SSL Certificate (ACM)
resource "aws_acm_certificate" "cert" {
  domain_name       = "bearmate.link"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 3. Create the DNS Record for Validation (This proves you own the domain)
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# 4. The "Waiter" (This tells Terraform to wait until AWS confirms the cert is valid)
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# 5. Create the ALIAS Record (Points bearnate.link -> ALB)
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "bearmate.link"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name # Ensure this matches your ALB module output
    zone_id                = module.alb.alb_zone_id  # Ensure this matches your ALB module output
    evaluate_target_health = true
  }
}