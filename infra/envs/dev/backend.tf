terraform {
  backend "s3" {
    bucket         = "campmate-chohan-tfstate"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "campmate-chohan-tflock"
    encrypt        = true
  }
}
