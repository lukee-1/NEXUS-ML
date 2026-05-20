# AWS Deployment Guide

## Prerequisites
- AWS CLI configured
- Docker installed
- kubectl installed (for EKS)

## Step 1: Push Docker Image to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name nexusml --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t nexusml .
docker tag nexusml:latest <account>.dkr.ecr.us-east-1.amazonaws.com/nexusml:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/nexusml:latest
```

## Step 2: Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier nexusml-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username nexusml \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --region us-east-1
```

## Step 3: Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id nexusml-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --region us-east-1
```

## Step 4: Deploy to ECS

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name nexusml-cluster

# Create task definition (see task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster nexusml-cluster \
  --service-name nexusml-backend \
  --task-definition nexusml \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-id>],securityGroups=[<sg-id>],assignPublicIp=ENABLED}"
```

## Step 5: Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name nexusml-alb \
  --subnets <subnet-1> <subnet-2> \
  --security-groups <sg-id>

aws elbv2 create-target-group \
  --name nexusml-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id <vpc-id> \
  --target-type ip
```

## Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace nexusml

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Apply deployments
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n nexusml
kubectl get svc -n nexusml
```
