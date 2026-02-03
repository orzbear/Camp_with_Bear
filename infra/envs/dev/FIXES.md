# Fixes for Terraform Apply Errors

## Issue 1: ALB Listener Error

**Error**: `ListenerNotFound: Listener '...' not found`

**Cause**: The old `aws_lb_listener.main` was destroyed, but Terraform is trying to update `aws_lb_listener.http` which references the same port.

**Fix Applied**:
- Added `lifecycle { create_before_destroy = true }` to the HTTP listener
- The listener will be recreated fresh

**Next Steps**:
1. Run `terraform apply -replace=module.alb.aws_lb_listener.http` to force recreation
2. Or run `terraform apply` normally - the lifecycle block should handle it

## Issue 2: ECS Secrets Error

**Error**: `ClientException: The Systems Manager parameter name specified for secret MONGO_URI is invalid`

**Cause**: ECS is trying to interpret the Secrets Manager ARN as an SSM parameter name. This usually means:
- The secret doesn't exist in AWS Secrets Manager
- The ARN format is incorrect
- There's a typo in the ARN

**Verification Steps**:
1. Check if secrets exist in AWS:
   ```powershell
   aws secretsmanager list-secrets --region ap-southeast-2 --query "SecretList[?contains(Name, 'MONGO_URI')].ARN" --output text
   ```

2. Verify the ARN format matches exactly:
   - Should be: `arn:aws:secretsmanager:ap-southeast-2:149536499524:secret:campmate/dev/api/MONGO_URI-CXSPFf`
   - The random suffix (`-CXSPFf`) is required

3. Check execution role permissions:
   ```powershell
   aws iam get-role-policy --role-name campmate-dev-ecs-task-execution-role --policy-name AmazonECSTaskExecutionRolePolicy
   ```

**Fix Options**:
1. **If secrets don't exist**: Create them in AWS Secrets Manager first
2. **If ARN is wrong**: Update `dev.secrets.tfvars` with correct ARNs
3. **If permissions are missing**: The execution role should have `AmazonECSTaskExecutionRolePolicy` attached (already configured)

**To Create Secrets** (if they don't exist):
```powershell
aws secretsmanager create-secret --name campmate/dev/api/MONGO_URI --secret-string "your-mongo-uri" --region ap-southeast-2
aws secretsmanager create-secret --name campmate/dev/api/JWT_SECRET --secret-string "your-jwt-secret" --region ap-southeast-2
aws secretsmanager create-secret --name campmate/dev/api/OPENWEATHER_API_KEY --secret-string "your-api-key" --region ap-southeast-2
```

Then update `dev.secrets.tfvars` with the ARNs returned from the create commands.
